"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICards } from "@/components/dashboard/kpi-cards";
import {
  CrimesOverTimeChart,
  CrimesByCategoryChart,
  CrimesByDistrictChart,
  RecentIncidentsTable,
} from "@/components/dashboard/overview-charts";
import { OverTimeChart } from "@/components/charts/over-time";
import { ByCategoryChart } from "@/components/charts/by-category";
import { ByAgencyChart } from "@/components/charts/by-agency";
import { ByDistrictChart } from "@/components/charts/by-district";
import { ByCityChart } from "@/components/charts/by-city";
import { DataTable } from "@/components/records/data-table";
import type { KPIData, ChartDataPoint, TimeSeriesPoint, CrimeRecord } from "@/types/crime";

interface ExplorerTabsProps {
  kpis: KPIData;
  overTime: TimeSeriesPoint[];
  byCategory: ChartDataPoint[];
  byDistrict: ChartDataPoint[];
  byAgency: ChartDataPoint[];
  byCity: ChartDataPoint[];
  recent: CrimeRecord[];
}

export function ExplorerTabs({
  kpis,
  overTime,
  byCategory,
  byDistrict,
  byAgency,
  byCity,
  recent,
}: ExplorerTabsProps) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="records">Records</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 pt-4">
        <KPICards data={kpis} />
        <div className="grid gap-6 lg:grid-cols-2">
          <CrimesOverTimeChart data={overTime} />
          <CrimesByCategoryChart data={byCategory} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <CrimesByDistrictChart data={byDistrict} />
          <RecentIncidentsTable data={recent} />
        </div>
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6 pt-4">
        <OverTimeChart data={overTime} />
        <div className="grid gap-6 lg:grid-cols-2">
          <ByCategoryChart data={byCategory} />
          <ByAgencyChart data={byAgency} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ByDistrictChart data={byDistrict} />
          <ByCityChart data={byCity} />
        </div>
      </TabsContent>

      <TabsContent value="records" className="pt-4">
        <DataTable />
      </TabsContent>
    </Tabs>
  );
}
