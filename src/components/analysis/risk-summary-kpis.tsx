import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, AlertTriangle, Activity, BarChart3 } from "lucide-react";
import type { AnalysisResult } from "@/types/analysis";

const RATING_COLORS: Record<string, string> = {
  low: "bg-green-500",
  moderate: "bg-yellow-500",
  elevated: "bg-orange-500",
  high: "bg-red-500",
  critical: "bg-red-700",
};

function normalizeSeverity(s: string): string {
  return s.toLowerCase().replace(/[\s-]/g, "_");
}

export function RiskSummaryKPIs({ result }: { result: AnalysisResult }) {
  const { masterRiskRegister, contradictions } = result;
  const criticalCount = masterRiskRegister.risks.filter((r) => {
    const s = normalizeSeverity(r.severity);
    return s === "critical" || s === "high";
  }).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {masterRiskRegister.risks.length}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Critical / High
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {criticalCount}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Consistency Score
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {contradictions.consistencyScore}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Overall Rating
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge
            className={`${RATING_COLORS[masterRiskRegister.overallRiskRating] || "bg-gray-500"} text-white capitalize`}
          >
            {masterRiskRegister.overallRiskRating}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
