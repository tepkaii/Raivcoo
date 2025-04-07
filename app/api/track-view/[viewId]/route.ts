// api/track-view/[viewId]/route.ts


import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ viewId: string }> }
) {
  const params = await props.params;
  try {
    const { viewId } = params;
    const { duration } = await req.json();

    const supabase = createClient();

    // Update the duration for the existing view record
    const { error } = await (
      await supabase
    )
      .from("profile_views")
      .update({
        duration: Math.floor(duration / 1000), // Convert milliseconds to seconds
        updated_at: new Date().toISOString(), // Update the timestamp
      })
      .eq("id", viewId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update duration" },
      { status: 500 }
    );
  }
}
