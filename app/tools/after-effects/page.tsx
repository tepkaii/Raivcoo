// /app/tools/after-effects/page.tsx
import React from "react";
import AfterEffectsPage from "./AfterEffectsPage";
import { Metadata } from "next";
export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "After Effects Resources & Tools",
  description: "Discover After Effects resources including extensions, presets",
  openGraph: {
    title: "After Effects Resources & Tools",
    description:
      "Discover After Effects resources including extensions, presets",
    // images: ["/tools/after-effects/og-image.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "After Effects Resources & Tools",
    description:
      "Discover After Effects resources including extensions, presets",
    // images: ["/tools/after-effects/og-image.jpg"],
  },
  keywords: [
    "After Effects",
    "Adobe After Effects",
    "Extensions",
    "Presets",
    "Scripts",
    "Animation tools",
    "Motion graphics resources",
  ],
};

function page() {
  return <AfterEffectsPage />;
}

export default page;
