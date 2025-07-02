// app/api/projects/[projectId]/invite/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();
    const { projectId } = await params;
    const { email, role } = await request.json();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const { data: project } = await supabase
      .from("projects")
      .select("id, editor_id, name")
      .eq("id", projectId)
      .single();

    if (!project || project.editor_id !== editorProfile.id) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" },
        { status: 403 }
      );
    }

    // ✅ CORRECT WAY: Check if user exists by looking in editor_profiles
    // Since all users should have an editor_profile, this is the right approach
    const { data: existingEditor } = await supabase
      .from("editor_profiles")
      .select("user_id, email")
      .eq("email", email.toLowerCase().trim())
      .single();

    // Check if already a member (if user exists)
    if (existingEditor) {
      const { data: existingMember } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", existingEditor.user_id)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a member of this project" },
          { status: 400 }
        );
      }
    }

    if (existingEditor) {
      // User exists, add them directly to project_members
      const { data: member, error } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: existingEditor.user_id,
          role,
          invited_by: editorProfile.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        member,
        message: "User invited successfully",
      });
    } else {
      // User doesn't exist, create invitation
      const invitationToken = nanoid(32);

      // Check if invitation already exists
      const { data: existingInvitation } = await supabase
        .from("project_invitations")
        .select("id")
        .eq("project_id", projectId)
        .eq("email", email.toLowerCase().trim())
        .single();

      if (existingInvitation) {
        return NextResponse.json(
          { error: "Invitation already sent to this email" },
          { status: 400 }
        );
      }

      const { data: invitation, error } = await supabase
        .from("project_invitations")
        .insert({
          project_id: projectId,
          email: email.toLowerCase().trim(),
          role,
          invited_by: editorProfile.id,
          invitation_token: invitationToken,
        })
        .select()
        .single();

      if (error) throw error;

      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitationToken}`;

      return NextResponse.json({
        success: true,
        invitation,
        inviteUrl,
        message: "Invitation sent successfully",
      });
    }
  } catch (error) {
    console.error("Invite user error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to invite user",
      },
      { status: 500 }
    );
  }
}
