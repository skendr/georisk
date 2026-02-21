"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPoint } from "@/types/crime";

// ─── Crime type color palette ────────────────────────────────────
const CRIME_COLORS: Record<string, { fill: string; border: string; label: string }> = {
  "Crime Against Property": { fill: "#f59e0b", border: "#d97706", label: "Property" },
  "Crime Against Person": { fill: "#ef4444", border: "#dc2626", label: "Person" },
  "Crime Against Society": { fill: "#8b5cf6", border: "#7c3aed", label: "Society" },
  Other: { fill: "#6b7280", border: "#4b5563", label: "Other" },
  "Not a Crime": { fill: "#22c55e", border: "#16a34a", label: "Not a Crime" },
};

const DEFAULT_COLOR = { fill: "#6b7280", border: "#4b5563", label: "Unknown" };

function getCrimeColor(crimeName: string) {
  return CRIME_COLORS[crimeName] ?? DEFAULT_COLOR;
}

// ─── Custom cluster icon ─────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createClusterIcon(cluster: any) {
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

// ─── Maryland center ─────────────────────────────────────────────
const MD_CENTER: [number, number] = [39.0458, -76.6413];
const DEFAULT_ZOOM = 9;

// ─── Map event handler ───────────────────────────────────────────
function MapEventHandler({
  onBoundsChange,
}: {
  onBoundsChange: (bounds: L.LatLngBounds) => void;
}) {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => onBoundsChange(map.getBounds()),
  });

  useEffect(() => {
    onBoundsChange(map.getBounds());
  }, [map, onBoundsChange]);

  return null;
}

// ─── Time slider component ───────────────────────────────────────
function TimeSlider({
  minDate,
  maxDate,
  value,
  onChange,
}: {
  minDate: number;
  maxDate: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
}) {
  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
  };

  return (
    <div className="rounded-lg border bg-background/95 p-4 shadow-lg backdrop-blur">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>Time Range</span>
        <span className="font-semibold text-foreground">
          {formatDate(value[0])} — {formatDate(value[1])}
        </span>
      </div>
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            From
          </label>
          <input
            type="range"
            min={minDate}
            max={maxDate}
            step={86400000 * 30}
            value={value[0]}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange([Math.min(v, value[1]), value[1]]);
            }}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            To
          </label>
          <input
            type="range"
            min={minDate}
            max={maxDate}
            step={86400000 * 30}
            value={value[1]}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange([value[0], Math.max(v, value[0])]);
            }}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Crime Type
      </p>
      <div className="grid gap-1.5">
        {Object.entries(CRIME_COLORS).map(([key, { fill, label }]) => (
          <div key={key} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full border"
              style={{ backgroundColor: fill, borderColor: fill }}
            />
            <span className="text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stats badge ─────────────────────────────────────────────────
function StatsBadge({ count, loading }: { count: number; loading: boolean }) {
  return (
    <div className="rounded-lg border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
      <div className="flex items-center gap-2">
        {loading && (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
        <span className="text-xs font-medium">
          {count.toLocaleString()} incidents in view
        </span>
      </div>
    </div>
  );
}

// ─── Main map component ──────────────────────────────────────────
export function CrimeMap() {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ min: number; max: number } | null>(null);
  const [timeFilter, setTimeFilter] = useState<[number, number] | null>(null);
  const boundsRef = useRef<L.LatLngBounds | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch date range on mount
  useEffect(() => {
    fetch("/api/map-points?dateRange=true")
      .then((r) => r.json())
      .then(({ min, max }: { min: string; max: string }) => {
        const minTs = new Date(min).getTime();
        const maxTs = new Date(max).getTime();
        setDateRange({ min: minTs, max: maxTs });
        setTimeFilter([minTs, maxTs]);
      });
  }, []);

  const fetchPoints = useCallback(
    (bounds: L.LatLngBounds, timeRange?: [number, number]) => {
      boundsRef.current = bounds;

      // Debounce to avoid hammering the API during pan/zoom
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        const params = new URLSearchParams({
          north: String(bounds.getNorth()),
          south: String(bounds.getSouth()),
          east: String(bounds.getEast()),
          west: String(bounds.getWest()),
          limit: "5000",
        });

        if (timeRange) {
          params.set("dateFrom", new Date(timeRange[0]).toISOString());
          params.set("dateTo", new Date(timeRange[1]).toISOString());
        }

        const res = await fetch(`/api/map-points?${params}`);
        const data: MapPoint[] = await res.json();
        setPoints(data);
        setLoading(false);
      }, 300);
    },
    []
  );

  const handleBoundsChange = useCallback(
    (bounds: L.LatLngBounds) => {
      fetchPoints(bounds, timeFilter ?? undefined);
    },
    [fetchPoints, timeFilter]
  );

  const handleTimeChange = useCallback(
    (range: [number, number]) => {
      setTimeFilter(range);
      if (boundsRef.current) {
        fetchPoints(boundsRef.current, range);
      }
    },
    [fetchPoints]
  );

  // Memoize markers to avoid re-creating on every render
  const markers = useMemo(
    () =>
      points.map((point) => {
        const color = getCrimeColor(point.crimeName);
        return (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lng]}
            radius={6}
            pathOptions={{
              fillColor: color.fill,
              color: color.border,
              weight: 2,
              opacity: 0.9,
              fillOpacity: 0.7,
            }}
          >
            <Popup>
              <div className="min-w-[180px] font-sans">
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: color.fill }}
                  />
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: color.fill }}>
                    {color.label}
                  </span>
                </div>
                <p className="text-sm font-semibold leading-tight">{point.crimeDetail || point.crimeName}</p>
                <div className="mt-1.5 space-y-0.5 text-xs text-gray-600">
                  <p>{point.date}</p>
                  <p>{point.city}</p>
                  {point.victims > 0 && (
                    <p className="font-medium text-red-600">
                      {point.victims} victim{point.victims > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      }),
    [points]
  );

  return (
    <div className="relative h-full w-full">
      {/* Top-left: Stats */}
      <div className="absolute left-3 top-3 z-[1000]">
        <StatsBadge count={points.length} loading={loading} />
      </div>

      {/* Top-right: Legend */}
      <div className="absolute right-3 top-3 z-[1000]">
        <Legend />
      </div>

      {/* Bottom: Time slider */}
      {dateRange && timeFilter && (
        <div className="absolute bottom-6 left-1/2 z-[1000] w-[min(500px,calc(100%-2rem))] -translate-x-1/2">
          <TimeSlider
            minDate={dateRange.min}
            maxDate={dateRange.max}
            value={timeFilter}
            onChange={handleTimeChange}
          />
        </div>
      )}

      <MapContainer
        center={MD_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full rounded-lg"
        style={{ minHeight: "500px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapEventHandler onBoundsChange={handleBoundsChange} />
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterIcon}
          maxClusterRadius={60}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          animate
        >
          {markers}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
