// app/dashboard/projects/[id]/components/TeamManagement.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  UserPlus,
  Crown,
  Eye,
  MessageSquare,
  Users,
  Trash2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type ProjectRole = "viewer" | "reviewer" | "collaborator";

interface ProjectMember {
  id: string;
  user_id: string;
  role: ProjectRole;
  status: "pending" | "accepted" | "declined";
  invited_at: string;
  joined_at?: string;
  user_profile?: {
    email: string;
    name: string;
    avatar_url?: string;
  };
}

interface TeamManagementProps {
  projectId: string;
  members: ProjectMember[];
  isOwner: boolean;
  onMembersUpdate: () => void;
}

const roleIcons = {
  viewer: Eye,
  reviewer: MessageSquare,
  collaborator: Users,
};

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

export function TeamManagement({
  projectId,
  members,
  isOwner,
  onMembersUpdate,
}: TeamManagementProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ProjectRole>("viewer");
  const [isLoading, setIsLoading] = useState(false);

  // Update the handleInvite function in TeamManagement.tsx
  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(), // Normalize email
          role: inviteRole,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Invitation sent",
          description:
            result.message ||
            `Invited ${inviteEmail} as ${roleLabels[inviteRole]}`,
          variant: "green",
        });
        setInviteEmail("");
        setShowInviteDialog(false);
        onMembersUpdate();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: ProjectRole) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/members/${memberId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Role updated",
          description: `Member role changed to ${roleLabels[newRole]}`,
          variant: "green",
        });
        onMembersUpdate();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Member removed",
          description: "Member has been removed from the project",
          variant: "green",
        });
        onMembersUpdate();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Team Members</h3>
        {isOwner && (
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Select
                    value={inviteRole}
                    onValueChange={(value: ProjectRole) => setInviteRole(value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <div>
                            <div>Viewer</div>
                            <div className="text-xs text-muted-foreground">
                              {roleDescriptions.viewer}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="reviewer">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <div>
                            <div>Reviewer</div>
                            <div className="text-xs text-muted-foreground">
                              {roleDescriptions.reviewer}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="collaborator">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <div>
                            <div>Collaborator</div>
                            <div className="text-xs text-muted-foreground">
                              {roleDescriptions.collaborator}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowInviteDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleInvite}
                    disabled={isLoading || !inviteEmail.trim()}
                  >
                    {isLoading ? "Sending..." : "Send Invitation"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-2">
        {members.map((member) => {
          const IconComponent = roleIcons[member.role];
          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  {member.user_profile?.avatar_url ? (
                    <img
                      src={member.user_profile.avatar_url}
                      alt={member.user_profile.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="text-sm font-medium">
                      {member.user_profile?.name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium">
                    {member.user_profile?.name || "Unknown"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {member.user_profile?.email}
                  </div>
                  {member.status === "pending" && (
                    <div className="text-xs text-yellow-600">
                      Invitation pending
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm">
                  <IconComponent className="h-4 w-4" />
                  {roleLabels[member.role]}
                </div>

                {isOwner && (
                  <div className="flex items-center gap-1">
                    <Select
                      value={member.role}
                      onValueChange={(value: ProjectRole) =>
                        handleRoleChange(member.id, value)
                      }
                    >
                      <SelectTrigger className="w-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="reviewer">Reviewer</SelectItem>
                        <SelectItem value="collaborator">
                          Collaborator
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {members.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No team members yet</p>
            <p className="text-sm">
              Invite collaborators to work on this project
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
