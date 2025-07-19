// app/dashboard/projects/[id]/components/ProjectInfoDialog.tsx
// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  InformationCircleIcon,
  UserIcon,
  CalendarIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { leaveProject } from "../../lib/GeneralActions";

interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  status: "pending" | "accepted" | "declined";
  invited_at: string;
  joined_at?: string;
  invited_by: string;
  user_profile?: {
    email: string;
    name: string;
    avatar_url?: string;
  };
}

interface ProjectOwner {
  id: string;
  full_name: string | null;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface ProjectInfoDialogProps {
  projectId: string;
  projectName: string;
  userRole: string | null;
  isOwner: boolean;
  currentUserId: string;
}

export function ProjectInfoDialog({
  projectId,
  projectName,
  userRole,
  isOwner,
  currentUserId,
}: ProjectInfoDialogProps) {
  const [open, setOpen] = useState(false);
  const [projectOwner, setProjectOwner] = useState<ProjectOwner | null>(null);
  const [memberInfo, setMemberInfo] = useState<ProjectMember | null>(null);
  const [invitedByInfo, setInvitedByInfo] = useState<ProjectOwner | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const loadProjectInfo = async () => {
    if (!open || isLoading) return;

    setIsLoading(true);
    try {
      // Get project owner info
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select(
          `
          editor_id,
          editor_profiles!projects_editor_id_fkey (
            id,
            full_name,
            display_name,
            email,
            avatar_url
          )
        `
        )
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;

      setProjectOwner(projectData.editor_profiles);

      // If not owner, get member info
      if (!isOwner) {
        const { data: memberData, error: memberError } = await supabase
          .from("project_members")
          .select(
            `
            id,
            user_id,
            role,
            status,
            invited_at,
            joined_at,
            invited_by,
            editor_profiles!project_members_invited_by_fkey (
              id,
              full_name,
              display_name,
              email,
              avatar_url
            )
          `
          )
          .eq("project_id", projectId)
          .eq("user_id", currentUserId)
          .single();

        if (memberError) throw memberError;

        setMemberInfo(memberData);
        setInvitedByInfo(memberData.editor_profiles);
      }
    } catch (error) {
      console.error("Error loading project info:", error);
      toast({
        title: "Error",
        description: "Failed to load project information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadProjectInfo();
    }
  }, [open]);

  const handleLeaveProject = async () => {
    if (isOwner) {
      toast({
        title: "Cannot Leave",
        description:
          "You are the project owner. Transfer ownership or delete the project instead.",
        variant: "destructive",
      });
      return;
    }

    setIsLeaving(true);
    try {
      // Use the existing leaveProject action
      const result = await leaveProject(projectId);

      if (result.success) {
        toast({
          title: "Left Project",
          description: "You have successfully left the project",
          variant: "green",
        });

        // Close dialog and redirect to dashboard
        setOpen(false);
        router.push("/dashboard");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to leave project",
        variant: "destructive",
      });
    } finally {
      setIsLeaving(false);
    }
  };

  const getDisplayName = (profile: ProjectOwner | null) => {
    if (!profile) return "Unknown";
    return profile.display_name || profile.full_name || profile.email;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Badge
          variant="outline"
          size={"sm"}
          className="sm:text-sm text-xs  cursor-pointer"
        >
          {userRole}
          <InformationCircleIcon className="size-4" />
        </Badge>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <InformationCircleIcon className="h-5 w-5" />
            Project Information
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Name */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">
              Project
            </h3>
            <p className="font-medium">{projectName}</p>
          </div>

          {/* Your Role */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">
              Your Role
            </h3>
            <div className="flex items-center gap-2">
              {isOwner ? (
                <Badge
                  variant="default"
                  className="bg-orange-100 text-orange-800 border-orange-200"
                >
                  Owner
                </Badge>
              ) : userRole ? (
                <Badge variant="outline">
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </Badge>
              ) : (
                <span className="text-muted-foreground">Unknown</span>
              )}
            </div>
          </div>

          {/* Project Owner */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">
              Project Owner
            </h3>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-32 animate-pulse" />
                </div>
              </div>
            ) : projectOwner ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  {projectOwner.avatar_url ? (
                    <img
                      src={projectOwner.avatar_url}
                      alt={getDisplayName(projectOwner)}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {getDisplayName(projectOwner)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {projectOwner.email}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Unable to load owner information
              </p>
            )}
          </div>

          {/* Member Info (if not owner) */}
          {!isOwner && memberInfo && (
            <>
              {/* Invited By */}
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">
                  Invited By
                </h3>
                {invitedByInfo ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      {invitedByInfo.avatar_url ? (
                        <img
                          src={invitedByInfo.avatar_url}
                          alt={getDisplayName(invitedByInfo)}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {getDisplayName(invitedByInfo)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {invitedByInfo.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Unknown</p>
                )}
              </div>

              {/* Join Date */}
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">
                  Member Since
                </h3>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {memberInfo.joined_at
                      ? format(new Date(memberInfo.joined_at), "MMM d, yyyy")
                      : memberInfo.status === "pending"
                        ? "Invitation pending"
                        : "Unknown"}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Leave Project Button (only for non-owners) */}
          {!isOwner && (
            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                onClick={handleLeaveProject}
                disabled={isLeaving}
                className="w-full gap-2"
              >
                <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                {isLeaving ? "Leaving..." : "Leave Project"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                You will lose access to this project and all its content
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
