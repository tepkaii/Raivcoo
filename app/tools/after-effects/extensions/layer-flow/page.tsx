import React from "react";
import ExtensionPage from "./ExtensionPage";
import { Metadata } from "next";
export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "LayerFlow Extension - After Effects Workflow Enhancement",
  description:
    "Boost your After Effects workflow with LayerFlow Extension. Features include smart layer management, pre-composition tools, marker systems, and more.",
  openGraph: {
    title: "LayerFlow Extension - After Effects Workflow Enhancement",
    description:
      "Boost your After Effects workflow with LayerFlow Extension. Features include smart layer management, pre-composition tools, marker systems, and more.",
    images: ["/extension/layerFlow-1-v2.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "LayerFlow Extension - After Effects Workflow Enhancement",
    description:
      "Boost your After Effects workflow with LayerFlow Extension. Features include smart layer management, pre-composition tools, marker systems, and more.",
    images: ["/extension/layerFlow-1-v2.png"],
  },
};
function page() {
  return <ExtensionPage />;
}

export default page;
