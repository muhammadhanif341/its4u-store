import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { conditionLabel, ptaLabel } from "@/lib/constants";
import { PTA_NOTES } from "@/lib/content";
import { discountPercent, formatPrice, parseImages, whatsappUrl } from "@/lib/format";
import { absoluteUrl, breadcrumbJsonLd, productDescription, productJsonLd } from "@/lib/seo";
import { AddToCart } from "@/components/AddToCart";
import { ConditionBadge, PtaBadge } from "@/components/Badges";
import { Gallery } from "@/components/Gallery";
import { Icon, type IconName } from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { ProductCard } from "@/components/ProductCard";

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

  const images = parseImages(product.images);
  const off = discountPercent(product.price, product.oldPrice);
  const note = PTA_NOTES[product.ptaStatus];

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

  const inquiry = whatsappUrl(
    settings.whatsapp,
    `Hello ${settings.shopName}, I am interested in: ${product.name} (${ptaLabel(product.ptaStatus)}, ${conditionLabel(product.condition)}).`,
  );

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

      <div className="container-x py-8 sm:py-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
          <Link href="/" className="hover:text-brand-700">Home</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/shop" className="hover:text-brand-700">Shop</Link>
          <span aria-hidden="true"> / </span>
          <span className="text-ink-900">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="lg:sticky lg:top-44 lg:self-start">
            <Gallery images={images} name={product.name} brand={product.brand} />
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              <ConditionBadge value={product.condition} />
              <PtaBadge value={product.ptaStatus} />
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted">{product.brand}</p>
            <h1 className="mt-1">{product.name}</h1>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="font-display text-4xl font-bold tracking-tight text-ink-900">{formatPrice(product.price)}</p>
              {product.oldPrice && product.oldPrice > product.price && (
                <>
                  <p className="text-lg text-muted line-through">{formatPrice(product.oldPrice)}</p>
                  <span className="badge bg-accent-400 text-ink-900">Save {off}%</span>
                </>
              )}
            </div>

            <p className="mt-3 flex items-center gap-2 text-sm font-semibold">
              {product.stock <= 0 ? (
                <span className="badge bg-tone-danger-bg text-tone-danger-fg">Sold out</span>
              ) : product.stock <= 2 ? (
                <span className="badge bg-tone-warning-bg text-tone-warning-fg">Only {product.stock} left</span>
              ) : (
                <span className="badge bg-tone-success-bg text-tone-success-fg">In stock</span>
              )}
            </p>

            {highlights.length > 0 && (
              <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {highlights.map((h) => (
                  <li key={h.label} className="rounded-xl border border-line bg-white p-3.5">
                    <Icon name={h.icon} className="h-5 w-5 text-brand-600" />
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">{h.label}</p>
                    <p className="text-sm font-semibold text-ink-900">{h.value}</p>
                  </li>
                ))}
              </ul>
            )}

            {note && (
              <p className="mt-6 flex gap-3 rounded-xl border border-[#FCD34D] bg-tone-warning-bg p-4 text-sm leading-relaxed text-tone-warning-fg" role="note">
                <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
                {note}
              </p>
            )}

            <div className="mt-6">
              <AddToCart
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  image: images[0] ?? null,
                  stock: product.stock,
                }}
              />
              <a href={inquiry} target="_blank" rel="noreferrer" className="btn-outline mt-3 w-full">
                <Icon name="chat" className="h-5 w-5" />
                Ask about this phone on WhatsApp
              </a>
            </div>

            <ul className="mt-6 grid gap-3 rounded-2xl bg-surface-sunken p-5 text-sm sm:grid-cols-3">
              <li className="flex items-center gap-2.5 font-medium text-ink-800">
                <Icon name="cash" className="h-5 w-5 text-brand-600" /> Cash on delivery
              </li>
              <li className="flex items-center gap-2.5 font-medium text-ink-800">
                <Icon name="shield" className="h-5 w-5 text-brand-600" /> Condition graded
              </li>
              <li className="flex items-center gap-2.5 font-medium text-ink-800">
                <Icon name="truck" className="h-5 w-5 text-brand-600" /> Delivery in Pakistan
              </li>
            </ul>

            <section aria-labelledby="specs-title" className="mt-10">
              <h2 id="specs-title" className="text-h3">Specifications</h2>
              <dl className="card mt-4 divide-y divide-line overflow-hidden text-[15px]">
                {specs
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[9rem_1fr] sm:grid-cols-[11rem_1fr]">
                      <dt className="bg-surface px-4 py-3 font-medium text-muted">{k}</dt>
                      <dd className="px-4 py-3 font-medium text-ink-900">{v}</dd>
                    </div>
                  ))}
              </dl>
            </section>

            {product.description && (
              <section aria-labelledby="desc-title" className="mt-10">
                <h2 id="desc-title" className="text-h3">About this phone</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-body">{product.description}</p>
              </section>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20" aria-labelledby="related-title">
            <h2 id="related-title" className="section-title mb-8">More from {product.brand}</h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
