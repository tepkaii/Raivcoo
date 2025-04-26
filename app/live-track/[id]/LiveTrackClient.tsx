"use client";

import { useState } from "react";
import Link from "next/link";
import { RevButtons } from "@/components/ui/RevButtons";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import {
  ExternalLink,
  ShieldCheck,
  ShieldX,
  Hourglass,
  Flag,
  Calendar,
  Clock,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { CommentTextWithLinks } from "@/app/dashboard/projects/[id]/CommentRenderer";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline: string;
  created_at: string;
  client: {
    id: string;
    name: string;
  };
}

interface Track {
  id: string;
  project_id: string;
  round_number: number;
  status: string;
  steps: Array<{
    status: string;
    metadata?: {
      text: string;
      links?: Array<{ url: string; text: string }>;
      images?: string[];
    };
    deliverable_link?: string;
  }>;
  client_decision?: string;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: string;
  created_at: string;
  comment: {
    text: string;
    timestamp: number;
    images: string[];
    links: Array<{ url: string; text: string }>;
  };
}

export default function LiveTrackClient({
  project,
  tracks,
  activeTrack,
  formattedComments,
}: {
  project: Project;
  tracks: Track[];
  activeTrack: Track;
  formattedComments: Comment[];
}) {
  // Image dialog state
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [currentImageAlt, setCurrentImageAlt] = useState<string>("");

  // Image dialog handler
  const openImageDialog = (imageUrl: string, altText: string) => {
    setCurrentImageUrl(imageUrl);
    setCurrentImageAlt(altText);
    setImageDialogOpen(true);
  };

  // Calculate track progress
  const calculateTrackProgress = (track: Track) => {
    if (!track || !track.steps?.length) return 0;

    const completedSteps = track.steps.filter(
      (step) => step.status === "completed"
    ).length;
    return Math.round((completedSteps / track.steps.length) * 100);
  };

  const trackProgress = calculateTrackProgress(activeTrack);

  // Format date function
  const formatFullDate = (dateString: string | undefined | null): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);

    // For consistent formatting across locales including Arabic
    try {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch (error) {
      // Fallback to basic formatting if Intl fails
      return `${date.toDateString()} ${date.toTimeString().substring(0, 5)}`;
    }
  };

  // Check if deadline is approaching
  const isDeadlineApproaching = (
    deadline: string | undefined | null
  ): boolean => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 3;
  };

  // Get status variant
  const getStatusVariant = (status: string | undefined | null) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "success";
      case "active":
        return "info";
      case "in_progress":
        return "warning";
      case "on_hold":
        return "warning";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Format status
  const formatStatus = (status: string): string => {
    if (!status) return "Unknown";
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header with back button */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex gap-2 items-center">
              <h1 className="text-3xl font-bold tracking-tight">
                {project.title}
              </h1>
              <Badge variant={getStatusVariant(project.status)}>
                {formatStatus(project.status)}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p>Created: {formatFullDate(project.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current track progress */}
      <Card className="border-2">
        <CardHeader className="border-b pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                Round {activeTrack.round_number}
                <span className="text-muted-foreground text-sm">|</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Last updated: {formatFullDate(activeTrack.updated_at)}
                </span>
              </CardTitle>
            </div>
            {activeTrack.client_decision && (
              <Badge
                variant={
                  activeTrack.client_decision === "approved"
                    ? "success"
                    : activeTrack.client_decision === "revisions_requested"
                      ? "destructive"
                      : "info"
                }
                className="px-3 py-1"
              >
                {activeTrack.client_decision === "approved" ? (
                  <ShieldCheck className="h-4 w-4 mr-1" />
                ) : activeTrack.client_decision === "revisions_requested" ? (
                  <ShieldX className="h-4 w-4 mr-1" />
                ) : (
                  <Hourglass className="h-4 w-4 mr-1" />
                )}
                {activeTrack.client_decision === "approved"
                  ? "Approved"
                  : activeTrack.client_decision === "revisions_requested"
                    ? "Revisions Requested"
                    : "Pending Review"}
              </Badge>
            )}
          </div>

          {/* Progress tracking bar */}
          <div className="space-y-2 mt-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {activeTrack.steps?.filter(
                    (step) => step.status === "completed"
                  ).length || 0}
                  /{activeTrack.steps?.length || 0} steps completed
                </span>
              </div>
              <span className="text-sm font-medium">{trackProgress}%</span>
            </div>
            <Progress value={trackProgress} />
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Steps list */}
          <div className="space-y-5">
            {activeTrack.steps &&
              activeTrack.steps.map((step, index) => {
                const isFinalStep = index === activeTrack.steps.length - 1;
                const isCompleted = step.status === "completed";

                return (
                  <Card
                    key={index}
                    className={`p-4 border-2  border-dashed ${isCompleted ? "bg-muted/5 " : ""}`}
                  >
                    <div className="flex flex-col items-start gap-3">
                      <div className="flex items-center justify-between w-full">
                        <RevButtons
                          variant={isCompleted ? "success" : "outline"}
                          size="sm"
                        >
                          {isCompleted ? (
                            <>
                              <span>Step {index + 1}</span> |{" "}
                              <span>completed</span>
                            </>
                          ) : (
                            <>
                              <span>Step {index + 1}</span> |{" "}
                              <span>In Progress</span>
                            </>
                          )}
                        </RevButtons>

                        {isCompleted && (
                          <span className="text-xs text-muted-foreground">
                            Updated: {formatFullDate(activeTrack.updated_at)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 w-full">
                        {isFinalStep && (
                          <div className="p-4 mb-4 border-2 border-dashed rounded-md text-sm">
                            <div className="flex items-center gap-2">
                              <Flag className="h-4 w-4" />
                              <h3 className="font-medium">Round Completion</h3>
                            </div>

                            {step.status === "completed" ? (
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground">
                                  The editor has marked this round as complete
                                </p>
                                {step.deliverable_link && (
                                  <Link
                                    href={step.deliverable_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-blue-600 hover:underline mt-2 text-sm"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    View Final Deliverable
                                  </Link>
                                )}
                              </div>
                            ) : (
                              <TextShimmer className="text-sm" duration={2}>
                                The editor is currently working on this round
                              </TextShimmer>
                            )}
                          </div>
                        )}

                        {step.metadata && (
                          <div className="space-y-3">
                            {step.metadata.text && (
                              <div className="p-3 border-2 border-dashed rounded-md text-sm">
                                <CommentTextWithLinks
                                  text={step.metadata.text}
                                  links={step.metadata.links}
                                />
                              </div>
                            )}

                            {step.metadata.images &&
                              step.metadata.images.length > 0 && (
                                <div className="grid grid-cols-2 gap-3">
                                  {step.metadata.images.map((imageUrl, idx) => (
                                    <div
                                      key={idx}
                                      className="group relative overflow-hidden rounded-md border hover:border-primary transition-colors cursor-pointer"
                                      onClick={() =>
                                        openImageDialog(
                                          imageUrl,
                                          `Reference image ${idx + 1}`
                                        )
                                      }
                                    >
                                      <Image
                                        src={imageUrl}
                                        alt={`Reference image ${idx + 1}`}
                                        width={400}
                                        height={300}
                                        className="object-contain w-full h-auto max-h-[300px] group-hover:opacity-90 transition-opacity"
                                        style={{
                                          aspectRatio: "auto",
                                        }}
                                        sizes="(max-width: 768px) 50vw, 400px"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <ExternalLink className="h-6 w-6 text-white" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        )}

                        {step.deliverable_link && (
                          <div className="mt-3">
                            <Link
                              href={step.deliverable_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:underline text-sm"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View Deliverable
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>

          {/* Client feedback section */}
          {formattedComments.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h3 className="font-medium text-lg mb-4">Client Feedback</h3>
              <div className="space-y-4">
                {formattedComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 border-2 rounded-md bg-muted/5"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium">Client</span>
                      <span className="text-xs text-muted-foreground">
                        {formatFullDate(comment.created_at)}
                      </span>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-md text-sm">
                      <CommentTextWithLinks
                        text={comment.comment.text}
                        links={comment.comment.links}
                      />
                    </div>
                    {comment.comment.images &&
                      comment.comment.images.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {comment.comment.images.map((imageUrl, idx) => (
                            <div
                              key={idx}
                              className="relative aspect-square rounded-md overflow-hidden border hover:border-primary transition-colors cursor-pointer"
                              onClick={() =>
                                openImageDialog(
                                  imageUrl,
                                  `Comment image ${idx + 1}`
                                )
                              }
                            >
                              <Image
                                src={imageUrl}
                                alt={`Comment image ${idx + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, 25vw"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ExternalLink className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {project.deadline && (
        <div className="flex items-center justify-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <p
            className={
              isDeadlineApproaching(project.deadline)
                ? "text-orange-500 font-medium"
                : ""
            }
          >
            Deadline: {formatFullDate(project.deadline)}
          </p>
        </div>
      )}
      {/* Previous rounds */}
      {tracks.length > 1 && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl">Previous Rounds</CardTitle>
            <CardDescription>
              History of previous revision rounds for this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tracks
              .filter((track) => track.id !== activeTrack.id)
              .map((track) => {
                const finalStep = track.steps?.find(
                  (_, index) => index === track.steps.length - 1
                );
                const trackProgress = calculateTrackProgress(track);

                return (
                  <Card key={track.id} className="border">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            Round {track.round_number}
                            <span className="text-muted-foreground text-sm">
                              |
                            </span>
                            <span className="text-sm font-normal text-muted-foreground">
                              {formatFullDate(track.updated_at)}
                            </span>
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {track.client_decision && (
                            <Badge
                              variant={
                                track.client_decision === "approved"
                                  ? "success"
                                  : track.client_decision ===
                                      "revisions_requested"
                                    ? "destructive"
                                    : "info"
                              }
                            >
                              {track.client_decision === "approved"
                                ? "Approved"
                                : track.client_decision ===
                                    "revisions_requested"
                                  ? "Revisions"
                                  : "Pending"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-1">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            {track.steps?.filter(
                              (s) => s.status === "completed"
                            ).length || 0}{" "}
                            of {track.steps?.length || 0} steps completed
                          </span>
                          <span>{trackProgress}%</span>
                        </div>
                        <Progress value={trackProgress} className="h-2" />
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 border-t">
                      {finalStep?.deliverable_link && (
                        <Link
                          href={`/projects/${project.id}/review/${track.id}`}
                          className="flex items-center text-blue-600 hover:underline text-sm"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Deliverable
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
          </CardContent>
        </Card>
      )}

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-6xl w-[95vw] p-4 max-h-[95vh]">
          <DialogHeader className="flex flex-row justify-between items-center p-2"></DialogHeader>
          <div className="overflow-auto flex justify-center items-center bg-black border-2 border-dashed rounded-md max-h-[calc(95vh-100px)]">
            <img
              src={currentImageUrl}
              alt={currentImageAlt}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                display: "block",
              }}
              className="h-auto"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}