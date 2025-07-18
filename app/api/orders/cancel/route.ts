// app/api/orders/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update order status to cancelled
    const { data: order, error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        metadata: {
          ...{}, // preserve existing metadata
          cancellation_reason: "user_cancelled",
          cancelled_by: user.id,
        },
      })
      .eq("id", orderId)
      .eq("user_id", user.id) // Security: only user can cancel their own orders
      .eq("status", "pending") // Only cancel pending orders
      .select()
      .single();

    if (error) {
      console.error("Error cancelling order:", error);
      return NextResponse.json(
        { error: "Failed to cancel order" },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or already processed" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
      orderId: order.id,
    });
  } catch (error) {
    console.error("Error in cancel order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
