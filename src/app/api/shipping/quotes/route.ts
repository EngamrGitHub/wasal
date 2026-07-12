import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

// In-memory cache: key = storeId:governorateId, value = { price, expiresAt }
const shippingCache = new Map<string, { price: number; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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
    const storeIdsToFetch: string[] = [];

    // Check cache first
    for (const storeId of uniqueStoreIds) {
      const cacheKey = `${storeId}:${governorateId}`;
      const cached = shippingCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        quotes[storeId] = cached.price;
      } else {
        storeIdsToFetch.push(storeId);
      }
    }

    // Fetch only uncached stores in parallel
    const fetchPromises = storeIdsToFetch.map(async (storeId) => {
      const { data, error } = await supabase.rpc("resolve_store_shipping_price", {
        p_store_id: storeId,
        p_governorate_id: governorateId,
      });

      if (error) {
        throw new Error(`Failed to resolve shipping for store ${storeId}: ${error.message}`);
      }
      
      const price = Number(data || 0);
      quotes[storeId] = price;
      // Store in cache
      shippingCache.set(`${storeId}:${governorateId}`, { price, expiresAt: Date.now() + CACHE_TTL_MS });
    });

    await Promise.all(fetchPromises);

    return NextResponse.json({ quotes });
  } catch (error: any) {
    console.error("Shipping Quotes API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
