import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFilters } from "../lib/products-query";
import { shopCanonicalPath, shopDescription, shopIsIndexable, shopTitle } from "../lib/shop-seo";
import { CONDITION_SCORE, CONDITION_TEXT, PTA_NOTES, PTA_TEXT } from "../lib/content";
import { CONDITIONS, PTA_STATUSES } from "../lib/constants";
import { CONDITION_TONE, ORDER_TONE, PTA_TONE, TONE, toneFor } from "../lib/ui";

const f = (params: Record<string, string>) => parseFilters(params);

test("shopTitle names what the visitor is looking at", () => {
  assert.equal(shopTitle(f({})), "Shop phones");
  assert.equal(shopTitle(f({ type: "new" })), "New phones");
  assert.equal(shopTitle(f({ type: "used", pta: "pta" })), "Used PTA Approved phones");
  assert.equal(shopTitle(f({ brand: "Apple" })), "Apple phones");
  assert.equal(shopTitle(f({ pta: "jv" })), "JV phones");
  assert.equal(shopTitle(f({ condition: "like-new", brand: "Samsung" })), "Like New Samsung phones");
  assert.equal(shopTitle(f({ q: "iphone 13" })), "Search results for “iphone 13”");
});

test("shopDescription mentions the shop and stays short", () => {
  const d = shopDescription(f({ type: "used" }), "Its4u");
  assert.match(d, /used phones at Its4u/);
  assert.ok(d.length <= 155);
});

test("only clean filter pages are indexable", () => {
  assert.equal(shopIsIndexable(f({})), true);
  assert.equal(shopIsIndexable(f({ type: "new", pta: "pta", brand: "Apple" })), true);
  assert.equal(shopIsIndexable(f({ q: "iphone" })), false);
  assert.equal(shopIsIndexable(f({ minPrice: "1000" })), false);
  assert.equal(shopIsIndexable(f({ maxPrice: "50000" })), false);
  assert.equal(shopIsIndexable(f({ storage: "128GB" })), false);
  assert.equal(shopIsIndexable(f({ sort: "price-asc" })), false);
});

test("the canonical address drops noise filters and keeps the meaningful ones", () => {
  assert.equal(shopCanonicalPath(f({})), "/shop");
  assert.equal(shopCanonicalPath(f({ type: "used", pta: "pta", sort: "price-asc", q: "x", minPrice: "5" })), "/shop?type=used&pta=pta");
  assert.equal(shopCanonicalPath(f({ brand: "Apple", storage: "64GB" })), "/shop?brand=Apple");
});

test("every condition and PTA status has text, a tone and (for conditions) a score", () => {
  for (const c of CONDITIONS) {
    assert.ok(CONDITION_TEXT[c.value], `text for ${c.value}`);
    assert.ok(CONDITION_TONE[c.value], `tone for ${c.value}`);
    assert.ok(CONDITION_SCORE[c.value] >= 7 && CONDITION_SCORE[c.value] <= 10, `score for ${c.value}`);
  }
  for (const p of PTA_STATUSES) {
    assert.ok(PTA_TEXT[p.value], `text for ${p.value}`);
    assert.ok(PTA_TONE[p.value], `tone for ${p.value}`);
  }
  assert.ok(PTA_NOTES["non-pta"] && PTA_NOTES.jv);
  assert.equal(PTA_NOTES.pta, undefined);
});

test("grades never get better as the condition gets worse", () => {
  const scores = CONDITIONS.map((c) => CONDITION_SCORE[c.value]);
  for (let i = 1; i < scores.length; i++) assert.ok(scores[i] <= scores[i - 1], `${i}: ${scores[i]} > ${scores[i - 1]}`);
});

test("toneFor gives full Tailwind class names and falls back to neutral", () => {
  assert.equal(toneFor(PTA_TONE, "non-pta"), TONE.danger);
  assert.equal(toneFor(ORDER_TONE, "delivered"), TONE.success);
  assert.equal(toneFor(ORDER_TONE, "mystery"), TONE.neutral);
  for (const cls of Object.values(TONE)) assert.match(cls, /^bg-tone-[a-z]+-bg text-tone-[a-z]+-fg$/);
});
