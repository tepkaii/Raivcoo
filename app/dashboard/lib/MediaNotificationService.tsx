// app/dashboard/lib/MediaNotificationService.ts (additions)
interface MediaItem {
  id: string;
  name: string;
  type: string;
  size?: string;
  url?: string;
  user_id: string;
}

export async function getNotificationSettings(
  preferences: any,
  activityType: "upload" | "delete" | "status_change",
  isMyMedia: boolean
) {
  const mediaPrefs = preferences.media || {};

  if (activityType === "upload") {
    if (isMyMedia) {
      return mediaPrefs.my_uploads || { enabled: false, delivery: "activity" };
    } else {
      return mediaPrefs.others_uploads || { enabled: true, delivery: "both" };
    }
  } else if (activityType === "delete") {
    if (isMyMedia) {
      return mediaPrefs.my_deletes || { enabled: false, delivery: "activity" };
    } else {
      return mediaPrefs.others_deletes || { enabled: true, delivery: "both" };
    }
  } else {
    // status_change
    return (
      preferences.status_changes || {
        enabled: true,
        delivery: "both",
        levels: ["approved", "rejected"],
      }
    );
  }
}

export async function getActivityTitle(data: {
  activityType: "upload" | "delete" | "status_change";
  isOwner: boolean;
  isMyMedia: boolean;
  actorName: string;
  mediaItems?: MediaItem[];
  mediaName?: string;
  oldStatus?: string;
  newStatus?: string;
}) {
  const {
    activityType,
    isOwner,
    isMyMedia,
    actorName,
    mediaItems,
    mediaName,
    oldStatus,
    newStatus,
  } = data;

  if (activityType === "status_change") {
    const STATUS_LABELS = {
      on_hold: "On Hold",
      in_progress: "In Progress",
      needs_review: "Needs Review",
      rejected: "Rejected",
      approved: "Approved",
    } as const;

    const newStatusLabel =
      STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS] || newStatus;

    if (isMyMedia) {
      return `Your media "${mediaName}" status changed to ${newStatusLabel}`;
    } else if (isOwner) {
      return `${actorName} changed "${mediaName}" status to ${newStatusLabel}`;
    } else {
      return `${actorName} changed "${mediaName}" status to ${newStatusLabel}`;
    }
  }

  // Existing upload/delete logic
  const count = mediaItems?.length || 0;

  if (activityType === "upload") {
    if (isMyMedia) {
      return `You uploaded ${count} ${count === 1 ? "file" : "files"}`;
    } else if (isOwner) {
      return `${actorName} uploaded ${count} ${count === 1 ? "file" : "files"} to your project`;
    } else {
      return `${actorName} uploaded ${count} ${count === 1 ? "file" : "files"}`;
    }
  } else {
    // delete
    if (isMyMedia) {
      return `You deleted ${count} ${count === 1 ? "file" : "files"}`;
    } else if (isOwner) {
      return `${actorName} deleted ${count} ${count === 1 ? "file" : "files"} from your project`;
    } else {
      return `${actorName} deleted ${count} ${count === 1 ? "file" : "files"}`;
    }
  }
}

export async function getActivityDescription(data: {
  activityType: "upload" | "delete" | "status_change";
  isOwner: boolean;
  isMyMedia: boolean;
  actorName: string;
  projectName: string;
  mediaItems?: MediaItem[];
  mediaName?: string;
  oldStatus?: string;
  newStatus?: string;
}) {
  const {
    activityType,
    isOwner,
    isMyMedia,
    actorName,
    projectName,
    mediaItems,
    mediaName,
    oldStatus,
    newStatus,
  } = data;

  if (activityType === "status_change") {
    const STATUS_LABELS = {
      on_hold: "On Hold",
      in_progress: "In Progress",
      needs_review: "Needs Review",
      rejected: "Rejected",
      approved: "Approved",
    } as const;

    const oldStatusLabel =
      STATUS_LABELS[oldStatus as keyof typeof STATUS_LABELS] || oldStatus;
    const newStatusLabel =
      STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS] || newStatus;

    if (isMyMedia) {
      return `Your media "${mediaName}" in ${projectName} has been updated from ${oldStatusLabel} to ${newStatusLabel}`;
    } else {
      return `${actorName} changed "${mediaName}" status from ${oldStatusLabel} to ${newStatusLabel} in ${projectName}`;
    }
  }

  // Existing upload/delete logic
  const count = mediaItems?.length || 0;

  // Helper function to format file list
  const formatFileList = (items: MediaItem[], maxShow: number = 3) => {
    if (items.length === 0) return "";

    const filesToShow = items.slice(0, maxShow);
    const fileNames = filesToShow.map((item) => `"${item.name}"`).join(", ");

    if (items.length > maxShow) {
      const remaining = items.length - maxShow;
      return `${fileNames} and ${remaining} more ${remaining === 1 ? "file" : "files"}`;
    }

    return fileNames;
  };

  const fileList = formatFileList(mediaItems || []);

  if (activityType === "upload") {
    if (isMyMedia) {
      if (count === 1) {
        return `Your file ${fileList} has been uploaded to ${projectName}`;
      } else {
        return `Your files ${fileList} have been uploaded to ${projectName}`;
      }
    } else {
      if (count === 1) {
        return `${actorName} uploaded ${fileList} to ${projectName}`;
      } else {
        return `${actorName} uploaded ${fileList} to ${projectName}`;
      }
    }
  } else {
    // delete
    if (isMyMedia) {
      if (count === 1) {
        return `Your file ${fileList} has been deleted from ${projectName}`;
      } else {
        return `Your files ${fileList} have been deleted from ${projectName}`;
      }
    } else {
      if (count === 1) {
        return `${actorName} deleted ${fileList} from ${projectName}`;
      } else {
        return `${actorName} deleted ${fileList} from ${projectName}`;
      }
    }
  }
}

export async function getDefaultPreferences() {
  return {
    media: {
      my_uploads: { enabled: false, delivery: "activity" },
      others_uploads: { enabled: true, delivery: "both" },
      my_deletes: { enabled: false, delivery: "activity" },
      others_deletes: { enabled: true, delivery: "both" },
    },
    status_changes: {
      enabled: true,
      delivery: "both",
      levels: ["approved", "rejected"],
    },
  };
}
