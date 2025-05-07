// Add these functions to your server actions file (e.g., app/projects/actions.ts)
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// --- Update Project Details (Editor Action) ---
export async function updateProject(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  // Get the editor profile
  const { data: editorProfile } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!editorProfile) {
    throw new Error("Editor profile not found.");
  }

  // Verify project exists and belongs to this editor
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("editor_id", editorProfile.id)
    .single();

  if (!project) {
    throw new Error(
      "Project not found or you don't have permission to edit it."
    );
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const deadline = formData.get("deadline") as string;
  const client_name = formData.get("client_name") as string;
  const client_email = formData.get("client_email") as string;
  const password_protected =
    (formData.get("password_protected") as string) === "true";
  const access_password = formData.has("access_password")
    ? (formData.get("access_password") as string)
    : null;

  if (!title || title.trim().length === 0) {
    throw new Error("Project title cannot be empty.");
  }
  if (title.length > 255) {
    throw new Error("Project title is too long (max 255 chars).");
  }
  if (!client_name || client_name.trim().length === 0) {
    throw new Error("Client name cannot be empty.");
  }

  // Verify password requirements
  if (password_protected && !project.password_protected && !access_password) {
    throw new Error("Password is required when enabling protection.");
  }

  // Base update data
  const updateData: {
    access_password: null;
    title: string;
    description?: string | null;
    deadline?: string | null;
    client_name: string;
    client_email?: string | null;
    password_protected: boolean;
    updated_at: string;
  } = {
    title: title.trim(),
    description: description?.trim() || null,
    deadline: deadline || null,
    client_name: client_name.trim(),
    client_email: client_email?.trim() || null,
    password_protected,
    updated_at: new Date().toISOString(),
  };

  // Handle password scenarios
  if (access_password !== null) {
    // A new password was provided
    updateData.access_password = access_password.trim();
  } else if (!password_protected) {
    // Password protection was turned off
    updateData.access_password = null;
  }
  // Do nothing for password_protected=true but no new password - keep existing

  try {
    const { error: updateError } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId);

    if (updateError) {
      console.error(`Error updating project ${projectId}:`, updateError);
      throw new Error(`Database error: ${updateError.message}`);
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    if (project.client_id) revalidatePath(`/clients/${project.client_id}`);
    revalidatePath("/dashboard/projects");

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
