# TSGC iMessage relay

Polls your Mac's `~/Library/Messages/chat.db` for new inbound iMessage activity and POSTs recent thread context to the Tri-State Grill Cleaning ingest webhook for booking classification.

It's the on-Mac half of the booking-sync pipeline. The cloud half lives in `app/api/imessage/*` of the main repo.

## What it does

Every 15 seconds (configurable):

1. Snapshot `chat.db` so we don't fight Messages.app for the file lock.
2. Find any 1:1 chats that have new inbound messages since the relay last reported on them.
3. For each, pull the last ~30 messages + small image attachments, HMAC-sign the payload, POST to `TSGC_INGEST_URL`.
4. The webhook classifies the stage (inquiry / quoting / needs_info / confirmed) and — only on a fresh transition into "confirmed" — pings Jeff with a one-tap link to add the booking to the TSGC schedule calendar.
5. Record the new high-water mark + stage locally in `state.db` so we don't re-classify the same thread.

The relay never writes to chat.db, never sends iMessages, and never touches threads without inbound activity. It does need read access to your Messages folder (see Full Disk Access below).

## Prereqs

- macOS, signed into Jeff's iMessage account
- Node.js 20+ (`brew install node` if missing)
- TSGC webhook URL + shared HMAC secret from the deployed Next.js app

## Install

```bash
# Clone or copy this folder onto the Mac
cd ~ && git clone https://github.com/jboeh03/tsgc-gallery.git
cd tsgc-gallery/imessage-relay

# Move it somewhere the launchd plist can find it (or update the plist paths)
cp -R . ~/tsgc-imessage-relay
cd ~/tsgc-imessage-relay

# Install dependencies
npm install

# Configure
cp .env.example .env
$EDITOR .env   # fill in TSGC_INGEST_URL and IMESSAGE_RELAY_SECRET
```

### Grant Full Disk Access

`chat.db` lives under `~/Library/Messages`, which macOS protects. The process reading it (Terminal, iTerm, or `node` when launched by launchd) needs Full Disk Access:

1. System Settings → Privacy & Security → **Full Disk Access**
2. Add the binary that will be running the relay:
   - If running via `npm start` from Terminal: add **Terminal.app** (or iTerm)
   - If running via launchd: add `/usr/local/bin/node` (or `which node` output)

Without this, the first poll fails with `EACCES` or a permission error.

## Run

### Manual / interactive

```bash
npm start
```

### Run once (handy for testing)

```bash
npm run once
```

### As a background service (recommended)

```bash
# Edit the plist — replace YOUR_USERNAME and verify the node path
$EDITOR com.tsgc.imessage-relay.plist

cp com.tsgc.imessage-relay.plist ~/Library/LaunchAgents/
launchctl load -w ~/Library/LaunchAgents/com.tsgc.imessage-relay.plist

# Tail logs
tail -f ~/Library/Logs/tsgc-imessage-relay.log
```

To stop:

```bash
launchctl unload -w ~/Library/LaunchAgents/com.tsgc.imessage-relay.plist
```

## Sleep / wake behavior

When the MacBook closes / sleeps, the relay pauses with the OS. On wake, the next poll picks up any messages that arrived during the gap — chat.db keeps the full history and we read from the last-known ROWID forward. **You won't lose messages, but the notification can be delayed by however long the lid was closed.** Keep the lid open (or use a Mac mini / desk Mac) for the best response time.

## State

`state.db` (SQLite) keeps one row per chat with `last_sent_rowid`, `last_stage`, and `last_notified_pending_id`. Safe to delete if you want to re-classify everything (note: `STARTUP_BACKFILL_HOURS=0` means deleting just re-seeds the high-water mark to "now").

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `chat.db snapshot failed: EACCES` | Full Disk Access not granted to the binary running node |
| `ingest 401: bad_signature` | `IMESSAGE_RELAY_SECRET` differs between this `.env` and Vercel |
| `ingest 401: skew` | Mac clock is more than 5 min off — `sudo sntp -sS time.apple.com` |
| `ingest 500: ANTHROPIC_API_KEY not set` | Vercel side missing the key |
| No notification on confirmed booking | Check `NTFY_TOPIC` or Pushover env on Vercel; see logs for the provider error |
| Notifications fire for the wrong threads | Set `ALLOWED_CHAT_PHONES` in `.env` while testing |

## Privacy

The relay sends to your own webhook only. The webhook forwards the last ~30 messages of context (plus small image attachments) to Anthropic's API for classification — never to a third party. Personal/family chats are filtered out by the classifier (`stage: "non_booking"`) and never trigger a notification.

If a chat is sensitive enough you'd rather the relay not see it at all, use `ALLOWED_CHAT_PHONES` to whitelist only your customer numbers.
