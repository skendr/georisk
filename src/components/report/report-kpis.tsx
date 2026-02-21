import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Users, Shield, Crosshair } from "lucide-react";
import type { ReportData } from "@/types/crime";

const RISK_COLORS: Record<ReportData["riskLevel"], string> = {
  Low: "bg-green-500",
  Medium: "bg-yellow-500",
  High: "bg-orange-500",
  "Very High": "bg-red-500",
};

export function ReportKPIs({ data }: { data: ReportData }) {
  const topCrimeType = data.crimesByType[0]?.label ?? "N/A";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Incidents in Radius
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.totalIncidents.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Victims</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.totalVictims.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge className={`${RISK_COLORS[data.riskLevel]} text-white`}>
            {data.riskLevel}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Most Common Type
          </CardTitle>
          <Crosshair className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold leading-tight">{topCrimeType}</div>
        </CardContent>
      </Card>
    </div>
  );
}
