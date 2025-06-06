import { NextResponse } from "next/server";
import { createClient, getAuthenticatedUser } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser();

    // Fetch active items count
    const { count: activeItemsCount, error: itemsError } = await supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active");

    if (itemsError) {
      console.error("Error fetching active items count:", itemsError);
      throw itemsError;
    }

    // Fetch open issues count (including in_progress)
    const { count: openIssuesCount, error: openIssuesError } = await supabase
      .from("issues")
      .select("*, items!inner(user_id)", { count: "exact", head: true })
      .eq("items.user_id", user.id)
      .in("status", ["open", "in_progress"]);

    if (openIssuesError) {
      console.error("Error fetching open issues count:", openIssuesError);
      throw openIssuesError;
    }

    // Fetch critical alerts count
    const { count: criticalAlertsCount, error: criticalError } = await supabase
      .from("issues")
      .select("*, items!inner(user_id)", { count: "exact", head: true })
      .eq("items.user_id", user.id)
      .eq("is_critical", true)
      .in("status", ["open", "in_progress"]);

    if (criticalError) {
      console.error("Error fetching critical alerts count:", criticalError);
      throw criticalError;
    }

    return NextResponse.json({
      activeItems: activeItemsCount || 0,
      openIssues: openIssuesCount || 0,
      criticalAlerts: criticalAlertsCount || 0,
    });
  } catch (error) {
    console.error("Error fetching sidebar stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch sidebar statistics" },
      { status: 500 }
    );
  }
}
