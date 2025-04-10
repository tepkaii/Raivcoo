"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RevButtons } from "@/components/ui/RevButtons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  Clock,
  Loader2,
  ExternalLink,
  ArrowLeft,
  Eye,
  Copy,
  Hourglass,
  ShieldCheck,
  ShieldX,
  Edit,
  Save,
  XCircle,
  Settings,
  PlusCircle,
  Trash2,
} from "lucide-react";
import Link from "next/link";

interface Step {
  name: string;
  status: "pending" | "completed";
  deliverable_link?: string | null;
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
    newStepsStructure: { name: string }[]
  ) => Promise<any>;
}

interface EditStepsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentSteps: Omit<Step, "status" | "deliverable_link">[];
  onSaveChanges: (newSteps: { name: string }[]) => Promise<void>;
  trackId: string;
  roundNumber: number;
}

const EditStepsDialog: React.FC<EditStepsDialogProps> = ({
  isOpen,
  onOpenChange,
  currentSteps,
  onSaveChanges,
  roundNumber,
}) => {
  const [editableSteps, setEditableSteps] = useState<
    { id: number; name: string }[]
  >([]);
  const [newStepName, setNewStepName] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [isSavingStructure, setIsSavingStructure] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditableSteps(
        currentSteps
          .filter((step) => step.name !== "Finish")
          .map((step, index) => ({ id: Date.now() + index, name: step.name }))
      );
      setNewStepName("");
      setEditingIndex(null);
      setEditingValue("");
      setIsSavingStructure(false);
    }
  }, [isOpen, currentSteps]);

  const handleAdd = useCallback(() => {
    const trimmedName = newStepName.trim();
    if (!trimmedName) return;
    if (trimmedName === "Finish") {
      toast({
        title: "Invalid Name",
        description: "Cannot add a step named 'Finish'.",
        variant: "destructive",
      });
      return;
    }
    if (editableSteps.some((s) => s.name === trimmedName)) {
      toast({
        title: "Duplicate Name",
        description: `A step named "${trimmedName}" already exists.`,
        variant: "destructive",
      });
      return;
    }
    setEditableSteps((prev) => [
      ...prev,
      { id: Date.now(), name: trimmedName },
    ]);
    setNewStepName("");
  }, [newStepName, editableSteps]);

  const handleRemove = useCallback(
    (idToRemove: number) => {
      setEditableSteps((prev) => prev.filter((step) => step.id !== idToRemove));
      if (editableSteps.length <= 1) {
        toast({
          title: "Minimum Steps Required",
          description: "Workflow must have at least one step.",
          variant: "default",
          duration: 2000,
        });
      }
    },
    [editableSteps]
  );

  const handleStartEdit = useCallback(
    (index: number) => {
      setEditingIndex(index);
      setEditingValue(editableSteps[index].name);
    },
    [editableSteps]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditingValue("");
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingIndex === null) return;
    const trimmedValue = editingValue.trim();
    if (!trimmedValue) {
      toast({
        title: "Invalid Name",
        description: "Step name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    if (trimmedValue === "Finish") {
      toast({
        title: "Invalid Name",
        description: "Cannot rename a step to 'Finish'.",
        variant: "destructive",
      });
      return;
    }
    if (
      editableSteps.some(
        (s, idx) => idx !== editingIndex && s.name === trimmedValue
      )
    ) {
      toast({
        title: "Duplicate Name",
        description: `A step named "${trimmedValue}" already exists.`,
        variant: "destructive",
      });
      return;
    }

    setEditableSteps((prev) => {
      const updated = [...prev];
      updated[editingIndex].name = trimmedValue;
      return updated;
    });
    handleCancelEdit();
  }, [editingIndex, editingValue, editableSteps, handleCancelEdit]);

  const moveStep = useCallback((index: number, direction: "up" | "down") => {
    setEditableSteps((prev) => {
      const newSteps = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newSteps.length) return prev;
      [newSteps[index], newSteps[targetIndex]] = [
        newSteps[targetIndex],
        newSteps[index],
      ];
      return newSteps;
    });
    // Adjust editing index if the moved item was being edited
    setEditingIndex((prevIdx) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (prevIdx === index) return targetIndex;
      if (prevIdx === targetIndex) return index;
      return prevIdx;
    });
  }, []);

  const handleDialogSaveChanges = async () => {
    if (editableSteps.length === 0) {
      toast({
        title: "Error",
        description: "Workflow must have at least one step.",
        variant: "destructive",
      });
      return;
    }
    setIsSavingStructure(true);
    try {
      const newStructure = editableSteps.map((step) => ({ name: step.name }));
      await onSaveChanges(newStructure);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving track structure:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update steps.",
        variant: "destructive",
      });
    } finally {
      setIsSavingStructure(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-5">
        <DialogHeader>
          <DialogTitle>Edit Workflow Steps (Round {roundNumber})</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {editableSteps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2 group">
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveStep(index, "up")}
                  disabled={
                    index === 0 || editingIndex !== null || isSavingStructure
                  }
                  className="disabled:opacity-30 h-4 w-4 p-0"
                >
                  ▲
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveStep(index, "down")}
                  disabled={
                    index === editableSteps.length - 1 ||
                    editingIndex !== null ||
                    isSavingStructure
                  }
                  className="disabled:opacity-30 h-4 w-4 p-0"
                >
                  ▼
                </Button>
              </div>

              {editingIndex === index ? (
                <>
                  <Input
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                    className="flex-1 h-9"
                    autoFocus
                    disabled={isSavingStructure}
                  />
                  <RevButtons
                    variant="info"
                    onClick={handleSaveEdit}
                    disabled={
                      isSavingStructure ||
                      !editingValue.trim() ||
                      editingValue.trim() === step.name
                    }
                  >
                    <Save className="h-4 w-4" />
                  </RevButtons>
                  <RevButtons
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSavingStructure}
                  >
                    <XCircle className="h-4 w-4" />
                  </RevButtons>
                </>
              ) : (
                <>
                  <span
                    className="flex-1 p-2 border border-transparent truncate"
                    title={step.name}
                  >
                    {step.name}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <RevButtons
                      variant="outline"
                      size="icon"
                      onClick={() => handleStartEdit(index)}
                      disabled={isSavingStructure}
                    >
                      {" "}
                      <Edit className="h-4 w-4" />{" "}
                    </RevButtons>
                    <RevButtons
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemove(step.id)}
                      disabled={isSavingStructure || editableSteps.length <= 1}
                      className="text-red-500 hover:text-red-600 disabled:opacity-50"
                    >
                      {" "}
                      <Trash2 className="h-4 w-4" />{" "}
                    </RevButtons>
                  </div>
                </>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2 pt-3 border-t">
            <Input
              placeholder="Add new step name..."
              value={newStepName}
              onChange={(e) => setNewStepName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              className="flex-1 h-9"
              disabled={isSavingStructure || editingIndex !== null}
            />
            <RevButtons
              variant="success"
              onClick={handleAdd}
              disabled={
                !newStepName.trim() ||
                isSavingStructure ||
                editingIndex !== null
              }
            >
              {" "}
              <PlusCircle className="h-4 w-4 mr-1" /> Add{" "}
            </RevButtons>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <RevButtons variant="outline" disabled={isSavingStructure}>
              Cancel
            </RevButtons>
          </DialogClose>
          <RevButtons
            variant={"info"}
            onClick={handleDialogSaveChanges}
            disabled={isSavingStructure || editableSteps.length === 0}
          >
            {isSavingStructure && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </RevButtons>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function TrackManager({
  track,
  updateProjectTrackStepStatus,
  updateTrackStructure,
}: TrackManagerProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
  const [isSubmittingDeliverable, setIsSubmittingDeliverable] = useState(false);
  const [deliverableLink, setDeliverableLink] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const steps = useMemo(() => track.steps || [], [track.steps]);
  const finishStepIndex = useMemo(
    () => steps.findIndex((step) => step.name === "Finish"),
    [steps]
  );
  const finishStep = useMemo(
    () => (finishStepIndex !== -1 ? steps[finishStepIndex] : null),
    [steps, finishStepIndex]
  );

  const editableStepsForDialog = useMemo(
    () =>
      steps
        .filter((step) => step.name !== "Finish")
        .map((step) => ({ name: step.name })),
    [steps]
  );

  useEffect(() => {
    setDeliverableLink(finishStep?.deliverable_link || "");
  }, [finishStep?.deliverable_link]);

  const allOtherStepsCompleted = useMemo(
    () =>
      finishStepIndex !== -1
        ? steps
            .filter((_, i) => i !== finishStepIndex)
            .every((step) => step.status === "completed")
        : steps.every((step) => step.status === "completed"),
    [steps, finishStepIndex]
  );

  const isFinishStepCompleted = finishStep?.status === "completed";
  const isAwaitingClient =
    isFinishStepCompleted && track.client_decision === "pending";
  const isClientActionDone = track.client_decision !== "pending";

  const handleUpdateStepStatus = useCallback(
    async (stepIndex: number, newStatus: "pending" | "completed") => {
      if (isClientActionDone) return;

      const stepToUpdate = steps[stepIndex];
      const isFinish = stepToUpdate.name === "Finish";

      if (isFinish && newStatus === "completed" && !allOtherStepsCompleted) {
        toast({
          title: "Action Required",
          description: "All other steps must be complete first.",
          variant: "default",
        });
        return;
      }
      if (isFinish && newStatus === "completed" && !deliverableLink.trim()) {
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
          isFinish && newStatus === "completed" ? deliverableLink : undefined;
        await updateProjectTrackStepStatus(
          track.id,
          stepIndex,
          newStatus,
          linkParam
        );
        if (isFinish && newStatus === "pending") setDeliverableLink("");
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
      steps,
      allOtherStepsCompleted,
      deliverableLink,
      updateProjectTrackStepStatus,
      track.id,
    ]
  );

  const handleSubmitDeliverable = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (finishStepIndex === -1 || isClientActionDone) return;
      if (!deliverableLink.trim()) {
        toast({
          title: "Error",
          description: "Please provide a deliverable link",
          variant: "destructive",
        });
        return;
      }
      if (!allOtherStepsCompleted) {
        toast({
          title: "Error",
          description: "Complete all other steps first",
          variant: "destructive",
        });
        return;
      }

      setIsSubmittingDeliverable(true);
      await handleUpdateStepStatus(finishStepIndex, "completed");
      setIsSubmittingDeliverable(false);
    },
    [
      finishStepIndex,
      isClientActionDone,
      deliverableLink,
      allOtherStepsCompleted,
      handleUpdateStepStatus,
    ]
  );

  const handleSaveChangesFromDialog = useCallback(
    async (newStepsStructure: { name: string }[]) => {
      try {
        await updateTrackStructure(track.id, newStepsStructure);
        toast({
          title: "Success",
          description: "Workflow steps updated.",
          variant: "success",
        });
      } catch (e) {
        // Error handled by Dialog itself now
        throw e; // Rethrow to allow dialog to catch and handle UI
      }
    },
    [track.id, updateTrackStructure]
  );

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
    statusVariant = "destructive";
    StatusIcon = ShieldX;
  }

  const copyReviewLink = useCallback((projectId: string, trackId: string) => {
    if (!projectId || !trackId) return;
    const reviewUrl = `${window.location.origin}/projects/${projectId}/review/${trackId}`;
    navigator.clipboard.writeText(reviewUrl);
    toast({
      title: "Review link copied!",
      description: "Client needs to log in to view.",
      variant: "success",
    });
  }, []);

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-3 flex-wrap border p-2 rounded-xl">
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

            {/* Added DialogTrigger here */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <RevButtons
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  disabled={isClientActionDone}
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit Steps</span>
                </RevButtons>
              </DialogTrigger>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {steps.length > 0 ? (
            <div className="space-y-3">
              {steps.map((step, index) => {
                const isCompleted = step.status === "completed";
                const isFinishStep = step.name === "Finish";
                const isLoadingStatus = isUpdatingStatus === index;
                const canInteract = !isClientActionDone;
                const canRevert = isCompleted && canInteract;
                const canComplete =
                  !isCompleted && canInteract && !isFinishStep;

                return (
                  <div
                    key={`step-${track.id}-${index}-${step.name}`}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 border rounded-md transition-opacity ${isClientActionDone ? "bg-muted/50 opacity-75" : ""}`}
                  >
                    <div className="flex-1 flex items-center gap-2 w-full sm:w-auto min-w-0">
                      {isCompleted ? (
                        <CheckCircle className="text-green-500 h-5 w-5 flex-shrink-0" />
                      ) : (
                        <Clock
                          className={`h-5 w-5 flex-shrink-0 ${!isClientActionDone ? "text-blue-500" : "text-gray-400"}`}
                        />
                      )}
                      <span className="font-medium truncate" title={step.name}>
                        {step.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end w-full sm:w-auto pl-7 sm:pl-0">
                      {isCompleted && isFinishStep && step.deliverable_link && (
                        <a
                          href={step.deliverable_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline text-sm p-1 mr-1"
                          title="View submitted deliverable"
                        >
                          <ExternalLink className="h-4 w-4" /> View Link
                        </a>
                      )}
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
                          )}{" "}
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
                      {!isCompleted &&
                        isFinishStep &&
                        !allOtherStepsCompleted &&
                        canInteract && (
                          <Badge
                            variant="outline"
                            className="text-xs font-normal px-2 py-0.5"
                          >
                            Waiting for other steps
                          </Badge>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              This track has no defined steps. Use 'Edit Steps' to add some.
            </div>
          )}

          {steps.length > 0 &&
            !isFinishStepCompleted &&
            finishStepIndex !== -1 &&
            allOtherStepsCompleted &&
            !isClientActionDone && (
              <form
                onSubmit={handleSubmitDeliverable}
                className="mt-5 pt-4 border-t"
              >
                <Label
                  htmlFor={`deliverable-link-${track.id}`}
                  className="font-medium mb-2 text-base block"
                >
                  Submit Deliverable Link (Finish Step)
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
                    variant="warning"
                    className="h-10"
                    disabled={
                      !deliverableLink.trim() || isSubmittingDeliverable
                    }
                    title="Submit and Complete Round"
                  >
                    {isSubmittingDeliverable ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : null}{" "}
                    Submit & Complete Round
                  </RevButtons>
                </div>
              </form>
            )}

          <div className="mt-6 border-t pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href={`/review/${track.id}`} passHref className="flex-1">
                <RevButtons className="w-full" variant="outline">
                  <Eye className="h-4 w-4 mr-2" /> View Review Page
                </RevButtons>
              </Link>
              <RevButtons
                className="flex-1"
                variant="outline"
                onClick={() => copyReviewLink(track.project_id, track.id)}
              >
                <Copy className="h-4 w-4 mr-2" /> Copy Review Link
              </RevButtons>
            </div>
            {isAwaitingClient && (
              <div className="text-center text-sm text-muted-foreground p-3 bg-blue-50 rounded-md border border-blue-200 flex items-center justify-center gap-2">
                <Hourglass className="h-4 w-4 text-blue-600" /> Waiting for
                client feedback...
              </div>
            )}
            {isClientActionDone && (
              <div
                className={`text-center text-sm p-3 rounded-md border flex items-center justify-center gap-2 ${track.client_decision === "approved" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}
              >
                {track.client_decision === "approved" ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : (
                  <ShieldX className="h-4 w-4" />
                )}{" "}
                Client decision:{" "}
                <span className="font-medium">
                  {track.client_decision.replace("_", " ")}
                </span>
                .
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EditStepsDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        currentSteps={editableStepsForDialog}
        onSaveChanges={handleSaveChangesFromDialog}
        trackId={track.id}
        roundNumber={track.round_number}
      />
    </>
  );
}
