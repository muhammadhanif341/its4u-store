/**
 * Content for the "how to buy" parts of the shop: the steps, the budget shortcuts and the questions
 * customers ask most. It lives in one place so the home page, the how-to-buy page and the search
 * engine data all say exactly the same thing.
 */
import type { IconName } from "../components/Icons";
import { PTA_TEXT } from "./content";
import { formatPrice } from "./format";
import type { Settings } from "./constants";
import { toInt } from "./pricing";

export type Step = { icon: IconName; title: string; text: string };

export const HOW_TO_BUY: Step[] = [
  { icon: "search", title: "Choose your phone", text: "Browse by brand, budget, condition or PTA status. Every phone shows its real condition and price." },
  { icon: "cart", title: "Add to cart", text: "Check the details, then add the phone to your cart. You can keep shopping or go straight to checkout." },
  { icon: "orders", title: "Enter your details", text: "Type your name, phone number and delivery address. Pick Cash on Delivery or send the order on WhatsApp." },
  { icon: "truck", title: "Receive and pay", text: "We confirm your order and deliver it. Check the phone when it arrives, then pay the rider." },
];

export type Budget = { label: string; hint: string; minPrice?: number; maxPrice?: number };

export const BUDGETS: Budget[] = [
  { label: "Under Rs. 50,000", hint: "Budget friendly", maxPrice: 50000 },
  { label: "Rs. 50,000 to 100,000", hint: "Best value", minPrice: 50000, maxPrice: 100000 },
  { label: "Rs. 100,000 to 200,000", hint: "Upper mid-range", minPrice: 100000, maxPrice: 200000 },
  { label: "Above Rs. 200,000", hint: "Flagships", minPrice: 200000 },
];

export function budgetHref(b: Budget): string {
  const params = new URLSearchParams();
  if (b.minPrice) params.set("minPrice", String(b.minPrice));
  if (b.maxPrice) params.set("maxPrice", String(b.maxPrice));
  return `/shop?${params.toString()}`;
}

/** A short checklist for the moment the rider hands over the parcel. */
export const CHECK_ON_DELIVERY = [
  "The phone model, storage and colour match what you ordered.",
  "The IMEI on the box (dial *#06# on the phone) matches the IMEI on the phone.",
  "The screen, buttons, cameras and charging port work, and the body looks as described.",
  "For used phones: the battery health and condition match the listing.",
  "Ask for your order number and keep the box and bill until you are happy.",
];

export type Faq = { q: string; a: string };

export function buildFaqs(settings: Pick<Settings, "deliveryFee" | "freeDeliveryAbove" | "shopName">): Faq[] {
  const fee = toInt(settings.deliveryFee);
  const free = toInt(settings.freeDeliveryAbove);
  const delivery =
    fee > 0
      ? `Delivery costs ${formatPrice(fee)}${free > 0 ? ` and is free on orders above ${formatPrice(free)}` : ""}. You see the exact delivery charge in your cart before you order.`
      : "Delivery is free. You see the total in your cart before you order.";
  return [
    {
      q: "How do I order a phone?",
      a: "Open the phone you like, press Add to cart, then go to checkout. Enter your name, phone number and address, and confirm. You will get an order number straight away.",
    },
    {
      q: "Can I pay when the phone arrives?",
      a: "Yes. Choose Cash on Delivery at checkout. Check the phone when the rider arrives, then pay. No advance payment is needed.",
    },
    {
      q: "What do PTA Approved, Non-PTA and JV mean?",
      a: `PTA Approved: ${PTA_TEXT.pta} Non-PTA: ${PTA_TEXT["non-pta"]} JV: ${PTA_TEXT.jv}`,
    },
    {
      q: "How are used phones graded?",
      a: "Every used phone gets a grade from Fair to Like New. The grade is written on the listing along with the battery health, so you know the condition before you pay. The full list is on the Warranty and returns page.",
    },
    { q: "How much is delivery?", a: delivery },
    {
      q: "How can I track my order?",
      a: "Open Track order, then enter your order number and the phone number you used when ordering.",
    },
    {
      q: "Is there a warranty or a return option?",
      a: "Warranty is shown on each phone. Our terms for warranty and returns are on the Warranty and returns page. If you are unsure about anything, message us on WhatsApp before you order.",
    },
    {
      q: "Can I ask questions before buying?",
      a: `Yes. Message ${settings.shopName} on WhatsApp or call us. Tell us your budget and what you use your phone for, and we will suggest the best options.`,
    },
  ];
}
