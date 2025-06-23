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
