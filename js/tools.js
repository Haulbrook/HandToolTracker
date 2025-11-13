/**
 * Tools Management Module
 * Handle tool creation, stacking, and inventory management
 */

import { createElement, getById, querySelectorAll, announceToScreenReader, clearElement } from './dom.js';
import CONFIG from './config.js';
import appState from './state.js';

/**
 * Create a single draggable tool element
 */
export function createToolElement(tool, toolNumber) {
    const toolDiv = createElement('div', {
        className: `draggable ${tool.class}`,
        draggable: true,
        textContent: `${tool.name} #${toolNumber}`,
        dataset: {
            toolName: tool.name,
            toolNumber: String(toolNumber),
            toolClass: tool.class
        },
        attributes: {
            role: 'button',
            tabindex: '0'
        },
        aria: {
            label: `${tool.name} number ${toolNumber}, draggable tool`,
            grabbed: 'false'
        }
    });

    return toolDiv;
}

/**
 * Create a tool stack for multiple quantity tools
 */
export function createToolStack(tool, poolId) {
    const pool = getById(poolId);
    if (!pool) {
        console.error(`Pool not found: ${poolId}`);
        return;
    }

    if (tool.qty === 1) {
        // Single tool, no stack needed
        const toolDiv = createToolElement(tool, 1);
        pool.appendChild(toolDiv);
    } else {
        // Create stack for multiple tools
        const stackDiv = createElement('div', {
            className: 'tool-stack',
            dataset: {
                toolName: tool.name
            },
            attributes: {
                role: 'group',
                tabindex: '0'
            },
            aria: {
                label: `${tool.name} stack, ${tool.qty} tools available. Press Enter to expand.`
            }
        });

        // Stack label (shows when collapsed)
        const stackLabel = createElement('div', {
            className: `draggable ${tool.class} stack-label`,
            draggable: false,
            textContent: tool.name,
            dataset: {
                toolName: tool.name
            }
        });

        // Stack count badge
        const countBadge = createElement('span', {
            className: 'stack-count',
            textContent: String(tool.qty),
            aria: {
                label: `${tool.qty} available`
            }
        });

        stackLabel.appendChild(countBadge);
        stackDiv.appendChild(stackLabel);

        // Individual tool items (hidden by default)
        for (let i = 1; i <= tool.qty; i++) {
            const toolDiv = createToolElement(tool, i);
            toolDiv.classList.add('tool-item');
            stackDiv.appendChild(toolDiv);
        }

        // Toggle stack expansion
        const toggleStack = (e) => {
            // Don't toggle if clicking on an individual tool item
            if (e.target.classList.contains('tool-item') || e.target.closest('.tool-item')) {
                console.log('Clicked on tool item, not toggling stack');
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            const isExpanded = stackDiv.classList.toggle('expanded');
            appState.toggleStack(tool.name);

            console.log(`Stack "${tool.name}" ${isExpanded ? 'expanded' : 'collapsed'}, showing ${tool.qty} items`);

            // Update ARIA
            stackDiv.setAttribute('aria-label',
                isExpanded
                    ? `${tool.name} stack expanded, ${tool.qty} tools shown. Press Enter to collapse.`
                    : `${tool.name} stack collapsed, ${tool.qty} tools available. Press Enter to expand.`
            );

            updateStackCount(stackDiv);
            announceToScreenReader(
                isExpanded
                    ? `${tool.name} stack expanded`
                    : `${tool.name} stack collapsed`
            );
        };

        // Add both click and keyboard support
        stackDiv.addEventListener('click', toggleStack);
        stackDiv.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                toggleStack(e);
            }
        });

        // Touch support for iOS
        stackDiv.addEventListener('touchend', (e) => {
            if (!e.target.closest('.tool-item')) {
                toggleStack(e);
            }
        });

        pool.appendChild(stackDiv);
    }
}

/**
 * Update the count badge on a tool stack
 */
export function updateStackCount(stackDiv) {
    const availableCount = stackDiv.querySelectorAll('.tool-item:not(.checked-out)').length;
    const countBadge = stackDiv.querySelector('.stack-count');

    if (countBadge) {
        countBadge.textContent = String(availableCount);
        countBadge.setAttribute('aria-label', `${availableCount} available`);

        if (availableCount === 0) {
            stackDiv.style.display = 'none';
            announceToScreenReader(`All tools from ${stackDiv.dataset.toolName} have been checked out`);
        } else {
            stackDiv.style.display = '';
        }
    }
}

/**
 * Initialize all tool inventory in the UI
 */
export function initializeInventory() {
    const inventory = appState.getInventory();
    const poolIds = Object.values(CONFIG.POOL_IDS);

    // Clear all pools first
    poolIds.forEach(poolId => {
        const pool = getById(poolId);
        if (pool && poolId !== 'brokenPool') {
            clearElement(pool);
        }
    });

    // Create tool stacks for each category
    Object.entries(inventory).forEach(([category, tools]) => {
        const poolId = CONFIG.POOL_IDS[category];
        if (!poolId) {
            console.warn(`No pool ID found for category: ${category}`);
            return;
        }

        tools.forEach(tool => {
            createToolStack(tool, poolId);
        });
    });

    announceToScreenReader('Tool inventory loaded');
}

/**
 * Validate tool data
 */
export function validateTool(name, quantity) {
    const errors = [];

    // Validate name
    if (!name || name.trim().length < CONFIG.VALIDATION.MIN_TOOL_NAME_LENGTH) {
        errors.push('Tool name is required');
    } else if (name.length > CONFIG.VALIDATION.MAX_TOOL_NAME_LENGTH) {
        errors.push(`Tool name must be less than ${CONFIG.VALIDATION.MAX_TOOL_NAME_LENGTH} characters`);
    }

    // Validate quantity
    const qty = parseInt(quantity, 10);
    if (isNaN(qty)) {
        errors.push('Quantity must be a number');
    } else if (qty < CONFIG.VALIDATION.MIN_QUANTITY) {
        errors.push(`Quantity must be at least ${CONFIG.VALIDATION.MIN_QUANTITY}`);
    } else if (qty > CONFIG.VALIDATION.MAX_QUANTITY) {
        errors.push(`Quantity cannot exceed ${CONFIG.VALIDATION.MAX_QUANTITY}`);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Add a new tool to the inventory
 */
export function addTool(name, category, quantity) {
    const validation = validateTool(name, quantity);

    if (!validation.valid) {
        return {
            success: false,
            errors: validation.errors
        };
    }

    const qty = parseInt(quantity, 10);
    const toolClass = CONFIG.CATEGORY_CLASSES[category] || 'misc';

    const newTool = {
        name: name.trim(),
        qty: qty,
        class: toolClass
    };

    // Add to state
    appState.addTool(category, newTool);

    // Add to UI
    const poolId = CONFIG.POOL_IDS[category];
    if (poolId) {
        createToolStack(newTool, poolId);
    }

    announceToScreenReader(`Added ${qty} ${name} to inventory`);

    return {
        success: true,
        tool: newTool
    };
}

/**
 * Return a tool to its original pool
 */
export function returnTool(toolElement) {
    if (!toolElement) return false;

    const toolName = toolElement.dataset.toolName;
    const toolNumber = toolElement.dataset.toolNumber;

    // Find the original tool element
    const originalTool = document.querySelector(
        `.draggable[data-tool-name="${toolName}"][data-tool-number="${toolNumber}"]`
    );

    if (originalTool) {
        originalTool.classList.remove('checked-out');
        originalTool.style.display = '';
        originalTool.removeAttribute('aria-grabbed');
        delete originalTool.dataset.checkoutTime;
        delete originalTool.dataset.crew;

        // Update stack count if part of a stack
        const stack = originalTool.closest('.tool-stack');
        if (stack) {
            updateStackCount(stack);
        }

        announceToScreenReader(`${toolName} #${toolNumber} returned`);
        return true;
    }

    return false;
}

/**
 * Return all checked out tools
 */
export function returnAllTools() {
    const checkedOutTools = querySelectorAll('.draggable.checked-out');
    let count = 0;

    checkedOutTools.forEach(tool => {
        if (returnTool(tool)) {
            count++;
        }
    });

    // Clear all crew drop zones
    const dropZones = querySelectorAll('.drop-zone[data-crew]');
    dropZones.forEach(zone => {
        clearElement(zone);
    });

    announceToScreenReader(`Returned ${count} tools to inventory`);
    return count;
}

/**
 * Toggle expand/collapse all tool stacks
 */
export function toggleExpandAll() {
    const stacks = querySelectorAll('.tool-stack');
    const shouldExpand = !document.querySelector('.tool-stack.expanded');

    const allToolNames = Array.from(stacks).map(stack => stack.dataset.toolName);

    if (shouldExpand) {
        stacks.forEach(stack => stack.classList.add('expanded'));
        appState.expandAllStacks(allToolNames);
        announceToScreenReader('All tool stacks expanded');
    } else {
        stacks.forEach(stack => stack.classList.remove('expanded'));
        appState.collapseAllStacks();
        announceToScreenReader('All tool stacks collapsed');
    }
}

/**
 * Get all checked out tools data
 */
export function getCheckoutData() {
    const checkouts = [];
    const dropZones = querySelectorAll('.drop-zone[data-crew]');

    dropZones.forEach(zone => {
        const crew = zone.dataset.crew;
        const items = Array.from(zone.children);

        if (items.length > 0) {
            const tools = items.map(item => ({
                tool: item.dataset.originalTool,
                number: item.dataset.toolNumber,
                crew: crew,
                time: item.dataset.checkoutTime || ''
            }));

            checkouts.push({ crew, tools });
        }
    });

    return checkouts;
}

/**
 * Get all broken tools data
 */
export function getBrokenToolsData() {
    const brokenPool = getById('brokenPool');
    if (!brokenPool) return [];

    const brokenTools = querySelectorAll('.draggable', brokenPool);
    return Array.from(brokenTools).map(el => ({
        name: el.dataset.toolName,
        number: el.dataset.toolNumber
    }));
}

export default {
    createToolElement,
    createToolStack,
    updateStackCount,
    initializeInventory,
    validateTool,
    addTool,
    returnTool,
    returnAllTools,
    toggleExpandAll,
    getCheckoutData,
    getBrokenToolsData
};
