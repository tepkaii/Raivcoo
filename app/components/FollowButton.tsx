// components/FollowButton.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { RevButtons } from "@/components/ui/RevButtons";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FollowButtonProps {
  currentUserId?: string;
  targetUserId: string;
  initialIsFollowing?: boolean;
}

export default function FollowButton({
  currentUserId,
  targetUserId,
  initialIsFollowing = false,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(!initialIsFollowing);
  const supabase = createClient();

  // Check if already following on mount if not provided
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUserId || initialIsFollowing !== undefined) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("followers")
          .select("id")
          .eq("follower_id", currentUserId)
          .eq("followed_id", targetUserId)
          .maybeSingle();

        if (error) throw error;

        setIsFollowing(!!data);
      } catch (error) {
        console.error("Error checking follow status:", error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkFollowStatus();
  }, [currentUserId, targetUserId, initialIsFollowing, supabase]);

  const toggleFollow = async () => {
    if (!currentUserId) {
      toast({
        title: "Login Required",
        description: "Please log in to follow other users",
        variant: "destructive",
      });
      return;
    }

    if (currentUserId === targetUserId) {
      toast({
        title: "Error",
        description: "You cannot follow yourself",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("followed_id", targetUserId);

        if (error) throw error;

        toast({
          title: "Unfollowed",
          description: "You are no longer following this user",
        });
      } else {
        // Follow
        const { error } = await supabase.from("followers").insert({
          follower_id: currentUserId,
          followed_id: targetUserId,
        });

        if (error) throw error;

        toast({
          title: "Now Following",
          description: "You are now following this user",
        });
      }

      // Toggle state
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error toggling follow status:", error);
      toast({
        title: "Error",
        description: "There was a problem updating your follow status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <RevButtons disabled variant="outline">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Checking...
      </RevButtons>
    );
  }

  return (
    <RevButtons
      onClick={toggleFollow}
      disabled={isLoading || !currentUserId || currentUserId === targetUserId}
      variant={isFollowing ? "outline" : "default"}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="h-4 w-4 mr-2" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      {isFollowing ? "Following" : "Follow"}
    </RevButtons>
  );
}
