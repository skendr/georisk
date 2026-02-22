"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Circle,
  Marker,
  Popup,
  Pane,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Switch } from "@/components/ui/switch";
import { ReportTimeSlider } from "@/components/report/report-time-slider";
import type { MapPoint } from "@/types/crime";
import {
  type ClimateProperties,
  type ClimateGeoJSON,
  getRiskColor,
  getRiskFillColor,
  CRIME_COLORS,
  getCrimeColor,
  createClusterIcon,
  MD_CENTER,
  PIN_ICON,
} from "./map-utils";

// ─── Props ──────────────────────────────────────────────────────
interface UnifiedMapProps {
  mode: "full" | "report";
  defaultShowCrime?: boolean;
  defaultShowClimate?: boolean;
  reportLat?: number;
  reportLng?: number;
  reportPoints?: MapPoint[];
  reportRadiusKm?: number;
}

// ─── Map event handler (full mode) ──────────────────────────────
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

// ─── Time slider (full mode) ────────────────────────────────────
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

// ─── Crime Legend ───────────────────────────────────────────────
function CrimeLegend() {
  return (
    <>
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
    </>
  );
}

// ─── Climate Legend ─────────────────────────────────────────────
const CLIMATE_LEVELS = [
  { label: "Low", color: "#bbf7d0", border: "#22c55e" },
  { label: "Moderate", color: "#fef08a", border: "#eab308" },
  { label: "High", color: "#fed7aa", border: "#f97316" },
  { label: "Very High", color: "#fecaca", border: "#ef4444" },
];

function ClimateLegendItems() {
  return (
    <>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Climate Risk
      </p>
      <div className="grid gap-1.5">
        {CLIMATE_LEVELS.map(({ label, color, border }) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm border"
              style={{ backgroundColor: color, borderColor: border }}
            />
            <span className="text-xs">{label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Stats badge ────────────────────────────────────────────────
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

// ─── Climate stats panel ────────────────────────────────────────
function ClimateStatsPanel({
  county,
}: {
  county: ClimateProperties | null;
}) {
  if (!county) {
    return (
      <div className="rounded-lg border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
        <span className="text-xs text-muted-foreground">
          Hover over a county
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur">
      <p className="text-sm font-semibold">{county.name}</p>
      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
        <p>
          Risk:{" "}
          <span
            className="font-semibold"
            style={{ color: getRiskColor(county.riskScoreNorm) }}
          >
            {county.riskLevel} ({(county.riskScoreNorm * 100).toFixed(0)}%)
          </span>
        </p>
        <p>Extreme heat: {county.extremeHeatDays} days/yr</p>
        <p>Heavy rain: {county.heavyRainDays} days/yr</p>
      </div>
    </div>
  );
}

// ─── Detail card ────────────────────────────────────────────────
function DetailCard({
  county,
  onClose,
}: {
  county: ClimateProperties;
  onClose: () => void;
}) {
  return (
    <div className="max-h-[60vh] overflow-y-auto rounded-lg border bg-background/95 p-4 shadow-lg backdrop-blur">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-sm font-bold">{county.name}</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 1l12 12M13 1L1 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span
          className="rounded px-2 py-0.5 text-xs font-semibold text-white"
          style={{ backgroundColor: getRiskColor(county.riskScoreNorm) }}
        >
          {county.riskLevel}
        </span>
        <span className="text-xs text-muted-foreground">
          Risk Score: {(county.riskScoreNorm * 100).toFixed(1)}%
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <p className="font-semibold text-muted-foreground">Climate Factors</p>
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
            <p>
              Mean Temp:{" "}
              <span className="font-medium">{county.meanTemp}&deg;F</span>
            </p>
            <p>
              Precipitation:{" "}
              <span className="font-medium">
                {county.meanPrecipitation}&Prime;/yr
              </span>
            </p>
            <p>
              Extreme Heat:{" "}
              <span className="font-medium">{county.extremeHeatDays} days</span>
            </p>
            <p>
              Heavy Rain:{" "}
              <span className="font-medium">{county.heavyRainDays} days</span>
            </p>
          </div>
        </div>

        <div className="border-t pt-2">
          <p className="font-semibold text-muted-foreground">
            Property Value Impact
          </p>
          <div className="mt-1 space-y-0.5">
            <p>
              Median Home Value:{" "}
              <span className="font-medium">
                ${county.medianHomeValue.toLocaleString()}
              </span>
            </p>
            <p>
              Impact:{" "}
              <span className="font-medium text-red-600">
                {(county.propertyValueImpact * 100).toFixed(1)}%
              </span>
            </p>
            <p>
              Adjusted Value:{" "}
              <span className="font-medium">
                ${county.adjustedHomeValue.toLocaleString()}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Layer toggle panel ─────────────────────────────────────────
function LayerTogglePanel({
  showCrime,
  showClimate,
  onToggleCrime,
  onToggleClimate,
}: {
  showCrime: boolean;
  showClimate: boolean;
  onToggleCrime: (v: boolean) => void;
  onToggleClimate: (v: boolean) => void;
}) {
  return (
    <div className="rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Layers
      </p>
      <div className="space-y-2">
        <label className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium">Crime</span>
          <Switch checked={showCrime} onCheckedChange={onToggleCrime} />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium">Climate Risk</span>
          <Switch checked={showClimate} onCheckedChange={onToggleClimate} />
        </label>
      </div>
    </div>
  );
}

// ─── Main unified map ───────────────────────────────────────────
export function UnifiedMap({
  mode,
  defaultShowCrime = true,
  defaultShowClimate = true,
  reportLat,
  reportLng,
  reportPoints,
  reportRadiusKm = 1,
}: UnifiedMapProps) {
  const [showCrime, setShowCrime] = useState(defaultShowCrime);
  const [showClimate, setShowClimate] = useState(defaultShowClimate);

  // ── Crime state (full mode) ──
  const [crimePoints, setCrimePoints] = useState<MapPoint[]>([]);
  const [crimeLoading, setCrimeLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [timeFilter, setTimeFilter] = useState<[number, number] | null>(null);
  const boundsRef = useRef<L.LatLngBounds | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Climate state ──
  const [geojson, setGeojson] = useState<ClimateGeoJSON | null>(null);
  const [hoveredCounty, setHoveredCounty] =
    useState<ClimateProperties | null>(null);
  const [selectedCounty, setSelectedCounty] =
    useState<ClimateProperties | null>(null);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  // ── Report mode: time filtering for crime points ──
  const reportDateRange = useMemo(() => {
    if (mode !== "report" || !reportPoints?.length) return null;
    const timestamps: number[] = [];
    for (const pt of reportPoints) {
      const ts = new Date(pt.date).getTime();
      if (!isNaN(ts)) timestamps.push(ts);
    }
    if (timestamps.length === 0) return null;
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    if (min === max) return null;
    return { min, max };
  }, [mode, reportPoints]);

  const [reportTimeFilter, setReportTimeFilter] = useState<
    [number, number] | null
  >(null);

  // Reset report time filter when points change
  const prevReportPointsRef = useRef(reportPoints);
  useEffect(() => {
    if (reportPoints !== prevReportPointsRef.current) {
      prevReportPointsRef.current = reportPoints;
      setReportTimeFilter(null);
    }
  }, [reportPoints]);

  const activeReportFilter =
    reportTimeFilter ??
    (reportDateRange
      ? ([reportDateRange.min, reportDateRange.max] as [number, number])
      : null);

  const filteredReportPoints = useMemo(() => {
    if (!reportPoints) return [];
    if (!activeReportFilter) return reportPoints;
    return reportPoints.filter((pt) => {
      const ts = new Date(pt.date).getTime();
      return (
        !isNaN(ts) &&
        ts >= activeReportFilter[0] &&
        ts <= activeReportFilter[1]
      );
    });
  }, [reportPoints, activeReportFilter]);

  // ── Fetch date range (full mode) ──
  useEffect(() => {
    if (mode !== "full") return;
    fetch("/api/map-points?dateRange=true")
      .then((r) => r.json())
      .then(({ min, max }: { min: string; max: string }) => {
        const minTs = new Date(min).getTime();
        const maxTs = new Date(max).getTime();
        setDateRange({ min: minTs, max: maxTs });
        setTimeFilter([minTs, maxTs]);
      });
  }, [mode]);

  // ── Fetch climate data ──
  useEffect(() => {
    fetch("/api/climate")
      .then((r) => r.json())
      .then((data: ClimateGeoJSON) => setGeojson(data));
  }, []);

  // ── Fetch crime points (full mode) ──
  const fetchPoints = useCallback(
    (bounds: L.LatLngBounds, timeRange?: [number, number]) => {
      boundsRef.current = bounds;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setCrimeLoading(true);
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
        setCrimePoints(data);
        setCrimeLoading(false);
      }, 300);
    },
    []
  );

  const handleBoundsChange = useCallback(
    (bounds: L.LatLngBounds) => {
      if (!showCrime) return;
      fetchPoints(bounds, timeFilter ?? undefined);
    },
    [fetchPoints, timeFilter, showCrime]
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

  // Refetch when crime is toggled on (full mode)
  useEffect(() => {
    if (mode === "full" && showCrime && boundsRef.current) {
      fetchPoints(boundsRef.current, timeFilter ?? undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCrime]);

  // ── Climate GeoJSON callbacks ──
  const climateStyle = useCallback(
    (feature: GeoJSON.Feature | undefined) => {
      if (!feature?.properties) return {};
      const props = feature.properties as ClimateProperties;
      const isSelected = selectedCounty?.fips === props.fips;
      return {
        fillColor: getRiskFillColor(props.riskScoreNorm),
        color: isSelected ? "#1e40af" : getRiskColor(props.riskScoreNorm),
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: isSelected ? 0.8 : 0.6,
      };
    },
    [selectedCounty]
  );

  const onEachFeature = useCallback(
    (feature: GeoJSON.Feature, layer: L.Layer) => {
      const props = feature.properties as ClimateProperties;

      layer.on({
        mouseover: (e: L.LeafletMouseEvent) => {
          setHoveredCounty(props);
          const target = e.target as L.Path;
          target.setStyle({ weight: 3, fillOpacity: 0.8 });
          target.bringToFront();
        },
        mouseout: (e: L.LeafletMouseEvent) => {
          setHoveredCounty(null);
          if (geoJsonRef.current) {
            geoJsonRef.current.resetStyle(e.target as L.Path);
          }
        },
        click: () => {
          setSelectedCounty((prev) =>
            prev?.fips === props.fips ? null : props
          );
        },
      });

      layer.bindTooltip(
        `<strong>${props.name}</strong><br/>Risk: ${(props.riskScoreNorm * 100).toFixed(0)}% (${props.riskLevel})`,
        { sticky: true, className: "leaflet-tooltip" }
      );
    },
    []
  );

  // ── Determine which crime points to show ──
  const displayPoints = mode === "full" ? crimePoints : filteredReportPoints;

  // ── Memoized crime markers ──
  const crimeMarkers = useMemo(
    () =>
      displayPoints.map((point) => {
        const color = getCrimeColor(point.crimeName);
        return (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lng]}
            radius={mode === "full" ? 6 : 5}
            pathOptions={{
              fillColor: color.fill,
              color: color.border,
              weight: mode === "full" ? 2 : 1.5,
              opacity: mode === "full" ? 0.9 : 0.8,
              fillOpacity: mode === "full" ? 0.7 : 0.6,
            }}
          >
            <Popup>
              <div className="min-w-[180px] font-sans">
                {mode === "full" && (
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color.fill }}
                    />
                    <span
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: color.fill }}
                    >
                      {color.label}
                    </span>
                  </div>
                )}
                <p className="text-sm font-semibold leading-tight">
                  {point.crimeDetail || point.crimeName}
                </p>
                <div className="mt-1.5 space-y-0.5 text-xs text-gray-600">
                  <p>{point.date}</p>
                  <p>{point.city}</p>
                  {mode === "full" && point.victims > 0 && (
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
    [displayPoints, mode]
  );

  // ── Map config ──
  const center: [number, number] =
    mode === "report" && reportLat != null && reportLng != null
      ? [reportLat, reportLng]
      : MD_CENTER;
  const zoom = mode === "report" ? 14 : 9;
  const scrollWheelZoom = mode !== "report";
  const minHeight = mode === "report" ? undefined : "500px";

  return (
    <div className={`relative ${mode === "report" ? "z-0" : "h-full w-full"}`}>
      {/* ── Top-left: Layer toggles + contextual stats ── */}
      <div className="absolute left-3 top-3 z-[1000] space-y-2">
        <LayerTogglePanel
          showCrime={showCrime}
          showClimate={showClimate}
          onToggleCrime={setShowCrime}
          onToggleClimate={setShowClimate}
        />
        {showCrime && mode === "full" && (
          <StatsBadge count={crimePoints.length} loading={crimeLoading} />
        )}
        {showClimate && (
          <ClimateStatsPanel county={hoveredCounty ?? selectedCounty} />
        )}
      </div>

      {/* ── Top-right: Combined legend ── */}
      {(showCrime || showClimate) && (
        <div className="absolute right-3 top-3 z-[1000]">
          <div className="rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur">
            {showCrime && <CrimeLegend />}
            {showCrime && showClimate && <div className="my-2 border-t" />}
            {showClimate && <ClimateLegendItems />}
          </div>
        </div>
      )}

      {/* ── Bottom-center: Time slider ── */}
      {showCrime && mode === "full" && dateRange && timeFilter && (
        <div className="absolute bottom-6 left-1/2 z-[1000] w-[min(500px,calc(100%-2rem))] -translate-x-1/2">
          <TimeSlider
            minDate={dateRange.min}
            maxDate={dateRange.max}
            value={timeFilter}
            onChange={handleTimeChange}
          />
        </div>
      )}
      {showCrime &&
        mode === "report" &&
        reportDateRange &&
        activeReportFilter && (
          <div className="absolute bottom-4 left-1/2 z-[1000] w-[min(420px,calc(100%-2rem))] -translate-x-1/2">
            <ReportTimeSlider
              minDate={reportDateRange.min}
              maxDate={reportDateRange.max}
              value={activeReportFilter}
              onChange={setReportTimeFilter}
              filteredCount={filteredReportPoints.length}
              totalCount={reportPoints?.length ?? 0}
            />
          </div>
        )}

      {/* ── Bottom-right: Climate detail card ── */}
      {showClimate && selectedCounty && (
        <div className="absolute bottom-6 right-3 z-[1000] w-72">
          <DetailCard
            county={selectedCounty}
            onClose={() => setSelectedCounty(null)}
          />
        </div>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={scrollWheelZoom}
        className={`${mode === "report" ? "h-[400px]" : "h-full"} w-full rounded-lg`}
        style={{ minHeight }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {mode === "full" && (
          <MapEventHandler onBoundsChange={handleBoundsChange} />
        )}

        {/* ── Climate polygons pane (z-index 400, under markers) ── */}
        {showClimate && geojson && (
          <Pane name="climate" style={{ zIndex: 400 }}>
            <GeoJSON
              key={selectedCounty?.fips ?? "none"}
              data={geojson as unknown as GeoJSON.FeatureCollection}
              style={climateStyle}
              onEachFeature={onEachFeature}
              ref={(ref) => {
                geoJsonRef.current = ref as unknown as L.GeoJSON | null;
              }}
            />
          </Pane>
        )}

        {/* ── Crime markers pane (z-index 600, on top) ── */}
        {showCrime && (
          <Pane name="crime" style={{ zIndex: 600 }}>
            {mode === "full" ? (
              <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={createClusterIcon}
                maxClusterRadius={60}
                spiderfyOnMaxZoom
                showCoverageOnHover={false}
                animate
              >
                {crimeMarkers}
              </MarkerClusterGroup>
            ) : (
              crimeMarkers
            )}
          </Pane>
        )}

        {/* ── Report mode: radius circle + pin ── */}
        {mode === "report" &&
          reportLat != null &&
          reportLng != null && (
            <>
              <Circle
                center={[reportLat, reportLng]}
                radius={reportRadiusKm * 1000}
                pathOptions={{
                  color: "#3b82f6",
                  fillColor: "#3b82f6",
                  fillOpacity: 0.08,
                  weight: 2,
                }}
              />
              <Marker position={[reportLat, reportLng]} icon={PIN_ICON}>
                <Popup>Search location</Popup>
              </Marker>
            </>
          )}
      </MapContainer>
    </div>
  );
}
