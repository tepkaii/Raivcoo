// app/review/[token]/lib/reviewCommentNotifications.ts
// @ts-ignore
// @ts-nocheck
"use server";

import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { CommentActivityEmail } from "@/app/components/emails/Activity/CommentActivityEmail";
import {
  getCommentActivityDescription,
  getCommentActivityTitle,
  getCommentNotificationSettings,
  getDefaultCommentPreferences,
} from "../../../dashboard/lib/CommentNotificationService";

const resend = new Resend(process.env.RESEND_API_KEY);

interface ReviewComment {
  id: string;
  content: string;
  user_name: string;
  user_email?: string;
  user_id?: string;
  session_id?: string;
  parent_comment_id?: string;
  timestamp_seconds?: number;
  media_id: string;
  created_at: string;
}


async function getReviewNotificationRecipients(
  reviewLinkData: any, // This comes from the RPC function now
  commentAuthorId?: string,
  commentAuthorEmail?: string,
  commentAuthorSessionId?: string
) {
  const supabase = await createClient();

  const recipients: Array<{
    user_id?: string;
    email: string;
    full_name: string;
    role: string;
    is_owner: boolean;
    is_guest: boolean;
    is_outsider: boolean;
    session_id?: string;
  }> = [];

  // 1. Get project owner and members using RPC function
  const { data: projectMembers, error: membersError } = await supabase.rpc(
    "get_project_members_for_notifications",
    {
      project_uuid: reviewLinkData.project_id,
    }
  );

  if (membersError) {
    console.error("Error getting project members:", membersError);
  } else if (projectMembers) {
    for (const member of projectMembers) {
      // Skip if this is the commenter
      if (commentAuthorId && member.user_id === commentAuthorId) {
        continue;
      }

      // Skip if notifications are disabled for this member
      if (!member.notifications_enabled) {
        continue;
      }

      recipients.push({
        user_id: member.user_id,
        email: member.email,
        full_name: member.display_name || member.full_name || member.email,
        role: member.role,
        is_owner: member.is_owner,
        is_guest: false,
        is_outsider: false,
      });
    }
  }

  // 2. Get other commenters (guests and outsiders) using RPC function
  const { data: otherCommenters, error: commentersError } = await supabase.rpc(
    "get_media_commenters",
    {
      media_uuid: reviewLinkData.media_id,
      exclude_user_id: commentAuthorId || null,
      exclude_email: commentAuthorEmail || null,
      exclude_session_id: commentAuthorSessionId || null,
    }
  );

  if (commentersError) {
    console.error("Error getting other commenters:", commentersError);
  } else if (otherCommenters) {
    const seenEmails = new Set<string>();
    const seenUserIds = new Set<string>();

    // Track already added recipients
    recipients.forEach((recipient) => {
      if (recipient.user_id) seenUserIds.add(recipient.user_id);
      if (recipient.email) seenEmails.add(recipient.email.toLowerCase());
    });

    for (const commenter of otherCommenters) {
      // Skip if already added as project member
      if (commenter.user_id && seenUserIds.has(commenter.user_id)) {
        continue;
      }

      if (
        commenter.user_email &&
        seenEmails.has(commenter.user_email.toLowerCase())
      ) {
        continue;
      }

      if (commenter.user_id) {
        // Authenticated outsider
        recipients.push({
          user_id: commenter.user_id,
          email: commenter.user_email || "",
          full_name: commenter.user_name || "Unknown User",
          role: "outsider",
          is_owner: false,
          is_guest: false,
          is_outsider: true,
        });
        seenUserIds.add(commenter.user_id);
      } else if (commenter.user_email) {
        // Guest with email
        recipients.push({
          email: commenter.user_email,
          full_name: commenter.user_name || "Guest User",
          role: "guest",
          is_owner: false,
          is_guest: true,
          is_outsider: false,
          session_id: commenter.session_id || undefined,
        });
        seenEmails.add(commenter.user_email.toLowerCase());
      }
    }
  }

  return recipients;
}


export async function sendReviewCommentNotifications(
  reviewToken: string,
  commentData: ReviewComment,
  isReply: boolean = false
) {
  try {
    const supabase = await createClient();

    // Get review link data
    const { data: reviewLinkInfo, error: reviewError } = await supabase
      .rpc("get_review_link_data", { review_token: reviewToken })
      .single();

    if (reviewError || !reviewLinkInfo) {
      return;
    }

    // Check if project notifications are enabled
    if (!reviewLinkInfo.project_notifications_enabled) {
      return;
    }

    // Get parent comment data if this is a reply
    let parentCommentData = null;
    let parentCommentAuthorId = null;
    let parentCommentAuthorEmail = null;
    let parentCommentAuthorSessionId = null;

    if (isReply && commentData.parent_comment_id) {
      const { data: parentComment } = await supabase
        .from("media_comments")
        .select("content, user_name, user_id, user_email, session_id")
        .eq("id", commentData.parent_comment_id)
        .single();

      if (parentComment) {
        parentCommentData = {
          id: commentData.parent_comment_id,
          content: parentComment.content,
          author_name: parentComment.user_name,
          author_user_id: parentComment.user_id,
          author_email: parentComment.user_email,
          author_session_id: parentComment.session_id,
        };
        parentCommentAuthorId = parentComment.user_id;
        parentCommentAuthorEmail = parentComment.user_email;
        parentCommentAuthorSessionId = parentComment.session_id;
      }
    }

    // Get recipients
    const recipients = await getReviewNotificationRecipients(
      reviewLinkInfo,
      commentData.user_id,
      commentData.user_email,
      commentData.session_id
    );

    // Process each recipient
    for (const recipient of recipients) {
      try {
        // ✅ SKIP THE COMMENTER
        let isCommenter = false;

        if (
          commentData.user_id &&
          recipient.user_id &&
          commentData.user_id === recipient.user_id
        ) {
          isCommenter = true;
        } else if (
          commentData.user_email &&
          recipient.email &&
          commentData.user_email.toLowerCase() === recipient.email.toLowerCase()
        ) {
          isCommenter = true;
        } else if (
          commentData.session_id &&
          recipient.session_id &&
          commentData.session_id === recipient.session_id
        ) {
          isCommenter = true;
        }

        if (isCommenter) {
          continue;
        }

        // ✅ DETERMINE NOTIFICATION LOGIC
        let shouldSendNotification = false;
        let notificationReason = "";

        if (recipient.is_guest || recipient.is_outsider) {
          // GUESTS AND OUTSIDERS: Only get reply notifications
          if (isReply) {
            // Check all possible ways this could be a reply to them
            const isReplyToThisPerson =
              (parentCommentAuthorId &&
                recipient.user_id &&
                parentCommentAuthorId === recipient.user_id) ||
              (parentCommentAuthorEmail &&
                recipient.email &&
                parentCommentAuthorEmail.toLowerCase() ===
                  recipient.email.toLowerCase()) ||
              (parentCommentAuthorSessionId &&
                recipient.session_id &&
                parentCommentAuthorSessionId === recipient.session_id);

            if (isReplyToThisPerson) {
              shouldSendNotification = true;
              notificationReason = `reply to ${recipient.is_guest ? "guest" : "outsider"}'s comment`;
            }
          }
        } else {
          // PROJECT MEMBER OR OWNER
          // Check project-level notifications for this user
          const {
            data: projectNotificationsEnabled,
            error: notificationCheckError,
          } = await supabase
            .rpc("get_user_project_notification_setting", {
              project_uuid: reviewLinkInfo.project_id,
              target_user_id: recipient.user_id,
            })
            .single();

          if (notificationCheckError) {
            console.error(
              "Error checking project notifications:",
              notificationCheckError
            );
            continue;
          }

          if (!projectNotificationsEnabled) {
            continue;
          }

          // Get user preferences
          const { data: userPrefs, error: prefsError } = await supabase
            .rpc("get_user_notification_prefs", {
              target_user_id: recipient.user_id,
            })
            .single();

          if (prefsError) {
          }

          const preferences =
            userPrefs || (await getDefaultCommentPreferences());

          // Check notification settings
          const activityType = isReply ? "comment_reply" : "comment";
          const isReplyToMe =
            isReply && parentCommentAuthorId === recipient.user_id;

          const notificationSettings = await getCommentNotificationSettings(
            preferences,
            activityType,
            isReplyToMe
          );

          if (notificationSettings.enabled) {
            shouldSendNotification = true;
            notificationReason = `project member notification (${activityType}, isReplyToMe: ${isReplyToMe})`;
          }
        }

        // ✅ SEND NOTIFICATION IF NEEDED
        if (!shouldSendNotification) {
          continue;
        }

        // Create comment item for notification
        const commentItem = {
          id: commentData.id,
          content: commentData.content,
          author_name: commentData.user_name,
          media_name: reviewLinkInfo.media_original_filename,
          timestamp_seconds: commentData.timestamp_seconds,
          parent_comment: parentCommentData,
        };

        // ✅ EMAIL LOGIC
        let shouldSendEmail = false;

        if (recipient.is_guest || recipient.is_outsider) {
          // Always send email to guests and outsiders for replies
          shouldSendEmail = true;
        } else {
          // For project members, check their preferences
          const { data: userPrefs } = await supabase
            .rpc("get_user_notification_prefs", {
              target_user_id: recipient.user_id,
            })
            .single();

          const preferences =
            userPrefs || (await getDefaultCommentPreferences());
          const activityType = isReply ? "comment_reply" : "comment";
          const isReplyToMe =
            isReply && parentCommentAuthorId === recipient.user_id;

          const notificationSettings = await getCommentNotificationSettings(
            preferences,
            activityType,
            isReplyToMe
          );

          shouldSendEmail =
            notificationSettings.delivery === "email" ||
            notificationSettings.delivery === "both";
        }

        if (shouldSendEmail) {
          const isReplyToMe =
            (parentCommentAuthorId &&
              recipient.user_id &&
              parentCommentAuthorId === recipient.user_id) ||
            (parentCommentAuthorEmail &&
              recipient.email &&
              parentCommentAuthorEmail.toLowerCase() ===
                recipient.email.toLowerCase()) ||
            (parentCommentAuthorSessionId &&
              recipient.session_id &&
              parentCommentAuthorSessionId === recipient.session_id);

          await sendReviewEmailNotification(
            recipient,
            commentData,
            commentItem,
            reviewLinkInfo,
            reviewToken,
            isReply,
            isReplyToMe,
            parentCommentData
          );
        }

        // ✅ ACTIVITY NOTIFICATION LOGIC - Only for authenticated users (not guests)
        if (recipient.user_id && !recipient.is_guest) {
          let shouldSendActivity = false;

          if (recipient.is_outsider) {
            // Outsiders get activity notifications for replies to them only
            shouldSendActivity =
              isReply && parentCommentAuthorId === recipient.user_id;
          } else {
            // Project members - check their preferences
            const { data: userPrefs } = await supabase
              .rpc("get_user_notification_prefs", {
                target_user_id: recipient.user_id,
              })
              .single();

            const preferences =
              userPrefs || (await getDefaultCommentPreferences());
            const activityType = isReply ? "comment_reply" : "comment";
            const isReplyToMe =
              isReply && parentCommentAuthorId === recipient.user_id;

            const notificationSettings = await getCommentNotificationSettings(
              preferences,
              activityType,
              isReplyToMe
            );

            shouldSendActivity =
              notificationSettings.delivery === "activity" ||
              notificationSettings.delivery === "both";
          }

          if (shouldSendActivity) {
            const isReplyToMe =
              isReply && parentCommentAuthorId === recipient.user_id;

            await createReviewActivityNotification(
              recipient,
              commentData,
              commentItem,
              reviewLinkInfo,
              reviewToken,
              isReply,
              isReplyToMe,
              parentCommentAuthorId,
              supabase
            );
          }
        }
      } catch (recipientError) {
        console.error(
          `Error processing recipient ${recipient.full_name}:`,
          recipientError
        );
      }
    }
  } catch (error) {
    console.error("🔥 REVIEW NOTIFICATION ERROR:", error);
  }
}

async function sendReviewEmailNotification(
  recipient: any,
  commentData: ReviewComment,
  commentItem: any,
  reviewLinkData: any,
  reviewToken: string,
  isReply: boolean,
  isReplyToMe: boolean,
  parentCommentData: any
) {
  try {
    const reviewUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/review/${reviewToken}`;
    const actorName = commentData.user_name || "Anonymous";

    // Create email subject
    let emailSubject = "";
    if (isReply) {
      if (isReplyToMe) {
        emailSubject = `${actorName} replied to your comment on ${reviewLinkData.project_name}`;
      } else {
        emailSubject = `${actorName} replied to a comment on ${reviewLinkData.project_name}`;
      }
    } else {
      emailSubject = `${actorName} commented on ${reviewLinkData.media_original_filename}`;
    }

    const parentCommentForEmail = parentCommentData
      ? {
          content: parentCommentData.content,
          authorName: parentCommentData.author_name,
        }
      : null;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [recipient.email],
      subject: emailSubject,
      react: CommentActivityEmail({
        recipientName: recipient.full_name || recipient.email,
        actorName,
        actorEmail: commentData.user_email || "",
        projectName: reviewLinkData.project_name,
        projectUrl: reviewUrl,
        activityType: isReply ? "reply" : "comment",
        mediaName: reviewLinkData.media_original_filename,
        commentContent: commentData.content,
        commentTimestamp: commentData.timestamp_seconds,
        isOwner: recipient.is_owner,
        isReply,
        parentComment: parentCommentForEmail,
        actedAt: new Date().toISOString(),
        // Review-specific props
        isReviewComment: true,
        reviewToken: reviewToken,
        isGuest: recipient.is_guest,
        isOutsider: recipient.is_outsider,
        isReplyToMe: isReplyToMe,
      }),
    });

    if (emailError) {
      console.error(
        `❌ Error sending review email to ${recipient.email}:`,
        emailError
      );
    } else {
    }
  } catch (emailError) {
    console.error(
      `❌ Failed to send review email to ${recipient.email}:`,
      emailError
    );
  }
}

async function createReviewActivityNotification(
  recipient: any,
  commentData: ReviewComment,
  commentItem: any,
  reviewLinkData: any,
  reviewToken: string,
  isReply: boolean,
  isReplyToMe: boolean,
  parentCommentAuthorId: string | null,
  supabase: any
) {
  try {
    const activityTypeForTitle = isReply ? "comment_reply" : "comment_added";

    const title = await getCommentActivityTitle({
      activityType: activityTypeForTitle,
      isOwner: recipient.is_owner,
      actorName: commentData.user_name || "Anonymous",
      commentItem,
    });

    const description = await getCommentActivityDescription({
      activityType: activityTypeForTitle,
      isOwner: recipient.is_owner,
      actorName: commentData.user_name || "Anonymous",
      projectName: reviewLinkData.project_name,
      commentItem,
    });

    const { error: notificationError } = await supabase
      .from("activity_notifications")
      .insert({
        user_id: recipient.user_id,
        project_id: reviewLinkData.project_id,
        title,
        description,
        activity_data: {
          type: activityTypeForTitle,
          comment_id: commentData.id,
          comment_content: commentData.content.substring(0, 100),
          media_id: reviewLinkData.media_id,
          media_name: reviewLinkData.media_original_filename,
          is_owner: recipient.is_owner,
          is_reply: isReply,
          is_reply_to_me: isReplyToMe,
          timestamp_seconds: commentData.timestamp_seconds,
          parent_comment_id: commentData.parent_comment_id,
          parent_comment_author_id: parentCommentAuthorId,
          review_token: reviewToken,
          is_review_comment: true,
        },
        actor_id: commentData.user_id,
        actor_name: commentData.user_name || "Anonymous",
        is_read: false,
      });

    if (notificationError) {
      console.error(
        `Error creating review activity notification for ${recipient.full_name}:`,
        notificationError
      );
    } else {
    }
  } catch (activityError) {
    console.error(
      `❌ Failed to create activity notification for ${recipient.full_name}:`,
      activityError
    );
  }
}
