// app/dashboard/projects/[id]/page.tsx
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
import {
  updateProjectTrackStepStatus,
  updateStepContent,
  updateTrackStructure,
} from "../actions";
import { ProjectCommentsSection } from "./ProjectCommentsSection";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = await createClient();
  const { id } = await params;
  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", id)
    .single();
  return {
    title: project ? `${project.title} - Project Details` : "Project Details",
    description: "View and manage project details, tracks, and deliverables",
  };
}

export default async function page({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?message=Please log in to view projects");
  }

  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (profileError || !editorProfile) {
    console.error(`Editor profile error for user ${user.id}`, profileError);
    redirect("/profile?message=Complete your profile setup");
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      `id, title, description, status, deadline, created_at, editor_id, client:clients (id, name)`
    )
    .eq("id", id)
    .single();
  if (projectError || !project) {
    console.error(`Project ${id} fetch error:`, projectError);
    return notFound();
  }

  if (project.editor_id !== editorProfile.id) {
    console.warn(
      `Auth Fail: Editor ${editorProfile.id} accessing project ${id} owned by ${project.editor_id}.`
    );
    return notFound();
  }

  const { data: tracks, error: tracksError } = await supabase
    .from("project_tracks")
    .select(
      `id, project_id, round_number, status, steps, created_at, updated_at, client_decision`
    )
    .eq("project_id", id)
    .order("round_number", { ascending: true });

  if (tracksError) {
    console.error(`Error fetching tracks for project ${id}:`, tracksError);
  }
  const tracksWithComments = await Promise.all(
    (tracks || []).map(async (track) => {
      const { data: comments } = await supabase
        .from("review_comments")
        .select("id, comment, created_at") // Select the JSONB field directly
        .eq("track_id", track.id)
        .order("comment->timestamp", { ascending: true });

      // Transform comments to match expected structure
      const formattedComments = (comments || []).map((comment: any) => ({
        id: comment.id,
        created_at: comment.created_at,
        comment: {
          text: comment.comment.text || "",
          timestamp: comment.comment.timestamp || 0,
          images: comment.comment.images || [],
          links: comment.comment.links || [],
        },
        commenter_display_name: "Client", // Default name since we don't fetch client info here
      }));

      return { ...track, comments: formattedComments };
    })
  );

  const latestTrack =
    tracksWithComments.length > 0
      ? tracksWithComments[tracksWithComments.length - 1]
      : null;

  if (!latestTrack && !tracksError && project) {
    return (
      <div className="container mx-auto py-6 space-y-6 mt-24">
        <div className="flex items-center gap-2 text-muted-foreground mb-4 text-sm">
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
        <h1 className="text-2xl font-bold">{project.title}</h1>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            This project does not have any workflow tracks yet.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tracksError && !latestTrack && project) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-4 text-sm">
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
        <h1 className="text-2xl font-bold">{project.title}</h1>
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            Error loading project workflow tracks. Please try again later.
            <p className="text-sm text-muted-foreground mt-1">
              ({tracksError?.message})
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 ">
      <div className="flex items-center gap-2 text-muted-foreground mb-4 text-sm">
        <Link href="/projects" className="hover:underline flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
        </Link>
        <Link
          href={`/dashboard/projects/${id}/deliver`}
          className="hover:underline flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> make round one
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
          {project.status === "completed"
            ? "Completed"
            : project.status === "active"
              ? "Active"
              : project.status}
        </Badge>
      </div>

      {project.description && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground whitespace-pre-line">
            {project.description}
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Project Workflow</h2>

        {latestTrack && (
          <>
            <TrackManager
              track={latestTrack}
              updateProjectTrackStepStatus={updateProjectTrackStepStatus}
              updateTrackStructure={updateTrackStructure}
              updateStepContent={updateStepContent}
            />

            {latestTrack.client_decision !== "pending" && (
              <Card className="mt-4">
                <CardContent className="pt-6">
                  <div
                    className={`p-3 mb-4 rounded-md text-sm ${latestTrack.client_decision === "approved" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}
                  >
                    <div className="flex items-center gap-2">
                      {latestTrack.client_decision === "approved" ? (
                        <ThumbsUp className="h-4 w-4" />
                      ) : (
                        <MessageSquareWarning className="h-4 w-4" />
                      )}
                      <span>
                        Client{" "}
                        {latestTrack.client_decision === "approved"
                          ? "approved"
                          : "requested revisions for"}{" "}
                        this round.
                      </span>
                    </div>
                  </div>

                  {latestTrack.comments && latestTrack.comments.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-2">
                        Client Feedback:
                      </p>
                      <ProjectCommentsSection comments={latestTrack.comments} />
                    </div>
                  )}
                  {(!latestTrack.comments ||
                    latestTrack.comments.length === 0) &&
                    latestTrack.client_decision !== "approved" && (
                      <p className="text-sm text-muted-foreground mt-2">
                        No specific comments were provided for the requested
                        revisions.
                      </p>
                    )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {tracksWithComments.length > 1 && (
          <div className="mt-10 space-y-4">
            <h3 className="text-lg font-semibold">Previous Rounds History</h3>
            {tracksWithComments
              .filter((track) => track.id !== latestTrack?.id)
              .sort((a, b) => b.round_number - a.round_number)
              .map((track) => {
                let decisionVariant: "success" | "destructive" | "outline" =
                  "outline";
                let DecisionIcon = Hourglass;
                let decisionText = "Status Unknown";

                if (track.client_decision === "approved") {
                  decisionVariant = "success";
                  DecisionIcon = ShieldCheck;
                  decisionText = "Client Approved";
                } else if (track.client_decision === "revisions_requested") {
                  decisionVariant = "destructive";
                  DecisionIcon = ShieldX;
                  decisionText = "Revisions Requested";
                }

                return (
                  <Card key={track.id} className="bg-muted/40">
                    <CardHeader className="py-3 px-4">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <CardTitle className="text-base font-medium">
                          Round {track.round_number}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={decisionVariant}
                            className="flex items-center gap-1 text-xs px-2 py-0.5"
                          >
                            <DecisionIcon className="h-3.5 w-3.5" />
                            {decisionText}
                          </Badge>
                          <Link href={`/review/${track.id}`} passHref>
                            <RevButtons variant="secondary" size="sm">
                              View History
                            </RevButtons>
                          </Link>
                        </div>
                      </div>
                    </CardHeader>

                    {track.comments && track.comments.length > 0 && (
                      <CardContent className="pt-0 pb-3 px-4">
                        <ProjectCommentsSection comments={track.comments} />
                      </CardContent>
                    )}
                    {track.client_decision === "revisions_requested" &&
                      (!track.comments || track.comments.length === 0) && (
                        <CardContent className="pt-0 pb-3 px-4 text-xs text-muted-foreground">
                          (No specific comments were provided)
                        </CardContent>
                      )}
                  </Card>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
