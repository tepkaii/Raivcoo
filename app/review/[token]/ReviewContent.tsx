// app/review/[token]/ReviewContent.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RevButtons } from "@/components/ui/RevButtons";
import {
  Download,
  FileVideo,
  Image as ImageIcon,
  Calendar,
  Folder,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Eye,
  Share,
  Copy,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MediaFile {
  id: string;
  filename: string;
  original_filename: string;
  file_type: "video" | "image";
  mime_type: string;
  file_size: number;
  r2_url: string;
  uploaded_at: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface ReviewData {
  id: string;
  title?: string;
  created_at: string;
  expires_at?: string;
  project: Project;
  media: MediaFile;
}

interface ReviewContentProps {
  reviewData: ReviewData;
}

export function ReviewContent({ reviewData }: ReviewContentProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  const { media, project, title, created_at } = reviewData;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleVideoPlay = () => {
    if (videoRef) {
      if (isVideoPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleVideoMute = () => {
    if (videoRef) {
      videoRef.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef && videoRef.requestFullscreen) {
      videoRef.requestFullscreen();
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Review link has been copied to clipboard",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Failed to Copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = media.r2_url;
    link.download = media.original_filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                {title || media.original_filename}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Folder className="h-4 w-4" />
                <span>{project.name}</span>
                <span>•</span>
                <Calendar className="h-4 w-4" />
                <span>Shared {formatDate(created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RevButtons
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2"
              >
                <Share className="h-4 w-4" />
                Share
              </RevButtons>
              <RevButtons
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </RevButtons>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Media Display */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative bg-black">
                {media.file_type === "image" ? (
                  <div className="relative">
                    <img
                      src={media.r2_url}
                      alt={media.original_filename}
                      className="w-full h-auto max-h-[80vh] object-contain mx-auto"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <ImageIcon className="h-3 w-3" />
                        Image
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <video
                      ref={setVideoRef}
                      src={media.r2_url}
                      className="w-full h-auto max-h-[80vh] object-contain mx-auto"
                      onPlay={() => setIsVideoPlaying(true)}
                      onPause={() => setIsVideoPlaying(false)}
                      onVolumeChange={(e) =>
                        setIsVideoMuted((e.target as HTMLVideoElement).muted)
                      }
                      controls
                    />

                    {/* Custom Video Controls Overlay */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <FileVideo className="h-3 w-3" />
                        Video
                      </Badge>
                    </div>

                    {/* Additional Video Controls */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                      <RevButtons
                        variant="secondary"
                        size="icon"
                        onClick={handleVideoPlay}
                        className="bg-black/50 hover:bg-black/70"
                      >
                        {isVideoPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </RevButtons>
                      <RevButtons
                        variant="secondary"
                        size="icon"
                        onClick={handleVideoMute}
                        className="bg-black/50 hover:bg-black/70"
                      >
                        {isVideoMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </RevButtons>
                      <RevButtons
                        variant="secondary"
                        size="icon"
                        onClick={handleFullscreen}
                        className="bg-black/50 hover:bg-black/70"
                      >
                        <Maximize className="h-4 w-4" />
                      </RevButtons>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Media Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Media Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    File Name
                  </p>
                  <p className="text-sm font-mono break-all">
                    {media.original_filename}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    File Type
                  </p>
                  <p className="text-sm capitalize">{media.file_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    File Size
                  </p>
                  <p className="text-sm">{formatFileSize(media.file_size)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Uploaded
                  </p>
                  <p className="text-sm">{formatDate(media.uploaded_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Information */}
          {project.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Description
                  </p>
                  <p className="text-sm whitespace-pre-line">
                    {project.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
