// app/dashboard/projects/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { uploadFileToR2, getPublicUrl, deleteFileFromR2 } from "@/lib/r2";
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
  const referencesJson = formData.get("references") as string;

  if (!name?.trim()) {
    throw new Error("Project name is required");
  }

  // Parse references
  let references = [];
  if (referencesJson) {
    try {
      references = JSON.parse(referencesJson);
    } catch (error) {
      console.error("Error parsing references:", error);
      // Continue without references if parsing fails
    }
  }

  try {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        editor_id: editorProfile.id,
        name: name.trim(),
        description: description?.trim() || null,
        project_references: references, // Add references to insert
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
export async function deleteProject(projectId: string) {
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

  try {
    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, editor_id, name")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      throw new Error("Project not found");
    }

    if (project.editor_id !== editorProfile.id) {
      throw new Error("Unauthorized - You don't own this project");
    }

    // Get all media files to delete from R2
    const { data: mediaFiles, error: mediaError } = await supabase
      .from("project_media")
      .select("r2_key")
      .eq("project_id", projectId);

    if (mediaError) {
      console.error("Error fetching media files:", mediaError);
    }

    // Delete all media files from R2
    if (mediaFiles && mediaFiles.length > 0) {
      for (const media of mediaFiles) {
        try {
          await deleteFileFromR2(media.r2_key);
        } catch (r2Error) {
          console.error("R2 deletion error for:", media.r2_key, r2Error);
          // Continue with other files even if one fails
        }
      }
    }

    // Delete the project (this will cascade delete all related data due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (deleteError) throw deleteError;

    revalidatePath("/dashboard/projects");

    return {
      message: `Project "${project.name}" and all its content have been permanently deleted`,
      success: true,
    };
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred during project deletion.");
  }
}

export async function renameProject(projectId: string, newName: string) {
  try {
    const supabase = await createClient();

    // Update the project name
    const { data, error } = await supabase
      .from("projects")
      .update({
        name: newName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      console.error("Error renaming project:", error);
      throw new Error("Failed to rename project");
    }

    revalidatePath("/dashboard/projects");

    return {
      success: true,
      message: `Project renamed to "${newName}"`,
      data,
    };
  } catch (error) {
    console.error("Error in renameProject:", error);
    throw error;
  }
}