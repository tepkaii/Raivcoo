import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId, newStorageGb } = await request.json();

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For downgrades, we'll schedule the change for the next billing cycle
    // You could also implement immediate downgrades with prorated refunds

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        // Store the pending downgrade in metadata to process at next billing
        metadata: {
          pending_downgrade: {
            storage_gb: newStorageGb,
            scheduled_for: new Date().toISOString(),
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error scheduling downgrade:", updateError);
      return NextResponse.json(
        { error: "Failed to schedule downgrade" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Downgrade scheduled for next billing cycle",
    });
  } catch (error) {
    console.error("Error scheduling downgrade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
