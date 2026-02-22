"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportView } from "@/components/report/report-view";
import type { ReportData } from "@/types/crime";
import type { AnalysisResult } from "@/types/analysis";

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

export default function SharedReportPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [radiusKm, setRadiusKm] = useState(1);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [authorName, setAuthorName] = useState("Unknown");
  const [createdAt, setCreatedAt] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/shared/${shareToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.status === 401) {
        setError("Invalid password");
        return;
      }
      if (!res.ok) {
        setError("Report not found");
        return;
      }

      const data = await res.json();
      setReportData(data.report.reportData as ReportData);
      setRadiusKm(data.report.radiusKm);
      setCreatedAt(data.report.createdAt);
      setAuthorName(data.authorName);
      if (data.analysis) {
        setAnalysis(toAnalysisResult(data.analysis));
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (reportData) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <ReportView
          reportData={reportData}
          radiusKm={radiusKm}
          analysis={analysis}
          authorName={authorName}
          createdAt={createdAt}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Shared Report</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter the password to view this report
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter share password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "View Report"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
