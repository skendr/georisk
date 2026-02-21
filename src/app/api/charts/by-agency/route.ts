import { NextResponse } from "next/server";
import { getCrimesByAgency } from "@/lib/data-service";

export async function GET() {
  const data = await getCrimesByAgency();
  return NextResponse.json(data);
}
