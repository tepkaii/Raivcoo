// app/projects/[id]/TrackManager.tsx
"use client";

import React, { useState, useEffect } from "react";
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
  ArrowLeft,
  Eye,
  Copy,
  Hourglass, // For awaiting client
  ShieldCheck, // For client approved
  ShieldX, // For revisions requested
} from "lucide-react";
import Link from "next/link";

interface Step {
  name: string;
  status: string; // 'pending', 'completed'
  deliverable_link?: string | null;
}

interface Track {
  id: string;
  project_id: string;
  round_number: number;
  status: string; // Editor's progress: 'in_progress', 'completed' (maybe less relevant now)
  client_decision: string; // 'pending', 'approved', 'revisions_requested'
  steps: Step[];
  created_at: string;
  updated_at: string;
}

interface TrackManagerProps {
  track: Track;
  // ONLY pass the editor's action
  updateProjectTrack: (
    trackId: string,
    stepIndex: number,
    status: string,
    linkValue?: string
  ) => Promise<any>;
  // DO NOT pass completeTrackAndCreateNewRound or completeProject
}

export default function TrackManager({
  track,
  updateProjectTrack,
}: TrackManagerProps) {
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [isReverting, setIsReverting] = useState<number | null>(null);
  const [isSubmittingDeliverable, setIsSubmittingDeliverable] = useState(false);
  const [deliverableLink, setDeliverableLink] = useState("");

  const steps = track.steps || [];
  const finishStepIndex = steps.findIndex((step) => step.name === "Finish");
  const finishStep = finishStepIndex !== -1 ? steps[finishStepIndex] : null;

  useEffect(() => {
    if (finishStep?.deliverable_link) {
      setDeliverableLink(finishStep.deliverable_link);
    } else {
      setDeliverableLink("");
    }
  }, [finishStep?.deliverable_link]); // Depend only on the link

  const allPriorStepsCompleted =
    finishStepIndex >= 0
      ? steps
          .slice(0, finishStepIndex)
          .every((step) => step.status === "completed")
      : steps.every((step) => step.status === "completed"); // If no finish step, all must be complete

  const currentStepIndex = steps.findIndex(
    (step) => step.status !== "completed"
  );

  const isFinishStepCompleted = finishStep?.status === "completed";
  const isAwaitingClient =
    isFinishStepCompleted && track.client_decision === "pending";
  const isClientActionDone = track.client_decision !== "pending";

  // --- Step Update Handlers ---

  const handleUpdateStep = async (stepIndex: number) => {
    if (isClientActionDone) {
      toast({
        title: "Info",
        description: `Client has already ${track.client_decision}.`,
        variant: "default",
      });
      return;
    }
    if (stepIndex === finishStepIndex) return; // Finish step handled by deliverable form

    if (stepIndex > 0 && steps[stepIndex - 1].status !== "completed") {
      toast({
        title: "Error",
        description: "Complete previous steps first",
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
    } catch (error: any) {
      console.error("Error updating step:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update step",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRevertStep = async (stepIndex: number) => {
    if (isClientActionDone) {
      toast({
        title: "Info",
        description: `Client has already ${track.client_decision}. Cannot revert.`,
        variant: "default",
      });
      return;
    }
    const nextStepCompleted =
      stepIndex < steps.length - 1 &&
      steps[stepIndex + 1]?.status === "completed";
    if (nextStepCompleted) {
      toast({
        title: "Error",
        description: "Revert later steps first",
        variant: "destructive",
      });
      return;
    }

    setIsReverting(stepIndex);
    try {
      const isFinish = stepIndex === finishStepIndex;
      // Pass empty string to clear link ONLY for Finish step when reverting
      const linkValue = isFinish ? "" : undefined;
      await updateProjectTrack(track.id, stepIndex, "pending", linkValue);

      if (isFinish) setDeliverableLink(""); // Clear local state too

      toast({
        title: "Success",
        description: "Step reverted to pending",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Error reverting step:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to revert step",
        variant: "destructive",
      });
    } finally {
      setIsReverting(null);
    }
  };

  // --- Deliverable Form Handler (Finish Step) ---

  const handleSubmitDeliverable = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (isClientActionDone) {
      toast({
        title: "Info",
        description: `Client has already ${track.client_decision}. Cannot submit.`,
        variant: "default",
      });
      return;
    }
    if (!deliverableLink.trim()) {
      toast({
        title: "Error",
        description: "Please provide a deliverable link",
        variant: "destructive",
      });
      return;
    }
    if (finishStepIndex === -1) {
      toast({
        title: "Error",
        description: "Finish step not found.",
        variant: "destructive",
      });
      return;
    }
    if (!allPriorStepsCompleted) {
      toast({
        title: "Error",
        description: "Complete previous steps first",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingDeliverable(true);
    try {
      // Call updateProjectTrack for the Finish step, mark step 'completed', pass link
      await updateProjectTrack(
        track.id,
        finishStepIndex,
        "completed",
        deliverableLink
      );
      toast({
        title: "Success",
        description:
          "Deliverable submitted & step completed. Awaiting client review.",
        variant: "success",
      });
      // Keep link in input for viewing
    } catch (error: any) {
      console.error("Error submitting deliverable:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit deliverable",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingDeliverable(false);
    }
  };

  const copyReviewLink = () => {
    // Generate the review link - NOTE: No token needed now
    const reviewUrl = `${window.location.origin}/projects/${track.project_id}/review/${track.id}`;
    navigator.clipboard.writeText(reviewUrl);
    toast({
      title: "Review link copied!",
      description: "Client needs to log in to view.",
      variant: "success",
    });
  };

  // Determine if the deliverable form should be shown
  const showDeliverableForm =
    !isClientActionDone && // Client hasn't decided
    finishStepIndex !== -1 && // Finish step exists
    currentStepIndex === finishStepIndex && // Finish step is the next one
    allPriorStepsCompleted && // All previous steps are done
    !isFinishStepCompleted; // Finish step isn't already completed

  // Determine overall track display status for editor
  let displayStatus = "In Progress";
  let statusVariant: "warning" | "success" | "info" | "destructive" = "warning";
  let StatusIcon = Clock;

  if (isAwaitingClient) {
    displayStatus = "Awaiting Client Review";
    statusVariant = "info";
    StatusIcon = Hourglass;
  } else if (track.client_decision === "approved") {
    displayStatus = "Client Approved";
    statusVariant = "success";
    StatusIcon = ShieldCheck;
  } else if (track.client_decision === "revisions_requested") {
    displayStatus = "Client Requested Revisions";
    statusVariant = "destructive"; // Use destructive/red for requested revisions
    StatusIcon = ShieldX;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Round {track.round_number}</CardTitle>
          <Badge variant={statusVariant} className="flex items-center gap-1">
            <StatusIcon className="h-4 w-4" />
            {displayStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {steps.length > 0 ? (
          <>
            {/* Horizontal step indicator (same as before) */}
            <div className="mb-8 py-4"> {/* ... indicator logic ... */} </div>

            {/* Step Details List */}
            <div className="space-y-4">
              <div className="space-y-2">
                {steps.map((step, index) => {
                  const isFinishStep = index === finishStepIndex;
                  const isCompleted = step.status === "completed";
                  const isCurrent =
                    index === currentStepIndex && !isClientActionDone; // Only current if client hasn't decided
                  // Can interact if it's the current step OR if it's completed (to allow revert)
                  // AND client hasn't made a decision
                  const canInteract =
                    !isClientActionDone && (isCurrent || isCompleted);
                  const canRevert =
                    isCompleted &&
                    !isClientActionDone &&
                    !(
                      index < steps.length - 1 &&
                      steps[index + 1]?.status === "completed"
                    );

                  return (
                    <div
                      key={`step-detail-${index}`}
                      className={`flex items-center justify-between p-3 border rounded-md ${isClientActionDone ? "bg-muted/50 opacity-70" : ""}`} // Dim if client action done
                    >
                      {/* Step Name and Icon */}
                      <div className="flex items-center gap-2">
                        {/* ... icon logic (CheckCircle, Clock) ... */}
                        {isCompleted ? (
                          <CheckCircle className="text-green-500 h-5 w-5" />
                        ) : (
                          <Clock
                            className={`h-5 w-5 ${isCurrent ? "text-blue-500 animate-pulse" : "text-gray-400"}`}
                          />
                        )}
                        <span
                          className={`font-medium ${isCurrent ? "text-blue-600" : ""}`}
                        >
                          {step.name}
                        </span>
                      </div>

                      {/* Action Buttons / Info */}
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          // --- COMPLETED STATE ---
                          <>
                            {isFinishStep && step.deliverable_link && (
                              <a /* ... View Deliverable link ... */
                                href={step.deliverable_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:underline mr-2 text-sm"
                              >
                                {" "}
                                View Deliverable{" "}
                                <ExternalLink className="h-4 w-4" />{" "}
                              </a>
                            )}
                            <RevButtons
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevertStep(index)}
                              disabled={!canRevert || isReverting === index}
                              title={
                                !canRevert
                                  ? isClientActionDone
                                    ? `Client has ${track.client_decision}`
                                    : "Revert later steps first"
                                  : "Revert to pending"
                              }
                            >
                              {isReverting === index ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ArrowLeft className="h-4 w-4" />
                              )}
                              <span className="ml-1">Revert</span>
                            </RevButtons>
                          </>
                        ) : (
                          // --- PENDING STATE ---
                          <>
                            {isFinishStep ? (
                              // --- FINISH STEP (Pending) ---
                              <>
                                {!allPriorStepsCompleted && (
                                  <Badge variant="outline" className="text-xs">
                                    Waiting for previous steps
                                  </Badge>
                                )}
                                {/* The form below handles the action */}
                              </>
                            ) : (
                              // --- OTHER STEPS (Pending) ---
                              <RevButtons
                                size="sm"
                                variant={isCurrent ? "success" : "outline"}
                                onClick={() => handleUpdateStep(index)}
                                disabled={
                                  !isCurrent ||
                                  isUpdating === index ||
                                  isClientActionDone
                                }
                                title={
                                  !isCurrent
                                    ? "Complete previous steps first"
                                    : isClientActionDone
                                      ? `Client has ${track.client_decision}`
                                      : "Mark as complete"
                                }
                              >
                                {isUpdating === index ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />{" "}
                                    Updating...
                                  </>
                                ) : (
                                  "Mark Complete"
                                )}
                              </RevButtons>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Deliverable submission form - show only when needed */}
              {showDeliverableForm && (
                <form onSubmit={handleSubmitDeliverable} /* ... */>
                  <h3 className="font-medium mb-2">
                    Submit Deliverable for Finish Step
                  </h3>
                  <div className="flex items-center gap-2">
                    <Input
                      type="url"
                      placeholder="Paste Google Drive, Dropbox, YouTube link..."
                      value={deliverableLink}
                      onChange={(e) => setDeliverableLink(e.target.value)}
                      className="flex-1"
                      required
                      disabled={isSubmittingDeliverable || isClientActionDone}
                    />
                    <RevButtons
                      type="submit"
                      variant="warning"
                      disabled={
                        !deliverableLink.trim() ||
                        isSubmittingDeliverable ||
                        isClientActionDone
                      }
                      title={
                        isClientActionDone
                          ? `Client has ${track.client_decision}`
                          : ""
                      }
                    >
                      {isSubmittingDeliverable ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : null}
                      Submit & Complete Step
                    </RevButtons>
                  </div>
                </form>
              )}

              {/* Track Actions (Links for Editor) */}
              <div className="mt-6 border-t pt-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Link to Review Page (for editor preview) */}
                  <Link
                    href={`/projects/${track.project_id}/review/${track.id}`}
                    passHref
                    className="flex-1"
                  >
                    <RevButtons className="w-full" variant="outline">
                      <Eye className="h-4 w-4 mr-2" /> View Review Page
                      (Preview)
                    </RevButtons>
                  </Link>
                  {/* Copy Link Button */}
                  <RevButtons
                    className="flex-1"
                    variant="outline"
                    onClick={copyReviewLink}
                    // Disable copying if finish step isn't done? Or always allow?
                    // disabled={!isFinishStepCompleted}
                  >
                    <Copy className="h-4 w-4 mr-2" /> Copy Review Link for
                    Client
                  </RevButtons>
                </div>

                {/* Info box when awaiting client */}
                {isAwaitingClient && (
                  <div className="text-center text-sm text-muted-foreground p-3 bg-blue-50 rounded-md border border-blue-200 flex items-center justify-center gap-2">
                    <Hourglass className="h-4 w-4 text-blue-600" />
                    Deliverable submitted. Waiting for client feedback and
                    decision on the review page.
                  </div>
                )}
                {/* Info box when client action is done */}
                {isClientActionDone && (
                  <div
                    className={`text-center text-sm p-3 rounded-md border flex items-center justify-center gap-2 ${track.client_decision === "approved" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}
                  >
                    {track.client_decision === "approved" ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <ShieldX className="h-4 w-4" />
                    )}
                    Client decision:{" "}
                    <span className="font-medium">
                      {track.client_decision.replace("_", " ")}
                    </span>
                    .
                    {track.client_decision === "revisions_requested" &&
                      " A new round has been created."}
                  </div>
                )}

                {/* REMOVED Client Action Buttons (Approve/Request Revisions) - They belong on ReviewPage */}
              </div>
            </div>
          </>
        ) : (
          <div className="py-10 text-center">
            {" "}
            {/* ... No steps message ... */}{" "}
          </div>
        )}
      </CardContent>
    </Card>
  );
}