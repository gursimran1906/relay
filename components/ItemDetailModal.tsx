"use client";

import { X, Package, MapPin, Tag, Calendar, Clock, User } from "lucide-react";

interface Item {
  id: number;
  uid: string;
  user_id: string;
  name: string;
  location: string | null;
  created_at: string;
  type: number | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  last_maintenance_at: string | null;
  status: string | null;
}

interface ItemDetailModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ItemDetailModal({
  item,
  isOpen,
  onClose,
}: ItemDetailModalProps) {
  if (!isOpen || !item) return null;

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700";
      case "maintenance_needed":
        return "bg-orange-50 text-orange-700";
      case "inactive":
        return "bg-gray-50 text-gray-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-lg">
                <Package className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {item.name}
                </h2>
                <p className="text-sm text-gray-500">Item #{item.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Type</p>
                <p className="text-sm text-gray-900">
                  {item.type === null ? "Not specified" : item.type.toString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span
                  className={`inline-flex px-2 py-1 rounded text-xs ${getStatusColor(
                    item.status
                  )}`}
                >
                  {item.status?.replace("_", " ") || "Unknown"}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Location</p>
                <p className="text-sm text-gray-900">
                  {item.location || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Created</p>
                <p className="text-sm text-gray-900">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Maintenance Information */}
          {item.last_maintenance_at && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Maintenance
              </h3>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Last Maintenance</p>
                    <p className="text-sm text-gray-900">
                      {new Date(item.last_maintenance_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          {item.metadata && Object.keys(item.metadata).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Additional Information
              </h3>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  {Object.entries(item.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">
                        {key.replace(/_/g, " ")}:
                      </span>
                      <span className="text-gray-900 font-medium">
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Technical Details
            </h3>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Unique ID:</span>
                  <span className="text-gray-900 font-mono text-xs">
                    {item.uid}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Database ID:</span>
                  <span className="text-gray-900">{item.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">User ID:</span>
                  <span className="text-gray-900 font-mono text-xs">
                    {item.user_id}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
