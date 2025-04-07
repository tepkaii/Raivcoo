// app/components/FollowersModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RevButtons } from "@/components/ui/RevButtons";
import { UserMinus, UserPlus, Users, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { getFollowers, getFollowing } from "./followerActions";
import { createClient } from "@/utils/supabase/client";

interface FollowerData {
  id: string;
  follower_id: string;
  followed_id: string;
  created_at: string;
  profile?: {
    display_name: string;
    full_name: string;
    avatar_url: string;
    user_id: string;
  };
}

interface FollowersModalProps {
  userId: string;
  currentUserId?: string;
  isFollowers?: boolean; // true for followers, false for following
  trigger?: React.ReactNode;
  count: number;
  onCountChange?: (newCount: number) => void;
}

export default function FollowersModal({
  userId,
  currentUserId,
  isFollowers = true,
  trigger,
  count,
  onCountChange,
}: FollowersModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [followData, setFollowData] = useState<FollowerData[]>([]);
  const supabase = createClient();

  const title = isFollowers ? "Followers" : "Following";
  const description = isFollowers
    ? "People who follow this account"
    : "People this account follows";

  useEffect(() => {
    if (isOpen) {
      fetchFollowData();
    }
  }, [isOpen, userId, isFollowers]);

  const fetchFollowData = async () => {
    setIsLoading(true);

    try {
      if (isFollowers) {
        const { data, error } = await getFollowers(userId);
        if (error) throw error;
        setFollowData(data);
      } else {
        const { data, error } = await getFollowing(userId);
        if (error) throw error;
        setFollowData(data);
      }
    } catch (error) {
      console.error(`Error fetching ${title.toLowerCase()}:`, error);
      toast({
        title: "Error",
        description: `Failed to load ${title.toLowerCase()}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async (followedId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("followed_id", followedId);

      if (error) throw error;

      // Update local state
      setFollowData((prev) =>
        prev.filter(
          (item) =>
            !(
              item.follower_id === currentUserId &&
              item.followed_id === followedId
            )
        )
      );

      // Update count
      if (onCountChange) {
        onCountChange(count - 1);
      }

      toast({
        title: "Success",
        description: "Unfollowed successfully",
      });
    } catch (error) {
      console.error("Error unfollowing:", error);
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    }
  };

  const handleFollow = async (followedId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase.from("followers").insert({
        follower_id: currentUserId,
        followed_id: followedId,
      });

      if (error) throw error;

      // Refresh the list
      fetchFollowData();

      // Update count
      if (onCountChange) {
        onCountChange(count + 1);
      }

      toast({
        title: "Success",
        description: "Followed successfully",
      });
    } catch (error) {
      console.error("Error following:", error);
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    }
  };

  // Check if current user is following another user
  const isFollowing = async (userId: string) => {
    if (!currentUserId) return false;

    try {
      const { data, error } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("followed_id", userId)
        .maybeSingle();

      if (error) throw error;

      return !!data;
    } catch (error) {
      console.error("Error checking follow status:", error);
      return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" className="flex items-center hover:underline">
            <Users className="h-4 w-4 mr-1" />
            <span className="font-semibold">{count}</span> {title}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {title} ({count})
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : followData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No {title.toLowerCase()} yet
            </div>
          ) : (
            <div className="space-y-4">
              {followData.map((item) => {
                const profile = item.profile;
                if (!profile) return null; // Skip if profile not found

                const isCurrentUser = profile.user_id === currentUserId;
                const isProfileOwner = userId === currentUserId;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <Link
                      href={`/profile/${profile.display_name}`}
                      className="flex items-center gap-3 flex-1"
                      onClick={() => setIsOpen(false)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={profile.avatar_url || ""}
                          alt={profile.display_name}
                        />
                        <AvatarFallback>
                          {profile.display_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{profile.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          @{profile.display_name}
                        </p>
                      </div>
                    </Link>

                    {!isCurrentUser && currentUserId && (
                      <>
                        {isFollowers ? (
                          <RevButtons
                            size="sm"
                            variant="outline"
                            onClick={() => handleFollow(profile.user_id)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Follow Back
                          </RevButtons>
                        ) : (
                          <RevButtons
                            size="sm"
                            variant="outline"
                            className="text-red-500"
                            onClick={() => handleUnfollow(profile.user_id)}
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            Unfollow
                          </RevButtons>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
