/**
 * Drag and Drop Module
 * Handle drag-and-drop and touch interactions for tools
 */

import { querySelectorAll, addClass, removeClass } from './dom.js';
import { checkoutTool, markToolBroken, unmarkToolBroken } from './crews.js';
import { updateStackCount } from './tools.js';
import { updateLastModifiedTime } from './ui.js';
import appState from './state.js';

// Touch state
let touchItem = null;
let touchOffset = { x: 0, y: 0 };
let touchClone = null;

// Track if global events have been set up (only do once)
let globalEventsSetup = false;

/**
 * Setup drag and drop events for all draggable elements
 */
export function setupDragEvents() {
    const draggables = querySelectorAll('.draggable');

    draggables.forEach(element => {
        // Desktop drag events
        element.addEventListener('dragstart', handleDragStart);
        element.addEventListener('dragend', handleDragEnd);

        // Touch events for mobile/iPad
        element.addEventListener('touchstart', handleTouchStart, { passive: false });
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd, { passive: false });

        // Keyboard accessibility
        element.addEventListener('keydown', handleKeyDown);
    });

    // Setup global drop events only once
    if (!globalEventsSetup) {
        setupGlobalDropEvents();
        globalEventsSetup = true;
    }
}

/**
 * Handle drag start (desktop)
 */
function handleDragStart(e) {
    const target = e.target;

    // Don't allow dragging stack labels
    if (!target.classList.contains('draggable') || target.classList.contains('stack-label')) {
        e.preventDefault();
        return;
    }

    // Don't allow dragging checked-out tools from within drop zones
    if (target.classList.contains('checked-out')) {
        e.preventDefault();
        return;
    }

    appState.setDraggedElement(target);
    addClass(target, 'dragging');
    target.setAttribute('aria-grabbed', 'true');

    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', target.dataset.toolName);
    }
}

/**
 * Handle drag end (desktop)
 */
function handleDragEnd(e) {
    const target = e.target;

    if (target.classList.contains('draggable')) {
        removeClass(target, 'dragging');
        target.setAttribute('aria-grabbed', 'false');
    }

    appState.clearDraggedElement();
}

/**
 * Handle touch start (mobile/tablet)
 */
function handleTouchStart(e) {
    const target = e.target;

    // Don't allow dragging stack labels or checked-out tools
    if (!target.classList.contains('draggable') ||
        target.classList.contains('stack-label') ||
        target.classList.contains('checked-out')) {
        return;
    }

    touchItem = target;
    appState.setDraggedElement(target);

    const touch = e.touches[0];
    const rect = target.getBoundingClientRect();
    touchOffset.x = touch.clientX - rect.left;
    touchOffset.y = touch.clientY - rect.top;

    // Create a visual clone for dragging
    touchClone = target.cloneNode(true);
    touchClone.style.position = 'fixed';
    touchClone.style.zIndex = '9999';
    touchClone.style.opacity = '0.5';
    touchClone.style.pointerEvents = 'none';
    touchClone.style.left = `${touch.clientX - touchOffset.x}px`;
    touchClone.style.top = `${touch.clientY - touchOffset.y}px`;
    document.body.appendChild(touchClone);

    addClass(target, 'dragging');
    target.setAttribute('aria-grabbed', 'true');

    e.preventDefault();
}

/**
 * Handle touch move (mobile/tablet)
 */
function handleTouchMove(e) {
    if (!touchItem || !touchClone) return;

    const touch = e.touches[0];

    // Move the clone
    touchClone.style.left = `${touch.clientX - touchOffset.x}px`;
    touchClone.style.top = `${touch.clientY - touchOffset.y}px`;

    // Highlight drop zones under finger
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = elementBelow?.closest('.drop-zone') || elementBelow?.closest('.resource-items');

    // Remove previous highlights
    querySelectorAll('.drag-over').forEach(el => removeClass(el, 'drag-over'));

    // Add highlight to current drop zone
    if (dropZone) {
        addClass(dropZone, 'drag-over');
    }

    e.preventDefault();
}

/**
 * Handle touch end (mobile/tablet)
 */
function handleTouchEnd(e) {
    if (!touchItem) return;

    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = elementBelow?.closest('.drop-zone') || elementBelow?.closest('.resource-items');

    const draggedElement = appState.getDraggedElement();

    if (dropZone && draggedElement) {
        removeClass(dropZone, 'drag-over');
        handleDrop(draggedElement, dropZone);
    }

    // Cleanup
    if (touchClone) {
        touchClone.remove();
        touchClone = null;
    }

    if (touchItem) {
        removeClass(touchItem, 'dragging');
        touchItem.setAttribute('aria-grabbed', 'false');
        touchItem = null;
    }

    appState.clearDraggedElement();
    querySelectorAll('.drag-over').forEach(el => removeClass(el, 'drag-over'));

    e.preventDefault();
}

/**
 * Handle keyboard navigation for accessibility
 */
function handleKeyDown(e) {
    const target = e.target;

    // Enter or Space to "pick up" tool
    if (e.key === 'Enter' || e.key === ' ') {
        if (!target.classList.contains('stack-label')) {
            e.preventDefault();
            // Future enhancement: implement keyboard-based drag-and-drop
            // For now, tools can be focused and navigated with Tab
        }
    }
}

/**
 * Setup global drop event listeners
 */
function setupGlobalDropEvents() {
    // Drag over
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
    });

    // Drag enter
    document.addEventListener('dragenter', (e) => {
        const target = e.target;
        if (target.classList.contains('drop-zone') || target.classList.contains('resource-items')) {
            addClass(target, 'drag-over');
        }
    });

    // Drag leave
    document.addEventListener('dragleave', (e) => {
        const target = e.target;
        if (target.classList.contains('drop-zone') || target.classList.contains('resource-items')) {
            removeClass(target, 'drag-over');
        }
    });

    // Drop
    document.addEventListener('drop', (e) => {
        e.preventDefault();

        let dropZone = e.target;

        if (!dropZone.classList.contains('drop-zone') && !dropZone.classList.contains('resource-items')) {
            dropZone = e.target.closest('.drop-zone') || e.target.closest('.resource-items');
        }

        const draggedElement = appState.getDraggedElement();

        if (dropZone && draggedElement) {
            removeClass(dropZone, 'drag-over');
            handleDrop(draggedElement, dropZone);
        }
    });
}

/**
 * Handle the drop action
 */
function handleDrop(draggedElement, dropZone) {
    if (!draggedElement || !dropZone) return;

    console.log('Drop detected:', {
        tool: draggedElement.dataset.toolName,
        targetZone: dropZone.id || dropZone.className,
        crew: dropZone.dataset.crew
    });

    // Check out to a crew
    if (dropZone.dataset.crew) {
        const success = checkoutTool(draggedElement, dropZone);

        if (success) {
            console.log('Tool checked out successfully');
            // Update stack count if part of a stack
            const stack = draggedElement.closest('.tool-stack');
            if (stack) {
                updateStackCount(stack);
            }
            updateLastModifiedTime();
        }
    }
    // Move to broken pool
    else if (dropZone.id === 'brokenPool') {
        markToolBroken(draggedElement);
        updateLastModifiedTime();
    }
    // Return to a resource pool
    else if (dropZone.classList.contains('resource-items')) {
        // Remove broken status if moving from broken pool
        if (draggedElement.classList.contains('broken')) {
            unmarkToolBroken(draggedElement);
        }

        dropZone.appendChild(draggedElement);

        // Update stack if applicable
        const stack = draggedElement.closest('.tool-stack');
        if (stack) {
            updateStackCount(stack);
        }
        updateLastModifiedTime();
    }
}

/**
 * Remove all drag event listeners (for cleanup)
 */
export function removeDragEvents() {
    const draggables = querySelectorAll('.draggable');

    draggables.forEach(element => {
        element.removeEventListener('dragstart', handleDragStart);
        element.removeEventListener('dragend', handleDragEnd);
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
        element.removeEventListener('keydown', handleKeyDown);
    });

    // Note: We don't remove global events as they're document-level
    // and should persist throughout the app lifecycle
}

export default {
    setupDragEvents,
    removeDragEvents
};
