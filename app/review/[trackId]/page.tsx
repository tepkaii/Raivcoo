// app/review/[trackId]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import ReviewPage from "./ReviewPage";
import Link from "next/link";
import { RevButtons } from "@/components/ui/RevButtons";
import {
  addReviewComment,
  clientApproveProject,
  clientRequestRevisions,
  updateReviewComment, // Action for update
  deleteReviewComment, // Action for delete
} from "./actions";

export async function generateMetadata({
  params,
}: {
  params: { trackId: string };
}): Promise<Metadata> {
  const supabase = await createClient();
  const { trackId } = await params;
  if (!trackId || trackId === "undefined") {
    return { title: "Project Review", robots: { index: false, follow: false } };
  }
  try {
    const { data: trackData } = await supabase
      .from("project_tracks")
      .select(`project:projects!inner(title)`)
      .eq("id", trackId)
      .maybeSingle();
    return {
      title: trackData?.project
        ? `Review: ${trackData.project.title}`
        : "Project Review",
      description: "Review project deliverable.",
      robots: { index: false, follow: false },
    };
  } catch (error) {
    return { title: "Project Review", robots: { index: false, follow: false } };
  }
}

export default async function ReviewPageWrapper({
  params,
}: {
  params: { trackId: string };
}) {
  const { trackId } = await params;
  const supabase = await createClient();

  if (!trackId || trackId === "undefined") {
    return notFound();
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect(
      `/login?message=Please log in to view review.&redirectTo=${encodeURIComponent(`/review/${trackId}`)}`
    );
  }
  if (!user.email) {
    return (
      <div className="container mx-auto py-6 mt-24 text-center text-red-600">
        Error: User email missing.
      </div>
    );
  }

  const { data: trackData, error: trackFetchError } = await supabase
    .from("project_tracks")
    .select(
      `id, project_id, round_number, steps, client_decision, project:projects!inner(id, title, client:clients!inner(id, name, email))`
    )
    .eq("id", trackId)
    .maybeSingle();

  if (
    trackFetchError ||
    !trackData ||
    !trackData.project ||
    !trackData.project.client
  ) {
    console.error(
      `Error fetching review data for track ${trackId}:`,
      trackFetchError?.message || "Not found/Invalid data"
    );
    return notFound();
  }

  if (trackData.project.client.email !== user.email) {
    console.warn(
      `AUTH FAILED: User ${user.email} accessing review for client ${trackData.project.client.email}`
    );
    return notFound();
  }

  const steps = Array.isArray(trackData.steps) ? trackData.steps : [];
  const finishStep = steps.find((step: any) => step.is_final);
  const deliverableLink = finishStep?.deliverable_link;

  if (!deliverableLink) {
    return (
      <div className="container mx-auto py-6 text-center mt-10">
        <h1 className="text-2xl font-bold mb-4">Review Not Ready Yet</h1>
        <p className="text-muted-foreground">
          Deliverable for Round {trackData.round_number} not submitted.
        </p>
        <Link href="/projects" className="mt-4 inline-block">
          <RevButtons variant="outline">Back to Projects</RevButtons>
        </Link>
      </div>
    );
  }

  const { data: commentsData, error: commentsError } = await supabase
    .from("review_comments")
    .select(`id, comment, created_at`)
    .eq("track_id", trackId)
    .order("comment->>timestamp", { ascending: true });

  if (commentsError) {
    console.error(
      `Error fetching comments for track ${trackId}:`,
      commentsError
    );
  }

  const clientDisplayName = trackData.project.client.name || user.email;
  const comments = (commentsData || []).map((c: any) => ({
    id: c.id,
    created_at: c.created_at,
    comment: c.comment as Comment["comment"],
    commenter_display_name: clientDisplayName,
    isOwnComment: true,
  }));

  return (
    <div className="container mx-auto py-6 flex justify-center">
      <ReviewPage
        clientDisplayName={clientDisplayName}
        track={{
          id: trackData.id,
          projectId: trackData.project_id,
          roundNumber: trackData.round_number,
          clientDecision: trackData.client_decision as any,
        }}
        project={{ id: trackData.project.id, title: trackData.project.title }}
        deliverableLink={deliverableLink}
        initialComments={comments}
        addCommentAction={addReviewComment}
        approveProjectAction={clientApproveProject}
        requestRevisionsAction={clientRequestRevisions}
        updateCommentAction={updateReviewComment} // Pass update action
        deleteCommentAction={deleteReviewComment} // Pass delete action
      />
    </div>
  );
}

// Define Comment type locally if not imported globally
interface Comment {
  id: string;
  comment: {
    text: string;
    timestamp: number;
    images?: string[];
    links?: { url: string; text: string }[];
  };
  created_at: string;
  commenter_display_name: string;
  isOwnComment?: boolean;
}