import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { PasswordProtectionUI } from "./PasswordProtectionUI";

export default async function PasswordProtection() {
  const supabase = await createClient();

  // --- Authentication ---
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login?message=Please log in to access this page.");
  }

  // --- Check if portfolio has password protection ---
  const { data: portfolioSettings, error } = await supabase
    .from("editor_profiles")
    .select("password_protected")
    .eq("user_id", user.id)
    .single();

  return (
    <div className=" min-h-screen ">
      <div className="p-6">
        <PasswordProtectionUI
          userId={user.id}
          hasPassword={portfolioSettings?.password_protected || false}
        />
      </div>
    </div>
  );
}
