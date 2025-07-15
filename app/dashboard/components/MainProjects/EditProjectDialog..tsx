// app/dashboard/projects/components/EditProjectDialog.tsx
"use client";

import React, { useState } from "react";
import { Settings2, Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { PencilSquareIcon, BellIcon } from "@heroicons/react/24/solid";

interface Project {
  id: string;
  name: string;
  notifications_enabled: boolean;
  isOwner: boolean;
  memberNotificationsEnabled?: boolean; // For members
}

interface EditProjectDialogProps {
  project: Project;
  onUpdateProject: (
    projectId: string,
    updates: {
      name?: string;
      notifications_enabled?: boolean;
      member_notifications_enabled?: boolean;
    }
  ) => Promise<{
    message: string;
    success: boolean;
  }>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditProjectDialog({
  project,
  onUpdateProject,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: EditProjectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newName, setNewName] = useState(project.name);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    project.isOwner
      ? project.notifications_enabled
      : (project.memberNotificationsEnabled ?? true)
  );

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const hasChanges = project.isOwner
    ? newName.trim() !== project.name ||
      notificationsEnabled !== project.notifications_enabled
    : notificationsEnabled !== (project.memberNotificationsEnabled ?? true);

  const isNameValid = newName.trim().length > 0;
  const canEditName = project.isOwner; // Only owners can rename projects

  const handleSave = async () => {
    if (!hasChanges || (!canEditName && !isNameValid)) return;

    setIsLoading(true);

    try {
      const updates: {
        name?: string;
        notifications_enabled?: boolean;
        member_notifications_enabled?: boolean;
      } = {};

      if (project.isOwner) {
        // Owner can update project name and their own notifications
        if (newName.trim() !== project.name) {
          updates.name = newName.trim();
        }
        if (notificationsEnabled !== project.notifications_enabled) {
          updates.notifications_enabled = notificationsEnabled;
        }
      } else {
        // Members can only update their own notification preferences
        if (
          notificationsEnabled !== (project.memberNotificationsEnabled ?? true)
        ) {
          updates.member_notifications_enabled = notificationsEnabled;
        }
      }

      const result = await onUpdateProject(project.id, updates);

      toast({
        title: project.isOwner ? "Project Updated" : "Preferences Updated",
        description: result.message,
        variant: "green",
      });

      setOpen(false);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setNewName(project.name);
      setNotificationsEnabled(
        project.isOwner
          ? project.notifications_enabled
          : (project.memberNotificationsEnabled ?? true)
      );
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            {project.isOwner ? "Edit Project" : "Project Preferences"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Name - Only for owners */}
          {project.isOwner && (
            <div className="space-y-2">
              <Label htmlFor="projectName" className="flex items-center gap-2">
                <PencilSquareIcon className="h-4 w-4" />
                Project Name
              </Label>
              <Input
                id="projectName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter project name"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isNameValid && hasChanges) {
                    handleSave();
                  }
                }}
              />
            </div>
          )}

          {/* Notifications Toggle */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <BellIcon className="h-4 w-4" />
              Notifications
            </Label>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">
                  {project.isOwner
                    ? "Project Notifications"
                    : "Your Notifications"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {project.isOwner
                    ? "Receive notifications about project activity, reviews, and updates"
                    : "Receive notifications about this project's activity and updates"}
                </div>
              </div>
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !hasChanges || isLoading || (project.isOwner && !isNameValid)
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
