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

  // Fetch last 3 projects with full track data, sorted by most recently updated track
  const { data: allProjects } = await supabase
    .from("projects")
    .select(
      `
    id,
    title,
    description,
    status,
    deadline,
    created_at,
    updated_at,
    client:clients(id, name),
    project_tracks(
      id,
      round_number,
      status,
      client_decision,
      steps,
      created_at,
      updated_at
    )
  `
    )
    .eq("editor_id", editorProfile.id);

  // Process projects data to sort by most recently updated OR created track
  const recentProjects = allProjects
    ? allProjects
        .map((project) => {
          // Find the most recently active track (either updated or created)
          const latestTrack =
            project.project_tracks?.length > 0
              ? [...project.project_tracks].sort((a, b) => {
                  // Get the most recent timestamp for each track
                  // Use updated_at if available, otherwise created_at
                  const timestampA = new Date(
                    a.updated_at && a.updated_at !== a.created_at
                      ? a.updated_at
                      : a.created_at
                  ).getTime();

                  const timestampB = new Date(
                    b.updated_at && b.updated_at !== b.created_at
                      ? b.updated_at
                      : b.created_at
                  ).getTime();

                  return timestampB - timestampA;
                })[0]
              : null;

          // Get the most recent timestamp for the track
          const mostRecentActivity = latestTrack
            ? latestTrack.updated_at &&
              latestTrack.updated_at !== latestTrack.created_at
              ? latestTrack.updated_at
              : latestTrack.created_at
            : null;

          return {
            ...project,
            latestTrack,
            latestTrackUpdate: mostRecentActivity,
          };
        })
        // Sort projects by their most recent track activity (update or creation)
        .sort((a, b) => {
          const dateA = a.latestTrackUpdate
            ? new Date(a.latestTrackUpdate).getTime()
            : 0;
          const dateB = b.latestTrackUpdate
            ? new Date(b.latestTrackUpdate).getTime()
            : 0;
          return dateB - dateA;
        })
        // Limit to 3 projects
        .slice(0, 3)
    : [];

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
      recentProjects={recentProjects}
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
