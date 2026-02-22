import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { documentAnalyses, analysisDocuments } from "@/db/schema";
import { runAnalysisPipeline, type DocumentInput } from "@/lib/ai/pipeline";
import type { PipelineProgressEvent } from "@/types/analysis";
import type { ReportData } from "@/types/crime";

export const maxDuration = 300; // 5 minutes for multi-step AI pipeline

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];
const MAX_FILE_SIZE = 32 * 1024 * 1024; // 32MB
const MAX_FILES = 20;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  const crimeDataRaw = formData.get("crimeData") as string | null;
  const address = formData.get("address") as string | null;
  const lat = formData.get("lat") as string | null;
  const lng = formData.get("lng") as string | null;
  const radiusKm = formData.get("radiusKm") as string | null;

  // Validate files
  if (!files.length) {
    return new Response(JSON.stringify({ error: "No files provided" }), {
      status: 400,
    });
  }
  if (files.length > MAX_FILES) {
    return new Response(
      JSON.stringify({ error: `Maximum ${MAX_FILES} files allowed` }),
      { status: 400 }
    );
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({
          error: `Invalid file type: ${file.type}. Allowed: PDF, PNG, JPEG, WebP`,
        }),
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          error: `File "${file.name}" exceeds 32MB limit`,
        }),
        { status: 400 }
      );
    }
  }

  // Parse crime data if provided
  let crimeData: ReportData | null = null;
  if (crimeDataRaw) {
    try {
      crimeData = JSON.parse(crimeDataRaw);
    } catch {
      // Ignore invalid crime data
    }
  }

  // Convert files to base64
  const documents: DocumentInput[] = await Promise.all(
    files.map(async (file) => {
      const buffer = await file.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString("base64");
      return {
        fileName: file.name,
        mimeType: file.type,
        base64Data,
      };
    })
  );

  // Create analysis record in DB
  const [analysis] = await db
    .insert(documentAnalyses)
    .values({
      userId: session.user.id,
      address,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      radiusKm: radiusKm ? parseFloat(radiusKm) : null,
      status: "processing",
      documentCount: files.length,
    })
    .returning({ id: documentAnalyses.id });

  // Insert document records
  await db.insert(analysisDocuments).values(
    files.map((file) => ({
      analysisId: analysis.id,
      fileName: file.name,
      fileType: file.type,
      fileSizeBytes: file.size,
    }))
  );

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(event: PipelineProgressEvent) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      }

      try {
        // Send analysis ID first
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "init", analysisId: analysis.id })}\n\n`
          )
        );

        const result = await runAnalysisPipeline({
          documents,
          crimeData,
          onProgress: async (event) => {
            sendEvent(event);

            // Update DB on step completion
            if (event.status === "completed") {
              const updateData: Record<string, unknown> = {
                currentStep: event.step,
              };

              switch (event.step) {
                case "classification":
                  updateData.classificationResult = event.result;
                  break;
                case "entity_extraction":
                  updateData.entityResult = event.result;
                  break;
                case "risk_extraction":
                  updateData.riskExtractionResult = event.result;
                  break;
                case "contradiction_detection":
                  updateData.contradictionResult = event.result;
                  break;
                case "data_mesh":
                  updateData.dataMeshResult = event.result;
                  break;
                case "master_risk_register":
                  updateData.masterRiskRegister = event.result;
                  break;
                case "handoff":
                  updateData.handoffPackage = event.result;
                  break;
              }

              await db
                .update(documentAnalyses)
                .set(updateData)
                .where(eq(documentAnalyses.id, analysis.id));
            }
          },
        });

        // Mark as completed
        await db
          .update(documentAnalyses)
          .set({
            status: "completed",
            completedAt: new Date(),
          })
          .where(eq(documentAnalyses.id, analysis.id));

        // Send final result
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "complete", analysisId: analysis.id, result })}\n\n`
          )
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Pipeline failed";

        await db
          .update(documentAnalyses)
          .set({ status: "failed", errorMessage: message })
          .where(eq(documentAnalyses.id, analysis.id));

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: message })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
