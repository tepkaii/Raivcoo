"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlignCenter,
  Sparkle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  Layers,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import BlurFade from "@/components/ui/blur-fade";
import Link from "next/link";
import Image from "next/image";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { MoreExtensions } from "../MoreExtensions";
import { Button } from "@/components/ui/button";

const DuplicateFeatures = {
  mainFeatures: {
    id: 1,
    title: "Main Features",
    icon: AlignCenter,
    description:
      "The core functionalities of Re-Duplicate, including layer order, number of duplicates, name options, and enabling options like 3D, motion blur, hide, and solo layer.",
    media: {
      videos: [
        {
          url: "/extension/re-duplicate/General.mp4",
          title: "Main Features Overview",
        },
      ],
    },
    items: [
      "Layer Order: Place duplicates above or below the selected layer",
      "Number of Duplicates: Choose how many duplicates to create (up to 10)",
      "Name Options: Add prefix, suffix, or change the name entirely",
      "Label Colors: 16 label colors plus random color option for duplicates",
      "Layer attributes: Enable 3D, motion blur, hide, solo, and lock layer options",
    ],
  },

  perLayerMode: {
    id: 2,
    title: "Per-Layer Settings Mode",
    icon: Layers,
    description:
      "Configure each duplicate individually with unique settings. Perfect for creating complex layer arrangements with different properties for each duplicate.",
    media: {
      videos: [
        {
          url: "/extension/re-duplicate/Per-layer settings.mp4",
          title: "Per-Layer Settings in Action",
        },
      ],
    },
    items: [
      "Individual Configuration: Set unique properties for each duplicate",
      "Copy Settings: Easily copy current settings to all duplicates",
      "Custom Names: Different prefix, suffix, and names for each duplicate",
      "Unique Properties: Different layer attributes, colors, and transforms per duplicate",
      "Visual Layer Selector: Easy navigation between duplicate configurations",
    ],
  },

  mirrorFeature: {
    id: 3,
    title: "Mirror Feature",
    icon: Sparkle,
    description:
      "Mirror the duplicated layers horizontally, vertically, or both. Automatically flips position, scale, and rotation properties.",
    media: {
      videos: [
        {
          url: "/extension/re-duplicate/Mirror.mp4",
          title: "Mirror Feature in Action",
        },
      ],
    },
    items: [
      "Horizontal Mirror: Flip the duplicated layers horizontally",
      "Vertical Mirror: Flip the duplicated layers vertically",
      "Both Mirror: Flip the duplicated layers both horizontally and vertically",
      "Keyframe Support: Works with animated properties and keyframes",
      "Smart Transform: Automatically adjusts position, scale, and rotation",
    ],
  },

  precompOptions: {
    id: 4,
    title: "Enhanced Precomp Options",
    icon: Layers,
    description:
      "Advanced precomp duplication with customizable nesting levels, folder organization, and source management for complex project structures.",
    media: {
      videos: [
        {
          url: "/extension/re-duplicate/Original and nested Original pre-comps.mp4",
          title: "Basic Precomp Duplication",
        },
        {
          url: "/extension/re-duplicate/Original Pre-coms with nested level input and the option to create a folder in the project for it.mp4",
          title: "Enhanced Precomp Features",
        },
      ],
    },
    items: [
      "Create Unique Source Precomps: Duplicate precomps as independent sources",
      "Custom Nesting Levels: Choose how deep to duplicate nested precomps (1-∞)",
      "All Nested Levels: Option to duplicate all nested precomps infinitely",
      "Project Folder Organization: Automatically create and organize duplicated sources",
      "Folder Customization: Custom folder names and 16 color label options",
      "Smart Source Management: Handles complex nested precomp structures",
    ],
  },

  settingsDialog: {
    id: 5,
    title: "Customizable Interface",
    icon: Settings, // You might want to use a settings icon instead
    description:
      "Customize the extension interface to show only the features you need. Hide sections, customize color palettes, and streamline your workflow.",
    media: {
      videos: [
        {
          url: "/extension/re-duplicate/dr-Settings.mp4", // You'll need to create this video
          title: "Interface Customization",
        },
      ],
    },
    items: [
      "Show/Hide Sections: Display only the features you use",
      "Custom Color Palettes: Choose which label colors to show",
      "Section Reordering: Arrange interface sections in your preferred order",
      "Streamlined Workflow: Remove clutter and focus on your needs",
      "Save Preferences: Your customizations persist between sessions",
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
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute top-2 left-2 z-10 md:top-3 md:left-3"
        >
          <div className="bg-black/60 backdrop-blur-[2px] px-2 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg inline-block">
            <span className="text-[10px] md:text-sm text-white/90 font-medium truncate max-w-[200px] md:max-w-[300px] block">
              {videos[currentVideoIndex].title}
            </span>
          </div>
        </motion.div>
        <div className="rounded-2xl shadow-lg overflow-hidden relative">
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
        delay: index * 0.1,
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
      {Object.values(DuplicateFeatures).map((section, index) => (
        <FeatureSection key={section.id} section={section} index={index} />
      ))}
    </motion.section>
  );
}

function ExtensionPage() {
  return (
    <div className="min-h-screen mt-16 flex justify-center">
      <main className="pb-12 md:pb-16 relative z-10 mt-16 w-full max-w-6xl px-4">
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <BlurFade delay={0.25} inView>
              <div className="text-center mb-6">
                <h1 className="text-4xl md:text-5xl font-normal tracking-tighter lg:text-5xl text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                  Re-Duplicate: Layer Duplication and Transformation Tool
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mt-4">
                  Re-Duplicate helps you quickly duplicate and adjust layers in
                  After Effects. You can control how layers are named, ordered,
                  and transformed, with options like mirroring, numbers of
                  duplicate, and more. It’s a handy tool for saving time and
                  staying organized.
                </p>
              </div>
            </BlurFade>
          </motion.div>
        </section>

        <div className="space-y-16">
          <FeaturesSection />

          {/* Compatibility Section */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <BlurFade delay={0.25} inView>
                <div className="bg-card/50 backdrop-blur-lg border rounded-2xl p-6 md:p-8">
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
                      <p className="text-muted-foreground">Version: 2.0.0</p>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-rose-500 text-4xl">•</span>
                      <p className="text-muted-foreground">
                        Last Update: 2025-7-11
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
                        src="/extension/re-duplicate/re-duplicate.png"
                        alt="ReAlign Extension"
                        fill
                        className="object-cover rounded-xl"
                        sizes="(max-width: 1024px) 100vw, 600px"
                      />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center space-y-8">
                    <div className="text-center md:text-left">
                      <div className="text-4xl md:text-5xl font-bold">Free</div>
                      <p className="text-muted-foreground mt-2">
                        Download for After Effects
                      </p>
                    </div>

                    <Link href="https://payhip.com/b/AJIMO" className="mt-auto">
                      <Button variant="default" className="w-full" size="lg">
                        Download Now
                        <ArrowRight className="ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </BlurFade>
            </motion.div>
          </section>
          <MoreExtensions currentId="re-duplicate" />
        </div>
      </main>

      {/* Background */}
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
