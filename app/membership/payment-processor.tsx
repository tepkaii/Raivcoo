// app/membership/payment-processor.tsx
// @ts-nocheck
"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const sandboxClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;

export default function PaymentProcessor({
  planId,
  planName,
  amount,
  onSuccess,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <PayPalScriptProvider
        options={{
          "client-id": sandboxClientId,
          currency: "USD",
          intent: "capture",
        }}
      >
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
            shape: "pill",
            label: "pay",
          }}
          createOrder={(data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  description: `Raivcoo ${planName} Membership`,
                  amount: {
                    currency_code: "USD",
                    value: amount.toString(),
                  },
                  custom_id: planId,
                },
              ],
            });
          }}
          onApprove={async (data, actions) => {
            setIsProcessing(true);
            setError("");

            try {
              const order = await actions.order?.capture();
              console.log("Order", order);

              const res = await fetch("/api/verify-pro", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  order,
                  planId,
                  planName,
                }),
              });

              if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to verify payment");
              }

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
        />
      </PayPalScriptProvider>
    </div>
  );
}