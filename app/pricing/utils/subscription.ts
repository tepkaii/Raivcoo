import { createClient } from "@/utils/supabase/server";

export async function getUserSubscription(userId: string) {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(
      `
      *,
      orders (
        id,
        amount,
        currency,
        completed_at,
        transaction_id
      )
    `
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!subscription) {
    return { hasSubscription: false, subscription: null };
  }

  const now = new Date();
  const expiryDate = new Date(subscription.current_period_end);

  if (expiryDate <= now) {
    // Subscription expired, update status
    await supabase
      .from("subscriptions")
      .update({
        status: "expired",
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    return { hasSubscription: false, subscription: null };
  }

  return { hasSubscription: true, subscription };
}

export async function checkSubscriptionStatus(userId: string) {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(
      `
      *,
      orders (
        id,
        amount,
        currency,
        completed_at,
        transaction_id,
        paypal_order_id
      )
    `
    )
    .eq("user_id", userId)
    .single();

  return subscription;
}

export async function createPendingOrder(
  userId: string,
  planId: string,
  planName: string,
  amount: number
) {
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      plan_id: planId,
      plan_name: planName,
      amount: amount,
      currency: "USD",
      status: "pending",
      payment_method: "paypal",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating pending order:", error);
    throw new Error("Failed to create order");
  }

  return order;
}

export async function completeOrder(
  orderId: string,
  paypalOrderId: string,
  paypalPaymentId: string
) {
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .update({
      paypal_order_id: paypalOrderId,
      paypal_payment_id: paypalPaymentId,
      status: "completed",
      completed_at: new Date().toISOString(),
      transaction_id: paypalPaymentId,
    })
    .eq("id", orderId)
    .select()
    .single();

  if (error) {
    console.error("Error completing order:", error);
    throw new Error("Failed to complete order");
  }

  return order;
}
