// app/dashboard/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./components/dashboard-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Video Editor",
  description: "Your video editing workspace",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // Authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get editor profile
  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !editorProfile) {
    redirect("/profile");
  }

  // Fetch last project with full track and step data
  const { data: lastProjectData } = await supabase
    .from("projects")
    .select(
      `
      id,
      title,
      description,
      status,
      deadline,
      created_at,
      client:clients(id, name),
      project_tracks(
        id,
        round_number,
        status,
        client_decision,
        steps,
        created_at
      )
    `
    )
    .eq("editor_id", editorProfile.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  // Process last project data
  const lastProject = lastProjectData
    ? {
        ...lastProjectData,
        // Get the latest track (highest round number)
        latestTrack:
          lastProjectData.project_tracks?.length > 0
            ? lastProjectData.project_tracks.reduce((prev, current) =>
                prev.round_number > current.round_number ? prev : current
              )
            : null,
      }
    : null;

  // Fetch recent clients (last 3) with project counts
  const { data: recentClients } = await supabase
    .from("clients")
    .select(
      `
      id,
      name,
      company,
      projects:projects(id)
    `
    )
    .eq("editor_id", editorProfile.id)
    .order("created_at", { ascending: false })
    .limit(3);

  // Count projects by status
  const { count: activeProjects } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("editor_id", editorProfile.id)
    .eq("status", "active");

  const { count: pendingProjects } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("editor_id", editorProfile.id)
    .eq("status", "pending");

  const { count: completedProjects } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("editor_id", editorProfile.id)
    .eq("status", "completed");

  return (
    <DashboardClient
      lastProject={lastProject}
      recentClients={recentClients || []}
      stats={{
        activeProjects: activeProjects || 0,
        pendingProjects: pendingProjects || 0,
        completedProjects: completedProjects || 0,
        totalClients: recentClients?.length || 0,
      }}
    />
  );
}
