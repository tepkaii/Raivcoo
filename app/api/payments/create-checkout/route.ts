// app/api/payments/create-checkout/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const PLAN_PRICES = {
  basic: 3.99,
  pro: 5.99,
  premium: 9.99,
};

export async function POST(request: NextRequest) {
  try {
    const { productId, planId } = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create order first
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        plan_id: planId,
        amount: PLAN_PRICES[planId as keyof typeof PLAN_PRICES],
        currency: "USD",
        status: "pending",
      })
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    // Create Polar checkout
    const polarResponse = await fetch("https://api.polar.sh/v1/checkouts/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true&order_id=${order.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
        customer_email: user.email,
        metadata: {
          user_id: user.id,
          order_id: order.id,
          plan_id: planId,
        },
      }),
    });

    if (!polarResponse.ok) {
      return NextResponse.json(
        { error: "Failed to create checkout" },
        { status: 500 }
      );
    }

    const checkoutData = await polarResponse.json();

    // Update order with polar checkout ID
    await supabase
      .from("orders")
      .update({ polar_checkout_id: checkoutData.id })
      .eq("id", order.id);

    return NextResponse.json({ checkoutUrl: checkoutData.url });
  } catch (error) {
    console.error("Checkout creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
