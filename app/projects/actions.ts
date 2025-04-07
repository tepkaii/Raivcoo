// app/projects/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// app/projects/actions.ts
export async function createProject(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Get editor profile ID
  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    throw new Error("Failed to fetch editor profile");
  }

  const clientId = formData.get("client_id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const deadline = formData.get("deadline") as string;
  const stepsJson = formData.get("steps") as string;

  if (!clientId || !title) {
    throw new Error("Client and title are required");
  }

  // Parse steps or use default steps if not provided
  let steps;
  try {
    if (stepsJson) {
      steps = JSON.parse(stepsJson);
    } else {
      // Default steps as fallback
      steps = [
        { name: "Get Clips", status: "pending" },
        { name: "Edit/Cut", status: "pending" },
        { name: "Color", status: "pending" },
        { name: "Finish", status: "pending", deliverable_link: null },
      ];
    }
  } catch (error) {
    console.error("Error parsing steps:", error);
    throw new Error("Invalid steps format");
  }

  // Ensure the last step is "Finish" with deliverable_link
  const hasFinishStep = steps.some((step: any) => step.name === "Finish");
  if (!hasFinishStep) {
    steps.push({ name: "Finish", status: "pending", deliverable_link: null });
  }

  // Verify client belongs to this editor
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("editor_id", editorProfile.id)
    .single();

  if (clientError || !client) {
    throw new Error("Invalid client selection");
  }

  try {
    // Create the project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        client_id: clientId,
        editor_id: editorProfile.id,
        title,
        description,
        deadline: deadline || null,
        status: "active",
      })
      .select()
      .single();

    if (projectError) {
      throw projectError;
    }

    // Create the first track with custom steps
    const { error: trackError } = await supabase.from("project_tracks").insert({
      project_id: project.id,
      round_number: 1,
      status: "in_progress",
      steps,
    });

    if (trackError) {
      throw trackError;
    }

    revalidatePath("/projects");
    revalidatePath(`/clients/${clientId}`);
    return { message: "Project created successfully", project };
  } catch (error) {
    console.error("Error creating project:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred");
  }
}

export async function updateProjectTrack(
  trackId: string,
  stepIndex: number,
  status: string,
  linkValue?: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  try {
    // Get the track and verify ownership through project
    const { data: track, error: trackError } = await supabase
      .from("project_tracks")
      .select("id, project_id, steps")
      .eq("id", trackId)
      .single();

    if (trackError || !track) {
      throw new Error("Track not found");
    }

    // Verify this project belongs to the editor
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, editor_id, client_id")
      .eq("id", track.project_id)
      .single();

    if (projectError || !project) {
      throw new Error("Project not found");
    }

    // Get editor profile ID to verify ownership
    const { data: editorProfile, error: profileError } = await supabase
      .from("editor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || project.editor_id !== editorProfile.id) {
      throw new Error("Unauthorized");
    }

    // Update the specific step in the track
    const steps = track.steps as any[];
    if (!steps || stepIndex >= steps.length) {
      throw new Error("Invalid step index");
    }

    steps[stepIndex].status = status;

    // If this is the finish step and we have a link, add it
    if (stepIndex === 3 && linkValue) {
      steps[stepIndex].deliverable_link = linkValue;
    }

    // Update the track
    const { data, error } = await supabase
      .from("project_tracks")
      .update({
        steps,
        updated_at: new Date().toISOString(),
      })
      .eq("id", trackId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    revalidatePath(`/projects/${project.id}`);
    return { message: "Track updated successfully", track: data };
  } catch (error) {
    console.error("Error updating track:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred");
  }
}

export async function completeTrackAndCreateNewRound(trackId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  try {
    // Get the track and verify ownership through project
    const { data: track, error: trackError } = await supabase
      .from("project_tracks")
      .select("id, project_id, round_number")
      .eq("id", trackId)
      .single();

    if (trackError || !track) {
      throw new Error("Track not found");
    }

    // Verify this project belongs to the editor
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, editor_id")
      .eq("id", track.project_id)
      .single();

    if (projectError || !project) {
      throw new Error("Project not found");
    }

    // Get editor profile ID to verify ownership
    const { data: editorProfile, error: profileError } = await supabase
      .from("editor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || project.editor_id !== editorProfile.id) {
      throw new Error("Unauthorized");
    }

    // Update current track to completed
    const { error: updateError } = await supabase
      .from("project_tracks")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", trackId);

    if (updateError) {
      throw updateError;
    }

    // Get revision comments to set as steps for next round
    const { data: comments, error: commentsError } = await supabase
      .from("review_comments")
      .select("comment, timestamp")
      .eq("track_id", trackId)
      .eq("resolved", false)
      .order("timestamp", { ascending: true });

    if (commentsError) {
      throw commentsError;
    }

    // Create steps from comments or use default steps if no comments
    let steps;
    if (comments && comments.length > 0) {
      steps = comments.map((comment) => ({
        name: `At ${comment.timestamp}s: ${comment.comment.substring(0, 100)}`,
        status: "pending",
      }));

      // Always add the finish step
      steps.push({
        name: "Finish",
        status: "pending",
        deliverable_link: null,
      });
    } else {
      // Default steps if no comments
      steps = [
        { name: "Get Clips", status: "pending" },
        { name: "Edit/Cut", status: "pending" },
        { name: "Color", status: "pending" },
        { name: "Finish", status: "pending", deliverable_link: null },
      ];
    }

    // Create new round
    const { data: newTrack, error: newTrackError } = await supabase
      .from("project_tracks")
      .insert({
        project_id: track.project_id,
        round_number: track.round_number + 1,
        status: "in_progress",
        steps,
      })
      .select()
      .single();

    if (newTrackError) {
      throw newTrackError;
    }

    // Mark all comments as resolved
    const { error: resolveError } = await supabase
      .from("review_comments")
      .update({
        resolved: true,
      })
      .eq("track_id", trackId)
      .eq("resolved", false);

    if (resolveError) {
      throw resolveError;
    }

    revalidatePath(`/projects/${project.id}`);
    return {
      message: "Round completed and new round created",
      newTrack,
    };
  } catch (error) {
    console.error("Error completing round:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred");
  }
}

export async function createReviewComment(
  trackId: string,
  timestamp: number,
  comment: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  if (!comment) {
    throw new Error("Comment text is required");
  }

  try {
    const { data, error } = await supabase
      .from("review_comments")
      .insert({
        track_id: trackId,
        user_id: user.id,
        timestamp,
        comment,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Get the project ID to revalidate the path
    const { data: track, error: trackError } = await supabase
      .from("project_tracks")
      .select("project_id")
      .eq("id", trackId)
      .single();

    if (trackError) {
      throw trackError;
    }

    revalidatePath(`/projects/${track.project_id}/review/${trackId}`);
    return { message: "Comment added successfully", comment: data };
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred");
  }
}

export async function completeProject(projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  try {
    // Verify this project belongs to the editor
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, editor_id, client_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      throw new Error("Project not found");
    }

    // Get editor profile ID to verify ownership
    const { data: editorProfile, error: profileError } = await supabase
      .from("editor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || project.editor_id !== editorProfile.id) {
      throw new Error("Unauthorized");
    }

    // Update project status to completed
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (updateError) {
      throw updateError;
    }

    // Set all tracks to completed
    const { error: tracksError } = await supabase
      .from("project_tracks")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("project_id", projectId)
      .eq("status", "in_progress");

    if (tracksError) {
      throw tracksError;
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    revalidatePath(`/clients/${project.client_id}`);
    return { message: "Project marked as completed" };
  } catch (error) {
    console.error("Error completing project:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred");
  }
}
