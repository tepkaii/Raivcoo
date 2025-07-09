// app/api/subscriptions/create/route.ts (updated for session-based approach)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { OrderConfirmationEmail } from "../../../components/emails/Payment/OrderConfirmationEmail";
import { SubscriptionWelcomeEmail } from "../../../components/emails/Payment/SubscriptionWelcomeEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const {
      order,
      pendingOrderId,
      sessionId,
      paypalOrderId, // Fallback if order is null
    } = await request.json();

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the checkout session to get all the order details
    const { data: session, error: sessionError } = await supabase
      .from("checkout_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    // Extract values from session (these are secure and can't be manipulated)
    const planId = session.plan_id;
    const planName = session.plan_name;
    const amount = session.amount;
    const storageGb = session.storage_gb;
    const action = session.action;
    const currentSubId = session.current_subscription_id;
    const billingPeriod = session.billing_period;

    // Get user profile for email
    const { data: profile } = await supabase
      .from("editor_profiles")
      .select("full_name, display_name")
      .eq("user_id", user.id)
      .single();

    const customerName =
      profile?.display_name ||
      profile?.full_name ||
      user.email?.split("@")[0] ||
      "Customer";

    // ✅ SAFE ORDER UPDATE with null checks
    const { data: orderRecord, error: orderError } = await supabase
      .from("orders")
      .update({
        paypal_order_id: order?.id || paypalOrderId || null,
        paypal_payment_id:
          order?.purchase_units?.[0]?.payments?.captures?.[0]?.id || null,
        status: "completed",
        transaction_id:
          order?.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
          paypalOrderId ||
          `manual-${Date.now()}`,
        completed_at: new Date().toISOString(),
        metadata: {
          storage_gb: storageGb,
          action: action,
          current_subscription_id: currentSubId,
          billing_period: billingPeriod,
          paypal_order: order || { fallback_order_id: paypalOrderId },
        },
      })
      .eq("id", pendingOrderId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (orderError || !orderRecord) {
      console.error("❌ Error updating order:", orderError);
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

    let subscriptionCreated = false;
    let isUpgrade = false;

    // Handle different action types
    if (action === "upgrade" || action === "downgrade" || action === "renew") {
      isUpgrade = action === "upgrade";

      if (!currentSubId && action !== "renew") {
        return NextResponse.json(
          { error: "Current subscription ID required for upgrade/downgrade" },
          { status: 400 }
        );
      }

      if (action === "renew") {
        // For renewals, we might not have currentSubId if subscription was expired
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
          subscriptionCreated = true;
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
          subscriptionCreated = true;
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
        subscriptionCreated = true;
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
      subscriptionCreated = true;
    }

    // 🔥 SEND EMAILS ONLY IF SUBSCRIPTION WAS SUCCESSFULLY CREATED
    if (subscriptionCreated && user.email) {
      try {
        // Send Order Confirmation Email
        const confirmationResult = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: [user.email],
          subject: `Order Confirmation - ${planName} Plan`,
          react: OrderConfirmationEmail({
            customerName,
            customerEmail: user.email,
            orderNumber: orderRecord.id.slice(-8).toUpperCase(),
            planName,
            planId,
            amount,
            storageGb,
            billingPeriod,
            paymentMethod: "PayPal",
            transactionId: orderRecord.transaction_id || "N/A",
            orderDate: new Date(orderRecord.completed_at!).toLocaleDateString(),
            action,
          }),
        });

        // Send Subscription Welcome Email (delay by 2 seconds)
        setTimeout(async () => {
          try {
            const welcomeResult = await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL!,
              to: [user.email!],
              subject: isUpgrade
                ? `${planName} Plan Upgrade Confirmed!`
                : `Welcome to ${planName} Plan!`,
              react: SubscriptionWelcomeEmail({
                customerName,
                customerEmail: user.email!,
                planName,
                planId,
                storageGb,
                billingPeriod,
                periodEnd: periodEnd.toISOString(),
                isUpgrade,
              }),
            });
          } catch (emailError) {
            console.error("❌ Error sending welcome email:", emailError);
          }
        }, 2000);
      } catch (emailError) {
        console.error("❌ Error sending confirmation email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      order_id: orderRecord.id,
      subscription_status: "active",
      action: action || "created",
      emails_sent: subscriptionCreated && !!user.email,
    });
  } catch (error) {
    console.error("❌ Error processing subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
