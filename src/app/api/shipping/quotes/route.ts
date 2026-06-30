import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { storeIds, governorateId } = (await req.json()) as {
      storeIds: string[];
      governorateId: string;
    };

    if (!storeIds?.length || !governorateId) {
      return NextResponse.json(
        { error: "Missing storeIds or governorateId" },
        { status: 400 }
      );
    }

    const uniqueStoreIds = [...new Set(storeIds)];
    const quotes: Record<string, number> = {};

    // Use Promise.all to fetch quotes in parallel for better performance
    const fetchPromises = uniqueStoreIds.map(async (storeId) => {
      const { data, error } = await supabase.rpc("resolve_store_shipping_price", {
        p_store_id: storeId,
        p_governorate_id: governorateId,
      });

      if (error) {
        throw new Error(`Failed to resolve shipping for store ${storeId}: ${error.message}`);
      }
      
      quotes[storeId] = Number(data || 0);
    });

    await Promise.all(fetchPromises);

    return NextResponse.json({ quotes });
  } catch (error: any) {
    console.error("Shipping Quotes API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
