"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PhoneArt, paletteIndex } from "../PhoneArt";

/** Back-cover colours, one per brand colour family used by the phone drawing. */
const BACKS = [
  ["#5B63F2", "#22D3EE"],
  ["#8B5CF6", "#F472B6"],
  ["#10B981", "#22D3EE"],
  ["#F59E0B", "#F43F5E"],
  ["#0EA5E9", "#6366F1"],
  ["#334155", "#6366F1"],
] as const;

export const VIEWER = { width: 200, height: 400, depth: 26, startAngle: -28, step: 24 } as const;

/** Keeps an angle between -180 and 180 so it never grows without end. */
export function normalizeAngle(deg: number): number {
  const a = ((deg % 360) + 360) % 360;
  return a > 180 ? a - 360 : a;
}

/**
 * A phone you can turn around: drag it, use the arrow keys, or press the buttons.
 * It is built from flat CSS planes (front, back and four edges), so it needs no 3D library.
 * It turns slowly by itself until the visitor touches it, and never moves for people who prefer reduced motion.
 */
export function PhoneViewer({ name, seed }: { name: string; seed: string }) {
  const body = useRef<HTMLDivElement>(null);
  const angle = useRef<number>(VIEWER.startAngle);
  const drag = useRef<{ x: number; from: number } | null>(null);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [c1, c2] = BACKS[paletteIndex(seed)];

  const apply = useCallback(() => {
    if (body.current) body.current.style.transform = `rotateX(-6deg) rotateY(${angle.current}deg)`;
  }, []);

  const turn = useCallback(
    (by: number) => {
      angle.current = normalizeAngle(angle.current + by);
      apply();
    },
    [apply],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    apply();
  }, [apply]);

  useEffect(() => {
    if (!playing || reduced) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (!drag.current) turn(((now - last) / 1000) * 18);
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, reduced, turn]);

  const half = VIEWER.depth / 2;
  const face = "absolute inset-0 overflow-hidden rounded-[34px] [backface-visibility:hidden]";

  return (
    <div className="card overflow-hidden bg-gradient-to-b from-brand-50 to-surface-sunken" data-testid="phone-viewer">
      <div
        role="group"
        tabIndex={0}
        aria-label={`${name}, 3D view. Drag, or use the left and right arrow keys, to turn the phone.`}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            setPlaying(false);
            turn(-VIEWER.step);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            setPlaying(false);
            turn(VIEWER.step);
          }
        }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, from: angle.current };
          setPlaying(false);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          angle.current = normalizeAngle(drag.current.from + (e.clientX - drag.current.x) * 0.7);
          apply();
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        className="relative grid aspect-square cursor-grab touch-pan-y select-none place-items-center overflow-hidden active:cursor-grabbing"
        style={{ perspective: "1200px" }}
      >
        <div aria-hidden="true" className="absolute bottom-[12%] h-8 w-40 rounded-[50%] bg-black/30 blur-xl" />
        <div
          ref={body}
          className="relative"
          style={{ width: VIEWER.width, height: VIEWER.height, transformStyle: "preserve-3d", transform: `rotateX(-6deg) rotateY(${VIEWER.startAngle}deg)`, scale: "0.82" }}
        >
          {/* front: the phone drawing */}
          <div className={`${face} bg-[#0B1220]`} style={{ transform: `translateZ(${half}px)` }}>
            <PhoneArt seed={seed} className="h-full w-full" />
          </div>
          {/* back: coloured cover with a camera island */}
          <div
            className={`${face} bg-[#0B1220]`}
            style={{ transform: `rotateY(180deg) translateZ(${half}px)`, background: `linear-gradient(155deg, ${c1}, ${c2})` }}
          >
            <div className="absolute left-4 top-4 grid h-[104px] w-[104px] grid-cols-2 place-items-center gap-1.5 rounded-[26px] bg-black/35 p-3 backdrop-blur">
              <span className="h-9 w-9 rounded-full border-4 border-[#1E293B] bg-[#0B1220] shadow-inner" />
              <span className="h-9 w-9 rounded-full border-4 border-[#1E293B] bg-[#0B1220] shadow-inner" />
              <span className="h-9 w-9 rounded-full border-4 border-[#1E293B] bg-[#0B1220] shadow-inner" />
              <span className="h-3 w-3 rounded-full bg-amber-200" />
            </div>
            <div className="absolute inset-x-0 bottom-[28%] text-center font-display text-lg font-bold tracking-wide text-white/85">{seed}</div>
          </div>
          {/* edges */}
          <div aria-hidden="true" className="absolute rounded-md bg-[#1E293B]" style={{ width: VIEWER.depth, height: VIEWER.height - 40, top: 20, left: VIEWER.width / 2 - half, transform: `rotateY(90deg) translateZ(${VIEWER.width / 2}px)` }} />
          <div aria-hidden="true" className="absolute rounded-md bg-[#1E293B]" style={{ width: VIEWER.depth, height: VIEWER.height - 40, top: 20, left: VIEWER.width / 2 - half, transform: `rotateY(-90deg) translateZ(${VIEWER.width / 2}px)` }} />
          <div aria-hidden="true" className="absolute rounded-md bg-[#1E293B]" style={{ height: VIEWER.depth, width: VIEWER.width - 40, left: 20, top: VIEWER.height / 2 - half, transform: `rotateX(90deg) translateZ(${VIEWER.height / 2}px)` }} />
          <div aria-hidden="true" className="absolute rounded-md bg-[#1E293B]" style={{ height: VIEWER.depth, width: VIEWER.width - 40, left: 20, top: VIEWER.height / 2 - half, transform: `rotateX(-90deg) translateZ(${VIEWER.height / 2}px)` }} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
        <p className="text-sm text-muted">Drag to turn. This is an illustration of the phone model, not a photo of the exact unit.</p>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => { setPlaying(false); turn(-VIEWER.step); }} aria-label="Turn left" className="btn-outline btn-sm !min-h-[40px] !px-3">
            ‹
          </button>
          <button type="button" onClick={() => { setPlaying(false); turn(VIEWER.step); }} aria-label="Turn right" className="btn-outline btn-sm !min-h-[40px] !px-3">
            ›
          </button>
          {!reduced && (
            <button type="button" onClick={() => setPlaying((p) => !p)} aria-pressed={playing} className="btn-outline btn-sm !min-h-[40px]">
              {playing ? "Pause" : "Spin"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
