import { createClient, getAuthenticatedUser } from "@/utils/supabase/server";
import { ItemsClientLayout } from "@/components/ItemsClientLayout";

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

async function fetchItems(): Promise<Item[]> {
  const supabase = await createClient();
  const user = await getAuthenticatedUser();

  console.log("Starting to fetch items on server...");
  try {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error details:", error);
      throw error;
    }
    console.log(`Fetched ${data?.length || 0} items from server.`);
    return data || [];
  } catch (error) {
    console.error("Catch block - Error fetching items on server:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to load items: ${errorMessage}`);
    return [];
  }
}

export async function ItemsDataServer() {
  const initialItems = await fetchItems();
  return <ItemsClientLayout initialItems={initialItems} />;
}
