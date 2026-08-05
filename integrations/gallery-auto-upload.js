/**
 * TSGC Gallery Auto-Uploader + CRM Link + Review Sender
 * Google Apps Script — v3
 *
 * PHOTO WORKFLOW:
 *   Name:  before-dcs-builtin-hyde-park-01.heic
 *          after-dcs-builtin-hyde-park-01.heic
 *   Drop:  TSGC Photos folder in Google Drive
 *   Run:   testScan() or wait for hourly trigger
 *   Then:  In 📸 Gallery tab, paste the Lead ID (e.g. TGC-032) in the
 *          "Lead ID" column for that row
 *
 * REVIEW REQUEST:
 *   Open CRM sheet → ⭐ TSGC menu → Send Review Request
 *   Type the Photo ID (e.g. PHOTO-013) → preview → Send
 *   Logs the request to the ⭐ Reviews tab automatically
 *
 * SUPPORTED PHOTO TYPES: .heic .heif .jpg .jpeg .png .webp
 */

// ── Config ───────────────────────────────────────────────────
const PHOTOS_FOLDER_ID = '1bPPmzrzRAtxNFFkU2g6T7yBsuoRdsTOj';
const SHEET_ID         = '18DaRXOuAI8VjYd1qrpy-rr9SoOTi57VpfPOx05aolCo';
const GALLERY_TAB      = '📸 Gallery';
const CRM_TAB          = '📋 CRM + Jobs';
const REVIEWS_TAB      = '⭐ Reviews';
const REVIEW_LINK      = 'https://www.google.com/maps?cid=306553952702723641&action=write-review';
// TEMP: review requests are paused while we work through a rough stretch of
// feedback. Hides the "Send Review Request" menu item and blocks sends. Mirror
// of SHOW_REVIEWS in lib/site.ts — flip both back together.
const REVIEWS_PAUSED   = true;
const NOTIFY_EMAIL     = 'jeff@cincygrillcleaning.com';
const IMAGE_EXTS       = ['heic', 'heif', 'jpg', 'jpeg', 'png', 'webp'];

// ── Gallery tab columns ──────────────────────────────────────
const G = {
  ID:              1,   // A
  DATE:            2,   // B
  LABEL:           3,   // C
  BEFORE_URL:      4,   // D
  AFTER_URL:       5,   // E
  BEFORE_ID:       6,   // F
  AFTER_ID:        7,   // G
  VISIBLE:         8,   // H
  LEAD_ID:         9,   // I  ← matches TGC-032 format
  JOB_NOTES:       10,  // J
  REVIEW_SENT:     11,  // K
  REVIEW_SENT_DATE:12,  // L
};

// ── CRM + Jobs tab columns (exact match to your sheet) ───────
const CRM = {
  LEAD_ID:     1,   // A
  DATE:        2,   // B
  NAME:        3,   // C
  PHONE:       4,   // D
  EMAIL:       5,   // E
  ZIP:         6,   // F
  SERVICE:     7,   // G
  GRILL_MODEL: 8,   // H
  SOURCE:      9,   // I
  REFERRED_BY: 10,  // J
  NOTES:       11,  // K
  STATUS:      12,  // L
  DATE_QUOTED: 13,  // M
  QUOTE_AMT:   14,  // N
  DATE_BOOKED: 15,  // O
  SCHED_DATE:  16,  // P
  SCHED_TIME:  17,  // Q
  TECH:        18,  // R
  JOB_ADDRESS: 19,  // S
  GRILL_BRAND: 20,  // T
  GRILL_TYPE:  21,  // U
  JOB_NOTES:   22,  // V
  DATE_COMP:   23,  // W
  DURATION:    24,  // X
  INVOICE_NUM: 25,  // Y
  INVOICE_DATE:26,  // Z
  INVOICE_AMT: 27,  // AA
  DATE_PAID:   28,  // AB
  PAY_METHOD:  29,  // AC
  REV_REQ:     30,  // AD
  REV_RECV:    31,  // AE
  REV_NOTES:   32,  // AF
};

// ── Reviews tab columns ──────────────────────────────────────
const REV = {
  LEAD_ID:     1,   // A
  CUST_NAME:   2,   // B
  PHONE:       3,   // C
  EMAIL:       4,   // D
  JOB_DATE:    5,   // E
  JOB_ADDRESS: 6,   // F
  REQ_SENT:    7,   // G  "Review Requested?"
  DATE_REQ:    8,   // H
  REQ_METHOD:  9,   // I
  REV_RECV:    10,  // J
  PLATFORM:    11,  // K
  STAR_RATING: 12,  // L
  REV_DATE:    13,  // M
  NOTES:       14,  // N
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function thumbnailUrl(fileId) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
}

function stripExtensions(name) {
  return name.replace(new RegExp(`(\\.(${ IMAGE_EXTS.join('|') }))+$`, 'i'), '');
}

function isImage(file) {
  return IMAGE_EXTS.some(ext => file.getName().toLowerCase().endsWith('.' + ext));
}

function getSheet_(tabName) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(tabName);
}

// ─────────────────────────────────────────────────────────────
// 1. MAIN SCAN
// ─────────────────────────────────────────────────────────────
function scanForNewPhotos() {
  const folder  = DriveApp.getFolderById(PHOTOS_FOLDER_ID);
  const files   = folder.getFiles();
  const befores = {};
  const afters  = {};

  while (files.hasNext()) {
    const file  = files.next();
    if (!isImage(file)) continue;
    const clean = stripExtensions(file.getName().toLowerCase());
    const id    = file.getId();
    const bm    = clean.match(/^before[-_](.+)$/);
    const am    = clean.match(/^after[-_](.+)$/);
    if (bm) befores[bm[1]] = { file, id };
    else if (am) afters[am[1]] = { file, id };
  }

  const ss    = SpreadsheetApp.openById(SHEET_ID);
  let   sheet = ss.getSheetByName(GALLERY_TAB);

  if (!sheet) {
    sheet = ss.insertSheet(GALLERY_TAB);
    sheet.appendRow([
      'ID', 'Date Added', 'Label', 'Before URL', 'After URL',
      'Before File ID', 'After File ID', 'Visible',
      'Lead ID', 'Job Notes', 'Review Sent', 'Review Sent Date'
    ]);
    sheet.getRange(1, 1, 1, 12).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(3, 200);
    sheet.setColumnWidth(4, 300); sheet.setColumnWidth(5, 300);
    sheet.setColumnWidth(9, 100); sheet.setColumnWidth(10, 200);
  } else {
    ensureGalleryColumns_(sheet);
  }

  let added = 0;

  for (const key of Object.keys(befores)) {
    if (!afters[key]) continue;

    const before = befores[key];
    const after  = afters[key];
    before.file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    after.file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const galleryId = `PHOTO-${String(sheet.getLastRow()).padStart(3, '0')}`;
    const label     = keyToLabel(key);

    sheet.appendRow([
      galleryId,
      new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' }),
      label,
      thumbnailUrl(before.id),
      thumbnailUrl(after.id),
      before.id, after.id,
      true,
      '', '', false, ''
    ]);

    // Move to Processed subfolder
    const subs = DriveApp.getFolderById(PHOTOS_FOLDER_ID).getFoldersByName('Processed');
    const proc = subs.hasNext() ? subs.next() : DriveApp.getFolderById(PHOTOS_FOLDER_ID).createFolder('Processed');
    before.file.moveTo(proc);
    after.file.moveTo(proc);

    added++;
    Logger.log(`✓ ${key} → ${galleryId} | ${label}`);
  }

  Logger.log(`Scan complete. Added ${added} pair(s).`);

  if (added > 0) {
    GmailApp.sendEmail(
      NOTIFY_EMAIL,
      `TSGC Gallery: ${added} new photo${added > 1 ? 's' : ''} added`,
      `${added} pair${added > 1 ? 's' : ''} added.\n\nNext: open 📸 Gallery tab and fill in the Lead ID column (e.g. TGC-032) for the new row(s).\n\nSheet: https://docs.google.com/spreadsheets/d/${SHEET_ID}`
    );
  }
}

function ensureGalleryColumns_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  // Rename "Customer ID" → "Lead ID" if old version
  const custIdx = headers.indexOf('Customer ID');
  if (custIdx >= 0) sheet.getRange(1, custIdx + 1).setValue('Lead ID');
  // Add missing columns
  ['Lead ID', 'Job Notes', 'Review Sent', 'Review Sent Date'].forEach(h => {
    if (!headers.includes(h) && !headers.includes('Customer ID')) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h).setFontWeight('bold');
    }
  });
}

// ─────────────────────────────────────────────────────────────
// 2. LABEL GENERATOR
// "dcs-builtin-hyde-park-01" → "DCS Builtin · Hyde Park"
// ─────────────────────────────────────────────────────────────
function keyToLabel(key) {
  const clean  = key.replace(/-?\d+$/, '').replace(/[-_]/g, ' ');
  const words  = clean.split(' ');
  const cap    = w => w.charAt(0).toUpperCase() + w.slice(1);
  const capped = words.map(cap);

  const cities = [
    'cincinnati','nky','dayton','covington','florence','mason',
    'anderson','kettering','centerville','madeira','loveland',
    'delhi','hyde','park','blue','ash','beavercreek','miamisburg',
    'springboro','oakwood','montgomery','milford','mariemont',
    'erlanger','crestview','hills','villa','mt','lookout',
  ];

  let splitAt = capped.length;
  for (let i = capped.length - 1; i >= 0; i--) {
    if (cities.includes(words[i])) splitAt = i;
    else break;
  }

  if (splitAt < capped.length) {
    return `${capped.slice(0, splitAt).join(' ')} · ${capped.slice(splitAt).join(' ')}`;
  }
  return capped.join(' ');
}

// ─────────────────────────────────────────────────────────────
// 3. GET JOB FROM CRM TAB BY LEAD ID (e.g. "TGC-032")
// ─────────────────────────────────────────────────────────────
function getCrmJob_(leadId) {
  if (!leadId) return null;
  const sheet = getSheet_(CRM_TAB);
  if (!sheet) return null;

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][CRM.LEAD_ID - 1]).trim() === String(leadId).trim()) {
      const name   = String(rows[i][CRM.NAME - 1]).trim();
      const parts  = name.split(' ');
      return {
        leadId:      rows[i][CRM.LEAD_ID - 1],
        name,
        firstName:   parts[0] || '',
        lastName:    parts.slice(1).join(' ') || '',
        phone:       rows[i][CRM.PHONE - 1],
        email:       rows[i][CRM.EMAIL - 1],
        zip:         rows[i][CRM.ZIP - 1],
        grillModel:  rows[i][CRM.GRILL_MODEL - 1],
        grillBrand:  rows[i][CRM.GRILL_BRAND - 1],
        grillType:   rows[i][CRM.GRILL_TYPE - 1],
        jobAddress:  rows[i][CRM.JOB_ADDRESS - 1],
        dateComp:    rows[i][CRM.DATE_COMP - 1],
        schedDate:   rows[i][CRM.SCHED_DATE - 1],
        status:      rows[i][CRM.STATUS - 1],
        rowIndex:    i + 1,
      };
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// 4. SEND REVIEW REQUEST
// Called by the sidebar. Also logs to ⭐ Reviews tab.
// ─────────────────────────────────────────────────────────────
function sendReviewRequest(photoId) {
  if (REVIEWS_PAUSED) return '⚠️ Review requests are paused right now.';

  const sheet = getSheet_(GALLERY_TAB);
  if (!sheet) return '⚠️ Gallery tab not found';

  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[G.ID - 1]).trim() !== String(photoId).trim()) continue;

    if (row[G.REVIEW_SENT - 1] === true) {
      return `⚠️ Already sent for ${photoId} on ${row[G.REVIEW_SENT_DATE - 1]}`;
    }

    const leadId   = row[G.LEAD_ID - 1];
    const job      = getCrmJob_(leadId);
    const label    = row[G.LABEL - 1] || 'your grill';
    const beforeUrl = row[G.BEFORE_URL - 1];
    const afterUrl  = row[G.AFTER_URL  - 1];

    if (!job) {
      return `⚠️ Lead ID "${leadId}" not found in CRM tab. Check the Lead ID column in 📸 Gallery.`;
    }
    if (!job.email) {
      return `⚠️ No email on file for ${job.name} (${leadId}). Check the CRM tab.`;
    }

    // Build grill description
    const grillDesc = [job.grillBrand, job.grillModel]
      .filter(Boolean).join(' ') || job.grillModel || 'your grill';

    const subject = `Your before & after — ${grillDesc.replace(/^your /i, '')}`;

    const body =
`Hi ${job.firstName},

Thanks again for choosing Tri-State Grill Cleaning. We wanted to share your before and after photos from your recent service.

Before:
${beforeUrl}

After:
${afterUrl}

We think it came out great — hope you do too!

If you have a minute, we'd really appreciate a Google review. It means a lot to a small local business and helps other homeowners find us:

${REVIEW_LINK}

Thanks,
Jeff Boeh
Tri-State Grill Cleaning
(657) 831-4276
jeff@cincygrillcleaning.com
tristategrillcleaning.com`;

    GmailApp.sendEmail(job.email, subject, body, {
      name:    'Tri-State Grill Cleaning',
      replyTo: NOTIFY_EMAIL,
    });

    // Mark gallery row as sent
    const today = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' });
    sheet.getRange(i + 1, G.REVIEW_SENT).setValue(true);
    sheet.getRange(i + 1, G.REVIEW_SENT_DATE).setValue(today);
    sheet.getRange(i + 1, 1, 1, sheet.getLastColumn()).setBackground('#EAF3DE');

    // Mark CRM row Review Requested = Yes
    const crmSheet = getSheet_(CRM_TAB);
    if (crmSheet && job.rowIndex) {
      crmSheet.getRange(job.rowIndex, CRM.REV_REQ).setValue('Yes');
    }

    // Log to ⭐ Reviews tab
    logReview_(job, today, photoId, beforeUrl, afterUrl);

    Logger.log(`✓ Review request sent to ${job.email} for ${photoId} (${leadId})`);
    return `✓ Sent to ${job.firstName} ${job.lastName} at ${job.email}`;
  }

  return `⚠️ Photo ID "${photoId}" not found in Gallery tab`;
}

function logReview_(job, today, photoId, beforeUrl, afterUrl) {
  const revSheet = getSheet_(REVIEWS_TAB);
  if (!revSheet) return;

  // Check if already logged
  const rows = revSheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][REV.LEAD_ID - 1]) === String(job.leadId)) {
      // Update existing row
      revSheet.getRange(i + 1, REV.REQ_SENT).setValue('Yes');
      revSheet.getRange(i + 1, REV.DATE_REQ).setValue(today);
      revSheet.getRange(i + 1, REV.REQ_METHOD).setValue('Email (Gallery)');
      revSheet.getRange(i + 1, REV.NOTES).setValue(`Photo: ${photoId}`);
      return;
    }
  }

  // Add new row
  revSheet.appendRow([
    job.leadId,
    job.name,
    job.phone,
    job.email,
    job.dateComp || job.schedDate || '',
    job.jobAddress || '',
    'Yes',
    today,
    'Email (Gallery)',
    '',         // Review Received? — fill in manually when it comes
    'Google',
    '',
    '',
    `Photo: ${photoId}`,
  ]);
}

// ─────────────────────────────────────────────────────────────
// 5. SIDEBAR — ⭐ TSGC menu → Send Review Request
// ─────────────────────────────────────────────────────────────
function openReviewSidebar() {
  if (REVIEWS_PAUSED) {
    SpreadsheetApp.getUi().alert('Review requests are paused right now.');
    return;
  }
  const html = HtmlService.createHtmlOutput(`<!DOCTYPE html>
<html>
<head>
<style>
  body{font-family:Arial,sans-serif;padding:16px;font-size:13px;color:#333}
  h2{font-size:15px;margin:0 0 16px;color:#1A3055}
  label{display:block;margin-bottom:4px;font-weight:bold}
  input{width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;
        margin-bottom:12px;font-size:13px;box-sizing:border-box}
  .preview{background:#f5f5f5;border:1px solid #ddd;border-radius:4px;
           padding:10px;font-size:11px;white-space:pre-wrap;
           margin-bottom:12px;max-height:200px;overflow-y:auto;display:none}
  .meta{font-size:12px;color:#555;margin-bottom:12px;display:none}
  .meta span{font-weight:bold;color:#1A3055}
  button{background:#8B1F2F;color:#fff;border:none;padding:10px 16px;
         border-radius:4px;cursor:pointer;font-size:13px;width:100%}
  button:hover{background:#A83040}
  button:disabled{background:#ccc;cursor:default}
  .status{margin-top:12px;padding:8px;border-radius:4px;
          display:none;font-size:12px}
  .ok{background:#EAF3DE;color:#3B6D11}
  .err{background:#FCEBEB;color:#A32D2D}
  .warn{background:#FFF8E1;color:#7A5800}
</style>
</head>
<body>
<h2>⭐ Send Review Request</h2>
<label>Photo ID</label>
<input type="text" id="pid" placeholder="PHOTO-013" oninput="loadPreview()">
<div class="meta" id="meta"></div>
<div class="preview" id="prev"></div>
<button id="btn" onclick="send()" disabled>Send Review Request</button>
<div class="status" id="st"></div>
<script>
let debounce, canSend = false;
function loadPreview() {
  clearTimeout(debounce);
  const id = document.getElementById('pid').value.trim();
  if (!id) { reset(); return; }
  debounce = setTimeout(() => {
    document.getElementById('btn').textContent = 'Loading...';
    google.script.run
      .withSuccessHandler(d => {
        if (!d) { showStatus('Photo ID not found', 'err'); reset(); return; }
        document.getElementById('meta').style.display = 'block';
        document.getElementById('meta').innerHTML =
          'To: <span>' + (d.email || '(no email)') + '</span>' +
          ' &nbsp;|&nbsp; Customer: <span>' + d.name + '</span>' +
          (d.alreadySent ? ' &nbsp;|&nbsp; <span style="color:#A32D2D">Already sent</span>' : '');
        document.getElementById('prev').style.display = 'block';
        document.getElementById('prev').textContent = d.preview;
        canSend = !d.alreadySent && !!d.email && d.email !== '(no email on file)';
        document.getElementById('btn').disabled = !canSend;
        document.getElementById('btn').textContent = canSend ? 'Send Review Request' : (d.alreadySent ? 'Already Sent' : 'No Email on File');
        hideStatus();
      })
      .withFailureHandler(e => { showStatus(e.message, 'err'); reset(); })
      .getReviewPreview(id);
  }, 500);
}
function send() {
  const id = document.getElementById('pid').value.trim();
  if (!id || !canSend) return;
  document.getElementById('btn').disabled = true;
  document.getElementById('btn').textContent = 'Sending...';
  showStatus('Sending...', '');
  google.script.run
    .withSuccessHandler(msg => {
      const ok = msg.startsWith('✓');
      showStatus(msg, ok ? 'ok' : 'err');
      document.getElementById('btn').textContent = ok ? '✓ Sent!' : 'Send Review Request';
      document.getElementById('btn').disabled = ok;
      canSend = !ok;
    })
    .withFailureHandler(e => {
      showStatus('Error: ' + e.message, 'err');
      document.getElementById('btn').disabled = false;
      document.getElementById('btn').textContent = 'Send Review Request';
    })
    .sendReviewRequestFromSidebar(id);
}
function reset() {
  document.getElementById('meta').style.display = 'none';
  document.getElementById('prev').style.display = 'none';
  document.getElementById('btn').disabled = true;
  document.getElementById('btn').textContent = 'Send Review Request';
  canSend = false;
}
function showStatus(msg, cls) {
  const el = document.getElementById('st');
  el.style.display = 'block';
  el.className = 'status ' + cls;
  el.textContent = msg;
}
function hideStatus() { document.getElementById('st').style.display = 'none'; }
</script>
</body>
</html>`).setTitle('Send Review Request').setWidth(340);

  SpreadsheetApp.getUi().showSidebar(html);
}

function getReviewPreview(photoId) {
  const sheet = getSheet_(GALLERY_TAB);
  if (!sheet) return null;

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[G.ID - 1]).trim() !== String(photoId).trim()) continue;

    const leadId = row[G.LEAD_ID - 1];
    const job    = getCrmJob_(leadId);
    const label  = row[G.LABEL - 1] || 'your grill';

    if (!job) {
      return {
        email: null,
        name: '—',
        preview: `Lead ID "${leadId}" not found in CRM tab.\nAdd the Lead ID (e.g. TGC-032) to the Gallery tab first.`,
        alreadySent: false,
      };
    }

    const grillDesc = [job.grillBrand, job.grillModel].filter(Boolean).join(' ') || 'your grill';
    const preview =
`Subject: Your before & after — ${grillDesc.replace(/^your /i,'')}

Hi ${job.firstName},

Thanks again for choosing Tri-State Grill Cleaning. We wanted to share your before and after photos from your recent service.

Before: [photo link]
After:  [photo link]

We'd appreciate a Google review — it means a lot to a small local business:
${REVIEW_LINK}

— Jeff, Tri-State Grill Cleaning`;

    return {
      email:       job.email || null,
      name:        job.name,
      preview,
      alreadySent: row[G.REVIEW_SENT - 1] === true,
    };
  }
  return null;
}

function sendReviewRequestFromSidebar(photoId) {
  return sendReviewRequest(photoId);
}

// ─────────────────────────────────────────────────────────────
// 6. MENU — appears automatically when Sheet opens
// ─────────────────────────────────────────────────────────────
function onOpen() {
  const menu = SpreadsheetApp.getUi().createMenu('⭐ TSGC');
  if (!REVIEWS_PAUSED) {
    menu.addItem('Send Review Request', 'openReviewSidebar').addSeparator();
  }
  menu
    .addItem('Scan for New Photos', 'testScan')
    .addItem('Fix Gallery Sheet', 'fixGallerySheet')
    .addToUi();
}

// ─────────────────────────────────────────────────────────────
// 7. PUBLIC JSON ENDPOINT — called by gallery.html on site
// ─────────────────────────────────────────────────────────────
function doGet(e) {
  try {
    const sheet = getSheet_(GALLERY_TAB);
    if (!sheet) return jsonOut([]);

    const photos = [];
    const rows   = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const vis = row[G.VISIBLE - 1];
      if (vis === false || String(vis).toUpperCase() === 'FALSE' || vis === '') continue;
      photos.push({
        id:        row[G.ID - 1],
        date:      row[G.DATE - 1],
        label:     row[G.LABEL - 1],
        beforeUrl: row[G.BEFORE_URL - 1],
        afterUrl:  row[G.AFTER_URL  - 1],
      });
    }

    photos.reverse();
    return jsonOut(photos);
  } catch (err) {
    return jsonOut({ error: err.message });
  }
}

function jsonOut(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────────────────────────────────────────
// 8. FIX SHEET — fixes broken URLs, removes duplicates,
//    adds missing columns, renames Customer ID → Lead ID
// ─────────────────────────────────────────────────────────────
function fixGallerySheet() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(GALLERY_TAB);
  if (!sheet) { Logger.log('No Gallery tab'); return; }

  ensureGalleryColumns_(sheet);

  const data     = sheet.getDataRange().getValues();
  const seen     = new Set();
  const toDelete = [];

  for (let i = 1; i < data.length; i++) {
    const row      = data[i];
    const beforeId = row[G.BEFORE_ID - 1];
    const afterId  = row[G.AFTER_ID  - 1];
    const pairKey  = `${beforeId}|${afterId}`;

    if (seen.has(pairKey)) { toDelete.push(i + 1); continue; }
    seen.add(pairKey);

    if (String(row[G.BEFORE_URL - 1]).includes('uc?export=view'))
      sheet.getRange(i + 1, G.BEFORE_URL).setValue(thumbnailUrl(beforeId));
    if (String(row[G.AFTER_URL - 1]).includes('uc?export=view'))
      sheet.getRange(i + 1, G.AFTER_URL).setValue(thumbnailUrl(afterId));

    // Upgrade sz=w800 → sz=w1200 for higher res
    ['BEFORE_URL','AFTER_URL'].forEach(col => {
      const cell = sheet.getRange(i + 1, G[col]);
      const val  = String(cell.getValue());
      if (val.includes('sz=w800')) cell.setValue(val.replace('sz=w800','sz=w1200'));
    });
  }

  toDelete.reverse().forEach(r => sheet.deleteRow(r));
  const remaining = sheet.getDataRange().getValues();
  for (let i = 1; i < remaining.length; i++) {
    sheet.getRange(i + 1, G.ID).setValue(`PHOTO-${String(i).padStart(3, '0')}`);
  }

  Logger.log(`✓ Fixed. Removed ${toDelete.length} duplicate(s). ${remaining.length - 1} photo(s) remain.`);
}

// ─────────────────────────────────────────────────────────────
// 9. INSTALL HOURLY TRIGGER
// Run once. onOpen() is a simple trigger — do NOT add it here.
// ─────────────────────────────────────────────────────────────
function installTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'scanForNewPhotos')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('scanForNewPhotos').timeBased().everyHours(1).create();
  Logger.log('✓ Hourly trigger installed. The ⭐ TSGC menu appears when you open the Sheet.');
}

// ─────────────────────────────────────────────────────────────
// 10. DEBUG
// ─────────────────────────────────────────────────────────────
function debugFolder() {
  const folder = DriveApp.getFolderById(PHOTOS_FOLDER_ID);
  const files  = folder.getFiles();
  let count = 0;
  Logger.log('=== TSGC Photos ===');
  while (files.hasNext()) {
    const file  = files.next();
    const name  = file.getName();
    const clean = stripExtensions(name.toLowerCase());
    Logger.log(`"${name}" | image:${isImage(file)} | before:${clean.startsWith('before-')} | after:${clean.startsWith('after-')} | id:${file.getId()}`);
    count++;
  }
  Logger.log(`Total: ${count}`);
}

function debugCrm(leadId) {
  const job = getCrmJob_(leadId);
  Logger.log(job ? JSON.stringify(job, null, 2) : `Not found: ${leadId}`);
}

// ─────────────────────────────────────────────────────────────
// 11. MANUAL PAIR
// ─────────────────────────────────────────────────────────────
function addManualPair(beforeFileId, afterFileId, label, leadId) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  let   sheet = ss.getSheetByName(GALLERY_TAB);
  if (!sheet) { scanForNewPhotos(); sheet = ss.getSheetByName(GALLERY_TAB); }

  const bf = DriveApp.getFileById(beforeFileId);
  const af = DriveApp.getFileById(afterFileId);
  bf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  af.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const galleryId = `PHOTO-${String(sheet.getLastRow()).padStart(3, '0')}`;
  sheet.appendRow([
    galleryId,
    new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' }),
    label || 'Grill Cleaning',
    thumbnailUrl(beforeFileId),
    thumbnailUrl(afterFileId),
    beforeFileId, afterFileId,
    true,
    leadId || '', '', false, ''
  ]);
  Logger.log(`✓ Manual pair: ${galleryId} — "${label}" | Lead: ${leadId || 'none'}`);
}

// Fill in and run:
function addExamplePair() {
  addManualPair(
    'PASTE_BEFORE_FILE_ID',
    'PASTE_AFTER_FILE_ID',
    'DCS Builtin · Hyde Park',
    'TGC-032'  // Lead ID from CRM + Jobs tab
  );
}

// ─────────────────────────────────────────────────────────────
// 12. TEST
// ─────────────────────────────────────────────────────────────
function testScan() { scanForNewPhotos(); }
