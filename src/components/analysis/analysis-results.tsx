"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskRegisterView } from "./risk-register-view";
import { ClassificationView } from "./classification-view";
import { EntityGraphView } from "./entity-graph-view";
import { ContradictionsView } from "./contradictions-view";
import { HandoffView } from "./handoff-view";
import type { AnalysisResult } from "@/types/analysis";

export function AnalysisResults({ result }: { result: AnalysisResult }) {
  return (
    <Tabs defaultValue="risks" className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="risks">Risk Register</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="entities">Entities</TabsTrigger>
        <TabsTrigger value="contradictions">Contradictions</TabsTrigger>
        <TabsTrigger value="handoff">Handoff</TabsTrigger>
      </TabsList>

      <TabsContent value="risks" className="mt-4">
        <RiskRegisterView data={result.masterRiskRegister} />
      </TabsContent>

      <TabsContent value="documents" className="mt-4">
        <ClassificationView data={result.classification} />
      </TabsContent>

      <TabsContent value="entities" className="mt-4">
        <EntityGraphView data={result.entities} />
      </TabsContent>

      <TabsContent value="contradictions" className="mt-4">
        <ContradictionsView data={result.contradictions} />
      </TabsContent>

      <TabsContent value="handoff" className="mt-4">
        <HandoffView data={result.handoff} />
      </TabsContent>
    </Tabs>
  );
}
