// app/dashboard/projects/[id]/lib/deleteMediaActions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { deleteFileFromR2 } from "@/lib/r2";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { MediaActivityEmail } from "@/app/components/emails/mediaActivityEmail";
import {
  getNotificationSettings,
  getActivityTitle,
  getActivityDescription,
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

// 🔥 ASYNC NOTIFICATION FUNCTION - RUNS AFTER DELETE COMPLETES
async function sendDeleteNotifications(
  projectId: string,
  deletedFiles: any[],
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

    if (!project || deletedFiles.length === 0) {
      console.log("🔔 No project found or no files to notify about");
      return;
    }

    console.log(`🔔 Starting delete notifications for project ${project.name}`);

    // Get recipients using RPC
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
        const isMyMedia = deletedFiles.some(
          (file) => file.user_id === recipient.user_id
        );

        console.log(
          `🔔 Processing recipient: ${recipient.full_name} (${recipient.role})`
        );

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
          continue; // Skip this user if we can't check their settings
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

        // Check if notifications are enabled for this user
        const notificationSettings = await getNotificationSettings(
          preferences,
          "delete",
          isMyMedia
        );

        if (!notificationSettings.enabled) {
          console.log(
            `🔔 Skipping ${recipient.full_name} - user preferences disabled`
          );
          continue; // Skip this user
        }

        // Create activity notification if needed
        if (
          notificationSettings.delivery === "activity" ||
          notificationSettings.delivery === "both"
        ) {
          const title = await getActivityTitle({
            activityType: "delete",
            isOwner: recipient.is_owner,
            isMyMedia,
            actorName:
              editorProfile.full_name || editorProfile.email || "Unknown User",
            mediaItems: deletedFiles,
          });

          const description = await getActivityDescription({
            activityType: "delete",
            isOwner: recipient.is_owner,
            isMyMedia,
            actorName:
              editorProfile.full_name || editorProfile.email || "Unknown User",
            projectName: project.name,
            mediaItems: deletedFiles,
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
                type: "media_delete",
                media_count: deletedFiles.length,
                media_details: deletedFiles.map((item) => ({
                  name: item.name,
                  type: item.type,
                  size: item.size,
                })),
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
              `✅ Delete activity notification created for ${recipient.full_name}`
            );
          }
        }

        // Send email notification if needed
        if (
          notificationSettings.delivery === "email" ||
          notificationSettings.delivery === "both"
        ) {
          try {
            console.log(`📧 Sending email notification to ${recipient.email}`);

            const projectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/projects/${projectId}`;

            const { data: emailData, error: emailError } =
              await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL!,
                to: [recipient.email],
                subject: `Files Deleted - ${deletedFiles.length} ${deletedFiles.length === 1 ? "file" : "files"} removed from ${project.name}`,
                react: MediaActivityEmail({
                  recipientName: recipient.full_name || recipient.email,
                  actorName:
                    editorProfile.full_name ||
                    editorProfile.email ||
                    "Unknown User",
                  actorEmail: editorProfile.email,
                  projectName: project.name,
                  projectUrl,
                  activityType: "delete",
                  mediaCount: deletedFiles.length,
                  mediaDetails: deletedFiles.map((item) => ({
                    name: item.name,
                    type: item.type,
                    size: item.size,
                  })),
                  isOwner: recipient.is_owner,
                  isMyMedia,
                  actedAt: new Date().toISOString(),
                }),
              });

            if (emailError) {
              console.error("❌ Error sending email:", emailError);
            } else {
              console.log(
                `✅ Delete email notification sent to ${recipient.email}`
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
    console.error("Failed to send delete notifications:", error);
    // Don't throw - notifications are not critical
  }
}

export async function deleteMediaAction(projectId: string, mediaId: string) {
  try {
    const { supabase, user, editorProfile, accessCheck } =
      await getAuthenticatedEditorWithProjectAccess(projectId);

    // Check if user has delete permission
    if (!hasPermission(accessCheck.role, accessCheck.is_owner, "delete")) {
      throw new Error("You don't have permission to delete media");
    }

    // Get media file info including versions for notifications
    const { data: mediaToDelete, error: mediaError } = await supabase
      .from("project_media")
      .select(
        "id, r2_key, parent_media_id, is_current_version, original_filename, mime_type, file_size"
      )
      .eq("id", mediaId)
      .eq("project_id", projectId)
      .single();

    if (mediaError || !mediaToDelete) {
      throw new Error("Media not found");
    }

    // Collect all files that will be deleted (for notifications)
    const deletedFiles = [];

    // Add the main file
    deletedFiles.push({
      id: mediaToDelete.id,
      name: mediaToDelete.original_filename,
      type: mediaToDelete.mime_type,
      size: `${(mediaToDelete.file_size / 1024 / 1024).toFixed(2)} MB`,
      user_id: user.id,
    });

    // Store parent ID for potential renumbering
    let parentIdForRenumbering = mediaToDelete.parent_media_id;

    // If this is a parent media, we need to handle its versions
    if (!mediaToDelete.parent_media_id) {
      // Get all versions of this media
      const { data: versions } = await supabase
        .from("project_media")
        .select("id, r2_key, original_filename, mime_type, file_size")
        .eq("parent_media_id", mediaId);

      // Add versions to deleted files list
      if (versions) {
        versions.forEach((version) => {
          deletedFiles.push({
            id: version.id,
            name: version.original_filename,
            type: version.mime_type,
            size: `${(version.file_size / 1024 / 1024).toFixed(2)} MB`,
            user_id: user.id,
          });
        });

        // Delete all versions from R2 and database
        for (const version of versions) {
          try {
            await deleteFileFromR2(version.r2_key);
          } catch (r2Error) {
            console.error("R2 deletion error for version:", r2Error);
          }

          await supabase.from("project_media").delete().eq("id", version.id);
        }
      }

      // Delete all review links for this parent media
      await supabase.from("review_links").delete().eq("media_id", mediaId);
    } else {
      // This is a version, check if we need to update current version
      if (mediaToDelete.is_current_version) {
        const { data: otherVersions } = await supabase
          .from("project_media")
          .select("id, version_number")
          .or(
            `id.eq.${mediaToDelete.parent_media_id},parent_media_id.eq.${mediaToDelete.parent_media_id}`
          )
          .neq("id", mediaId)
          .order("version_number", { ascending: false })
          .limit(1);

        if (otherVersions && otherVersions.length > 0) {
          await supabase
            .from("project_media")
            .update({ is_current_version: true })
            .eq("id", otherVersions[0].id);
        }
      }
    }

    // Delete from R2
    try {
      await deleteFileFromR2(mediaToDelete.r2_key);
    } catch (r2Error) {
      console.error("R2 deletion error:", r2Error);
    }

    // Delete media from database
    const { error: deleteError } = await supabase
      .from("project_media")
      .delete()
      .eq("id", mediaId);

    if (deleteError) {
      throw deleteError;
    }

    // If we deleted a version, renumber the remaining versions
    if (parentIdForRenumbering) {
      await renumberVersions(parentIdForRenumbering, supabase);
    }

    // ✅ DELETE COMPLETED SUCCESSFULLY - NOW REVALIDATE
    revalidatePath(`/dashboard/projects/${projectId}`);

    // 🔥 SEND NOTIFICATIONS ASYNCHRONOUSLY - DON'T WAIT FOR THEM
    // This runs in the background and won't affect the delete response
    setImmediate(() => {
      sendDeleteNotifications(
        projectId,
        deletedFiles,
        user,
        editorProfile,
        accessCheck
      );
    });

    return { success: true };
  } catch (error) {
    console.error("Delete media error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete media",
    };
  }
}

// Helper function to renumber versions
async function renumberVersions(parentMediaId: string, supabase: any) {
  try {
    console.log(`🔄 Renumbering versions for parent media: ${parentMediaId}`);

    // Get all versions sorted by upload date
    const { data: versions } = await supabase
      .from("project_media")
      .select("id, uploaded_at")
      .eq("parent_media_id", parentMediaId)
      .order("uploaded_at", { ascending: true });

    if (!versions || versions.length === 0) {
      console.log("🔄 No versions to renumber");
      return;
    }

    console.log(`🔄 Renumbering ${versions.length} versions`);

    // Renumber versions starting from 2 (parent is always 1)
    for (let i = 0; i < versions.length; i++) {
      const newVersionNumber = i + 2;
      const { error: updateError } = await supabase
        .from("project_media")
        .update({ version_number: newVersionNumber })
        .eq("id", versions[i].id);

      if (updateError) {
        console.error(
          `Error renumbering version ${versions[i].id}:`,
          updateError
        );
      } else {
        console.log(
          `✅ Version ${versions[i].id} renumbered to ${newVersionNumber}`
        );
      }
    }
  } catch (error) {
    console.error("Renumber versions error:", error);
  }
}

export async function deleteVersionAction(versionId: string) {
  try {
    // First get the project ID from the media
    const supabase = await createClient();
    const { data: mediaData } = await supabase
      .from("project_media")
      .select(
        "project_id, r2_key, parent_media_id, is_current_version, original_filename, mime_type, file_size"
      )
      .eq("id", versionId)
      .single();

    if (!mediaData) throw new Error("Media not found");

    const {
      supabase: authSupabase,
      user,
      editorProfile,
      accessCheck,
    } = await getAuthenticatedEditorWithProjectAccess(mediaData.project_id);

    // Check if user has delete permission
    if (!hasPermission(accessCheck.role, accessCheck.is_owner, "delete")) {
      throw new Error("You don't have permission to delete versions");
    }

    if (!mediaData.parent_media_id) {
      throw new Error("Cannot delete parent media using this action");
    }

    // Prepare deleted file data for notifications
    const deletedFiles = [
      {
        id: versionId,
        name: mediaData.original_filename,
        type: mediaData.mime_type,
        size: `${(mediaData.file_size / 1024 / 1024).toFixed(2)} MB`,
        user_id: user.id,
      },
    ];

    // If this is the current version, set another version as current
    if (mediaData.is_current_version) {
      const { data: otherVersions } = await authSupabase
        .from("project_media")
        .select("id, version_number")
        .or(
          `id.eq.${mediaData.parent_media_id},parent_media_id.eq.${mediaData.parent_media_id}`
        )
        .neq("id", versionId)
        .order("version_number", { ascending: false })
        .limit(1);

      if (otherVersions && otherVersions.length > 0) {
        await authSupabase
          .from("project_media")
          .update({ is_current_version: true })
          .eq("id", otherVersions[0].id);
      }
    }

    // Delete from R2
    try {
      await deleteFileFromR2(mediaData.r2_key);
    } catch (r2Error) {
      console.error("R2 deletion error:", r2Error);
    }

    // Delete from database
    const { error: deleteError } = await authSupabase
      .from("project_media")
      .delete()
      .eq("id", versionId);

    if (deleteError) throw deleteError;

    // Renumber remaining versions
    await renumberVersions(mediaData.parent_media_id, authSupabase);

    // ✅ DELETE COMPLETED SUCCESSFULLY - NOW REVALIDATE
    revalidatePath(`/dashboard/projects/${mediaData.project_id}`);

    // 🔥 SEND NOTIFICATIONS ASYNCHRONOUSLY - DON'T WAIT FOR THEM
    setImmediate(() => {
      sendDeleteNotifications(
        mediaData.project_id,
        deletedFiles,
        user,
        editorProfile,
        accessCheck
      );
    });

    return { success: true };
  } catch (error) {
    console.error("Delete version error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete version",
    };
  }
}
