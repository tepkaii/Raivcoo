// app/projects/[id]/TrackManager.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevButtons } from "@/components/ui/RevButtons";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  Loader2,
  ExternalLink,
  PlusCircle,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface Step {
  name: string;
  status: string;
  deliverable_link?: string | null;
}

interface Track {
  id: string;
  project_id: string;
  round_number: number;
  status: string;
  steps: Step[];
  created_at: string;
  updated_at: string;
}

interface TrackManagerProps {
  track: Track;
  updateProjectTrack: (
    trackId: string,
    stepIndex: number,
    status: string,
    linkValue?: string
  ) => Promise<any>;
  completeTrackAndCreateNewRound: (trackId: string) => Promise<any>;
  completeProject: (projectId: string) => Promise<any>;
}

export default function TrackManager({
  track,
  updateProjectTrack,
  completeTrackAndCreateNewRound,
  completeProject,
}: TrackManagerProps) {
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [isReverting, setIsReverting] = useState<number | null>(null);
  const [isCompletingRound, setIsCompletingRound] = useState(false);
  const [isCompletingProject, setIsCompletingProject] = useState(false);
  const [deliverableLink, setDeliverableLink] = useState("");

  // Make sure track has steps
  const steps = track.steps || [];

  // Get index of the Finish step
  const finishStepIndex = steps.findIndex((step) => step.name === "Finish");

  // Check if all steps before Finish are completed
  const allPriorStepsCompleted =
    finishStepIndex > 0
      ? steps
          .slice(0, finishStepIndex)
          .every((step) => step.status === "completed")
      : true;

  // Find the current step (first non-completed step)
  const currentStepIndex = steps.findIndex(
    (step) => step.status !== "completed"
  );

  const handleUpdateStep = async (stepIndex: number) => {
    // Don't allow completing a step if previous steps aren't completed
    if (stepIndex > 0 && steps[stepIndex - 1].status !== "completed") {
      toast({
        title: "Error",
        description: "You must complete previous steps first",
        variant: "destructive",
      });
      return;
    }

    // Don't allow completing Finish step if prior steps aren't completed
    if (stepIndex === finishStepIndex && !allPriorStepsCompleted) {
      toast({
        title: "Error",
        description: "You must complete all previous steps before finishing",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(stepIndex);
    try {
      await updateProjectTrack(track.id, stepIndex, "completed");
      toast({
        title: "Success",
        description: "Step marked as completed",
        variant: "success",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update step",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRevertStep = async (stepIndex: number) => {
    // Don't allow reverting a step if later steps are completed
    const nextStepCompleted =
      stepIndex < steps.length - 1 &&
      steps[stepIndex + 1].status === "completed";

    if (nextStepCompleted) {
      toast({
        title: "Error",
        description: "You must revert later steps first",
        variant: "destructive",
      });
      return;
    }

    setIsReverting(stepIndex);
    try {
      await updateProjectTrack(track.id, stepIndex, "pending");
      toast({
        title: "Success",
        description: "Step reverted to pending",
        variant: "success",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to revert step",
        variant: "destructive",
      });
    } finally {
      setIsReverting(null);
    }
  };

  const handleSubmitDeliverable = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!deliverableLink) {
      toast({
        title: "Error",
        description: "Please provide a deliverable link",
        variant: "destructive",
      });
      return;
    }

    if (!allPriorStepsCompleted) {
      toast({
        title: "Error",
        description:
          "You must complete all previous steps before submitting the deliverable",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(finishStepIndex);
    try {
      await updateProjectTrack(
        track.id,
        finishStepIndex,
        "completed",
        deliverableLink
      );
      toast({
        title: "Success",
        description: "Deliverable submitted successfully",
        variant: "success",
      });
      setDeliverableLink("");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit deliverable",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCompleteRound = async () => {
    setIsCompletingRound(true);
    try {
      await completeTrackAndCreateNewRound(track.id);
      toast({
        title: "Success",
        description: "Round completed and new round created",
        variant: "success",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to complete round",
        variant: "destructive",
      });
    } finally {
      setIsCompletingRound(false);
    }
  };

  const handleCompleteProject = async () => {
    setIsCompletingProject(true);
    try {
      await completeProject(track.project_id);
      toast({
        title: "Success",
        description: "Project marked as completed",
        variant: "success",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to complete project",
        variant: "destructive",
      });
    } finally {
      setIsCompletingProject(false);
    }
  };

  // Find if there's a finish step with a deliverable link
  const finishStep = steps.find(
    (step) =>
      step.name === "Finish" &&
      step.status === "completed" &&
      step.deliverable_link
  );

  const allStepsCompleted = steps.every((step) => step.status === "completed");

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Round {track.round_number}</CardTitle>
          <Badge variant={track.status === "completed" ? "success" : "warning"}>
            {track.status === "completed" ? "Completed" : "In Progress"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {steps.length > 0 ? (
          <>
            {/* Horizontal step indicator */}
            <div className="mb-8 py-4">
              <div className="relative flex items-center justify-between">
                {steps.map((step, index) => (
                  <React.Fragment key={index}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                          step.status === "completed"
                            ? "bg-green-500 text-white"
                            : index === currentStepIndex
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200"
                        }`}
                      >
                        {step.status === "completed" ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className="text-xs mt-1 max-w-[80px] text-center">
                        {step.name}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-1 ${
                          index < currentStepIndex
                            ? "bg-green-500"
                            : "bg-gray-200"
                        }`}
                      ></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      {step.status === "completed" ? (
                        <CheckCircle className="text-green-500 h-5 w-5" />
                      ) : index === currentStepIndex ? (
                        <Clock className="text-blue-500 h-5 w-5" />
                      ) : (
                        <Clock className="text-gray-400 h-5 w-5" />
                      )}
                      <span
                        className={`font-medium ${index === currentStepIndex ? "text-blue-600" : ""}`}
                      >
                        {step.name}
                      </span>
                    </div>

                    {step.status === "completed" ? (
                      <div className="flex items-center gap-2">
                        {step.name === "Finish" && step.deliverable_link ? (
                          <a
                            href={step.deliverable_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline mr-2"
                          >
                            View Deliverable{" "}
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}

                        <RevButtons
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevertStep(index)}
                          disabled={isReverting === index}
                        >
                          {isReverting === index ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              Reverting...
                            </>
                          ) : (
                            <>
                              <ArrowLeft className="h-4 w-4 mr-1" />
                              Revert
                            </>
                          )}
                        </RevButtons>
                      </div>
                    ) : (
                      <RevButtons
                        size="sm"
                        variant={
                          index === currentStepIndex ? "success" : "outline"
                        }
                        onClick={() => handleUpdateStep(index)}
                        disabled={
                          isUpdating === index ||
                          index !== currentStepIndex ||
                          (index === finishStepIndex && !allPriorStepsCompleted)
                        }
                      >
                        {isUpdating === index ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            Updating...
                          </>
                        ) : index === finishStepIndex ? (
                          "Submit Deliverable"
                        ) : (
                          "Mark Complete"
                        )}
                      </RevButtons>
                    )}
                  </div>
                ))}
              </div>

              {/* Deliverable submission form - only show when Finish step is the current step and all prior steps are completed */}
              {track.status !== "completed" &&
                currentStepIndex === finishStepIndex &&
                allPriorStepsCompleted &&
                !finishStep && (
                  <form
                    onSubmit={handleSubmitDeliverable}
                    className="mt-4 border-t pt-4"
                  >
                    <h3 className="font-medium mb-2">Submit Deliverable</h3>
                    <div className="flex items-center gap-2">
                      <Input
                        type="url"
                        placeholder="Paste Google Drive, Dropbox, or YouTube link..."
                        value={deliverableLink}
                        onChange={(e) => setDeliverableLink(e.target.value)}
                        className="flex-1"
                        required
                      />
                      <RevButtons
                        type="submit"
                        variant="warning"
                        disabled={!deliverableLink || isUpdating !== null}
                      >
                        Submit
                      </RevButtons>
                    </div>
                  </form>
                )}

              {/* Instructions for next steps if not all prior steps are completed */}
              {track.status !== "completed" &&
                currentStepIndex === finishStepIndex &&
                !allPriorStepsCompleted && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
                    <AlertCircle className="text-amber-500 h-5 w-5 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">
                        Complete previous steps
                      </p>
                      <p className="text-sm text-amber-700">
                        You need to complete all previous steps before you can
                        submit the final deliverable.
                      </p>
                    </div>
                  </div>
                )}

              {/* Track actions */}

              <div className="mt-6 border-t pt-4 space-y-3">
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/projects/${track.project_id}/review/${track.id}`}
                    passHref
                  >
                    <RevButtons className="w-full" variant="outline">
                      View Review Page
                    </RevButtons>
                  </Link>
                  <RevButtons
                    className="w-full mt-2"
                    variant="outline"
                    onClick={() => {
                      const reviewUrl = `${window.location.origin}/projects/${track.project_id}/review/${track.id}`;
                      navigator.clipboard.writeText(reviewUrl);
                      toast({
                        title: "Review link copied!",
                        description: "Link has been copied to clipboard",
                        variant: "success",
                      });
                    }}
                  >
                    Copy Review Link for Client
                  </RevButtons>
                  <div className="flex gap-2">
                    <RevButtons
                      variant="warning"
                      className="flex-1"
                      onClick={handleCompleteRound}
                      disabled={isCompletingRound}
                    >
                      {isCompletingRound ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Start New Round
                        </>
                      )}
                    </RevButtons>

                    <RevButtons
                      variant="success"
                      className="flex-1"
                      onClick={handleCompleteProject}
                      disabled={isCompletingProject}
                    >
                      {isCompletingProject ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          Completing...
                        </>
                      ) : (
                        "Complete Project"
                      )}
                    </RevButtons>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="py-10 text-center">
            <p className="text-muted-foreground">
              No workflow steps found for this track.
            </p>
            <p className="text-sm mt-2">
              This may be due to a data loading issue. Try refreshing the page.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
