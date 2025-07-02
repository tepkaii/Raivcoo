// app/dashboard/projects/[id]/lib/team-actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { ProjectRole } from "./permissions";

async function getAuthenticatedEditor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: editorProfile } = await supabase
    .from("editor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!editorProfile) redirect("/account");

  return { supabase, user, editorProfile };
}

export async function inviteUserToProject(
  projectId: string,
  email: string,
  role: ProjectRole
) {
  try {
    const { supabase, editorProfile } = await getAuthenticatedEditor();

    // Verify project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, editor_id")
      .eq("id", projectId)
      .single();

    if (!project || project.editor_id !== editorProfile.id) {
      throw new Error("Unauthorized");
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("auth.users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      // User exists, add them directly to project_members
      const { data: member, error } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: existingUser.id,
          role,
          invited_by: editorProfile.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification email (implement your email service)
      // await sendProjectInviteEmail(email, project.name, role);

      return { success: true, member };
    } else {
      // User doesn't exist, create invitation
      const invitationToken = nanoid(32);

      const { data: invitation, error } = await supabase
        .from("project_invitations")
        .insert({
          project_id: projectId,
          email,
          role,
          invited_by: editorProfile.id,
          invitation_token: invitationToken,
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email with signup link
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitationToken}`;
      // await sendProjectInviteEmailWithSignup(email, project.name, role, inviteUrl);

      return { success: true, invitation, inviteUrl };
    }
  } catch (error) {
    console.error("Invite user error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to invite user",
    };
  }
}

export async function updateMemberRole(
  projectId: string,
  memberId: string,
  newRole: ProjectRole
) {
  try {
    const { supabase, editorProfile } = await getAuthenticatedEditor();

    // Verify project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, editor_id")
      .eq("id", projectId)
      .single();

    if (!project || project.editor_id !== editorProfile.id) {
      throw new Error("Unauthorized");
    }

    const { error } = await supabase
      .from("project_members")
      .update({ role: newRole })
      .eq("id", memberId)
      .eq("project_id", projectId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update role",
    };
  }
}

export async function removeMemberFromProject(
  projectId: string,
  memberId: string
) {
  try {
    const { supabase, editorProfile } = await getAuthenticatedEditor();

    // Verify project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, editor_id")
      .eq("id", projectId)
      .single();

    if (!project || project.editor_id !== editorProfile.id) {
      throw new Error("Unauthorized");
    }

    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("id", memberId)
      .eq("project_id", projectId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove member",
    };
  }
}
