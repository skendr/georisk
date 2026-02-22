"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapPoint } from "@/types/crime";

const UnifiedMap = dynamic(
  () =>
    import("@/components/map/unified-map").then((m) => ({
      default: m.UnifiedMap,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full rounded-md" />,
  }
);

export function ReportMapWrapper({
  lat,
  lng,
  points,
  radiusKm,
}: {
  lat: number;
  lng: number;
  points: MapPoint[];
  radiusKm?: number;
}) {
  return (
    <UnifiedMap
      mode="report"
      reportLat={lat}
      reportLng={lng}
      reportPoints={points}
      reportRadiusKm={radiusKm}
    />
  );
}
