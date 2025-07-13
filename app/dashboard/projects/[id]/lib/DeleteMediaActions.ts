// app/dashboard/projects/[id]/lib/DeleteMediaActions.ts
// @ts-nocheck
"use server";

import { createClient } from "@/utils/supabase/server";
import { deleteFileFromR2, deleteThumbnailIfExists } from "@/lib/r2";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { MediaActivityEmail } from "@/app/components/emails/Activity/mediaActivityEmail";
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
      return;
    }

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
      return;
    }

    // Process each recipient
    for (const recipient of recipients) {
      try {
        const isMyMedia = deletedFiles.some(
          (file) => file.user_id === recipient.user_id
        );

        //CHECK PROJECT-LEVEL NOTIFICATIONS FOR THIS SPECIFIC USER
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
          }
        }

        // Send email notification if needed
        if (
          notificationSettings.delivery === "email" ||
          notificationSettings.delivery === "both"
        ) {
          try {
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

    // Get the media to delete WITH full context
    const { data: mediaToDelete, error: mediaError } = await supabase
      .from("project_media")
      .select(
        "id, r2_key, thumbnail_r2_key, parent_media_id, is_current_version, original_filename, mime_type, file_size, version_number"
      )
      .eq("id", mediaId)
      .eq("project_id", projectId)
      .single();

    if (mediaError || !mediaToDelete) {
      console.log(`❌ Media not found: ${mediaId}`);
      throw new Error("Media not found");
    }

    // Prepare deleted file data for notifications
    const deletedFiles = [{
      id: mediaToDelete.id,
      name: mediaToDelete.original_filename,
      type: mediaToDelete.mime_type,
      size: `${(mediaToDelete.file_size / 1024 / 1024).toFixed(2)} MB`,
      user_id: user.id,
    }];

    // Determine the parent ID (either this media's parent or itself if it's a parent)
    const parentId = mediaToDelete.parent_media_id || mediaToDelete.id;
   
    // Get ALL media in this group (parent + all versions)
    const { data: allGroupMedia, error: groupError } = await supabase
      .from("project_media")
      .select("id, r2_key, thumbnail_r2_key, original_filename, version_number, is_current_version, parent_media_id, uploaded_at")
      .or(`id.eq.${parentId},parent_media_id.eq.${parentId}`)
      .order("version_number", { ascending: false }); // ✅ Sort by version number (highest first)

    if (groupError) {
     
      throw new Error("Failed to get media group");
    }
    // Filter out the media we're deleting
    const remainingMedia = allGroupMedia.filter(m => m.id !== mediaId);

    // Prepare all database updates
    const updates = [];

    if (remainingMedia.length === 0) {
      
    } else {
    
      // There are other versions remaining - we need to reorganize
      
      // Check if we're deleting the parent
      const deletingParent = !mediaToDelete.parent_media_id;

      if (deletingParent) {
        // ✅ We're deleting the parent - promote the HIGHEST VERSION to new parent
        const sortedRemaining = remainingMedia
          .sort((a, b) => b.version_number - a.version_number); // Highest version first
        
        const newParent = sortedRemaining[0]; // Highest version becomes parent
        
        // ✅ Promote new parent - Keep its version number, just remove parent_media_id and make it current
        updates.push(
          supabase
            .from("project_media")
            .update({
              parent_media_id: null,
              is_current_version: true
              // ✅ Keep original version_number - don't change it to 1!
            })
            .eq("id", newParent.id)
        );

        // ✅ Update all other remaining media to reference the new parent
        const otherVersions = sortedRemaining.slice(1);
        
        otherVersions.forEach((version) => {
          updates.push(
            supabase
              .from("project_media")
              .update({
                parent_media_id: newParent.id,
                is_current_version: false
                // ✅ Keep original version_number - don't renumber!
              })
              .eq("id", version.id)
          );
        });

        // Update review links to point to new parent
        updates.push(
          supabase
            .from("review_links")
            .update({ media_id: newParent.id })
            .eq("media_id", parentId)
        );
      } else {
        
        // Check if we need to set a new current version
        if (mediaToDelete.is_current_version) {
          // ✅ Find the HIGHEST version number among remaining media
          const newCurrentVersion = remainingMedia
            .sort((a, b) => b.version_number - a.version_number)[0]; // Highest version

          if (newCurrentVersion) {
            updates.push(
              supabase
                .from("project_media")
                .update({ is_current_version: true })
                .eq("id", newCurrentVersion.id)
            );
          }
        }
        // ✅ NO RENUMBERING - Keep original version numbers intact
      }
    }

    // Execute all database updates in parallel
    if (updates.length > 0) {
      const results = await Promise.allSettled(updates);
      
      // Check for failures
      const failures = results.filter(result => result.status === "rejected");
      if (failures.length > 0) {
        console.error("❌ Some database updates failed:", failures);
        // Continue anyway - the main deletion should still work
      } else {

      }
    }

    // ✅ DELETE ONLY THE SPECIFIC MEDIA'S R2 FILES
    try {
      await deleteFileFromR2(mediaToDelete.r2_key);
     
      
      if (mediaToDelete.thumbnail_r2_key) {
        await deleteThumbnailIfExists(mediaToDelete);
       
      }
    } catch (r2Error) {
      console.error("❌ R2 deletion error:", r2Error);
      // Continue with database deletion even if R2 fails
    }

    // Delete the actual media record from database
   
    const { error: deleteError } = await supabase
      .from("project_media")
      .delete()
      .eq("id", mediaId);

    if (deleteError) {
      console.error(`❌ Database deletion failed:`, deleteError);
      throw deleteError;
    }
    // Revalidate and send notifications
    revalidatePath(`/dashboard/projects/${projectId}`);

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
    console.error("❌ Delete media error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete media",
    };
  }
}
// Helper function to renumber versions
async function renumberVersions(parentMediaId: string, supabase: any) {
  try {
    // Get all versions sorted by upload date (oldest first)
    const { data: versions } = await supabase
      .from("project_media")
      .select("id, uploaded_at")
      .eq("parent_media_id", parentMediaId)
      .order("uploaded_at", { ascending: true });

    if (!versions || versions.length === 0) {
      return;
    }

    // Get the parent's current version number
    const { data: parent } = await supabase
      .from("project_media")
      .select("version_number")
      .eq("id", parentMediaId)
      .single();

    const parentVersionNumber = parent?.version_number || 1;

    // ✅ CORRECT: Renumber versions starting from parent_version + 1
    for (let i = 0; i < versions.length; i++) {
      const newVersionNumber = parentVersionNumber + i + 1;
      const { error: updateError } = await supabase
        .from("project_media")
        .update({ version_number: newVersionNumber })
        .eq("id", versions[i].id);

      if (updateError) {
        console.error(`Error renumbering version ${versions[i].id}:`, updateError);
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
    "project_id, r2_key, thumbnail_r2_key, parent_media_id, is_current_version, original_filename, mime_type, file_size"
  )
      .eq("id", versionId)
      .single();

    if (!mediaData) {
     
      throw new Error("Media not found");
    }
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

    // ✅ DELETE ONLY THIS VERSION'S R2 FILES
    try {
      await deleteFileFromR2(mediaData.r2_key);
    
      
      if (mediaData.thumbnail_r2_key) {
        await deleteThumbnailIfExists(mediaData);
      
      }
    } catch (r2Error) {
      console.error("❌ R2 deletion error:", r2Error);
    }

    // Delete from database
    const { error: deleteError } = await authSupabase
      .from("project_media")
      .delete()
      .eq("id", versionId);

    if (deleteError) {
      console.error(`❌ Database deletion failed:`, deleteError);
      throw deleteError;
    }

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
    console.error("❌ Delete version error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete version",
    };
  }
}
