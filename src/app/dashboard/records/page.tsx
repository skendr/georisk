import { DataTable } from "@/components/records/data-table";

export default function RecordsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Records</h1>
        <p className="text-muted-foreground">
          Browse and filter crime records
        </p>
      </div>
      <DataTable />
    </div>
  );
}
