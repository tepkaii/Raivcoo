"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ReactNode, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TextureButton } from "@/components/ui/texture-button";
import { ArrowRight } from "lucide-react";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import BlurFade from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";

interface FadeInSectionProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

const FadeInSection = ({
  children,
  delay = 0,
  className = "",
}: FadeInSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "-100px",
    amount: 0.3,
  });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.5,
        delay,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
  index: number;
}

const Section = ({ title, children, index }: SectionProps) => (
  <FadeInSection delay={index * 0.1}>
    <BlurFade delay={index * 0.15} inView>
      <div className=" rounded-lg p-4 sm:p-6 md:p-8 hover:shadow-md transition-shadow duration-300 bg-card">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-base sm:text-lg">
              {index + 1}
            </span>
          </div>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-transparent bg-clip-text 
            dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]
            bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]"
          >
            {title}
          </h2>
        </div>
        <div className="prose prose-gray dark:prose-invert max-w-none prose-base sm:prose-lg">
          {children}
        </div>
      </div>
    </BlurFade>
  </FadeInSection>
);

const Terms = () => {
  return (
    <div className="min-h-screen flex justify-center">
      <main className="pb-12 md:pb-16 space-y-16 mt-32 container">
        <FadeInSection delay={0.2}>
          <BlurFade delay={0.25} inView>
            <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
              <h1
                className="text-4xl md:text-5xl font-normal tracking-tighter lg:text-5xl text-transparent bg-clip-text 
                dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]
                bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]"
              >
                Terms of Service
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mt-2 px-4">
                Please read these terms carefully before using Raivcoo's video
                portfolio platform
              </p>
            </div>
          </BlurFade>
        </FadeInSection>

        <Card className="mx-auto border-0">
          <CardContent className="p-4 sm:p-8 md:p-12">
            <div className="space-y-6 sm:space-y-8">
              <Section title="Acceptance of Terms" index={0}>
                <div className="space-y-4 text-muted-foreground">
                  <p className="leading-relaxed">
                    By accessing and using Raivcoo (the "Service"), you agree to
                    be bound by these Terms of Service ("Terms"). If you
                    disagree with any part of the terms, you may not access the
                    Service.
                  </p>
                </div>
              </Section>

              <Section title="Description of Service" index={1}>
                <div className="space-y-4 text-muted-foreground">
                  <p className="leading-relaxed">
                    Raivcoo is a platform that allows users to create and
                    showcase video editing portfolios by linking to externally
                    hosted videos. The service includes free features with
                    potential paid features in the future.
                  </p>
                </div>
              </Section>

              <Section title="User Accounts" index={2}>
                <div className="space-y-4 text-muted-foreground">
                  <ul className="space-y-2 pl-6 list-disc">
                    <li className="leading-relaxed">
                      You must be at least 13 years old to use this Service
                    </li>
                    <li className="leading-relaxed">
                      You are responsible for maintaining the confidentiality of
                      your account and password
                    </li>
                    <li className="leading-relaxed">
                      You agree to accept responsibility for all activities that
                      occur under your account
                    </li>
                  </ul>
                </div>
              </Section>

              <Section title="External Links to Videos" index={3}>
                <div className="space-y-4 text-muted-foreground">
                  <p className="leading-relaxed">
                    Users are only permitted to embed or link to videos hosted
                    on third-party platforms. By doing so, you agree to comply
                    with the terms of service of those platforms.
                  </p>
                  <p className="leading-relaxed">
                    You are solely responsible for ensuring that the linked
                    videos comply with copyright laws and that you have the
                    necessary rights to display the content.
                  </p>
                </div>
              </Section>

              <Section title="Prohibited Activities" index={4}>
                <div className="space-y-4 text-muted-foreground">
                  <p className="leading-relaxed">
                    You agree not to engage in any of the following activities:
                  </p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li className="leading-relaxed">
                      Violating laws or regulations
                    </li>
                    <li className="leading-relaxed">
                      Infringing on intellectual property rights
                    </li>
                    <li className="leading-relaxed">
                      Linking to illegal, copyrighted, or inappropriate content
                    </li>
                    <li className="leading-relaxed">
                      Uploading malicious code or content
                    </li>
                    <li className="leading-relaxed">Impersonating others</li>
                  </ul>
                </div>
              </Section>

              <Section title="Termination" index={5}>
                <div className="space-y-4 text-muted-foreground">
                  <p className="leading-relaxed">
                    We reserve the right to terminate or suspend access to our
                    Service immediately, without prior notice or liability, for
                    any reason whatsoever, including without limitation if you
                    breach the Terms.
                  </p>
                </div>
              </Section>

              <Section title="Contact Information" index={6}>
                <div className="space-y-4">
                  <p className="leading-relaxed text-muted-foreground">
                    Reach out to us through any of these channels:
                  </p>
                  <div className="bg-primary/5 p-6 rounded-lg space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <span className="font-semibold min-w-[100px]">
                        Email:
                      </span>
                      <Link
                        href="mailto:support@raivcoo.com"
                        className="text-primary hover:underline"
                      >
                        support@raivcoo.com
                      </Link>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <span className="font-semibold min-w-[100px]">
                        Twitter:
                      </span>
                      <Link
                        href="https://twitter.com/raivcoo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        @raivcoo
                      </Link>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <span className="font-semibold min-w-[100px]">
                        Discord:
                      </span>
                      <Link
                        href="https://discord.gg/G5AZBEP5"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Join our Discord Community
                      </Link>
                    </div>
                  </div>
                </div>
              </Section>
            </div>

            <FadeInSection delay={0.4}>
              <div className="mt-12 text-center space-y-6">
                {/* <p className="text-muted-foreground">
                  Last updated:{" "}
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p> */}
                <div className="flex flex-col items-center gap-4">
                  <p className="text-muted-foreground">
                    Have questions about our terms?
                  </p>
                  <Link href="/support">
                    <Button variant="default" size="lg">
                      Contact Support
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </FadeInSection>
          </CardContent>
        </Card>
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
};

export default Terms;
