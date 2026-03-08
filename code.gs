// ════════════════════════════════════════════════════════════════
//  Deep Roots — Crew Checkout  |  Google Apps Script
//  Managed via clasp. To push updates:
//    cd "Container checkout app" && clasp push && clasp deploy
//




//  FIRST-TIME TRIGGER SETUP:
//    1. Open this project at script.google.com
//    2. Select "setupTriggers" from the function dropdown
//    3. Click Run — authorize when prompted
//    4. Triggers are now set: 6 AM = Pre-Morning, 12 PM = Post Morning
// ════════════════════════════════════════════════════════════════

const SPREADSHEET_ID           = '1MBzSFyRhevXXZh0s4FbzxSwBiTMIq9JQPquHziSjfm0';
const SHEET_NAME               = 'Checkouts';
const INVENTORY_SPREADSHEET_ID = '18qeP1XG9sDtknL3UKc7bb2utHvnJNpYNKkfMNsSVDRQ';
const INVENTORY_SHEET_GID      = 1091761059;
const REPORT_SHEET_NAME        = 'Daily Reports';
const IMAGES_SHEET_NAME        = 'Item Images';

function doPost(e) {
  try {
    const data  = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();

    const rawType = String(data.type || 'CHECKOUT').trim().toUpperCase();
    const type    = (rawType === 'RETURN') ? 'RETURN' : 'CHECKOUT';
    const crew    = validateCrew(data.crew);
    const items   = Array.isArray(data.items) ? data.items : [];

    // Server-side timestamp stored as native Date → reliable for window comparisons
    const timestamp = new Date();

    items.forEach(item => {
      sheet.appendRow([
        timestamp,
        type,
        `Crew ${crew}`,
        String(item.abbr || '').substring(0, 10),
        String(item.name || '').substring(0, 200),
        Math.max(1, Math.min(9999, parseInt(item.qty) || 1))
      ]);
    });

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', rows: items.length }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Serve the app HTML when no crew param; return JSON inventory when crew param present
function doGet(e) {

  // No crew param → serve the checkout web app (iframe-embeddable)
  if (e.parameter.crew === undefined && e.parameter.action === undefined) {
    return HtmlService.createHtmlOutputFromFile('checkout')
      .setTitle('DR Crew Checkout')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // action=images → return all stored item images as a JSON map
  if (e.parameter.action === 'images') {
    try {
      const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName(IMAGES_SHEET_NAME);
      const images = {};
      if (sheet) {
        const rows = sheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] && rows[i][1]) {
            images[String(rows[i][0]).toLowerCase()] = String(rows[i][1]);
          }
        }
      }
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok', images }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // crew param present → return JSON inventory
  try {
    const crew  = e.parameter.crew || null;
    const sheet = getOrCreateSheet();
    const rows  = sheet.getDataRange().getValues();
    // columns: Timestamp | Type | Crew | Tool Abbr | Tool Name | Qty

    const tally = {};  // keyed by "abbr||name"

    for (let i = 1; i < rows.length; i++) {
      const row     = rows[i];
      const rowCrew = String(row[2]).trim();   // "Crew 2"
      if (crew && rowCrew !== `Crew ${crew}`) continue;

      const type  = String(row[1]).trim().toUpperCase();
      const abbr  = String(row[3]).trim();
      const name  = String(row[4]).trim();
      const qty   = parseInt(row[5]) || 0;
      const key   = abbr || name;

      if (!tally[key]) tally[key] = { abbr, name, qty: 0 };
      if (type === 'CHECKOUT') tally[key].qty += qty;
      if (type === 'RETURN')   tally[key].qty -= qty;
    }

    // Only items with a positive balance (still out)
    const items = Object.values(tally)
      .filter(r => r.qty > 0)
      .sort((a, b) => (a.abbr || a.name).localeCompare(b.abbr || b.name));

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', crew, items }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ════════════════════════════════════════════════════════════════
//  SCHEDULED DAILY CHECKS
// ════════════════════════════════════════════════════════════════

// Run ONCE manually from the GAS editor to register the triggers.
// After that, they fire automatically every day.
function setupTriggers() {
  // Delete any existing versions of these triggers
  ScriptApp.getProjectTriggers().forEach(t => {
    if (['preMorningCheck', 'postMorningCheck'].includes(t.getHandlerFunction())) {
      ScriptApp.deleteTrigger(t);
    }
  });

  // 6 AM Eastern — Pre-Morning Check
  ScriptApp.newTrigger('preMorningCheck')
    .timeBased()
    .atHour(6)
    .everyDays(1)
    .inTimezone('America/New_York')
    .create();

  // 12 PM Eastern — Post Morning Check
  ScriptApp.newTrigger('postMorningCheck')
    .timeBased()
    .atHour(12)
    .everyDays(1)
    .inTimezone('America/New_York')
    .create();

  Logger.log('Triggers created: preMorningCheck @ 6 AM, postMorningCheck @ 12 PM (America/New_York)');
}

// ── Pre-Morning Check (6 AM) ─────────────────────────────────────
//  Window: yesterday 12:00 PM → today 6:00 AM
//  Focus:  returns / bring-backs from the previous afternoon
function preMorningCheck() {
  const now   = new Date();
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(),     6,  0, 0);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0);
  runDailyCheck('PRE-MORNING CHECK', start, end);
}

// ── Post Morning Check (12 PM) ───────────────────────────────────
//  Window: today 6:00 AM → today 12:00 PM
//  Focus:  morning checkouts heading out to job sites
function postMorningCheck() {
  const now   = new Date();
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(),  6, 0, 0);
  runDailyCheck('POST MORNING CHECK', start, end);
}

// ── Core: tally window, update inventory, write report ──────────
function runDailyCheck(checkName, windowStart, windowEnd) {

  // 1. Read checkout records in the window
  const checkoutSheet = getOrCreateSheet();
  const rows          = checkoutSheet.getDataRange().getValues();

  const checkouts = {};  // name → { abbr, name, qty }
  const returns   = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const ts  = parseTs(row[0]);
    if (!ts || ts < windowStart || ts > windowEnd) continue;

    const type = String(row[1]).trim().toUpperCase();
    const abbr = String(row[3]).trim();
    const name = String(row[4]).trim();
    const qty  = parseInt(row[5]) || 0;
    if (!name || !qty) continue;

    const target = type === 'CHECKOUT' ? checkouts
                 : type === 'RETURN'   ? returns
                 : null;
    if (!target) continue;

    if (!target[name]) target[name] = { abbr, name, qty: 0 };
    target[name].qty += qty;
  }

  // 2. Load the material inventory (separate spreadsheet)
  const invSS    = SpreadsheetApp.openById(INVENTORY_SPREADSHEET_ID);
  const invSheet = invSS.getSheets().find(s => s.getSheetId() === INVENTORY_SHEET_GID) || null;
  const invData  = invSheet ? invSheet.getDataRange().getValues() : [];

  // Map: lowercase item name → { rowIndex (1-based), qty }
  const invMap = {};
  for (let i = 1; i < invData.length; i++) {
    const cellName = String(invData[i][0]).trim();
    if (!cellName) continue;
    invMap[cellName.toLowerCase()] = {
      rowIndex: i + 1,                         // 1-based for getRange()
      qty:      parseFloat(invData[i][1]) || 0  // Column B = Quantity
    };
  }

  // 3. Write report rows + apply inventory changes
  const reportSheet = getOrCreateReportSheet();
  const runAt    = Utilities.formatDate(new Date(),  'America/New_York', 'MM/dd/yyyy h:mm a');
  const winStart = Utilities.formatDate(windowStart, 'America/New_York', 'MM/dd h:mm a');
  const winEnd   = Utilities.formatDate(windowEnd,   'America/New_York', 'MM/dd h:mm a');
  let   written  = 0;

  // Returns → add quantities back to inventory
  Object.values(returns).forEach(item => {
    const key    = item.name.toLowerCase();
    const inv    = invMap[key];
    const before = inv ? inv.qty : null;
    let   after  = null;
    if (inv && invSheet) {
      after = before + item.qty;
      invSheet.getRange(inv.rowIndex, 2).setValue(after);        // Col B: Quantity
      invSheet.getRange(inv.rowIndex, 18).setValue(new Date());  // Col R: Last Updated
      invMap[key].qty = after;
    }
    reportSheet.appendRow([
      checkName, runAt, winStart, winEnd,
      'RETURN', item.abbr, item.name, '+' + item.qty,
      before !== null ? before : '—',
      after  !== null ? after  : '⚠ Not in inventory'
    ]);
    written++;
  });

  // Checkouts → subtract quantities from inventory
  Object.values(checkouts).forEach(item => {
    const key    = item.name.toLowerCase();
    const inv    = invMap[key];
    const before = inv ? inv.qty : null;
    let   after  = null;
    if (inv && invSheet) {
      after = before - item.qty;
      invSheet.getRange(inv.rowIndex, 2).setValue(after);        // Col B: Quantity
      invSheet.getRange(inv.rowIndex, 18).setValue(new Date());  // Col R: Last Updated
      invMap[key].qty = after;
    }
    reportSheet.appendRow([
      checkName, runAt, winStart, winEnd,
      'CHECKOUT', item.abbr, item.name, '-' + item.qty,
      before !== null ? before : '—',
      after  !== null ? after  : '⚠ Not in inventory'
    ]);
    written++;
  });

  if (written === 0) {
    reportSheet.appendRow([
      checkName, runAt, winStart, winEnd,
      '—', '', 'No activity in window', 0, '—', '—'
    ]);
  }
}

// ── Parse a cell value as a Date (handles native Date or string) ─
function parseTs(val) {
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// ── Get or create the Daily Reports tab ─────────────────────────
function getOrCreateReportSheet() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let   sheet = ss.getSheetByName(REPORT_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(REPORT_SHEET_NAME);
    sheet.appendRow([
      'Check Name', 'Run At', 'Window Start', 'Window End',
      'Type', 'Abbr', 'Item', 'Qty Change', 'Inv Before', 'Inv After'
    ]);

    const hRange = sheet.getRange(1, 1, 1, 10);
    hRange.setBackground('#2e3329');
    hRange.setFontColor('#7eb83a');
    hRange.setFontWeight('bold');
    sheet.setFrozenRows(1);

    sheet.setColumnWidth(1, 160);  // Check Name
    sheet.setColumnWidth(2, 160);  // Run At
    sheet.setColumnWidth(3, 120);  // Window Start
    sheet.setColumnWidth(4, 120);  // Window End
    sheet.setColumnWidth(5, 90);   // Type
    sheet.setColumnWidth(6, 60);   // Abbr
    sheet.setColumnWidth(7, 200);  // Item
    sheet.setColumnWidth(8, 80);   // Qty Change
    sheet.setColumnWidth(9, 90);   // Inv Before
    sheet.setColumnWidth(10, 90);  // Inv After
  }

  return sheet;
}

// ── Save / remove an item image (called via google.script.run) ──
//   name    – item name (used as key, case-insensitive)
//   dataUrl – compressed JPEG data URL, or null to remove
function saveItemImage(name, dataUrl) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let   sheet = ss.getSheetByName(IMAGES_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(IMAGES_SHEET_NAME);
    sheet.appendRow(['Item Name', 'Data URL', 'Updated']);
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 200);
    sheet.setColumnWidth(2, 400);
    sheet.setColumnWidth(3, 140);
    const h = sheet.getRange(1, 1, 1, 3);
    h.setBackground('#2e3329');
    h.setFontColor('#7eb83a');
    h.setFontWeight('bold');
  }

  const rows  = sheet.getDataRange().getValues();
  const lname = name.toLowerCase();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toLowerCase() === lname) {
      if (dataUrl === null) {
        sheet.deleteRow(i + 1);      // remove
      } else {
        sheet.getRange(i + 1, 2).setValue(dataUrl);     // update
        sheet.getRange(i + 1, 3).setValue(new Date());
      }
      return;
    }
  }

  if (dataUrl !== null) {
    sheet.appendRow([name, dataUrl, new Date()]);       // insert
  }
}

// ── Validate crew number (1-8, fallback to '?') ────────────────
function validateCrew(raw) {
  const n = parseInt(raw);
  return (n >= 1 && n <= 8) ? n : '?';
}

// ── Submit checkout/return via google.script.run (reliable) ────
//    Returns { status, rows } so the client gets real feedback.
function submitCheckout(data) {
  const sheet = getOrCreateSheet();

  const rawType = String(data.type || 'CHECKOUT').trim().toUpperCase();
  const type    = (rawType === 'RETURN') ? 'RETURN' : 'CHECKOUT';
  const crew    = validateCrew(data.crew);
  const items   = Array.isArray(data.items) ? data.items : [];

  const timestamp = new Date();

  items.forEach(item => {
    sheet.appendRow([
      timestamp,
      type,
      `Crew ${crew}`,
      String(item.abbr || '').substring(0, 10),
      String(item.name || '').substring(0, 200),
      Math.max(1, Math.min(9999, parseInt(item.qty) || 1))
    ]);
  });

  return { status: 'ok', rows: items.length };
}

// Returns the Checkouts sheet, creating it + header row if needed
function getOrCreateSheet() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let   sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Type', 'Crew', 'Tool Abbr', 'Tool Name', 'Qty']);

    // Style the header row
    const header = sheet.getRange(1, 1, 1, 6);
    header.setBackground('#2e3329');
    header.setFontColor('#7eb83a');
    header.setFontWeight('bold');
    sheet.setFrozenRows(1);

    // Column widths
    sheet.setColumnWidth(1, 180); // Timestamp
    sheet.setColumnWidth(2, 100); // Type
    sheet.setColumnWidth(3, 80);  // Crew
    sheet.setColumnWidth(4, 90);  // Abbr
    sheet.setColumnWidth(5, 180); // Name
    sheet.setColumnWidth(6, 60);  // Qty
  }

  return sheet;
}
