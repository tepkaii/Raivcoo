"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { CheckBadgeIcon, CheckCircleIcon } from "@heroicons/react/24/solid";

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
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircleIcon className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {getSuccessMessage()}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {getSuccessDescription()}
          </p>
        </div>

        <div
          className={`grid ${showPaymentDetails ? "lg:grid-cols-2" : "lg:grid-cols-1 max-w-2xl mx-auto"} gap-8 mb-12`}
        >
          {/* Payment Details - Only for paid plans */}
          {showPaymentDetails && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold mb-6 text-foreground">
                Payment Details
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium text-foreground">
                    {selectedPlan.name}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing</span>
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
                </div>

                {subscription?.storage_gb && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Storage</span>
                    <span className="font-medium text-foreground">
                      {formatStorage(subscription.storage_gb)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium text-foreground">
                    $
                    {subscription?.orders?.amount?.toFixed(2) ||
                      selectedPlan.price}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Billing</span>
                  <span className="font-medium text-foreground">
                    {subscription?.current_period_end
                      ? formatDate(subscription.current_period_end)
                      : "Calculating..."}
                  </span>
                </div>

                {subscription?.orders?.transaction_id && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transaction</span>
                    <span className="font-mono text-muted-foreground">
                      {subscription.orders.transaction_id.slice(-8)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Plan Features */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold mb-6 text-foreground">
              What's Included
            </h2>

            <div className="space-y-3">
              <div className="flex items-center">
                <CheckCircleIcon className="size-5 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground">
                  {subscription?.storage_gb
                    ? `${formatStorage(subscription.storage_gb)} storage`
                    : selectedPlan.storage}
                </span>
              </div>

              <div className="flex items-center">
                <CheckCircleIcon className="size-5 text-primary mr-3 flex-shrink-0" />
                <span className="text-foreground">
                  {formatUploadSize(selectedPlan.id)} max upload size
                </span>
              </div>

              {selectedPlan.features.slice(0, 4).map((feature, index) => (
                <div key={index} className="flex items-center">
                  <CheckBadgeIcon className="size-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}

              {selectedPlan.features.length > 4 && (
                <div className="flex items-center">
                  <CheckBadgeIcon className="size-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    +{selectedPlan.features.length - 4} more features
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-x-4">
          <Button onClick={() => router.push("/dashboard")} size="lg">
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open("mailto:support@raivcoo.com")}
            size="lg"
          >
            Contact Support
          </Button>
        </div>

        {/* Simple footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Questions? Contact{" "}
            <Link
              href="mailto:support@raivcoo.com"
              className="text-primary hover:underline"
            >
              support@raivcoo.com
            </Link>
          </p>
          <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}