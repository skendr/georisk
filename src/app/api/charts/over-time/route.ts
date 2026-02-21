import { NextResponse } from "next/server";
import { getCrimesOverTime } from "@/lib/data-service";

export async function GET() {
  const data = await getCrimesOverTime();
  return NextResponse.json(data);
}
