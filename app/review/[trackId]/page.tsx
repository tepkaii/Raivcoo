// app/review/[trackId]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import ReviewPage from "./ReviewPage"; // Client component
import Link from "next/link";
import { RevButtons } from "@/components/ui/RevButtons";
import {
  addReviewComment,
  clientApproveProject,
  clientRequestRevisions,
} from "./actions";

// Generate metadata
export async function generateMetadata({
  params,
}: {
  params: { trackId: string };
}): Promise<Metadata> {
  const supabase = await createClient();
  const { trackId } = await params; // await params

  if (!trackId || trackId === "undefined") {
    console.error("generateMetadata invalid trackId:", trackId);
    return { title: "Project Review" };
  }

  // Get project info from track
  const { data: trackData } = await supabase
    .from("project_tracks")
    .select(
      `
      project:projects!inner(title)
    `
    )
    .eq("id", trackId)
    .single();

  return {
    title: trackData?.project
      ? `Review: ${trackData.project.title}`
      : "Project Review",
    description: "Review and provide feedback on the project deliverable.",
    robots: { index: false, follow: false },
  };
}

// Server component wrapper
export default async function ReviewPageWrapper({
  params,
}: {
  params: { trackId: string };
}) {
  const { trackId } = await params; // await params
  const supabase = await createClient();

  if (!trackId || trackId === "undefined") {
    console.error("ReviewPageWrapper received invalid trackId:", trackId);
    return notFound();
  }

  // Authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    const redirectUrl = `/review/${trackId}`;
    redirect(
      `/login?message=Please log in to view review.&redirectTo=${encodeURIComponent(redirectUrl)}`
    );
  }
  if (!user.email) {
    return (
      <div className="container mx-auto py-6 mt-24 text-center text-red-600">
        Error: User email missing.
      </div>
    );
  }

  // Data Fetching (Track, Project, Client Name & Email)
  const { data: trackData, error: trackFetchError } = await supabase
    .from("project_tracks")
    .select(
      `
        id, project_id, round_number, steps, client_decision,
        project:projects!inner(
            id, title,
            client:clients!inner( id, name, email )
        )
    `
    )
    .eq("id", trackId)
    .single();

  if (
    trackFetchError ||
    !trackData ||
    !trackData.project ||
    !trackData.project.client
  ) {
    console.error(
      `Error fetching track/project/client data for track ${trackId}:`,
      trackFetchError?.message || "Data structure invalid"
    );
    return notFound();
  }

  const projectId = trackData.project_id;

  // Authorization Check (Logged-in user vs Client email)
  if (trackData.project.client.email !== user.email) {
    console.warn(
      `AUTH FAILED: User ${user.email} accessing review for client ${trackData.project.client.email}`
    );
    return notFound();
  }

  // Data Preparation (Deliverable Link)
  const finishStep = Array.isArray(trackData.steps)
    ? trackData.steps.find(
        (step: any) => step.name === "Finish" && step.deliverable_link
      )
    : null;
  const deliverableLink = finishStep?.deliverable_link;

  if (!deliverableLink) {
    // Deliverable not ready message
    return (
      <div className="container mx-auto py-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Review Not Ready</h1>
        <p className="text-muted-foreground">
          The deliverable for Round {trackData.round_number} is not yet
          available.
        </p>
        <Link href="/projects" className="mt-4 inline-block">
          <RevButtons variant="outline">Back to Projects</RevButtons>
        </Link>
      </div>
    );
  }

  // Fetch Comments
  const { data: commentsData, error: commentsError } = await supabase
    .from("review_comments")
    .select(`id, timestamp, comment, created_at`)
    .eq("track_id", trackId)
    .order("timestamp", { ascending: true });

  if (commentsError) {
    console.error(
      `Error fetching comments for track ${trackId}:`,
      commentsError
    );
    // Continue without comments if fetch fails, page will show "No comments"
  }

  // Use the Client's name for all comments on this page
  const clientDisplayName = trackData.project.client.name || user.email; // Fallback to email

  const comments = (commentsData || []).map((comment: any) => ({
    id: comment.id,
    timestamp: comment.timestamp,
    comment: comment.comment,
    created_at: comment.created_at,
    commenter_display_name: clientDisplayName, // Use the project's client name
  }));

  // Render Client Component, passing data and actions
  return (
    <div className="container mx-auto py-6 flex justify-center">
      <ReviewPage
        clientDisplayName={clientDisplayName}
        track={{
          id: trackData.id,
          projectId: projectId,
          roundNumber: trackData.round_number,
          clientDecision: trackData.client_decision as
            | "pending"
            | "approved"
            | "revisions_requested",
        }}
        project={{
          id: trackData.project.id,
          title: trackData.project.title,
        }}
        deliverableLink={deliverableLink}
        initialComments={comments}
        // Pass server actions
        addCommentAction={addReviewComment}
        approveProjectAction={clientApproveProject}
        requestRevisionsAction={clientRequestRevisions}
      />
    </div>
  );
}
