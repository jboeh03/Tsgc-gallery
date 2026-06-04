/**
 * Lightweight observability for the HQ. Failures used to be swallowed silently;
 * now they land in the `events` table (kind "error") so they're visible in
 * /admin, and CRITICAL-path failures also fire a one-line SMS alert to Jeff so
 * he hears about an outage before a customer does.
 *
 * Deliberately lightweight — no external APM. The events table + the System
 * Health panel + the alert SMS are right-sized for a one-person business.
 */

import { logEvent } from "@/lib/db/writes";
import { sendSms, isTwilioConfigured } from "@/lib/sms/twilio";

const ALERT_TO = process.env.ALERT_TO || process.env.BOOKING_NOTIFY_TO || "+16578314276";

export type ErrorContext = {
  critical?: boolean;
  contactId?: string | null;
  jobId?: string | null;
  conversationId?: string | null;
  [k: string]: unknown;
};

/** Record an error to the audit log, and alert Jeff on critical paths. Never throws. */
export async function logError(scope: string, err: unknown, ctx: ErrorContext = {}): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  const { critical, contactId, jobId, conversationId, ...rest } = ctx;
  try {
    await logEvent(
      "error",
      { contactId: contactId ?? null, jobId: jobId ?? null, conversationId: conversationId ?? null },
      { scope, message: message.slice(0, 500), ...rest }
    );
  } catch {
    /* logging must never throw into the caller */
  }
  if (critical && isTwilioConfigured()) {
    try {
      await sendSms({ to: ALERT_TO, body: `⚠️ TSGC ${scope}: ${message.slice(0, 130)}` });
    } catch {
      /* alert is best-effort */
    }
  }
}
