import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const {
      order,
      planId,
      planName,
      amount,
      storageGb,
      pendingOrderId,
      action,
      currentSubId,
    } = await request.json();

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the pending order
    const { data: orderRecord, error: orderError } = await supabase
      .from("orders")
      .update({
        paypal_order_id: order.id,
        paypal_payment_id:
          order.purchase_units?.[0]?.payments?.captures?.[0]?.id || null,
        status: "completed",
        transaction_id:
          order.purchase_units?.[0]?.payments?.captures?.[0]?.id || null,
        completed_at: new Date().toISOString(),
        metadata: {
          storage_gb: storageGb,
          action: action,
          current_subscription_id: currentSubId,
          paypal_order: order,
        },
      })
      .eq("id", pendingOrderId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (orderError || !orderRecord) {
      console.error("Error updating order:", orderError);
      return NextResponse.json(
        { error: "Failed to update order record" },
        { status: 500 }
      );
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Handle different action types
    if (action === "upgrade" || action === "downgrade") {
      // Update existing subscription
      if (!currentSubId) {
        return NextResponse.json(
          { error: "Current subscription ID required for upgrade/downgrade" },
          { status: 400 }
        );
      }
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          plan_id: planId,
          plan_name: planName,
          storage_gb: storageGb || (planId === "pro" ? 250 : 0.5),
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          status: "active",
          order_id: orderRecord.id,
          updated_at: now.toISOString(),
          last_action: action || "new", // Track the action
        })
        .eq("id", currentSubId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating subscription:", updateError);
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 }
        );
      }
    } else {
      // New subscription or replacing existing one

      // First, cancel any existing active subscriptions
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: now.toISOString() })
        .eq("user_id", user.id)
        .eq("status", "active");

      // Create new subscription
      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          plan_name: planName,
          status: "active",
          storage_gb: storageGb || (planId === "pro" ? 250 : 0.5),
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          order_id: orderRecord.id,
        });

      if (subscriptionError) {
        console.error("Error creating subscription:", subscriptionError);
        return NextResponse.json(
          { error: "Failed to create subscription" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      order_id: orderRecord.id,
      subscription_status: "active",
      action: action || "created",
    });
  } catch (error) {
    console.error("Error processing subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}