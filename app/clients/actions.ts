// app/clients/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Client actions
export async function CreateClient(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Get editor profile ID
  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    throw new Error("Failed to fetch editor profile");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
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
        email,
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

  // Verify ownership of client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, editor_id")
    .eq("id", clientId)
    .single();

  if (clientError || !client) {
    throw new Error("Client not found");
  }

  // Get editor profile ID to verify ownership
  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError || client.editor_id !== editorProfile.id) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const company = formData.get("company") as string;
  const phone = formData.get("phone") as string;
  const notes = formData.get("notes") as string;

  if (!name) {
    throw new Error("Client name is required");
  }

  try {
    const { data, error } = await supabase
      .from("clients")
      .update({
        name,
        email,
        company,
        phone,
        notes,
      })
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

export async function deleteClient(clientId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Verify ownership of client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, editor_id")
    .eq("id", clientId)
    .single();

  if (clientError || !client) {
    throw new Error("Client not found");
  }

  // Get editor profile ID to verify ownership
  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError || client.editor_id !== editorProfile.id) {
    throw new Error("Unauthorized");
  }

  try {
    // First check if there are any projects for this client
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id")
      .eq("client_id", clientId);

    if (projectsError) {
      throw projectsError;
    }

    if (projects && projects.length > 0) {
      throw new Error("Cannot delete client with active projects");
    }

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId);

    if (error) {
      throw error;
    }

    revalidatePath("/clients");
    return { message: "Client deleted successfully" };
  } catch (error) {
    console.error("Error deleting client:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred");
  }
}
