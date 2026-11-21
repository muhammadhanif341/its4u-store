import type { DayBucket } from "@/lib/admin-stats";
import { formatPrice } from "@/lib/format";

/** Orders per day for the last week: a plain SVG bar chart, no chart library needed. */
export function OrdersChart({ data }: { data: DayBucket[] }) {
  const W = 560;
  const H = 220;
  const top = 28;
  const bottom = 34;
  const plotH = H - top - bottom;
  const max = Math.max(1, ...data.map((d) => d.count));
  // Round the top of the scale up so the gridlines land on whole numbers
  const niceMax = max <= 4 ? max : Math.ceil(max / 4) * 4;
  const slot = (W - 16) / data.length;
  const barW = Math.min(44, slot * 0.58);
  const total = data.reduce((n, d) => n + d.count, 0);
  const summary = `Orders in the last ${data.length} days: ${data.map((d) => `${d.label} ${d.count}`).join(", ")}. ${total} in total.`;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={summary}>
        {[0, 0.5, 1].map((f) => {
          const y = top + plotH - plotH * f;
          return (
            <g key={f}>
              <line x1="8" x2={W - 8} y1={y} y2={y} stroke="#E3E6EF" strokeDasharray={f === 0 ? undefined : "4 6"} />
              <text x="8" y={y - 6} fontSize="11" fill="#5B6678">
                {Math.round(niceMax * f)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = d.count === 0 ? 3 : Math.max(8, (d.count / niceMax) * plotH);
          const x = 8 + slot * i + (slot - barW) / 2;
          const y = top + plotH - h;
          const isToday = i === data.length - 1;
          return (
            <g key={d.date}>
              <title>{`${d.label} ${d.date}: ${d.count} orders, ${formatPrice(d.revenue)}`}</title>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx="8"
                fill={d.count === 0 ? "#E3E6EF" : isToday ? "#F59E0B" : "#5B63F2"}
              />
              {d.count > 0 && (
                <text x={x + barW / 2} y={y - 8} textAnchor="middle" fontSize="13" fontWeight="700" fill="#0B1220">
                  {d.count}
                </text>
              )}
              <text x={x + barW / 2} y={H - 10} textAnchor="middle" fontSize="12" fontWeight={isToday ? 700 : 500} fill={isToday ? "#0B1220" : "#5B6678"}>
                {isToday ? "Today" : d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}
