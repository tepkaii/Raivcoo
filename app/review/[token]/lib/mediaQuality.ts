// utils/mediaQuality.ts
export const getQualityLabel = (width: number, height: number): string => {
  // Just return the actual resolution - simple and clear
  return `${width}×${height}`;
};

export const getDetailedQuality = (width: number, height: number): string => {
  const totalPixels = width * height;
  const megapixels = (totalPixels / 1000000).toFixed(1);

  // Get common name if it matches standard resolutions
  let commonName = "";
  if (height >= 2160 && width >= 3840) commonName = "4K UHD";
  else if (height >= 1440 && width >= 2560) commonName = "QHD";
  else if (height >= 1080 && width >= 1920) commonName = "Full HD";
  else if (height >= 720 && width >= 1280) commonName = "HD";
  else if (height >= 480) commonName = "SD";

  // Format: "1920×1080 (Full HD, 2.1MP)"
  if (commonName) {
    return `${width}×${height} (${commonName}, ${megapixels}MP)`;
  }

  // Format: "1234×567 (0.7MP)"
  return `${width}×${height} (${megapixels}MP)`;
};

export const getReadableFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = (bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1);

  return `${size} ${units[i]}`;
};

export const getAspectRatio = (width: number, height: number): string => {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const ratioW = width / divisor;
  const ratioH = height / divisor;

  // Common aspect ratio names
  if (ratioW === 16 && ratioH === 9) return "16:9 (Widescreen)";
  if (ratioW === 4 && ratioH === 3) return "4:3 (Standard)";
  if (ratioW === 3 && ratioH === 2) return "3:2 (Classic)";
  if (ratioW === 1 && ratioH === 1) return "1:1 (Square)";
  if (ratioW === 21 && ratioH === 9) return "21:9 (Ultrawide)";

  return `${ratioW}:${ratioH}`;
};

export const getMediaInfo = (
  width: number,
  height: number,
  fileSize: number
) => {
  return {
    resolution: getQualityLabel(width, height),
    detailedQuality: getDetailedQuality(width, height),
    fileSize: getReadableFileSize(fileSize),
    aspectRatio: getAspectRatio(width, height),
    megapixels: ((width * height) / 1000000).toFixed(1),
  };
};