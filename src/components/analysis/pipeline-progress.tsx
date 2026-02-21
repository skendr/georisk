"use client";

import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  FileSearch,
  Users,
  ShieldAlert,
  GitCompare,
  Database,
  ClipboardList,
  Send,
} from "lucide-react";
import type { PipelineStep } from "@/types/analysis";

const STEP_META: Record<
  PipelineStep,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  classification: { label: "Document Classification", icon: FileSearch },
  entity_extraction: { label: "Entity Extraction", icon: Users },
  risk_extraction: { label: "Risk Analysis (5 specialists)", icon: ShieldAlert },
  contradiction_detection: { label: "Contradiction Detection", icon: GitCompare },
  data_mesh: { label: "Crime Data Integration", icon: Database },
  master_risk_register: { label: "Master Risk Register", icon: ClipboardList },
  handoff: { label: "Analyst Handoff", icon: Send },
};

interface StepState {
  status: "pending" | "active" | "completed" | "failed";
  message?: string;
}

interface PipelineProgressProps {
  stepStates: Record<PipelineStep, StepState>;
  stepOrder: PipelineStep[];
}

export function PipelineProgress({
  stepStates,
  stepOrder,
}: PipelineProgressProps) {
  return (
    <div className="space-y-1">
      {stepOrder.map((step, i) => {
        const meta = STEP_META[step];
        const state = stepStates[step];
        const StepIcon = meta.icon;

        return (
          <div key={step} className="flex items-start gap-3 py-2">
            {/* Status indicator */}
            <div className="flex flex-col items-center">
              {state.status === "completed" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : state.status === "active" ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : state.status === "failed" ? (
                <XCircle className="h-5 w-5 text-destructive" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40" />
              )}
              {i < stepOrder.length - 1 && (
                <div
                  className={`mt-1 h-6 w-px ${
                    state.status === "completed"
                      ? "bg-green-500/50"
                      : "bg-muted-foreground/20"
                  }`}
                />
              )}
            </div>

            {/* Step info */}
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2">
                <StepIcon
                  className={`h-4 w-4 ${
                    state.status === "active"
                      ? "text-primary"
                      : state.status === "completed"
                        ? "text-green-500"
                        : "text-muted-foreground/60"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    state.status === "pending"
                      ? "text-muted-foreground/60"
                      : ""
                  }`}
                >
                  {meta.label}
                </span>
              </div>
              {state.message && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {state.message}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
