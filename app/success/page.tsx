// app/success/page.tsx
import { createClient } from "@/utils/supabase/server";
import { polarClient } from "@/lib/polar";
import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{
    checkout_id?: string;
  }>;
}

export default async function SuccessPage({ searchParams }: Props) {
  const { checkout_id } = await searchParams;

  console.log("=== SUCCESS PAGE DEBUG ===");
  console.log("Checkout ID:", checkout_id);

  if (!checkout_id) {
    console.log("No checkout_id found, redirecting to pricing");
    redirect("/pricing");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("User:", user?.id);

  if (!user) {
    console.log("No user found, redirecting to login");
    redirect("/login");
  }

  try {
    // FIRST: Check if this checkout has already been processed
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("*")
      .eq("polar_checkout_id", checkout_id)
      .single();

    console.log("Existing order:", existingOrder);

    // If order exists and is completed, just show success without reprocessing
    if (existingOrder?.status === "completed") {
      console.log("Order already completed, showing success page");

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      return (
        <div className="container mx-auto p-6 text-center">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            🎉 Payment successful! Your subscription is active.
          </div>
          <h1 className="text-3xl font-bold mb-4">
            Welcome to {subscription?.plan_name || existingOrder.plan_name}!
          </h1>
          <p className="mb-4 text-sm text-gray-600">
            Order already processed - no duplicate charges
          </p>
          <a
            href="/dashboard"
            className="bg-[#0070F3] text-white px-6 py-3 rounded-lg inline-block"
          >
            Go to Dashboard
          </a>
        </div>
      );
    }

    // Check payment status from Polar only if not already processed
    console.log("Fetching checkout from Polar...");
    const checkout = await polarClient.checkouts.get({ id: checkout_id });

    console.log("Checkout status:", checkout.status);
    console.log("Checkout productId:", checkout.productId);
    console.log("Checkout customerId:", checkout.customerId);
    console.log("Checkout metadata:", checkout.metadata);

    if (checkout.status === "succeeded") {
      console.log("Payment succeeded! Processing for the first time...");

      // Check if this is an upgrade
      const isUpgrade = checkout.metadata?.isUpgrade === "true";
      const previousSubscriptionId = checkout.metadata?.previousSubscriptionId;

      // If this is an upgrade, handle the old subscription
      if (isUpgrade && previousSubscriptionId) {
        console.log("Processing upgrade - updating old subscription status");

        // Update the old subscription status to cancelled
        const { error: oldSubError } = await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("polar_subscription_id", previousSubscriptionId);

        if (oldSubError) {
          console.error("Error updating old subscription:", oldSubError);
        } else {
          console.log("Old subscription cancelled successfully");
        }
      }

      // Update order status
      if (existingOrder && existingOrder.status === "pending") {
        // Update existing pending order
        const { error: orderError } = await supabase
          .from("orders")
          .update({
            status: "completed",
            amount: checkout.amount! / 100, // Convert from cents
            completed_at: new Date().toISOString(),
          })
          .eq("polar_checkout_id", checkout_id);

        if (orderError) {
          console.error("Order update error:", orderError);
        } else {
          console.log("Order updated successfully");
        }
      } else if (!existingOrder) {
        // Create new order if it doesn't exist
        const { error: orderCreateError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            polar_checkout_id: checkout_id,
            product_id: checkout.productId!,
            plan_name: checkout.metadata?.planName || "Unknown",
            amount: checkout.amount! / 100,
            currency: checkout.currency!,
            status: "completed",
            completed_at: new Date().toISOString(),
          });

        if (orderCreateError) {
          console.error("Order creation error:", orderCreateError);
        } else {
          console.log("Order created successfully");
        }
      }

      // Handle subscription creation/update
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

      console.log("Creating/updating subscription...");

      // First, check if user has an existing subscription
      const { data: existingSubscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (existingSubscription) {
        // Update existing subscription
        const { error: subscriptionError, data: subscriptionData } =
          await supabase
            .from("subscriptions")
            .update({
              polar_subscription_id: checkout.id,
              polar_customer_id: checkout.customerId!,
              status: "active",
              product_id: checkout.productId!,
              plan_name: checkout.metadata?.planName || "Unknown",
              current_period_start: new Date().toISOString(),
              current_period_end: expiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)
            .select();

        if (subscriptionError) {
          console.error("Subscription update error:", subscriptionError);
        } else {
          console.log("Subscription updated:", subscriptionData);
        }
      } else {
        // Create new subscription
        const { error: subscriptionError, data: subscriptionData } =
          await supabase
            .from("subscriptions")
            .insert({
              user_id: user.id,
              polar_subscription_id: checkout.id,
              polar_customer_id: checkout.customerId!,
              status: "active",
              product_id: checkout.productId!,
              plan_name: checkout.metadata?.planName || "Unknown",
              current_period_start: new Date().toISOString(),
              current_period_end: expiresAt.toISOString(),
            })
            .select();

        if (subscriptionError) {
          console.error("Subscription creation error:", subscriptionError);
        } else {
          console.log("Subscription created:", subscriptionData);
        }
      }

      return (
        <div className="container mx-auto p-6 text-center">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            🎉 Payment successful! Your subscription is now active.
          </div>
          <h1 className="text-3xl font-bold mb-4">
            Welcome to {checkout.metadata?.planName || "your new plan"}!
          </h1>
          {isUpgrade && (
            <p className="mb-2 text-green-600 font-medium">
              ✨ Your plan has been upgraded successfully!
            </p>
          )}
          <p className="mb-4 text-sm text-gray-600">
            Checkout ID: {checkout_id}
          </p>
          <div className="space-y-2">
            <a
              href="/dashboard"
              className="bg-[#0070F3] text-white px-6 py-3 rounded-lg inline-block mr-4"
            >
              Go to Dashboard
            </a>
            <a
              href="/subscription"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg inline-block"
            >
              Manage Subscription
            </a>
          </div>
        </div>
      );
    }

    // Payment not succeeded yet
    console.log("Payment not succeeded, status:", checkout.status);
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          ⏳ Payment Status: {checkout.status}
        </div>
        <p className="mb-4">Checkout ID: {checkout_id}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#0070F3] text-white px-6 py-3 rounded-lg"
        >
          Refresh Status
        </button>
      </div>
    );
  } catch (error) {
    console.error("=== SUCCESS PAGE ERROR ===");
    console.error("Error details:", error);
    console.error("Error message:", (error as Error).message);
    console.error("Checkout ID:", checkout_id);

    return (
      <div className="container mx-auto p-6 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          ❌ Payment verification failed
        </div>
        <p className="mb-4">Error: {(error as Error).message}</p>
        <p className="mb-4 text-sm">Checkout ID: {checkout_id}</p>
        <a
          href="/pricing"
          className="bg-[#0070F3] text-white px-6 py-3 rounded-lg inline-block"
        >
          Back to Pricing
        </a>
      </div>
    );
  }
}
