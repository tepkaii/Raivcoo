// HomePage.jsx
"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import { RevButtons } from "@/components/ui/RevButtons";
import { ArrowRight } from "lucide-react";

// Import hero image
import HeroImage from "../../../public/HeroIMage2.png";
import { BorderTrail } from "@/components/ui/border-trail";
import { GridBackground, Spotlight } from "@/components/ui/spotlight-new";

// Create a Section component that animates when in view
function AnimatedSection({ children, className }: any) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className={className}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.6 }}
      >
        {children}
      </motion.div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen  bg-background text-foreground  relative">
      <GridBackground />
      <Spotlight />
      <div className="relative  z-50">
        {/* Hero Section */}
        <section>
          <div className="container  mx-auto px-4">
            <div className="flex flex-col items-center text-center">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-5xl md:text-6xl mt-32  mb-2 font-bold tracking-tight text-transparent bg-clip-text 
                dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]
                bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]"
              >
                Showcase Your Value to Clients
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-muted-foreground max-w-2xl mb-4"
              >
                Create a clean, organized portfolio designed for video editors.
                Use ready-made templates to get started fast, and track how your
                profile performs with helpful analytics — all free and built
                around what matters most to your work.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="flex flex-wrap md:flex-nowrap justify-center items-center gap-4">
                  <Link href="/signup" className="flex-1 md:flex-none">
                    <RevButtons
                      size="lg"
                      className="flex-1 md:flex-none w-full"
                      variant="outline"
                    >
                      Get Started Free
                    </RevButtons>
                  </Link>
                  <Link href="/portfolio/demo" className="flex-1 md:flex-none">
                    <RevButtons
                      size="lg"
                      className="flex-1 md:flex-none w-full"
                      variant="default"
                    >
                      Try Without Signing Up
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </RevButtons>
                  </Link>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-12 w-full max-w-5xl"
              >
                <div className="animated-border border-[2px] border-[#3F3F3F]">
                  <BorderTrail
                    size={120}
                    style={{
                      boxShadow:
                        "0px 0px 50px 30px rgb(139 92 246 / 30%), 0 0 100px 60px rgb(0 0 0 / 50%)",
                    }}
                  />
                  <Image
                    src={HeroImage}
                    alt="Portfolio Demo"
                    width={1920}
                    height={1080}
                    className="w-full h-auto rounded-xl"
                    quality={90}
                    loading="lazy"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Title Section */}
        <AnimatedSection className="py-6 mt-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
              Everything You Need To Showcase Your Work
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto ">
              All features available completely free - no hidden costs or
              premium tiers
            </p>
          </div>
        </AnimatedSection>

        {/* Portfolio Builder Section */}
        <AnimatedSection className="py-6 mt-12">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="order-first">
                  <Image
                    src="/Portfolio.png"
                    alt="Portfolio"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-lg border-2 border-[#3F3F3F]"
                    quality={100}
                    loading="lazy"
                  />
                </div>
                <div className="order-last">
                  <h3 className="text-xl flex items-center font-semibold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                    Portfolio Builder
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    easy drag-and-drop builder includes pre-built components
                    like testimonials, Worked with client , and social media.
                    Video creators get optimized sections to showcase content
                    from YouTube, Vimeo, and more with customizable layouts and
                    animations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* SEO Section */}
        <AnimatedSection className="py-6 mt-12">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="order-last md:order-first">
                  <h3 className="text-xl flex items-center font-semibold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                    SEO Tools
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    Take control of how your portfolio appears in search results
                    with customizable titles and descriptions. Get a
                    professional web address with your personalized subdomain
                    (yourname.raivcoo.com) for easy sharing.
                  </p>
                </div>
                <div className="order-first md:order-last">
                  <Image
                    src="/SEO.png"
                    alt="SEO"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-lg border-2 border-[#3F3F3F]"
                    quality={100}
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* OG Image Section */}
        <AnimatedSection className="py-6 mt-12">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="order-first">
                  <Image
                    src="/OG.png"
                    alt="OG Image Demo"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-lg border-2 border-[#3F3F3F]"
                    quality={100}
                    loading="lazy"
                  />
                </div>
                <div className="order-last">
                  <h3 className="text-xl font-semibold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                    Custom OG Images
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    Upload your own custom preview images that appear when your
                    portfolio is shared on social media platforms. Make a
                    professional impression before viewers even click.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Favicon Section */}
        <AnimatedSection className="py-6 mt-12">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="order-last md:order-first">
                  <h3 className="text-xl font-semibold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                    Custom Favicon
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    Upload your own custom favicon to make your portfolio
                    instantly recognizable in browser tabs and bookmarks.
                    Strengthen your brand presence across the web.
                  </p>
                </div>
                <div className="order-first md:order-last">
                  <Image
                    src="/Favion.png"
                    alt="Favicon Demo"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-lg border-2 border-[#3F3F3F]"
                    quality={100}
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Password Protection Section */}
        <AnimatedSection className="py-6 mt-12">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="order-first">
                  <Image
                    src="/PPP.png"
                    alt="Password Protection Demo"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-lg border border-[#3F3F3F]"
                    quality={100}
                    loading="lazy"
                  />
                </div>
                <div className="order-last">
                  <h3 className="text-xl font-semibold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                    Password Protection
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    Password-protect your portfolio to restrict access when
                    sharing with select clients. Ideal for work-in-progress
                    projects or exclusive content.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Analytics Dashboard Section */}
        <AnimatedSection className="py-6 mt-12">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="order-last md:order-first">
                  <h3 className="text-xl font-semibold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                    Built-in Analytics
                  </h3>
                  <div className="space-y-4">
                    <p className="text-muted-foreground text-lg">
                      Track engagement metrics, geographic insights, and traffic
                      sources to understand how visitors interact with your
                      portfolio and optimize for maximum impact.
                    </p>
                  </div>
                </div>
                <div className="order-first md:order-last">
                  <Image
                    src="/AAA.png"
                    alt="Analytics Dashboard Demo"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-lg border border-[#3F3F3F]"
                    quality={100}
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* CTA Section */}
        <AnimatedSection className="py-6 mb-12 bg-background mt-12">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto bg-card border-2 border-[#3F3F3F] rounded-xl p-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                Ready to Build Your Professional Portfolio?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
                Join thousands of professionals showcasing their work with our
                completely free platform
              </p>
              <Link href="/signup">
                <RevButtons size="lg" variant="default">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </RevButtons>
              </Link>
              <p className="mt-8 text-muted-foreground">
                No credit card required • Set up in minutes • Always free
              </p>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}