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
const NOTIFY_EMAIL = 'jeff@cincygrillcleaning.com';
const BACKUP_EMAIL = 'jeffvboeh@gmail.com';

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
  'JASON10':        'Jason Referral — 10% off',
  'FACEBOOK10':     'Facebook Promo — 10% off',
  // Add new codes here as campaigns launch
};

function doPost(e) {
  try {
    const raw  = e.postData ? e.postData.contents : '{}';
    const data = JSON.parse(raw);

    // Event-kind dispatch. The default ('lead') preserves the existing
    // contract for the website contact form. Other kinds — fired by the
    // admin dashboard's tracking endpoints — log to dedicated tabs.
    const kind = (data.kind || 'lead').toString();
    if (kind === 'affiliate_click') {
      return handleAffiliateClick_(data);
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

// ── Affiliate click logger ───────────────────────────────────
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

// ── Add new promo code without redeploying ─────────────────────
// Run this function manually from the editor:
// addPromoCode('FALL2026', 'Fall 2026 Special')
function addPromoCode(code, label) {
  Logger.log(`Add to PROMO_CODES: '${code.toUpperCase()}': '${label}'`);
  Logger.log('Then redeploy as a new version.');
}
