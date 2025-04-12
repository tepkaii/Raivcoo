// app/projects/[id]/deliver/page.tsx
import { createClient } from "@/utils/supabase/server";
import { InitialDeliveryForm } from "./InitialDeliveryForm";

export default async function DeliverPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  // 1. Authentication check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: You must be logged in to view this page
        </div>
      </div>
    );
  }

  // 2. Validate project exists
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, editor_id, status")
    .eq("id", params.id)
    .single();

  if (projectError || !project) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: Project not found - {projectError?.message}
        </div>
      </div>
    );
  }

  // 3. Verify editor ownership
  const { data: editorProfile } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!editorProfile || project.editor_id !== editorProfile.id) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: You don't have permission to access this project
        </div>
      </div>
    );
  }

  // 4. Check project status
  if (project.status !== "active") {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: Project is not in active state (Current status:{" "}
          {project.status})
        </div>
      </div>
    );
  }

  // 5. Get the initial track
  const { data: track, error: trackError } = await supabase
    .from("project_tracks")
    .select("id, steps, status")
    .eq("project_id", params.id)
    .eq("round_number", 1)
    .single();

  if (trackError || !track) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: Could not load project track - {trackError?.message}
        </div>
      </div>
    );
  }

  // 6. Validate track status
  if (track.steps?.length > 0 || track.status !== "in_progress") {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: Initial delivery already completed or track not ready
          <p className="mt-2">
            Steps: {track.steps?.length || 0}, Status: {track.status}
          </p>
        </div>
      </div>
    );
  }

  // If all checks pass, show the form
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Deliver Initial Round</h1>
      <InitialDeliveryForm id={params.id} trackId={track.id} />
    </div>
  );
}
