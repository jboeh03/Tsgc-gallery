export type GrillType = "gas" | "charcoal" | "pellet" | "built-in";

/**
 * A single before/after photo pair within a job. A job is always at least one
 * pair; some jobs have multiple pairs to capture different angles (cookbox,
 * grates, hood interior, etc.). The first pair is treated as the hero.
 */
export type Pair = {
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
  /** Optional short label for this angle — e.g. "Cookbox", "Hood interior". */
  caption?: string;
};

export type Job = {
  id: string;
  neighborhood: string;
  date: string; // ISO yyyy-mm-dd
  grillType: GrillType;
  grillModel: string;
  serviceHours: number;
  pairs: Pair[];
  featured: boolean;
  notes?: string;
  /** URL slug for the per-job detail page. Falls back to `id`. */
  slug?: string;
};

export function jobSlug(job: Pick<Job, "id" | "slug">): string {
  return job.slug ?? job.id;
}
