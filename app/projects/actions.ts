// app/projects/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";


// --- Project Creation (Editor Action) ---
export async function createProject(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("Authentication required to create project.");
        throw new Error("Not authenticated");
    }

    // Get editor profile ID
    const { data: editorProfile, error: profileError } = await supabase
        .from("editor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (profileError || !editorProfile) {
        console.error("Failed to fetch editor profile for user:", user.id, profileError);
        throw new Error("Failed to fetch editor profile");
    }

    const clientId = formData.get("client_id") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const deadline = formData.get("deadline") as string;
    const stepsJson = formData.get("steps") as string;

    if (!clientId || !title) {
        throw new Error("Client and project title are required");
    }

    // Parse steps or use default steps
    let steps;
    try {
        if (stepsJson) {
            steps = JSON.parse(stepsJson);
            if (!Array.isArray(steps)) throw new Error("Steps must be an array.");
        } else {
            // Default steps
            steps = [
                { name: "Get Clips", status: "pending" },
                { name: "Edit/Cut", status: "pending" },
                { name: "Color", status: "pending" },
                // Finish step added below
            ];
        }
    } catch (error) {
        console.error("Error parsing steps JSON:", error);
        throw new Error("Invalid steps format provided.");
    }

    // Ensure the last step is always "Finish" with deliverable_link: null
    const finishStepIndex = steps.findIndex((step: any) => step.name === "Finish");
    if (finishStepIndex !== -1) {
        // If Finish exists, ensure it has the property and move it to the end
        const finishStep = steps.splice(finishStepIndex, 1)[0];
        finishStep.status = finishStep.status || "pending"; // Ensure status exists
        finishStep.deliverable_link = null; // Always reset link on creation
        steps.push(finishStep);
    } else {
        // Add Finish step if it doesn't exist
        steps.push({ name: "Finish", status: "pending", deliverable_link: null });
    }
     // Ensure all other steps have a status
    steps.forEach((step: any) => {
        if (!step.status) step.status = "pending";
    });


    // Verify client belongs to this editor
    const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("id", clientId)
        .eq("editor_id", editorProfile.id)
        .single();

    if (clientError || !client) {
        console.error(`Invalid client selection: Client ${clientId} for editor ${editorProfile.id}`, clientError);
        throw new Error("Invalid client selection or client does not belong to editor.");
    }

    try {
        // Create the project
        const { data: project, error: projectError } = await supabase
            .from("projects")
            .insert({
                client_id: clientId,
                editor_id: editorProfile.id,
                title,
                description: description || null,
                deadline: deadline || null,
                status: "active", // Project starts as active
            })
            .select("id") // Select only the ID needed
            .single();

        if (projectError) {
            console.error("Error inserting project:", projectError);
            throw projectError;
        }

        // Create the first track (Round 1)
        const { error: trackError } = await supabase.from("project_tracks").insert({
            project_id: project.id,
            round_number: 1,
            status: "in_progress", // Editor starts working immediately
            steps: steps,
            client_decision: 'pending', // Explicitly set, though DB default should handle it
        });

        if (trackError) {
            // IMPORTANT: Consider rolling back project creation if track fails
            console.error("Error creating initial project track:", trackError);
            // Ideally, delete the project created above here
            // await supabase.from('projects').delete().eq('id', project.id);
            throw new Error("Failed to create the initial workflow track for the project.");
        }

        console.log(`Project ${project.id} created successfully.`);
        // Revalidate paths to show the new project
        revalidatePath("/projects");
        revalidatePath(`/clients/${clientId}`); // Revalidate client page too

        return { message: "Project created successfully", project };

    } catch (error) {
        console.error("Full error during project creation:", error);
        // Rethrow specific known errors or a generic one
        throw error instanceof Error ? error : new Error("An unexpected error occurred during project creation.");
    }
}

// --- Track Step Update (Editor Action - Refined) ---
// Allows editor to mark steps (except Finish) as 'completed' or 'pending' (revert)
// Allows editor to set/clear the deliverable_link on the 'Finish' step and mark it 'completed'/'pending'
export async function updateProjectTrack(
    trackId: string,
    stepIndex: number,
    newStatus: 'pending' | 'completed', // Enforce allowed statuses
    linkValue?: string // Optional: Used only for the 'Finish' step
) {
    if (!trackId || stepIndex < 0 || !newStatus) {
        throw new Error("Invalid parameters for updating track step.");
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("Authentication required to update track step.");
        throw new Error("Editor not authenticated");
    }

    try {
        // 1. Fetch Track, Project, Editor Profile and verify ownership
        const { data: track, error: trackError } = await supabase
            .from("project_tracks")
            .select(`
                id,
                project_id,
                steps,
                client_decision,
                project:projects!inner(id, editor_id, client_id)
            `)
            .eq("id", trackId)
            .single();

        if (trackError || !track || !track.project) {
            console.error(`Track fetch error for ID ${trackId}:`, trackError);
            throw new Error("Track or associated project not found.");
        }

        const { data: editorProfile, error: profileError } = await supabase
            .from("editor_profiles")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (profileError || !editorProfile || track.project.editor_id !== editorProfile.id) {
            console.error(`Authorization error: Editor ${user.id} / Profile ${editorProfile?.id} does not own project ${track.project.id} owned by ${track.project.editor_id}`);
            throw new Error("Unauthorized: Project does not belong to this editor.");
        }

        // 2. Check if Client has already made a decision
        if (track.client_decision !== 'pending') {
            console.warn(`Attempt to modify track ${trackId} after client decision (${track.client_decision}).`);
            throw new Error(`Client has already submitted their decision (${track.client_decision}). Cannot modify steps.`);
        }

        // 3. Validate and Update the specific step in the steps array
        const steps = track.steps as any[]; // Assuming steps is an array of objects
        if (!Array.isArray(steps) || stepIndex >= steps.length) {
            throw new Error("Invalid step index or steps format is not an array.");
        }

        // Get the specific step
        const stepToUpdate = steps[stepIndex];
        if (!stepToUpdate) {
             throw new Error(`Step at index ${stepIndex} not found.`);
        }

        const isFinishStep = stepToUpdate.name === "Finish";

        // Prevent marking non-Finish steps 'completed' if previous steps aren't done
        if (newStatus === 'completed' && !isFinishStep) {
            for (let i = 0; i < stepIndex; i++) {
                if (!steps[i] || steps[i].status !== 'completed') {
                     throw new Error(`Cannot complete step "${stepToUpdate.name}". Previous step "${steps[i]?.name || 'Index '+i}" is not completed.`);
                }
            }
        }
        // Prevent reverting steps if later steps are completed
         if (newStatus === 'pending') {
             for (let i = stepIndex + 1; i < steps.length; i++) {
                 if (steps[i]?.status === 'completed') {
                      throw new Error(`Cannot revert step "${stepToUpdate.name}". Later step "${steps[i].name}" is already completed. Revert later steps first.`);
                 }
             }
         }


        // Update status
        stepToUpdate.status = newStatus;

        // Update deliverable link ONLY for the finish step.
        // linkValue is ONLY considered if isFinishStep is true.
        // If reverting Finish step (newStatus='pending'), clear the link.
        if (isFinishStep) {
            if (newStatus === 'completed' && typeof linkValue !== 'undefined') {
                stepToUpdate.deliverable_link = linkValue || null; // Allow setting link on completion
            } else if (newStatus === 'pending') {
                 stepToUpdate.deliverable_link = null; // Always clear link on revert
                 // linkValue is ignored when reverting
            }
        }

        // 4. Update ONLY the steps array and updated_at timestamp in the database
        const { data: updatedTrackData, error: updateError } = await supabase
            .from("project_tracks")
            .update({
                steps: steps, // The modified steps array
                updated_at: new Date().toISOString(),
                // DO NOT update overall track 'status' or 'client_decision' here
            })
            .eq("id", trackId)
            .select('id, project_id') // Select necessary fields for revalidation
            .single();

        if (updateError) {
            console.error(`Database error updating steps for track ${trackId}:`, updateError);
            throw new Error(`Database error: ${updateError.message}`);
        }

        console.log(`Step ${stepIndex} (${stepToUpdate.name}) updated to ${newStatus} for track ${trackId}.`);

        // 5. Revalidate relevant Next.js caches
        revalidatePath(`/projects/${track.project.id}`); // Project detail page (shows TrackManager)
        // Revalidate the review page ONLY if the finish step was just completed
        if (isFinishStep && newStatus === 'completed') {
           console.log(`Revalidating review page for track ${trackId} as Finish step completed.`);
           revalidatePath(`/projects/${track.project.id}/review/${trackId}`);
        }

        return { message: "Step updated successfully", track: updatedTrackData };

    } catch (error) {
        console.error("Full error in updateProjectTrack function:", error);
        // Rethrow specific known errors or a generic one
        throw error instanceof Error ? error : new Error("An unexpected error occurred while updating the track step.");
    }
}


