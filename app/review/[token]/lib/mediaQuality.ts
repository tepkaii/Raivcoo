// utils/mediaQuality.ts
export const getQualityLabel = (width: number, height: number): string => {
  // Sort by total pixels for accurate classification
  const totalPixels = width * height;

  // Common video/image quality standards
  if (height >= 2160) return "4K"; // 3840×2160 or higher
  if (height >= 1440) return "1440p"; // 2560×1440
  if (height >= 1080) return "1080p"; // 1920×1080
  if (height >= 720) return "720p"; // 1280×720
  if (height >= 480) return "480p"; // 854×480
  if (height >= 360) return "360p"; // 640×360
  if (height >= 240) return "240p"; // 426×240

  return `${width}×${height}`; // Fallback to actual dimensions
};

export const getDetailedQuality = (width: number, height: number): string => {
  const label = getQualityLabel(width, height);
  return `${label} (${width}×${height})`;
};
