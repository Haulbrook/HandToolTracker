/**
 * UI Module
 * Handle user interface interactions, modals, and display updates
 */

import { getById, setAttributes, focusElement, announceToScreenReader } from './dom.js';
import { addTool } from './tools.js';
import { setupDragEvents } from './drag.js';
import CONFIG from './config.js';
import storage from './storage.js';
import appState from './state.js';

/**
 * Update the current date display
 */
export function updateCurrentDate() {
    const dateElement = getById(CONFIG.ELEMENTS.CURRENT_DATE);
    if (!dateElement) return;

    const dateString = new Date().toLocaleDateString('en-US', CONFIG.DATE_FORMAT);
    dateElement.textContent = dateString;
}

/**
 * Update the last modified time display
 */
export function updateLastModifiedTime() {
    const now = new Date();
    const timeString = now.toLocaleString('en-US', CONFIG.DATETIME_FORMAT);

    const updateTimeElement = getById(CONFIG.ELEMENTS.UPDATE_TIME);
    if (updateTimeElement) {
        updateTimeElement.textContent = `Last Updated: ${timeString}`;
    }

    // Save to storage
    storage.saveUpdateTime(timeString);
    appState.setLastUpdateTime(timeString);
}

/**
 * Load and display the last update time
 */
export function loadLastUpdateTime() {
    const savedTime = storage.loadUpdateTime();
    const updateTimeElement = getById(CONFIG.ELEMENTS.UPDATE_TIME);

    if (updateTimeElement) {
        if (savedTime) {
            updateTimeElement.textContent = `Last Updated: ${savedTime}`;
        } else {
            updateTimeElement.textContent = 'Last Updated: Never';
        }
    }
}

/**
 * Show the add tool modal
 */
export function showAddModal() {
    const modal = getById(CONFIG.ELEMENTS.ADD_MODAL);
    if (!modal) return;

    setAttributes(modal, {
        'aria-hidden': 'false'
    });
    modal.style.display = 'flex';

    // Focus on the tool name input
    const toolNameInput = getById(CONFIG.ELEMENTS.TOOL_NAME_INPUT);
    if (toolNameInput) {
        // Small delay to ensure modal is visible
        setTimeout(() => focusElement(toolNameInput), 100);
    }

    announceToScreenReader('Add new tool dialog opened');
}

/**
 * Close the add tool modal
 */
export function closeAddModal() {
    const modal = getById(CONFIG.ELEMENTS.ADD_MODAL);
    if (!modal) return;

    setAttributes(modal, {
        'aria-hidden': 'true'
    });
    modal.style.display = 'none';

    // Clear form
    const toolNameInput = getById(CONFIG.ELEMENTS.TOOL_NAME_INPUT);
    const quantityInput = getById(CONFIG.ELEMENTS.TOOL_QUANTITY_INPUT);

    if (toolNameInput) toolNameInput.value = '';
    if (quantityInput) quantityInput.value = '1';

    announceToScreenReader('Add new tool dialog closed');
}

/**
 * Handle adding a new tool from the modal
 */
export function handleAddNewTool() {
    const nameInput = getById(CONFIG.ELEMENTS.TOOL_NAME_INPUT);
    const categorySelect = getById(CONFIG.ELEMENTS.TOOL_CATEGORY_SELECT);
    const quantityInput = getById(CONFIG.ELEMENTS.TOOL_QUANTITY_INPUT);

    if (!nameInput || !categorySelect || !quantityInput) {
        console.error('Modal form elements not found');
        return;
    }

    const name = nameInput.value.trim();
    const category = categorySelect.value;
    const quantity = parseInt(quantityInput.value, 10);

    const result = addTool(name, category, quantity);

    if (result.success) {
        setupDragEvents(); // Setup drag events for new tool
        updateLastModifiedTime();
        closeAddModal();

        // Show success feedback
        showNotification('success', `Added ${quantity} ${name} to inventory`);
    } else {
        // Show errors
        const errorMessage = result.errors.join(', ');
        showNotification('error', errorMessage);
        announceToScreenReader(errorMessage);
    }
}

/**
 * Show a notification message
 */
export function showNotification(type, message) {
    // Create or get notification container
    let container = getById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = type === 'success' ? 'success-message' : 'error-message';
    notification.textContent = message;
    notification.style.cssText = `
        margin-bottom: 10px;
        animation: slideIn 0.3s ease;
    `;

    container.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Show visual feedback for save button
 */
export function showSaveFeedback() {
    const saveBtn = document.querySelector('.btn-save');
    if (!saveBtn) return;

    const originalText = saveBtn.textContent;
    const originalBg = saveBtn.style.background;

    saveBtn.textContent = '✓ Saved!';
    saveBtn.style.background = '#4A9D7E';

    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = originalBg || '';
    }, 2000);
}

/**
 * Confirm dialog wrapper
 */
export function confirmDialog(message) {
    return confirm(message);
}

/**
 * Alert dialog wrapper
 */
export function alertDialog(message) {
    alert(message);
}

/**
 * Handle print
 */
export function handlePrint() {
    window.print();
    announceToScreenReader('Print dialog opened');
}

/**
 * Setup modal keyboard navigation
 */
export function setupModalKeyboard() {
    const modal = getById(CONFIG.ELEMENTS.ADD_MODAL);
    if (!modal) return;

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
            closeAddModal();
        }
    });

    // Handle Enter in form inputs
    const toolNameInput = getById(CONFIG.ELEMENTS.TOOL_NAME_INPUT);
    const quantityInput = getById(CONFIG.ELEMENTS.TOOL_QUANTITY_INPUT);

    [toolNameInput, quantityInput].forEach(input => {
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewTool();
                }
            });
        }
    });
}

/**
 * Setup modal click-outside to close
 */
export function setupModalClickOutside() {
    const modal = getById(CONFIG.ELEMENTS.ADD_MODAL);
    if (!modal) return;

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAddModal();
        }
    });
}

/**
 * Initialize UI event listeners
 */
export function initializeUI() {
    updateCurrentDate();
    loadLastUpdateTime();
    setupModalKeyboard();
    setupModalClickOutside();
}

export default {
    updateCurrentDate,
    updateLastModifiedTime,
    loadLastUpdateTime,
    showAddModal,
    closeAddModal,
    handleAddNewTool,
    showNotification,
    showSaveFeedback,
    confirmDialog,
    alertDialog,
    handlePrint,
    initializeUI
};
