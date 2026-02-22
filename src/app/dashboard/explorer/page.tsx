import {
  getKPIs,
  getCrimesOverTime,
  getCrimesByCategory,
  getCrimesByDistrict,
  getCrimesByAgency,
  getCrimesByCity,
  getRecentIncidents,
} from "@/lib/data-service";
import { ExplorerTabs } from "@/components/explorer/explorer-tabs";

export default async function ExplorerPage() {
  const [kpis, overTime, byCategory, byDistrict, byAgency, byCity, recent] =
    await Promise.all([
      getKPIs(),
      getCrimesOverTime(),
      getCrimesByCategory(15),
      getCrimesByDistrict(),
      getCrimesByAgency(10),
      getCrimesByCity(10),
      getRecentIncidents(5),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Explorer</h1>
        <p className="text-muted-foreground">
          Browse crime analytics, charts, and records
        </p>
      </div>

      <ExplorerTabs
        kpis={kpis}
        overTime={overTime}
        byCategory={byCategory}
        byDistrict={byDistrict}
        byAgency={byAgency}
        byCity={byCity}
        recent={recent}
      />
    </div>
  );
}
