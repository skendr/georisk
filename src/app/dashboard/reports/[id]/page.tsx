"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ReportView } from "@/components/report/report-view";
import type { ReportData } from "@/types/crime";
import type { AnalysisResult } from "@/types/analysis";

interface ReportRow {
  id: string;
  address: string;
  lat: number;
  lng: number;
  radiusKm: number;
  reportData: ReportData;
  analysisId: string | null;
  shareToken: string | null;
  createdAt: string;
}

function toAnalysisResult(a: Record<string, unknown>): AnalysisResult {
  return {
    id: a.id as string,
    classification: a.classificationResult as AnalysisResult["classification"],
    entities: a.entityResult as AnalysisResult["entities"],
    riskExtraction: a.riskExtractionResult as AnalysisResult["riskExtraction"],
    contradictions: a.contradictionResult as AnalysisResult["contradictions"],
    dataMesh: a.dataMeshResult as AnalysisResult["dataMesh"],
    masterRiskRegister: a.masterRiskRegister as AnalysisResult["masterRiskRegister"],
    handoff: a.handoffPackage as AnalysisResult["handoff"],
  };
}

export default function SavedReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportRow | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [authorName, setAuthorName] = useState("Unknown");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reports/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load report");
        return r.json();
      })
      .then((d) => {
        setReport(d.report);
        setAuthorName(d.authorName);
        if (d.analysis) {
          setAnalysis(toAnalysisResult(d.analysis));
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Something went wrong")
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error ?? "Report not found"}
      </div>
    );
  }

  const reportData = report.reportData as ReportData;

  return (
    <ReportView
      reportData={reportData}
      radiusKm={report.radiusKm}
      analysis={analysis}
      authorName={authorName}
      createdAt={report.createdAt}
      showShareButton
      reportId={report.id}
      isShared={!!report.shareToken}
      shareToken={report.shareToken}
      onShared={(token) => setReport({ ...report, shareToken: token })}
      onRevoked={() => setReport({ ...report, shareToken: null })}
    />
  );
}
