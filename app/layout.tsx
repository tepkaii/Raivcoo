import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header/Header";
import { Toaster } from "@/components/ui/toaster";
import Footer from "./components/Footer";
import { ThemeProvider } from "./components/ThemeProvider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import HideOnPaths from "./HideOnPaths";
import { Inter } from "next/font/google";
export const metadata: Metadata = {
  title: {
    absolute: "",
    default: "Raivcoo",
    template: "%s",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      // { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      // { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/favicon.ico" },
  },
  keywords: [
    "video editing",
    "portfolio",
    "freelance",
    "creative",
    "video editor",
    "showcase",
    "professional",
  ],
  authors: [{ name: "Raivcoo Team" }],
  creator: "Raivcoo",
  publisher: "Raivcoo",
  description:
    "Raivcoo is the platform where video editors can create, share, and manage their portfolios for free. Discover talented editors or showcase your work today.",
  metadataBase: new URL("https://www.raivcoo.com"),
};
const inter = Inter({ subsets: ["latin"] });
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased  flex flex-col min-h-screen ${inter.className}`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="flex-grow ">
            {" "}
            <HideOnPaths
              pathStarts={[
                "/editors/",
                "/test",
                "/login",
                "/signup",
                "/portfolio",
                "/dashboard",
                "/live-track/",
                "/review/",
              ]}
              // excludePaths={["/links/edit"]}
            >
              <Header />
            </HideOnPaths>
            {children}
            <Analytics />
            <SpeedInsights />
          </main>
          {/* <HideOnPaths
            pathStarts={["/editors/", "/test", "/chat/", "/portfolio"]}
          >
            <Footer />
          </HideOnPaths> */}

          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
