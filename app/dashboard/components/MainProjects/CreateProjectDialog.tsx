// app/dashboard/components/MainProjects/CreateProjectDialog.tsx
"use client";

import React, { useState } from "react";
import { Plus, Loader2, Crown } from "lucide-react";
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
import { LockClosedIcon } from "@heroicons/react/24/solid";
import Lottie from "lottie-react";
import animationData from "../../../../public/assets/lottie/check-icon.json";
interface PlanLimits {
  maxProjects: number;
  planName: string;
  isActive: boolean;
  hasLimit: boolean;
}

interface Subscription {
  id: string;
  plan_id: string;
  plan_name: string;
  status: string;
  current_period_end: string | null;
}

interface CreateProjectDialogProps {
  createProjectAction: (formData: FormData) => Promise<{
    message: string;
    project: any;
  }>;
  currentProjectCount: number;
  planLimits: PlanLimits;
  subscription: Subscription | null;
}

export function CreateProjectDialog({
  createProjectAction,
  currentProjectCount,
  planLimits,
  subscription,
}: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdProject, setCreatedProject] = useState<any>(null);
  const [references, setReferences] = useState<ProjectReference[]>([]);

  // Check if user can create projects
  const canCreateProject =
    !planLimits.hasLimit || currentProjectCount < planLimits.maxProjects;
  const isAtLimit =
    planLimits.hasLimit && currentProjectCount >= planLimits.maxProjects;

  const handleSubmit = async (formData: FormData) => {
    if (!canCreateProject) {
      toast({
        title: "Project Limit Reached",
        description: `You've reached the ${planLimits.planName} plan limit of ${planLimits.maxProjects} projects. Upgrade to create unlimited projects.`,
        variant: "destructive",
      });
      return;
    }

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

    if (isAtLimit) {
      return (
        <>
          <Crown className="h-4 w-4" />
          Upgrade to Create More
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
  if (isAtLimit) {
    if (planLimits.planName === "Free") {
      return `Free plan allows ${planLimits.maxProjects} projects. You have ${currentProjectCount}/${planLimits.maxProjects}. Upgrade to Lite or Pro for more projects.`;
    } else if (planLimits.planName === "Lite") {
      return `Lite plan allows ${planLimits.maxProjects} projects. You have ${currentProjectCount}/${planLimits.maxProjects}. Upgrade to Pro for unlimited projects.`;
    }
    // Pro plan shouldn't hit this since it's unlimited, but just in case
    return `You have reached your plan limit of ${planLimits.maxProjects} projects.`;
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
          disabled={isLoading}
          variant={isAtLimit ? "outline" : "default"}
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
            : isAtLimit
              ? "Upgrade Required"
              : "Create New Project"}
        </DialogTitle>
      </DialogHeader>

      {isSuccess ? (
        <div className="space-y-4 text-center py-4">
          <Lottie
            animationData={animationData}
            autoplay
            loop={false}
            style={{ height: 50 }}
          />

          <div>
            <h3 className="text-lg font-semibold ">Project Created!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your project "{createdProject?.name}" has been created
              successfully.
            </p>
          </div>
        </div>
      ) : isAtLimit ? (
        <Card className="">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <LockClosedIcon className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-800">
                  Project Limit Reached
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  You've reached the {planLimits.planName} plan limit of{" "}
                  {planLimits.maxProjects} projects.
                  {planLimits.planName === "Free"
                    ? " Upgrade to Lite or Pro for more projects."
                    : " Upgrade to Pro for unlimited projects."}
                </p>
                <div className="mt-4">
                  <Link href="/pricing" className="inline-block">
                    <Button className="gap-2" size="sm">
                      <Crown className="h-4 w-4" />
                      View Pricing Plans
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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

          {planLimits.hasLimit && (
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {planLimits.planName} Plan: {currentProjectCount + 1}/
                  {planLimits.maxProjects} projects
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                {planLimits.planName === "Free"
                  ? "Upgrade to Lite or Pro for more projects."
                  : "Upgrade to Pro for unlimited projects."}
              </p>
            </div>
          )}
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
