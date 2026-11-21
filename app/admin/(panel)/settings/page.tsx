import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveSettingsAction } from "@/app/admin/actions";
import { Icon } from "@/components/Icons";
import { PageHeader } from "@/components/admin/PageHeader";

export const metadata: Metadata = { title: "Settings" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function SettingsPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const s = await getSettings(db);
  const error = one(sp.error);
  const saved = one(sp.saved);

  return (
    <>
      <PageHeader title="Shop settings" text="These details appear on your website, in the footer and in WhatsApp messages." />

      {error && (
        <p role="alert" className="mb-6 flex max-w-3xl items-start gap-2.5 rounded-xl border border-[#FDA4AF] bg-tone-danger-bg p-4 text-sm font-semibold text-tone-danger-fg" data-testid="settings-error">
          <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="mb-6 flex max-w-3xl items-start gap-2.5 rounded-xl border border-[#6EE7B7] bg-tone-success-bg p-4 text-sm font-semibold text-tone-success-fg" data-testid="settings-saved">
          <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.6} />
          Settings saved.
        </p>
      )}

      <form action={saveSettingsAction} className="max-w-3xl space-y-6">
        <section className="card space-y-5 p-6 sm:p-7">
          <h2 className="text-h3">Shop identity</h2>
          <div>
            <label htmlFor="shopName" className="label">Shop name</label>
            <input id="shopName" name="shopName" defaultValue={s.shopName} className="input" />
          </div>
          <div>
            <label htmlFor="tagline" className="label">Tagline</label>
            <input id="tagline" name="tagline" defaultValue={s.tagline} className="input" />
            <p className="hint">A short line shown in the footer and in search results.</p>
          </div>
        </section>

        <section className="card space-y-5 p-6 sm:p-7">
          <h2 className="text-h3">Contact</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="whatsapp" className="label">WhatsApp number</label>
              <input id="whatsapp" name="whatsapp" defaultValue={s.whatsapp} className="input" inputMode="tel" />
              <p className="hint">Customers send their orders here.</p>
            </div>
            <div>
              <label htmlFor="phone" className="label">Phone number shown on the site</label>
              <input id="phone" name="phone" defaultValue={s.phone} className="input" inputMode="tel" />
            </div>
          </div>
          <div>
            <label htmlFor="address" className="label">Shop address</label>
            <input id="address" name="address" defaultValue={s.address} className="input" />
          </div>
        </section>

        <section className="card space-y-5 p-6 sm:p-7">
          <h2 className="text-h3">Delivery</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="deliveryFee" className="label">Delivery charges (Rs.)</label>
              <input id="deliveryFee" name="deliveryFee" defaultValue={s.deliveryFee} className="input" inputMode="numeric" />
            </div>
            <div>
              <label htmlFor="freeDeliveryAbove" className="label">Free delivery above (Rs.)</label>
              <input id="freeDeliveryAbove" name="freeDeliveryAbove" defaultValue={s.freeDeliveryAbove} className="input" inputMode="numeric" />
              <p className="hint">Enter 0 to always charge delivery.</p>
            </div>
          </div>
        </section>

        <div>
          <button type="submit" className="btn-primary !min-h-[48px] px-8" data-testid="save-settings">Save settings</button>
        </div>
      </form>
    </>
  );
}
