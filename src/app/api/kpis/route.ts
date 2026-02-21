import { NextResponse } from "next/server";
import { getKPIs } from "@/lib/data-service";

export async function GET() {
  const data = await getKPIs();
  return NextResponse.json(data);
}
