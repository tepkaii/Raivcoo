// app/dashboard/projects/[id]/folders/components/MacOSFolderIcon.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  VideoCameraIcon,
  MusicalNoteIcon,
  DocumentIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/solid";

interface MediaFile {
  id: string;
  original_filename: string;
  file_type: string;
  mime_type: string;
  r2_url: string;
  thumbnail_r2_url?: string;
}

interface ProjectFolder {
  id: string;
  name: string;
  color: string;
  media_files?: MediaFile[];
}

// Smart rotation calculation based on total count and index
function getRotationValues(index: number, totalCount: number) {
  // Edge cases - no rotation for single card or weird scenarios
  if (totalCount <= 1) {
    return { initial: 0, hover: 0 };
  }

  // Calculate center point (floating point for even numbers)
  const center = (totalCount - 1) / 2;

  // Distance from center
  const distanceFromCenter = index - center;

  let initialRotation = 0;
  let hoverRotation = 0;

  switch (totalCount) {
    case 2:
      // For 2 cards: minimal rotation to avoid looking weird
      initialRotation = distanceFromCenter * 3; // -1.5 and +1.5 degrees
      hoverRotation = distanceFromCenter * 6; // -3 and +3 degrees
      break;

    case 3:
      // For 3 cards: nice balanced spread
      initialRotation = distanceFromCenter * 5; // -5, 0, +5 degrees
      hoverRotation = distanceFromCenter * 10; // -10, 0, +10 degrees
      break;

    case 4:
      // For 4 cards: good fan spread
      initialRotation = distanceFromCenter * 4; // -6, -2, +2, +6 degrees
      hoverRotation = distanceFromCenter * 8; // -12, -4, +4, +12 degrees
      break;

    default:
      // Fallback for any other count
      initialRotation = distanceFromCenter * 3;
      hoverRotation = distanceFromCenter * 6;
      break;
  }

  return {
    initial: initialRotation,
    hover: hoverRotation,
  };
}

// Media thumbnail component
function MediaThumbnail({ media }: { media: MediaFile }) {
  const getFileCategory = (fileType: string, mimeType: string) => {
    if (fileType === "video") return "video";
    if (fileType === "image" && mimeType !== "image/svg+xml") return "image";
    if (mimeType === "image/svg+xml") return "svg";
    if (mimeType.startsWith("audio/")) return "audio";
    if (
      mimeType === "application/pdf" ||
      mimeType.includes("document") ||
      mimeType.includes("presentation") ||
      mimeType === "text/plain"
    )
      return "document";
    return "unknown";
  };

  const fileCategory = getFileCategory(media.file_type, media.mime_type);

  const getThumbnailUrl = () => {
    if (media.thumbnail_r2_url && media.thumbnail_r2_url.trim() !== "") {
      return media.thumbnail_r2_url;
    }
    return null;
  };

  const thumbnailUrl = getThumbnailUrl();

  const renderContent = () => {
    switch (fileCategory) {
      case "image":
        const imageUrl = thumbnailUrl || media.r2_url;
        return (
          <img
            src={imageUrl}
            alt={media.original_filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        );

      case "video":
        if (thumbnailUrl) {
          return (
            <img
              src={thumbnailUrl}
              alt={`${media.original_filename} thumbnail`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          );
        } else {
          return (
            <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
              <VideoCameraIcon className="size-28 text-white/80" />
            </div>
          );
        }

      case "audio":
        return (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-800 flex items-center justify-center">
            <MusicalNoteIcon className="size-28 text-white/80" />
          </div>
        );

      case "svg":
        return (
          <div className="w-full h-full bg-gradient-to-br from-green-600 to-teal-800 flex items-center justify-center">
            <CodeBracketIcon className="size-28 text-white/80" />
          </div>
        );

      case "document":
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
            <DocumentIcon className="size-28 text-white/80" />
          </div>
        );

      default:
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
            <DocumentIcon className="size-28 text-white/80" />
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full rounded-sm overflow-hidden">
      {renderContent()}
    </div>
  );
}

// Individual MediaFilePage component with smart rotation
function MediaFilePage({
  media,
  index,
  totalCount,
  isHovered,
}: {
  media: MediaFile;
  index: number;
  totalCount: number;
  isHovered: boolean;
}) {
  const folderId = React.useId();

  const zIndex = totalCount - index;
  const initialYOffset = index * 1.5;

  // Get smart rotation values
  const { initial: initialRotation, hover: hoverRotation } = getRotationValues(
    index,
    totalCount
  );

  // Scale calculation - outer cards scale more
  const getScale = () => {
    if (!isHovered) return 1;

    if (totalCount <= 2) return 1.01; // Minimal scale for few cards

    // For 3+ cards, scale outer cards more
    const center = (totalCount - 1) / 2;
    const distanceFromCenter = Math.abs(index - center);

    if (distanceFromCenter >= center * 0.8) return 1.02; // Outer cards
    return 1.01; // Inner cards
  };

  return (
    <motion.div
      className={`media-item-${index} absolute bottom-0 w-full h-auto`}
      style={{
        zIndex,
        transformOrigin: "center bottom",
      }}
      animate={{
        y: initialYOffset,
        rotate: isHovered ? hoverRotation : initialRotation,
        scale: getScale(),
      }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}
    >
      <svg
        className="w-full h-auto"
        viewBox="0 0 88 99"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          width="88"
          height="99"
          fill={`url(#paint0_linear_page_${folderId})`}
          rx="4"
        />
        <defs>
          <linearGradient
            id={`paint0_linear_page_${folderId}`}
            x1="0"
            y1="0"
            x2="81"
            y2="160.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop offset="1" stopColor="#f0f0f0" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-1 top-2 bottom-2 overflow-hidden rounded-sm">
        <MediaThumbnail media={media} />
      </div>
    </motion.div>
  );
}

// FolderContentPreview component
export function FolderContentPreview({
  folder,
  isHovered,
}: {
  folder: ProjectFolder;
  isHovered: boolean;
}) {
  const displayMedia = folder.media_files || [];
  const mediaCount = displayMedia.length;

  // Don't render anything if no media
  if (mediaCount === 0) {
    return null;
  }

  const renderStackedPreview = () => {
    // Show only the first 4 items in the stack
    const itemsToShow = Math.min(mediaCount, 4);
    const items = displayMedia.slice(0, itemsToShow);

    return (
      <div className="media-stack relative w-full h-full">
        {items.map((media, index) => (
          <MediaFilePage
            key={media.id}
            media={media}
            index={index}
            totalCount={itemsToShow}
            isHovered={isHovered}
          />
        ))}

        {/* Show count indicator if more than 4 items */}
        {mediaCount > 4 && (
          <div className="absolute -bottom-1 -right-1 bg-black/90 text-white text-xs px-1.5 py-0.5 rounded-full z-40">
            +{mediaCount - 4}
          </div>
        )}
      </div>
    );
  };

  return renderStackedPreview();
}

export function MacOSFolderIcon({
  color,
  folder,
}: {
  color: string;
  folder?: ProjectFolder;
}) {
  const [isHovered, setIsHovered] = React.useState(false);
  const hasMedia = folder?.media_files && folder.media_files.length > 0;

  // Create gradient colors from the base color
  const createGradientColors = (baseColor: string) => {
    // Convert hex to RGB
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);

    // Create lighter and darker variants
    const lighter = {
      r: Math.min(255, r + 40),
      g: Math.min(255, g + 40),
      b: Math.min(255, b + 40),
    };

    const darker = {
      r: Math.max(0, r - 30),
      g: Math.max(0, g - 30),
      b: Math.max(0, b - 30),
    };

    return {
      light: `rgb(${lighter.r}, ${lighter.g}, ${lighter.b})`,
      base: `rgb(${r}, ${g}, ${b})`,
      dark: `rgb(${darker.r}, ${darker.g}, ${darker.b})`,
    };
  };

  const gradientColors = createGradientColors(color);
  const folderId = React.useId();

  return (
    <div
      className="relative w-full group cursor-pointer "
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-auto flex flex-col items-center justify-end">
        {/* File Back (Bottom Layer) */}
        <svg
          className="w-4/5 h-auto z-0"
          viewBox="0 0 146 113"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 4C0 1.79086 1.79086 0 4 0H50.3802C51.8285 0 53.2056 0.627965 54.1553 1.72142L64.3303 13.4371C65.2799 14.5306 66.657 15.1585 68.1053 15.1585H141.509C143.718 15.1585 145.509 16.9494 145.509 19.1585V109C145.509 111.209 143.718 113 141.509 113H3.99999C1.79085 113 0 111.209 0 109V4Z"
            fill={`url(#paint0_linear_back_${folderId})`}
          />
          <defs>
            <linearGradient
              id={`paint0_linear_back_${folderId}`}
              x1="0"
              y1="0"
              x2="72.93"
              y2="95.4804"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor={gradientColors.light} />
              <stop offset="1" stopColor={gradientColors.base} />
            </linearGradient>
          </defs>
        </svg>

        {/* Media files - all change rotation together when hovering the entire folder */}
        {hasMedia && folder && (
          <div className="absolute bottom-5 w-1/2 h-auto z-0">
            <FolderContentPreview folder={folder} isHovered={isHovered} />
          </div>
        )}

        {/* File Front (Top Layer) - KEEP CSS ANIMATION */}
        <svg
          className="absolute bottom-0 w-[90%] h-auto z--0 transition-all duration-500 ease-out group-hover:[transform:rotateX(35deg)] opacity-95"
          style={{ transformOrigin: "bottom" }}
          viewBox="0 0 160 79"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.29306 12.2478C0.133905 9.38186 2.41499 6.97059 5.28537 6.97059H30.419H58.1902C59.5751 6.97059 60.9288 6.55982 62.0802 5.79025L68.977 1.18034C70.1283 0.410771 71.482 0 72.8669 0H77H155.462C157.87 0 159.733 2.1129 159.43 4.50232L150.443 75.5023C150.190 77.5013 148.489 79 146.474 79H7.78403C5.66106 79 3.9079 77.3415 3.79019 75.2218L0.29306 12.2478Z"
            fill={`url(#paint0_linear_front_${folderId})`}
          />
          <defs>
            <linearGradient
              id={`paint0_linear_front_${folderId}`}
              x1="38.7619"
              y1="8.71323"
              x2="66.9106"
              y2="82.8317"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor={gradientColors.base} />
              <stop offset="1" stopColor={gradientColors.dark} />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
