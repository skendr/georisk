import { NextRequest, NextResponse } from "next/server";
import { getCrimesInRadius } from "@/lib/data-service";
import { getClimateReportForLocation } from "@/lib/climate-service";

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") ?? "");
  const radius = parseFloat(req.nextUrl.searchParams.get("radius") ?? "1");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
  }

  const data = await getCrimesInRadius(lat, lng, radius);
  const climate = getClimateReportForLocation(lat, lng);

  return NextResponse.json({ ...data, climate });
}
