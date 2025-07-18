// app/api/orders/create/route.ts (complete rewrite)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    // Get checkout session
    const { data: session, error: sessionError } = await supabase
      .from("checkout_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 400 }
      );
    }

    // Check if session is expired
    if (new Date() > new Date(session.expires_at)) {
      return NextResponse.json({ error: "Session expired" }, { status: 400 });
    }

    // Check if session is already used
    if (session.status !== "pending") {
      return NextResponse.json(
        { error: "Session already used" },
        { status: 400 }
      );
    }

    // Create order using session data (user can't manipulate these values)
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        plan_id: session.plan_id,
        plan_name: session.plan_name,
        amount: parseFloat(session.amount),
        currency: "USD",
        status: "pending",
        payment_method: "paypal",

        metadata: {
          storage_gb: session.storage_gb,
          action: session.action,

          billing_period: session.billing_period,
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

    // Update session status to used
    await supabase
      .from("checkout_sessions")
      .update({ status: "used" })
      .eq("id", sessionId);

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
