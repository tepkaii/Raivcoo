"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { CheckBadgeIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import Lottie from "lottie-react";
import animationData from "../../../public/assets/lottie/check-icon.json";

interface Plan {
  id: string;
  name: string;
  price: string;
  storage: string;
  features: string[];
  billing?: string;
}

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  storage_gb?: number;
  billing_period?: string;
  orders: {
    id: string;
    amount: number;
    currency: string;
    completed_at: string;
    transaction_id: string;
  };
}

interface SuccessClientProps {
  user: User;
  selectedPlan: Plan;
  subscription: Subscription | null;
  action?: string;
  billingPeriod?: string;
}

export default function SuccessClient({
  user,
  selectedPlan,
  subscription,
  action,
  billingPeriod = "monthly",
}: SuccessClientProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    const timer1 = setTimeout(() => setIsVisible(true), 100);
    const timer2 = setTimeout(() => setShowContent(true), 600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatStorage = (gb: number) => {
    if (gb < 1) return `${Math.round(gb * 1000)}MB`;
    return `${gb}GB`;
  };

  const formatUploadSize = (planId: string) => {
    const uploadSizes = {
      free: "200MB",
      lite: "2GB",
      pro: "5GB",
    };
    return uploadSizes[planId as keyof typeof uploadSizes] || "Unknown";
  };

  const getSuccessMessage = () => {
    switch (action) {
      case "upgrade":
        return `Successfully upgraded to ${selectedPlan.name}!`;
      case "downgrade":
        return selectedPlan.id === "free"
          ? `Successfully downgraded to Free plan!`
          : `Successfully downgraded to ${selectedPlan.name}!`;
      case "renew":
        return `Successfully renewed ${selectedPlan.name} plan!`;
      default:
        return `Welcome to ${selectedPlan.name}!`;
    }
  };

  const getSuccessDescription = () => {
    switch (action) {
      case "upgrade":
        return "Your plan has been upgraded and new features are now available.";
      case "downgrade":
        return selectedPlan.id === "free"
          ? "Your subscription has been cancelled and you're now on the Free plan."
          : "Your plan has been downgraded and is effective immediately.";
      case "renew":
        return "Your plan has been renewed and all features are active.";
      default:
        return selectedPlan.id === "free"
          ? "You're all set! Start uploading and reviewing your files."
          : "Your subscription is now active and ready to use.";
    }
  };

  const showPaymentDetails = selectedPlan.id !== "free";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success header */}
        <div
          className={`text-center mb-12 transition-all duration-1000 transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex justify-center">
            <div className="rounded-full p-4">
              <Lottie
                animationData={animationData}
                autoplay
                loop={false}
                style={{ height: 70 }}
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
            {getSuccessMessage()}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {getSuccessDescription()}
          </p>
        </div>

        <div
          className={`grid ${showPaymentDetails ? "lg:grid-cols-2" : "lg:grid-cols-1 max-w-2xl mx-auto"} gap-8 mb-12 transition-all duration-1000 transform ${
            showContent
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          {/* Payment Details - Only for paid plans */}
          {showPaymentDetails && (
            <div className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-xl font-semibold mb-6 text-foreground">
                Payment Details
              </h2>

              <div className="space-y-4">
                {[
                  { label: "Plan", value: selectedPlan.name },
                  {
                    label: "Billing",
                    value: (
                      <div className="text-right">
                        <span className="font-medium text-foreground">
                          {billingPeriod === "yearly" ? "Annual" : "Monthly"}
                        </span>
                        {billingPeriod === "yearly" && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            30% OFF
                          </Badge>
                        )}
                      </div>
                    ),
                  },
                  ...(subscription?.storage_gb
                    ? [
                        {
                          label: "Storage",
                          value: formatStorage(subscription.storage_gb),
                        },
                      ]
                    : []),
                  {
                    label: "Amount Paid",
                    value: `$${subscription?.orders?.amount?.toFixed(2) || selectedPlan.price}`,
                  },
                  {
                    label: "Next Billing",
                    value: subscription?.current_period_end
                      ? formatDate(subscription.current_period_end)
                      : "Calculating...",
                  },
                  ...(subscription?.orders?.transaction_id
                    ? [
                        {
                          label: "Transaction",
                          value: subscription.orders.transaction_id.slice(-8),
                          isTransaction: true,
                        },
                      ]
                    : []),
                ].map((item, index) => (
                  <div
                    key={item.label}
                    className={`flex justify-between transition-all duration-500 transform ${
                      showContent
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 translate-x-4"
                    }`}
                    style={{ transitionDelay: `${800 + index * 100}ms` }}
                  >
                    <span
                      className={`text-muted-foreground ${item.isTransaction ? "text-sm" : ""}`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`font-medium text-foreground ${item.isTransaction ? "font-mono text-muted-foreground text-sm" : ""}`}
                    >
                      {typeof item.value === "string" ? item.value : item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan Features */}
          <div className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-xl font-semibold mb-6 text-foreground">
              What's Included
            </h2>

            <div className="space-y-3">
              {[
                {
                  icon: CheckCircleIcon,
                  text: subscription?.storage_gb
                    ? `${formatStorage(subscription.storage_gb)} storage`
                    : selectedPlan.storage,
                  primary: true,
                },
                {
                  icon: CheckCircleIcon,
                  text: `${formatUploadSize(selectedPlan.id)} max upload size`,
                  primary: true,
                },
                ...(selectedPlan.id === "lite" || selectedPlan.id === "pro"
                  ? [
                      {
                        icon: CheckCircleIcon,
                        text: "Flexible storage - pay only for what you need",
                        primary: true,
                      },
                    ]
                  : []),
                ...selectedPlan.features.slice(0, 4).map((feature) => ({
                  icon: CheckBadgeIcon,
                  text: feature,
                  primary: false,
                })),
                ...(selectedPlan.features.length > 4
                  ? [
                      {
                        icon: CheckBadgeIcon,
                        text: `+${selectedPlan.features.length - 4} more features`,
                        primary: false,
                      },
                    ]
                  : []),
              ].map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={index}
                    className={`flex items-center transition-all duration-500 transform ${
                      showContent
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 translate-x-4"
                    }`}
                    style={{ transitionDelay: `${800 + index * 100}ms` }}
                  >
                    <IconComponent className="size-5 text-primary mr-3 flex-shrink-0" />
                    <span
                      className={
                        feature.primary
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {feature.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className={`text-center space-x-4 transition-all duration-1000 transform ${
            showContent
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "1400ms" }}
        >
          <Button
            onClick={() => router.push("/dashboard")}
            size="lg"
            className="hover:scale-105 transition-transform duration-200"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open("mailto:support@raivcoo.com")}
            size="lg"
            className="hover:scale-105 transition-transform duration-200"
          >
            Contact Support
          </Button>
        </div>

        {/* Simple footer */}
        <div
          className={`mt-12 text-center transition-all duration-1000 transform ${
            showContent
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "1600ms" }}
        >
          <p className="text-sm text-muted-foreground mb-4">
            Questions? Contact{" "}
            <Link
              href="mailto:support@raivcoo.com"
              className="text-primary hover:underline transition-colors duration-200"
            >
              support@raivcoo.com
            </Link>
          </p>
          <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
            <Link
              href="legal/TermsOfService"
              className="hover:underline transition-colors duration-200"
            >
              Terms
            </Link>
            <span>•</span>
            <Link
              href="legal/PrivacyPolicy"
              className="hover:underline transition-colors duration-200"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}