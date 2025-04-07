// app/projects/new/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ProjectForm from "../ProjectForm";
import { createProject } from "../actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create New Project - Video Editor Dashboard",
  description: "Create a new video editing project",
};

interface PageProps {
  searchParams: {
    client?: string;
  };
}

export default async function NewProjectPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get editor profile to verify it exists
  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    redirect("/profile");
  }

  // Fetch clients
  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("id, name")
    .eq("editor_id", editorProfile.id)
    .order("name", { ascending: true });

  if (clientsError) {
    console.error("Error fetching clients:", clientsError);
  }

  // If no clients yet, redirect to client creation
  if (!clients || clients.length === 0) {
    redirect("/clients/new?redirect=project");
  }

  return (
    <div className="container mx-auto py-6 space-y-6 mt-24">
      <h1 className="text-2xl font-bold">Create New Project</h1>

      <ProjectForm clients={clients} createProject={createProject} />
    </div>
  );
}
