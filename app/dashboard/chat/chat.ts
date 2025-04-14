// app/actions/chat.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Get all conversations for current user
export async function getConversations() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { conversations: [], success: false };

  // Get conversations where current user is either sender or recipient
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error);
    return { conversations: [], success: false };
  }

  // Now fetch user details separately
  const conversations = [];

  for (const conv of data) {
    // Get the other user's ID (not the current user)
    const otherUserId =
      conv.user1_id === user.id ? conv.user2_id : conv.user1_id;

    // Fetch other user's profile
    const { data: profile } = await supabase
      .from("editor_profiles")
      .select("display_name, full_name, avatar_url")
      .eq("user_id", otherUserId)
      .single();

    // Get the last message if any
    const { data: lastMessages } = await supabase
      .from("messages")
      .select("content, created_at")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const lastMessage =
      lastMessages && lastMessages.length > 0 ? lastMessages[0] : null;

    conversations.push({
      ...conv,
      otherUser: {
        id: otherUserId,
        display_name: profile?.display_name || "Unknown",
        full_name: profile?.full_name || "Unknown",
        avatar_url: profile?.avatar_url,
      },
      lastMessage: lastMessage?.content,
      lastMessageDate: lastMessage?.created_at,
    });
  }

  return { conversations, success: true };
}

// Get messages for a conversation
export async function getMessages(conversationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { messages: [], success: false };

  // Check user belongs to conversation
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("*")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq("id", conversationId)
    .single();

  if (convError || !conversation) {
    return { messages: [], success: false };
  }

  // Get messages
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return { messages: [], success: false };
  }

  return { messages: data, success: true };
}

// Send a message
export async function sendMessage(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const conversationId = formData.get("conversationId") as string;
  const content = formData.get("content") as string;

  if (!conversationId || !content?.trim()) {
    return { success: false, message: "Missing required fields" };
  }

  // Insert message
  const { error: msgError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content,
  });

  if (msgError) {
    return { success: false, message: "Failed to send message" };
  }

  // Update conversation timestamp
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  revalidatePath(`/chat/${conversationId}`);
  return { success: true };
}

// Start a new conversation with someone
export async function startConversation(recipientId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated" };

  if (user.id === recipientId) {
    return {
      success: false,
      message: "Cannot start conversation with yourself",
    };
  }

  // Check if conversation already exists
  const { data: existingConv, error: checkError } = await supabase
    .from("conversations")
    .select("id")
    .or(
      `and(user1_id.eq.${user.id},user2_id.eq.${recipientId}),and(user1_id.eq.${recipientId},user2_id.eq.${user.id})`
    )
    .maybeSingle();

  if (checkError) {
    console.error("Error checking conversations:", checkError);
    return { success: false, message: "Error checking existing conversations" };
  }

  // If conversation exists, return it
  if (existingConv) {
    return { success: true, conversationId: existingConv.id };
  }

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from("conversations")
    .insert({
      user1_id: user.id,
      user2_id: recipientId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    return { success: false, message: "Failed to create conversation" };
  }

  revalidatePath("/chat");
  return { success: true, conversationId: newConv.id };
}

// Report a conversation, user, or other item
export async function submitReport(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const reportedItemId = formData.get("reportedItemId") as string;
  const itemType = formData.get("itemType") as string;
  const reason = formData.get("reason") as string;
  const details = formData.get("details") as string;

  if (!reportedItemId || !itemType || !reason) {
    return { success: false, message: "Missing required fields" };
  }

  // Insert report
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_item_id: reportedItemId,
    item_type: itemType,
    reason,
    details,
  });

  if (error) {
    console.error("Error submitting report:", error);
    return { success: false, message: "Failed to submit report" };
  }

  return { success: true, message: "Report submitted successfully" };
}
