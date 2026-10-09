import type { Metadata } from "next";
import type { ReactNode } from "react";

import "../../../web/src/app/styles.css";

export const metadata: Metadata = {
  title: "Cadre — 3D Mockup Studio",
  description: "Compose a 3D device mockup, upload your design, and export a PNG locally.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
