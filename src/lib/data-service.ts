import { parquetRead, asyncBufferFromFile } from "hyparquet";
import { compressors } from "hyparquet-compressors";
import path from "path";
import type {
  CrimeRecord,
  KPIData,
  ChartDataPoint,
  TimeSeriesPoint,
  MapPoint,
  PaginatedResponse,
} from "@/types/crime";

const PARQUET_PATH = path.join(process.cwd(), "data", "crime_dataset.parquet");

// Column name mapping from the actual parquet schema
const COL = {
  incidentId: "Incident ID",
  crimeDate: "Start_Date_Time",
  crimeName1: "Crime Name1",
  crimeName2: "Crime Name2",
  city: "City",
  district: "Police District Name",
  totalVictims: "Victims",
  agency: "Agency",
  latitude: "Latitude",
  longitude: "Longitude",
} as const;

function nanToEmpty(val: unknown): string {
  const s = String(val ?? "");
  return s === "nan" ? "" : s;
}

let cachedRecords: CrimeRecord[] | null = null;

async function loadRecords(): Promise<CrimeRecord[]> {
  if (cachedRecords) return cachedRecords;

  const file = await asyncBufferFromFile(PARQUET_PATH);
  let rows: Record<string, unknown>[] = [];

  await parquetRead({
    file,
    compressors,
    rowFormat: "object",
    onComplete: (data: Record<string, unknown>[]) => {
      rows = data;
    },
  });

  cachedRecords = rows.map((row) => {
    const victims = row[COL.totalVictims];
    return {
      incidentId: String(row[COL.incidentId] ?? ""),
      crimeDate: String(row[COL.crimeDate] ?? ""),
      crimeName1: nanToEmpty(row[COL.crimeName1]),
      crimeName2: nanToEmpty(row[COL.crimeName2]),
      city: nanToEmpty(row[COL.city]),
      district: nanToEmpty(row[COL.district]),
      totalVictims: typeof victims === "bigint" ? Number(victims) : Number(victims ?? 0),
      agency: String(row[COL.agency] ?? ""),
      latitude: Number(row[COL.latitude] ?? 0),
      longitude: Number(row[COL.longitude] ?? 0),
    };
  });

  return cachedRecords;
}

export async function getKPIs(): Promise<KPIData> {
  const records = await loadRecords();
  const cityCount = new Map<string, number>();
  const crimeTypes = new Set<string>();

  let totalVictims = 0;
  for (const r of records) {
    totalVictims += r.totalVictims;
    if (r.crimeName1) crimeTypes.add(r.crimeName1);
    cityCount.set(r.city, (cityCount.get(r.city) ?? 0) + 1);
  }

  let topCity = "";
  let topCityCount = 0;
  for (const [city, count] of cityCount) {
    if (count > topCityCount) {
      topCity = city;
      topCityCount = count;
    }
  }

  return {
    totalIncidents: records.length,
    totalVictims,
    crimeTypes: crimeTypes.size,
    topCity,
  };
}

export async function getCrimesOverTime(): Promise<TimeSeriesPoint[]> {
  const records = await loadRecords();
  const monthly = new Map<string, number>();

  for (const r of records) {
    if (!r.crimeDate) continue;
    // Parse date - try to get YYYY-MM
    const d = new Date(r.crimeDate);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly.set(key, (monthly.get(key) ?? 0) + 1);
  }

  return Array.from(monthly.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

export async function getCrimesByCategory(limit = 15): Promise<ChartDataPoint[]> {
  const records = await loadRecords();
  const counts = new Map<string, number>();

  for (const r of records) {
    if (!r.crimeName1) continue;
    counts.set(r.crimeName1, (counts.get(r.crimeName1) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

export async function getCrimesByDistrict(): Promise<ChartDataPoint[]> {
  const records = await loadRecords();
  const counts = new Map<string, number>();

  for (const r of records) {
    if (!r.district) continue;
    counts.set(r.district, (counts.get(r.district) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
}

export async function getCrimesByAgency(limit = 10): Promise<ChartDataPoint[]> {
  const records = await loadRecords();
  const counts = new Map<string, number>();

  for (const r of records) {
    if (!r.agency) continue;
    counts.set(r.agency, (counts.get(r.agency) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

export async function getCrimesByCity(limit = 10): Promise<ChartDataPoint[]> {
  const records = await loadRecords();
  const counts = new Map<string, number>();

  for (const r of records) {
    if (!r.city) continue;
    counts.set(r.city, (counts.get(r.city) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

export async function getRecords(options: {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: "asc" | "desc";
  crimeType?: string;
  city?: string;
  agency?: string;
}): Promise<PaginatedResponse<CrimeRecord>> {
  const {
    page = 1,
    pageSize = 20,
    sort = "crimeDate",
    order = "desc",
    crimeType,
    city,
    agency,
  } = options;

  let records = await loadRecords();

  // Apply filters
  if (crimeType) {
    records = records.filter((r) => r.crimeName1 === crimeType);
  }
  if (city) {
    records = records.filter((r) => r.city === city);
  }
  if (agency) {
    records = records.filter((r) => r.agency === agency);
  }

  // Sort
  const sortKey = sort as keyof CrimeRecord;
  records = [...records].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return order === "asc" ? aVal - bVal : bVal - aVal;
    }
    return order === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const total = records.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const data = records.slice(start, start + pageSize);

  return { data, total, page, pageSize, totalPages };
}

export async function getRecentIncidents(limit = 5): Promise<CrimeRecord[]> {
  const records = await loadRecords();
  return [...records]
    .sort((a, b) => new Date(b.crimeDate).getTime() - new Date(a.crimeDate).getTime())
    .slice(0, limit);
}

export async function getMapPoints(options: {
  north: number;
  south: number;
  east: number;
  west: number;
  limit?: number;
}): Promise<MapPoint[]> {
  const { north, south, east, west, limit = 5000 } = options;
  const records = await loadRecords();

  const filtered = records.filter(
    (r) =>
      r.latitude >= south &&
      r.latitude <= north &&
      r.longitude >= west &&
      r.longitude <= east &&
      r.latitude !== 0 &&
      r.longitude !== 0
  );

  // Sample if too many
  let result = filtered;
  if (filtered.length > limit) {
    const step = Math.ceil(filtered.length / limit);
    result = filtered.filter((_, i) => i % step === 0);
  }

  return result.map((r) => ({
    id: r.incidentId,
    lat: r.latitude,
    lng: r.longitude,
    crimeName: r.crimeName1,
    date: r.crimeDate,
    city: r.city,
  }));
}

export async function getFilterOptions(): Promise<{
  crimeTypes: string[];
  cities: string[];
  agencies: string[];
}> {
  const records = await loadRecords();
  const crimeTypes = new Set<string>();
  const cities = new Set<string>();
  const agencies = new Set<string>();

  for (const r of records) {
    if (r.crimeName1) crimeTypes.add(r.crimeName1);
    if (r.city) cities.add(r.city);
    if (r.agency) agencies.add(r.agency);
  }

  return {
    crimeTypes: Array.from(crimeTypes).sort(),
    cities: Array.from(cities).sort(),
    agencies: Array.from(agencies).sort(),
  };
}
