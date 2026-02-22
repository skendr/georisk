"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const ClimateMap = dynamic(
  () => import("./climate-map").then((m) => ({ default: m.ClimateMap })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full rounded-md" />,
  }
);

export function ClimateMapWrapper() {
  return (
    <div className="h-[calc(100vh-12rem)]">
      <ClimateMap />
    </div>
  );
}
