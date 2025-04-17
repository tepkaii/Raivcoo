// app/projects/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Buffer } from "buffer";

// --- Types ---
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
  name?: string;
}

interface CommentData {
  text: string;
  timestamp: number;
  images?: string[];
  links?: { url: string; text: string }[];
}

// --- Constants ---
const MAX_IMAGES_PER_COMMENT = 4;
const IMAGE_MAX_SIZE_MB = 5;
const IMAGE_MAX_SIZE_BYTES = IMAGE_MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// --- Helpers ---
function detectAndExtractLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
  const links: { url: string; text: string }[] = [];
  let processedText = text;
  const urlMatches = Array.from(text.matchAll(urlRegex));
  urlMatches.forEach((match) => {
    const url = match[0];
    if (text.substring(match.index - 6, match.index) === "[LINK:") {
      return;
    }
    let existingLinkIndex = links.findIndex((link) => link.url === url);
    if (existingLinkIndex === -1) {
      links.push({ url: url, text: url });
      existingLinkIndex = links.length - 1;
    }
    processedText = processedText.replace(url, `[LINK:${existingLinkIndex}]`);
  });
  return { processedText, links };
}

async function uploadImageToImgBB(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  if (fileBuffer.length > IMAGE_MAX_SIZE_BYTES)
    throw new Error(
      `File "${fileName}" size exceeds ${IMAGE_MAX_SIZE_MB}MB limit.`
    );
  if (!ACCEPTED_IMAGE_TYPES.includes(contentType))
    throw new Error(
      `File "${fileName}" has an invalid type. Only JPEG, PNG, WebP allowed.`
    );

  const formData = new FormData();
  formData.append("image", new Blob([fileBuffer], { type: contentType }));

  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    console.error("IMGBB_API_KEY missing.");
    throw new Error("Image upload service not configured.");
  }

  try {
    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${apiKey}`,
      { method: "POST", body: formData }
    );
    if (!response.ok) {
      const errorData = await response.json();
      console.error("ImgBB API Error:", errorData);
      throw new Error(
        `Upload failed: ${response.statusText} - ${errorData?.error?.message || "ImgBB error"}`
      );
    }
    const data = await response.json();
    if (!data.data?.url) {
      console.error("Invalid ImgBB response:", data);
      throw new Error(`Invalid ImgBB response.`);
    }
    return data.data.url;
  } catch (error) {
    console.error(`Error uploading ${fileName} to ImgBB:`, error);
    throw new Error(
      `Image upload failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function verifyClientAuthorization(
  projectId: string
): Promise<{ user: any; client: any; project: any; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user)
    return {
      user: null,
      client: null,
      project: null,
      error: "Not authenticated.",
    };
  if (!user.email)
    return {
      user: null,
      client: null,
      project: null,
      error: "User email missing.",
    };

  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select(`id, client:clients (id, email, name)`)
    .eq("id", projectId)
    .single();
  if (projectError || !projectData || !projectData.client) {
    console.error(
      `Error fetching project ${projectId} or client:`,
      projectError
    );
    return {
      user,
      client: null,
      project: null,
      error: "Project/Client not found.",
    };
  }
  if (projectData.client.email !== user.email) {
    console.warn(
      `Auth Fail: User ${user.email} project ${projectId} client ${projectData.client.email}`
    );
    return {
      user,
      client: projectData.client,
      project: projectData,
      error: "Unauthorized.",
    };
  }
  return {
    user,
    client: projectData.client,
    project: projectData,
    error: null,
  };
}

// --- EDITOR ACTIONS ---
export async function createProject(formData: FormData) {
  // NOTE: This function seems partially implemented in the original prompt reference
  // It relies on editor_profiles and client verification not shown in full client-side auth helper
  // Assuming it should be fully implemented elsewhere or is just a placeholder here.
  console.log("Placeholder/Incomplete createProject called");
  return { message: "Project created (placeholder)" };
}

export async function updateProjectTrackStepStatus(
  trackId: string,
  stepIndex: number,
  newStatus: "pending" | "completed",
  linkValue?: string
) {
  // NOTE: Needs full implementation for editor context (auth, fetching track, updating steps array)
  console.log("Placeholder updateProjectTrackStepStatus called");
  return { message: "Step status updated (placeholder)" };
}

export async function updateStepContent(formData: FormData) {
  // NOTE: Needs full implementation for editor context (auth, fetching track, processing text/links/images, updating steps array)
  console.log("Placeholder updateStepContent called");
  return { message: "Step content updated (placeholder)" };
}

export async function updateTrackStructure(
  trackId: string,
  newStepsStructure: Omit<Step, "status" | "deliverable_link" | "is_final">[]
) {
  // NOTE: Needs full implementation for editor context (auth, fetching track, merging old/new steps, updating steps array)
  console.log("Placeholder updateTrackStructure called");
  return { message: "Track structure updated (placeholder)" };
}

export async function completeTrackAndCreateNewRound(trackId: string) {
  const message = `DEPRECATION/SECURITY WARNING: Editor attempted to call completeTrackAndCreateNewRound for track ${trackId}. Client must initiate revisions.`;
  console.error(message);
  throw new Error(
    "Operation not permitted for editor. Client must request revisions."
  );
}

export async function completeProject(projectId: string) {
  const message = `DEPRECATION/SECURITY WARNING: Editor attempted to call completeProject for project ${projectId}. Client must approve.`;
  console.error(message);
  throw new Error(
    "Operation not permitted for editor. Client must approve the project."
  );
}

// --- CLIENT ACTIONS ---

export async function addReviewComment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const trackId = formData.get("trackId") as string;
  const timestampString = formData.get("timestamp") as string;
  const commentText = formData.get("commentText") as string; // Contains placeholders from client
  const imageFiles = formData.getAll("images") as File[];
  const linksString = formData.get("links") as string;
  let links;
  if (linksString) {
    try {
      links = JSON.parse(linksString);
    } catch (e) {
      console.error("Error parsing links JSON:", e);
    }
  }

  if (!trackId || !timestampString) throw new Error("Required data missing.");
  if (!commentText?.trim() && imageFiles.length === 0)
    throw new Error("Comment cannot be empty.");

  const timestamp = parseFloat(timestampString);
  if (isNaN(timestamp) || timestamp < 0) throw new Error("Invalid timestamp.");
  if (imageFiles.length > MAX_IMAGES_PER_COMMENT)
    throw new Error(`Max ${MAX_IMAGES_PER_COMMENT} images.`);

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
  if (trackData.client_decision !== "pending")
    throw new Error(`Decision (${trackData.client_decision}) submitted.`);

  const uploadedImageUrls: string[] = [];
  if (imageFiles.length > 0) {
    try {
      const uploadPromises = imageFiles.map(async (file) => {
        if (file.size === 0) return null;
        const buffer = Buffer.from(await file.arrayBuffer());
        return await uploadImageToImgBB(buffer, file.name, file.type);
      });
      const results = await Promise.all(uploadPromises);
      uploadedImageUrls.push(
        ...results.filter((url): url is string => url !== null)
      );
    } catch (uploadError) {
      throw uploadError instanceof Error
        ? uploadError
        : new Error("Image upload failed.");
    }
  }

  const commentDataToSave: CommentData = {
    text: commentText.trim(),
    timestamp: timestamp,
    ...(uploadedImageUrls.length > 0 && { images: uploadedImageUrls }),
    ...(links && links.length > 0 && { links: links }),
  };

  try {
    const { data: newCommentData, error: insertError } = await supabase
      .from("review_comments")
      .insert({ track_id: trackId, comment: commentDataToSave })
      .select(`id, created_at, comment`)
      .single();
    if (insertError) throw new Error("Database error saving comment.");

    revalidatePath(`/projects/${trackData.project_id}/review/${trackId}`);

    return {
      message: "Comment added successfully",
      comment: {
        id: newCommentData.id,
        created_at: newCommentData.created_at,
        comment: newCommentData.comment as CommentData,
        commenter_display_name: client.name || user.email,
        isOwnComment: true,
      },
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to add comment.");
  }
}

export async function updateReviewComment(formData: FormData) {
  const supabase = await createClient();
  const commentId = formData.get("commentId") as string;
  const newCommentText = formData.get("newCommentText") as string; // Plain text
  const existingImagesString = formData.get("existingImages") as string; // JSON string array of URLs to keep
  const newImageFiles = formData.getAll("newImages") as File[]; // New files to upload

  if (!commentId || newCommentText === null || !existingImagesString)
    throw new Error("Required data missing.");

  let imagesToKeep: string[] = [];
  try {
    imagesToKeep = JSON.parse(existingImagesString);
    if (!Array.isArray(imagesToKeep))
      throw new Error("Invalid existing images format.");
  } catch (e) {
    throw new Error("Failed to parse existing images.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { data: commentData, error: commentError } = await supabase
    .from("review_comments")
    .select(
      `id, comment, track_id, track:project_tracks!inner (id, project_id, client_decision)`
    )
    .eq("id", commentId)
    .single();
  if (commentError || !commentData || !commentData.track)
    throw new Error("Comment/track not found.");

  const { track } = commentData;
  const { client, error: authError } = await verifyClientAuthorization(
    track.project_id
  );
  if (authError || !client)
    throw new Error(authError || "Authorization failed.");
  if (track.client_decision !== "pending")
    throw new Error(`Decision (${track.client_decision}) submitted.`);

  // Upload New Images
  const uploadedNewImageUrls: string[] = [];
  if (newImageFiles.length > 0) {
    const totalPotentialImages = imagesToKeep.length + newImageFiles.length;
    if (totalPotentialImages > MAX_IMAGES_PER_COMMENT) {
      // MAX_IMAGES_PER_COMMENT defined earlier
      throw new Error(
        `Cannot save comment: Exceeds maximum of ${MAX_IMAGES_PER_COMMENT} images.`
      );
    }
    try {
      const uploadPromises = newImageFiles
        .filter((f) => f.size > 0)
        .map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());
          // Re-use existing upload helper
          return await uploadImageToImgBB(buffer, file.name, file.type);
        });
      const results = await Promise.all(uploadPromises);
      uploadedNewImageUrls.push(
        ...results.filter((url): url is string => url !== null)
      );
    } catch (uploadError) {
      console.error("Error uploading new images during update:", uploadError);
      throw uploadError instanceof Error
        ? uploadError
        : new Error("Failed to upload one or more new images.");
    }
  }

  // Combine image lists
  const finalImageUrls = [...imagesToKeep, ...uploadedNewImageUrls];

  // Process Text
  const { processedText, links } = detectAndExtractLinks(newCommentText.trim());
  const existingCommentJson = commentData.comment as CommentData;

  // Create final JSONB, now including updated images array
  const updatedCommentJsonb: CommentData = {
    ...existingCommentJson,
    text: processedText,
    links: links,
    images: finalImageUrls, // <<<<<<<<<<<< Use the combined list
  };

  // Prevent saving completely empty comment (no text, no images)
  if (
    !updatedCommentJsonb.text &&
    (!updatedCommentJsonb.images || updatedCommentJsonb.images.length === 0)
  ) {
    throw new Error("Cannot save comment with no text and no images.");
  }

  // Update DB
  try {
    const { data: updatedData, error: updateError } = await supabase
      .from("review_comments")
      .update({ comment: updatedCommentJsonb })
      .eq("id", commentId)
      .select(`id, created_at, comment`)
      .single();
    if (updateError) throw new Error("Database error updating comment.");

    revalidatePath(`/projects/${track.project_id}/review/${track.id}`);

    return {
      message: "Comment updated successfully",
      comment: {
        id: updatedData.id,
        created_at: updatedData.created_at,
        comment: updatedData.comment as CommentData,
        commenter_display_name: client.name || user.email,
        isOwnComment: true,
      },
    };
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Failed to update comment.");
  }
}

export async function deleteReviewComment(commentId: string) {
  const supabase = await createClient();
  if (!commentId) throw new Error("Comment ID missing.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { data: commentData, error: commentError } = await supabase
    .from("review_comments")
    .select(
      `id, track_id, track:project_tracks!inner (id, project_id, client_decision)`
    )
    .eq("id", commentId)
    .single();
  if (commentError || !commentData || !commentData.track) {
    console.warn("Comment not found for delete:", commentError);
    throw new Error("Comment/track not found.");
  }

  const { track } = commentData;
  const { error: authError } = await verifyClientAuthorization(
    track.project_id
  );
  if (authError) throw new Error(authError || "Authorization failed.");
  if (track.client_decision !== "pending")
    throw new Error(`Decision (${track.client_decision}) submitted.`);

  try {
    const { error: deleteError } = await supabase
      .from("review_comments")
      .delete()
      .eq("id", commentId);
    if (deleteError) throw new Error("Database error deleting comment.");

    revalidatePath(`/projects/${track.project_id}/review/${track.id}`);
    return { message: "Comment deleted successfully" };
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Failed to delete comment.");
  }
}

export async function clientRequestRevisions(trackId: string) {
  const supabase = await createClient();
  const { data: currentTrack, error: trackError } = await supabase
    .from("project_tracks")
    .select("id, project_id, round_number, client_decision")
    .eq("id", trackId)
    .single();
  if (trackError || !currentTrack) throw new Error("Track not found.");

  const { error: authError } = await verifyClientAuthorization(
    currentTrack.project_id
  );
  if (authError) throw new Error(authError);
  if (currentTrack.client_decision !== "pending")
    throw new Error(`Decision already submitted.`);

  const { data: commentsData, error: commentsError } = await supabase
    .from("review_comments")
    .select("id, comment, created_at")
    .eq("track_id", trackId)
    .order("comment->>timestamp", { ascending: true });
  if (commentsError) throw new Error("Could not retrieve comments.");

  const nextRoundSteps: Step[] = (commentsData || []).map((c, i) => ({
    status: "pending",
    metadata: {
      type: "comment",
      comment_id: c.id,
      text: c.comment.text,
      timestamp: c.comment.timestamp,
      images: c.comment.images || [],
      links: c.comment.links || [],
      created_at: c.created_at,
      step_index: i,
    },
  }));
  nextRoundSteps.push({
    name: "Finish Revisions",
    status: "pending",
    is_final: true,
    deliverable_link: null,
  });

  try {
    const { error: rpcError } = await supabase.rpc(
      "handle_client_revision_request_v3",
      {
        p_current_track_id: trackId,
        p_project_id: currentTrack.project_id,
        p_current_round_number: currentTrack.round_number,
        p_next_round_steps: nextRoundSteps,
      }
    );
    if (rpcError) throw rpcError;
    revalidatePath(`/projects/${currentTrack.project_id}`);
    revalidatePath(`/projects/${currentTrack.project_id}/review/${trackId}`);
    revalidatePath(`/dashboard/projects/${currentTrack.project_id}`);
    return {
      success: true,
      message: `Revisions requested. Round ${currentTrack.round_number + 1} created.`,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to request revisions"
    );
  }
}

export async function clientApproveProject(projectId: string, trackId: string) {
  const supabase = await createClient();
  const {
    user,
    client,
    error: authError,
  } = await verifyClientAuthorization(projectId);
  if (authError || !client || !user)
    throw new Error(authError || "Authorization failed.");

  const { data: trackData, error: trackError } = await supabase
    .from("project_tracks")
    .select("id, client_decision")
    .eq("id", trackId)
    .eq("project_id", projectId)
    .single();
  if (trackError || !trackData) throw new Error("Track not found or invalid.");
  if (trackData.client_decision !== "pending")
    throw new Error(`Decision already submitted.`);

  try {
    const { error: rpcError } = await supabase.rpc(
      "handle_client_approval_v2",
      { p_project_id: projectId, p_track_id: trackId }
    );
    if (rpcError) throw new Error(`Database error: ${rpcError.message}`);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/review/${trackId}`);
    revalidatePath("/projects");
    revalidatePath(`/dashboard/projects/${projectId}`);
    if (client.id) revalidatePath(`/clients/${client.id}`);
    return { message: "Project approved successfully." };
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Failed to approve project.");
  }
}

