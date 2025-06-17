// app/api/projects/[projectId]/media/[mediaId]/route.ts
import { createClient } from "@/utils/supabase/server";
import { deleteFileFromR2 } from "@/lib/r2";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; mediaId: string }> }
) {
  try {
    const { projectId, mediaId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get editor profile
    const { data: editorProfile } = await supabase
      .from("editor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!editorProfile) {
      return NextResponse.json(
        { error: "Editor profile not found" },
        { status: 404 }
      );
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, editor_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.editor_id !== editorProfile.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get media file info (including R2 key)
    const { data: media, error: mediaError } = await supabase
      .from("project_media")
      .select("id, r2_key")
      .eq("id", mediaId)
      .eq("project_id", projectId)
      .single();

    if (mediaError || !media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Delete from R2 first
    try {
      await deleteFileFromR2(media.r2_key);
    } catch (r2Error) {
      console.error("R2 deletion error:", r2Error);
      // Continue with database cleanup even if R2 deletion fails
    }

    // Delete related review links first (foreign key constraint)
    const { error: linksDeleteError } = await supabase
      .from("review_links")
      .delete()
      .eq("media_id", mediaId);

    if (linksDeleteError) {
      console.error("Error deleting review links:", linksDeleteError);
      // Continue with media deletion
    }

    // Delete media from database
    const { error: deleteError } = await supabase
      .from("project_media")
      .delete()
      .eq("id", mediaId)
      .eq("project_id", projectId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      message: "Media file deleted successfully",
    });
  } catch (error) {
    console.error("Delete media error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete media",
      },
      { status: 500 }
    );
  }
}
