"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";
import { Sidebar } from "@/components/Sidebar";
import { IssueDetailModal } from "@/components/IssueDetailModal";
import { IssueImageDisplay } from "@/components/IssueImageDisplay";
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Calendar,
  Tag,
  MapPin,
  Clock,
  Package,
  Users,
  Zap,
  CheckCircle,
  Image as ImageIcon,
  X,
} from "lucide-react";

interface Issue {
  id: number;
  uid: string;
  item_id: number;
  description: string;
  status: string;
  reported_at: string;
  resolved_at?: string;
  reported_by?: string;
  contact_info?: string;
  internal_notes?: string;
  is_critical: boolean;
  urgency: string;
  issue_type: string;
  group_id?: string;
  image_path?: string;
  tags?: string[];
  metadata?: {
    reporter_location?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    };
    device_info?: string;
    user_agent?: string;
    timestamp_with_timezone?: string;
    [key: string]: unknown;
  };
  items: {
    name: string;
    type: string;
    location: string;
  };
  related_issues?: {
    id: number;
    description: string;
    status: string;
    urgency: string;
    reported_at: string;
    items: {
      name: string;
    };
  }[];
}

interface IssuesClientLayoutProps {
  initialIssues: Issue[];
}

interface AssetGroup {
  assetId: number;
  assetName: string;
  assetType: string;
  assetLocation: string;
  totalIssues: number;
  openIssues: number;
  criticalIssues: number;
  groups: {
    [groupId: string]: {
      issues: Issue[];
      isExpanded: boolean;
      hasOpenIssues: boolean;
      hasCriticalIssues: boolean;
    };
  };
}

export function IssuesClientLayout({ initialIssues }: IssuesClientLayoutProps) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([
    "open",
    "in_progress",
  ]);
  const [urgencyFilter, setUrgencyFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [expandedAssets, setExpandedAssets] = useState<Set<number>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [assetGroups, setAssetGroups] = useState<{
    [assetId: number]: AssetGroup;
  }>({});
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [showAllIssues, setShowAllIssues] = useState<Set<string>>(new Set());
  const router = useRouter();
  const supabase = createClient();

  // Update issues if initialIssues prop changes
  useEffect(() => {
    setIssues(initialIssues);
  }, [initialIssues]);

  // Group issues by asset and then by group_id
  useEffect(() => {
    if (issues.length > 0) {
      const grouped: { [assetId: number]: AssetGroup } = {};

      // Sort issues by reported_at descending (newest first)
      const sortedIssues = [...issues].sort(
        (a, b) =>
          new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()
      );

      sortedIssues.forEach((issue) => {
        const assetId = issue.item_id;

        if (!grouped[assetId]) {
          grouped[assetId] = {
            assetId,
            assetName: issue.items.name,
            assetType: issue.items.type,
            assetLocation: issue.items.location,
            totalIssues: 0,
            openIssues: 0,
            criticalIssues: 0,
            groups: {},
          };
        }

        const groupId = issue.group_id || "ungrouped";

        if (!grouped[assetId].groups[groupId]) {
          grouped[assetId].groups[groupId] = {
            issues: [],
            isExpanded: false,
            hasOpenIssues: false,
            hasCriticalIssues: false,
          };
        }

        grouped[assetId].groups[groupId].issues.push(issue);
        grouped[assetId].totalIssues++;

        if (issue.status === "open" || issue.status === "in_progress") {
          grouped[assetId].openIssues++;
          grouped[assetId].groups[groupId].hasOpenIssues = true;
        }

        if (issue.is_critical) {
          grouped[assetId].criticalIssues++;
          grouped[assetId].groups[groupId].hasCriticalIssues = true;
        }
      });

      setAssetGroups(grouped);
    }
  }, [issues]);

  const handleStatusUpdate = async (issueId: number, newStatus: string) => {
    try {
      const updateData: Record<string, unknown> = { status: newStatus };

      // Add resolved_at timestamp when marking as resolved
      if (newStatus === "resolved") {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("issues")
        .update(updateData)
        .eq("id", issueId);

      if (error) throw error;

      setIssues((prevIssues) =>
        prevIssues.map((issue) =>
          issue.id === issueId
            ? {
                ...issue,
                status: newStatus,
                ...(newStatus === "resolved" && {
                  resolved_at: updateData.resolved_at as string,
                }),
              }
            : issue
        )
      );

      toast.success(`Issue marked as ${newStatus.replace("_", " ")}`);
      setSelectedIssue(null);
      router.refresh();
    } catch (error) {
      console.error("Error updating issue status:", error);
      toast.error("Failed to update issue status");
    }
  };

  const handleResolveIssue = async (issueId: number) => {
    await handleStatusUpdate(issueId, "resolved");
  };

  const handleSaveNotes = async (issueId: number, notes: string) => {
    try {
      const { error } = await supabase
        .from("issues")
        .update({ internal_notes: notes })
        .eq("id", issueId);

      if (error) throw error;

      setIssues((prevIssues) =>
        prevIssues.map((issue) =>
          issue.id === issueId ? { ...issue, internal_notes: notes } : issue
        )
      );

      toast.success("Notes updated successfully");
      setEditingNotes(null);
      setNotesValue("");
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error("Failed to update notes");
    }
  };

  const startEditingNotes = (issue: Issue) => {
    setEditingNotes(issue.id);
    setNotesValue(issue.internal_notes || "");
  };

  const handleGroupStatusUpdate = async (
    groupId: string,
    newStatus: string
  ) => {
    try {
      const { error } = await supabase
        .from("issues")
        .update({ status: newStatus })
        .eq("group_id", groupId)
        .in("status", ["open", "in_progress"]);

      if (error) throw error;

      setIssues((prevIssues) =>
        prevIssues.map((issue) =>
          issue.group_id === groupId &&
          (issue.status === "open" || issue.status === "in_progress")
            ? { ...issue, status: newStatus }
            : issue
        )
      );

      toast.success(
        `All issues in group marked as ${newStatus.replace("_", " ")}`
      );
      setSelectedIssue(null);
      router.refresh();
    } catch (error) {
      console.error("Error updating group status:", error);
      toast.error("Failed to update group status");
    }
  };

  const toggleAssetExpansion = (assetId: number) => {
    const newExpanded = new Set(expandedAssets);
    if (newExpanded.has(assetId)) {
      newExpanded.delete(assetId);
    } else {
      newExpanded.add(assetId);
    }
    setExpandedAssets(newExpanded);
  };

  const toggleGroupExpansion = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-orange-50 text-orange-700";
      case "in_progress":
        return "bg-blue-50 text-blue-700";
      case "resolved":
        return "bg-green-50 text-green-700";
      case "closed":
        return "bg-gray-50 text-gray-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-50 text-red-700";
      case "medium":
        return "bg-orange-50 text-orange-700";
      case "low":
        return "bg-blue-50 text-blue-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const getGroupTitle = (
    groupId: string,
    groupData: {
      issues: Issue[];
      isExpanded: boolean;
      hasOpenIssues: boolean;
      hasCriticalIssues: boolean;
    }
  ) => {
    if (groupId === "ungrouped") {
      return "Individual Issues";
    }
    return `Similar Issues Group`;
  };

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.items.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.items.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter.includes(issue.status);
    const matchesUrgency =
      urgencyFilter.length === 0 || urgencyFilter.includes(issue.urgency);
    const matchesType =
      typeFilter.length === 0 || typeFilter.includes(issue.issue_type);
    const matchesDate =
      !dateFilter ||
      (() => {
        const reportedDate = new Date(issue.reported_at);
        const now = new Date();
        switch (dateFilter) {
          case "today":
            return reportedDate.toDateString() === now.toDateString();
          case "week":
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            return reportedDate >= weekAgo;
          case "month":
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            return reportedDate >= monthAgo;
          default:
            return true;
        }
      })();
    return (
      matchesSearch &&
      matchesStatus &&
      matchesUrgency &&
      matchesType &&
      matchesDate
    );
  });

  const filteredAssetGroups = Object.values(assetGroups)
    .map((assetGroup) => {
      const filteredGroups: {
        [groupId: string]: {
          issues: Issue[];
          isExpanded: boolean;
          hasOpenIssues: boolean;
          hasCriticalIssues: boolean;
        };
      } = {};

      Object.entries(assetGroup.groups).forEach(([groupId, groupData]) => {
        const filteredGroupIssues = groupData.issues.filter((issue: Issue) =>
          filteredIssues.includes(issue)
        );

        if (filteredGroupIssues.length > 0) {
          filteredGroups[groupId] = {
            ...groupData,
            issues: filteredGroupIssues,
          };
        }
      });

      return {
        ...assetGroup,
        groups: filteredGroups,
        hasVisibleIssues: Object.keys(filteredGroups).length > 0,
      };
    })
    .filter((assetGroup) => assetGroup.hasVisibleIssues);

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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Issues</h1>
              <p className="text-gray-600">
                {issues.length} total issues across{" "}
                {Object.keys(assetGroups).length} assets
              </p>
            </div>
            <button
              onClick={() => router.push("/issues/new")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>New Issue</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search issues, assets, or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-5 w-5 text-gray-400" />
                <span>Filters</span>
                <ChevronDown
                  className={`h-5 w-5 text-gray-400 transition-transform ${
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-gray-200 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["open", "in_progress", "resolved", "closed"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() =>
                            setStatusFilter(
                              statusFilter.includes(status)
                                ? statusFilter.filter((s) => s !== status)
                                : [...statusFilter, status]
                            )
                          }
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            statusFilter.includes(status)
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
                    Priority
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["high", "medium", "low"].map((urgency) => (
                      <button
                        key={urgency}
                        onClick={() =>
                          setUrgencyFilter(
                            urgencyFilter.includes(urgency)
                              ? urgencyFilter.filter((u) => u !== urgency)
                              : [...urgencyFilter, urgency]
                          )
                        }
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          urgencyFilter.includes(urgency)
                            ? getUrgencyColor(urgency)
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {urgency}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["hardware", "software", "network", "other"].map(
                      (type) => (
                        <button
                          key={type}
                          onClick={() =>
                            setTypeFilter(
                              typeFilter.includes(type)
                                ? typeFilter.filter((t) => t !== type)
                                : [...typeFilter, type]
                            )
                          }
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            typeFilter.includes(type)
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {type}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {showDateFilter && (
              <div className="p-4 bg-white rounded-lg border border-gray-200 mb-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "All Time", value: null },
                    { label: "Today", value: "today" },
                    { label: "Last 7 Days", value: "week" },
                    { label: "Last 30 Days", value: "month" },
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
            {(statusFilter.length > 0 ||
              urgencyFilter.length > 0 ||
              typeFilter.length > 0 ||
              dateFilter) && (
              <div className="flex flex-wrap items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <span className="text-sm font-medium text-blue-900">
                  Active Filters:
                </span>

                {statusFilter.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-blue-700">Status:</span>
                    {statusFilter.map((status) => (
                      <span
                        key={status}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          status
                        )}`}
                      >
                        {status.replace("_", " ")}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-600"
                          onClick={() =>
                            setStatusFilter(
                              statusFilter.filter((s) => s !== status)
                            )
                          }
                        />
                      </span>
                    ))}
                  </div>
                )}

                {urgencyFilter.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-blue-700">Priority:</span>
                    {urgencyFilter.map((urgency) => (
                      <span
                        key={urgency}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(
                          urgency
                        )}`}
                      >
                        {urgency}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-600"
                          onClick={() =>
                            setUrgencyFilter(
                              urgencyFilter.filter((u) => u !== urgency)
                            )
                          }
                        />
                      </span>
                    ))}
                  </div>
                )}

                {typeFilter.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-blue-700">Type:</span>
                    {typeFilter.map((type) => (
                      <span
                        key={type}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800"
                      >
                        {type}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-600"
                          onClick={() =>
                            setTypeFilter(typeFilter.filter((t) => t !== type))
                          }
                        />
                      </span>
                    ))}
                  </div>
                )}

                {dateFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                    {dateFilter === "today"
                      ? "Today"
                      : dateFilter === "week"
                      ? "Last 7 Days"
                      : "Last 30 Days"}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-600"
                      onClick={() => setDateFilter(null)}
                    />
                  </span>
                )}

                <button
                  onClick={() => {
                    setStatusFilter(["open", "in_progress"]); // Reset to default
                    setUrgencyFilter([]);
                    setTypeFilter([]);
                    setDateFilter(null);
                  }}
                  className="ml-2 px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Asset Groups */}
          <div className="space-y-4">
            {filteredAssetGroups.map((assetGroup) => (
              <div
                key={assetGroup.assetId}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                {/* Asset Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleAssetExpansion(assetGroup.assetId)}
                >
                  <div className="flex items-center justify-between">
                    {/* Left Section - Asset Info */}
                    <div className="flex items-center gap-3">
                      {/* Expand/Collapse Icon */}
                      {expandedAssets.has(assetGroup.assetId) ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}

                      {/* Asset Icon with Status */}
                      <div className="relative">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <Package className="h-5 w-5 text-gray-600" />
                        </div>
                        {/* Simple status dot */}
                        <div
                          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            assetGroup.criticalIssues > 0
                              ? "bg-red-500"
                              : assetGroup.openIssues > 0
                              ? "bg-orange-500"
                              : "bg-green-500"
                          }`}
                        ></div>
                      </div>

                      {/* Asset Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {assetGroup.assetName}
                          </h3>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {assetGroup.assetType}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">
                            {assetGroup.assetLocation}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Simple Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-gray-900">
                          {assetGroup.totalIssues}
                        </div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>

                      {assetGroup.openIssues > 0 && (
                        <div className="text-center">
                          <div className="font-medium text-orange-600">
                            {assetGroup.openIssues}
                          </div>
                          <div className="text-xs text-gray-500">Open</div>
                        </div>
                      )}

                      {assetGroup.criticalIssues > 0 && (
                        <div className="text-center">
                          <div className="font-medium text-red-600 flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {assetGroup.criticalIssues}
                          </div>
                          <div className="text-xs text-gray-500">Critical</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Groups within Asset */}
                {expandedAssets.has(assetGroup.assetId) && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="p-4 space-y-3">
                      {Object.entries(assetGroup.groups).map(
                        ([groupId, groupData]) => {
                          const groupKey = `${assetGroup.assetId}-${groupId}`;
                          const isGroupExpanded = expandedGroups.has(groupKey);
                          const hasMultipleIssues = groupData.issues.length > 1;
                          const isActualGroup = groupId !== "ungrouped";
                          const showingAll = showAllIssues.has(groupKey);

                          // For individual issues (ungrouped), show them directly without dropdown
                          if (!isActualGroup) {
                            const displayIssues = showingAll
                              ? groupData.issues
                              : groupData.issues.slice(0, 3);
                            const hasMoreIssues = groupData.issues.length > 3;

                            return (
                              <div key={groupKey} className="space-y-3">
                                {/* Individual Issues Heading */}
                                {groupData.issues.length > 0 && (
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-gray-600">
                                      Individual Issues (
                                      {groupData.issues.length})
                                    </h4>
                                  </div>
                                )}

                                {displayIssues.map((issue: Issue) => (
                                  <div
                                    key={issue.id}
                                    className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <AlertTriangle
                                            className={`h-4 w-4 ${
                                              issue.is_critical
                                                ? "text-red-500"
                                                : "text-orange-500"
                                            }`}
                                          />
                                          <h4 className="font-medium text-gray-900 text-sm">
                                            {issue.description}
                                          </h4>
                                          {issue.is_critical && (
                                            <Zap className="h-3 w-3 text-red-500" />
                                          )}
                                        </div>

                                        {/* Image Display */}
                                        <div className="mb-3">
                                          {issue.image_path ? (
                                            <IssueImageDisplay
                                              imagePath={issue.image_path}
                                              alt="Issue attachment"
                                            />
                                          ) : (
                                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs text-gray-500">
                                              <Package className="h-3 w-3" />
                                              <span>No image uploaded</span>
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                          <span
                                            className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                              issue.status
                                            )}`}
                                          >
                                            {issue.status.replace("_", " ")}
                                          </span>
                                          <span
                                            className={`px-2 py-1 rounded text-xs ${getUrgencyColor(
                                              issue.urgency
                                            )}`}
                                          >
                                            {issue.urgency}
                                          </span>
                                          <span className="text-gray-500 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(
                                              issue.reported_at
                                            ).toLocaleDateString()}
                                          </span>
                                          {issue.resolved_at && (
                                            <span className="text-green-600 flex items-center gap-1">
                                              <CheckCircle className="h-3 w-3" />
                                              Resolved{" "}
                                              {new Date(
                                                issue.resolved_at
                                              ).toLocaleDateString()}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 ml-4">
                                        {/* Resolve Button */}
                                        {(issue.status === "open" ||
                                          issue.status === "in_progress") && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleResolveIssue(issue.id);
                                            }}
                                            className="flex items-center gap-1 px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded text-xs transition-colors"
                                          >
                                            <CheckCircle className="h-3 w-3" />
                                            <span>Resolve</span>
                                          </button>
                                        )}

                                        {/* View Details Button */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedIssue(issue);
                                          }}
                                          className="flex items-center gap-1 px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded text-xs transition-colors"
                                        >
                                          <span>Details</span>
                                          <ChevronRight className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Internal Notes Section */}
                                    <div className="mt-3 border-t border-gray-100 pt-3">
                                      <h5 className="text-xs font-medium text-gray-600 mb-2">
                                        Internal Notes
                                      </h5>
                                      {editingNotes === issue.id ? (
                                        <div className="space-y-2">
                                          <textarea
                                            value={notesValue}
                                            onChange={(e) =>
                                              setNotesValue(e.target.value)
                                            }
                                            placeholder="Add internal notes..."
                                            className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                                            rows={2}
                                          />
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() =>
                                                handleSaveNotes(
                                                  issue.id,
                                                  notesValue
                                                )
                                              }
                                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                            >
                                              Save
                                            </button>
                                            <button
                                              onClick={() => {
                                                setEditingNotes(null);
                                                setNotesValue("");
                                              }}
                                              className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div>
                                          {issue.internal_notes ? (
                                            <div className="p-2 bg-yellow-50 rounded border mb-2">
                                              <p className="text-sm text-gray-700">
                                                {issue.internal_notes}
                                              </p>
                                            </div>
                                          ) : (
                                            <div className="p-2 bg-gray-50 rounded mb-2">
                                              <p className="text-xs text-gray-500 italic">
                                                No internal notes
                                              </p>
                                            </div>
                                          )}
                                          <button
                                            onClick={() =>
                                              startEditingNotes(issue)
                                            }
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                          >
                                            {issue.internal_notes
                                              ? "Edit notes"
                                              : "Add internal notes"}
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Metadata Display */}
                                    {issue.metadata?.reporter_location && (
                                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                                        <MapPin className="h-3 w-3" />
                                        <span>
                                          {issue.metadata.reporter_location.latitude.toFixed(
                                            4
                                          )}
                                          ,{" "}
                                          {issue.metadata.reporter_location.longitude.toFixed(
                                            4
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}

                                {/* Load More Button */}
                                {hasMoreIssues && !showingAll && (
                                  <button
                                    onClick={() => {
                                      const newShowAll = new Set(showAllIssues);
                                      newShowAll.add(groupKey);
                                      setShowAllIssues(newShowAll);
                                    }}
                                    className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    Load {groupData.issues.length - 3} more
                                    issues
                                  </button>
                                )}

                                {/* Show Less Button */}
                                {showingAll && hasMoreIssues && (
                                  <button
                                    onClick={() => {
                                      const newShowAll = new Set(showAllIssues);
                                      newShowAll.delete(groupKey);
                                      setShowAllIssues(newShowAll);
                                    }}
                                    className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    Show less
                                  </button>
                                )}
                              </div>
                            );
                          }

                          // Show collapsible group for actual groups (multiple issues with same group_id)
                          return (
                            <div
                              key={groupKey}
                              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                            >
                              {/* Group Header */}
                              <div
                                className="p-3 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
                                onClick={() => toggleGroupExpansion(groupKey)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {isGroupExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-500" />
                                    )}
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4 text-gray-600" />
                                      <span className="font-medium text-gray-900">
                                        {getGroupTitle(groupId, groupData)}
                                      </span>
                                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                        {groupData.issues.length} issues
                                      </span>
                                      {groupData.hasCriticalIssues && (
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded flex items-center gap-1">
                                          <Zap className="h-3 w-3" />
                                          Critical
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {groupData.hasOpenIssues && (
                                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                        Open Issues
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Issues in Group */}
                              {isGroupExpanded && (
                                <div className="border-t border-gray-100">
                                  <div className="p-3 space-y-3">
                                    {groupData.issues.map((issue: Issue) => (
                                      <div
                                        key={issue.id}
                                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                                      >
                                        <div className="flex items-start justify-between mb-3">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                              <AlertTriangle
                                                className={`h-4 w-4 ${
                                                  issue.is_critical
                                                    ? "text-red-500"
                                                    : "text-orange-500"
                                                }`}
                                              />
                                              <h4 className="font-medium text-gray-900 text-sm">
                                                {issue.description}
                                              </h4>
                                              {issue.is_critical && (
                                                <Zap className="h-3 w-3 text-red-500" />
                                              )}
                                            </div>

                                            {/* Image Display */}
                                            <div className="mb-3">
                                              {issue.image_path ? (
                                                <IssueImageDisplay
                                                  imagePath={issue.image_path}
                                                  alt="Issue attachment"
                                                />
                                              ) : (
                                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs text-gray-500">
                                                  <Package className="h-3 w-3" />
                                                  <span>No image uploaded</span>
                                                </div>
                                              )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                              <span
                                                className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                                  issue.status
                                                )}`}
                                              >
                                                {issue.status.replace("_", " ")}
                                              </span>
                                              <span
                                                className={`px-2 py-1 rounded text-xs ${getUrgencyColor(
                                                  issue.urgency
                                                )}`}
                                              >
                                                {issue.urgency}
                                              </span>
                                              <span className="text-gray-500 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(
                                                  issue.reported_at
                                                ).toLocaleDateString()}
                                              </span>
                                              {issue.resolved_at && (
                                                <span className="text-green-600 flex items-center gap-1">
                                                  <CheckCircle className="h-3 w-3" />
                                                  Resolved{" "}
                                                  {new Date(
                                                    issue.resolved_at
                                                  ).toLocaleDateString()}
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2 ml-4">
                                            {/* Resolve Button */}
                                            {(issue.status === "open" ||
                                              issue.status ===
                                                "in_progress") && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleResolveIssue(issue.id);
                                                }}
                                                className="flex items-center gap-1 px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded text-xs transition-colors"
                                              >
                                                <CheckCircle className="h-3 w-3" />
                                                <span>Resolve</span>
                                              </button>
                                            )}

                                            {/* View Details Button */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedIssue(issue);
                                              }}
                                              className="flex items-center gap-1 px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded text-xs transition-colors"
                                            >
                                              <span>Details</span>
                                              <ChevronRight className="h-3 w-3" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredAssetGroups.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No issues found
              </h3>
              <p className="text-gray-500 mb-6">
                {issues.length === 0
                  ? "Get started by reporting your first issue."
                  : "Try adjusting your search or filter criteria."}
              </p>
              <button
                onClick={() => router.push("/issues/new")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Report New Issue</span>
              </button>
            </div>
          )}
        </main>
      </div>

      <IssueDetailModal
        issue={selectedIssue}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onStatusUpdate={handleStatusUpdate}
        onResolveIssue={handleResolveIssue}
        onGroupStatusUpdate={handleGroupStatusUpdate}
        allIssues={issues}
      />
    </div>
  );
}
