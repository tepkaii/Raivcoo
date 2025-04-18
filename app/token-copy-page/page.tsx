// app/token-copy-page/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import TokenCopyClient from "./TokenCopyClient";

export default async function TokenCopyPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const token = session.access_token;

  return (
    <div className="min-h-screen flex items-center justify-center p-10">
      <TokenCopyClient token={token} />
    </div>
  );
}
