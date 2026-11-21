"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import { MAX_IMAGE_SIDE, fitWithin } from "@/lib/upload";

/** Shrinks a big phone photo in the browser (about 300 KB instead of 5 MB). Falls back to the original file. */
async function shrink(file: File): Promise<File> {
  if (file.size < 800 * 1024 || !/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_IMAGE_SIDE);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function ImageUploader({ initial }: { initial: string[] }) {
  const [images, setImages] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError("");
    const added: string[] = [];
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.set("file", await shrink(file));
      try {
        const res = await fetch("/api/upload", { method: "POST", body });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Upload failed.");
          break;
        }
        added.push(json.url);
      } catch {
        setError("Upload failed. Check your connection and try again.");
        break;
      }
    }
    setImages((cur) => [...cur, ...added].slice(0, 8));
    if (fileRef.current) fileRef.current.value = "";
    setBusy(false);
  }

  function addUrl() {
    const value = url.trim();
    if (!/^https?:\/\/\S+$/.test(value)) {
      setError("Enter a full image link starting with http:// or https://");
      return;
    }
    setError("");
    setImages((cur) => [...cur, value].slice(0, 8));
    setUrl("");
  }

  const move = (i: number, dir: -1 | 1) =>
    setImages((cur) => {
      const j = i + dir;
      if (j < 0 || j >= cur.length) return cur;
      const copy = [...cur];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const full = images.length >= 8;

  return (
    <div>
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!full && !busy) onFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragging ? "border-brand-500 bg-brand-50" : "border-[#C3CAD9] bg-surface hover:border-brand-400 hover:bg-brand-50"
        } ${full ? "pointer-events-none opacity-50" : ""}`}
      >
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-brand-600 shadow-soft">
          <Icon name={busy ? "clock" : "plus"} className="h-6 w-6" />
        </span>
        <span className="text-[15px] font-semibold text-ink-900">{busy ? "Uploading..." : "Click or drop photos here"}</span>
        <span className="text-sm text-muted">JPG, PNG or WebP, big photos are shrunk automatically. {images.length}/8 added.</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          disabled={busy || full}
          onChange={(e) => onFiles(e.target.files)}
          data-testid="image-input"
        />
      </label>

      {images.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-3">
          {images.map((src, i) => (
            <li key={src + i} className="group overflow-hidden rounded-xl border border-line bg-white">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Product image ${i + 1}`} width={160} height={160} className="aspect-square w-full object-cover" />
                {i === 0 && <span className="badge absolute left-1.5 top-1.5 bg-accent-400 text-ink-900">Main</span>}
              </div>
              <div className="flex items-center justify-between p-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="grid h-8 w-8 place-items-center rounded-lg text-body hover:bg-surface-sunken disabled:opacity-30" aria-label="Move earlier">
                  &larr;
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="grid h-8 w-8 place-items-center rounded-lg text-body hover:bg-surface-sunken disabled:opacity-30" aria-label="Move later">
                  &rarr;
                </button>
                <button type="button" onClick={() => setImages((c) => c.filter((_, k) => k !== i))} className="grid h-8 w-8 place-items-center rounded-lg text-[#BE123C] hover:bg-tone-danger-bg" aria-label="Remove image">
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex gap-2">
        <label htmlFor="image-link" className="sr-only">Image link</label>
        <input id="image-link" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Or paste an image link" className="input" />
        <button type="button" onClick={addUrl} className="btn-outline shrink-0">Add</button>
      </div>

      {error && <p role="alert" className="field-error">{error}</p>}
    </div>
  );
}
