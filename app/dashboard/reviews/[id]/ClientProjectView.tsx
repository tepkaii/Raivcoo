// app/dashboard/reviews/[id]/ClientProjectView.tsx
"use client";

import Link from "next/link";
import { RevButtons } from "@/components/ui/RevButtons";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  ArrowLeft,
  ShieldCheck,
  ShieldX,
  Hourglass,
  Eye,
  CheckCircle2,
  Film,
  Image as ImageIcon,
  User,
  MessageCircle,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFullDate } from "../../pending/client-pending-list";

type ProjectType = {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline?: string;
  created_at: string;
  editor?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
};

type TrackType = {
  id: string;
  project_id: string;
  round_number: number;
  status: string;
  steps: any[];
  created_at: string;
  updated_at: string;
  client_decision?: "approved" | "revisions_requested" | null;
  final_deliverable_media_type?: "image" | "video" | null;
};

interface ClientProjectViewProps {
  project: ProjectType;
  tracks: TrackType[];
}

export default function ClientProjectView({
  project,
  tracks,
}: ClientProjectViewProps) {
  // Format the creation date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate if deadline is approaching
  const isDeadlineApproaching = (deadline?: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 3;
  };

  // Get status variant
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
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
    <div className="min-h-screen p-3 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/reviews"
              className="text-muted-foreground hover:text-foreground mr-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl md:text-3xl font-bold tracking-tight">
              {project.title}
            </h1>
            <Badge variant={getStatusVariant(project.status)}>
              {formatStatus(project.status)}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Created {formatFullDate(project.created_at)}
            </span>
            {project.deadline && (
              <span
                className={cn(
                  "flex items-center gap-1.5",
                  isDeadlineApproaching(project.deadline)
                    ? "text-orange-500 font-medium"
                    : ""
                )}
              >
                <Clock className="h-4 w-4" />
                Due {formatFullDate(project.deadline)}
              </span>
            )}
          </div>
        </div>

        {project.editor && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{project.editor.display_name}</span>
          </div>
        )}
      </div>

      {project.description && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Project Description
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground whitespace-pre-line">
            {project.description}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4 mt-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Review History
        </h2>
        <div className="space-y-4">
          {tracks && tracks.length > 0 ? (
            tracks.map((track) => {
              // Determine status icon and styling
              let decisionVariant: "success" | "destructive" | "warning" =
                "warning";
              let DecisionIcon = Hourglass;
              let decisionText = "Pending Review";

              if (track.client_decision === "approved") {
                decisionVariant = "success";
                DecisionIcon = ShieldCheck;
                decisionText = "Approved";
              } else if (track.client_decision === "revisions_requested") {
                decisionVariant = "destructive";
                DecisionIcon = ShieldX;
                decisionText = "Revisions Requested";
              }

              // Check if this track has a final deliverable
              const hasFinalDeliverable = track.steps?.some(
                (step: any) => step.is_final && step.status === "completed"
              );

              // Get appropriate media icon
              const MediaIcon =
                track.final_deliverable_media_type === "image"
                  ? ImageIcon
                  : Film;

              return (
                <Card
                  key={track.id}
                  className="border-2 border-dashed relative"
                >
                  {/* Status indicator line */}
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-1",
                      track.client_decision === "approved"
                        ? "bg-green-500"
                        : track.client_decision === "revisions_requested"
                          ? "bg-red-500"
                          : "bg-amber-400"
                    )}
                  />

                  <CardHeader className="pb-3 pl-5">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="flex items-center justify-center bg-muted text-muted-foreground rounded-full w-7 h-7 text-sm">
                          {track.round_number}
                        </div>
                        Round {track.round_number}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <RevButtons
                          size="sm"
                          variant={decisionVariant}
                          className="flex items-center gap-1"
                        >
                          <DecisionIcon className="h-3.5 w-3.5" />
                          {decisionText}
                        </RevButtons>

                        {hasFinalDeliverable && (
                          <Link href={`/review/${track.id}`}>
                            <RevButtons
                              variant="outline"
                              size="sm"
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="hidden sm:inline">
                                View Review
                              </span>
                            </RevButtons>
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Updated {formatFullDate(track.created_at)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3 pl-5">
                    {track.final_deliverable_media_type && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5">
                          <MediaIcon className="h-3.5 w-3.5" />
                          <span className="capitalize">
                            {track.final_deliverable_media_type}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>

                  {/* Steps summary */}
                  {track.steps && track.steps.length > 0 && (
                    <CardFooter className="border-t px-5 py-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {
                          track.steps.filter(
                            (step: any) => step.status === "completed"
                          ).length
                        }{" "}
                        of {track.steps.length} steps completed
                      </div>
                    </CardFooter>
                  )}
                </Card>
              );
            })
          ) : (
            <Card className="border-2">
              <CardContent className="py-10 text-center text-muted-foreground">
                No workflow tracks found for this project.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
