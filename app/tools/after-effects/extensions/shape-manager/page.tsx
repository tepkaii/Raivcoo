import React from "react";
import { Metadata } from "next";
import ShapeManagerPage from "./ShapeManagerPage";
export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "Shape Manager - After Effects Shape Library",
  description:
    "A simple tool to save and organize After Effects shapes into collections. Import shapes from layers and apply them quickly to your compositions.",
  openGraph: {
    title: "Shape Manager - After Effects Shape Library",
    description:
      "A simple tool to save and organize After Effects shapes into collections. Import shapes from layers and apply them quickly to your compositions.",
    images: ["/extension/ShapeManager/Shape Manager.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shape Manager - After Effects Shape Library",
    description:
      "A simple tool to save and organize After Effects shapes into collections. Import shapes from layers and apply them quickly to your compositions.",
    images: ["/extension/ShapeManager/Shape Manager.png"],
  },
};

function page() {
  return <ShapeManagerPage />;
}

export default page;
