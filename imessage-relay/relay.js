#!/usr/bin/env node
/**
 * TSGC iMessage relay — runs on a Mac signed into Jeff's iMessage.
 *
 * Polls ~/Library/Messages/chat.db every POLL_INTERVAL_MS seconds.
 * For each chat that has new inbound messages since the last poll,
 * grabs recent context (last N messages + small image attachments),
 * HMAC-signs the payload, and POSTs to the TSGC ingest webhook.
 *
 * State (per-chat last_sent_rowid, last_stage, last_notified_pending_id)
 * is kept in a local SQLite file next to this script so the relay
 * survives Mac sleep/wake and restarts. Old messages aren't re-classified
 * on first run — we seed last_sent_rowid to the current max so the relay
 * only sees genuinely new traffic.
 *
 * Env vars (see .env.example):
 *   TSGC_INGEST_URL              required
 *   IMESSAGE_RELAY_SECRET        required — must match Vercel env
 *   POLL_INTERVAL_MS             default 15000
 *   CONTEXT_MESSAGE_COUNT        default 30 (messages of recent context)
 *   ATTACHMENT_MAX_BYTES         default 1048576 (1 MB cap on inline images)
 *   STATE_DB                     default ./state.db
 *   CHAT_DB                      default ~/Library/Messages/chat.db
 *   STARTUP_BACKFILL_HOURS       default 0 (set to e.g. 24 to catch up
 *                                  messages from the last day on first run)
 *   ALLOWED_CHAT_PHONES          optional comma-separated list of E.164 numbers
 *                                  to whitelist; if set, other chats are ignored.
 *   DEBUG                        any truthy value enables verbose logging
 */

import { createHmac } from "node:crypto";
import { readFileSync, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────
const INGEST_URL = required("TSGC_INGEST_URL");
const RELAY_SECRET = required("IMESSAGE_RELAY_SECRET");
const POLL_INTERVAL_MS = int("POLL_INTERVAL_MS", 15_000);
const CONTEXT_COUNT = int("CONTEXT_MESSAGE_COUNT", 30);
const ATTACH_MAX_BYTES = int("ATTACHMENT_MAX_BYTES", 1_048_576);
const STATE_DB_PATH = resolve(__dirname, process.env.STATE_DB || "state.db");
const CHAT_DB_PATH = resolve(
  process.env.CHAT_DB || join(homedir(), "Library/Messages/chat.db")
);
const STARTUP_BACKFILL_HOURS = int("STARTUP_BACKFILL_HOURS", 0);
const ALLOWED_PHONES = (process.env.ALLOWED_CHAT_PHONES || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const DEBUG = !!process.env.DEBUG;
const RUN_ONCE = process.argv.includes("--once");

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`[relay] missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}
function int(name, dflt) {
  const v = process.env[name];
  if (v == null || v === "") return dflt;
  const n = Number(v);
  return Number.isFinite(n) ? n : dflt;
}
function log(...args) {
  console.log(`[relay ${new Date().toISOString()}]`, ...args);
}
function dbg(...args) {
  if (DEBUG) console.log(`[relay debug ${new Date().toISOString()}]`, ...args);
}

// ── State (per-chat tracking; survives restarts) ──────────────
const state = new Database(STATE_DB_PATH);
state.pragma("journal_mode = WAL");
state.exec(`
  CREATE TABLE IF NOT EXISTS chat_state (
    chat_guid TEXT PRIMARY KEY,
    last_sent_rowid INTEGER NOT NULL DEFAULT 0,
    last_stage TEXT,
    last_notified_pending_id TEXT,
    updated_at TEXT NOT NULL
  );
`);

const getChatState = state.prepare(
  `SELECT last_sent_rowid, last_stage, last_notified_pending_id
     FROM chat_state WHERE chat_guid = ?`
);
const upsertChatState = state.prepare(
  `INSERT INTO chat_state (chat_guid, last_sent_rowid, last_stage, last_notified_pending_id, updated_at)
   VALUES (@chat_guid, @last_sent_rowid, @last_stage, @last_notified_pending_id, @updated_at)
   ON CONFLICT(chat_guid) DO UPDATE SET
     last_sent_rowid = excluded.last_sent_rowid,
     last_stage = COALESCE(excluded.last_stage, chat_state.last_stage),
     last_notified_pending_id = COALESCE(excluded.last_notified_pending_id, chat_state.last_notified_pending_id),
     updated_at = excluded.updated_at`
);

function readChatState(chatGuid) {
  return getChatState.get(chatGuid) || null;
}
function writeChatState(chatGuid, fields) {
  upsertChatState.run({
    chat_guid: chatGuid,
    last_sent_rowid: fields.last_sent_rowid ?? 0,
    last_stage: fields.last_stage ?? null,
    last_notified_pending_id: fields.last_notified_pending_id ?? null,
    updated_at: new Date().toISOString(),
  });
}

// ── chat.db access ────────────────────────────────────────────
// Apple's Messages app holds an exclusive lock on chat.db while it runs.
// Copy it to a temp file before each poll so we can read without conflict.
function snapshotChatDb() {
  const tmpPath = join(tmpdir(), `tsgc-chatdb-${process.pid}.db`);
  copyFileSync(CHAT_DB_PATH, tmpPath);
  // chat.db ships a -wal and -shm sidecar; copy those too so reads see the
  // freshest committed state. They're optional; ignore if missing.
  for (const ext of ["-wal", "-shm"]) {
    try {
      if (existsSync(CHAT_DB_PATH + ext)) {
        copyFileSync(CHAT_DB_PATH + ext, tmpPath + ext);
      }
    } catch (e) {
      dbg(`sidecar ${ext} copy skipped:`, e.message);
    }
  }
  return tmpPath;
}

// Apple uses Mach absolute time in nanoseconds since 2001-01-01.
const APPLE_EPOCH_OFFSET_S = 978307200; // seconds between 1970 and 2001
function appleNanosToIso(n) {
  if (!n) return new Date().toISOString();
  const seconds = APPLE_EPOCH_OFFSET_S + n / 1e9;
  return new Date(seconds * 1000).toISOString();
}

function normalizePhone(handleId) {
  if (!handleId) return null;
  if (handleId.includes("@")) return handleId; // email-based iMessage
  const digits = handleId.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return handleId;
}

function loadAttachmentInline(filePath, mimeType) {
  try {
    // chat.db stores ~/Library/Messages/Attachments paths starting with "~/".
    const abs = filePath.startsWith("~")
      ? filePath.replace(/^~/, homedir())
      : filePath;
    const buf = readFileSync(abs);
    if (buf.byteLength > ATTACH_MAX_BYTES) return null;
    if (!mimeType || !mimeType.startsWith("image/")) return null;
    return buf.toString("base64");
  } catch (e) {
    dbg(`attachment read skipped (${filePath}): ${e.message}`);
    return null;
  }
}

// ── Query helpers ─────────────────────────────────────────────
function queryActiveChats(db, opts) {
  // Find chats with at least one inbound (is_from_me=0) message either since
  // the cutoff (startup backfill) or with ROWID greater than any prior state.
  const cutoffNs = opts.cutoffDate
    ? BigInt(Math.floor(
        (opts.cutoffDate.getTime() / 1000 - APPLE_EPOCH_OFFSET_S) * 1e9
      ))
    : null;

  const rows = db
    .prepare(
      `SELECT c.guid AS chat_guid,
              MAX(m.ROWID) AS max_rowid,
              MAX(m.date) AS max_date
         FROM chat c
         JOIN chat_message_join cmj ON cmj.chat_id = c.ROWID
         JOIN message m             ON m.ROWID = cmj.message_id
        WHERE m.is_from_me = 0
          ${cutoffNs != null ? "AND m.date >= @cutoffNs" : ""}
        GROUP BY c.guid`
    )
    .all({ cutoffNs: cutoffNs != null ? cutoffNs.toString() : null });
  return rows;
}

function queryRecentMessages(db, chatGuid, limit) {
  // Pull the most recent N messages for a chat, then reverse to oldest-first.
  const rows = db
    .prepare(
      `SELECT m.ROWID         AS rowid,
              m.date           AS date_ns,
              m.is_from_me     AS from_me,
              m.text           AS text,
              h.id             AS handle_id
         FROM chat c
         JOIN chat_message_join cmj ON cmj.chat_id = c.ROWID
         JOIN message m             ON m.ROWID = cmj.message_id
    LEFT JOIN handle h              ON h.ROWID = m.handle_id
        WHERE c.guid = @chatGuid
        ORDER BY m.ROWID DESC
        LIMIT @limit`
    )
    .all({ chatGuid, limit });
  return rows.reverse();
}

function queryAttachmentsForMessages(db, messageRowids) {
  if (messageRowids.length === 0) return new Map();
  const placeholders = messageRowids.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT maj.message_id AS message_id,
              a.filename     AS filename,
              a.mime_type    AS mime_type,
              a.transfer_name AS transfer_name
         FROM attachment a
         JOIN message_attachment_join maj ON maj.attachment_id = a.ROWID
        WHERE maj.message_id IN (${placeholders})`
    )
    .all(...messageRowids);
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.message_id)) map.set(r.message_id, []);
    map.get(r.message_id).push(r);
  }
  return map;
}

function resolveCustomerForChat(db, chatGuid) {
  // For 1:1 chats, take the only non-me handle. Return null for groups.
  const rows = db
    .prepare(
      `SELECT DISTINCT h.id AS handle_id
         FROM chat c
         JOIN chat_handle_join chj ON chj.chat_id = c.ROWID
         JOIN handle h             ON h.ROWID = chj.handle_id
        WHERE c.guid = @chatGuid`
    )
    .all({ chatGuid });
  if (rows.length === 1) {
    return { phone: normalizePhone(rows[0].handle_id), name: null };
  }
  return { phone: null, name: null };
}

// ── HTTP ──────────────────────────────────────────────────────
async function postIngest(payload) {
  const body = JSON.stringify(payload);
  const ts = Date.now();
  const sig = createHmac("sha256", RELAY_SECRET).update(`${ts}.${body}`).digest("hex");
  const res = await fetch(INGEST_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-relay-timestamp": String(ts),
      "x-relay-signature": sig,
    },
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`ingest ${res.status}: ${text.slice(0, 300)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`ingest returned non-JSON: ${text.slice(0, 200)}`);
  }
}

// ── Main loop ─────────────────────────────────────────────────
async function processChat(db, chatGuid, maxRowid) {
  const prior = readChatState(chatGuid);
  // First time we see this chat: just record the high-water mark, don't
  // process backlog (unless STARTUP_BACKFILL_HOURS asked us to).
  if (!prior) {
    writeChatState(chatGuid, { last_sent_rowid: maxRowid });
    dbg(`seeded ${chatGuid.slice(0, 8)} at rowid=${maxRowid}`);
    return;
  }
  if (maxRowid <= prior.last_sent_rowid) {
    dbg(`no new inbound for ${chatGuid.slice(0, 8)}`);
    return;
  }

  const messages = queryRecentMessages(db, chatGuid, CONTEXT_COUNT);
  if (messages.length === 0) return;

  const rowids = messages.map((m) => m.rowid);
  const attachByMsg = queryAttachmentsForMessages(db, rowids);

  const customer = resolveCustomerForChat(db, chatGuid);
  if (ALLOWED_PHONES.length > 0 && customer.phone && !ALLOWED_PHONES.includes(customer.phone)) {
    dbg(`skipping ${chatGuid.slice(0, 8)} — phone ${customer.phone} not in allowlist`);
    writeChatState(chatGuid, { last_sent_rowid: maxRowid });
    return;
  }

  const formatted = messages.map((m) => {
    const atts = (attachByMsg.get(m.rowid) || []).map((a) => {
      const imageBase64 = loadAttachmentInline(a.filename, a.mime_type);
      return {
        mime: a.mime_type || "application/octet-stream",
        filename: a.transfer_name || a.filename || "",
        ...(imageBase64 ? { imageBase64 } : {}),
      };
    });
    return {
      rowid: m.rowid,
      isoDate: appleNanosToIso(m.date_ns),
      fromMe: !!m.from_me,
      text: m.text || "",
      attachments: atts,
    };
  });

  const payload = {
    chatGuid,
    customerPhone: customer.phone,
    customerName: customer.name,
    messages: formatted,
    priorStage: prior.last_stage || null,
    lastNotifiedPendingId: prior.last_notified_pending_id || null,
  };

  log(`→ ingest chat=${chatGuid.slice(0, 8)} msgs=${formatted.length} priorStage=${prior.last_stage || "n/a"}`);
  let result;
  try {
    result = await postIngest(payload);
  } catch (err) {
    log(`ingest error for ${chatGuid.slice(0, 8)}:`, err.message);
    return; // leave state untouched so we retry next tick
  }
  log(
    `← stage=${result.stage} didNotify=${result.didNotify} pendingId=${result.pendingId || "-"}`
  );

  writeChatState(chatGuid, {
    last_sent_rowid: maxRowid,
    last_stage: result.stage,
    last_notified_pending_id: result.didNotify
      ? result.pendingId
      : prior.last_notified_pending_id,
  });
}

async function tick() {
  let tmpPath;
  try {
    tmpPath = snapshotChatDb();
  } catch (err) {
    log(`chat.db snapshot failed: ${err.message}. Is Full Disk Access granted?`);
    return;
  }
  const db = new Database(tmpPath, { readonly: true, fileMustExist: true });
  try {
    const cutoffDate =
      STARTUP_BACKFILL_HOURS > 0 && !globalThis.__tsgcRelayBackfillDone
        ? new Date(Date.now() - STARTUP_BACKFILL_HOURS * 3600 * 1000)
        : null;
    const chats = queryActiveChats(db, { cutoffDate });
    dbg(`tick: ${chats.length} chat(s) with inbound activity`);
    for (const c of chats) {
      try {
        await processChat(db, c.chat_guid, c.max_rowid);
      } catch (err) {
        log(`chat ${c.chat_guid.slice(0, 8)} processing error:`, err.message);
      }
    }
    globalThis.__tsgcRelayBackfillDone = true;
  } finally {
    db.close();
  }
}

async function main() {
  // Make sure the state DB's parent dir exists if user pointed it elsewhere.
  mkdirSync(dirname(STATE_DB_PATH), { recursive: true });
  log(`starting. chat.db=${CHAT_DB_PATH} state=${STATE_DB_PATH} interval=${POLL_INTERVAL_MS}ms`);
  if (!existsSync(CHAT_DB_PATH)) {
    log(`chat.db not found at ${CHAT_DB_PATH}. Is this Mac signed into iMessage?`);
    process.exit(2);
  }

  await tick();
  if (RUN_ONCE) return;

  const interval = setInterval(() => {
    tick().catch((e) => log("tick error:", e.message));
  }, POLL_INTERVAL_MS);

  const shutdown = (sig) => {
    log(`received ${sig}, shutting down`);
    clearInterval(interval);
    state.close();
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  log("fatal:", err);
  process.exit(1);
});
