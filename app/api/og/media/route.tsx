// app/api/og/media/route.tsx
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Updated gradient colors to match your MediaDisplay component
const gradients = {
  audio: "from-purple-600 to-blue-800",
  svg: "from-green-600 to-teal-800",
  document: "from-gray-600 to-gray-800",
  video: "from-gray-600 to-gray-800", // fallback for videos without thumbnail
  unknown: "from-gray-600 to-gray-800",
};

// Convert gradients to actual color values for linear-gradient
const getGradientColors = (gradient: string) => {
  const colorMap = {
    "purple-600": "#9333ea",
    "blue-800": "#1e40af",
    "green-600": "#16a34a",
    "teal-800": "#115e59",
    "gray-600": "#4b5563",
    "gray-800": "#1f2937",
  };

  const parts = gradient.split(" ");
  const fromColor = parts[0].replace("from-", "");
  const toColor = parts[2].replace("to-", "");

  return `${colorMap[fromColor as keyof typeof colorMap]}, ${colorMap[toColor as keyof typeof colorMap]}`;
};

// Icon components as JSX for Satori compatibility
const IconComponents = {
  audio: () => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ width: "100%", height: "100%" }}
    >
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  ),
  svg: () => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ width: "100%", height: "100%" }}
    >
      <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
    </svg>
  ),
  document: () => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ width: "100%", height: "100%" }}
    >
      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
    </svg>
  ),
  video: () => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ width: "100%", height: "100%" }}
    >
      <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
    </svg>
  ),
  unknown: () => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ width: "100%", height: "100%" }}
    >
      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
    </svg>
  ),
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename") || "Unknown File";
    const type = searchParams.get("type") || "unknown";
    const mimeType = searchParams.get("mimeType") || "";

    // Get gradient for this file type
    const gradient =
      gradients[type as keyof typeof gradients] || gradients.unknown;
    const gradientColors = getGradientColors(gradient);

    // Get icon component for this file type
    const IconComponent =
      IconComponents[type as keyof typeof IconComponents] ||
      IconComponents.unknown;

    // Get type display name
    const typeDisplay = (() => {
      switch (type) {
        case "audio":
          return "Audio File";
        case "svg":
          return "SVG Vector File";
        case "document":
          return mimeType === "application/pdf"
            ? "PDF Document"
            : "Document File";
        case "video":
          return "Video File";
        default:
          return "Media File";
      }
    })();

    // Truncate filename if too long
    const displayFilename =
      filename.length > 40 ? filename.substring(0, 37) + "..." : filename;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${gradientColors})`,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 128,
              height: 128,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255, 255, 255, 0.8)",
              marginBottom: 32,
            }}
          >
            <IconComponent />
          </div>

          {/* Filename */}
          <div
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: 48,
              fontWeight: 600,
              textAlign: "center",
              marginBottom: 16,
              maxWidth: "90%",
              lineHeight: 1.2,
              wordWrap: "break-word",
            }}
          >
            {displayFilename}
          </div>

          {/* Type */}
          <div
            style={{
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: 32,
              textAlign: "center",
            }}
          >
            {typeDisplay}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`Failed to generate OG image: ${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
