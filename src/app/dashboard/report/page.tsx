"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { FileUp, Loader2, Search, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DocumentUpload } from "@/components/analysis/document-upload";
import { PipelineProgress } from "@/components/analysis/pipeline-progress";
import { ReportView } from "@/components/report/report-view";
import { ShareReportDialog } from "@/components/report/share-report-dialog";
import { useAnalysisPipeline } from "@/hooks/use-analysis-pipeline";
import type { ReportData } from "@/types/crime";

type Phase = "upload" | "analyzing" | "resolving" | "complete" | "error";

export default function ReportPage() {
  const { data: session } = useSession();

  const [files, setFiles] = useState<File[]>([]);
  const pipeline = useAnalysisPipeline();

  const [phase, setPhase] = useState<Phase>("upload");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualAddress, setManualAddress] = useState("");

  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [isShared, setIsShared] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);
  const resolvedRef = useRef(false);

  // Sync pipeline status → page phase
  useEffect(() => {
    if (
      pipeline.status === "uploading" ||
      pipeline.status === "processing"
    ) {
      setPhase("analyzing");
    } else if (pipeline.status === "failed") {
      setPhase("error");
      setResolveError(pipeline.error ?? "Analysis failed");
    }
  }, [pipeline.status, pipeline.error]);

  // When analysis completes → resolve address + fetch crime data
  const resolveReport = useCallback(
    async (address: string) => {
      setPhase("resolving");
      setResolveError(null);

      try {
        // Geocode the address
        const geoRes = await fetch(
          `/api/geocode?q=${encodeURIComponent(address)}`
        );
        if (!geoRes.ok) {
          const body = await geoRes.json().catch(() => null);
          throw new Error(body?.error ?? "Could not geocode address");
        }
        const { lat, lng, displayName } = await geoRes.json();

        // Fetch crime data
        const reportRes = await fetch(
          `/api/report?lat=${lat}&lng=${lng}&radius=1`
        );
        if (!reportRes.ok) throw new Error("Failed to fetch crime data");
        const data: ReportData = await reportRes.json();
        data.address = displayName;

        setReportData(data);
        setPhase("complete");

        // Auto-save report
        const saveRes = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: displayName,
            lat,
            lng,
            radiusKm: 1,
            reportData: data,
            analysisId: pipeline.result?.id ?? null,
          }),
        });
        const saveBody = await saveRes.json().catch(() => null);
        if (saveBody?.id) setSavedReportId(saveBody.id);
      } catch (err) {
        setResolveError(
          err instanceof Error ? err.message : "Failed to resolve address"
        );
        setPhase("error");
        setShowManualInput(true);
      }
    },
    [pipeline.result?.id]
  );

  // Resolution effect — runs once when analysis completes
  useEffect(() => {
    if (pipeline.status !== "completed" || !pipeline.result || resolvedRef.current) return;
    resolvedRef.current = true;

    const result = pipeline.result;

    // 1. Try propertyProfile.address
    const profileAddress = result.entities?.propertyProfile?.address;
    if (profileAddress) {
      resolveReport(profileAddress);
      return;
    }

    // 2. Fallback: scan entities for type "address"
    const addressEntity = result.entities?.entities?.find(
      (e) => e.type.toLowerCase() === "address"
    );
    if (addressEntity) {
      resolveReport(addressEntity.value);
      return;
    }

    // 3. No address found — show manual input
    setPhase("error");
    setResolveError(
      "No property address was found in the uploaded documents. Please enter one manually."
    );
    setShowManualInput(true);
  }, [pipeline.status, pipeline.result, resolveReport]);

  function handleStartAnalysis() {
    if (files.length === 0) return;
    resolvedRef.current = false;
    setSavedReportId(null);
    setIsShared(false);
    setShareToken(null);
    setReportData(null);
    setShowManualInput(false);
    setResolveError(null);
    pipeline.startAnalysis(files, null);
  }

  function handleManualSubmit() {
    const addr = manualAddress.trim();
    if (!addr) return;
    resolveReport(addr);
  }

  function handleNewReport() {
    pipeline.reset();
    setFiles([]);
    setPhase("upload");
    setReportData(null);
    setSavedReportId(null);
    setIsShared(false);
    setShareToken(null);
    setResolveError(null);
    setShowManualInput(false);
    setManualAddress("");
    resolvedRef.current = false;
  }

  async function handleExportPdf() {
    if (!reportRef.current) return;
    try {
      const { exportReportAsPdf } = await import("@/lib/export-pdf");
      await exportReportAsPdf(reportRef.current);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export PDF: " + (err instanceof Error ? err.message : err));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Report</h1>
        <p className="text-muted-foreground">
          Upload property documents to generate a comprehensive risk and crime
          analysis report
        </p>
      </div>

      {/* ─── Upload Phase ──────────────────────────────────────────── */}
      {phase === "upload" && (
        <>
          <DocumentUpload
            files={files}
            onFilesChange={setFiles}
            disabled={false}
          />

          <div className="flex gap-3">
            <Button
              onClick={handleStartAnalysis}
              disabled={files.length === 0}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Start Analysis
            </Button>
          </div>
        </>
      )}

      {/* ─── Analyzing Phase ───────────────────────────────────────── */}
      {phase === "analyzing" && (
        <>
          {(pipeline.status === "processing" ||
            pipeline.status === "uploading") && (
            <PipelineProgress
              stepStates={pipeline.stepStates}
              stepOrder={pipeline.stepOrder}
            />
          )}

          <div className="flex gap-3">
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </Button>
            <Button variant="outline" onClick={pipeline.cancel}>
              Cancel
            </Button>
          </div>
        </>
      )}

      {/* ─── Resolving Phase ───────────────────────────────────────── */}
      {phase === "resolving" && (
        <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
          <div className="text-center text-muted-foreground">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
            <p className="font-medium">Locating property and fetching crime data...</p>
          </div>
        </div>
      )}

      {/* ─── Error Phase ───────────────────────────────────────────── */}
      {phase === "error" && (
        <>
          {resolveError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {resolveError}
            </div>
          )}

          {showManualInput && (
            <div className="flex gap-3">
              <Input
                placeholder="Enter property address (e.g., 123 Main St, Baltimore, MD)"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                className="max-w-lg"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleManualSubmit();
                }}
              />
              <Button
                onClick={handleManualSubmit}
                disabled={!manualAddress.trim()}
              >
                <Search className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleNewReport}>
              <RotateCcw className="mr-2 h-4 w-4" />
              New Report
            </Button>
          </div>
        </>
      )}

      {/* ─── Complete Phase ────────────────────────────────────────── */}
      {phase === "complete" && reportData && (
        <>
          <div className="flex gap-3">
            {savedReportId && (
              <ShareReportDialog
                reportId={savedReportId}
                isShared={isShared}
                shareToken={shareToken}
                onShared={(token) => {
                  setIsShared(true);
                  setShareToken(token);
                }}
                onRevoked={() => {
                  setIsShared(false);
                  setShareToken(null);
                }}
                onExportPdf={handleExportPdf}
              />
            )}
            <Button variant="outline" onClick={handleNewReport}>
              <RotateCcw className="mr-2 h-4 w-4" />
              New Report
            </Button>
          </div>

          <div ref={reportRef}>
            <ReportView
              reportData={reportData}
              radiusKm={1}
              analysis={pipeline.result}
              authorName={session?.user?.name ?? "Unknown"}
              createdAt={new Date()}
            />
          </div>
        </>
      )}
    </div>
  );
}
