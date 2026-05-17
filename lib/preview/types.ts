/**
 * Shared types for the AI grill preview feature.
 */

export type GrillTypeDetected =
  | "gas"
  | "charcoal"
  | "pellet"
  | "built-in"
  | "flat-top"
  | "smoker"
  | "unknown";

export type Confidence = "low" | "medium" | "high";

export interface Assessment {
  grillTypeDetected: GrillTypeDetected;
  brandDetected: string | null;
  burnerCount: number | null;
  conditionIssues: string[];
  conditionSeverity: "light" | "moderate" | "heavy" | "extreme";
  estimatedServiceHours: number;
  estimatedPriceLow: number;
  estimatedPriceHigh: number;
  recommendedService: string;
  recommendation: string;
  confidence: Confidence;
}

export interface PreviewResponse {
  assessment: Assessment;
  generatedImage: {
    dataUrl: string;
    provider: "gemini" | "skipped";
  } | null;
  leadId: string;
}

export interface PreviewRequestBody {
  imageBase64: string;
  imageMimeType: "image/jpeg" | "image/png" | "image/webp";
  email: string;
  firstName?: string;
  zip?: string;
  consent: boolean;
}
