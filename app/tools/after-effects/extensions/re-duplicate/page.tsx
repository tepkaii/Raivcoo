import React from "react";
import ExtensionPage from "./ExtensionPage";
import { Metadata } from "next";
export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "Re-Duplicate - Layer Duplication Tool for After Effects",
  description:
    "Re-Duplicate is a free After Effects extension to you quickly duplicate and adjust layers in After Effects. You can control how layers are named, ordered,  and transformed, with options like mirroring, numbers of duplicate, and more. It’s a handy tool for saving time and staying organized.",
  openGraph: {
    title: "Re-Duplicate - Layer Duplication  Tool for After Effects",
    description:
      "Re-Duplicate is a free After Effects extension to you quickly duplicate and adjust layers in After Effects. You can control how layers are named, ordered,  and transformed, with options like mirroring, numbers of duplicate, and more. It’s a handy tool for saving time and staying organized.",
    images: ["/extension/re-duplicate/re-duplicate.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Re-Duplicate - Layer Duplication  Tool for After Effects",
    description:
      "Re-Duplicate is a free After Effects extension to you quickly duplicate and adjust layers in After Effects. You can control how layers are named, ordered,  and transformed, with options like mirroring, numbers of duplicate, and more. It’s a handy tool for saving time and staying organized.",
    images: ["/extension/re-duplicate/re-duplicate.png"],
  },
};

function Page() {
  return <ExtensionPage />;
}

export default Page;
