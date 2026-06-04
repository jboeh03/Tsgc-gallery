/**
 * Push notification sender for confirmed-booking alerts.
 *
 * Supports ntfy.sh (free, no account) and Pushover (paid, more reliable
 * iOS delivery). Pick one via env: if PUSHOVER_USER_KEY + PUSHOVER_APP_TOKEN
 * are set, we use Pushover; otherwise fall back to NTFY_TOPIC.
 *
 * Both providers support a one-tap URL action that opens the confirm link.
 * The link itself is HMAC-signed (see sign.ts) so the secret only needs
 * to exist on the server.
 */

type PushArgs = {
  title: string;
  message: string;
  /** Optional tap target. */
  url?: string;
  /** Label for the tap action (defaults to "Open"). */
  urlTitle?: string;
  /** ntfy tag emojis (e.g. "calendar,fire"); ignored by Pushover. */
  tags?: string;
};

type NotifyResult = { sent: boolean; provider: string; error?: string };

async function sendPushover(args: PushArgs): Promise<NotifyResult> {
  const user = process.env.PUSHOVER_USER_KEY;
  const token = process.env.PUSHOVER_APP_TOKEN;
  if (!user || !token) return { sent: false, provider: "pushover", error: "not configured" };

  const params: Record<string, string> = {
    token,
    user,
    title: args.title,
    message: args.message,
    priority: "1",
  };
  if (args.url) {
    params.url = args.url;
    params.url_title = args.urlTitle ?? "Open";
  }

  const res = await fetch("https://api.pushover.net/1/messages.json", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  if (!res.ok) {
    return {
      sent: false,
      provider: "pushover",
      error: `${res.status} ${await res.text().catch(() => "")}`.slice(0, 200),
    };
  }
  return { sent: true, provider: "pushover" };
}

async function sendNtfy(args: PushArgs): Promise<NotifyResult> {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return { sent: false, provider: "ntfy", error: "not configured" };
  const server = process.env.NTFY_SERVER || "https://ntfy.sh";

  const headers: Record<string, string> = {
    Title: args.title,
    Priority: "high",
    Tags: args.tags ?? "bell",
  };
  if (args.url) {
    headers.Click = args.url;
    headers.Actions = `view, ${args.urlTitle ?? "Open"}, ${args.url}, clear=true`;
  }
  // ntfy supports optional Bearer auth for private/protected topics.
  const token = process.env.NTFY_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${server.replace(/\/$/, "")}/${encodeURIComponent(topic)}`, {
    method: "POST",
    headers,
    body: args.message,
  });
  if (!res.ok) {
    return {
      sent: false,
      provider: "ntfy",
      error: `${res.status} ${await res.text().catch(() => "")}`.slice(0, 200),
    };
  }
  return { sent: true, provider: "ntfy" };
}

/** Generic push: Pushover if configured, else ntfy. No-ops (sent:false) if neither is set. */
export async function sendPush(args: PushArgs): Promise<NotifyResult> {
  if (process.env.PUSHOVER_USER_KEY && process.env.PUSHOVER_APP_TOKEN) {
    return sendPushover(args);
  }
  return sendNtfy(args);
}

/** Booking-confirmation push with the one-tap "Add to Schedule" action. */
export async function sendBookingNotification(args: {
  title: string;
  message: string;
  confirmUrl: string;
}): Promise<NotifyResult> {
  return sendPush({
    title: args.title,
    message: args.message,
    url: args.confirmUrl,
    urlTitle: "Add to TSGC Schedule",
    tags: "calendar,fire",
  });
}
