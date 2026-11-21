import { Icon } from "./Icons";

const STEPS = [
  { value: "pending", label: "Order received" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
];

export function StatusTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-tone-danger-bg p-3.5 text-sm font-semibold text-tone-danger-fg" data-testid="status">
        <Icon name="alert" className="h-5 w-5" />
        This order was cancelled.
      </p>
    );
  }
  const current = Math.max(
    STEPS.findIndex((s) => s.value === status),
    0,
  );
  return (
    <ol className="relative grid grid-cols-4 gap-2" aria-label="Order progress" data-testid="status" data-status={status}>
      <span className="absolute left-[12.5%] right-[12.5%] top-4 h-0.5 bg-line" aria-hidden="true" />
      <span
        className="absolute left-[12.5%] top-4 h-0.5 bg-brand-600 transition-all"
        style={{ width: `${(current / (STEPS.length - 1)) * 75}%` }}
        aria-hidden="true"
      />
      {STEPS.map((s, i) => (
        <li key={s.value} className="relative text-center" aria-current={i === current ? "step" : undefined}>
          <div
            className={`mx-auto grid h-8 w-8 place-items-center rounded-full text-sm font-bold ring-4 ring-white ${
              i < current ? "bg-brand-600 text-white" : i === current ? "bg-brand-600 text-white shadow-glow" : "bg-surface-sunken text-muted"
            }`}
          >
            {i < current ? <Icon name="check" className="h-4 w-4" strokeWidth={2.6} /> : i + 1}
          </div>
          <p className={`mt-2 text-xs sm:text-sm ${i <= current ? "font-semibold text-ink-900" : "text-muted"}`}>{s.label}</p>
        </li>
      ))}
    </ol>
  );
}
