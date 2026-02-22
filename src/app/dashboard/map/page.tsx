"use client";

import { MapContainerWrapper } from "@/components/map/map-container-wrapper";
import { ClimateMapWrapper } from "@/components/map/climate-map-wrapper";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Map</h1>
        <p className="text-muted-foreground">
          Geographic view of crime incidents and climate risk in Maryland
        </p>
      </div>
      <Tabs defaultValue="crime">
        <TabsList>
          <TabsTrigger value="crime">Crime</TabsTrigger>
          <TabsTrigger value="climate">Climate Risk</TabsTrigger>
        </TabsList>
        <TabsContent value="crime">
          <MapContainerWrapper />
        </TabsContent>
        <TabsContent value="climate">
          <ClimateMapWrapper />
        </TabsContent>
      </Tabs>
    </div>
  );
}
