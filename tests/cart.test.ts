import { test } from "node:test";
import assert from "node:assert/strict";
import { addItem, setQty, removeItem, cartCount, cartSubtotal, type CartItem } from "../lib/cart";
import { calcDelivery, calcTotals, toInt } from "../lib/pricing";

const phone = (over: Partial<CartItem> = {}): Omit<CartItem, "qty"> => ({
  id: "p1",
  slug: "iphone-13",
  name: "iPhone 13",
  price: 100000,
  image: null,
  stock: 3,
  ...over,
});

test("addItem adds a new line", () => {
  const cart = addItem([], phone());
  assert.equal(cart.length, 1);
  assert.equal(cart[0].qty, 1);
});

test("addItem merges the same product and caps at stock", () => {
  let cart = addItem([], phone());
  cart = addItem(cart, phone(), 5);
  assert.equal(cart.length, 1);
  assert.equal(cart[0].qty, 3);
});

test("addItem ignores out-of-stock products", () => {
  assert.deepEqual(addItem([], phone({ stock: 0 })), []);
});

test("setQty updates, caps, and removes at zero", () => {
  let cart = addItem([], phone());
  cart = setQty(cart, "p1", 2);
  assert.equal(cart[0].qty, 2);
  cart = setQty(cart, "p1", 99);
  assert.equal(cart[0].qty, 3);
  cart = setQty(cart, "p1", 0);
  assert.equal(cart.length, 0);
});

test("removeItem only removes the matching line", () => {
  let cart = addItem([], phone());
  cart = addItem(cart, phone({ id: "p2", slug: "s23", name: "S23" }));
  cart = removeItem(cart, "p1");
  assert.deepEqual(cart.map((i) => i.id), ["p2"]);
});

test("count and subtotal", () => {
  let cart = addItem([], phone(), 2);
  cart = addItem(cart, phone({ id: "p2", price: 50000 }), 1);
  assert.equal(cartCount(cart), 3);
  assert.equal(cartSubtotal(cart), 250000);
});

test("adding does not mutate the original cart", () => {
  const original: CartItem[] = [];
  addItem(original, phone());
  assert.equal(original.length, 0);
});

test("calcDelivery: charges below the threshold, free above or equal", () => {
  assert.equal(calcDelivery(10000, 250, 50000), 250);
  assert.equal(calcDelivery(50000, 250, 50000), 0);
  assert.equal(calcDelivery(80000, 250, 50000), 0);
  assert.equal(calcDelivery(0, 250, 50000), 0);
  assert.equal(calcDelivery(10000, 250, 0), 250);
});

test("calcTotals adds delivery to subtotal", () => {
  assert.deepEqual(calcTotals(10000, 250, 50000), { subtotal: 10000, deliveryFee: 250, total: 10250 });
  assert.deepEqual(calcTotals(60000, 250, 50000), { subtotal: 60000, deliveryFee: 0, total: 60000 });
});

test("toInt parses messy input", () => {
  assert.equal(toInt("Rs. 1,500"), 1500);
  assert.equal(toInt(""), 0);
  assert.equal(toInt(undefined, 7), 7);
  assert.equal(toInt(42), 42);
});
