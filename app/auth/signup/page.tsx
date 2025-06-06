"use client";

import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import AuthForm from "../components/auth-form";
import { signUpWithEmail, signInWithGoogle } from "../actions";
import SignUpForm from "../components/sign-up-form";

export default function SignupPage() {
  const router = useRouter();

  const handleSubmit = async (email: string, password: string) => {
    const result = await signUpWithEmail(email, password);
    if (result.success) {
      toast.success("Verification link sent to your email!");
      router.push("/auth/verify-email");
    } else {
      throw new Error(result.error || "Failed to sign up");
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (!result.success) {
      throw new Error(result.error || "Failed to sign in with Google");
    }
  };

  return <SignUpForm />;
}
