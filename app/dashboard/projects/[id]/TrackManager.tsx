// app/dashboard/projects/[id]/TrackManager.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  Loader2,
  ArrowLeft,
  Eye,
  Copy,
  Hourglass,
  ShieldCheck,
  ShieldX,
  Edit,
  GripVertical,
  Save,
} from "lucide-react";

import { StepCommentsSection } from "./StepCommentsSection";
import { EditableComment } from "./EditableComment";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { RevButtons } from "@/components/ui/RevButtons";

export interface Step {
  name?: string;
  status: "pending" | "completed";
  is_final?: boolean;
  deliverable_link?: string | null;
  metadata?: {
    type: "comment" | "general_revision";
    comment_id?: string;
    text?: string;
    timestamp?: number;
    images?: string[];
    links?: { url: string; text: string }[];
    created_at?: string;
    step_index?: number;
  };
}

interface Track {
  id: string;
  project_id: string;
  round_number: number;
  status: string;
  client_decision: string;
  steps: Step[];
  created_at: string;
  updated_at: string;
}

interface TrackManagerProps {
  track: Track;
  updateProjectTrackStepStatus: (
    trackId: string,
    stepIndex: number,
    status: "pending" | "completed",
    linkValue?: string
  ) => Promise<any>;
  updateTrackStructure: (
    trackId: string,
    newStepsStructure: Omit<Step, "status" | "deliverable_link" | "is_final">[]
  ) => Promise<any>;
  updateStepContent: (formData: FormData) => Promise<any>;
}

export default function TrackManager({
  track,
  updateProjectTrackStepStatus,
  updateTrackStructure,
  updateStepContent,
}: TrackManagerProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
  const [isSubmittingDeliverable, setIsSubmittingDeliverable] = useState(false);
  const [deliverableLink, setDeliverableLink] = useState("");
  const [isCommentsEditMode, setIsCommentsEditMode] = useState(false);
  const [editableSteps, setEditableSteps] = useState<Step[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const originalSteps = useMemo(() => track.steps || [], [track.steps]);

  useEffect(() => {
    setEditableSteps(originalSteps);
  }, [originalSteps]);

  const finalStepIndexOriginal = useMemo(
    () => originalSteps.findIndex((step) => step.is_final),
    [originalSteps]
  );
  const finalStepOriginal = useMemo(
    () =>
      finalStepIndexOriginal !== -1
        ? originalSteps[finalStepIndexOriginal]
        : null,
    [originalSteps, finalStepIndexOriginal]
  );

  useEffect(() => {
    setDeliverableLink(finalStepOriginal?.deliverable_link || "");
  }, [finalStepOriginal?.deliverable_link]);

  const allOtherStepsCompletedOriginal = useMemo(
    () =>
      finalStepIndexOriginal !== -1
        ? originalSteps
            .filter((_, i) => i !== finalStepIndexOriginal)
            .every((step) => step.status === "completed")
        : originalSteps.every((step) => step.status === "completed"),
    [originalSteps, finalStepIndexOriginal]
  );

  const isFinalStepCompletedOriginal =
    finalStepOriginal?.status === "completed";
  const isAwaitingClient =
    isFinalStepCompletedOriginal && track.client_decision === "pending";
  const isClientActionDone = track.client_decision !== "pending";

  const handleUpdateStepStatus = useCallback(
    async (stepIndex: number, newStatus: "pending" | "completed") => {
      if (isClientActionDone) return;
      const stepToUpdate = originalSteps[stepIndex];
      if (!stepToUpdate) return;
      const isFinal = stepToUpdate.is_final;

      if (
        isFinal &&
        newStatus === "completed" &&
        !allOtherStepsCompletedOriginal
      ) {
        toast({
          title: "Action Required",
          description: "All other steps must be complete first.",
          variant: "default",
        });
        return;
      }
      if (isFinal && newStatus === "completed" && !deliverableLink.trim()) {
        toast({
          title: "Action Required",
          description: "Please provide the deliverable link.",
          variant: "destructive",
        });
        return;
      }

      setIsUpdatingStatus(stepIndex);
      try {
        const linkParam =
          isFinal && newStatus === "completed" ? deliverableLink : undefined;
        await updateProjectTrackStepStatus(
          track.id,
          stepIndex,
          newStatus,
          linkParam
        );
        if (isFinal && newStatus === "pending") setDeliverableLink("");
      } catch (error: any) {
        console.error(
          `Error updating step ${stepIndex} to ${newStatus}:`,
          error
        );
        toast({
          title: "Error",
          description: error.message || `Failed to update step`,
          variant: "destructive",
        });
      } finally {
        setIsUpdatingStatus(null);
      }
    },
    [
      isClientActionDone,
      originalSteps,
      allOtherStepsCompletedOriginal,
      deliverableLink,
      updateProjectTrackStepStatus,
      track.id,
    ]
  );

  const handleSubmitDeliverable = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (finalStepIndexOriginal === -1 || isClientActionDone) return;
      if (!deliverableLink.trim()) {
        toast({
          title: "Error",
          description: "Please provide a deliverable link",
          variant: "destructive",
        });
        return;
      }
      if (!allOtherStepsCompletedOriginal) {
        toast({
          title: "Error",
          description: "Complete all other steps first",
          variant: "destructive",
        });
        return;
      }

      setIsSubmittingDeliverable(true);
      await handleUpdateStepStatus(finalStepIndexOriginal, "completed");
      setIsSubmittingDeliverable(false);
    },
    [
      finalStepIndexOriginal,
      isClientActionDone,
      deliverableLink,
      allOtherStepsCompletedOriginal,
      handleUpdateStepStatus,
    ]
  );

  const copyReviewLink = useCallback((projectId: string, trackId: string) => {
    if (!projectId || !trackId) return;
    const reviewUrl = `${window.location.origin}/review/${trackId}`;
    navigator.clipboard.writeText(reviewUrl);
    toast({
      title: "Review link copied!",
      description: "Share this link with your client.",
      variant: "success",
    });
  }, []);

  const handleSaveStepContent = useCallback(
    async (formData: FormData) => {
      if (!updateStepContent || isClientActionDone) return;
      try {
        await updateStepContent(formData);
        toast({
          title: "Success",
          description: "Step content updated.",
          variant: "success",
        });
        // Data refreshes via revalidation
      } catch (error) {
        console.error("Error updating step content:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to update step content",
          variant: "destructive",
        });
        throw error; // Allow EditableComment to handle its state
      }
    },
    [updateStepContent, track.id, isClientActionDone] // Include track.id dependency
  );

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || destination.index === source.index) return;

    const sourceStep = editableSteps[source.index];
    const nonFinalStepsCount = editableSteps.filter((s) => !s.is_final).length;

    if (sourceStep.is_final) {
      toast({
        title: "Action Denied",
        description: "The 'Final Deliverable' step cannot be reordered.",
        variant: "warning",
      });
      return;
    }
    if (destination.index >= nonFinalStepsCount) {
      toast({
        title: "Action Denied",
        description:
          "Steps cannot be placed after the 'Final Deliverable' step.",
        variant: "warning",
      });
      return;
    }

    const items = Array.from(editableSteps);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);
    setEditableSteps(items);
  };

  const handleSaveOrder = async () => {
    if (!updateTrackStructure || !isCommentsEditMode || isClientActionDone)
      return;
    setIsSavingOrder(true);
    try {
      // Prepare structure excluding the final step for the action
      const newStructure = editableSteps
        .filter((step) => !step.is_final)
        .map((step) => ({
          name: step.name, // Pass existing name
          metadata: {
            // Pass relevant metadata, esp. comment_id
            comment_id: step.metadata?.comment_id,
            text: step.metadata?.text,
            images: step.metadata?.images,
            links: step.metadata?.links,
            type: step.metadata?.type,
            created_at: step.metadata?.created_at,
            // DO NOT PASS status, is_final, deliverable_link
          },
        }));

      await updateTrackStructure(track.id, newStructure);
      toast({
        title: "Success",
        description: "Workflow order updated.",
        variant: "success",
      });
      setIsCommentsEditMode(false); // Exit edit mode on success
    } catch (error) {
      console.error("Error saving order:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save order",
        variant: "destructive",
      });
    } finally {
      setIsSavingOrder(false);
    }
  };

  let displayStatus = "In Progress";
  let statusVariant: "warning" | "success" | "info" | "destructive" = "warning";
  let StatusIcon = Clock;
  if (isAwaitingClient) {
    displayStatus = "Awaiting Client Review";
    statusVariant = "warning";
    StatusIcon = Hourglass;
  } else if (track.client_decision === "approved") {
    displayStatus = "Client Approved";
    statusVariant = "success";
    StatusIcon = ShieldCheck;
  } else if (track.client_decision === "revisions_requested") {
    displayStatus = "Client Requested Revisions";
    statusVariant = "destructive";
    StatusIcon = ShieldX;
  }

  const stepsToRender = isCommentsEditMode ? editableSteps : originalSteps;
  const draggableIdPrefix = `step-${track.id}`; // Base for draggable IDs

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-3 flex-wrap   rounded-xl">
            <CardTitle className="text-lg sm:text-xl">
              Round {track.round_number}
            </CardTitle>
            <Badge
              variant={statusVariant}
              className="flex items-center gap-1 text-xs sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1"
            >
              <StatusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {displayStatus}
            </Badge>
          </div>
          {!isClientActionDone && (
            <div className="flex items-center gap-2">
              {isCommentsEditMode ? (
                <>
                  <RevButtons
                    variant="success"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={handleSaveOrder}
                    disabled={isSavingOrder}
                  >
                    {isSavingOrder ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Save Order</span>
                  </RevButtons>
                  <RevButtons
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => {
                      setIsCommentsEditMode(false);
                      setEditableSteps(originalSteps);
                    }}
                    disabled={isSavingOrder}
                  >
                    Cancel
                  </RevButtons>
                </>
              ) : (
                <RevButtons
                  variant="info"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => {
                    setEditableSteps([...originalSteps]);
                    setIsCommentsEditMode(true);
                  }}
                  disabled={isClientActionDone}
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit Steps</span>
                </RevButtons>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <hr className="mb-4" />
      <CardContent>
        {stepsToRender.length > 0 ? (
          isCommentsEditMode ? (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId={`steps-${track.id}`}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {stepsToRender.map((step, index) => {
                      const isFinalStep = step.is_final;
                      // Use comment_id for stability if available, otherwise index
                      const draggableId = `${draggableIdPrefix}-${step.metadata?.comment_id || `index-${index}`}`;
                      const isDragDisabled = isFinalStep;

                      return (
                        <Draggable
                          key={draggableId}
                          draggableId={draggableId}
                          index={index}
                          isDragDisabled={isDragDisabled}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-start gap-2 p-1 rounded ${snapshot.isDragging ? "" : ""} ${isFinalStep ? "opacity-70 bg-muted/30 pl-8" : ""}`}
                            >
                              {!isFinalStep && (
                                <div
                                  {...provided.dragHandleProps}
                                  className="p-2 cursor-grab hover:bg-accent rounded mt-8"
                                >
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1">
                                {isFinalStep ? (
                                  <div className="border rounded-lg p-4 h-[180px] flex items-center justify-center text-muted-foreground italic bg-card"></div>
                                ) : (
                                  <EditableComment
                                    trackId={track.id}
                                    step={step}
                                    index={index}
                                    onSave={handleSaveStepContent}
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="space-y-3">
              {stepsToRender.map((step, index) => {
                const isCompleted = step.status === "completed";
                const isFinalStep = step.is_final;
                const isLoadingStatus = isUpdatingStatus === index;
                const canInteract = !isClientActionDone;
                const canRevert = isCompleted && canInteract;
                const canComplete = !isCompleted && canInteract && !isFinalStep;
                const viewKey = `step-view-${track.id}-${step.metadata?.comment_id || index}`;

                return (
                  <>
                    <div
                      key={viewKey}
                      className={`flex flex-col y ${isClientActionDone ? "bg-muted/50 opacity-75" : ""}`}
                    >
                      <div className="flex justify-end items-end w-full mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap justify-end w-full sm:w-auto pl-7 sm:pl-0 mt-2 sm:mt-0">
                          {canRevert && (
                            <RevButtons
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleUpdateStepStatus(index, "pending")
                              }
                              disabled={isLoadingStatus}
                              title="Revert to pending"
                              className={
                                isLoadingStatus
                                  ? "cursor-not-allowed opacity-50"
                                  : ""
                              }
                            >
                              {isLoadingStatus ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ArrowLeft className="h-4 w-4 mr-1" />
                              )}
                              <span className="hidden sm:inline">Revert</span>
                            </RevButtons>
                          )}
                          {canComplete && (
                            <RevButtons
                              size="sm"
                              variant="success"
                              onClick={() =>
                                handleUpdateStepStatus(index, "completed")
                              }
                              disabled={isLoadingStatus}
                              title="Mark as complete"
                              className={
                                isLoadingStatus
                                  ? "cursor-not-allowed opacity-50"
                                  : ""
                              }
                            >
                              {isLoadingStatus ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  ...
                                </>
                              ) : (
                                "Mark Complete"
                              )}
                            </RevButtons>
                          )}
                        </div>
                      </div>

                      <div className="flex  gap-2">
                        <div className="">
                          {isCompleted ? (
                            <CheckCircle className="text-green-500 h-5 w-5 flex-shrink-0" />
                          ) : (
                            <Clock
                              className={`h-5 w-5 flex-shrink-0 ${!isClientActionDone ? "text-blue-500" : "text-gray-400"}`}
                            />
                          )}
                        </div>
                        <div className="p-3 border-2 border-dashed border-muted-foreground/30 rounded-md text-sm">
                          <StepCommentsSection
                            step={step}
                            isFinalStep={isFinalStep}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                );
              })}
            </div>
          )
        ) : (
          <div className="py-10 text-center text-muted-foreground">
            This track has no defined steps.
          </div>
        )}

        {!isCommentsEditMode &&
          stepsToRender.length > 0 &&
          !isFinalStepCompletedOriginal &&
          finalStepIndexOriginal !== -1 &&
          allOtherStepsCompletedOriginal &&
          !isClientActionDone && (
            <form
              onSubmit={handleSubmitDeliverable}
              className="mt-5 pt-4 border-t"
            >
              <Label
                htmlFor={`deliverable-link-${track.id}`}
                className="font-medium mb-2 text-base block"
              >
                Submit Deliverable Link (Final Step)
              </Label>
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <Input
                  id={`deliverable-link-${track.id}`}
                  type="url"
                  placeholder="Paste shareable link..."
                  value={deliverableLink}
                  onChange={(e) => setDeliverableLink(e.target.value)}
                  className="flex-1 h-10"
                  required
                  disabled={isSubmittingDeliverable}
                />
                <RevButtons
                  type="submit"
                  variant="success"
                  className="h-10"
                  disabled={!deliverableLink.trim() || isSubmittingDeliverable}
                  title="Submit and Complete Round"
                >
                  {isSubmittingDeliverable ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Submit & Complete Round
                </RevButtons>
              </div>
            </form>
          )}

        {!isCommentsEditMode && (
          <div className="mt-6 border-t pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href={`/review/${track.id}`} passHref className="flex-1">
                <RevButtons className="w-full" variant="outline">
                  <Eye className="h-4 w-4 mr-2" /> View Client Review Page
                </RevButtons>
              </Link>
              <RevButtons
                className="flex-1"
                variant="info"
                onClick={() => copyReviewLink(track.project_id, track.id)}
              >
                <Copy className="h-4 w-4 mr-2" /> Copy Client Review Link
              </RevButtons>
            </div>
            {isAwaitingClient && (
              <div className="text-center text-sm  p-3 bg-[#F59E0B] rounded-md  border-[2px] border-[#3F3F3F] flex items-center justify-center gap-2">
                <Hourglass className="h-4 w-4 " /> Waiting for client
                feedback...
              </div>
            )}
            {isClientActionDone && (
              <div
                className={`text-center text-sm p-3 border-[2px] border-[#3F3F3F] rounded-md  flex items-center justify-center gap-2 ${track.client_decision === "approved" ? "bg-[#10B981] " : "bg-[#F43F5E]"}`}
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
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
