"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ClimateProperties {
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

interface ClimateFeature {
  type: "Feature";
  properties: ClimateProperties;
  geometry: GeoJSON.Geometry;
}

interface ClimateGeoJSON {
  type: "FeatureCollection";
  features: ClimateFeature[];
}

// ─── Risk level color scale ─────────────────────────────────────
function getRiskColor(norm: number): string {
  if (norm < 0.25) return "#22c55e"; // green
  if (norm < 0.5) return "#eab308"; // yellow
  if (norm < 0.75) return "#f97316"; // orange
  return "#ef4444"; // red
}

function getRiskFillColor(norm: number): string {
  if (norm < 0.25) return "#bbf7d0";
  if (norm < 0.5) return "#fef08a";
  if (norm < 0.75) return "#fed7aa";
  return "#fecaca";
}

// ─── Maryland center ─────────────────────────────────────────────
const MD_CENTER: [number, number] = [39.0458, -76.6413];
const DEFAULT_ZOOM = 8;

// ─── Legend ──────────────────────────────────────────────────────
function ClimateLegend() {
  const levels = [
    { label: "Low", color: "#bbf7d0", border: "#22c55e" },
    { label: "Moderate", color: "#fef08a", border: "#eab308" },
    { label: "High", color: "#fed7aa", border: "#f97316" },
    { label: "Very High", color: "#fecaca", border: "#ef4444" },
  ];
  return (
    <div className="rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Climate Risk
      </p>
      <div className="grid gap-1.5">
        {levels.map(({ label, color, border }) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm border"
              style={{ backgroundColor: color, borderColor: border }}
            />
            <span className="text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stats panel ─────────────────────────────────────────────────
function StatsPanel({ county }: { county: ClimateProperties | null }) {
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

// ─── Detail card ─────────────────────────────────────────────────
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
              Mean Temp: <span className="font-medium">{county.meanTemp}°F</span>
            </p>
            <p>
              Precipitation:{" "}
              <span className="font-medium">{county.meanPrecipitation}″/yr</span>
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

// ─── Main climate map component ──────────────────────────────────
export function ClimateMap() {
  const [geojson, setGeojson] = useState<ClimateGeoJSON | null>(null);
  const [hoveredCounty, setHoveredCounty] = useState<ClimateProperties | null>(
    null
  );
  const [selectedCounty, setSelectedCounty] =
    useState<ClimateProperties | null>(null);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    fetch("/api/climate")
      .then((r) => r.json())
      .then((data: ClimateGeoJSON) => setGeojson(data));
  }, []);

  const style = useCallback(
    (feature: GeoJSON.Feature | undefined) => {
      if (!feature?.properties) return {};
      const props = feature.properties as ClimateProperties;
      const isSelected = selectedCounty?.fips === props.fips;
      return {
        fillColor: getRiskFillColor(props.riskScoreNorm),
        color: isSelected
          ? "#1e40af"
          : getRiskColor(props.riskScoreNorm),
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

  return (
    <div className="relative h-full w-full">
      {/* Top-left: Stats */}
      <div className="absolute left-3 top-3 z-[1000]">
        <StatsPanel county={hoveredCounty ?? selectedCounty} />
      </div>

      {/* Top-right: Legend */}
      <div className="absolute right-3 top-3 z-[1000]">
        <ClimateLegend />
      </div>

      {/* Bottom-right: Detail card on selection */}
      {selectedCounty && (
        <div className="absolute bottom-6 right-3 z-[1000] w-72">
          <DetailCard
            county={selectedCounty}
            onClose={() => setSelectedCounty(null)}
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
        {geojson && (
          <GeoJSON
            key={selectedCounty?.fips ?? "none"}
            data={geojson as unknown as GeoJSON.FeatureCollection}
            style={style}
            onEachFeature={onEachFeature}
            ref={(ref) => {
              geoJsonRef.current = ref as unknown as L.GeoJSON | null;
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
