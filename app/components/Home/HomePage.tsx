// app/home/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Shield,
  Clock,
  Users,
  Zap,
  Play,
  MessageCircle,
  Database,
  Star,
  Upload,
  FileVideo,
  Image as ImageIcon,
  FileText,
} from "lucide-react";

import { BorderTrail } from "@/components/ui/border-trail";
import { GridBackground, Spotlight } from "@/components/ui/spotlight-new";

import { Badge } from "@/components/ui/badge";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "@heroicons/react/24/solid";

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

function PricingCard({
  plan,
  price,
  storage,
  features,
  popular = false,
  isYearly = false,
}: any) {
  const [storageSlider, setStorageSlider] = useState([0]);

  // Calculate pricing for interactive plans
  const isInteractive = plan === "Lite" || plan === "Pro";

  let totalStorage,
    displayPrice,
    basePrice,
    additionalStoragePrice,
    additionalStorageUnit,
    baseStorage;

  if (plan === "Lite") {
    baseStorage = 50;
    basePrice = 2.99;
    additionalStoragePrice = 1.0;
    additionalStorageUnit = 25;
    totalStorage = baseStorage + storageSlider[0] * additionalStorageUnit;
    const monthlyPrice = basePrice + storageSlider[0] * additionalStoragePrice;
    displayPrice = isYearly ? monthlyPrice * 8.4 : monthlyPrice; // 30% discount
  } else if (plan === "Pro") {
    baseStorage = 250;
    basePrice = 5.99;
    additionalStoragePrice = 1.5;
    additionalStorageUnit = 50;
    totalStorage = baseStorage + storageSlider[0] * additionalStorageUnit;
    const monthlyPrice = basePrice + storageSlider[0] * additionalStoragePrice;
    displayPrice = isYearly ? monthlyPrice * 8.4 : monthlyPrice; // 30% discount
  } else {
    displayPrice = parseFloat(price);
    totalStorage = null;
  }

  const savings = isYearly && isInteractive ? (displayPrice / 8.4) * 3.6 : 0;

  const formatStorage = (gb: number) => {
    if (gb < 1) return `${Math.round(gb * 1000)}MB`;
    return `${gb}GB`;
  };

  const maxSliderValue = plan === "Lite" ? 4 : plan === "Pro" ? 35 : 0; // Lite: 50-150GB, Pro: 250-2000GB

  return (
    <div
      className={`relative rounded-xl p-8 ${popular ? "border-2 ring-4 ring-[#0070F3]/40 border-[#0070F3]/90 bg-gradient-to-b from-[#0070F3]/10 to-transparent" : "border border-[#3F3F3F] bg-card"}`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-[#0070F3] text-white">Most Popular</Badge>
        </div>
      )}
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">{plan}</h3>
        <div className="mb-2">
          <span className="text-4xl font-bold">
            ${plan === "Free" ? "0" : displayPrice.toFixed(2)}
          </span>
          {plan !== "Free" && (
            <span className="text-muted-foreground">
              /{isYearly ? "year" : "month"}
            </span>
          )}
        </div>

        {savings > 0 && (
          <div className="text-sm text-green-600 font-medium mb-4">
            Save ${savings.toFixed(2)} yearly
          </div>
        )}

        <div className="mb-6">
          <p className="text-muted-foreground">
            {isInteractive && totalStorage
              ? formatStorage(totalStorage)
              : storage}{" "}
            storage
          </p>
        </div>

        {/* Interactive Storage Slider */}
        {isInteractive && (
          <div className="mb-6 space-y-4">
            <div className="text-sm font-medium">
              Customize Storage: {formatStorage(totalStorage)}
            </div>
            <div className="px-4">
              <Slider
                value={storageSlider}
                onValueChange={setStorageSlider}
                max={maxSliderValue}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Base: {formatStorage(baseStorage)}
              {storageSlider[0] > 0 && (
                <span>
                  {" "}
                  + {storageSlider[0]} × {formatStorage(additionalStorageUnit)}
                  (+$
                  {(
                    storageSlider[0] *
                    additionalStoragePrice *
                    (isYearly ? 8.4 : 1)
                  ).toFixed(2)}
                  )
                </span>
              )}
            </div>
          </div>
        )}

        <ul className="space-y-3 mb-8 text-left">
          {features.slice(0, 5).map((feature: string, index: number) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-[#0070F3] mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
          {features.length > 5 && (
            <li className="text-sm text-muted-foreground">
              +{features.length - 5} more features
            </li>
          )}
        </ul>

        <Link href="/pricing">
          <Button
            variant={popular ? "default" : "outline"}
            className="w-full"
            size="lg"
          >
            {plan === "Free" ? "Get Started" : "Choose Plan"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function YearlyToggle({
  isYearly,
  setIsYearly,
}: {
  isYearly: boolean;
  setIsYearly: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <span
        className={`text-sm ${!isYearly ? "font-medium" : "text-muted-foreground"}`}
      >
        Monthly
      </span>
      <button
        onClick={() => setIsYearly(!isYearly)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isYearly ? "bg-[#0070F3]" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isYearly ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <span
        className={`text-sm ${isYearly ? "font-medium" : "text-muted-foreground"}`}
      >
        Yearly
      </span>
      <Badge variant="secondary" className="text-xs">
        Save 30%
      </Badge>
    </div>
  );
}

export default function HomePage() {
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-background overflow-hidden text-foreground">
      <GridBackground />
      <Spotlight />
      <div className="relative z-40">
        {/* Hero Section */}
        <section className="pt-32 pb-10 px-4 text-center container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="bg-black/70">
              <TextShimmer>Open Beta</TextShimmer>
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl mt-3 font-bold tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]"
          >
            Upload. Share. Get Feedback.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mt-6"
          >
            A complete video review platform. Upload your videos, images, and
            files directly to our secure servers. Share links with clients and
            get timestamped feedback without any logins required.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-row gap-4 justify-center mt-8"
          >
            <Link href="/signup">
              <Button size="lg" variant="default" className="px-4">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <button
              onClick={() => {
                featuresRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
            >
              <Button size="lg" variant="outline" className="px-4">
                <PlayIcon className="mr-2 h-5 w-5" />
                See Demo
              </Button>
            </button>
          </motion.div>
        </section>

        {/* Hero Image */}
        <AnimatedSection className="">
          <div className="container mx-auto px-4">
            <div className="relative rounded-xl overflow-hidden border border-[#3F3F3F] shadow-2xl max-w-5xl mx-auto">
              <Image
                quality={100}
                priority
                src="/1.png"
                alt="Video Review Dashboard"
                width={1200}
                height={700}
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-20"></div>
            </div>
          </div>
        </AnimatedSection>

        {/* Features Section */}
        <AnimatedSection className="py-16">
          <div ref={featuresRef} className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
              Complete File Hosting & Review Platform
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Your own secure media server with powerful review tools. No
              third-party dependencies.
            </p>
          </div>
        </AnimatedSection>

        {/* Features Grid */}
        <AnimatedSection className="container mx-auto px-4 pb-16">
          <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <div className="p-6 rounded-xl border border-[#3F3F3F] bg-card">
              <div className="w-12 h-12 bg-[#0070F3]/20 rounded-lg flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-[#0070F3]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Direct Upload</h3>
              <p className="text-muted-foreground">
                Upload videos, images, and reference files directly to our
                secure servers.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-[#3F3F3F] bg-card">
              <div className="w-12 h-12 bg-[#0070F3]/20 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-[#0070F3]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Timestamped Comments
              </h3>
              <p className="text-muted-foreground">
                Get precise feedback with comments linked to specific moments in
                your content.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-[#3F3F3F] bg-card">
              <div className="w-12 h-12 bg-[#0070F3]/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-[#0070F3]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Hosting</h3>
              <p className="text-muted-foreground">
                Your files are hosted securely with password protection and
                expiration controls.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-[#3F3F3F] bg-card">
              <div className="w-12 h-12 bg-[#0070F3]/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-[#0070F3]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Login Required</h3>
              <p className="text-muted-foreground">
                Clients can view content and leave feedback without creating
                accounts.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* File Types Section */}
        <AnimatedSection className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                Support for All Your Creative Files
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upload and share any type of creative content directly from our
                platform.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center p-6 rounded-xl border border-[#3F3F3F] bg-card">
                <div className="w-16 h-16 bg-[#0070F3]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileVideo className="h-8 w-8 text-[#0070F3]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Videos</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Upload videos in any format - MP4, MOV, AVI, and more. Our
                  platform handles the hosting and streaming.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• HD & 4K video support</li>
                  <li>• Automatic compression</li>
                  <li>• Frame-accurate comments</li>
                </ul>
              </div>

              <div className="text-center p-6 rounded-xl border border-[#3F3F3F] bg-card">
                <div className="w-16 h-16 bg-[#0070F3]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="h-8 w-8 text-[#0070F3]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Images</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Share high-resolution images, mockups, and visual references
                  with pixel-perfect feedback.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• PNG, JPG, SVG support</li>
                  <li>• Zoom for detail review</li>
                  <li>• Annotation tools</li>
                </ul>
              </div>

              <div className="text-center p-6 rounded-xl border border-[#3F3F3F] bg-card">
                <div className="w-16 h-16 bg-[#0070F3]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-[#0070F3]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Reference Files</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Upload scripts, mood boards, briefs, and any reference
                  materials alongside your main content.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• PDF, DOC, TXT files</li>
                  <li>• Audio files for review</li>
                  <li>• Archive attachments</li>
                </ul>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Feature Details */}
        <AnimatedSection className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <Image
                quality={100}
                priority
                src="/2.png"
                alt="Upload and Review Flow"
                width={600}
                height={400}
                className="w-full h-auto rounded-xl border border-[#3F3F3F] shadow-xl"
              />
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                  Upload Once. Share Everywhere.
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                  Drag and drop your files directly into our platform. We handle
                  all the hosting, compression, and delivery. Generate secure
                  shareable links that work on any device, anywhere.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#0070F3] mr-2 mt-1" />
                    <span>Secure cloud storage with automatic backups</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#0070F3] mr-2 mt-1" />
                    <span>Fast global CDN delivery for instant loading</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#0070F3] mr-2 mt-1" />
                    <span>Automatic format optimization for web viewing</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#0070F3] mr-2 mt-1" />
                    <span>
                      Real-time notifications when clients view your content
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div className="order-2 md:order-1">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                  Enterprise-Grade Security
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                  Your content is protected with bank-level security. Control
                  who sees what with granular permissions, password protection,
                  and detailed access logs.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#0070F3] mr-2 mt-1" />
                    <span>
                      256-bit SSL encryption for all uploads and streams
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#0070F3] mr-2 mt-1" />
                    <span>
                      Password-protected review links with custom expiration
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#0070F3] mr-2 mt-1" />
                    <span>
                      Detailed analytics on who viewed your content and when
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#0070F3] mr-2 mt-1" />
                    <span>Watermarking options for sensitive content</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#0070F3] mr-2 mt-1" />
                    <span>Automatic GDPR compliance and data deletion</span>
                  </li>
                </ul>
              </div>
              <Image
                quality={100}
                priority
                src="/3.png"
                alt="Security Features"
                width={600}
                height={400}
                className="w-full h-auto rounded-xl border border-[#3F3F3F] shadow-xl order-1 md:order-2"
              />
            </div>
          </div>
        </AnimatedSection>

        {/* Pricing Section */}
        <AnimatedSection className="py-20">
          <div ref={pricingRef} className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Start free or upgrade with flexible storage options. All plans
                include secure hosting and unlimited uploads.
              </p>
            </div>

            <YearlyToggle isYearly={isYearly} setIsYearly={setIsYearly} />

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <PricingCard
                plan="Free"
                price="0"
                storage="500MB"
                isYearly={isYearly}
                features={[
                  "Upload videos, images & files",
                  "2 active review projects",
                  "Basic timestamped comments",
                  "Secure file hosting",
                  "Email notifications",
                  "30-day link expiration",
                  "200MB max upload size",
                ]}
              />

              <PricingCard
                plan="Pro"
                price="5.99"
                storage="250GB"
                popular={true}
                isYearly={isYearly}
                features={[
                  "Everything in Lite plan",
                  "Advanced analytics & insights",
                  "Priority support",
                  "Custom branding options",
                  "Advanced security features",
                  "API access",
                  "Dedicated support",
                  "5GB max upload size",
                  "Team collaboration features",
                ]}
              />

              <PricingCard
                plan="Lite"
                price="2.99"
                storage="50GB"
                isYearly={isYearly}
                features={[
                  "Everything in Free plan",
                  "Unlimited review projects",
                  "Advanced timestamped comments",
                  "Password protection for links",
                  "Custom expiration dates",
                  "Real-time notifications",
                  "2GB max upload size",
                  "Basic analytics",
                ]}
              />
            </div>

            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">
                All plans include secure hosting, CDN delivery, and automatic
                backups. No credit card required for free trial.
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  <span>Your own storage</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Bank-level security</span>
                </div>
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  <span>Global CDN</span>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Testimonials */}
        <AnimatedSection className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
              Trusted by Creators Worldwide
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="p-6 rounded-xl border border-[#3F3F3F] bg-card">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 text-yellow-500 fill-current"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Finally, a platform that hosts everything securely. No more
                  dealing with multiple file-sharing services. Upload once,
                  share everywhere."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#0070F3] to-[#0052CC] rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold">Sarah Chen</p>
                    <p className="text-sm text-muted-foreground">
                      Video Editor
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-[#3F3F3F] bg-card">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 text-yellow-500 fill-current"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "The direct upload feature is a game-changer. Fast, secure,
                  and my clients love how easy it is to access the content."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#0070F3] to-[#003D82] rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold">Marcus Rodriguez</p>
                    <p className="text-sm text-muted-foreground">
                      Freelance Director
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-[#3F3F3F] bg-card">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 text-yellow-500 fill-current"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Having our own secure hosting solution gives us complete
                  control. The analytics show exactly who accessed what and
                  when."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#0070F3] to-[#0085FF] rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold">Emma Thompson</p>
                    <p className="text-sm text-muted-foreground">
                      Creative Agency
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* CTA Section */}
        <AnimatedSection className="py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="bg-card border-2 border-[#3F3F3F] rounded-xl p-12 max-w-3xl mx-auto relative overflow-hidden">
              <BorderTrail />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                Ready to Host Your Creative Content?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of creators who've taken control of their content
                hosting and review process. Start your free trial today.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" variant="default">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline">
                    View Pricing
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  <span>Free 500MB to start</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Secure hosting included</span>
                </div>
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  <span>Setup in minutes</span>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}