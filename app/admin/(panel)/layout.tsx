import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [settings, pending] = await Promise.all([getSettings(db), db.order.count({ where: { status: "pending" } })]);
  return (
    <AdminShell shopName={settings.shopName} pending={pending}>
      {children}
    </AdminShell>
  );
}
