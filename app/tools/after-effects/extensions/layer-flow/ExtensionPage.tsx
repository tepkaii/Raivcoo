"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Layers,
  Link2,
  ArrowUpToLine,
  Copy,
  Zap,
  Check,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Grid,
  CalendarCog,
  Frame,
  AlignHorizontalJustifyStart,
  Tangent,
  Settings,
  ClipboardPlus,
  Sparkle,
  GalleryVerticalEnd,
  Tag,
  FileCog,
} from "lucide-react";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import BlurFade from "@/components/ui/blur-fade";
import Link from "next/link";
import { MoreExtensions } from "../MoreExtensions";
import { Button } from "@/components/ui/button";

const ExtensionFeatures = {
  addToComp: {
    id: 1,
    title: "Add to Composition",
    icon: Layers,
    description:
      "Create new layers directly in your composition with full control over properties and placement. Access an extensive library of shape presets and layer controls.",
    media: {
      images: [],
      videos: [
        {
          url: "/extension/layerFlow/videos/addComp-text.mp4",
          title: "Creating Text Layers",
        },
        {
          url: "/extension/layerFlow/videos/addComp-shape.mp4",
          title: "Shape Layer Creation",
        },
        {
          url: "/extension/layerFlow/videos/addComp-solid.mp4",
          title: "Solid Layer Workflow",
        },
      ],
      gifs: [],
    },
    items: [
      "Add Text Layers: Create text layers with customizable font size, color, and initial content",
      "Add Solids: Add solid layers with precise dimensions and color controls",
      "Full Shape Library: Access to all 54+ shape presets",
      "Shape Preview: Live preview window shows shape appearance before creation",
      "Utility Layers: Quick creation of cameras, lights, adjustment layers and nulls",
      "Layer Properties: Full control over 3D settings, motion blur, scale options",
      "Multi-Layer Creation: Batch create up to 10 layers with sequential naming",
      "Layer Controls: Lock, solo, and hide layer toggles",
      "Color Management: 16 label colors plus random color option",
      "Size Controls: Set custom width and height or use scale presets (0.25x to 4x)",
      "Anchor Point System: 9-point grid for precise positioning",
    ],
  },

  addToSelected: {
    id: 2,
    title: "Add to Selected Layers",
    icon: Link2,
    description:
      "Add new layers directly on top of selected layers with automatic linking. Perfect for creating parent-child relationships quickly.",
    media: {
      images: [],
      videos: [
        {
          url: "/extension/layerFlow/videos/addToSelected-null.mp4",
          title: "Parent-Child Layer Creation",
        },
      ],
      gifs: [],
    },
    items: [
      "Smart Parenting: Automatically link new layers to selected layers",
      "Preserve Timing: New layers inherit selected layer timing",
      "Layer Stacking: Perfect placement above each selected layer",
      "Property Inheritance: Maintain transform properties from selected layers",
      "Full Shape Library: Access to all 45+ shape presets with preview",
      "Layer States: Toggle lock, solo, and hide states",
      "Random Color Assignment: Quick random label color option",
      "Anchor Point Grid: Interactive 9-point positioning system",
    ],
  },

  addAboveSelected: {
    id: 3,
    title: "Add Above Selected Layers",
    icon: ArrowUpToLine,
    description:
      "Place new layers directly above your selection while maintaining proper layer hierarchy. Ideal for inserting adjustment layers or effects above existing content.",
    media: {
      images: [],
      videos: [
        {
          url: "/extension/layerFlow/videos/addAboveSelected-null.mp4",
          title: "Layer Placement Workflow",
        },
      ],
      gifs: [],
    },
    items: [
      "Smart Positioning: Perfect placement above selected layers",
      "Duration Matching: Match timing of all selected layers",
      "Shape Library Access: Full access to 45+ shape presets",
      "Multi-Layer Support: Create multiple layers with consistent spacing",
      "Property Control: Full access to all layer settings and properties",
      "Organization Tools: Label colors and custom naming options",
      "Transform Settings: 3D, motion blur and visibility controls",
      "Anchor Point: Precise positioning with 9-point grid",
    ],
  },

  duplicate: {
    id: 3,
    title: "Duplicate 2.0",
    icon: Copy,
    description:
      "Quickly duplicate layers while maintaining hierarchy and properties. Create multiple copies with customized settings in a single operation.",
    media: {
      images: [],
      videos: [
        {
          url: "/extension/layerFlow/videos/Duplicate.mp4",
          title: "Layer Duplication Process",
        },
      ],
      gifs: [],
    },
    items: [
      "Batch Duplication: Create multiple duplicates (up to 10) in one operation",
      "Smart Positioning: Place above or below source layers",
      "Property Preservation: Maintain all layer properties and effects",
      "Label Colors: 16 label colors plus random color option for duplicates",
      "Layer States: Control lock, solo, and hide states for duplicates",
      "Transform Settings: Toggle 3D and motion blur on duplicates",
      "Anchor Point: 9-point grid system for duplicate positioning",
      "Multi-selection Support: Duplicate multiple layers simultaneously",
      "Mirror Options: Horizontal, vertical, or both axis mirroring",
      "Custom Naming: Prefix, suffix, and sequential numbering options",
    ],
  },
  shapePresets: {
    id: 5,
    title: "Shape Management 2.1",
    icon: Sparkle,
    description:
      "A visual library for storing and applying shapes. Save shapes from After Effects and quickly apply them to your compositions.",
    media: {
      images: [],
      videos: [
        {
          url: "/extension/layerFlow/videos/shapeeprst manger too.mp4",
          title: "Shape saving Process",
        },
      ],
      gifs: [],
    },
    items: [
      "Import shapes from active layer",
      "Visual preview for all saved shapes",
      "Organize shapes into collections",
      "Customize label colors and names",
    ],
  },
  layerSettings: {
    id: 6,
    title: "Layer Settings",
    icon: FileCog,
    description:
      "Comprehensive control panel for modifying all aspects of selected layers. Streamline repetitive tasks with bulk property updates.",
    media: {
      images: [],
      videos: [
        {
          url: "/extension/layerFlow/videos/layerSetting-solid.mp4",
          title: "Solid Layer Settings",
        },
        {
          url: "/extension/layerFlow/videos/layerSetting-text.mp4",
          title: "Text Layer Controls",
        },
      ],
      gifs: [],
    },
    items: [
      "Property Control: Edit text, dimensions, colors and more",
      "Visual Settings: Toggle 3D, motion blur and visibility",
      "Color Management: Update fill colors and label colors with random option",
      "Text Editing: Modify font size and content directly",
      "Dimension Control: Update width, height with scale presets",
      "Frame Rate: Adjust composition and layer frame rates",
      "Batch Updates: Apply changes to multiple selected layers",
      "Layer States: Lock, solo, and hide layer controls",
      "Anchor Point: Grid-based anchor point adjustment",
    ],
  },

  preCompose: {
    id: 7,
    title: "Pre-compose Settings",
    icon: GalleryVerticalEnd,
    description:
      "Advanced pre-composition tools for organizing your project. Create clean compositions with automated naming and property inheritance.",
    media: {
      images: [],
      videos: [
        {
          url: "/extension/layerFlow/videos/PreComp-allLyaersInonePreomes.mp4",
          title: "All Layers in One Pre-comp",
        },
        {
          url: "/extension/layerFlow/videos/PreComp-EachSelectedLayer.mp4",
          title: "Each Selected Layer Pre-comp",
        },
      ],
      gifs: [],
    },
    items: [
      "Naming: Automatic or custom naming for new compositions",
      "Property Transfer: Control attribute movement to new comp",
      "Bulk Processing: Pre-compose multiple layers simultaneously",
      "Layer Names: Use original layer names for new comps",
      "Size Controls: Set custom width and height or use scale presets (0.25x to 4x)",
      "Frame Rate Control: Adjust composition frame rate",
      "Color Management: 16 label colors plus random color option",
      "Layer Crop Mode: Auto-size comp to layer content",
      "Layer States: Lock, solo, and hide layer toggles",
      "Anchor Point: Grid-based positioning system",
    ],
  },

  markerSystem: {
    id: 8,
    title: "Marker Management",
    icon: Tag,
    description:
      "Comprehensive marker system for timeline organization and task tracking. Create, modify and manage markers with detailed properties.",
    media: {
      images: [],
      videos: [
        {
          url: "/extension/layerFlow/videos/marker.mp4",
          title: "Marker System Overview",
        },
      ],
      gifs: [],
    },
    items: [
      "Custom Comments: Add detailed notes to markers",
      "Duration Control: Set precise marker durations",
      "Protected Regions: Create protected timeline segments",
      "Color Coding: 16 label colors plus random color option",
      "Batch Operations: Add or remove multiple markers",
      "Layer Support: Add markers to layers or composition",
      "Random Colors: Quick random color assignment",
      "Property Control: Comprehensive marker property panel",
    ],
  },

  shortcuts: {
    id: 9,
    title: "Quick Access Tools 2.1",
    icon: Zap,
    description:
      "Essential tools and shortcuts for common After Effects tasks. Speed up your workflow with one-click access to frequently used operations.",
    media: {
      images: [],
      videos: [
        {
          url: "/extension/layerFlow/videos/labalColorsV2.mp4",
          title: "Label Color System",
        },
        {
          url: "/extension/layerFlow/videos/Orginal duplicate.mp4",
          title: "Duplicate Pre-comp (Independent Copy)",
        },
        {
          url: "/extension/layerFlow/videos/trimToNearestMarkers.mp4",
          title: "Trim Layers to Nearest Markers",
        },
        {
          url: "/extension/layerFlow/videos/shortcut-Separate Layer Masks.mp4",
          title: "Separate Layer Masks",
        },
        {
          url: "/extension/layerFlow/videos/shortcut-Create Look At Controller.mp4",
          title: "Look At Controller",
        },
        {
          url: "/extension/layerFlow/videos/shortcut-Create Magnet Controller.mp4",
          title: "Magnet Controller Setup",
        },
        {
          url: "/extension/layerFlow/videos/shortcut-Create Magnet Controllers.mp4",
          title: "Magnet Controllers",
        },
      ],
      gifs: [],
    },
    items: [
      "Layer Trimming: Trim to last selected, or nearest markers",
      "Smart Layer Tools: Duplicate Pre-comps, flip layers, invert layers order",
      "Shape Operations: Convert between masks and shapes, separate masks to layers",
      "Animation Helpers: Loop ping-pong, cycle loop, and wiggle automation",
      "Expression Controls: Toggle, show, and remove expressions with one click",
      "Advanced Controllers: Create magnet, repulsion, and look-at controllers",
      "Label Color Management: Select, multi-select, and filter layers by color labels",
      "Quick Color Selection: Alt+Click to select layers by color, Ctrl+Click for multi-select",
      "Random Color Assignment: Apply random colors to layers instantly",
      "Panel Toggle: Switch between shortcuts and Label Colors",
    ],
  },
  layoutMaker: {
    id: 10,
    title: "Layout Maker 2.0",
    icon: Grid,
    description:
      "layout system for arranging layers in grid, circle, or spiral patterns with precise spacing and distribution controls.",
    media: {
      images: [],
      videos: [
        {
          url: "/extension/layerFlow/videos/Layout maker.mp4",
          title: "Layout Creation System",
        },
      ],
      gifs: [],
    },
    items: [
      "Grid Layout: Customizable columns and spacing",
      "Circle Layout: Adjustable radius and layer distribution",
      "Spiral Layout: Control radius, growth rate, and rotations",
      "Auto-rotation: Smart layer rotation based on position",
      "Multi-circle Support: Create concentric circle arrangements",
      "Custom Spacing: Define precise distances between layers",
      // "Center Alignment: Option to center layouts in composition",
      "Layer Distribution: Equal or custom angle spacing options",
      "Direction Control: Clockwise or counterclockwise arrangement",
      // "Auto-selection: Automatic handling of selected layer count",
    ],
  },
  guideSystem: {
    id: 11,
    title: "Guide System 2.0",
    icon: Frame,
    description:
      "guide system for precise alignment and layout planning with customizable margins and padding.",
    media: {
      images: [],
      videos: [
        {
          url: "/extension/layerFlow/videos/GuideSection.mp4",
          title: "Guide System Overview",
        },
      ],
      gifs: [],
    },
    items: [
      "Boundary Guides: Create guides along layer bounds",
      "Grid System: Generate customizable grid guide layouts",
      "Margin Control: Set specific margins from boundaries",
      "Padding Settings: Set specific padding spaces",
      "Direction Options: Select specific guide directions",
      "Quick Controls: Toggle guide  rulers visibility and snapping",

      // "Multiple Presets: Various guide arrangement options",
      "Bulk Operations: Add or remove guides",
      // "Custom Spacing: Define precise guide positions",
    ],
  },
  alignmentPanel: {
    id: 12,
    title: "Layer Alignment 2.0",
    icon: AlignHorizontalJustifyStart,
    description:
      "Align layers and anchor points using a visual grid. Quickly position elements relative to each other or selected layers.",
    media: {
      images: [],
      videos: [
        {
          url: "/extension/layerFlow/videos/fastera.mp4",
          title: "Position and Anchor Point Alignment",
        },
      ],
      gifs: [],
    },
    items: [
      "Visual grid interface for precise alignment",
      "Align layers to any edge or center position",
      "Position anchor points with a single click",
      "Smart alignment to selected layers",
      "Match position across multiple layers",
    ],
  },

  velocityControl: {
    id: 13,
    title: "Velocity Editor 2.0",
    icon: Tangent,
    description:
      "Edit keyframe velocities with an interactive curve editor. Save and load velocity presets to maintain consistency.",
    media: {
      images: [],
      videos: [
        {
          url: "/extension/layerFlow/videos/Velocity Control.mp4",
          title: "Velocity Control Interface",
        },
      ],
      gifs: [],
    },
    items: [
      "Visual curve editor with interactive handles",
      "Save and load custom velocity presets",
      "Quick access to common easing presets",
      "Real-time preview of velocity changes",
      "Precise numeric velocity control",
    ],
  },
  compSettings: {
    id: 14,
    title: "Composition Settings 2.0",
    icon: CalendarCog,
    description:
      "A fresh take on composition settings that lets you see your changes in real-time as you make them. Watch your frame rates, colors, and dimensions update live.",
    media: {
      images: [],
      videos: [
        {
          url: "/extension/layerFlow/videos/CompSettigns.mp4",
          title: "Composition Settings Panel",
        },
      ],
      gifs: [],
    },
    items: [
      "See your composition's shape and size instantly with a clean visual preview",
      "Watch how frame rate changes affect motion with a simple bouncing ball animation",
      "Pick background colors with an intuitive color picker",
      "Compare how different bit depths affect your color quality with gradient preview",
      "Work with time visually using frame-accurate controls that make sense",
      "Choose from common video sizes and instantly see how they'll look",
      "Label Colors: 16 label colors plus random color option for duplicates",
      "Set your Time code and duration",
    ],
  },
  clipboardImporter: {
    id: 15,
    title: "Clipboard Importer 2.0",
    icon: ClipboardPlus,
    description:
      "Import clipboard images directly into After Effects by saving them to your local drive first.",
    media: {
      images: [],
      videos: [
        {
          url: "/extension/layerFlow/videos/clipboard Image.mp4",
          title: "Clipboard Image Import Workflow",
        },
      ],
      gifs: [],
    },
    items: [
      "Choose where to save your clipboard images",
      "Paste images directly from clipboard with Ctrl+V",
      "Quick access to your 5 most recently imported images",
      "Images automatically save to a designated folder",
      "Import saved images with one click",
    ],
  },
  settingsPanel: {
    id: 16,
    title: "Settings Panel 2.0",
    icon: Settings,
    description:
      "Customize panel layout, colors, and visibility through the Settings Panel.",
    media: {
      images: [],
      videos: [
        {
          url: "/extension/layerFlow/videos/sections seetings.mp4",
          title: "Settings Panel ",
        },
      ],
      gifs: [],
    },
    items: [
      "Search and filter panels to quickly find what you need",
      "Customize panel icon colors with preset color options",
      "Show or hide panels",
      "Arrange panels in any order you like",
      "Settings automatically save between sessions",
      "Visual preview of changes as you customize",
    ],
  },
};

function VideoRenderer({
  videos,
}: {
  videos?: { url: string; title: string }[];
}) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  if (!videos?.length) return null;

  return (
    <div className="w-full space-y-4">
      <div className="relative mt-5 group">
        {/* Video Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute top-2 left-2 z-10 md:top-3 md:left-3" // Adjusted positioning
        >
          <div className="bg-black/60 backdrop-blur-[2px] px-2 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg inline-block">
            {" "}
            {/* Changed to inline-block */}
            <span className="text-[10px] md:text-sm text-white/90 font-medium truncate max-w-[200px] md:max-w-[300px] block">
              {" "}
              {/* Added truncate and max-width */}
              {videos[currentVideoIndex].title}
            </span>
          </div>
        </motion.div>
        {/* Video Container */}
        <div className="rounded-2xl shadow-lg overflow-hidden relative">
          {/* Loading State */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-800/10 backdrop-blur-sm flex items-center justify-center"
              >
                <motion.div
                  className="flex flex-col items-center gap-3"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <svg
                    className="size-8 text-[#2E77D0] animate-spin"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-[#2E77D0]">
                    Loading video...
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Video Element */}
          <motion.video
            key={videos[currentVideoIndex].url}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            onLoadStart={() => setIsLoading(true)}
            onLoadedData={() => setIsLoading(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoading ? 0 : 1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-auto rounded-2xl border-2 border-[#2E77D0]/20 hover:border-[#2E77D0]/40 transition-colors"
          >
            <source src={videos[currentVideoIndex].url} type="video/mp4" />
            Your browser does not support the video tag.
          </motion.video>

          {/* Video Controls */}
          {videos.length > 1 && (
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() =>
                    setCurrentVideoIndex(
                      (i) => (i - 1 + videos.length) % videos.length
                    )
                  }
                  className="text-white hover:text-[#2E77D0] transition-colors"
                  disabled={currentVideoIndex === 0}
                >
                  <ChevronLeft className="size-6" />
                </button>

                <div className="flex-1 flex justify-center gap-2">
                  {videos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentVideoIndex(index)}
                      className={`
                        size-2 rounded-full transition-all duration-300
                        ${
                          index === currentVideoIndex
                            ? "bg-[#2E77D0] w-6"
                            : "bg-white/50 hover:bg-white"
                        }
                      `}
                    />
                  ))}
                </div>

                <button
                  onClick={() =>
                    setCurrentVideoIndex((i) => (i + 1) % videos.length)
                  }
                  className="text-white hover:text-[#2E77D0] transition-colors"
                  disabled={currentVideoIndex === videos.length - 1}
                >
                  <ChevronRight className="size-6" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureSection({ section, index }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = section.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1, // Stagger effect for sections
      }}
      className="border bg-background rounded-lg p-4 mb-4 hover:border-[#2E77D0]/50 transition-colors"
    >
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left"
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
            {section.title}
          </h3>
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: isOpen ? 360 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Icon className="size-6 text-[#2E77D0]" />
          </motion.div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? <ChevronUp /> : <ChevronDown />}
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground mt-4"
            >
              {section.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <VideoRenderer videos={section.media.videos} />
            </motion.div>

            <motion.ul
              className="space-y-2 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {section.items.map((item: string, idx: number) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="flex items-center gap-3"
                >
                  <span className="text-blue-500 text-2xl">•</span>
                  <p className="text-muted-foreground">{item}</p>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
function FeaturesSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {Object.values(ExtensionFeatures).map((section, index) => (
        <FeatureSection key={section.id} section={section} index={index} />
      ))}
    </motion.section>
  );
}
function BlinkingCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="inline-block w-[2px] h-[0.8em] bg-white/80 ml-1  "
    ></motion.span>
  );
}
// Then create the dynamic typing component
function DynamicTypingTitle() {
  const phrases = [
    "Turn 3 Steps Into 1 Click",
    "Turn 7 Steps Into 1 Click",
    "Turn 5 Steps Into 1 Click",
    "Turn 8 Steps Into 1 Click",
  ];
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const typingSpeed = 100; // Speed for typing
    const deletingSpeed = 80; // Speed for deleting
    const pauseTime = 1000; // Time to pause before deleting

    const timeout = setTimeout(
      () => {
        const targetPhrase = phrases[currentPhrase];

        if (!isDeleting) {
          setDisplayText(targetPhrase.slice(0, displayText.length + 1));

          if (displayText.length === targetPhrase.length) {
            setTimeout(() => setIsDeleting(true), pauseTime);
          }
        } else {
          if (displayText.length === 0) {
            setIsDeleting(false);
            setCurrentPhrase((prev) => (prev + 1) % phrases.length);
          } else {
            setDisplayText(displayText.slice(0, -1));
          }
        }
      },
      isDeleting ? deletingSpeed : typingSpeed
    );

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentPhrase]);

  return (
    <h1 className="text-4xl md:text-5xl font-normal tracking-tighter lg:text-5xl text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
      <span>{displayText}</span>
      <BlinkingCursor />
    </h1>
  );
}
function ExtensionPage() {
  return (
    <div className="min-h-screen flex mt-16 justify-center">
      <main className="pb-12 md:pb-16 relative z-10  mt-16 w-full max-w-6xl px-4">
        {/* Hero Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <BlurFade delay={0.25} inView>
              <div className="text-center mb-6">
                <DynamicTypingTitle />
                <p className="text-lg md:text-xl text-muted-foreground mt-4">
                  Stop wasting time with repetitive After Effects tasks.
                  LayerFlow v2.1 lets you create, duplicate, and modify layers
                  with all your preferred settings in a single action - what
                  usually takes 5-8 clicks now happens instantly.
                </p>
                {/* <div className="mt-8 flex items-center justify-center gap-4">
                  <Link href="https://payhip.com/b/9aevr">
                    <TextureButton variant="primary" size="lg">
                      Buy Now For $25
                      <ArrowRight className="ml-2" />
                    </TextureButton>
                  </Link>
                </div> */}
              </div>
            </BlurFade>
          </motion.div>
        </section>

        <div className="space-y-16">
          {/* Main Features */}
          <FeaturesSection />

          {/* Compatibility Section */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <BlurFade delay={0.25} inView>
                <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 md:p-8">
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                    Compatibility
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <span className="text-green-500 text-4xl">•</span>
                      <p className="text-muted-foreground">
                        Compatible with Adobe After Effects 2021 and above
                      </p>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-cyan-500 text-4xl">•</span>
                      <p className="text-muted-foreground">
                        Fully tested on Windows OS
                      </p>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-orange-500 text-4xl">•</span>
                      <p className="text-muted-foreground">
                        Should work on macOS but haven't tested it there
                      </p>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-purple-500 text-4xl">•</span>
                      <p className="text-muted-foreground">
                        Requires the{" "}
                        <a
                          href="https://aescripts.com/learn/zxp-installer/"
                          target="_blank"
                          className="text-blue-500 underline"
                        >
                          aescripts.com ZXP Installer
                        </a>{" "}
                        to install the extension
                      </p>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-teal-500 text-4xl">•</span>
                      <p className="text-muted-foreground">Version: 2.1.0</p>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-rose-500 text-4xl">•</span>
                      <p className="text-muted-foreground">
                        Last Update: 2024-12-24
                      </p>
                    </li>
                  </ul>
                </div>
              </BlurFade>
            </motion.div>
          </section>

          {/* Call to Action */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <BlurFade delay={0.25} inView>
                <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row gap-8">
                  <div className="w-full lg:w-[600px]">
                    <div style={{ paddingTop: "52.5%" }} className="relative">
                      <Image
                        quality={100}
                        src="/extension/layerFlow-1-v2.png"
                        alt="LayerFlow Extension"
                        fill
                        className="object-cover rounded-xl"
                        sizes="(max-width: 1024px) 100vw, 600px"
                      />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center space-y-8">
                    <div className="text-center md:text-left">
                      <div className="text-4xl md:text-5xl font-bold">$25</div>
                      <p className="text-muted-foreground mt-2">
                        One-time payment
                      </p>
                    </div>

                    <ul className="space-y-4">
                      {[
                        "No subscriptions or recurring fees",
                        "Use on multiple computers",
                        "Full access to all features",
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href="https://payhip.com/b/9aevr" className="mt-auto">
                      <Button variant="blue_plus" size="lg" className="w-full">
                        Buy Now
                        <ArrowRight className="ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </BlurFade>
            </motion.div>
          </section>
          <MoreExtensions currentId="layer-flow" />
        </div>
      </main>

      <AnimatedGridPattern
        numSquares={60}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(1200px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-14%] h-[120%] skew-y-12"
        )}
      />
    </div>
  );
}

export default ExtensionPage;
