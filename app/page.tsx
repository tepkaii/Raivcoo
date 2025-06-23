import React from "react";
import HomePage from "./components/Home/HomePage";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ToolsPage from "./tools/ToolsPage";
import HomePage2 from "./components/Home/HomePage2";

export default async function Page() {
  // const supabase = await createClient();

  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();

  // if (user) {
  //   const { data: profile } = await supabase
  //     .from("editor_profiles")
  //     .select("display_name") // Add any other fields you want
  //     .eq("user_id", user.id)
  //     .single();

  //   if (!profile?.display_name?.trim()) {
  //     redirect("/complete-profile");
  //   }
  // }
  return (
    <div>
      <HomePage2 />;
    </div>
  );
}
