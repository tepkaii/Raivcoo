// app/projects/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation"; // Keep if needed elsewhere
import { Buffer } from "buffer"; // Needed for Buffer.from

// --- Helper Types (Ensure Step type is consistent if not already defined here) ---
interface Step {
  name: string;
  status: "pending" | "completed";
  deliverable_link?: string | null;
  metadata?: {
    links?: { url: string; text: string }[];
    images?: string[];
    full_text?: string;
    created_at?: string; // From original comment
    original_comment_id?: string; // From original comment
  };
}

// --- Constants for Image Upload ---
const MAX_IMAGES_PER_COMMENT = 4; // Keep consistent with review page
const IMAGE_MAX_SIZE_MB = 5; // 5MB limit for each image
const IMAGE_MAX_SIZE_BYTES = IMAGE_MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_IMAGE_TYPES_STRING = ACCEPTED_IMAGE_TYPES.join(","); // For client-side input accept attribute

async function uploadImageToImgBB(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  // Validate file size
  if (fileBuffer.length > IMAGE_MAX_SIZE_BYTES) {
    throw new Error(
      `File "${fileName}" size exceeds ${IMAGE_MAX_SIZE_MB}MB limit.`
    );
  }

  // Validate file type
  if (!ACCEPTED_IMAGE_TYPES.includes(contentType)) {
    throw new Error(
      `File "${fileName}" has an invalid type (${contentType}). Only JPEG, PNG, and WebP are supported.`
    );
  }

  const formData = new FormData();
  // ImgBB expects a Blob, create one from the Buffer
  formData.append("image", new Blob([fileBuffer], { type: contentType }));
  // Optionally send the original filename, ImgBB might use it or generate its own
  // formData.append("name", fileName); // Often not needed, ImgBB names based on hash

  // Ensure the API key is set in your environment variables
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    console.error("IMGBB_API_KEY environment variable is not set.");
    throw new Error("Image upload service is not configured.");
  }

  try {
    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${apiKey}`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("ImgBB API Error:", errorData);
      throw new Error(
        `Upload failed for "${fileName}": ${response.status} ${response.statusText} - ${errorData?.error?.message || "Unknown ImgBB error"}`
      );
    }

    const data = await response.json();

    if (!data.data?.url) {
      console.error("Invalid response structure from ImgBB:", data);
      throw new Error(
        `Invalid response from ImgBB after uploading "${fileName}".`
      );
    }

    console.log(`Successfully uploaded ${fileName} to ${data.data.url}`);
    return data.data.url; // Return the direct image URL
  } catch (error) {
    console.error(`Error uploading ${fileName} to ImgBB:`, error);
    // Re-throw a more specific error
    throw new Error(
      `Failed to upload image "${fileName}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
// Interface for step objects (ensure consistency)
interface Step {
  name: string;
  status: "pending" | "completed";
  deliverable_link?: string | null;
  metadata?: {
    links?: { url: string; text: string }[];
    images?: string[];
    full_text?: string;
    created_at?: string;
    original_comment_id?: string;
  };
}

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
  const stepsJson = formData.get("steps") as string;

  if (!clientId || !title)
    throw new Error("Client and project title are required");

  let stepNames: string[];
  try {
    stepNames = JSON.parse(stepsJson);
    if (!Array.isArray(stepNames) || stepNames.length === 0)
      throw new Error("Steps must be a non-empty array.");
    if (
      !stepNames.every((name) => typeof name === "string" && name.trim() !== "")
    ) {
      throw new Error("Each step must have a non-empty name.");
    }
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
    // Create the project
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

    // Create initial track with new step structure
    const steps: Step[] = stepNames.map((name) => ({
      status: "pending",
      metadata: {
        type: "general_revision",
        text: name,
        created_at: new Date().toISOString(),
      },
    }));

    // Add final delivery step
    steps.push({
      is_final: true,
      status: "pending",
      deliverable_link: null,
    });

    const { error: trackError } = await supabase.from("project_tracks").insert({
      project_id: project.id,
      round_number: 1,
      status: "in_progress",
      steps: steps,
      client_decision: "pending",
    });

    if (trackError) {
      console.error("Error creating initial track:", trackError);
      await supabase.from("projects").delete().eq("id", project.id);
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

export async function updateProjectTrackStepStatus(
  trackId: string,
  stepIndex: number,
  newStatus: "pending" | "completed",
  linkValue?: string
) {
  const supabase = await createClient();

  // 1. Get the current track data
  const { data: trackData, error: trackError } = await supabase
    .from("project_tracks")
    .select("id, project_id, steps")
    .eq("id", trackId)
    .single();

  if (trackError || !trackData) {
    throw new Error(trackError?.message || "Track not found");
  }

  // 2. Validate the step index
  const steps = trackData.steps || [];
  if (stepIndex < 0 || stepIndex >= steps.length) {
    throw new Error(`Invalid step index: ${stepIndex}`);
  }

  const stepToUpdate = steps[stepIndex];
  if (!stepToUpdate) {
    throw new Error(`Step at index ${stepIndex} not found`);
  }

  const isFinalStep = stepToUpdate.is_final;

  // 3. Prepare the updated step
  const updatedStep = {
    ...stepToUpdate,
    status: newStatus,
    ...(isFinalStep && newStatus === "completed" && linkValue
      ? { deliverable_link: linkValue }
      : {}),
  };

  // 4. Update the steps array
  const updatedSteps = [...steps];
  updatedSteps[stepIndex] = updatedStep;

  // 5. Save to database
  const { error: updateError } = await supabase
    .from("project_tracks")
    .update({
      steps: updatedSteps,
      updated_at: new Date().toISOString(),
    })
    .eq("id", trackId);

  if (updateError) {
    throw new Error(updateError.message || "Failed to update track");
  }

  // 6. Revalidate paths
  revalidatePath(`/dashboard/projects/${trackData.project_id}`);
  revalidatePath(`/projects/${trackData.project_id}/review/${trackId}`);

  return { message: "Step status updated successfully" };
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

export async function updateStepContent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Editor not authenticated");

  // 1. Extract data
  const trackId = formData.get("trackId") as string;
  const stepIndexString = formData.get("stepIndex") as string;
  const updatedText = formData.get("text") as string; // The full text content
  const linksString = formData.get("links") as string; // JSON string of {url, text}[]
  const existingImagesString = formData.get("existingImages") as string; // JSON string of URLs to keep
  const newImageFiles = formData.getAll("newImages") as File[]; // New files to upload

  if (trackId === null || stepIndexString === null) {
    throw new Error("Missing track ID or step index.");
  }
  const stepIndex = parseInt(stepIndexString, 10);
  if (isNaN(stepIndex) || stepIndex < 0) {
    throw new Error("Invalid step index.");
  }

  let updatedLinks: { url: string; text: string }[] = [];
  if (linksString) {
    try {
      updatedLinks = JSON.parse(linksString);
    } catch (e) {
      console.error("Failed to parse links JSON", e); /* handle appropriately */
    }
  }

  let imagesToKeep: string[] = [];
  if (existingImagesString) {
    try {
      imagesToKeep = JSON.parse(existingImagesString);
      if (!Array.isArray(imagesToKeep)) imagesToKeep = []; // Basic validation
    } catch (e) {
      console.error(
        "Failed to parse existing images JSON",
        e
      ); /* handle appropriately */
    }
  }

  // 2. Fetch Track, Project, Editor Profile and verify ownership (reuse pattern)
  const { data: track, error: trackError } = await supabase
    .from("project_tracks")
    .select(
      `id, project_id, steps, client_decision, project:projects!inner(id, editor_id)`
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

  // 3. Check Client Decision
  if (track.client_decision !== "pending") {
    throw new Error(
      `Client has already submitted their decision (${track.client_decision}). Cannot modify step content.`
    );
  }

  // 4. Validate step index and get current steps
  let steps = track.steps as Step[];
  if (!Array.isArray(steps) || stepIndex >= steps.length) {
    throw new Error("Invalid step index or steps format issue.");
  }
  const stepToUpdate = steps[stepIndex];
  if (!stepToUpdate?.metadata) {
    // Should only be editing steps derived from comments, which have metadata
    throw new Error("Cannot edit content for a step without metadata.");
  }

  // 5. Upload New Images (if any) - Reuse uploadImageToImgBB
  const uploadedNewImageUrls: string[] = [];
  if (newImageFiles.length > 0) {
    const totalImages = imagesToKeep.length + newImageFiles.length;
    if (totalImages > MAX_IMAGES_PER_COMMENT) {
      // Reuse constant
      throw new Error(
        `Cannot exceed ${MAX_IMAGES_PER_COMMENT} images in total.`
      );
    }
    try {
      const uploadPromises = newImageFiles.map(async (file) => {
        if (file.size === 0) return null;
        const buffer = Buffer.from(await file.arrayBuffer());
        return await uploadImageToImgBB(buffer, file.name, file.type); // Ensure uploadImageToImgBB is accessible
      });
      const results = await Promise.all(uploadPromises);
      uploadedNewImageUrls.push(
        ...results.filter((url): url is string => url !== null)
      );
    } catch (uploadError) {
      console.error("Error during image upload batch:", uploadError);
      throw uploadError instanceof Error
        ? uploadError
        : new Error("Failed to upload one or more new images.");
    }
  }

  // 6. Construct the new metadata
  const finalImageUrls = [...imagesToKeep, ...uploadedNewImageUrls];
  const updatedMetadata = {
    ...stepToUpdate.metadata, // Keep existing metadata like original_comment_id, created_at
    full_text: updatedText.trim(),
    links: updatedLinks,
    images: finalImageUrls,
  };

  // 7. Update the step in the steps array
  steps[stepIndex] = {
    ...stepToUpdate,
    metadata: updatedMetadata,
    // OPTIONAL: You might want to update the step *name* based on the new text too
    // name: `Revise: ${updatedText.substring(0, 47)}... [${finalImageUrls.length} image(s)] (...)` // Reconstruct name similarly to clientRequestRevisions
  };

  // 8. Update the database
  try {
    const { error: updateError } = await supabase
      .from("project_tracks")
      .update({ steps: steps, updated_at: new Date().toISOString() })
      .eq("id", trackId);
    if (updateError) throw updateError;

    console.log(`Step ${stepIndex} content updated for track ${trackId}.`);

    // 9. Revalidate Cache
    revalidatePath(`/projects/${track.project.id}`); // Revalidate the project page

    return { message: "Step content updated successfully." };
  } catch (error) {
    console.error("Full error in updateStepContent:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred while updating step content.");
  }
}