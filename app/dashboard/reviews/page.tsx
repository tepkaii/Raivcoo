// app/dashboard/reviews/page.tsx
// @ts-nocheck
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { ClientReviewsList } from "./client-reviews-list";

export const metadata: Metadata = {
  title: "My Reviews - Raivcoo",
  description: "Review and approve editor-submitted content",
};

export default async function ClientReviewsPage() {
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
          updated_at,
          final_deliverable_media_type
        )
      `
    )
    .in("client_id", clientIds);

  // Process projects
  const processedProjects = allProjects
    ? allProjects.map((project) => {
        // Get latest track
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

        // Check if this track has a final deliverable that needs review
        const hasFinalDeliverable = latestTrack?.steps?.some(
          (step: { is_final: any; status: string; }) => step.is_final && step.status === "completed"
        );

        // Determine if review is needed
        const needsReview =
          project.status === "active" &&
          latestTrack?.client_decision === "pending" &&
          hasFinalDeliverable;

        // Check if project has any reviewed tracks (not just the latest)
        const hasReviewedTracks = project.project_tracks?.some(
          (track) =>
            track.client_decision === "approved" ||
            track.client_decision === "revisions_requested"
        );

        return {
          ...project,
          latestTrack,
          needsReview,
          hasReviewedTracks,
        };
      })
    : [];

  // Split projects by status
  const pendingReviews = processedProjects.filter((p) => p.needsReview);

  // Include any project that has at least one reviewed track
  const reviewedProjects = processedProjects.filter((p) => p.hasReviewedTracks);

  return (
    <ClientReviewsList
      pendingReviews={pendingReviews}
      reviewedProjects={reviewedProjects}
    />
  );
}
