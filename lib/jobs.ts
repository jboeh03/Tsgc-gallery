import type { Job, GrillType } from "./types";
import data from "@/data/jobs.json";

/**
 * Single entry point for job data. Today it reads the bundled JSON.
 * To switch to Google Sheets, set NEXT_PUBLIC_JOBS_SOURCE=sheet and
 * NEXT_PUBLIC_JOBS_SHEET_CSV_URL=<published CSV url>.
 */
export async function getJobs(): Promise<Job[]> {
  if (
    process.env.NEXT_PUBLIC_JOBS_SOURCE === "sheet" &&
    process.env.NEXT_PUBLIC_JOBS_SHEET_CSV_URL
  ) {
    try {
      return await getJobsFromSheet(
        process.env.NEXT_PUBLIC_JOBS_SHEET_CSV_URL
      );
    } catch (err) {
      console.error("[jobs] Sheet fetch failed, falling back to JSON:", err);
    }
  }
  return (data.jobs as Job[]).slice().sort(byDateDesc);
}

export function getFeaturedJob(jobs: Job[]): Job | undefined {
  const featured = jobs.filter((j) => j.featured).sort(byDateDesc);
  return featured[0] ?? jobs[0];
}

function byDateDesc(a: Job, b: Job): number {
  return b.date.localeCompare(a.date);
}

// TODO: swap to Google Sheets fetcher.
// When Jeff is ready, publish the sheet as CSV (File → Share → Publish to web → CSV)
// and set the env vars above. Column headers must match the Job keys.
export async function getJobsFromSheet(csvUrl: string): Promise<Job[]> {
  const res = await fetch(csvUrl, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  const csv = await res.text();
  return parseJobsCsv(csv).sort(byDateDesc);
}

/** Tiny RFC-4180-ish CSV parser. Handles quoted fields and embedded commas. */
function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

function parseJobsCsv(csv: string): Job[] {
  const rows = parseCsv(csv);
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = (cells[i] ?? "").trim()));
    return {
      id: obj.id,
      neighborhood: obj.neighborhood,
      date: obj.date,
      grillType: obj.grillType as GrillType,
      grillModel: obj.grillModel,
      serviceHours: Number(obj.serviceHours),
      // Sheet rows always carry a single hero pair. Multi-pair jobs are
      // edited in jobs.json today; revisit when the upload UI ships.
      pairs: [
        {
          before: obj.beforeImage,
          after: obj.afterImage,
          beforeAlt: obj.beforeAlt,
          afterAlt: obj.afterAlt,
        },
      ],
      featured: /^(true|yes|1)$/i.test(obj.featured ?? ""),
      notes: obj.notes || undefined,
      slug: obj.slug || undefined,
    };
  });
}
