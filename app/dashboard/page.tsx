// app/dashboard/page.tsx
// @ts-nocheck
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./components/dashboard-client";
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

  // Get current month's start date
  const currentDate = new Date();
  const monthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).toISOString();

  // We're removing client-specific view - only editor dashboard is needed
  return await getEditorDashboard(supabase, userProfile, monthStart);
}

// EDITOR VIEW - Simplified and optimized
async function getEditorDashboard(supabase, userProfile, monthStart) {
  // Parallel queries for better performance
  const [
    allProjectsData,
    // Individual stats queries
    activeProjectsCount,
    pendingProjectsCount,
    completedProjectsCount,
    monthlyActiveProjectsCount,
    monthlyPendingProjectsCount,
    monthlyCompletedProjectsCount,
  ] = await Promise.all([
    // Updated project query to use client_name instead of client:clients
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
        client_name,
        client_email,
        password_protected,
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
  ]);

  // Process projects (same logic as before but with client_name)
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
      stats={{
        monthly: {
          activeProjects: monthlyActiveProjectsCount.count || 0,
          pendingProjects: monthlyPendingProjectsCount.count || 0,
          completedProjects: monthlyCompletedProjectsCount.count || 0,
        },
        allTime: {
          activeProjects: activeProjectsCount.count || 0,
          pendingProjects: pendingProjectsCount.count || 0,
          completedProjects: completedProjectsCount.count || 0,
        },
      }}
    />
  );
}