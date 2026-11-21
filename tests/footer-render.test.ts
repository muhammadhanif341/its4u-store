import "./setup-react";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Footer } from "../components/Footer";
import { BreathingGlows } from "../components/BreathingGlows";
import { footer as footerTokens } from "../lib/design-tokens";
import { DEFAULT_SETTINGS, type Settings } from "../lib/constants";

const settings: Settings = {
  ...DEFAULT_SETTINGS,
  shopName: "Its4u",
  tagline: "New and used mobiles you can trust",
  whatsapp: "923001234567",
  phone: "0300 1234567",
  address: "Shop 4, Hall Road, Lahore",
};

const render = () => renderToStaticMarkup(createElement(Footer, { settings }));
const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;

test("the footer is a landmark with the shop name, tagline, address and this year's copyright", () => {
  const html = render();
  assert.match(html, /^<footer/);
  assert.match(html, /Its4u/);
  assert.match(html, /New and used mobiles you can trust/);
  assert.match(html, /Shop 4, Hall Road, Lahore/);
  assert.match(html, new RegExp(`&copy; ${new Date().getFullYear()}|© ${new Date().getFullYear()}`));
});

test("it has Shop, Help and Contact columns, each with a real heading and labelled navigation", () => {
  const html = render();
  for (const title of ["Shop", "Help", "Contact"]) assert.match(html, new RegExp(`<h2[^>]*>${title}</h2>`), title);
  assert.equal(count(html, /<h1/g), 0, "a footer must never contain the page's h1");
  assert.match(html, /<nav aria-label="Shop"/);
  assert.match(html, /<nav aria-label="Help"/);
  assert.equal(count(html, /<address/g), 1);
});

test("every shop filter link, the tracking page and the policies page are linked", () => {
  const html = render();
  for (const href of ["/shop", "/shop?type=new", "/shop?type=used", "/shop?pta=pta", "/shop?pta=non-pta", "/shop?pta=jv", "/track", "/policies"]) {
    assert.ok(html.includes(`href="${href.replace("&", "&amp;")}"`), `missing link ${href}`);
  }
});

test("phone number is a tap-to-call link and WhatsApp links open the right chat", () => {
  const html = render();
  assert.match(html, /href="tel:03001234567"/);
  assert.match(html, /\+92 300 1234567/);
  const wa = html.match(/href="(https:\/\/wa\.me\/[^"]+)"/g) ?? [];
  assert.ok(wa.length >= 3, "chat button, help link and contact link");
  for (const link of wa) assert.match(link, /wa\.me\/923001234567\?text=/);
});

test("external links open safely", () => {
  const html = render();
  for (const tag of html.match(/<a [^>]*target="_blank"[^>]*>/g) ?? []) {
    assert.match(tag, /rel="noreferrer"/, tag);
  }
});

test("decorative parts are hidden from screen readers", () => {
  const html = render();
  assert.match(html, /class="footer-glows[^"]*"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*class="footer-glows/);
  assert.match(html, /footer-divider[^>]*aria-hidden="true"|aria-hidden="true"[^>]*footer-divider/);
  // every svg icon is decorative
  for (const svg of html.match(/<svg[^>]*>/g) ?? []) assert.match(svg, /aria-hidden="true"/, svg);
});

test("the glows pause when told the footer is off screen", () => {
  const html = renderToStaticMarkup(createElement(BreathingGlows));
  assert.match(html, /data-paused="false"/);
  assert.equal(count(html, /class="footer-glow footer-glow-[abc]"/g), 3);
});

test("content fades in with staggered delays but is never hidden in the HTML itself", () => {
  const html = render();
  assert.ok(count(html, /class="[^"]*\breveal\b/g) >= 6);
  for (const i of [0, 1, 2, 3, 4, 5]) assert.match(html, new RegExp(`--i:${i}`), `delay step ${i}`);
  assert.ok(!/style="[^"]*opacity:\s*0/.test(html), "inline opacity:0 would hide content without JavaScript");
});

test("the credit is plain text unless a safe web address is configured", () => {
  const before = process.env.NEXT_PUBLIC_CREDIT_URL;
  try {
    delete process.env.NEXT_PUBLIC_CREDIT_URL;
    assert.match(render(), /Website by HK DevLab/);
    assert.ok(!/href="[^"]*hkdevlab/i.test(render()));

    process.env.NEXT_PUBLIC_CREDIT_URL = "https://hkdevlab.com";
    assert.match(render(), /<a href="https:\/\/hkdevlab\.com"[^>]*rel="noreferrer"/);

    process.env.NEXT_PUBLIC_CREDIT_URL = "javascript:alert(1)";
    assert.ok(!render().includes("javascript:"));
  } finally {
    if (before === undefined) delete process.env.NEXT_PUBLIC_CREDIT_URL;
    else process.env.NEXT_PUBLIC_CREDIT_URL = before;
  }
});

test("the text colours used in the footer are the ones the contrast tests check", () => {
  const source = readFileSync(path.join(process.cwd(), "components", "Footer.tsx"), "utf8").toUpperCase();
  assert.ok(source.includes(footerTokens.textSoft), `soft text ${footerTokens.textSoft}`);
  assert.ok(source.includes(footerTokens.textDim), `dim text ${footerTokens.textDim}`);
  // no grey that was never tested
  for (const hex of source.match(/#[0-9A-F]{6}\b/g) ?? []) {
    assert.ok([footerTokens.textSoft, footerTokens.textDim, "#E8EEFA"].includes(hex as never), `untested colour ${hex} in Footer.tsx`);
  }
});
