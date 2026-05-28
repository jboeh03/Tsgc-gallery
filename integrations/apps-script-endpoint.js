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

// Legacy Squarespace lead intake sheet — pre-2024 historical record.
// Scanned by lookupCustomerType_() so customers who reached out via the
// old site still count as "returning". Set to '' to disable.
const LEGACY_LEAD_SHEET_ID = '1rv50ne0bFi84I9EEsZEjpo5JOwyNimyGK0EEIM_MxOI';

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
        'Best Time', 'Promo Code', 'Notes', 'Lead ID',
        'Score', 'Tier', 'Proximity', 'Value Tier', 'Customer Type', 'Completeness'
      ];
      webSheet.appendRow(headers);
      webSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      webSheet.setFrozenRows(1);
    }

    // ── Qualify the lead before writing ────────────────────────
    // Use the score sent by Next.js if present (preview-tool path);
    // otherwise compute inline (direct website-form path).
    const qual = (data.qualification && data.qualification.score != null)
      ? data.qualification
      : qualifyLead_(ss, {
          name: name,
          phone: phone,
          email: email,
          zip: zip,
          address: '',
          grillDescription: grillModel,
          estimatedPriceLow: null,
          estimatedPriceHigh: null,
          agreedPriceUsd: null,
          services: services,
          notes: notes,
        });

    webSheet.appendRow([
      timestamp, 'New Lead', name, phone, email, zip,
      services, grillModel, source, referredBy,
      bestTime, promoLabel || promoRaw, fullNotes, '',  // Lead ID filled by CRM script
      qual.score,
      qual.tier.toUpperCase(),
      qual.breakdown.proximity.tier,
      qual.breakdown.value.tier,
      qual.breakdown.customer.type,
      qual.breakdown.completeness.filled.length + '/' +
        (qual.breakdown.completeness.filled.length + qual.breakdown.completeness.missing.length)
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
    const tierTag    = `[${qual.tier.toUpperCase()} ${qual.score}]`;
    const subject    = `${tierTag} New Website Lead: ${name} — ${services.split(',')[0].trim()}`;
    const qualLine   = `\nLead score: ${qual.score} ${qual.tier.toUpperCase()} · ` +
                       `proximity: ${qual.breakdown.proximity.tier} · ` +
                       `value: ${qual.breakdown.value.tier} · ` +
                       `customer: ${qual.breakdown.customer.type}`;
    const body =
`New inquiry from tristategrillcleaning.com

Name:     ${name}
Phone:    ${phone}
Email:    ${email}
ZIP:      ${zip}
Services: ${services}
Grill:    ${grillModel || '(not provided)'}
Source:   ${source}${referredBy ? '\nReferred: ' + referredBy : ''}${timeLine}${promoLine}${notesLine}${qualLine}

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
        `${tierTag} ${name}`,
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
    'Photo Data URLs', 'Calendar Event ID', 'Calendar URL',
    'Score', 'Tier', 'Proximity', 'Value Tier', 'Customer Type'
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

    const qual = data.qualification && data.qualification.score != null ? data.qualification : null;

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
      qual ? qual.score : '',
      qual ? qual.tier.toUpperCase() : '',
      qual ? qual.breakdown.proximity.tier : '',
      qual ? qual.breakdown.value.tier : '',
      qual ? qual.breakdown.customer.type : '',
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

// ── Lead qualifying ──────────────────────────────────────────────────────────
//
// Mirror of lib/leads/qualify.ts in the Next.js side. Used by the website
// quote-form path (direct POST to this script — no Next.js scoring) and
// when a payload arrives without a pre-computed `qualification`.
//
// Weights MUST match the JS side (lib/leads/qualify.ts). If you tweak
// them in one place, tweak them in both.

// ── Proximity ZIP tiers (mirror lib/leads/serviceArea.ts) ──
const ZIP_TIERS = {
  core: [
    '45202','45203','45204','45205','45206','45207','45208','45209',
    '45211','45212','45213','45214','45215','45216','45217','45218',
    '45219','45220','45223','45224','45225','45226','45227','45229',
    '45230','45231','45232','45233','45236','45237','45238','45239',
    '45240','45241','45242','45243','45244','45246','45247','45248',
    '45249','45251','45252',
    '41011','41014','41015','41016','41017','41018','41019',
    '41071','41072','41073','41074','41075','41076','41085',
    '41005','41042','41048','41051','41091','41094',
  ],
  extended: [
    '45102','45103','45106','45122','45140','45150','45152','45174',
    '45245','45255',
    '45011','45013','45014','45015','45042','45044','45050','45069',
    '45034','45036','45039','45040','45065','45066','45067','45068',
    '41001','41003','41004','41008','41030','41040','41063','41080',
    '41086','41092','41095','41097',
    '41006','41007','41010','41059','41099',
    '41035','41043','41044','41045','41046','41054','41064','41065',
  ],
  fringe: [
    '45001','45002','45030','45033','45041','45051','45052','45053',
    '45054','45055','45056','45070','45071',
    '45111','45142','45146','45153','45154','45156','45157','45160',
    '45162','45168','45176',
    '45402','45403','45404','45405','45406','45409','45410','45414',
    '45415','45417','45418','45419','45420','45424','45426','45429',
    '45430','45431','45432','45434','45439','45440','45449','45458',
    '45459',
    '45305','45307','45324','45342','45343','45344','45370','45385',
  ],
  out_of_area: [
    '45301','45308','45309','45314','45315','45316','45319','45322',
    '45323','45325','45327','45331','45333','45351','45354','45356',
    '45358','45359','45360','45361','45362','45369','45371','45373',
    '45377','45381','45382','45383','45387','45389',
  ],
};

function classifyZip_(zipRaw) {
  if (!zipRaw) return 'unknown';
  const zip = String(zipRaw).trim().slice(0, 5);
  if (!/^\d{5}$/.test(zip)) return 'unknown';
  if (ZIP_TIERS.core.indexOf(zip) >= 0) return 'core';
  if (ZIP_TIERS.extended.indexOf(zip) >= 0) return 'extended';
  if (ZIP_TIERS.fringe.indexOf(zip) >= 0) return 'fringe';
  if (ZIP_TIERS.out_of_area.indexOf(zip) >= 0) return 'out_of_area';
  // Heuristic fallback for unclassified ZIPs.
  if (/^45[0-2]/.test(zip)) return 'extended';
  if (/^41[0-1]/.test(zip)) return 'extended';
  if (/^4[0-5]/.test(zip)) return 'fringe';
  return 'out_of_area';
}

// ── Value tier from grill description / quoted prices ──
function classifyValue_(args) {
  const explicit = args.agreedPriceUsd != null
    ? args.agreedPriceUsd
    : (args.estimatedPriceHigh != null
        ? args.estimatedPriceHigh
        : args.estimatedPriceLow);
  if (explicit != null && isFinite(explicit)) {
    const high = args.agreedPriceUsd != null
      ? args.agreedPriceUsd
      : (args.estimatedPriceHigh != null ? args.estimatedPriceHigh : explicit);
    const low = args.estimatedPriceLow != null
      ? args.estimatedPriceLow
      : (args.agreedPriceUsd != null ? args.agreedPriceUsd : explicit);
    let tier;
    if (high >= 499) tier = 'premium';
    else if (high >= 349) tier = 'standard_plus';
    else if (high >= 249) tier = 'standard';
    else tier = 'small';
    return { tier: tier, estimatedJobUsdLow: low, estimatedJobUsdHigh: high };
  }
  const t = (args.description || '').toLowerCase();
  if (!t) return { tier: 'unknown', estimatedJobUsdLow: null, estimatedJobUsdHigh: null };

  const has = function(keywords) {
    for (let i = 0; i < keywords.length; i++) {
      if (t.indexOf(keywords[i]) >= 0) return true;
    }
    return false;
  };

  if (has([
    'built-in','built in','builtin','island','lynx','dcs','hestan','alfresco',
    'coyote','fire magic','firemagic','twin eagles','twineagles','blaze',
    '36"','36 in','36-inch','42"','42 in','42-inch','48"','48-inch',
    'commercial','summit',
  ])) {
    return { tier: 'premium', estimatedJobUsdLow: 499, estimatedJobUsdHigh: 799 };
  }
  if (has([
    '4-burner','4 burner','four burner','4burner',
    '5-burner','5 burner','5burner',
    '6-burner','6 burner','6burner',
    'premium pellet','kamado','big green egg','biggreenegg','primo',
    'kj classic','kamado joe','genesis','genesis ii','weber pro',
    'traeger pro 780','traeger ironwood','traeger timberline',
    'yoder','rec tec','rectec','recteq',
  ])) {
    return { tier: 'standard_plus', estimatedJobUsdLow: 349, estimatedJobUsdHigh: 449 };
  }
  if (has(['smoker','offset','vertical smoker','wsm'])) {
    return { tier: 'standard', estimatedJobUsdLow: 249, estimatedJobUsdHigh: 399 };
  }
  if (has(['griddle','flat top','flat-top','flattop','blackstone'])) {
    return { tier: 'standard', estimatedJobUsdLow: 229, estimatedJobUsdHigh: 329 };
  }
  if (has([
    '3-burner','3 burner','three burner','3burner',
    'spirit','weber spirit','pellet','pit boss','pitboss',
    'traeger','traeger 22','traeger 34','mid-size','mid size',
  ])) {
    return { tier: 'standard', estimatedJobUsdLow: 249, estimatedJobUsdHigh: 379 };
  }
  if (has([
    '2-burner','2 burner','two burner','2burner',
    'portable','kettle','weber kettle','smokey joe',
    'tabletop','go-anywhere','small grill','small charcoal','small gas',
  ])) {
    return { tier: 'small', estimatedJobUsdLow: 199, estimatedJobUsdHigh: 299 };
  }
  return { tier: 'unknown', estimatedJobUsdLow: null, estimatedJobUsdHigh: null };
}

// ── Returning customer lookup against the existing sheet tabs ──
//
// Also scans the legacy Squarespace lead intake sheet
// (LEGACY_LEAD_SHEET_ID) so customers from the pre-2024 site still
// count as returning. Column lookups are header-name based with
// aliases so Squarespace's form field naming variations work.

function _scanTabForMatch_(tab, normPhone, normEmail) {
  if (!tab) return false;
  const data = tab.getDataRange().getValues();
  if (data.length < 2) return false;
  const headers = data[0].map(function(h) {
    return (h || '').toString().toLowerCase().trim();
  });
  const phoneCols = [];
  const emailCols = [];
  headers.forEach(function(h, i) {
    if (h.indexOf('phone') >= 0 || h.indexOf('mobile') >= 0 || h.indexOf('cell') >= 0) {
      phoneCols.push(i);
    }
    if (h.indexOf('email') >= 0 || h.indexOf('e-mail') >= 0) {
      emailCols.push(i);
    }
  });
  for (let i = 1; i < data.length; i++) {
    if (normPhone) {
      for (let k = 0; k < phoneCols.length; k++) {
        const p = (data[i][phoneCols[k]] || '').toString()
          .replace(/[^\d]/g, '').replace(/^1(\d{10})$/, '$1');
        if (p && p === normPhone) return true;
      }
    }
    if (normEmail) {
      for (let k = 0; k < emailCols.length; k++) {
        const e = (data[i][emailCols[k]] || '').toString().trim().toLowerCase();
        if (e && e === normEmail) return true;
      }
    }
  }
  return false;
}

function lookupCustomerType_(ss, phone, email) {
  const normPhone = (phone || '').toString().replace(/[^\d]/g, '').replace(/^1(\d{10})$/, '$1');
  const normEmail = (email || '').toString().trim().toLowerCase();
  if (!normPhone && !normEmail) return 'unknown';

  // Current CRM sheet — scan known tabs.
  const localTabs = [SHEET_NAME, CRM_TAB, RAW_TAB];
  for (let t = 0; t < localTabs.length; t++) {
    if (_scanTabForMatch_(ss.getSheetByName(localTabs[t]), normPhone, normEmail)) {
      return 'returning';
    }
  }

  // Legacy Squarespace sheet — scan ALL tabs (Squarespace can name the
  // response tab anything; just brute-force everything once).
  if (LEGACY_LEAD_SHEET_ID) {
    try {
      const legacySs = SpreadsheetApp.openById(LEGACY_LEAD_SHEET_ID);
      const sheets = legacySs.getSheets();
      for (let s = 0; s < sheets.length; s++) {
        if (_scanTabForMatch_(sheets[s], normPhone, normEmail)) {
          return 'returning';
        }
      }
    } catch (err) {
      Logger.log('Legacy sheet read failed: ' + err.message);
      // Fall through — don't penalize the lead for a sheet access issue.
    }
  }

  return 'new';
}

const QUAL_PROXIMITY_POINTS = {
  core: 30, extended: 22, fringe: 12, out_of_area: 0, unknown: 15,
};
const QUAL_VALUE_POINTS = {
  premium: 30, standard_plus: 24, standard: 16, small: 10, unknown: 15,
};
const QUAL_CUSTOMER_POINTS = {
  returning: 15, new: 10, unknown: 8,
};
const QUAL_COMPLETENESS = [
  { key: 'name',             weight: 3 },
  { key: 'phone',            weight: 6 },
  { key: 'email',            weight: 3 },
  { key: 'zip',              weight: 3 },
  { key: 'address',          weight: 3 },
  { key: 'grillDescription', weight: 4 },
  { key: 'services',         weight: 2 },
  { key: 'notes',            weight: 1 },
];

function tierForScore_(score) {
  if (score >= 75) return 'hot';
  if (score >= 55) return 'warm';
  if (score >= 35) return 'cool';
  return 'cold';
}

/**
 * qualifyLead_(ss, input) → { score, tier, breakdown }
 * Mirrors lib/leads/qualify.ts. Returns the same shape so downstream
 * code (Next.js + Apps Script) can use it interchangeably.
 */
function qualifyLead_(ss, input) {
  const proximityTier = classifyZip_(input.zip);
  const value = classifyValue_({
    description: input.grillDescription,
    agreedPriceUsd: input.agreedPriceUsd,
    estimatedPriceLow: input.estimatedPriceLow,
    estimatedPriceHigh: input.estimatedPriceHigh,
  });
  const customerType = lookupCustomerType_(ss, input.phone, input.email);

  const filled = [];
  const missing = [];
  let completenessPoints = 0;
  for (let i = 0; i < QUAL_COMPLETENESS.length; i++) {
    const f = QUAL_COMPLETENESS[i];
    const v = input[f.key];
    const has = (typeof v === 'string') ? v.trim().length > 0 : v != null;
    if (has) { filled.push(f.key); completenessPoints += f.weight; }
    else { missing.push(f.key); }
  }

  const score = Math.min(100,
    QUAL_PROXIMITY_POINTS[proximityTier] +
    QUAL_VALUE_POINTS[value.tier] +
    QUAL_CUSTOMER_POINTS[customerType] +
    completenessPoints
  );
  return {
    score: score,
    tier: tierForScore_(score),
    breakdown: {
      proximity: { tier: proximityTier, points: QUAL_PROXIMITY_POINTS[proximityTier] },
      value: {
        tier: value.tier,
        points: QUAL_VALUE_POINTS[value.tier],
        estimatedJobUsdLow: value.estimatedJobUsdLow,
        estimatedJobUsdHigh: value.estimatedJobUsdHigh,
      },
      customer: { type: customerType, points: QUAL_CUSTOMER_POINTS[customerType] },
      completeness: { points: completenessPoints, filled: filled, missing: missing },
    },
  };
}
