export interface CrimeRecord {
  incidentId: string;
  crimeDate: string;
  crimeName1: string;
  crimeName2: string;
  city: string;
  district: string;
  totalVictims: number;
  agency: string;
  latitude: number;
  longitude: number;
}

export interface KPIData {
  totalIncidents: number;
  totalVictims: number;
  crimeTypes: number;
  topCity: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  crimeName: string;
  date: string;
  city: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
