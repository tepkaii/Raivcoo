// app/dashboard/projects/[id]/lib/statusChangeActions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { StatusChangeEmail } from "@/app/components/emails/Activity/statusChangeEmail";
import {

  getDefaultPreferences,
} from "../../../lib/MediaNotificationService";

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to get authenticated editor with project access
export async function getAuthenticatedEditorWithProjectAccess(
  projectId: string
) {
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

  // Check project access using the RPC function (SAME AS DELETE ACTION)
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
    reviewer: ["editStatus"],
    collaborator: [
      "upload",
      "delete",
      "editStatus",
      "createReviewLinks",
      "manageVersions",
    ],
  };

  return (
    permissions[role as keyof typeof permissions]?.includes(action) || false
  );
}

// Status labels mapping
const STATUS_LABELS = {
  on_hold: "On Hold",
  in_progress: "In Progress",
  needs_review: "Needs Review",
  rejected: "Rejected",
  approved: "Approved",
} as const;

// Helper functions for status change notifications
function getStatusChangeActivityTitle(data: {
  isOwner: boolean;
  isMyMedia: boolean;
  actorName: string;
  mediaName: string;
  oldStatus: string;
  newStatus: string;
}) {
  const { isOwner, isMyMedia, actorName, mediaName, oldStatus, newStatus } =
    data;

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

function getStatusChangeActivityDescription(data: {
  isOwner: boolean;
  isMyMedia: boolean;
  actorName: string;
  projectName: string;
  mediaName: string;
  oldStatus: string;
  newStatus: string;
}) {
  const {
    isOwner,
    isMyMedia,
    actorName,
    projectName,
    mediaName,
    oldStatus,
    newStatus,
  } = data;

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

export async function changeMediaStatusAction(
  projectId: string,
  mediaId: string,
  newStatus: string
) {
  try {
    const { supabase, user, editorProfile, accessCheck } =
      await getAuthenticatedEditorWithProjectAccess(projectId);

    // Check if user has edit status permission
    if (!hasPermission(accessCheck.role, accessCheck.is_owner, "editStatus")) {
      throw new Error("You don't have permission to change media status");
    }

    // Get current media info
    const { data: currentMedia, error: mediaError } = await supabase
      .from("project_media")
      .select(
        "id, original_filename, file_type, file_size, r2_url, status, project_id"
      )
      .eq("id", mediaId)
      .eq("project_id", projectId)
      .single();

    if (mediaError || !currentMedia) {
      throw new Error("Media not found");
    }

    const oldStatus = currentMedia.status;

    // Only proceed if status is actually changing
    if (oldStatus === newStatus) {
      return { success: true, message: "Status unchanged" };
    }

    // Update media status
    const { error: updateError } = await supabase
      .from("project_media")
      .update({ status: newStatus })
      .eq("id", mediaId);

    if (updateError) {
      throw updateError;
    }

    // ✅ STATUS CHANGE COMPLETED SUCCESSFULLY - NOW REVALIDATE
    revalidatePath(`/dashboard/projects/${projectId}`);

    // 🔥 SEND NOTIFICATIONS ASYNCHRONOUSLY - DON'T WAIT FOR THEM
    // This runs in the background and won't affect the status change response
    setImmediate(() => {
      sendStatusChangeNotifications(
        projectId,
        currentMedia,
        oldStatus,
        newStatus,
        user,
        editorProfile,
        accessCheck
      );
    });

    return {
      success: true,
      message: `Status changed to ${STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS] || newStatus}`,
    };
  } catch (error) {
    console.error("Change status error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to change status",
    };
  }
}

// app/dashboard/projects/[id]/lib/statusChangeActions.ts
// Update the sendStatusChangeNotifications function:

async function sendStatusChangeNotifications(
  projectId: string,
  mediaFile: any,
  oldStatus: string,
  newStatus: string,
  user: any,
  editorProfile: any,
  accessCheck: any
) {
  try {
    const supabase = await createClient();

    // Get project data for notifications
    const { data: project } = await supabase
      .from("projects")
      .select("name, notifications_enabled")
      .eq("id", projectId)
      .single();

    if (!project) {
      console.log("🔔 No project found for status change notifications");
      return;
    }

    console.log(
      `🔔 Starting status change notifications for project ${project.name}`
    );

    // Get recipients using RPC (SAME AS DELETE ACTION)
    const { data: recipients, error: recipientsError } = await supabase.rpc(
      "get_project_notification_recipients",
      {
        project_uuid: projectId,
      }
    );

    if (recipientsError) {
      console.error("Error getting recipients:", recipientsError);
      return;
    }

    if (!recipients || recipients.length === 0) {
      console.log("🔔 No recipients found for notifications");
      return;
    }

    console.log(`🔔 Found ${recipients.length} potential recipients`);

    // Process each recipient
    for (const recipient of recipients) {
      try {
        // 🔥 SKIP THE PERSON WHO MADE THE CHANGE
        if (recipient.user_id === user.id) {
          console.log(
            `🔔 SKIPPING status changer: ${recipient.full_name} (they made the change)`
          );
          continue;
        }

        const isMyMedia = mediaFile.uploaded_by === recipient.user_id;

        console.log(
          `🔔 Processing recipient: ${recipient.full_name} (${recipient.role})`
        );

        // Check if this recipient should be notified based on status levels
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

        const preferences = userPrefs || (await getDefaultPreferences());

        // Check status change notification settings
        const statusChangeSettings = preferences.status_changes || {
          enabled: true,
          delivery: "both",
          levels: ["approved", "rejected"],
        };

        // Check if notifications are enabled and if this status level should trigger notifications
        if (
          !statusChangeSettings.enabled ||
          !statusChangeSettings.levels.includes(newStatus)
        ) {
          console.log(
            `🔔 Skipping ${recipient.full_name} - status change notifications disabled or status not in notification levels`
          );
          continue;
        }

        // Create activity notification if needed
        if (
          statusChangeSettings.delivery === "activity" ||
          statusChangeSettings.delivery === "both"
        ) {
          const title = getStatusChangeActivityTitle({
            isOwner: recipient.is_owner,
            isMyMedia,
            actorName:
              editorProfile.full_name || editorProfile.email || "Unknown User",
            mediaName: mediaFile.original_filename,
            oldStatus,
            newStatus,
          });

          const description = getStatusChangeActivityDescription({
            isOwner: recipient.is_owner,
            isMyMedia,
            actorName:
              editorProfile.full_name || editorProfile.email || "Unknown User",
            projectName: project.name,
            mediaName: mediaFile.original_filename,
            oldStatus,
            newStatus,
          });

          // Create activity notification
          const { error: notificationError } = await supabase
            .from("activity_notifications")
            .insert({
              user_id: recipient.user_id,
              project_id: projectId,
              title,
              description,
              activity_data: {
                type: "media_status_change",
                media_id: mediaFile.id,
                media_name: mediaFile.original_filename,
                old_status: oldStatus,
                new_status: newStatus,
                is_owner: recipient.is_owner,
                is_my_media: isMyMedia,
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
              `✅ Status change activity notification created for ${recipient.full_name}`
            );
          }
        }

        // Send email notification if needed
        if (
          statusChangeSettings.delivery === "email" ||
          statusChangeSettings.delivery === "both"
        ) {
          try {
            console.log(`📧 Sending email notification to ${recipient.email}`);

            const projectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/projects/${projectId}`;

            const { data: emailData, error: emailError } =
              await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL!,
                to: [recipient.email],
                subject: `Status Update - ${mediaFile.original_filename} is now ${STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS] || newStatus} in ${project.name}`,
                react: StatusChangeEmail({
                  recipientName: recipient.full_name || recipient.email,
                  actorName:
                    editorProfile.full_name ||
                    editorProfile.email ||
                    "Unknown User",
                  actorEmail: editorProfile.email,
                  projectName: project.name,
                  projectUrl,
                  mediaName: mediaFile.original_filename,
                  mediaType: mediaFile.file_type,
                  mediaSize: `${(mediaFile.file_size / 1024 / 1024).toFixed(2)} MB`,
                  oldStatus,
                  newStatus,
                  oldStatusLabel:
                    STATUS_LABELS[oldStatus as keyof typeof STATUS_LABELS] ||
                    oldStatus,
                  newStatusLabel:
                    STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS] ||
                    newStatus,
                  isOwner: recipient.is_owner,
                  isMyMedia,
                  changedAt: new Date().toISOString(),
                  // mediaPreviewUrl: mediaFile.r2_url, // REMOVED
                }),
              });

            if (emailError) {
              console.error("❌ Error sending email:", emailError);
            } else {
              console.log(
                `✅ Status change email notification sent to ${recipient.email}`
              );
            }
          } catch (emailError) {
            console.error("❌ Failed to send email:", emailError);
          }
        }
      } catch (recipientError) {
        console.error(
          `Error processing recipient ${recipient.full_name}:`,
          recipientError
        );
        // Continue with other recipients
      }
    }
  } catch (error) {
    console.error("Failed to send status change notifications:", error);
    // Don't throw - notifications are not critical
  }
}
