import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { toInt } from "@/lib/pricing";
import { formatPrice, whatsappUrl } from "@/lib/format";
import { breadcrumbJsonLd, faqJsonLd, howToJsonLd } from "@/lib/seo";
import { CHECK_ON_DELIVERY, HOW_TO_BUY, buildFaqs } from "@/lib/storefront";
import { Faq } from "@/components/Faq";
import { HowToBuy } from "@/components/HowToBuy";
import { Icon } from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeading } from "@/components/SectionHeading";

export const metadata: Metadata = {
  title: "How to Buy",
  description:
    "How to buy a phone from Its4u in four easy steps: choose, add to cart, enter your details and pay on delivery. Payment, delivery and what to check when the parcel arrives.",
  alternates: { canonical: "/how-to-buy" },
};

export default async function HowToBuyPage() {
  const settings = await getSettings(db);
  const faqs = buildFaqs(settings);
  const fee = toInt(settings.deliveryFee);
  const free = toInt(settings.freeDeliveryAbove);

  const payment = [
    { icon: "cash" as const, title: "Cash on Delivery", text: "Pay the rider in cash after you have checked the phone. No advance payment." },
    { icon: "chat" as const, title: "Order on WhatsApp", text: "Prefer to talk first? Send your order on WhatsApp and we will confirm every detail with you." },
  ];

  return (
    <>
      <JsonLd data={howToJsonLd("How to buy a phone", HOW_TO_BUY)} />
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "How to buy", path: "/how-to-buy" }])} />

      <section className="hero-mesh relative isolate overflow-hidden">
        <div className="grid-lines absolute inset-0 -z-10" aria-hidden="true" />
        <div className="container-x py-14 sm:py-20">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-300">
            <Link href="/" className="hover:text-white">Home</Link>
            <span aria-hidden="true"> / </span>
            <span className="text-white">How to buy</span>
          </nav>
          <h1 className="mt-4 max-w-3xl !text-white">How to buy a phone from {settings.shopName}</h1>
          <p className="mt-4 max-w-2xl text-lead !text-slate-300">
            Four simple steps. You see the real price and condition first, and you pay only when the phone is in your hand.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-accent !min-h-[52px] px-7 text-base">
              Start shopping
              <Icon name="arrow" className="h-5 w-5" />
            </Link>
            <Link href="/track" className="btn-glass !min-h-[52px] px-7 text-base">Track an order</Link>
          </div>
        </div>
      </section>

      <div className="container-x space-y-20 py-16">
        <section aria-labelledby="steps-title">
          <SectionHeading eyebrow="Step by step" title="Order in four steps" />
          <h3 id="steps-title" className="sr-only">The four steps</h3>
          <HowToBuy headingLevel="h3" />
        </section>

        <section aria-labelledby="pay-title">
          <SectionHeading eyebrow="Payment and delivery" title="How you pay and how it reaches you" />
          <h3 id="pay-title" className="sr-only">Payment and delivery</h3>
          <div className="grid gap-4 lg:grid-cols-3">
            {payment.map((p) => (
              <div key={p.title} className="card p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon name={p.icon} className="h-5 w-5" />
                </span>
                <h4 className="mt-4 text-base font-semibold">{p.title}</h4>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{p.text}</p>
              </div>
            ))}
            <div className="card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name="truck" className="h-5 w-5" />
              </span>
              <h4 className="mt-4 text-base font-semibold">Delivery across Pakistan</h4>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                {fee > 0
                  ? `Delivery is ${formatPrice(fee)}${free > 0 ? `, and free above ${formatPrice(free)}` : ""}. We tell you the delivery time for your city when we confirm the order.`
                  : "Delivery is free. We tell you the delivery time for your city when we confirm the order."}
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="check-title" className="card grid gap-8 p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow">When the parcel arrives</p>
            <h2 id="check-title" className="section-title mt-2">Check these before you pay</h2>
            <p className="mt-4 text-lead text-body">A minute of checking keeps you safe. Do it with the rider present.</p>
          </div>
          <ul className="space-y-3">
            {CHECK_ON_DELIVERY.map((item) => (
              <li key={item} className="flex gap-3 rounded-xl border border-line p-4 text-[15px] leading-relaxed text-ink-800">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-tone-success-bg text-tone-success-fg">
                  <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.8} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="faq-title">
          <SectionHeading eyebrow="Questions" title="Frequently asked questions" />
          <h3 id="faq-title" className="sr-only">Frequently asked questions</h3>
          <Faq items={faqs} />
        </section>

        <section className="hero-mesh relative overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-12">
          <h2 className="mx-auto max-w-2xl !text-white">Still have a question?</h2>
          <p className="mx-auto mt-3 max-w-xl text-lead !text-slate-300">We reply on WhatsApp. Ask about a phone, its condition or delivery to your city.</p>
          <a
            href={whatsappUrl(settings.whatsapp, `Hello ${settings.shopName}, I have a question about ordering.`)}
            target="_blank"
            rel="noreferrer"
            className="btn-accent mt-7 !min-h-[52px] px-8 text-base"
          >
            <Icon name="chat" className="h-5 w-5" />
            Message us on WhatsApp
          </a>
        </section>
      </div>
    </>
  );
}
