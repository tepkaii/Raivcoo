"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion, animate, useInView } from "framer-motion";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsDisplayProps {
  video_samples: Array<{
    url: string;
    type: string;
    genre: string;
    likes?: number;
    views?: number;
    client?: any;
    source: string;
    category: string;
  }>;
}

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (inView && !hasAnimated) {
      const controls = animate(0, value, {
        duration: 1.5,
        ease: "easeOut",
        onUpdate: (latest) => {
          setDisplayValue(Math.round(latest));
        },
        onComplete: () => {
          setHasAnimated(true);
        },
      });

      return () => controls.stop();
    }
  }, [value, inView, hasAnimated]);

  return (
    <span ref={nodeRef} className="tabular-nums">
      {displayValue}
      {suffix}
    </span>
  );
}

export function StatsDisplay({ video_samples }: StatsDisplayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalVideos: number;
    totalViews: number;
    totalLikes: number;
  } | null>(null);

  const calculateStats = useCallback(() => {
    if (!video_samples || video_samples.length === 0) {
      return {
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0,
      };
    }

    return {
      totalVideos: video_samples.length,
      totalViews: video_samples.reduce(
        (sum, video) => sum + (video.views || 0),
        0
      ),
      totalLikes: video_samples.reduce(
        (sum, video) => sum + (video.likes || 0),
        0
      ),
    };
  }, [video_samples]);

  // Only calculate once when mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats(calculateStats());
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [calculateStats]);

  const formatNumberWithSuffix = useMemo(
    () =>
      (num: number): { value: number; suffix: string } => {
        if (num >= 1000000) {
          return { value: Number((num / 1000000).toFixed(2)), suffix: "M" };
        }
        if (num >= 1000) {
          return { value: Number((num / 1000).toFixed(2)), suffix: "K" };
        }
        return { value: num, suffix: "" };
      },
    []
  );

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-row justify-between items-center gap-4 py-3 px-6 sm:px-12">
          <Skeleton className="h-6 w-24" />
          <div className="h-4 w-[1px] bg-border/40" />
          <Skeleton className="h-6 w-24" />
          <div className="h-4 w-[1px] bg-border/40" />
          <Skeleton className="h-6 w-24" />
        </CardContent>
      </Card>
    );
  }

  // Error or no stats state
  if (!stats || !video_samples || video_samples.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-row justify-between items-center gap-4 py-3 px-6 sm:px-12">
          <div className="flex items-center justify-center w-full">
            <span className="text-muted-foreground text-sm sm:text-base">
              No video statistics available
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedViews = formatNumberWithSuffix(stats.totalViews);
  const formattedLikes = formatNumberWithSuffix(stats.totalLikes);

  // Regular display state
  return (
    <Card>
      <CardContent className="flex flex-row justify-between items-center gap-4 py-3 px-6 sm:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center"
        >
          <span className="font-medium text-sm sm:text-base">
            <Counter value={stats.totalVideos} /> Videos
          </span>
        </motion.div>

        <div className="h-4 w-[1px] bg-border/40" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center"
        >
          <span className="font-medium text-sm sm:text-base">
            <Counter
              value={formattedViews.value}
              suffix={formattedViews.suffix}
            />{" "}
            Views
          </span>
        </motion.div>

        <div className="h-4 w-[1px] bg-border/40" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center"
        >
          <span className="font-medium text-sm sm:text-base">
            <Counter
              value={formattedLikes.value}
              suffix={formattedLikes.suffix}
            />{" "}
            Likes
          </span>
        </motion.div>
      </CardContent>
    </Card>
  );
}
