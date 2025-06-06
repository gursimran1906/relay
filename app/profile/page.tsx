import { createClient, getAuthenticatedUser } from "@/utils/supabase/server";
import { ProfileClientLayout } from "@/components/ProfileClientLayout";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  items_count: number;
  issues_count: number;
  created_at: string;
  last_sign_in_at: string | null;
}

export default async function ProfilePage() {
  const supabase = await createClient();

  // Get the authenticated user (middleware ensures user is authenticated)
  const user = await getAuthenticatedUser();

  // Fetch user profile data
  const fetchUserProfile = async (): Promise<UserProfile> => {
    try {
      // Get items count
      const { count: itemsCount } = await supabase
        .from("items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Get open issues count
      const { count: issuesCount } = await supabase
        .from("issues")
        .select("*", { count: "exact", head: true })
        .eq("uid", user.id)
        .in("status", ["open", "in_progress"]);

      // Check if user has a profile record, if not create one
      let { data: profile } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, created_at, updated_at")
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
        full_name: profile?.full_name || null,
        avatar_url: profile?.avatar_url || null,
        items_count: itemsCount || 0,
        issues_count: issuesCount || 0,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at || null,
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Return fallback profile
      return {
        id: user.id,
        email: user.email || "",
        full_name: null,
        avatar_url: null,
        items_count: 0,
        issues_count: 0,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at || null,
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
    <ProfileClientLayout
      initialSession={session}
      initialProfile={userProfile}
    />
  );
}
