import { ORDER_TONE, toneFor } from "@/lib/ui";

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge capitalize ${toneFor(ORDER_TONE, status)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}
