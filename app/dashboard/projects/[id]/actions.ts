// app/projects/actions.ts
// @ts-nocheck
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Buffer } from "buffer"; 

const MAX_IMAGES_PER_COMMENT = 4; // Keep consistent with review page
const IMAGE_MAX_SIZE_MB = 5; // 5MB limit for each image
const IMAGE_MAX_SIZE_BYTES = IMAGE_MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];


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

interface Step {
  name?: string;
  status: "pending" | "completed";
  is_final?: boolean;
  deliverable_link?: string | null;
  metadata?: {
    type: "comment" | "general_revision";
    comment_id?: string;
    text?: string; // Use 'text'
    timestamp?: number;
    images?: string[];
    links?: { url: string; text: string }[];
    created_at?: string;
    step_index?: number;
  };
}


// Update the createProject function in app/projects/actions.ts
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

  // Get project details directly from form
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const deadline = formData.get("deadline") as string;
  const commentsData = formData.get("comments") as string;

  // Get client details directly from form
  const clientName = formData.get("client_name") as string;
  const clientEmail = formData.get("client_email") as string;

  // Get password protection details
  const passwordProtected =
    (formData.get("password_protected") as string) === "true";
  const accessPassword = passwordProtected
    ? (formData.get("access_password") as string)
    : null;

  // Get workflow mode details
  const useManualSteps = (formData.get("use_manual_steps") as string) === "true";
  const includeDeliverable = (formData.get("include_deliverable") as string) === "true";
  
  // Get deliverable details if included
  const deliverableLink = formData.get("deliverable_link") as string;
  const deliverableMediaType = formData.get("deliverable_media_type") as "video" | "image";

  if (!title || !commentsData || !clientName)
    throw new Error("Project title, client name, and work steps are required");

  try {
    // Parse comments data
    const comments = JSON.parse(commentsData) as {
      text: string;
      images: string[];
    }[];

    // Create the project directly with client information
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        editor_id: editorProfile.id,
        title,
        description: description || null,
        deadline: deadline || null,
        status: "active",
        // Client fields directly in project
        client_name: clientName,
        client_email: clientEmail || null,
        // Password protection
        password_protected: passwordProtected,
        access_password: accessPassword,
      })
      .select("id")
      .single();
    if (projectError) throw projectError;

    // Process images and create steps
    const steps: Step[] = [];

    // Determine if all steps should be completed (when deliverable is included)
    const shouldCompleteAllSteps = includeDeliverable && deliverableLink && deliverableMediaType;

    for (const [index, comment] of comments.entries()) {
      let imageUrls: string[] = [];

      // Upload images if they exist
      if (comment.images && comment.images.length > 0) {
        const uploadPromises = comment.images.map(
          async (fileName, imgIndex) => {
            const fileKey = `image_${index}_${imgIndex}`;
            const file = formData.get(fileKey) as File;
            if (!file) return null;

            const buffer = Buffer.from(await file.arrayBuffer());
            return await uploadImageToImgBB(buffer, file.name, file.type);
          }
        );

        const results = await Promise.all(uploadPromises);
        imageUrls = results.filter((url): url is string => url !== null);
      }

      // Detect and extract links from text
      const { processedText, links } = detectAndExtractLinks(comment.text);

      steps.push({
        name: `Step ${index + 1}`,
        // Mark as completed if deliverable is included, otherwise pending
        status: shouldCompleteAllSteps ? "completed" : "pending",
        metadata: {
          type: "comment",
          text: processedText,
          images: imageUrls,
          links: links,
          created_at: new Date().toISOString(),
          step_index: index,
        },
      });
    }

    // Handle final step based on whether deliverable is included
    let finalStepStatus: "pending" | "completed" = shouldCompleteAllSteps ? "completed" : "pending";
    let finalDeliverableLink: string | null = shouldCompleteAllSteps ? deliverableLink : null;
    let finalMediaType: "video" | "image" | null = shouldCompleteAllSteps ? deliverableMediaType : null;

    // Add final step
    steps.push({
      name: "Finish",
      is_final: true,
      status: finalStepStatus,
      deliverable_link: finalDeliverableLink,
    });

    // Determine track status based on completion
    let trackStatus = "in_progress";
    if (shouldCompleteAllSteps) {
      // If deliverable is included, all steps are completed, so track is ready for review
      trackStatus = "in_review";
    }

    // Create initial track with the steps
    const { data: track, error: trackError } = await supabase
      .from("project_tracks")
      .insert({
        project_id: project.id,
        round_number: 1,
        status: trackStatus,
        steps: steps,
        client_decision: "pending",
        final_deliverable_media_type: finalMediaType,
      })
      .select("id")
      .single();

    if (trackError) {
      console.error("Error creating initial track:", trackError);
      await supabase.from("projects").delete().eq("id", project.id);
      throw new Error("Failed to create the initial workflow track.");
    }

    console.log(
      `Project ${project.id} created successfully with initial steps.`
    );
    revalidatePath("/projects");

    // Prepare response
    const response: { 
      message: string; 
      project: any; 
      reviewLink?: string; 
      trackId?: string;
    } = {
      message: "Project created successfully with work steps",
      project,
      trackId: track.id,
    };

    // If deliverable was included, provide the review link
    if (shouldCompleteAllSteps && track) {
      response.reviewLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/review/${track.id}`;
      response.message = "Project created successfully! All steps completed and review link is ready.";
    }

    return response;
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
  linkValue?: string, // Link specifically for the final step update in steps JSONB
  finalMediaType?: "video" | "image" // Type specifically for the new DB column
) {
  const supabase = await createClient();
  // --- Consider adding Editor Auth/Verification here ---

  // 1. Get current track data (including steps AND the new column)
  const { data: trackData, error: trackError } = await supabase
    .from("project_tracks")
    .select("id, project_id, steps, final_deliverable_media_type") // Select the new column
    .eq("id", trackId)
    .single();

  if (trackError || !trackData) {
    console.error("Error fetching track for status update:", trackError);
    throw new Error(trackError?.message || "Track not found");
  }

  // --- Add check for client_decision if needed ---

  // 2. Validate step index
  const steps = (trackData.steps || []) as Step[]; // Cast to updated Step type
  if (stepIndex < 0 || stepIndex >= steps.length) {
    throw new Error(`Invalid step index: ${stepIndex}`);
  }
  const stepToUpdate = steps[stepIndex];
  if (!stepToUpdate) {
    throw new Error(`Step at index ${stepIndex} not found`);
  }
  const isFinalStep = stepToUpdate.is_final;

  // 3. Prepare updates
  const updatedSteps = [...steps]; // Create a mutable copy
  const updatedStep = { ...stepToUpdate, status: newStatus }; // Update status
  updatedSteps[stepIndex] = updatedStep; // Place updated step back into the array

  // Prepare the payload for the main track row update
  const trackUpdatePayload: {
    steps: Step[];
    updated_at: string;
    final_deliverable_media_type?: "video" | "image" | null;
  } = {
    steps: updatedSteps, // Base payload includes the array with the updated status
    updated_at: new Date().toISOString(),
    // Initially, assume the type column doesn't change unless it's the final step
    final_deliverable_media_type: trackData.final_deliverable_media_type,
  };

  // Modify payload and the step *within* the updatedSteps array for the final step
  if (isFinalStep) {
    if (newStatus === "completed" && linkValue && finalMediaType) {
      // Update the link *inside* the step object within the array
      updatedStep.deliverable_link = linkValue;
      // Set the value for the dedicated column in the main payload
      trackUpdatePayload.final_deliverable_media_type = finalMediaType;
    } else if (newStatus === "pending") {
      // Clear the link *inside* the step object within the array
      updatedStep.deliverable_link = null;
      // Clear the value for the dedicated column in the main payload
      trackUpdatePayload.final_deliverable_media_type = null;
    }
    // Ensure the potentially modified updatedStep is in the array being sent
    trackUpdatePayload.steps = updatedSteps;
  }

  // 5. Save updates to the database
  const { error: updateError } = await supabase
    .from("project_tracks")
    .update(trackUpdatePayload) // Use the combined payload
    .eq("id", trackId);

  if (updateError) {
    console.error("Error updating track status/type:", updateError);
    throw new Error(updateError.message || "Failed to update track");
  }

  // 6. Revalidate paths
  if (trackData.project_id) {
    revalidatePath(`/dashboard/projects/${trackData.project_id}`);
    revalidatePath(`/review/${trackId}`); // Adjust if review path includes project ID
  } else {
    revalidatePath(`/dashboard/projects/[id]`, "page");
    revalidatePath("/review/[trackId]", "page");
  }

  return { message: "Step status updated successfully" };
}

export async function updateTrackStructure(
  trackId: string,
  // Expecting steps without status, link, is_final; they should retain comment_id if applicable
  newStepsStructure: Omit<Step, "status" | "deliverable_link" | "is_final">[]
) {
  if (!trackId || !Array.isArray(newStepsStructure)) {
    throw new Error("Invalid parameters: Track ID and steps array required.");
  }
  // Add more validation if needed (e.g., non-empty names, no duplicates)

  const supabase = await createClient();
  const {
    data: { user },
    error: userAuthError,
  } = await supabase.auth.getUser();
  if (userAuthError || !user) throw new Error("Editor not authenticated");

  const { data: editorProfile, error: profileError } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (profileError || !editorProfile)
    throw new Error("Editor profile not found.");

  try {
    const { data: track, error: trackError } = await supabase
      .from("project_tracks")
      .select(
        `id, project_id, steps, client_decision, project:projects!inner(id, editor_id)`
      )
      .eq("id", trackId)
      .single();

    if (trackError || !track || !track.project) {
      throw new Error("Track or associated project not found.");
    }
    if (track.project.editor_id !== editorProfile.id) {
      throw new Error(
        "Unauthorized: Project track does not belong to this editor."
      );
    }
    if (track.client_decision !== "pending") {
      throw new Error(
        `Client decision is '${track.client_decision}'. Cannot modify structure.`
      );
    }

    const originalSteps = (track.steps as Step[]) || [];
    const originalFinishStep = originalSteps.find((s) => s.is_final);

    if (!originalFinishStep) {
      console.error(`Track ${trackId} is missing the 'Finish' step!`);
      throw new Error(
        "Critical error: Track is missing the mandatory 'Finish' step."
      );
    }

    // Map old steps by a stable identifier (e.g., metadata.comment_id)
    const oldStepMap = new Map<string, Step>();
    originalSteps.forEach((step) => {
      if (!step.is_final && step.metadata?.comment_id) {
        oldStepMap.set(step.metadata.comment_id, step);
      }
    });

    // Build the new steps array, preserving status and essential metadata
    const finalNewSteps: Step[] = newStepsStructure.map(
      (newStepInfo, index) => {
        // Find corresponding old step using comment_id if available
        const oldStep = newStepInfo.metadata?.comment_id
          ? oldStepMap.get(newStepInfo.metadata.comment_id)
          : undefined;

        // Construct the merged step
        return {
          name: newStepInfo.name || `Step ${index + 1}`, // Use new name or generate
          status: oldStep?.status || "pending", // Preserve status or default
          is_final: false, // Explicitly not final
          deliverable_link: null, // Explicitly null
          // Merge metadata, prioritizing new data but keeping old if not overwritten
          metadata: {
            ...(oldStep?.metadata || {}), // Start with old metadata
            ...(newStepInfo.metadata || {}), // Overwrite with any new metadata provided
            type: oldStep?.metadata?.type || "comment", // Ensure type exists
            comment_id:
              oldStep?.metadata?.comment_id || newStepInfo.metadata?.comment_id, // Preserve stable ID
          },
        };
      }
    );

    // Append the original Finish step (preserving its status and link)
    finalNewSteps.push(originalFinishStep);

    // Update the database
    const { error: updateError } = await supabase
      .from("project_tracks")
      .update({ steps: finalNewSteps, updated_at: new Date().toISOString() })
      .eq("id", trackId);

    if (updateError) {
      console.error("Database error updating track structure:", updateError);
      throw new Error(
        `Database error updating track structure: ${updateError.message}`
      );
    }

    console.log(`Track ${trackId} structure updated successfully.`);

    // Revalidate Cache
    revalidatePath(`/dashboard/projects/${track.project_id}`);
    revalidatePath(`/review/${trackId}`);
    revalidatePath(`/projects/${track.project_id}/review/${trackId}`); // Live Track view

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
  // Get the text from the editor - IT CONTAINS PLAIN URLS NOW
  const textFromEditor = ((formData.get("text") as string) || "").trim();
  const existingImagesString = formData.get("existingImages") as string;
  const newImageFiles = formData.getAll("newImages") as File[];

  if (trackId === null || stepIndexString === null) {
    throw new Error("Missing track ID or step index.");
  }
  const stepIndex = parseInt(stepIndexString, 10);
  if (isNaN(stepIndex) || stepIndex < 0) {
    throw new Error("Invalid step index.");
  }

  let imagesToKeep: string[] = [];
  if (existingImagesString) {
    try {
      imagesToKeep = JSON.parse(existingImagesString);
      if (!Array.isArray(imagesToKeep)) imagesToKeep = [];
    } catch (e) {
      console.error("Failed to parse existing images JSON", e);
      imagesToKeep = [];
    }
  }

  // 2. Fetch Track and verify ownership
  const { data: track, error: trackError } = await supabase
    .from("project_tracks")
    .select(
      `id, project_id, steps, client_decision, project:projects!inner(id, editor_id)`
    )
    .eq("id", trackId)
    .single();
  if (trackError || !track || !track.project)
    throw new Error("Track or associated project not found.");

  // Verify editor owns the project
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
  let steps = track.steps as Step[] | null;
  if (!Array.isArray(steps) || stepIndex >= steps.length) {
    console.error(`Invalid step index ${stepIndex} for steps array:`, steps);
    throw new Error("Invalid step index or steps format issue.");
  }
  const stepToUpdate = steps[stepIndex];

  // Prevent editing the final step's content this way
  if (stepToUpdate.is_final) {
    throw new Error(
      "The final deliverable step content cannot be edited directly."
    );
  }

  // --- SERVER-SIDE PROCESSING ---
  // Process the text received from the editor to extract links and create placeholders
  const { processedText, links } = detectAndExtractLinks(textFromEditor);
  // 'processedText' now contains [LINK:X] placeholders
  // 'links' is the array of extracted { url: string, text: string } objects
  // --- END SERVER-SIDE PROCESSING ---

  // 5. Upload New Images (No changes needed here)
  const uploadedNewImageUrls: string[] = [];
  if (newImageFiles.length > 0) {
    const totalImages = imagesToKeep.length + newImageFiles.length;
    if (totalImages > MAX_IMAGES_PER_COMMENT) {
      throw new Error(
        `Cannot exceed ${MAX_IMAGES_PER_COMMENT} images in total.`
      );
    }
    try {
      const uploadPromises = newImageFiles
        .filter((file) => file.size > 0)
        .map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());
          return await uploadImageToImgBB(buffer, file.name, file.type);
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

  // 6. Construct the new metadata using the PROCESSED text and links
  const finalImageUrls = [...imagesToKeep, ...uploadedNewImageUrls];

  const currentMetadata = stepToUpdate.metadata || {
    type: "comment",
    created_at: new Date().toISOString(),
  };

  const updatedMetadata = {
    ...currentMetadata, // Keep existing base metadata like type, comment_id
    text: processedText, // SAVE the text WITH [LINK:X] placeholders
    links: links, // SAVE the NEWLY generated links array
    images: finalImageUrls, // Update images
  };

  // 7. Update the step in the local array
  steps[stepIndex] = {
    ...stepToUpdate,
    metadata: updatedMetadata,
  };

  // 8. Save updated steps back to the database
  try {
    const { error: updateError } = await supabase
      .from("project_tracks")
      .update({ steps: steps, updated_at: new Date().toISOString() })
      .eq("id", trackId);
    if (updateError) throw updateError;

    console.log(`Step ${stepIndex} content updated for track ${trackId}.`);

    // 9. Revalidate Cache
    revalidatePath(`/dashboard/projects/${track.project_id}`);
    revalidatePath(`/review/${trackId}`);
    revalidatePath(`/projects/${track.project_id}/review/${trackId}`);

    return { message: "Step content updated successfully." };
  } catch (error) {
    console.error("Full error in updateStepContent database update:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred while updating step content.");
  }
}
// app/projects/actions.ts
export async function deliverInitialRound(
  trackId: string,
  deliverableLink: string,
  comments: {
    text: string;
    images?: File[];
    links?: { url: string; text: string }[];
  }[]
) {
  const supabase = await createClient();

  // 1. Verify track exists and is round 1
  const { data: track, error: trackError } = await supabase
    .from("project_tracks")
    .select("id, project_id, round_number, steps")
    .eq("id", trackId)
    .eq("round_number", 1)
    .single();

  if (trackError || !track) {
    throw new Error(trackError?.message || "Initial track not found");
  }

  // 2. Upload images and prepare steps
  const steps: Step[] = [];

  for (const comment of comments) {
    let imageUrls: string[] = [];

    // Upload images if they exist
    if (comment.images && comment.images.length > 0) {
      try {
        const uploadPromises = comment.images.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());
          return await uploadImageToImgBB(buffer, file.name, file.type);
        });
        imageUrls = await Promise.all(uploadPromises);
      } catch (error) {
        console.error("Error uploading images:", error);
        throw new Error("Failed to upload one or more images");
      }
    }

    // Detect and extract links from text
    const { processedText, links } = detectAndExtractLinks(comment.text);

    steps.push({
      status: "completed" as const,
      metadata: {
        type: "comment",
        text: processedText,
        images: imageUrls,
        links: links,
        created_at: new Date().toISOString(),
        step_index: steps.length,
      },
    });
  }

  // Add final delivery step
  steps.push({
    is_final: true,
    status: "completed" as const,
    deliverable_link: deliverableLink,
  });

  // 3. Update the track
  const { error: updateError } = await supabase
    .from("project_tracks")
    .update({
      steps: steps,
      status: "in_review",
      updated_at: new Date().toISOString(),
    })
    .eq("id", trackId);

  if (updateError) {
    throw new Error(updateError.message || "Failed to deliver initial round");
  }

  // 4. Revalidate paths
  revalidatePath(`/projects/${track.project_id}`);
  revalidatePath(`/dashboard/projects/${track.project_id}`);

  return { message: "Initial round delivered successfully" };
}

function detectAndExtractLinks(text: string) {
  // Regex to find URLs (http, https) that are not already part of a [LINK:X] tag
  // This regex tries to avoid matching URLs immediately following "[LINK:"
  const urlRegex = /(?<!\[LINK:)(\bhttps?:\/\/[^\s<>"]+)/g;
  // More robust regex might be needed depending on edge cases

  const links: { url: string; text: string }[] = [];
  let processedText = text;
  let match;

  // Find all URLs first and store them
  const urlMatches = Array.from(text.matchAll(urlRegex));

  urlMatches.forEach((match) => {
    const url = match[0];
    // Check if this URL is already in our links array to avoid duplicates
    // and handle multiple occurrences of the same URL consistently.
    let existingLinkIndex = links.findIndex((link) => link.url === url);

    if (existingLinkIndex === -1) {
      // New URL, add it to the links array
      links.push({
        url: url,
        text: url, // Default link text is the URL itself
      });
      existingLinkIndex = links.length - 1; // Its new index
    }

    // Replace *this specific occurrence* of the URL with the placeholder
    // Using replaceAll directly here can be tricky if the URL appears multiple times.
    // A safer approach involves iterating or using string indices, but
    // for simplicity, we'll use replace first, acknowledging potential limitations.
    // Consider a more robust replacement strategy if identical links cause issues.
    processedText = processedText.replace(url, `[LINK:${existingLinkIndex}]`);
  });

  // If the initial text already contained [LINK:X] placeholders from a previous save,
  // this function should ideally preserve them if the regex is correct.
  // However, mixing manual [LINK:X] editing with automatic URL detection is complex.

  return { processedText, links };
}

export async function createInitialRound(
  projectId: string,
  trackId: string,
  comments: {
    text: string;
    images?: File[];
    links?: { url: string; text: string }[];
  }[]
) {
  const supabase = await createClient();

  // 1. Verify track exists and is round 1
  const { data: track, error: trackError } = await supabase
    .from("project_tracks")
    .select("id, project_id, round_number, steps")
    .eq("id", trackId)
    .eq("round_number", 1)
    .single();

  if (trackError || !track) {
    throw new Error(trackError?.message || "Initial track not found");
  }

  // 2. Upload images and prepare steps
  const steps: Step[] = [];

  for (const comment of comments) {
    let imageUrls: string[] = [];

    // Upload images if they exist
    if (comment.images && comment.images.length > 0) {
      try {
        const uploadPromises = comment.images.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());
          return await uploadImageToImgBB(buffer, file.name, file.type);
        });
        imageUrls = await Promise.all(uploadPromises);
      } catch (error) {
        console.error("Error uploading images:", error);
        throw new Error("Failed to upload one or more images");
      }
    }

    // Detect and extract links from text
    const { processedText, links } = detectAndExtractLinks(comment.text);

    steps.push({
      name: `Step ${steps.length + 1}`,
      status: "pending" as const, // Steps start as pending!
      metadata: {
        type: "comment",
        text: processedText,
        images: imageUrls,
        links: links,
        created_at: new Date().toISOString(),
        step_index: steps.length,
      },
    });
  }

  // Add final step (but marked as pending)
  steps.push({
    name: "Finish",
    is_final: true,
    status: "pending" as const,
    deliverable_link: null,
  });

  // 3. Update the track
  const { error: updateError } = await supabase
    .from("project_tracks")
    .update({
      steps: steps,
      status: "in_progress", // Not ready for review yet!
      updated_at: new Date().toISOString(),
    })
    .eq("id", trackId);

  if (updateError) {
    throw new Error(updateError.message || "Failed to create initial round");
  }

  // 4. Revalidate paths
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/dashboard/projects/${projectId}`);

  return { message: "Initial round created successfully" };
}
// Add this to app/projects/actions.ts
// Updated updateAllStepContent function with timestamp preservation
export async function updateAllStepContent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Editor not authenticated");
 
  // Extract data
  const trackId = formData.get("trackId") as string;
  const stepsStructureString = formData.get("stepsStructure") as string;
  const stepsToProcessString = formData.get("stepsToProcess") as string;
  const stepsWithNewImagesString = formData.get("stepsWithNewImages") as string;
  
  if (!trackId || !stepsStructureString) {
    throw new Error("Missing track ID or steps structure.");
  }
 
  // Parse steps data
  let stepsStructure;
  let stepsToProcess;
  let stepsWithNewImages;
  try {
    stepsStructure = JSON.parse(stepsStructureString);
    stepsToProcess = JSON.parse(stepsToProcessString);
    stepsWithNewImages = JSON.parse(stepsWithNewImagesString);
  } catch (e) {
    console.error("Failed to parse steps data", e);
    throw new Error("Invalid steps data format.");
  }
 
  // Verify track and ownership
  const { data: track, error: trackError } = await supabase
    .from("project_tracks")
    .select(
      `id, project_id, steps, client_decision, project:projects!inner(id, editor_id)`
    )
    .eq("id", trackId)
    .single();
    
  if (trackError || !track || !track.project)
    throw new Error("Track or associated project not found.");
 
  // Verify editor owns the project
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
 
  // Check client decision
  if (track.client_decision !== "pending") {
    throw new Error(
      `Client has already submitted their decision (${track.client_decision}). Cannot modify.`
    );
  }
 
  // Get current steps to preserve timestamps
  const currentSteps = track.steps as Step[];
  
  // Create a map of comment_id -> timestamp for quick lookup
  const timestampMap = new Map();
  currentSteps.forEach(step => {
    if (step.metadata?.comment_id && step.metadata?.timestamp !== undefined) {
      timestampMap.set(step.metadata.comment_id, step.metadata.timestamp);
    }
  });
 
  // Process all non-final steps for links
  for (const stepInfo of stepsToProcess) {
    const stepIndex = stepInfo.index;
    const stepData = stepsStructure[stepIndex];
    
    if (!stepData || !stepData.metadata) continue;
    
    // Process links in the text for ALL steps
    const { processedText, links } = detectAndExtractLinks(stepData.metadata.text || "");
    
    // Preserve timestamp if it exists in the current data
    const existingTimestamp = stepData.metadata.timestamp;
    const commentId = stepData.metadata.comment_id;
    const preservedTimestamp = existingTimestamp !== undefined 
      ? existingTimestamp 
      : commentId && timestampMap.has(commentId)
        ? timestampMap.get(commentId)
        : 0; // Default to 0 if no timestamp exists
    
    // Update metadata preserving timestamp
    stepData.metadata = {
      ...stepData.metadata,
      text: processedText,
      links: links,
      timestamp: preservedTimestamp
    };
  }
 
  // Process steps with new images
  for (const stepInfo of stepsWithNewImages) {
    const stepIndex = stepInfo.index;
    const stepData = stepsStructure[stepIndex];
    
    if (!stepData || !stepData.metadata) continue;
    
    // Get files for this step
    const newImageUrls = [];
    let fileIndex = 0;
    let file = formData.get(`newImage_${stepIndex}_${fileIndex}`);
    
    while (file) {
      if (file instanceof File && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        try {
          const imageUrl = await uploadImageToImgBB(buffer, file.name, file.type);
          newImageUrls.push(imageUrl);
        } catch (error) {
          console.error(`Error uploading image for step ${stepIndex}:`, error);
          throw error;
        }
      }
      fileIndex++;
      file = formData.get(`newImage_${stepIndex}_${fileIndex}`);
    }
    
    // Update the step's metadata with the new image URLs
    if (newImageUrls.length > 0) {
      const existingImages = stepData.metadata.images || [];
      stepData.metadata = {
        ...stepData.metadata,
        images: [...existingImages, ...newImageUrls]
      };
    }
  }
  
  // Now update the track with all changes at once
  try {
    const { error: updateError } = await supabase
      .from("project_tracks")
      .update({ 
        steps: stepsStructure, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", trackId);
      
    if (updateError) throw updateError;
    
    // Revalidate paths
    revalidatePath(`/dashboard/projects/${track.project_id}`);
    revalidatePath(`/review/${trackId}`);
    revalidatePath(`/projects/${track.project_id}/review/${trackId}`);
    
    return { message: "All steps updated successfully." };
  } catch (error) {
    console.error("Database update error:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred while updating steps.");
  }
 }












 