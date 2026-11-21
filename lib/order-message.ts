import { formatPrice } from "./format";
import { paymentLabel } from "./constants";

type MessageOrder = {
  orderNo: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: { name: string; price: number; qty: number }[];
};

/** The text a customer sends to the shop on WhatsApp to confirm an order. */
export function buildOrderMessage(shopName: string, order: MessageOrder): string {
  const lines = [
    `Hello ${shopName}, I placed order ${order.orderNo}.`,
    "",
    "Items:",
    ...order.items.map((i) => `- ${i.name} x${i.qty} = ${formatPrice(i.price * i.qty)}`),
    "",
    `Subtotal: ${formatPrice(order.subtotal)}`,
    `Delivery: ${order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}`,
    `Total: ${formatPrice(order.total)}`,
    `Payment: ${paymentLabel(order.paymentMethod)}`,
    "",
    `Name: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `City: ${order.city}`,
    `Address: ${order.address}`,
  ];
  return lines.join("\n");
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `${"*".repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}`;
}
