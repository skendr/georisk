import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reports, documentAnalyses, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;
  const body = await request.json();
  const { password } = body;

  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const [row] = await db
    .select()
    .from(reports)
    .where(eq(reports.shareToken, shareToken))
    .limit(1);

  if (!row || !row.sharePasswordHash) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const valid = await bcrypt.compare(password, row.sharePasswordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  let analysis = null;
  if (row.analysisId) {
    const [a] = await db
      .select()
      .from(documentAnalyses)
      .where(eq(documentAnalyses.id, row.analysisId))
      .limit(1);
    analysis = a ?? null;
  }

  const [owner] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, row.userId))
    .limit(1);

  return NextResponse.json({
    report: {
      id: row.id,
      address: row.address,
      lat: row.lat,
      lng: row.lng,
      radiusKm: row.radiusKm,
      reportData: row.reportData,
      createdAt: row.createdAt,
    },
    analysis,
    authorName: owner?.name ?? "Unknown",
  });
}
