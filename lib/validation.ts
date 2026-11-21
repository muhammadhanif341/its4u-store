import { PAYMENT_METHODS, type PaymentMethod } from "./constants";

export type CheckoutInput = {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
  paymentMethod: string;
};

export type CheckoutData = {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
  paymentMethod: PaymentMethod;
};

export type CheckoutResult =
  | { ok: true; data: CheckoutData }
  | { ok: false; errors: Record<string, string> };

/** Pakistani mobile numbers: 03XXXXXXXXX, 923XXXXXXXXX, +923XXXXXXXXX, 3XXXXXXXXX */
export function isValidPkMobile(phone: string): boolean {
  const digits = phone.replace(/[\s\-()+]/g, "");
  return /^(92|0)?3\d{9}$/.test(digits);
}

export function validateCheckout(input: CheckoutInput): CheckoutResult {
  const errors: Record<string, string> = {};
  const name = (input.name ?? "").trim();
  const phone = (input.phone ?? "").trim();
  const city = (input.city ?? "").trim();
  const address = (input.address ?? "").trim();
  const notes = (input.notes ?? "").trim();
  const method = PAYMENT_METHODS.find((p) => p.value === input.paymentMethod);

  if (name.length < 2) errors.name = "Please enter your full name.";
  if (!isValidPkMobile(phone)) errors.phone = "Enter a valid mobile number, e.g. 03001234567.";
  if (city.length < 2) errors.city = "Please enter your city.";
  if (address.length < 8) errors.address = "Please enter your complete delivery address.";
  if (notes.length > 500) errors.notes = "Notes can be at most 500 characters.";
  if (!method) errors.paymentMethod = "Please choose a payment method.";

  if (Object.keys(errors).length > 0 || !method) return { ok: false, errors };
  return { ok: true, data: { name, phone, city, address, notes, paymentMethod: method.value } };
}
