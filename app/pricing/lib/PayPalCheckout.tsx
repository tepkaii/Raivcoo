// components/PayPalCheckout.tsx
"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "@/hooks/use-toast";

interface PayPalCheckoutProps {
  planId: string;
  planName: string;
  amount: number;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
}

export default function PayPalCheckout({
  planId,
  planName,
  amount,
  onSuccess,
  onError,
}: PayPalCheckoutProps) {
  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: "USD",
    intent: "capture",
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <PayPalButtons
        createOrder={async (data, actions) => {
          try {
            // Call your API to create the order
            const response = await fetch("/api/paypal/create-order", {
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

            const orderData = await response.json();

            if (!response.ok) {
              throw new Error(orderData.error || "Failed to create order");
            }

            return orderData.id;
          } catch (error) {
            console.error("Error creating order:", error);
            toast({
              title: "Error",
              description: "Failed to create order",
              variant: "destructive",
            });
            throw error;
          }
        }}
        onApprove={async (data, actions) => {
          try {
            // Call your API to capture the order
            const response = await fetch("/api/paypal/capture-order", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                orderID: data.orderID,
              }),
            });

            const details = await response.json();

            if (!response.ok) {
              throw new Error(details.error || "Failed to capture payment");
            }

            onSuccess(details);

            toast({
              title: "Success!",
              description: `Payment completed for ${planName} plan`,
              variant: "default",
            });
          } catch (error) {
            console.error("Error capturing order:", error);
            onError(error);
            toast({
              title: "Error",
              description: "Payment failed",
              variant: "destructive",
            });
          }
        }}
        onError={(err) => {
          console.error("PayPal error:", err);
          onError(err);
          toast({
            title: "Error",
            description: "Payment processing failed",
            variant: "destructive",
          });
        }}
        style={{
          layout: "vertical",
          color: "blue",
          shape: "rect",
          label: "paypal",
        }}
      />
    </PayPalScriptProvider>
  );
}
