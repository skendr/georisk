export interface ClimateFeatures {
  meanTemp: number;
  meanPrecipitation: number;
  extremeHeatDays: number;
  heavyRainDays: number;
}

export interface ClimateRiskData extends ClimateFeatures {
  county: string;
  fips: string;
  riskScore: number;
  riskScoreNorm: number;
  riskLevel: "Low" | "Moderate" | "High" | "Very High";
  propertyValueImpact: number;
  medianHomeValue: number;
  adjustedHomeValue: number;
}

export interface ClimateReportData extends ClimateRiskData {
  stateAvgRiskScore: number;
  countyRank: number;
  totalCounties: number;
}
