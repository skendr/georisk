import type {
  ClassificationResult,
  EntityResult,
  RiskExtractionResult,
  ContradictionResult,
  DataMeshResult,
  MasterRiskRegister,
  RiskDomain,
} from "@/types/analysis";
import type { ReportData } from "@/types/crime";

export function classificationPrompt(fileNames: string[]): string {
  return `You are a property document classification specialist. Analyze the provided documents and classify each one.

Documents provided: ${fileNames.join(", ")}

For each document:
1. Identify the document category (title_deed, survey_plat, inspection_report, environmental_assessment, insurance_document, appraisal, zoning_permit, tax_record, lease_agreement, disclosure_statement, or other)
2. Rate your confidence (0-1)
3. Write a brief summary of the document contents
4. Estimate page count
5. Identify any dates mentioned

Also identify what important document types are MISSING from this set (e.g., if there's no environmental assessment, flag that).
Rate overall completeness of the document package (0-1).`;
}

export function entityExtractionPrompt(
  classification: ClassificationResult
): string {
  return `You are a property entity extraction specialist. Extract all key entities from the provided documents.

Document classifications for context:
${classification.documents.map((d) => `- ${d.fileName}: ${d.category} — ${d.summary}`).join("\n")}

Extract:
1. All named entities (people, organizations, properties, addresses, dates, monetary values, legal references, parcel IDs)
2. Relationships between entities (e.g., "John Smith" -[owner]-> "123 Main St")
3. Build a consolidated property profile from all documents

For each entity, note which document it came from and your confidence level.`;
}

export function riskExtractionPrompt(
  domain: RiskDomain,
  classification: ClassificationResult,
  entities: EntityResult
): string {
  const domainDescriptions: Record<RiskDomain, string> = {
    structural:
      "Analyze for structural and physical property risks: foundation issues, roof condition, building code violations, age-related deterioration, seismic concerns, flood zone exposure.",
    environmental:
      "Analyze for environmental risks: contamination, hazardous materials (asbestos, lead, mold), proximity to environmental hazards, soil conditions, wetland issues, EPA concerns.",
    legal:
      "Analyze for legal risks: title defects, liens, easements, encumbrances, boundary disputes, zoning violations, pending litigation, covenant restrictions.",
    financial:
      "Analyze for financial risks: overvaluation, tax delinquencies, assessment discrepancies, insurance gaps, mortgage issues, HOA financial health.",
    compliance:
      "Analyze for compliance risks: building permit issues, certificate of occupancy concerns, ADA compliance, fire code violations, zoning non-conformance.",
  };

  return `You are a ${domain} risk assessment specialist for property due diligence.

${domainDescriptions[domain]}

Document context:
${classification.documents.map((d) => `- ${d.fileName}: ${d.category} — ${d.summary}`).join("\n")}

Property profile:
${JSON.stringify(entities.propertyProfile, null, 2)}

Key entities found:
${entities.entities.slice(0, 20).map((e) => `- ${e.name} (${e.type}): ${e.value}`).join("\n")}

For each risk found:
- Give it a unique ID (e.g., "${domain.substring(0, 3).toUpperCase()}-001")
- Title and description
- Severity: critical, high, medium, low, or info
- Likelihood: very_likely, likely, possible, unlikely
- Direct quote or evidence from the documents
- Which document the evidence comes from
- A mitigation suggestion

Rate the overall domain score (0-100, where 100 = no risks found).`;
}

export function contradictionDetectionPrompt(
  classification: ClassificationResult,
  entities: EntityResult,
  risks: RiskExtractionResult
): string {
  return `You are a cross-document contradiction and consistency analyst.

Analyze the provided documents for contradictions, inconsistencies, and conflicting information.

Document context:
${classification.documents.map((d) => `- ${d.fileName}: ${d.category} — ${d.summary}`).join("\n")}

Property profile:
${JSON.stringify(entities.propertyProfile, null, 2)}

Known risks found across domains:
${risks.specialists.map((s) => `- ${s.domain}: ${s.risks.length} risks (score: ${s.domainScore})`).join("\n")}

Look for:
1. Conflicting property values or sizes across documents
2. Date inconsistencies
3. Different stated owners or parties
4. Contradictory condition assessments
5. Mismatched legal descriptions
6. Any data point that differs between documents

For each contradiction, provide direct quotes from both documents.
Rate overall consistency (0-100, where 100 = fully consistent).`;
}

export function dataMeshPrompt(
  classification: ClassificationResult,
  entities: EntityResult,
  risks: RiskExtractionResult,
  crimeData: ReportData | null
): string {
  const crimeContext = crimeData
    ? `Crime data for the area (${crimeData.address}, ${crimeData.totalIncidents} incidents):
Top crime types: ${crimeData.crimesByType.slice(0, 5).map((c) => `${c.label}: ${c.value}`).join(", ")}
Risk level: ${crimeData.riskLevel}
Total victims: ${crimeData.totalVictims}`
    : "No crime data available for this location.";

  const climateContext =
    crimeData?.climate
      ? `Climate risk data for ${crimeData.climate.county} County:
Risk score: ${crimeData.climate.riskScore.toFixed(1)} (state avg: ${crimeData.climate.stateAvgRiskScore.toFixed(1)})
Risk level: ${crimeData.climate.riskLevel}
Extreme heat days per year: ${crimeData.climate.extremeHeatDays.toFixed(1)}
Heavy rain days per year: ${crimeData.climate.heavyRainDays.toFixed(1)}
Mean temperature: ${crimeData.climate.meanTemp.toFixed(1)}°F
Mean precipitation: ${crimeData.climate.meanPrecipitation.toFixed(1)} inches
Property value impact: ${(crimeData.climate.propertyValueImpact * 100).toFixed(1)}%
Median home value: $${crimeData.climate.medianHomeValue.toLocaleString()}
Climate-adjusted value: $${crimeData.climate.adjustedHomeValue.toLocaleString()}
County rank: ${crimeData.climate.countyRank} of ${crimeData.climate.totalCounties}`
      : "No climate data available for this location.";

  return `You are a data integration analyst specializing in property risk assessment.

Integrate the crime/safety data and climate risk data with the document-based risk findings to create a unified area risk picture.

${crimeContext}

${climateContext}

Property profile:
${JSON.stringify(entities.propertyProfile, null, 2)}

Document-based risk summary:
${risks.specialists.map((s) => `- ${s.domain} (score: ${s.domainScore}): ${s.summary}`).join("\n")}

For each crime type that's relevant to property risk:
1. Map the crime type to a property risk implication
2. Assign a severity level
3. Explain how this crime pattern could affect property value, insurance, or safety

For each relevant climate hazard:
1. Identify the hazard type and its measured metric
2. Assign a severity level
3. Explain how this climate factor could affect property value, insurance, structural integrity, or long-term livability

Rate overall area safety (0-100, where 100 = safest).
Identify any correlations between environmental/document risks, crime patterns, and climate hazards.`;
}

export function masterRiskRegisterPrompt(
  risks: RiskExtractionResult,
  contradictions: ContradictionResult,
  dataMesh: DataMeshResult
): string {
  return `You are a senior risk analyst creating the master risk register for a property due diligence assessment.

Consolidate all findings into a single prioritized risk register.

Document-based risks by domain:
${risks.specialists.map((s) => `${s.domain} (${s.risks.length} risks, score: ${s.domainScore}):
${s.risks.map((r) => `  - [${r.severity}] ${r.title}`).join("\n")}`).join("\n\n")}

Cross-document contradictions (${contradictions.contradictions.length} found, consistency: ${contradictions.consistencyScore}%):
${contradictions.contradictions.map((c) => `- [${c.severity}] ${c.description}`).join("\n")}

Crime/area data integration:
${dataMesh.crimeRiskFactors.map((c) => `- [${c.severity}] ${c.crimeType}: ${c.riskImplication}`).join("\n")}
Area safety score: ${dataMesh.areaSafetyScore}/100

Climate risk factors:
${(dataMesh.climateRiskFactors ?? []).length > 0 ? dataMesh.climateRiskFactors.map((c) => `- [${c.severity}] ${c.hazardType} (${c.metric}): ${c.riskImplication}`).join("\n") : "No climate risk factors identified."}

Create the master register:
1. Rank all risks by combined severity and likelihood
2. Deduplicate overlapping risks from different domains
3. Assign a rank number (1 = highest priority)
4. For each risk, list all source domains
5. Provide specific recommended actions with estimated costs where possible
6. Set a timeframe for each action (immediate, short-term, medium-term, long-term)

Write an executive summary and determine the overall risk rating (low, moderate, elevated, high, critical).
List top 3-5 recommendations.`;
}

export function handoffPrompt(
  classification: ClassificationResult,
  masterRegister: MasterRiskRegister,
  contradictions: ContradictionResult
): string {
  return `You are a senior property analyst preparing the final handoff package for human review.

Create a comprehensive handoff document based on the analysis results.

Document completeness: ${(classification.overallCompleteness * 100).toFixed(0)}%
Missing documents: ${classification.missingDocumentTypes.join(", ") || "None"}

Overall risk rating: ${masterRegister.overallRiskRating}
Total risks in register: ${masterRegister.risks.length}
Top risks:
${masterRegister.risks.slice(0, 5).map((r) => `${r.rank}. [${r.severity}] ${r.title}`).join("\n")}

Cross-document consistency: ${contradictions.consistencyScore}%

Executive summary from risk register:
${masterRegister.executiveSummary}

Create:
1. A concise executive briefing (2-3 paragraphs) suitable for a non-technical stakeholder
2. Areas requiring expert human review, with suggested expert type and priority
3. Document gaps that should be addressed before proceeding
4. Specific next steps in priority order
5. A confidence statement about the overall assessment quality`;
}
