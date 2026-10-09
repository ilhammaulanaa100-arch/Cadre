import type { PngExportIntent } from "@mockup-3d/contracts";

export type PngExportResult =
  | { kind: "ready"; blob: Blob }
  | { kind: "queued"; jobId: string };

// The editor submits the same snapshot to either backend. A later server
// implementation can return a job ID while the browser implementation returns
// the PNG immediately.
export interface PngExporter {
  submit(intent: PngExportIntent): Promise<PngExportResult>;
}

export function browserPngExporter(capture: (width: number, height: number) => Promise<Blob>): PngExporter {
  return {
    async submit(intent) {
      const blob = await capture(intent.output.width, intent.output.height);
      return { kind: "ready", blob };
    },
  };
}
