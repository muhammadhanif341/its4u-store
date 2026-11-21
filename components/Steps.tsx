import { Icon } from "./Icons";

const STEPS = ["Cart", "Delivery details", "Done"];

/** Where the customer is in the buying flow. `current` is 0, 1 or 2. */
export function Steps({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="mb-8 flex items-center gap-2 text-sm sm:gap-4" aria-label="Checkout progress">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-4" aria-current={active ? "step" : undefined}>
            <span
              className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${
                done ? "bg-tone-success-bg text-tone-success-fg" : active ? "bg-brand-600 text-white shadow-glow" : "bg-surface-sunken text-muted"
              }`}
            >
              {done ? <Icon name="check" className="h-4 w-4" strokeWidth={2.6} /> : i + 1}
            </span>
            <span className={`font-semibold ${active ? "text-ink-900" : "text-muted"} ${active ? "" : "hidden sm:inline"}`}>{label}</span>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-line sm:w-12" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
