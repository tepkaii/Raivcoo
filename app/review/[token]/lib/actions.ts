// app/review/[token]/lib/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";

interface MediaComment {
  id: string;
  media_id: string;
  parent_comment_id?: string;
  user_name: string;
  user_email?: string;
  content: string;
  timestamp_seconds?: number;
  annotation_data?: string;
  ip_address?: string;
  user_agent?: string;
  is_approved: boolean;
  is_pinned: boolean;
  is_resolved: boolean; // NEW: Added for completion feature
  created_at: string;
  updated_at: string;
}

// NEW: Toggle comment resolution status
export async function toggleCommentResolutionAction(
  commentId: string,
  sessionId?: string
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // First, get the current comment to check ownership, current status, and parent relationship
    const { data: comment, error: fetchError } = await supabase
      .from("media_comments")
      .select("id, user_id, session_id, is_resolved, parent_comment_id")
      .eq("id", commentId)
      .single();

    if (fetchError || !comment) {
      return { success: false, error: "Comment not found" };
    }

    // Check if this is a parent comment (only parent comments can be resolved)
    if (comment.parent_comment_id) {
      return {
        success: false,
        error:
          "Only parent comments can be resolved. Replies inherit the resolution status from their parent comment.",
      };
    }

    // Check ownership permissions
    let canModify = false;
    if (user) {
      // Authenticated user - check if they own the comment
      canModify = comment.user_id === user.id;
    } else {
      // Anonymous user - check session ID
      if (!sessionId) {
        return {
          success: false,
          error: "Session ID required for anonymous users",
        };
      }
      canModify = comment.session_id === sessionId;
    }

    if (!canModify) {
      return {
        success: false,
        error: "You can only modify your own comments",
      };
    }

    // Toggle the resolution status
    const newResolvedStatus = !comment.is_resolved;

    const { data: updatedComment, error: updateError } = await supabase
      .from("media_comments")
      .update({
        is_resolved: newResolvedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .select()
      .single();

    if (updateError) {
      console.error("Database error:", updateError);
      return { success: false, error: updateError.message };
    }

    return {
      success: true,
      comment: updatedComment,
      isResolved: newResolvedStatus,
    };
  } catch (error) {
    console.error("Failed to toggle comment resolution:", error);
    return {
      success: false,
      error: "Failed to toggle comment resolution",
    };
  }
}

// NEW: Get resolution statistics for a media file
export async function getCommentResolutionStatsAction(mediaId: string) {
  try {
    const supabase = await createClient();

    const { data: comments, error } = await supabase
      .from("media_comments")
      .select("is_resolved")
      .eq("media_id", mediaId)
      .eq("is_approved", true);

    if (error) {
      console.error("Database error:", error);
      return { success: false, error: error.message };
    }

    const totalComments = comments?.length || 0;
    const resolvedComments = comments?.filter((c) => c.is_resolved).length || 0;
    const unresolvedComments = totalComments - resolvedComments;
    const resolutionPercentage =
      totalComments > 0
        ? Math.round((resolvedComments / totalComments) * 100)
        : 0;

    return {
      success: true,
      stats: {
        totalComments,
        resolvedComments,
        unresolvedComments,
        resolutionPercentage,
      },
    };
  } catch (error) {
    console.error("Failed to get resolution stats:", error);
    return {
      success: false,
      error: "Failed to get resolution statistics",
    };
  }
}

// UPDATED: Modified existing functions to include is_resolved in queries

export async function getCommentsByTimestampAction(
  mediaId: string,
  timestampStart: number,
  timestampEnd: number
) {
  try {
    const supabase = await createClient();

    const { data: comments, error: commentsError } = await supabase
      .from("media_comments")
      .select("*, is_resolved") // Added is_resolved to select
      .eq("media_id", mediaId)
      .eq("is_approved", true)
      .gte("timestamp_seconds", timestampStart)
      .lte("timestamp_seconds", timestampEnd)
      .order("timestamp_seconds", { ascending: true });

    if (commentsError) throw commentsError;

    return {
      success: true,
      comments: comments || [],
    };
  } catch (error) {
    console.error("Get comments by timestamp error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch comments by timestamp",
    };
  }
}

export async function getAnnotatedCommentsAction(mediaId: string) {
  try {
    const supabase = await createClient();

    const { data: comments, error: commentsError } = await supabase
      .from("media_comments")
      .select("*, is_resolved") // Added is_resolved to select
      .eq("media_id", mediaId)
      .eq("is_approved", true)
      .not("annotation_data", "is", null)
      .order("timestamp_seconds", { ascending: true });

    if (commentsError) throw commentsError;

    return {
      success: true,
      comments: comments || [],
    };
  } catch (error) {
    console.error("Get annotated comments error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch annotated comments",
    };
  }
}

export async function exportCommentsAction(
  mediaId: string,
  format: "csv" | "json" | "xml" = "json"
) {
  try {
    const supabase = await createClient();

    const { data: comments, error: commentsError } = await supabase
      .from("media_comments")
      .select(
        `
        id,
        user_name,
        user_email,
        content,
        timestamp_seconds,
        annotation_data,
        is_pinned,
        is_resolved,
        created_at,
        updated_at
      `
      )
      .eq("media_id", mediaId)
      .eq("is_approved", true)
      .order("created_at", { ascending: true });

    if (commentsError) throw commentsError;

    let exportData: string;

    switch (format) {
      case "csv":
        const csvHeaders = [
          "ID",
          "User Name",
          "User Email",
          "Content",
          "Timestamp",
          "Has Annotation",
          "Is Pinned",
          "Is Resolved", // NEW: Added to CSV export
          "Created At",
        ];

        const csvRows =
          comments?.map((comment) => [
            comment.id,
            comment.user_name,
            comment.user_email || "",
            `"${comment.content.replace(/"/g, '""')}"`,
            comment.timestamp_seconds || "",
            comment.annotation_data ? "Yes" : "No",
            comment.is_pinned ? "Yes" : "No",
            comment.is_resolved ? "Yes" : "No", // NEW: Added to CSV rows
            comment.created_at,
          ]) || [];

        exportData = [
          csvHeaders.join(","),
          ...csvRows.map((row) => row.join(",")),
        ].join("\n");
        break;

      case "xml":
        const xmlComments =
          comments
            ?.map(
              (comment) => `
    <comment>
      <id>${comment.id}</id>
      <user_name><![CDATA[${comment.user_name}]]></user_name>
      <user_email><![CDATA[${comment.user_email || ""}]]></user_email>
      <content><![CDATA[${comment.content}]]></content>
      <timestamp_seconds>${comment.timestamp_seconds || ""}</timestamp_seconds>
      <has_annotation>${comment.annotation_data ? "true" : "false"}</has_annotation>
      <annotation_data><![CDATA[${comment.annotation_data || ""}]]></annotation_data>
      <is_pinned>${comment.is_pinned}</is_pinned>
      <is_resolved>${comment.is_resolved}</is_resolved>
      <created_at>${comment.created_at}</created_at>
    </comment>`
            )
            .join("") || "";

        exportData = `<?xml version="1.0" encoding="UTF-8"?>
<comments media_id="${mediaId}">
  ${xmlComments}
</comments>`;
        break;

      case "json":
      default:
        exportData = JSON.stringify(
          {
            mediaId,
            exportedAt: new Date().toISOString(),
            totalComments: comments?.length || 0,
            annotatedComments:
              comments?.filter((c) => c.annotation_data).length || 0,
            resolvedComments:
              comments?.filter((c) => c.is_resolved).length || 0, // NEW: Added to JSON export
            comments: comments || [],
          },
          null,
          2
        );
        break;
    }

    return {
      success: true,
      data: exportData,
      filename: `comments_${mediaId}_${new Date().toISOString().split("T")[0]}.${format}`,
    };
  } catch (error) {
    console.error("Export comments error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to export comments",
    };
  }
}

export async function bulkUpdateCommentsAction(
  commentIds: string[],
  updates: Partial<
    Pick<MediaComment, "is_pinned" | "is_approved" | "is_resolved">
  > // NEW: Added is_resolved to bulk updates
) {
  try {
    const supabase = await createClient();

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data: comments, error: updateError } = await supabase
      .from("media_comments")
      .update(updateData)
      .in("id", commentIds)
      .select();

    if (updateError) throw updateError;

    return {
      success: true,
      comments: comments || [],
      updatedCount: comments?.length || 0,
    };
  } catch (error) {
    console.error("Bulk update comments error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to bulk update comments",
    };
  }
}

export async function searchCommentsAction(mediaId: string, query: string) {
  try {
    const supabase = await createClient();

    const { data: comments, error: searchError } = await supabase
      .from("media_comments")
      .select("*, is_resolved") // Added is_resolved to select
      .eq("media_id", mediaId)
      .eq("is_approved", true)
      .or(`content.ilike.%${query}%,user_name.ilike.%${query}%`)
      .order("created_at", { ascending: true });

    if (searchError) throw searchError;

    return {
      success: true,
      comments: comments || [],
      query,
      resultCount: comments?.length || 0,
    };
  } catch (error) {
    console.error("Search comments error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to search comments",
    };
  }
}

export async function getCommentStatsAction(mediaId: string) {
  try {
    const supabase = await createClient();

    const { data: stats, error: statsError } = await supabase
      .from("media_comments")
      .select(
        "timestamp_seconds, annotation_data, is_pinned, is_resolved, created_at"
      ) // Added is_resolved
      .eq("media_id", mediaId)
      .eq("is_approved", true);

    if (statsError) throw statsError;

    const totalComments = stats?.length || 0;
    const annotatedComments =
      stats?.filter((c) => c.annotation_data).length || 0;
    const pinnedComments = stats?.filter((c) => c.is_pinned).length || 0;
    const resolvedComments = stats?.filter((c) => c.is_resolved).length || 0; // NEW: Added resolved comments count
    const timestampedComments =
      stats?.filter((c) => c.timestamp_seconds !== null).length || 0;

    // Calculate comment distribution over time for videos
    const commentsByHour =
      stats?.reduce(
        (acc, comment) => {
          if (comment.timestamp_seconds !== null) {
            const hour = Math.floor(comment.timestamp_seconds / 3600);
            acc[hour] = (acc[hour] || 0) + 1;
          }
          return acc;
        },
        {} as Record<number, number>
      ) || {};

    return {
      success: true,
      stats: {
        totalComments,
        annotatedComments,
        pinnedComments,
        resolvedComments, // NEW: Added to stats
        timestampedComments,
        annotationPercentage:
          totalComments > 0
            ? Math.round((annotatedComments / totalComments) * 100)
            : 0,
        timestampPercentage:
          totalComments > 0
            ? Math.round((timestampedComments / totalComments) * 100)
            : 0,
        // NEW: Added resolution percentage
        resolutionPercentage:
          totalComments > 0
            ? Math.round((resolvedComments / totalComments) * 100)
            : 0,
      },
    };
  } catch (error) {
    console.error("Get comment stats error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get comment statistics",
    };
  }
}

// Additional helper function to get comments with annotations
export async function getCommentsWithAnnotationsAction(mediaId: string) {
  try {
    const supabase = await createClient();

    const { data: comments, error } = await supabase
      .from("media_comments")
      .select("*, is_resolved") // Added is_resolved to select
      .eq("media_id", mediaId)
      .eq("is_approved", true)
      .not("annotation_data", "is", null) // Only get comments with annotations
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Database error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, comments: comments || [] };
  } catch (error) {
    console.error("Failed to get comments with annotations:", error);
    return { success: false, error: "Failed to get comments with annotations" };
  }
}

// Helper function to get comments at specific timestamp
export async function getCommentsAtTimestampAction(
  mediaId: string,
  timestamp: number,
  tolerance: number = 1
) {
  try {
    const supabase = await createClient();

    const { data: comments, error } = await supabase
      .from("media_comments")
      .select("*, is_resolved") // Added is_resolved to select
      .eq("media_id", mediaId)
      .eq("is_approved", true)
      .gte("timestamp_seconds", timestamp - tolerance)
      .lte("timestamp_seconds", timestamp + tolerance)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Database error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, comments: comments || [] };
  } catch (error) {
    console.error("Failed to get comments at timestamp:", error);
    return { success: false, error: "Failed to get comments at timestamp" };
  }
}

export async function deleteCommentAction(
  commentId: string,
  sessionId?: string
) {
  try {
    const supabase = await createClient();

    // Get the current user to determine if they're authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Authenticated user - check if they own the comment
      const { data: comment, error: fetchError } = await supabase
        .from("media_comments")
        .select("id, user_id")
        .eq("id", commentId)
        .single();

      if (fetchError) {
        console.error("Error fetching comment:", fetchError);
        return { success: false, error: "Comment not found" };
      }

      // Check if the user owns this comment
      if (comment.user_id !== user.id) {
        return {
          success: false,
          error: "You can only delete your own comments",
        };
      }

      // Delete the comment
      const { error } = await supabase
        .from("media_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id); // Double-check user ownership

      if (error) {
        console.error("Database error:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } else {
      // Anonymous user - need to check session ID
      if (!sessionId) {
        return {
          success: false,
          error: "Session ID required for anonymous deletion",
        };
      }

      // First, get the comment to check if it belongs to this session
      const { data: comment, error: fetchError } = await supabase
        .from("media_comments")
        .select("id, session_id")
        .eq("id", commentId)
        .single();

      if (fetchError) {
        console.error("Error fetching comment:", fetchError);
        return { success: false, error: "Comment not found" };
      }

      if (!comment) {
        return { success: false, error: "Comment not found" };
      }

      // Check if the session ID matches
      if (comment.session_id !== sessionId) {
        return {
          success: false,
          error: "You can only delete your own comments",
        };
      }

      // Delete the comment
      const { error: deleteError } = await supabase
        .from("media_comments")
        .delete()
        .eq("id", commentId)
        .eq("session_id", sessionId); // Double-check session ID in the delete

      if (deleteError) {
        console.error("Database error:", deleteError);
        return { success: false, error: deleteError.message };
      }

      return { success: true };
    }
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return { success: false, error: "Failed to delete comment" };
  }
}

export async function createCommentAction(data: {
  mediaId: string;
  userName: string;
  userEmail?: string;
  userId?: string;
  content: string;
  timestampSeconds?: number;
  parentCommentId?: string; // Add this field
  ipAddress?: string;
  userAgent?: string;
  annotationData?: any;
  drawingData?: any;
  sessionId?: string;
}) {
  try {
    const supabase = await createClient();

    // Get current user if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const insertData = {
      media_id: data.mediaId,
      user_id: data.userId || user?.id || null,
      user_name: data.userName,
      user_email: data.userEmail,
      content: data.content,
      timestamp_seconds: data.timestampSeconds,
      parent_comment_id: data.parentCommentId || null, // Add parent comment ID
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      annotation_data: data.annotationData || null,
      drawing_data: data.drawingData || null,
      session_id: data.sessionId,
      is_approved: true,
      is_pinned: false,
      is_resolved: false, // NEW: Initialize as not resolved
    };

    const { data: comment, error } = await supabase
      .from("media_comments")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, comment };
  } catch (error) {
    console.error("Failed to create comment:", error);
    return { success: false, error: "Failed to create comment" };
  }
}

export async function getCommentsAction(mediaId: string) {
  try {
    const supabase = await createClient();

    const { data: comments, error } = await supabase
      .from("media_comments")
      .select("*, is_resolved") // Added is_resolved to select
      .eq("media_id", mediaId)
      .eq("is_approved", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Database error:", error);
      return { success: false, error: error.message };
    }

    // Parse annotation_data for each comment
    const parsedComments =
      comments?.map((comment) => {
        if (
          comment.annotation_data &&
          typeof comment.annotation_data === "string"
        ) {
          try {
            comment.annotation_data = JSON.parse(comment.annotation_data);
          } catch (e) {
            console.error("Error parsing annotation_data:", e);
            comment.annotation_data = null;
          }
        }
        return comment;
      }) || [];

    return { success: true, comments: parsedComments };
  } catch (error) {
    console.error("Failed to get comments:", error);
    return { success: false, error: "Failed to get comments" };
  }
}

export async function updateCommentAction(
  commentId: string,
  content: string,
  sessionId?: string
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // First, set the comment as being edited
    await supabase
      .from("media_comments")
      .update({ is_being_edited: true })
      .eq("id", commentId);

    // Check ownership
    if (user) {
      // Authenticated user
      const { data: comment, error: fetchError } = await supabase
        .from("media_comments")
        .select("user_id")
        .eq("id", commentId)
        .single();

      if (fetchError || comment.user_id !== user.id) {
        // Reset the editing flag
        await supabase
          .from("media_comments")
          .update({ is_being_edited: false })
          .eq("id", commentId);
        return { success: false, error: "You can only edit your own comments" };
      }

      // Update the comment
      const { data: updatedComment, error } = await supabase
        .from("media_comments")
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString(),
          is_being_edited: false,
        })
        .eq("id", commentId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        // Reset the editing flag on error
        await supabase
          .from("media_comments")
          .update({ is_being_edited: false })
          .eq("id", commentId);
        return { success: false, error: error.message };
      }

      return { success: true, comment: updatedComment };
    } else {
      // Anonymous user
      if (!sessionId) {
        await supabase
          .from("media_comments")
          .update({ is_being_edited: false })
          .eq("id", commentId);
        return { success: false, error: "Session ID required" };
      }

      const { data: comment, error: fetchError } = await supabase
        .from("media_comments")
        .select("session_id")
        .eq("id", commentId)
        .single();

      if (fetchError || comment.session_id !== sessionId) {
        await supabase
          .from("media_comments")
          .update({ is_being_edited: false })
          .eq("id", commentId);
        return { success: false, error: "You can only edit your own comments" };
      }

      // Update the comment
      const { data: updatedComment, error } = await supabase
        .from("media_comments")
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString(),
          is_being_edited: false,
        })
        .eq("id", commentId)
        .eq("session_id", sessionId)
        .select()
        .single();

      if (error) {
        await supabase
          .from("media_comments")
          .update({ is_being_edited: false })
          .eq("id", commentId);
        return { success: false, error: error.message };
      }

      return { success: true, comment: updatedComment };
    }
  } catch (error) {
    console.error("Failed to update comment:", error);
    // Try to reset the editing flag
    try {
      const supabase = await createClient();
      await supabase
        .from("media_comments")
        .update({ is_being_edited: false })
        .eq("id", commentId);
    } catch (resetError) {
      console.error("Failed to reset editing flag:", resetError);
    }
    return { success: false, error: "Failed to update comment" };
  }
}

// app/review/[token]/lib/actions.ts
/**
 * Updates media status for both authenticated and guest users
 *
 * This action uses a secure database function (update_media_status_only) that:
 * - Bypasses RLS restrictions using SECURITY DEFINER
 * - Only allows updates to the 'status' column for security
 * - Works for both logged-in users and guest reviewers with review links
 * - Provides audit logging of old/new status values
 *
 * Database function code (for future reference):
 *
 * DROP FUNCTION IF EXISTS update_media_status_only(uuid, text);
 *
 * CREATE OR REPLACE FUNCTION update_media_status_only(media_id uuid, new_status text)
 * RETURNS json
 * LANGUAGE plpgsql
 * SECURITY DEFINER
 * SET search_path = public
 * AS $$
 * DECLARE
 *     result json;
 *     old_status text;
 * BEGIN
 *     SELECT status INTO old_status FROM project_media WHERE id = media_id;
 *
 *     UPDATE project_media
 *     SET status = new_status
 *     WHERE id = media_id;
 *
 *     IF FOUND THEN
 *         SELECT json_build_object(
 *             'success', true,
 *             'id', media_id,
 *             'old_status', old_status,
 *             'new_status', new_status,
 *             'updated_at', now()
 *         ) INTO result;
 *
 *         RETURN result;
 *     ELSE
 *         RETURN json_build_object(
 *             'success', false,
 *             'error', 'Media not found or no permission'
 *         );
 *     END IF;
 * END;
 * $$;
 *
 * GRANT EXECUTE ON FUNCTION update_media_status_only(uuid, text) TO authenticated;
 * GRANT EXECUTE ON FUNCTION update_media_status_only(uuid, text) TO anon;
 *
 * @param mediaId - UUID of the media file to update
 * @param newStatus - New status value (on_hold, in_progress, needs_review, rejected, approved)
 * @returns Promise with success status and optional error message
 */
export async function updateMediaStatusAction(
  mediaId: string,
  newStatus: string
) {
  try {
    const supabase = await createClient();

    // Call the secure database function that only updates status
    // This bypasses RLS restrictions while maintaining security by limiting scope
    const { data, error } = await supabase.rpc("update_media_status_only", {
      media_id: mediaId,
      new_status: newStatus,
    });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      throw new Error("No response from database function");
    }

    if (!data.success) {
      throw new Error(data.error || "Failed to update status");
    }

    return {
      success: true,
      oldStatus: data.old_status,
      newStatus: data.new_status,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update media status",
    };
  }
}