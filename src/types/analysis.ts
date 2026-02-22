// ─── Pipeline Step Results ──────────────────────────────────────

export interface DocumentClassification {
  fileName: string;
  category: string;
  confidence: number;
  summary: string;
  pageCount: number;
  dateIdentified?: string | null;
}

export interface ClassificationResult {
  documents: DocumentClassification[];
  missingDocumentTypes: string[];
  overallCompleteness: number;
}

export interface Entity {
  name: string;
  type: string;
  value: string;
  source: string;
  confidence: number;
}

export interface Relationship {
  from: string;
  to: string;
  type: string;
}

export interface PropertyProfile {
  address?: string | null;
  parcelId?: string | null;
  propertyType?: string | null;
  yearBuilt?: string | null;
  lotSize?: string | null;
  buildingSize?: string | null;
  zoning?: string | null;
  estimatedValue?: string | null;
}

export interface EntityResult {
  entities: Entity[];
  relationships: Relationship[];
  propertyProfile: PropertyProfile;
}

// ─── Risk Extraction (Step 3) ───────────────────────────────────

export type RiskDomain =
  | "structural"
  | "environmental"
  | "legal"
  | "financial"
  | "compliance";

export type Severity = string;

export interface RiskItem {
  id: string;
  title: string;
  description: string;
  severity: string;
  likelihood: string;
  evidence: string;
  sourceDocument: string;
  mitigationSuggestion: string;
}

export interface SpecialistRiskResult {
  domain: string;
  risks: RiskItem[];
  domainScore: number;
  summary: string;
}

export interface RiskExtractionResult {
  specialists: SpecialistRiskResult[];
  totalRisksFound: number;
}

// ─── Contradiction Detection (Step 4) ───────────────────────────

export interface Contradiction {
  id: string;
  description: string;
  documentA: string;
  quoteA: string;
  documentB: string;
  quoteB: string;
  severity: string;
  resolution: string;
}

export interface ContradictionResult {
  contradictions: Contradiction[];
  consistencyScore: number;
  summary: string;
}

// ─── Data Mesh / Crime Integration (Step 5) ─────────────────────

export interface CrimeRiskFactor {
  crimeType: string;
  incidentCount: number;
  riskImplication: string;
  severity: string;
}

export interface ClimateRiskFactor {
  hazardType: string;
  metric: string;
  riskImplication: string;
  severity: string;
}

export interface DataMeshResult {
  crimeRiskFactors: CrimeRiskFactor[];
  climateRiskFactors: ClimateRiskFactor[];
  areaSafetyScore: number;
  environmentalCorrelations: string[];
  summary: string;
}

// ─── Master Risk Register (Step 6) ──────────────────────────────

export interface MasterRisk {
  id: string;
  rank: number;
  title: string;
  description: string;
  severity: string;
  likelihood: string;
  domain: string;
  sources: string[];
  recommendedAction: string;
  estimatedCost?: string | null;
  timeframe: string;
}

export interface MasterRiskRegister {
  risks: MasterRisk[];
  executiveSummary: string;
  overallRiskRating: string;
  topRecommendations: string[];
}

// ─── Handoff Package (Step 7) ───────────────────────────────────

export interface ReviewArea {
  area: string;
  reason: string;
  suggestedExpert: string;
  priority: string;
}

export interface HandoffPackage {
  executiveBriefing: string;
  reviewAreas: ReviewArea[];
  documentGaps: string[];
  nextSteps: string[];
  confidenceStatement: string;
}

// ─── Pipeline Events & State ────────────────────────────────────

export type PipelineStep =
  | "classification"
  | "entity_extraction"
  | "risk_extraction"
  | "contradiction_detection"
  | "data_mesh"
  | "master_risk_register"
  | "handoff";

export interface PipelineProgressEvent {
  step: PipelineStep;
  status: "started" | "completed" | "failed";
  message: string;
  result?: unknown;
}

export interface AnalysisResult {
  id: string;
  classification: ClassificationResult;
  entities: EntityResult;
  riskExtraction: RiskExtractionResult;
  contradictions: ContradictionResult;
  dataMesh: DataMeshResult;
  masterRiskRegister: MasterRiskRegister;
  handoff: HandoffPackage;
}
