import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EntityResult } from "@/types/analysis";

const TYPE_COLORS: Record<string, string> = {
  person: "bg-blue-500",
  organization: "bg-purple-500",
  property: "bg-green-500",
  address: "bg-emerald-500",
  date: "bg-gray-500",
  monetary_value: "bg-amber-500",
  legal_reference: "bg-red-500",
  parcel_id: "bg-cyan-500",
};

export function EntityGraphView({ data }: { data: EntityResult }) {
  // Group entities by type
  const grouped = data.entities.reduce(
    (acc, entity) => {
      if (!acc[entity.type]) acc[entity.type] = [];
      acc[entity.type].push(entity);
      return acc;
    },
    {} as Record<string, typeof data.entities>
  );

  const { propertyProfile: profile } = data;

  return (
    <div className="space-y-4">
      {/* Property profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Property Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ["Address", profile.address],
              ["Parcel ID", profile.parcelId],
              ["Property Type", profile.propertyType],
              ["Year Built", profile.yearBuilt],
              ["Lot Size", profile.lotSize],
              ["Building Size", profile.buildingSize],
              ["Zoning", profile.zoning],
              ["Estimated Value", profile.estimatedValue],
            ] as const).map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value ?? "—"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Entities by type */}
      {Object.entries(grouped).map(([type, entities]) => (
        <Card key={type}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${TYPE_COLORS[type] || "bg-gray-400"}`} />
              <CardTitle className="text-sm capitalize">
                {type.replace("_", " ")} ({entities.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {entities.map((entity, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{entity.name}</span>
                    <span className="ml-2 text-muted-foreground">
                      {entity.value}
                    </span>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {entity.source}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Relationships */}
      {data.relationships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Relationships ({data.relationships.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.relationships.map((rel, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{rel.from}</span>
                  <Badge variant="secondary" className="text-xs">
                    {rel.type}
                  </Badge>
                  <span className="font-medium">{rel.to}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
