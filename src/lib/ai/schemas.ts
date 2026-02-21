import { z } from "zod";

// ─── Step 1: Classification ─────────────────────────────────────

const documentClassificationSchema = z.object({
  fileName: z.string().describe("Name of the document file"),
  category: z
    .string()
    .describe(
      "Document category: title_deed, survey_plat, inspection_report, environmental_assessment, insurance_document, appraisal, zoning_permit, tax_record, lease_agreement, disclosure_statement, or other"
    ),
  confidence: z.number().describe("Confidence score from 0 to 1"),
  summary: z.string().describe("Brief summary of document contents"),
  pageCount: z.number().describe("Estimated number of pages"),
  dateIdentified: z
    .string()
    .nullable()
    .optional()
    .describe("Primary date found in the document, or null"),
});

export const classificationResultSchema = z.object({
  documents: z.array(documentClassificationSchema),
  missingDocumentTypes: z
    .array(z.string())
    .describe("List of important document types missing from the set"),
  overallCompleteness: z
    .number()
    .describe("Completeness score from 0 to 1"),
});

// ─── Step 2: Entity Extraction ──────────────────────────────────

const entitySchema = z.object({
  name: z.string().describe("Entity name or label"),
  type: z
    .string()
    .describe(
      "Entity type: person, organization, property, address, date, monetary_value, legal_reference, or parcel_id"
    ),
  value: z.string().describe("Entity value or detail"),
  source: z.string().describe("Which document this was found in"),
  confidence: z.number().describe("Confidence score from 0 to 1"),
});

const relationshipSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.string().describe("Relationship type (e.g. owner, tenant, lender)"),
});

const propertyProfileSchema = z.object({
  address: z.string().nullable().optional(),
  parcelId: z.string().nullable().optional(),
  propertyType: z.string().nullable().optional(),
  yearBuilt: z.string().nullable().optional(),
  lotSize: z.string().nullable().optional(),
  buildingSize: z.string().nullable().optional(),
  zoning: z.string().nullable().optional(),
  estimatedValue: z.string().nullable().optional(),
});

export const entityResultSchema = z.object({
  entities: z.array(entitySchema),
  relationships: z.array(relationshipSchema),
  propertyProfile: propertyProfileSchema,
});

// ─── Step 3: Risk Extraction ────────────────────────────────────

const riskItemSchema = z.object({
  id: z.string().describe("Unique risk ID (e.g. STR-001)"),
  title: z.string(),
  description: z.string(),
  severity: z
    .string()
    .describe("Risk severity: critical, high, medium, low, or info"),
  likelihood: z
    .string()
    .describe("Likelihood: very_likely, likely, possible, or unlikely"),
  evidence: z.string().describe("Direct quote or evidence from the documents"),
  sourceDocument: z.string().describe("Document the evidence came from"),
  mitigationSuggestion: z.string(),
});

export const specialistRiskResultSchema = z.object({
  domain: z
    .string()
    .describe(
      "Risk domain: structural, environmental, legal, financial, or compliance"
    ),
  risks: z.array(riskItemSchema),
  domainScore: z
    .number()
    .describe("Domain risk score from 0 to 100, where 100 means no risks"),
  summary: z.string(),
});

export const riskExtractionResultSchema = z.object({
  specialists: z.array(specialistRiskResultSchema),
  totalRisksFound: z.number(),
});

// ─── Step 4: Contradiction Detection ────────────────────────────

const contradictionSchema = z.object({
  id: z.string(),
  description: z.string(),
  documentA: z.string(),
  quoteA: z.string(),
  documentB: z.string(),
  quoteB: z.string(),
  severity: z.string().describe("Severity: critical, high, medium, low, or info"),
  resolution: z.string().describe("Suggested resolution"),
});

export const contradictionResultSchema = z.object({
  contradictions: z.array(contradictionSchema),
  consistencyScore: z
    .number()
    .describe("Consistency score from 0 to 100, where 100 is fully consistent"),
  summary: z.string(),
});

// ─── Step 5: Data Mesh / Crime Integration ──────────────────────

const crimeRiskFactorSchema = z.object({
  crimeType: z.string(),
  incidentCount: z.number(),
  riskImplication: z.string(),
  severity: z.string().describe("Severity: critical, high, medium, low, or info"),
});

export const dataMeshResultSchema = z.object({
  crimeRiskFactors: z.array(crimeRiskFactorSchema),
  areaSafetyScore: z
    .number()
    .describe("Area safety score from 0 to 100, where 100 is safest"),
  environmentalCorrelations: z.array(z.string()),
  summary: z.string(),
});

// ─── Step 6: Master Risk Register ───────────────────────────────

const masterRiskSchema = z.object({
  id: z.string(),
  rank: z.number().describe("Priority rank, 1 being highest"),
  title: z.string(),
  description: z.string(),
  severity: z.string().describe("Severity: critical, high, medium, low, or info"),
  likelihood: z.string(),
  domain: z
    .string()
    .describe(
      "Risk domain: structural, environmental, legal, financial, compliance, crime, or cross_document"
    ),
  sources: z.array(z.string()).describe("Source domains or documents"),
  recommendedAction: z.string(),
  estimatedCost: z.string().nullable().optional(),
  timeframe: z
    .string()
    .describe("Action timeframe: immediate, short-term, medium-term, or long-term"),
});

export const masterRiskRegisterSchema = z.object({
  risks: z.array(masterRiskSchema),
  executiveSummary: z.string(),
  overallRiskRating: z
    .string()
    .describe("Overall rating: low, moderate, elevated, high, or critical"),
  topRecommendations: z.array(z.string()),
});

// ─── Step 7: Handoff Package ────────────────────────────────────

const reviewAreaSchema = z.object({
  area: z.string(),
  reason: z.string(),
  suggestedExpert: z.string(),
  priority: z.string().describe("Priority: critical, high, medium, low, or info"),
});

export const handoffPackageSchema = z.object({
  executiveBriefing: z.string(),
  reviewAreas: z.array(reviewAreaSchema),
  documentGaps: z.array(z.string()),
  nextSteps: z.array(z.string()),
  confidenceStatement: z.string(),
});
