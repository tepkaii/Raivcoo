// app/dashboard/reviews/[id]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import ClientProjectView from "./ClientProjectView";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = await createClient();
  const { id } = await params;

  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", id)
    .single();

  return {
    title: project ? `${project.title} - Project Review` : "Project Review",
    description: "Review project history and deliverables",
  };
}

export default async function ClientProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please log in to view projects");
  }

  // Get user profile
  const { data: userProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError || !userProfile) {
    redirect("/profile?message=Complete your profile setup");
  }

  // Verify this is a client account
  if (userProfile.account_type !== "client") {
    redirect("/dashboard");
  }

  // Find all clients where email matches this user's email
  const { data: clientsData } = await supabase
    .from("clients")
    .select("id")
    .eq("email", userProfile.email);

  const clientIds = clientsData?.map((client) => client.id) || [];

  // Get project details
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      `id, title, description, status, deadline, created_at, 
       editor:editor_profiles (id, display_name, avatar_url)`
    )
    .eq("id", id)
    .in("client_id", clientIds)
    .single();

  if (projectError || !project) {
    return notFound();
  }

  // Get all tracks for this project
  const { data: tracks, error: tracksError } = await supabase
    .from("project_tracks")
    .select(
      `id, project_id, round_number, status, steps, created_at, updated_at, 
       client_decision, final_deliverable_media_type`
    )
    .eq("project_id", id)
    .order("round_number", { ascending: false });

  if (tracksError) {
    console.error(`Error fetching tracks for project ${id}:`, tracksError);
  }

  return <ClientProjectView project={project} tracks={tracks || []} />;
}