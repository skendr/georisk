import fs from "fs";
import path from "path";
import type { ClimateRiskData, ClimateReportData } from "@/types/climate";

const GEOJSON_PATH = path.join(
  process.cwd(),
  "data",
  "maryland-climate-risk.geojson"
);

interface ClimateGeoJSON {
  type: "FeatureCollection";
  features: ClimateFeature[];
}

interface ClimateFeature {
  type: "Feature";
  properties: {
    name: string;
    fips: string;
    meanTemp: number;
    meanPrecipitation: number;
    extremeHeatDays: number;
    heavyRainDays: number;
    riskScore: number;
    riskScoreNorm: number;
    riskLevel: "Low" | "Moderate" | "High" | "Very High";
    propertyValueImpact: number;
    medianHomeValue: number;
    adjustedHomeValue: number;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

let cachedGeoJSON: ClimateGeoJSON | null = null;

function loadGeoJSON(): ClimateGeoJSON {
  if (cachedGeoJSON) return cachedGeoJSON;
  const raw = fs.readFileSync(GEOJSON_PATH, "utf-8");
  cachedGeoJSON = JSON.parse(raw) as ClimateGeoJSON;
  return cachedGeoJSON;
}

export function getClimateGeoJSON(): ClimateGeoJSON {
  return loadGeoJSON();
}

export function getAllClimateRiskData(): ClimateRiskData[] {
  const geojson = loadGeoJSON();
  return geojson.features.map((f) => ({
    county: f.properties.name,
    fips: f.properties.fips,
    meanTemp: f.properties.meanTemp,
    meanPrecipitation: f.properties.meanPrecipitation,
    extremeHeatDays: f.properties.extremeHeatDays,
    heavyRainDays: f.properties.heavyRainDays,
    riskScore: f.properties.riskScore,
    riskScoreNorm: f.properties.riskScoreNorm,
    riskLevel: f.properties.riskLevel,
    propertyValueImpact: f.properties.propertyValueImpact,
    medianHomeValue: f.properties.medianHomeValue,
    adjustedHomeValue: f.properties.adjustedHomeValue,
  }));
}

export function getClimateRiskByCounty(name: string): ClimateRiskData | null {
  const all = getAllClimateRiskData();
  return (
    all.find(
      (d) => d.county.toLowerCase() === name.toLowerCase()
    ) ?? null
  );
}

/**
 * Ray-casting point-in-polygon test for a single polygon ring.
 */
function pointInRing(
  lat: number,
  lng: number,
  ring: number[][]
): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][1]; // lat
    const yi = ring[i][0]; // lng (GeoJSON is [lng, lat])
    const xj = ring[j][1];
    const yj = ring[j][0];

    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(
  lat: number,
  lng: number,
  geometry: ClimateFeature["geometry"]
): boolean {
  if (geometry.type === "Polygon") {
    const coords = geometry.coordinates as number[][][];
    // Check outer ring, exclude holes
    if (!pointInRing(lat, lng, coords[0])) return false;
    for (let i = 1; i < coords.length; i++) {
      if (pointInRing(lat, lng, coords[i])) return false;
    }
    return true;
  }
  if (geometry.type === "MultiPolygon") {
    const polys = geometry.coordinates as number[][][][];
    for (const poly of polys) {
      if (pointInRing(lat, lng, poly[0])) {
        let inHole = false;
        for (let i = 1; i < poly.length; i++) {
          if (pointInRing(lat, lng, poly[i])) {
            inHole = true;
            break;
          }
        }
        if (!inHole) return true;
      }
    }
  }
  return false;
}

export function getCountyAtPoint(
  lat: number,
  lng: number
): ClimateFeature | null {
  const geojson = loadGeoJSON();
  for (const feature of geojson.features) {
    if (pointInPolygon(lat, lng, feature.geometry)) {
      return feature;
    }
  }
  return null;
}

export function getClimateReportForLocation(
  lat: number,
  lng: number
): ClimateReportData | null {
  const feature = getCountyAtPoint(lat, lng);
  if (!feature) return null;

  const all = getAllClimateRiskData();
  const sorted = [...all].sort((a, b) => b.riskScoreNorm - a.riskScoreNorm);
  const rank =
    sorted.findIndex(
      (d) => d.county === feature.properties.name
    ) + 1;
  const stateAvg =
    all.reduce((sum, d) => sum + d.riskScoreNorm, 0) / all.length;

  const p = feature.properties;
  return {
    county: p.name,
    fips: p.fips,
    meanTemp: p.meanTemp,
    meanPrecipitation: p.meanPrecipitation,
    extremeHeatDays: p.extremeHeatDays,
    heavyRainDays: p.heavyRainDays,
    riskScore: p.riskScore,
    riskScoreNorm: p.riskScoreNorm,
    riskLevel: p.riskLevel,
    propertyValueImpact: p.propertyValueImpact,
    medianHomeValue: p.medianHomeValue,
    adjustedHomeValue: p.adjustedHomeValue,
    stateAvgRiskScore: Math.round(stateAvg * 1000) / 1000,
    countyRank: rank,
    totalCounties: all.length,
  };
}
