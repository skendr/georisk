import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, ArrowRight, FileQuestion } from "lucide-react";
import { severityStyle } from "@/lib/severity";
import type { HandoffPackage } from "@/types/analysis";

export function HandoffView({ data }: { data: HandoffPackage }) {
  return (
    <div className="space-y-4">
      {/* Executive briefing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Executive Briefing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {data.executiveBriefing}
          </p>
        </CardContent>
      </Card>

      {/* Expert review areas */}
      {data.reviewAreas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4" />
              Areas Requiring Expert Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.reviewAreas.map((area, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-md border p-3"
                >
                  <Badge className={`mt-0.5 shrink-0 ${severityStyle(area.priority)}`}>
                    {area.priority}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{area.area}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {area.reason}
                    </p>
                    <p className="mt-1 text-xs">
                      <span className="text-muted-foreground">Suggested expert:</span>{" "}
                      <span className="font-medium">{area.suggestedExpert}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document gaps */}
      {data.documentGaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileQuestion className="h-4 w-4" />
              Document Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.documentGaps.map((gap, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                  {gap}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Next steps */}
      {data.nextSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRight className="h-4 w-4" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-inside list-decimal space-y-2 text-sm">
              {data.nextSteps.map((step, i) => (
                <li key={i} className="leading-relaxed">{step}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Confidence statement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4" />
            Confidence Statement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {data.confidenceStatement}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
