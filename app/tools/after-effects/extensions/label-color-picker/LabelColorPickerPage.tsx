"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import Image from "next/image";
import BlurFade from "@/components/ui/blur-fade";
import { MoreExtensions } from "../MoreExtensions";
import { Button } from "@/components/ui/button";
// HeroSection.jsx
function HeroSection() {
  return (
    <section className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <BlurFade delay={0.25} inView>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-normal tracking-tighter lg:text-5xl text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
              Label Color Picker
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mt-4">
              A simple and efficient After Effects extension for managing layer
              label colors with 16 preset colors and random assignment
              functionality.
            </p>
          </div>
        </BlurFade>
      </motion.div>
    </section>
  );
}

function VideoSection() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <section className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <BlurFade delay={0.25} inView>
          <div className="w-full relative">
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
              className="w-full h-auto rounded-[20px] border-2 border-[#2E77D0]/90"
            >
              <source
                src="/extension/labelColorPicker/LabelColorPicker.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </motion.video>
          </div>
        </BlurFade>
      </motion.div>
    </section>
  );
}

// FeaturesSection.jsx
function FeaturesSection() {
  const features = [
    "16 Standard Colors: Full set of After Effects label colors",
    "Random Color Option: Quick random color assignment",
    "Multi-Layer Support: Apply colors to multiple layers at once",
    "Single-Click Application: Fast and efficient color updates",
    "Simple Interface: Clean, intuitive color selection",
  ];

  return (
    <section className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <BlurFade delay={0.25} inView>
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
              Features
            </h2>
            <ul className="space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <span className="text-blue-500 text-4xl">•</span>
                  <p className="text-muted-foreground">{feature}</p>
                </li>
              ))}
            </ul>
          </div>
        </BlurFade>
      </motion.div>
    </section>
  );
}

// CompatibilitySection.jsx
function CompatibilitySection() {
  return (
    <section className="container mx-auto px-4">
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
                <p className="text-muted-foreground">Version: 1.0.0</p>
              </li>
              {/* <li className="flex items-center gap-3">
                      <span className="text-rose-500 text-4xl">•</span>
                      <p className="text-muted-foreground">
                        Last Update: 2024-12-24
                      </p>
                    </li> */}
            </ul>
          </div>
        </BlurFade>
      </motion.div>
    </section>
  );
}

// DownloadSection.jsx
function DownloadSection() {
  return (
    <section className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <BlurFade delay={0.25} inView>
          <div className="max-w-6xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row gap-8">
              <div className="w-full lg:w-[600px]">
                <div style={{ paddingTop: "52.5%" }} className="relative">
                  <Image
                    src="/extension/labelColorPicker.png"
                    alt="Label Color Picker Extension"
                    fill
                    className="object-cover rounded-xl"
                    sizes="(max-width: 1024px) 100vw, 600px"
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center space-y-8">
                <div className="text-center lg:text-left">
                  <div className="text-4xl md:text-5xl font-bold">Free</div>
                  <p className="text-muted-foreground mt-2">
                    Download for After Effects
                  </p>
                </div>

                <Link href="https://payhip.com/b/XYF5g" className="mt-auto">
                  <Button variant="default" className="w-full" size="lg">
                    Download Free
                    <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </BlurFade>
      </motion.div>
    </section>
  );
}

// Main LabelColorPickerPage.jsx
function LabelColorPickerPage() {
  return (
    <div className="min-h-screen mt-16 flex justify-center">
      <main className="pb-12 md:pb-16 relative z-10 space-y-16 mt-16">
        <HeroSection />
        <VideoSection />
        <FeaturesSection />
        <CompatibilitySection />
        <DownloadSection />
        <MoreExtensions currentId="label-color-picker" />
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

export default LabelColorPickerPage;
