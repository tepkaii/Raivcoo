"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Check, ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import { formatDate } from "../dashboard/lib/formats";

interface Subscription {
  id: string;
  plan_name: string;
  plan_id: string;
  status: string;
  current_period_end: string;
  paypal_subscription_id?: string;
  storage_gb?: number;
}

interface PricingClientProps {
  user: User | null;
  currentSubscription: Subscription | null;
}

const pricingTiers = [
  {
    id: "free" as const,
    name: "Free",
    price: "0",
    baseStorage: 0.5, // 500MB
    level: 0,
    features: [
      "Upload videos, images & files",
      "2 active review projects",
      "Basic timestamped comments",
      "Secure file hosting",
      "Email notifications",
      "30-day link expiration",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    basePrice: 5.99,
    baseStorage: 250, // 250GB base
    additionalStoragePrice: 1.5, // $1.5 per 50GB
    additionalStorageUnit: 50, // 50GB increments
    level: 1,
    popular: true,
    features: [
      "Everything in Free plan",
      "Unlimited review projects",
      "Advanced timestamped comments",
      "Password protection for links",
      "Custom expiration dates",
      "Real-time notifications",
      "File download controls",
      "Advanced analytics & insights",
      "Priority support",
      "Custom branding options",
      "Advanced security features",
      "API access",
      "Dedicated support",
    ],
  },
];

function PricingCard({
  tier,
  user,
  currentSubscription,
}: {
  tier: (typeof pricingTiers)[0];
  user: User | null;
  currentSubscription: Subscription | null;
}) {
  const router = useRouter();
  const [storageSlider, setStorageSlider] = useState([0]);

  const isFreePlan = tier.id === "free";
  const isProPlan = tier.id === "pro";

  // Calculate storage and pricing for Pro plan
  const totalStorage = isProPlan
    ? tier.baseStorage + storageSlider[0] * tier.additionalStorageUnit
    : tier.baseStorage;

  const totalPrice = isProPlan
    ? tier.basePrice + storageSlider[0] * tier.additionalStoragePrice
    : 0;

  // Check subscription status
  const isCurrentPlan = currentSubscription?.plan_id === tier.id;
  const currentStorage = currentSubscription?.storage_gb || 0;

  // Determine if this is an upgrade/downgrade/same
  const isUpgrade =
    isProPlan &&
    currentSubscription &&
    (currentSubscription.plan_id === "free" ||
      (currentSubscription.plan_id === "pro" && totalStorage > currentStorage));

  const isDowngrade =
    isProPlan &&
    currentSubscription?.plan_id === "pro" &&
    totalStorage < currentStorage;

  const isSameStorage =
    isProPlan &&
    currentSubscription?.plan_id === "pro" &&
    totalStorage === currentStorage;

  const handleSubscribe = () => {
    if (!user) {
      router.push(`/login?redirect=/pricing&plan=${tier.id}`);
      return;
    }

    if (isFreePlan) {
      // Route to checkout for Free plan downgrade
      if (currentSubscription?.plan_id === "pro") {
        router.push(
          `/checkout?plan=free&action=downgrade&currentSub=${currentSubscription.id}`
        );
      } else {
        toast({
          title: "You're already on the Free plan!",
          description: "Start uploading and reviewing your files.",
        });
        router.push("/dashboard");
      }
      return;
    }

    if (isSameStorage) {
      toast({
        title: "No changes needed",
        description: "You're already on this storage plan.",
      });
      return;
    }

    // Determine action type
    let action = "new";
    if (currentSubscription) {
      action = isUpgrade ? "upgrade" : isDowngrade ? "downgrade" : "new";
    }

    // Route to checkout with all necessary parameters
    const searchParams = new URLSearchParams({
      plan: tier.id,
      storage: totalStorage.toString(),
      price: totalPrice.toFixed(2),
      action,
    });

    if (currentSubscription) {
      searchParams.append("currentSub", currentSubscription.id);
    }

    router.push(`/checkout?${searchParams.toString()}`);
  };

  const getButtonText = () => {
    if (isFreePlan) {
      return currentSubscription?.plan_id === "pro"
        ? "Downgrade to Free"
        : "Get Started Free";
    }
    if (isSameStorage) return "Current Plan";
    if (isUpgrade) return `Upgrade (${formatStorage(totalStorage)})`;
    if (isDowngrade) return `Downgrade (${formatStorage(totalStorage)})`;
    return "Get Started";
  };

  const getButtonVariant = () => {
    if (isSameStorage) return "outline";
    if (isUpgrade) return "default";
    if (isDowngrade) return "outline";
    if (tier.popular && !isCurrentPlan) return "default";
    return "outline";
  };

  const formatStorage = (gb: number) => {
    if (gb < 1) return `${Math.round(gb * 1000)}MB`;
    return `${gb}GB`;
  };

  // Set initial slider position based on current subscription
  useEffect(() => {
    if (isProPlan && currentSubscription?.storage_gb) {
      const currentExtra = currentSubscription.storage_gb - tier.baseStorage;
      const sliderValue = Math.max(
        0,
        Math.round(currentExtra / tier.additionalStorageUnit)
      );
      setStorageSlider([sliderValue]);
    }
  }, [
    currentSubscription,
    isProPlan,
    tier.baseStorage,
    tier.additionalStorageUnit,
  ]);

  return (
    <div
      className={`relative rounded-xl p-8 h-fit ${
        tier.popular
          ? "border-2 ring-4 ring-[#0070F3]/40 border-[#0070F3]/90 bg-gradient-to-b from-[#0070F3]/10 to-transparent"
          : "border border-[#3F3F3F] bg-card"
      }`}
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-[#0070F3] text-white">Most Popular</Badge>
        </div>
      )}

      {isCurrentPlan && !isProPlan && (
        <div className="absolute -top-4 left-4">
          <Badge className="bg-green-600 text-white">Active</Badge>
        </div>
      )}

      {isUpgrade && (
        <div className="absolute -top-4 right-4">
          <Badge className="bg-blue-600 text-white flex items-center gap-1">
            <ArrowUp className="h-3 w-3" />
            Upgrade
          </Badge>
        </div>
      )}

      {isDowngrade && (
        <div className="absolute -top-4 right-4">
          <Badge className="bg-orange-600 text-white flex items-center gap-1">
            <ArrowDown className="h-3 w-3" />
            Downgrade
          </Badge>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
        <div className="mb-6">
          <span className="text-4xl font-bold">
            ${isFreePlan ? "0" : totalPrice.toFixed(2)}
          </span>
          {!isFreePlan && <span className="text-muted-foreground">/month</span>}
        </div>

        <p className="text-muted-foreground mb-6">
          {formatStorage(totalStorage)} storage included
          {isProPlan && currentSubscription?.storage_gb && (
            <span className="block text-xs">
              Currently: {formatStorage(currentSubscription.storage_gb)}
            </span>
          )}
        </p>

        {/* Storage Slider for Pro Plan */}
        {isProPlan && (
          <div className="mb-6 space-y-4">
            <div className="text-sm font-medium">
              Customize Storage: {formatStorage(totalStorage)}
            </div>
            <div className="px-4">
              <Slider
                value={storageSlider}
                onValueChange={setStorageSlider}
                max={10}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Base: {formatStorage(tier.baseStorage)} + {storageSlider[0]} ×{" "}
              {formatStorage(tier.additionalStorageUnit)}
              {storageSlider[0] > 0 && (
                <span>
                  {" "}
                  (+$
                  {(storageSlider[0] * tier.additionalStoragePrice).toFixed(2)})
                </span>
              )}
            </div>
          </div>
        )}

        <ul className="space-y-3 mb-8 text-left">
          {tier.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-[#0070F3] mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={handleSubscribe}
          disabled={isSameStorage}
          variant={getButtonVariant()}
          className="w-full"
          size="lg"
        >
          {getButtonText()}
          {(isUpgrade || (!isFreePlan && !isSameStorage && !isDowngrade)) && (
            <ArrowRight className="ml-2 h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default function PricingClient({
  user,
  currentSubscription,
}: PricingClientProps) {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start free or upgrade to Pro with flexible storage options. All plans
          include secure hosting and unlimited uploads.
        </p>

        {currentSubscription && (
          <Badge variant={"green"} className="mt-6 inline-block ">
            Current plan: <strong>{currentSubscription.plan_name}</strong>
            {currentSubscription.storage_gb && (
              <span> ({currentSubscription.storage_gb}GB)</span>
            )}
            {currentSubscription.current_period_end && (
              <span>
                {" "}
                expires on {formatDate(currentSubscription.current_period_end)}
              </span>
            )}
          </Badge>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {pricingTiers.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            user={user}
            currentSubscription={currentSubscription}
          />
        ))}
      </div>
    </div>
  );
}
