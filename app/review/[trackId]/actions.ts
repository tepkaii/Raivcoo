// app/projects/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Buffer } from "buffer"; // Needed for Buffer.from

// --- Helper Types ---
interface Step {
  status: "pending" | "completed";
  is_final?: boolean;
  deliverable_link?: string | null;
  metadata?: {
    type: "manual_step" | "comment" | "general_revision";
    text?: string;
    timestamp?: number;
    images?: string[];
    links?: { url: string; text: string }[];
    created_at?: string;
    step_index?: number;
    comment_id?: string;
  };
  name?: string; // Only for manual steps
}

// Define the structure for the JSONB comment data
interface CommentData {
  text: string;
  timestamp: number;
  images?: string[];
  links?: { url: string; text: string }[];
}

// --- Constants for Image Upload ---
const MAX_IMAGES_PER_COMMENT = 4;
const IMAGE_MAX_SIZE_MB = 5; // 5MB limit for each image
const IMAGE_MAX_SIZE_BYTES = IMAGE_MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// --- Image Upload Helper (using ImgBB) ---
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
  formData.append("name", fileName);

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
    return data.data.url;
  } catch (error) {
    console.error(`Error uploading ${fileName} to ImgBB:`, error);
    // Re-throw a more specific error
    throw new Error(
      `Failed to upload image "${fileName}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// --- Authorization Helper (Keep as is) ---
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

// --- EDITOR ACTIONS (Keep stubs as is) ---
export async function createProject(formData: FormData) {
  console.log("Placeholder for createProject");
  return { message: "Project created " };
}
export async function updateProjectTrack(
  trackId: string,
  stepIndex: number,
  newStatus: "pending" | "completed",
  linkValue?: string
) {
  console.log("Placeholder for updateProjectTrack");
  return { message: "Track updated " };
}
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

// --- CLIENT ACTIONS (Revised Implementations) ---

export async function addReviewComment(formData: FormData) {
  const supabase = await createClient();

  // 1. Get User (Still needed for auth check)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // 2. Extract data from FormData
  const trackId = formData.get("trackId") as string;
  const timestampString = formData.get("timestamp") as string;
  const commentText = formData.get("commentText") as string;
  const imageFiles = formData.getAll("images") as File[]; // Get all files attached
  const linksString = formData.get("links") as string;
  let links;
  if (linksString) {
    try {
      links = JSON.parse(linksString);
    } catch (e) {
      console.error("Error parsing links JSON:", e);
    }
  }
  if (!trackId) throw new Error("Track ID is missing.");
  if (!timestampString) throw new Error("Timestamp is missing.");
  if (!commentText?.trim() && imageFiles.length === 0) {
    throw new Error("Comment cannot be empty without images.");
  }

  const timestamp = parseFloat(timestampString);
  if (isNaN(timestamp) || timestamp < 0) {
    throw new Error("Invalid timestamp value.");
  }

  // Limit number of images
  if (imageFiles.length > MAX_IMAGES_PER_COMMENT) {
    throw new Error(
      `You can upload a maximum of ${MAX_IMAGES_PER_COMMENT} images per comment.`
    );
  }

  // 3. Get Track and Project ID, then Verify Authorization
  const { data: trackData, error: trackError } = await supabase
    .from("project_tracks")
    .select("id, project_id, client_decision")
    .eq("id", trackId)
    .single();

  if (trackError || !trackData) throw new Error("Track not found.");

  const { client, error: authError } = await verifyClientAuthorization(
    trackData.project_id
  );
  if (authError || !client)
    throw new Error(authError || "Authorization failed.");

  // 4. Prevent adding comments if decision already made
  if (trackData.client_decision !== "pending") {
    throw new Error(
      `Cannot add comment: Decision (${trackData.client_decision}) already submitted.`
    );
  }

  // 5. Upload Images (if any)
  const uploadedImageUrls: string[] = [];
  if (imageFiles.length > 0) {
    console.log(`Attempting to upload ${imageFiles.length} images...`);
    try {
      const uploadPromises = imageFiles.map(async (file) => {
        if (file.size === 0) {
          // Skip empty file objects if they appear
          console.warn(`Skipping empty file input: ${file.name}`);
          return null;
        }
        // Convert File to Buffer
        const buffer = Buffer.from(await file.arrayBuffer());
        // Call the upload helper
        return await uploadImageToImgBB(buffer, file.name, file.type);
      });

      const results = await Promise.all(uploadPromises);
      // Filter out null results (skipped files) and add valid URLs
      uploadedImageUrls.push(
        ...results.filter((url): url is string => url !== null)
      );
      console.log(`Successfully uploaded ${uploadedImageUrls.length} images.`);
    } catch (uploadError) {
      console.error("Error during image upload batch:", uploadError);
      // Throw the specific error from uploadImageToImgBB or a general one
      throw uploadError instanceof Error
        ? uploadError
        : new Error("Failed to upload one or more images.");
    }
  }

  // 6. Prepare JSONB Comment Data
  const commentData: CommentData = {
    text: commentText.trim(),
    timestamp: timestamp,
    ...(uploadedImageUrls.length > 0 && { images: uploadedImageUrls }), // Conditionally add images array
    ...(links && { links: links }), // Add links array if it exists
  };

  // 7. Insert Comment into Supabase
  try {
    const { data: newCommentData, error: insertError } = await supabase
      .from("review_comments")
      .insert({
        track_id: trackId,
        comment: commentData, // Insert the JSONB object
        // timestamp column is removed
      })
      .select(`id, created_at, comment`) // Select needed fields, including the inserted comment JSONB
      .single();

    if (insertError) {
      console.error("Supabase error creating comment:", insertError);
      throw new Error("Database error: Could not save comment.");
    }

    // 8. Revalidate the review page path
    revalidatePath(`/projects/${trackData.project_id}/review/${trackId}`);
    // Potentially revalidate the main project page too if needed
    // revalidatePath(`/projects/${trackData.project_id}`);

    // Return the structured comment data as inserted
    return {
      message: "Comment added successfully",
      comment: {
        // Reconstruct the full comment object for the client
        id: newCommentData.id,
        created_at: newCommentData.created_at,
        comment: newCommentData.comment as CommentData, // Cast to CommentData type
        commenter_display_name: client.name || user.email, // Assuming client has 'name' property
        isOwnComment: true, // Mark as own comment for immediate display
      },
    };
  } catch (error) {
    console.error("Error in addReviewComment action:", error);
    // Ensure error is propagated correctly
    throw error instanceof Error ? error : new Error("Failed to add comment.");
  }
}

// app/projects/actions.ts (updated clientRequestRevisions)
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
  const { error: authError } = await verifyClientAuthorization(
    currentTrack.project_id
  );
  if (authError) throw new Error(authError);

  // 3. Check if decision is pending
  if (currentTrack.client_decision !== "pending") {
    throw new Error(`Action not allowed: Decision already submitted.`);
  }

  // 4. Fetch comments
  const { data: commentsData, error: commentsError } = await supabase
    .from("review_comments")
    .select("id, comment, created_at")
    .eq("track_id", trackId)
    .order("comment->>timestamp", { ascending: true });

  if (commentsError) throw new Error("Could not retrieve feedback comments.");

  // 5. Prepare steps from comments
  const nextRoundSteps = (commentsData || []).map((comment, index) => ({
    status: "pending" as const,
    metadata: {
      type: "comment",
      comment_id: comment.id,
      text: comment.comment.text,
      ...comment.comment,
      created_at: comment.created_at,
      step_index: index,
    },
  }));

  // Add final step
  nextRoundSteps.push({
    status: "pending" as const,
    is_final: true,
    deliverable_link: null,
  });

  // 6. Execute revision request
  try {
    const { data, error: rpcError } = await supabase.rpc(
      "handle_client_revision_request_v3",
      {
        p_current_track_id: trackId,
        p_project_id: currentTrack.project_id,
        p_current_round_number: currentTrack.round_number,
        p_next_round_steps: nextRoundSteps,
      }
    );

    if (rpcError) throw rpcError;

    // 7. Revalidate paths
    revalidatePath(`/projects/${currentTrack.project_id}`);
    revalidatePath(`/projects/${currentTrack.project_id}/review/${trackId}`);

    return {
      success: true,
      message: `Revisions requested. Round ${currentTrack.round_number + 1} created.`,
    };
  } catch (error) {
    console.error("Error in clientRequestRevisions:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to request revisions"
    );
  }
}

// --- Client Approves the Final Project (Keep as is) ---
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

  // 2. Get current track's decision status
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
    const { error: rpcError } = await supabase.rpc(
      "handle_client_approval_v2", // Ensure this RPC function exists
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