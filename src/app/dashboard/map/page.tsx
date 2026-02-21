import { MapContainerWrapper } from "@/components/map/map-container-wrapper";

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Map</h1>
        <p className="text-muted-foreground">
          Geographic view of crime incidents in Maryland
        </p>
      </div>
      <MapContainerWrapper />
    </div>
  );
}
