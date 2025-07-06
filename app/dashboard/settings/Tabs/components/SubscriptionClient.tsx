"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
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
    current_subscription_id?: string;
  };
}

interface SubscriptionClientProps {
  user: User;
  subscription: Subscription | null;
  orders: Order[];
}

function StatusBadge({
  status,
  isFreePlan,
}: {
  status: string;
  isFreePlan?: boolean;
}) {
  if (isFreePlan) {
    return (
      <Badge variant="blue" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Free Plan
      </Badge>
    );
  }

  const variants = {
    active: {
      variant: "green" as const,
      icon: CheckCircle,
    },
    cancelled: {
      variant: "red" as const,
      icon: XCircle,
    },
    expired: {
      variant: "secondary" as const,
      icon: Clock,
    },
    pending: {
      variant: "warning" as const,
      icon: Clock,
    },
    trialing: {
      variant: "cyan" as const,
      icon: Clock,
    },
    past_due: {
      variant: "amber" as const,
      icon: AlertCircle,
    },
  };

  const variant = variants[status as keyof typeof variants] || variants.pending;
  const Icon = variant.icon;

  return (
    <Badge variant={variant.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {formatStatus(status)}
    </Badge>
  );
}

function ActionBadge({ action }: { action?: string }) {
  if (!action || action === "new") return null;

  const variants = {
    upgrade: {
      variant: "secondary" as const,
      icon: TrendingUp,
      label: "Upgraded",
    },
    downgrade: {
      variant: "warning" as const,
      icon: TrendingDown,
      label: "Downgraded",
    },
    renewal: {
      variant: "blue" as const,
      icon: RefreshCw,
      label: "Renewed",
    },
  };

  const variant = variants[action as keyof typeof variants];
  if (!variant) return null;

  const Icon = variant.icon;

  return (
    <Badge variant={variant.variant} className="flex items-center gap-1 ml-2">
      <Icon className="h-3 w-3" />
      {variant.label}
    </Badge>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const variants = {
    completed: {
      variant: "green" as const,
      icon: CheckCircle,
    },
    pending: {
      variant: "warning" as const,
      icon: Clock,
    },
    failed: {
      variant: "red" as const,
      icon: XCircle,
    },
  };

  const variant = variants[status as keyof typeof variants] || variants.pending;
  const Icon = variant.icon;

  return (
    <Badge variant={variant.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {formatStatus(status)}
    </Badge>
  );
}

function OrderActionBadge({ action }: { action?: string }) {
  if (!action || action === "new") return null;

  const variants = {
    upgrade: {
      variant: "green" as const,
      icon: TrendingUp,
    },
    downgrade: {
      variant: "warning" as const,
      icon: TrendingDown,
    },
    renewal: {
      variant: "blue" as const,
      icon: RefreshCw,
    },
  };

  const variant = variants[action as keyof typeof variants];
  if (!variant) return null;

  const Icon = variant.icon;

  return (
    <Badge variant={variant.variant} className="flex items-center gap-1 ml-2">
      <Icon className="h-3 w-3" />
      {formatStatus(action)}
    </Badge>
  );
}

export default function SubscriptionClient({
  user,
  subscription,
  orders,
}: SubscriptionClientProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is on free plan (no subscription or free plan)
  const isFreePlan = !subscription || subscription.plan_id === "free";

  const daysUntilExpiry =
    subscription && !isFreePlan
      ? Math.ceil(
          (new Date(subscription.current_period_end).getTime() -
            new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  // Get the most recent action
  const getRecentAction = () => {
    if (subscription?.last_action) {
      return subscription.last_action;
    }

    // Fallback: check most recent order
    const recentOrder = orders.find((order) => order.status === "completed");
    return recentOrder?.metadata?.action;
  };

  // Check if subscription was recently changed (within last 7 days)
  const wasRecentlyChanged = () => {
    if (!subscription) return false;

    const lastUpdateTime = new Date(subscription.updated_at).getTime();
    const sevenDaysAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;

    return lastUpdateTime > sevenDaysAgo;
  };

  const recentAction = getRecentAction();
  const showActionBadge = wasRecentlyChanged() && recentAction;

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
        variant: "default",
      });

      // Refresh the page to show updated status
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

  const downloadReceipt = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/receipt`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `receipt-${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error("Failed to download receipt");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download receipt.",
        variant: "destructive",
      });
    }
  };

  const formatStorage = (gb: number) => {
    if (gb < 1) return `${formatNumber(Math.round(gb * 1000))}MB`;
    return `${formatNumber(gb)}GB`;
  };

  const formatDaysRemaining = (days: number) => {
    if (days <= 0) return "Expired";
    if (days === 1) return "1 day";
    return `${formatNumber(days)} days`;
  };

  const getTotalSpent = () => {
    return orders
      .filter((order) => order.status === "completed")
      .reduce((sum, order) => sum + order.amount, 0);
  };

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Current Subscription */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center text-foreground">
            <CreditCardIcon className="h-5 w-5 mr-2" />
            Current Plan
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <h3 className="text-lg font-medium text-foreground">
                    {isFreePlan
                      ? "Free Plan"
                      : `${subscription?.plan_name} Plan`}
                  </h3>
                  {showActionBadge && <ActionBadge action={recentAction} />}
                </div>
                {isFreePlan ? (
                  <p className="text-sm text-muted-foreground">
                    Default plan - no expiration
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Started{" "}
                    {formatDate(
                      subscription?.current_period_start ||
                        subscription?.created_at ||
                        ""
                    )}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {isFreePlan
                    ? "500MB storage"
                    : subscription?.storage_gb
                      ? `${formatStorage(subscription.storage_gb)} storage`
                      : "250GB storage"}
                </p>
              </div>
              <StatusBadge
                status={
                  isFreePlan ? "active" : subscription?.status || "inactive"
                }
                isFreePlan={isFreePlan}
              />
            </div>

            {!isFreePlan && subscription && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatStatus(subscription.status)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {subscription.status === "active" ? "Expires" : "Expired"}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {formatDate(subscription.current_period_end)}
                  </span>
                </div>

                {subscription.status === "active" && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Days remaining
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {formatDaysRemaining(daysUntilExpiry)}
                    </span>
                  </div>
                )}

                {subscription.paypal_subscription_id && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      PayPal ID
                    </span>
                    <span className="text-sm font-mono text-xs text-foreground">
                      {subscription.paypal_subscription_id}
                    </span>
                  </div>
                )}
              </div>
            )}

            {!isFreePlan &&
              daysUntilExpiry <= 7 &&
              daysUntilExpiry > 0 &&
              subscription?.status === "active" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">
                      Subscription expiring soon
                    </p>
                    <p className="text-yellow-600">
                      Your subscription expires in{" "}
                      {formatDaysRemaining(daysUntilExpiry)}.
                    </p>
                  </div>
                </div>
              )}

            <div className="flex gap-3 pt-4">
              {isFreePlan ? (
                <Link href="/pricing" className="w-full">
                  <Button className="w-full">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Upgrade to Pro
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

                  {subscription?.status === "active" && (
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

        {/* Account Info */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center text-foreground">
            <UserIcon className="h-5 w-5 mr-2" />
            Account Information
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium text-foreground">
                {user.email}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Account created
              </span>
              <span className="text-sm font-medium text-foreground">
                {formatDate(user.created_at)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Current plan
              </span>
              <span className="text-sm font-medium text-foreground">
                {isFreePlan ? "Free" : subscription?.plan_name || "Free"}
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

      {/* Order History */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center text-foreground">
          <CalendarIcon className="h-5 w-5 mr-2" />
          Billing History
        </h2>

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg bg-primary-foreground"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-foreground">
                      {order.plan_name} Plan
                    </h4>
                    <OrderStatusBadge status={order.status} />
                    <OrderActionBadge action={order.metadata?.action} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatFullDate(order.created_at)}
                  </p>
                  {order.metadata?.storage_gb && (
                    <p className="text-sm text-muted-foreground">
                      {formatStorage(order.metadata.storage_gb)} storage
                    </p>
                  )}
                  {order.transaction_id && (
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      Transaction: {order.transaction_id}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="font-medium text-foreground">
                    ${formatNumber(order.amount)} {order.currency.toUpperCase()}
                  </p>
                  {order.status === "completed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => downloadReceipt(order.id)}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Receipt
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-primary-foreground rounded-md p-6">
              <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium text-foreground mb-2">
                No billing history
              </h3>
              <p className="text-sm text-muted-foreground">
                {isFreePlan
                  ? "Upgrade to Pro to see your billing history here."
                  : "Your payment history will appear here once you make a purchase."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
