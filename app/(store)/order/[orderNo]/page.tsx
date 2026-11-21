import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { paymentLabel } from "@/lib/constants";
import { formatPrice, whatsappUrl } from "@/lib/format";
import { buildOrderMessage, maskPhone } from "@/lib/order-message";
import { ClearCart } from "@/components/ClearCart";
import { Icon } from "@/components/Icons";
import { StatusTimeline } from "@/components/StatusTimeline";
import { Steps } from "@/components/Steps";

export const metadata: Metadata = { title: "Order placed", robots: { index: false, follow: false } };

type Props = { params: Promise<{ orderNo: string }> };

export default async function OrderPage({ params }: Props) {
  const { orderNo } = await params;
  const order = await db.order.findUnique({
    where: { orderNo: orderNo.toUpperCase() },
    include: { items: true },
  });
  if (!order) notFound();
  const settings = await getSettings(db);

  const waLink = whatsappUrl(settings.whatsapp, buildOrderMessage(settings.shopName, order));
  const isWhatsapp = order.paymentMethod === "whatsapp";

  return (
    <div className="container-x py-8 sm:py-12">
      <ClearCart />
      <Steps current={2} />

      <div className="mx-auto max-w-2xl">
        <div className="card p-8 text-center sm:p-10">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-tone-success-bg text-tone-success-fg">
            <Icon name="check" className="h-8 w-8" strokeWidth={2.6} />
          </span>
          <p className="eyebrow mt-5 !text-tone-success-fg">Thank you</p>
          <h1 className="mt-2">Your order has been placed</h1>
          <p className="mt-4 text-body">
            Order number{" "}
            <span className="rounded-lg bg-surface-sunken px-3 py-1.5 font-mono text-lg font-bold text-brand-800" data-testid="order-no">
              {order.orderNo}
            </span>
          </p>
          <p className="mt-3 text-sm text-muted">Save this number. You can use it with your phone number to track your order.</p>
        </div>

        <div className="card mt-5 p-6 sm:p-8">
          <StatusTimeline status={order.status} />
        </div>

        {order.status !== "cancelled" && (
          <div className={`card mt-5 p-6 sm:p-8 ${isWhatsapp ? "border-[#6EE7B7] bg-tone-success-bg" : ""}`}>
            <h2 className="text-h3">{isWhatsapp ? "One last step: send your order on WhatsApp" : "Want a faster confirmation?"}</h2>
            <p className="mt-2 text-body">
              {isWhatsapp
                ? "We will confirm your order as soon as we receive your message."
                : "We will call or message you to confirm. You can also send the details on WhatsApp."}
            </p>
            <a href={waLink} target="_blank" rel="noreferrer" className="btn-primary mt-4" data-testid="whatsapp-link">
              <Icon name="chat" className="h-5 w-5" />
              Send order on WhatsApp
            </a>
          </div>
        )}

        <div className="card mt-5 p-6 sm:p-8">
          <h2 className="text-h3">Order details</h2>
          <ul className="mt-4 divide-y divide-line text-[15px]">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 py-3">
                <span className="text-ink-900">
                  {i.name} <span className="text-muted">x{i.qty}</span>
                </span>
                <span className="font-semibold">{formatPrice(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-2 border-t border-line pt-4 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-semibold">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="font-semibold">{order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between text-lg">
              <dt className="font-semibold text-ink-900">Total</dt>
              <dd className="font-display text-xl font-bold text-ink-900">{formatPrice(order.total)}</dd>
            </div>
          </dl>
          <p className="mt-5 rounded-xl bg-surface p-4 text-sm text-body">
            <strong className="text-ink-900">{paymentLabel(order.paymentMethod)}</strong> &middot; Deliver to {order.customerName}, {order.city} &middot; {maskPhone(order.phone)}
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/shop" className="btn-outline">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
