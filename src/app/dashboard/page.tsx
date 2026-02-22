"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  ExternalLink,
  FileSearch,
  FileUp,
  Loader2,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteReportButton } from "@/components/report/delete-report-button";
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

export default function DashboardPage() {
  const router = useRouter();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => setReports(d.reports ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="max-w-lg">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <FileUp className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              No assessments yet
            </h2>
            <p className="text-sm text-muted-foreground">
              Upload property documents to generate a comprehensive risk
              assessment combining crime data, climate risk, and document
              analysis.
            </p>
            <Button asChild>
              <Link href="/dashboard/report">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Assessment
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Your saved risk assessments
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/report">
            <Plus className="mr-2 h-4 w-4" />
            New Assessment
          </Link>
        </Button>
      </div>

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
                      <DeleteReportButton
                        reportId={r.id}
                        reportAddress={r.address}
                        onDeleted={() =>
                          setReports((prev) =>
                            prev.filter((rep) => rep.id !== r.id)
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
