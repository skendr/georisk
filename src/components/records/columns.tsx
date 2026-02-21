"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { CrimeRecord } from "@/types/crime";

export const columns: ColumnDef<CrimeRecord>[] = [
  {
    accessorKey: "incidentId",
    header: "Incident ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue("incidentId")}</span>
    ),
  },
  {
    accessorKey: "crimeDate",
    header: "Date",
  },
  {
    accessorKey: "crimeName1",
    header: "Crime Type",
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue("crimeName1")}</Badge>
    ),
  },
  {
    accessorKey: "crimeName2",
    header: "Crime Detail",
  },
  {
    accessorKey: "city",
    header: "City",
  },
  {
    accessorKey: "district",
    header: "District",
  },
  {
    accessorKey: "totalVictims",
    header: "Victims",
    cell: ({ row }) => (
      <span className="text-center">{row.getValue("totalVictims")}</span>
    ),
  },
  {
    accessorKey: "agency",
    header: "Agency",
  },
];
