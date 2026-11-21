import { readFile } from "node:fs/promises";
import path from "node:path";
import { isSafeUploadName, mimeForName } from "@/lib/upload";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!isSafeUploadName(name)) return new Response("Not found", { status: 404 });

  const dir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");
  try {
    const file = await readFile(path.join(dir, name));
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": mimeForName(name),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
