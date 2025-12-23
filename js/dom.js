/**
 * DOM Utilities Module
 * Safe DOM manipulation without innerHTML vulnerabilities
 */

/**
 * Safely create an element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} options - Element options
 * @returns {HTMLElement}
 */
export function createElement(tag, options = {}) {
    const element = document.createElement(tag);

    // Set attributes
    if (options.className) {
        element.className = options.className;
    }

    if (options.id) {
        element.id = options.id;
    }

    if (options.textContent) {
        element.textContent = options.textContent;
    }

    if (options.draggable !== undefined) {
        element.draggable = options.draggable;
    }

    // Set data attributes
    if (options.dataset) {
        Object.entries(options.dataset).forEach(([key, value]) => {
            element.dataset[key] = value;
        });
    }

    // Set ARIA attributes
    if (options.aria) {
        Object.entries(options.aria).forEach(([key, value]) => {
            element.setAttribute(`aria-${key}`, value);
        });
    }

    // Set other attributes
    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }

    // Set styles
    if (options.style) {
        Object.entries(options.style).forEach(([key, value]) => {
            element.style[key] = value;
        });
    }

    // Add event listeners
    if (options.events) {
        Object.entries(options.events).forEach(([event, handler]) => {
            element.addEventListener(event, handler);
        });
    }

    // Append children
    if (options.children) {
        options.children.forEach(child => {
            if (child instanceof HTMLElement || child instanceof Text) {
                element.appendChild(child);
            } else if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            }
        });
    }

    return element;
}

/**
 * Create a text node
 * @param {string} text
 * @returns {Text}
 */
export function createTextNode(text) {
    return document.createTextNode(String(text));
}

/**
 * Safely clear all children from an element
 * @param {HTMLElement} element
 */
export function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Get element by ID with error handling
 * @param {string} id
 * @returns {HTMLElement|null}
 */
export function getById(id) {
    try {
        return document.getElementById(id);
    } catch (error) {
        console.error(`Error getting element by ID: ${id}`, error);
        return null;
    }
}

/**
 * Query selector with error handling
 * @param {string} selector
 * @param {HTMLElement} parent
 * @returns {HTMLElement|null}
 */
export function querySelector(selector, parent = document) {
    try {
        return parent.querySelector(selector);
    } catch (error) {
        console.error(`Error with querySelector: ${selector}`, error);
        return null;
    }
}

/**
 * Query selector all with error handling
 * @param {string} selector
 * @param {HTMLElement} parent
 * @returns {NodeList}
 */
export function querySelectorAll(selector, parent = document) {
    try {
        return parent.querySelectorAll(selector);
    } catch (error) {
        console.error(`Error with querySelectorAll: ${selector}`, error);
        return [];
    }
}

/**
 * Add class to element
 * @param {HTMLElement} element
 * @param {string|string[]} classes
 */
export function addClass(element, classes) {
    if (!element) return;
    const classList = Array.isArray(classes) ? classes : [classes];
    element.classList.add(...classList);
}

/**
 * Remove class from element
 * @param {HTMLElement} element
 * @param {string|string[]} classes
 */
export function removeClass(element, classes) {
    if (!element) return;
    const classList = Array.isArray(classes) ? classes : [classes];
    element.classList.remove(...classList);
}

/**
 * Toggle class on element
 * @param {HTMLElement} element
 * @param {string} className
 * @returns {boolean} - true if class is now present
 */
export function toggleClass(element, className) {
    if (!element) return false;
    return element.classList.toggle(className);
}

/**
 * Check if element has class
 * @param {HTMLElement} element
 * @param {string} className
 * @returns {boolean}
 */
export function hasClass(element, className) {
    if (!element) return false;
    return element.classList.contains(className);
}

/**
 * Set multiple attributes at once
 * @param {HTMLElement} element
 * @param {Object} attributes
 */
export function setAttributes(element, attributes) {
    if (!element) return;
    Object.entries(attributes).forEach(([key, value]) => {
        if (value === null || value === undefined) {
            element.removeAttribute(key);
        } else {
            element.setAttribute(key, value);
        }
    });
}

/**
 * Show an element (remove hidden attribute and display:none)
 * @param {HTMLElement} element
 */
export function showElement(element) {
    if (!element) return;
    element.removeAttribute('hidden');
    element.style.display = '';
    element.setAttribute('aria-hidden', 'false');
}

/**
 * Hide an element (add hidden attribute)
 * @param {HTMLElement} element
 */
export function hideElement(element) {
    if (!element) return;
    element.setAttribute('hidden', '');
    element.setAttribute('aria-hidden', 'true');
}

/**
 * Announce message to screen readers
 * @param {string} message
 */
export function announceToScreenReader(message) {
    const liveRegion = getById('ariaLiveRegion');
    if (liveRegion) {
        liveRegion.textContent = message;
        // Clear after a moment to allow for new announcements
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }
}

/**
 * Create and append an ARIA live region for announcements
 */
export function createAriaLiveRegion() {
    if (!getById('ariaLiveRegion')) {
        const liveRegion = createElement('div', {
            id: 'ariaLiveRegion',
            className: 'sr-only',
            aria: {
                live: 'polite',
                atomic: 'true'
            }
        });
        document.body.appendChild(liveRegion);
    }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Focus element with error handling
 * @param {HTMLElement} element
 */
export function focusElement(element) {
    if (!element) return;
    try {
        element.focus();
    } catch (error) {
        console.error('Error focusing element:', error);
    }
}

/**
 * Check if element is visible
 * @param {HTMLElement} element
 * @returns {boolean}
 */
export function isVisible(element) {
    if (!element) return false;
    return !!(
        element.offsetWidth ||
        element.offsetHeight ||
        element.getClientRects().length
    );
}

export default {
    createElement,
    createTextNode,
    clearElement,
    getById,
    querySelector,
    querySelectorAll,
    addClass,
    removeClass,
    toggleClass,
    hasClass,
    setAttributes,
    showElement,
    hideElement,
    announceToScreenReader,
    createAriaLiveRegion,
    escapeHtml,
    focusElement,
    isVisible
};
