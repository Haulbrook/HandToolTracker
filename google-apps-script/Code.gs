/**
 * Hand Tool Tracker - Google Apps Script
 * Deep Roots Operations Theme
 */

/**
 * Serves the main HTML page when accessing the web app
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Daily Tool Checkout System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Include partial HTML files (for CSS and JS)
 * @param {string} filename - The name of the HTML file to include
 * @return {string} The content of the file
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Optional: Save data to Google Sheets instead of localStorage
 * Uncomment and modify if you want server-side persistence
 */
/*
function saveToSheet(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  // Implement your saving logic here
  return { success: true };
}

function loadFromSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  // Implement your loading logic here
  return null;
}
*/
