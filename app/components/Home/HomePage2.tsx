// app/home/page.tsx
"use client";


import Image from "next/image";
import { motion } from "framer-motion";
import { GridBackground, Spotlight } from "@/components/ui/spotlight-new";
import { Badge } from "@/components/ui/badge";
import { TextShimmer } from "@/components/ui/text-shimmer";

export default function HomePage2() {
  return (
    <div className="min-h-screen bg-background overflow-hidden text-foreground">
      <GridBackground />
      <Spotlight />
      <div className="relative z-40">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 text-center container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="bg-black/70 mb-6">
              <TextShimmer>🚀 Coming Soon</TextShimmer>
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]"
          >
            Upload. Share. Get Feedback.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mt-6 mb-8"
          >
            The complete video review platform. Upload your videos, images, and
            files directly to our secure servers. Share links with clients and
            get timestamped feedback without any logins required.
          </motion.p>
        </section>

        {/* Preview Image */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="container mx-auto px-4 pb-16"
        >
          <div className="relative rounded-xl overflow-hidden border border-[#3F3F3F] shadow-2xl max-w-4xl mx-auto">
            <Image
              quality={100}
              priority
              src="/riv-app.png"
              alt="Video Review Dashboard Preview"
              width={1200}
              height={700}
              className="w-full h-auto opacity-80"
            />
          </div>
        </motion.section>
      </div>
    </div>
  );
}
