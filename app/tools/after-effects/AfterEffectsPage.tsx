"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { TextureButton } from "@/components/ui/texture-button";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";

export default function AfterEffectsPage() {
  return (
    <div className="min-h-screen flex justify-center">
      <main className="pb-12 md:pb-16 relative z-10 space-y-16 mt-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-4xl mx-auto text-center">
              <h1
                className="text-4xl md:text-5xl font-normal tracking-tighter lg:text-5xl text-transparent bg-clip-text 
                dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]
                bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]"
              >
                After Effects Resources
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mt-4">
                Everything you need to enhance your After Effects workflow
              </p>
            </div>
          </motion.div>
        </section>

        {/* Categories */}
        <section className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Extensions Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-lg border bg-card shadow-sm"
            >
              <h3 className="text-2xl font-bold mb-4">Extensions</h3>
              <p className="text-muted-foreground mb-6">
                Browse popular After Effects extensions and plugins
              </p>
              <Link href="/tools/after-effects/extensions">
                <TextureButton variant="primary" className="w-full">
                  View Extensions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </TextureButton>
              </Link>
            </motion.div>

            {/* Presets Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-lg border bg-card shadow-sm"
            >
              <h3 className="text-2xl font-bold mb-4">Presets</h3>
              <p className="text-muted-foreground mb-6">
                Discover animation presets and templates
              </p>
              <TextureButton variant="primary" className="w-full">
                Coming Soon
                <ArrowRight className="ml-2 h-4 w-4" />
              </TextureButton>
            </motion.div>

            {/* Scripts Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-lg border bg-card shadow-sm"
            >
              <h3 className="text-2xl font-bold mb-4">Scripts</h3>
              <p className="text-muted-foreground mb-6">
                Explore automation scripts and utilities
              </p>
              <TextureButton variant="primary" className="w-full">
                Coming Soon
                <ArrowRight className="ml-2 h-4 w-4" />
              </TextureButton>
            </motion.div>
          </div>
        </section>
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
