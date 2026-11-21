"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { login, logout, requireAdmin } from "@/lib/auth";
import { OrderError, setOrderStatus } from "@/lib/orders";
import { parseProductForm } from "@/lib/product-form";
import { uniqueSlug } from "@/lib/products";
import { saveSettings } from "@/lib/settings";
import { validateSettings } from "@/lib/settings-form";

export type LoginState = { error?: string; username?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const result = await login(username, String(formData.get("password") ?? ""));
  if (!result.ok) return { error: result.error, username };
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/admin/login");
}

export type ProductFormState = {
  errors?: Record<string, string>;
  message?: string;
  values?: Record<string, string>;
};

function stringValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

export async function saveProductAction(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const values = stringValues(formData);
  const parsed = parseProductForm(values);
  if (!parsed.ok) return { errors: parsed.errors, values };

  const { images, ...rest } = parsed.data;
  const data = { ...rest, images: JSON.stringify(images) };
  const id = values.id ?? "";

  if (id) {
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) return { message: "This product no longer exists.", values };
    await db.product.update({ where: { id }, data });
  } else {
    const slug = await uniqueSlug(db, `${data.name}-${data.condition}-${data.ptaStatus}`);
    await db.product.create({ data: { ...data, slug } });
  }
  redirect("/admin/products");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await db.product.deleteMany({ where: { id } });
  redirect("/admin/products");
}

export async function toggleProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const p = await db.product.findUnique({ where: { id } });
  if (p) await db.product.update({ where: { id }, data: { active: !p.active } });
  redirect("/admin/products");
}

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  try {
    await setOrderStatus(db, id, status);
  } catch (e) {
    if (e instanceof OrderError) redirect(`/admin/orders/${id}?error=${encodeURIComponent(e.message)}`);
    throw e;
  }
  redirect(`/admin/orders/${id}?updated=1`);
}

export async function saveSettingsAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const result = validateSettings(Object.fromEntries(formData.entries()));
  if (!result.ok) redirect(`/admin/settings?error=${encodeURIComponent(result.error)}`);
  await saveSettings(db, result.data);
  redirect("/admin/settings?saved=1");
}
