import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { address, lat, lng, radiusKm, reportData, analysisId } = body;

  if (!address || lat == null || lng == null || !radiusKm || !reportData) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [row] = await db
    .insert(reports)
    .values({
      userId: session.user.id,
      address,
      lat,
      lng,
      radiusKm,
      reportData,
      analysisId: analysisId || null,
    })
    .returning({ id: reports.id });

  return NextResponse.json({ id: row.id });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: reports.id,
      address: reports.address,
      lat: reports.lat,
      lng: reports.lng,
      radiusKm: reports.radiusKm,
      reportData: reports.reportData,
      analysisId: reports.analysisId,
      shareToken: reports.shareToken,
      createdAt: reports.createdAt,
    })
    .from(reports)
    .where(eq(reports.userId, session.user.id))
    .orderBy(desc(reports.createdAt));

  return NextResponse.json({ reports: rows });
}
