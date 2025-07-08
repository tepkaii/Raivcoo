// app/api/subscriptions/complete-upgrade/route.ts
// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { order, subscriptionId, pendingOrderId } = await request.json();

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
          ...orderRecord?.metadata,
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

    // Update the subscription with new storage and reset billing period
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        storage_gb: orderRecord.metadata.storage_gb,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", subscriptionId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      return NextResponse.json(
        { error: "Failed to update subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order_id: orderRecord.id,
      subscription_status: "upgraded",
    });
  } catch (error) {
    console.error("Error processing upgrade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
