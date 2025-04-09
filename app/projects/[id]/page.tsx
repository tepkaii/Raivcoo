// app/projects/[projectId]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { RevButtons } from "@/components/ui/RevButtons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  ArrowLeft,
  ShieldCheck,
  ShieldX,
  Hourglass,
  ThumbsUp,
  MessageSquareWarning,
} from "lucide-react";
import { Metadata } from "next";
import TrackManager from "./TrackManager";
import { updateProjectTrack } from "../actions";
import {
  Key,
  ReactElement,
  JSXElementConstructor,
  ReactNode,
  ReactPortal,
} from "react";

// Generate dynamic metadata for the page
export async function generateMetadata({
  params,
}: {
  params: { projectId: string };
}): Promise<Metadata> {
  const supabase = await createClient();
  const { projectId } = params;

  // Fetch minimal data needed for title
  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", projectId)
    .single();

  return {
    title: project ? `${project.title} - Project Details` : "Project Details",
    description: "View and manage project details, tracks, and deliverables",
  };
}

// The main server component for the project detail page
export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { id } = params; // --- Authentication & Authorization ---
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?message=Please log in to view projects"); // Redirect to login if not authenticated
  }

  // Get editor profile ID associated with the logged-in user
  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  // Redirect if editor profile doesn't exist (user might need to complete profile setup)
  if (profileError || !editorProfile) {
    console.error(`Editor profile not found for user ${user.id}`, profileError);
    redirect("/profile?message=Complete your profile setup");
  }

  // --- Data Fetching ---

  // Fetch project details, ensuring it belongs to the logged-in editor
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      `
      id,
      title,
      description,
      status,
      deadline,
      created_at,
      editor_id,
      client:clients (id, name)
    `
    )
    .eq("id", id)
    .single(); // Fetch single project

  // Handle project not found or fetch error
  if (projectError || !project) {
    console.error(`Project ${id} not found or error fetching:`, projectError);
    return notFound(); // Render 404 page
  }

  // Authorization check: Does the fetched project belong to the logged-in editor?
  if (project.editor_id !== editorProfile.id) {
    console.warn(
      `Authorization Failed: Editor ${editorProfile.id} tried to access project ${projectId} owned by ${project.editor_id}.`
    );
    return notFound(); // Treat as not found for security
  }

  // Fetch all tracks associated with this project, ordered by round number
  const { data: tracks, error: tracksError } = await supabase
    .from("project_tracks")
    .select(
      `
      id,
      project_id,
      round_number,
      status,
      steps,
      created_at,
      updated_at,
      client_decision
    `
    )
    .eq("project_id", id)
    .order("round_number", { ascending: true }); // Get tracks in order

  if (tracksError) {
    // Log error but attempt to continue if project data is available
    console.error(`Error fetching tracks for project ${id}:`, tracksError);
    // Potentially show an error message on the page instead of crashing
  }
  const tracksWithComments = await Promise.all(
    (tracks || []).map(async (track) => {
      // Remove the condition that only fetches comments for non-pending tracks
      // This will fetch comments for all tracks, including the latest one
      const { data: comments } = await supabase
        .from("review_comments")
        .select("id, timestamp, comment, created_at")
        .eq("track_id", track.id)
        .order("timestamp", { ascending: true });

      return { ...track, comments: comments || [] };
    })
  );

  // Later in the code, modify the TrackManager part to include client decision and comments

  // Determine the track to display in TrackManager - always the latest round
  const latestTrack = tracksWithComments[tracksWithComments.length - 1]; // Use tracksWithComments instead of tracks

  // Handle case where project exists but no tracks (should not happen with current logic but good practice)
  if (!tracks || tracks.length === 0) {
    return (
      <div className="container mx-auto py-6 space-y-6 mt-24">
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Link href="/projects" className="hover:underline flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
          </Link>
          {project.client && ( // Check if client exists before linking
            <>
              {" • "}
              <Link
                href={`/clients/${project.client.id}`}
                className="hover:underline"
              >
                {project.client.name}
              </Link>
            </>
          )}
        </div>
        <h1 className="text-2xl font-bold">{project.title}</h1>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            This project does not have any workflow tracks yet. This might
            indicate an issue during creation.
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Rendering ---
  return (
    <div className="container mx-auto py-6 space-y-6 mt-24">
      {/* Navigation Links */}
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Link href="/projects" className="hover:underline flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
        </Link>
        {project.client && (
          <>
            {" • "}
            <Link
              href={`/clients/${project.client.id}`}
              className="hover:underline"
            >
              {project.client.name || "Client Details"}
            </Link>
          </>
        )}
      </div>

      {/* Project Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1.5" />
              Created {new Date(project.created_at).toLocaleDateString()}
            </span>
            {project.deadline && (
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1.5" />
                Due {new Date(project.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <Badge
          variant={project.status === "completed" ? "success" : "warning"}
          className="text-sm px-3 py-1"
        >
          {project.status === "completed" ? "Completed" : "Active"}
        </Badge>
      </div>

      {/* Project Description */}
      {project.description && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground whitespace-pre-line">
            {project.description}
          </CardContent>
        </Card>
      )}

      {/* Project Workflow Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Project Workflow</h2>

        {/* Display the Track Manager for the latest track */}
        {latestTrack && (
          <>
            <TrackManager
              track={latestTrack}
              updateProjectTrack={updateProjectTrack}
            />

            {/* Show approval/revision message if decision is made */}
            {latestTrack.client_decision !== "pending" && (
              <Card className="mt-4">
                <CardContent className="pt-6 pb-4">
                  <div
                    className={`p-3 rounded-md text-sm ${
                      latestTrack.client_decision === "approved"
                        ? "bg-green-50 border border-green-200 text-green-800"
                        : "bg-red-50 border border-red-200 text-red-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {latestTrack.client_decision === "approved" ? (
                        <ThumbsUp className="h-4 w-4" />
                      ) : (
                        <MessageSquareWarning className="h-4 w-4" />
                      )}
                      <span>
                        {latestTrack.client_decision === "approved"
                          ? "Client approved this round."
                          : "Client requested revisions for this round."}
                      </span>
                    </div>
                  </div>

                  {/* Display comments if they exist */}
                  {latestTrack.comments && latestTrack.comments.length > 0 && (
                    <div className="border-t mt-4 pt-4">
                      <p className="text-sm font-medium mb-2">
                        Client Feedback:
                      </p>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                        {latestTrack.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="text-sm p-2 rounded bg-background border"
                          >
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>At {comment.timestamp}</span>
                              <span>
                                {new Date(comment.created_at).toLocaleString(
                                  [],
                                  {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  }
                                )}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">
                              {comment.comment}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Display Previous Rounds History (Read-only view) */}
        {tracks.length > 1 && (
          <div className="mt-10 space-y-4">
            <h3 className="text-lg font-semibold">Previous Rounds</h3>
            {tracksWithComments
              .filter((track: { id: any }) => track.id !== latestTrack?.id) // Exclude the latest track shown above
              .sort(
                (a: { round_number: number }, b: { round_number: number }) =>
                  b.round_number - a.round_number
              ) // Show most recent previous round first
              .map(
                (track: {
                  client_decision: string;
                  steps: any[];
                  id: Key | null | undefined;
                  round_number:
                    | string
                    | number
                    | bigint
                    | boolean
                    | ReactElement<unknown, string | JSXElementConstructor<any>>
                    | Iterable<ReactNode>
                    | ReactPortal
                    | Promise<
                        | string
                        | number
                        | bigint
                        | boolean
                        | ReactPortal
                        | ReactElement<
                            unknown,
                            string | JSXElementConstructor<any>
                          >
                        | Iterable<ReactNode>
                        | null
                        | undefined
                      >
                    | null
                    | undefined;
                  comments: any[];
                }) => {
                  let decisionVariant: "success" | "destructive" | "outline" =
                    "outline";
                  let DecisionIcon = Hourglass;
                  let decisionText = "Completed"; // Default for rounds before client decision implemented

                  if (track.client_decision === "approved") {
                    decisionVariant = "success";
                    DecisionIcon = ShieldCheck;
                    decisionText = "Client Approved";
                  } else if (track.client_decision === "revisions_requested") {
                    decisionVariant = "destructive";
                    DecisionIcon = ShieldX;
                    decisionText = "Revisions Requested";
                  } else if (
                    track.client_decision === "pending" &&
                    track.steps?.find((s) => s.name === "Finish")?.status ===
                      "completed"
                  ) {
                    // If finish step was done but decision somehow still pending (shouldn't happen for old rounds)
                    DecisionIcon = Hourglass;
                    decisionText = "Awaited Review";
                  }

                  return (
                    <Card key={track.id} className="bg-muted/40">
                      <CardHeader className="py-4 px-5">
                        <div className="flex flex-wrap justify-between items-center gap-3">
                          <CardTitle className="text-md font-medium">
                            Round {track.round_number}
                          </CardTitle>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={decisionVariant}
                              className="flex items-center gap-1.5"
                            >
                              <DecisionIcon className="h-3.5 w-3.5" />
                              {decisionText}
                            </Badge>
                            {/* Link to review page for historical context */}
                            <Link
                              href={`/projects/${id}/review/${track.id}`}
                              passHref
                            >
                              <RevButtons variant="secondary" size="sm">
                                View History
                              </RevButtons>
                            </Link>
                          </div>
                        </div>
                      </CardHeader>

                      {/* Display comments if they exist */}
                      {track.comments && track.comments.length > 0 && (
                        <CardContent className="pt-0 pb-4">
                          <div className="border-t pt-3 mt-1">
                            <p className="text-sm font-medium mb-2">
                              Client Feedback:
                            </p>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                              {track.comments.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="text-sm p-2 rounded bg-background border"
                                >
                                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>At {comment.timestamp}</span>
                                    <span>
                                      {new Date(
                                        comment.created_at
                                      ).toLocaleString([], {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                      })}
                                    </span>
                                  </div>
                                  <p className="whitespace-pre-wrap">
                                    {comment.comment}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      )}

                      {/* Display decision message if available */}
                      {track.client_decision !== "pending" && (
                        <CardContent className="pt-0 pb-4">
                          <div
                            className={`p-3 rounded-md text-sm ${
                              track.client_decision === "approved"
                                ? "bg-green-50 border border-green-200 text-green-800"
                                : "bg-red-50 border border-red-200 text-red-800"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {track.client_decision === "approved" ? (
                                <ThumbsUp className="h-4 w-4" />
                              ) : (
                                <MessageSquareWarning className="h-4 w-4" />
                              )}
                              <span>
                                {track.client_decision === "approved"
                                  ? "Client approved this round."
                                  : "Client requested revisions for this round."}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                }
              )}
          </div>
        )}
      </div>
    </div>
  );
}