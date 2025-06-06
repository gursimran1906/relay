"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";
import { Sidebar } from "@/components/Sidebar";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Package,
  ArrowUp,
  ArrowDown,
  Download,
  Filter,
  ChevronDown,
  Brain,
  MessageSquare,
  Sparkles,
  Search,
  Calendar,
  Clock,
  Users,
  FileText,
  Zap,
  RefreshCw,
} from "lucide-react";
import { Session } from "@supabase/supabase-js";

interface Issue {
  id: number;
  description: string;
  status: string;
  urgency: string;
  reported_at: string;
  updated_at?: string;
  uid: string;
  item_id: number;
  group_id: string | null;
  is_critical: boolean;
  issue_type: string;
  items?: {
    name: string;
    location: string;
  };
}

interface ReportData {
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  criticalIssues: number;
  recentIssues: Issue[];
  issuesByStatus: { status: string; count: number }[];
  issuesByPriority: { priority: string; count: number }[];
  issuesByMonth: { month: string; count: number }[];
}

interface ReportsClientLayoutProps {
  initialSession: Session;
  initialReportData: ReportData;
}

interface AISummary {
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  loading: boolean;
}

export function ReportsClientLayout({
  initialSession,
  initialReportData,
}: ReportsClientLayoutProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [reportData, setReportData] = useState(initialReportData);
  const [timeRange, setTimeRange] = useState("30d");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  // AI Features State
  const [aiSummary, setAiSummary] = useState<AISummary>({
    summary: "",
    keyInsights: [],
    recommendations: [],
    loading: false,
  });
  const [nlQuery, setNlQuery] = useState("");
  const [nlResults, setNlResults] = useState<Issue[]>([]);
  const [nlLoading, setNlLoading] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const nlInputRef = useRef<HTMLInputElement>(null);

  // Generate AI Summary with faster streaming
  const generateAISummary = async () => {
    setAiSummary((prev) => ({
      ...prev,
      loading: true,
      summary: "",
      keyInsights: [],
      recommendations: [],
    }));

    try {
      const response = await fetch("/api/ai/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportData,
          timeRange,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI summary");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let isShowingText = false;

      // Process streaming response with faster updates
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines (SSE format: "data: {...}\n\n")
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)); // Remove "data: " prefix

              if (data.type === "chunk") {
                // Show real-time text streaming word by word
                if (!isShowingText) {
                  isShowingText = true;
                }
                setAiSummary((prev) => ({
                  ...prev,
                  summary: data.accumulated || prev.summary,
                }));
              } else if (data.type === "complete") {
                // Final parsed response received
                setAiSummary({
                  summary: data.data.summary,
                  keyInsights: data.data.keyInsights || [],
                  recommendations: data.data.recommendations || [],
                  loading: false,
                });
                toast.success("AI summary generated successfully");
                return; // Exit function
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error("Error parsing SSE data:", parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating AI summary:", error);
      toast.error("Failed to generate AI summary");
      setAiSummary((prev) => ({ ...prev, loading: false }));
    }
  };

  // Natural Language Query
  const handleNLQuery = async () => {
    if (!nlQuery.trim()) {
      toast.error("Please enter a query");
      return;
    }

    setNlLoading(true);

    try {
      const response = await fetch("/api/ai/natural-language-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: nlQuery,
          userId: initialSession.user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process natural language query");
      }

      const data = await response.json();
      setNlResults(data.results);

      toast.success(`Found ${data.results.length} results`);
    } catch (error) {
      console.error("Error processing NL query:", error);
      toast.error("Failed to process query");
    } finally {
      setNlLoading(false);
    }
  };

  // Export Report
  const exportReport = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reports/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportData,
          timeRange,
          aiSummary: aiSummary.summary ? aiSummary : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to export report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relay-report-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-orange-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                AI-Powered Reports
              </h1>
              <p className="text-gray-600">
                Analytics and insights for your asset management
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-5 w-5 text-gray-600" />
                <span>Filters</span>
                <ChevronDown
                  className={`h-5 w-5 text-gray-600 transition-transform ${
                    showFilters ? "transform rotate-180" : ""
                  }`}
                />
              </button>
              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Brain className="h-5 w-5" />
                <span>AI Assistant</span>
              </button>
              <button
                onClick={exportReport}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Download className="h-5 w-5" />
                <span>{loading ? "Exporting..." : "Export Report"}</span>
              </button>
            </div>
          </div>

          {/* AI Assistant Panel */}
          {showAIPanel && (
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-purple-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  AI Assistant
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Summary */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Issue Summary
                    </h3>
                    <button
                      onClick={generateAISummary}
                      disabled={aiSummary.loading}
                      className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      {aiSummary.loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Brain className="h-4 w-4" />
                      )}
                      {aiSummary.loading ? "Generating..." : "Generate Summary"}
                    </button>
                  </div>

                  {(aiSummary.summary || aiSummary.loading) && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      {aiSummary.loading && !aiSummary.summary && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span className="text-sm">
                              Analyzing your data...
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-700">
                              AI is thinking
                            </span>
                            <span className="flex gap-1">
                              <span className="w-1 h-1 bg-purple-600 rounded-full animate-bounce"></span>
                              <span
                                className="w-1 h-1 bg-purple-600 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></span>
                              <span
                                className="w-1 h-1 bg-purple-600 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></span>
                            </span>
                          </div>
                        </div>
                      )}

                      {aiSummary.summary && (
                        <div className="text-gray-700 mb-4">
                          <span>{aiSummary.summary}</span>
                          {aiSummary.loading && (
                            <span className="inline-block w-0.5 h-5 bg-purple-600 ml-1 animate-pulse"></span>
                          )}
                        </div>
                      )}

                      {aiSummary.keyInsights.length > 0 &&
                        !aiSummary.loading && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">
                              Key Insights:
                            </h4>
                            <ul className="space-y-1">
                              {aiSummary.keyInsights.map((insight, index) => (
                                <li
                                  key={index}
                                  className="text-sm text-gray-600 flex items-start gap-2"
                                >
                                  <Zap className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                  {insight}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {aiSummary.recommendations.length > 0 &&
                        !aiSummary.loading && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">
                              Recommendations:
                            </h4>
                            <ul className="space-y-1">
                              {aiSummary.recommendations.map((rec, index) => (
                                <li
                                  key={index}
                                  className="text-sm text-gray-600 flex items-start gap-2"
                                >
                                  <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Natural Language Query */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Ask Questions
                  </h3>
                  <div className="flex gap-2">
                    <input
                      ref={nlInputRef}
                      type="text"
                      value={nlQuery}
                      onChange={(e) => setNlQuery(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleNLQuery()}
                      placeholder="e.g., Show me all critical issues from last week"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleNLQuery}
                      disabled={nlLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      {nlLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {nlResults.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Query Results ({nlResults.length})
                      </h4>
                      <div className="space-y-2">
                        {nlResults.map((issue) => (
                          <div
                            key={issue.id}
                            className="bg-white rounded-lg p-3 border border-blue-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900 text-sm">
                                  {issue.description.substring(0, 80)}
                                  {issue.description.length > 80 ? "..." : ""}
                                </h5>
                                <p className="text-xs text-gray-500 mt-1">
                                  {issue.items?.name} - {issue.items?.location}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(
                                      issue.reported_at
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    issue.status
                                  )}`}
                                >
                                  {issue.status}
                                </span>
                                <div
                                  className={`w-3 h-3 rounded-full ${getUrgencyColor(
                                    issue.urgency
                                  )}`}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Time Range Filter */}
          {showFilters && (
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Time Range
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: "7d", label: "Last 7 days" },
                  { value: "30d", label: "Last 30 days" },
                  { value: "90d", label: "Last 3 months" },
                  { value: "1y", label: "Last year" },
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === range.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                  <ArrowUp className="h-4 w-4" />
                  12%
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {reportData.totalIssues}
              </h3>
              <p className="text-sm text-gray-600">Total Issues</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-red-600 flex items-center gap-1">
                  <ArrowUp className="h-4 w-4" />
                  5%
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {reportData.openIssues}
              </h3>
              <p className="text-sm text-gray-600">Open Issues</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                  <ArrowUp className="h-4 w-4" />
                  15%
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {reportData.resolvedIssues}
              </h3>
              <p className="text-sm text-gray-600">Resolved Issues</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-50 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-red-600" />
                </div>
                <span className="text-sm font-medium text-red-600 flex items-center gap-1">
                  <ArrowDown className="h-4 w-4" />
                  3%
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {reportData.criticalIssues}
              </h3>
              <p className="text-sm text-gray-600">Critical Issues</p>
            </div>
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Issues by Status */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Issues by Status
              </h2>
              <div className="space-y-4">
                {reportData.issuesByStatus.map(({ status, count }) => (
                  <div
                    key={status}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-gray-600 capitalize">
                      {status.replace("_", " ")}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              reportData.totalIssues > 0
                                ? (count / reportData.totalIssues) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Issues by Priority */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Issues by Priority
              </h2>
              <div className="space-y-4">
                {reportData.issuesByPriority.map(({ priority, count }) => (
                  <div
                    key={priority}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-gray-600 capitalize">
                      {priority}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${getUrgencyColor(
                            priority
                          )}`}
                          style={{
                            width: `${
                              reportData.totalIssues > 0
                                ? (count / reportData.totalIssues) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Issues Trend */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Issues Trend (Last 6 Months)
            </h2>
            <div className="flex items-end justify-between h-64 gap-4">
              {reportData.issuesByMonth.map(({ month, count }, index) => {
                const maxCount = Math.max(
                  ...reportData.issuesByMonth.map((m) => m.count)
                );
                const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

                return (
                  <div
                    key={`${month}-${index}`}
                    className="flex flex-col items-center flex-1"
                  >
                    <div className="w-full flex items-end justify-center mb-2">
                      <div
                        className="bg-blue-600 rounded-t-lg transition-all duration-300 w-full max-w-12"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 text-center">
                      {month}
                    </span>
                    <span className="text-xs font-medium text-gray-900">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Issues */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Issues
              </h2>
              <button
                onClick={() => router.push("/issues")}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Issues
              </button>
            </div>
            <div className="space-y-4">
              {reportData.recentIssues.slice(0, 5).map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {issue.description.substring(0, 80)}
                      {issue.description.length > 80 ? "..." : ""}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {issue.items?.name} - {issue.items?.location}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(issue.reported_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        issue.status
                      )}`}
                    >
                      {issue.status}
                    </span>
                    <div
                      className={`w-3 h-3 rounded-full ${getUrgencyColor(
                        issue.urgency
                      )}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
