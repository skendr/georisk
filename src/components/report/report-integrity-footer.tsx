import { ShieldCheck } from "lucide-react";

export function ReportIntegrityFooter({
  authorName,
  createdAt,
}: {
  authorName: string;
  createdAt: string | Date;
}) {
  const formatted = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
      <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
      <p className="text-sm text-muted-foreground">
        This report was generated on{" "}
        <span className="font-medium text-foreground">{formatted}</span> by{" "}
        <span className="font-medium text-foreground">{authorName}</span>{" "}
        &mdash; integrity ensured by GeoRisk
      </p>
    </div>
  );
}
