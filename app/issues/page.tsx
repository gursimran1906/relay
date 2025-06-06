"use server";
import { createClient, getAuthenticatedUser } from "@/utils/supabase/server";
import { IssuesClientLayout } from "@/components/IssuesClientLayout";

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
    [key: string]: any;
  };
  items: {
    name: string;
    type: string;
    location: string;
  };
}

export default async function IssuesPage() {
  const supabase = await createClient();

  // Get the authenticated user (middleware ensures user is authenticated)
  const user = await getAuthenticatedUser();

  const fetchIssues = async (): Promise<Issue[]> => {
    console.log("Starting to fetch issues on server...");
    try {
      const { data, error } = await supabase
        .from("issues")
        .select(
          `
          id,
          uid,
          item_id,
          description,
          status,
          reported_at,
          resolved_at,
          reported_by,
          contact_info,
          internal_notes,
          is_critical,
          urgency,
          issue_type,
          group_id,
          image_path,
          tags,
          metadata,
          items(name, type, location, user_id)
        `
        )
        .eq("items.user_id", user.id)
        .order("reported_at", { ascending: false });

      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }

      // Transform the data to match the Issue interface
      const transformedIssues: Issue[] = (data || []).map((issue: any) => ({
        id: issue.id,
        uid: issue.uid,
        item_id: issue.item_id,
        description: issue.description,
        status: issue.status,
        reported_at: issue.reported_at,
        resolved_at: issue.resolved_at,
        reported_by: issue.reported_by,
        contact_info: issue.contact_info,
        internal_notes: issue.internal_notes,
        is_critical: issue.is_critical,
        urgency: issue.urgency,
        issue_type: issue.issue_type,
        group_id: issue.group_id,
        image_path: issue.image_path,
        tags: issue.tags,
        metadata: issue.metadata,
        items: {
          name: issue.items.name,
          type: issue.items.type,
          location: issue.items.location,
        },
      }));

      console.log(`Fetched ${transformedIssues.length} issues from server.`);
      return transformedIssues;
    } catch (error) {
      console.error("Catch block - Error fetching issues on server:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Failed to load issues: ${errorMessage}`);
      return [];
    }
  };

  const initialIssues = await fetchIssues();

  return <IssuesClientLayout initialIssues={initialIssues} />;
}
