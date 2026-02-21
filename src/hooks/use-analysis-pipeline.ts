"use client";

import { useState, useCallback, useRef } from "react";
import type {
  PipelineStep,
  PipelineProgressEvent,
  AnalysisResult,
} from "@/types/analysis";
import type { ReportData } from "@/types/crime";

export type PipelineStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "completed"
  | "failed";

interface StepState {
  status: "pending" | "active" | "completed" | "failed";
  message?: string;
}

const STEP_ORDER: PipelineStep[] = [
  "classification",
  "entity_extraction",
  "risk_extraction",
  "contradiction_detection",
  "data_mesh",
  "master_risk_register",
  "handoff",
];

function initialStepStates(): Record<PipelineStep, StepState> {
  return Object.fromEntries(
    STEP_ORDER.map((step) => [step, { status: "pending" as const }])
  ) as Record<PipelineStep, StepState>;
}

export function useAnalysisPipeline() {
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [currentStep, setCurrentStep] = useState<PipelineStep | null>(null);
  const [stepStates, setStepStates] = useState<Record<PipelineStep, StepState>>(
    initialStepStates
  );
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startAnalysis = useCallback(
    async (files: File[], crimeData: ReportData | null) => {
      // Reset state
      setStatus("uploading");
      setError(null);
      setResult(null);
      setCurrentStep(null);
      setStepStates(initialStepStates());

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        if (crimeData) {
          formData.append("crimeData", JSON.stringify(crimeData));
          formData.append("address", crimeData.address || "");
          formData.append("lat", String(crimeData.lat));
          formData.append("lng", String(crimeData.lng));
        }

        const response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? "Failed to start analysis");
        }

        setStatus("processing");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const dataLine = line.trim();
            if (!dataLine.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(dataLine.slice(6));

              if (data.type === "init") {
                setAnalysisId(data.analysisId);
                continue;
              }

              if (data.type === "complete") {
                setResult({
                  id: data.analysisId,
                  ...data.result,
                });
                setStatus("completed");
                continue;
              }

              if (data.type === "error") {
                throw new Error(data.error);
              }

              // Pipeline progress event
              const event = data as PipelineProgressEvent;
              setCurrentStep(event.step);

              setStepStates((prev) => ({
                ...prev,
                [event.step]: {
                  status:
                    event.status === "started"
                      ? "active"
                      : event.status === "completed"
                        ? "completed"
                        : "failed",
                  message: event.message,
                },
              }));
            } catch (parseErr) {
              if (
                parseErr instanceof Error &&
                parseErr.message !== "Unexpected end of JSON input"
              ) {
                throw parseErr;
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setStatus("idle");
          return;
        }
        const message =
          err instanceof Error ? err.message : "Analysis failed";
        setError(message);
        setStatus("failed");
      }
    },
    []
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setCurrentStep(null);
    setStepStates(initialStepStates());
    setResult(null);
    setAnalysisId(null);
    setError(null);
  }, []);

  return {
    status,
    currentStep,
    stepStates,
    result,
    analysisId,
    error,
    startAnalysis,
    cancel,
    reset,
    stepOrder: STEP_ORDER,
  };
}
