"use client";

import { Separator } from "@/components/ui/separator";
import { ReportKPIs } from "@/components/report/report-kpis";
import { ReportMapWrapper } from "@/components/report/report-map-wrapper";
import {
  CrimesByTypePie,
  MonthlyTrendChart,
  TopCrimesBar,
} from "@/components/report/report-charts";
import { ReportIntegrityFooter } from "@/components/report/report-integrity-footer";
import { RiskSummaryKPIs } from "@/components/analysis/risk-summary-kpis";
import { AnalysisResults } from "@/components/analysis/analysis-results";
import { ClimateRiskSection } from "@/components/report/climate-risk-section";
import type { ReportData } from "@/types/crime";
import type { AnalysisResult } from "@/types/analysis";

interface ReportViewProps {
  reportData: ReportData;
  radiusKm: number;
  analysis?: AnalysisResult | null;
  authorName: string;
  createdAt: string | Date;
}

export function ReportView({
  reportData,
  radiusKm,
  analysis,
  authorName,
  createdAt,
}: ReportViewProps) {
  return (
    <div className="space-y-6">
      {/* Title + subtitle */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {reportData.address}
          </h1>
          <p className="text-sm text-muted-foreground">
            {radiusKm} km radius &middot; {reportData.totalIncidents.toLocaleString()}{" "}
            incidents
          </p>
        </div>
      </div>

      {/* Map */}
      <div data-pdf-hide>
        <ReportMapWrapper
          lat={reportData.lat}
          lng={reportData.lng}
          points={reportData.points}
          radiusKm={radiusKm}
        />
      </div>

      {/* Document Analysis */}
      {analysis && (
        <>
          <Separator />
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Document Analysis
            </h2>
          </div>
          <RiskSummaryKPIs result={analysis} />
          <AnalysisResults result={analysis} />
        </>
      )}

      {/* Crime Rate */}
      <Separator />
      <div>
        <h2 className="text-xl font-bold tracking-tight">Crime Rate</h2>
      </div>
      <ReportKPIs data={reportData} />

      <div className="grid gap-6 lg:grid-cols-2">
        <CrimesByTypePie data={reportData.crimesByType} />
        <MonthlyTrendChart data={reportData.crimesByMonth} />
      </div>

      {reportData.topCrimes.length > 0 && (
        <TopCrimesBar data={reportData.topCrimes} />
      )}

      {/* Climate Risk */}
      {reportData.climate && (
        <>
          <Separator />
          <ClimateRiskSection data={reportData.climate} />
        </>
      )}

      <ReportIntegrityFooter authorName={authorName} createdAt={createdAt} />
    </div>
  );
}
