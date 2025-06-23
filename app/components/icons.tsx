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
