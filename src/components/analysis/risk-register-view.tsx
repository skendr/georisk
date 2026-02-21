import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MasterRiskRegister } from "@/types/analysis";
import { severityStyle } from "@/lib/severity";

export function RiskRegisterView({ data }: { data: MasterRiskRegister }) {
  return (
    <div className="space-y-6">
      {/* Executive summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {data.executiveSummary}
          </p>
        </CardContent>
      </Card>

      {/* Top recommendations */}
      {data.topRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-inside list-decimal space-y-2 text-sm">
              {data.topRecommendations.map((rec, i) => (
                <li key={i} className="leading-relaxed">
                  {rec}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Risk table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Risk Register ({data.risks.length} risks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">#</th>
                  <th className="pb-2 pr-3 font-medium">Risk</th>
                  <th className="pb-2 pr-3 font-medium">Severity</th>
                  <th className="pb-2 pr-3 font-medium">Domain</th>
                  <th className="pb-2 pr-3 font-medium">Action</th>
                  <th className="pb-2 font-medium">Timeframe</th>
                </tr>
              </thead>
              <tbody>
                {data.risks.map((risk) => (
                  <tr key={risk.id} className="border-b last:border-0">
                    <td className="py-3 pr-3 align-top font-mono text-xs text-muted-foreground">
                      {risk.rank}
                    </td>
                    <td className="py-3 pr-3 align-top">
                      <div className="font-medium">{risk.title}</div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {risk.description}
                      </p>
                    </td>
                    <td className="py-3 pr-3 align-top">
                      <Badge className={severityStyle(risk.severity)}>
                        {risk.severity}
                      </Badge>
                    </td>
                    <td className="py-3 pr-3 align-top">
                      <Badge variant="outline" className="capitalize">
                        {risk.domain.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 pr-3 align-top text-xs">
                      {risk.recommendedAction}
                      {risk.estimatedCost && (
                        <span className="mt-1 block text-muted-foreground">
                          Est: {risk.estimatedCost}
                        </span>
                      )}
                    </td>
                    <td className="py-3 align-top text-xs capitalize">
                      {risk.timeframe}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
