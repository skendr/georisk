"use client";

import { useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPoint } from "@/types/crime";

const CRIME_COLORS: Record<string, { fill: string; border: string }> = {
  "Crime Against Property": { fill: "#f59e0b", border: "#d97706" },
  "Crime Against Person": { fill: "#ef4444", border: "#dc2626" },
  "Crime Against Society": { fill: "#8b5cf6", border: "#7c3aed" },
  Other: { fill: "#6b7280", border: "#4b5563" },
  "Not a Crime": { fill: "#22c55e", border: "#16a34a" },
};

const DEFAULT_COLOR = { fill: "#6b7280", border: "#4b5563" };

const PIN_ICON = L.divIcon({
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

export function ReportMiniMap({
  lat,
  lng,
  points,
  radiusKm = 1,
}: {
  lat: number;
  lng: number;
  points: MapPoint[];
  radiusKm?: number;
}) {
  const markers = useMemo(
    () =>
      points.map((pt) => {
        const color = CRIME_COLORS[pt.crimeName] ?? DEFAULT_COLOR;
        return (
          <CircleMarker
            key={pt.id}
            center={[pt.lat, pt.lng]}
            radius={5}
            pathOptions={{
              fillColor: color.fill,
              color: color.border,
              weight: 1.5,
              opacity: 0.8,
              fillOpacity: 0.6,
            }}
          >
            <Popup>
              <div className="min-w-[160px] font-sans">
                <p className="text-sm font-semibold">
                  {pt.crimeDetail || pt.crimeName}
                </p>
                <p className="text-xs text-gray-600">{pt.date}</p>
                <p className="text-xs text-gray-600">{pt.city}</p>
              </div>
            </Popup>
          </CircleMarker>
        );
      }),
    [points]
  );

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      className="h-[400px] w-full rounded-lg"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <Circle
        center={[lat, lng]}
        radius={radiusKm * 1000}
        pathOptions={{
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.08,
          weight: 2,
        }}
      />
      <Marker position={[lat, lng]} icon={PIN_ICON}>
        <Popup>Search location</Popup>
      </Marker>
      {markers}
    </MapContainer>
  );
}
