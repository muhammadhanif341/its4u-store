import { HOW_TO_BUY } from "@/lib/storefront";
import { Icon } from "./Icons";

/** The four steps from choosing a phone to receiving it. Used on the home page and /how-to-buy. */
export function HowToBuy({ headingLevel = "h3" }: { headingLevel?: "h3" | "h2" }) {
  const Title = headingLevel;
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="how-to-buy-steps">
      {HOW_TO_BUY.map((step, i) => (
        <li key={step.title} className="card relative flex flex-col p-6">
          <div className="flex items-center justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
              <Icon name={step.icon} className="h-6 w-6" />
            </span>
            <span className="font-display text-5xl font-bold leading-none text-brand-100" aria-hidden="true">
              {i + 1}
            </span>
          </div>
          <Title className="mt-5 text-lg font-semibold">
            <span className="sr-only">Step {i + 1}: </span>
            {step.title}
          </Title>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
