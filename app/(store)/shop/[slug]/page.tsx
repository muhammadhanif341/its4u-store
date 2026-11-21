import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { toInt } from "@/lib/pricing";
import { conditionLabel, ptaLabel } from "@/lib/constants";
import { CONDITION_SCORE, CONDITION_TEXT, PTA_NOTES, PTA_TEXT } from "@/lib/content";
import { formatDate, formatPrice, parseImages, whatsappUrl } from "@/lib/format";
import { absoluteUrl, breadcrumbJsonLd, productDescription, productJsonLd } from "@/lib/seo";
import { ConditionBadge, PtaBadge } from "@/components/Badges";
import { Icon, type IconName } from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { ProductCard } from "@/components/ProductCard";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { BuyPanel } from "@/components/product/BuyPanel";
import { MediaPanel } from "@/components/product/MediaPanel";
import { Meter, Panel } from "@/components/product/Panel";
import { SectionNav } from "@/components/product/SectionNav";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await db.product.findUnique({ where: { slug } });
  if (!p || !p.active) return { title: "Phone not found", robots: { index: false } };

  const images = parseImages(p.images);
  const description = productDescription({ ...p, images });
  const title = `${p.name} (${conditionLabel(p.condition)}, ${ptaLabel(p.ptaStatus)})`;
  return {
    title,
    description,
    alternates: { canonical: `/shop/${p.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: absoluteUrl(`/shop/${p.slug}`),
      ...(images.length ? { images: [{ url: absoluteUrl(images[0]), alt: p.name }] } : {}),
    },
    twitter: { card: images.length ? "summary_large_image" : "summary", title, description },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await db.product.findUnique({ where: { slug } });
  if (!product || !product.active) notFound();

  const [settings, related] = await Promise.all([
    getSettings(db),
    db.product.findMany({
      where: { active: true, brand: product.brand, NOT: { id: product.id } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const similar =
    related.length >= 4
      ? []
      : await db.product.findMany({
          where: {
            active: true,
            NOT: { id: { in: [product.id, ...related.map((r) => r.id)] } },
            price: { gte: Math.round(product.price * 0.6), lte: Math.round(product.price * 1.4) },
          },
          orderBy: { createdAt: "desc" },
          take: 4 - related.length,
        });
  const more = [...related, ...similar];
  const fee = toInt(settings.deliveryFee);
  const freeAbove = toInt(settings.freeDeliveryAbove);

  const images = parseImages(product.images);
  const note = PTA_NOTES[product.ptaStatus];
  const score = CONDITION_SCORE[product.condition] ?? 8;

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "specs", label: "Specifications" },
    { id: "condition", label: "Condition report" },
    { id: "delivery", label: "Delivery and warranty" },
    ...(more.length > 0 ? [{ id: "similar", label: "Similar phones" }] : []),
  ];

  const highlights = [
    product.storage && { icon: "box" as IconName, label: "Storage", value: product.storage },
    product.ram && { icon: "sparkle" as IconName, label: "RAM", value: product.ram },
    product.batteryHealth && { icon: "battery" as IconName, label: "Battery", value: `${product.batteryHealth}%` },
    product.color && { icon: "tag" as IconName, label: "Color", value: product.color },
  ].filter(Boolean) as { icon: IconName; label: string; value: string }[];

  const specs: [string, string][] = [
    ["Brand", product.brand],
    ["Model", product.model],
    ["Storage", product.storage],
    ["RAM", product.ram],
    ["Color", product.color],
    ["Condition", conditionLabel(product.condition)],
    ["PTA status", ptaLabel(product.ptaStatus)],
    ["Battery health", product.batteryHealth ? `${product.batteryHealth}%` : ""],
    ["Warranty", product.warranty],
  ];
  const facts = specs.filter(([k, v]) => v && ["Brand", "Model", "Storage", "RAM", "Color", "Battery health", "Warranty"].includes(k));

  const inquiry = whatsappUrl(
    settings.whatsapp,
    `Hello ${settings.shopName}, I am interested in: ${product.name} (${ptaLabel(product.ptaStatus)}, ${conditionLabel(product.condition)}).`,
  );
  const buy = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    oldPrice: product.oldPrice,
    stock: product.stock,
    warranty: product.warranty,
  };

  return (
    <>
      <JsonLd data={productJsonLd({ ...product, images }, { shopName: settings.shopName })} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: product.name, path: `/shop/${product.slug}` },
        ])}
      />

      <div className="container-x py-6 pb-28 sm:py-8 sm:pb-28 lg:pb-10">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
          <Link href="/" className="hover:text-brand-700">Home</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/shop" className="hover:text-brand-700">Shop</Link>
          <span aria-hidden="true"> / </span>
          <span className="text-ink-900">{product.name}</span>
        </nav>

        {/* Record header: who this is and its status at a glance */}
        <header className="card flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5" data-testid="record-header">
          <div className="flex min-w-0 items-center gap-4">
            <span
              aria-hidden="true"
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 font-display text-2xl font-bold text-white shadow-glow"
            >
              {product.brand.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{product.brand}</p>
              <h1 className="mt-0.5 !text-2xl sm:!text-3xl">{product.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <ConditionBadge value={product.condition} />
                <PtaBadge value={product.ptaStatus} />
                {product.stock <= 0 ? (
                  <span className="badge bg-tone-danger-bg text-tone-danger-fg">Sold out</span>
                ) : product.stock <= 2 ? (
                  <span className="badge bg-tone-warning-bg text-tone-warning-fg">Only {product.stock} left</span>
                ) : (
                  <span className="badge bg-tone-success-bg text-tone-success-fg">In stock</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-bold tracking-tight text-ink-900">{formatPrice(product.price)}</p>
            <a href={inquiry} target="_blank" rel="noreferrer" className="btn-ghost btn-sm mt-1 -mr-2">
              <Icon name="chat" className="h-4 w-4" />
              Ask on WhatsApp
            </a>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[230px_minmax(0,1fr)_340px]">
          {/* Left sidebar (large screens): contents and quick facts */}
          <aside aria-label="Phone summary" className="hidden xl:col-start-1 xl:row-start-1 xl:block">
            <div className="sticky top-44 space-y-4">
              <div className="card p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">On this page</p>
                <SectionNav sections={sections} variant="rail" />
              </div>
              <div className="card p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Quick facts</p>
                <dl className="space-y-2.5 text-sm">
                  {facts.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-muted">{k}</dt>
                      <dd className="text-right font-semibold text-ink-900">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="card p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Record</p>
                <dl className="space-y-2.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Listed</dt>
                    <dd className="text-right font-semibold text-ink-900">{formatDate(product.createdAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">In stock</dt>
                    <dd className="font-semibold text-ink-900">{product.stock}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </aside>

          {/* Right sidebar (large screens): the buy panel */}
          <aside aria-label="Buy this phone" className="hidden lg:col-start-2 lg:row-start-1 lg:block xl:col-start-3">
            <div className="sticky top-44">
              <BuyPanel product={buy} image={images[0] ?? null} fee={fee} freeAbove={freeAbove} inquiryHref={inquiry} />
            </div>
          </aside>

          {/* Centre: the record itself */}
          <div className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-1 xl:col-start-2">
            <div className="xl:hidden">
              <SectionNav sections={sections} variant="bar" />
            </div>

            <MediaPanel images={images} name={product.name} brand={product.brand} model={product.model} />

            <div className="lg:hidden">
              <BuyPanel product={buy} image={images[0] ?? null} fee={fee} freeAbove={freeAbove} inquiryHref={inquiry} anchorId="buy" />
            </div>

            <Panel id="overview" title="Overview" icon="eye">
              {highlights.length > 0 && (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {highlights.map((h) => (
                    <li key={h.label} className="rounded-xl border border-line p-3.5">
                      <Icon name={h.icon} className="h-5 w-5 text-brand-600" />
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">{h.label}</p>
                      <p className="text-sm font-semibold text-ink-900">{h.value}</p>
                    </li>
                  ))}
                </ul>
              )}
              {product.description ? (
                <p className={`whitespace-pre-line leading-relaxed text-body ${highlights.length > 0 ? "mt-5" : ""}`}>{product.description}</p>
              ) : (
                <p className="text-muted">Ask us on WhatsApp for more details about this phone.</p>
              )}
            </Panel>

            <Panel id="specs" title="Specifications" icon="sliders">
              <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line text-[15px]">
                {specs
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[9rem_1fr] sm:grid-cols-[11rem_1fr]">
                      <dt className="bg-surface px-4 py-3 font-medium text-muted">{k}</dt>
                      <dd className="px-4 py-3 font-medium text-ink-900">{v}</dd>
                    </div>
                  ))}
              </dl>
            </Panel>

            <Panel id="condition" title="Condition report" icon="star" note="Graded by the shop">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-5">
                  <Meter label="Condition grade" value={score} max={10} display={`${score}/10`} />
                  {product.batteryHealth ? <Meter label="Battery health" value={product.batteryHealth} display={`${product.batteryHealth}%`} /> : null}
                  <p className="text-sm leading-relaxed text-body">{CONDITION_TEXT[product.condition]}</p>
                </div>
                <div className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <PtaBadge value={product.ptaStatus} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-body">{PTA_TEXT[product.ptaStatus]}</p>
                </div>
              </div>
              {note && (
                <p className="mt-5 flex gap-3 rounded-xl border border-[#FCD34D] bg-tone-warning-bg p-4 text-sm leading-relaxed text-tone-warning-fg" role="note">
                  <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
                  {note}
                </p>
              )}
            </Panel>

            <Panel id="delivery" title="Delivery and warranty" icon="truck">
              <ul className="grid gap-3 sm:grid-cols-3">
                <li className="rounded-xl border border-line p-4">
                  <Icon name="cash" className="h-5 w-5 text-brand-600" />
                  <p className="mt-2 font-semibold text-ink-900">Cash on delivery</p>
                  <p className="mt-1 text-sm text-muted">Pay the rider after you check the phone.</p>
                </li>
                <li className="rounded-xl border border-line p-4">
                  <Icon name="truck" className="h-5 w-5 text-brand-600" />
                  <p className="mt-2 font-semibold text-ink-900">Delivery</p>
                  <p className="mt-1 text-sm text-muted">
                    {fee > 0 ? `${formatPrice(fee)}${freeAbove > 0 ? `, free above ${formatPrice(freeAbove)}` : ""}.` : "Free delivery."}
                  </p>
                </li>
                <li className="rounded-xl border border-line p-4">
                  <Icon name="shield" className="h-5 w-5 text-brand-600" />
                  <p className="mt-2 font-semibold text-ink-900">Warranty</p>
                  <p className="mt-1 text-sm text-muted">{product.warranty || "Ask us on WhatsApp about warranty."}</p>
                </li>
              </ul>

              <h3 className="mt-6 text-base font-semibold">How to order</h3>
              <ol className="mt-3 space-y-3 text-[15px] text-ink-800">
                {["Press Add to cart, then go to checkout.", "Enter your name, phone number and address.", "We confirm, deliver, and you pay after checking the phone."].map((t, i) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
                    <span className="pt-0.5">{t}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-sm text-muted">
                <Link href="/how-to-buy" className="font-semibold text-brand-700 hover:underline">Read the full buying guide</Link>
                {" or "}
                <Link href="/policies" className="font-semibold text-brand-700 hover:underline">our warranty and returns terms</Link>.
              </p>
            </Panel>
          </div>
        </div>

        {more.length > 0 && (
          <section id="similar" className="mt-16 scroll-mt-44" aria-labelledby="related-title">
            <h2 id="related-title" className="section-title mb-8">{related.length >= 4 ? `More from ${product.brand}` : "You may also like"}</h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {more.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      <StickyBuyBar name={product.name} price={product.price} soldOut={product.stock <= 0} />
    </>
  );
}
