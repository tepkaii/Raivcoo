import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header/Header";
import { Toaster } from "@/components/ui/toaster";
import Footer from "./components/Footer";
import { ThemeProvider } from "./components/ThemeProvider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import HideOnPaths from "./components/HideOnPaths";

import { GeistSans } from "geist/font/sans";

export const metadata: Metadata = {
  title: {
    default: "Raivcoo – Review Videos and Share Feedback Easily",
    template: "%s | Raivcoo",
  },
  description:
    "Raivcoo helps solo editors and small teams review videos, collect feedback, and share projects easily. Fair pricing, simple tools, and flexible storage built for creators.",
  keywords: [
    "video review tool",
    "media feedback",
    "video collaboration",
    "client feedback platform",
    "Frame.io alternative",
    "tools for solo editors",
    "creative feedback",
    "video proofing software",
    "freelance editor tools",
  ],
  authors: [{ name: "Raivcoo" }],
  creator: "Raivcoo",
  publisher: "Raivcoo",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en",
    url: "https://www.raivcoo.com",
    siteName: "Raivcoo",
    title: "Raivcoo – Review Videos and Share Feedback Easily",
    description:
      "Review videos, share links, and get clear feedback — all in one place. Raivcoo is built for solo editors who want simple tools and pricing that makes sense.",
    // images omitted since Next.js auto picks up app/opengraph-image.png
  },
  twitter: {
    card: "summary_large_image",
    title: "Raivcoo – Review Videos and Share Feedback Easily",
    description:
      "Review videos, share links, and get clear feedback — all in one place. Raivcoo is built for solo editors who want simple tools and pricing that makes sense.",
    creator: "@raivcoo",
  },
  alternates: {
    canonical: "https://www.raivcoo.com",
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased  flex flex-col min-h-screen ${GeistSans.className}`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
        >
          <main className="flex-grow ">
            {" "}
            <HideOnPaths
              pathStarts={[
                "/login",
                "/signup",
                "/dashboard",
                "/review/",
                "/complete-profile",
                "/set-password",
                "/media",
                "/success",
                "/subscription",
                "/invite/",
                "/settings/",
                "/activity",
                "/checkout",
                "/checkout/",
              ]}
            >
              <Header />
            </HideOnPaths>
            {children}
            <Analytics />
            <SpeedInsights />
          </main>
          <HideOnPaths
            pathStarts={[
              "/dashboard",
              "/review/",
              "/media/",
              "/invite/",
              "/complete-profile",
            ]}
          >
            <Footer />
          </HideOnPaths>

          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
