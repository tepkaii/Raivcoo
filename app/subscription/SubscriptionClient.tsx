// app/subscription/SubscriptionClient.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CreditCard,
  Download,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import {
  cancelSubscription,
  createCustomerPortalSession,
} from "@/lib/polar-actions";
import { toast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  current_period_end: string;
  product_id: string;
  polar_subscription_id: string;
  polar_customer_id: string;
  created_at: string;
}

interface Order {
  id: string;
  plan_name: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

interface SubscriptionClientProps {
  user: User;
  subscription: Subscription | null;
  orders: Order[];
}

function StatusBadge({ status }: { status: string }) {
  const variants = {
    active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    cancelled: { color: "bg-red-100 text-red-800", icon: XCircle },
    expired: { color: "bg-gray-100 text-gray-800", icon: Clock },
    pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
  };

  const variant = variants[status as keyof typeof variants] || variants.pending;
  const Icon = variant.icon;

  return (
    <Badge className={`${variant.color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const variants = {
    completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
    failed: { color: "bg-red-100 text-red-800", icon: XCircle },
  };

  const variant = variants[status as keyof typeof variants] || variants.pending;
  const Icon = variant.icon;

  return (
    <Badge className={`${variant.color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export default function SubscriptionClient({
  user,
  subscription,
  orders,
}: SubscriptionClientProps) {
  const [isLoading, setIsLoading] = useState(false);

  const isSubscriptionActive =
    subscription &&
    subscription.status === "active" &&
    new Date(subscription.current_period_end) > new Date();

  const daysUntilExpiry = subscription
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
      const { portalUrl } = await cancelSubscription(
        subscription.polar_subscription_id
      );
      window.open(portalUrl, "_blank");

      toast({
        title: "Redirected to Customer Portal",
        description:
          "Complete the cancellation process in the Polar customer portal.",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to open cancellation portal.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!subscription) return;

    setIsLoading(true);
    try {
      const { portalUrl } = await createCustomerPortalSession(
        subscription.polar_customer_id
      );
      window.open(portalUrl, "_blank");

      toast({
        title: "Opening Customer Portal",
        description:
          "Manage your subscription details in the Polar customer portal.",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to open customer portal.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
        <p className="text-muted-foreground">
          Manage your subscription, view billing history, and update your plan.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Current Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {subscription.plan_name} Plan
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Started{" "}
                      {new Date(subscription.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={subscription.status} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>
                    <span className="text-sm font-medium">
                      {subscription.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Next billing
                    </span>
                    <span className="text-sm font-medium">
                      {new Date(
                        subscription.current_period_end
                      ).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Days remaining
                    </span>
                    <span className="text-sm font-medium">
                      {daysUntilExpiry > 0
                        ? `${daysUntilExpiry} days`
                        : "Expired"}
                    </span>
                  </div>
                </div>

                {daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">
                        Subscription expiring soon
                      </p>
                      <p className="text-yellow-600">
                        Your subscription expires in {daysUntilExpiry} days.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Link href="/pricing" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Change Plan
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleManageSubscription}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Manage
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900 mb-1">
                    No active subscription
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    You don't have an active subscription. Choose a plan to get
                    started.
                  </p>
                  <Link href="/pricing">
                    <Button>View Plans</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium">{user.email}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Account created
                </span>
                <span className="text-sm font-medium">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total orders
                </span>
                <span className="text-sm font-medium">{orders.length}</span>
              </div>
            </div>

            <div className="pt-4">
              <Link href="/account">
                <Button variant="outline" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{order.plan_name} Plan</h4>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()} at{" "}
                      {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium">
                      ${order.amount.toFixed(2)} {order.currency.toUpperCase()}
                    </p>
                    {order.status === "completed" && (
                      <Button variant="ghost" size="sm" className="mt-1">
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
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">
                No billing history
              </h3>
              <p className="text-sm text-gray-500">
                Your payment history will appear here once you make a purchase.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
