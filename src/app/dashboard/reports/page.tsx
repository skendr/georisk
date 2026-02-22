"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, ExternalLink, FileSearch, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ReportData } from "@/types/crime";

interface SavedReport {
  id: string;
  address: string;
  radiusKm: number;
  reportData: ReportData;
  analysisId: string | null;
  shareToken: string | null;
  createdAt: string;
}

const RISK_COLORS: Record<string, string> = {
  Low: "bg-green-500",
  Medium: "bg-yellow-500",
  High: "bg-orange-500",
  "Very High": "bg-red-500",
};

export default function ReportsListPage() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => setReports(d.reports ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Reports</h1>
        <p className="text-muted-foreground">
          Previously generated crime analysis reports
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
          <div className="text-center text-muted-foreground">
            <FolderOpen className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p className="font-medium">No reports yet</p>
            <p className="text-sm">
              Generate a report from the{" "}
              <Link href="/dashboard/report" className="text-primary hover:underline">
                Report
              </Link>{" "}
              page to get started
            </p>
          </div>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => {
            const data = r.reportData as ReportData;
            return (
              <Link key={r.id} href={`/dashboard/reports/${r.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-medium leading-tight">
                        {r.address}
                      </h3>
                      <Badge
                        className={`${RISK_COLORS[data.riskLevel] ?? "bg-gray-500"} shrink-0 text-white`}
                      >
                        {data.riskLevel}
                      </Badge>
                    </div>
                    <p className="mb-3 text-xs text-muted-foreground">
                      {r.radiusKm} km radius &middot;{" "}
                      {data.totalIncidents.toLocaleString()} incidents
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex gap-1.5">
                        {r.analysisId && (
                          <Badge variant="outline" className="text-xs">
                            <FileSearch className="mr-1 h-3 w-3" />
                            Analysis
                          </Badge>
                        )}
                        {r.shareToken && (
                          <Badge variant="outline" className="text-xs">
                            <ExternalLink className="mr-1 h-3 w-3" />
                            Shared
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
