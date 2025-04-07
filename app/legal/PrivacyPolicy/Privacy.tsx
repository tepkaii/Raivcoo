"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ReactNode, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className=" rounded-lg p-4  sm:p-6 md:p-8  duration-300 bg-card">
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

const Privacy = () => {
  return (
    <div className="min-h-screen flex justify-center">
      <main className="pb-12 md:pb-16  space-y-16 mt-32 container">
        <FadeInSection delay={0.2}>
          <BlurFade delay={0.25} inView>
            <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
              <h1
                className="text-4xl md:text-5xl font-normal tracking-tighter lg:text-5xl text-transparent bg-clip-text 
                dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]
                bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]"
              >
                Privacy Policy
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mt-2 px-4">
                Learn how we handle and protect your personal information
              </p>
            </div>
          </BlurFade>
        </FadeInSection>

        <Card className="mx-auto border-0">
          <CardContent className="p-4 sm:p-8 md:p-12">
            <div className="space-y-6 sm:space-y-8">
              <Section title="Information Collection" index={0}>
                <div className="space-y-4 text-muted-foreground">
                  <p className="leading-relaxed">
                    We collect information you provide when creating an account
                    and using our service:
                  </p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li className="leading-relaxed">
                      Basic account information including name, email, and
                      profile details
                    </li>
                    <li className="leading-relaxed">
                      Authentication through third-party services (we don't
                      store passwords)
                    </li>
                    <li className="leading-relaxed">
                      Portfolio content including video URLs and descriptions
                    </li>
                    <li className="leading-relaxed">
                      Usage data and analytics to improve our service
                    </li>
                  </ul>
                </div>
              </Section>

              <Section title="Use of Information" index={1}>
                <div className="space-y-4 text-muted-foreground">
                  <p className="leading-relaxed">
                    We use the collected information to:
                  </p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li className="leading-relaxed">
                      Provide and maintain our core services
                    </li>
                    <li className="leading-relaxed">
                      Communicate important updates and information
                    </li>
                    <li className="leading-relaxed">
                      Personalize your platform experience
                    </li>
                    <li className="leading-relaxed">
                      Analyze and improve our services
                    </li>
                  </ul>
                </div>
              </Section>

              <Section title="Third-Party Data Handling" index={2}>
                <div className="space-y-4 text-muted-foreground">
                  <p className="leading-relaxed">
                    Video content linked in your portfolio is subject to
                    third-party platform policies:
                  </p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li className="leading-relaxed">
                      YouTube, Vimeo, and other hosting platforms' privacy
                      policies apply
                    </li>
                    <li className="leading-relaxed">
                      We only store URLs and metadata, not the videos themselves
                    </li>
                    <li className="leading-relaxed">
                      Review each platform's privacy policy for complete
                      information
                    </li>
                  </ul>
                </div>
              </Section>

              <Section title="Public Accessibility" index={3}>
                <div className="space-y-4 text-muted-foreground">
                  <p className="leading-relaxed">
                    Control your portfolio's visibility:
                  </p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li className="leading-relaxed">
                      Portfolios are public by default but can be made private
                    </li>
                    <li className="leading-relaxed">
                      Individual sections can be shown or hidden
                    </li>
                    <li className="leading-relaxed">
                      Control access to sensitive information
                    </li>
                  </ul>
                </div>
              </Section>

              <Section title="Data Security" index={4}>
                <div className="space-y-4 text-muted-foreground">
                  <p className="leading-relaxed">
                    We prioritize your data security through:
                  </p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li className="leading-relaxed">
                      Industry-standard encryption protocols
                    </li>
                    <li className="leading-relaxed">
                      Regular security audits and updates
                    </li>
                    <li className="leading-relaxed">
                      Secure data storage and transmission
                    </li>
                  </ul>
                </div>
              </Section>

              <Section title="Your Rights" index={5}>
                <div className="space-y-4 text-muted-foreground">
                  <p className="leading-relaxed">You have the right to:</p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li className="leading-relaxed">
                      Access and export your personal data
                    </li>
                    <li className="leading-relaxed">
                      Request corrections or deletion of your information
                    </li>
                    <li className="leading-relaxed">
                      Opt out of certain data processing activities
                    </li>
                    <li className="leading-relaxed">
                      Receive timely responses to your privacy requests
                    </li>
                  </ul>
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
                    Have questions about our privacy policy?
                  </p>
                  <Link href="/support">
                    <Link href="/support">
                      <Button variant="default" size="lg">
                        Contact Support
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
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

export default Privacy;
