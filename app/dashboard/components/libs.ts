export function getStatusDescription(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "This project has been marked as complete.";
    case "active":
      return "The project is currently active and being worked on.";
    case "in_progress":
      return "The project is in progress and partially completed.";
    case "on_hold":
      return "Work on this project is temporarily paused.";
    case "cancelled":
      return "This project has been cancelled.";
    default:
      return "Unknown status.";
  }
}
export function getStatusDotColor(status: string) {
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-green-500";
    case "active":
      return "bg-blue-500";
    case "in_progress":
    case "on_hold":
      return "bg-yellow-500";
    case "cancelled":
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
}

export function getStatusVariant(
  status: string | undefined | null
):
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info" {
  switch (status?.toLowerCase()) {
    case "completed":
      return "success";
    case "active":
      return "info";
    case "in_progress":
      return "warning";
    case "on_hold":
      return "warning";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}

// Helper functions (unchanged)
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
