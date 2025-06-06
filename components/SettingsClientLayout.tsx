"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";
import { Sidebar } from "@/components/Sidebar";
import {
  User,
  Mail,
  Lock,
  Bell,
  Shield,
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  CreditCard,
  Trash2,
} from "lucide-react";
import { Session } from "@supabase/supabase-js";

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

interface SettingsClientLayoutProps {
  initialSession: Session;
  initialProfile: UserProfile;
}

export function SettingsClientLayout({
  initialSession,
  initialProfile,
}: SettingsClientLayoutProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "notifications" | "billing"
  >("profile");
  const [loading, setLoading] = useState(false);

  // Profile form state
  const [fullName, setFullName] = useState(initialProfile.full_name || "");
  const [email, setEmail] = useState(initialProfile.email);

  // Security form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [maintenanceReminders, setMaintenanceReminders] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
        })
        .eq("id", initialProfile.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: email,
      });

      if (error) throw error;
      toast.success(
        "Email update initiated. Please check your email for confirmation."
      );
    } catch (error) {
      console.error("Error updating email:", error);
      toast.error("Failed to update email");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      // First delete user data
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", initialProfile.id);

      if (profileError) throw profileError;

      // Then sign out
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      toast.success("Account deleted successfully");
      router.push("/auth/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar
        expanded={isSidebarExpanded}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />
      <div
        className={`transition-all duration-300 ${
          isSidebarExpanded ? "ml-64" : "ml-20"
        }`}
      >
        <main className="p-8 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push("/profile")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Settings
              </h1>
              <p className="text-gray-600">
                Manage your account settings and preferences
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Settings Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-8">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-3">
              {activeTab === "profile" && (
                <div className="space-y-6">
                  {/* Profile Information */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Profile Information
                    </h2>
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div>
                        <label
                          htmlFor="fullName"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Save className="h-4 w-4" />
                          {loading ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Email Settings */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Email Settings
                    </h2>
                    <form onSubmit={handleUpdateEmail} className="space-y-6">
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your email address"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          Changing your email will require verification
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={loading || email === initialProfile.email}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Mail className="h-4 w-4" />
                          {loading ? "Updating..." : "Update Email"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-6">
                  {/* Password Change */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Change Password
                    </h2>
                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                      <div>
                        <label
                          htmlFor="currentPassword"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            id="currentPassword"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="newPassword"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="confirmPassword"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={loading || !newPassword || !confirmPassword}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Lock className="h-4 w-4" />
                          {loading ? "Updating..." : "Update Password"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-red-200">
                    <h2 className="text-xl font-semibold text-red-900 mb-6">
                      Danger Zone
                    </h2>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h3 className="font-medium text-red-900 mb-2">
                        Delete Account
                      </h3>
                      <p className="text-sm text-red-700 mb-4">
                        Once you delete your account, there is no going back.
                        Please be certain.
                      </p>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {loading ? "Deleting..." : "Delete Account"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Notification Preferences
                  </h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Email Notifications
                        </h3>
                        <p className="text-sm text-gray-500">
                          Receive email updates about your items
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emailNotifications}
                          onChange={(e) =>
                            setEmailNotifications(e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Critical Alerts
                        </h3>
                        <p className="text-sm text-gray-500">
                          Get notified about critical issues immediately
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={criticalAlerts}
                          onChange={(e) => setCriticalAlerts(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Maintenance Reminders
                        </h3>
                        <p className="text-sm text-gray-500">
                          Receive reminders for scheduled maintenance
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={maintenanceReminders}
                          onChange={(e) =>
                            setMaintenanceReminders(e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={() =>
                          toast.success("Notification preferences saved")
                        }
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "billing" && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Billing & Subscription
                  </h2>
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">
                        Current Plan
                      </h3>
                      <p className="text-gray-600 capitalize">
                        {initialProfile.subscription_tier} Plan
                      </p>
                      <p className="text-sm text-gray-500">
                        {initialProfile.items_limit} items included
                      </p>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">
                        Manage Subscription
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Upgrade your plan to get more items and advanced
                        features
                      </p>
                      <button
                        onClick={() => router.push("/profile/subscription")}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <CreditCard className="h-4 w-4" />
                        Manage Subscription
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
