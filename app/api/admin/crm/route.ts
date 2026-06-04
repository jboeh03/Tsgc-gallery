import { revalidateTag } from "next/cache";
import { auth, isAdmin } from "@/auth";
import { updateJob, updateContact, logEvent } from "@/lib/db/writes";
import type { JobRow, ContactRow } from "@/lib/db/types";

export const runtime = "nodejs";

/** Editable CRM saves: patch a job and/or its contact, then revalidate the lists. */
export async function POST(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!isAdmin(email)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { jobId, contactId, job, contact } = (await req.json().catch(() => ({}))) as {
    jobId?: string;
    contactId?: string | null;
    job?: Partial<JobRow>;
    contact?: Partial<ContactRow>;
  };
  if (!jobId) return Response.json({ error: "jobId required" }, { status: 400 });

  try {
    if (job && Object.keys(job).length) await updateJob(jobId, job);
    if (contactId && contact && Object.keys(contact).length) await updateContact(contactId, contact);
    await logEvent("status_change", { jobId, contactId }, {
      by: email,
      job: job ?? null,
      contact: contact ?? null,
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "save failed" }, { status: 500 });
  }

  revalidateTag("admin-leads");
  revalidateTag("admin-jobs");
  return Response.json({ ok: true });
}
