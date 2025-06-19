// app/api/projects/[projectId]/media/route.ts
import { createClient } from "@/utils/supabase/server";
import { uploadFileToR2, getPublicUrl } from "@/lib/r2";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

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

    // Get editor profile
    const { data: editorProfile } = await supabase
      .from("editor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!editorProfile) {
      return NextResponse.json(
        { error: "Editor profile not found" },
        { status: 404 }
      );
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, editor_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.editor_id !== editorProfile.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const parentMediaId = formData.get("parentMediaId") as string | null;

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      try {
        // Validate file size (200MB limit)
        if (file.size > 200 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 200MB limit`);
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