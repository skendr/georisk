import L from "leaflet";

// ─── Climate types ──────────────────────────────────────────────
export interface ClimateProperties {
  name: string;
  fips: string;
  meanTemp: number;
  meanPrecipitation: number;
  extremeHeatDays: number;
  heavyRainDays: number;
  riskScore: number;
  riskScoreNorm: number;
  riskLevel: string;
  propertyValueImpact: number;
  medianHomeValue: number;
  adjustedHomeValue: number;
}

export interface ClimateFeature {
  type: "Feature";
  properties: ClimateProperties;
  geometry: GeoJSON.Geometry;
}

export interface ClimateGeoJSON {
  type: "FeatureCollection";
  features: ClimateFeature[];
}

// ─── Climate risk color scale ───────────────────────────────────
export function getRiskColor(norm: number): string {
  if (norm < 0.25) return "#22c55e";
  if (norm < 0.5) return "#eab308";
  if (norm < 0.75) return "#f97316";
  return "#ef4444";
}

export function getRiskFillColor(norm: number): string {
  if (norm < 0.25) return "#bbf7d0";
  if (norm < 0.5) return "#fef08a";
  if (norm < 0.75) return "#fed7aa";
  return "#fecaca";
}

// ─── Crime type color palette ───────────────────────────────────
export const CRIME_COLORS: Record<
  string,
  { fill: string; border: string; label: string }
> = {
  "Crime Against Property": {
    fill: "#f59e0b",
    border: "#d97706",
    label: "Property",
  },
  "Crime Against Person": {
    fill: "#ef4444",
    border: "#dc2626",
    label: "Person",
  },
  "Crime Against Society": {
    fill: "#8b5cf6",
    border: "#7c3aed",
    label: "Society",
  },
  Other: { fill: "#6b7280", border: "#4b5563", label: "Other" },
  "Not a Crime": { fill: "#22c55e", border: "#16a34a", label: "Not a Crime" },
};

const DEFAULT_COLOR = { fill: "#6b7280", border: "#4b5563", label: "Unknown" };

export function getCrimeColor(crimeName: string) {
  return CRIME_COLORS[crimeName] ?? DEFAULT_COLOR;
}

// ─── Cluster icon ───────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount();
  let size = 36;
  let bg = "#3b82f6";
  let ring = "#2563eb";

  if (count >= 100) {
    size = 50;
    bg = "#ef4444";
    ring = "#dc2626";
  } else if (count >= 30) {
    size = 44;
    bg = "#f59e0b";
    ring = "#d97706";
  }

  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};border:3px solid ${ring};
      border-radius:50%;color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:${count >= 1000 ? 11 : 13}px;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      font-family:system-ui,sans-serif;
    ">${count >= 1000 ? `${Math.round(count / 1000)}k` : count}</div>`,
    className: "",
    iconSize: L.point(size, size),
  });
}

// ─── Constants ──────────────────────────────────────────────────
export const MD_CENTER: [number, number] = [39.0458, -76.6413];

export const PIN_ICON = L.divIcon({
  html: `<div style="
    width:28px;height:28px;
    background:#3b82f6;border:3px solid #1d4ed8;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
  "><div style="
    width:10px;height:10px;
    background:#fff;border-radius:50%;
  "></div></div>`,
  className: "",
  iconSize: L.point(28, 28),
  iconAnchor: L.point(14, 28),
});
