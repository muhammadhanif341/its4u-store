import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { makeTestDb, productData } from "./db-helper";
import { buildOrderBy, buildWhere, parseFilters } from "../lib/products-query";

const t = makeTestDb("catalog");
const db = t.client;

const find = (params: Record<string, string>) =>
  db.product.findMany({
    where: buildWhere(parseFilters(params)),
    orderBy: buildOrderBy(parseFilters(params).sort),
  });

before(async () => {
  await db.product.createMany({
    data: [
      { ...productData(), slug: "a", name: "iPhone 13 128GB", brand: "Apple", model: "iPhone 13", condition: "new", ptaStatus: "pta", price: 200000, storage: "128GB" },
      { ...productData(), slug: "b", name: "iPhone 11 64GB", brand: "Apple", model: "iPhone 11", condition: "good", ptaStatus: "non-pta", price: 70000, storage: "64GB" },
      { ...productData(), slug: "c", name: "Galaxy S21", brand: "Samsung", model: "S21", condition: "like-new", ptaStatus: "pta", price: 90000, storage: "128GB" },
      { ...productData(), slug: "d", name: "iPhone XR JV", brand: "Apple", model: "XR", condition: "fair", ptaStatus: "jv", price: 40000, storage: "64GB" },
      { ...productData(), slug: "e", name: "Hidden Phone", brand: "Apple", model: "Hidden", condition: "new", ptaStatus: "pta", price: 1, active: false },
    ],
  });
});

after(async () => {
  await t.cleanup();
});

const slugs = (rows: { slug: string }[]) => rows.map((r) => r.slug).sort();

test("inactive products never show on the storefront", async () => {
  assert.deepEqual(slugs(await find({})), ["a", "b", "c", "d"]);
});

test("type=new and type=used split the catalog", async () => {
  assert.deepEqual(slugs(await find({ type: "new" })), ["a"]);
  assert.deepEqual(slugs(await find({ type: "used" })), ["b", "c", "d"]);
});

test("PTA filters: PTA Approved, Non-PTA and JV", async () => {
  assert.deepEqual(slugs(await find({ pta: "pta" })), ["a", "c"]);
  assert.deepEqual(slugs(await find({ pta: "non-pta" })), ["b"]);
  assert.deepEqual(slugs(await find({ pta: "jv" })), ["d"]);
});

test("condition filter", async () => {
  assert.deepEqual(slugs(await find({ condition: "like-new" })), ["c"]);
  assert.deepEqual(slugs(await find({ condition: "fair" })), ["d"]);
});

test("brand, storage and search", async () => {
  assert.deepEqual(slugs(await find({ brand: "Samsung" })), ["c"]);
  assert.deepEqual(slugs(await find({ storage: "64GB" })), ["b", "d"]);
  assert.deepEqual(slugs(await find({ q: "iphone" })), ["a", "b", "d"]);
  assert.deepEqual(slugs(await find({ q: "s21" })), ["c"]);
  assert.deepEqual(slugs(await find({ q: "nokia" })), []);
});

test("price range is inclusive", async () => {
  assert.deepEqual(slugs(await find({ minPrice: "70000", maxPrice: "90000" })), ["b", "c"]);
});

test("filters combine (used + PTA approved)", async () => {
  assert.deepEqual(slugs(await find({ type: "used", pta: "pta" })), ["c"]);
});

test("sorting by price", async () => {
  assert.deepEqual((await find({ sort: "price-asc" })).map((p) => p.slug), ["d", "b", "c", "a"]);
  assert.deepEqual((await find({ sort: "price-desc" })).map((p) => p.slug), ["a", "c", "b", "d"]);
});
