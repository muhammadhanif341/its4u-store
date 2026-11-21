import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { CONDITIONS, PTA_STATUSES } from "@/lib/constants";
import { CONDITION_SCORE, CONDITION_TEXT, PTA_TEXT } from "@/lib/content";
import { formatPrice, whatsappUrl } from "@/lib/format";
import { faqJsonLd, storeJsonLd, websiteJsonLd } from "@/lib/seo";
import { BUDGETS, budgetHref, buildFaqs } from "@/lib/storefront";
import { CONDITION_TONE, PTA_TONE, toneFor } from "@/lib/ui";
import { Faq } from "@/components/Faq";
import { HeroArt } from "@/components/HeroArt";
import { HowToBuy } from "@/components/HowToBuy";
import { Icon, type IconName } from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const TRUST: { icon: IconName; title: string; text: string }[] = [
  { icon: "star", title: "Condition graded", text: "Every used phone is graded from Fair to Like New, with real photos of the actual phone." },
  { icon: "shield", title: "PTA status shown", text: "PTA Approved, Non-PTA or JV is written clearly on every single phone." },
  { icon: "cash", title: "Cash on delivery", text: "Open the parcel, check the phone, then pay the rider. No advance needed." },
  { icon: "chat", title: "Real human support", text: "Questions before you buy? Message us on WhatsApp and we will help." },
];

export default async function HomePage() {
  const [settings, featured, latest, total, brandRows, cheapest, nNew, nUsed, nPta, nNonPta, nJv, brandCounts, dealRows] = await Promise.all([
    getSettings(db),
    db.product.findMany({ where: { active: true, featured: true }, orderBy: { createdAt: "desc" }, take: 4 }),
    db.product.findMany({ where: { active: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.product.count({ where: { active: true } }),
    db.product.findMany({ where: { active: true }, select: { brand: true }, distinct: ["brand"] }),
    db.product.aggregate({ where: { active: true, stock: { gt: 0 } }, _min: { price: true } }),
    db.product.count({ where: { active: true, condition: "new" } }),
    db.product.count({ where: { active: true, condition: { not: "new" } } }),
    db.product.count({ where: { active: true, ptaStatus: "pta" } }),
    db.product.count({ where: { active: true, ptaStatus: "non-pta" } }),
    db.product.count({ where: { active: true, ptaStatus: "jv" } }),
    db.product.groupBy({ by: ["brand"], where: { active: true }, _count: { _all: true }, orderBy: { brand: "asc" } }),
    db.product.findMany({ where: { active: true, stock: { gt: 0 }, oldPrice: { not: null } }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);

  const deals = dealRows.filter((p) => p.oldPrice !== null && p.oldPrice > p.price).slice(0, 4);
  const faqs = buildFaqs(settings).slice(0, 6);

  const categories: { href: string; title: string; text: string; icon: IconName; count: number }[] = [
    { href: "/shop?type=new", title: "New phones", text: "Box packed, with warranty", icon: "box", count: nNew },
    { href: "/shop?type=used", title: "Used phones", text: "Graded by condition", icon: "tag", count: nUsed },
    { href: "/shop?pta=pta", title: "PTA Approved", text: "Works on any local SIM", icon: "shield", count: nPta },
    { href: "/shop?pta=non-pta", title: "Non-PTA", text: "Lower prices", icon: "phone", count: nNonPta },
    { href: "/shop?pta=jv", title: "JV sets", text: "Ask us about network", icon: "package", count: nJv },
  ];

  const stats = [
    { value: String(total), label: total === 1 ? "phone listed" : "phones listed" },
    { value: String(brandRows.length), label: brandRows.length === 1 ? "brand" : "brands" },
    ...(cheapest._min.price ? [{ value: formatPrice(cheapest._min.price), label: "starting price" }] : []),
  ];

  return (
    <>
      <JsonLd data={storeJsonLd(settings)} />
      <JsonLd data={websiteJsonLd(settings.shopName)} />
      <JsonLd data={faqJsonLd(faqs)} />

      {/* Hero */}
      <section className="hero-mesh relative isolate overflow-hidden" aria-labelledby="hero-title">
        <div className="grid-lines absolute inset-0 -z-10" aria-hidden="true" />
        <div className="container-x grid items-center gap-8 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="animate-fade-up">
            <p className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-white">
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
              Honest condition. Clear PTA status.
            </p>
            <h1 id="hero-title" className="mt-6 text-display !text-white">
              Find your next phone. <span className="text-gradient">Know exactly</span> what you are buying.
            </h1>
            <p className="mt-6 max-w-xl text-lead !text-slate-300">
              New and used phones, graded by condition and clearly marked PTA Approved, Non-PTA or JV. See the real price and condition before you order, then pay on delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-accent !min-h-[52px] px-7 text-base">
                Shop all phones
                <Icon name="arrow" className="h-5 w-5" />
              </Link>
              <Link href="/shop?type=used" className="btn-glass !min-h-[52px] px-7 text-base">
                Browse used phones
              </Link>
            </div>
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/10 pt-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    <span className="font-display text-2xl font-bold text-white">{s.value}</span>
                    <span className="ml-2 text-sm text-slate-400">{s.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="hidden md:block">
            <HeroArt />
          </div>
        </div>
      </section>

      {/* Shop by type */}
      <section className="container-x -mt-8 relative z-10" aria-labelledby="types-title">
        <h2 id="types-title" className="sr-only">Shop by type</h2>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
          {categories.map((c) => (
            <li key={c.href} className="last:col-span-2 md:last:col-span-1">
              <Link href={c.href} className="group card flex h-full flex-col p-5 transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
                  <Icon name={c.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold transition group-hover:text-brand-700">{c.title}</h3>
                <p className="mt-1 text-sm text-muted">{c.text}</p>
                <p className="mt-auto pt-3 text-sm font-semibold text-brand-700">
                  {c.count} {c.count === 1 ? "phone" : "phones"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {brandCounts.length > 0 && (
        <section className="container-x pt-20" aria-labelledby="brands-title">
          <SectionHeading eyebrow="Top brands" title="Shop by brand" />
          <h3 id="brands-title" className="sr-only">Brands</h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {brandCounts.map((b) => (
              <li key={b.brand}>
                <Link
                  href={`/shop?brand=${encodeURIComponent(b.brand)}`}
                  className="group card flex items-center gap-3 p-4 transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink-900 font-display text-lg font-bold text-white transition group-hover:bg-brand-700" aria-hidden="true">
                    {b.brand.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink-900">{b.brand}</span>
                    <span className="text-sm text-muted">
                      {b._count._all} {b._count._all === 1 ? "phone" : "phones"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="container-x pt-20" aria-labelledby="budget-title">
        <SectionHeading eyebrow="Shop by budget" title="What can you spend?" text="Pick a price range and see every phone in it." />
        <h3 id="budget-title" className="sr-only">Price ranges</h3>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {BUDGETS.map((b, i) => (
            <li key={b.label}>
              <Link
                href={budgetHref(b)}
                className={`group flex h-full flex-col justify-between rounded-2xl p-5 text-white transition duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-6 ${
                  i % 2 === 0 ? "bg-ink-900" : "bg-gradient-to-br from-brand-600 to-brand-800"
                }`}
              >
                <span className="text-sm font-semibold text-accent-300">{b.hint}</span>
                <span className="mt-6 block font-display text-xl font-bold leading-snug sm:text-2xl">{b.label}</span>
                <span className="mt-4 flex items-center gap-1.5 text-sm font-semibold">
                  See phones
                  <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {deals.length > 0 && (
        <section className="container-x pt-20" aria-labelledby="deals-title">
          <SectionHeading eyebrow="Price drops" title="Deals right now" text="These phones are cheaper than their earlier price." href="/shop" />
          <h3 id="deals-title" className="sr-only">Phones on offer</h3>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {deals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="container-x pt-20" aria-labelledby="featured-title">
          <SectionHeading eyebrow="Hand picked" title="Featured phones" text="Our top picks right now." href="/shop" />
          <h3 id="featured-title" className="sr-only">Featured products</h3>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* How we grade */}
      <section className="container-x pt-20" aria-labelledby="grade-title">
        <div className="card grid gap-10 overflow-hidden p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow">No surprises</p>
            <h2 id="grade-title" className="section-title mt-2">
              How we grade every phone
            </h2>
            <p className="mt-4 text-lead text-body">
              Used phones are graded by us and shown with real photos. The grade is on every listing, so you always know what condition you are paying for.
            </p>
            <Link href="/policies" className="btn-ghost mt-5 -ml-3">
              Read the full rules
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
          <ul className="space-y-4">
            {CONDITIONS.map((c) => (
              <li key={c.value} className="rounded-xl border border-line p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className={`badge ${toneFor(CONDITION_TONE, c.value)}`}>{c.label}</span>
                  <span className="text-sm font-semibold text-ink-900">{CONDITION_SCORE[c.value]}/10</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400" style={{ width: `${CONDITION_SCORE[c.value] * 10}%` }} />
                </div>
                <p className="mt-2.5 text-sm text-muted">{CONDITION_TEXT[c.value]}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PTA explained */}
      <section className="container-x pt-20" aria-labelledby="pta-title">
        <SectionHeading eyebrow="Know before you buy" title="PTA Approved, Non-PTA and JV, in plain words" />
        <h3 id="pta-title" className="sr-only">PTA status explained</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {PTA_STATUSES.map((p) => (
            <Link key={p.value} href={`/shop?pta=${p.value}`} className="group card p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
              <span className={`badge ${toneFor(PTA_TONE, p.value)}`}>{p.label}</span>
              <p className="mt-4 text-[15px] leading-relaxed text-body">{PTA_TEXT[p.value]}</p>
              <p className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                See {p.label} phones
                <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest */}
      <section className="container-x pt-20" aria-labelledby="latest-title">
        <SectionHeading eyebrow="Just in" title="Latest arrivals" href="/shop" />
        <h3 id="latest-title" className="sr-only">Latest products</h3>
        {latest.length === 0 ? (
          <p className="card p-10 text-center text-muted">No phones listed yet. Please check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {latest.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* How to buy */}
      <section className="container-x pt-20" aria-labelledby="how-title">
        <SectionHeading eyebrow="Easy ordering" title="How to buy in 4 steps" text="From choosing a phone to holding it in your hand." href="/how-to-buy" hrefLabel="Full guide" />
        <h3 id="how-title" className="sr-only">How to buy</h3>
        <HowToBuy />
      </section>

      {/* Why us */}
      <section className="container-x pt-20" aria-labelledby="why-title">
        <SectionHeading eyebrow="Why shop with us" title="Buying a phone should feel safe" />
        <h3 id="why-title" className="sr-only">Our promises</h3>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <li key={t.title} className="card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name={t.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Questions */}
      <section className="container-x pt-20" aria-labelledby="faq-title">
        <SectionHeading eyebrow="Questions" title="Good to know before you order" href="/how-to-buy" hrefLabel="More answers" />
        <h3 id="faq-title" className="sr-only">Frequently asked questions</h3>
        <Faq items={faqs} />
      </section>

      {/* WhatsApp band */}
      <section className="container-x pt-20">
        <div className="hero-mesh relative overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-12">
          <h2 className="mx-auto max-w-2xl !text-white">Not sure which phone fits you?</h2>
          <p className="mx-auto mt-3 max-w-xl text-lead !text-slate-300">
            Tell us your budget and what you use your phone for. We will suggest the best options.
          </p>
          <a
            href={whatsappUrl(settings.whatsapp, `Hello ${settings.shopName}, I need help choosing a phone.`)}
            target="_blank"
            rel="noreferrer"
            className="btn-accent mt-7 !min-h-[52px] px-8 text-base"
          >
            <Icon name="chat" className="h-5 w-5" />
            Message us on WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
