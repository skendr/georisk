"use client";

import { UnifiedMapWrapper } from "@/components/map/unified-map-wrapper";

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Map</h1>
        <p className="text-muted-foreground">
          Geographic view of crime incidents and climate risk in Maryland
        </p>
      </div>
      <UnifiedMapWrapper />
    </div>
  );
}
