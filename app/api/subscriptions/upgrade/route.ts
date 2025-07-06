import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId, newStorageGb, newAmount } = await request.json();

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create pending upgrade order
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        plan_id: "pro",
        plan_name: "Pro",
        amount: parseFloat(newAmount),
        currency: "USD",
        status: "pending",
        payment_method: "paypal",
        metadata: {
          storage_gb: newStorageGb,
          is_upgrade: true,
          subscription_id: subscriptionId,
        },
      })
      .select()
      .single();

    if (error || !order) {
      console.error("Error creating upgrade order:", error);
      return NextResponse.json(
        { error: "Failed to create upgrade order" },
        { status: 500 }
      );
    }

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("Error creating upgrade order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
