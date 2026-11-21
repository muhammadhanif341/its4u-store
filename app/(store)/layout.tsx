import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { toInt } from "@/lib/pricing";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { THEME_SCRIPT } from "@/components/ThemeToggle";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, brandRows] = await Promise.all([
    getSettings(db),
    db.product.findMany({ where: { active: true }, select: { brand: true }, distinct: ["brand"], orderBy: { brand: "asc" } }),
  ]);
  return (
    <CartProvider>
      {/* The shop is dark by default. The visitor can switch to light (see ThemeToggle). The admin panel is not inside this wrapper. */}
      <div id="store-root" data-theme="dark" suppressHydrationWarning className="flex min-h-screen flex-col bg-surface">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-white px-4 py-2 font-semibold text-brand-700 shadow-lift focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <Header shopName={settings.shopName} freeAbove={toInt(settings.freeDeliveryAbove)} whatsapp={settings.whatsapp} brands={brandRows.map((b) => b.brand)} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer settings={settings} />
      </div>
    </CartProvider>
  );
}
