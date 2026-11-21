import { test } from "node:test";
import assert from "node:assert/strict";
import {
  absoluteUrl,
  availabilityUrl,
  breadcrumbJsonLd,
  itemConditionUrl,
  jsonLdString,
  metaDescription,
  productDescription,
  productJsonLd,
  siteUrl,
  storeJsonLd,
  websiteJsonLd,
} from "../lib/seo";

const BASE = "https://its4u.example";

const phone = {
  slug: "iphone-13-128gb-excellent-non-pta",
  name: "iPhone 13 128GB",
  brand: "Apple",
  model: "iPhone 13",
  condition: "excellent",
  ptaStatus: "non-pta",
  price: 118000,
  stock: 2,
  description: "Very light marks only.",
  images: ["/uploads/a.png", "https://cdn.example/b.jpg"],
};

test("siteUrl uses the env value without a trailing slash, with a local fallback", () => {
  const before = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://its4u.example///";
  assert.equal(siteUrl(), "https://its4u.example");
  delete process.env.NEXT_PUBLIC_SITE_URL;
  assert.equal(siteUrl(), "http://localhost:3000");
  if (before !== undefined) process.env.NEXT_PUBLIC_SITE_URL = before;
});

test("absoluteUrl", () => {
  assert.equal(absoluteUrl("/shop", BASE), `${BASE}/shop`);
  assert.equal(absoluteUrl("shop", BASE), `${BASE}/shop`);
  assert.equal(absoluteUrl("https://cdn.example/x.jpg", BASE), "https://cdn.example/x.jpg");
});

test("metaDescription collapses whitespace and cuts at a word with an ellipsis", () => {
  assert.equal(metaDescription("  hello \n  world  "), "hello world");
  const long = "word ".repeat(80);
  const out = metaDescription(long, 60);
  assert.ok(out.length <= 60, `length ${out.length}`);
  assert.ok(out.endsWith("…"));
  assert.ok(!out.includes("wor…") || out.endsWith("word…"));
});

test("condition and availability map to schema.org values", () => {
  assert.equal(itemConditionUrl("new"), "https://schema.org/NewCondition");
  assert.equal(itemConditionUrl("good"), "https://schema.org/UsedCondition");
  assert.equal(itemConditionUrl("open-box"), "https://schema.org/UsedCondition");
  assert.equal(availabilityUrl(3), "https://schema.org/InStock");
  assert.equal(availabilityUrl(0), "https://schema.org/OutOfStock");
});

test("productDescription uses the description, or builds one when it is empty", () => {
  assert.match(productDescription(phone), /iPhone 13 128GB, Excellent \(9\/10\), Non-PTA\. Rs\. 118,000\. Very light marks only\./);
  assert.match(productDescription({ ...phone, description: "" }), /Order online with cash on delivery/);
});

test("productJsonLd is a valid schema.org Product with an Offer in PKR", () => {
  const ld = productJsonLd(phone, { shopName: "Its4u", base: BASE });
  assert.equal(ld["@type"], "Product");
  assert.equal(ld.name, "iPhone 13 128GB");
  assert.equal(ld.brand.name, "Apple");
  assert.deepEqual(ld.image, [`${BASE}/uploads/a.png`, "https://cdn.example/b.jpg"]);
  assert.equal(ld.offers.priceCurrency, "PKR");
  assert.equal(ld.offers.price, "118000");
  assert.equal(ld.offers.url, `${BASE}/shop/${phone.slug}`);
  assert.equal(ld.offers.availability, "https://schema.org/InStock");
  assert.equal(ld.offers.itemCondition, "https://schema.org/UsedCondition");
  assert.equal(ld.offers.seller.name, "Its4u");
  assert.ok(ld.additionalProperty.some((p) => p.name === "PTA status" && p.value === "Non-PTA"));
});

test("productJsonLd leaves out image when there are none and marks sold out", () => {
  const ld = productJsonLd({ ...phone, images: [], stock: 0 }, { shopName: "Its4u", base: BASE });
  assert.equal("image" in ld, false);
  assert.equal(ld.offers.availability, "https://schema.org/OutOfStock");
});

test("breadcrumbJsonLd numbers items from 1 with absolute urls", () => {
  const ld = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }], BASE);
  assert.equal(ld.itemListElement[0].position, 1);
  assert.equal(ld.itemListElement[1].item, `${BASE}/shop`);
  assert.equal(ld.itemListElement.length, 2);
});

test("storeJsonLd and websiteJsonLd", () => {
  const store = storeJsonLd({ shopName: "Its4u", tagline: "Phones", phone: "0300 0000000", address: "Lahore" }, BASE);
  assert.equal(store["@type"], "Store");
  assert.equal(store.address.addressCountry, "PK");
  const site = websiteJsonLd("Its4u", BASE);
  assert.equal(site.potentialAction.target, `${BASE}/shop?q={search_term_string}`);
});

test("jsonLdString can never close the script tag", () => {
  const out = jsonLdString({ name: "</script><script>alert(1)</script>" });
  assert.ok(!out.includes("</script>"));
  assert.ok(!out.includes("<"));
  assert.equal(JSON.parse(out).name, "</script><script>alert(1)</script>");
});
