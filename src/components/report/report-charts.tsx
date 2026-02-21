"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ChartDataPoint, TimeSeriesPoint } from "@/types/crime";

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const pieConfig = Object.fromEntries(
  COLORS.map((color, i) => [`item-${i}`, { label: `Item ${i}`, color }])
) satisfies ChartConfig;

const areaConfig = {
  count: { label: "Incidents", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

const barConfig = {
  value: { label: "Incidents", color: "var(--color-chart-3)" },
} satisfies ChartConfig;

export function CrimesByTypePie({ data }: { data: ChartDataPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Crimes by Type</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={pieConfig} className="h-[300px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={100}
              label={({ label }) => label}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function MonthlyTrendChart({ data }: { data: TimeSeriesPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={areaConfig} className="h-[300px] w-full">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--color-chart-1)"
              fill="var(--color-chart-1)"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function TopCrimesBar({ data }: { data: ChartDataPoint[] }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Top 10 Specific Crimes</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={barConfig} className="h-[350px] w-full">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis
              dataKey="label"
              type="category"
              width={180}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-chart-3)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
