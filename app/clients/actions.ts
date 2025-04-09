// app/clients/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function CreateClient(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    throw new Error("Failed to fetch editor profile");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string | null;
  const company = formData.get("company") as string;
  const phone = formData.get("phone") as string;
  const notes = formData.get("notes") as string;

  if (!name) {
    throw new Error("Client name is required");
  }

  try {
    const { data, error } = await supabase
      .from("clients")
      .insert({
        editor_id: editorProfile.id,
        name,
        email: email || null,
        company,
        phone,
        notes,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    revalidatePath("/clients");
    return { message: "Client created successfully", client: data };
  } catch (error) {
    console.error("Error creating client:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred");
  }
}

export async function updateClient(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, editor_id")
    .eq("id", clientId)
    .single();

  if (clientError || !client) {
    throw new Error("Client not found");
  }

  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError || client.editor_id !== editorProfile.id) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string | null;
  const company = formData.get("company") as string;
  const phone = formData.get("phone") as string;
  const notes = formData.get("notes") as string;

  if (!name) {
    throw new Error("Client name is required");
  }

  const updateData = {
    name,
    email: email || null,
    company,
    phone,
    notes,
  };

  try {
    const { data, error } = await supabase
      .from("clients")
      .update(updateData)
      .eq("id", clientId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);
    return { message: "Client updated successfully", client: data };
  } catch (error) {
    console.error("Error updating client:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred");
  }
}

export async function deleteClient(
  clientId: string,
  forceDelete: boolean = false // Keep forceDelete to decide whether to warn or proceed
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { success: false, message: "Not authenticated", hasProjects: false };

  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (profileError || !editorProfile)
    return {
      success: false,
      message: "Failed to fetch editor profile or unauthorized",
      hasProjects: false,
    };

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, editor_id")
    .eq("id", clientId)
    .single();
  if (clientError || !client)
    return { success: false, message: "Client not found", hasProjects: false };
  if (client.editor_id !== editorProfile.id)
    return { success: false, message: "Unauthorized", hasProjects: false };

  try {
    // 1. Check for associated projects (still needed for the warning)
    const {
      data: projects,
      error: projectsError,
      count,
    } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true }) // Efficiently check existence & count
      .eq("client_id", clientId);

    if (projectsError) {
      console.error("Error checking projects:", projectsError);
      throw new Error("Failed to check for associated projects.");
    }

    const hasProjects = count && count > 0;

    // 2. If projects exist and not forcing delete, return info message
    if (hasProjects && !forceDelete) {
      return {
        success: false,
        hasProjects: true,
        projectCount: count,
        message: `Client has ${count} project(s). Deleting will also remove associated projects and tracks due to cascade rules.`,
      };
    }

    // 3. Delete the client (Database handles cascading deletes for projects/tracks)
    const { error: deleteClientError } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId);

    if (deleteClientError) {
      // Catch potential errors during the client deletion itself
      console.error("Error deleting client:", deleteClientError);
      const detail = deleteClientError.details
        ? ` (${deleteClientError.details})`
        : "";
      throw new Error(`Failed to delete the client.${detail}`);
    }

    // 4. Revalidate and return success
    revalidatePath("/clients");
    return {
      success: true,
      message:
        "Client" +
        (hasProjects ? " and associated data" : "") +
        " deleted successfully",
      forceDeletedProjects: hasProjects, // Indicate cascade happened if projects existed
      hasProjects: false,
    };
  } catch (error) {
    console.error("Error during client deletion:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during deletion.",
      // Re-check needed only if initial check could be stale, often not necessary here
      hasProjects: !!(
        await supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("client_id", clientId)
      ).count,
    };
  }
}