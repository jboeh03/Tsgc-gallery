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

type NotifyArgs = {
  title: string;
  message: string;
  confirmUrl: string;
};

type NotifyResult = { sent: boolean; provider: string; error?: string };

async function sendPushover(args: NotifyArgs): Promise<NotifyResult> {
  const user = process.env.PUSHOVER_USER_KEY;
  const token = process.env.PUSHOVER_APP_TOKEN;
  if (!user || !token) return { sent: false, provider: "pushover", error: "not configured" };

  const body = new URLSearchParams({
    token,
    user,
    title: args.title,
    message: args.message,
    url: args.confirmUrl,
    url_title: "Add to TSGC Schedule",
    priority: "1",
  });

  const res = await fetch("https://api.pushover.net/1/messages.json", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
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

async function sendNtfy(args: NotifyArgs): Promise<NotifyResult> {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return { sent: false, provider: "ntfy", error: "not configured" };
  const server = process.env.NTFY_SERVER || "https://ntfy.sh";

  const headers: Record<string, string> = {
    Title: args.title,
    Priority: "high",
    Tags: "calendar,fire",
    Click: args.confirmUrl,
    Actions: `view, Add to TSGC Schedule, ${args.confirmUrl}, clear=true`,
  };
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

export async function sendBookingNotification(
  args: NotifyArgs
): Promise<NotifyResult> {
  if (process.env.PUSHOVER_USER_KEY && process.env.PUSHOVER_APP_TOKEN) {
    return sendPushover(args);
  }
  return sendNtfy(args);
}
