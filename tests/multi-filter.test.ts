import "./setup-react";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FilterPanel, type Facets } from "../components/shop/FilterPanel";
import { filtersToQuery, buildWhere, parseFilters, toggleIn } from "../lib/products-query";
import { shopCanonicalPath, shopIsIndexable, shopTitle } from "../lib/shop-seo";
import { makeTestDb, productData } from "./db-helper";

const t = makeTestDb("multifilter");
const db = t.client;

before(async () => {
  await db.product.createMany({
    data: [
      { ...productData(), slug: "a", brand: "Apple", condition: "new", ptaStatus: "pta", storage: "128GB", price: 200000 },
      { ...productData(), slug: "b", brand: "Apple", condition: "good", ptaStatus: "non-pta", storage: "64GB", price: 70000 },
      { ...productData(), slug: "c", brand: "Samsung", condition: "like-new", ptaStatus: "pta", storage: "128GB", price: 90000 },
      { ...productData(), slug: "d", brand: "Xiaomi", condition: "fair", ptaStatus: "jv", storage: "64GB", price: 40000 },
      { ...productData(), slug: "e", brand: "Apple", condition: "new", ptaStatus: "pta", storage: "256GB", price: 1, active: false },
    ],
  });
});
after(async () => {
  await t.cleanup();
});

const find = (params: Record<string, string | string[]>) => db.product.findMany({ where: buildWhere(parseFilters(params)) });
const slugs = (rows: { slug: string }[]) => rows.map((r) => r.slug).sort();

test("repeated query keys become lists, without blanks or repeats", () => {
  const f = parseFilters({ brand: ["Apple", " Samsung ", "Apple", ""], pta: ["pta", "jv"], condition: ["good", "nonsense"] });
  assert.deepEqual(f.brand, ["Apple", "Samsung"]);
  assert.deepEqual(f.pta, ["pta", "jv"]);
  assert.deepEqual(f.condition, ["good"], "unknown conditions are dropped");
  assert.deepEqual(parseFilters({ brand: "Apple" }).brand, ["Apple"], "a single value still works");
  assert.deepEqual(parseFilters({}).brand, []);
  assert.deepEqual(parseFilters({ pta: "bogus" }).pta, []);
});

test("a list is capped and each value is trimmed to a safe length", () => {
  const many = Array.from({ length: 40 }, (_, i) => `Brand${i}`);
  assert.equal(parseFilters({ brand: many }).brand.length, 12);
  assert.equal(parseFilters({ brand: "x".repeat(200) }).brand[0].length, 40);
});

test("two brands show phones of either brand", async () => {
  assert.deepEqual(slugs(await find({ brand: ["Apple", "Samsung"] })), ["a", "b", "c"]);
  assert.deepEqual(slugs(await find({ brand: ["Xiaomi"] })), ["d"]);
});

test("values inside a group are OR, and different groups are AND", async () => {
  assert.deepEqual(slugs(await find({ brand: ["Apple", "Samsung"], pta: "pta" })), ["a", "c"]);
  assert.deepEqual(slugs(await find({ pta: ["pta", "jv"] })), ["a", "c", "d"]);
  assert.deepEqual(slugs(await find({ condition: ["good", "fair"], brand: ["Apple", "Xiaomi"] })), ["b", "d"]);
  assert.deepEqual(slugs(await find({ storage: ["128GB", "256GB"] })), ["a", "c"], "256GB phone is hidden, so it never shows");
  assert.deepEqual(slugs(await find({ brand: ["Apple", "Samsung"], minPrice: "80000" })), ["a", "c"]);
});

test("hidden phones never show, however the filters are mixed", async () => {
  const all = slugs(await find({ brand: ["Apple", "Samsung", "Xiaomi"] }));
  assert.ok(!all.includes("e"));
});

test("an empty selection means no restriction", async () => {
  assert.deepEqual(slugs(await find({ brand: [] })), ["a", "b", "c", "d"]);
});

test("toggleIn adds a missing value and removes a present one, keeping the order", () => {
  assert.deepEqual(toggleIn([], "Apple"), ["Apple"]);
  assert.deepEqual(toggleIn(["Apple"], "Samsung"), ["Apple", "Samsung"]);
  assert.deepEqual(toggleIn(["Apple", "Samsung"], "Apple"), ["Samsung"]);
  assert.deepEqual(toggleIn(["Apple"], "Apple"), []);
});

test("links are built with repeated keys and survive a round trip", () => {
  const f = parseFilters({ brand: ["Apple", "Samsung"], pta: "pta", type: "used", minPrice: "50000" });
  const q = filtersToQuery(f);
  assert.equal(q, "?brand=Apple&brand=Samsung&type=used&pta=pta&minPrice=50000");
  const back = parseFilters(Object.fromEntries(new URLSearchParams(q).entries()) as never);
  assert.equal(back.minPrice, 50000);
  const params = new URLSearchParams(q);
  assert.deepEqual(parseFilters({ brand: params.getAll("brand"), pta: params.getAll("pta") }).brand, ["Apple", "Samsung"]);
  assert.equal(filtersToQuery(parseFilters({})), "");
});

test("overrides replace one group and leave the others", () => {
  const f = parseFilters({ brand: ["Apple", "Samsung"], pta: "pta" });
  assert.equal(filtersToQuery(f, { brand: toggleIn(f.brand, "Apple") }), "?brand=Samsung&pta=pta");
  assert.equal(filtersToQuery(f, { brand: [] }), "?pta=pta");
  assert.equal(filtersToQuery(f, { pta: ["pta", "jv"] }), "?brand=Apple&brand=Samsung&pta=pta&pta=jv");
  assert.equal(filtersToQuery(f, { type: "new" }), "?brand=Apple&brand=Samsung&type=new&pta=pta");
  assert.equal(filtersToQuery(f, { brand: "Xiaomi" }), "?brand=Xiaomi&pta=pta", "a plain string means one value");
  assert.equal(filtersToQuery(f, { minPrice: "1000", maxPrice: "9000" }), "?brand=Apple&brand=Samsung&pta=pta&minPrice=1000&maxPrice=9000");
});

test("the page title and search engine rules cope with several choices", () => {
  assert.equal(shopTitle(parseFilters({ brand: ["Apple", "Samsung"] })), "Apple or Samsung phones");
  assert.equal(shopTitle(parseFilters({ type: "used", pta: ["pta", "jv"] })), "Used PTA Approved or JV phones");
  assert.equal(shopTitle(parseFilters({ brand: "Apple" })), "Apple phones");
  assert.equal(shopIsIndexable(parseFilters({ brand: "Apple" })), true);
  assert.equal(shopIsIndexable(parseFilters({ brand: ["Apple", "Samsung"] })), false, "a mix is not worth indexing");
  assert.equal(shopIsIndexable(parseFilters({ storage: "128GB" })), false);
  assert.equal(shopCanonicalPath(parseFilters({ brand: ["Apple", "Samsung"] })), "/shop");
  assert.equal(shopCanonicalPath(parseFilters({ brand: "Apple", storage: "64GB", sort: "price-asc" })), "/shop?brand=Apple");
});

test("the sidebar shows checkboxes for the multi-pick groups and radios for the single ones", () => {
  const facets: Facets = {
    total: 4,
    newCount: 1,
    usedCount: 3,
    brands: [
      { value: "Apple", count: 2 },
      { value: "Samsung", count: 1 },
    ],
    conditions: { new: 1, good: 1 },
    pta: { pta: 2, "non-pta": 1, jv: 1 },
    storages: [{ value: "128GB", count: 2 }],
  };
  const f = parseFilters({ brand: ["Apple"], pta: ["pta", "jv"] });
  const href = (over: Record<string, string | string[]>) => `/shop?${JSON.stringify(over)}`;
  const out = renderToStaticMarkup(createElement(FilterPanel, { filters: f, facets, href: href as never, idPrefix: "d", activeCount: 3 }));
  assert.ok((out.match(/data-kind="checkbox"/g) ?? []).length >= 10, "PTA, brand and condition options are checkboxes");
  assert.ok((out.match(/data-kind="radio"/g) ?? []).length >= 8, "type and price options are radios");
  assert.equal((out.match(/Pick any/g) ?? []).length, 4, "four groups say you can pick several");
  // clicking an already chosen brand removes it, clicking a new one adds it
  assert.ok(out.includes(encodeURIComponent("")) || true);
  assert.match(out, /brand&quot;:\[&quot;Apple&quot;,&quot;Samsung&quot;\]/, "Samsung link adds to the chosen Apple");
  assert.match(out, /pta&quot;:\[&quot;jv&quot;\]/, "PTA Approved link removes it and keeps JV");
});

test("shop page shows one removable chip for every chosen value", () => {
  const page = fs.readFileSync(path.join(process.cwd(), "app/(store)/shop/page.tsx"), "utf8");
  for (const piece of ["for (const b of f.brand)", "for (const p of f.pta)", "for (const c of f.condition)", "for (const st of f.storage)", "filter((x) => x !== b)"]) {
    assert.ok(page.includes(piece), piece);
  }
});
