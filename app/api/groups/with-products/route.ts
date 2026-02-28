import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { groups, products } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const allGroups = await db.query.groups.findMany({
      where: eq(groups.active, true),
      orderBy: [desc(groups.sortOrder)],
    });

    const allProducts = await db.query.products.findMany({
      where: eq(products.active, true),
    });

    const groupsWithProducts = allGroups.map(group => ({
      ...group,
      products: allProducts.filter(p => p.groupId === group.id)
    }));

    return NextResponse.json(groupsWithProducts);
  } catch (error) {
    console.error("Error fetching groups with products:", error);
    return NextResponse.json(
      { error: "Error fetching groups with products" },
      { status: 500 }
    );
  }
}
