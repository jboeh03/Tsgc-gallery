/**
 * Shared types for the iMessage → booking calendar sync flow.
 *
 * The Mac relay (imessage-relay/) sends recent thread context to
 * /api/imessage/ingest, which classifies the conversation stage via
 * Claude and — on a fresh "confirmed" transition — pings Jeff to
 * approve adding it to the TSGC schedule calendar.
 */

export type IngestMessage = {
  /** chat.db ROWID — monotonic per-Mac id; used for ordering + dedupe. */
  rowid: number;
  /** ISO timestamp (relay converts Apple's Mach time before sending). */
  isoDate: string;
  /** true if the message was from Jeff (outbound), false if customer (inbound). */
  fromMe: boolean;
  /** Plain text body. iMessage attachment-only messages may have empty text. */
  text: string;
  /** Attachment summaries (MIME + base64 for images <=1MB; else just MIME + filename). */
  attachments: Array<{
    mime: string;
    filename: string;
    /** base64 image data, only present for image attachments under the relay size cap. */
    imageBase64?: string;
  }>;
};

export type IngestRequest = {
  /** chat.db chat GUID — stable per conversation/phone number. */
  chatGuid: string;
  /** Normalized E.164 phone number of the customer (or null for group chats). */
  customerPhone: string | null;
  /** Display name from Contacts, if the relay could resolve it. */
  customerName: string | null;
  /** Recent thread context — most recent ~30 messages, oldest first. */
  messages: IngestMessage[];
  /** Stage the relay last recorded for this chat. Lets the webhook short-circuit. */
  priorStage: BookingStage | null;
  /** ID the relay used last time it got a "didNotify: true" — avoids double-ping. */
  lastNotifiedPendingId: string | null;
};

export type BookingStage =
  /** Conversation looks unrelated to booking (referral chat, friend, etc.). */
  | "non_booking"
  /** Customer reached out asking about service but no quote yet. */
  | "inquiry"
  /** Quote/pricing discussion in progress, no date pinned. */
  | "quoting"
  /** Need more info (address, grill photo, preferred time) before confirming. */
  | "needs_info"
  /** Date, time, and price all agreed — ready to add to calendar. */
  | "confirmed";

export type ExtractedBooking = {
  customerName: string | null;
  /** Service address if mentioned; null if not yet shared. */
  address: string | null;
  /** Total agreed price in USD (integer dollars). null if not yet agreed. */
  agreedPriceUsd: number | null;
  /** ISO date YYYY-MM-DD for the scheduled service. null if not pinned. */
  scheduledDate: string | null;
  /** 24h start time HH:MM in local time. null if window-only ("morning"). */
  scheduledStartTime: string | null;
  /** Plain-English time description as written ("morning", "after 2pm", "9am"). */
  scheduledTimeLabel: string | null;
  /** Estimated job duration in hours. Default 3 if unknown. */
  durationHours: number;
  /** Brief grill description (e.g. "4-burner Weber Genesis"). */
  grillDescription: string | null;
  /** Free-form notes worth surfacing on the calendar event. */
  notes: string | null;
  /** Number of image attachments shared in the thread (informational). */
  photoCount: number;
};

export type ClassificationResult = {
  stage: BookingStage;
  /** Claude's confidence in the stage classification. */
  confidence: "low" | "medium" | "high";
  /** One-line summary of where the conversation stands. */
  summary: string;
  booking: ExtractedBooking;
};

export type IngestResponse = {
  stage: BookingStage;
  /** True when this call produced a fresh "confirmed" notification. */
  didNotify: boolean;
  /** Apps Script pending row id (returned only when didNotify is true). */
  pendingId: string | null;
  /** The one-tap confirm URL (returned only when didNotify is true). */
  confirmUrl: string | null;
  summary: string;
};

export type PendingBookingPayload = {
  pendingId: string;
  chatGuid: string;
  customerName: string | null;
  customerPhone: string | null;
  booking: ExtractedBooking;
  /** Last few messages, formatted as a short transcript, for Jeff's reference. */
  transcript: string;
  /** Image attachment data URLs (small photos shared in the thread). */
  photoDataUrls: string[];
  /** Lead qualifying score 0-100 + breakdown (see lib/leads/qualify.ts). */
  qualification: import("@/lib/leads/types").QualifiedLead;
  createdAt: string;
};
