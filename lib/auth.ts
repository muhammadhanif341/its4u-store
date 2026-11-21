import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkCredentials, createToken, verifyToken } from "./auth-core";
import { createLimiter } from "./rate-limit";

const COOKIE = "its4u_admin";
const TTL_MS = 1000 * 60 * 60 * 12;

const globalForLimiter = globalThis as unknown as { loginLimiter?: ReturnType<typeof createLimiter> };
const limiter = (globalForLimiter.loginLimiter ??= createLimiter());

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set. Add it to your .env file.");
  return s;
}

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  return verifyToken(secret(), token);
}

/** Call at the top of every admin page, action and API route. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(username: string, password: string): Promise<LoginResult> {
  const key = await clientKey();
  if (limiter.isBlocked(key)) {
    return { ok: false, error: "Too many attempts. Please wait 15 minutes and try again." };
  }
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD ?? "";
  if (!checkCredentials(username, password, expectedUser, expectedPass)) {
    limiter.fail(key);
    return { ok: false, error: "Wrong username or password." };
  }
  limiter.reset(key);
  (await cookies()).set(COOKIE, createToken(secret(), TTL_MS), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
  return { ok: true };
}

export async function logout(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
