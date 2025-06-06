import { NextResponse } from "next/server";
import { createClient, getAuthenticatedUser } from "@/utils/supabase/server";

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

    const { itemTypeId } = body;

    if (!itemTypeId) {
      return NextResponse.json(
        { error: "Item type ID is required" },
        { status: 400 }
      );
    }

    // Get the original item type
    const { data: originalType, error: fetchError } = await supabase
      .from("item_types")
      .select("*")
      .eq("id", itemTypeId)
      .eq("org_id", null) // Only allow adopting system types
      .single();

    if (fetchError || !originalType) {
      return NextResponse.json(
        { error: "System item type not found" },
        { status: 404 }
      );
    }

    // Check if already adopted
    const { data: existingAdoption, error: checkError } = await supabase
      .from("item_types")
      .select("id")
      .eq("name", originalType.name)
      .eq("org_id", userOrgId)
      .eq("is_custom", false)
      .single();

    if (existingAdoption) {
      return NextResponse.json(
        { error: "Item type already adopted" },
        { status: 409 }
      );
    }

    // Create adopted copy
    const { data: adoptedType, error: adoptError } = await supabase
      .from("item_types")
      .insert({
        name: originalType.name,
        description: originalType.description,
        category: originalType.category,
        icon: originalType.icon,
        org_id: userOrgId,
        is_custom: false, // Adopted from system
        created_by: user.id,
      })
      .select()
      .single();

    if (adoptError) {
      console.error("Error adopting item type:", adoptError);
      throw adoptError;
    }

    return NextResponse.json({ itemType: adoptedType });
  } catch (error) {
    console.error("Error in item-types adopt:", error);
    return NextResponse.json(
      { error: "Failed to adopt item type" },
      { status: 500 }
    );
  }
}
