// app/projects/[projectId]/review/[trackId]/components/MediaContainer.tsx
// @ts-nocheck
"use client";

import React, { useRef, useState } from "react";
import { ExternalLink, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import {
  VimeoPlayer,
  YouTubePlayer,
  GoogleDrivePlayer,
  VideoPlayer,
  ImageViewer,
  MediaFallback,
} from "./MediaPlayer";
import {
  isVimeoLink,
  isYoutubeLink,
  isGoogleDriveLink,
  isDropboxLink,
  isVideoFile,
  isAudioFile,
  getVimeoEmbedUrl,
  getYouTubeEmbedUrl,
  getGoogleDriveEmbedUrl,
  getDropboxDirectUrl,
} from "../../lib/utils";

interface MediaContainerProps {
  deliverableLink: string;
  deliverableMediaType?: "video" | "image" | null;
  projectTitle: string;
  roundNumber: number;
  setCurrentTime: (time: number) => void;
}

export const MediaContainer: React.FC<MediaContainerProps> = ({
  deliverableLink,
  deliverableMediaType,
  projectTitle,
  roundNumber,
  setCurrentTime,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const altText = `Deliverable for ${projectTitle} - Round ${roundNumber}`;

  const googleDriveEmbedUrl = isGoogleDriveLink(deliverableLink)
    ? getGoogleDriveEmbedUrl(deliverableLink)
    : null;
  const youtubeEmbedUrl = isYoutubeLink(deliverableLink)
    ? getYouTubeEmbedUrl(deliverableLink)
    : null;
  const vimeoEmbedUrl = isVimeoLink(deliverableLink)
    ? getVimeoEmbedUrl(deliverableLink)
    : null;
  const dropboxDirectUrl = isDropboxLink(deliverableLink)
    ? getDropboxDirectUrl(deliverableLink)
    : null;
  const isVideo = isVideoFile(deliverableLink);
  const isAudio = isAudioFile(deliverableLink);

  const isVideoPlayerNeededByURL =
    isVideo ||
    !!youtubeEmbedUrl ||
    !!vimeoEmbedUrl ||
    !!googleDriveEmbedUrl ||
    !!dropboxDirectUrl;

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Render the appropriate media content
  const renderMedia = () => {
    if (deliverableMediaType === "image") {
      return (
        <ImageViewer
          url={deliverableLink}
          altText={altText}
          openFullscreen={() => setImageDialogOpen(true)}
        />
      );
    }

    if (deliverableMediaType === "video" || isVideoPlayerNeededByURL) {
      if (youtubeEmbedUrl) {
        return (
          <YouTubePlayer
            youtubeEmbedUrl={youtubeEmbedUrl}
            setCurrentTime={setCurrentTime}
          />
        );
      } else if (vimeoEmbedUrl) {
        return (
          <VimeoPlayer
            vimeoEmbedUrl={vimeoEmbedUrl}
            setCurrentTime={setCurrentTime}
          />
        );
      } else if (googleDriveEmbedUrl) {
        return (
          <GoogleDrivePlayer
            googleDriveEmbedUrl={googleDriveEmbedUrl}
            setCurrentTime={setCurrentTime}
          />
        );
      } else if (dropboxDirectUrl || isVideo) {
        const videoUrl = dropboxDirectUrl || deliverableLink;
        return (
          <VideoPlayer
            url={videoUrl}
            videoRef={videoRef}
            handleTimeUpdate={handleTimeUpdate}
            setCurrentTime={setCurrentTime}
          />
        );
      }
    }

    return <MediaFallback url={deliverableLink} />;
  };

  return (
    <div className="rounded-lg overflow-hidden border bg-muted/10 relative">
      {renderMedia()}

      <div className="p-2 bg-background flex justify-end">
        <a
          href={deliverableLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Open Original <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-6xl w-[95vw] p-4 max-h-[95vh]">
          <DialogHeader className="flex flex-row justify-between items-center p-2"></DialogHeader>
          <div className="overflow-auto flex justify-center items-center bg-black border-2 border-dashed rounded-md max-h-[calc(95vh-100px)]">
            <img
              src={deliverableLink}
              alt={altText}
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
};