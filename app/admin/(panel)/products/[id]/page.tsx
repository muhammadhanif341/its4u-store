import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ProductForm, type ProductFormInitial } from "@/components/admin/ProductForm";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { PageHeader } from "@/components/admin/PageHeader";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const p = await db.product.findUnique({ where: { id } });
  if (!p) notFound();

  const initial: ProductFormInitial = {
    name: p.name,
    brand: p.brand,
    model: p.model,
    storage: p.storage,
    ram: p.ram,
    color: p.color,
    condition: p.condition,
    ptaStatus: p.ptaStatus,
    batteryHealth: p.batteryHealth ? String(p.batteryHealth) : "",
    price: String(p.price),
    oldPrice: p.oldPrice ? String(p.oldPrice) : "",
    stock: String(p.stock),
    warranty: p.warranty,
    description: p.description,
    imei: p.imei,
    featured: p.featured ? "on" : "",
    active: p.active ? "on" : "",
    images: p.images,
  };

  return (
    <>
      <PageHeader
        kicker="Products"
        title="Edit product"
        text={p.name}
        actions={
          <>
            <Link href={`/shop/${p.slug}`} target="_blank" className="btn-outline">View in store</Link>
            <Link href="/admin/products" className="btn-outline">&larr; All products</Link>
          </>
        }
      />
      <ProductForm id={p.id} initial={initial} />

      <section className="card mt-6 flex flex-wrap items-center justify-between gap-4 border-[#FDA4AF] p-6">
        <div className="max-w-xl">
          <h2 className="text-h3">Delete this phone</h2>
          <p className="mt-1 text-sm text-muted">
            Deleting removes this phone from the store for good. To just stop selling it, turn off &quot;Visible in the store&quot; instead.
          </p>
        </div>
        <DeleteProductButton id={p.id} name={p.name} />
      </section>
    </>
  );
}
