// app/review/[trackId]/history/HistoryPage.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { RevButtons } from "@/components/ui/RevButtons";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Track {
  id: string;
  project_id: string;
  round_number: number;
  client_decision: "pending" | "approved" | "revisions_requested";
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: string;
  comment: {
    text: string;
    timestamp: number;
    images?: string[];
    links?: { url: string; text: string }[];
  };
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  editor_id: string;
  client: {
    id: string;
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
  };
}

interface CurrentTrack extends Track {
  project: Project;
  steps: any[];
}

interface HistoryPageProps {
  currentTrack: CurrentTrack;
  allTracks: Track[];
  currentComments: Comment[];
  clientName: string;
  projectTitle: string;
}

export default function HistoryPage({
  currentTrack,
  allTracks,
  currentComments,
  clientName,
  projectTitle,
}: HistoryPageProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    currentTrack.id
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "revisions_requested":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Needs Revision
          </Badge>
        );
      default:
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return "Unknown date";
    }
  };

  return (
    <div className="container max-w-5xl mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link href={`/review/${currentTrack.id}`} className="mr-4">
          <RevButtons variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Review
          </RevButtons>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{projectTitle}</h1>
          <p className="text-muted-foreground">Project History</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Track history sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Review Rounds</CardTitle>
              <CardDescription>Review history of all rounds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {allTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrackId(track.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedTrackId === track.id
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      Round {track.round_number}
                    </span>
                    {getStatusBadge(track.client_decision)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(track.updated_at)}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Track details */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>
                    Round {currentTrack.round_number} Details
                  </CardTitle>
                  <CardDescription>
                    Feedback and status information
                  </CardDescription>
                </div>
                {getStatusBadge(currentTrack.client_decision)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedTrackId === currentTrack.id &&
              currentComments.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Client Feedback</h3>
                  {currentComments.map((comment) => (
                    <div key={comment.id} className="bg-muted p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1 w-full">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {clientName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm">{comment.comment.text}</p>

                          {/* Display comment images if any */}
                          {comment.comment.images &&
                            comment.comment.images.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {comment.comment.images.map(
                                  (imageUrl, index) => (
                                    <img
                                      key={index}
                                      src={imageUrl}
                                      alt={`Comment image ${index + 1}`}
                                      className="h-20 w-20 object-cover rounded border"
                                    />
                                  )
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedTrackId !== currentTrack.id ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Link href={`/review/${selectedTrackId}`}>
                    <RevButtons>View Round Details</RevButtons>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No feedback has been provided for this round yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
