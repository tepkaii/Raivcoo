// components/YouTubeEmbed.tsx
"use client";

import { useEffect, useState } from 'react';

interface YouTubeEmbedProps {
  videoUrl: string;
}

export default function YouTubeEmbed({ videoUrl }: YouTubeEmbedProps) {
  const [videoId, setVideoId] = useState<string | null>(null);
  
  useEffect(() => {
    // Extract video ID from various YouTube URL formats
    const extractVideoId = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };
    
    setVideoId(extractVideoId(videoUrl));
  }, [videoUrl]);
  
  if (!videoId) {
    return <div className="aspect-video bg-muted flex items-center justify-center">Invalid YouTube URL</div>;
  }
  
  return (
    <div className="relative w-full aspect-video">
      <iframe
        className="absolute top-0 left-0 w-full h-full rounded-md"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}