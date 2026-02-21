import { NextResponse } from "next/server";
import { getCrimesByDistrict } from "@/lib/data-service";

export async function GET() {
  const data = await getCrimesByDistrict();
  return NextResponse.json(data);
}
