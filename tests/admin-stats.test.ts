import { test, after } from "node:test";
import assert from "node:assert/strict";
import { makeTestDb, productData, customer } from "./db-helper";
import {
  bucketOrdersByDay,
  formatLongDate,
  getAttentionProducts,
  getOrdersByDay,
  greeting,
  localDateKey,
} from "../lib/admin-stats";
import { createOrder, setOrderStatus } from "../lib/orders";

const t = makeTestDb("adminstats");
const db = t.client;

after(async () => {
  await t.cleanup();
});

// Friday 20 Nov 2026, 15:30 local time
const NOW = new Date(2026, 10, 20, 15, 30);
const at = (day: number, hour = 12) => new Date(2026, 10, day, hour, 0);

test("localDateKey uses local date parts", () => {
  assert.equal(localDateKey(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
  assert.equal(localDateKey(new Date(2026, 11, 31, 0, 0)), "2026-12-31");
});

test("bucketOrdersByDay returns the last N days, oldest first, with empty days as zero", () => {
  const out = bucketOrdersByDay([], 7, NOW);
  assert.equal(out.length, 7);
  assert.equal(out[0].date, "2026-11-14");
  assert.equal(out[6].date, "2026-11-20");
  assert.equal(out[6].label, "Fri");
  assert.ok(out.every((b) => b.count === 0 && b.revenue === 0));
});

test("bucketOrdersByDay adds up orders and sales per day", () => {
  const out = bucketOrdersByDay(
    [
      { createdAt: at(20, 9), total: 1000, status: "pending" },
      { createdAt: at(20, 23), total: 500, status: "delivered" },
      { createdAt: at(18), total: 700, status: "confirmed" },
    ],
    7,
    NOW,
  );
  assert.deepEqual(out.at(-1), { date: "2026-11-20", label: "Fri", count: 2, revenue: 1500 });
  assert.equal(out.find((b) => b.date === "2026-11-18")?.count, 1);
  assert.equal(out.reduce((n, b) => n + b.count, 0), 3);
});

test("cancelled orders and orders outside the window are ignored", () => {
  const out = bucketOrdersByDay(
    [
      { createdAt: at(20), total: 999, status: "cancelled" },
      { createdAt: at(1), total: 123, status: "pending" }, // 19 days ago
      { createdAt: new Date(2026, 10, 21, 10), total: 55, status: "pending" }, // tomorrow
    ],
    7,
    NOW,
  );
  assert.equal(out.reduce((n, b) => n + b.count, 0), 0);
});

test("the window can be any size", () => {
  assert.equal(bucketOrdersByDay([], 1, NOW).length, 1);
  assert.equal(bucketOrdersByDay([], 30, NOW).length, 30);
});

test("getOrdersByDay reads orders from the database", async () => {
  const p = await db.product.create({ data: productData({ price: 20000, stock: 10 }) });
  const opts = { deliveryFee: 250, freeAbove: 100000 };
  const a = await createOrder(db, customer, [{ id: p.id, qty: 1 }], opts);
  const b = await createOrder(db, customer, [{ id: p.id, qty: 2 }], opts);
  await setOrderStatus(db, b.id, "cancelled");

  const out = await getOrdersByDay(db, 7);
  assert.equal(out.length, 7);
  const today = out.at(-1)!;
  assert.equal(today.count, 1);
  assert.equal(today.revenue, a.total);
});

test("getAttentionProducts lists sold out and last-piece phones, worst first, hidden ones excluded", async () => {
  await db.product.create({ data: productData({ name: "Plenty", stock: 9 }) });
  await db.product.create({ data: productData({ name: "Last one", stock: 1 }) });
  await db.product.create({ data: productData({ name: "Gone", stock: 0 }) });
  await db.product.create({ data: productData({ name: "Hidden and gone", stock: 0, active: false }) });

  const list = await getAttentionProducts(db, 10);
  const names = list.map((p) => p.name);
  assert.ok(names.includes("Gone") && names.includes("Last one"));
  assert.ok(!names.includes("Plenty") && !names.includes("Hidden and gone"));
  assert.ok(names.indexOf("Gone") < names.indexOf("Last one"), "sold out comes before last piece");
  assert.equal((await getAttentionProducts(db, 1)).length, 1);
});

test("greeting follows the time of day", () => {
  assert.equal(greeting(new Date(2026, 10, 20, 6)), "Good morning");
  assert.equal(greeting(new Date(2026, 10, 20, 11, 59)), "Good morning");
  assert.equal(greeting(new Date(2026, 10, 20, 12)), "Good afternoon");
  assert.equal(greeting(new Date(2026, 10, 20, 16, 59)), "Good afternoon");
  assert.equal(greeting(new Date(2026, 10, 20, 17)), "Good evening");
  assert.equal(greeting(new Date(2026, 10, 20, 23)), "Good evening");
});

test("formatLongDate", () => {
  assert.equal(formatLongDate(NOW), "Friday 20 November 2026");
});
