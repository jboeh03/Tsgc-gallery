/**
 * ============================================================
 * TSGC CRM SHEET SCRIPT
 * Bound to: CRM Google Sheet (18DaRXOuAI8VjYd1qrpy-rr9SoOTi57VpfPOx05aolCo)
 * Install:  Open CRM Sheet → Extensions → Apps Script → paste here
 * ============================================================
 *
 * WHAT THIS DOES:
 *  - Adds ⭐ TSGC menu to the sheet on open
 *  - Imports new Squarespace leads from 📥 Raw Leads every 15 min
 *  - Generates Lead IDs (TGC-001 format)
 *  - Sends alert email to Jeff on new leads
 *  - Sends auto-reply to customer on new leads
 *  - Review request sidebar: ⭐ TSGC → Send Review Request
 *  - Logs review sends to ⭐ Reviews tab
 *  - Updates CRM Review Requested column automatically
 */

// ── Config ────────────────────────────────────────────────────
const SHEET_ID     = '18DaRXOuAI8VjYd1qrpy-rr9SoOTi57VpfPOx05aolCo';
const NOTIFY_EMAIL = 'jeff@cincygrillcleaning.com';
const BACKUP_EMAIL = 'jeffvboeh@gmail.com';
const REVIEW_LINK  = 'https://www.google.com/maps?cid=306553952702723641&action=write-review';
// TEMP: review requests are paused while we work through a rough stretch of
// feedback. Hides the "Send Review Request" menu item and blocks sends. Mirror
// of SHOW_REVIEWS in lib/site.ts — flip both back together.
const REVIEWS_PAUSED = true;
const GALLERY_ENDPOINT = 'https://script.google.com/macros/s/AKfycbww5R8YzI7ylKcpBCFJivxkEDtlJkrkkNddLL1dLl-ONq6WjiRgXt0ydewY-4yofziK/exec';

// ── Tab names ─────────────────────────────────────────────────
const RAW_TAB     = '📥 Raw Leads';
const CRM_TAB     = '📋 CRM + Jobs';
const CUST_TAB    = '👤 Customers';
const GALLERY_TAB = '📸 Gallery';
const REVIEWS_TAB = '⭐ Reviews';

// ── CRM + Jobs column positions ───────────────────────────────
const CRM = {
  LEAD_ID:     1,  NAME:        3,  PHONE:       4,
  EMAIL:       5,  ZIP:         6,  SERVICE:     7,
  GRILL_MODEL: 8,  SOURCE:      9,  NOTES:       11,
  STATUS:      12, DATE_QUOTED: 13, QUOTE_AMT:   14,
  DATE_BOOKED: 15, SCHED_DATE:  16, SCHED_TIME:  17,
  TECH:        18, JOB_ADDRESS: 19, GRILL_BRAND: 20,
  GRILL_TYPE:  21, JOB_NOTES:   22, DATE_COMP:   23,
  INVOICE_NUM: 25, INVOICE_AMT: 27, DATE_PAID:   28,
  PAY_METHOD:  29, REV_REQ:     30, REV_RECV:    31,
  REV_NOTES:   32,
};

// ── Gallery tab columns ───────────────────────────────────────
const G = {
  ID:1, DATE:2, LABEL:3, BEFORE_URL:4, AFTER_URL:5,
  BEFORE_ID:6, AFTER_ID:7, VISIBLE:8,
  LEAD_ID:9, JOB_NOTES:10, REVIEW_SENT:11, REVIEW_SENT_DATE:12,
};

// ── Reviews tab columns ───────────────────────────────────────
const REV = {
  LEAD_ID:1, CUST_NAME:2, PHONE:3, EMAIL:4, JOB_DATE:5,
  JOB_ADDRESS:6, REQ_SENT:7, DATE_REQ:8, REQ_METHOD:9,
  REV_RECV:10, PLATFORM:11, STAR_RATING:12, REV_DATE:13, NOTES:14,
};

function ss_()    { return SpreadsheetApp.openById(SHEET_ID); }
function sheet_(n){ return ss_().getSheetByName(n); }
function today_() { return new Date().toLocaleDateString('en-US',{timeZone:'America/New_York'}); }

// =============================================================
// 1. MENU — runs automatically when sheet opens
// =============================================================
function onOpen() {
  const menu = SpreadsheetApp.getUi().createMenu('⭐ TSGC');
  if (!REVIEWS_PAUSED) {
    menu.addItem('Send Review Request', 'openReviewSidebar').addSeparator();
  }
  menu
    .addItem('Import New Leads Now', 'importNewLeads')
    .addItem('Scan Gallery Photos',  'triggerGalleryScan')
    .addToUi();
}

// =============================================================
// 2. LEAD IMPORT — runs every 15 min via trigger
//    Copies new rows from 📥 Raw Leads → 📋 CRM + Jobs
// =============================================================
function importNewLeads() {
  const rawSheet = sheet_(RAW_TAB);
  const crmSheet = sheet_(CRM_TAB);
  if (!rawSheet || !crmSheet) { Logger.log('Tab not found'); return; }

  const rawRows = rawSheet.getDataRange().getValues();
  const crmRows = crmSheet.getDataRange().getValues();

  // Build set of already-imported timestamps
  const imported = new Set(
    crmRows.slice(1).map(r => String(r[1]).trim()) // col B = Date Received
  );

  // Find next Lead ID number
  let maxNum = 0;
  crmRows.slice(1).forEach(r => {
    const id = String(r[CRM.LEAD_ID - 1]);
    const m  = id.match(/TGC-(\d+)/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
  });

  let added = 0;

  // Raw Leads columns: Submitted On, Name, Email, Phone, Zip, Service, Grill/Model, How Heard, Referred By
  for (let i = 2; i < rawRows.length; i++) { // skip header rows
    const raw = rawRows[i];
    if (!raw[0] || !raw[1]) continue; // empty row
    const timestamp = String(raw[0]).trim();
    if (imported.has(timestamp)) continue; // already imported

    maxNum++;
    const leadId = `TGC-${String(maxNum).padStart(3, '0')}`;
    const name   = String(raw[1]).trim();
    const email  = String(raw[2]).trim();
    const phone  = String(raw[3]).trim();
    const zip    = String(raw[4]).trim();
    const service= String(raw[5]).trim();
    const grill  = String(raw[6]).trim();
    const source = String(raw[7]).trim() || 'Website Form';
    const referred = String(raw[8] || '').trim();

    // Append to CRM
    const newRow = Array(48).fill('');
    newRow[CRM.LEAD_ID    - 1] = leadId;
    newRow[1]                  = timestamp;  // Date Received (col B)
    newRow[CRM.NAME       - 1] = name;
    newRow[CRM.PHONE      - 1] = phone;
    newRow[CRM.EMAIL      - 1] = email;
    newRow[CRM.ZIP        - 1] = zip;
    newRow[CRM.SERVICE    - 1] = service;
    newRow[CRM.GRILL_MODEL- 1] = grill;
    newRow[CRM.SOURCE     - 1] = source;
    newRow[9]                  = referred;   // Referred By (col J)
    newRow[CRM.STATUS     - 1] = 'New Lead';

    crmSheet.appendRow(newRow);
    imported.add(timestamp);
    added++;

    // Notify Jeff
    sendLeadAlert_(leadId, name, email, phone, zip, service, grill, source);

    // Auto-reply to customer
    if (email && email.includes('@')) {
      sendCustomerAutoReply_(name.split(' ')[0] || 'there', email, service, grill);
    }
  }

  if (added > 0) Logger.log(`✓ Imported ${added} new lead(s).`);
  else Logger.log('No new leads.');
}

function sendLeadAlert_(leadId, name, email, phone, zip, service, grill, source) {
  const subject = `New Lead: ${name} (${leadId}) — ${service.split(',')[0]}`;
  const body =
`New lead from TSGC website/form.

ID:       ${leadId}
Name:     ${name}
Phone:    ${phone}
Email:    ${email}
ZIP:      ${zip}
Service:  ${service}
Grill:    ${grill || '(not specified)'}
Source:   ${source}

CRM: https://docs.google.com/spreadsheets/d/${SHEET_ID}`;

  GmailApp.sendEmail(NOTIFY_EMAIL, subject, body);
  if (BACKUP_EMAIL !== NOTIFY_EMAIL) {
    GmailApp.sendEmail(BACKUP_EMAIL, subject, body);
  }
}

function sendCustomerAutoReply_(firstName, email, service, grill) {
  const subject = 'We got your request — Tri-State Grill Cleaning';
  const body =
`Hi ${firstName},

Thanks for reaching out to Tri-State Grill Cleaning! We received your request${grill ? ' for your ' + grill : ''} and will follow up as soon as we can with a quote and available times.

In the meantime, feel free to call or text us directly:
(657) 831-4276

— Jeff Boeh
Tri-State Grill Cleaning
jeff@cincygrillcleaning.com
tristategrillcleaning.com`;

  GmailApp.sendEmail(email, subject, body, {
    name:    'Tri-State Grill Cleaning',
    replyTo: NOTIFY_EMAIL,
  });
}

// =============================================================
// 3. REVIEW REQUEST SIDEBAR
// =============================================================
function openReviewSidebar() {
  if (REVIEWS_PAUSED) {
    SpreadsheetApp.getUi().alert('Review requests are paused right now.');
    return;
  }
  const html = HtmlService.createHtmlOutput(`<!DOCTYPE html>
<html>
<head>
<style>
  body{font-family:Arial,sans-serif;padding:16px;font-size:13px;color:#333;margin:0}
  h2{font-size:15px;margin:0 0 4px;color:#1A3055}
  .sub{font-size:11px;color:#777;margin-bottom:16px}
  label{display:block;margin-bottom:4px;font-weight:bold;font-size:12px}
  input{width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;
        margin-bottom:12px;font-size:13px;box-sizing:border-box}
  .card{background:#f5f5f5;border:1px solid #ddd;border-radius:4px;
        padding:10px;font-size:11px;margin-bottom:12px;display:none}
  .card-row{margin-bottom:4px;line-height:1.5}
  .card-row span{font-weight:bold;color:#1A3055}
  .preview{white-space:pre-wrap;font-size:11px;background:#fff;
           border:1px solid #e0e0e0;border-radius:4px;padding:8px;
           max-height:180px;overflow-y:auto;display:none;margin-bottom:12px}
  .sent-badge{background:#E8F5E9;color:#2E7D32;border-radius:3px;
              padding:1px 6px;font-size:10px;font-weight:bold}
  button{background:#8B1F2F;color:#fff;border:none;padding:10px;
         border-radius:4px;cursor:pointer;font-size:13px;width:100%}
  button:hover{background:#A83040}
  button:disabled{background:#bbb;cursor:default}
  .status{margin-top:10px;padding:8px;border-radius:4px;
          display:none;font-size:12px;line-height:1.5}
  .ok{background:#EAF3DE;color:#3B6D11}
  .err{background:#FCEBEB;color:#A32D2D}
  .toggle{font-size:11px;color:#1A3055;cursor:pointer;text-decoration:underline;
          display:none;margin-bottom:8px}
</style>
</head>
<body>
<h2>⭐ Send Review Request</h2>
<p class="sub">Sends before/after photos + Google review link to the customer.</p>

<label>Photo ID (from 📸 Gallery tab)</label>
<input type="text" id="pid" placeholder="PHOTO-013" oninput="loadPreview()">

<div class="card" id="card">
  <div class="card-row">Customer: <span id="cname"></span></div>
  <div class="card-row">Email: <span id="cemail"></span></div>
  <div class="card-row">Lead: <span id="clead"></span></div>
  <div class="card-row" id="csent-row" style="display:none">
    Status: <span class="sent-badge">✓ Already Sent</span> on <span id="csent-date"></span>
  </div>
</div>

<span class="toggle" id="prev-toggle" onclick="togglePreview()">▸ Show email preview</span>
<div class="preview" id="prev"></div>

<button id="btn" onclick="send()" disabled>Send Review Request</button>
<div class="status" id="st"></div>

<script>
let debounce, canSend=false, showingPreview=false;
function loadPreview(){
  clearTimeout(debounce);
  const id=document.getElementById('pid').value.trim();
  if(!id){reset();return;}
  debounce=setTimeout(()=>{
    document.getElementById('btn').textContent='Loading...';
    google.script.run
      .withSuccessHandler(d=>{
        if(!d){showStatus('Photo ID not found','err');reset();return;}
        document.getElementById('card').style.display='block';
        document.getElementById('cname').textContent=d.name||'—';
        document.getElementById('cemail').textContent=d.email||'(no email on file)';
        document.getElementById('clead').textContent=d.leadId||'(no Lead ID)';
        const sr=document.getElementById('csent-row');
        if(d.alreadySent){
          sr.style.display='block';
          document.getElementById('csent-date').textContent=d.sentDate||'';
        } else { sr.style.display='none'; }
        document.getElementById('prev').textContent=d.preview||'';
        document.getElementById('prev-toggle').style.display='block';
        canSend=!d.alreadySent&&!!d.email&&d.email!=='(no email on file)';
        document.getElementById('btn').disabled=!canSend;
        document.getElementById('btn').textContent=canSend?'Send Review Request':
          (d.alreadySent?'Already Sent':'No Email on File');
        hideStatus();
      })
      .withFailureHandler(e=>{showStatus(e.message,'err');reset();})
      .getReviewPreview(id);
  },500);
}
function togglePreview(){
  showingPreview=!showingPreview;
  document.getElementById('prev').style.display=showingPreview?'block':'none';
  document.getElementById('prev-toggle').textContent=
    (showingPreview?'▾ Hide':'▸ Show')+' email preview';
}
function send(){
  const id=document.getElementById('pid').value.trim();
  if(!id||!canSend)return;
  document.getElementById('btn').disabled=true;
  document.getElementById('btn').textContent='Sending...';
  google.script.run
    .withSuccessHandler(msg=>{
      const ok=msg.startsWith('✓');
      showStatus(msg,ok?'ok':'err');
      document.getElementById('btn').textContent=ok?'✓ Sent!':'Retry';
      document.getElementById('btn').disabled=ok;
      canSend=!ok;
    })
    .withFailureHandler(e=>{
      showStatus('Error: '+e.message,'err');
      document.getElementById('btn').disabled=false;
      document.getElementById('btn').textContent='Send Review Request';
    })
    .sendReviewRequestFromSidebar(id);
}
function reset(){
  document.getElementById('card').style.display='none';
  document.getElementById('prev').style.display='none';
  document.getElementById('prev-toggle').style.display='none';
  document.getElementById('btn').disabled=true;
  document.getElementById('btn').textContent='Send Review Request';
  canSend=false; showingPreview=false;
}
function showStatus(msg,cls){
  const el=document.getElementById('st');
  el.style.display='block';el.className='status '+cls;el.textContent=msg;
}
function hideStatus(){document.getElementById('st').style.display='none';}
</script>
</body>
</html>`).setTitle('⭐ Send Review Request').setWidth(340);
  SpreadsheetApp.getUi().showSidebar(html);
}

// Called by sidebar — gets preview data
function getReviewPreview(photoId) {
  const gSheet = sheet_(GALLERY_TAB);
  if (!gSheet) return null;

  const rows = gSheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[G.ID - 1]).trim() !== String(photoId).trim()) continue;

    const leadId     = String(row[G.LEAD_ID - 1]).trim();
    const alreadySent = row[G.REVIEW_SENT - 1] === true;
    const sentDate   = row[G.REVIEW_SENT_DATE - 1] || '';
    const job        = getCrmJob_(leadId);

    if (!job) {
      return {
        name: '—', email: null, leadId: leadId || '(empty)',
        preview: leadId
          ? `Lead ID "${leadId}" not found in CRM tab.\nCheck spelling — should be like TGC-032.`
          : 'No Lead ID set.\nOpen 📸 Gallery tab and paste the Lead ID (e.g. TGC-032) for this row.',
        alreadySent: false, sentDate: '',
      };
    }

    const grillDesc  = [job.grillBrand, job.grillModel].filter(Boolean).join(' ') || 'your grill';
    const beforeUrl  = row[G.BEFORE_URL - 1];
    const afterUrl   = row[G.AFTER_URL  - 1];

    const preview =
`Subject: Your before & after — ${grillDesc.replace(/^your /i,'')}

Hi ${job.firstName},

Thanks again for choosing Tri-State Grill Cleaning! We wanted to share your before and after photos from your recent service.

Before:
${beforeUrl}

After:
${afterUrl}

If you have a minute, a Google review means the world to a small local business — and it helps other Cincinnati homeowners find us:

${REVIEW_LINK}

Thanks,
Jeff Boeh
Tri-State Grill Cleaning
(657) 831-4276 | tristategrillcleaning.com`;

    return {
      name: job.name, email: job.email || null,
      leadId, preview, alreadySent, sentDate,
    };
  }
  return null;
}

// Called by sidebar — does the actual send
function sendReviewRequestFromSidebar(photoId) {
  if (REVIEWS_PAUSED) return '⚠️ Review requests are paused right now.';

  const gSheet = sheet_(GALLERY_TAB);
  if (!gSheet) return '⚠️ Gallery tab not found';

  const rows = gSheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[G.ID - 1]).trim() !== String(photoId).trim()) continue;

    if (row[G.REVIEW_SENT - 1] === true)
      return `⚠️ Already sent on ${row[G.REVIEW_SENT_DATE - 1]}`;

    const leadId    = String(row[G.LEAD_ID - 1]).trim();
    const job       = getCrmJob_(leadId);
    const beforeUrl = row[G.BEFORE_URL - 1];
    const afterUrl  = row[G.AFTER_URL  - 1];

    if (!job)  return `⚠️ Lead ID "${leadId}" not found. Check the Lead ID column in 📸 Gallery.`;
    if (!job.email) return `⚠️ No email for ${job.name}. Check the CRM tab.`;

    const grillDesc = [job.grillBrand, job.grillModel].filter(Boolean).join(' ') || 'your grill';

    GmailApp.sendEmail(job.email,
      `Your before & after — ${grillDesc.replace(/^your /i,'')}`,
`Hi ${job.firstName},

Thanks again for choosing Tri-State Grill Cleaning! We wanted to share your before and after photos from your recent service.

Before:
${beforeUrl}

After:
${afterUrl}

If you have a minute, a Google review means the world to a small local business — and it helps other Cincinnati homeowners find us:

${REVIEW_LINK}

Thanks,
Jeff Boeh
Tri-State Grill Cleaning
(657) 831-4276 | tristategrillcleaning.com`,
      { name: 'Tri-State Grill Cleaning', replyTo: NOTIFY_EMAIL }
    );

    // Mark gallery row
    const t = today_();
    gSheet.getRange(i+1, G.REVIEW_SENT).setValue(true);
    gSheet.getRange(i+1, G.REVIEW_SENT_DATE).setValue(t);
    gSheet.getRange(i+1, 1, 1, gSheet.getLastColumn()).setBackground('#EAF3DE');

    // Mark CRM Review Requested
    const crmSheet = sheet_(CRM_TAB);
    if (crmSheet && job.rowIndex) {
      crmSheet.getRange(job.rowIndex, CRM.REV_REQ).setValue('Yes');
    }

    // Log to ⭐ Reviews tab
    logReviewSent_(job, t, photoId);

    Logger.log(`✓ Review sent to ${job.email} for ${photoId}`);
    return `✓ Sent to ${job.name} at ${job.email}`;
  }
  return `⚠️ Photo ID "${photoId}" not found in Gallery tab`;
}

// =============================================================
// 4. HELPERS
// =============================================================
function getCrmJob_(leadId) {
  if (!leadId) return null;
  const s = sheet_(CRM_TAB);
  if (!s) return null;
  const rows = s.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][CRM.LEAD_ID-1]).trim() === String(leadId).trim()) {
      const name  = String(rows[i][CRM.NAME-1]).trim();
      const parts = name.split(' ');
      return {
        leadId,   name,
        firstName: parts[0] || '',
        email:     String(rows[i][CRM.EMAIL-1]).trim(),
        phone:     rows[i][CRM.PHONE-1],
        grillModel:rows[i][CRM.GRILL_MODEL-1],
        grillBrand:rows[i][CRM.GRILL_BRAND-1],
        grillType: rows[i][CRM.GRILL_TYPE-1],
        jobAddress:rows[i][CRM.JOB_ADDRESS-1],
        dateComp:  rows[i][CRM.DATE_COMP-1],
        schedDate: rows[i][CRM.SCHED_DATE-1],
        rowIndex:  i + 1,
      };
    }
  }
  return null;
}

function logReviewSent_(job, today, photoId) {
  const s = sheet_(REVIEWS_TAB);
  if (!s) return;
  const rows = s.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][REV.LEAD_ID-1]) === String(job.leadId)) {
      s.getRange(i+1,REV.REQ_SENT).setValue('Yes');
      s.getRange(i+1,REV.DATE_REQ).setValue(today);
      s.getRange(i+1,REV.REQ_METHOD).setValue('Email (Gallery)');
      s.getRange(i+1,REV.NOTES).setValue(`Photo: ${photoId}`);
      return;
    }
  }
  s.appendRow([
    job.leadId, job.name, job.phone, job.email,
    job.dateComp||job.schedDate||'', job.jobAddress||'',
    'Yes', today, 'Email (Gallery)',
    '', 'Google', '', '', `Photo: ${photoId}`,
  ]);
}

// =============================================================
// 5. GALLERY SCAN TRIGGER (calls gallery web app)
// =============================================================
function triggerGalleryScan() {
  try {
    UrlFetchApp.fetch(GALLERY_ENDPOINT + '?action=scan');
    SpreadsheetApp.getUi().alert('📸 Gallery scan triggered. Check the 📸 Gallery tab in a moment.');
  } catch(e) {
    SpreadsheetApp.getUi().alert('Scan triggered (response: ' + e.message + ')');
  }
}

// =============================================================
// 6. TRIGGERS — run installTriggers() once after setup
// =============================================================
function installTriggers() {
  // Remove any existing import triggers
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'importNewLeads')
    .forEach(t => ScriptApp.deleteTrigger(t));

  // Import every 15 minutes
  ScriptApp.newTrigger('importNewLeads')
    .timeBased().everyMinutes(15).create();

  Logger.log('✓ 15-min import trigger installed.');
  Logger.log('ℹ️  onOpen() runs automatically — no trigger needed for the menu.');
}
