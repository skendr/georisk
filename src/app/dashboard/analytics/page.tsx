import {
  getCrimesOverTime,
  getCrimesByCategory,
  getCrimesByDistrict,
  getCrimesByAgency,
  getCrimesByCity,
} from "@/lib/data-service";
import { OverTimeChart } from "@/components/charts/over-time";
import { ByCategoryChart } from "@/components/charts/by-category";
import { ByDistrictChart } from "@/components/charts/by-district";
import { ByAgencyChart } from "@/components/charts/by-agency";
import { ByCityChart } from "@/components/charts/by-city";

export default async function AnalyticsPage() {
  const [overTime, byCategory, byDistrict, byAgency, byCity] = await Promise.all([
    getCrimesOverTime(),
    getCrimesByCategory(15),
    getCrimesByDistrict(),
    getCrimesByAgency(10),
    getCrimesByCity(10),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Detailed crime data analysis
        </p>
      </div>

      <OverTimeChart data={overTime} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ByCategoryChart data={byCategory} />
        <ByAgencyChart data={byAgency} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ByDistrictChart data={byDistrict} />
        <ByCityChart data={byCity} />
      </div>
    </div>
  );
}
