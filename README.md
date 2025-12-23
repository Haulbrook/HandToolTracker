# Hand Tool Tracker

A daily tool checkout system built with Google Apps Script for tracking hand tools, power tools, and equipment across work crews. Connected to Google Sheets for inventory management and checkout history.

## Features

- **Tool Inventory Management** - Tools organized by category (Hammers, Drivers, Measuring, Cutting, Pliers, Batteries, Power Tools, Safety, Misc)
- **Drag-and-Drop Checkout** - Easily assign tools to crews by dragging
- **8 Crew Cards** - Track checkouts per crew
- **Tool Stacking** - Collapsible groups for tools with multiple quantities
- **Broken/Missing Tracking** - Separate pool for damaged tools
- **Yesterday's Checkouts** - Quick view of previous day's checkouts (great for morning inventory checks)
- **Full History View** - Browse checkouts by date
- **Real-time Sync** - All checkouts saved to Google Sheets automatically
- **Print Support** - Print-friendly layout for daily reports

## Google Sheets Structure

### Required Sheets (Tabs)

Your Google Spreadsheet needs two tabs:

#### 1. "Inventory" Tab
| Column | Description |
|--------|-------------|
| Tool Name | Name of the tool (e.g., "Claw Hammer") |
| Category | One of: Hammers, Drivers, Measuring, Cutting, Pliers, Batteries, Power Tools, Safety, Misc |
| Quantity | Number of this tool available |
| Available | Current available count (optional, auto-updated) |
| Status | "Active" or "Inactive" (inactive tools are hidden) |

#### 2. "Checkouts" Tab
| Column | Description |
|--------|-------------|
| Tool Name | Name of the checked out tool |
| Crew | Crew number (1-8) |
| Checked Out By | Person who checked out (optional) |
| Date | Date of checkout (MM/dd/yyyy) |
| Time | Time of checkout (hh:mm a) |
| Status | "Checked Out" or "Returned" |

## Installation Steps

### Step 1: Create Google Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click **New Project**
3. Name the project "Hand Tool Tracker"

### Step 2: Create the Files

You need to create 4 files in Google Apps Script:

#### File 1: Code.gs (Main Script)
1. The default `Code.gs` file should already exist
2. Delete any existing code
3. Copy the entire contents of `code.gs.txt` and paste it in
4. **Update the SPREADSHEET_ID** on line 10 to match your Google Sheet ID
   - Your Sheet ID is in the URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit`

#### File 2: Index.html
1. Click the **+** next to Files
2. Select **HTML**
3. Name it `Index` (without .html extension)
4. Delete any default content
5. Copy the entire contents of `Index.html.txt` and paste it in

#### File 3: Styles.html
1. Click the **+** next to Files
2. Select **HTML**
3. Name it `Styles` (without .html extension)
4. Delete any default content
5. Copy the entire contents of `Styles.html.txt` and paste it in

#### File 4: Scripts.html
1. Click the **+** next to Files
2. Select **HTML**
3. Name it `Scripts` (without .html extension)
4. Delete any default content
5. Copy the entire contents of `Scripts.html.txt` and paste it in

### Step 3: Configure Your Google Sheet

1. Open your Google Sheet
2. Ensure you have an "Inventory" tab with the columns listed above
3. Ensure you have a "Checkouts" tab with the columns listed above
4. Add your tools to the Inventory tab

### Step 4: Deploy the Web App

1. In Google Apps Script, click **Deploy** > **New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Configure:
   - **Description**: "Hand Tool Tracker v1.0"
   - **Execute as**: Me
   - **Who has access**: Anyone (or "Anyone within [your organization]" for G Suite)
4. Click **Deploy**
5. **Authorize** the app when prompted (click through the security warnings)
6. Copy the **Web app URL** - this is your tool tracker!

### Step 5: Embed in Netlify (Branches Program)

To embed in your Netlify site, use an iframe:

```html
<iframe
  src="YOUR_WEB_APP_URL_HERE"
  width="100%"
  height="800px"
  frameborder="0"
  style="border: none;">
</iframe>
```

## File Structure

```
Hand Tool Tracker/
├── README.md           # This file
├── code.gs.txt         # Server-side Google Apps Script
├── Index.html.txt      # Main HTML template
├── Styles.html.txt     # CSS styles (Deep Roots Operations theme)
├── Scripts.html.txt    # Client-side JavaScript
├── index.html          # Standalone version (original)
└── index.zip           # Archived version
```

## Configuration

### Changing the Spreadsheet

Edit `code.gs.txt` line 10:
```javascript
const SPREADSHEET_ID = 'your-spreadsheet-id-here';
```

### Changing Sheet Tab Names

Edit `code.gs.txt` lines 11-12:
```javascript
const INVENTORY_SHEET_NAME = 'Inventory';   // Your inventory tab name
const HISTORY_SHEET_NAME = 'Checkouts';     // Your checkouts tab name
```

### Adding More Crews

The system supports 8 crews by default. To add more:
1. In `Scripts.html.txt`, find the `createCrewCards()` function
2. Change `for (let i = 1; i <= 8; i++)` to your desired number

### Category Mapping

If your categories in the sheet are named differently, update the `categoryClassMap` and `categoryPoolMap` objects in `code.gs.txt` (around line 65).

## Usage

### Daily Workflow

1. **Morning**: Click "Load Yesterday" to see what was checked out yesterday
2. **During Day**: Drag tools to crew cards as they're checked out
3. **Returns**: Click "Return" button when tools come back
4. **End of Day**: Click "Save" to ensure everything is saved

### Buttons

| Button | Action |
|--------|--------|
| Expand All | Show/hide individual tools in stacks |
| Add Tool | Add a new tool (temporary, add to sheet for permanent) |
| Return All | Return all checked out tools at once |
| Save | Save current state to localStorage backup |
| Save to History | Batch save all current checkouts to sheet |
| Load Yesterday | View yesterday's checkouts in a modal |
| View History | Browse checkouts by date |
| Clear | Reset all checkouts (clears today from sheet) |
| Print | Print-friendly view of current checkouts |

## Troubleshooting

### "Inventory sheet not found" Error
- Check that your sheet tab is named exactly "Inventory"
- Check the SPREADSHEET_ID is correct

### Tools not loading
- Verify the column headers match exactly: "Tool Name", "Category", "Quantity", "Available", "Status"
- Check that Status column contains "Active" (not empty)

### Checkouts not saving
- Make sure you've authorized the app
- Check the browser console for errors (F12 > Console)

### Drag and drop not working on mobile
- The app includes a mobile polyfill, but hold-to-drag (300ms) is required

## Theme

The app uses the "Deep Roots Operations" theme with:
- Forest green primary colors
- Earth/clay secondary tones
- Coffee/bark accent colors

Colors can be customized in `Styles.html.txt` CSS variables.

## License

Internal use - Deep Roots Operations

## Support

For issues or feature requests, contact the development team or create an issue in this repository.
