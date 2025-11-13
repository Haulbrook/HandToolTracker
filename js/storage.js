/**
 * Storage Module
 * Safe localStorage operations with error handling
 */

import CONFIG from './config.js';

/**
 * Storage class with error handling and validation
 */
class Storage {
    constructor() {
        this.isAvailable = this.checkAvailability();
    }

    /**
     * Check if localStorage is available
     * @returns {boolean}
     */
    checkAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage is not available:', e);
            return false;
        }
    }

    /**
     * Safely get item from localStorage
     * @param {string} key
     * @param {*} defaultValue
     * @returns {*}
     */
    getItem(key, defaultValue = null) {
        if (!this.isAvailable) {
            console.warn('localStorage not available, returning default');
            return defaultValue;
        }

        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading from localStorage (${key}):`, error);
            return defaultValue;
        }
    }

    /**
     * Safely set item in localStorage
     * @param {string} key
     * @param {*} value
     * @returns {boolean} - Success status
     */
    setItem(key, value) {
        if (!this.isAvailable) {
            console.warn('localStorage not available, cannot save');
            return false;
        }

        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('localStorage quota exceeded');
                this.handleQuotaExceeded();
            } else {
                console.error(`Error writing to localStorage (${key}):`, error);
            }
            return false;
        }
    }

    /**
     * Safely remove item from localStorage
     * @param {string} key
     * @returns {boolean}
     */
    removeItem(key) {
        if (!this.isAvailable) {
            return false;
        }

        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing from localStorage (${key}):`, error);
            return false;
        }
    }

    /**
     * Clear all localStorage
     * @returns {boolean}
     */
    clear() {
        if (!this.isAvailable) {
            return false;
        }

        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    /**
     * Handle quota exceeded error
     */
    handleQuotaExceeded() {
        console.warn('Attempting to clear old data to free up space...');
        // Could implement cleanup logic here
        // For now, just log the issue
    }

    /**
     * Get the current date string
     * @returns {string}
     */
    getCurrentDateString() {
        return new Date().toDateString();
    }

    /**
     * Check if stored data is from today
     * @returns {boolean}
     */
    isToday() {
        const savedDate = this.getItem(CONFIG.STORAGE_KEYS.DATE);
        return savedDate === this.getCurrentDateString();
    }

    /**
     * Save the complete schedule
     * @param {Object} scheduleData
     * @returns {boolean}
     */
    saveSchedule(scheduleData) {
        const success = this.setItem(CONFIG.STORAGE_KEYS.SCHEDULE, scheduleData);
        if (success) {
            this.setItem(CONFIG.STORAGE_KEYS.DATE, this.getCurrentDateString());
        }
        return success;
    }

    /**
     * Load the schedule
     * @returns {Object|null}
     */
    loadSchedule() {
        if (!this.isToday()) {
            console.log('No schedule from today');
            return null;
        }
        return this.getItem(CONFIG.STORAGE_KEYS.SCHEDULE);
    }

    /**
     * Save last update time
     * @param {string} timeString
     * @returns {boolean}
     */
    saveUpdateTime(timeString) {
        return this.setItem(CONFIG.STORAGE_KEYS.UPDATE_TIME, timeString);
    }

    /**
     * Load last update time
     * @returns {string|null}
     */
    loadUpdateTime() {
        return this.getItem(CONFIG.STORAGE_KEYS.UPDATE_TIME);
    }

    /**
     * Save tool inventory
     * @param {Object} inventory
     * @returns {boolean}
     */
    saveInventory(inventory) {
        return this.setItem(CONFIG.STORAGE_KEYS.INVENTORY, inventory);
    }

    /**
     * Load tool inventory
     * @returns {Object|null}
     */
    loadInventory() {
        return this.getItem(CONFIG.STORAGE_KEYS.INVENTORY);
    }

    /**
     * Get storage usage info (for debugging)
     * @returns {Object}
     */
    getStorageInfo() {
        if (!this.isAvailable) {
            return { available: false };
        }

        let totalSize = 0;
        const items = {};

        try {
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    const size = localStorage.getItem(key).length;
                    items[key] = size;
                    totalSize += size;
                }
            }

            return {
                available: true,
                totalSize,
                items,
                // Approximate limit (usually 5-10MB)
                estimatedLimit: 5 * 1024 * 1024,
                percentUsed: (totalSize / (5 * 1024 * 1024) * 100).toFixed(2)
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return { available: true, error: error.message };
        }
    }

    /**
     * Save schedule to history with specific date
     * @param {Object} scheduleData
     * @param {string} dateKey - Optional date key (YYYY-MM-DD), defaults to today
     * @returns {boolean}
     */
    saveToHistory(scheduleData, dateKey = null) {
        const key = dateKey || this.getDateKey();
        const historyKey = `toolHistory_${key}`;

        const historyEntry = {
            ...scheduleData,
            savedAt: new Date().toISOString(),
            dateKey: key
        };

        const success = this.setItem(historyKey, historyEntry);

        if (success) {
            // Update history index
            this.updateHistoryIndex(key);
        }

        return success;
    }

    /**
     * Get date key in YYYY-MM-DD format
     * @param {Date} date - Optional date object, defaults to today
     * @returns {string}
     */
    getDateKey(date = null) {
        const d = date || new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Get yesterday's date key
     * @returns {string}
     */
    getYesterdayKey() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return this.getDateKey(yesterday);
    }

    /**
     * Update history index with new date
     * @param {string} dateKey
     */
    updateHistoryIndex(dateKey) {
        const index = this.getItem('toolHistoryIndex', []);
        if (!index.includes(dateKey)) {
            index.unshift(dateKey); // Add to beginning
            // Keep only last 90 days of history
            if (index.length > 90) {
                const removed = index.splice(90);
                // Clean up old entries
                removed.forEach(key => {
                    this.removeItem(`toolHistory_${key}`);
                });
            }
            this.setItem('toolHistoryIndex', index);
        }
    }

    /**
     * Get all history dates
     * @returns {Array<string>} Array of date keys (YYYY-MM-DD)
     */
    getHistoryDates() {
        return this.getItem('toolHistoryIndex', []);
    }

    /**
     * Load schedule from history by date
     * @param {string} dateKey - Date key (YYYY-MM-DD)
     * @returns {Object|null}
     */
    loadFromHistory(dateKey) {
        const historyKey = `toolHistory_${dateKey}`;
        return this.getItem(historyKey);
    }

    /**
     * Load yesterday's schedule
     * @returns {Object|null}
     */
    loadYesterday() {
        const yesterdayKey = this.getYesterdayKey();
        return this.loadFromHistory(yesterdayKey);
    }

    /**
     * Get formatted date string from date key
     * @param {string} dateKey - Date key (YYYY-MM-DD)
     * @returns {string}
     */
    formatDateKey(dateKey) {
        const [year, month, day] = dateKey.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    /**
     * Delete a history entry
     * @param {string} dateKey
     * @returns {boolean}
     */
    deleteHistoryEntry(dateKey) {
        const historyKey = `toolHistory_${dateKey}`;
        const success = this.removeItem(historyKey);

        if (success) {
            // Remove from index
            const index = this.getItem('toolHistoryIndex', []);
            const newIndex = index.filter(key => key !== dateKey);
            this.setItem('toolHistoryIndex', newIndex);
        }

        return success;
    }

    /**
     * Get history summary
     * @returns {Array} Array of {dateKey, date, toolCount, crewCount}
     */
    getHistorySummary() {
        const dates = this.getHistoryDates();
        return dates.map(dateKey => {
            const entry = this.loadFromHistory(dateKey);
            if (!entry) return null;

            return {
                dateKey,
                formattedDate: this.formatDateKey(dateKey),
                savedAt: entry.savedAt,
                toolCount: entry.checkouts?.reduce((sum, crew) => sum + crew.tools.length, 0) || 0,
                crewCount: entry.checkouts?.length || 0,
                brokenCount: entry.broken?.length || 0
            };
        }).filter(Boolean);
    }
}

// Create singleton instance
const storage = new Storage();

export default storage;
