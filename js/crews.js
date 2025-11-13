/**
 * Crews Management Module
 * Handle crew cards and tool checkouts
 */

import { createElement, getById, clearElement, announceToScreenReader } from './dom.js';
import { returnTool } from './tools.js';
import CONFIG from './config.js';

/**
 * Create a single crew card
 */
export function createCrewCard(crewNumber) {
    const crewCard = createElement('div', {
        className: `crew-card`,
        dataset: {
            crew: String(crewNumber)
        },
        attributes: {
            role: 'region'
        },
        aria: {
            label: `Crew ${crewNumber} checkout area`
        }
    });

    // Crew header
    const crewHeader = createElement('div', {
        className: 'crew-header',
        textContent: `Crew ${crewNumber}`
    });
    crewCard.appendChild(crewHeader);

    // Crew body
    const crewBody = createElement('div', {
        className: 'crew-body'
    });

    // Crew section
    const crewSection = createElement('div', {
        className: 'crew-section'
    });

    const sectionTitle = createElement('div', {
        className: 'crew-section-title',
        textContent: 'Checked Out Tools'
    });
    crewSection.appendChild(sectionTitle);

    // Drop zone for tools
    const dropZone = createElement('div', {
        className: 'drop-zone',
        dataset: {
            crew: String(crewNumber)
        },
        attributes: {
            role: 'list'
        },
        aria: {
            label: `Drop zone for Crew ${crewNumber}. Drop tools here to check out.`,
            dropeffect: 'move'
        }
    });

    crewSection.appendChild(dropZone);
    crewBody.appendChild(crewSection);
    crewCard.appendChild(crewBody);

    return crewCard;
}

/**
 * Initialize all crew cards
 */
export function createCrewCards() {
    const crewsContainer = getById(CONFIG.ELEMENTS.CREWS_CONTAINER);
    if (!crewsContainer) {
        console.error('Crews container not found');
        return;
    }

    clearElement(crewsContainer);

    for (let i = 1; i <= CONFIG.CREW_COUNT; i++) {
        const crewCard = createCrewCard(i);
        crewsContainer.appendChild(crewCard);
    }

    announceToScreenReader(`${CONFIG.CREW_COUNT} crew checkout areas ready`);
}

/**
 * Create a checkout item display
 */
export function createCheckoutItem(tool, toolNumber, time, crewNumber) {
    const checkoutItem = createElement('div', {
        className: 'checkout-item',
        dataset: {
            originalTool: tool,
            toolNumber: toolNumber,
            checkoutTime: time,
            crew: crewNumber
        },
        attributes: {
            role: 'listitem'
        },
        aria: {
            label: `${tool} number ${toolNumber} checked out at ${time}`
        }
    });

    // Tool info container
    const toolInfo = createElement('span', {
        className: 'tool-info',
        textContent: `${tool} #${toolNumber} `
    });

    // Checkout time
    const timeSpan = createElement('span', {
        className: 'checkout-time',
        textContent: time
    });
    toolInfo.appendChild(timeSpan);

    // Return button
    const returnBtn = createElement('button', {
        className: 'return-btn',
        textContent: 'Return',
        attributes: {
            type: 'button'
        },
        aria: {
            label: `Return ${tool} number ${toolNumber}`
        }
    });

    // Handle return
    returnBtn.addEventListener('click', () => {
        handleReturnTool(returnBtn);
    });

    checkoutItem.appendChild(returnBtn);
    checkoutItem.appendChild(toolInfo);

    return checkoutItem;
}

/**
 * Handle returning a tool
 */
export function handleReturnTool(returnBtn) {
    const checkoutItem = returnBtn.closest('.checkout-item');
    if (!checkoutItem) return;

    const toolName = checkoutItem.dataset.originalTool;
    const toolNumber = checkoutItem.dataset.toolNumber;

    // Find the original tool element
    const originalTool = document.querySelector(
        `.draggable[data-tool-name="${toolName}"][data-tool-number="${toolNumber}"]`
    );

    if (returnTool(originalTool)) {
        checkoutItem.remove();
    }
}

/**
 * Check out a tool to a crew
 */
export function checkoutTool(toolElement, dropZone) {
    if (!toolElement || !dropZone) return false;

    const crewNumber = dropZone.dataset.crew;
    if (!crewNumber) return false;

    const time = new Date().toLocaleTimeString('en-US', CONFIG.TIME_FORMAT);

    // Create checkout display
    const checkoutItem = createCheckoutItem(
        toolElement.dataset.toolName,
        toolElement.dataset.toolNumber,
        time,
        crewNumber
    );

    // Hide original tool
    toolElement.classList.add('checked-out');
    toolElement.style.display = 'none';
    toolElement.dataset.checkoutTime = time;
    toolElement.dataset.crew = crewNumber;
    toolElement.setAttribute('aria-grabbed', 'true');

    // Add to drop zone
    dropZone.appendChild(checkoutItem);

    announceToScreenReader(
        `${toolElement.dataset.toolName} number ${toolElement.dataset.toolNumber} checked out to Crew ${crewNumber}`
    );

    return true;
}

/**
 * Move tool to broken pool
 */
export function markToolBroken(toolElement) {
    if (!toolElement) return false;

    const brokenPool = getById(CONFIG.POOL_IDS.broken);
    if (!brokenPool) return false;

    toolElement.classList.add('broken');
    toolElement.setAttribute('aria-label',
        `${toolElement.dataset.toolName} number ${toolElement.dataset.toolNumber}, marked as broken`
    );

    brokenPool.appendChild(toolElement);

    announceToScreenReader(
        `${toolElement.dataset.toolName} number ${toolElement.dataset.toolNumber} marked as broken`
    );

    return true;
}

/**
 * Remove broken status from tool
 */
export function unmarkToolBroken(toolElement) {
    if (!toolElement) return false;

    toolElement.classList.remove('broken');
    toolElement.setAttribute('aria-label',
        `${toolElement.dataset.toolName} number ${toolElement.dataset.toolNumber}, draggable tool`
    );

    announceToScreenReader(
        `${toolElement.dataset.toolName} number ${toolElement.dataset.toolNumber} returned to inventory`
    );

    return true;
}

/**
 * Load checkouts from saved data
 */
export function loadCheckouts(checkoutsData) {
    if (!checkoutsData || !Array.isArray(checkoutsData)) {
        return;
    }

    let loadedCount = 0;

    checkoutsData.forEach(({ crew, tools }) => {
        const dropZone = document.querySelector(`.drop-zone[data-crew="${crew}"]`);
        if (!dropZone) return;

        tools.forEach(({ tool, number, time }) => {
            // Find the original tool element
            const originalTool = document.querySelector(
                `.draggable[data-tool-name="${tool}"][data-tool-number="${number}"]`
            );

            if (originalTool && dropZone) {
                // Create checkout display
                const checkoutItem = createCheckoutItem(tool, number, time || 'N/A', crew);

                // Hide original tool
                originalTool.classList.add('checked-out');
                originalTool.style.display = 'none';
                originalTool.dataset.checkoutTime = time || '';
                originalTool.dataset.crew = crew;

                // Add to drop zone
                dropZone.appendChild(checkoutItem);

                // Update stack count if part of a stack
                const stack = originalTool.closest('.tool-stack');
                if (stack) {
                    const { updateStackCount } = require('./tools.js');
                    updateStackCount(stack);
                }

                loadedCount++;
            }
        });
    });

    if (loadedCount > 0) {
        announceToScreenReader(`Loaded ${loadedCount} tool checkouts from saved data`);
    }
}

/**
 * Clear all checkouts
 */
export function clearAllCheckouts() {
    const dropZones = document.querySelectorAll('.drop-zone[data-crew]');
    dropZones.forEach(zone => {
        clearElement(zone);
    });
}

export default {
    createCrewCard,
    createCrewCards,
    createCheckoutItem,
    handleReturnTool,
    checkoutTool,
    markToolBroken,
    unmarkToolBroken,
    loadCheckouts,
    clearAllCheckouts
};
