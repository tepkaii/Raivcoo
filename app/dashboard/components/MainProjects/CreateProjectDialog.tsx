// app/dashboard/projects/components/CreateProjectDialog.tsx
"use client";

import React, { useState } from "react";
import { Plus, Loader2, CheckCircle2, Crown, Lock } from "lucide-react";
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
import { ReferenceInput } from "./ReferenceInput";
import { type ProjectReference } from "@/app/review/[token]/lib/reference-links";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface CreateProjectDialogProps {
  createProjectAction: (formData: FormData) => Promise<{
    message: string;
    project: any;
  }>;
  currentProjectCount: number;
}

export function CreateProjectDialog({
  createProjectAction,
  currentProjectCount,
}: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdProject, setCreatedProject] = useState<any>(null);
  const [references, setReferences] = useState<ProjectReference[]>([]);

  // Free plan limit is 2 projects
  const FREE_PROJECT_LIMIT = 2;
  const canCreateProject = currentProjectCount < FREE_PROJECT_LIMIT;
  const shouldShowIndicator = currentProjectCount >= 1; // Show indicator when at 1+ projects

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);

    try {
      // Add references to form data
      formData.append("references", JSON.stringify(references));

      const result = await createProjectAction(formData);

      setIsSuccess(true);
      setCreatedProject(result.project);

      toast({
        title: "Success",
        description: result.message,
        variant: "green",
      });

      // Close dialog after success - revalidatePath will update the UI automatically
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
      setIsSuccess(false);
      setCreatedProject(null);
      setIsLoading(false);
      setReferences([]);
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating...
        </>
      );
    }

    if (!canCreateProject) {
      return (
        <>
          <Crown className="h-4 w-4" />
          Upgrade to Pro
        </>
      );
    }

    return (
      <>
        <Plus className="h-4 w-4" />
        New Project
      </>
    );
  };

  const getTooltipText = () => {
    if (!canCreateProject) {
      return `Free plan allows ${FREE_PROJECT_LIMIT} projects. You have ${currentProjectCount}/${FREE_PROJECT_LIMIT}. Upgrade to Pro for unlimited projects.`;
    }

    return "Create a new project";
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div className="relative">
          <Button
            className="gap-2"
            size="sm"
            disabled={isLoading || !canCreateProject}
            variant={!canCreateProject ? "outline" : "default"}
            title={getTooltipText()}
          >
            {getButtonContent()}
          </Button>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isSuccess
              ? "Project Created Successfully!"
              : !canCreateProject
                ? "Upgrade Required"
                : "Create New Project"}
          </DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-6">
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

          <ReferenceInput
            references={references}
            onChange={setReferences}
            disabled={isLoading}
          />

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
      </DialogContent>
    </Dialog>
  );
}
