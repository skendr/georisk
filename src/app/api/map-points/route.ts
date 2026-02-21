import { NextRequest, NextResponse } from "next/server";
import { getMapPoints, getDateRange } from "@/lib/data-service";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  if (params.get("dateRange") === "true") {
    const range = await getDateRange();
    return NextResponse.json(range);
  }

  const north = Number(params.get("north") ?? 40);
  const south = Number(params.get("south") ?? 37);
  const east = Number(params.get("east") ?? -75);
  const west = Number(params.get("west") ?? -80);
  const limit = Number(params.get("limit") ?? 5000);
  const dateFrom = params.get("dateFrom") ?? undefined;
  const dateTo = params.get("dateTo") ?? undefined;

  const data = await getMapPoints({ north, south, east, west, limit, dateFrom, dateTo });
  return NextResponse.json(data);
}
