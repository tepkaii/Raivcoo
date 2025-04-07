import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// RegExp for public files
const PUBLIC_FILE = /\.(.*)$/;

// Function to get valid subdomain
function getValidSubdomain(host: string): string | null {
  let subdomain: string | null = null;
  const hostParts = host.split(".");

  if (hostParts.length > 2) {
    subdomain = hostParts[0];
    // Add your reserved subdomains here
    const reservedSubdomains = ["www", "app", "api", "admin"];
    if (reservedSubdomains.includes(subdomain)) {
      subdomain = null;
    }
  }

  return subdomain;
}
//
export async function middleware(req: NextRequest) {
  // Handle Supabase session update
  const res = await updateSession(req);

  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";
  const subdomain = getValidSubdomain(host);

  // Skip public files and API routes
  if (
    PUBLIC_FILE.test(url.pathname) ||
    url.pathname.startsWith("/_next") ||
    url.pathname.includes("/api/")
  ) {
    return res;
  }

  // Handle www subdomain
  if (subdomain === "www") {
    return res;
  }

  // Handle valid subdomains
  if (subdomain) {
    const newUrl = new URL(
      `https://www.raivcoo.com/editors/${subdomain}${url.pathname}`
    );
    console.log(`>>> Redirecting: ${url.toString()} to ${newUrl.toString()}`);
    return NextResponse.redirect(newUrl);
  }

  // Pass through for invalid or no subdomains
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};