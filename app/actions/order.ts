"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { createOrder, OrderError, type OrderLine } from "@/lib/orders";
import { toInt } from "@/lib/pricing";
import { validateCheckout } from "@/lib/validation";

export type CheckoutState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

function parseCart(raw: FormDataEntryValue | null): OrderLine[] | null {
  try {
    const parsed = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(parsed)) return null;
    const lines: OrderLine[] = [];
    for (const row of parsed) {
      if (row && typeof row.id === "string" && Number.isFinite(Number(row.qty))) {
        lines.push({ id: row.id, qty: Number(row.qty) });
      }
    }
    return lines;
  } catch {
    return null;
  }
}

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    city: String(formData.get("city") ?? ""),
    address: String(formData.get("address") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    paymentMethod: String(formData.get("paymentMethod") ?? ""),
  };

  const parsed = validateCheckout(values);
  if (!parsed.ok) return { fieldErrors: parsed.errors, values };

  const lines = parseCart(formData.get("cart"));
  if (!lines) return { error: "Your cart could not be read. Please refresh and try again.", values };

  const settings = await getSettings(db);
  let orderNo: string;
  try {
    const order = await createOrder(db, parsed.data, lines, {
      deliveryFee: toInt(settings.deliveryFee),
      freeAbove: toInt(settings.freeDeliveryAbove),
    });
    orderNo = order.orderNo;
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message, values };
    throw e;
  }

  redirect(`/order/${orderNo}`);
}
