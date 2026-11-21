import { test } from "node:test";
import assert from "node:assert/strict";
import { parseProductForm } from "../lib/product-form";

const valid = {
  name: "iPhone 13 128GB",
  brand: "Apple",
  model: "iPhone 13",
  storage: "128GB",
  ram: "4GB",
  color: "Midnight",
  condition: "good",
  ptaStatus: "non-pta",
  batteryHealth: "88",
  price: "118,000",
  oldPrice: "125000",
  stock: "2",
  warranty: "1 month",
  description: "Nice phone",
  imei: "123456789012345",
  images: '["/uploads/a1.jpg","https://example.com/b.jpg"]',
  featured: "on",
  active: "on",
};

test("a valid form parses into typed data", () => {
  const r = parseProductForm(valid);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.data.price, 118000);
    assert.equal(r.data.oldPrice, 125000);
    assert.equal(r.data.stock, 2);
    assert.equal(r.data.batteryHealth, 88);
    assert.deepEqual(r.data.images, ["/uploads/a1.jpg", "https://example.com/b.jpg"]);
    assert.equal(r.data.featured, true);
    assert.equal(r.data.active, true);
  }
});

test("unchecked boxes and empty optional fields are fine", () => {
  const r = parseProductForm({ ...valid, featured: undefined, active: undefined, oldPrice: "", batteryHealth: "", images: "" });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.data.featured, false);
    assert.equal(r.data.active, false);
    assert.equal(r.data.oldPrice, null);
    assert.equal(r.data.batteryHealth, null);
    assert.deepEqual(r.data.images, []);
  }
});

test("required fields are reported", () => {
  const r = parseProductForm({});
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.deepEqual(
      Object.keys(r.errors).sort(),
      ["brand", "condition", "model", "name", "price", "ptaStatus", "stock"],
    );
  }
});

test("rejects bad condition, PTA status and numbers", () => {
  const r = parseProductForm({ ...valid, condition: "mint", ptaStatus: "maybe", price: "abc", stock: "-1" });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.ok(r.errors.condition && r.errors.ptaStatus && r.errors.price && r.errors.stock);
  }
});

test("price must be positive; old price must be higher than price", () => {
  assert.equal(parseProductForm({ ...valid, price: "0" }).ok, false);
  const r = parseProductForm({ ...valid, price: "100000", oldPrice: "100000" });
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.errors.oldPrice);
});

test("battery health must be 1 to 100", () => {
  assert.equal(parseProductForm({ ...valid, batteryHealth: "101" }).ok, false);
  assert.equal(parseProductForm({ ...valid, batteryHealth: "0" }).ok, false);
  assert.equal(parseProductForm({ ...valid, batteryHealth: "100" }).ok, true);
});

test("stock of zero is allowed (sold out)", () => {
  assert.equal(parseProductForm({ ...valid, stock: "0" }).ok, true);
});

test("images must be uploads or http(s) URLs, at most 8", () => {
  assert.equal(parseProductForm({ ...valid, images: '["javascript:alert(1)"]' }).ok, false);
  assert.equal(parseProductForm({ ...valid, images: '["/etc/passwd"]' }).ok, false);
  assert.equal(parseProductForm({ ...valid, images: "not json" }).ok, false);
  const nine = JSON.stringify(Array.from({ length: 9 }, (_, i) => `/uploads/${i}.jpg`));
  assert.equal(parseProductForm({ ...valid, images: nine }).ok, false);
});
