// app/projects/[projectId]/review/[trackId]/components/VimeoPlayer.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { formatTime } from "../../lib/utils";

declare global {
  interface Window {
    Vimeo: {
      Player: any;
    };
  }
}

interface VimeoPlayerProps {
  vimeoEmbedUrl: string;
  currentTime: number;
  setCurrentTime: (time: number) => void;
}

export const VimeoPlayer: React.FC<VimeoPlayerProps> = ({
  vimeoEmbedUrl,
  currentTime,
  setCurrentTime,
}) => {
  const playerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    // Load Vimeo Player API script
    const script = document.createElement("script");
    script.src = "https://player.vimeo.com/api/player.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (iframeRef.current) {
        playerRef.current = new window.Vimeo.Player(iframeRef.current);

        playerRef.current.ready().then(() => {
          setPlayerReady(true);
        });

        playerRef.current.on("timeupdate", (data: any) => {
          setCurrentTime(data.seconds);
        });
      }
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      document.body.removeChild(script);
    };
  }, [setCurrentTime]);

  return (
    <div className="aspect-video">
      <iframe
        ref={iframeRef}
        src={`${vimeoEmbedUrl}?api=1`}
        width="100%"
        height="100%"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
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
