// utils/linkify-utils.ts

import { JSX } from "react";

export interface LinkifyConfig {
  target?: string;
  className?: string;
  rel?: string;
}

// Comprehensive URL regex that matches:
// - http:// and https:// URLs
// - www. URLs (without protocol)
// - Domain.com URLs (without protocol or www)
// - URLs with paths, query parameters, and fragments
const URL_REGEX =
  /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)|(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)|(?:(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)))/gi;

// More strict regex for better accuracy
const STRICT_URL_REGEX =
  /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)|www\.[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)|(?:(?<![@\w])[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{2,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)))/gi;

// Simple but effective regex for most cases
const SIMPLE_URL_REGEX =
  /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;

/**
 * Converts URLs in text to clickable links
 */
export function linkifyText(text: string, config: LinkifyConfig = {}): string {
  const {
    target = "_blank",
    className = "text-blue-400 hover:text-blue-300 hover:underline transition-colors",
    rel = "noopener noreferrer",
  } = config;

  return text.replace(SIMPLE_URL_REGEX, (url) => {
    // Ensure the URL has a protocol
    const href = url.startsWith("http") ? url : `https://${url}`;

    return `<a href="${href}" target="${target}" class="${className}" rel="${rel}">${url}</a>`;
  });
}

/**
 * Detects URLs in text and returns them as an array
 */
export function detectUrls(text: string): string[] {
  const matches = text.match(SIMPLE_URL_REGEX);
  return matches || [];
}

/**
 * Checks if a string contains any URLs
 */
export function containsUrl(text: string): boolean {
  return SIMPLE_URL_REGEX.test(text);
}

/**
 * React component helper that converts text with URLs to JSX elements
 */
export function linkifyToReact(
  text: string,
  config: LinkifyConfig = {}
): (string | JSX.Element)[] {
  const {
    target = "_blank",
    className = "text-blue-400 hover:text-blue-300 hover:underline transition-colors",
    rel = "noopener noreferrer",
  } = config;

  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  // Reset regex lastIndex to ensure fresh matching
  const regex = new RegExp(SIMPLE_URL_REGEX.source, SIMPLE_URL_REGEX.flags);

  while ((match = regex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the URL as a link
    const url = match[0];
    const href = url.startsWith("http") ? url : `https://${url}`;

    parts.push(
      <a
        key={`link-${match.index}`}
        href={href}
        target={target}
        className={className}
        rel={rel}
      >
        {url}
      </a>
    );

    lastIndex = regex.lastIndex;
  }

  // Add remaining text after the last URL
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(string: string): boolean {
  try {
    // Add protocol if missing for validation
    const urlString = string.startsWith("http") ? string : `https://${string}`;
    new URL(urlString);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Extracts domain from URL
 */
export function extractDomain(url: string): string | null {
  try {
    const urlString = url.startsWith("http") ? url : `https://${url}`;
    const urlObj = new URL(urlString);
    return urlObj.hostname;
  } catch (_) {
    return null;
  }
}
