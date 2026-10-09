import { notFound } from "next/navigation";
import { RenderSurface } from "../../../features/renderer/render-surface";

export const dynamic = "force-dynamic";

export default function InternalRenderPage() {
  if (process.env.FORMA_INTERNAL_RENDER !== "1") notFound();
  return <RenderSurface />;
}
