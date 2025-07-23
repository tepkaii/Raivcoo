// app/review/[token]/components/Display/ClickAnimation.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
} from "@heroicons/react/24/solid";

interface ClickAnimationProps {
  show: boolean;
  isPlaying?: boolean;
  animationType: "play-pause" | "backward" | "forward";
  position?: "center" | "left" | "right";
  onAnimationComplete?: () => void;
}

export const ClickAnimation: React.FC<ClickAnimationProps> = ({
  show,
  isPlaying = false,
  animationType,
  position = "center",
  onAnimationComplete,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);

      // Hide after 1000ms (reduced from 1200ms)
      const timer = setTimeout(() => {
        setIsVisible(false);
        onAnimationComplete?.();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [show, onAnimationComplete]);

  // Get position classes - moved forward more right and backward more left
  const getPositionClasses = () => {
    switch (position) {
      case "left":
        return "justify-start pl-12"; // Moved closer to left edge
      case "right":
        return "justify-end pr-12"; // Moved closer to right edge
      case "center":
      default:
        return "justify-center"; // Center
    }
  };

  // Get icon based on animation type - all icons are smaller now
  const getIcon = () => {
    switch (animationType) {
      case "backward":
        return <BackwardIcon className="size-10 text-white drop-shadow-2xl" />;
      case "forward":
        return <ForwardIcon className="size-10 text-white drop-shadow-2xl" />;
      case "play-pause":
      default:
        return isPlaying ? (
          <PauseIcon className="size-10 text-white drop-shadow-2xl" />
        ) : (
          <PlayIcon className="size-10 text-white drop-shadow-2xl" />
        );
    }
  };

  return (
    <div
      className={`absolute inset-0 flex items-center ${getPositionClasses()} pointer-events-none z-30`}
    >
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Background circle with pulse effect - smaller size */}
            <motion.div
              initial={{
                scale: 0.5,
                opacity: 0.8,
              }}
              animate={{
                scale: [0.5, 1.2, 1],
                opacity: [0.8, 0.3, 0.6],
              }}
              exit={{
                scale: 1.3,
                opacity: 0,
              }}
              transition={{
                scale: {
                  duration: 0.2,
                  ease: "easeOut",
                },
                opacity: {
                  duration: 0.15,
                },
                exit: {
                  duration: 0.5,
                  ease: "easeOut",
                },
              }}
              className="absolute bg-white/20 rounded-full w-28 h-28"
            />

            {/* Main icon container - smaller padding */}
            <motion.div
              initial={{
                scale: 0.2,
                opacity: 0,
                rotate: -15,
              }}
              animate={{
                scale: 1,
                opacity: 1,
                rotate: 0,
              }}
              exit={{
                scale: 1.1,
                opacity: 0,
                rotate: 5,
              }}
              transition={{
                // Fast bouncy entrance
                scale: {
                  duration: 0.25,
                  ease: [0.34, 1.56, 0.64, 1], // bounce effect
                },
                opacity: {
                  duration: 0.15,
                },
                rotate: {
                  duration: 0.2,
                  ease: "easeOut",
                },
                // Smooth slow exit
                exit: {
                  scale: {
                    duration: 0.3,
                    ease: "easeInOut",
                  },
                  opacity: {
                    duration: 0.5,
                    ease: "easeOut",
                  },
                  rotate: {
                    duration: 0.4,
                    ease: "easeInOut",
                  },
                },
              }}
              className="bg-black/70 rounded-full p-7 backdrop-blur-sm border border-white/20"
            >
              <motion.div
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                transition={{
                  duration: 0.15,
                  ease: "easeOut",
                }}
              >
                {getIcon()}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
