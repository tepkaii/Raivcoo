// app/dashboard/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./components/dashboard-client";
import { DashboardClientView } from "./components/dashboard-client-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Raivcoo",
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

  // Get user profile
  const { data: userProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError || !userProfile) {
    redirect("/profile");
  }

  const isClient = userProfile.account_type === "client";

  if (isClient) {
    // CLIENT VIEW - Find all projects where client's email is used
    const { data: clientProjects } = await supabase
      .from("clients")
      .select("id")
      .eq("email", userProfile.email);

    const clientIds = clientProjects?.map((client) => client.id) || [];

    // Fetch all projects for this client
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
        editor:editor_profiles(id, display_name, avatar_url),
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
      .in("client_id", clientIds);

    // Process projects to get the latest track info
    const processedProjects = allProjects
      ? allProjects.map((project) => {
          const latestTrack =
            project.project_tracks?.length > 0
              ? [...project.project_tracks].sort((a, b) => {
                  const timestampA = new Date(
                    a.updated_at || a.created_at
                  ).getTime();
                  const timestampB = new Date(
                    b.updated_at || b.created_at
                  ).getTime();
                  return timestampB - timestampA;
                })[0]
              : null;

          return {
            ...project,
            latestTrack,
          };
        })
      : [];

    // Split projects by status
    const activeProjects = processedProjects.filter(
      (p) => p.status === "active"
    );

    // Pending reviews are active projects with pending client decisions and completed final deliverables
    const pendingReviews = processedProjects.filter(
      (p) =>
        p.status === "active" &&
        p.latestTrack?.client_decision === "pending" &&
        p.latestTrack?.steps?.some(
          (s) => s.status === "completed" && s.is_final
        )
    );

    const completedProjects = processedProjects.filter(
      (p) => p.status === "completed"
    );

    return (
      <DashboardClientView
        activeProjects={activeProjects}
        pendingReviews={pendingReviews}
        completedProjects={completedProjects}
      />
    );
  } else {
    // EDITOR VIEW - Existing editor dashboard
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
      .eq("editor_id", userProfile.id);

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
          // app/dashboard/page.tsx (continued)
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
      .eq("editor_id", userProfile.id)
      .order("created_at", { ascending: false })
      .limit(3);

    // Count projects by status
    const { count: activeProjects } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("editor_id", userProfile.id)
      .eq("status", "active");

    const { count: pendingProjects } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("editor_id", userProfile.id)
      .eq("status", "pending");

    const { count: completedProjects } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("editor_id", userProfile.id)
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
}
