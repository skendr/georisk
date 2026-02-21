import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { documentAnalyses } from "@/db/schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [analysis] = await db
    .select()
    .from(documentAnalyses)
    .where(
      and(
        eq(documentAnalyses.id, id),
        eq(documentAnalyses.userId, session.user.id)
      )
    )
    .limit(1);

  if (!analysis) {
    return Response.json({ error: "Analysis not found" }, { status: 404 });
  }

  return Response.json({
    id: analysis.id,
    status: analysis.status,
    address: analysis.address,
    documentCount: analysis.documentCount,
    classification: analysis.classificationResult,
    entities: analysis.entityResult,
    riskExtraction: analysis.riskExtractionResult,
    contradictions: analysis.contradictionResult,
    dataMesh: analysis.dataMeshResult,
    masterRiskRegister: analysis.masterRiskRegister,
    handoff: analysis.handoffPackage,
    error: analysis.errorMessage,
    createdAt: analysis.createdAt,
    completedAt: analysis.completedAt,
  });
}
