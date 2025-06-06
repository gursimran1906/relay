"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { AddItemModal } from "@/components/AddItemModal";
import { ItemDetailModal } from "@/components/ItemDetailModal";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  Calendar,
  Tag,
  MapPin,
  Clock,
  Package,
  QrCode,
} from "lucide-react";

interface Item {
  id: number;
  uid: string;
  user_id: string;
  name: string;
  location: string | null;
  created_at: string;
  type: string | null;
  tags: string[] | null;
  metadata: any | null;
  last_maintenance_at: string | null;
  status: string | null;
}

// Asset type for QRCodeGenerator compatibility
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

interface ItemsClientLayoutProps {
  initialItems: Item[];
}

export function ItemsClientLayout({ initialItems }: ItemsClientLayoutProps) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const router = useRouter();

  // Update items if initialItems prop changes
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Convert Items to Assets for QRCodeGenerator
  const convertItemsToAssets = (items: Item[]): Asset[] => {
    return items.map((item) => ({
      id: item.id,
      uid: item.uid,
      name: item.name,
      type: item.type || "Unknown",
      location: item.location || "Unknown",
      status: item.status || "unknown",
      metadata: item.metadata || {},
    }));
  };

  const handleItemAdded = (newItem: any) => {
    // Convert the item to match our interface
    const fullItem: Item = {
      id: newItem.id,
      uid: newItem.uid,
      user_id: newItem.user_id,
      name: newItem.name,
      location: newItem.location,
      created_at: newItem.created_at,
      type: newItem.type,
      tags: newItem.tags || null,
      metadata: newItem.metadata || null,
      last_maintenance_at: newItem.last_maintenance_at || null,
      status: newItem.status,
    };

    setItems((prev) => [fullItem, ...prev]);
    setShowAddModal(false);
    router.refresh(); // Refresh server data
  };

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

  // Get unique values for filters (filter out null values)
  const uniqueTypes = [
    ...new Set(
      items
        .map((item) => item.type)
        .filter((type): type is string => type !== null)
    ),
  ];
  const uniqueLocations = [
    ...new Set(
      items
        .map((item) => item.location)
        .filter((location): location is string => location !== null)
    ),
  ];

  const filteredAndSortedItems = items
    .filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || item.status === statusFilter;
      const matchesType = !typeFilter || item.type === typeFilter;
      const matchesLocation =
        !locationFilter || item.location === locationFilter;
      const matchesDate =
        !dateFilter ||
        (() => {
          const itemDate = new Date(item.created_at);
          const now = new Date();
          switch (dateFilter) {
            case "today":
              return itemDate.toDateString() === now.toDateString();
            case "week":
              const weekAgo = new Date(now.setDate(now.getDate() - 7));
              return itemDate >= weekAgo;
            case "month":
              const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
              return itemDate >= monthAgo;
            case "year":
              const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
              return itemDate >= yearAgo;
            default:
              return true;
          }
        })();
      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesLocation &&
        matchesDate
      );
    })
    .sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "type":
          aValue = (a.type || "").toLowerCase();
          bValue = (b.type || "").toLowerCase();
          break;
        case "location":
          aValue = (a.location || "").toLowerCase();
          bValue = (b.location || "").toLowerCase();
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        case "created_at":
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter(null);
    setTypeFilter(null);
    setLocationFilter(null);
    setDateFilter(null);
    setSortBy("created_at");
    setSortOrder("desc");
  };

  const activeFiltersCount = [
    searchQuery,
    statusFilter,
    typeFilter,
    locationFilter,
    dateFilter,
  ].filter(Boolean).length;

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
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Items</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your inventory items
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* QR Code Generator Toggle */}
              <button
                onClick={() => setShowQRGenerator(!showQRGenerator)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:cursor-pointer transition-colors font-medium ${
                  showQRGenerator
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <QrCode className="h-5 w-5" />
                <span>QR Codes</span>
              </button>

              {/* Add Item Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 hover:cursor-pointer transition-colors font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* QR Code Generator Section */}
          {showQRGenerator && (
            <div className="mb-8">
              <QRCodeGenerator assets={convertItemsToAssets(items)} />
            </div>
          )}

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  activeFiltersCount > 0
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Filter className="h-5 w-5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${
                    showFilters ? "transform rotate-180" : ""
                  }`}
                />
              </button>
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar className="h-5 w-5 text-gray-400" />
                <span>Date</span>
                <ChevronDown
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    showDateFilter ? "transform rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["active", "maintenance_needed", "inactive"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() =>
                            setStatusFilter(
                              statusFilter === status ? null : status
                            )
                          }
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            statusFilter === status
                              ? getStatusColor(status)
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {status.replace("_", " ")}
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={typeFilter || ""}
                    onChange={(e) => setTypeFilter(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    {uniqueTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <select
                    value={locationFilter || ""}
                    onChange={(e) => setLocationFilter(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Locations</option>
                    {uniqueLocations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="created_at">Date</option>
                      <option value="name">Name</option>
                      <option value="type">Type</option>
                      <option value="location">Location</option>
                      <option value="status">Status</option>
                    </select>
                    <button
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title={`Sort ${
                        sortOrder === "asc" ? "Descending" : "Ascending"
                      }`}
                    >
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showDateFilter && (
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "All Time", value: null },
                    { label: "Today", value: "today" },
                    { label: "Last 7 Days", value: "week" },
                    { label: "Last Month", value: "month" },
                    { label: "Last Year", value: "year" },
                  ].map(({ label, value }) => (
                    <button
                      key={label}
                      onClick={() => setDateFilter(value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        dateFilter === value
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <span>
                    Showing {filteredAndSortedItems.length} of {items.length}{" "}
                    items
                  </span>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Items Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50">
                      <Package className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.type || "Unknown type"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${getStatusColor(
                      item.status
                    )}`}
                  >
                    {item.status?.replace("_", " ") || "Unknown"}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>{item.location || "No location"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-3 w-3" />
                      <span className="text-xs">
                        {item.tags.slice(0, 2).join(", ")}
                        {item.tags.length > 2 &&
                          ` +${item.tags.length - 2} more`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredAndSortedItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No items found
              </h3>
              <p className="text-gray-500 mb-6">
                {items.length === 0
                  ? "Get started by adding your first item."
                  : "Try adjusting your search or filter criteria."}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Add Item</span>
              </button>
            </div>
          )}
        </main>
      </div>

      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onItemAdded={handleItemAdded}
      />

      <ItemDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
