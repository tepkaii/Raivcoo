// app/dashboard/page.tsx
// @ts-nocheck
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./components/dashboard-client";
import { DashboardClientView } from "./components/dashboard-client-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Raivcoo",
  description:
    "Track projects, manage client feedback, and stay organized in your video editing workspace.",
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
    redirect("/account");
  }

  const isClient = userProfile.account_type === "client";

  // Get current month's start date
  const currentDate = new Date();
  const monthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).toISOString();

  if (isClient) {
    return await getClientDashboard(supabase, userProfile);
  } else {
    return await getEditorDashboard(supabase, userProfile, monthStart);
  }
}

// CLIENT VIEW - Separated for performance
async function getClientDashboard(supabase, userProfile) {
  // Find all projects where client's email is used
  const { data: clientProjects } = await supabase
    .from("clients")
    .select("id")
    .eq("email", userProfile.email);

  const clientIds = clientProjects?.map((client) => client.id) || [];

  // Fetch all necessary fields for projects
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
  const activeProjects = processedProjects.filter((p) => p.status === "active");

  // Pending reviews are active projects with pending client decisions and completed final deliverables
  const pendingReviews = processedProjects.filter(
    (p) =>
      p.status === "active" &&
      p.latestTrack?.client_decision === "pending" &&
      p.latestTrack?.steps?.some((s) => s.status === "completed" && s.is_final)
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
}

// EDITOR VIEW - Simplified and optimized
async function getEditorDashboard(supabase, userProfile, monthStart) {
  // Parallel queries for better performance
  const [
    allProjectsData,
    recentClientsData,
    // Individual stats queries
    activeProjectsCount,
    pendingProjectsCount,
    completedProjectsCount,
    totalClientsCount,
    monthlyActiveProjectsCount,
    monthlyPendingProjectsCount,
    monthlyCompletedProjectsCount,
    monthlyNewClientsCount,
  ] = await Promise.all([
    // Simplified project query
    supabase
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
      .eq("editor_id", userProfile.id),

    // Simplified clients query
    supabase
      .from("clients")
      .select("id, name, company, created_at")
      .eq("editor_id", userProfile.id)
      .order("created_at", { ascending: false })
      .limit(3),

    // All-time stats
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("editor_id", userProfile.id)
      .eq("status", "active"),

    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("editor_id", userProfile.id)
      .eq("status", "pending"),

    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("editor_id", userProfile.id)
      .eq("status", "completed"),

    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("editor_id", userProfile.id),

    // Monthly stats
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("editor_id", userProfile.id)
      .eq("status", "active")
      .gte("created_at", monthStart),

    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("editor_id", userProfile.id)
      .eq("status", "pending")
      .gte("created_at", monthStart),

    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("editor_id", userProfile.id)
      .eq("status", "completed")
      .gte("created_at", monthStart),

    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("editor_id", userProfile.id)
      .gte("created_at", monthStart),
  ]);

  // Process projects (same logic as before)
  const recentProjects = allProjectsData.data
    ? allProjectsData.data
        .map((project) => {
          const latestTrack =
            project.project_tracks?.length > 0
              ? [...project.project_tracks].sort((a, b) => {
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
        .sort((a, b) => {
          const dateA = a.latestTrackUpdate
            ? new Date(a.latestTrackUpdate).getTime()
            : 0;
          const dateB = b.latestTrackUpdate
            ? new Date(b.latestTrackUpdate).getTime()
            : 0;
          return dateB - dateA;
        })
        .slice(0, 3)
    : [];

  return (
    <DashboardClient
      recentProjects={recentProjects}
      recentClients={recentClientsData.data || []}
      stats={{
        monthly: {
          activeProjects: monthlyActiveProjectsCount.count || 0,
          pendingProjects: monthlyPendingProjectsCount.count || 0,
          completedProjects: monthlyCompletedProjectsCount.count || 0,
          newClients: monthlyNewClientsCount.count || 0,
        },
        allTime: {
          activeProjects: activeProjectsCount.count || 0,
          pendingProjects: pendingProjectsCount.count || 0,
          completedProjects: completedProjectsCount.count || 0,
          totalClients: totalClientsCount.count || 0,
        },
      }}
    />
  );
}