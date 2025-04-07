import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Define types for referrer tracking
type ReferrerType = "direct" | "search" | "social" | "external" | "internal";

interface ReferrerData {
  type: ReferrerType;
  source: string;
  url: string | null;
}

async function getLocationData(ip: any) {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    return {
      country: data.country_name,
      country_code: data.country_code,
      city: data.city,
    };
  } catch (error) {
    console.error("Error detecting location:", error);
    return {
      country: "Unknown",
      country_code: "UN",
      city: "Unknown",
    };
  }
}

function getDeviceType(userAgent: string | null): string {
  if (!userAgent) return "Unknown";
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(
    userAgent
  );
  return isMobile ? "Mobile" : "PC";
}

function getReferrerData(
  referrerUrl: string | null,
  host: string
): ReferrerData {
  if (!referrerUrl) {
    return {
      type: "direct",
      source: "direct",
      url: null,
    };
  }

  try {
    const referrerUrlObj = new URL(referrerUrl);
    const referrerHostname = referrerUrlObj.hostname;

    // Check if it's internal traffic
    if (referrerHostname === host) {
      return {
        type: "internal",
        source: host,
        url: referrerUrl,
      };
    }

    // Check for search engines
    const searchEngines = {
      "google.com": "Google",
      "bing.com": "Bing",
      "yahoo.com": "Yahoo",
      "duckduckgo.com": "DuckDuckGo",
    };

    // Check for social media
    const socialMedia = {
      "facebook.com": "Facebook",
      "twitter.com": "Twitter",
      "instagram.com": "Instagram",
      "linkedin.com": "LinkedIn",
      "pinterest.com": "Pinterest",
      "youtube.com": "YouTube",
      "reddit.com": "Reddit",
      "github.com": "GitHub",
      "gitlab.com": "GitLab",
      "stackoverflow.com": "Stack Overflow",
      "medium.com": "Medium",
      "t.me": "Telegram",
      "t.co": "Twitter",
      "m.facebook.com": "Facebook",
      "x.com": "Twitter",
      "l.facebook.com": "Facebook",
    };

    for (const [domain, name] of Object.entries(searchEngines)) {
      if (referrerHostname.includes(domain)) {
        return {
          type: "search",
          source: name,
          url: referrerUrl,
        };
      }
    }

    for (const [domain, name] of Object.entries(socialMedia)) {
      if (referrerHostname.includes(domain)) {
        return {
          type: "social",
          source: name,
          url: referrerUrl,
        };
      }
    }

    // If none of the above, it's external
    return {
      type: "external",
      source: referrerHostname,
      url: referrerUrl,
    };
  } catch (error) {
    console.error("Error parsing referrer:", error);
    return {
      type: "direct",
      source: "direct",
      url: null,
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profileId, originalReferrer } = await req.json();

    // Use the originalReferrer from the client instead of the request header
    const host = req.headers.get("host") || "";
    const referrerData = getReferrerData(originalReferrer, host);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "Unknown";
    const userAgent = req.headers.get("user-agent");
    const deviceType = getDeviceType(userAgent);
    const locationData = await getLocationData(ip);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profile_views")
      .insert({
        profile_id: profileId,
        viewer_country: locationData.country,
        viewer_country_code: locationData.country_code,
        viewer_city: locationData.city,
        device_type: deviceType,
        ip: ip,
        duration: 10,
        referrer: {
          type: referrerData.type,
          source: referrerData.source,
          url: referrerData.url,
        },
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, viewId: data.id });
  } catch (error) {
    console.error("Track view error:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}