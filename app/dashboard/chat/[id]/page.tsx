// app/chat/[id]/page.tsx
import { getMessages } from "../chat";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ChatUI from "./ChatUI";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default async function ChatPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const supabase = createClient();

  // Verify user is logged in
  const {
    data: { user },
  } = await (await supabase).auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Get conversation details
  const { data: conversation, error } = await (await supabase)
    .from("conversations")
    .select("*")
    .eq("id", params.id)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single();

  if (error || !conversation) {
    redirect("/chat");
  }

  // Get the other user's ID
  const otherUserId =
    conversation.user1_id === user.id
      ? conversation.user2_id
      : conversation.user1_id;

  // Get other user profile
  const { data: otherUser } = await (await supabase)
    .from("editor_profiles")
    .select("display_name, full_name, avatar_url")
    .eq("user_id", otherUserId)
    .single();

  if (!otherUser) {
    redirect("/chat");
  }

  // Get messages
  const { messages, success } = await getMessages(params.id);

  return (
    <div className="flex flex-col p-4 h-[calc(100vh-4rem)]">
      {/* Warning message moved to the top of the page */}

      <div className="mb-4 border-b pb-4 flex items-center gap-4">
        <a href="/chat" className="text-sm text-primary hover:underline">
          &larr; Back to conversations
        </a>
        <h1 className="text-xl font-semibold text-foreground">
          Chat with {otherUser.full_name || otherUser.display_name}
        </h1>
      </div>
      <Alert className="mb-4 bg-muted border-accent">
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        <AlertDescription className="text-foreground text-sm">
          For your safety, administrators may review conversations. Please
          report any suspicious behavior.
        </AlertDescription>
      </Alert>
      <div className="flex-1 overflow-hidden border rounded-lg shadow-sm">
        <ChatUI
          conversationId={params.id}
          otherUser={{
            id: otherUserId,
            display_name: otherUser.display_name,
            full_name: otherUser.full_name,
            avatar_url: otherUser.avatar_url,
          }}
          currentUserId={user.id}
          initialMessages={success ? messages : []}
        />
      </div>
    </div>
  );
}
