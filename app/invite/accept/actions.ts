// app/invite/accept/[token]/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { InvitationAcceptedEmail } from "../../components/emails/Members/InvitationAcceptedEmail";
import { InvitationDeclinedEmail } from "@/app/components/emails/Members/InvitationDeclinedEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to create activity notification
async function createActivityNotification(params: {
  userId: string;
  projectId: string;
  activityType: string;
  title: string;
  description: string;
  actorId: string;
  actorName: string;
  activityData: any;
}) {
  const supabase = await createClient();

  try {
    const { error } = await supabase.from("activity_notifications").insert({
      user_id: params.userId,
      project_id: params.projectId,
      title: params.title,
      description: params.description,
      actor_id: params.actorId,
      actor_name: params.actorName,
      activity_data: {
        type: params.activityType,
        ...params.activityData,
      },
    });

    if (error) {
      console.error("❌ Error creating activity notification:", error);
    } else {
    }
  } catch (error) {
    console.error("❌ Failed to create activity notification:", error);
  }
}

export async function acceptInvitation(invitationId: string) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "You must be signed in to accept invitations",
        requireAuth: true,
      };
    }

    // Get user's editor profile
    const { data: editorProfile, error: profileError } = await supabase
      .from("editor_profiles")
      .select("id, user_id, email, full_name, display_name")
      .eq("user_id", user.id)
      .single();

    if (!editorProfile) {
      return {
        success: false,
        error: "Editor profile not found. Please complete your profile setup.",
      };
    }

    // Get the invitation first
    const { data: invitation, error: invitationError } = await supabase
      .from("project_invitations")
      .select("id, project_id, email, role, expires_at, used_at, invited_by")
      .eq("id", invitationId)
      .single();

    if (invitationError || !invitation) {
      return {
        success: false,
        error: "Invitation not found or has been removed",
      };
    }

    // Get project data using RPC function (bypasses RLS)
    const { data: projectData, error: projectError } = await supabase.rpc(
      "get_project_for_invitation",
      { invitation_id: invitationId }
    );

    if (projectError || !projectData) {
      return {
        success: false,
        error: "Project not found",
      };
    }

    // Check if invitation has expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    const isExpired = now > expiresAt;

    if (isExpired) {
      return {
        success: false,
        error: "This invitation has expired. Please request a new invitation.",
      };
    }

    // Check if already used
    if (invitation.used_at) {
      return {
        success: false,
        error: "This invitation has already been used",
      };
    }

    // Check if email matches
    const emailMatch =
      editorProfile.email.toLowerCase() === invitation.email.toLowerCase();

    if (!emailMatch) {
      return {
        success: false,
        error: `This invitation was sent to ${invitation.email}, but you're signed in as ${editorProfile.email}`,
      };
    }

    // Check if user is already a member (try to find existing record)
    const { data: existingMember, error: memberCheckError } = await supabase
      .from("project_members")
      .select("id, status, role")
      .eq("project_id", invitation.project_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMember) {
      // Update existing member status to accepted
      const { error: updateError } = await supabase
        .from("project_members")
        .update({
          status: "accepted",
          joined_at: new Date().toISOString(),
        })
        .eq("id", existingMember.id);
      if (updateError) {
        return {
          success: false,
          error: "Failed to accept invitation. Please try again.",
        };
      }
    } else {
      // Create new member record
      const newMemberData = {
        project_id: invitation.project_id,
        user_id: user.id,
        role: invitation.role,
        status: "accepted",
        joined_at: new Date().toISOString(),
        invited_by: invitation.invited_by,
      };

      const { error: memberError } = await supabase
        .from("project_members")
        .insert(newMemberData);

      if (memberError) {
        return {
          success: false,
          error: "Failed to accept invitation. Please try again.",
        };
      }
    }
    // Mark invitation as used
    const { error: invitationUpdateError } = await supabase
      .from("project_invitations")
      .update({ used_at: new Date().toISOString() })
      .eq("id", invitationId);

    if (invitationUpdateError) {
      console.error("⚠️ Error updating invitation:", invitationUpdateError);
    } else {
    }
    if (projectData?.editor_profiles) {
      const projectOwner = projectData.editor_profiles;
      const memberName =
        editorProfile.display_name ||
        editorProfile.full_name ||
        editorProfile.email;
      const ownerName =
        projectOwner.display_name ||
        projectOwner.full_name ||
        projectOwner.email;
      const acceptedAt = new Date().toISOString();

      // Send email notification to project owner
      try {
        const { data: emailData, error: emailError } = await resend.emails.send(
          {
            from: process.env.RESEND_FROM_EMAIL!,
            to: [projectOwner.email],
            subject: `${memberName} accepted your invitation to ${projectData.name}`,
            react: InvitationAcceptedEmail({
              ownerName,
              memberName,
              memberEmail: editorProfile.email,
              projectName: projectData.name,
              role: invitation.role as any,
              projectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/projects/${invitation.project_id}`,
              acceptedAt,
            }),
          }
        );

        if (emailError) {
          console.error("❌ Error sending acceptance email:", emailError);
        } else {
        }
      } catch (emailError) {
        console.error("❌ Failed to send acceptance email:", emailError);
      }

      // Create activity notification for project owner
      await createActivityNotification({
        userId: projectOwner.user_id,
        projectId: invitation.project_id,
        activityType: "invitation_accepted",
        title: `${memberName} accepted your invitation`,
        description: `${memberName} joined the project as a ${invitation.role}`,
        actorId: user.id,
        actorName: memberName,
        activityData: {
          role: invitation.role,
          project_name: projectData.name,
          member_email: editorProfile.email,
        },
      });
    } else {
    }
    return {
      success: true,
      message: "Invitation accepted successfully!",
      projectId: invitation.project_id,
    };
  } catch (error) {
    console.error("❌ Accept invitation error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to accept invitation",
    };
  }
}

export async function declineInvitation(invitationId: string) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "You must be signed in to decline invitations",
      };
    }

    // Get user's editor profile
    const { data: editorProfile, error: profileError } = await supabase
      .from("editor_profiles")
      .select("id, user_id, email, full_name, display_name")
      .eq("user_id", user.id)
      .single();
    if (!editorProfile) {
      return {
        success: false,
        error: "Editor profile not found.",
      };
    }

    // Get the invitation first
    const { data: invitation, error: invitationError } = await supabase
      .from("project_invitations")
      .select("id, project_id, email, role, used_at, expires_at")
      .eq("id", invitationId)
      .single();

    if (invitationError || !invitation) {
      return {
        success: false,
        error: "Invitation not found",
      };
    }

    // Get project data using RPC function (bypasses RLS)
    const { data: projectData, error: projectError } = await supabase.rpc(
      "get_project_for_invitation",
      { invitation_id: invitationId }
    );

    if (projectError || !projectData) {
      return {
        success: false,
        error: "Project not found",
      };
    }

    // Check if already used
    if (invitation.used_at) {
      return {
        success: false,
        error: "This invitation has already been processed",
      };
    }

    // Check if there's an existing member record to update
    const { data: existingMember, error: memberCheckError } = await supabase
      .from("project_members")
      .select("id, status")
      .eq("project_id", invitation.project_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMember) {
      // Update existing member status to declined
      const { error: updateError } = await supabase
        .from("project_members")
        .update({ status: "declined" })
        .eq("id", existingMember.id);

      if (updateError) {
        console.error("⚠️ Error updating member status:", updateError);
      }
    }

    // Mark invitation as used (declined)
    const { error } = await supabase
      .from("project_invitations")
      .update({ used_at: new Date().toISOString() })
      .eq("id", invitationId);

    if (error) {
      console.log("❌ Failed to mark invitation as used:", error);
      return {
        success: false,
        error: "Failed to decline invitation. Please try again.",
      };
    }

    // 🔥 SEND EMAIL AND ACTIVITY NOTIFICATIONS
    if (projectData?.editor_profiles) {
      const projectOwner = projectData.editor_profiles;
      const memberName =
        editorProfile.display_name ||
        editorProfile.full_name ||
        editorProfile.email;
      const ownerName =
        projectOwner.display_name ||
        projectOwner.full_name ||
        projectOwner.email;
      const declinedAt = new Date().toISOString();

      // Send email notification to project owner
      try {
        const { data: emailData, error: emailError } = await resend.emails.send(
          {
            from: process.env.RESEND_FROM_EMAIL!,
            to: [projectOwner.email],
            subject: `Invitation to ${projectData.name} was declined`,
            react: InvitationDeclinedEmail({
              ownerName,
              memberEmail: invitation.email,
              projectName: projectData.name,
              role: invitation.role as any,
              declinedAt,
            }),
          }
        );

        if (emailError) {
          console.error("❌ Error sending decline email:", emailError);
        } else {
        }
      } catch (emailError) {
        console.error("❌ Failed to send decline email:", emailError);
      }

      // Create activity notification for project owner
      await createActivityNotification({
        userId: projectOwner.user_id,
        projectId: invitation.project_id,
        activityType: "invitation_declined",
        title: `${memberName} declined your invitation`,
        description: `${memberName} declined to join the project as a ${invitation.role}`,
        actorId: user.id,
        actorName: memberName,
        activityData: {
          role: invitation.role,
          project_name: projectData.name,
          member_email: invitation.email,
        },
      });
    } else {
    }

    return {
      success: true,
      message: "Invitation declined successfully",
    };
  } catch (error) {
    console.error("❌ Decline invitation error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to decline invitation",
    };
  }
}

// Helper action to redirect after successful acceptance
export async function redirectToProject(projectId: string) {
  redirect(`/dashboard/projects/${projectId}`);
}

// Helper action to redirect after decline
export async function redirectToDashboard() {
  redirect("/dashboard");
}
