"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";
import { Sidebar } from "@/components/Sidebar";
import { NotificationSettings } from "@/components/NotificationSettings";
import { ItemTypeManagement } from "@/components/ItemTypeManagement";
import {
  User,
  Mail,
  Calendar,
  Settings,
  Package,
  AlertTriangle,
  LogOut,
  Edit3,
  Bell,
  Tag,
} from "lucide-react";
import { Session } from "@supabase/supabase-js";

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

interface ProfileClientLayoutProps {
  initialSession: Session;
  initialProfile: UserProfile;
}

export function ProfileClientLayout({
  initialSession,
  initialProfile,
}: ProfileClientLayoutProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "item-types", label: "Item Types", icon: Tag },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
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
        <main className="p-6 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                Profile
              </h1>
              <p className="text-gray-600">
                Manage your account information and settings
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>{loading ? "Signing out..." : "Sign Out"}</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Profile Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-medium text-gray-900">
                          {profile.full_name || "User"}
                        </h2>
                        <p className="text-gray-600">{profile.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("settings")}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium text-gray-900 text-sm">
                            {profile.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Member since</p>
                          <p className="font-medium text-gray-900 text-sm">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Total Items</p>
                          <p className="font-medium text-gray-900 text-sm">
                            {profile.items_count}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Open Issues</p>
                          <p className="font-medium text-gray-900 text-sm">
                            {profile.issues_count}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-medium text-gray-900 mb-4">
                    Account Overview
                  </h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-600 font-medium">
                            Items
                          </p>
                          <p className="text-xl font-semibold text-blue-900">
                            {profile.items_count}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="text-xs text-orange-600 font-medium">
                            Issues
                          </p>
                          <p className="text-xl font-semibold text-orange-900">
                            {profile.issues_count}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-xs text-green-600 font-medium">
                            Account Age
                          </p>
                          <p className="text-lg font-semibold text-green-900">
                            {Math.floor(
                              (Date.now() -
                                new Date(profile.created_at).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                            days
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push("/items")}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                  >
                    <Package className="h-4 w-4" />
                    View Items
                  </button>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Settings className="h-4 w-4 text-gray-600" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Bell className="h-4 w-4 text-gray-600" />
                    Notifications
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && <NotificationSettings />}

          {activeTab === "item-types" && <ItemTypeManagement />}

          {activeTab === "settings" && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">
                Account Settings
              </h3>
              <p className="text-gray-600 text-sm">
                Additional account settings will be available here.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
