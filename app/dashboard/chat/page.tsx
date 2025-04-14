// app/chat/page.tsx
import { getConversations } from "./chat";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ConversationsList from "./ConversationsList";

export default async function ChatPage() {
  const supabase = createClient();

  // Verify user is logged in
  const {
    data: { user },
  } = await (await supabase).auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { conversations, success } = await getConversations();

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      {success ? (
        conversations.length > 0 ? (
          <ConversationsList conversations={conversations} />
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground mb-4">
              You don't have any conversations yet.
            </p>
            <p className="text-sm">
              Start by visiting the{" "}
              <a href="/editors" className="text-blue-500 hover:underline">
                editors page
              </a>{" "}
              and messaging someone you'd like to work with.
            </p>
          </div>
        )
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">
            Failed to load conversations. Please try again.
          </p>
        </div>
      )}
    </div>
  );
}
