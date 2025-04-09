// Add these functions to your server actions file (e.g., app/projects/actions.ts)
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Helper: Verify editor owns the project record
async function verifyEditorProjectOwnership(
  projectId: string
): Promise<{ user: any; project: any; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user)
    return { user: null, project: null, error: "Not authenticated." };

  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (profileError || !editorProfile)
    return { user, project: null, error: "Editor profile not found." };

  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select("id, editor_id, client_id")
    .eq("id", projectId)
    .single();
  if (projectError || !projectData)
    return { user, project: null, error: "Project not found." };
  if (projectData.editor_id !== editorProfile.id)
    return {
      user,
      project: projectData,
      error: "Unauthorized: You do not own this project.",
    };

  return { user, project: projectData, error: null };
}

// --- Update Project Details (Editor Action) ---
export async function updateProject(projectId: string, formData: FormData) {
  const { project, error: authError } =
    await verifyEditorProjectOwnership(projectId);
  if (authError || !project) {
    throw new Error(authError || "Authorization failed.");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const deadline = formData.get("deadline") as string;

  if (!title || title.trim().length === 0) {
    throw new Error("Project title cannot be empty.");
  }
  if (title.length > 255) {
    throw new Error("Project title is too long (max 255 chars).");
  }

  const updateData: {
    title: string;
    description?: string | null;
    deadline?: string | null;
    updated_at: string;
  } = {
    title: title.trim(),
    description: description?.trim() || null,
    deadline: deadline || null,
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  try {
    const { error: updateError } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId);

    if (updateError) {
      console.error(`Error updating project ${projectId}:`, updateError);
      throw new Error(`Database error: ${updateError.message}`);
    }

    revalidatePath(`/projects/${projectId}`);
    if (project.client_id) revalidatePath(`/clients/${project.client_id}`);
    revalidatePath("/projects");

    return { message: "Project updated successfully." };
  } catch (error) {
    console.error("Error in updateProject action:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to update project.");
  }
}

// --- Delete Project (Editor Action) ---
export async function deleteProject(projectId: string) {
  const { project, error: authError } =
    await verifyEditorProjectOwnership(projectId);
  if (authError || !project) {
    throw new Error(authError || "Authorization failed.");
  }

  const supabase = await createClient();
  try {
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (deleteError) {
      console.error(`Error deleting project ${projectId}:`, deleteError);
      if (deleteError.code === "23503") {
        throw new Error(`Cannot delete project: Related data might exist.`);
      }
      throw new Error(`Database error: ${deleteError.message}`);
    }

    if (project.client_id) revalidatePath(`/clients/${project.client_id}`);
    revalidatePath("/projects");

    return { message: "Project deleted successfully." };
  } catch (error) {
    console.error("Error in deleteProject action:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to delete project.");
  }
}
