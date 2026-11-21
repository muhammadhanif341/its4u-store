import { test } from "node:test";
import assert from "node:assert/strict";
import { buildOrderMessage, maskPhone } from "../lib/order-message";

const order = {
  orderNo: "ORD-ABC234",
  customerName: "Ali Khan",
  phone: "03001234567",
  city: "Lahore",
  address: "House 12, Model Town",
  paymentMethod: "cod",
  subtotal: 100000,
  deliveryFee: 250,
  total: 100250,
  items: [{ name: "iPhone 13", price: 100000, qty: 1 }],
};

test("order message contains order number, items, totals and address", () => {
  const msg = buildOrderMessage("Its4u", order);
  assert.match(msg, /^Hello Its4u, I placed order ORD-ABC234\./);
  assert.match(msg, /- iPhone 13 x1 = Rs\. 100,000/);
  assert.match(msg, /Delivery: Rs\. 250/);
  assert.match(msg, /Total: Rs\. 100,250/);
  assert.match(msg, /Payment: Cash on Delivery/);
  assert.match(msg, /Address: House 12, Model Town/);
});

test("free delivery is written as Free", () => {
  const msg = buildOrderMessage("Its4u", { ...order, deliveryFee: 0, total: 100000 });
  assert.match(msg, /Delivery: Free/);
});

test("maskPhone keeps only the last four digits", () => {
  assert.equal(maskPhone("03001234567"), "*******4567");
  assert.equal(maskPhone("12"), "****");
});
