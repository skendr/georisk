"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const CrimeMap = dynamic(
  () => import("./crime-map").then((m) => ({ default: m.CrimeMap })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full rounded-md" />,
  }
);

export function MapContainerWrapper() {
  return (
    <div className="h-[calc(100vh-12rem)]">
      <CrimeMap />
    </div>
  );
}
