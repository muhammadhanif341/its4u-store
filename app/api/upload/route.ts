import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isAdmin } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, detectImageType } from "@/lib/upload";

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
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "Image is larger than 5 MB." }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) return Response.json({ error: "Only JPG, PNG or WebP images are allowed." }, { status: 400 });

  const name = `${randomUUID()}.${type.ext}`;
  await mkdir(uploadDir(), { recursive: true });
  await writeFile(path.join(uploadDir(), name), bytes);

  return Response.json({ url: `/uploads/${name}` });
}
