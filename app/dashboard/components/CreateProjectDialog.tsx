// app/dashboard/projects/components/CreateProjectDialog.tsx
"use client";

import React, { useState } from "react";
import { Plus, Loader2, CheckCircle2 } from "lucide-react";
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

interface CreateProjectDialogProps {
  createProjectAction: (formData: FormData) => Promise<{
    message: string;
    project: any;
  }>;
}

export function CreateProjectDialog({
  createProjectAction,
}: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdProject, setCreatedProject] = useState<any>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);

    try {
      const result = await createProjectAction(formData);

      setIsSuccess(true);
      setCreatedProject(result.project);

      toast({
        title: "Success",
        description: result.message,
        variant: "success",
      });

      // Auto-close dialog after 1.5 seconds
      setTimeout(() => {
        setOpen(false);
      }, 1500);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when dialog closes
      setTimeout(() => {
        setIsSuccess(false);
        setCreatedProject(null);
        setIsLoading(false);
      }, 150);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2" size="sm" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              New Project
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-primary-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isSuccess ? "Project Created Successfully!" : "Create New Project"}
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="bg-green-700 p-2 rounded-[10px] border-2 border-black/20">
                <CheckCircle2 className="h-5 w-5 text-green-200" />
              </div>
              <div>
                <p className="font-medium">Project created successfully!</p>
                <p className="text-sm text-muted-foreground">
                  Your workspace "{createdProject?.name}" is ready to go.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter project name"
                className="mt-1"
                required
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}