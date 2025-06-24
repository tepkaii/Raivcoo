"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Layers,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import BlurFade from "@/components/ui/blur-fade";
import { MoreExtensions } from "../MoreExtensions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ShapeManagerFeatures = {
  shapeManager: {
    id: 1,
    title: "Shape Management",
    icon: Layers,
    description:
      "A visual library for storing and applying shapes. Save shapes from After Effects and quickly apply them to your compositions. Free version supports up to 3 collections with 5 shapes each.",
    media: {
      videos: [
        {
          url: "/extension/shapeManager/shapes.mp4",
          title: "Shape Manager Overview",
        },
      ],
    },
    items: [
      "Create and manage up to 3 collections in free version (unlimited in pro)",
      "Store up to 5 shapes per collection in free version (unlimited in pro)",
      "Visual preview with zoom controls",
      "Custom shape naming and 16 color labels for organization",
      "Import and export individual shapes in .aeshp format",
      "Export shapes as SVG with customizable size",
      "Import and export collections in .aecol and .aecolls formats",
      "Quick shape application to After Effects compositions",
      "Basic property editing and customization",
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
          className="absolute top-2 left-2 z-10 md:top-3 md:left-3"
        >
          <div className="bg-black/60 backdrop-blur-[2px] px-2 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg inline-block">
            <span className="text-[10px] md:text-sm text-white/90 font-medium truncate max-w-[200px] md:max-w-[300px] block">
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
      {Object.values(ShapeManagerFeatures).map((section, index) => (
        <FeatureSection key={section.id} section={section} index={index} />
      ))}
    </motion.section>
  );
}

function ShapeManagerPage() {
  return (
    <div className="min-h-screen mt-16 flex justify-center">
      <main className="pb-12 md:pb-16 relative z-10 mt-16 w-full max-w-6xl px-4">
        {/* Hero Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <BlurFade delay={0.25} inView>
              <div className="text-center mb-6">
                <h1 className="text-4xl md:text-5xl font-normal tracking-tighter lg:text-5xl text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                  Shape Manager for After Effects
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mt-4">
                  Organize, preview, and apply shapes with ease. Save your
                  frequently used shapes and access them instantly with visual a
                  management system.
                </p>
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
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
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
                      <span className="text-purple-500 text-4xl">•</span>
                      <p className="text-muted-foreground">
                        Requires ZXP Installer for installation
                      </p>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-teal-500 text-4xl">•</span>
                      <p className="text-muted-foreground">Version: 1.0.0</p>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-rose-500 text-4xl">•</span>
                      <p className="text-muted-foreground">
                        Last Update: 2025-1-9
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
                <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 md:p-8">
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Free Version Column */}
                    <div className="flex flex-col p-6 bg-card/60 border rounded-xl relative">
                      <div className="text-center">
                        <div className="text-3xl font-bold">Free Version</div>
                        <p className="text-muted-foreground mt-2">
                          Essential Shape Management
                        </p>
                      </div>

                      <div className="mt-8">
                        <h4 className="font-medium mb-4">Features:</h4>
                        <ul className="space-y-4">
                          <li className="flex items-center gap-3">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="flex-1">
                              3 collections maximum
                            </span>
                          </li>
                          <li className="flex items-center gap-3">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="flex-1">
                              5 shapes per collection limit
                            </span>
                          </li>
                          <li className="flex items-center gap-3">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="flex-1">
                              Visual shape preview with zoom
                            </span>
                          </li>
                          <li className="flex items-center gap-3">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="flex-1">
                              Basic shape organization with labels
                            </span>
                          </li>

                          <li className="flex items-center gap-3">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="flex-1">Shape scale controls</span>
                          </li>
                        </ul>
                      </div>

                      <Link
                        href="https://payhip.com/b/JsQBf"
                        className="mt-auto pt-8"
                      >
                        <Button variant="default" className="w-full" size="lg">
                          Download Free Version
                          <ArrowRight className="ml-2" />
                        </Button>
                      </Link>
                    </div>

                    {/* Pro Version Column */}
                    <div className="flex flex-col p-6 bg-card/60 border rounded-xl relative">
                      <Badge
                        variant={"default"}
                        className="absolute -top-4 right-4 px-3 py-1 text-sm"
                      >
                        Pro Version
                      </Badge>

                      <div className="text-center">
                        <div className="text-3xl font-bold">$15</div>
                        <p className="text-muted-foreground mt-2">
                          Lifetime Access • One-time payment
                        </p>
                      </div>

                      <div className="mt-8">
                        <h4 className="font-medium mb-4">
                          Everything in Free, plus:
                        </h4>
                        <ul className="space-y-4">
                          <li className="flex items-center gap-3">
                            <Check className="h-5 w-5 text-[#2E77D0] flex-shrink-0" />
                            <span className="flex-1">
                              Unlimited collections
                            </span>
                          </li>
                          <li className="flex items-center gap-3">
                            <Check className="h-5 w-5 text-[#2E77D0] flex-shrink-0" />
                            <span className="flex-1">
                              Unlimited shapes per collection
                            </span>
                          </li>

                          <li className="flex items-center gap-3">
                            <Check className="h-5 w-5 text-[#2E77D0] flex-shrink-0" />
                            <span className="flex-1">
                              Priority updates and support
                            </span>
                          </li>
                          <li className="flex items-center gap-3">
                            <Check className="h-5 w-5 text-[#2E77D0] flex-shrink-0" />
                            <span className="flex-1">
                              Use on multiple computers
                            </span>
                          </li>
                        </ul>
                      </div>

                      <Link
                        href="https://payhip.com/b/JsQBf"
                        className="mt-auto pt-8"
                      >
                        <Button variant="default" className="w-full" size="lg">
                          Get Pro Version
                          <ArrowRight className="ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </BlurFade>
            </motion.div>
          </section>
          {/* Limitations Section */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <BlurFade delay={0.25} inView>
                <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 md:p-8">
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                    Important Notes & Limitations
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <span className="text-amber-500 text-4xl">•</span>
                      <p className="text-muted-foreground">
                        Before saving shapes created with After Effects basic
                        shape tools (Rectangle, Ellipse, etc.), convert them to
                        Bezier paths: Right-click on the shape path (e.g.,
                        "Rectangle Path 1") and choose "Convert to Bezier Path".
                      </p>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-rose-500 text-4xl">•</span>
                      <p className="text-muted-foreground">
                        Some shape properties and effects from After Effects
                        cannot be preserved when saving due to extension API
                        limitations.
                      </p>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-purple-500 text-4xl">•</span>
                      <p className="text-muted-foreground">
                        SVG export may not be 100% accurate for complex shapes,
                        nested groups, or shapes with effects. Best results are
                        achieved with simple shapes.
                      </p>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-blue-500 text-4xl">•</span>
                      <p className="text-muted-foreground">
                        Large or complicated shape layers may result in
                        approximate SVG exports and previews. Consider breaking
                        down complex shapes into simpler components.
                      </p>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-indigo-500 text-4xl">•</span>
                      <p className="text-muted-foreground">
                        Real-time preview in the extension may differ slightly
                        from the final result in After Effects, especially for
                        shapes with complex properties or effects.
                      </p>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-teal-500 text-4xl">•</span>
                      <p className="text-muted-foreground">
                        For best results, save shapes in their simplest form
                        without complex effects or transformations that may not
                        transfer correctly.
                      </p>
                    </li>
                  </ul>
                </div>
              </BlurFade>
            </motion.div>
          </section>
          <MoreExtensions currentId="shape-manager" />
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

export default ShapeManagerPage;
