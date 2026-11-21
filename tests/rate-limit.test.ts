import { test } from "node:test";
import assert from "node:assert/strict";
import { createLimiter } from "../lib/rate-limit";

test("blocks a key after the maximum number of failures", () => {
  const l = createLimiter(3, 1000);
  assert.equal(l.isBlocked("ip", 0), false);
  l.fail("ip", 0);
  l.fail("ip", 1);
  assert.equal(l.isBlocked("ip", 2), false);
  l.fail("ip", 3);
  assert.equal(l.isBlocked("ip", 4), true);
});

test("the block lifts after the window passes", () => {
  const l = createLimiter(2, 1000);
  l.fail("ip", 0);
  l.fail("ip", 1);
  assert.equal(l.isBlocked("ip", 500), true);
  assert.equal(l.isBlocked("ip", 2000), false);
});

test("keys are independent and reset clears a key", () => {
  const l = createLimiter(1, 1000);
  l.fail("a", 0);
  assert.equal(l.isBlocked("a", 1), true);
  assert.equal(l.isBlocked("b", 1), false);
  l.reset("a");
  assert.equal(l.isBlocked("a", 2), false);
});
