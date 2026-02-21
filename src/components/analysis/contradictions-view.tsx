import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { severityStyle } from "@/lib/severity";
import type { ContradictionResult } from "@/types/analysis";

export function ContradictionsView({ data }: { data: ContradictionResult }) {
  return (
    <div className="space-y-4">
      {/* Consistency score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Document Consistency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Progress value={data.consistencyScore} className="flex-1" />
            <span className="text-sm font-medium">
              {data.consistencyScore}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{data.summary}</p>
        </CardContent>
      </Card>

      {/* Contradictions */}
      {data.contradictions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No contradictions found across documents.
          </CardContent>
        </Card>
      ) : (
        data.contradictions.map((c) => (
          <Card key={c.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm">{c.description}</CardTitle>
                <Badge className={severityStyle(c.severity)}>
                  {c.severity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    {c.documentA}
                  </p>
                  <blockquote className="border-l-2 border-primary/50 pl-3 text-xs italic leading-relaxed">
                    &ldquo;{c.quoteA}&rdquo;
                  </blockquote>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    {c.documentB}
                  </p>
                  <blockquote className="border-l-2 border-destructive/50 pl-3 text-xs italic leading-relaxed">
                    &ldquo;{c.quoteB}&rdquo;
                  </blockquote>
                </div>
              </div>
              <div className="rounded-md bg-blue-500/10 p-2">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  <strong>Resolution:</strong> {c.resolution}
                </p>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
