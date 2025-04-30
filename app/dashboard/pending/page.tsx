// app/dashboard/pending/page.tsx
// @ts-nocheck
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { ClientPendingList } from "./client-pending-list";

export const metadata: Metadata = {
  title: "Pending Reviews - Raivcoo",
  description: "View projects awaiting new submissions from editors",
};

export default async function ClientPendingPage() {
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
    redirect("/login");
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

  // Fetch all active projects for this client with revision requests
  const { data: pendingProjects } = await supabase
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
    .in("client_id", clientIds)
    .eq("status", "active");

  // Process projects to get the latest track info
  const processedProjects = pendingProjects
    ? pendingProjects.map((project) => {
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
          awaitingEditorSubmission:
            latestTrack?.client_decision === "revisions_requested" ||
            (latestTrack?.client_decision === "pending" &&
              !latestTrack.steps?.some(
                (step: any) => step.is_final && step.status === "completed"
              )),
        };
      })
    : [];

  // Filter for projects awaiting editor submission
  const awaitingSubmissions = processedProjects.filter(
    (p) => p.awaitingEditorSubmission
  );

  return <ClientPendingList pendingProjects={awaitingSubmissions} />;
}
