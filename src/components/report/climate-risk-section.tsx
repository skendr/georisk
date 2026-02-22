"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Thermometer,
  CloudRain,
  TrendingDown,
  Award,
} from "lucide-react";
import type { ClimateReportData } from "@/types/climate";

const RISK_COLORS: Record<ClimateReportData["riskLevel"], string> = {
  Low: "bg-green-500",
  Moderate: "bg-yellow-500",
  High: "bg-orange-500",
  "Very High": "bg-red-500",
};

export function ClimateRiskSection({ data }: { data: ClimateReportData }) {
  const impactPct = (data.propertyValueImpact * 100).toFixed(1);
  const riskPct = (data.riskScoreNorm * 100).toFixed(0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Climate Risk Assessment
        </h2>
        <p className="text-sm text-muted-foreground">{data.county}</p>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Climate Risk Score
            </CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riskPct}%</div>
            <Badge
              className={`mt-1 ${RISK_COLORS[data.riskLevel]} text-white`}
            >
              {data.riskLevel}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              vs State Average
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.riskScoreNorm > data.stateAvgRiskScore ? "+" : ""}
              {((data.riskScoreNorm - data.stateAvgRiskScore) * 100).toFixed(0)}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              State avg: {(data.stateAvgRiskScore * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Property Value Impact
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{impactPct}%</div>
            <p className="text-xs text-muted-foreground">
              estimated depreciation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">County Rank</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              #{data.countyRank}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                of {data.totalCounties}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">highest risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Details row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CloudRain className="h-4 w-4" />
              Climate Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <FactorBar
                label="Extreme Heat Days"
                value={data.extremeHeatDays}
                max={30}
                suffix=" days/yr"
              />
              <FactorBar
                label="Heavy Rain Days"
                value={data.heavyRainDays}
                max={25}
                suffix=" days/yr"
              />
              <FactorBar
                label="Mean Temperature"
                value={data.meanTemp}
                max={65}
                suffix="°F"
              />
              <FactorBar
                label="Annual Precipitation"
                value={data.meanPrecipitation}
                max={55}
                suffix="″"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingDown className="h-4 w-4" />
              Property Value Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Median Home Value
                </span>
                <span className="text-sm font-semibold">
                  ${data.medianHomeValue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Climate Risk Impact
                </span>
                <span className="text-sm font-semibold text-red-600">
                  {impactPct}%
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Adjusted Value</span>
                  <span className="text-lg font-bold">
                    ${data.adjustedHomeValue.toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Estimated loss: $
                  {(
                    data.medianHomeValue - data.adjustedHomeValue
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FactorBar({
  label,
  value,
  max,
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  suffix: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
