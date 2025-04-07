import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import ReviewPage from "./ReviewPage";
import { createReviewComment } from "@/app/projects/actions";
import { Metadata } from "next";

export async function generateMetadata(props: {
  params: Promise<{ id: string; trackId: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", params)
    .single();

  return {
    title: project ? `Review: ${project.title}` : "Project Review",
    description: "Review and provide feedback on the video project",
  };
}

export default async function ReviewPageWrapper(props: {
  params: Promise<{ id: string; trackId: string }>;
}) {
  // Log parameters for debugging
  console.log("Route params:", await props.params);
  const { id, trackId } = await props.params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch track with project details using the proper parameters.
  // Note that we use `id` as the project ID.
  const { data: track, error: trackError } = await supabase
    .from("project_tracks")
    .select(
      `
      id,
      project_id,
      round_number,
      steps,
      project:projects(
        title,
        client:clients(
          name
        )
      )
    `
    )
    .eq("id", trackId)
    .eq("project_id", id)
    .single();

  if (trackError || !track) {
    console.error("Track fetch error:", trackError, "Track:", track);
    return notFound();
  }

  // Ensure track.steps is an array and look for the Finish step with a deliverable link
  const finishStep =
    Array.isArray(track.steps) &&
    track.steps.find(
      (step: any) => step.name === "Finish" && step.deliverable_link
    );
  const deliverableLink = finishStep?.deliverable_link;

  if (!deliverableLink) {
    return (
      <div className="container mx-auto py-6 mt-24">
        <h1 className="text-2xl font-bold mb-4">Project Review</h1>
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
          <p className="text-amber-800">
            No deliverable has been submitted for this round yet. Check back
            later.
          </p>
        </div>
      </div>
    );
  }

  // Fetch comments for this track
  const { data: comments, error: commentsError } = await supabase
    .from("review_comments")
    .select(
      `
    id,
    user_id,
    timestamp,
    comment,
    created_at
  `
    )
    .eq("track_id", trackId)
    .order("timestamp", { ascending: true });

  if (commentsError) {
    console.error("Error fetching comments:", commentsError);
  }

  // Use the user_id as a fallback display name.
  const formattedComments = (
    comments && Array.isArray(comments) ? comments : []
  ).map((comment) => ({
    ...comment,
    display_name: comment.user_id
      ? `User ${comment.user_id.substring(0, 8)}`
      : "Anonymous",
  }));

  return (
    <div className="container mx-auto py-6 mt-24">
      <ReviewPage
        track={track}
        project={track.project}
        deliverableLink={deliverableLink}
        comments={formattedComments}
        createReviewComment={createReviewComment}
      />
    </div>
  );
}
