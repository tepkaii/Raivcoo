// app/projects/[projectId]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { RevButtons } from "@/components/ui/RevButtons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, ArrowLeft, ExternalLink } from "lucide-react";
import { Metadata } from "next";
import TrackManager from "./TrackManager";
import {
  updateProjectTrack,
  completeTrackAndCreateNewRound,
  completeProject,
} from "../actions";

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const supabase = await createClient();

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

export default async function ProjectDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await props.params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get editor profile ID
  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    redirect("/profile");
  }

  // Fetch project with client information
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
        client:clients(id, name)
      `
    )
    .eq("id", id)
    .eq("editor_id", editorProfile.id)
    .single();

  if (projectError || !project) {
    return notFound();
  }

  // Fetch tracks for this project
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
        updated_at
      `
    )
    .eq("project_id", id)
    .order("round_number", { ascending: true });

  if (tracksError) {
    console.error("Error fetching tracks:", tracksError);
  }

  // Add safety check for tracks that might not exist
  if (!tracks || tracks.length === 0) {
    return (
      <div className="container mx-auto py-6 space-y-6 mt-24">
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Link href="/projects" className="hover:underline flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
          </Link>
          {" • "}
          <Link
            href={`/clients/${project.client.id}`}
            className="hover:underline"
          >
            {project.client.name}
          </Link>
        </div>

        <h1 className="text-2xl font-bold">{project.title}</h1>

        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              No workflow tracks found for this project.
            </p>
            <p className="mt-2">
              <Link href="/projects" passHref>
                <RevButtons variant="outline">Return to Projects</RevButtons>
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get current active track (or the last one if all completed)
  const activeTrack =
    tracks.find((track) => track.status === "in_progress") ||
    tracks[tracks.length - 1];

  // Make sure the track has a steps array
  if (activeTrack && !activeTrack.steps) {
    activeTrack.steps = [];
  }

  return (
    <div className="container mx-auto py-6 space-y-6 mt-24">
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Link href="/projects" className="hover:underline flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
        </Link>
        {" • "}
        <Link
          href={`/clients/${project.client.id}`}
          className="hover:underline"
        >
          {project.client.name}
        </Link>
      </div>
      <Link href={`/projects/${id}/live-track`} passHref>
        <RevButtons variant="outline">
          <ExternalLink className="h-4 w-4 mr-2" />
          Live Track Link
        </RevButtons>
      </Link>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Created {new Date(project.created_at).toLocaleDateString()}
            </span>
            {project.deadline && (
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Due {new Date(project.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            project.status === "completed"
              ? "bg-green-100 text-green-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {project.status === "completed" ? "Completed" : "Active"}
        </div>
      </div>

      {project.description && (
        <Card>
          <CardContent className="pt-4">
            <p className="whitespace-pre-line">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Project tracks section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Project Workflow</h2>

        {activeTrack && (
          <TrackManager
            track={activeTrack}
            updateProjectTrack={updateProjectTrack}
            completeTrackAndCreateNewRound={completeTrackAndCreateNewRound}
            completeProject={completeProject}
          />
        )}

        {/* Previous rounds/tracks */}
        {tracks && tracks.length > 1 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-lg font-medium">Previous Rounds</h2>
            {tracks
              .filter((track) => track.id !== activeTrack?.id)
              .map((track) => (
                <Card key={track.id} className="bg-muted/30">
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">
                        Round {track.round_number}
                      </CardTitle>
                      <Link
                        href={`/projects/${id}/review/${track.id}`}
                        passHref
                      >
                        <RevButtons variant="outline" size="sm">
                          View Details
                        </RevButtons>
                      </Link>
                    </div>
                  </CardHeader>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
