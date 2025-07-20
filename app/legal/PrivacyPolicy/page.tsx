import React from "react";
import { Metadata } from "next";
import Privacy from "./Privacy";
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read our privacy policy to understand how Raivcoo handles your personal data and protects your privacy.",
  openGraph: {
    title: "Privacy Policy | Raivcoo",
    description: "Understanding how we protect your privacy at Raivcoo",
    type: "website",
    siteName: "Raivcoo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Raivcoo",
    description: "Understanding how we protect your privacy at Raivcoo",
  },
};

function page() {
  return (
    <>
      <Privacy />
    </>
  );
}

export default page;
