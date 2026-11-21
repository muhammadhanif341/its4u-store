import type { Settings } from "./constants";
import { toWhatsappNumber } from "./format";

export type SettingsResult = { ok: true; data: Settings } | { ok: false; error: string };

type Raw = Record<string, FormDataEntryValue | null | undefined>;

const text = (raw: Raw, key: string) => String(raw[key] ?? "").trim();

function amount(value: string): number {
  return /^\d+$/.test(value.replace(/[,\s]/g, "")) ? parseInt(value.replace(/[,\s]/g, ""), 10) : NaN;
}

export function validateSettings(raw: Raw): SettingsResult {
  const shopName = text(raw, "shopName");
  const tagline = text(raw, "tagline");
  const phone = text(raw, "phone");
  const address = text(raw, "address");
  const whatsapp = toWhatsappNumber(text(raw, "whatsapp"));
  const deliveryFee = amount(text(raw, "deliveryFee"));
  const freeAbove = amount(text(raw, "freeDeliveryAbove"));

  if (shopName.length < 2 || shopName.length > 40) return { ok: false, error: "Shop name must be 2 to 40 characters." };
  if (tagline.length > 120) return { ok: false, error: "Tagline is too long (120 characters at most)." };
  if (!/^\d{10,15}$/.test(whatsapp)) return { ok: false, error: "Enter a valid WhatsApp number, e.g. 03001234567." };
  if (phone.length > 30) return { ok: false, error: "Phone number is too long." };
  if (address.length > 200) return { ok: false, error: "Address is too long." };
  if (Number.isNaN(deliveryFee)) return { ok: false, error: "Delivery fee must be a whole number." };
  if (Number.isNaN(freeAbove)) return { ok: false, error: "Free delivery amount must be a whole number (0 turns it off)." };

  return {
    ok: true,
    data: {
      shopName,
      tagline,
      whatsapp,
      phone,
      address,
      deliveryFee: String(deliveryFee),
      freeDeliveryAbove: String(freeAbove),
    },
  };
}
