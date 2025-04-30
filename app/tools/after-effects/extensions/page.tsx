// /app/tools/after-effects/extensions/page.tsx
import React from "react";
import ExtensionsQ from "./Extensions";
import { Metadata } from "next";
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "After Effects Extensions",
  description: "Discover After Effects extensions ",
  openGraph: {
    title: "After Effects Extensions",
    description: "Discover After Effects extensions ",
    // images: ["/tools/after-effects/extensions/og-image.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "After Effects Extensions",
    description: "Discover After Effects extensions ",
    // images: ["/tools/after-effects/extensions/og-image.jpg"],
  },
  keywords: [
    "After Effects Extensions",
    "Layer Flow",
    "Label Color Picker",
    "layer management",
    "workflow automation",
    "Adobe extensions",
  ],
};

function page() {
  return (
    <div className="mt-16">
      <ExtensionsQ />
    </div>
  );
}

export default page;
