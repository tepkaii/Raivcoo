// components/ui/ClickAnimation.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayIcon, PauseIcon } from "@heroicons/react/24/solid";

interface ClickAnimationProps {
  show: boolean;
  isPlaying: boolean;
  onAnimationComplete?: () => void;
}

export const ClickAnimation: React.FC<ClickAnimationProps> = ({
  show,
  isPlaying,
  onAnimationComplete,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);

      // Hide after 1200ms
      const timer = setTimeout(() => {
        setIsVisible(false);
        onAnimationComplete?.();
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [show, onAnimationComplete]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Background circle with pulse effect */}
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
                  duration: 0.6,
                  ease: "easeOut",
                },
              }}
              className="absolute bg-white/20 rounded-full w-32 h-32"
            />

            {/* Main icon container */}
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
                    duration: 0.4,
                    ease: "easeInOut",
                  },
                  opacity: {
                    duration: 0.6,
                    ease: "easeOut",
                  },
                  rotate: {
                    duration: 0.5,
                    ease: "easeInOut",
                  },
                },
              }}
              className="bg-black/70 rounded-full p-6 backdrop-blur-sm border border-white/20"
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
                {isPlaying ? (
                  <PauseIcon className="w-12 h-12 text-white drop-shadow-2xl" />
                ) : (
                  <PlayIcon className="w-12 h-12 text-white drop-shadow-2xl" />
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
