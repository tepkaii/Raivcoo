import React from "react";

interface IconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export const MediaCardsPanel: React.FC<IconProps> = ({
  className = "",
  size = 24,
  strokeWidth = 2,
}) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 950 950"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      strokeWidth={strokeWidth}
      stroke="currentColor"
    >
      <rect
        x="25"
        y="25"
        width="900"
        height="900"
        rx="150"
        ry="150"
        fill="none"
        stroke="currentColor"
        strokeWidth="50"
        strokeMiterlimit="10"
      />
      <rect
        x="102.26"
        y="112.49"
        width="326.26"
        height="725.02"
        rx="50"
        ry="50"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
};

export const MediaPlayerPanel: React.FC<IconProps> = ({
  className = "",
  size = 24,
  strokeWidth = 2,
}) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 950 950"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      strokeWidth={strokeWidth}
      stroke="currentColor"
    >
      <rect
        x="25"
        y="25"
        width="900"
        height="900"
        rx="150"
        ry="150"
        fill="none"
        stroke="currentColor"
        strokeWidth="50"
        strokeMiterlimit="10"
      />
      <rect
        x="311.87"
        y="112.49"
        width="326.26"
        height="725.02"
        rx="50"
        ry="50"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
};

export const CommentsPanel: React.FC<IconProps> = ({
  className = "",
  size = 24,
  strokeWidth = 2,
}) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 950 950"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      strokeWidth={strokeWidth}
      stroke="currentColor"
    >
      <rect
        x="25"
        y="25"
        width="900"
        height="900"
        rx="150"
        ry="150"
        fill="none"
        stroke="currentColor"
        strokeWidth="50"
        strokeMiterlimit="10"
      />
      <rect
        x="475"
        y="112.49"
        width="326.26"
        height="725.02"
        rx="50"
        ry="50"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
};

export const SidebarToggle: React.FC<IconProps> = ({
  className = "",
  size = 24,
  strokeWidth = 2,
}) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 950 950"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      strokeWidth={strokeWidth}
      stroke="currentColor"
    >
      {/* Main container */}
      <rect
        x="25"
        y="25"
        width="900"
        height="900"
        rx="100"
        ry="100"
        fill="none"
        stroke="currentColor"
        strokeWidth="50"
        strokeMiterlimit="10"
      />
      {/* Left sidebar panel */}
      <rect
        x="106.93"
        y="112.49"
        width="224.03"
        height="725.02"
        rx="50"
        ry="50"
        fill="currentColor"
        stroke="none"
      />
      {/* Top right content area */}
      <path
        d="M385.16,227.16v-64.09c0-27.61,22.39-50,50-50h383.1c27.61,0,50,22.39,50,50v55.09c0,32.58-26.42,59-59,59h-374.1c-27.61,0-50-22.39-50-50Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
};