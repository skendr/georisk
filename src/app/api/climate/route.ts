import { NextRequest, NextResponse } from "next/server";
import {
  getClimateGeoJSON,
  getAllClimateRiskData,
} from "@/lib/climate-service";

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format");

  if (format === "summary") {
    const data = getAllClimateRiskData();
    return NextResponse.json(data);
  }

  const geojson = getClimateGeoJSON();
  return NextResponse.json(geojson);
}
