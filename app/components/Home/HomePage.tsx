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
  FileVideo,
  Image as ImageIcon,
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
} from "@heroicons/react/24/solid";
import { Switch } from "@/components/ui/switch";

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
    baseStorage: 0.5, // 500MB
    maxUploadSize: 200, // 200MB
    level: 0,
    features: [
      "Upload videos, images",
      "200MB max upload size",
      "2 Active projects",
      "2 Members per project",
      "Timestamped comments",
      "Accurate Pin/Draw Annotation",
      "Email/App notifications",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    basePrice: 5.99,
    baseStorage: 250, // 250GB base
    additionalStoragePrice: 1.5, // $1.5 per 50GB
    additionalStorageUnit: 50, // 50GB increments
    maxStorage: 2048, // 2TB max
    maxUploadSize: 5120, // 5GB
    level: 2,
    popular: true,
    features: [
      "Everything in Free plan",
      "5GB max upload size",
      "flexible storage up to 2TB",
      "Unlimited projects",
      "Unlimited members",
      "Password protection for links",
      "Custom expiration dates",
      "Priority support",
    ],
  },
  {
    id: "lite" as const,
    name: "Lite",
    basePrice: 2.99,
    baseStorage: 50, // 50GB base
    additionalStoragePrice: 1.0, // $1.0 per 25GB
    additionalStorageUnit: 25, // 25GB increments
    maxStorage: 150, // 150GB max
    maxUploadSize: 2048, // 2GB
    level: 1,
    features: [
      "Everything in Free plan",
      "2GB max upload size",
      "flexible storage up to 150GB",
      "Unlimited projects",
      "Unlimited members",
      "Password protection for links",
      "Custom expiration dates",
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

  // Calculate storage and pricing
  const totalStorage = isFreePlan
    ? tier.baseStorage
    : tier.baseStorage + storageSlider[0] * tier.additionalStorageUnit;

  const monthlyPrice = isFreePlan
    ? 0
    : tier.basePrice + storageSlider[0] * tier.additionalStoragePrice;

  const yearlyPrice = monthlyPrice * 8.4; // 30% discount
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
          : "border  bg-muted/35"
      }`}
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-[#0070F3] text-white">Best Value</Badge>
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

        {/* Storage Slider for Lite and Pro Plans */}
        {!isFreePlan && (
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
            Upload your videos and images. Share with clients. Get timestamped
            feedback with accurate pin and draw annotations. No client signup
            required.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-row gap-4 justify-center mt-8"
          >
            <Link href="/signup">
              <Button size="lg" variant="default" className="px-4">
                Start For Free
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
              <Link href="/pricing">
                <Button size="lg" variant="outline">
                  View Pricing
                </Button>
              </Link>
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
                src="/image.png"
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
          <div ref={featuresRef} className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                Everything You Need for Video Review
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Simple tools for video editors to get client feedback
                efficiently.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="p-6 rounded-xl border  bg-muted/35">
                <div className="w-12 h-12 bg-[#0070F3]/20 rounded-lg flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-[#0070F3]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Upload & Share</h3>
                <p className="text-muted-foreground">
                  Upload videos and images. Generate shareable links that work
                  on any device.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-muted/35">
                <div className="w-12 h-12 bg-[#0070F3]/20 rounded-lg flex items-center justify-center mb-4">
                  <ChatBubbleOvalLeftIcon className="h-6 w-6 text-[#0070F3]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Timestamped Comments
                </h3>
                <p className="text-muted-foreground">
                  Get feedback pinned to exact moments in your videos with
                  frame-accurate comments.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-muted/35">
                <div className="w-12 h-12 bg-[#0070F3]/20 rounded-lg flex items-center justify-center mb-4">
                  <UsersIcon className="h-6 w-6 text-[#0070F3]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Client Signup</h3>
                <p className="text-muted-foreground">
                  Clients can view and comment without creating accounts. Just
                  share the link.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Pricing Section */}
        <AnimatedSection className="py-20">
          <div ref={pricingRef} className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                Choose Your Plan
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Start free or upgrade with flexible storage options.
              </p>
            </div>

            {/* Billing Period Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
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
          </div>
        </AnimatedSection>

        {/* CTA Section */}
        <AnimatedSection className="py-20 ">
          <div className="container mx-auto px-4 text-center">
            <div className="bg-muted/35 border-2  rounded-xl p-12 max-w-3xl mx-auto relative overflow-hidden">
              <BorderTrail />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                Cheap Pricing. Choose the Storage You Need.
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Start free with 500MB or upgrade from just $2.99/month. Flexible
                storage options - pay only for what you use.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" variant="default">
                    Start Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="secondary">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
