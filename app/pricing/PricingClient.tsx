// app/pricing/PricingClient.tsx
// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import { formatDate } from "../dashboard/lib/formats";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { motion, useInView } from "framer-motion";
import { GridBackground, Spotlight } from "@/components/ui/spotlight-new";

interface Subscription {
  id: string;
  plan_name: string;
  plan_id: string;
  status: string;
  current_period_end: string;
  paypal_subscription_id?: string;
  storage_gb?: number;
  billing_period?: string;
  max_upload_size_mb?: number;
}

interface PricingClientProps {
  user: User | null;
  currentSubscription: Subscription | null;
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

const isSubscriptionExpired = (subscription: Subscription | null): boolean => {
  if (!subscription) return false;

  // Check if status is inactive
  if (subscription.status === "inactive") return true;

  // Check if current period has ended (even if status is still "active")
  if (subscription.current_period_end) {
    const currentDate = new Date();
    const periodEndDate = new Date(subscription.current_period_end);
    return currentDate > periodEndDate;
  }

  return false;
};

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
  tier,
  user,
  currentSubscription,
  isYearly,
}: {
  tier: (typeof pricingTiers)[0];
  user: User | null;
  currentSubscription: Subscription | null;
  isYearly: boolean;
}) {
  const router = useRouter();
  const [storageSlider, setStorageSlider] = useState([0]);

  const isFreePlan = tier.id === "free";

  // Calculate storage and pricing
  const totalStorage = isFreePlan
    ? tier.baseStorage
    : tier.baseStorage + storageSlider[0] * tier.additionalStorageUnit;

  const monthlyPrice = isFreePlan
    ? 0
    : tier.basePrice + storageSlider[0] * tier.additionalStoragePrice;

  // Change from 20% discount (10 months) to 30% discount (8.4 months)
  const yearlyPrice = monthlyPrice * 8.4; // 30% discount (pay for 8.4 months, get 12)
  const displayPrice = isYearly ? yearlyPrice : monthlyPrice;
  const savings = isYearly && !isFreePlan ? monthlyPrice * 3.6 : 0; // 3.6 months savings

  // Check subscription status
  const isCurrentPlan = currentSubscription?.plan_id === tier.id;
  const isExpired = isSubscriptionExpired(currentSubscription);
  const currentStorage = currentSubscription?.storage_gb || 0;
  const currentBillingPeriod = currentSubscription?.billing_period || "monthly";
  const selectedBillingPeriod = isYearly ? "yearly" : "monthly";

  // Active subscription check
  const hasActiveSubscription =
    currentSubscription &&
    currentSubscription.status === "active" &&
    !isExpired;

  // FREE PLAN LOGIC: Block if user has any active subscription
  const isBlockedFreePlan = isFreePlan && hasActiveSubscription;

  // BILLING PERIOD RESTRICTIONS
  const isBlockedYearlyToMonthly =
    hasActiveSubscription &&
    currentBillingPeriod === "yearly" &&
    selectedBillingPeriod === "monthly";

  // UPGRADE LOGIC: Only allow upgrades mid-term
  const isUpgrade =
    !isFreePlan &&
    hasActiveSubscription &&
    // Cross-plan upgrades (free -> lite/pro, lite -> pro)
    (currentSubscription.plan_id === "free" ||
      (currentSubscription.plan_id === "lite" && tier.id === "pro") ||
      // Same plan with more storage
      (currentSubscription.plan_id === tier.id &&
        totalStorage > currentStorage) ||
      // Monthly to yearly billing (same plan, same storage)
      (currentBillingPeriod === "monthly" &&
        selectedBillingPeriod === "yearly" &&
        currentSubscription.plan_id === tier.id &&
        totalStorage === currentStorage));

  // DOWNGRADE LOGIC: Block ALL downgrades mid-term
  const isDowngrade =
    hasActiveSubscription &&
    // Cross-plan downgrades (pro -> lite, lite -> free)
    ((tier.id === "lite" && currentSubscription.plan_id === "pro") ||
      (tier.id === "free" && currentSubscription.plan_id !== "free") ||
      // Same plan with less storage
      (currentSubscription.plan_id === tier.id &&
        totalStorage < currentStorage) ||
      // Yearly to monthly (considered downgrade)
      isBlockedYearlyToMonthly);
  const isStorageDowngrade =
    hasActiveSubscription &&
    currentSubscription.plan_id === tier.id &&
    totalStorage < currentStorage;
  // RENEWAL LOGIC: Expired subscription renewal
  const isRenewal = !isFreePlan && currentSubscription && isExpired;

  // SAME PLAN LOGIC: Exact match
  const isSamePlan =
    hasActiveSubscription &&
    currentSubscription.plan_id === tier.id &&
    totalStorage === currentStorage &&
    currentBillingPeriod === selectedBillingPeriod;

  // NEW SUBSCRIPTION: No current subscription or expired
  const isNewSubscription = !currentSubscription || isExpired;

  const handleSubscribe = () => {
    if (!user) {
      router.push(`/login?redirect=/pricing&plan=${tier.id}`);
      return;
    }

    // FREE PLAN: Block if user has active subscription
    if (isBlockedFreePlan) {
      toast({
        title: "Cannot downgrade mid-term",
        description: `Your current plan expires on ${formatDate(currentSubscription.current_period_end)}. Changes will take effect at renewal.`,
        variant: "destructive",
      });
      return;
    }

    // FREE PLAN: Redirect to dashboard
    if (isFreePlan && !hasActiveSubscription) {
      toast({
        title: "You're on the Free plan!",
        description: "Start uploading and reviewing your files.",
        variant: "outline",
      });
      router.push("/dashboard");
      return;
    }

    // BLOCK DOWNGRADES: All downgrades blocked mid-term
    if (isDowngrade) {
      const renewalDate = currentSubscription?.current_period_end
        ? formatDate(currentSubscription.current_period_end)
        : "your next billing date";

      toast({
        title: "Downgrades available at renewal",
        description: `You can schedule this change for ${renewalDate}. Upgrades are available immediately.`,
        variant: "destructive",
      });
      return;
    }

    // SAME PLAN: No changes needed
    if (isSamePlan) {
      toast({
        title: "No changes needed",
        description: "You're already on this exact plan configuration.",
        variant: "outline",
      });
      return;
    }

    // Determine action type
    let action = "new";
    if (currentSubscription && !isExpired) {
      if (isUpgrade) {
        // Check if it's a billing period change
        if (
          currentSubscription.plan_id === tier.id &&
          totalStorage === currentStorage &&
          currentBillingPeriod === "monthly" &&
          selectedBillingPeriod === "yearly"
        ) {
          action = "upgrade"; // Billing change treated as upgrade
        } else {
          action = "upgrade";
        }
      }
    } else if (isRenewal) {
      action = "renew";
    }

    // Route to checkout
    const searchParams = new URLSearchParams({
      plan: tier.id,
      storage: totalStorage.toString(),
      price: displayPrice.toFixed(2),
      billing: selectedBillingPeriod,
      action,
    });

    if (currentSubscription) {
      searchParams.append("currentSub", currentSubscription.id);
    }

    router.push(`/checkout?${searchParams.toString()}`);
  };

  const getButtonText = () => {
    if (isFreePlan) {
      if (isBlockedFreePlan) {
        return "Available at Renewal";
      }
      return "Go to Dashboard";
    }

    if (isRenewal) return `Renew ${tier.name}`;
    if (isSamePlan) return "Current Plan";

    if (isDowngrade) {
      return "Available at Renewal";
    }

    if (isUpgrade) {
      // Check if it's a billing change
      if (
        currentSubscription?.plan_id === tier.id &&
        totalStorage === currentStorage &&
        currentBillingPeriod === "monthly" &&
        selectedBillingPeriod === "yearly"
      ) {
        return "Switch to Yearly";
      }

      if (currentSubscription?.plan_id === tier.id) {
        return `Upgrade to ${formatStorage(totalStorage)}`;
      }
      return `Upgrade to ${tier.name}`;
    }

    return "Get Started";
  };

  const getButtonVariant = () => {
    if (isBlockedFreePlan || isDowngrade) return "secondary"; // Disabled style
    if (isSamePlan && !isRenewal) return "secondary";
    if (isUpgrade || isRenewal) return "default";
    if (tier.popular && !isCurrentPlan) return "default";
    return "secondary";
  };

  const formatStorage = (gb: number) => {
    if (gb < 1) return `${Math.round(gb * 1000)}MB`;
    return `${gb}GB`;
  };

  const formatUploadSize = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(0)}GB`;
    return `${mb}MB`;
  };

  // Set initial slider position based on current subscription or defaults
  useEffect(() => {
    if (
      !isFreePlan &&
      currentSubscription?.storage_gb &&
      currentSubscription.plan_id === tier.id
    ) {
      const currentExtra = currentSubscription.storage_gb - tier.baseStorage;
      const sliderValue = Math.max(
        0,
        Math.round(currentExtra / tier.additionalStorageUnit)
      );
      setStorageSlider([sliderValue]);
    }
  }, [
    currentSubscription,
    isFreePlan,
    tier.baseStorage,
    tier.additionalStorageUnit,
    tier.id,
  ]);

  // Calculate max slider value
  const maxSliderValue = isFreePlan
    ? 0
    : Math.floor(
        (tier.maxStorage - tier.baseStorage) / tier.additionalStorageUnit
      );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: tier.level * 0.1 }}
      className={`relative rounded-xl p-8 h-full flex-1 flex flex-col ${
        tier.popular
          ? "border-2 ring-4 ring-[#0070F3]/40 border-[#0070F3]/90 bg-gradient-to-b from-[#0070F3]/10 to-transparent"
          : "border bg-muted/35 backdrop-blur-lg"
      }`}
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-[#0070F3] text-white">Best Value</Badge>
        </div>
      )}

      {/* ACTIVE BADGE: Show for current active plan */}
      {isCurrentPlan && hasActiveSubscription && (
        <div className="absolute -top-4 left-4">
          <Badge className="bg-green-600 text-white">Active</Badge>
        </div>
      )}

      {/* EXPIRED BADGE: Show for expired plans */}
      {isExpired && isCurrentPlan && (
        <div className="absolute -top-4 left-4">
          <Badge className="bg-orange-600 text-white">Expired</Badge>
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
          {isCurrentPlan && currentSubscription?.storage_gb && (
            <span className="block text-xs text-muted-foreground">
              Currently: {formatStorage(currentSubscription.storage_gb)}
              {currentSubscription.billing_period && (
                <span> ({currentSubscription.billing_period})</span>
              )}
            </span>
          )}
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

            {/* Show warning when slider creates a downgrade scenario */}
            {isStorageDowngrade && (
              <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded-md">
                Storage reduction available at renewal (
                {formatDate(currentSubscription.current_period_end)})
              </div>
            )}
          </div>
        )}

        <ul className="space-y-3 mb-8 text-left flex-grow">
          {tier.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start">
              <CheckBadgeIcon className="h-5 w-5 text-[#0070F3] mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto">
          <Button
            onClick={handleSubscribe}
            disabled={
              (isSamePlan && !isRenewal) || isDowngrade || isBlockedFreePlan
            }
            variant={getButtonVariant()}
            className="w-full"
            size="lg"
          >
            {getButtonText()}
            {(isUpgrade || isRenewal || (isFreePlan && !isBlockedFreePlan)) &&
              !isDowngrade && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>

          {/* Show additional info for blocked actions */}
          {isDowngrade && currentSubscription?.current_period_end && (
            <p className="text-xs text-muted-foreground mt-2">
              Available on {formatDate(currentSubscription.current_period_end)}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function PricingClient({
  user,
  currentSubscription,
}: PricingClientProps) {
  const [isYearly, setIsYearly] = useState(false);

  // Check if subscription is expired
  const isExpired = isSubscriptionExpired(currentSubscription);

  return (
    <div className="min-h-screen bg-background overflow-hidden text-foreground">
      <GridBackground />
      <Spotlight />
      <div className="relative z-40">
        <AnimatedSection className="container pt-32 mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
              Choose Your Plan
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free or upgrade with flexible storage options. Cheap
              pricing, choose the storage you need.
            </p>

            {/* Billing Period Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center justify-center gap-4 mt-8 mb-8"
            >
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
            </motion.div>

            {/* Current subscription info */}
            {currentSubscription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="space-y-2"
              >
                <Badge
                  variant={isExpired ? "destructive" : "default"}
                  className="inline-block"
                >
                  Current plan: <strong>{currentSubscription.plan_name}</strong>
                  {currentSubscription.storage_gb && (
                    <span> ({currentSubscription.storage_gb}GB)</span>
                  )}
                  {isExpired ? (
                    <span> - Expired</span>
                  ) : currentSubscription.current_period_end ? (
                    <span>
                      {" "}
                      expires on{" "}
                      {formatDate(currentSubscription.current_period_end)}
                    </span>
                  ) : null}
                </Badge>

                {/* Show policy notice for active subscriptions */}
                {currentSubscription.status === "active" && !isExpired && (
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Upgrades take effect immediately. Downgrades and
                    cancellations take effect at your next billing cycle.
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {pricingTiers.map((tier) => (
              <div key={tier.id} className="flex">
                <PricingCard
                  tier={tier}
                  user={user}
                  currentSubscription={currentSubscription}
                  isYearly={isYearly}
                />
              </div>
            ))}
          </motion.div>
        </AnimatedSection>
      </div>
    </div>
  );
}
