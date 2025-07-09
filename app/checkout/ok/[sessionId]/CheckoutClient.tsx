// app/checkout/CheckoutClient.tsx (complete rewrite)
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import Link from "next/link";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  current_period_end: string;
  billing_period?: string;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  storage: string;
  features: string[];
}

interface CheckoutClientProps {
  user: User;
  selectedPlan: Plan;
  currentSubscription: Subscription | null;
  customStorage?: number;
  action?: string; // "new", "upgrade", "downgrade", "renew"
  billingPeriod?: string;
  sessionId: string;
}

// PayPalCheckout component with session-based order creation
function PayPalCheckout({
  sessionId,
  planName,
  amount,
  action,
  billingPeriod,
  onSuccess,
}: {
  sessionId: string;
  planName: string;
  amount: number;
  action?: string;
  billingPeriod?: string;
  onSuccess: () => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm">
        PayPal configuration missing. Please contact support.
      </div>
    );
  }

  const initialOptions = {
    clientId,
    currency: "USD",
    intent: "capture" as const,
    environment: "production" as const,
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm">
            <p className="font-medium">Payment Error:</p>
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setError("")}
            >
              Try Again
            </Button>
          </div>
        )}

        {isProcessing && (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="text-muted-foreground">
              Processing {action || "payment"}...
            </span>
          </div>
        )}

        <PayPalButtons
          style={{
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "paypal",
            height: 45,
          }}
          createOrder={async (data, actions) => {
            try {
              setError("");

              // Create order using session data - user can't manipulate these values
              const response = await fetch("/api/orders/create", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  sessionId: sessionId, // Only pass session ID
                }),
              });

              const responseData = await response.json();

              if (!response.ok) {
                throw new Error(responseData.error || "Failed to create order");
              }

              const { orderId } = responseData;
              setPendingOrderId(orderId);

              // Create PayPal order with secure data
              const items = [];

              // Single item for the plan
              items.push({
                name: `${planName} Plan - ${billingPeriod === "yearly" ? "1 Year" : "1 Month"}`,
                description: `${planName} plan access for ${billingPeriod === "yearly" ? "12 months" : "1 month"} - one-time payment`,
                sku: `${planName.toLowerCase()}-${billingPeriod}`,
                unit_amount: {
                  currency_code: "USD",
                  value: amount.toFixed(2),
                },
                quantity: "1",
                category: "DIGITAL_GOODS" as const,
              });

              return actions.order.create({
                intent: "CAPTURE" as const,
                purchase_units: [
                  {
                    reference_id: orderId,
                    description: `${planName} Plan - ${action ? `${action} - ` : ""}${billingPeriod || "monthly"} billing`,
                    custom_id: orderId,
                    soft_descriptor: "RAIVCOO",
                    amount: {
                      currency_code: "USD",
                      value: amount.toFixed(2),
                      breakdown: {
                        item_total: {
                          currency_code: "USD",
                          value: amount.toFixed(2),
                        },
                      },
                    },
                    items: items,
                  },
                ],
                application_context: {
                  brand_name: "RAIVCOO",
                  locale: "en-US",
                  landing_page: "BILLING",
                  shipping_preference: "NO_SHIPPING",
                  user_action: "PAY_NOW",
                  return_url: `${window.location.origin}/checkout/success`,
                  cancel_url: `${window.location.origin}/checkout/cancel`,
                },
              });
            } catch (error: any) {
              console.error("Error creating order:", error);
              setError(error.message || "Failed to create order");
              throw error;
            }
          }}
          onApprove={async (data, actions) => {
            setIsProcessing(true);
            setError("");

            try {
              const order = await actions.order?.capture();

              if (!pendingOrderId) {
                throw new Error("No pending order found");
              }

              const res = await fetch("/api/subscriptions/create", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  order,
                  pendingOrderId,
                  sessionId,
                  paypalOrderId: data.orderID,
                }),
              });

              const responseData = await res.json();

              if (!res.ok) {
                throw new Error(
                  responseData.error || "Failed to create subscription"
                );
              }

              onSuccess();
            } catch (err: any) {
              console.error("Payment error:", err);
              setError(
                err.message ||
                  "Payment verification failed. Please contact support."
              );
            } finally {
              setIsProcessing(false);
            }
          }}
          onError={(err) => {
            console.error("PayPal Error:", err);
            setError(
              "PayPal processing failed. Please check your PayPal account and try again."
            );
          }}
          onCancel={() => {
            if (pendingOrderId) {
              fetch("/api/orders/cancel", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ orderId: pendingOrderId }),
              }).catch(console.error);
            }
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}

export default function CheckoutClient({
  user,
  selectedPlan,
  currentSubscription,
  customStorage,
  action,
  billingPeriod = "monthly",
  sessionId,
}: CheckoutClientProps) {
  const router = useRouter();

  const handlePaymentSuccess = () => {
    const actionMessage = {
      upgrade: "Upgrade completed successfully!",
      downgrade: "Downgrade completed successfully!",
      renew: "Plan renewed successfully!",
      new: "Payment completed successfully!",
    };

    toast({
      title: "Success!",
      description:
        actionMessage[action as keyof typeof actionMessage] ||
        "Payment completed successfully!",
    });

    const successParams = new URLSearchParams({
      plan: selectedPlan.id,
      action: action || "new",
      billing: billingPeriod,
    });

    if (customStorage) {
      successParams.append("storage", customStorage.toString());
    }

    router.push(`/checkout/success?${successParams.toString()}`);
  };

  const subtotal = parseFloat(selectedPlan.price);
  const total = subtotal; // No taxes

  // For free plan downgrades, handle differently
  const isFreeDowngrade = selectedPlan.id === "free" && action === "downgrade";

  const getActionTitle = () => {
    const periodText = billingPeriod === "yearly" ? " (Yearly)" : " (Monthly)";

    switch (action) {
      case "upgrade":
        return `Upgrade Plan${periodText}`;
      case "downgrade":
        return isFreeDowngrade
          ? "Downgrade to Free"
          : `Downgrade Plan${periodText}`;
      case "renew":
        return `Renew Plan${periodText}`;
      default:
        return `New Subscription${periodText}`;
    }
  };

  const formatUploadSize = (planId: string) => {
    const uploadSizes = {
      free: "200MB",
      lite: "2GB",
      pro: "5GB",
    };
    return uploadSizes[planId as keyof typeof uploadSizes] || "Unknown";
  };

  const formatStorage = (storage: string | number) => {
    if (typeof storage === "number") {
      if (storage < 1) return `${Math.round(storage * 1000)}MB`;
      return `${storage}GB`;
    }
    return storage;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center">
              <Link
                href="/pricing"
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to pricing
              </Link>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">
                {getActionTitle()}
              </h1>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Order Summary & Details */}
          <div className="lg:pr-8">
            <div className="bg-card rounded-lg shadow-sm border border-border p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-6 text-foreground">
                Order Summary
              </h2>

              {/* Plan details */}
              <div className="border-b border-border pb-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-lg text-foreground">
                      {selectedPlan.name} Plan
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {customStorage
                        ? `${customStorage}GB storage`
                        : selectedPlan.storage}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatUploadSize(selectedPlan.id)} max upload size
                    </p>
                    {(selectedPlan.id === "lite" ||
                      selectedPlan.id === "pro") && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Flexible storage - pay only for what you need
                      </p>
                    )}
                    <div className="mt-2">
                      {billingPeriod === "yearly" ? (
                        <p className="text-sm font-medium text-green-600">
                          Yearly Billing (30% savings)
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Monthly Billing
                        </p>
                      )}
                    </div>
                    {action && (
                      <Badge
                        className="mt-2"
                        variant={
                          action === "upgrade" || action === "renew"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {selectedPlan.id === "pro" && (
                      <Badge variant="default" className="ml-2">
                        Best Value
                      </Badge>
                    )}
                    {selectedPlan.id === "lite" && (
                      <Badge variant="secondary" className="ml-2">
                        Great Value
                      </Badge>
                    )}
                    {billingPeriod === "yearly" && !isFreeDowngrade && (
                      <Badge
                        variant="secondary"
                        className="ml-2 text-xs text-green-700"
                      >
                        30% OFF
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Features list */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground mb-2">
                    What's included:
                  </p>
                  {selectedPlan.features.slice(0, 5).map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <CheckBadgeIcon className="size-4 text-primary mr-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                  {selectedPlan.features.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      +{selectedPlan.features.length - 5} more features
                    </p>
                  )}
                </div>
              </div>

              {/* Pricing */}
              {!isFreeDowngrade && (
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-foreground">
                      Total
                    </span>
                    <div className="text-right">
                      <span className="text-xl font-bold text-foreground">
                        ${total.toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">
                        /{billingPeriod === "yearly" ? "year" : "month"}
                      </span>
                      {billingPeriod === "yearly" && (
                        <p className="text-xs text-green-600">
                          ${(total / 12).toFixed(2)}/month equivalent
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Simple billing info */}
              <div className="text-sm text-muted-foreground space-y-2">
                {isFreeDowngrade ? (
                  <>
                    <p>• No payment required</p>
                    <p>• Downgrade takes effect immediately</p>
                  </>
                ) : (
                  <>
                    <p>• One-time payment, no recurring charges</p>
                    <p>• Cancel anytime before renewal</p>
                    <p>• Contact support@raivcoo.com for refunds</p>
                    {billingPeriod === "yearly" && (
                      <p className="text-green-600 font-medium">
                        • 30% savings with yearly plan
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-3">
                      Cheap pricing, flexible storage options
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Payment Form */}
          <div className="lg:pl-8">
            <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                Account
              </h2>
              <div className="p-4 bg-primary-foreground rounded-md">
                <p className="text-sm text-muted-foreground">Signed in as:</p>
                <p className="font-medium text-foreground">{user.email}</p>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                {isFreeDowngrade ? "Confirm Downgrade" : "Payment"}
              </h2>

              {isFreeDowngrade ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Confirm your downgrade to the Free plan. This will cancel
                    your current subscription.
                  </p>
                  <Button
                    onClick={handlePaymentSuccess}
                    className="w-full"
                    size="lg"
                  >
                    Confirm Downgrade to Free
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 p-3 bg-white rounded-md">
                  <PayPalCheckout
                    sessionId={sessionId}
                    planName={selectedPlan.name}
                    amount={total}
                    action={action}
                    billingPeriod={billingPeriod}
                    onSuccess={handlePaymentSuccess}
                  />
                </div>
              )}
            </div>

            {/* Simple policy links */}
            <div className="text-center">
              <div className="text-xs text-muted-foreground">
                <Link
                  href="legal/TermsOfService"
                  className="text-primary hover:underline"
                >
                  Terms
                </Link>
                {" • "}
                <Link
                  href="legal/PrivacyPolicy"
                  className="text-primary hover:underline"
                >
                  Privacy
                </Link>
                {" • "}
                <Link
                  href="mailto:support@raivcoo.com"
                  className="text-primary hover:underline"
                >
                  Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
