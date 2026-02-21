import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Users, Tag, MapPin } from "lucide-react";
import type { KPIData } from "@/types/crime";

const icons = {
  totalIncidents: AlertTriangle,
  totalVictims: Users,
  crimeTypes: Tag,
  topCity: MapPin,
};

const labels = {
  totalIncidents: "Total Incidents",
  totalVictims: "Total Victims",
  crimeTypes: "Crime Types",
  topCity: "Top City",
};

export function KPICards({ data }: { data: KPIData }) {
  const entries = [
    { key: "totalIncidents" as const, value: data.totalIncidents.toLocaleString() },
    { key: "totalVictims" as const, value: data.totalVictims.toLocaleString() },
    { key: "crimeTypes" as const, value: data.crimeTypes.toLocaleString() },
    { key: "topCity" as const, value: data.topCity },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {entries.map(({ key, value }) => {
        const Icon = icons[key];
        return (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{labels[key]}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
