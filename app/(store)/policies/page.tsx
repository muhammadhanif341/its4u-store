import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { CONDITIONS, PTA_STATUSES } from "@/lib/constants";
import { CONDITION_TEXT, PTA_TEXT } from "@/lib/content";
import { CONDITION_TONE, PTA_TONE, toneFor } from "@/lib/ui";
import { Icon, type IconName } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Terms, warranty and returns",
  description: "How we grade phones, what PTA Approved, Non-PTA and JV mean, and our rules for orders, delivery, warranty and returns.",
  alternates: { canonical: "/policies" },
};

function Block({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6 sm:p-8">
      <h2 className="flex items-center gap-3 text-h3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-body">
          <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-brand-600" strokeWidth={2.6} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function PoliciesPage() {
  const s = await getSettings(db);
  return (
    <div className="container-x py-10 sm:py-14">
      <article className="mx-auto max-w-3xl space-y-6">
        <header className="pb-4">
          <p className="eyebrow">The fine print, made clear</p>
          <h1 className="mt-2">Terms, warranty and returns</h1>
          <p className="mt-4 text-lead text-body">
            These rules apply to every order placed on the {s.shopName} website. Placing an order means you accept them.
          </p>
        </header>

        <Block icon="star" title="Phone condition">
          <ul className="divide-y divide-line rounded-xl border border-line">
            {CONDITIONS.map((c) => (
              <li key={c.value} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-6">
                <span className="sm:w-48">
                  <span className={`badge ${toneFor(CONDITION_TONE, c.value)}`}>{c.label}</span>
                </span>
                <span className="text-[15px] text-body">{CONDITION_TEXT[c.value]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[15px] text-muted">
            Used phones are graded by {s.shopName}. Photos of used phones show the actual phone you will receive.
          </p>
        </Block>

        <Block icon="shield" title="PTA status">
          <ul className="divide-y divide-line rounded-xl border border-line">
            {PTA_STATUSES.map((p) => (
              <li key={p.value} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-6">
                <span className="sm:w-48">
                  <span className={`badge ${toneFor(PTA_TONE, p.value)}`}>{p.label}</span>
                </span>
                <span className="text-[15px] text-body">{PTA_TEXT[p.value]}</span>
              </li>
            ))}
          </ul>
        </Block>

        <Block icon="tag" title="Prices and stock">
          <Bullets
            items={[
              "All prices are in Pakistani rupees (Rs.) and may change with the market. The price shown when you order is the price you pay.",
              "Stock is limited. If a phone sells out before your order is confirmed, we will tell you right away.",
              "If a price or detail on the website is wrong, we may correct it before confirming your order and will let you know.",
            ]}
          />
        </Block>

        <Block icon="orders" title="Ordering and payment">
          <Bullets
            items={[
              "Place your order on the website. You get an order number, and we confirm by phone or WhatsApp. Until then the order stays pending.",
              "You can pay by Cash on Delivery or send your order to us on WhatsApp.",
              "You can cancel an order any time before it is shipped.",
              "We may block numbers that repeatedly place fake or prank orders.",
            ]}
          />
        </Block>

        <Block icon="truck" title="Delivery">
          <Bullets
            items={[
              `Delivery charge: Rs. ${Number(s.deliveryFee).toLocaleString("en-US")}. Free delivery on orders of Rs. ${Number(s.freeDeliveryAbove).toLocaleString("en-US")} or more.`,
              "Please open the parcel in front of the rider and check the phone, box, accessories and IMEI before paying. Recording a video while opening is a good idea.",
              "If we cannot reach you or the address is wrong, the courier may try again, after which the order can be returned to us.",
            ]}
          />
        </Block>

        <Block icon="box" title="Warranty and returns">
          <Bullets
            items={[
              "Each phone page shows the warranty that comes with that phone.",
              "A replacement or return needs the original box, accessories and bill, and the IMEI must match the one we delivered.",
              "Warranty does not cover water damage, a cracked screen or body from drops, repairs done elsewhere, broken seals, a changed IMEI, or damage from wrong chargers or misuse.",
              "We may not accept returns of used, opened or Non-PTA phones just because you changed your mind.",
              "When a refund is due it is returned to you within a few working days.",
            ]}
          />
        </Block>

        <Block icon="lock" title="Your data">
          <p className="text-[15px] leading-relaxed text-body">
            We only collect your name, phone number, address and order details to deliver your order. We do not sell or share them, except with the courier for delivery. You can ask us to delete your data at any time.
          </p>
        </Block>

        <Block icon="chat" title="Contact and complaints">
          <p className="text-[15px] leading-relaxed text-body">
            Phone {s.phone}, WhatsApp +{s.whatsapp}. {s.address}. Please include your order number in any complaint.
          </p>
        </Block>
      </article>
    </div>
  );
}
