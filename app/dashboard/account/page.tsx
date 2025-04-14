// app/profile/page.tsx

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AccountForm from "./AccountForm";
import { updateAccount } from "./actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account - Raivcoo",
  description: "Manage your Raivcoo Account, update personal information.",
};

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: Account } = await supabase
    .from("editor_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="p-3">
      <AccountForm Account={Account} updateAccount={updateAccount} />;
    </div>
  );
}
