"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { resetPassword } from "../actions";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await resetPassword(email);
      if (result.success) {
        toast.success("Password reset link sent to your email!");
        router.push("/auth/login");
      } else {
        setError(result.error || "Failed to send reset link");
      }
    } catch (error) {
      console.error("Unexpected error during password reset:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-center text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl mb-6">
        Reset password
      </h1>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            } transition-colors`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                Processing...
              </span>
            ) : (
              "Send reset link"
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        Remember your password?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-blue-600 hover:text-blue-500"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
