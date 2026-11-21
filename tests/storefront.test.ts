import "./setup-react";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Faq } from "../components/Faq";
import { HowToBuy } from "../components/HowToBuy";
import { StickyBuyBar } from "../components/StickyBuyBar";
import { DEFAULT_SETTINGS } from "../lib/constants";
import { parseFilters } from "../lib/products-query";
import { faqJsonLd, howToJsonLd, jsonLdString } from "../lib/seo";
import { BUDGETS, CHECK_ON_DELIVERY, HOW_TO_BUY, budgetHref, buildFaqs } from "../lib/storefront";

const root = process.cwd();
const read = (f: string) => fs.readFileSync(path.join(root, f), "utf8");

test("how to buy has four numbered steps with real text", () => {
  assert.equal(HOW_TO_BUY.length, 4);
  for (const s of HOW_TO_BUY) {
    assert.ok(s.title.length > 3 && s.text.length > 20, s.title);
  }
  const html = renderToStaticMarkup(createElement(HowToBuy));
  assert.equal((html.match(/<li /g) ?? []).length, 4);
  assert.match(html, /Step 1: /);
  assert.match(html, /Step 4: /);
});

test("each budget shortcut becomes a real shop filter", () => {
  assert.ok(BUDGETS.length >= 3);
  for (const b of BUDGETS) {
    const href = budgetHref(b);
    assert.ok(href.startsWith("/shop?"), href);
    const f = parseFilters(Object.fromEntries(new URLSearchParams(href.split("?")[1])));
    assert.equal(f.minPrice, b.minPrice ?? null, b.label);
    assert.equal(f.maxPrice, b.maxPrice ?? null, b.label);
    assert.ok(f.minPrice || f.maxPrice, `${b.label} applies no filter`);
  }
});

test("budget ranges are in order and do not leave gaps", () => {
  for (let i = 1; i < BUDGETS.length; i++) {
    assert.equal(BUDGETS[i].minPrice, BUDGETS[i - 1].maxPrice, `${BUDGETS[i].label} should start where the one before ends`);
  }
});

test("faq answers use the shop's own delivery settings", () => {
  const paid = buildFaqs({ ...DEFAULT_SETTINGS, deliveryFee: "300", freeDeliveryAbove: "60000" });
  const delivery = paid.find((f) => f.q === "How much is delivery?")!;
  assert.match(delivery.a, /Rs\.? ?300/);
  assert.match(delivery.a, /60,000/);

  const noFree = buildFaqs({ ...DEFAULT_SETTINGS, deliveryFee: "250", freeDeliveryAbove: "0" });
  assert.doesNotMatch(noFree.find((f) => f.q === "How much is delivery?")!.a, /free on orders/);

  const free = buildFaqs({ ...DEFAULT_SETTINGS, deliveryFee: "0", freeDeliveryAbove: "0" });
  assert.match(free.find((f) => f.q === "How much is delivery?")!.a, /free/i);
});

test("faq covers ordering, cash on delivery, PTA, grading, tracking and warranty, with no repeated question", () => {
  const faqs = buildFaqs(DEFAULT_SETTINGS);
  const text = faqs.map((f) => f.q).join(" | ");
  for (const word of [/order a phone/i, /pay when/i, /PTA/, /graded/i, /track/i, /warranty/i]) assert.match(text, word);
  assert.equal(new Set(faqs.map((f) => f.q)).size, faqs.length);
  for (const f of faqs) assert.ok(f.a.length > 30, f.q);
});

test("faq renders as closed, keyboard friendly details elements", () => {
  const faqs = buildFaqs(DEFAULT_SETTINGS);
  const html = renderToStaticMarkup(createElement(Faq, { items: faqs }));
  assert.equal((html.match(/<details/g) ?? []).length, faqs.length);
  assert.equal((html.match(/<summary/g) ?? []).length, faqs.length);
  assert.doesNotMatch(html, /<details[^>]* open/);
  // the answer text is in the page for search engines even when closed
  assert.ok(html.includes("Cash on Delivery"));
});

test("faq and how-to structured data are valid and safe to embed", () => {
  const faqs = buildFaqs(DEFAULT_SETTINGS);
  const ld = faqJsonLd(faqs);
  assert.equal(ld["@type"], "FAQPage");
  assert.equal(ld.mainEntity.length, faqs.length);
  assert.equal(ld.mainEntity[0].acceptedAnswer.text, faqs[0].a);
  const how = howToJsonLd("How to buy a phone", HOW_TO_BUY);
  assert.equal(how.step.length, 4);
  assert.deepEqual(how.step.map((s) => s.position), [1, 2, 3, 4]);
  const out = jsonLdString(ld);
  assert.doesNotMatch(out, /<\/script/i);
  assert.deepEqual(JSON.parse(out).mainEntity.length, faqs.length);
});

test("delivery checklist tells the customer to check the IMEI", () => {
  assert.ok(CHECK_ON_DELIVERY.length >= 4);
  assert.ok(CHECK_ON_DELIVERY.some((c) => c.includes("IMEI") && c.includes("*#06#")));
});

test("sticky buy bar shows the price and an Order button, or Sold out", () => {
  const open = renderToStaticMarkup(createElement(StickyBuyBar, { name: "iPhone 13", price: 189000, soldOut: false }));
  assert.match(open, /189,000/);
  assert.match(open, /href="#buy"/);
  assert.match(open, /lg:hidden/, "only shown on small screens");
  const sold = renderToStaticMarkup(createElement(StickyBuyBar, { name: "iPhone 13", price: 189000, soldOut: true }));
  assert.match(sold, /Sold out/);
  assert.doesNotMatch(sold, /href="#buy"/);
});

test("the how-to-buy page, nav, footer and sitemap are all connected", () => {
  assert.ok(fs.existsSync(path.join(root, "app/(store)/how-to-buy/page.tsx")));
  assert.match(read("components/Header.tsx"), /href: "\/how-to-buy"/);
  assert.match(read("lib/footer.ts"), /href: "\/how-to-buy"/);
  assert.match(read("app/sitemap.ts"), /\/how-to-buy/);
  const page = read("app/(store)/how-to-buy/page.tsx");
  assert.match(page, /faqJsonLd/);
  assert.match(page, /howToJsonLd/);
  assert.equal((page.match(/<h1/g) ?? []).length, 1, "exactly one h1");
});

test("home page has brands, budgets, deals, how to buy and questions, and the product page has the buy anchor", () => {
  const home = read("app/(store)/page.tsx");
  for (const piece of ["Shop by brand", "What can you spend?", "Deals right now", "<HowToBuy", "<Faq", "faqJsonLd"]) {
    assert.ok(home.includes(piece), piece);
  }
  assert.equal((home.match(/<h1/g) ?? []).length, 1, "exactly one h1");
  const product = read("app/(store)/shop/[slug]/page.tsx");
  assert.match(product, /id="buy"/);
  assert.match(product, /<StickyBuyBar/);
  assert.match(product, /How to order/);
});
