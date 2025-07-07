// app/api/subscriptions/create/route.ts
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
      billingPeriod = "monthly",
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
          billing_period: billingPeriod,
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
    const periodMultiplier = billingPeriod === "yearly" ? 365 : 30;
    const periodEnd = new Date(
      now.getTime() + periodMultiplier * 24 * 60 * 60 * 1000
    );

    // Get max upload size based on plan
    const maxUploadSizes = {
      free: 200,
      lite: 2048,
      pro: 5120,
    };

    const maxUploadSize =
      maxUploadSizes[planId as keyof typeof maxUploadSizes] || 200;

    // Handle different action types
    if (action === "upgrade" || action === "downgrade" || action === "renew") {
      // Update existing subscription
      if (!currentSubId && action !== "renew") {
        return NextResponse.json(
          { error: "Current subscription ID required for upgrade/downgrade" },
          { status: 400 }
        );
      }

      if (action === "renew") {
        // For renewals, we might not have currentSubId if subscription was expired
        // Create new subscription or reactivate existing one
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("plan_id", planId)
          .single();

        if (existingSub) {
          // Reactivate existing subscription
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              status: "active",
              storage_gb:
                storageGb ||
                (planId === "pro" ? 250 : planId === "lite" ? 50 : 0.5),
              billing_period: billingPeriod,
              max_upload_size_mb: maxUploadSize,
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
              order_id: orderRecord.id,
              updated_at: now.toISOString(),
              last_action: action,
            })
            .eq("id", existingSub.id);

          if (updateError) {
            console.error("Error reactivating subscription:", updateError);
            return NextResponse.json(
              { error: "Failed to reactivate subscription" },
              { status: 500 }
            );
          }
        } else {
          // Create new subscription for renewal
          await supabase
            .from("subscriptions")
            .update({ status: "cancelled", updated_at: now.toISOString() })
            .eq("user_id", user.id)
            .eq("status", "active");

          const { error: subscriptionError } = await supabase
            .from("subscriptions")
            .insert({
              user_id: user.id,
              plan_id: planId,
              plan_name: planName,
              status: "active",
              storage_gb:
                storageGb ||
                (planId === "pro" ? 250 : planId === "lite" ? 50 : 0.5),
              billing_period: billingPeriod,
              max_upload_size_mb: maxUploadSize,
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
              order_id: orderRecord.id,
              last_action: action,
            });

          if (subscriptionError) {
            console.error(
              "Error creating renewal subscription:",
              subscriptionError
            );
            return NextResponse.json(
              { error: "Failed to create renewal subscription" },
              { status: 500 }
            );
          }
        }
      } else {
        // Regular upgrade/downgrade
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            plan_id: planId,
            plan_name: planName,
            storage_gb:
              storageGb ||
              (planId === "pro" ? 250 : planId === "lite" ? 50 : 0.5),
            billing_period: billingPeriod,
            max_upload_size_mb: maxUploadSize,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            status: "active",
            order_id: orderRecord.id,
            updated_at: now.toISOString(),
            last_action: action,
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
      }
    } else {
      // New subscription

      // Cancel any existing active subscriptions
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
          storage_gb:
            storageGb ||
            (planId === "pro" ? 250 : planId === "lite" ? 50 : 0.5),
          billing_period: billingPeriod,
          max_upload_size_mb: maxUploadSize,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          order_id: orderRecord.id,
          last_action: "new",
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
