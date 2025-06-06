import { createClient, getAuthenticatedUser } from "@/utils/supabase/server";
import { SettingsClientLayout } from "@/components/SettingsClientLayout";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: string;
  items_limit: number;
  created_at: string;
  updated_at: string;
}

export default async function SettingsPage() {
  const supabase = await createClient();

  // Get the authenticated user (middleware ensures user is authenticated)
  const user = await getAuthenticatedUser();

  // Fetch user profile data
  const fetchUserProfile = async (): Promise<UserProfile> => {
    try {
      // Check if user has a profile record, if not create one
      let { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile) {
        // Create default profile
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null,
            subscription_tier: "free",
            items_limit: 10,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating profile:", createError);
          // Fallback to basic profile
          profile = {
            id: user.id,
            email: user.email || "",
            full_name: user.user_metadata?.full_name || null,
            avatar_url: null,
            subscription_tier: "free",
            items_limit: 10,
            created_at: user.created_at,
            updated_at: new Date().toISOString(),
          };
        } else {
          profile = newProfile;
        }
      }

      return {
        id: user.id,
        email: user.email || "",
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        subscription_tier: profile.subscription_tier || "free",
        items_limit: profile.items_limit || 10,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Return fallback profile
      return {
        id: user.id,
        email: user.email || "",
        full_name: null,
        avatar_url: null,
        subscription_tier: "free",
        items_limit: 10,
        created_at: user.created_at,
        updated_at: new Date().toISOString(),
      };
    }
  };

  const userProfile = await fetchUserProfile();

  // Create session object for client component
  const session = {
    user,
    access_token: "",
    refresh_token: "",
    expires_in: 0,
    expires_at: 0,
    token_type: "bearer",
  };

  return (
    <SettingsClientLayout
      initialSession={session}
      initialProfile={userProfile}
    />
  );
}
