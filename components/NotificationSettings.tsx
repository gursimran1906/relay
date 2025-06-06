"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Bell,
  Phone,
  Mail,
  Clock,
  Save,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-react";

interface NotificationPreferences {
  // SMS Settings
  sms_enabled: boolean;
  phone_number: string;

  // Email Settings
  email_enabled: boolean;

  // Quiet Hours
  quiet_hours_enabled: boolean;
  quiet_start: string;
  quiet_end: string;

  // Digest Settings
  daily_digest: boolean;
  weekly_digest: boolean;
}

export function NotificationSettings() {
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/notifications/preferences");
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      } else {
        toast.error("Failed to load notification settings");
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
      toast.error("Failed to load notification settings");
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast.success("Notification settings saved");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (
    key: keyof NotificationPreferences,
    value: boolean | string
  ) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-gray-600">Failed to load notification settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Notification Settings
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure how you receive alerts for issues
          </p>
        </div>
        <button
          onClick={savePreferences}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saving ? "Saving..." : saved ? "Saved!" : "Save"}</span>
        </button>
      </div>

      {/* Critical Issues Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <div>
            <h3 className="font-medium text-gray-900">Critical Issues</h3>
            <p className="text-sm text-gray-500">
              High priority alerts requiring immediate attention
            </p>
          </div>
        </div>

        {/* SMS Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  SMS Notifications
                </p>
                <p className="text-xs text-gray-500">
                  Text messages for critical issues
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.sms_enabled}
                onChange={(e) =>
                  updatePreference("sms_enabled", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gray-900"></div>
            </label>
          </div>

          {preferences.sms_enabled && (
            <div className="ml-7">
              <label className="block text-sm text-gray-600 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={preferences.phone_number}
                onChange={(e) =>
                  updatePreference("phone_number", e.target.value)
                }
                placeholder="+1234567890"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Include country code (e.g., +1 for US)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Normal Issues Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-4 w-4 text-orange-600" />
          <div>
            <h3 className="font-medium text-gray-900">Normal Issues</h3>
            <p className="text-sm text-gray-500">
              Regular maintenance and standard alerts
            </p>
          </div>
        </div>

        {/* Email Settings */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900 text-sm">
                Email Notifications
              </p>
              <p className="text-xs text-gray-500">
                Email alerts for all issues
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.email_enabled}
              onChange={(e) =>
                updatePreference("email_enabled", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gray-900"></div>
          </label>
        </div>
      </div>

      {/* Additional Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-4 w-4 text-purple-600" />
          <div>
            <h3 className="font-medium text-gray-900">Additional Settings</h3>
            <p className="text-sm text-gray-500">
              Quiet hours and digest options
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Quiet Hours */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 text-sm">Quiet Hours</p>
                <p className="text-xs text-gray-500">
                  Disable non-critical notifications during specified hours
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.quiet_hours_enabled}
                  onChange={(e) =>
                    updatePreference("quiet_hours_enabled", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gray-900"></div>
              </label>
            </div>

            {preferences.quiet_hours_enabled && (
              <div className="ml-7 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_start}
                    onChange={(e) =>
                      updatePreference("quiet_start", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_end}
                    onChange={(e) =>
                      updatePreference("quiet_end", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Digest Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  Daily Digest
                </p>
                <p className="text-xs text-gray-500">
                  Summary of daily activity
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.daily_digest}
                  onChange={(e) =>
                    updatePreference("daily_digest", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gray-900"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  Weekly Digest
                </p>
                <p className="text-xs text-gray-500">
                  Summary of weekly activity
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.weekly_digest}
                  onChange={(e) =>
                    updatePreference("weekly_digest", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gray-900"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
