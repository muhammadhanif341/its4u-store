export const CONDITIONS = [
  { value: "new", label: "New (Box Pack)", short: "New" },
  { value: "open-box", label: "Open Box", short: "Open Box" },
  { value: "like-new", label: "Like New (10/10)", short: "Like New" },
  { value: "excellent", label: "Excellent (9/10)", short: "Excellent" },
  { value: "good", label: "Good (8/10)", short: "Good" },
  { value: "fair", label: "Fair (7/10)", short: "Fair" },
] as const;

export const PTA_STATUSES = [
  { value: "pta", label: "PTA Approved" },
  { value: "non-pta", label: "Non-PTA" },
  { value: "jv", label: "JV" },
] as const;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const PAYMENT_METHODS = [
  { value: "cod", label: "Cash on Delivery" },
  { value: "whatsapp", label: "Order via WhatsApp" },
] as const;

export type ConditionValue = (typeof CONDITIONS)[number]["value"];
export type PtaValue = (typeof PTA_STATUSES)[number]["value"];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

export const DEFAULT_SETTINGS = {
  shopName: "Its4u",
  tagline: "New and used mobiles you can trust",
  whatsapp: "923000000000",
  phone: "0300 0000000",
  address: "Your city, Pakistan",
  deliveryFee: "250",
  freeDeliveryAbove: "50000",
} as const;

export type Settings = { -readonly [K in keyof typeof DEFAULT_SETTINGS]: string };

export function conditionLabel(value: string): string {
  return CONDITIONS.find((c) => c.value === value)?.label ?? value;
}

export function conditionShort(value: string): string {
  return CONDITIONS.find((c) => c.value === value)?.short ?? value;
}

export function ptaLabel(value: string): string {
  return PTA_STATUSES.find((p) => p.value === value)?.label ?? value;
}

export function paymentLabel(value: string): string {
  return PAYMENT_METHODS.find((p) => p.value === value)?.label ?? value;
}

export function isNewCondition(value: string): boolean {
  return value === "new";
}
