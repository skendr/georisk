const SEVERITY_MAP: Record<string, string> = {
  critical: "bg-red-700 text-white",
  high: "bg-red-500 text-white",
  medium: "bg-orange-500 text-white",
  moderate: "bg-orange-500 text-white",
  low: "bg-yellow-500 text-black",
  info: "bg-blue-500 text-white",
  informational: "bg-blue-500 text-white",
};

export function severityStyle(severity: string): string {
  const normalized = severity.toLowerCase().replace(/[\s-]/g, "_");
  return SEVERITY_MAP[normalized] || "bg-gray-500 text-white";
}
