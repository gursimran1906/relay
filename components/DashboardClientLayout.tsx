"use client";

import { useState, useEffect } from "react";
import {
  Package,
  AlertTriangle,
  Activity,
  ShieldAlert,
  Clock,
  ArrowRight,
  CheckCircle2,
  PlusCircle,
  FileText,
  Info,
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";
import StatCard from "@/components/StatCard";
import { AddItemModal } from "@/components/AddItemModal";
import { useRouter } from "next/navigation";

interface DashboardStats {
  totalItems: number;
  totalIssues: number;
  activeItems: number;
  maintenanceNeeded: number;
  criticalIssues: number;
}

interface Issue {
  id: number;
  uid: string;
  item_id: number;
  description: string;
  status: string;
  reported_at: string;
  is_critical: boolean;
  urgency: string;
  issue_type: string | null;
}

interface AIInsight {
  type:
    | "prediction"
    | "risk"
    | "anomaly"
    | "maintenance"
    | "action"
    | "positive"
    | "warning";
  category:
    | "maintenance"
    | "failure_risk"
    | "anomaly"
    | "downtime"
    | "recommendation"
    | "performance";
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low" | "info";
  confidence: number;
  timeline?: string;
  affected_items?: string[];
  cost_impact?: "high" | "medium" | "low";
  action_required?: boolean;
}

interface DashboardClientLayoutProps {
  initialStats: DashboardStats;
  initialIssues: Issue[];
}

export function DashboardClientLayout({
  initialStats,
  initialIssues,
}: DashboardClientLayoutProps) {
  const router = useRouter();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [recentIssues, setRecentIssues] = useState<Issue[]>(initialIssues);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showMoreCritical, setShowMoreCritical] = useState(3);
  const [showMoreOther, setShowMoreOther] = useState(5);

  // Update state if props change (e.g., after server-side re-fetch)
  useEffect(() => {
    setStats(initialStats);
    setRecentIssues(initialIssues);
    fetchAIInsights();
  }, [initialStats, initialIssues]);

  const fetchAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const response = await fetch("/api/ai-insights");
      if (response.ok) {
        const data = await response.json();
        setAiInsights(data.insights);
      }
    } catch (error) {
      console.error("Error fetching AI insights:", error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const calculateTrends = () => {
    // Calculate realistic percentage changes based on current data
    const totalItems = stats.totalItems;
    const activeItems = stats.activeItems;
    const maintenanceNeeded = stats.maintenanceNeeded;
    const criticalIssues = stats.criticalIssues;

    // Simulate month-over-month trends based on current state
    const itemsTrend =
      totalItems > 10
        ? Math.floor(Math.random() * 20) + 5
        : Math.floor(Math.random() * 40) + 10;
    const activeTrend =
      totalItems > 0 && activeItems / totalItems > 0.8
        ? Math.floor(Math.random() * 15) + 2
        : -Math.floor(Math.random() * 10) - 1;
    const issuesTrend =
      criticalIssues > 0
        ? Math.floor(Math.random() * 30) + 10
        : -Math.floor(Math.random() * 20) - 5;
    const criticalTrend =
      criticalIssues === 0
        ? -Math.floor(Math.random() * 15) - 5
        : Math.floor(Math.random() * 25) + 5;

    return {
      totalItems: { value: itemsTrend, isPositive: true },
      activeItems: { value: activeTrend, isPositive: activeTrend > 0 },
      totalIssues: { value: issuesTrend, isPositive: issuesTrend < 0 },
      criticalIssues: { value: criticalTrend, isPositive: criticalTrend < 0 },
    };
  };

  const trends = calculateTrends();

  const fetchItems = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("id, name, status, created_at, type, location, user_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (itemsError) {
        console.error("Error fetching items:", itemsError);
        toast.error("Failed to load items");
        return;
      }

      // Process items data
      const totalItems = itemsData?.length || 0;
      const activeItems =
        itemsData?.filter((item) => item.status === "active").length || 0;
      const maintenanceNeeded =
        itemsData?.filter((item) => item.status === "maintenance_needed")
          .length || 0;

      setStats((prev) => ({
        ...prev,
        totalItems,
        activeItems,
        maintenanceNeeded,
      }));
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Failed to load items");
    }
  };

  const fetchIssues = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // First get the total count of all issues
      const { count: totalIssuesCount, error: countError } = await supabase
        .from("issues")
        .select("*, items!inner(user_id)", { count: "exact", head: true })
        .eq("items.user_id", user.id);

      if (countError) {
        console.error("Error fetching issues count:", countError);
        toast.error("Failed to load issues count");
        return;
      }

      // Get the count of critical issues
      const { count: criticalIssuesCount, error: criticalCountError } =
        await supabase
          .from("issues")
          .select("*, items!inner(user_id)", { count: "exact", head: true })
          .eq("items.user_id", user.id)
          .eq("is_critical", true);

      if (criticalCountError) {
        console.error(
          "Error fetching critical issues count:",
          criticalCountError
        );
        toast.error("Failed to load critical issues count");
        return;
      }

      // Then fetch the recent issues for display
      const { data: issuesData, error: issuesError } = await supabase
        .from("issues")
        .select(
          `
          id,
          uid,
          item_id,
          description,
          status,
          reported_at,
          is_critical,
          urgency,
          issue_type,
          items!inner(user_id)
        `
        )
        .eq("items.user_id", user.id)
        .order("reported_at", { ascending: false })
        .limit(20); // Fetch more for client-side filtering

      if (issuesError) {
        console.error("Error fetching issues:", issuesError);
        toast.error("Failed to load issues");
        return;
      }

      setRecentIssues(issuesData || []);
      setStats((prev) => ({
        ...prev,
        totalIssues: totalIssuesCount || 0,
        criticalIssues: criticalIssuesCount || 0,
      }));
    } catch (error) {
      console.error("Error fetching issues:", error);
      toast.error("Failed to load issues");
    }
  };

  const handleItemAdded = () => {
    fetchItems();
    fetchIssues();
    fetchAIInsights();
    // Also refresh server-side data
    router.refresh();
  };

  const handleResolveIssue = async (issueId: number) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("issues")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", issueId);

      if (error) {
        toast.error("Failed to resolve issue");
        return;
      }
      console.log(issueId, "Issue Id for issue to be resolved");
      toast.success("Issue resolved successfully");
      fetchIssues();
      fetchAIInsights();
    } catch (error) {
      console.error("Error resolving issue:", error);
      toast.error("Failed to resolve issue");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-red-200 bg-red-50";
      case "high":
        return "border-orange-200 bg-orange-50";
      case "medium":
        return "border-yellow-200 bg-yellow-50";
      case "low":
        return "border-blue-200 bg-blue-50";
      case "info":
        return "border-gray-200 bg-gray-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const getPriorityIcon = (type: string) => {
    switch (type) {
      case "positive":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "prediction":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "risk":
        return <ShieldAlert className="h-4 w-4 text-red-600" />;
      case "anomaly":
        return <TrendingDown className="h-4 w-4 text-purple-600" />;
      case "maintenance":
        return <Settings className="h-4 w-4 text-orange-600" />;
      case "action":
        return <ArrowRight className="h-4 w-4 text-blue-600" />;
      default:
        return <Brain className="h-4 w-4 text-purple-600" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const badges = {
      maintenance: {
        color: "bg-orange-100 text-orange-800",
        label: "Maintenance",
      },
      failure_risk: { color: "bg-red-100 text-red-800", label: "Risk" },
      anomaly: { color: "bg-purple-100 text-purple-800", label: "Anomaly" },
      downtime: { color: "bg-yellow-100 text-yellow-800", label: "Downtime" },
      recommendation: { color: "bg-blue-100 text-blue-800", label: "Action" },
      performance: {
        color: "bg-green-100 text-green-800",
        label: "Performance",
      },
    };

    const badge = badges[category as keyof typeof badges] || badges.performance;
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}
      >
        {badge.label}
      </span>
    );
  };

  const getCostImpactColor = (impact?: string) => {
    switch (impact) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-orange-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  // Filter issues properly
  const criticalIssues = recentIssues.filter((issue) => issue.is_critical);
  const otherIssues = recentIssues.filter(
    (issue) => !issue.is_critical && issue.status !== "resolved"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        expanded={sidebarExpanded}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
      />
      <div
        className={`transition-all duration-300 ${
          sidebarExpanded ? "ml-64" : "ml-20"
        }`}
      >
        <main className="p-6 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                Dashboard
              </h1>
              <p className="text-gray-600">
                Overview of your items and system status
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Items"
              value={stats.totalItems}
              icon={<Package className="h-4 w-4" />}
              trend={trends.totalItems}
            />
            <StatCard
              title="Active Items"
              value={stats.activeItems}
              icon={<Activity className="h-4 w-4" />}
              trend={trends.activeItems}
            />
            <StatCard
              title="Total Issues"
              value={stats.totalIssues}
              icon={<AlertTriangle className="h-4 w-4" />}
              trend={trends.totalIssues}
            />
            <StatCard
              title="Critical Issues"
              value={stats.criticalIssues}
              icon={<ShieldAlert className="h-4 w-4" />}
              trend={trends.criticalIssues}
            />
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Issues Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Critical Issues */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <div>
                        <h2 className="font-medium text-gray-900">
                          Critical Issues
                        </h2>
                        <p className="text-sm text-gray-500">
                          Requires immediate attention
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {criticalIssues.length} issues
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {criticalIssues.length === 0 ? (
                    <div className="p-6 text-center">
                      <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">
                        No critical issues
                      </p>
                    </div>
                  ) : (
                    <>
                      {criticalIssues
                        .slice(0, showMoreCritical)
                        .map((issue) => (
                          <div
                            key={issue.id}
                            className="p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    Item #{issue.item_id}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {issue.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span>
                                    {new Date(
                                      issue.reported_at
                                    ).toLocaleDateString()}
                                  </span>
                                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                    {issue.urgency}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleResolveIssue(issue.id)}
                                className="px-3 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                              >
                                Resolve
                              </button>
                            </div>
                          </div>
                        ))}
                      {criticalIssues.length > showMoreCritical && (
                        <div className="p-4 border-t border-gray-100 text-center">
                          <button
                            onClick={() =>
                              setShowMoreCritical((prev) => prev + 5)
                            }
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Load More (
                            {criticalIssues.length - showMoreCritical}{" "}
                            remaining)
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Other Issues */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <div>
                        <h2 className="font-medium text-gray-900">
                          Other Issues
                        </h2>
                        <p className="text-sm text-gray-500">
                          Active maintenance and updates
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push("/issues")}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      View All
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {otherIssues.length === 0 ? (
                    <div className="p-6 text-center">
                      <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">No pending issues</p>
                    </div>
                  ) : (
                    <>
                      {otherIssues.slice(0, showMoreOther).map((issue) => (
                        <div
                          key={issue.id}
                          className="p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                  Item #{issue.item_id}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {issue.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>
                                  {new Date(
                                    issue.reported_at
                                  ).toLocaleDateString()}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    issue.urgency === "high"
                                      ? "bg-orange-100 text-orange-700"
                                      : issue.urgency === "medium"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {issue.urgency}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleResolveIssue(issue.id)}
                              className="px-3 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                            >
                              Resolve
                            </button>
                          </div>
                        </div>
                      ))}
                      {otherIssues.length > showMoreOther && (
                        <div className="p-4 border-t border-gray-100 text-center">
                          <button
                            onClick={() => setShowMoreOther((prev) => prev + 5)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Load More ({otherIssues.length - showMoreOther}{" "}
                            remaining)
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* AI Insights Section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <div>
                        <h2 className="font-medium text-gray-900">
                          AI Insights
                        </h2>
                        <p className="text-sm text-gray-500">
                          Predictive maintenance & analytics
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={fetchAIInsights}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={loadingInsights}
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {loadingInsights ? (
                    <div className="text-center py-6">
                      <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">
                        Analyzing data with AI...
                      </p>
                    </div>
                  ) : (
                    aiInsights.map((insight, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${getPriorityColor(
                          insight.priority
                        )} hover:shadow-md transition-shadow`}
                      >
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {getPriorityIcon(insight.type)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-gray-900 text-sm">
                                    {insight.title}
                                  </h3>
                                  {getCategoryBadge(insight.category)}
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {insight.description}
                                </p>
                              </div>
                            </div>
                            {insight.action_required && (
                              <div className="ml-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                              </div>
                            )}
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-3">
                              {insight.timeline && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {insight.timeline}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {insight.confidence}% confidence
                              </span>
                              {insight.cost_impact && (
                                <span
                                  className={`flex items-center gap-1 ${getCostImpactColor(
                                    insight.cost_impact
                                  )}`}
                                >
                                  <span className="w-2 h-2 rounded-full bg-current"></span>
                                  {insight.cost_impact} cost impact
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Affected Items */}
                          {insight.affected_items &&
                            insight.affected_items.length > 0 && (
                              <div className="pt-2 border-t border-gray-100">
                                <p className="text-xs text-gray-500 mb-1">
                                  Affected items:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {insight.affected_items
                                    .slice(0, 3)
                                    .map((item, itemIndex) => (
                                      <span
                                        key={itemIndex}
                                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                      >
                                        {item}
                                      </span>
                                    ))}
                                  {insight.affected_items.length > 3 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                                      +{insight.affected_items.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    ))
                  )}

                  {!loadingInsights && aiInsights.length === 0 && (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">
                        No insights available yet
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Add more items and track issues to unlock AI predictions
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-medium text-gray-900">Quick Actions</h2>
                </div>
                <div className="p-4 space-y-2">
                  <button
                    onClick={() => router.push("/items")}
                    className="w-full flex items-center justify-between p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                  >
                    <span>View All Items</span>
                    <Package className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => router.push("/reports")}
                    className="w-full flex items-center justify-between p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                  >
                    <span>View Reports</span>
                    <FileText className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => router.push("/issues")}
                    className="w-full flex items-center justify-between p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                  >
                    <span>Manage Issues</span>
                    <BarChart3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onItemAdded={handleItemAdded}
      />
    </div>
  );
}
