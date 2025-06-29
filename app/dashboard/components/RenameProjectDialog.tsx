// app/dashboard/projects/components/RenameProjectDialog.tsx
"use client";

import React, { useState } from "react";
import { Edit2, Loader2 } from "lucide-react";
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
import { PencilSquareIcon } from "@heroicons/react/24/solid";

interface Project {
  id: string;
  name: string;
}

interface RenameProjectDialogProps {
  project: Project;
  onRenameProject: (
    projectId: string,
    newName: string
  ) => Promise<{
    message: string;
    success: boolean;
  }>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function RenameProjectDialog({
  project,
  onRenameProject,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: RenameProjectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newName, setNewName] = useState(project.name);

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const isNameValid =
    newName.trim().length > 0 && newName.trim() !== project.name;

  const handleRename = async () => {
    if (!isNameValid) return;

    setIsLoading(true);

    try {
      const result = await onRenameProject(project.id, newName.trim());

      toast({
        title: "Project Renamed",
        description: result.message,
        variant: "success",
      });

      setOpen(false);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to rename project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setNewName(project.name);
      setIsLoading(false);
    }
  };

  const DialogComponent = (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-primary-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PencilSquareIcon className="h-5 w-5" />
            Rename Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter project name"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isNameValid) {
                  handleRename();
                }
              }}
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
            <Button onClick={handleRename} disabled={!isNameValid || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Renaming...
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Rename
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
