import { NextResponse } from "next/server";
import { getCrimesByCategory } from "@/lib/data-service";

export async function GET() {
  const data = await getCrimesByCategory();
  return NextResponse.json(data);
}
