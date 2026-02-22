"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const UnifiedMap = dynamic(
  () => import("./unified-map").then((m) => ({ default: m.UnifiedMap })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full rounded-md" />,
  }
);

export function UnifiedMapWrapper() {
  return (
    <div className="h-[calc(100vh-12rem)]">
      <UnifiedMap mode="full" />
    </div>
  );
}
