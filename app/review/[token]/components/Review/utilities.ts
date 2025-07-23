// app/review/[token]/components/Review/utilities.ts
import { PencilIcon } from "@heroicons/react/24/solid";
import { Circle, Square, ArrowRight, Minus } from "lucide-react";

// Color options with visual representation
export const colors = [
  { value: "#E5484D", name: "Red" },
  { value: "#46A758", name: "Green" },
  { value: "#0070F3", name: "Blue" },
  { value: "#FFB224", name: "amber" },
  { value: "#8E4EC6", name: "Purple" },
  { value: "#00B8D4", name: "Cyan" },
  { value: "#000000", name: "Black" },
];

// Drawing thickness options
export const thicknessOptions = [
  { value: 2, label: "2px" },
  { value: 3, label: "3px" },
  { value: 4, label: "4px" },
  { value: 6, label: "6px" },
  { value: 8, label: "8px" },
];

// Drawing shape options with icons
export const shapeOptions = [
  { value: "freehand", icon: PencilIcon, label: "Freehand" },
  { value: "line", icon: Minus, label: "Line" },
  { value: "circle", icon: Circle, label: "Circle" },
  { value: "square", icon: Square, label: "Square" },
  { value: "arrow", icon: ArrowRight, label: "Arrow" },
] as const;
