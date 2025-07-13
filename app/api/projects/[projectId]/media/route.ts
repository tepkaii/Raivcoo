// @ts-nocheck
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

// Plan limits based on subscription
const PLAN_LIMITS = {
  free: {
    maxUploadSize: 200 * 1024 * 1024, // 200MB
    maxStorage: 0.5 * 1024 * 1024 * 1024, // 500MB
  },
  lite: {
    maxUploadSize: 2 * 1024 * 1024 * 1024, // 2GB
    maxStorage: null, // Dynamic based on subscription.storage_gb
  },
  pro: {
    maxUploadSize: 5 * 1024 * 1024 * 1024, // 5GB
    maxStorage: null, // Dynamic based on subscription.storage_gb
  },
};

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

    // Get user's subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select(
        "plan_id, status, current_period_end, storage_gb, max_upload_size_mb"
      )
      .eq("user_id", user.id)
      .single();

    // Determine upload limits based on subscription
    const isActive =
      subscription &&
      subscription.status === "active" &&
      subscription.current_period_end &&
      new Date(subscription.current_period_end) > new Date();

    let maxUploadSize = PLAN_LIMITS.free.maxUploadSize;
    let maxStorage = PLAN_LIMITS.free.maxStorage;

    if (isActive && subscription.plan_id !== "free") {
      const planId = subscription.plan_id as keyof typeof PLAN_LIMITS;

      if (planId === "lite" || planId === "pro") {
        // Use subscription-specific limits
        maxUploadSize = subscription.max_upload_size_mb
          ? subscription.max_upload_size_mb * 1024 * 1024
          : PLAN_LIMITS[planId].maxUploadSize;

        maxStorage = subscription.storage_gb
          ? subscription.storage_gb * 1024 * 1024 * 1024
          : PLAN_LIMITS.free.maxStorage;
      }
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
    const thumbnails = formData.getAll("thumbnails") as File[];
    const thumbnailFor = formData.getAll("thumbnailFor") as string[];
    const parentMediaId = formData.get("parentMediaId") as string | null;

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Create thumbnail mapping
    const thumbnailMap = new Map<string, File>();
    thumbnails.forEach((thumbnail, index) => {
      if (thumbnailFor[index]) {
        thumbnailMap.set(thumbnailFor[index], thumbnail);
      }
    });

    // Validate individual file sizes against plan limits
    for (const file of files) {
      if (file.size > maxUploadSize) {
        const formatBytes = (bytes: number) => {
          if (bytes === 0) return "0 Bytes";
          const k = 1024;
          const sizes = ["Bytes", "KB", "MB", "GB"];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return (
            parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
          );
        };

        const planName =
          !isActive || subscription.plan_id === "free"
            ? "Free"
            : subscription.plan_id.charAt(0).toUpperCase() +
              subscription.plan_id.slice(1);

        return NextResponse.json(
          {
            error: `File "${file.name}" (${formatBytes(file.size)}) exceeds the ${planName} plan limit of ${formatBytes(maxUploadSize)} per file. ${!isActive || subscription.plan_id === "free" ? "Upgrade to Lite or Pro for larger files." : "Check your subscription settings."}`,
          },
          { status: 413 }
        );
      }
    }

    // Calculate total size of files being uploaded
    const totalUploadSize = files.reduce((sum, file) => sum + file.size, 0);

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

    // Check if adding these files would exceed the storage limit
    if (newTotalSize > maxStorage) {
      const remainingSpace = maxStorage - currentTotalSize;
      const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
      };

      const planName =
        !isActive || subscription.plan_id === "free"
          ? "Free"
          : subscription.plan_id.charAt(0).toUpperCase() +
            subscription.plan_id.slice(1);

      return NextResponse.json(
        {
          error: `Upload would exceed ${planName} plan storage limit. Current size: ${formatBytes(currentTotalSize)}, Upload size: ${formatBytes(totalUploadSize)}, Available space: ${formatBytes(remainingSpace)}. ${!isActive || subscription.plan_id === "free" ? "Upgrade to Lite or Pro for more storage." : "Increase your storage allocation."}`,
        },
        { status: 413 }
      );
    }

    const uploadedFiles: any[] = [];

    for (const file of files) {
      try {
        // Validate file type
        const allowedTypes = [
          // Video types
          "video/mp4",
          "video/mov",
          "video/avi",
          "video/mkv",
          "video/webm",
          // Image types
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/svg+xml",

          // Audio types
          "audio/mpeg", // MP3
          "audio/wav",
          "audio/ogg",
          "audio/flac",
          "audio/aac",
          "audio/mp4", // M4A
          "audio/x-wav", // Alternative WAV
          "audio/vorbis", // OGG Vorbis
          // Document types
          "application/pdf",
          "application/msword", // DOC
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
          "application/vnd.ms-powerpoint", // PPT
          "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX
          "text/plain", // TXT
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
        const fileType = (() => {
          if (file.type.startsWith("video/")) return "video";
          if (file.type.startsWith("image/")) return "image";
          if (file.type.startsWith("audio/")) return "audio";
          if (
            file.type === "application/pdf" ||
            file.type.includes("document") ||
            file.type.includes("presentation") ||
            file.type === "text/plain"
          )
            return "document";
          return "file";
        })();

        // Handle thumbnail upload for videos
        let thumbnailData: {
          thumbnail_r2_key?: string;
          thumbnail_r2_url?: string;
          thumbnail_generated_at?: string;
        } = {};

        if (fileType === "video" && thumbnailMap.has(file.name)) {
          try {
            const thumbnailFile = thumbnailMap.get(file.name)!;
            const thumbnailBuffer = Buffer.from(
              await thumbnailFile.arrayBuffer()
            );
            const thumbnailR2Key = `projects/${projectId}/thumbnails/${uniqueFilename}_thumbnail.jpg`;

            await uploadFileToR2(thumbnailR2Key, thumbnailBuffer, "image/jpeg");

            thumbnailData = {
              thumbnail_r2_key: thumbnailR2Key,
              thumbnail_r2_url: getPublicUrl(thumbnailR2Key),
              thumbnail_generated_at: new Date().toISOString(),
            };
          } catch (thumbnailError) {
            console.error(
              `Thumbnail upload error for ${file.name}:`,
              thumbnailError
            );
            // Continue without thumbnail
          }
        }

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
          ...thumbnailData, // Add thumbnail data if available
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

        uploadedFiles.push(mediaFile);
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

    // Send notifications (keeping existing notification logic)
    if (uploadedFiles.length > 0) {
      try {
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
          // Process each recipient (keeping existing notification logic)
          for (const recipient of recipients) {
            const isMyMedia = user.id === recipient.user_id;

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

            if (!projectNotificationsEnabled) {
              continue;
            }

            const { data: userPrefs, error: prefsError } = await supabase
              .rpc("get_user_notification_prefs", {
                target_user_id: recipient.user_id,
              })
              .single();

            if (prefsError) {
              console.error("Error getting user preferences:", prefsError);
            }

            const preferences = userPrefs || (await getDefaultPreferences());

            const notificationSettings = await getNotificationSettings(
              preferences,
              "upload",
              isMyMedia
            );

            if (!notificationSettings.enabled) {
              continue;
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
                mediaItems: uploadedFiles.map((file) => ({
                  name: file.original_filename,
                  type: file.mime_type,
                  size: `${(file.file_size / 1024 / 1024).toFixed(2)} MB`,
                })),
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
                mediaItems: uploadedFiles.map((file) => ({
                  name: file.original_filename,
                  type: file.mime_type,
                  size: `${(file.file_size / 1024 / 1024).toFixed(2)} MB`,
                })),
              });

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
                    media_details: uploadedFiles.map((file) => ({
                      name: file.original_filename,
                      type: file.mime_type,
                      size: `${(file.file_size / 1024 / 1024).toFixed(2)} MB`,
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
                      mediaDetails: uploadedFiles.map((file) => ({
                        name: file.original_filename,
                        type: file.mime_type,
                        size: `${(file.file_size / 1024 / 1024).toFixed(2)} MB`,
                      })),
                      isOwner: recipient.is_owner,
                      isMyMedia,
                      actedAt: new Date().toISOString(),
                    }),
                  });

                if (emailError) {
                  console.error("❌ Error sending email:", emailError);
                }
              } catch (emailError) {
                console.error("❌ Failed to send email:", emailError);
              }
            }
          }
        }
      } catch (notificationError) {
        console.error(
          "Failed to send upload notifications:",
          notificationError
        );
        // Don't fail the upload if notifications fail
      }
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
