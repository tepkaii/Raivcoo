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
import Image from "next/image";
import { formatTime } from "@/app/review/lib/utils";

const CommentTextWithLinks = ({
  text,
  links,
}: {
  text: string;
  links?: { url: string; text: string }[];
}) => {
  if (!text) return null;

  if (text.includes("[LINK:")) {
    let result = text;
    links?.forEach((link, index) => {
      result = result.replace(
        `[LINK:${index}]`,
        `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${link.text}</a>`
      );
    });
    return <div dangerouslySetInnerHTML={{ __html: result }} />;
  }

  return <div>{text}</div>;
};

interface Step {
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
  updateTrackStructure?: (
    trackId: string,
    newStepsStructure: { name: string }[]
  ) => Promise<any>;
}

const StepCommentsSection = ({
  step,
  isFinalStep,
}: {
  step: Step;
  isFinalStep: boolean;
}) => {
  if (!step.metadata || step.metadata.type !== "comment") return null;

  const commentData = {
    id: step.metadata.comment_id || "no-id",
    created_at: step.metadata.created_at || new Date().toISOString(),
    comment: {
      text: step.metadata.text || "",
      timestamp: step.metadata.timestamp || 0,
      images: step.metadata.images || [],
      links: step.metadata.links || [],
    },
    commenter_display_name: "Client",
  };

  return (
    <div className="pl-7 text-sm space-y-2">
      <div className="p-2 border rounded bg-muted/20">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>
            {commentData.commenter_display_name} at{" "}
            {formatTime(commentData.comment.timestamp)}
          </span>
          {isFinalStep &&
            commentData.comment.links &&
            commentData.comment.links.length > 0 && (
              <a
                href={commentData.comment.links[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View Link
              </a>
            )}
        </div>
        <CommentTextWithLinks
          text={commentData.comment.text}
          links={commentData.comment.links}
        />
        {commentData.comment.images &&
          commentData.comment.images.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {commentData.comment.images.map((imageUrl, idx) => (
                <a
                  key={idx}
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square rounded-md overflow-hidden border hover:border-primary transition-colors"
                >
                  <Image
                    src={imageUrl}
                    alt={`Comment image ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                </a>
              ))}
            </div>
          )}
      </div>
    </div>
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
  const finalStepIndex = useMemo(
    () => steps.findIndex((step) => step.is_final),
    [steps]
  );
  const finalStep = useMemo(
    () => (finalStepIndex !== -1 ? steps[finalStepIndex] : null),
    [steps, finalStepIndex]
  );

  useEffect(() => {
    setDeliverableLink(finalStep?.deliverable_link || "");
  }, [finalStep?.deliverable_link]);

  const allOtherStepsCompleted = useMemo(
    () =>
      finalStepIndex !== -1
        ? steps
            .filter((_, i) => i !== finalStepIndex)
            .every((step) => step.status === "completed")
        : steps.every((step) => step.status === "completed"),
    [steps, finalStepIndex]
  );

  const isFinalStepCompleted = finalStep?.status === "completed";
  const isAwaitingClient =
    isFinalStepCompleted && track.client_decision === "pending";
  const isClientActionDone = track.client_decision !== "pending";

  const handleUpdateStepStatus = useCallback(
    async (stepIndex: number, newStatus: "pending" | "completed") => {
      if (isClientActionDone) return;

      const stepToUpdate = steps[stepIndex];
      const isFinal = stepToUpdate.is_final;

      if (isFinal && newStatus === "completed" && !allOtherStepsCompleted) {
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
      if (finalStepIndex === -1 || isClientActionDone) return;
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
      await handleUpdateStepStatus(finalStepIndex, "completed");
      setIsSubmittingDeliverable(false);
    },
    [
      finalStepIndex,
      isClientActionDone,
      deliverableLink,
      allOtherStepsCompleted,
      handleUpdateStepStatus,
    ]
  );

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

  return (
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
          {updateTrackStructure && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setIsEditDialogOpen(true)}
              disabled={isClientActionDone}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Steps</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {steps.length > 0 ? (
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isCompleted = step.status === "completed";
              const isFinalStep = step.is_final;
              const isLoadingStatus = isUpdatingStatus === index;
              const canInteract = !isClientActionDone;
              const canRevert = isCompleted && canInteract;
              const canComplete = !isCompleted && canInteract && !isFinalStep;

              const displayText =
                step.metadata?.type === "comment"
                  ? step.metadata.text?.substring(0, 50) +
                    (step.metadata.text?.length > 50 ? "..." : "")
                  : isFinalStep
                    ? "Final Delivery"
                    : "Revision Task";

              return (
                <div
                  key={`step-${track.id}-${index}`}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 border rounded-md transition-opacity ${isClientActionDone ? "bg-muted/50 opacity-75" : ""}`}
                >
                  <div className="flex-1 flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-2 min-w-0">
                      {isCompleted ? (
                        <CheckCircle className="text-green-500 h-5 w-5 flex-shrink-0" />
                      ) : (
                        <Clock
                          className={`h-5 w-5 flex-shrink-0 ${!isClientActionDone ? "text-blue-500" : "text-gray-400"}`}
                        />
                      )}
                      <span
                        className="font-medium truncate"
                        title={displayText}
                      >
                        {displayText}
                      </span>
                    </div>
                    <StepCommentsSection
                      step={step}
                      isFinalStep={isFinalStep}
                    />
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end w-full sm:w-auto pl-7 sm:pl-0">
                    {isCompleted && isFinalStep && step.deliverable_link && (
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStepStatus(index, "pending")}
                        disabled={isLoadingStatus}
                        title="Revert to pending"
                        className={
                          isLoadingStatus ? "cursor-not-allowed opacity-50" : ""
                        }
                      >
                        {isLoadingStatus ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowLeft className="h-4 w-4 mr-1" />
                        )}
                        <span className="hidden sm:inline">Revert</span>
                      </Button>
                    )}
                    {canComplete && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() =>
                          handleUpdateStepStatus(index, "completed")
                        }
                        disabled={isLoadingStatus}
                        title="Mark as complete"
                        className={
                          isLoadingStatus ? "cursor-not-allowed opacity-50" : ""
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
                      </Button>
                    )}
                    {!isCompleted &&
                      isFinalStep &&
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
            This track has no defined steps.
          </div>
        )}

        {steps.length > 0 &&
          !isFinalStepCompleted &&
          finalStepIndex !== -1 &&
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
                <Button
                  type="submit"
                  variant="destructive"
                  className="h-10"
                  disabled={!deliverableLink.trim() || isSubmittingDeliverable}
                  title="Submit and Complete Round"
                >
                  {isSubmittingDeliverable ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Submit & Complete Round
                </Button>
              </div>
            </form>
          )}

        <div className="mt-6 border-t pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href={`/review/${track.id}`} passHref className="flex-1">
              <Button className="w-full" variant="outline">
                <Eye className="h-4 w-4 mr-2" /> View Review Page
              </Button>
            </Link>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => copyReviewLink(track.project_id, track.id)}
            >
              <Copy className="h-4 w-4 mr-2" /> Copy Review Link
            </Button>
          </div>
          {isAwaitingClient && (
            <div className="text-center text-sm text-muted-foreground p-3 bg-blue-50 rounded-md border border-blue-200 flex items-center justify-center gap-2">
              <Hourglass className="h-4 w-4 text-blue-600" /> Waiting for client
              feedback...
            </div>
          )}
          {isClientActionDone && (
            <div
              className={`text-center text-sm p-3 rounded-md border flex items-center justify-center gap-2 ${
                track.client_decision === "approved"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}