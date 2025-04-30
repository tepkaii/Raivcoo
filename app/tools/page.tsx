// /app/tools/page.tsx
import React from "react";
import ToolsPage from "./ToolsPage";
import { Metadata } from "next";
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Video Editing Tools & Resources",
  description: "Explore our collection of video editing tools",
  openGraph: {
    title: "Video Editing Tools & Resources",
    description: "Explore our collection of video editing tools",

    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Video Editing Tools & Resources",
    description: "Explore our collection of video editing tools",
  },
  keywords: [
    "Video Editing Tools",
    "Layer Flow",
    "Label Color Picker",
    "After Effects Extensions",
    "Layer Management",
    "Video Editor Resources",
  ],
};

function page() {
  return <ToolsPage />;
}

export default page;
