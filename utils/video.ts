// utils/video.ts
import { VideoSource } from "@/app/types/editorProfile";

const extractYouTubeVideoId = (url: string): string => {
  if (!url) return "";

  // Handle already embedded URLs
  if (url.includes("youtube.com/embed/")) {
    const embedMatch = url.match(/youtube\.com\/embed\/([^/?]+)/);
    return embedMatch ? embedMatch[1] : "";
  }

  // Handle youtu.be URLs (short format)
  if (url.includes("youtu.be/")) {
    const shortMatch = url.match(/youtu\.be\/([^/?&]+)/);
    return shortMatch ? shortMatch[1] : "";
  }

  // Handle youtube.com URLs
  if (url.includes("youtube.com/watch")) {
    const videoParam = url.split("v=")[1];
    if (!videoParam) return "";
    // Get the video ID by taking everything before any & character
    const ampersandPosition = videoParam.indexOf("&");
    if (ampersandPosition !== -1) {
      return videoParam.substring(0, ampersandPosition);
    }
    return videoParam;
  }

  // Handle YouTube Shorts
  if (url.includes("/shorts/")) {
    const shortsMatch = url.match(/\/shorts\/([^/?&]+)/);
    return shortsMatch ? shortsMatch[1] : "";
  }

  return "";
};

const extractGoogleDriveFileId = (url: string): string => {
  if (!url) return "";

  // Handle already embedded URLs
  if (url.includes("drive.google.com/file/d/")) {
    const fileMatch = url.match(/file\/d\/([^/]+)/);
    return fileMatch ? fileMatch[1] : "";
  }

  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : "";
};

export const videoUtils = {
  cleanYouTubeUrl(url: string): string {
    if (!url) return "";

    // If it's already an embed URL, return as is
    if (url.includes("youtube.com/embed/")) return url;

    const videoId = this.getYouTubeVideoId(url);
    // Return clean watch URL without time parameters
    if (url.includes("youtu.be/")) {
      return `https://youtu.be/${videoId}`;
    }
    return `https://youtube.com/watch?v=${videoId}`;
  },
  normalizeUrl(url: string, source: VideoSource): string {
    if (!url) return "";

    // Convert embed URLs back to normal URLs for validation
    if (source === "YouTube" && url.includes("youtube.com/embed/")) {
      const videoId = url.match(/youtube\.com\/embed\/([^/?]+)/)?.[1];
      if (videoId) {
        return `https://youtube.com/watch?v=${videoId}`;
      }
    }

    if (source === "Google Drive" && url.includes("drive.google.com/file/d/")) {
      const fileId = url.match(/file\/d\/([^/]+)/)?.[1];
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/view`;
      }
    }

    return url;
  },

  getEmbedUrl(url: string, source?: string): string {
    if (!url) return "";

    // YouTube (including Shorts and already embedded)
    if (
      source === "YouTube" ||
      (!source && (url.includes("youtube.com") || url.includes("youtu.be")))
    ) {
      // If already embedded, return as is
      if (url.includes("youtube.com/embed/")) return url;

      const videoId = extractYouTubeVideoId(url);
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Google Drive
    if (
      source === "Google Drive" ||
      (!source && url.includes("drive.google.com"))
    ) {
      // If already in preview format, return as is
      if (url.includes("/preview")) return url;

      const fileId = extractGoogleDriveFileId(url);
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    // Vimeo
    if (url.includes("vimeo.com")) {
      if (url.includes("player.vimeo.com/video/")) return url;

      const vimeoId = url.match(/vimeo\.com\/([0-9]+)/)?.[1];
      return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : url;
    }

    return url;
  },

  isYouTubeUrl(url: string): boolean {
    if (!url) return false;
    return url.includes("youtube.com") || url.includes("youtu.be");
  },

  isGoogleDriveUrl(url: string): boolean {
    if (!url) return false;
    return url.includes("drive.google.com");
  },

  getYouTubeVideoId(url: string): string {
    return extractYouTubeVideoId(url);
  },

  getGoogleDriveFileId(url: string): string {
    return extractGoogleDriveFileId(url);
  },

  validateURL(url: string, source: VideoSource): boolean {
    if (!url) return false;

    // Normalize the URL first
    const normalizedUrl = this.normalizeUrl(url, source);

    const patterns: Record<VideoSource, RegExp | null> = {
      YouTube:
        /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.?be\/).+$/,
      "Google Drive": /^https:\/\/drive\.google\.com\/(file\/d\/|open\?id=).+/,
      Vimeo: /^(https?:\/\/)?(www\.)?(player\.)?vimeo\.com\/(video\/)?[0-9]+/,
      TikTok: /^(https?:\/\/)?(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/,
      Instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/p\/[\w-]+/,
      Dropbox: /^(https?:\/\/)?(www\.)?dropbox\.com\/.*$/,
      Other: null,
    };

    const pattern = patterns[source];
    if (!pattern) {
      try {
        new URL(normalizedUrl);
        return true;
      } catch {
        return false;
      }
    }

    return pattern.test(normalizedUrl);
  },
};
