import { NextResponse } from "next/server";
import { createClient, getAuthenticatedUser } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser();

    // Get user's org_id from org_members table
    const { data: membership, error: membershipError } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (membershipError) {
      console.error("Error fetching user membership:", membershipError);
      throw membershipError;
    }

    const userOrgId = membership?.org_id;

    if (!userOrgId) {
      return NextResponse.json(
        { error: "User is not a member of any organization" },
        { status: 400 }
      );
    }

    // Fetch system item types (org_id is null)
    const { data: systemTypes, error: systemError } = await supabase
      .from("item_types")
      .select("*")
      .eq("is_active", true)
      .is("org_id", null)
      .order("name");

    if (systemError) {
      console.error("Error fetching system item types:", systemError);
      throw systemError;
    }

    // Fetch adopted types for this org to filter them out
    const { data: adoptedTypes, error: adoptedError } = await supabase
      .from("item_types")
      .select("name")
      .eq("org_id", userOrgId)
      .eq("is_custom", false);

    if (adoptedError) {
      console.error("Error fetching adopted types:", adoptedError);
      throw adoptedError;
    }

    // Filter out already adopted types
    const adoptedNames = new Set(adoptedTypes?.map((t) => t.name) || []);
    const availableSystemTypes =
      systemTypes?.filter((type) => !adoptedNames.has(type.name)) || [];

    return NextResponse.json({ systemTypes: availableSystemTypes });
  } catch (error) {
    console.error("Error in system item-types GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch system item types" },
      { status: 500 }
    );
  }
}
