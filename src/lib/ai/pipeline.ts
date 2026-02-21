import { generateObject } from "ai";
import { ANALYSIS_MODEL } from "./client";
import {
  classificationResultSchema,
  entityResultSchema,
  specialistRiskResultSchema,
  contradictionResultSchema,
  dataMeshResultSchema,
  masterRiskRegisterSchema,
  handoffPackageSchema,
} from "./schemas";
import {
  classificationPrompt,
  entityExtractionPrompt,
  riskExtractionPrompt,
  contradictionDetectionPrompt,
  dataMeshPrompt,
  masterRiskRegisterPrompt,
  handoffPrompt,
} from "./prompts";
import type {
  PipelineStep,
  PipelineProgressEvent,
  ClassificationResult,
  EntityResult,
  RiskExtractionResult,
  ContradictionResult,
  DataMeshResult,
  MasterRiskRegister,
  HandoffPackage,
  RiskDomain,
} from "@/types/analysis";
import type { ReportData } from "@/types/crime";
import type { ZodType } from "zod";
import type { ModelMessage } from "ai";

export interface DocumentInput {
  fileName: string;
  mimeType: string;
  base64Data: string;
}

interface PipelineConfig {
  documents: DocumentInput[];
  crimeData: ReportData | null;
  onProgress: (event: PipelineProgressEvent) => void;
}

interface PipelineResult {
  classification: ClassificationResult;
  entities: EntityResult;
  riskExtraction: RiskExtractionResult;
  contradictions: ContradictionResult;
  dataMesh: DataMeshResult;
  masterRiskRegister: MasterRiskRegister;
  handoff: HandoffPackage;
}

const SYSTEM_PROMPT = `You are a property risk assessment AI. You MUST respond with valid JSON matching the requested schema exactly. Rules:
- For severity fields, use ONLY one of: critical, high, medium, low, info
- For likelihood fields, use ONLY one of: very_likely, likely, possible, unlikely
- Confidence and completeness scores must be between 0 and 1
- Domain scores and safety scores must be between 0 and 100
- For nullable/optional fields, use null if unknown
- Always return arrays even if empty (use [])
- Never omit required fields`;

function buildDocumentMessages(
  documents: DocumentInput[]
): ModelMessage[] {
  const parts: Array<
    | { type: "text"; text: string }
    | { type: "file"; data: string; mediaType: string }
  > = [];

  for (const doc of documents) {
    parts.push({
      type: "file" as const,
      data: doc.base64Data,
      mediaType: doc.mimeType,
    });
    parts.push({
      type: "text" as const,
      text: `[File: ${doc.fileName}]`,
    });
  }

  return [{ role: "user" as const, content: parts }];
}

function emitProgress(
  onProgress: (event: PipelineProgressEvent) => void,
  step: PipelineStep,
  status: "started" | "completed" | "failed",
  message: string,
  result?: unknown
) {
  onProgress({ step, status, message, result });
}

const MAX_RETRIES = 2;

async function generateWithRetry<T>(opts: {
  schema: ZodType<T>;
  messages: ModelMessage[];
  stepName: string;
}): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const messages: ModelMessage[] =
        attempt === 0
          ? opts.messages
          : [
              ...opts.messages,
              {
                role: "user" as const,
                content: `IMPORTANT: Your previous response did not match the required JSON schema. Error: ${lastError?.message || "Unknown"}. Please try again, strictly following the schema. Ensure all enum fields use exact values and all required fields are present.`,
              },
            ];

      const { object } = await generateObject({
        model: ANALYSIS_MODEL,
        schema: opts.schema,
        system: SYSTEM_PROMPT,
        messages,
      });
      return object;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(
        `[Pipeline] ${opts.stepName} attempt ${attempt + 1} failed:`,
        lastError.message
      );

      if (attempt === MAX_RETRIES) {
        throw new Error(
          `${opts.stepName} failed after ${MAX_RETRIES + 1} attempts: ${lastError.message}`
        );
      }
    }
  }

  throw lastError;
}

export async function runAnalysisPipeline(
  config: PipelineConfig
): Promise<PipelineResult> {
  const { documents, crimeData, onProgress } = config;
  const docMessages = buildDocumentMessages(documents);

  // ─── Step 1: Classification ───────────────────────────────────
  emitProgress(
    onProgress,
    "classification",
    "started",
    "Classifying documents..."
  );
  const classification = await generateWithRetry<ClassificationResult>({
    schema: classificationResultSchema,
    messages: [
      ...docMessages,
      {
        role: "user",
        content: classificationPrompt(documents.map((d) => d.fileName)),
      },
    ],
    stepName: "Classification",
  });
  emitProgress(
    onProgress,
    "classification",
    "completed",
    "Documents classified",
    classification
  );

  // ─── Step 2: Entity Extraction ────────────────────────────────
  emitProgress(
    onProgress,
    "entity_extraction",
    "started",
    "Extracting entities..."
  );
  const entities = await generateWithRetry<EntityResult>({
    schema: entityResultSchema,
    messages: [
      ...docMessages,
      { role: "user", content: entityExtractionPrompt(classification) },
    ],
    stepName: "Entity Extraction",
  });
  emitProgress(
    onProgress,
    "entity_extraction",
    "completed",
    "Entities extracted",
    entities
  );

  // ─── Step 3: Risk Extraction (5 parallel specialists) ─────────
  emitProgress(
    onProgress,
    "risk_extraction",
    "started",
    "Running 5 specialist risk analyses..."
  );
  const domains: RiskDomain[] = [
    "structural",
    "environmental",
    "legal",
    "financial",
    "compliance",
  ];

  const specialistResults = await Promise.all(
    domains.map(async (domain) => {
      return generateWithRetry({
        schema: specialistRiskResultSchema,
        messages: [
          ...docMessages,
          {
            role: "user",
            content: riskExtractionPrompt(domain, classification, entities),
          },
        ],
        stepName: `Risk Extraction (${domain})`,
      });
    })
  );

  const riskExtraction: RiskExtractionResult = {
    specialists: specialistResults,
    totalRisksFound: specialistResults.reduce(
      (sum, s) => sum + s.risks.length,
      0
    ),
  };
  emitProgress(
    onProgress,
    "risk_extraction",
    "completed",
    `Found ${riskExtraction.totalRisksFound} risks across 5 domains`,
    riskExtraction
  );

  // ─── Step 4: Contradiction Detection ──────────────────────────
  emitProgress(
    onProgress,
    "contradiction_detection",
    "started",
    "Checking for contradictions..."
  );
  const contradictions = await generateWithRetry<ContradictionResult>({
    schema: contradictionResultSchema,
    messages: [
      ...docMessages,
      {
        role: "user",
        content: contradictionDetectionPrompt(
          classification,
          entities,
          riskExtraction
        ),
      },
    ],
    stepName: "Contradiction Detection",
  });
  emitProgress(
    onProgress,
    "contradiction_detection",
    "completed",
    `Found ${contradictions.contradictions.length} contradictions`,
    contradictions
  );

  // ─── Step 5: Crime Data Integration ───────────────────────────
  emitProgress(onProgress, "data_mesh", "started", "Integrating crime data...");
  const dataMesh = await generateWithRetry<DataMeshResult>({
    schema: dataMeshResultSchema,
    messages: [
      {
        role: "user",
        content: dataMeshPrompt(
          classification,
          entities,
          riskExtraction,
          crimeData
        ),
      },
    ],
    stepName: "Data Mesh",
  });
  emitProgress(
    onProgress,
    "data_mesh",
    "completed",
    "Crime data integrated",
    dataMesh
  );

  // ─── Step 6: Master Risk Register ─────────────────────────────
  emitProgress(
    onProgress,
    "master_risk_register",
    "started",
    "Building master risk register..."
  );
  const masterRiskRegister = await generateWithRetry<MasterRiskRegister>({
    schema: masterRiskRegisterSchema,
    messages: [
      {
        role: "user",
        content: masterRiskRegisterPrompt(
          riskExtraction,
          contradictions,
          dataMesh
        ),
      },
    ],
    stepName: "Master Risk Register",
  });
  emitProgress(
    onProgress,
    "master_risk_register",
    "completed",
    `Risk register: ${masterRiskRegister.overallRiskRating}`,
    masterRiskRegister
  );

  // ─── Step 7: Handoff Package ──────────────────────────────────
  emitProgress(
    onProgress,
    "handoff",
    "started",
    "Preparing handoff package..."
  );
  const handoff = await generateWithRetry<HandoffPackage>({
    schema: handoffPackageSchema,
    messages: [
      {
        role: "user",
        content: handoffPrompt(
          classification,
          masterRiskRegister,
          contradictions
        ),
      },
    ],
    stepName: "Handoff Package",
  });
  emitProgress(
    onProgress,
    "handoff",
    "completed",
    "Analysis complete",
    handoff
  );

  return {
    classification,
    entities,
    riskExtraction,
    contradictions,
    dataMesh,
    masterRiskRegister,
    handoff,
  };
}
