// app/api/metadata/route.ts (UPDATED)

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Basic fallback metadata
    const fallbackMetadata = {
      title: generateTitleFromUrl(url),
      description: undefined,
      url,
      domain: new URL(url).hostname,
    };

    // Try to fetch the page
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // If response is not ok, return fallback but still success
    if (!response.ok) {
      console.log(`HTTP ${response.status} for ${url}, using fallback`);
      return NextResponse.json({
        ...fallbackMetadata,
        error: `HTTP ${response.status}`,
      });
    }

    const contentType = response.headers.get("content-type") || "";

    // Only try to parse HTML content
    if (!contentType.includes("text/html")) {
      console.log(`Non-HTML content for ${url}, using fallback`);
      return NextResponse.json({
        ...fallbackMetadata,
        error: "Non-HTML content",
      });
    }

    const html = await response.text();

    // Extract metadata with better regex patterns
    const metadata = extractMetadata(html, url);

    return NextResponse.json({
      ...fallbackMetadata,
      ...metadata,
    });
  } catch (error) {
    console.log(
      `Error fetching ${url}:`,
      error instanceof Error ? error.message : "Unknown error"
    );

    // Return fallback metadata instead of error
    const fallbackMetadata = {
      title: generateTitleFromUrl(url),
      description: undefined,
      url,
      domain: new URL(url).hostname,
      error: error instanceof Error ? error.message : "Failed to fetch",
    };

    return NextResponse.json(fallbackMetadata);
  }
}

function extractMetadata(html: string, url: string) {
  const metadata: any = {};

  // Extract title with multiple fallbacks
  let titleMatch = html.match(
    /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
  );
  if (!titleMatch) {
    titleMatch = html.match(
      /<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i
    );
  }
  if (!titleMatch) {
    titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  }

  if (titleMatch && titleMatch[1]) {
    metadata.title = titleMatch[1].trim().replace(/\s+/g, " ");
  }

  // Extract description with multiple fallbacks
  let descMatch = html.match(
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i
  );
  if (!descMatch) {
    descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    );
  }
  if (!descMatch) {
    descMatch = html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i
    );
  }
  if (!descMatch) {
    descMatch = html.match(
      /<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i
    );
  }

  if (descMatch && descMatch[1]) {
    metadata.description = descMatch[1].trim().replace(/\s+/g, " ");
  }

  return metadata;
}

function generateTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace("www.", "");
    const path = urlObj.pathname;

    // Special cases for common domains
    if (domain.includes("youtube.com") && urlObj.searchParams.get("v")) {
      return `YouTube Video - ${domain}`;
    }
    if (domain.includes("github.com")) {
      const pathParts = path.split("/").filter(Boolean);
      if (pathParts.length >= 2) {
        return `${pathParts[0]}/${pathParts[1]} - GitHub`;
      }
    }
    if (domain.includes("docs.google.com")) {
      return `Google Docs - ${domain}`;
    }
    if (domain.includes("vercel.com")) {
      return `Vercel Project - ${domain}`;
    }
    if (domain.includes("supabase.com")) {
      return `Supabase Dashboard - ${domain}`;
    }

    // Generic path-based title
    if (path && path !== "/") {
      const pathParts = path.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        const title = lastPart
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        return `${title} - ${domain}`;
      }
    }

    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return url;
  }
}
