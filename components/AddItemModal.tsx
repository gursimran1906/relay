"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";
import {
  X,
  MapPin,
  Loader2,
  Package,
  Tag,
  Building,
  Calendar,
  Hash,
  Settings,
  Plus,
  Trash2,
  Star,
} from "lucide-react";

interface ItemType {
  id: number;
  uid: string;
  name: string;
  description: string | null;
  category: string | null;
  icon: string | null;
  is_active: boolean;
  org_id: string | null;
  is_custom: boolean;
  created_by: string | null;
  created_at: string;
}

interface Item {
  id: number;
  uid: string;
  user_id: string;
  name: string;
  location: string | null;
  created_at: string;
  type: number | null; // Changed to number as it's now a foreign key
  tags: string[] | null;
  metadata: Record<string, any> | null;
  last_maintenance_at: string | null;
  status: string;
}

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: (item: Item) => void;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "bg-green-50 text-green-700" },
  {
    value: "maintenance_needed",
    label: "Needs Maintenance",
    color: "bg-orange-50 text-orange-700",
  },
  {
    value: "inactive",
    label: "Inactive",
    color: "bg-gray-50 text-gray-700",
  },
  {
    value: "out_of_service",
    label: "Out of Service",
    color: "bg-red-50 text-red-700",
  },
];

export function AddItemModal({
  isOpen,
  onClose,
  onItemAdded,
}: AddItemModalProps) {
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("active");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [lastMaintenanceAt, setLastMaintenanceAt] = useState("");
  const [metadata, setMetadata] = useState<
    Array<{ key: string; value: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  // Fetch item types on component mount
  useEffect(() => {
    if (isOpen) {
      fetchItemTypes();
    }
  }, [isOpen]);

  const fetchItemTypes = async () => {
    setLoadingTypes(true);
    try {
      const response = await fetch("/api/item-types");
      if (response.ok) {
        const data = await response.json();
        setItemTypes(data.itemTypes || []);
      } else {
        throw new Error("Failed to fetch item types");
      }
    } catch (error) {
      console.error("Error fetching item types:", error);
      toast.error("Failed to load item types");
    } finally {
      setLoadingTypes(false);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setTypeId("");
      setLocation("");
      setStatus("active");
      setTags([]);
      setNewTag("");
      setLastMaintenanceAt("");
      setMetadata([]);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const getCurrentLocation = () => {
    setGettingLocation(true);

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        toast.success("Location added successfully");
        setGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Failed to get current location");
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const addMetadataField = () => {
    setMetadata([...metadata, { key: "", value: "" }]);
  };

  const updateMetadataField = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const updated = [...metadata];
    updated[index][field] = value;
    setMetadata(updated);
  };

  const removeMetadataField = (index: number) => {
    setMetadata(metadata.filter((_, i) => i !== index));
  };

  const getIconComponent = (iconName: string | null) => {
    const iconMap: { [key: string]: React.ReactElement } = {
      package: <Package className="h-4 w-4" />,
      tag: <Tag className="h-4 w-4" />,
      settings: <Settings className="h-4 w-4" />,
      star: <Star className="h-4 w-4" />,
      building: <Building className="h-4 w-4" />,
    };

    return iconMap[iconName || "package"] || <Package className="h-4 w-4" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to add items");
        return;
      }

      // Build metadata object from key-value pairs
      const metadataObj: Record<string, any> = {};
      metadata.forEach(({ key, value }) => {
        if (key.trim() && value.trim()) {
          metadataObj[key.trim()] = value.trim();
        }
      });

      // Prepare the item data
      const itemData = {
        name: name.trim(),
        type: typeId ? parseInt(typeId) : null, // Now using the ID as foreign key
        location: location.trim() || null,
        status,
        tags: tags.length > 0 ? tags : null,
        metadata: Object.keys(metadataObj).length > 0 ? metadataObj : null,
        last_maintenance_at: lastMaintenanceAt || null,
        user_id: user.id,
      };

      // Create the item
      const { data, error } = await supabase
        .from("items")
        .insert([itemData])
        .select()
        .single();

      if (error) throw error;

      toast.success("Item added successfully!");
      onItemAdded(data);
      onClose();
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Group types by category
  const typesByCategory = itemTypes.reduce((acc, type) => {
    const category = type.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(type);
    return acc;
  }, {} as Record<string, ItemType[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Add New Item
              </h2>
              <p className="text-sm text-gray-600">
                Add an item to your inventory with detailed tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Item Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Item Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g., Lobby Printer, Server Room AC Unit"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Item Type */}
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                <Tag className="inline h-4 w-4 mr-1" />
                Item Type
              </label>
              {loadingTypes ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading types...
                </div>
              ) : (
                <select
                  id="type"
                  value={typeId}
                  onChange={(e) => setTypeId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select item type</option>
                  {Object.entries(typesByCategory).map(([category, types]) => (
                    <optgroup key={category} label={category}>
                      {types.map((type) => (
                        <option key={type.id} value={type.id.toString()}>
                          {type.name}
                          {type.description ? ` - ${type.description}` : ""}
                          {type.is_custom ? " (Custom)" : " (Standard)"}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}

              {/* Show type details */}
              {typeId && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  {(() => {
                    const selectedType = itemTypes.find(
                      (t) => t.id.toString() === typeId
                    );
                    if (!selectedType) return null;

                    return (
                      <div className="flex items-center gap-2 text-sm">
                        {getIconComponent(selectedType.icon)}
                        <span className="font-medium">{selectedType.name}</span>
                        {selectedType.category && (
                          <span className="text-gray-500">
                            • {selectedType.category}
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            selectedType.is_custom
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {selectedType.is_custom ? "Custom" : "Standard"}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      status === option.value
                        ? option.color
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <Building className="inline h-4 w-4 mr-1" />
              Location
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., Building A - Floor 2 - Room 201"
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                title="Get current location"
              >
                {gettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                <span className="text-sm">GPS</span>
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="inline h-4 w-4 mr-1" />
              Tags
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTag())
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Add a tag and press Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="hover:text-blue-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Last Maintenance */}
          <div>
            <label
              htmlFor="lastMaintenance"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <Calendar className="inline h-4 w-4 mr-1" />
              Last Maintenance
            </label>
            <input
              type="date"
              id="lastMaintenance"
              value={lastMaintenanceAt}
              onChange={(e) => setLastMaintenanceAt(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Metadata */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                <Settings className="inline h-4 w-4 mr-1" />
                Additional Information
              </label>
              <button
                type="button"
                onClick={addMetadataField}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Field
              </button>
            </div>
            <div className="space-y-3">
              {metadata.map((field, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) =>
                      updateMetadataField(index, "key", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Field name"
                  />
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) =>
                      updateMetadataField(index, "value", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Field value"
                  />
                  <button
                    type="button"
                    onClick={() => removeMetadataField(index)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {metadata.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  No additional fields added
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding Item...
                </>
              ) : (
                "Add Item"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
