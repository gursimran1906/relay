import { createClient, getAuthenticatedUser } from "@/utils/supabase/server";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();

  // Get the authenticated user (middleware ensures user is authenticated)
  const user = await getAuthenticatedUser();

  // Create session object for client component
  const session = {
    user,
    access_token: "",
    refresh_token: "",
    expires_in: 0,
    expires_at: 0,
    token_type: "bearer",
  };

  return <ResetPasswordForm initialSession={session} />;
}
