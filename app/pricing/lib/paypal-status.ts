"use server";

import { createClient } from "@/utils/supabase/server";

const PAYPAL_API_BASE =
  process.env.PAYPAL_ENVIRONMENT === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

export async function checkPaymentStatus(orderId: string) {
  const supabase = await createClient();

  try {
    // Get order from database
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return { success: false, error: "Order not found" };
    }

    if (order.status === "completed") {
      return { success: true, status: "completed", order };
    }

    if (!order.paypal_order_id) {
      return { success: false, error: "PayPal order ID not found" };
    }

    // Check status with PayPal API
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${order.paypal_order_id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return { success: false, error: "Failed to check PayPal status" };
    }

    const paypalOrder = await response.json();

    return {
      success: true,
      status: paypalOrder.status.toLowerCase(),
      paypalOrder,
      order,
    };
  } catch (error) {
    console.error("Status check error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
