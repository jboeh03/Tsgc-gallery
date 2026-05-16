export type GrillType = "gas" | "charcoal" | "pellet" | "built-in";

export type Job = {
  id: string;
  neighborhood: string;
  date: string; // ISO yyyy-mm-dd
  grillType: GrillType;
  grillModel: string;
  serviceHours: number;
  beforeImage: string;
  afterImage: string;
  beforeAlt: string;
  afterAlt: string;
  featured: boolean;
  notes?: string;
  /** Optional URL slug for future per-job pages. */
  slug?: string;
};
