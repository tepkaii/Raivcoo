// app/dashboard/projects/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { uploadFileToR2, getPublicUrl } from "@/lib/r2";
import { nanoid } from "nanoid";

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (profileError || !editorProfile)
    throw new Error("Failed to fetch editor profile");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name?.trim()) {
    throw new Error("Project name is required");
  }

  try {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        editor_id: editorProfile.id,
        name: name.trim(),
        description: description?.trim() || null,
      })
      .select("id, name")
      .single();

    if (projectError) throw projectError;

    revalidatePath("/dashboard/projects");

    return {
      message: "Project workspace created successfully",
      project,
    };
  } catch (error) {
    console.error("Error creating project:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred during project creation.");
  }
}

export async function uploadMedia(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const projectId = formData.get("projectId") as string;
  const files = formData.getAll("files") as File[];

  if (!projectId || !files.length) {
    throw new Error("Project ID and files are required");
  }

  // Verify project ownership
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, editor_id")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    throw new Error("Project not found");
  }

  const { data: editorProfile } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (project.editor_id !== editorProfile?.id) {
    throw new Error("Unauthorized");
  }

  const uploadedFiles = [];

  for (const file of files) {
    try {
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

      // Save to database
      const { data: mediaFile, error: mediaError } = await supabase
        .from("project_media")
        .insert({
          project_id: projectId,
          filename: uniqueFilename,
          original_filename: file.name,
          file_type: fileType,
          mime_type: file.type,
          file_size: file.size,
          r2_key: r2Key,
          r2_url: publicUrl,
        })
        .select()
        .single();

      if (mediaError) throw mediaError;

      uploadedFiles.push(mediaFile);
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      throw new Error(`Failed to upload ${file.name}`);
    }
  }

  revalidatePath(`/dashboard/projects/${projectId}`);

  return {
    message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
    files: uploadedFiles,
  };
}

export async function createReviewLink(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const projectId = formData.get("projectId") as string;
  const mediaId = formData.get("mediaId") as string;
  const title = formData.get("title") as string;

  if (!projectId || !mediaId) {
    throw new Error("Project ID and Media ID are required");
  }

  // Verify ownership
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, editor_id")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    throw new Error("Project not found");
  }

  const { data: editorProfile } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (project.editor_id !== editorProfile?.id) {
    throw new Error("Unauthorized");
  }

  // Generate unique token
  const linkToken = nanoid(12);

  const { data: reviewLink, error: linkError } = await supabase
    .from("review_links")
    .insert({
      project_id: projectId,
      media_id: mediaId,
      link_token: linkToken,
      title: title?.trim() || null,
    })
    .select()
    .single();

  if (linkError) throw linkError;

  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/review/${linkToken}`;

  return {
    message: "Review link created successfully",
    reviewLink: reviewLink,
    reviewUrl: reviewUrl,
  };
}
