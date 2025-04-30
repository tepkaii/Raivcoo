import React from "react";
import ExtensionPage from "./ExtensionPage";
import { Metadata } from "next";
export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "ReAlign - Layer Alignment and Anchor Point Tool for After Effects",
  description:
    "ReAlign is a free After Effects extension for precise layer alignment and anchor point adjustment. Align layers to 9 positions, distribute spacing, and center layers or anchor points with ease.",
  openGraph: {
    title: "ReAlign - Layer Alignment and Anchor Point Tool for After Effects",
    description:
      "ReAlign is a free After Effects extension for precise layer alignment and anchor point adjustment. Align layers to 9 positions, distribute spacing, and center layers or anchor points with ease.",
    images: ["/extension/realign/ReAlign.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReAlign - Layer Alignment and Anchor Point Tool for After Effects",
    description:
      "ReAlign is a free After Effects extension for precise layer alignment and anchor point adjustment. Align layers to 9 positions, distribute spacing, and center layers or anchor points with ease.",
    images: ["/extension/realign/ReAlign.png"],
  },
};

function page() {
  return <ExtensionPage />;
}

export default page;
