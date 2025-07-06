// app/api/projects/[projectId]/media/route.ts
import { createClient } from "@/utils/supabase/server";
import { uploadFileToR2, getPublicUrl } from "@/lib/r2";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { checkProjectAccess } from "@/app/dashboard/projects/[id]/lib/GeneralActions";
import { Resend } from "resend";
import { MediaActivityEmail } from "@/app/components/emails/Activity/mediaActivityEmail";
import {
  getNotificationSettings,
  getActivityTitle,
  getActivityDescription,
  getDefaultPreferences,
} from "../../../../dashboard/lib/MediaNotificationService";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get editor profile with full info for notifications
    const { data: editorProfile } = await supabase
      .from("editor_profiles")
      .select("id, full_name, email")
      .eq("user_id", user.id)
      .single();

    if (!editorProfile) {
      return NextResponse.json(
        { error: "Editor profile not found" },
        { status: 404 }
      );
    }

    // Check project access and permissions
    const accessCheck = await checkProjectAccess(supabase, projectId);

    if (!accessCheck.has_access) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if user has upload permission
    const canUpload =
      accessCheck.is_owner || accessCheck.role === "collaborator";

    if (!canUpload) {
      return NextResponse.json(
        { error: "You don't have permission to upload media" },
        { status: 403 }
      );
    }

    // Get project data for notifications
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, notifications_enabled")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const parentMediaId = formData.get("parentMediaId") as string | null;

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Calculate total size of files being uploaded
    const totalUploadSize = files.reduce((sum, file) => sum + file.size, 0);
    const MAX_PROJECT_SIZE = 2 * 1024 * 1024 * 1024; // 2GB in bytes

    // Get current total size of project media
    const { data: currentMedia, error: mediaSizeError } = await supabase
      .from("project_media")
      .select("file_size")
      .eq("project_id", projectId);

    if (mediaSizeError) {
      return NextResponse.json(
        { error: "Failed to check project size" },
        { status: 500 }
      );
    }

    const currentTotalSize =
      currentMedia?.reduce((sum, media) => sum + Number(media.file_size), 0) ||
      0;
    const newTotalSize = currentTotalSize + totalUploadSize;

    // Check if adding these files would exceed the 2GB limit
    if (newTotalSize > MAX_PROJECT_SIZE) {
      const remainingSpace = MAX_PROJECT_SIZE - currentTotalSize;
      const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
      };

      return NextResponse.json(
        {
          error: `Upload would exceed 2GB project limit. Current size: ${formatBytes(currentTotalSize)}, Upload size: ${formatBytes(totalUploadSize)}, Available space: ${formatBytes(remainingSpace)}`,
        },
        { status: 413 }
      );
    }

    const uploadedFiles = [];

    for (const file of files) {
      try {
        // Validate individual file size (1GB limit per file)
        if (file.size > 1024 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 1GB limit`);
        }

        // Validate file type
        const allowedTypes = [
          "video/mp4",
          "video/mov",
          "video/avi",
          "video/mkv",
          "video/webm",
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File type ${file.type} is not supported`);
        }

        // Generate unique filename
        const fileExtension = file.name.split(".").pop();
        const uniqueFilename = `${nanoid()}.${fileExtension}`;
        const r2Key = `projects/${projectId}/${uniqueFilename}`;

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to R2
        await uploadFileToR2(r2Key, buffer, file.type);
        const publicUrl = getPublicUrl(r2Key);

        // Determine file type
        const fileType = file.type.startsWith("video/") ? "video" : "image";

        // Prepare media file data
        let mediaData: any = {
          project_id: projectId,
          filename: uniqueFilename,
          original_filename: file.name,
          file_type: fileType,
          mime_type: file.type,
          file_size: file.size,
          r2_key: r2Key,
          r2_url: publicUrl,
          version_number: 1,
          is_current_version: true,
        };

        // If adding as a version to existing media
        if (parentMediaId) {
          // Verify the parent media exists and belongs to this project
          const { data: parentMedia, error: parentError } = await supabase
            .from("project_media")
            .select("id, version_number")
            .eq("id", parentMediaId)
            .eq("project_id", projectId)
            .single();

          if (parentError || !parentMedia) {
            throw new Error("Parent media not found");
          }

          // Get the next version number
          const { data: existingVersions } = await supabase
            .from("project_media")
            .select("version_number")
            .or(`id.eq.${parentMediaId},parent_media_id.eq.${parentMediaId}`)
            .order("version_number", { ascending: false })
            .limit(1);

          const nextVersionNumber =
            existingVersions && existingVersions.length > 0
              ? existingVersions[0].version_number + 1
              : 2; // Parent is version 1

          // Set all other versions to not current
          await supabase
            .from("project_media")
            .update({ is_current_version: false })
            .or(`id.eq.${parentMediaId},parent_media_id.eq.${parentMediaId}`);

          mediaData.parent_media_id = parentMediaId;
          mediaData.version_number = nextVersionNumber;
          mediaData.is_current_version = true; // New version becomes current
        }

        // Save to database
        const { data: mediaFile, error: mediaError } = await supabase
          .from("project_media")
          .insert(mediaData)
          .select()
          .single();

        if (mediaError) throw mediaError;

        uploadedFiles.push({
          id: mediaFile.id,
          name: file.name,
          type: file.type,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          url: publicUrl,
          user_id: user.id,
        });
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        return NextResponse.json(
          {
            error: `Failed to upload ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
          { status: 500 }
        );
      }
    }

    // 🔥 Send Upload Notifications
    if (uploadedFiles.length > 0) {
      try {
        console.log(
          `🔔 Starting upload notifications for project ${project.name}`
        );

        // Get recipients using RPC
        const { data: recipients, error: recipientsError } = await supabase.rpc(
          "get_project_notification_recipients",
          {
            project_uuid: projectId,
          }
        );

        if (recipientsError) {
          console.error("Error getting recipients:", recipientsError);
        } else if (recipients && recipients.length > 0) {
          console.log(`🔔 Found ${recipients.length} potential recipients`);

          // Process each recipient
          for (const recipient of recipients) {
            const isMyMedia = uploadedFiles.some(
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

            console.log(
              `🔔 Project notifications enabled for ${recipient.full_name}: ${projectNotificationsEnabled}`
            );

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
              "upload",
              isMyMedia
            );

            console.log(
              `🔔 Notification settings for ${recipient.full_name}:`,
              {
                projectNotificationsEnabled,
                userPreferenceEnabled: notificationSettings.enabled,
                delivery: notificationSettings.delivery,
                isMyMedia,
              }
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
                activityType: "upload",
                isOwner: recipient.is_owner,
                isMyMedia,
                actorName:
                  editorProfile.full_name ||
                  editorProfile.email ||
                  "Unknown User",
                mediaItems: uploadedFiles,
              });

              const description = await getActivityDescription({
                activityType: "upload",
                isOwner: recipient.is_owner,
                isMyMedia,
                actorName:
                  editorProfile.full_name ||
                  editorProfile.email ||
                  "Unknown User",
                projectName: project.name,
                mediaItems: uploadedFiles,
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
                    type: "media_upload",
                    media_count: uploadedFiles.length,
                    media_details: uploadedFiles.map((item) => ({
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
                  `✅ Upload activity notification created for ${recipient.full_name}`
                );
              }
            }

            // Send email notification if needed
            if (
              notificationSettings.delivery === "email" ||
              notificationSettings.delivery === "both"
            ) {
              try {
                console.log(
                  `📧 Sending email notification to ${recipient.email}`
                );

                const projectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/projects/${projectId}`;

                const { data: emailData, error: emailError } =
                  await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL!,
                    to: [recipient.email],
                    subject: `New Upload - ${uploadedFiles.length} ${uploadedFiles.length === 1 ? "file" : "files"} added to ${project.name}`,
                    react: MediaActivityEmail({
                      recipientName: recipient.full_name || recipient.email,
                      actorName:
                        editorProfile.full_name ||
                        editorProfile.email ||
                        "Unknown User",
                      actorEmail: editorProfile.email,
                      projectName: project.name,
                      projectUrl,
                      activityType: "upload",
                      mediaCount: uploadedFiles.length,
                      mediaDetails: uploadedFiles.map((item) => ({
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
                    `✅ Upload email notification sent to ${recipient.email}`
                  );
                }
              } catch (emailError) {
                console.error("❌ Failed to send email:", emailError);
              }
            }
          }
        } else {
          console.log("🔔 No recipients found for notifications");
        }
      } catch (notificationError) {
        console.error(
          "Failed to send upload notifications:",
          notificationError
        );
        // Don't fail the upload if notifications fail
      }
    } else {
      console.log("🔔 No files uploaded");
    }

    return NextResponse.json({
      message: parentMediaId
        ? `Successfully added ${uploadedFiles.length} new version(s)`
        : `Successfully uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}