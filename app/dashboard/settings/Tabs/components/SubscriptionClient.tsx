"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import {
  CalendarIcon,
  CreditCardIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import {
  formatStatus,
  formatDate,
  formatFullDate,
  formatNumber,
} from "../../../lib/formats";

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  current_period_end: string;
  current_period_start: string;
  plan_id: string;
  paypal_subscription_id?: string;
  storage_gb?: number;
  billing_period?: string;
  max_upload_size_mb?: number;
  created_at: string;
  updated_at: string;
  last_action?: string;
}

interface Order {
  id: string;
  plan_name: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  paypal_order_id?: string;
  transaction_id?: string;
  metadata?: {
    storage_gb?: number;
    action?: string;
    billing_period?: string;
    current_subscription_id?: string;
  };
}

interface SubscriptionClientProps {
  user: User;
  subscription: Subscription | null;
  orders: Order[];
}

// Check if subscription is truly expired (both status and time)
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

function StatusBadge({ subscription }: { subscription: Subscription | null }) {
  const isFreePlan = !subscription || subscription.plan_id === "free";
  const isExpired = isSubscriptionExpired(subscription);

  if (isFreePlan) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Free Plan
      </Badge>
    );
  }

  if (isExpired) {
    return (
      <Badge
        variant="destructive"
        className="flex items-center gap-1 bg-orange-600 text-white"
      >
        <XCircle className="h-3 w-3" />
        Expired
      </Badge>
    );
  }

  if (subscription?.status === "active") {
    return (
      <Badge
        variant="default"
        className="flex items-center gap-1 bg-green-600 text-white"
      >
        <CheckCircle className="h-3 w-3" />
        Active
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <Clock className="h-3 w-3" />
      {formatStatus(subscription?.status || "inactive")}
    </Badge>
  );
}

export default function SubscriptionClient({
  user,
  subscription,
  orders,
}: SubscriptionClientProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Check subscription status
  const isFreePlan = !subscription || subscription.plan_id === "free";
  const isExpired = isSubscriptionExpired(subscription);
  const isActive = subscription?.status === "active" && !isExpired;

  const daysUntilExpiry =
    isActive && subscription
      ? Math.ceil(
          (new Date(subscription.current_period_end).getTime() -
            new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You will lose access at the end of your current billing period."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      toast({
        title: "Subscription Cancelled",
        description:
          "Your subscription will remain active until the end of your current billing period.",
      });

      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatStorage = (gb: number) => {
    if (gb < 1) return `${formatNumber(Math.round(gb * 1000))}MB`;
    return `${formatNumber(gb)}GB`;
  };

  const formatUploadSize = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(0)}GB`;
    return `${mb}MB`;
  };

  const getTotalSpent = () => {
    return orders
      .filter((order) => order.status === "completed")
      .reduce((sum, order) => sum + order.amount, 0);
  };

  const getUploadSizeForPlan = (planId: string) => {
    const uploadSizes = {
      free: 200,
      lite: 2048,
      pro: 5120,
    };
    return uploadSizes[planId as keyof typeof uploadSizes] || 200;
  };

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Current Subscription */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center text-foreground">
            <CreditCardIcon className="h-5 w-5 mr-2" />
            Current Plan
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  {isFreePlan ? "Free Plan" : `${subscription?.plan_name} Plan`}
                </h3>
                <div className="space-y-1 mt-1">
                  <p className="text-sm text-muted-foreground">
                    {isFreePlan
                      ? "500MB storage"
                      : subscription?.storage_gb
                        ? `${formatStorage(subscription.storage_gb)} storage`
                        : "250GB storage"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatUploadSize(
                      subscription?.max_upload_size_mb ||
                        getUploadSizeForPlan(subscription?.plan_id || "free")
                    )}{" "}
                    max upload size
                  </p>
                  {subscription?.billing_period === "yearly" && (
                    <p className="text-sm text-green-600 font-medium">
                      30% savings with yearly billing
                    </p>
                  )}
                </div>
              </div>
              <StatusBadge subscription={subscription} />
            </div>

            {!isFreePlan && subscription && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Billing</span>
                  <span className="text-sm font-medium text-foreground">
                    {subscription.billing_period === "yearly"
                      ? "Annual"
                      : "Monthly"}
                    {subscription.billing_period === "yearly" && (
                      <span className="text-green-600 ml-1">(30% off)</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {isActive ? "Expires" : "Expired"}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {formatDate(subscription.current_period_end)}
                  </span>
                </div>

                {isActive && daysUntilExpiry > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Days remaining
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {daysUntilExpiry === 1
                        ? "1 day"
                        : `${daysUntilExpiry} days`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Warnings */}
            {!isFreePlan &&
              daysUntilExpiry <= 7 &&
              daysUntilExpiry > 0 &&
              isActive && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Expiring Soon</p>
                    <p className="text-yellow-600">
                      Your subscription expires in{" "}
                      {daysUntilExpiry === 1
                        ? "1 day"
                        : `${daysUntilExpiry} days`}
                      .
                    </p>
                  </div>
                </div>
              )}

            {isExpired && !isFreePlan && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">
                    Subscription Expired
                  </p>
                  <p className="text-red-600">
                    Your subscription has expired. You're now on the Free plan.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {isFreePlan || isExpired ? (
                <Link href="/pricing" className="w-full">
                  <Button className="w-full">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    {isExpired ? "Reactivate Plan" : "Upgrade to Pro"}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/pricing" className="flex-1">
                    <Button variant="default" className="w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Plan
                    </Button>
                  </Link>

                  {isActive && (
                    <Button
                      variant="destructive"
                      onClick={handleCancelSubscription}
                      disabled={isLoading}
                    >
                      {isLoading ? "Cancelling..." : "Cancel"}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Account Summary */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center text-foreground">
            <UserIcon className="h-5 w-5 mr-2" />
            Account Summary
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium text-foreground">
                {user.email}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="text-sm font-medium text-foreground">
                {isFreePlan ? "Free" : subscription?.plan_name || "Free"}
                {subscription?.billing_period === "yearly" && " (Yearly)"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Member since
              </span>
              <span className="text-sm font-medium text-foreground">
                {formatDate(user.created_at)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Total orders
              </span>
              <span className="text-sm font-medium text-foreground">
                {formatNumber(orders.length)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total spent</span>
              <span className="text-sm font-medium text-foreground">
                ${formatNumber(getTotalSpent())}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center text-foreground">
          <CalendarIcon className="h-5 w-5 mr-2" />
          Billing History
        </h2>

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-foreground">
                      {order.plan_name} Plan
                    </h4>
                    <Badge
                      variant={
                        order.status === "completed" ? "default" : "outline"
                      }
                      className={
                        order.status === "completed"
                          ? "bg-green-600 text-white"
                          : ""
                      }
                    >
                      {formatStatus(order.status)}
                    </Badge>
                    {order.metadata?.billing_period === "yearly" && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-green-100 text-green-700"
                      >
                        Yearly (30% off)
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatFullDate(order.created_at)}
                  </p>
                  {order.metadata?.storage_gb && (
                    <p className="text-sm text-muted-foreground">
                      {formatStorage(order.metadata.storage_gb)} storage
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="font-medium text-foreground">
                    ${formatNumber(order.amount)} {order.currency.toUpperCase()}
                  </p>
                  {order.metadata?.billing_period === "yearly" && (
                    <p className="text-xs text-green-600">
                      (${(order.amount / 12).toFixed(2)}/month)
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-muted rounded-md p-6">
              <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium text-foreground mb-2">
                No billing history
              </h3>
              <p className="text-sm text-muted-foreground">
                {isFreePlan
                  ? "Upgrade to see your billing history here."
                  : "Your payment history will appear here."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}