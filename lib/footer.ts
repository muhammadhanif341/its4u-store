/** Links shown in the footer. Kept here so they can be tested against the real shop filters. */

export const SHOP_LINKS = [
  { href: "/shop", label: "All phones" },
  { href: "/shop?type=new", label: "New phones" },
  { href: "/shop?type=used", label: "Used phones" },
  { href: "/shop?pta=pta", label: "PTA Approved" },
  { href: "/shop?pta=non-pta", label: "Non-PTA" },
  { href: "/shop?pta=jv", label: "JV sets" },
] as const;

export const HELP_LINKS = [
  { href: "/how-to-buy", label: "How to buy" },
  { href: "/track", label: "Track your order" },
  { href: "/policies", label: "Warranty and returns" },
] as const;

/** "0300 1234567" or "+92 300 1234567" becomes a link that starts a phone call. */
export function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return `tel:${digits}`;
}

/** Shows an international number the way people read it: 923001234567 becomes +92 300 1234567. */
export function prettyWhatsapp(number: string): string {
  const d = number.replace(/\D/g, "");
  if (d.startsWith("92") && d.length === 12) return `+92 ${d.slice(2, 5)} ${d.slice(5)}`;
  return d ? `+${d}` : "";
}

/** Only real web links are used for the optional credit link in the footer. */
export function safeCreditUrl(value: string | undefined): string | null {
  const v = (value ?? "").trim();
  return /^https?:\/\/[^\s"'<>]+$/i.test(v) ? v : null;
}
