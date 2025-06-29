// lib/polar-actions.ts
// @ts-nocheck
"use server";

import { createClient } from "@/utils/supabase/server";
import { polarClient } from "./polar";

interface CreateCheckoutSessionParams {
  productId: string;
  planName: string;
  isUpgrade?: boolean;
  currentSubscriptionId?: string;
}

export async function createCheckoutSession({
  productId,
  planName,
  isUpgrade = false,
  currentSubscriptionId,
}: CreateCheckoutSessionParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  try {
    console.log("Creating checkout session for:", {
      productId,
      planName,
      isUpgrade,
      currentSubscriptionId,
      userEmail: user.email,
    });

    // If this is an upgrade, we need to handle the existing subscription
    if (isUpgrade && currentSubscriptionId) {
      console.log(
        "Processing upgrade for subscription:",
        currentSubscriptionId
      );
      // Note: Polar will handle the subscription change through their system
      // The old subscription will be cancelled and a new one created
    }

    // Create checkout session with Polar - USE PRODUCTS ARRAY
    const checkout = await polarClient.checkouts.create({
      products: [productId], // ← FIX: Use products array instead of productId
      customerEmail: user.email!,
      successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/success?checkout_id={CHECKOUT_ID}`,
      metadata: {
        userId: user.id,
        planName: planName,
        isUpgrade: isUpgrade.toString(),
        previousSubscriptionId: currentSubscriptionId || "",
      },
    });

    console.log("Checkout created:", checkout.id);

    // Save pending order
    const { error: orderError } = await supabase.from("orders").insert({
      user_id: user.id,
      polar_checkout_id: checkout.id,
      product_id: productId,
      plan_name: planName,
      amount: checkout.amount ? checkout.amount / 100 : 0, // Convert from cents, handle null
      currency: checkout.currency || "USD",
      status: "pending",
    });

    if (orderError) {
      console.error("Error creating order record:", orderError);
      // Don't throw error as checkout is already created
    }

    return {
      url: checkout.url,
      checkoutId: checkout.id,
    };
  } catch (error) {
    console.error("Polar checkout error:", error);
    throw new Error("Failed to create checkout session");
  }
}

export async function getUserSubscription() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  return subscription;
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    // For now, redirect to Polar's customer portal
    // When Polar releases their cancel API, we can use it directly
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get customer ID from subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("polar_customer_id")
      .eq("polar_subscription_id", subscriptionId)
      .single();

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Create customer portal session for cancellation
    const customerSession = await polarClient.customerSessions.create({
      customerId: subscription.polar_customer_id,
    });

    return {
      portalUrl: customerSession.customerPortalUrl,
    };
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    throw new Error("Failed to cancel subscription");
  }
}

export async function createCustomerPortalSession(customerId: string) {
  try {
    const customerSession = await polarClient.customerSessions.create({
      customerId: customerId,
    });

    return {
      portalUrl: customerSession.customerPortalUrl,
    };
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    throw new Error("Failed to create customer portal session");
  }
}

export async function getCustomerSubscriptions(customerId: string) {
  try {
    // Get all subscriptions for a customer from Polar
    const subscriptions = await polarClient.subscriptions.list({
      customerId: customerId,
    });

    return subscriptions;
  } catch (error) {
    console.error("Error fetching customer subscriptions:", error);
    throw new Error("Failed to fetch subscriptions");
  }
}

export async function updateSubscription(
  subscriptionId: string,
  productId: string
) {
  try {
    // Update subscription to new product (upgrade/downgrade)
    const updatedSubscription = await polarClient.subscriptions.update(
      subscriptionId,
      {
        productId: productId,
      }
    );

    return updatedSubscription;
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw new Error("Failed to update subscription");
  }
}

export async function getUserSubscriptionDetails(userId: string) {
  const supabase = await createClient();

  try {
    // Get subscription from our database
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select(
        `
        *,
        orders:orders(*)
      `
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!subscription) {
      return { hasSubscription: false, subscription: null };
    }

    // Check if subscription is still valid
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
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    throw new Error("Failed to fetch subscription details");
  }
}

export async function syncSubscriptionFromPolar(polarSubscriptionId: string) {
  try {
    const supabase = await createClient();

    // Get subscription details from Polar
    const polarSubscription = await polarClient.subscriptions.get({
      id: polarSubscriptionId,
    });

    // Update our database with latest info from Polar
    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: polarSubscription.status,
        current_period_start: polarSubscription.currentPeriodStart,
        current_period_end: polarSubscription.currentPeriodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("polar_subscription_id", polarSubscriptionId);

    if (error) {
      console.error("Error syncing subscription:", error);
      throw error;
    }

    return polarSubscription;
  } catch (error) {
    console.error("Error syncing subscription from Polar:", error);
    throw new Error("Failed to sync subscription");
  }
}

export async function handleWebhookSubscriptionUpdate(webhookData: any) {
  try {
    const supabase = await createClient();

    const subscriptionData = webhookData.data;

    // Update subscription in our database
    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: subscriptionData.status,
        current_period_start: subscriptionData.current_period_start,
        current_period_end: subscriptionData.current_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq("polar_subscription_id", subscriptionData.id);

    if (error) {
      console.error("Error updating subscription from webhook:", error);
      throw error;
    }

    // Handle specific subscription events
    if (subscriptionData.status === "canceled") {
      console.log("Subscription cancelled:", subscriptionData.id);
      // You can add additional logic here for cancellation handling
    }

    if (subscriptionData.status === "active") {
      console.log("Subscription activated:", subscriptionData.id);
      // You can add additional logic here for activation handling
    }

    return { success: true };
  } catch (error) {
    console.error("Error handling subscription webhook:", error);
    throw new Error("Failed to handle subscription update");
  }
}

export async function validateUserAccess(
  userId: string,
  requiredPlan?: string
) {
  try {
    const { hasSubscription, subscription } =
      await getUserSubscriptionDetails(userId);

    if (!hasSubscription) {
      return { hasAccess: false, reason: "No active subscription" };
    }

    if (requiredPlan && subscription?.plan_name !== requiredPlan) {
      return {
        hasAccess: false,
        reason: `Plan ${requiredPlan} required, but user has ${subscription?.plan_name}`,
      };
    }

    return { hasAccess: true, subscription };
  } catch (error) {
    console.error("Error validating user access:", error);
    return { hasAccess: false, reason: "Error validating access" };
  }
}
