import { createClient, getAuthenticatedUser } from "@/utils/supabase/server";
import { DashboardClientLayout } from "@/components/DashboardClientLayout";

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

async function fetchDashboardData(): Promise<{
  stats: DashboardStats;
  issues: Issue[];
}> {
  const supabase = await createClient();
  const user = await getAuthenticatedUser();

  console.log("Starting to fetch dashboard data on server...");
  try {
    // Fetch items with relevant fields
    const { data: itemsData, error: itemsError } = await supabase
      .from("items")
      .select("id, name, status, created_at, type, location, user_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (itemsError) {
      console.error("Error fetching items:", itemsError);
      throw itemsError;
    }

    // Fetch issues with relevant fields
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
      .order("reported_at", { ascending: false });

    if (issuesError) {
      console.error("Error fetching issues:", issuesError);
      throw issuesError;
    }

    // Process items data
    const totalItems = itemsData?.length || 0;
    const activeItems =
      itemsData?.filter((item) => item.status === "active").length || 0;
    const maintenanceNeeded =
      itemsData?.filter((item) => item.status === "maintenance_needed")
        .length || 0;

    // Process issues data
    const totalIssues = issuesData?.length || 0;
    const criticalIssues =
      issuesData?.filter((issue) => issue.is_critical).length || 0;

    const stats: DashboardStats = {
      totalItems,
      totalIssues,
      activeItems,
      maintenanceNeeded,
      criticalIssues,
    };

    console.log(
      `Fetched dashboard data: ${totalItems} items, ${totalIssues} issues`
    );
    return {
      stats,
      issues: issuesData || [],
    };
  } catch (error) {
    console.error(
      "Catch block - Error fetching dashboard data on server:",
      error
    );
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to load dashboard data: ${errorMessage}`);

    // Return empty data on error
    return {
      stats: {
        totalItems: 0,
        totalIssues: 0,
        activeItems: 0,
        maintenanceNeeded: 0,
        criticalIssues: 0,
      },
      issues: [],
    };
  }
}

export async function DashboardDataServer() {
  const { stats, issues } = await fetchDashboardData();
  return <DashboardClientLayout initialStats={stats} initialIssues={issues} />;
}
