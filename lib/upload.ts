// Vercel rejects request bodies above 4.5 MB, so the server accepts 4 MB. The admin page shrinks
// big phone photos in the browser before uploading, so this is rarely reached.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Longest side, in pixels, that the browser shrinks an uploaded photo to. */
export const MAX_IMAGE_SIDE = 1600;

/** Size to draw an image at so its longest side is at most `max`. Never makes it bigger. */
export function fitWithin(width: number, height: number, max: number = MAX_IMAGE_SIDE): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const scale = max / longest;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * Photos go to Vercel Blob in production and to the local disk on your computer. A Blob store connected
 * in Vercel sets either a token (BLOB_READ_WRITE_TOKEN) or, for newer stores, just BLOB_STORE_ID.
 */
export function usesBlobStorage(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.BLOB_READ_WRITE_TOKEN || env.BLOB_STORE_ID);
}

export type ImageType = { ext: "jpg" | "png" | "webp"; mime: string };

/** Looks at the first bytes of a file, so a renamed .exe or .html is never accepted as an image. */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return { ext: "png", mime: "image/png" };
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}

const UPLOAD_NAME = /^[A-Za-z0-9-]+\.(jpg|png|webp)$/;

export function isSafeUploadName(name: string): boolean {
  return UPLOAD_NAME.test(name);
}

export function mimeForName(name: string): string {
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
