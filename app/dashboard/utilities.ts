// Utilities

// format sections
export function formatStatus(status: string): string {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export const formatFullDate = (
  dateString: string | undefined | null
): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);

  // For consistent formatting across locales including Arabic
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch (error) {
    // Fallback to basic formatting if Intl fails
    return `${date.toDateString()} ${date.toTimeString().substring(0, 5)}`;
  }
};

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatNumber(number: number): string {
  const formatter = new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  });
  return formatter.format(number);
}

export const formatStorage = (gb: number) => {
  if (gb < 1) return `${Math.round(gb * 1000)}MB`;
  return `${gb}GB`;
};

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const formatUploadSize = (planId: string) => {
  const uploadSizes = {
    free: "200MB",
    lite: "2GB",
    pro: "5GB",
  };
  return uploadSizes[planId as keyof typeof uploadSizes] || "Unknown";
};
//  File category helper
export const getFileCategory = (fileType: string, mimeType: string) => {
  if (fileType === "video") return "video";
  if (fileType === "image" && mimeType !== "image/svg+xml") return "image";
  if (mimeType === "image/svg+xml") return "svg";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("document") ||
    mimeType.includes("presentation") ||
    mimeType === "text/plain"
  )
    return "document";
  return "unknown";
};

//
export const MEDIA_STATUS_OPTIONS = [
  { value: "on_hold", label: "On Hold", color: "bg-gray-500" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { value: "needs_review", label: "Needs Review", color: "bg-yellow-500" },
  { value: "rejected", label: "Rejected", color: "bg-red-500" },
  { value: "approved", label: "Approved", color: "bg-green-500" },
] as const;

export const getStatusConfig = (status: string) => {
  return (
    MEDIA_STATUS_OPTIONS.find((option) => option.value === status) || {
      value: status,
      label: status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      color: "bg-gray-500",
    }
  );
};
