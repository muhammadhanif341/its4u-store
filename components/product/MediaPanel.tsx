"use client";

import { useState } from "react";
import { Gallery } from "../Gallery";
import { PhoneViewer } from "./PhoneViewer";

/** Photos and the 3D view in one panel, switched with tabs. */
export function MediaPanel({ images, name, brand, model }: { images: string[]; name: string; brand: string; model: string }) {
  const [tab, setTab] = useState<"photos" | "3d">("photos");
  const tabs = [
    { id: "photos" as const, label: images.length > 0 ? `Photos (${images.length})` : "Photo" },
    { id: "3d" as const, label: "3D view" },
  ];

  return (
    <div>
      <div role="tablist" aria-label="Phone pictures" className="mb-3 inline-flex rounded-xl border border-line bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            id={`media-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`media-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`min-h-[40px] rounded-lg px-4 text-sm font-semibold transition ${tab === t.id ? "bg-brand-600 text-white" : "text-body hover:text-ink-900"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="media-panel-photos" aria-labelledby="media-tab-photos" hidden={tab !== "photos"}>
        <Gallery images={images} name={name} brand={brand} />
      </div>
      <div role="tabpanel" id="media-panel-3d" aria-labelledby="media-tab-3d" hidden={tab !== "3d"}>
        {tab === "3d" && <PhoneViewer name={name} seed={brand || model} />}
      </div>
    </div>
  );
}
