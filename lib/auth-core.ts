import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function hmac(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function createToken(secret: string, ttlMs: number, now: number = Date.now()): string {
  const exp = String(now + ttlMs);
  return `${exp}.${hmac(secret, exp)}`;
}

export function verifyToken(secret: string, token: string | undefined, now: number = Date.now()): boolean {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  const expected = hmac(secret, exp);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const expNum = Number(exp);
  return Number.isFinite(expNum) && expNum > now;
}

/** Constant-time string comparison (hashes first so the lengths always match). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(input: string, expected: string): boolean {
  if (!expected) return false;
  return safeEqual(input, expected);
}

/**
 * Admin sign-in: both the username and the password must match.
 * The username is not case sensitive. Both checks always run, so the time taken
 * does not reveal which of the two was wrong.
 */
export function checkCredentials(
  inputUser: string,
  inputPass: string,
  expectedUser: string,
  expectedPass: string,
): boolean {
  if (!expectedUser.trim() || !expectedPass) return false;
  const userOk = safeEqual(inputUser.trim().toLowerCase(), expectedUser.trim().toLowerCase());
  const passOk = safeEqual(inputPass, expectedPass);
  return userOk && passOk;
}
