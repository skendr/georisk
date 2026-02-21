import { NextRequest, NextResponse } from "next/server";
import { getRecords, getFilterOptions } from "@/lib/data-service";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  if (params.get("filters") === "true") {
    const filters = await getFilterOptions();
    return NextResponse.json(filters);
  }

  const data = await getRecords({
    page: Number(params.get("page") ?? 1),
    pageSize: Number(params.get("pageSize") ?? 20),
    sort: params.get("sort") ?? "crimeDate",
    order: (params.get("order") as "asc" | "desc") ?? "desc",
    crimeType: params.get("crimeType") ?? undefined,
    city: params.get("city") ?? undefined,
    agency: params.get("agency") ?? undefined,
  });

  return NextResponse.json(data);
}
