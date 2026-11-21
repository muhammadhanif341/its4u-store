import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { makeTestDb, productData, customer } from "./db-helper";
import { createOrder, setOrderStatus, trackOrder, OrderError } from "../lib/orders";

const t = makeTestDb("orders");
const db = t.client;
const opts = { deliveryFee: 250, freeAbove: 150000 };

after(async () => {
  await t.cleanup();
});

before(async () => {
  await db.$connect();
});

test("creates an order, snapshots price and name, decrements stock, adds delivery", async () => {
  const p = await db.product.create({ data: productData({ price: 100000, stock: 3, images: '["/uploads/a.jpg"]' }) });
  const order = await createOrder(db, customer, [{ id: p.id, qty: 2 }], opts);

  assert.match(order.orderNo, /^ORD-[A-Z0-9]{6}$/);
  assert.equal(order.subtotal, 200000);
  assert.equal(order.deliveryFee, 0); // above the free-delivery threshold
  assert.equal(order.total, 200000);
  assert.equal(order.status, "pending");
  assert.equal(order.items.length, 1);
  assert.equal(order.items[0].name, p.name);
  assert.equal(order.items[0].price, 100000);
  assert.equal(order.items[0].image, "/uploads/a.jpg");

  const after = await db.product.findUniqueOrThrow({ where: { id: p.id } });
  assert.equal(after.stock, 1);
});

test("charges delivery below the free-delivery threshold", async () => {
  const p = await db.product.create({ data: productData({ price: 20000, stock: 1 }) });
  const order = await createOrder(db, customer, [{ id: p.id, qty: 1 }], opts);
  assert.equal(order.deliveryFee, 250);
  assert.equal(order.total, 20250);
});

test("merges duplicate lines for the same product", async () => {
  const p = await db.product.create({ data: productData({ price: 10000, stock: 5 }) });
  const order = await createOrder(db, customer, [{ id: p.id, qty: 1 }, { id: p.id, qty: 2 }], opts);
  assert.equal(order.items.length, 1);
  assert.equal(order.items[0].qty, 3);
});

test("rejects an empty cart", async () => {
  await assert.rejects(() => createOrder(db, customer, [], opts), OrderError);
  await assert.rejects(() => createOrder(db, customer, [{ id: "x", qty: 0 }], opts), /empty/);
});

test("rejects unknown and inactive products", async () => {
  await assert.rejects(() => createOrder(db, customer, [{ id: "nope", qty: 1 }], opts), /no longer available/);
  const p = await db.product.create({ data: productData({ active: false }) });
  await assert.rejects(() => createOrder(db, customer, [{ id: p.id, qty: 1 }], opts), /no longer available/);
});

test("rejects out of stock and over-stock quantities", async () => {
  const sold = await db.product.create({ data: productData({ stock: 0 }) });
  await assert.rejects(() => createOrder(db, customer, [{ id: sold.id, qty: 1 }], opts), /out of stock/);
  const few = await db.product.create({ data: productData({ stock: 1 }) });
  await assert.rejects(() => createOrder(db, customer, [{ id: few.id, qty: 2 }], opts), /Only 1 left/);
});

test("a failed order changes nothing (stock is rolled back)", async () => {
  const good = await db.product.create({ data: productData({ stock: 5 }) });
  const bad = await db.product.create({ data: productData({ stock: 0 }) });
  await assert.rejects(() =>
    createOrder(db, customer, [{ id: good.id, qty: 2 }, { id: bad.id, qty: 1 }], opts),
  );
  const after = await db.product.findUniqueOrThrow({ where: { id: good.id } });
  assert.equal(after.stock, 5);
  assert.equal(await db.order.count({ where: { items: { some: { productId: good.id } } } }), 0);
});

test("the last piece can only be bought once", async () => {
  const p = await db.product.create({ data: productData({ stock: 1 }) });
  await createOrder(db, customer, [{ id: p.id, qty: 1 }], opts);
  await assert.rejects(() => createOrder(db, customer, [{ id: p.id, qty: 1 }], opts), /out of stock/);
});

test("cancelling restores stock and cancelled orders cannot be reopened", async () => {
  const p = await db.product.create({ data: productData({ stock: 2 }) });
  const order = await createOrder(db, customer, [{ id: p.id, qty: 2 }], opts);
  assert.equal((await db.product.findUniqueOrThrow({ where: { id: p.id } })).stock, 0);

  const cancelled = await setOrderStatus(db, order.id, "cancelled");
  assert.equal(cancelled.status, "cancelled");
  assert.equal((await db.product.findUniqueOrThrow({ where: { id: p.id } })).stock, 2);

  // cancelling again must not add stock twice
  await setOrderStatus(db, order.id, "cancelled");
  assert.equal((await db.product.findUniqueOrThrow({ where: { id: p.id } })).stock, 2);

  await assert.rejects(() => setOrderStatus(db, order.id, "pending"), /cannot be reopened/);
});

test("status moves forward and rejects unknown values", async () => {
  const p = await db.product.create({ data: productData({ stock: 1 }) });
  const order = await createOrder(db, customer, [{ id: p.id, qty: 1 }], opts);
  assert.equal((await setOrderStatus(db, order.id, "confirmed")).status, "confirmed");
  assert.equal((await setOrderStatus(db, order.id, "shipped")).status, "shipped");
  assert.equal((await setOrderStatus(db, order.id, "delivered")).status, "delivered");
  await assert.rejects(() => setOrderStatus(db, order.id, "teleported"), /Unknown order status/);
  await assert.rejects(() => setOrderStatus(db, "missing", "confirmed"), /not found/);
});

test("trackOrder needs the matching order number and phone", async () => {
  const p = await db.product.create({ data: productData({ stock: 1 }) });
  const order = await createOrder(db, customer, [{ id: p.id, qty: 1 }], opts);

  assert.ok(await trackOrder(db, order.orderNo, "03001234567"));
  assert.ok(await trackOrder(db, order.orderNo.toLowerCase(), "+92 300 1234567"));
  assert.equal(await trackOrder(db, order.orderNo, "03009999999"), null);
  assert.equal(await trackOrder(db, order.orderNo, "123"), null);
  assert.equal(await trackOrder(db, "ORD-ZZZZZZ", "03001234567"), null);
});
