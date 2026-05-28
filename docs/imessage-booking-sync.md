# iMessage → booking calendar sync

End-to-end pipeline that turns Jeff's iMessage quote conversations into
calendared TSGC bookings, with a one-tap human-in-the-loop confirmation.

## Why

99% of TSGC bookings happen via text. The manual loop today is:

1. Customer texts asking about a clean.
2. Jeff chats back and forth — price, photos, date, time.
3. Jeff opens Google Calendar and types in the appointment.
4. Jeff opens the CRM sheet and adds the row.

This system collapses steps 3 + 4 into a single push-notification tap.

## Data flow

```
┌──────────────────────────┐    HMAC-signed POST     ┌──────────────────────────────┐
│  Mac (signed into Jeff's │  ───────────────────▶   │ Next.js /api/imessage/ingest │
│  iMessage account)       │   recent thread context │                              │
│                          │                         │ 1. Classify via Claude       │
│  imessage-relay/relay.js │  ◀──────────────────────│ 2. If newly "confirmed":     │
│  polls chat.db every 15s │   {stage, didNotify,    │    a. write pending row     │
│  per-chat state in       │    pendingId, summary}  │       (Apps Script)          │
│  state.db (SQLite)       │                         │    b. send ntfy / Pushover  │
└──────────────────────────┘                         │       with confirm URL       │
                                                     └──────────────────────────────┘
                                                                    │
                                                                    │ push notification
                                                                    ▼
                                                     ┌──────────────────────────────┐
                                                     │  Jeff's iPhone               │
                                                     │  taps "Add to TSGC Schedule" │
                                                     └─────────────┬────────────────┘
                                                                    │
                                                                    ▼
                                                     ┌──────────────────────────────┐
                                                     │ /api/imessage/confirm?token= │
                                                     │  verify HMAC token           │
                                                     │  → Apps Script:              │
                                                     │     - CalendarApp.createEvent│
                                                     │       on "TSGC Schedule"     │
                                                     │     - append row to CRM tab  │
                                                     │     - flip pending → BOOKED  │
                                                     └──────────────────────────────┘
```

## The five pieces

| Piece | Location | Purpose |
| --- | --- | --- |
| **Mac relay** | `imessage-relay/relay.js` | Tails chat.db, signs payloads, POSTs to ingest. Per-chat watermark + stage cache in `state.db`. |
| **Ingest webhook** | `app/api/imessage/ingest/route.ts` | Verifies HMAC, classifies via Claude (`lib/imessage/classify.ts`), writes pending row, pings ntfy/Pushover. |
| **Confirm endpoint** | `app/api/imessage/confirm/route.ts` | Verifies HMAC token, asks Apps Script to materialize the booking. Renders a small success page. |
| **Apps Script handlers** | `integrations/apps-script-endpoint.js` (`handleImessagePendingBooking_`, `handleImessageConfirmBooking_`) | Owns all Google writes: the pending sheet tab, the calendar event, the CRM row. |
| **Notification** | `lib/imessage/notify.ts` | ntfy (default, free) or Pushover (paid, more reliable). Sends a high-priority push with the one-tap URL action. |

## What lives where

| Concern | Source of truth |
| --- | --- |
| Conversation history | `chat.db` on the Mac (Apple owns it) |
| Per-chat "last classified through" watermark | `state.db` on the Mac (`chat_state` table) |
| Pending bookings (status: PENDING / BOOKED) | `📱 iMessage Pending` tab in the CRM sheet |
| Confirmed bookings | `TSGC Schedule` Google Calendar + `📋 CRM + Jobs` tab |
| Booking classification | Stateless — Claude runs fresh on each ingest with the last ~30 messages |

The webhook is intentionally stateless. The Mac is stateful. This means
restarting the Vercel function never causes double-pings, and you can
clear `state.db` to re-classify from scratch.

## Setup

### 1. Vercel env vars

Add to **Production + Preview**:

```
IMESSAGE_RELAY_SECRET=<openssl rand -base64 48>
IMESSAGE_CONFIRM_SECRET=<openssl rand -base64 48>
APP_ORIGIN=https://tristategrillcleaning.com

# pick ONE notification provider:
NTFY_TOPIC=tsgc-bookings-<random suffix>
# or:
PUSHOVER_USER_KEY=...
PUSHOVER_APP_TOKEN=...
```

The existing `ANTHROPIC_API_KEY` (already in place for `/preview`) is
reused by the classifier — no new key needed.

### 2. Deploy the Apps Script changes

```
cd integrations
pbcopy < apps-script-endpoint.js
```

Then in script.google.com → existing TSGC lead intake project → paste
over the file → **Deploy → Manage deployments → Edit → New version → Deploy**.

The deployed URL **does not change** when you ship a new version, so
`SITE.quoteEndpoint` in `lib/site.ts` stays as-is.

First time only: in the Apps Script editor, run any function so the new
Calendar OAuth scope (`https://www.googleapis.com/auth/calendar`) is
authorized.

### 3. Notification subscription

**ntfy** (free):

1. Install the ntfy iOS app.
2. Subscribe to the topic you set as `NTFY_TOPIC`.
3. (Optional) Set Notifications priority → High in iOS Settings → ntfy → Notifications so it bypasses Focus.

**Pushover** (paid, ~$5 one-time):

1. Install Pushover iOS app, sign in.
2. Create an Application at pushover.net → copy the App Token.
3. Copy your User Key from the dashboard.

### 4. Create the calendar

In Google Calendar, create a new calendar named exactly `TSGC Schedule`
(or change `TSGC_SCHEDULE_CALENDAR_NAME` in
`integrations/apps-script-endpoint.js`).

### 5. Set up the Mac relay

See `imessage-relay/README.md` — copy the folder onto the Mac, `npm
install`, copy `.env.example` to `.env` and fill in `TSGC_INGEST_URL` +
`IMESSAGE_RELAY_SECRET` (must match Vercel).

Grant **Full Disk Access** to the binary that will run node (Terminal,
or `/usr/local/bin/node` if running via launchd) — without it, reading
`chat.db` fails.

Then `npm start` to verify, then install the launchd plist for
auto-start.

## Operational notes

- **Sometimes-on MacBook**: the relay catches up on wake — chat.db keeps
  full history. The push notification is delayed by however long the lid
  was closed. For real-time alerts, leave the lid open or use a Mac mini.
- **Double-ping protection**: the relay records `last_notified_pending_id`
  per chat. If a confirmed thread gets another message after the ping,
  the webhook sees `lastNotifiedPendingId` already set and returns
  `didNotify: false` — no spam.
- **Editing or canceling a booking**: today, the relay only handles the
  forward flow (inquiry → confirmed → calendar). If a customer texts
  "actually let's move it to Saturday", the original event stays on the
  calendar; you'll need to update it manually. Future work: detect
  reschedule intent and surface a separate notification.
- **Privacy**: the classifier explicitly returns `stage: "non_booking"`
  for personal/family chats — those are silently dropped, never notified
  on, and the only state stored about them is the watermark. To keep the
  relay entirely out of certain chats, set `ALLOWED_CHAT_PHONES` in the
  relay `.env`.
- **Pricing on the Apps Script side**: `CalendarApp` runs as the Apps
  Script owner (Jeff). It can write to any calendar Jeff owns or has
  write access to. No OAuth dance, no service account, no refresh tokens.
- **Failure modes**:
  - Apps Script down → ingest returns 502; the relay retries next poll.
  - ntfy down → the pending row is still written; Jeff can confirm
    manually by hitting the URL from the log.
  - Claude down/slow → ingest times out at 30s; the relay leaves the
    watermark un-bumped and retries.
  - Mac asleep → no polling; resumes on wake.

## What's intentionally NOT built (yet)

- **Admin UI for pending bookings**: today the only way to see pending
  rows is in the sheet. If you want a `/admin/imessage` page that lists
  them with confirm/edit buttons, that's a follow-up.
- **Reschedule / cancel detection**: the classifier only handles the
  forward path.
- **Two-way replies**: the relay reads but doesn't send. Future: let
  Jeff one-tap "yes" from the notification to send a confirmation text
  back via the Mac.
- **Photo storage**: image attachments are forwarded to Claude inline
  for classification but not saved to Drive. The CRM row reference says
  "N photos in thread" rather than embedding them. Add Drive upload in
  `handleImessagePendingBooking_` if Jeff needs them on-site.
