// app/api/payments/process/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { order_id, payment_method, card_details } = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Simulate payment processing (replace with real payment processor like Stripe)
    const paymentSuccessful = await simulatePayment(card_details);

    if (paymentSuccessful) {
      // Update order status
      await supabase
        .from("orders")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          payment_method,
          transaction_id: `txn_${Date.now()}`, // Generate real transaction ID
        })
        .eq("id", order_id);

      // Create/update subscription
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await supabase.from("subscriptions").upsert(
        {
          user_id: user.id,
          plan_id: order.plan_id,
          status: "active",
          expires_at: expiresAt.toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

      return NextResponse.json({ success: true });
    } else {
      // Update order status to failed
      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("id", order_id);

      return NextResponse.json({
        success: false,
        error: "Payment failed. Please check your card details.",
      });
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Simulate payment processing (replace with real payment processor)
async function simulatePayment(cardDetails: any): Promise<boolean> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simulate payment validation
  if (!cardDetails.number || !cardDetails.cvv || !cardDetails.expiry) {
    return false;
  }

  // Simulate 95% success rate
  return Math.random() > 0.05;
}
