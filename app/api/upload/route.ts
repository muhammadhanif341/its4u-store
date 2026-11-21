import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isAdmin } from "@/lib/auth";
import { put } from "@vercel/blob";
import { MAX_UPLOAD_BYTES, detectImageType, usesBlobStorage } from "@/lib/upload";

export const runtime = "nodejs";

function uploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Please log in again." }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Could not read the upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file received." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "Image is larger than 4 MB." }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) return Response.json({ error: "Only JPG, PNG or WebP images are allowed." }, { status: 400 });

  const name = `${randomUUID()}.${type.ext}`;
  if (usesBlobStorage()) {
    // Production (Vercel): the disk is read-only, so photos live in Vercel Blob and keep their own https address.
    try {
      const blob = await put(`products/${name}`, Buffer.from(bytes), { access: "public", contentType: type.mime, addRandomSuffix: false });
      return Response.json({ url: blob.url });
    } catch {
      return Response.json({ error: "Could not save the image. Please try again." }, { status: 502 });
    }
  }

  await mkdir(uploadDir(), { recursive: true });
  await writeFile(path.join(uploadDir(), name), bytes);

  return Response.json({ url: `/uploads/${name}` });
}
