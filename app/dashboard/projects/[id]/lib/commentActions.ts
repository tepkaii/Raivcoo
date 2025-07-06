// app/dashboard/projects/[id]/lib/commentActions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";

import { CommentActivityEmail } from "@/app/components/emails/Activity/CommentActivityEmail";
import {
  getCommentActivityDescription,
  getCommentActivityTitle,
  getCommentNotificationSettings,
  getDefaultCommentPreferences,
} from "@/app/dashboard/lib/CommentNotificationService";

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to get authenticated user with project access
async function getAuthenticatedUserWithProjectAccess(projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: editorProfile } = await supabase
    .from("editor_profiles")
    .select("id, full_name, email")
    .eq("user_id", user.id)
    .single();

  if (!editorProfile) {
    redirect("/account");
  }

  // Check project access using the RPC function
  const { data: accessCheck, error: accessError } = await supabase
    .rpc("check_project_access", {
      project_uuid: projectId,
    })
    .single();

  if (accessError || !accessCheck.has_access) {
    throw new Error("Access denied");
  }

  return {
    supabase,
    user,
    editorProfile,
    accessCheck,
  };
}

// Helper function to check specific permissions
function hasPermission(
  role: string | null,
  isOwner: boolean,
  action: string
): boolean {
  if (isOwner) return true; // Owners can do everything

  if (!role) return false;

  const permissions = {
    viewer: [],
    reviewer: ["comment"],
    collaborator: ["comment"],
  };

  return (
    permissions[role as keyof typeof permissions]?.includes(action) || false
  );
}

// app/dashboard/projects/[id]/lib/commentActions.ts - ADD LOGS TO createCommentAction

export async function createCommentAction(data: {
  projectId: string;
  mediaId: string;
  content: string;
  timestampSeconds?: number;
  parentCommentId?: string;
  annotationData?: any;
  drawingData?: any;
}) {
  try {
    console.log("🔥 PROJECT COMMENT ACTION STARTED:", {
      projectId: data.projectId,
      mediaId: data.mediaId,
      content: data.content?.substring(0, 50) + "...",
      parentCommentId: data.parentCommentId,
    });

    const { supabase, user, editorProfile, accessCheck } =
      await getAuthenticatedUserWithProjectAccess(data.projectId);

    console.log("🔥 USER ACCESS CHECK:", {
      userId: user.id,
      userEmail: user.email,
      editorProfileId: editorProfile.id,
      accessCheckRole: accessCheck.role,
      isOwner: accessCheck.is_owner,
    });

    // Check if user has comment permission
    if (!hasPermission(accessCheck.role, accessCheck.is_owner, "comment")) {
      throw new Error("You don't have permission to add comments");
    }

    // Validate media exists in the project
    const { data: mediaExists, error: mediaError } = await supabase
      .from("project_media")
      .select("id")
      .eq("id", data.mediaId)
      .eq("project_id", data.projectId)
      .single();

    if (mediaError || !mediaExists) {
      throw new Error("Media not found in this project");
    }

    // If this is a reply, validate parent comment exists
    if (data.parentCommentId) {
      const { data: parentExists, error: parentError } = await supabase
        .from("media_comments")
        .select("id")
        .eq("id", data.parentCommentId)
        .eq("media_id", data.mediaId)
        .single();

      if (parentError || !parentExists) {
        throw new Error("Parent comment not found");
      }
    }

    // Create the comment
    const insertData = {
      media_id: data.mediaId,
      user_id: user.id,
      user_name:
        editorProfile.full_name || editorProfile.email || "Unknown User",
      user_email: editorProfile.email,
      content: data.content.trim(),
      timestamp_seconds: data.timestampSeconds || null,
      parent_comment_id: data.parentCommentId || null,
      annotation_data: data.annotationData || null,
      drawing_data: data.drawingData || null,
      session_id: null, // Authenticated users don't need session ID
      is_approved: true,
      is_pinned: false,
      is_resolved: false,
    };

    console.log("🔥 INSERT DATA:", insertData);

    const { data: comment, error: createError } = await supabase
      .from("media_comments")
      .insert(insertData)
      .select()
      .single();

    if (createError) {
      console.error("🔥 COMMENT INSERT ERROR:", createError);
      throw createError;
    }

    console.log("🔥 COMMENT CREATED SUCCESSFULLY:", {
      commentId: comment.id,
      mediaId: comment.media_id,
      userId: comment.user_id,
      userName: comment.user_name,
    });

    // ✅ COMMENT CREATED SUCCESSFULLY - NOW REVALIDATE
    revalidatePath(`/dashboard/projects/${data.projectId}`);

    // 🔥 SEND NOTIFICATIONS ASYNCHRONOUSLY - USE EXISTING PROJECT NOTIFICATION SYSTEM
    const isReply = !!data.parentCommentId;
    console.log("🔥 STARTING PROJECT NOTIFICATIONS:", {
      projectId: data.projectId,
      mediaId: data.mediaId,
      commentId: comment.id,
      isReply,
    });

    setImmediate(() => {
      sendCommentNotifications(
        data.projectId,
        data.mediaId,
        comment,
        user,
        editorProfile,
        accessCheck,
        isReply
      );
    });

    return { success: true, comment };
  } catch (error) {
    console.error("🔥 PROJECT COMMENT ACTION ERROR:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create comment",
    };
  }
}
// Action for creating replies (convenience wrapper)
export async function createReplyAction(data: {
  projectId: string;
  mediaId: string;
  parentCommentId: string;
  content: string;
  timestampSeconds?: number;
}) {
  return createCommentAction({
    ...data,
    parentCommentId: data.parentCommentId,
  });
}

// Action for creating annotated comments
export async function createAnnotatedCommentAction(data: {
  projectId: string;
  mediaId: string;
  content: string;
  timestampSeconds?: number;
  annotationData: any;
  drawingData?: any;
}) {
  return createCommentAction({
    ...data,
    annotationData: data.annotationData,
    drawingData: data.drawingData,
  });
}

// app/dashboard/projects/[id]/lib/commentActions.ts

// 🔥 UPDATED: Enhanced notification function to handle outsiders and guests like review system
// 🔥 UPDATED: Enhanced notification function to handle outsiders and guests like review system
async function sendCommentNotifications(
  projectId: string,
  mediaId: string,
  commentData: any,
  user: any,
  editorProfile: any,
  accessCheck: any,
  isReply: boolean = false
) {
  try {
    const supabase = await createClient();

    // Get project data and media info for notifications
    const { data: projectData } = await supabase
      .from("projects")
      .select("name, notifications_enabled")
      .eq("id", projectId)
      .single();

    const { data: mediaData } = await supabase
      .from("project_media")
      .select("original_filename, mime_type")
      .eq("id", mediaId)
      .single();

    if (!projectData || !mediaData) {
      console.log("🔔 No project or media data found for notifications");
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
        };
        parentCommentAuthorId = parentComment.user_id;
        parentCommentAuthorEmail = parentComment.user_email;
        parentCommentAuthorSessionId = parentComment.session_id;
      }
    }

    console.log(
      `🔔 Starting comment notifications for project ${projectData.name}`
    );

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

    // 1. Get project members using existing RPC
    const { data: projectMembers, error: membersError } = await supabase.rpc(
      "get_project_notification_recipients",
      {
        project_uuid: projectId,
      }
    );

    if (membersError) {
      console.error("Error getting project members:", membersError);
    } else if (projectMembers) {
      for (const member of projectMembers) {
        // Skip the commenter themselves
        if (member.user_id === user.id) {
          console.log(
            `🔔 Skipping project member who is the commenter: ${member.full_name}`
          );
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

        console.log(
          `🔔 Added project ${member.is_owner ? "owner" : "member"}:`,
          member.email,
          `(${member.role})`
        );
      }
    }

    // 🔥 NEW: Get other commenters (outsiders and guests) - SAME LOGIC AS REVIEW SYSTEM
    const { data: otherCommenters, error: commentersError } =
      await supabase.rpc("get_media_commenters", {
        media_uuid: mediaId,
        exclude_user_id: user.id || null,
        exclude_email: editorProfile.email || null,
        exclude_session_id: null, // Project users don't have session IDs
      });

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
          console.log(
            "🔔 Skipping commenter already added as project member:",
            commenter.user_name
          );
          continue;
        }

        if (
          commenter.user_email &&
          seenEmails.has(commenter.user_email.toLowerCase())
        ) {
          console.log(
            "🔔 Skipping commenter already added by email:",
            commenter.user_name
          );
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
          console.log("🔔 Added authenticated outsider:", commenter.user_name);
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
          console.log("🔔 Added guest:", commenter.user_name);
        }
      }
    }

    console.log(`🔔 Total recipients found: ${recipients.length}`);

    // Process each recipient
    for (const recipient of recipients) {
      try {
        // Skip the commenter themselves (double check)
        let isCommenter = false;

        if (user.id && recipient.user_id && user.id === recipient.user_id) {
          isCommenter = true;
        } else if (
          editorProfile.email &&
          recipient.email &&
          editorProfile.email.toLowerCase() === recipient.email.toLowerCase()
        ) {
          isCommenter = true;
        }

        if (isCommenter) {
          console.log(`🔔 SKIPPING: ${recipient.full_name} is the commenter`);
          continue;
        }

        console.log(
          `🔔 Processing recipient: ${recipient.full_name} (${recipient.role})`
        );

        // 🔥 UPDATED NOTIFICATION LOGIC - Same as review system
        let shouldSendNotification = false;
        let notificationReason = "";

        if (recipient.is_guest || recipient.is_outsider) {
          // GUESTS AND OUTSIDERS: Only get reply notifications
          if (isReply) {
            console.log("🔔 CHECKING REPLY MATCH FOR GUEST/OUTSIDER:", {
              recipientName: recipient.full_name,
              recipientRole: recipient.role,
              recipientId: recipient.user_id,
              recipientEmail: recipient.email,
              recipientSessionId: recipient.session_id,
              parentAuthorId: parentCommentAuthorId,
              parentAuthorEmail: parentCommentAuthorEmail,
              parentAuthorSessionId: parentCommentAuthorSessionId,
            });

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
          // PROJECT MEMBER - Use existing logic
          // 🔥 CHECK PROJECT-LEVEL NOTIFICATIONS FOR THIS SPECIFIC USER
          const {
            data: projectNotificationsEnabled,
            error: notificationCheckError,
          } = await supabase
            .rpc("get_user_project_notification_setting", {
              project_uuid: projectId,
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

          // Skip if project notifications are disabled for this user
          if (!projectNotificationsEnabled) {
            console.log(
              `🔔 Skipping ${recipient.full_name} - project notifications disabled for this user`
            );
            continue;
          }

          // Get user preferences
          const { data: userPrefs, error: prefsError } = await supabase
            .rpc("get_user_notification_prefs", {
              target_user_id: recipient.user_id,
            })
            .single();

          if (prefsError) {
            console.error("Error getting user preferences:", prefsError);
          }

          const preferences =
            userPrefs || (await getDefaultCommentPreferences());

          // 🔥 CHECK IF THIS IS A REPLY TO THE CURRENT RECIPIENT
          const activityType = isReply ? "comment_reply" : "comment";
          const isReplyToMe =
            isReply && parentCommentAuthorId === recipient.user_id;

          console.log(
            `🔔 Comment type: ${activityType}, isReplyToMe: ${isReplyToMe} for ${recipient.full_name}`
          );

          // Check if comment notifications are enabled for this user
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

        if (!shouldSendNotification) {
          console.log(
            `🔔 Skipping ${recipient.full_name} - ${notificationReason || "no notification needed"}`
          );
          continue;
        }

        console.log(
          `✅ Sending notification to ${recipient.full_name} - ${notificationReason}`
        );

        // Create comment item for notification
        const commentItem = {
          id: commentData.id,
          content: commentData.content,
          author_name: commentData.user_name,
          media_name: mediaData.original_filename,
          timestamp_seconds: commentData.timestamp_seconds,
          parent_comment: parentCommentData,
        };

        // Create activity notification if needed (only for authenticated users)
        if (
          recipient.user_id &&
          !recipient.is_guest &&
          (!recipient.is_outsider ||
            (recipient.is_outsider &&
              isReply &&
              parentCommentAuthorId === recipient.user_id))
        ) {
          // For outsiders, only create activity notifications for replies to them
          let shouldSendActivity = false;
          let activityTypeForLogging = ""; // 🔥 FIX: For logging purposes

          if (recipient.is_outsider) {
            shouldSendActivity =
              isReply && parentCommentAuthorId === recipient.user_id;
            activityTypeForLogging = "comment_reply"; // 🔥 FIX: For outsider replies
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

            activityTypeForLogging = activityType; // 🔥 FIX: For project member logging

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
            const activityTypeForTitle = isReply
              ? "comment_reply"
              : "comment_added";

            const title = await getCommentActivityTitle({
              activityType: activityTypeForTitle,
              isOwner: recipient.is_owner,
              actorName:
                editorProfile.full_name ||
                editorProfile.email ||
                "Unknown User",
              commentItem,
            });

            const description = await getCommentActivityDescription({
              activityType: activityTypeForTitle,
              isOwner: recipient.is_owner,
              actorName:
                editorProfile.full_name ||
                editorProfile.email ||
                "Unknown User",
              projectName: projectData.name,
              commentItem,
            });

            const isReplyToMe =
              isReply && parentCommentAuthorId === recipient.user_id;

            // Create activity notification
            const { error: notificationError } = await supabase
              .from("activity_notifications")
              .insert({
                user_id: recipient.user_id,
                project_id: projectId,
                title,
                description,
                activity_data: {
                  type: activityTypeForTitle,
                  comment_id: commentData.id,
                  comment_content: commentData.content.substring(0, 100),
                  media_id: mediaId,
                  media_name: mediaData.original_filename,
                  is_owner: recipient.is_owner,
                  is_reply: isReply,
                  is_reply_to_me: isReplyToMe,
                  timestamp_seconds: commentData.timestamp_seconds,
                  parent_comment_id: commentData.parent_comment_id,
                  parent_comment_author_id: parentCommentAuthorId,
                },
                actor_id: user.id,
                actor_name:
                  editorProfile.full_name ||
                  editorProfile.email ||
                  "Unknown User",
                is_read: false,
              });

            if (notificationError) {
              console.error(
                "Error creating activity notification:",
                notificationError
              );
            } else {
              console.log(
                `✅ Comment activity notification created for ${recipient.full_name} (${activityTypeForLogging}, isReplyToMe: ${isReplyToMe})`
              );
            }
          }
        }

        // 🔥 UPDATED EMAIL LOGIC - Same as review system
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
          try {
            console.log(
              `📧 Sending comment email notification to ${recipient.email}`
            );

            const projectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/projects/${projectId}`;
            const actorName =
              editorProfile.full_name || editorProfile.email || "Unknown User";

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

            // 🔥 FIX: Define activityType for logging
            const activityType = isReply ? "comment_reply" : "comment";

            // Create email subject based on type
            let emailSubject = "";
            if (isReply) {
              if (isReplyToMe) {
                emailSubject = `${actorName} replied to your comment in ${projectData.name}`;
              } else {
                emailSubject = `${actorName} replied to a comment in ${projectData.name}`;
              }
            } else {
              emailSubject = `${actorName} commented on ${mediaData.original_filename}`;
            }

            // Fix the parentComment structure for email
            const parentCommentForEmail = parentCommentData
              ? {
                  content: parentCommentData.content,
                  authorName: parentCommentData.author_name,
                }
              : null;

            const { data: emailData, error: emailError } =
              await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL!,
                to: [recipient.email],
                subject: emailSubject,
                react: CommentActivityEmail({
                  recipientName: recipient.full_name || recipient.email,
                  actorName,
                  actorEmail: editorProfile.email,
                  projectName: projectData.name,
                  projectUrl,
                  activityType: isReply ? "reply" : "comment",
                  mediaName: mediaData.original_filename,
                  commentContent: commentData.content,
                  commentTimestamp: commentData.timestamp_seconds,
                  isOwner: recipient.is_owner,
                  isReply,
                  parentComment: parentCommentForEmail,
                  actedAt: new Date().toISOString(),
                  // ✅ PROJECT-SPECIFIC PROPS
                  isReviewComment: false, // This is a project comment, not review
                  reviewToken: undefined,
                  isGuest: recipient.is_guest,
                  isOutsider: recipient.is_outsider,
                  isReplyToMe: isReplyToMe,
                }),
              });

            if (emailError) {
              console.error("❌ Error sending comment email:", emailError);
            } else {
              console.log(
                `✅ Comment email notification sent to ${recipient.email} (${activityType}, isReplyToMe: ${isReplyToMe})`
              );
            }
          } catch (emailError) {
            console.error("❌ Failed to send comment email:", emailError);
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
    console.error("Failed to send comment notifications:", error);
  }
}
