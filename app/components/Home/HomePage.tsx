"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Check } from "lucide-react";
import { RevButtons } from "@/components/ui/RevButtons";
import { BorderTrail } from "@/components/ui/border-trail";
import { GridBackground, Spotlight } from "@/components/ui/spotlight-new";
import { BentoDemo } from "../bentos";
import { AnimatedBeamDemo } from "./Beams";
import { LandingHero } from "./LandingHero";

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
    <div className="min-h-screen bg-background overflow-hidden  text-foreground">
      <GridBackground />
      <Spotlight />
      <div className="relative  z-40">
        <section className="pt-32 pb-10 px-4 text-center container mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]"
          >
            Clean, Collaborative Video Review
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mt-6"
          >
            RAIVCOO is designed for 1-on-1 editor to client collaboration.
            Simple UI, clean workflow, and direct communication all in one
            place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col md:flex-row gap-4 justify-center mt-8"
          >
            <Link href="/signup">
              <RevButtons size="lg" variant="default">
                Start For Free
              </RevButtons>
            </Link>
          </motion.div>
          {/* <p className="text-sm text-muted-foreground mt-4">
            No credit card required • Adobe AE & PR extensions included
          </p> */}
        </section>
        {/* <div className="mt-[-160px] md:mt-0">
          <LandingHero />
        </div> */}

        <AnimatedSection className="">
          <div className="container mx-auto px-4">
            <div className="relative rounded-xl overflow-hidden border border-[#3F3F3F] shadow-2xl max-w-5xl mx-auto">
              <Image
                src="/1.png"
                alt="RAIVCOO Dashboard"
                width={1200}
                height={700}
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-20"></div>
            </div>
          </div>
        </AnimatedSection>

        {/* Value Section */}
        <AnimatedSection className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
              Built for Real-World Editor Workflows
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple project sharing and feedback system designed for the direct
              collaboration between editors and clients.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection className="container mx-auto px-4">
          <BentoDemo />
        </AnimatedSection>

        {/* Features Grid */}
        {/* <AnimatedSection className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-card/50 p-6 rounded-xl border border-[#3F3F3F] hover:border-primary transition-all duration-300">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="h-6 w-6 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 15L8 11H16L12 15Z" fill="currentColor" />
                    <path
                      d="M3 5V19H21V5H3ZM19 17H5V7H19V17Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  1-on-1 Collaboration
                </h3>
                <p className="text-muted-foreground">
                  Direct editor-to-client workflow with simple project
                  management and feedback.
                </p>
              </div>
              <div className="bg-card/50 p-6 rounded-xl border border-[#3F3F3F] hover:border-primary transition-all duration-300">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="h-6 w-6 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M17 3H7C5.9 3 5 3.9 5 5V21L12 18L19 21V5C19 3.9 18.1 3 17 3ZM17 18L12 15.82L7 18V5H17V18Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Client Revision Rounds
                </h3>
                <p className="text-muted-foreground">
                  Clients create new revision rounds with their feedback,
                  keeping track of all changes.
                </p>
              </div>
              <div className="bg-card/50 p-6 rounded-xl border border-[#3F3F3F] hover:border-primary transition-all duration-300">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="h-6 w-6 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 10H16V12H12V10ZM8 10H10V12H8V10ZM12 6H16V8H12V6ZM8 6H10V8H8V6Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Adobe Integration
                </h3>
                <p className="text-muted-foreground">
                  After Effects and Premiere Pro extensions for seamless
                  workflow integration.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection> */}

        {/* Comments / Rounds */}
        <AnimatedSection className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <Image
                src="/2.png"
                alt="Client Comment Flow"
                width={600}
                height={400}
                className="w-full h-auto rounded-xl border border-[#3F3F3F] shadow-xl"
              />
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                  Client-Driven Revision Process
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Editors upload the first round, then clients review and create
                  new rounds with their feedback. Clients can add comments,
                  reference images, and links to any video.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-1" />
                    <span>
                      Support for YouTube, Vimeo, Goggle Drive, and Dropbox, amd
                      Images
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-1" />
                    <span>Reference image uploads with comments</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-1" />
                    <span>
                      Live track of review rounds and revision history
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Adobe Integration */}
        <AnimatedSection className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div className="order-2 md:order-1">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                  Adobe Creative Cloud Integration
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Access client feedback directly in your favorite editing
                  applications with our Adobe extensions.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-1" />
                    <div className="flex items-center gap-2">
                      <span>Adobe After Effects extension</span>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-1" />
                    <div className="flex items-center gap-2">
                      <span>Adobe Premiere Pro extension</span>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-1" />
                    <span>
                      Browser access for when you're away from your desk
                    </span>
                  </li>
                </ul>
              </div>
              <Image
                src="/3.png"
                alt="App Access"
                width={600}
                height={400}
                className="w-full h-auto rounded-xl border border-[#3F3F3F] shadow-xl order-1 md:order-2"
              />
            </div>
          </div>
        </AnimatedSection>

        {/* CTA */}
        <AnimatedSection className="py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="bg-card border-2 border-[#3F3F3F] rounded-xl p-12 max-w-3xl mx-auto relative overflow-hidden">
              <BorderTrail />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                Get Started Today
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Simple project sharing. Client-driven revision rounds. Adobe
                AE/PR extensions. Get started today - completely free.
              </p>
              <Link href="/signup">
                <RevButtons size="lg" variant="default">
                  Start For Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </RevButtons>
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}