// app/projects/[projectId]/review/[trackId]/components/MediaContainer.tsx
"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  // Render Youtube Player
  const renderYouTubePlayer = () => {
    if (!youtubeEmbedUrl) return null;

    return (
      <div className="aspect-video">
        <iframe
          src={youtubeEmbedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={`YouTube video for ${projectTitle}`}
        ></iframe>
      </div>
    );
  };

  // Render Vimeo Player
  const renderVimeoPlayer = () => {
    if (!vimeoEmbedUrl) return null;

    return (
      <div className="aspect-video">
        <iframe
          src={`${vimeoEmbedUrl}?api=1`}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={`Vimeo video for ${projectTitle}`}
        ></iframe>
      </div>
    );
  };

  // Render Google Drive Player
  const renderGoogleDrivePlayer = () => {
    if (!googleDriveEmbedUrl) return null;

    return (
      <div className="aspect-video">
        <iframe
          src={googleDriveEmbedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="autoplay"
          title={`Google Drive content for ${projectTitle}`}
        ></iframe>
      </div>
    );
  };

  // Render HTML5 Video Player
  const renderVideoPlayer = () => {
    const videoUrl = dropboxDirectUrl || deliverableLink;

    return (
      <div className="aspect-video bg-black">
        <video
          ref={videoRef}
          className="w-full h-full block"
          controls
          onTimeUpdate={handleTimeUpdate}
          src={videoUrl}
        >
          Your browser does not support video.
        </video>
      </div>
    );
  };

  // Render Image Viewer
  const renderImageViewer = () => {
    return (
      <div className="p-2 flex justify-center items-center bg-black relative">
        <img
          src={deliverableLink}
          alt={altText}
          style={{
            maxWidth: "100%",
            maxHeight: "70vh",
            height: "auto",
            display: "block",
            objectFit: "contain",
          }}
        />
        <Button
          className="absolute bottom-4 right-4"
          onClick={() => setImageDialogOpen(true)}
        >
          <Maximize2 className="h-4 w-4 mr-2" />
          View Full Size
        </Button>
      </div>
    );
  };

  // Render Media Fallback
  const renderMediaFallback = () => {
    return (
      <div className="p-6 bg-secondary flex flex-col items-center text-center justify-center h-full aspect-video">
        <div className="w-10 h-10 text-muted-foreground mb-3">⚠️</div>
        <p className="font-medium mb-1">Cannot preview content directly.</p>
        <a
          href={deliverableLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium text-sm inline-flex items-center gap-1"
        >
          View/Download Original <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    );
  };

  // Render the appropriate media content
  const renderMedia = () => {
    if (deliverableMediaType === "image") {
      return renderImageViewer();
    }

    if (deliverableMediaType === "video" || isVideoPlayerNeededByURL) {
      if (youtubeEmbedUrl) {
        return renderYouTubePlayer();
      } else if (vimeoEmbedUrl) {
        return renderVimeoPlayer();
      } else if (googleDriveEmbedUrl) {
        return renderGoogleDrivePlayer();
      } else if (dropboxDirectUrl || isVideo) {
        return renderVideoPlayer();
      }
    }

    return renderMediaFallback();
  };

  return (
    <div className="rounded-lg overflow-hidden border bg-muted/10 relative">
      {renderMedia()}

      <div className="p-2 bg-muted/10 flex justify-end">
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
          <div className="overflow-auto flex justify-center items-center bg-black border-2 border-dashed  rounded-md max-h-[calc(95vh-100px)]">
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
