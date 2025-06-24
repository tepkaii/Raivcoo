"use server";

import { createClient } from "@/utils/supabase/server";

interface UpdateCommentParams {
  commentId: string;
  isPinned?: boolean;
  content?: string;
  annotationData?: string;
}

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
  created_at: string;
  updated_at: string;
}

export async function updateCommentAction(params: UpdateCommentParams) {
  try {
    const supabase = await createClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (params.isPinned !== undefined) {
      updateData.is_pinned = params.isPinned;
    }

    if (params.content !== undefined) {
      updateData.content = params.content.trim();
    }

    if (params.annotationData !== undefined) {
      // Validate annotation data if provided
      if (params.annotationData) {
        try {
          JSON.parse(params.annotationData);
        } catch (e) {
          throw new Error("Invalid annotation data format");
        }
      }
      updateData.annotation_data = params.annotationData;
    }

    const { data: comment, error: updateError } = await supabase
      .from("media_comments")
      .update(updateData)
      .eq("id", params.commentId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      success: true,
      comment,
    };
  } catch (error) {
    console.error("Update comment error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update comment",
    };
  }
}

export async function getCommentsByTimestampAction(
  mediaId: string,
  timestampStart: number,
  timestampEnd: number
) {
  try {
    const supabase = await createClient();

    const { data: comments, error: commentsError } = await supabase
      .from("media_comments")
      .select("*")
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
      .select("*")
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
  updates: Partial<Pick<MediaComment, "is_pinned" | "is_approved">>
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
      .select("*")
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
      .select("timestamp_seconds, annotation_data, is_pinned, created_at")
      .eq("media_id", mediaId)
      .eq("is_approved", true);

    if (statsError) throw statsError;

    const totalComments = stats?.length || 0;
    const annotatedComments =
      stats?.filter((c) => c.annotation_data).length || 0;
    const pinnedComments = stats?.filter((c) => c.is_pinned).length || 0;
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
        timestampedComments,
        commentsByHour,
        annotationPercentage:
          totalComments > 0
            ? Math.round((annotatedComments / totalComments) * 100)
            : 0,
        timestampPercentage:
          totalComments > 0
            ? Math.round((timestampedComments / totalComments) * 100)
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
      .select("*")
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
      .select("*")
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
      // Authenticated user - use existing logic (editors can delete comments on their media)
      const { error } = await supabase
        .from("media_comments")
        .delete()
        .eq("id", commentId);

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
  content: string;
  timestampSeconds?: number;
  ipAddress?: string;
  userAgent?: string;
  annotationData?: any;
  drawingData?: any;
  sessionId?: string; // Add this
}) {
  try {
    const supabase = await createClient();

    const insertData = {
      media_id: data.mediaId,
      user_name: data.userName,
      user_email: data.userEmail,
      content: data.content,
      timestamp_seconds: data.timestampSeconds,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      annotation_data: data.annotationData || null,
      drawing_data: data.drawingData || null,
      session_id: data.sessionId, // Add this
      is_approved: true,
      is_pinned: false,
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
      .select("*")
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
