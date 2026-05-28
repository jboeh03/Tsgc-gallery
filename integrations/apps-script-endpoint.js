/**
 * TSGC Website Lead Intake — Google Apps Script
 * Standalone web app — deployed separately from CRM sheet script
 *
 * Receives POST from the website contact form, writes to CRM sheet,
 * sends alert to Jeff, sends auto-reply to customer.
 *
 * Deployed URL: https://script.google.com/macros/s/AKfycbzAgVBZv6bc2ncRZ9oyFfzPvODm4Kdua9xZYCOi8fWaUG-JAotfX_LuK5fDm80BPn52/exec
 *
 * SETUP: Deploy as Web App — Execute as: Me, Anyone can access
 */

const SHEET_ID     = '18DaRXOuAI8VjYd1qrpy-rr9SoOTi57VpfPOx05aolCo';
const SHEET_NAME   = '🌐 Website Leads';
const CRM_TAB      = '📋 CRM + Jobs';
const RAW_TAB      = '📥 Raw Leads';
const GIVEAWAY_TAB = '🎁 Giveaway Entries';
const IMESSAGE_PENDING_TAB = '📱 iMessage Pending';
const NOTIFY_EMAIL = 'jeff@cincygrillcleaning.com';
const BACKUP_EMAIL = 'jeffvboeh@gmail.com';

// Google Calendar to write confirmed iMessage bookings to.
// Must match the calendar name exactly (CalendarApp.getCalendarsByName).
// Leave as empty string to fall back to the primary calendar.
const TSGC_SCHEDULE_CALENDAR_NAME = 'TSGC Schedule';

// Email-to-SMS gateway — sends a short text alert to Jeff's phone alongside
// the lead email. Carriers use these gateway domains:
//
//   Verizon:      <10digits>@vtext.com
//   AT&T:         <10digits>@txt.att.net
//   T-Mobile:     <10digits>@tmomail.net
//   US Cellular:  <10digits>@email.uscc.net
//   Cricket:      <10digits>@mms.cricketwireless.net
//   Metro by T-Mobile: <10digits>@mymetropcs.com
//
// Set to '' to disable. Note: some carriers have been deprecating these
// gateways; if texts stop arriving consistently, swap to Twilio.
const SMS_GATEWAY = '6578314276@vtext.com'; // ← Verizon. Swap suffix if Jeff is on another carrier.

// CRM column positions (must match 📋 CRM + Jobs exactly)
const CRM = {
  LEAD_ID:1, DATE:2, NAME:3, PHONE:4, EMAIL:5, ZIP:6,
  SERVICE:7, GRILL_MODEL:8, SOURCE:9, REFERRED_BY:10,
  NOTES:11, STATUS:12,
};

// Valid promo codes → label shown in CRM
const PROMO_CODES = {
  'MOTHERSDAY2026': "Mother's Day 2026 Promo",
  'SUMMER2026':     'Summer 2026 Promo',
  'MEMORIAL2026':   'Memorial Day 2026',
  'LABORDAY2026':   'Labor Day 2026',
  'GIVEAWAY2026':   'Weber Spirit II Giveaway 2026',
  'JASON10':        'Jason Referral — 10% off',
  'FACEBOOK10':     'Facebook Promo — 10% off',
  // Add new codes here as campaigns launch
};

function doPost(e) {
  try {
    const raw  = e.postData ? e.postData.contents : '{}';
    const data = JSON.parse(raw);

    // Event-kind dispatch.
    const kind = (data.kind || 'lead').toString();

    if (kind === 'affiliate_click') {
      return handleAffiliateClick_(data);
    }

    if (kind === 'giveaway_entry') {
      return handleGiveawayEntry_(data);
    }

    if (kind === 'imessage_pending_booking') {
      return handleImessagePendingBooking_(data);
    }

    if (kind === 'imessage_confirm_booking') {
      return handleImessageConfirmBooking_(data);
    }

    // ── Build lead record ─────────────────────────────────────
    const firstName = (data.firstName || '').trim();
    const lastName  = (data.lastName  || '').trim();
    const name      = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
    const email     = (data.email     || '').trim();
    const phone     = (data.phone     || '').trim();
    const zip       = (data.zip       || '').trim();
    const services  = Array.isArray(data.services)
      ? data.services.join(', ')
      : (data.services || data.service || '').trim();
    const grillModel = (data.grillModel || data.grillMake || '').trim();
    const source    = (data.source || 'Website Form').trim();
    const referredBy = (data.referredBy || '').trim();
    const bestTime  = (data.bestTime  || '').trim();
    const promoRaw  = (data.promoCode || '').trim().toUpperCase();
    const promoLabel = promoRaw ? (PROMO_CODES[promoRaw] || `Promo: ${promoRaw}`) : '';
    const notes     = (data.notes || '').trim();

    // Build notes field — combine optional extras
    const noteParts = [];
    if (bestTime)   noteParts.push(`Best time: ${bestTime}`);
    if (promoLabel) noteParts.push(`🏷 ${promoLabel}`);
    if (promoRaw && !PROMO_CODES[promoRaw]) noteParts.push(`⚠️ Unrecognized code: ${promoRaw}`);
    if (notes)      noteParts.push(notes);
    const fullNotes = noteParts.join(' | ');

    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

    // ── Write to 🌐 Website Leads tab ─────────────────────────
    const ss         = SpreadsheetApp.openById(SHEET_ID);
    let   webSheet   = ss.getSheetByName(SHEET_NAME);

    if (!webSheet) {
      webSheet = ss.insertSheet(SHEET_NAME);
      const headers = [
        'Timestamp', 'Status', 'Name', 'Phone', 'Email', 'ZIP',
        'Services', 'Grill Make/Model', 'Source', 'Referred By',
        'Best Time', 'Promo Code', 'Notes', 'Lead ID'
      ];
      webSheet.appendRow(headers);
      webSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      webSheet.setFrozenRows(1);
    }

    webSheet.appendRow([
      timestamp, 'New Lead', name, phone, email, zip,
      services, grillModel, source, referredBy,
      bestTime, promoLabel || promoRaw, fullNotes, ''  // Lead ID filled by CRM script
    ]);

    // ── Also write to 📥 Raw Leads (so CRM import picks it up) ─
    // Format matches existing Raw Leads columns:
    // Submitted On, Name, Email, Phone, Zip, Service, Grill/Model, How Heard, Referred By
    const rawSheet = ss.getSheetByName(RAW_TAB);
    if (rawSheet) {
      rawSheet.appendRow([
        timestamp, name, email, phone, zip,
        services, grillModel, source, referredBy
      ]);
    }

    // ── Alert to Jeff ──────────────────────────────────────────
    const promoLine  = promoLabel ? `\nPromo:    ${promoLabel}` : '';
    const notesLine  = notes      ? `\nNotes:    ${notes}`      : '';
    const timeLine   = bestTime   ? `\nBest time: ${bestTime}`  : '';
    const subject    = `New Website Lead: ${name} — ${services.split(',')[0].trim()}`;
    const body =
`New inquiry from tristategrillcleaning.com

Name:     ${name}
Phone:    ${phone}
Email:    ${email}
ZIP:      ${zip}
Services: ${services}
Grill:    ${grillModel || '(not provided)'}
Source:   ${source}${referredBy ? '\nReferred: ' + referredBy : ''}${timeLine}${promoLine}${notesLine}

CRM Sheet: https://docs.google.com/spreadsheets/d/${SHEET_ID}
Received:  ${timestamp}`;

    GmailApp.sendEmail(NOTIFY_EMAIL, subject, body);
    if (BACKUP_EMAIL !== NOTIFY_EMAIL) {
      GmailApp.sendEmail(BACKUP_EMAIL, subject, body);
    }

    // ── Text alert (email-to-SMS gateway) ─────────────────────
    // Short one-line summary that fits in a single SMS (~160 chars).
    // Most carrier gateways drop the subject and deliver the body.
    if (SMS_GATEWAY) {
      const firstService = services ? services.split(',')[0].trim() : '';
      const smsParts = [
        `New TSGC lead: ${name}`,
        phone || '',
        firstService,
        promoLabel || '',
      ].filter(Boolean);
      const smsBody = smsParts.join(' · ');
      try {
        GmailApp.sendEmail(SMS_GATEWAY, 'New lead', smsBody);
      } catch (smsErr) {
        Logger.log('SMS gateway send failed: ' + smsErr.message);
      }
    }

    // ── Auto-reply to customer ─────────────────────────────────
    if (email && email.includes('@')) {
      const grillLine = grillModel
        ? `\nWe noted your ${grillModel} — we'll have a quote ready when we reach out.`
        : '';
      GmailApp.sendEmail(email,
        'We got your request — Tri-State Grill Cleaning',
`Hi ${firstName || 'there'},

Thanks for reaching out to Tri-State Grill Cleaning! We received your request and will follow up within 24 hours with a quote and available times.${grillLine}

Prefer to talk now? Call or text us:
(657) 831-4276

— Jeff Boeh
Tri-State Grill Cleaning
jeff@cincygrillcleaning.com
tristategrillcleaning.com`,
        { name: 'Tri-State Grill Cleaning', replyTo: NOTIFY_EMAIL }
      );
    }

    return ok_('Lead received');

  } catch (err) {
    Logger.log('doPost error: ' + err.message);
    return ok_('Error: ' + err.message); // still return 200 so form shows success
  }
}

function ok_(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Like ok_ but returns the object directly as the JSON body (no envelope).
// Used by the iMessage handlers — the Next.js side reads top-level fields
// like `eventId`, `calendarUrl`, `error` directly.
function okJson_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Giveaway entry handler ───────────────────────────────────────────────────
//
// Writes to the "🎁 Giveaway Entries" tab. Columns:
//   Timestamp | Entry ID | Name | Email | Phone | ZIP
//   Base Entries | Bonus Booking | Bonus Share | Bonus Follow | Total Entries
//   Booking Ref | Giveaway ID | Status | Notes
//
// Status is set to VALID on write. Duplicates (same email) are flagged DUPLICATE.
// Booking bonuses are flagged PENDING_VERIFICATION until runGiveawayDraw_ confirms them.
//
function handleGiveawayEntry_(data) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(GIVEAWAY_TAB);

    if (!sheet) {
      sheet = ss.insertSheet(GIVEAWAY_TAB);
      const headers = [
        'Timestamp', 'Entry ID', 'Name', 'Email', 'Phone', 'ZIP',
        'Base Entries', 'Bonus Booking', 'Bonus Share', 'Bonus Follow',
        'Total Entries', 'Booking Ref', 'Giveaway ID', 'Status', 'Notes'
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    const firstName  = (data.firstName  || '').trim();
    const lastName   = (data.lastName   || '').trim();
    const name       = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
    const email      = (data.email      || '').trim().toLowerCase();
    const phone      = (data.phone      || '').trim();
    const zip        = (data.zip        || '').trim();
    const bookingRef = (data.bookingRef || '').trim();
    const giveawayId = (data.giveawayId || '').trim();

    const baseEntries   = parseInt(data.baseEntries,   10) || 1;
    const bonusBooking  = parseInt(data.bonusBooking,  10) || 0;
    const bonusShare    = parseInt(data.bonusShare,    10) || 0;
    const bonusFollow   = parseInt(data.bonusFollow,   10) || 0;
    const totalEntries  = Math.min(baseEntries + bonusBooking + bonusShare + bonusFollow, 5);

    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    const entryId   = 'GW-' + Date.now().toString(36).toUpperCase();

    // Duplicate check — scan existing entries for same email
    const allRows   = sheet.getDataRange().getValues();
    let isDuplicate = false;
    for (let i = 1; i < allRows.length; i++) {
      if ((allRows[i][3] || '').toString().toLowerCase() === email) {
        isDuplicate = true;
        break;
      }
    }

    // Booking bonus is initially unverified — mark for review
    const bookingNote = bonusBooking > 0 && !isDuplicate
      ? 'Booking bonus PENDING_VERIFICATION'
      : '';
    const status = isDuplicate ? 'DUPLICATE' : 'VALID';
    const notes  = [
      isDuplicate ? 'Duplicate email — first entry kept, this entry void' : '',
      bookingNote,
    ].filter(Boolean).join(' | ');

    sheet.appendRow([
      timestamp, entryId, name, email, phone, zip,
      baseEntries, bonusBooking, bonusShare, bonusFollow,
      totalEntries, bookingRef, giveawayId, status, notes
    ]);

    // Alert Jeff
    const subject = `New Giveaway Entry: ${name} — ${totalEntries} ${totalEntries === 1 ? 'entry' : 'entries'}${isDuplicate ? ' [DUPLICATE]' : ''}`;
    const body =
`New giveaway entry from tristategrillcleaning.com/giveaway

Entry ID:  ${entryId}
Name:      ${name}
Email:     ${email}
Phone:     ${phone}
ZIP:       ${zip}
Entries:   ${totalEntries} (base: ${baseEntries}, booking: ${bonusBooking}, share: ${bonusShare}, follow: ${bonusFollow})
Booking ref: ${bookingRef || '(none)'}
Status:    ${status}
${notes ? 'Notes: ' + notes : ''}

Giveaway sheet: https://docs.google.com/spreadsheets/d/${SHEET_ID}
Received: ${timestamp}`;

    GmailApp.sendEmail(NOTIFY_EMAIL, subject, body);
    if (BACKUP_EMAIL !== NOTIFY_EMAIL) {
      GmailApp.sendEmail(BACKUP_EMAIL, subject, body);
    }

    // SMS alert for new valid entries
    if (SMS_GATEWAY && !isDuplicate) {
      try {
        GmailApp.sendEmail(SMS_GATEWAY, 'Giveaway entry',
          `Giveaway: ${name} · ${totalEntries} entries · ${phone}`);
      } catch (smsErr) {
        Logger.log('Giveaway SMS failed: ' + smsErr.message);
      }
    }

    // Auto-reply to entrant (valid entries only)
    if (!isDuplicate && email && email.includes('@')) {
      GmailApp.sendEmail(email,
        "You're entered — Tri-State Grill Cleaning Giveaway",
`Hi ${firstName || 'there'},

You're officially entered in the Tri-State Grill Cleaning Weber Spirit II Giveaway!

Your entries: ${totalEntries} out of a possible 5
Entry ID: ${entryId}

The winner will be announced via email and phone. Make sure to keep an eye out — we'll reach out directly if you win.

No purchase was necessary to enter and none is required to win.

Good luck,
— Jeff
Tri-State Grill Cleaning
(657) 831-4276
tristategrillcleaning.com`,
        { name: 'Tri-State Grill Cleaning', replyTo: NOTIFY_EMAIL }
      );
    }

    return ok_('Giveaway entry received');

  } catch (err) {
    Logger.log('handleGiveawayEntry_ error: ' + err.message);
    return ok_('Error: ' + err.message);
  }
}

// ── Giveaway draw ─────────────────────────────────────────────────────────────
//
// Run this function manually from the Apps Script editor AFTER the Entry Period closes.
// Before running:
//   1. Review the 🎁 Giveaway Entries tab and mark any unverified booking bonuses:
//      - Cross-reference booking refs against the CRM tab
//      - For valid bookings: leave Bonus Booking as-is
//      - For invalid/unverified bookings: set Bonus Booking column to 0 and
//        recalculate Total Entries manually (or re-run the entry)
//   2. Confirm no VALID entries need to be voided for eligibility reasons
//
// The function logs:
//   - Total valid entrant count
//   - Total weighted pool size (used to calculate odds: 1/pool per entry)
//   - All three winners (Grand, 2nd, 3rd) with name, email, and Entry ID
//
// Save the execution log as the documented draw record.
//
function runGiveawayDraw() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(GIVEAWAY_TAB);

  if (!sheet) {
    Logger.log('ERROR: No "' + GIVEAWAY_TAB + '" tab found. No entries have been received.');
    return;
  }

  const rows    = sheet.getDataRange().getValues();
  const entries = rows.slice(1); // skip header

  // Only draw from VALID entries (not DUPLICATE or manually voided)
  const validEntries = entries.filter(function(r) {
    return (r[13] || '').toString().toUpperCase() === 'VALID';
  });

  Logger.log('=== TSGC WEBER SPIRIT II GIVEAWAY DRAW ===');
  Logger.log('Draw timestamp: ' + new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  Logger.log('Total valid entrants: ' + validEntries.length);

  if (validEntries.length === 0) {
    Logger.log('ERROR: No valid entries to draw from.');
    return;
  }

  // Build weighted pool: each entrant appears once per Total Entries value
  // Columns: [0]Timestamp [1]EntryID [2]Name [3]Email [4]Phone [5]ZIP
  //          [6]Base [7]BonusBooking [8]BonusShare [9]BonusFollow [10]TotalEntries
  var pool = [];
  validEntries.forEach(function(row) {
    var entryId      = (row[1] || '').toString();
    var name         = (row[2] || '').toString();
    var email        = (row[3] || '').toString();
    var totalEntries = parseInt(row[10], 10) || 1;
    for (var i = 0; i < totalEntries; i++) {
      pool.push({ name: name, email: email, entryId: entryId });
    }
  });

  Logger.log('Total weighted pool size: ' + pool.length);
  Logger.log('(Odds per single entry: 1/' + pool.length + ')');

  // Fisher-Yates shuffle for a uniform random permutation
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }

  // Select up to 3 unique winners (unique by email address)
  var seen    = {};
  var winners = [];
  for (var k = 0; k < pool.length && winners.length < 3; k++) {
    var candidate = pool[k];
    if (!seen[candidate.email]) {
      seen[candidate.email] = true;
      winners.push(candidate);
    }
  }

  var labels = ['GRAND PRIZE', '2ND PRIZE', '3RD PRIZE'];
  Logger.log('');
  Logger.log('=== WINNERS ===');
  winners.forEach(function(w, idx) {
    Logger.log(labels[idx] + ': ' + w.name + ' | ' + w.email + ' | Entry ID: ' + w.entryId);
  });

  if (winners.length < 3) {
    Logger.log('WARNING: Fewer than 3 unique valid entrants — only ' + winners.length + ' winner(s) selected.');
  }

  Logger.log('');
  Logger.log('=== END OF DRAW RECORD — SAVE THIS LOG ===');
  Logger.log('Next step: notify winners by email and phone within 3 business days.');
}

// ── Affiliate click logger ───────────────────────────────────────────────────
// Appends a row to the "🔗 Affiliate Clicks" tab, creating it with
// a header row the first time. Called from the Next.js
// /api/track/click route when a visitor clicks a product card on the
// /products page. Logging is best-effort — never alerts on errors.
function handleAffiliateClick_(data) {
  try {
    const ss   = SpreadsheetApp.openById(SHEET_ID);
    const TAB  = '🔗 Affiliate Clicks';
    let sheet  = ss.getSheetByName(TAB);
    if (!sheet) {
      sheet = ss.insertSheet(TAB);
      const headers = [
        'Timestamp', 'Product ID', 'Product Name',
        'Affiliate', 'Destination', 'Referer', 'User Agent'
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    const ts = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    sheet.appendRow([
      ts,
      (data.productId    || '').toString(),
      (data.productName  || '').toString(),
      (data.affiliate    || '').toString(),
      (data.destinationUrl || '').toString(),
      (data.referer      || '').toString(),
      (data.userAgent    || '').toString().slice(0, 240),
    ]);
    return ok_('Click logged');
  } catch (err) {
    Logger.log('Click log failed: ' + err.message);
    return ok_('Error: ' + err.message);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'TSGC lead intake active' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Add new promo code without redeploying ─────────────────────────────────
// Run this function manually from the editor:
// addPromoCode('FALL2026', 'Fall 2026 Special')
function addPromoCode(code, label) {
  Logger.log(`Add to PROMO_CODES: '${code.toUpperCase()}': '${label}'`);
  Logger.log('Then redeploy as a new version.');
}

// ── iMessage booking sync ────────────────────────────────────────────────────
//
// Two endpoints, both fired by app/api/imessage/* in the Next.js app:
//
//   handleImessagePendingBooking_ — write a "Pending Jeff confirmation" row
//     to the 📱 iMessage Pending tab. The Next.js webhook calls this
//     immediately after Claude classifies a thread as "confirmed", before
//     sending the push notification with the one-tap link.
//
//   handleImessageConfirmBooking_ — Jeff tapped the one-tap link. Look up
//     the pending row by ID, create the Google Calendar event on
//     TSGC_SCHEDULE_CALENDAR_NAME, append a row to the CRM tab, and flip
//     the pending row status to BOOKED.
//
// Columns on 📱 iMessage Pending:
//   Created | Pending ID | Status | Customer Name | Customer Phone
//   Chat GUID | Date | Time Label | Start Time | Duration Hours
//   Agreed Price | Address | Grill | Notes | Transcript
//   Photo Data URLs | Calendar Event ID | Calendar URL

function imessagePendingHeaders_() {
  return [
    'Created', 'Pending ID', 'Status', 'Customer Name', 'Customer Phone',
    'Chat GUID', 'Date', 'Time Label', 'Start Time', 'Duration Hours',
    'Agreed Price', 'Address', 'Grill', 'Notes', 'Transcript',
    'Photo Data URLs', 'Calendar Event ID', 'Calendar URL'
  ];
}

function getOrCreateImessagePendingSheet_(ss) {
  let sheet = ss.getSheetByName(IMESSAGE_PENDING_TAB);
  if (!sheet) {
    sheet = ss.insertSheet(IMESSAGE_PENDING_TAB);
    const headers = imessagePendingHeaders_();
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findPendingRow_(sheet, pendingId) {
  const data = sheet.getDataRange().getValues();
  // Pending ID is column index 1 (B).
  for (let i = 1; i < data.length; i++) {
    if ((data[i][1] || '').toString() === pendingId) {
      return { rowIndex: i + 1, row: data[i] };
    }
  }
  return null;
}

function handleImessagePendingBooking_(data) {
  try {
    const ss    = SpreadsheetApp.openById(SHEET_ID);
    const sheet = getOrCreateImessagePendingSheet_(ss);

    const booking      = data.booking || {};
    const pendingId    = (data.pendingId || '').toString();
    if (!pendingId) return okJson_({ ok: false, error: 'Missing pendingId' });

    const photos = Array.isArray(data.photoDataUrls) ? data.photoDataUrls : [];
    const photoSummary = photos.length
      ? photos.length + ' photo(s) [data omitted for cell size]'
      : '';
    // Cells have a 50k char limit; transcript trimmed defensively.
    const transcript = (data.transcript || '').toString().slice(0, 45000);

    const created = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

    sheet.appendRow([
      created,
      pendingId,
      'PENDING',
      (data.customerName  || '').toString(),
      (data.customerPhone || '').toString(),
      (data.chatGuid      || '').toString(),
      (booking.scheduledDate       || '').toString(),
      (booking.scheduledTimeLabel  || '').toString(),
      (booking.scheduledStartTime  || '').toString(),
      booking.durationHours != null ? booking.durationHours : '',
      booking.agreedPriceUsd != null ? booking.agreedPriceUsd : '',
      (booking.address          || '').toString(),
      (booking.grillDescription || '').toString(),
      (booking.notes            || '').toString(),
      transcript,
      photoSummary,
      '',
      '',
    ]);

    return okJson_({ ok: true, pendingId: pendingId });
  } catch (err) {
    Logger.log('handleImessagePendingBooking_ error: ' + err.message);
    return okJson_({ ok: false, error: err.message });
  }
}

function handleImessageConfirmBooking_(data) {
  try {
    const pendingId = (data.pendingId || '').toString();
    if (!pendingId) return okJson_({ ok: false, error: 'Missing pendingId' });

    const ss      = SpreadsheetApp.openById(SHEET_ID);
    const pending = ss.getSheetByName(IMESSAGE_PENDING_TAB);
    if (!pending) return okJson_({ ok: false, error: 'No pending tab' });

    const found = findPendingRow_(pending, pendingId);
    if (!found) return okJson_({ ok: false, error: 'Pending row not found' });

    const r = found.row;
    // Column indices match imessagePendingHeaders_().
    const status        = (r[2] || '').toString();
    const customerName  = (r[3] || '').toString() || 'Customer';
    const customerPhone = (r[4] || '').toString();
    const dateStr       = (r[6] || '').toString();
    const timeLabel     = (r[7] || '').toString();
    const startTimeStr  = (r[8] || '').toString();
    const durationHours = parseFloat(r[9]) || 3;
    const agreedPrice   = parseFloat(r[10]) || null;
    const address       = (r[11] || '').toString();
    const grill         = (r[12] || '').toString();
    const notes         = (r[13] || '').toString();

    // Idempotent: if already BOOKED, just return the stored calendar info.
    if (status === 'BOOKED') {
      return okJson_({
        ok: true,
        eventId: (r[16] || '').toString(),
        calendarUrl: (r[17] || '').toString(),
        alreadyBooked: true,
      });
    }

    if (!dateStr) {
      return okJson_({ ok: false, error: 'Pending row has no scheduled date' });
    }

    // Build start/end. Times are local — America/New_York for TSGC.
    let startDate, endDate, isAllDay = false;
    if (startTimeStr && /^\d{1,2}:\d{2}$/.test(startTimeStr)) {
      // YYYY-MM-DD + HH:MM in Eastern time.
      const isoLocal = dateStr + 'T' + (startTimeStr.length === 4 ? '0' + startTimeStr : startTimeStr) + ':00';
      startDate = new Date(isoLocal);
      endDate   = new Date(startDate.getTime() + durationHours * 3600 * 1000);
    } else {
      // No specific time — all-day event with the label in the title.
      const parts = dateStr.split('-');
      if (parts.length !== 3) {
        return okJson_({ ok: false, error: 'Bad date format: ' + dateStr });
      }
      startDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      endDate   = new Date(startDate.getTime() + 24 * 3600 * 1000);
      isAllDay  = true;
    }

    const titleParts = ['TSGC: ' + customerName];
    if (grill) titleParts.push('(' + grill + ')');
    if (agreedPrice) titleParts.push('— $' + agreedPrice);
    const title = titleParts.join(' ');

    const descLines = [];
    if (customerPhone) descLines.push('Phone: ' + customerPhone);
    if (agreedPrice)   descLines.push('Agreed: $' + agreedPrice);
    if (timeLabel && !startTimeStr) descLines.push('Time window: ' + timeLabel);
    if (durationHours) descLines.push('Estimated: ~' + durationHours + ' hr');
    if (grill)   descLines.push('Grill: ' + grill);
    if (notes)   descLines.push('Notes: ' + notes);
    descLines.push('');
    descLines.push('Pending ID: ' + pendingId);
    descLines.push('Booked via iMessage relay → ' + new Date().toISOString());
    const description = descLines.join('\n');

    // Pick calendar.
    let calendar = null;
    if (TSGC_SCHEDULE_CALENDAR_NAME) {
      const cals = CalendarApp.getCalendarsByName(TSGC_SCHEDULE_CALENDAR_NAME);
      if (cals.length > 0) calendar = cals[0];
    }
    if (!calendar) calendar = CalendarApp.getDefaultCalendar();

    const eventOptions = { description: description };
    if (address) eventOptions.location = address;

    const event = isAllDay
      ? calendar.createAllDayEvent(title, startDate, eventOptions)
      : calendar.createEvent(title, startDate, endDate, eventOptions);

    const eventId  = event.getId();
    const calendarId = calendar.getId();
    const calendarUrl = 'https://calendar.google.com/calendar/u/0/r/eventedit/' +
      Utilities.base64Encode(eventId.split('@')[0] + ' ' + calendarId).replace(/=+$/, '');

    // Update the pending row: status + eventId + URL.
    pending.getRange(found.rowIndex, 3).setValue('BOOKED');           // Status
    pending.getRange(found.rowIndex, 17).setValue(eventId);            // Calendar Event ID
    pending.getRange(found.rowIndex, 18).setValue(calendarUrl);        // Calendar URL

    // Append to CRM + Jobs tab so it shows in the admin dashboard.
    const crmSheet = ss.getSheetByName(CRM_TAB);
    if (crmSheet) {
      // CRM layout (from CRM constant at top of file):
      // 1 Lead ID | 2 Date | 3 Name | 4 Phone | 5 Email | 6 ZIP
      // 7 Service | 8 Grill | 9 Source | 10 Referred By | 11 Notes | 12 Status
      const leadId = 'IM-' + pendingId.slice(0, 8).toUpperCase();
      const crmNotes = [
        timeLabel ? 'Time: ' + timeLabel : '',
        agreedPrice ? 'Agreed: $' + agreedPrice : '',
        notes,
        'iMessage pending id: ' + pendingId,
      ].filter(Boolean).join(' | ');
      crmSheet.appendRow([
        leadId,
        dateStr,
        customerName,
        customerPhone,
        '',                                       // email — usually unknown from SMS
        '',                                       // ZIP
        'Grill Cleaning',                         // service
        grill,
        'iMessage',
        '',                                       // referred by
        crmNotes,
        'Booked',
      ]);
    }

    // Confirmation email + SMS so Jeff sees it landed.
    const subject = 'Booked: ' + customerName + (dateStr ? ' — ' + dateStr : '');
    const body = title + '\n\n' + description + '\n\nEvent: ' + calendarUrl;
    try { GmailApp.sendEmail(NOTIFY_EMAIL, subject, body); } catch (e) { Logger.log(e.message); }
    if (SMS_GATEWAY) {
      try {
        GmailApp.sendEmail(SMS_GATEWAY, 'Booked',
          'Booked: ' + customerName + ' · ' + (dateStr || '?') + ' ' + (startTimeStr || timeLabel || '') + (agreedPrice ? ' · $' + agreedPrice : ''));
      } catch (e) { Logger.log('SMS gateway send failed: ' + e.message); }
    }

    return okJson_({ ok: true, eventId: eventId, calendarUrl: calendarUrl });
  } catch (err) {
    Logger.log('handleImessageConfirmBooking_ error: ' + err.message);
    return okJson_({ ok: false, error: err.message });
  }
}
