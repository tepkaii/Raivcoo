// @ts-nocheck
import { useState, useEffect } from "react";
import { MediaFile } from "@/app/dashboard/types";

export const createMediaHandlers = (
  mediaFiles: MediaFile[],
  isMobile: boolean,
  setShowMediaPlayer: (show: boolean) => void
) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [comments, setComments] = useState<any[]>([]);

  const getAllVersionsForMedia = (mediaFile: MediaFile | null) => {
    if (!mediaFile) return [];
    const parentId = mediaFile.parent_media_id || mediaFile.id;
    const parent = mediaFiles.find((f) => f.id === parentId);
    const versions = mediaFiles.filter((f) => f.parent_media_id === parentId);
    const allVersions = parent ? [parent, ...versions] : versions;
    return allVersions.sort((a, b) => b.version_number - a.version_number);
  };

  const handleMediaSelect = (media: MediaFile) => {
    if (!isMobile) {
      setSelectedMedia(media);
      setCurrentTime(0);
    }
  };

  const handleMediaUpdated = (newFiles: MediaFile[]) => {
    if (selectedMedia) {
      const updatedSelected = newFiles.find((f) => f.id === selectedMedia.id);
      if (updatedSelected) {
        setSelectedMedia(updatedSelected);
      } else {
        setSelectedMedia(null);
      }
    }
  };

  const handleCommentsUpdate = (newComments: any[]) => {
    setComments(newComments);
  };

  const handleAnnotationCreate = (
    annotation: any,
    showCommentsPanel: boolean,
    canComment: boolean
  ) => {
    if (!showCommentsPanel && !isMobile && canComment) {
      // This would need to be handled by parent component
      return true; // Signal to show comments panel
    }
    return false;
  };

  // Handle URL params for media selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mediaId = urlParams.get("media");

    if (mediaId) {
      const media = mediaFiles.find((m) => m.id === mediaId);
      if (media) {
        setSelectedMedia(media);
        if (!isMobile) {
          setShowMediaPlayer(true);
        }
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [mediaFiles, isMobile, setShowMediaPlayer]);

  return {
    selectedMedia,
    currentTime,
    comments,
    setSelectedMedia,
    setCurrentTime,
    setComments,
    getAllVersionsForMedia,
    handleMediaSelect,
    handleMediaUpdated,
    handleCommentsUpdate,
    handleAnnotationCreate,
  };
};
