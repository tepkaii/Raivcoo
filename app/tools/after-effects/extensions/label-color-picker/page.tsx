// page.tsx
import React from "react";
import LabelColorPickerPage from "./LabelColorPickerPage";
import { Metadata } from "next";
export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "Label Color Picker - After Effects Extension",
  description:
    "A simple and efficient After Effects extension for managing layer label colors with 16 preset colors and random assignment functionality.",
  openGraph: {
    title: "Label Color Picker - After Effects Extension",
    description:
      "A simple and efficient After Effects extension for managing layer label colors with 16 preset colors and random assignment functionality.",
    images: ["/extension/labelColorPicker.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Label Color Picker - After Effects Extension",
    description:
      "A simple and efficient After Effects extension for managing layer label colors with 16 preset colors and random assignment functionality.",
    images: ["/extension/labelColorPicker.png"],
  },
  keywords: [
    "After Effects",
    "Label Color Picker",
    "extension",
    "color management",
    "layer labels",
  ],
};

function page() {
  return <LabelColorPickerPage />;
}

export default page;
