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

    // Fetch item types - system types (org_id is null) + user's org types
    const { data: itemTypes, error } = await supabase
      .from("item_types")
      .select("*")
      .eq("is_active", true)
      .or(`org_id.is.null,org_id.eq.${userOrgId}`)
      .order("name");

    if (error) {
      console.error("Error fetching item types:", error);
      throw error;
    }

    return NextResponse.json({ itemTypes: itemTypes || [] });
  } catch (error) {
    console.error("Error in item-types GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch item types" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser();
    const body = await request.json();

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

    const { name, description, category, icon, isCustom = true } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Create new item type
    const { data: newItemType, error } = await supabase
      .from("item_types")
      .insert({
        name,
        description,
        category,
        icon,
        org_id: userOrgId,
        is_custom: isCustom,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating item type:", error);
      throw error;
    }

    return NextResponse.json({ itemType: newItemType });
  } catch (error) {
    console.error("Error in item-types POST:", error);
    return NextResponse.json(
      { error: "Failed to create item type" },
      { status: 500 }
    );
  }
}
