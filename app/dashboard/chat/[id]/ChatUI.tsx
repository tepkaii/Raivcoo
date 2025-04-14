// app/chat/[id]/ChatUI.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { RevButtons } from "@/components/ui/RevButtons";
import { Input } from "@/components/ui/input";
import { Send, Flag, Shield, AlertTriangle, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { sendMessage, submitReport } from "../chat";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/utils/supabase/client";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface User {
  id: string;
  display_name: string;
  full_name?: string;
  avatar_url?: string;
}

export default function ChatUI({
  conversationId,
  otherUser,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  otherUser: User;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    messageInputRef.current?.focus();
  }, []);

  // Set up real-time subscription for new messages
  useEffect(() => {
    // Create and subscribe to the channel
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Add the new message to state
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    // Cleanup subscription when component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setIsSending(true);

    try {
      // Optimistically add message to UI
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: newMessage,
        created_at: new Date().toISOString(),
      };

      const messageToSend = newMessage;

      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage(""); // Clear input immediately for better UX

      // Actually send the message
      const formData = new FormData();
      formData.append("conversationId", conversationId);
      formData.append("content", messageToSend);

      const result = await sendMessage(formData);

      if (!result.success) {
        throw new Error(result.message || "Failed to send message");
      }
    } catch (error) {
      toast({
        title: "Message not sent",
        description:
          error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      // Remove the optimistic message
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));
      // Restore the message text
      setNewMessage(newMessage);
    } finally {
      setIsSending(false);
      messageInputRef.current?.focus();
    }
  };

  const handleSubmitReport = async () => {
    if (!reportReason) {
      setReportError("Please select a reason for reporting");
      return;
    }

    setIsSubmittingReport(true);
    setReportError("");

    try {
      const formData = new FormData();
      formData.append("reportedItemId", conversationId);
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
      } else {
        throw new Error(result.message || "Failed to submit report");
      }
    } catch (error) {
      setReportError(
        error instanceof Error ? error.message : "Failed to submit report"
      );
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Group messages by date for better readability
  const groupedMessages = messages.reduce(
    (groups, message) => {
      const date = new Date(message.created_at).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    },
    {} as Record<string, Message[]>
  );

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Chat header with report button */}
      <div className="sticky top-0 z-10 bg-background border-b p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 flex-shrink-0">
            <Image
              src={otherUser.avatar_url || "/images/default-avatar.png"}
              alt={otherUser.display_name || otherUser.full_name || "User"}
              fill
              className="rounded-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-medium text-sm text-foreground">
              {otherUser.full_name || otherUser.display_name}
            </h3>
          </div>
        </div>

        <RevButtons
          variant="destructive"
          size="sm"
          onClick={() => setIsReportDialogOpen(true)}
          title="Report conversation"
        >
          <Flag className="h-4 w-4 mr-1" /> Report
        </RevButtons>
      </div>

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background text-foreground p-4">
          <DialogHeader>
            <DialogTitle>Report Conversation</DialogTitle>
            <DialogDescription>
              You are reporting your conversation with{" "}
              <strong>{otherUser.full_name || otherUser.display_name}</strong>.
              Please select a reason and provide any additional details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Reason <span className="text-destructive">*</span>
              </label>
              <Select
                value={reportReason}
                onValueChange={(value) => {
                  setReportReason(value);
                  setReportError("");
                }}
              >
                <SelectTrigger
                  id="reason"
                  className="bg-background border-input"
                >
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
                rows={3}
                className="bg-background border-input"
              />
            </div>

            {reportError && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {reportError}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReportDialogOpen(false);
                setReportError("");
              }}
              disabled={isSubmittingReport}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReport}
              disabled={isSubmittingReport}
              className="relative bg-primary text-primary-foreground"
            >
              {isSubmittingReport ? (
                <>
                  <span className="opacity-0">Submit Report</span>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 text-primary-foreground"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </span>
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
        {Object.entries(groupedMessages).length > 0 ? (
          Object.entries(groupedMessages).map(([date, dayMessages]) => (
            <div key={date} className="space-y-4">
              {/* Date separator */}
              <div className="flex justify-center my-4">
                <div className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                  {new Date(date).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>

              {/* Day's messages */}
              {dayMessages.map((message, idx) => {
                const isCurrentUser = message.sender_id === currentUserId;
                const showAvatar =
                  !isCurrentUser &&
                  (idx === 0 ||
                    dayMessages[idx - 1].sender_id !== message.sender_id);

                // Check if this is part of a consecutive group from the same sender
                const isConsecutive =
                  idx > 0 &&
                  dayMessages[idx - 1].sender_id === message.sender_id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    } ${isConsecutive ? "mt-1" : "mt-4"}`}
                  >
                    <div
                      className={`flex gap-2 max-w-[75%] ${
                        isCurrentUser ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {!isCurrentUser && (
                        <div
                          className={`relative h-8 w-8 flex-shrink-0 ${
                            !showAvatar ? "opacity-0" : ""
                          }`}
                        >
                          <Image
                            src={
                              otherUser.avatar_url ||
                              "/images/default-avatar.png"
                            }
                            alt={
                              otherUser.display_name ||
                              otherUser.full_name ||
                              "User"
                            }
                            fill
                            className="rounded-full object-cover"
                          />
                        </div>
                      )}

                      <div>
                        <div
                          className={`p-3 rounded-xl text-sm ${
                            isCurrentUser
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-secondary text-secondary-foreground rounded-bl-none"
                          }`}
                        >
                          {message.content}
                        </div>

                        <div
                          className={`text-xs text-muted-foreground mt-1 ${
                            isCurrentUser ? "text-right" : "text-left"
                          }`}
                        >
                          {message.id.startsWith("temp-") ? (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <svg
                                className="animate-spin h-3 w-3"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Sending...
                            </span>
                          ) : (
                            // Use a more robust date parsing approach
                            (() => {
                              try {
                                // Parse the date string properly, accounting for PostgreSQL format
                                const date = new Date(message.created_at);
                                // Check if the date is valid before formatting
                                if (!isNaN(date.getTime())) {
                                  return formatDistanceToNow(date, {
                                    addSuffix: false,
                                  });
                                }
                                return "Just now"; // Fallback for invalid dates
                              } catch (err) {
                                console.error("Date parsing error:", err);
                                return "Just now"; // Fallback message if date can't be parsed
                              }
                            })()
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground">
            <Info className="h-8 w-8 mb-3 text-muted-foreground/50" />
            <p className="mb-2 font-medium">No messages yet</p>
            <p className="text-sm max-w-xs">
              Send your first message to start the conversation with{" "}
              {otherUser.display_name || otherUser.full_name}.
            </p>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />{" "}
        {/* Extra space at bottom */}
      </div>

      {/* Message input */}
      <div className="p-3 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <Input
            ref={messageInputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${
              otherUser.display_name || otherUser.full_name
            }...`}
            className="flex-1 rounded-full bg-muted border-input"
            disabled={isSending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (newMessage.trim()) {
                  handleSendMessage(e);
                }
              }
            }}
          />
          <RevButtons
            variant={isSending || !newMessage.trim() ? "secondary" : "default"}
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="rounded-full h-10 w-10 p-2"
            aria-label="Send message"
          >
            {isSending ? (
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </RevButtons>
        </form>
      </div>
    </div>
  );
}
