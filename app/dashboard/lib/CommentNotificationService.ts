// app/dashboard/lib/CommentNotificationService.ts
interface CommentItem {
  id: string;
  content: string;
  author_name: string;
  media_name: string;
  timestamp_seconds?: number;
  parent_comment?: {
    id: string;
    content: string;
    author_name: string;
  };
}

export async function getCommentNotificationSettings(
  preferences: any,
  activityType: "comment" | "comment_reply",
  isReplyToMe: boolean = false // NEW: Check if this is a reply to the current user
) {
  const commentPrefs = preferences.comments || {};

  if (activityType === "comment") {
    return commentPrefs.all_comments || { enabled: true, delivery: "both" };
  } else if (activityType === "comment_reply") {
    if (isReplyToMe) {
      // This is a reply to the current user's comment
      return commentPrefs.replies_to_me || { enabled: true, delivery: "both" };
    } else {
      // This is a reply to someone else's comment
      return commentPrefs.all_comments || { enabled: true, delivery: "both" };
    }
  }

  return { enabled: false, delivery: "activity" };
}

export async function getCommentActivityTitle(data: {
  activityType: "comment_added" | "comment_reply";
  isOwner: boolean;
  actorName: string;
  commentItem: CommentItem;
}) {
  const { activityType, isOwner, actorName } = data;

  if (activityType === "comment_added") {
    if (isOwner) {
      return `${actorName} commented on your project`;
    } else {
      return `${actorName} added a comment`;
    }
  } else if (activityType === "comment_reply") {
    if (isOwner) {
      return `${actorName} replied to a comment in your project`;
    } else {
      return `${actorName} replied to a comment`;
    }
  }

  return `${actorName} performed an action`;
}

// Helper function to truncate text smartly
function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;

  // Try to break at a word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + "...";
  }

  return truncated + "...";
}

// Helper function to format timestamp
function formatTimestamp(seconds?: number): string {
  if (!seconds) return "";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return ` at ${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export async function getCommentActivityDescription(data: {
  activityType: "comment_added" | "comment_reply";
  isOwner: boolean;
  actorName: string;
  projectName: string;
  commentItem: CommentItem;
}) {
  const { activityType, isOwner, actorName, projectName, commentItem } = data;

  // Format the comment content
  const commentPreview = truncateText(commentItem.content, 80);
  const timestampText = formatTimestamp(commentItem.timestamp_seconds);

  if (activityType === "comment_added") {
    if (isOwner) {
      return `${actorName} commented on "${commentItem.media_name}" in your project ${projectName}${timestampText}: "${commentPreview}"`;
    } else {
      return `${actorName} commented on "${commentItem.media_name}" in ${projectName}${timestampText}: "${commentPreview}"`;
    }
  } else if (activityType === "comment_reply") {
    // For replies, show both the original comment and the reply
    const originalCommentPreview = commentItem.parent_comment
      ? truncateText(commentItem.parent_comment.content, 60)
      : "";

    const replyPreview = truncateText(commentItem.content, 60);

    if (isOwner) {
      if (commentItem.parent_comment) {
        return `${actorName} replied to ${commentItem.parent_comment.author_name}'s comment on "${commentItem.media_name}" in your project ${projectName}${timestampText}. Original: "${originalCommentPreview}" → Reply: "${replyPreview}"`;
      } else {
        return `${actorName} replied to a comment on "${commentItem.media_name}" in your project ${projectName}${timestampText}: "${replyPreview}"`;
      }
    } else {
      if (commentItem.parent_comment) {
        return `${actorName} replied to ${commentItem.parent_comment.author_name}'s comment on "${commentItem.media_name}" in ${projectName}${timestampText}. Original: "${originalCommentPreview}" → Reply: "${replyPreview}"`;
      } else {
        return `${actorName} replied to a comment on "${commentItem.media_name}" in ${projectName}${timestampText}: "${replyPreview}"`;
      }
    }
  }

  return `${actorName} performed an action in ${projectName}`;
}

export async function getDefaultCommentPreferences() {
  return {
    comments: {
      all_comments: { enabled: true, delivery: "both" },
      replies_to_me: { enabled: true, delivery: "both" },
    },
  };
}
