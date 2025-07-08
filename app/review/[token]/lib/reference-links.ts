// app/review/[token]/lib/reference-links.ts (COMPLETE UPDATED FILE)

export interface ProjectReference {
  id: string;
  url: string;
  title?: string;
  customName?: string;
  favicon?: string;
  addedAt: string;
}


/**
 * Validate if string is a valid URL for references
 */
export function isValidReferenceUrl(string: string): boolean {
  try {
    const urlString = string.startsWith("http") ? string : `https://${string}`;
    const url = new URL(urlString);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname.includes(".") &&
      url.hostname.length > 2
    );
  } catch (_) {
    return false;
  }
}

/**
 * Normalize URL for references
 */
export function normalizeReferenceUrl(url: string): string {
  if (!url) return "";

  url = url.trim();

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  return url;
}

/**
 * Extract domain from URL
 */
export function extractReferenceDomain(url: string): string | null {
  try {
    const urlString = url.startsWith("http") ? url : `https://${url}`;
    const urlObj = new URL(urlString);
    return urlObj.hostname;
  } catch (_) {
    return null;
  }
}

/**
 * Parse multiple URLs from text input
 */
export function parseReferencesFromText(text: string): string[] {
  if (!text?.trim()) return [];

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const validUrls: string[] = [];

  for (const line of lines) {
    const normalized = normalizeReferenceUrl(line);
    if (isValidReferenceUrl(normalized)) {
      validUrls.push(normalized);
    }
  }

  return [...new Set(validUrls)];
}

/**
 * Get favicon URL using Google's service
 */
export function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?sz=32&domain=${domain}`;
}

/**
 * Generate title from URL as fallback
 */
export function generateTitleFromUrl(url: string): string {
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

/**
 * Create reference object from URL
 */
export function createReference(
  url: string,
  customName?: string
): ProjectReference {
  const domain = extractReferenceDomain(url);
  const favicon = domain ? getFaviconUrl(domain) : undefined;

  return {
    id: crypto.randomUUID(),
    url: normalizeReferenceUrl(url),
    customName,
    favicon,
    title: generateTitleFromUrl(url), // Add default title immediately
    addedAt: new Date().toISOString(),
  };
}
