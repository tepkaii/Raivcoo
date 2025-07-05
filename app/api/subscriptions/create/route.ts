import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { order, planId, planName, amount } = await request.json();

    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, create the order record
    const { data: orderRecord, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        paypal_order_id: order.id,
        paypal_payment_id:
          order.purchase_units?.[0]?.payments?.captures?.[0]?.id || null,
        plan_id: planId,
        plan_name: planName,
        amount: parseFloat(amount),
        currency: "USD",
        status: "completed",
        payment_method: "paypal",
        transaction_id:
          order.purchase_units?.[0]?.payments?.captures?.[0]?.id || null,
        completed_at: new Date().toISOString(),
        metadata: {
          paypal_order: order,
        },
      })
      .select()
      .single();

    if (orderError || !orderRecord) {
      console.error("Error creating order:", orderError);
      return NextResponse.json(
        { error: "Failed to create order record" },
        { status: 500 }
      );
    }

    // Calculate subscription period (30 days from now)
    const now = new Date();
    const periodStart = now;
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Check if user already has a subscription
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          order_id: orderRecord.id,
          plan_id: planId,
          plan_name: planName,
          status: "active",
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating subscription:", updateError);
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 }
        );
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          order_id: orderRecord.id,
          plan_id: planId,
          plan_name: planName,
          status: "active",
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
        });

      if (insertError) {
        console.error("Error creating subscription:", insertError);
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
    });
  } catch (error) {
    console.error("Error processing subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
