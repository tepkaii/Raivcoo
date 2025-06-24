// app/dashboard/projects/new/ProjectForm.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RevButtons } from "@/components/ui/RevButtons";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface ProjectFormProps {
  createProject: (formData: FormData) => Promise<{
    message: string;
    project: any;
  }>;
}

export default function ProjectForm({ createProject }: ProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdProject, setCreatedProject] = useState<any>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await createProject(formData);

      setIsSuccess(true);
      setCreatedProject(result.project);

      toast({
        title: "Success",
        description: result.message,
        variant: "success",
      });
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

  const visitProjectPage = () => {
    if (createdProject?.id) {
      router.push(`/dashboard/projects/${createdProject.id}`);
    }
  };

  const createAnotherProject = () => {
    setIsSuccess(false);
    setCreatedProject(null);
  };

  // Success view
  if (isSuccess) {
    return (
      <Card className="mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 border-2 border-white/5 rounded-[10px] flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Project Created Successfully!
                </h2>
                <p className="text-muted-foreground mt-2">
                  Your workspace "{createdProject?.name}" is ready to go.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <RevButtons
                className="w-full"
                variant="default"
                onClick={visitProjectPage}
              >
                Open Workspace
              </RevButtons>

              <RevButtons
                className="w-full"
                variant="outline"
                onClick={createAnotherProject}
              >
                Create Another Project
              </RevButtons>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Form view
  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medium">Project Name</Label>
              <Input name="name" placeholder="Enter project name" required />
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Description (Optional)</Label>
              <Textarea
                name="description"
                placeholder="Brief description of your project"
                rows={3}
              />
            </div>
          </div>

          <RevButtons
            type="submit"
            variant="success"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Project...
              </>
            ) : (
              "Create Project Workspace"
            )}
          </RevButtons>
        </form>
      </CardContent>
    </Card>
  );
}
