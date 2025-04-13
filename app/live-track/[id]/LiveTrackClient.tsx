"use client";

import Link from "next/link";
import { RevButtons } from "@/components/ui/RevButtons";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Calendar,
  Clock,
  ExternalLink,
  ShieldCheck,
  ShieldX,
  Hourglass,
  Flag,
} from "lucide-react";
import Image from "next/image";
import { CommentTextWithLinks } from "@/app/review/[trackId]/ReviewPage";
import { TextShimmer } from "@/components/ui/text-shimmer";

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
  return (
    <div className=" p-6 min-h-screen bg-primary-foreground">
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-muted-foreground">| Live Track View</p>
        </div>

        {/* <div className="flex items-center gap-4 mt-2 text-sm">
          <span className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            Created {new Date(project.created_at).toLocaleDateString()}
          </span>
          {project.deadline && (
            <span className="flex items-center text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              Due {new Date(project.deadline).toLocaleDateString()}
            </span>
          )}
          <span
            className={`px-2 py-1 rounded-[5px] text-xs font-medium ${
              project.status === "completed"
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {project.status === "completed" ? "Completed" : "Active"}
          </span>
        </div> */}
      </div>
      <hr />
      {/* Current track progress */}
      <Card className="mb-6 border-none p-0 m-0">
        <CardHeader className="m-0 p-0 mb-3 mt-3">
          <div className="flex justify-between  items-start">
            <div className="space-y-2">
              <CardTitle>Round {activeTrack.round_number}</CardTitle>
              <CardDescription>
                Last updated:{" "}
                {new Date(activeTrack.updated_at).toLocaleString()}
              </CardDescription>
            </div>
            {activeTrack.client_decision && (
              <span
                className={`flex items-center gap-1 px-3 py-1 rounded-[5px] text-xs font-medium ${
                  activeTrack.client_decision === "approved"
                    ? "bg-green-100 text-green-800"
                    : activeTrack.client_decision === "revisions_requested"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                }`}
              >
                {activeTrack.client_decision === "approved" ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : activeTrack.client_decision === "revisions_requested" ? (
                  <ShieldX className="h-4 w-4" />
                ) : (
                  <Hourglass className="h-4 w-4" />
                )}
                {activeTrack.client_decision === "approved"
                  ? "Approved"
                  : activeTrack.client_decision === "revisions_requested"
                    ? "Revisions Requested"
                    : "Pending Review"}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 m-0 ">
          {/* Progress bar */}

          {/* <div className="w-full bg-gray-200 rounded-[3px] h-2.5 mb-6">
            {activeTrack.steps && activeTrack.steps.length > 0 ? (
              <div
                className="bg-blue-600 h-2.5 rounded-[3px]"
                style={{
                  width: `${(activeTrack.steps.filter((step) => step.status === "completed").length / activeTrack.steps.length) * 100}%`,
                }}
              ></div>
            ) : (
              <div className="bg-gray-400 h-2.5 rounded-full w-0"></div>
            )}
          </div> */}

          {/* Steps list */}
          <div className="space-y-4">
            {activeTrack.steps &&
              activeTrack.steps.map((step, index) => {
                const isFinalStep = index === activeTrack.steps.length - 1;

                return (
                  <div
                    key={index}
                    className={`p-4  border-2 rounded-md ${
                      step.status === "completed" ? "bg-muted/10" : ""
                    }`}
                  >
                    <div className="flex flex-col items-start gap-2">
                      <RevButtons
                        variant={
                          step.status === "completed" ? "success" : "outline"
                        }
                      >
                        {step.status === "completed" ? (
                          <>
                            <span>Step {index + 1}</span> |{" "}
                            <span>completed</span>
                          </>
                        ) : (
                          <>
                            <>
                              <span> Step {index + 1}</span>
                            </>
                            |<span>In Progress</span>
                          </>
                        )}
                      </RevButtons>
                      <div className="flex-1 w-full ">
                        {isFinalStep && (
                          <div className=" p-4 mt-2 bg-[#1F1F1F] border-2 border-dashed rounded-md text-sm">
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
                          <div className="mt-2 space-y-3">
                            {step.metadata.text && (
                              <div className="p-3 bg-[#1F1F1F] border-2 border-dashed rounded-md text-sm">
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
                                      className="group relative overflow-hidden rounded-md border hover:border-primary transition-colors"
                                    >
                                      <Link
                                        href={imageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
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
                                      </Link>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        )}

                        {isFinalStep && step.deliverable_link && (
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
                  </div>
                );
              })}
          </div>

          {/* Client feedback section */}
          {formattedComments.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h3 className="font-medium mb-4">Client Feedback</h3>
              <div className="space-y-4">
                {formattedComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 border rounded-md bg-muted/10"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium">Client</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString()}
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
                            <Link
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
                            </Link>
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

      {/* Previous rounds */}
      {tracks.length > 1 && (
        <div className="mt-8">
          <h2 className="text-xl font-medium mb-4">Previous Rounds</h2>
          <div className="space-y-4">
            {tracks
              .filter((track) => track.id !== activeTrack.id)
              .map((track) => {
                const finalStep = track.steps?.find(
                  (_, index) => index === track.steps.length - 1
                );
                return (
                  <Card key={track.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          Round {track.round_number}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {track.client_decision && (
                            <span
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                track.client_decision === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : track.client_decision ===
                                      "revisions_requested"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {track.client_decision === "approved"
                                ? "Approved"
                                : track.client_decision ===
                                    "revisions_requested"
                                  ? "Revisions"
                                  : "Pending"}
                            </span>
                          )}
                          {finalStep?.deliverable_link && (
                            <Link
                              href={`/projects/${project.id}/review/${track.id}`}
                              passHref
                            >
                              <RevButtons variant="outline" size="sm">
                                View Deliverable
                              </RevButtons>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {track.steps?.filter((s) => s.status === "completed")
                            .length || 0}{" "}
                          of {track.steps?.length || 0} steps completed
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(track.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
