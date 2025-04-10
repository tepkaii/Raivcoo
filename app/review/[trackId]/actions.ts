// app/projects/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

async function verifyClientAuthorization(
  projectId: string
): Promise<{ user: any; client: any; project: any; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      user: null,
      client: null,
      project: null,
      error: "Not authenticated.",
    };
  }
  if (!user.email) {
    return {
      user: null,
      client: null,
      project: null,
      error: "User email not available for verification.",
    };
  }

  // Fetch project and its associated client's email
  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select(` id, client:clients (id, email) `) // Select client email via relationship
    .eq("id", projectId)
    .single();

  if (projectError || !projectData || !projectData.client) {
    console.error(
      `Error fetching project ${projectId} or its client for auth check:`,
      projectError
    );
    return {
      user,
      client: null,
      project: null,
      error: "Project or client not found.",
    };
  }

  // Compare logged-in user's email with the client's email
  if (projectData.client.email !== user.email) {
    console.warn(
      `Authorization Failed: User ${user.email} attempted action on project ${projectId} assigned to client ${projectData.client.email}`
    );
    return {
      user,
      client: projectData.client,
      project: projectData,
      error: "Unauthorized: You are not the assigned client for this project.",
    };
  }

  // Authorized
  return {
    user,
    client: projectData.client,
    project: projectData,
    error: null,
  };
}

//  EDITOR ACTIONS

export async function createProject(formData: FormData) {
  console.log("Placeholder for createProject");
  // ... Full implementation needed ...
  return { message: "Project created " }; // Example return
}
export async function updateProjectTrack(
  trackId: string,
  stepIndex: number,
  newStatus: "pending" | "completed",
  linkValue?: string
) {
  console.log("Placeholder for updateProjectTrack");
  // ... Full implementation needed based on Phase 1 code ...
  return { message: "Track updated " }; // Example return
}
// Deprecated stubs:
export async function completeTrackAndCreateNewRound(trackId: string) {
  const message = `DEPRECATION/SECURITY WARNING: Editor attempted to call completeTrackAndCreateNewRound for track ${trackId}. This action must be initiated by the client.`;
  console.error(message);
  throw new Error(
    "Operation not permitted for editor. Client must request revisions via the review page."
  );
}
export async function completeProject(projectId: string) {
  const message = `DEPRECATION/SECURITY WARNING: Editor attempted to call completeProject for project ${projectId}. This action must be initiated by the client.`;
  console.error(message);
  throw new Error(
    "Operation not permitted for editor. Client must approve the project via the review page."
  );
}

//  CLIENT ACTIONS (Revised Implementations)

export async function addReviewComment(
  trackId: string,
  timestamp: number,
  comment: string
) {
  const supabase = await createClient();

  // 1. Get User (Still needed for auth check)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // 2. Get Track and Project ID, then Verify Authorization
  const { data: trackData, error: trackError } = await supabase
    .from("project_tracks")
    .select("id, project_id, client_decision")
    .eq("id", trackId)
    .single();

  if (trackError || !trackData) throw new Error("Track not found.");

  // Verify the logged-in user IS the client for this project
  const { client, error: authError } = await verifyClientAuthorization(
    trackData.project_id
  );
  if (authError || !client)
    throw new Error(authError || "Authorization failed.");

  // 3. Prevent adding comments if decision already made
  if (trackData.client_decision !== "pending") {
    throw new Error(
      `Cannot add comment: Decision (${trackData.client_decision}) already submitted.`
    );
  }

  // 4. Basic Validation
  if (!comment?.trim()) throw new Error("Comment text cannot be empty.");
  if (typeof timestamp !== "number" || timestamp < 0)
    throw new Error("Invalid timestamp.");

  // 5. Insert Comment (NO user_id needed now)
  try {
    const { data: newComment, error: insertError } = await supabase
      .from("review_comments")
      .insert({
        track_id: trackId,
        timestamp: timestamp,
        comment: comment.trim(),
        // user_id removed
      })
      .select() // Select the newly created comment data
      .single();

    if (insertError) {
      console.error("Supabase error creating comment:", insertError);
      throw new Error("Database error: Could not save comment.");
    }

    // 6. Revalidate the review page path
    revalidatePath(`/projects/${trackData.project_id}/review/${trackId}`);

    console.log(`Client ${user.email} added comment to track ${trackId}`);
    return { message: "Comment added successfully", comment: newComment };
  } catch (error) {
    console.error("Error in addReviewComment action:", error);
    throw error instanceof Error ? error : new Error("Failed to add comment.");
  }
}

// --- Client Requests Revisions for a Track ---
export async function clientRequestRevisions(trackId: string) {
  const supabase = await createClient();

  // 1. Get Track & Project ID
  const { data: currentTrack, error: trackError } = await supabase
    .from("project_tracks")
    .select("id, project_id, round_number, client_decision")
    .eq("id", trackId)
    .single();

  if (trackError || !currentTrack) throw new Error("Track not found.");

  // 2. Authorize Client
  const {
    user,
    client,
    error: authError,
  } = await verifyClientAuthorization(currentTrack.project_id);
  if (authError || !client || !user)
    throw new Error(authError || "Authorization failed.");

  // 3. Check if decision is 'pending'
  if (currentTrack.client_decision !== "pending") {
    throw new Error(
      `Action not allowed: Decision (${currentTrack.client_decision}) already submitted.`
    );
  }

  // 4. Fetch comments (without user data) to use as steps
  const { data: comments, error: commentsError } = await supabase
    .from("review_comments")
    .select("comment, timestamp") // No user data needed here
    .eq("track_id", trackId)
    .order("timestamp", { ascending: true });

  if (commentsError) {
    console.error("Error fetching comments for revision steps:", commentsError);
    throw new Error("Could not retrieve feedback comments.");
  }

  // 5. Define steps for the next round
  let nextRoundSteps: Step[];
  const finishStep: Step = {
    name: "Finish",
    status: "pending",
    deliverable_link: null,
  };

  if (comments && comments.length > 0) {
    nextRoundSteps = comments.map(
      (c): Step => ({
        name: `Revise: ${c.comment.substring(0, 50)}${c.comment.length > 50 ? "..." : ""} (at ${c.timestamp}s)`,
        status: "pending",
      })
    );
    nextRoundSteps.push(finishStep);
  } else {
    console.warn(
      `Client ${user.email} requested revisions on track ${trackId} without comments.`
    );
    nextRoundSteps = [
      { name: "Implement General Revisions", status: "pending" },
      finishStep,
    ];
  }

  // 6. Use Transaction (via RPC function is recommended)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "handle_client_revision_request_v2",
      {
        p_current_track_id: trackId,
        p_project_id: currentTrack.project_id,
        p_current_round_number: currentTrack.round_number,
        p_next_round_steps: nextRoundSteps,
      }
    );

    if (rpcError) {
      console.error("RPC error requesting revisions:", rpcError);
      throw new Error(`Database error: ${rpcError.message}`);
    }
    const newTrackId = rpcData?.new_track_id; // Adjust based on your function's return

    // 7. Revalidate paths
    revalidatePath(`/projects/${currentTrack.project_id}`);
    revalidatePath(`/projects/${currentTrack.project_id}/review/${trackId}`);

    console.log(
      `Client ${user.email} requested revisions for track ${trackId}. New track ${newTrackId} created.`
    );
    return {
      message: `Revisions requested. Round ${currentTrack.round_number + 1} created.`,
      newTrackId: newTrackId,
    };
  } catch (error) {
    console.error("Error in clientRequestRevisions action:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to process revision request.");
  }
}

// --- Client Approves the Final Project ---
export async function clientApproveProject(projectId: string, trackId: string) {
  const supabase = await createClient();

  // 1. Authorize Client
  const {
    user,
    client,
    error: authError,
  } = await verifyClientAuthorization(projectId);
  if (authError || !client || !user)
    throw new Error(authError || "Authorization failed.");

  // 2. Get current track's decision status to ensure it's pending
  const { data: trackData, error: trackError } = await supabase
    .from("project_tracks")
    .select("id, client_decision, round_number")
    .eq("id", trackId)
    .eq("project_id", projectId)
    .single();

  if (trackError || !trackData)
    throw new Error("Track not found or doesn't belong to project.");
  if (trackData.client_decision !== "pending") {
    throw new Error(
      `Action not allowed: Decision (${trackData.client_decision}) already submitted.`
    );
  }

  // 4. Use Transaction (via RPC function is recommended)
  try {
    // Assuming RPC function 'handle_client_approval_v2' exists and handles:
    // - Updating the specific track's client_decision to 'approved' (atomically)
    // - Updating the project's status to 'completed'
    const { error: rpcError } = await supabase.rpc(
      "handle_client_approval_v2",
      {
        p_project_id: projectId,
        p_track_id: trackId,
      }
    );

    if (rpcError) {
      console.error("RPC error approving project:", rpcError);
      throw new Error(`Database error: ${rpcError.message}`);
    }

    // 5. Revalidate paths
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/review/${trackId}`);
    revalidatePath("/projects");
    if (client.id) revalidatePath(`/clients/${client.id}`);

    console.log(
      `Client ${user.email} approved project ${projectId} via track ${trackId}.`
    );
    return { message: "Project approved successfully." };
  } catch (error) {
    console.error("Error in clientApproveProject action:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to approve project.");
  }
}

// Helper interface (ensure definition exists)
interface Step {
  name: string;
  status: "pending" | "completed";
  deliverable_link?: string | null;
}
