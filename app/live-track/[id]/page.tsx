// app/projects/[id]/live-track/page.tsx
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { RevButtons } from "@/components/ui/RevButtons";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Calendar, Clock, CheckCircle, ExternalLink } from "lucide-react";
import { Metadata } from "next";

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
    title: project ? `Live Track: ${project.title}` : "Project Live Track",
    description: "Real-time tracking of your video project status",
  };
}

export default async function LiveTrackPage(props: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await props.params;

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

  if (tracksError || !tracks || tracks.length === 0) {
    return (
      <div className="container mx-auto py-6 mt-24">
        {/* <Link
          href={`/dashboard/projects/${id}`}
          className="text-blue-500 hover:underline flex items-center mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to project
        </Link> */}
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              No track information available for this project.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get current active track
  const activeTrack =
    tracks.find((track) => track.status === "in_progress") ||
    tracks[tracks.length - 1];

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        {/* <Link
          href={`/dashboard/projects/${id}`}
          className="text-blue-500 hover:underline flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to project
        </Link> */}
        <h1 className="text-2xl font-bold mt-4">{project.title}</h1>
        <p className="text-muted-foreground">Live Track View</p>
        ss
        <div className="flex items-center gap-4 mt-2 text-sm">
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
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              project.status === "completed"
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {project.status === "completed" ? "Completed" : "Active"}
          </span>
        </div>
      </div>

      {/* Current track progress */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            Current Progress - Round {activeTrack.round_number}
          </CardTitle>
          <CardDescription>
            Last updated: {new Date(activeTrack.updated_at).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
            {activeTrack.steps && activeTrack.steps.length > 0 ? (
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{
                  width: `${(activeTrack.steps.filter((step) => step.status === "completed").length / activeTrack.steps.length) * 100}%`,
                }}
              ></div>
            ) : (
              <div className="bg-gray-400 h-2.5 rounded-full w-0"></div>
            )}
          </div>

          {/* Steps list */}
          <div className="space-y-4">
            {activeTrack.steps &&
              activeTrack.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-center p-3 border rounded-md"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                      step.status === "completed"
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-medium">{step.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {step.status === "completed"
                        ? "Completed"
                        : "In progress"}
                    </p>
                  </div>

                  {step.name === "Finish" &&
                    step.status === "completed" &&
                    step.deliverable_link && (
                      <Link
                        href={`/projects/${id}/review/${activeTrack.id}`}
                        passHref
                      >
                        <RevButtons variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Review Deliverable
                        </RevButtons>
                      </Link>
                    )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Previous rounds */}
      {tracks.length > 1 && (
        <div className="mt-8">
          <h2 className="text-xl font-medium mb-4">Previous Rounds</h2>
          <div className="space-y-4">
            {tracks
              .filter((track) => track.id !== activeTrack.id)
              .map((track) => (
                <Card key={track.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-base">
                        Round {track.round_number}
                      </CardTitle>
                      {track.steps &&
                        track.steps.some(
                          (step) =>
                            step.name === "Finish" &&
                            step.status === "completed" &&
                            step.deliverable_link
                        ) && (
                          <Link
                            href={`/projects/${id}/review/${track.id}`}
                            passHref
                          >
                            <RevButtons variant="outline" size="sm">
                              View Deliverable
                            </RevButtons>
                          </Link>
                        )}
                    </div>
                  </CardHeader>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
