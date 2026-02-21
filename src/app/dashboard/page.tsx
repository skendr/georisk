import { getKPIs, getCrimesOverTime, getCrimesByCategory, getCrimesByDistrict, getRecentIncidents } from "@/lib/data-service";
import { KPICards } from "@/components/dashboard/kpi-cards";
import {
  CrimesOverTimeChart,
  CrimesByCategoryChart,
  CrimesByDistrictChart,
  RecentIncidentsTable,
} from "@/components/dashboard/overview-charts";

export default async function DashboardPage() {
  const [kpis, overTime, byCategory, byDistrict, recent] = await Promise.all([
    getKPIs(),
    getCrimesOverTime(),
    getCrimesByCategory(10),
    getCrimesByDistrict(),
    getRecentIncidents(5),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          Maryland crime analytics dashboard
        </p>
      </div>

      <KPICards data={kpis} />

      <div className="grid gap-6 lg:grid-cols-2">
        <CrimesOverTimeChart data={overTime} />
        <CrimesByCategoryChart data={byCategory} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CrimesByDistrictChart data={byDistrict} />
        <RecentIncidentsTable data={recent} />
      </div>
    </div>
  );
}
