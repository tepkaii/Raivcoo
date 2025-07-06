"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
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
  action?: string; // "new", "upgrade", "downgrade"
}

function PayPalCheckout({
  planId,
  planName,
  amount,
  storageGb,
  action,
  currentSubId,
  onSuccess,
}: {
  planId: string;
  planName: string;
  amount: number;
  storageGb?: number;
  action?: string;
  currentSubId?: string;
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
    intent: "capture",
    environment: "sandbox" as const,
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

              const response = await fetch("/api/orders/create", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  planId,
                  planName,
                  amount,
                  storageGb,
                  action,
                  currentSubId,
                }),
              });

              const responseData = await response.json();

              if (!response.ok) {
                throw new Error(responseData.error || "Failed to create order");
              }

              const { orderId } = responseData;
              setPendingOrderId(orderId);

              return actions.order.create({
                purchase_units: [
                  {
                    description: `${planName} Plan${storageGb ? ` (${storageGb}GB)` : ""} ${action ? `- ${action}` : ""}`,
                    amount: {
                      currency_code: "USD",
                      value: amount.toFixed(2),
                    },
                    custom_id: orderId,
                  },
                ],
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
                  planId,
                  planName,
                  amount,
                  storageGb,
                  pendingOrderId,
                  action,
                  currentSubId,
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
}: CheckoutClientProps) {
  const router = useRouter();

  const handlePaymentSuccess = () => {
    toast({
      title: "Success!",
      description: `${action === "upgrade" ? "Upgrade" : action === "downgrade" ? "Downgrade" : "Payment"} completed successfully!`,
    });

    const successParams = new URLSearchParams({
      plan: selectedPlan.id,
      action: action || "new",
    });

    if (customStorage) {
      successParams.append("storage", customStorage.toString());
    }

    router.push(`/checkout/success?${successParams.toString()}`);
  };

  const subtotal = parseFloat(selectedPlan.price);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  // For free plan downgrades, handle differently
  const isFreeDowngrade = selectedPlan.id === "free" && action === "downgrade";

  const getActionTitle = () => {
    switch (action) {
      case "upgrade":
        return "Upgrade Plan";
      case "downgrade":
        return isFreeDowngrade ? "Downgrade to Free" : "Downgrade Plan";
      default:
        return "New Subscription";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
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
                      {selectedPlan.storage}
                    </p>
                    {action && (
                      <Badge
                        className="mt-2"
                        variant={action === "upgrade" ? "default" : "secondary"}
                      >
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </Badge>
                    )}
                  </div>
                  {selectedPlan.id === "pro" && (
                    <Badge variant="default" className="ml-2">
                      Popular
                    </Badge>
                  )}
                </div>

                {/* Features list */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground mb-2">
                    Included features:
                  </p>
                  {selectedPlan.features.slice(0, 5).map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <CheckBadgeIcon className="size-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
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

              {/* Pricing breakdown */}
              {!isFreeDowngrade && (
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (8%)</span>
                    <span className="text-foreground">${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground">
                        ${total.toFixed(2)}/month
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing info */}
              <div className="text-sm text-muted-foreground space-y-2">
                {isFreeDowngrade ? (
                  <>
                    <p>• Downgrade will take effect immediately</p>
                    <p>• No payment required</p>
                    <p>• Current billing cycle will be cancelled</p>
                  </>
                ) : (
                  <>
                    <p>• Billed monthly starting today</p>
                    <p>• Cancel anytime</p>
                    <p>• Includes all features listed</p>
                    <p>• 30-day money-back guarantee</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Payment Form */}
          <div className="lg:pl-8">
            <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                Account Information
              </h2>
              <div className="p-4 bg-primary-foreground rounded-md">
                <p className="text-sm text-muted-foreground">Signed in as:</p>
                <p className="font-medium text-foreground">{user.email}</p>
              </div>
            </div>

            <div className="bg-[#ffffff] rounded-lg border border-border p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-primary-foreground">
                {isFreeDowngrade ? "Confirm Downgrade" : "Payment Method"}
              </h2>

              {isFreeDowngrade ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Click below to confirm your downgrade to the Free plan. This
                    action is immediate and will cancel your current
                    subscription.
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
                <PayPalCheckout
                  planId={selectedPlan.id}
                  planName={selectedPlan.name}
                  amount={total}
                  storageGb={customStorage}
                  action={action}
                  currentSubId={currentSubscription?.id}
                  onSuccess={handlePaymentSuccess}
                />
              )}
            </div>

            {/* Policy links */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  By completing this {action || "purchase"}, you agree to our:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>
                  <span>•</span>
                  <Link
                    href="/privacy"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  <span>•</span>
                  <Link href="/refund" className="text-primary hover:underline">
                    Refund Policy
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
