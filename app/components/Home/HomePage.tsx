"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  MessageCircle,
  Users,
  Play,
  Upload,
  Search,
  Bell,
  Crown,
  Zap,
  Shield,
  Clock,
  Palette,
  MousePointer,
  Download,
  Eye,
  Globe,
  Layers,
  BarChart3,
  Settings,
} from "lucide-react";

import { BorderTrail } from "@/components/ui/border-trail";
import { GridBackground, Spotlight } from "@/components/ui/spotlight-new";

import { Badge } from "@/components/ui/badge";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  ChatBubbleOvalLeftIcon,
  PlayIcon,
  UsersIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  BellIcon,
  MapPinIcon,
  FolderIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import { Switch } from "@/components/ui/switch";
import { TextAnimate } from "@/components/ui/text-animate";
import { Card, CardContent } from "@/components/ui/card";

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

const pricingTiers = [
  {
    id: "free" as const,
    name: "Free",
    price: 0,
    baseStorage: 0.5,
    maxUploadSize: 200,
    level: 0,
    features: [
      "Upload videos, images, audio, docs",
      "200MB max upload size",
      "2 Active projects",
      "2 Members per project",
      "Timestamped comments",
      "Pin & draw annotations",
      "Review links",
      "Real-time notifications",
    ],
  },
  {
    id: "lite" as const,
    name: "Lite",
    basePrice: 2.99,
    baseStorage: 50,
    additionalStoragePrice: 1.0,
    additionalStorageUnit: 25,
    maxStorage: 150,
    maxUploadSize: 2048,
    level: 1,
    features: [
      "Everything in Free",
      "2GB max upload size",
      "Flexible storage up to 150GB",
      "Unlimited projects & members",
      "Password protected links",
      "Custom expiration dates",
      "Advanced search",
      "Priority support",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    basePrice: 5.99,
    baseStorage: 250,
    additionalStoragePrice: 1.5,
    additionalStorageUnit: 50,
    maxStorage: 2048,
    maxUploadSize: 5120,
    level: 2,
    popular: true,
    features: [
      "Everything in Lite",
      "5GB max upload size",
      "Flexible storage up to 2TB",
      "Version control",
      "Advanced analytics",
      "Download controls",
      "Premium support",
    ],
  },
];

function PricingCard({
  tier,
  isYearly,
}: {
  tier: (typeof pricingTiers)[0];
  isYearly: boolean;
}) {
  const [storageSlider, setStorageSlider] = useState([0]);

  const isFreePlan = tier.id === "free";

  const totalStorage = isFreePlan
    ? tier.baseStorage
    : tier.baseStorage + storageSlider[0] * tier.additionalStorageUnit;

  const monthlyPrice = isFreePlan
    ? 0
    : tier.basePrice + storageSlider[0] * tier.additionalStoragePrice;

  const yearlyPrice = monthlyPrice * 8.4;
  const displayPrice = isYearly ? yearlyPrice : monthlyPrice;
  const savings = isYearly && !isFreePlan ? monthlyPrice * 3.6 : 0;

  const formatStorage = (gb: number) => {
    if (gb < 1) return `${Math.round(gb * 1000)}MB`;
    return `${gb}GB`;
  };

  const formatUploadSize = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(0)}GB`;
    return `${mb}MB`;
  };

  const maxSliderValue = isFreePlan
    ? 0
    : Math.floor(
        (tier.maxStorage - tier.baseStorage) / tier.additionalStorageUnit
      );

  return (
    <div
      className={`relative rounded-xl p-8 h-full flex-1 flex flex-col ${
        tier.popular
          ? "border-2 ring-4 ring-[#0070F3]/40 border-[#0070F3]/90 bg-gradient-to-b from-[#0070F3]/10 to-transparent"
          : "border bg-muted/35"
      }`}
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-[#0070F3] text-white">Most Popular</Badge>
        </div>
      )}

      <div className="text-center flex-1 flex flex-col">
        <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
        <div className="mb-2">
          <span className="text-4xl font-bold">
            ${isFreePlan ? "0" : displayPrice.toFixed(2)}
          </span>
          {!isFreePlan && (
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
            {formatStorage(totalStorage)} storage
          </p>
          <p className="text-sm text-muted-foreground">
            {formatUploadSize(tier.maxUploadSize)} max upload
          </p>
        </div>

        {!isFreePlan && (
          <div className="mb-6 space-y-4">
            <div className="text-sm font-medium">
              Customize: {formatStorage(totalStorage)}
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
              Base: {formatStorage(tier.baseStorage)}
              {storageSlider[0] > 0 && (
                <span>
                  {" "}
                  + {storageSlider[0]} ×{" "}
                  {formatStorage(tier.additionalStorageUnit)}
                  (+$
                  {(
                    storageSlider[0] *
                    tier.additionalStoragePrice *
                    (isYearly ? 8.4 : 1)
                  ).toFixed(2)}
                  )
                </span>
              )}
            </div>
          </div>
        )}

        <ul className="space-y-3 mb-8 text-left flex-grow">
          {tier.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-[#0070F3] mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto">
          <Link href={tier.id === "free" ? "/signup" : "/pricing"}>
            <Button
              variant={tier.popular ? "default" : "secondary"}
              className="w-full"
              size="lg"
            >
              {tier.id === "free" ? "Start Free" : "Choose Plan"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
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
            className="text-5xl md:text-7xl mt-3 font-bold tracking-tight"
          >
            <TextAnimate
              animation="slideUp"
              startOnView={true}
              once={false}
              delay={2}
              by="word"
            >
              Media Review Made Simple
            </TextAnimate>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mt-6"
          >
            Simple media review with flexible storage and affordable pricing.
            Upload any media, get precise feedback, and work with clients
            easily.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-row gap-4 justify-center mt-8"
          >
            <Link href="/signup">
              <Button size="lg" variant="default" className="px-4">
                Start Free - 500MB
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Hero Demo */}
        <AnimatedSection className="">
          <div className="container mx-auto px-4">
            <div className="relative rounded-xl overflow-hidden border-4 border-muted-foreground/15 max-w-5xl mx-auto">
              <Image
                quality={100}
                priority
                src="/app-demo-image.png"
                alt="Media Review Interface"
                width={1200}
                height={700}
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-20"></div>
            </div>
          </div>
        </AnimatedSection>

        {/* Why Solo Editors Choose Us */}
        <AnimatedSection className="py-16">
          <div ref={featuresRef} className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Built for Simple Media Review
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Get precise feedback without complex workflows or enterprise
                bloat.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="p-6 rounded-xl border bg-muted/35">
                <div className="w-12 h-12 bg-[#0070F3]/20 rounded-lg flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-[#0070F3]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Upload Anything</h3>
                <p className="text-muted-foreground">
                  Videos, images, audio, documents, and SVG files. Up to 5GB per
                  file. Works with all the formats you actually use.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-muted/35">
                <div className="w-12 h-12 bg-[#0070F3]/20 rounded-lg flex items-center justify-center mb-4">
                  <MapPinIcon className="h-6 w-6 text-[#0070F3]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Precise Feedback</h3>
                <p className="text-muted-foreground">
                  Pin comments to exact frames, draw directly on media, and get
                  timestamped feedback. No more confusing email chains.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-muted/35">
                <div className="w-12 h-12 bg-[#0070F3]/20 rounded-lg flex items-center justify-center mb-4">
                  <ShieldCheckIcon className="h-6 w-6 text-[#0070F3]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Share Securely</h3>
                <p className="text-muted-foreground">
                  Password protection, custom expiration, and download controls.
                  Clients don't need to sign up for anything.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Workflow Examples */}
        <AnimatedSection className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                See How It Works
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Real features that help you work faster and get better feedback.
              </p>
            </div>

            <div className="space-y-24 max-w-6xl mx-auto">
              {/* Multi-Panel Workspace */}
              <Card className="flex flex-col md:flex-row items-center gap-12 bg-muted/35">
                <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-4">
                      Simple Multi-Panel Interface
                    </h3>
                    <p className="text-muted-foreground text-lg mb-6">
                      Media library, video player, and comments all in one view.
                      Resize panels to fit your workflow.
                    </p>
                  </div>
                  <div className="flex-1">
                    <Image
                      src="/workspace-demo.png"
                      alt="Multi-panel workspace interface"
                      width={600}
                      height={400}
                      className="rounded-xl shadow-lg"
                      loading="lazy"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Smart Organization */}
              <Card className="flex flex-col md:flex-row items-center gap-12 bg-muted/35">
                <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 order-2 md:order-1">
                    <Image
                      src="/folder-organization.png"
                      alt="Folder organization with nested structure"
                      width={600}
                      height={400}
                      className="rounded-xl shadow-lg"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 order-1 md:order-2">
                    <h3 className="text-2xl font-semibold mb-4">
                      Keep Projects Organized
                    </h3>
                    <p className="text-muted-foreground text-lg mb-6">
                      Create folders and upload files. Keep your projects
                      organized.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Precise Annotations */}
              <Card className="flex flex-col md:flex-row items-center gap-12 bg-muted/35">
                <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-4">
                      Pin & Draw Feedback
                    </h3>
                    <p className="text-muted-foreground text-lg mb-6">
                      Select pin or draw mode, then click anywhere on your media
                      to add feedback. Comments automatically sync with exact
                      video timestamps and frame positions.
                    </p>
                  </div>
                  <div className="flex-1">
                    <Image
                      src="/annotation-demo.png"
                      alt="Pin and draw annotations on video"
                      width={600}
                      height={400}
                      className="rounded-xl shadow-lg"
                      loading="lazy"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Global Search */}
              <Card className="flex flex-col md:flex-row items-center gap-12 bg-muted/35">
                <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 order-2 md:order-1">
                    <Image
                      src="/search-demo.png"
                      alt="Global search interface with filters"
                      width={600}
                      height={400}
                      className="rounded-xl shadow-lg"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 order-1 md:order-2">
                    <h3 className="text-2xl font-semibold mb-4">
                      Find Anything Fast
                    </h3>
                    <p className="text-muted-foreground text-lg mb-6">
                      Find any project or media file instantly with Cmd+K. Smart
                      filters help you locate exactly what you need across all
                      your work.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Simple Collaboration */}
              <Card className="flex flex-col md:flex-row items-center gap-12 bg-muted/35">
                <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-4">
                      Simple Collaboration
                    </h3>
                    <p className="text-muted-foreground text-lg mb-6">
                      Invite people with specific roles. Get notifications for
                      comments and uploads without email overload. Perfect for
                      small projects.
                    </p>
                  </div>
                  <div className="flex-1">
                    <Image
                      src="/team.png"
                      alt="Simple team collaboration interface"
                      width={600}
                      height={400}
                      className="rounded-xl shadow-lg"
                      loading="lazy"
                    />
                  </div>
                </CardContent>
              </Card>
              {/* Adobe Integration */}
              <Card className="flex flex-col md:flex-row items-center gap-12 bg-muted/35">
                <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 order-2 md:order-1">
                    <div className="relative">
                      <Image
                        src="/extension version.png"
                        alt="Adobe After Effects and Premiere Pro integration"
                        width={600}
                        height={400}
                        className="rounded-xl shadow-lg"
                        loading="lazy"
                      />
                      <div className="absolute -top-2 -right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                        Coming Soon
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 order-1 md:order-2">
                    <h3 className="text-2xl font-semibold mb-4">
                      Adobe Timeline Integration
                      <Badge variant="secondary" className="ml-2">
                        Coming Soon
                      </Badge>
                    </h3>
                    <p className="text-muted-foreground text-lg mb-6">
                      See client feedback directly in your After Effects and
                      Premiere Pro timeline. Click any comment to jump to that
                      exact frame in both the app and your editor.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </AnimatedSection>

        {/* Pricing Section */}
        <AnimatedSection className="py-20">
          <div ref={pricingRef} className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Flexible Pricing for Solo Editors
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Start free and scale up as you grow. Pay only for the storage
                you actually use.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 mb-12">
              <span
                className={`text-sm ${!isYearly ? "font-medium" : "text-muted-foreground"}`}
              >
                Monthly
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-[#0070F3]"
              />
              <span
                className={`text-sm ${isYearly ? "font-medium" : "text-muted-foreground"}`}
              >
                Yearly
              </span>
              <Badge variant="secondary" className="text-xs">
                Save 30%
              </Badge>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingTiers.map((tier) => (
                <div key={tier.id} className="flex">
                  <PricingCard tier={tier} isYearly={isYearly} />
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-sm text-muted-foreground">
                All plans include unlimited projects on paid tiers. No hidden
                fees.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* CTA Section */}
        <AnimatedSection className="py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="bg-muted/35 border-2 rounded-xl p-12 max-w-3xl mx-auto relative overflow-hidden">
              <BorderTrail />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                Start Free. Scale Smart.
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Get better client feedback with simple tools and fair pricing.
                500MB free storage, no commitment required.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" variant="default">
                    Start Free Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="secondary">
                    View All Plans
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  500MB free storage
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Cancel anytime
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}