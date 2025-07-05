// lib/paypal-actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { paypalClient } from "./paypal-client";
import paypal from "@paypal/checkout-server-sdk";

const PLAN_PRICES = {
  basic: 3.99,
  pro: 5.99,
  premium: 9.99,
} as const;

export async function createPayPalOrder({
  planId,
  planName,
  isUpgrade = false,
  currentSubscriptionId,
}: {
  planId: keyof typeof PLAN_PRICES;
  planName: string;
  isUpgrade?: boolean;
  currentSubscriptionId?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/pricing");
  }

  try {
    // Create order in database first
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        plan_id: planId,
        plan_name: planName,
        amount: PLAN_PRICES[planId],
        currency: "USD",
        status: "pending",
        metadata: {
          isUpgrade,
          currentSubscriptionId,
        },
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Database error:", orderError);
      throw new Error("Failed to create order in database");
    }

    console.log("Order created in database:", order.id);

    // Create PayPal order using SDK
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: order.id,
          amount: {
            currency_code: "USD",
            value: PLAN_PRICES[planId].toString(),
          },
          description: `${planName} Plan Subscription`,
        },
      ],
      application_context: {
        brand_name: "Your App Name",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/paypal/success?order_id=${order.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
      },
    });

    const client = paypalClient();
    const response = await client.execute(request);

    console.log("PayPal order created:", response.result.id);

    // Update order with PayPal order ID
    await supabase
      .from("orders")
      .update({ paypal_order_id: response.result.id })
      .eq("id", order.id);

    // Find approval URL
    const approvalUrl = response.result.links.find(
      (link: any) => link.rel === "approve"
    )?.href;

    if (!approvalUrl) {
      throw new Error("No approval URL found in PayPal response");
    }

    return { url: approvalUrl };
  } catch (error) {
    console.error("Error creating PayPal order:", error);

    // Log the actual error for debugging
    if (error && typeof error === "object" && "message" in error) {
      console.error("Detailed error:", error);
    }

    throw error; // Don't mask the actual error
  }
}
