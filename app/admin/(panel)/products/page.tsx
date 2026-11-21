import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatPrice, parseImages } from "@/lib/format";
import { toggleProductAction } from "@/app/admin/actions";
import { ConditionBadge, PtaBadge } from "@/components/Badges";
import { Icon } from "@/components/Icons";
import { PageHeader } from "@/components/admin/PageHeader";
import { PhoneImage } from "@/components/PhoneImage";

export const metadata: Metadata = { title: "Products" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminProductsPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? "";

  const products = await db.product.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { brand: { contains: q } }, { model: { contains: q } }] } : {},
    orderBy: { createdAt: "desc" },
  });
  const hidden = products.filter((p) => !p.active).length;

  return (
    <>
      <PageHeader
        title="Products"
        text={`${products.length} ${products.length === 1 ? "phone" : "phones"}${hidden ? `, ${hidden} hidden from the store` : ""}`}
        actions={
          <Link href="/admin/products/new" className="btn-primary" data-testid="add-product">
            <Icon name="plus" className="h-4 w-4" />
            Add product
          </Link>
        }
      />

      <form method="get" role="search" className="relative mb-5 max-w-md">
        <label htmlFor="admin-q" className="sr-only">Search products</label>
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input id="admin-q" name="q" defaultValue={q} placeholder="Search by name, brand or model" className="input !pl-12" />
      </form>

      <div className="card overflow-hidden">
        {products.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Icon name="phone" className="h-7 w-7" />
            </span>
            <p className="mt-4 text-lg font-semibold text-ink-900">{q ? "No products match your search" : "No products yet"}</p>
            <p className="mt-1 text-muted">{q ? "Try a different word." : "Add your first phone to start selling."}</p>
            {!q && (
              <Link href="/admin/products/new" className="btn-primary mt-5">
                <Icon name="plus" className="h-4 w-4" />
                Add product
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Phone</th>
                  <th scope="col">Condition</th>
                  <th scope="col">Price</th>
                  <th scope="col">Stock</th>
                  <th scope="col" className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} data-testid="product-row">
                    <td>
                      <div className="flex min-w-[14rem] items-center gap-3.5">
                        <PhoneImage
                          images={parseImages(p.images)}
                          name={p.name}
                          brand={p.brand}
                          className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line"
                        />
                        <div className="min-w-0">
                          <Link href={`/admin/products/${p.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                            {p.name}
                          </Link>
                          <p className="flex items-center gap-2 text-sm text-muted">
                            {p.brand}
                            {!p.active && <span className="badge bg-tone-neutral-bg text-tone-neutral-fg">Hidden</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col items-start gap-1.5">
                        <ConditionBadge value={p.condition} />
                        <PtaBadge value={p.ptaStatus} />
                      </div>
                    </td>
                    <td className="whitespace-nowrap font-semibold">{formatPrice(p.price)}</td>
                    <td>
                      {p.stock <= 0 ? (
                        <span className="badge bg-tone-danger-bg text-tone-danger-fg">Sold out</span>
                      ) : p.stock === 1 ? (
                        <span className="badge bg-tone-warning-bg text-tone-warning-fg">1 left</span>
                      ) : (
                        <span className="font-semibold">{p.stock}</span>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="btn-outline !min-h-[40px] !w-10 !px-0"
                          aria-label={`Edit ${p.name}`}
                          title="Edit"
                        >
                          <Icon name="edit" className="h-4 w-4" />
                        </Link>
                        <form action={toggleProductAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="btn-outline !min-h-[40px] !w-10 !px-0"
                            aria-label={`${p.active ? "Hide" : "Show"} ${p.name}`}
                            title={p.active ? "Hide from store" : "Show in store"}
                          >
                            <Icon name={p.active ? "eyeOff" : "eye"} className="h-4 w-4" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
