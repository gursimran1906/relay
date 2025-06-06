"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error signing in:", error);
    return {
      success: false,
      error: "An unexpected error occurred during sign in",
    };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error signing up:", error);
    return {
      success: false,
      error: "An unexpected error occurred during sign up",
    };
  }
}

export async function resetPassword(email: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return {
      success: false,
      error: "An unexpected error occurred while resetting password",
    };
  }
}

export async function signInWithGoogle(): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error signing in with Google:", error);
    return {
      success: false,
      error: "An unexpected error occurred during Google sign in",
    };
  }
}

export async function signOut(): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    redirect("/auth/login");
  } catch (error) {
    console.error("Error signing out:", error);
    return {
      success: false,
      error: "An unexpected error occurred during sign out",
    };
  }
}
