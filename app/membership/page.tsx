// app/membership/page.tsx
// @ts-nocheck
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import MembershipClient from "./membership-client";

export const metadata: Metadata = {
  title: "Pro Membership – Raivcoo",
  description:
    "Choose a plan and upgrade to Pro on Raivcoo to boost your visibility and access exclusive features.",
};

export default async function MembershipPage() {
  // Create supabase client and check authentication
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if user is not authenticated
  if (!user) {
    redirect("/login");
  }

  // Fetch user profile to pass to client component if needed
  const { data: profile } = await supabase
    .from("editor_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 mt-24 sm:px-6">
      <MembershipClient profile={profile} />

      <div className="mt-16 bg-muted/30 rounded-xl p-8">
        <h2 className="text-2xl font-semibold mb-4">
          Frequently Asked Questions
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-medium mb-2">Can I switch plans later?</h3>
            <p className="text-sm text-muted-foreground">
              Yes, you can upgrade or downgrade your plan at any time from your
              account settings.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Is there a free trial?</h3>
            <p className="text-sm text-muted-foreground">
              We don't offer free trials, but we do have a 14-day money-back
              guarantee if you're not satisfied.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">How do I cancel?</h3>
            <p className="text-sm text-muted-foreground">
              You can cancel your subscription anytime from your account
              settings with no cancellation fees.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Do you offer refunds?</h3>
            <p className="text-sm text-muted-foreground">
              We offer refunds within 14 days of purchase if you're not
              satisfied with our services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
