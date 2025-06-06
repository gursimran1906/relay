import { createClient, getAuthenticatedUser } from "@/utils/supabase/server";
import { ReportsClientLayout } from "@/components/ReportsClientLayout";

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

export default async function ReportsPage() {
  const supabase = await createClient();

  // Get the authenticated user (middleware ensures user is authenticated)
  const user = await getAuthenticatedUser();

  // Fetch comprehensive report data
  const fetchReportData = async (): Promise<ReportData> => {
    try {
      const userId = user.id;

      // Get all issues for the user
      const { data: allIssues, error: issuesError } = await supabase
        .from("issues")
        .select(
          `
          *,
          items!inner (
            name,
            location,
            user_id
          )
        `
        )
        .eq("items.user_id", user.id)
        .order("reported_at", { ascending: false });

      if (issuesError) {
        console.error("Error fetching issues:", issuesError);
        throw issuesError;
      }

      const issues = allIssues || [];

      // Calculate metrics
      const totalIssues = issues.length;
      const openIssues = issues.filter(
        (issue) => issue.status === "open" || issue.status === "in_progress"
      ).length;
      const resolvedIssues = issues.filter(
        (issue) => issue.status === "resolved"
      ).length;
      const criticalIssues = issues.filter((issue) => issue.is_critical).length;

      // Get recent issues (last 10)
      const recentIssues = issues.slice(0, 10);

      // Group by status
      const statusCounts = issues.reduce((acc, issue) => {
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const issuesByStatus = Object.entries(statusCounts).map(
        ([status, count]) => ({
          status,
          count: count as number,
        })
      );

      // Group by priority
      const priorityCounts = issues.reduce((acc, issue) => {
        acc[issue.urgency] = (acc[issue.urgency] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const issuesByPriority = Object.entries(priorityCounts).map(
        ([priority, count]) => ({
          priority,
          count: count as number,
        })
      );

      // Group by month (last 6 months)
      const monthCounts = issues.reduce((acc, issue) => {
        const date = new Date(issue.reported_at);
        const monthKey = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        });
        acc[monthKey] = (acc[monthKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get last 6 months
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        });
        last6Months.push({
          month: monthKey,
          count: monthCounts[monthKey] || 0,
        });
      }

      return {
        totalIssues,
        openIssues,
        resolvedIssues,
        criticalIssues,
        recentIssues,
        issuesByStatus,
        issuesByPriority,
        issuesByMonth: last6Months,
      };
    } catch (error) {
      console.error("Error fetching report data:", error);
      // Return empty data structure
      return {
        totalIssues: 0,
        openIssues: 0,
        resolvedIssues: 0,
        criticalIssues: 0,
        recentIssues: [],
        issuesByStatus: [],
        issuesByPriority: [],
        issuesByMonth: [],
      };
    }
  };

  const reportData = await fetchReportData();

  // Create session object for client component
  const session = {
    user,
    access_token: "",
    refresh_token: "",
    expires_in: 0,
    expires_at: 0,
    token_type: "bearer",
  };

  return (
    <ReportsClientLayout
      initialSession={session}
      initialReportData={reportData}
    />
  );
}
