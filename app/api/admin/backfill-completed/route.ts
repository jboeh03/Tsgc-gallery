import { revalidateTag } from "next/cache";
import { auth, isAdmin } from "@/auth";
import { backfillCompletedFromCalendar } from "@/lib/calendar-sync";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Import past TSGC Schedule calendar events into the CRM as completed jobs. */
export async function POST() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const result = await backfillCompletedFromCalendar();
    revalidateTag("admin-jobs");
    revalidateTag("admin-leads");
    return Response.json({ ok: true, ...result });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "backfill failed" }, { status: 500 });
  }
}
