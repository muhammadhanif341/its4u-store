import { test } from "node:test";
import assert from "node:assert/strict";
import { createToken, verifyToken, checkPassword, checkCredentials, safeEqual } from "../lib/auth-core";

const SECRET = "test-secret";

test("a fresh token verifies", () => {
  const t = createToken(SECRET, 60_000, 1_000);
  assert.equal(verifyToken(SECRET, t, 2_000), true);
});

test("an expired token fails", () => {
  const t = createToken(SECRET, 1_000, 1_000);
  assert.equal(verifyToken(SECRET, t, 5_000), false);
});

test("a token signed with another secret fails", () => {
  const t = createToken("other", 60_000, 1_000);
  assert.equal(verifyToken(SECRET, t, 2_000), false);
});

test("a tampered expiry fails", () => {
  const t = createToken(SECRET, 1_000, 1_000);
  const [, sig] = t.split(".");
  assert.equal(verifyToken(SECRET, `99999999999999.${sig}`, 2_000), false);
});

test("missing or malformed tokens fail", () => {
  assert.equal(verifyToken(SECRET, undefined), false);
  assert.equal(verifyToken(SECRET, ""), false);
  assert.equal(verifyToken(SECRET, "abc"), false);
  assert.equal(verifyToken(SECRET, "abc."), false);
});

test("checkPassword", () => {
  assert.equal(checkPassword("secret", "secret"), true);
  assert.equal(checkPassword("Secret", "secret"), false);
  assert.equal(checkPassword("", "secret"), false);
  assert.equal(checkPassword("anything", ""), false);
});

test("safeEqual compares strings of any length", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("abc", "abcd"), false);
  assert.equal(safeEqual("", ""), true);
});

test("checkCredentials needs both the right username and the right password", () => {
  assert.equal(checkCredentials("admin", "s3cret!", "admin", "s3cret!"), true);
  assert.equal(checkCredentials("admin", "wrong", "admin", "s3cret!"), false);
  assert.equal(checkCredentials("someone", "s3cret!", "admin", "s3cret!"), false);
  assert.equal(checkCredentials("someone", "wrong", "admin", "s3cret!"), false);
});

test("the username is not case sensitive and ignores surrounding spaces, the password is case sensitive", () => {
  assert.equal(checkCredentials("  ADMIN ", "s3cret!", "admin", "s3cret!"), true);
  assert.equal(checkCredentials("admin", "S3CRET!", "admin", "s3cret!"), false);
});

test("empty input never signs in", () => {
  assert.equal(checkCredentials("", "", "admin", "s3cret!"), false);
  assert.equal(checkCredentials("admin", "", "admin", "s3cret!"), false);
  assert.equal(checkCredentials("", "s3cret!", "admin", "s3cret!"), false);
});

test("a server with no password configured refuses every login", () => {
  assert.equal(checkCredentials("admin", "", "admin", ""), false);
  assert.equal(checkCredentials("", "", "", ""), false);
  assert.equal(checkCredentials("admin", "x", "  ", "x"), false);
});
