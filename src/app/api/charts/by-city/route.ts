import { NextResponse } from "next/server";
import { getCrimesByCity } from "@/lib/data-service";

export async function GET() {
  const data = await getCrimesByCity();
  return NextResponse.json(data);
}
