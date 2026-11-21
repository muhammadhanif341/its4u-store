import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatPrice,
  slugify,
  makeOrderNo,
  toWhatsappNumber,
  whatsappUrl,
  parseImages,
  discountPercent,
} from "../lib/format";
import { conditionLabel, ptaLabel, paymentLabel, isNewCondition } from "../lib/constants";

test("formatPrice adds Rs. prefix and thousands separators", () => {
  assert.equal(formatPrice(150000), "Rs. 150,000");
  assert.equal(formatPrice(0), "Rs. 0");
  assert.equal(formatPrice(NaN), "Rs. 0");
});

test("slugify makes url-safe slugs", () => {
  assert.equal(slugify("iPhone 13 Pro Max (256GB)"), "iphone-13-pro-max-256gb");
  assert.equal(slugify("  --Hello__World--  "), "hello-world");
  assert.equal(slugify("Samsung Galaxy S23+"), "samsung-galaxy-s23");
});

test("makeOrderNo has the ORD- prefix and 6 safe characters", () => {
  for (let i = 0; i < 50; i++) {
    assert.match(makeOrderNo(), /^ORD-[A-HJ-NP-Z2-9]{6}$/);
  }
});

test("makeOrderNo is deterministic with a fixed random source", () => {
  assert.equal(makeOrderNo(() => 0), "ORD-AAAAAA");
});

test("toWhatsappNumber converts local numbers to international digits", () => {
  assert.equal(toWhatsappNumber("0300 1234567"), "923001234567");
  assert.equal(toWhatsappNumber("+92 300 1234567"), "923001234567");
  assert.equal(toWhatsappNumber("923001234567"), "923001234567");
  assert.equal(toWhatsappNumber("00923001234567"), "923001234567");
});

test("whatsappUrl encodes the message", () => {
  const url = whatsappUrl("03001234567", "Hi there & welcome");
  assert.equal(url, "https://wa.me/923001234567?text=Hi%20there%20%26%20welcome");
});

test("parseImages tolerates bad input", () => {
  assert.deepEqual(parseImages('["a.jpg","b.jpg"]'), ["a.jpg", "b.jpg"]);
  assert.deepEqual(parseImages("not json"), []);
  assert.deepEqual(parseImages('{"a":1}'), []);
  assert.deepEqual(parseImages('["a.jpg",5,""]'), ["a.jpg"]);
});

test("discountPercent", () => {
  assert.equal(discountPercent(80000, 100000), 20);
  assert.equal(discountPercent(100000, 100000), 0);
  assert.equal(discountPercent(100000, null), 0);
  assert.equal(discountPercent(120000, 100000), 0);
});

test("label helpers fall back to the raw value", () => {
  assert.equal(conditionLabel("like-new"), "Like New (10/10)");
  assert.equal(conditionLabel("weird"), "weird");
  assert.equal(ptaLabel("jv"), "JV");
  assert.equal(ptaLabel("non-pta"), "Non-PTA");
  assert.equal(paymentLabel("cod"), "Cash on Delivery");
  assert.equal(isNewCondition("new"), true);
  assert.equal(isNewCondition("good"), false);
});
