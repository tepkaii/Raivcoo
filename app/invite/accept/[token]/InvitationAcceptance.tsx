// app/invite/accept/[token]/InvitationAcceptance.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  acceptInvitation,
  declineInvitation,
  redirectToProject,
  redirectToDashboard,
} from "../actions";
import { formatFullDate } from "@/app/dashboard/lib/formats";

interface InvitationAcceptanceProps {
  invitation: {
    id: string;
    project_id: string;
    email: string;
    role: string;
    created_at: string;
  };
  inviterName: string;
  inviterAvatarUrl?: string;
  currentUser: any;
  currentUserAvatarUrl?: string;
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.25, 0.25, 0.75],
    },
  },
};

const avatarVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.25, 0.25, 0.75],
    },
  },
};

const lineVariants = {
  hidden: {
    opacity: 0,
    scaleX: 0,
  },
  visible: {
    opacity: 1,
    scaleX: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.25, 0.25, 0.75],
      delay: 0.2,
    },
  },
};

const buttonVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.25, 0.25, 0.75],
    },
  },
};

export function InvitationAcceptance({
  invitation,
  inviterName,
  currentUser,
  inviterAvatarUrl,
  currentUserAvatarUrl,
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
            variant: "green",
          });

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
            variant: "green",
          });

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
  const inviteDate = formatFullDate(invitation.created_at);

  // Get current user's display name
  const currentUserName =
    currentUser?.user_metadata?.full_name ||
    currentUser?.user_metadata?.display_name ||
    currentUser?.email ||
    "You";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        className="max-w-md w-full bg-primary-foreground shadow-lg rounded-lg p-6 border"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="text-center mb-6">
          {/* Avatar Connection Visual */}
          <motion.div
            className="flex items-center justify-center mb-6"
            variants={itemVariants}
          >
            {/* Inviter Avatar */}
            <motion.div
              className="size-20 bg-primary/10 rounded-[10px] border-2 border-black/20 flex items-center justify-center overflow-hidden"
              variants={avatarVariants}
            >
              {inviterAvatarUrl ? (
                <img
                  src={inviterAvatarUrl}
                  alt={inviterName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-lg">
                  {inviterName.charAt(0).toUpperCase()}
                </div>
              )}
            </motion.div>

            {/* Connection Line */}
            <motion.div
              className="w-32 mx-3 h-0.5 bg-border relative"
              variants={lineVariants}
              style={{ transformOrigin: "center" }} // Add this to keep scaling from center
            ></motion.div>

            {/* Current User Avatar */}
            <motion.div
              className="size-20 bg-primary/10 rounded-[10px] border-2 border-black/20 flex items-center justify-center overflow-hidden"
              variants={avatarVariants}
            >
              {currentUserAvatarUrl ? (
                <img
                  src={currentUserAvatarUrl}
                  alt={currentUserName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-lg">
                  {currentUserName.charAt(0).toUpperCase()}
                </div>
              )}
            </motion.div>
          </motion.div>

          <motion.h1
            className="text-2xl font-semibold text-foreground"
            variants={itemVariants}
          >
            You're Invited!
          </motion.h1>
          <motion.p className="text-muted-foreground" variants={itemVariants}>
            <strong>{inviterName}</strong> has invited you to collaborate
          </motion.p>
        </div>

        <motion.div
          className="bg-card rounded-lg p-4 mb-6 border"
          variants={itemVariants}
        >
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
            "{" "}
            {roleDescriptions[invitation.role as keyof typeof roleDescriptions]}{" "}
            "
          </p>
          <p className="text-xs text-muted-foreground">
            Invited on {inviteDate}
          </p>
        </motion.div>

        <motion.div className="flex gap-3" variants={itemVariants}>
          <motion.div className="flex-1" variants={buttonVariants}>
            <Button
              onClick={handleDecline}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              {isDeclining ? "Declining..." : "Decline"}
            </Button>
          </motion.div>
          <motion.div className="flex-1" variants={buttonVariants}>
            <Button
              onClick={handleAccept}
              className="w-full"
              disabled={isLoading}
            >
              {isAccepting ? "Accepting..." : "Accept Invitation"}
            </Button>
          </motion.div>
        </motion.div>

        <motion.div className="mt-4 text-center" variants={itemVariants}>
          <p className="text-xs text-muted-foreground">
            Invited to: {invitation.email}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}