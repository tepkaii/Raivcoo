// app/projects/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation"; // Keep if needed elsewhere

// Interface for step objects (ensure consistency)
interface Step {
  name: string;
  status: "pending" | "completed";
  deliverable_link?: string | null;
}

// --- Project Creation (Editor Action) ---
// (Keeping this largely the same as the reference provided, assuming it works)
export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (profileError || !editorProfile)
    throw new Error("Failed to fetch editor profile");

  const clientId = formData.get("client_id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const deadline = formData.get("deadline") as string;
  const stepsJson = formData.get("steps") as string; // Expects [{name: string, status: 'pending', deliverable_link?: null}, ...]

  if (!clientId || !title)
    throw new Error("Client and project title are required");

  let steps: Step[];
  try {
    steps = JSON.parse(stepsJson);
    if (!Array.isArray(steps) || steps.length === 0)
      throw new Error("Steps must be a non-empty array.");
    if (
      !steps.every(
        (s) =>
          typeof s.name === "string" &&
          s.name.trim() !== "" &&
          s.status === "pending"
      )
    ) {
      throw new Error(
        "Each step must have a non-empty name and status 'pending'."
      );
    }
    const finishStep = steps[steps.length - 1];
    if (finishStep.name !== "Finish")
      throw new Error("The last step must be 'Finish'.");
    if (!("deliverable_link" in finishStep)) finishStep.deliverable_link = null;
  } catch (error) {
    console.error("Error parsing steps JSON:", error);
    throw new Error(
      error instanceof Error ? error.message : "Invalid steps format provided."
    );
  }

  // Verify client belongs to editor
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("editor_id", editorProfile.id)
    .single();
  if (clientError || !client)
    throw new Error(
      "Invalid client selection or client does not belong to editor."
    );

  try {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        client_id: clientId,
        editor_id: editorProfile.id,
        title,
        description: description || null,
        deadline: deadline || null,
        status: "active",
      })
      .select("id")
      .single();
    if (projectError) throw projectError;

    const { error: trackError } = await supabase.from("project_tracks").insert({
      project_id: project.id,
      round_number: 1,
      status: "in_progress",
      steps: steps,
      client_decision: "pending",
    });
    if (trackError) {
      console.error(
        "Error creating initial track, rolling back project:",
        trackError
      );
      await supabase.from("projects").delete().eq("id", project.id); // Rollback
      throw new Error("Failed to create the initial workflow track.");
    }

    console.log(`Project ${project.id} created successfully.`);
    revalidatePath("/projects");
    revalidatePath(`/clients/${clientId}`);
    return { message: "Project created successfully", project };
  } catch (error) {
    console.error("Full error during project creation:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred during project creation.");
  }
}

// --- Update Step STATUS (Complete/Revert) ---
// Sticking closer to the original updateProjectTrack structure
export async function updateProjectTrackStepStatus(
  trackId: string,
  stepIndex: number,
  newStatus: "pending" | "completed",
  linkValue?: string // Optional: Used ONLY for completing 'Finish' step
) {
  if (!trackId || stepIndex < 0 || !newStatus) {
    throw new Error("Invalid parameters for updating track step status.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Editor not authenticated");

  try {
    // 1. Fetch Track, Project, Editor Profile and verify ownership (original pattern)
    const { data: track, error: trackError } = await supabase
      .from("project_tracks")
      .select(
        `id, project_id, steps, client_decision, project:projects!inner(id, editor_id, client_id)`
      )
      .eq("id", trackId)
      .single();
    if (trackError || !track || !track.project)
      throw new Error("Track or associated project not found.");

    const { data: editorProfile, error: profileError } = await supabase
      .from("editor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (
      profileError ||
      !editorProfile ||
      track.project.editor_id !== editorProfile.id
    ) {
      throw new Error(
        "Unauthorized: Project track does not belong to this editor."
      );
    }

    // 2. Check Client Decision (original pattern)
    if (track.client_decision !== "pending") {
      throw new Error(
        `Client has already submitted their decision (${track.client_decision}). Cannot modify steps.`
      );
    }

    // 3. Validate and Update the specific step IN MEMORY (original pattern)
    let steps = track.steps as Step[]; // Cast to Step[]
    if (!Array.isArray(steps) || stepIndex >= steps.length) {
      throw new Error(`Invalid step index ${stepIndex} or steps format issue.`);
    }

    const stepToUpdate = steps[stepIndex];
    if (!stepToUpdate || typeof stepToUpdate.name !== "string") {
      throw new Error(`Step at index ${stepIndex} is invalid.`);
    }

    const isFinishStep = stepToUpdate.name === "Finish";

    // --- MODIFIED LOGIC: Apply rules based on step type ---
    if (newStatus === "completed") {
      if (isFinishStep) {
        const otherStepsCompleted = steps
          .filter((_, i) => i !== stepIndex)
          .every((s) => s.status === "completed");
        if (!otherStepsCompleted) {
          throw new Error(
            `Cannot complete "Finish". All other steps must be completed first.`
          );
        }
        if (typeof linkValue !== "string" || !linkValue.trim()) {
          throw new Error(
            'A deliverable link is required to complete the "Finish" step.'
          );
        }
        stepToUpdate.deliverable_link = linkValue.trim();
      }
      // No restriction on completing other steps
      stepToUpdate.status = newStatus;
    } else {
      // newStatus === 'pending' (Reverting)
      // No restriction on reverting any step
      stepToUpdate.status = newStatus;
      if (isFinishStep) {
        stepToUpdate.deliverable_link = null; // Clear link on revert
      }
    }
    // --- END OF MODIFIED LOGIC ---

    // 4. Update ONLY the steps array and updated_at in DB (original pattern)
    const { data: updatedTrackData, error: updateError } = await supabase
      .from("project_tracks")
      .update({ steps: steps, updated_at: new Date().toISOString() })
      .eq("id", trackId)
      .select("id, project_id") // Select needed fields
      .single();
    if (updateError)
      throw new Error(
        `Database error updating step status: ${updateError.message}`
      );

    console.log(
      `Step ${stepIndex} (${stepToUpdate.name}) updated to ${newStatus} for track ${trackId}.`
    );

    // 5. Revalidate Caches
    revalidatePath(`/projects/${track.project.id}`);
    if (isFinishStep && newStatus === "completed") {
      revalidatePath(`/projects/${track.project.id}/review/${trackId}`);
    }

    return {
      message: "Step status updated successfully",
      track: updatedTrackData,
    };
  } catch (error) {
    console.error("Full error in updateProjectTrackStepStatus:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred.");
  }
}

// --- NEW: Update Track STRUCTURE (Add/Delete/Rename/Reorder Steps) ---
export async function updateTrackStructure(
  trackId: string,
  newStepsStructure: Omit<Step, "deliverable_link" | "status">[] // Expecting just names in order from dialog [{name: 'Step 1'}, {name: 'Step 2'}]
) {
  if (
    !trackId ||
    !Array.isArray(newStepsStructure) ||
    newStepsStructure.length === 0
  ) {
    throw new Error(
      "Invalid parameters: Track ID and a non-empty steps array are required."
    );
  }
  if (
    !newStepsStructure.every(
      (s) => typeof s.name === "string" && s.name.trim() !== ""
    )
  ) {
    throw new Error(
      "Invalid step structure: All steps must have non-empty names."
    );
  }
  if (
    new Set(newStepsStructure.map((s) => s.name.trim())).size !==
    newStepsStructure.length
  ) {
    throw new Error("Duplicate step names are not allowed.");
  }
  if (newStepsStructure.some((s) => s.name.trim() === "Finish")) {
    throw new Error(
      "The 'Finish' step cannot be managed via this editing dialog."
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Editor not authenticated");

  try {
    // 1. Fetch Track, Project, Editor Profile and verify ownership
    const { data: track, error: trackError } = await supabase
      .from("project_tracks")
      .select(
        `id, project_id, steps, client_decision, project:projects!inner(id, editor_id, client_id)`
      )
      .eq("id", trackId)
      .single();
    if (trackError || !track || !track.project)
      throw new Error("Track or associated project not found.");

    const { data: editorProfile, error: profileError } = await supabase
      .from("editor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (
      profileError ||
      !editorProfile ||
      track.project.editor_id !== editorProfile.id
    ) {
      throw new Error(
        "Unauthorized: Project track does not belong to this editor."
      );
    }

    // 2. Check Client Decision
    if (track.client_decision !== "pending") {
      throw new Error(
        `Client has already submitted their decision (${track.client_decision}). Cannot modify structure.`
      );
    }

    // 3. Reconstruct the full steps array
    const originalSteps = track.steps as Step[];
    const originalFinishStep = originalSteps.find((s) => s.name === "Finish");
    if (!originalFinishStep) {
      // This should ideally not happen if projects are created correctly
      console.error(`Track ${trackId} is missing the 'Finish' step!`);
      throw new Error(
        "Critical error: Track structure is missing the mandatory 'Finish' step."
      );
    }

    // Map old steps by name to preserve status
    const oldStatusMap = new Map<string, "pending" | "completed">();
    originalSteps.forEach((step) => {
      if (step.name !== "Finish") {
        // Exclude Finish step status from this map
        oldStatusMap.set(step.name, step.status);
      }
    });

    // Build the new steps array, preserving status where possible
    const finalNewSteps: Step[] = newStepsStructure.map((newStepInfo) => ({
      name: newStepInfo.name.trim(),
      // Preserve old status if name matches, otherwise default to 'pending' for new steps
      status: oldStatusMap.get(newStepInfo.name.trim()) || "pending",
      // deliverable_link is only for the actual Finish step
    }));

    // Append the original Finish step (preserving its status and link)
    finalNewSteps.push(originalFinishStep);

    // 4. Update the database with the new full steps array
    const { error: updateError } = await supabase
      .from("project_tracks")
      .update({ steps: finalNewSteps, updated_at: new Date().toISOString() })
      .eq("id", trackId);
    if (updateError)
      throw new Error(
        `Database error updating track structure: ${updateError.message}`
      );

    console.log(`Track ${trackId} structure updated successfully.`);

    // 5. Revalidate Cache
    revalidatePath(`/projects/${track.project.id}`);

    return { message: "Workflow steps updated successfully." };
  } catch (error) {
    console.error("Full error in updateTrackStructure:", error);
    throw error instanceof Error
      ? error
      : new Error(
          "An unexpected error occurred while updating workflow steps."
        );
  }
}