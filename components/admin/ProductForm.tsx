"use client";

import Link from "next/link";
import { useActionState, useMemo } from "react";
import { saveProductAction, type ProductFormState } from "@/app/admin/actions";
import { CONDITIONS, PTA_STATUSES } from "@/lib/constants";
import { Icon } from "@/components/Icons";
import { ImageUploader } from "./ImageUploader";
import { Toggle } from "./Toggle";

export type ProductFormInitial = Record<string, string> & { featured: string; active: string; images: string };

const BRANDS = ["Apple", "Samsung", "Xiaomi", "Infinix", "Tecno", "Oppo", "Vivo", "Realme", "Google", "OnePlus", "Huawei", "Motorola", "Nokia"];

export const EMPTY_PRODUCT: ProductFormInitial = {
  name: "", brand: "", model: "", storage: "", ram: "", color: "", condition: "", ptaStatus: "",
  batteryHealth: "", price: "", oldPrice: "", stock: "1", warranty: "", description: "", imei: "",
  featured: "", active: "on", images: "[]",
};

const initialState: ProductFormState = {};

function safeImages(json: string): string[] {
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function Section({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <section className="card p-6 sm:p-7">
      <h2 className="text-h3">{title}</h2>
      {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

export function ProductForm({ id, initial }: { id?: string; initial: ProductFormInitial }) {
  const [state, action, pending] = useActionState(saveProductAction, initialState);
  const src = state.values ?? initial;
  const err = state.errors ?? {};
  const on = (k: string) => (state.values ? state.values[k] === "on" : initial[k] === "on");

  // Stable identity: only changes when the server returns new values or errors,
  // so inputs are not re-created while the user is typing.
  const Field = useMemo(
    () =>
      function Field({ name, label, type = "text", hint, placeholder, list, inputMode }: { name: string; label: string; type?: string; hint?: string; placeholder?: string; list?: string; inputMode?: "numeric" | "text" }) {
        return (
          <div>
            <label htmlFor={name} className="label">{label}</label>
            <input
              id={name}
              name={name}
              type={type}
              defaultValue={src[name] ?? ""}
              placeholder={placeholder}
              list={list}
              inputMode={inputMode}
              aria-invalid={Boolean(err[name])}
              aria-describedby={err[name] ? `${name}-error` : undefined}
              className="input"
            />
            {hint && !err[name] && <p className="hint">{hint}</p>}
            {err[name] && <p id={`${name}-error`} className="field-error">{err[name]}</p>}
          </div>
        );
      },
    [src, err],
  );

  const errorCount = Object.keys(err).length;

  return (
    <form action={action} noValidate>
      {id && <input type="hidden" name="id" value={id} />}

      {state.message && (
        <p role="alert" className="mb-6 flex items-start gap-2.5 rounded-xl border border-[#FDA4AF] bg-tone-danger-bg p-4 text-sm font-semibold text-tone-danger-fg">
          <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
          {state.message}
        </p>
      )}
      {errorCount > 0 && (
        <p role="alert" className="mb-6 flex items-start gap-2.5 rounded-xl border border-[#FDA4AF] bg-tone-danger-bg p-4 text-sm font-semibold text-tone-danger-fg" data-testid="form-errors">
          <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
          Please fix the {errorCount} highlighted {errorCount === 1 ? "field" : "fields"} below.
        </p>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Section title="Basic details" text="What the phone is called and who makes it.">
            <Field name="name" label="Product name" placeholder="iPhone 13 128GB" />
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Field name="brand" label="Brand" list="brands" />
                <datalist id="brands">{BRANDS.map((b) => <option key={b} value={b} />)}</datalist>
              </div>
              <Field name="model" label="Model" placeholder="iPhone 13" />
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field name="storage" label="Storage" placeholder="128GB" />
              <Field name="ram" label="RAM" placeholder="4GB" />
              <Field name="color" label="Color" />
            </div>
          </Section>

          <Section title="Condition and PTA" text="Customers filter by these, so please be accurate.">
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label htmlFor="condition" className="label">Condition</label>
                <select id="condition" name="condition" defaultValue={src.condition ?? ""} aria-invalid={Boolean(err.condition)} className="input">
                  <option value="">Choose...</option>
                  {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                {err.condition && <p className="field-error">{err.condition}</p>}
              </div>
              <div>
                <label htmlFor="ptaStatus" className="label">PTA status</label>
                <select id="ptaStatus" name="ptaStatus" defaultValue={src.ptaStatus ?? ""} aria-invalid={Boolean(err.ptaStatus)} className="input">
                  <option value="">Choose...</option>
                  {PTA_STATUSES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                {err.ptaStatus && <p className="field-error">{err.ptaStatus}</p>}
              </div>
              <Field name="batteryHealth" label="Battery health (%)" inputMode="numeric" hint="For used phones, e.g. 88" />
            </div>
          </Section>

          <Section title="Price and stock">
            <div className="grid gap-5 sm:grid-cols-3">
              <Field name="price" label="Price (Rs.)" inputMode="numeric" />
              <Field name="oldPrice" label="Old price (Rs.)" inputMode="numeric" hint="Optional. Shows a discount." />
              <Field name="stock" label="Stock quantity" inputMode="numeric" hint="0 means sold out." />
            </div>
          </Section>

          <Section title="More details">
            <Field name="warranty" label="Warranty" placeholder="1 month shop warranty" />
            <div>
              <label htmlFor="description" className="label">Description</label>
              <textarea id="description" name="description" rows={5} defaultValue={src.description ?? ""} className="input" />
              {err.description && <p className="field-error">{err.description}</p>}
            </div>
            <Field name="imei" label="IMEI (private)" hint="Only you can see this. It is never shown on the website." />
          </Section>
        </div>

        <div className="space-y-6 xl:sticky xl:top-8">
          <section className="card p-6">
            <h2 className="text-h3">Publish</h2>
            <div className="mt-5 space-y-4">
              <Toggle name="active" label="Visible in the store" text="Turn off to hide this phone." defaultChecked={on("active")} />
              <Toggle name="featured" label="Featured on home page" text="Shown in the top picks." defaultChecked={on("featured")} />
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <button type="submit" disabled={pending} className="btn-primary !min-h-[48px]" data-testid="save-product">
                {pending ? "Saving..." : id ? "Save changes" : "Add product"}
              </button>
              <Link href="/admin/products" className="btn-outline">Cancel</Link>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-h3">Photos</h2>
            <p className="mb-4 mt-1 text-sm text-muted">The first photo is the main one.</p>
            <ImageUploader initial={safeImages(src.images ?? "[]")} />
            {err.images && <p className="field-error">{err.images}</p>}
          </section>
        </div>
      </div>
    </form>
  );
}
