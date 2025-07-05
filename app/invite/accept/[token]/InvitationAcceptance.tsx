// app/invite/accept/[token]/InvitationAcceptance.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  acceptInvitation,
  declineInvitation,
  redirectToProject,
  redirectToDashboard,
} from "../actions";
import { formatFullDate } from "@/app/dashboard/lib/formats";
import { UsersIcon } from "@heroicons/react/24/solid";

interface InvitationAcceptanceProps {
  invitation: {
    id: string;
    project_id: string;
    email: string;
    role: string;
    created_at: string;
  };
  inviterName: string;
  currentUser: any;
}

const roleLabels = {
  viewer: "Viewer",
  reviewer: "Reviewer",
  collaborator: "Collaborator",
};

const roleDescriptions = {
  viewer: "Can only view content",
  reviewer: "Can comment and change status",
  collaborator: "Full access except member management",
};

export function InvitationAcceptance({
  invitation,
  inviterName,
  currentUser,
}: InvitationAcceptanceProps) {
  const [isPending, startTransition] = useTransition();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const router = useRouter();

  const handleAccept = () => {
    setIsAccepting(true);
    startTransition(async () => {
      try {
        const result = await acceptInvitation(invitation.id);

        if (result.success) {
          toast({
            title: "Invitation Accepted",
            description: `You've joined the project as a ${roleLabels[invitation.role as keyof typeof roleLabels]}`,
          });

          // Redirect to the project
          if (result.projectId) {
            await redirectToProject(result.projectId);
          } else {
            router.push(`/dashboard/projects/${invitation.project_id}`);
          }
        } else {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsAccepting(false);
      }
    });
  };

  const handleDecline = () => {
    setIsDeclining(true);
    startTransition(async () => {
      try {
        const result = await declineInvitation(invitation.id);

        if (result.success) {
          toast({
            title: "Invitation Declined",
            description: "You've declined the invitation",
          });

          // Redirect to dashboard
          await redirectToDashboard();
        } else {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsDeclining(false);
      }
    });
  };

  const isLoading = isPending || isAccepting || isDeclining;

  // Format the invitation date
  const inviteDate = formatFullDate(invitation.created_at);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-primary-foreground shadow-lg rounded-lg p-6 border">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-[5px] border-2 border-black/20 flex items-center justify-center mx-auto mb-4">
            <UsersIcon className="size-10 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            You're Invited!
          </h1>
          <p className="text-muted-foreground">
            <strong>{inviterName}</strong> has invited you to collaborate
          </p>
        </div>

        <div className="bg-card rounded-lg p-4 mb-6 border">
          <h2 className="font-semibold text-lg text-foreground mb-1">
            Project Collaboration
          </h2>
          <p className="text-muted-foreground text-sm mb-3">
            Join this project to start collaborating with the team.
          </p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">Your role:</span>
            <span className="text-sm font-medium text-primary">
              {roleLabels[invitation.role as keyof typeof roleLabels]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {roleDescriptions[invitation.role as keyof typeof roleDescriptions]}
          </p>
          <p className="text-xs text-muted-foreground">
            Invited on {inviteDate}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleDecline}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            {isDeclining ? "Declining..." : "Decline"}
          </Button>
          <Button
            onClick={handleAccept}
            className="flex-1"
            disabled={isLoading}
          >
            {isAccepting ? "Accepting..." : "Accept Invitation"}
          </Button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Invited to: {invitation.email}
          </p>
        </div>
      </div>
    </div>
  );
}
