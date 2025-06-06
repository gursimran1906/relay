"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  Send,
  User,
  Mail,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Camera,
  Upload,
  X,
  MapPin,
} from "lucide-react";

interface Asset {
  id: number;
  uid: string;
  name: string;
  type: string;
  location: string;
  status: string;
  metadata?: {
    department?: string;
    criticality?: string;
    description?: string;
  };
}

interface ReportIssueFormProps {
  asset: Asset;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const ISSUE_TYPES = [
  { value: "not_working", label: "Not Working", icon: "🚫" },
  { value: "broken", label: "Broken/Damaged", icon: "🔧" },
  { value: "maintenance", label: "Needs Maintenance", icon: "⚙️" },
  { value: "safety", label: "Safety Concern", icon: "⚠️" },
  { value: "supply", label: "Out of Supplies", icon: "📦" },
  { value: "other", label: "Other Issue", icon: "❓" },
];

const URGENCY_LEVELS = [
  {
    value: "low",
    label: "Low",
    color: "bg-green-100 text-green-800",
    description: "Can wait a few days",
  },
  {
    value: "medium",
    label: "Medium",
    color: "bg-yellow-100 text-yellow-800",
    description: "Should be fixed soon",
  },
  {
    value: "high",
    label: "High",
    color: "bg-orange-100 text-orange-800",
    description: "Needs attention today",
  },
];

export function ReportIssueForm({ asset }: ReportIssueFormProps) {
  const [issueType, setIssueType] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [isCritical, setIsCritical] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setLocationLoading(false);
        },
        (error) => {
          setLocationError(error.message);
          setLocationLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    }
  }, []);

  const handleImageSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please select a valid image file");
    }
  };

  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // Collect metadata for the report
  const collectMetadata = () => {
    const metadata: any = {
      timestamp_with_timezone: new Date().toISOString(),
      user_agent: navigator.userAgent,
      device_info: `${navigator.platform} - ${navigator.userAgent}`,
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    if (location) {
      metadata.reporter_location = location;
    }

    return metadata;
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("assetId", asset.id.toString());

    try {
      const response = await fetch("/api/upload-issue-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();

      // For private buckets, we store the path instead of public URL
      // The path will be used to generate signed URLs when displaying images
      return data.path || null;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imagePath = null;

      // Upload image if selected
      if (selectedImage) {
        imagePath = await uploadImage(selectedImage);
        if (!imagePath) {
          setLoading(false);
          return; // Stop if image upload failed
        }
      }

      const metadata = collectMetadata();

      const response = await fetch("/api/report-issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: asset.id,
          issueType,
          urgency,
          description,
          reporterName,
          reporterEmail,
          isCritical,
          imagePath,
          metadata,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit issue report");
      }

      setSubmitted(true);
      toast.success("Issue reported successfully!");
    } catch (error) {
      console.error("Error submitting issue:", error);
      toast.error("Failed to submit issue report");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          Thank You!
        </h3>
        <p className="text-gray-600 mb-4">
          Your issue report has been submitted successfully.
        </p>
        <p className="text-sm text-gray-500">
          Our team will review your report and take appropriate action.
          {reporterEmail && " We'll keep you updated via email."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          What's the issue?
        </h3>
        <p className="text-sm sm:text-base text-gray-600">
          Please provide details about the problem you've encountered.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Issue Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Type of Issue (Optional)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {ISSUE_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() =>
                  setIssueType(issueType === type.value ? "" : type.value)
                }
                className={`p-3 sm:p-4 border rounded-xl text-left transition-colors ${
                  issueType === type.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-lg sm:text-xl">{type.icon}</span>
                  <span className="text-sm sm:text-base font-medium">
                    {type.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Urgency Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <AlertTriangle className="inline h-4 w-4 mr-1" />
            How urgent is this?
          </label>
          <div className="space-y-2">
            {URGENCY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setUrgency(level.value)}
                className={`w-full p-3 border rounded-xl text-left transition-colors ${
                  urgency === level.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${level.color} sm:mr-3`}
                    >
                      {level.label}
                    </span>
                    <span className="text-sm text-gray-600">
                      {level.description}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Critical Issue Checkbox */}
        <div className="border border-red-200 rounded-xl p-3 sm:p-4 bg-red-50">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isCritical}
              onChange={(e) => setIsCritical(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded focus:ring-red-500 mt-0.5 sm:mt-1 flex-shrink-0"
            />
            <div>
              <span className="text-sm sm:text-base font-medium text-red-900">
                🚨 This is a critical safety or emergency issue
              </span>
              <p className="text-xs sm:text-sm text-red-700 mt-1">
                Check this if the issue poses immediate danger or completely
                prevents operation
              </p>
            </div>
          </label>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            <MessageSquare className="inline h-4 w-4 mr-1" />
            Describe the issue *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-sm sm:text-base"
            placeholder="Please describe what's wrong and any steps you took..."
            required
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            📸 Add a Photo (Optional)
          </label>
          <p className="text-xs text-gray-600 mb-3">
            A photo can help us understand the issue better
          </p>

          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Issue preview"
                className="w-full max-w-xs h-auto rounded-xl border border-gray-200"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCameraCapture}
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <Camera className="h-6 w-6 text-gray-400 mb-2" />
                <span className="text-xs text-gray-600 text-center">
                  Take Photo
                </span>
              </button>

              <button
                type="button"
                onClick={handleFileUpload}
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <Upload className="h-6 w-6 text-gray-400 mb-2" />
                <span className="text-xs text-gray-600 text-center">
                  Upload Image
                </span>
              </button>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) =>
              e.target.files?.[0] && handleImageSelect(e.target.files[0])
            }
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) =>
              e.target.files?.[0] && handleImageSelect(e.target.files[0])
            }
            className="hidden"
          />
        </div>

        {/* Location Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900">
                Location Information
              </h4>
              {locationLoading ? (
                <p className="text-xs text-blue-700 mt-1">
                  Getting your location...
                </p>
              ) : location ? (
                <div className="text-xs text-blue-700 mt-1">
                  <p>✓ Location captured for accurate reporting</p>
                  <p className="mt-1 font-mono text-xs opacity-75">
                    {location.latitude.toFixed(4)},{" "}
                    {location.longitude.toFixed(4)}
                    {location.accuracy &&
                      ` (±${Math.round(location.accuracy)}m)`}
                  </p>
                </div>
              ) : locationError ? (
                <p className="text-xs text-red-600 mt-1">
                  Could not get location: {locationError}
                </p>
              ) : (
                <p className="text-xs text-gray-600 mt-1">
                  Location not available
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Reporter Information */}
        <div className="border-t border-gray-200 pt-4 sm:pt-6">
          <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
            Your Information (Optional)
          </h4>
          <p className="text-xs sm:text-sm text-gray-600 mb-4">
            Help us follow up with you if needed.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="reporterName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                <User className="inline h-4 w-4 mr-1" />
                Your Name
              </label>
              <input
                type="text"
                id="reporterName"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label
                htmlFor="reporterEmail"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                <Mail className="inline h-4 w-4 mr-1" />
                Email Address
              </label>
              <input
                type="email"
                id="reporterEmail"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                placeholder="john@example.com"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || !description.trim()}
            className={`w-full px-4 sm:px-6 py-4 rounded-xl font-medium text-white transition-colors flex items-center justify-center gap-2 text-sm sm:text-base ${
              loading || !description.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : isCritical
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="hidden sm:inline">Submitting...</span>
                <span className="sm:hidden">Submitting...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {isCritical ? "Report Critical Issue" : "Submit Issue Report"}
                </span>
                <span className="sm:hidden">
                  {isCritical ? "Report Critical" : "Submit Report"}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
