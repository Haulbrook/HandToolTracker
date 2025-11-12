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
}

// Create singleton instance
const storage = new Storage();

export default storage;
