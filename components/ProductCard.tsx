import Link from "next/link";
import type { Product } from "@prisma/client";
import { discountPercent, formatPrice, parseImages } from "@/lib/format";
import { ConditionBadge, PtaBadge } from "./Badges";
import { PhoneImage } from "./PhoneImage";

export function ProductCard({ product }: { product: Product }) {
  const images = parseImages(product.images);
  const off = discountPercent(product.price, product.oldPrice);
  const soldOut = product.stock <= 0;
  const specs = [product.storage, product.ram && `${product.ram} RAM`, product.color].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group card flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
    >
      <div className="relative overflow-hidden bg-surface-sunken">
        <PhoneImage
          images={images}
          name={product.name}
          brand={product.brand}
          className="aspect-[4/5] w-full transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <ConditionBadge value={product.condition} />
          <PtaBadge value={product.ptaStatus} />
        </div>
        {off > 0 && !soldOut && (
          <span className="badge absolute bottom-3 left-3 bg-accent-400 text-ink-900 shadow-soft">Save {off}%</span>
        )}
        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-white/75 backdrop-blur-[2px]">
            <span className="rounded-full bg-ink-900 px-4 py-1.5 text-sm font-semibold text-white">Sold out</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{product.brand}</p>
        <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-snug transition group-hover:text-brand-700">{product.name}</h3>
        {specs && <p className="mt-1 text-sm text-muted">{specs}</p>}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-1 pt-4">
          <div>
            <p className="font-display text-xl font-bold tracking-tight text-ink-900">{formatPrice(product.price)}</p>
            {product.oldPrice && product.oldPrice > product.price && (
              <p className="text-sm text-muted line-through">{formatPrice(product.oldPrice)}</p>
            )}
          </div>
          {!soldOut && product.stock <= 2 && (
            <span className="badge bg-tone-warning-bg text-tone-warning-fg">Only {product.stock} left</span>
          )}
        </div>
      </div>
    </Link>
  );
}
