// HTTP smoke test for a running server.
// Usage: BASE_URL=http://localhost:3100 node scripts/smoke.mjs
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
let passed = 0;
let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}\n     ${e.message.split("\n")[0]}`);
  }
}

async function get(path, init) {
  const res = await fetch(BASE + path, { redirect: "manual", ...init });
  const text = await res.text();
  return { status: res.status, text, headers: res.headers };
}

await check("home page shows the shop name and featured phones", async () => {
  const r = await get("/");
  assert.equal(r.status, 200);
  assert.match(r.text, /Its4u/);
  assert.match(r.text, /Shop by type/);
  assert.match(r.text, /iPhone 15 Pro Max/);
});

await check("shop lists all 10 phones", async () => {
  const r = await get("/shop");
  assert.equal(r.status, 200);
  assert.match(r.text, /10 phones found/);
});

await check("filter: new only", async () => {
  const r = await get("/shop?type=new");
  assert.match(r.text, /3 phones found/);
});

await check("filter: used only", async () => {
  const r = await get("/shop?type=used");
  assert.match(r.text, /7 phones found/);
});

await check("filter: PTA Approved / Non-PTA / JV", async () => {
  assert.match((await get("/shop?pta=pta")).text, /7 phones found/);
  assert.match((await get("/shop?pta=non-pta")).text, /2 phones found/);
  assert.match((await get("/shop?pta=jv")).text, /1 phone found/);
});

await check("search with no results shows an empty state", async () => {
  const r = await get("/shop?q=nokia3310");
  assert.match(r.text, /No phones match these filters/);
});

await check("product page shows specs, condition and PTA status", async () => {
  const r = await get("/shop/iphone-13-128gb-excellent-non-pta");
  assert.equal(r.status, 200);
  assert.match(r.text, /iPhone 13 128GB/);
  assert.match(r.text, /Excellent/);
  assert.match(r.text, /Non-PTA/);
  assert.match(r.text, /not PTA approved/);
});

await check("unknown product returns 404", async () => {
  assert.equal((await get("/shop/does-not-exist")).status, 404);
});

await check("cart, checkout, track and policies pages load", async () => {
  for (const p of ["/cart", "/checkout", "/track", "/policies"]) {
    const r = await get(p);
    assert.equal(r.status, 200, p);
  }
});

await check("track page rejects wrong details", async () => {
  const r = await get("/track?order=ORD-ZZZZZZ&phone=03001234567");
  assert.match(r.text, /could not find an order/);
});

await check("unknown order page returns 404", async () => {
  assert.equal((await get("/order/ORD-NOPE00")).status, 404);
});

// ---- SEO and page quality ----

const count = (text, re) => (text.match(re) ?? []).length;
const jsonLd = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const metaContent = (html, attr, name) => {
  const m = html.match(new RegExp(`<meta[^>]+${attr}="${name}"[^>]+content="([^"]*)"`)) ?? html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+${attr}="${name}"`));
  return m ? m[1] : null;
};

await check("every public page has exactly one h1 and an html lang", async () => {
  for (const p of ["/", "/shop", "/shop/iphone-13-128gb-excellent-non-pta", "/cart", "/checkout", "/track", "/policies"]) {
    const r = await get(p);
    assert.equal(r.status, 200, p);
    assert.equal(count(r.text, /<h1[\s>]/g), 1, `${p} has ${count(r.text, /<h1[\s>]/g)} h1`);
    assert.match(r.text, /<html lang="en"/, p);
  }
});

await check("home page has Store and WebSite structured data and a description", async () => {
  const r = await get("/");
  const types = jsonLd(r.text).map((d) => d["@type"]);
  assert.ok(types.includes("Store") && types.includes("WebSite"), types.join(","));
  assert.ok((metaContent(r.text, "name", "description") ?? "").length > 60);
  assert.match(r.text, /<link rel="canonical" href="https?:\/\/[^"/]+\/?"/);
});

await check("fonts are self-hosted with font-display: swap (no request to Google)", async () => {
  const r = await get("/");
  assert.ok(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(r.text), "page still calls Google Fonts");
  assert.match(r.text, /<html lang="en" class="[^"]*variable/);
  // Next.js may split the CSS into several files, so read all of them
  const cssHrefs = [...r.text.matchAll(/<link rel="stylesheet" href="(\/_next\/static\/css\/[^"]+\.css)"/g)].map((m) => m[1]);
  assert.ok(cssHrefs.length > 0, "no stylesheet found");
  const css = (await Promise.all(cssHrefs.map((h) => get(h).then((x) => x.text)))).join(" ");
  // two self-hosted variable fonts: one weight range for headings (300 to 700), one for text (100 to 1000)
  const all = css.match(/@font-face\{[^}]*\}/g) ?? [];
  const faces = all.filter((f) => /src:url\(/.test(f));
  assert.equal(faces.length, 2, `expected 2 font files, found ${faces.length}`);
  for (const face of faces) {
    assert.match(face, /font-display:swap/);
    assert.match(face, /src:url\(\/_next\/static\/media\/[^)]+\.woff2\)\s*format\("woff2"\)/);
  }
  // a size-matched fallback for each font, so text does not jump when the real font arrives
  const fallbacks = all.filter((f) => /size-adjust:/.test(f));
  assert.equal(fallbacks.length, 2, "size-adjusted fallback fonts");
  assert.ok(faces.some((f) => /font-weight:300 700/.test(f)), "heading font weight range");
  assert.ok(faces.some((f) => /font-weight:100 1000/.test(f)), "body font weight range");
  assert.match(css, /--font-display|__variable_/, "font CSS variables");
  assert.ok(!/url\(https?:\/\/fonts\./.test(css), "stylesheet loads fonts from another site");
  // Next.js writes <link rel="preload" as="font"> on Linux servers. On Windows its font manifest
  // is empty (a known path-separator bug), so we only insist on it elsewhere.
  if (process.platform !== "win32") {
    assert.match(r.text, /<link rel="preload" href="\/_next\/static\/media\/[^"]+\.woff2" as="font"/);
  }
});

await check("product page has Product + Breadcrumb data, canonical and social tags", async () => {
  const r = await get("/shop/iphone-13-128gb-excellent-non-pta");
  const data = jsonLd(r.text);
  const product = data.find((d) => d["@type"] === "Product");
  assert.ok(product, "no Product JSON-LD");
  assert.equal(product.offers.priceCurrency, "PKR");
  assert.equal(product.offers.price, "118000");
  assert.match(product.offers.itemCondition, /UsedCondition/);
  assert.ok(data.some((d) => d["@type"] === "BreadcrumbList"));
  assert.match(r.text, /<link rel="canonical" href="[^"]+\/shop\/iphone-13-128gb-excellent-non-pta"/);
  assert.match(metaContent(r.text, "property", "og:title") ?? "", /iPhone 13/);
  assert.match(r.text, /<title>iPhone 13 128GB \(Excellent \(9\/10\), Non-PTA\) \| Its4u<\/title>/);
});

await check("shop pages: filtered pages get a title and canonical, searches are noindex", async () => {
  const used = await get("/shop?type=used&sort=price-asc");
  assert.match(used.text, /<title>Used phones \| Its4u<\/title>/);
  assert.match(used.text, /<link rel="canonical" href="[^"]+\/shop\?type=used"/);
  // sorting is noise, so this page points to the clean canonical and is left to the canonical to decide
  assert.ok(/<meta name="robots" content="noindex/.test(used.text), "sorted page should be noindex");
  const plain = await get("/shop?type=used");
  assert.ok(!/<meta name="robots" content="noindex/.test(plain.text), "clean filter page must stay indexable");
  const search = await get("/shop?q=iphone");
  assert.match(search.text, /<meta name="robots" content="noindex/);
});

await check("private pages are noindex", async () => {
  for (const p of ["/cart", "/checkout", "/track"]) {
    const r = await get(p);
    assert.match(r.text, /<meta name="robots" content="noindex/, p);
  }
});

await check("every image has alt text", async () => {
  for (const p of ["/", "/shop", "/shop/iphone-13-128gb-excellent-non-pta"]) {
    const r = await get(p);
    const imgs = r.text.match(/<img\b[^>]*>/g) ?? [];
    for (const img of imgs) assert.match(img, /\balt=/, `${p}: ${img.slice(0, 80)}`);
  }
});

await check("sitemap.xml lists the shop and every product", async () => {
  const r = await get("/sitemap.xml");
  assert.equal(r.status, 200);
  assert.match(r.text, /<loc>[^<]+\/shop<\/loc>/);
  assert.equal(count(r.text, /\/shop\/[a-z0-9-]+<\/loc>/g), 10);
});

await check("robots.txt hides private areas and points to the sitemap", async () => {
  const r = await get("/robots.txt");
  assert.match(r.text, /Disallow: \/admin/);
  assert.match(r.text, /Disallow: \/checkout/);
  assert.match(r.text, /Sitemap: .+\/sitemap\.xml/);
});

await check("unknown pages return a real 404 that is not indexed", async () => {
  const r = await get("/this-page-does-not-exist");
  assert.equal(r.status, 404);
  assert.match(r.text, /<meta name="robots" content="noindex/);
  assert.match(r.text, /We could not find that page/);
});

await check("security headers are set and the server does not advertise Next.js", async () => {
  const r = await get("/");
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  assert.equal(r.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.equal(r.headers.get("x-powered-by"), null);
});

// ---- footer ----

await check("every store page has one footer with Shop, Help and Contact columns", async () => {
  for (const p of ["/", "/shop", "/shop/iphone-13-128gb-excellent-non-pta", "/cart", "/checkout", "/track", "/policies"]) {
    const r = await get(p);
    assert.equal(count(r.text, /<footer[\s>]/g), 1, `${p} footer count`);
    for (const title of ["Shop", "Help", "Contact"]) assert.match(r.text, new RegExp(`<h2[^>]*>${title}</h2>`), `${p} ${title}`);
    assert.match(r.text, /<footer[\s\S]*<address[\s\S]*href="tel:/, `${p} tap-to-call`);
    assert.match(r.text, /<footer[\s\S]*href="\/track"[\s\S]*href="\/policies"|<footer[\s\S]*href="\/policies"/, `${p} help links`);
  }
});

await check("the footer's breathing lights are decorative and its content is visible without JavaScript", async () => {
  const r = await get("/");
  const footer = r.text.slice(r.text.indexOf("<footer"));
  assert.match(footer, /footer-glows[^>]*aria-hidden="true"|aria-hidden="true"[^>]*footer-glows/);
  assert.equal(count(footer, /footer-glow footer-glow-[abc]/g), 3);
  assert.ok(!/opacity:\s*0[;"]/.test(footer), "content must not be hidden in the HTML");
  assert.ok(footer.includes("Chat on WhatsApp"));
});

await check("the footer's CSS ships with the page (glows, glass card, reduced motion)", async () => {
  const home = await get("/");
  const cssHref = home.text.match(/<link rel="stylesheet" href="(\/_next\/static\/css\/[^"]+\.css)"/)?.[1];
  const css = (await get(cssHref)).text;
  for (const needle of ["footer-breathe-a", "footer-breathe-b", "footer-breathe-c", "reveal-up", ".footer-card", "prefers-reduced-motion"]) {
    assert.ok(css.includes(needle), `CSS is missing ${needle}`);
  }
});

await check("admin pages do not show the store footer", async () => {
  const r = await get("/admin/login");
  assert.ok(!/<footer[\s>]/.test(r.text));
});

// ---- admin security: nothing works without logging in ----

await check("admin pages redirect to the login page when logged out", async () => {
  for (const p of ["/admin", "/admin/products", "/admin/products/new", "/admin/orders", "/admin/settings"]) {
    const r = await get(p);
    assert.ok([302, 303, 307, 308].includes(r.status), `${p} gave ${r.status}`);
    assert.match(r.headers.get("location") ?? "", /\/admin\/login/, p);
  }
});

await check("admin login page has username and password fields with labels", async () => {
  const r = await get("/admin/login");
  assert.equal(r.status, 200);
  assert.match(r.text, /Welcome back/);
  assert.equal(count(r.text, /<h1[\s>]/g), 1);
  assert.match(r.text, /<label[^>]*for="username"[^>]*>Username<\/label>/);
  assert.match(r.text, /<label[^>]*for="password"[^>]*>Password<\/label>/);
  assert.match(r.text, /<input[^>]*id="username"[^>]*autoComplete="username"|<input[^>]*autoComplete="username"[^>]*id="username"|<input[^>]*id="username"[^>]*autocomplete="username"|<input[^>]*autocomplete="username"[^>]*id="username"/i);
  assert.match(r.text, /<input[^>]*id="password"[^>]*type="password"|<input[^>]*type="password"[^>]*id="password"/);
  assert.match(r.text, /<meta name="robots" content="noindex/);
  assert.ok(!/onpaste/i.test(r.text), "paste must stay allowed (accessible authentication)");
});

await check("image upload is refused when logged out", async () => {
  const body = new FormData();
  body.set("file", new Blob([Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])], { type: "image/jpeg" }), "a.jpg");
  const r = await get("/api/upload", { method: "POST", body });
  assert.equal(r.status, 401);
});

await check("uploads route refuses path tricks and unknown files", async () => {
  assert.equal((await get("/uploads/..%2F.env")).status, 404);
  assert.equal((await get("/uploads/nope.jpg")).status, 404);
  assert.equal((await get("/uploads/a.svg")).status, 404);
});

await check("a forged admin cookie is not accepted", async () => {
  const r = await get("/admin", { headers: { cookie: "its4u_admin=99999999999999.deadbeef" } });
  assert.ok([302, 303, 307, 308].includes(r.status));
});

await check("home page has brands, budgets, how to buy, deals and questions", async () => {
  const r = await get("/");
  assert.equal(r.status, 200);
  for (const text of ["Shop by brand", "What can you spend?", "How to buy in 4 steps", "Good to know before you order"]) {
    assert.ok(r.text.includes(text), text);
  }
  assert.equal(count(r.text, /data-testid="how-to-buy-steps"/g), 1);
  assert.ok(count(r.text, /<details/g) >= 5, "the questions open and close");
  assert.match(r.text, /"@type":"FAQPage"/);
  assert.match(r.text, /href="\/shop\?minPrice=50000&amp;maxPrice=100000"/);
});

await check("how-to-buy page explains the steps, payment, delivery and the checks on arrival", async () => {
  const r = await get("/how-to-buy");
  assert.equal(r.status, 200);
  assert.equal(count(r.text, /<h1/g), 1);
  assert.match(r.text, /<title>How to Buy \| /);
  assert.match(r.text, /rel="canonical" href="[^"]+\/how-to-buy"/);
  for (const text of ["Choose your phone", "Cash on Delivery", "Check these before you pay", "*#06#"]) {
    assert.ok(r.text.includes(text), text);
  }
  assert.match(r.text, /"@type":"HowTo"/);
  assert.match(r.text, /"@type":"FAQPage"/);
});

await check("every page links to how to buy, and the sitemap lists it", async () => {
  const home = await get("/");
  assert.ok(count(home.text, /href="\/how-to-buy"/g) >= 2, "header and footer");
  assert.match((await get("/sitemap.xml")).text, /<loc>[^<]+\/how-to-buy<\/loc>/);
});

await check("product page has a buy anchor, order steps and a mobile buy bar", async () => {
  const shop = await get("/shop");
  const slug = shop.text.match(/href="\/shop\/([a-z0-9-]+)"/)[1];
  const r = await get(`/shop/${slug}`);
  assert.equal(r.status, 200);
  assert.match(r.text, /id="buy"/);
  assert.ok(r.text.includes("How to order"));
  assert.match(r.text, /data-testid="sticky-buy-bar"/);
  assert.match(r.text, /<a[^>]*href="#buy"[^>]*>[^<]*Order now/);
});

await check("the shop is dark by default with a theme button, and the admin panel is not themed", async () => {
  const home = await get("/");
  assert.match(home.text, /id="store-root"[^>]*data-theme="dark"|data-theme="dark"[^>]*id="store-root"/);
  assert.match(home.text, /data-testid="theme-toggle"/);
  assert.match(home.text, /its4u-theme/, "the saved choice is applied before the page paints");
  const login = await get("/admin/login");
  assert.doesNotMatch(login.text, /data-theme=/);
});

await check("header has pill menus for shop, PTA status, brands and budget", async () => {
  const r = await get("/");
  assert.equal(count(r.text, /aria-haspopup="true"/g), 4);
  for (const label of ["Shop", "PTA status", "Brands", "Budget"]) assert.ok(r.text.includes(`>${label}<`), label);
});

await check("home page has the rotating word, phone mockups, a card stack, grade accordion and feature tabs", async () => {
  const r = await get("/");
  for (const id of ["rotating-text", "hero-devices", "grade-accordion", "feature-showcase"]) assert.ok(r.text.includes(`data-testid="${id}"`), id);
  assert.match(r.text, /aria-roledescription="carousel"/);
  assert.match(r.text, /<h1[^>]*>[^]*?<span class="sr-only">phone<\/span>/);
  assert.equal(count(r.text, /<h1/g), 1);
});

await check("shop has a filter sidebar with counts, a cards or rows switch, and rows view works", async () => {
  const r = await get("/shop");
  assert.equal(r.status, 200);
  assert.equal(count(r.text, /data-testid="filter-panel"/g), 2, "one for phones and one for desktops");
  assert.match(r.text, /aria-label="Show phones as a list"/);
  assert.equal(count(r.text, /data-testid="product-grid"/g), 1);
  const list = await get("/shop?view=list&pta=pta");
  assert.equal(list.status, 200);
  assert.equal(count(list.text, /data-testid="product-list"/g), 1);
  assert.equal(count(list.text, /data-testid="product-grid"/g), 0);
  assert.match(list.text, /\/shop\?view=list[^"]*"|view=list/);
  assert.match(list.text, /data-testid="result-count"[^>]*>7 phones found/);
});

await check("product page is laid out like a record with side bars and a 3D view tab", async () => {
  const shop = await get("/shop");
  const slug = shop.text.match(/href="\/shop\/([a-z0-9-]+)"/)[1];
  const r = await get(`/shop/${slug}`);
  assert.equal(r.status, 200);
  for (const text of ['data-testid="record-header"', 'aria-label="Phone summary"', 'aria-label="Buy this phone"', 'data-testid="section-nav-rail"', 'data-testid="section-nav-bar"', "Quick facts", "Condition report", "3D view"]) {
    assert.ok(r.text.includes(text), text);
  }
  for (const id of ["overview", "specs", "condition", "delivery"]) assert.ok(r.text.includes(`id="${id}"`), id);
  assert.equal(count(r.text, /<h1/g), 1);
  assert.equal(count(r.text, / id="buy"/g), 1);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
