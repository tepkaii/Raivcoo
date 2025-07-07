import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const {
      planId,
      planName,
      amount,
      storageGb,
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

    // Create pending order
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        plan_id: planId,
        plan_name: planName,
        amount: parseFloat(amount),
        currency: "USD",
        status: "pending",
        payment_method: "paypal",
        metadata: {
          storage_gb: storageGb,
          action: action,
          current_subscription_id: currentSubId,
          billing_period: billingPeriod,
        },
      })
      .select()
      .single();

    if (error || !order) {
      console.error("Error creating order:", error);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}