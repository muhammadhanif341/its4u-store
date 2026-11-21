import { test, after } from "node:test";
import assert from "node:assert/strict";
import { makeTestDb } from "./db-helper";
import { mergeSettings, getSettings, saveSettings } from "../lib/settings";
import { DEFAULT_SETTINGS } from "../lib/constants";

const t = makeTestDb("settings");
const db = t.client;

after(async () => {
  await t.cleanup();
});

test("shop name defaults to Its4u", () => {
  assert.equal(DEFAULT_SETTINGS.shopName, "Its4u");
});

test("mergeSettings overrides defaults, ignores blanks and unknown keys", () => {
  const s = mergeSettings([
    { key: "shopName", value: "Its4u Lahore" },
    { key: "phone", value: "  " },
    { key: "hacker", value: "x" },
  ]);
  assert.equal(s.shopName, "Its4u Lahore");
  assert.equal(s.phone, DEFAULT_SETTINGS.phone);
  assert.equal("hacker" in s, false);
});

test("saveSettings persists and getSettings reads back", async () => {
  assert.equal((await getSettings(db)).shopName, "Its4u");
  await saveSettings(db, { shopName: "  Its4u Mobiles  ", deliveryFee: "300" });
  const s = await getSettings(db);
  assert.equal(s.shopName, "Its4u Mobiles");
  assert.equal(s.deliveryFee, "300");
  // saving again updates instead of failing on the unique key
  await saveSettings(db, { deliveryFee: "400" });
  assert.equal((await getSettings(db)).deliveryFee, "400");
});
