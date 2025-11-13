/**
 * Main Application Module
 * Application initialization and coordination
 */

import CONFIG from './config.js';
import appState from './state.js';
import storage from './storage.js';
import {
    initializeInventory,
    returnAllTools,
    toggleExpandAll,
    getCheckoutData,
    getBrokenToolsData
} from './tools.js';
import { createCrewCards, loadCheckouts, clearAllCheckouts } from './crews.js';
import { setupDragEvents } from './drag.js';
import {
    initializeUI,
    updateLastModifiedTime,
    confirmDialog,
    showSaveFeedback,
    handlePrint,
    showAddModal,
    closeAddModal,
    handleAddNewTool,
    showNotification
} from './ui.js';
import { createAriaLiveRegion, announceToScreenReader } from './dom.js';

/**
 * Application class
 */
class ToolTrackerApp {
    constructor() {
        this.autoSaveInterval = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing Hand Tool Tracker...');

            // Create ARIA live region for accessibility
            createAriaLiveRegion();

            // Initialize UI
            initializeUI();

            // Initialize tool inventory
            initializeInventory();

            // Create crew cards
            createCrewCards();

            // Setup drag and drop
            setupDragEvents();

            // Setup button event listeners
            this.setupEventListeners();

            // Load saved data
            this.loadSchedule();

            // Start auto-save
            this.startAutoSave();

            console.log('Hand Tool Tracker initialized successfully');
            announceToScreenReader('Hand Tool Tracker application ready');
        } catch (error) {
            console.error('Error initializing application:', error);
            showNotification('error', 'Error initializing application. Please reload the page.');
        }
    }

    /**
     * Setup button event listeners
     */
    setupEventListeners() {
        // Save button
        const saveBtn = document.querySelector('.btn-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSchedule());
        }

        // Clear button
        const clearBtn = document.querySelector('.btn-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllCheckouts());
        }

        // Print button
        const printBtn = document.querySelector('.btn-print');
        if (printBtn) {
            printBtn.addEventListener('click', () => handlePrint());
        }

        // Add tool button
        const addBtn = document.querySelector('.btn-add');
        if (addBtn) {
            addBtn.addEventListener('click', () => showAddModal());
        }

        // Return all button
        const returnAllBtn = document.querySelector('.btn-return-all');
        if (returnAllBtn) {
            returnAllBtn.addEventListener('click', () => this.returnAllTools());
        }

        // Expand all button
        const expandBtn = document.querySelector('.btn-expand');
        if (expandBtn) {
            expandBtn.addEventListener('click', () => toggleExpandAll());
        }

        // Save to history button
        const saveHistoryBtn = document.querySelector('.btn-save-history');
        if (saveHistoryBtn) {
            saveHistoryBtn.addEventListener('click', () => this.saveToHistory());
        }

        // Load yesterday button
        const loadYesterdayBtn = document.querySelector('.btn-load-yesterday');
        if (loadYesterdayBtn) {
            loadYesterdayBtn.addEventListener('click', () => this.loadYesterday());
        }

        // View history button
        const viewHistoryBtn = document.querySelector('.btn-view-history');
        if (viewHistoryBtn) {
            viewHistoryBtn.addEventListener('click', () => this.showHistoryModal());
        }

        // Modal close button
        const closeModalBtn = document.querySelector('.close');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => closeAddModal());
        }

        // Modal cancel button
        const cancelBtn = document.querySelector('.modal-buttons button[onclick*="close"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => closeAddModal());
            cancelBtn.removeAttribute('onclick'); // Remove inline handler
        }

        // Modal add button
        const addToolBtn = document.querySelector('.modal-buttons button:not([onclick*="close"])');
        if (addToolBtn) {
            addToolBtn.addEventListener('click', () => handleAddNewTool());
            addToolBtn.removeAttribute('onclick'); // Remove inline handler
        }
    }

    /**
     * Save the current schedule
     */
    saveSchedule() {
        try {
            const scheduleData = {
                date: new Date().toISOString(),
                lastUpdate: new Date().toLocaleString(),
                inventory: appState.getInventory(),
                checkouts: getCheckoutData(),
                broken: getBrokenToolsData()
            };

            const success = storage.saveSchedule(scheduleData);

            // Also save to history automatically
            if (success) {
                storage.saveToHistory(scheduleData);
            }

            if (success) {
                updateLastModifiedTime();
                showSaveFeedback();
                announceToScreenReader('Schedule saved successfully');
            } else {
                showNotification('error', 'Failed to save schedule. Please try again.');
                announceToScreenReader('Failed to save schedule');
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            showNotification('error', 'Error saving schedule: ' + error.message);
        }
    }

    /**
     * Load the saved schedule
     */
    loadSchedule() {
        try {
            const schedule = storage.loadSchedule();

            if (!schedule) {
                console.log('No saved schedule for today');
                return;
            }

            // Automatically load today's data without prompting
            // Load inventory if saved
            if (schedule.inventory) {
                appState.setInventory(schedule.inventory);
                initializeInventory();
            }

            // Recreate crews (they were just initialized)
            createCrewCards();

            // Load checkouts
            if (schedule.checkouts && Array.isArray(schedule.checkouts)) {
                loadCheckouts(schedule.checkouts);
            }

            // Load broken tools
            if (schedule.broken && Array.isArray(schedule.broken)) {
                this.loadBrokenTools(schedule.broken);
            }

            // Re-setup drag events
            setupDragEvents();

            announceToScreenReader('Saved schedule loaded successfully');
            console.log('Schedule loaded successfully');
        } catch (error) {
            console.error('Error loading schedule:', error);
            showNotification('error', 'Error loading saved schedule: ' + error.message);
        }
    }

    /**
     * Load broken tools from saved data
     */
    loadBrokenTools(brokenData) {
        if (!brokenData || !Array.isArray(brokenData)) return;

        const brokenPool = document.getElementById('brokenPool');
        if (!brokenPool) return;

        brokenData.forEach(({ name, number }) => {
            const toolElement = document.querySelector(
                `.draggable[data-tool-name="${name}"][data-tool-number="${number}"]`
            );

            if (toolElement) {
                toolElement.classList.add('broken');
                brokenPool.appendChild(toolElement);
            }
        });
    }

    /**
     * Clear all checkouts and reset
     */
    clearAllCheckouts() {
        if (confirmDialog('Clear all tool checkouts and reset?')) {
            // Clear all checkout displays
            clearAllCheckouts();

            // Return all tools to pools
            returnAllTools();

            // Reinitialize
            initializeInventory();
            createCrewCards();
            setupDragEvents();

            updateLastModifiedTime();
            announceToScreenReader('All checkouts cleared and reset complete');
        }
    }

    /**
     * Return all tools
     */
    returnAllTools() {
        if (confirmDialog('Return all checked out tools?')) {
            const count = returnAllTools();
            updateLastModifiedTime();

            showNotification('success', `Returned ${count} tools to inventory`);
        }
    }

    /**
     * Start auto-save interval
     */
    startAutoSave() {
        // Clear any existing interval
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            this.saveSchedule();
        }, CONFIG.AUTO_SAVE_INTERVAL);

        console.log(`Auto-save enabled (every ${CONFIG.AUTO_SAVE_INTERVAL / 1000} seconds)`);
    }

    /**
     * Stop auto-save interval
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * Save current schedule to history
     */
    saveToHistory() {
        try {
            const scheduleData = {
                date: new Date().toISOString(),
                lastUpdate: new Date().toLocaleString(),
                inventory: appState.getInventory(),
                checkouts: getCheckoutData(),
                broken: getBrokenToolsData()
            };

            const dateKey = storage.getDateKey();
            const success = storage.saveToHistory(scheduleData, dateKey);

            if (success) {
                const formattedDate = storage.formatDateKey(dateKey);
                updateLastModifiedTime();
                showNotification('success', `Record saved to history: ${formattedDate}`);
                announceToScreenReader(`Schedule saved to history for ${formattedDate}`);
            } else {
                showNotification('error', 'Failed to save to history. Please try again.');
            }
        } catch (error) {
            console.error('Error saving to history:', error);
            showNotification('error', 'Error saving to history: ' + error.message);
        }
    }

    /**
     * Load yesterday's schedule
     */
    loadYesterday() {
        try {
            const yesterdayData = storage.loadYesterday();

            if (!yesterdayData) {
                const yesterdayKey = storage.getYesterdayKey();
                const formattedDate = storage.formatDateKey(yesterdayKey);
                showNotification('error', `No saved record found for yesterday (${formattedDate})`);
                return;
            }

            if (confirmDialog('Load yesterday\'s tool checkout records? This will replace current data.')) {
                this.loadHistoryData(yesterdayData);
                const yesterdayKey = storage.getYesterdayKey();
                const formattedDate = storage.formatDateKey(yesterdayKey);
                showNotification('success', `Loaded records from ${formattedDate}`);
            }
        } catch (error) {
            console.error('Error loading yesterday:', error);
            showNotification('error', 'Error loading yesterday\'s records: ' + error.message);
        }
    }

    /**
     * Load schedule data from history
     */
    loadHistoryData(historyData) {
        // Load inventory if saved
        if (historyData.inventory) {
            appState.setInventory(historyData.inventory);
            initializeInventory();
        }

        // Recreate crews
        createCrewCards();

        // Load checkouts
        if (historyData.checkouts && Array.isArray(historyData.checkouts)) {
            loadCheckouts(historyData.checkouts);
        }

        // Load broken tools
        if (historyData.broken && Array.isArray(historyData.broken)) {
            this.loadBrokenTools(historyData.broken);
        }

        // Re-setup drag events
        setupDragEvents();

        announceToScreenReader('Historical schedule loaded successfully');
    }

    /**
     * Show history modal (to be called from UI)
     */
    showHistoryModal() {
        // This will be implemented with the UI modal
        const summary = storage.getHistorySummary();

        if (summary.length === 0) {
            showNotification('error', 'No saved history records found');
            return;
        }

        // Create a simple list for now - can be enhanced with a full modal later
        const historyList = summary.map((entry, index) =>
            `${index + 1}. ${entry.formattedDate} - ${entry.toolCount} tools checked out to ${entry.crewCount} crews`
        ).join('\n');

        const selection = prompt(`Select a date to load (enter number 1-${summary.length}):\n\n${historyList}`);

        if (selection) {
            const index = parseInt(selection, 10) - 1;
            if (index >= 0 && index < summary.length) {
                const selectedEntry = summary[index];
                this.loadHistoryByDate(selectedEntry.dateKey);
            } else {
                showNotification('error', 'Invalid selection');
            }
        }
    }

    /**
     * Load history by specific date
     */
    loadHistoryByDate(dateKey) {
        try {
            const historyData = storage.loadFromHistory(dateKey);

            if (!historyData) {
                showNotification('error', 'History record not found');
                return;
            }

            const formattedDate = storage.formatDateKey(dateKey);

            if (confirmDialog(`Load records from ${formattedDate}? This will replace current data.`)) {
                this.loadHistoryData(historyData);
                showNotification('success', `Loaded records from ${formattedDate}`);
            }
        } catch (error) {
            console.error('Error loading history:', error);
            showNotification('error', 'Error loading history: ' + error.message);
        }
    }

    /**
     * Cleanup on page unload
     */
    cleanup() {
        this.stopAutoSave();
        // Could add more cleanup here if needed
    }
}

// Create app instance
const app = new ToolTrackerApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    // DOM already loaded
    app.init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    app.cleanup();
});

// Export for debugging/testing
window.ToolTrackerApp = app;

// Enable iOS drag-drop polyfill if available
if (window.MobileDragDrop) {
    MobileDragDrop.polyfill({
        dragImageTranslateOverride: MobileDragDrop.scrollBehaviourDragImageTranslateOverride
    });
    console.log('Mobile drag-drop polyfill enabled');
}

export default app;
