import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSettings } from "../lib/settings-form";
import { detectImageType, isSafeUploadName, mimeForName } from "../lib/upload";

const good = {
  shopName: "Its4u",
  tagline: "Trusted mobiles",
  whatsapp: "0300 1234567",
  phone: "0300 1234567",
  address: "Lahore",
  deliveryFee: "250",
  freeDeliveryAbove: "50,000",
};

test("validateSettings accepts good values and normalises numbers", () => {
  const r = validateSettings(good);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.data.whatsapp, "923001234567");
    assert.equal(r.data.freeDeliveryAbove, "50000");
    assert.equal(r.data.deliveryFee, "250");
  }
});

test("validateSettings rejects bad input with a clear message", () => {
  assert.match(String((validateSettings({ ...good, shopName: "A" }) as { error: string }).error), /Shop name/);
  assert.match(String((validateSettings({ ...good, whatsapp: "123" }) as { error: string }).error), /WhatsApp/);
  assert.match(String((validateSettings({ ...good, deliveryFee: "abc" }) as { error: string }).error), /Delivery fee/);
  assert.match(String((validateSettings({ ...good, freeDeliveryAbove: "-5" }) as { error: string }).error), /Free delivery/);
  assert.equal(validateSettings({ ...good, tagline: "x".repeat(121) }).ok, false);
});

test("zero turns free delivery off and is accepted", () => {
  const r = validateSettings({ ...good, freeDeliveryAbove: "0" });
  assert.equal(r.ok, true);
});

test("detectImageType recognises jpg, png and webp by their first bytes", () => {
  assert.equal(detectImageType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))?.ext, "jpg");
  assert.equal(detectImageType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))?.ext, "png");
  const webp = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
  assert.equal(detectImageType(webp)?.ext, "webp");
});

test("detectImageType rejects other files", () => {
  assert.equal(detectImageType(new TextEncoder().encode("<html><script>alert(1)</script>")), null);
  assert.equal(detectImageType(Uint8Array.from([0x4d, 0x5a, 0x90, 0x00])), null); // Windows .exe
  assert.equal(detectImageType(new Uint8Array(0)), null);
  assert.equal(detectImageType(Uint8Array.from([0xff, 0xd8])), null);
});

test("isSafeUploadName blocks path tricks", () => {
  assert.equal(isSafeUploadName("3f2a-91bc.jpg"), true);
  assert.equal(isSafeUploadName("../secret.jpg"), false);
  assert.equal(isSafeUploadName("..%2Fsecret.jpg"), false);
  assert.equal(isSafeUploadName("a/b.jpg"), false);
  assert.equal(isSafeUploadName("a.jpg.exe"), false);
  assert.equal(isSafeUploadName("a.svg"), false);
  assert.equal(isSafeUploadName(""), false);
});

test("mimeForName", () => {
  assert.equal(mimeForName("a.png"), "image/png");
  assert.equal(mimeForName("a.webp"), "image/webp");
  assert.equal(mimeForName("a.jpg"), "image/jpeg");
});
