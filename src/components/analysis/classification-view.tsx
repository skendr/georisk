import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { ClassificationResult } from "@/types/analysis";

const CATEGORY_LABELS: Record<string, string> = {
  title_deed: "Title Deed",
  survey_plat: "Survey Plat",
  inspection_report: "Inspection Report",
  environmental_assessment: "Environmental Assessment",
  insurance_document: "Insurance Document",
  appraisal: "Appraisal",
  zoning_permit: "Zoning Permit",
  tax_record: "Tax Record",
  lease_agreement: "Lease Agreement",
  disclosure_statement: "Disclosure Statement",
  other: "Other",
};

export function ClassificationView({ data }: { data: ClassificationResult }) {
  return (
    <div className="space-y-4">
      {/* Completeness */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Document Package Completeness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Progress value={data.overallCompleteness * 100} className="flex-1" />
            <span className="text-sm font-medium">
              {(data.overallCompleteness * 100).toFixed(0)}%
            </span>
          </div>
          {data.missingDocumentTypes.length > 0 && (
            <div className="flex items-start gap-2 rounded-md bg-orange-500/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-orange-500">
                  Missing Documents
                </p>
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {data.missingDocumentTypes.map((type) => (
                    <li key={type}>{type}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {data.documents.map((doc, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm">{doc.fileName}</CardTitle>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {CATEGORY_LABELS[doc.category] || doc.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {doc.summary}
              </p>
              <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                <span>Confidence: {(doc.confidence * 100).toFixed(0)}%</span>
                <span>{doc.pageCount} pages</span>
                {doc.dateIdentified && <span>{doc.dateIdentified}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
