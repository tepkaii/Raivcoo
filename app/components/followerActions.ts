// app/actions/followerActions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface FollowerData {
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

// Get followers for a user
export async function getFollowers(userId: string): Promise<{
  data: FollowerData[];
  count: number;
  error: any;
}> {
  const supabase = await createClient();

  try {
    // Get followers with count
    const {
      data: followers,
      count,
      error,
    } = await supabase
      .from("followers")
      .select("*", { count: "exact" })
      .eq("followed_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get all follower user profiles
    if (followers && followers.length > 0) {
      const followerIds = followers.map((f) => f.follower_id);

      const { data: profiles } = await supabase
        .from("editor_profiles")
        .select("*")
        .in("user_id", followerIds);

      // Create a map of user_id to profile
      const profileMap = (profiles || []).reduce((map, profile) => {
        map[profile.user_id] = profile;
        return map;
      }, {});

      // Attach profiles to followers
      const followersWithProfiles = followers.map((follower) => ({
        ...follower,
        profile: profileMap[follower.follower_id],
      }));

      return {
        data: followersWithProfiles,
        count: count || 0,
        error: null,
      };
    }

    return { data: followers || [], count: count || 0, error: null };
  } catch (error) {
    console.error("Error fetching followers:", error);
    return { data: [], count: 0, error };
  }
}

// Get following for a user
export async function getFollowing(userId: string): Promise<{
  data: FollowerData[];
  count: number;
  error: any;
}> {
  const supabase = await createClient();

  try {
    // Get following with count
    const {
      data: following,
      count,
      error,
    } = await supabase
      .from("followers")
      .select("*", { count: "exact" })
      .eq("follower_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get all followed user profiles
    if (following && following.length > 0) {
      const followedIds = following.map((f) => f.followed_id);

      const { data: profiles } = await supabase
        .from("editor_profiles")
        .select("*")
        .in("user_id", followedIds);

      // Create a map of user_id to profile
      const profileMap = (profiles || []).reduce((map, profile) => {
        map[profile.user_id] = profile;
        return map;
      }, {});

      // Attach profiles to following
      const followingWithProfiles = following.map((follow) => ({
        ...follow,
        profile: profileMap[follow.followed_id],
      }));

      return {
        data: followingWithProfiles,
        count: count || 0,
        error: null,
      };
    }

    return { data: following || [], count: count || 0, error: null };
  } catch (error) {
    console.error("Error fetching following:", error);
    return { data: [], count: 0, error };
  }
}

// Get follow counts for a user
export async function getFollowCounts(userId: string): Promise<{
  followers: number;
  following: number;
  error: any;
}> {
  const supabase = await createClient();

  try {
    // Get followers count
    const { count: followersCount, error: followersError } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("followed_id", userId);

    if (followersError) throw followersError;

    // Get following count
    const { count: followingCount, error: followingError } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    if (followingError) throw followingError;

    return {
      followers: followersCount || 0,
      following: followingCount || 0,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching follow counts:", error);
    return { followers: 0, following: 0, error };
  }
}
