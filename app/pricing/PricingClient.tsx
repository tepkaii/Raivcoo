"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  current_period_end: string;
  paypal_subscription_id?: string;
}

interface PricingClientProps {
  user: User | null;
  currentSubscription: Subscription | null;
}

const pricingTiers = [
  {
    id: "basic" as const,
    name: "Basic",
    price: "3.99",
    storage: "100GB storage included",
    level: 1,
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
    id: "pro" as const,
    name: "Pro",
    price: "5.99",
    storage: "250GB storage included",
    level: 2,
    popular: true,
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
    id: "premium" as const,
    name: "Premium",
    price: "9.99",
    storage: "500GB storage included",
    level: 3,
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

function PayPalCheckout({
  planId,
  planName,
  amount,
  onCancel,
  onSuccess,
}: {
  planId: string;
  planName: string;
  amount: number;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: "USD",
    intent: "capture",
    environment: "sandbox" as const,
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {isProcessing && (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>Processing payment...</span>
          </div>
        )}

        <PayPalButtons
          style={{
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "paypal",
            height: 40,
          }}
          createOrder={async (data, actions) => {
            try {
              // First create a pending order in our database
              const response = await fetch("/api/orders/create", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  planId,
                  planName,
                  amount,
                }),
              });

              if (!response.ok) {
                throw new Error("Failed to create order");
              }

              const { orderId } = await response.json();
              setPendingOrderId(orderId);

              // Then create the PayPal order
              return actions.order.create({
                purchase_units: [
                  {
                    description: `${planName} Plan Subscription`,
                    amount: {
                      currency_code: "USD",
                      value: amount.toString(),
                    },
                    custom_id: orderId, // Use our database order ID
                  },
                ],
              });
            } catch (error) {
              console.error("Error creating order:", error);
              setError("Failed to create order");
              throw error;
            }
          }}
          onApprove={async (data, actions) => {
            setIsProcessing(true);
            setError("");

            try {
              const order = await actions.order?.capture();
              console.log("PayPal Order captured:", order);

              if (!pendingOrderId) {
                throw new Error("No pending order found");
              }

              // Create subscription in your database
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
                  pendingOrderId,
                }),
              });

              if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                  errorData.error || "Failed to create subscription"
                );
              }

              toast({
                title: "Success!",
                description: `Payment completed for ${planName} plan`,
              });

              onSuccess();
            } catch (err) {
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
            console.error("PayPal Error", err);
            setError(
              "Payment processing failed. Please try again or use a different payment method."
            );
          }}
          onCancel={() => {
            // Clean up pending order if user cancels
            if (pendingOrderId) {
              fetch("/api/orders/cancel", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ orderId: pendingOrderId }),
              });
            }
            onCancel();
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}

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
  const [showPayPal, setShowPayPal] = useState(false);

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

  const handleSubscribe = () => {
    if (!user) {
      router.push(`/login?redirect=/pricing&plan=${tier.id}`);
      return;
    }

    if (isDisabled) return;
    setShowPayPal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayPal(false);
    router.push("/dashboard?success=true&plan=" + tier.name);
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

        {!showPayPal ? (
          <Button
            onClick={handleSubscribe}
            disabled={isDisabled}
            variant={getButtonVariant()}
            className="w-full"
            size="lg"
          >
            {getButtonText()}
            {isUpgrade && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Complete Payment</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPayPal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <PayPalCheckout
              planId={tier.id}
              planName={tier.name}
              amount={parseFloat(tier.price)}
              onCancel={() => setShowPayPal(false)}
              onSuccess={handlePaymentSuccess}
            />
          </div>
        )}

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
