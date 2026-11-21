import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { EMPTY_PRODUCT, ProductForm } from "@/components/admin/ProductForm";
import { PageHeader } from "@/components/admin/PageHeader";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        kicker="Products"
        title="Add product"
        text="Fill in the details. You can change everything later."
        actions={<Link href="/admin/products" className="btn-outline">&larr; All products</Link>}
      />
      <ProductForm initial={EMPTY_PRODUCT} />
    </>
  );
}
