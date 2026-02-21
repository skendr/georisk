"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapPoint } from "@/types/crime";

const ReportMiniMap = dynamic(
  () =>
    import("./report-mini-map").then((m) => ({ default: m.ReportMiniMap })),
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
  return <ReportMiniMap lat={lat} lng={lng} points={points} radiusKm={radiusKm} />;
}
