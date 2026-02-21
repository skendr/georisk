"use client";

import { useState, type FormEvent } from "react";
import { Search, FileUp, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ReportKPIs } from "@/components/report/report-kpis";
import {
  CrimesByTypePie,
  MonthlyTrendChart,
  TopCrimesBar,
} from "@/components/report/report-charts";
import { ReportMapWrapper } from "@/components/report/report-map-wrapper";
import { DocumentUpload } from "@/components/analysis/document-upload";
import { PipelineProgress } from "@/components/analysis/pipeline-progress";
import { RiskSummaryKPIs } from "@/components/analysis/risk-summary-kpis";
import { AnalysisResults } from "@/components/analysis/analysis-results";
import { useAnalysisPipeline } from "@/hooks/use-analysis-pipeline";
import type { ReportData } from "@/types/crime";

export default function ReportPage() {
  const [address, setAddress] = useState("");
  const [radius, setRadius] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [activeRadius, setActiveRadius] = useState(1);

  // Document analysis state
  const [files, setFiles] = useState<File[]>([]);
  const pipeline = useAnalysisPipeline();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const query = address.trim();
    if (!query) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      // Geocode the address
      const geoRes = await fetch(
        `/api/geocode?q=${encodeURIComponent(query)}`
      );
      if (!geoRes.ok) {
        const body = await geoRes.json().catch(() => null);
        throw new Error(body?.error ?? "Address not found");
      }
      const { lat, lng, displayName } = await geoRes.json();

      // Fetch report data
      const radiusKm = parseFloat(radius) || 1;
      setActiveRadius(radiusKm);
      const reportRes = await fetch(
        `/api/report?lat=${lat}&lng=${lng}&radius=${radiusKm}`
      );
      if (!reportRes.ok) throw new Error("Failed to fetch report data");
      const data: ReportData = await reportRes.json();
      data.address = displayName;

      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleStartAnalysis() {
    if (files.length === 0) return;
    pipeline.startAnalysis(files, report);
  }

  const isAnalyzing =
    pipeline.status === "uploading" || pipeline.status === "processing";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Report</h1>
        <p className="text-muted-foreground">
          Enter an address to generate a crime analysis report for the
          surrounding area
        </p>
      </div>

      {/* Address input */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          placeholder="Enter an address (e.g., Baltimore, MD)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="max-w-lg"
        />
        <Select value={radius} onValueChange={setRadius}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.5">0.5 km</SelectItem>
            <SelectItem value="1">1 km</SelectItem>
            <SelectItem value="2">2 km</SelectItem>
            <SelectItem value="5">5 km</SelectItem>
            <SelectItem value="10">10 km</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={loading || !address.trim()}>
          <Search className="mr-2 h-4 w-4" />
          {loading ? "Analyzing..." : "Analyze"}
        </Button>
      </form>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[106px] rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-[400px] rounded-lg" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[350px] rounded-lg" />
            <Skeleton className="h-[350px] rounded-lg" />
          </div>
        </div>
      )}

      {/* Report results */}
      {report && !loading && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Results for:{" "}
            <span className="font-medium text-foreground">
              {report.address}
            </span>
          </p>

          <ReportKPIs data={report} />

          <ReportMapWrapper
            lat={report.lat}
            lng={report.lng}
            points={report.points}
            radiusKm={activeRadius}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <CrimesByTypePie data={report.crimesByType} />
            <MonthlyTrendChart data={report.crimesByMonth} />
          </div>

          {report.topCrimes.length > 0 && (
            <TopCrimesBar data={report.topCrimes} />
          )}
        </div>
      )}

      {/* Empty state */}
      {!report && !loading && !error && (
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
          <div className="text-center text-muted-foreground">
            <Search className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p className="font-medium">No report generated yet</p>
            <p className="text-sm">
              Enter an address above to get started
            </p>
          </div>
        </div>
      )}

      {/* ─── Property Document Analysis Section ────────────────────── */}
      <Separator />

      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Property Document Analysis
        </h2>
        <p className="text-muted-foreground">
          Upload property documents (PDFs, images) for AI-powered risk
          assessment
        </p>
      </div>

      <DocumentUpload
        files={files}
        onFilesChange={setFiles}
        disabled={isAnalyzing}
      />

      {/* Start / Cancel buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleStartAnalysis}
          disabled={files.length === 0 || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <FileUp className="mr-2 h-4 w-4" />
              Start Document Analysis
            </>
          )}
        </Button>
        {isAnalyzing && (
          <Button variant="outline" onClick={pipeline.cancel}>
            Cancel
          </Button>
        )}
        {(pipeline.status === "completed" || pipeline.status === "failed") && (
          <Button
            variant="outline"
            onClick={() => {
              pipeline.reset();
              setFiles([]);
            }}
          >
            New Analysis
          </Button>
        )}
      </div>

      {/* Pipeline error */}
      {pipeline.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {pipeline.error}
        </div>
      )}

      {/* Pipeline progress */}
      {(pipeline.status === "processing" ||
        pipeline.status === "completed" ||
        pipeline.status === "failed") && (
        <PipelineProgress
          stepStates={pipeline.stepStates}
          stepOrder={pipeline.stepOrder}
        />
      )}

      {/* Analysis results */}
      {pipeline.status === "completed" && pipeline.result && (
        <div className="space-y-6">
          <RiskSummaryKPIs result={pipeline.result} />
          <AnalysisResults result={pipeline.result} />
        </div>
      )}
    </div>
  );
}
