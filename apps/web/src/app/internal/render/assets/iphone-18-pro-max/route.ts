import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.FORMA_INTERNAL_RENDER !== "1") notFound();
  const model = await readFile(join(process.cwd(), "../../assets/devices/iphone-18-pro-max/iphone-18-pro-max.glb"));
  return new Response(new Uint8Array(model), {
    headers: { "content-type": "model/gltf-binary", "cache-control": "private, no-store", "x-content-type-options": "nosniff" },
  });
}
