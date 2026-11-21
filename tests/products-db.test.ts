import { test, after } from "node:test";
import assert from "node:assert/strict";
import { makeTestDb, productData, customer } from "./db-helper";
import { getDashboardStats, uniqueSlug } from "../lib/products";
import { createOrder, setOrderStatus } from "../lib/orders";

const t = makeTestDb("products");
const db = t.client;

after(async () => {
  await t.cleanup();
});

test("uniqueSlug returns the base when free and numbers it when taken", async () => {
  assert.equal(await uniqueSlug(db, "iPhone 13 128GB"), "iphone-13-128gb");
  await db.product.create({ data: productData({ slug: "iphone-13-128gb" }) });
  assert.equal(await uniqueSlug(db, "iPhone 13 128GB"), "iphone-13-128gb-2");
  await db.product.create({ data: productData({ slug: "iphone-13-128gb-2" }) });
  assert.equal(await uniqueSlug(db, "iPhone 13 128GB"), "iphone-13-128gb-3");
});

test("uniqueSlug lets a product keep its own slug when editing", async () => {
  const p = await db.product.create({ data: productData({ slug: "keep-me" }) });
  assert.equal(await uniqueSlug(db, "Keep Me", p.id), "keep-me");
});

test("uniqueSlug falls back for names with no usable characters", async () => {
  assert.equal(await uniqueSlug(db, "!!!"), "phone");
});

test("dashboard stats count orders, products and delivered revenue", async () => {
  const empty = await getDashboardStats(db);
  const baseActive = empty.activeProducts;

  const a = await db.product.create({ data: productData({ price: 50000, stock: 3 }) });
  await db.product.create({ data: productData({ stock: 0 }) }); // active but sold out
  await db.product.create({ data: productData({ active: false }) }); // hidden

  const o1 = await createOrder(db, customer, [{ id: a.id, qty: 1 }], { deliveryFee: 250, freeAbove: 100000 });
  const o2 = await createOrder(db, customer, [{ id: a.id, qty: 1 }], { deliveryFee: 250, freeAbove: 100000 });
  await setOrderStatus(db, o1.id, "delivered");

  const s = await getDashboardStats(db);
  assert.equal(s.activeProducts, baseActive + 2);
  assert.equal(s.soldOut, empty.soldOut + 1);
  assert.equal(s.pendingOrders, 1);
  assert.equal(s.totalOrders, 2);
  assert.equal(s.ordersToday, 2);
  assert.equal(s.revenue, o1.total);
  assert.ok(o2.id);
});

test("ordersToday ignores orders from earlier days", async () => {
  const tomorrow = new Date(Date.now() + 36 * 60 * 60 * 1000);
  const s = await getDashboardStats(db, tomorrow);
  assert.equal(s.ordersToday, 0);
});
