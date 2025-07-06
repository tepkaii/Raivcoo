// app/dashboard/projects/components/CreateProjectDialog.tsx (UPDATED)
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
import { ReferenceInput } from "./ReferenceInput";
import { type ProjectReference } from "@/app/review/[token]/lib/reference-links";

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
  const [references, setReferences] = useState<ProjectReference[]>([]);

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
      setTimeout(() => {
        setIsSuccess(false);
        setCreatedProject(null);
        setIsLoading(false);
        setReferences([]);
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

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
        )}
      </DialogContent>
    </Dialog>
  );
}
