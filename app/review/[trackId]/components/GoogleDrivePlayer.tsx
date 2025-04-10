// app/projects/[projectId]/review/[trackId]/components/GoogleDrivePlayer.tsx
"use client";

import React, { useState, useEffect } from "react";
import { formatTime } from "../../lib/utils";

interface GoogleDrivePlayerProps {
  googleDriveEmbedUrl: string;
  currentTime: number;
  setCurrentTime: (time: number) => void;
}

export const GoogleDrivePlayer: React.FC<GoogleDrivePlayerProps> = ({
  googleDriveEmbedUrl,
  currentTime,
  setCurrentTime,
}) => {
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === "https://drive.google.com" && event.data) {
        if (event.data.type === "timeupdate") {
          setCurrentTime(event.data.currentTime);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [setCurrentTime]);

  return (
    <div className="aspect-video">
      <iframe
        src={googleDriveEmbedUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        allow="autoplay"
        onLoad={() => setPlayerReady(true)}
      ></iframe>
      <div className="text-xs text-muted-foreground mt-1">
        Current time: {formatTime(currentTime)}
        {!playerReady && (
          <span className="ml-2 text-yellow-600">Loading player...</span>
        )}
      </div>
    </div>
  );
};
