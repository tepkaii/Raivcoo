// app/projects/[projectId]/review/[trackId]/components/YouTubePlayer.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { formatTime } from "../../lib/utils";

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  youtubeEmbedUrl: string;
  currentTime: number;
  setCurrentTime: (time: number) => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  youtubeEmbedUrl,
  currentTime,
  setCurrentTime,
}) => {
  const playerRef = useRef<YT.Player | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Extract video ID from embed URL
  const videoId = youtubeEmbedUrl.split("/").pop()?.split("?")[0] || "";

  useEffect(() => {
    // Load YouTube IFrame API script if not already loaded
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = initializePlayer;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const initializePlayer = () => {
    playerRef.current = new window.YT.Player("youtube-player", {
      videoId: videoId,
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
      playerVars: {
        enablejsapi: 1,
        modestbranding: 1,
        rel: 0,
      },
    });
  };

  const onPlayerReady = (event: YT.PlayerEvent) => {
    // Player is ready
  };

  const onPlayerStateChange = (event: YT.OnStateChangeEvent) => {
    if (event.data === YT.PlayerState.PLAYING) {
      // Start tracking time when video plays
      intervalRef.current = setInterval(() => {
        if (playerRef.current) {
          setCurrentTime(playerRef.current.getCurrentTime());
        }
      }, 500); // Update every 500ms for better accuracy
    } else {
      // Clear interval when paused or ended
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  return (
    <div className="aspect-video">
      <div id="youtube-player" className="w-full h-full" />
      <div className="text-xs text-muted-foreground mt-1">
        Current time: {formatTime(currentTime)}
      </div>
    </div>
  );
};
