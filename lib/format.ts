export function formatPrice(amount: number): string {
  const n = Math.round(Number.isFinite(amount) ? amount : 0);
  return `Rs. ${n.toLocaleString("en-US")}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const ORDER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeOrderNo(random: () => number = Math.random): string {
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += ORDER_ALPHABET[Math.floor(random() * ORDER_ALPHABET.length)];
  }
  return `ORD-${out}`;
}

/** Digits only, with Pakistan country code (92) for wa.me links. */
export function toWhatsappNumber(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = "92" + digits.slice(1);
  return digits;
}

export function whatsappUrl(number: string, text: string): string {
  return `https://wa.me/${toWhatsappNumber(number)}?text=${encodeURIComponent(text)}`;
}

export function parseImages(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string" && x.length > 0)
      : [];
  } catch {
    return [];
  }
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function discountPercent(price: number, oldPrice: number | null | undefined): number {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
