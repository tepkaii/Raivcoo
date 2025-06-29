// app/pricing/PricingClient.tsx
// @ts-nocheck
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createCheckoutSession } from "@/lib/polar-actions";
import { toast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  current_period_end: string;
  polar_subscription_id: string;
}

interface PricingClientProps {
  user: User | null;
  currentSubscription: Subscription | null;
}

// Replace these with your actual Polar product IDs
const pricingTiers = [
  {
    id: "basic",
    name: "Basic",
    price: "3.99",
    storage: "100GB storage included",
    level: 1,
    polarProductId: "f0feee30-939c-40b2-9993-b448bac6cda7", // Replace with real Polar product ID
    features: [
      "Upload videos, images & files",
      "5 active review projects",
      "Basic timestamped comments",
      "Secure file hosting",
      "Email notifications",
      "30-day link expiration",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "5.99",
    storage: "250GB storage included",
    level: 2,
    popular: true,
    polarProductId: "f0b901f4-f671-4491-9a45-c346d65922d4", // Replace with real Polar product ID
    features: [
      "Everything in Basic plan",
      "Unlimited review projects",
      "Advanced timestamped comments",
      "Password protection for links",
      "Custom expiration dates",
      "Real-time notifications",
      "File download controls",
      "Advanced analytics & insights",
      "Priority support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "9.99",
    storage: "500GB storage included",
    level: 3,
    polarProductId: "83245746-418b-4cd9-9b66-d639c253056f", // Replace with real Polar product ID
    features: [
      "Everything in Pro plan",
      "Advanced client management",
      "Custom branding options",
      "Advanced security features",
      "API access",
      "Dedicated support",
      "Custom integrations",
      "Advanced reporting",
      "White-label options",
    ],
  },
];

function PricingCard({
  tier,
  user,
  currentSubscription,
}: {
  tier: any;
  user: User | null;
  currentSubscription: Subscription | null;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Get the tier level for comparison
  const getCurrentTierLevel = (planName: string) => {
    const foundTier = pricingTiers.find((t) => t.name === planName);
    return foundTier?.level || 0;
  };

  const currentTierLevel = currentSubscription
    ? getCurrentTierLevel(currentSubscription.plan_name)
    : 0;
  const thisTierLevel = tier.level;

  const isCurrentPlan = currentSubscription?.plan_name === tier.name;
  const isUpgrade = currentSubscription && thisTierLevel > currentTierLevel;
  const isDowngrade = currentSubscription && thisTierLevel < currentTierLevel;
  const isDisabled = isCurrentPlan || isDowngrade;

  const handleSubscribe = async () => {
    if (!user) {
      router.push(`/login?redirect=/pricing&plan=${tier.id}`);
      return;
    }

    if (isDisabled) return;

    setIsLoading(true);
    try {
      const { url } = await createCheckoutSession({
        productId: tier.polarProductId,
        planName: tier.name,
        isUpgrade: isUpgrade,
        currentSubscriptionId: currentSubscription?.polar_subscription_id,
      });

      window.location.href = url;
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to create checkout session.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isCurrentPlan) return "Current Plan";
    if (isUpgrade) return "Upgrade";
    if (isDowngrade) return "Not Available";
    return "Get Started";
  };

  const getButtonVariant = () => {
    if (isUpgrade) return "default";
    if (tier.popular && !isDisabled) return "default";
    return "outline";
  };

  return (
    <div
      className={`relative rounded-xl p-8 ${
        tier.popular
          ? "border-2 ring-4 ring-[#0070F3]/40 border-[#0070F3]/90 bg-gradient-to-b from-[#0070F3]/10 to-transparent"
          : "border border-[#3F3F3F] bg-card"
      } ${isDisabled && !isCurrentPlan ? "opacity-50" : ""}`}
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-[#0070F3] text-white">Most Popular</Badge>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-4 left-4">
          <Badge className="bg-green-600 text-white">Active</Badge>
        </div>
      )}

      {isDowngrade && (
        <div className="absolute -top-4 right-4">
          <Badge className="bg-gray-500 text-white">
            Downgrade Not Available
          </Badge>
        </div>
      )}

      {isUpgrade && (
        <div className="absolute -top-4 right-4">
          <Badge className="bg-blue-600 text-white">Upgrade Available</Badge>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
        <div className="mb-6">
          <span className="text-4xl font-bold">${tier.price}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <p className="text-muted-foreground mb-6">{tier.storage}</p>
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
          disabled={isLoading || isDisabled}
          variant={getButtonVariant()}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {getButtonText()}
              {isUpgrade && <ArrowRight className="ml-2 h-4 w-4" />}
            </>
          )}
        </Button>

        {isDowngrade && (
          <p className="text-xs text-muted-foreground mt-2">
            Contact support to downgrade your plan
          </p>
        )}
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
          Pay only for the storage you need. All plans include unlimited
          uploads, reviews, and secure hosting.
        </p>

        {currentSubscription && (
          <div className="mt-6 inline-block bg-green-100 text-green-800 px-4 py-2 rounded-lg">
            Current plan: <strong>{currentSubscription.plan_name}</strong>
            {currentSubscription.current_period_end && (
              <span>
                {" "}
                (expires{" "}
                {new Date(
                  currentSubscription.current_period_end
                ).toLocaleDateString()}
                )
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
