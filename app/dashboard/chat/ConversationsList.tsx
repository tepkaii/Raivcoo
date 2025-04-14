// app/chat/ConversationsList.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import { Flag, AlertTriangle, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitReport } from "./chat";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  updated_at: string;
  otherUser: {
    id: string;
    display_name: string;
    full_name: string;
    avatar_url?: string;
  };
  lastMessage?: string;
  lastMessageDate?: string;
}

export default function ConversationsList({
  conversations: initialConversations,
}: {
  conversations: Conversation[];
}) {
  const router = useRouter();
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Report dialog state
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Set up real-time updates for conversations
  useEffect(() => {
    // Subscribe to changes in conversations
    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        () => {
          // When a conversation changes, refresh the page
          // A more sophisticated approach would fetch just the updated conversation
          router.refresh();
        }
      )
      .subscribe();

    // Also listen for new messages which might affect conversation list
    const messagesChannel = supabase
      .channel("new-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as {
            conversation_id: string;
            content: string;
            created_at: string;
          };

          // Update the conversation in our state with this new message
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === newMessage.conversation_id) {
                return {
                  ...conv,
                  lastMessage: newMessage.content,
                  lastMessageDate: newMessage.created_at,
                  updated_at: newMessage.created_at,
                };
              }
              return conv;
            })
          );

          // Show toast notification for new message
          const conversation = conversations.find(
            (c) => c.id === newMessage.conversation_id
          );
          if (conversation) {
            toast({
              title: `New message from ${conversation.otherUser.display_name}`,
              description:
                newMessage.content.length > 40
                  ? `${newMessage.content.substring(0, 40)}...`
                  : newMessage.content,
              duration: 3000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(messagesChannel);
    };
  }, [router, supabase, conversations]);

  const handleSelectConversation = (id: string) => {
    setIsLoading(true);
    router.push(`/dashboard/chat/${id}`);
  };

  const handleReportClick = (
    e: React.MouseEvent,
    conversation: Conversation
  ) => {
    e.stopPropagation(); // Prevent triggering the card click
    setSelectedConversation(conversation);
    setReportReason("");
    setReportDetails("");
    setFeedbackMessage("");
    setIsReportDialogOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!selectedConversation || !reportReason) {
      setFeedbackMessage("Please select a reason for reporting");
      return;
    }

    setIsSubmittingReport(true);
    setFeedbackMessage("");

    try {
      const formData = new FormData();
      formData.append("reportedItemId", selectedConversation.id);
      formData.append("itemType", "conversation");
      formData.append("reason", reportReason);
      formData.append("details", reportDetails);

      const result = await submitReport(formData);

      if (result.success) {
        toast({
          title: "Report Submitted",
          description: "Thank you for your report. We'll review it shortly.",
        });
        setIsReportDialogOpen(false);
        setReportReason("");
        setReportDetails("");
        setSelectedConversation(null);
      } else {
        throw new Error(result.message || "Failed to submit report");
      }
    } catch (error) {
      setFeedbackMessage(
        error instanceof Error ? error.message : "Failed to submit report"
      );
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Sort conversations by most recent first
  const sortedConversations = [...conversations].sort((a, b) => {
    const dateA = new Date(a.lastMessageDate || a.updated_at);
    const dateB = new Date(b.lastMessageDate || b.updated_at);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Information alert about administration visibility */}
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-700">
          All conversations are subject to review by administrators to ensure a
          safe platform for everyone.
        </AlertDescription>
      </Alert>

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Report Conversation</DialogTitle>
            <DialogDescription>
              {selectedConversation && (
                <>
                  You are reporting your conversation with{" "}
                  <strong>
                    {selectedConversation.otherUser.full_name ||
                      selectedConversation.otherUser.display_name}
                  </strong>
                  . Please provide details about why you're reporting this
                  conversation.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Reason for report <span className="text-red-500">*</span>
              </label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="harassment">
                    Harassment or Bullying
                  </SelectItem>
                  <SelectItem value="inappropriate">
                    Inappropriate Content
                  </SelectItem>
                  <SelectItem value="scam">Scam or Fraud</SelectItem>
                  <SelectItem value="impersonation">Impersonation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="details" className="text-sm font-medium">
                Additional Details
              </label>
              <Textarea
                id="details"
                placeholder="Please provide any additional details that may help us investigate"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={4}
              />
            </div>

            {feedbackMessage && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{feedbackMessage}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReportDialogOpen(false)}
              disabled={isSubmittingReport}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReport}
              disabled={isSubmittingReport || !reportReason}
            >
              {isSubmittingReport ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conversations List */}
      {sortedConversations.length > 0 ? (
        sortedConversations.map((conversation) => (
          <Card
            key={conversation.id}
            className="cursor-pointer hover:shadow-md transition-shadow group relative"
            onClick={() => handleSelectConversation(conversation.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 flex-shrink-0">
                  {isLoading ? (
                    <Skeleton className="h-12 w-12 rounded-full" />
                  ) : (
                    <Image
                      src={
                        conversation.otherUser.avatar_url ||
                        "/images/default-avatar.png"
                      }
                      alt={conversation.otherUser.display_name}
                      fill
                      className="rounded-full object-cover"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">
                      {conversation.otherUser.full_name ||
                        conversation.otherUser.display_name}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {conversation.lastMessageDate
                        ? formatDistanceToNow(
                            new Date(conversation.lastMessageDate),
                            { addSuffix: true }
                          )
                        : formatDistanceToNow(
                            new Date(conversation.updated_at),
                            {
                              addSuffix: true,
                            }
                          )}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground truncate">
                    {isLoading ? (
                      <Skeleton className="h-4 w-full" />
                    ) : (
                      conversation.lastMessage || "No messages yet"
                    )}
                  </p>
                </div>
              </div>

              {/* Report button - visible on hover */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleReportClick(e, conversation)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Report conversation"
              >
                <Flag className="h-4 w-4 text-muted-foreground hover:text-red-500 transition-colors" />
              </Button>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/10">
          <div className="mb-4">
            <Info className="h-12 w-12 mx-auto text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Start a conversation by visiting the editors page and messaging
            someone you'd like to work with.
          </p>
          <Button onClick={() => router.push("/editors")} variant="outline">
            Browse Editors
          </Button>
        </div>
      )}
    </div>
  );
}
