"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  CheckBadgeIcon,
  CheckCircleIcon,
  CreditCardIcon,
} from "@heroicons/react/24/solid";

interface Plan {
  id: string;
  name: string;
  price: string;
  storage: string;
  features: string[];
}

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  storage_gb?: number;
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
}

export default function SuccessClient({
  user,
  selectedPlan,
  subscription,
  action,
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

  const getSuccessMessage = () => {
    const storageText = subscription?.storage_gb
      ? formatStorage(subscription.storage_gb)
      : selectedPlan.storage.replace(" storage included", "");

    switch (action) {
      case "upgrade":
        return `Successfully upgraded to ${storageText} storage!`;
      case "downgrade":
        return selectedPlan.id === "free"
          ? `Successfully downgraded to Free plan!`
          : `Successfully downgraded to ${storageText} storage!`;
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
          : "Your plan has been downgraded. Changes are effective immediately.";
      default:
        return selectedPlan.id === "free"
          ? "You're all set with your free account. Start uploading and reviewing!"
          : "Your subscription is now active. You're all set to start using your new features.";
    }
  };

  // Show payment details for:
  // 1. Any paid plan (not free)
  // 2. OR if it's a downgrade but NOT to free plan (e.g., Pro with less storage)
  const showPaymentDetails =
    selectedPlan.id !== "free" ||
    (action === "downgrade" && selectedPlan.id !== "free");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="rounded-[10px] bg-primary/10 p-4">
              <CheckCircleIcon className="h-16 w-16 text-primary" />
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
          {/* Order Details - Show for paid plans or paid downgrades */}
          {showPaymentDetails && (
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center text-foreground">
                <CreditCardIcon className="h-5 w-5 mr-2" />
                {action === "upgrade"
                  ? "Upgrade"
                  : action === "downgrade"
                    ? "Downgrade"
                    : "Order"}{" "}
                Details
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Plan</span>
                  <div className="text-right flex items-center">
                    <span className="font-medium text-foreground">
                      {selectedPlan.name} Plan
                    </span>
                    {action && (
                      <Badge
                        className="ml-2"
                        variant={action === "upgrade" ? "default" : "secondary"}
                      >
                        {action.charAt(0).toUpperCase() + action.slice(1)}
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
                  <span className="text-muted-foreground">
                    {action === "downgrade"
                      ? "New Monthly Cost"
                      : "Amount Paid"}
                  </span>
                  <span className="font-medium text-foreground">
                    $
                    {subscription?.orders?.amount?.toFixed(2) ||
                      selectedPlan.price}
                    {action === "downgrade" && "/month"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {action === "downgrade" ? "Change Date" : "Payment Date"}
                  </span>
                  <span className="font-medium text-foreground">
                    {subscription?.orders?.completed_at
                      ? formatDate(subscription.orders.completed_at)
                      : formatDate(new Date().toISOString())}
                  </span>
                </div>

                {subscription?.orders?.transaction_id &&
                  action !== "downgrade" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Transaction ID
                      </span>
                      <span className="font-mono text-sm text-foreground">
                        {subscription.orders.transaction_id}
                      </span>
                    </div>
                  )}

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Next Billing Date
                    </span>
                    <span className="font-medium text-foreground">
                      {subscription?.current_period_end
                        ? formatDate(subscription.current_period_end)
                        : "Calculating..."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Plan Features */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-xl font-semibold mb-6 text-foreground">
              What's Included in {selectedPlan.name}
            </h2>

            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <CheckCircleIcon className="size-5 text-primary mr-3 flex-shrink-0" />
                <span className="font-medium text-foreground">
                  {subscription?.storage_gb
                    ? `${formatStorage(subscription.storage_gb)} storage`
                    : selectedPlan.storage}
                </span>
              </div>

              {selectedPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center text-sm">
                  <CheckBadgeIcon className="size-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
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
            onClick={() => router.push("/support")}
            size="lg"
          >
            Contact Support
          </Button>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p className="mb-2">
            Questions about your{" "}
            {selectedPlan.id === "free" ? "account" : "subscription"}? We're
            here to help!
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/support" className="text-primary hover:underline">
              Support Center
            </Link>
            <span>•</span>
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
