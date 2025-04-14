// components/dashboard/projects/StepCommentsSection.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { CommentTextWithLinks } from "@/app/review/[trackId]/ReviewPage"; // Adjust path if needed
import { ExternalLink } from "lucide-react";
import { Step } from "./TrackManager"; // Assuming Step type is exported from TrackManager or a shared types file
import { TextShimmer } from "@/components/ui/text-shimmer";

interface StepCommentsSectionProps {
  step: Step;
  isFinalStep?: boolean; // Optional, if you want specific final step logic here
}

export function StepCommentsSection({
  step,
  isFinalStep,
}: StepCommentsSectionProps) {
  const metadata = step.metadata;

  return (
    <div className="flex-1 w-full ">
      {/* Display Step Name/Title - Consistent with TrackManager */}
      <span
        className={`font-medium text-sm sm:text-base truncate ${step.status === "completed" ? "line-through text-muted-foreground" : ""}`}
        title={metadata?.text || ""} // Show full text on hover if truncated
      >
        {metadata?.text ? null : (
          <>
            <TextShimmer className="text-sm" duration={2}>
              {isFinalStep
                ? "Final Deliverable Step - Waiting for other steps"
                : "No description"}
            </TextShimmer>
          </>
        )}
      </span>

      {/* Display Text and Links - Mimics LiveTrackClient */}
      {metadata?.text && (
        <div className="">
          <CommentTextWithLinks text={metadata.text} links={metadata.links} />
        </div>
      )}

      {/* Display Images - Mimics LiveTrackClient */}
      {metadata?.images && metadata.images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2">
          {metadata.images.map((imageUrl, idx) => (
            <Link
              key={`${imageUrl}-${idx}`} // Use a more unique key if possible
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square rounded-md overflow-hidden border hover:border-primary transition-colors block"
            >
              <Image
                src={imageUrl}
                alt={`Reference image ${idx + 1}`}
                fill
                className="object-cover group-hover:opacity-90 transition-opacity"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ExternalLink className="h-6 w-6 text-white" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Display Final Deliverable Link (if applicable and completed) */}
      {isFinalStep && step.status === "completed" && step.deliverable_link && (
        <div className="mt-2">
          <Link
            href={step.deliverable_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:underline text-sm"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View Submitted Deliverable
          </Link>
        </div>
      )}
    </div>
  );
}
