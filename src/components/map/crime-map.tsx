"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPoint } from "@/types/crime";

// Fix default marker icons in Leaflet + webpack
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Maryland center coordinates
const MD_CENTER: [number, number] = [39.0458, -76.6413];
const DEFAULT_ZOOM = 8;

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

export function CrimeMap() {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPoints = useCallback(async (bounds: L.LatLngBounds) => {
    setLoading(true);
    const params = new URLSearchParams({
      north: String(bounds.getNorth()),
      south: String(bounds.getSouth()),
      east: String(bounds.getEast()),
      west: String(bounds.getWest()),
      limit: "5000",
    });

    const res = await fetch(`/api/map-points?${params}`);
    const data: MapPoint[] = await res.json();
    setPoints(data);
    setLoading(false);
  }, []);

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute top-2 right-2 z-[1000] rounded bg-background/80 px-3 py-1 text-sm">
          Loading...
        </div>
      )}
      <MapContainer
        center={MD_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full rounded-md"
        style={{ minHeight: "500px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEventHandler onBoundsChange={fetchPoints} />
        <MarkerClusterGroup chunkedLoading>
          {points.map((point) => (
            <Marker key={point.id} position={[point.lat, point.lng]}>
              <Popup>
                <div className="text-sm">
                  <strong>{point.crimeName}</strong>
                  <br />
                  {point.date}
                  <br />
                  {point.city}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
