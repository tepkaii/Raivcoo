// app/dashboard/projects/components/DeleteProjectDialog.tsx
"use client";

import React, { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  stats: {
    totalFiles: number;
  };
}

interface DeleteProjectDialogProps {
  project: Project;
  onDeleteProject: (projectId: string) => Promise<{
    message: string;
    success: boolean;
  }>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DeleteProjectDialog({
  project,
  onDeleteProject,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: DeleteProjectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const isConfirmationValid = confirmationText === project.name;

  const handleDelete = async () => {
    if (!isConfirmationValid) return;

    setIsLoading(true);

    try {
      const result = await onDeleteProject(project.id);

      toast({
        title: "Project Deleted",
        description: result.message,
        variant: "success",
      });

      setOpen(false);
      setConfirmationText("");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setConfirmationText("");
      setIsLoading(false);
    }
  };

  const DialogComponent = (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-primary-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="space-y-2">
              <p className="font-medium text-red-500">
                This action cannot be undone
              </p>
              <p className="text-sm text-muted-foreground">
                This will permanently delete:
              </p>
              <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                <li>• Project "{project.name}"</li>
                <li>• All {project.stats.totalFiles} media files</li>
                <li>• All project versions and history</li>
                <li>• All review links and comments</li>
                <li>• All associated data</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type the project name to confirm deletion:
            </Label>
            <p className="text-sm text-muted-foreground font-mono">
              {project.name}
            </p>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Enter project name here"
              className="mt-1"
              disabled={isLoading}
            />
          </div>

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
              onClick={handleDelete}
              disabled={!isConfirmationValid || isLoading}
              variant="destructive"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return DialogComponent;
}
