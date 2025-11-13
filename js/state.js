/**
 * State Management Module
 * Centralized application state with immutable updates
 */

import { DEFAULT_TOOL_INVENTORY } from './config.js';

/**
 * Application State
 */
class AppState {
    constructor() {
        this.state = {
            toolInventory: this.deepClone(DEFAULT_TOOL_INVENTORY),
            expandedStacks: new Set(),
            draggedElement: null,
            lastUpdateTime: null
        };
        this.listeners = new Set();
    }

    /**
     * Deep clone an object to ensure immutability
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Get current state (returns a copy to prevent mutation)
     */
    getState() {
        return {
            ...this.state,
            toolInventory: this.deepClone(this.state.toolInventory),
            expandedStacks: new Set(this.state.expandedStacks)
        };
    }

    /**
     * Update state immutably
     */
    setState(updates) {
        this.state = {
            ...this.state,
            ...updates
        };
        this.notifyListeners();
    }

    /**
     * Get tool inventory
     */
    getInventory() {
        return this.deepClone(this.state.toolInventory);
    }

    /**
     * Update tool inventory
     */
    setInventory(inventory) {
        this.setState({
            toolInventory: this.deepClone(inventory)
        });
    }

    /**
     * Add a new tool to inventory
     */
    addTool(category, tool) {
        const inventory = this.deepClone(this.state.toolInventory);
        if (!inventory[category]) {
            inventory[category] = [];
        }
        inventory[category].push(tool);
        this.setInventory(inventory);
    }

    /**
     * Get expanded stacks
     */
    getExpandedStacks() {
        return new Set(this.state.expandedStacks);
    }

    /**
     * Toggle stack expansion
     */
    toggleStack(toolName) {
        const expandedStacks = new Set(this.state.expandedStacks);
        if (expandedStacks.has(toolName)) {
            expandedStacks.delete(toolName);
        } else {
            expandedStacks.add(toolName);
        }
        this.setState({ expandedStacks });
    }

    /**
     * Expand all stacks
     */
    expandAllStacks(toolNames) {
        this.setState({
            expandedStacks: new Set(toolNames)
        });
    }

    /**
     * Collapse all stacks
     */
    collapseAllStacks() {
        this.setState({
            expandedStacks: new Set()
        });
    }

    /**
     * Set dragged element
     */
    setDraggedElement(element) {
        this.setState({ draggedElement: element });
    }

    /**
     * Get dragged element
     */
    getDraggedElement() {
        return this.state.draggedElement;
    }

    /**
     * Clear dragged element
     */
    clearDraggedElement() {
        this.setState({ draggedElement: null });
    }

    /**
     * Set last update time
     */
    setLastUpdateTime(time) {
        this.setState({ lastUpdateTime: time });
    }

    /**
     * Get last update time
     */
    getLastUpdateTime() {
        return this.state.lastUpdateTime;
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners of state change
     */
    notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.getState());
            } catch (error) {
                console.error('Error in state listener:', error);
            }
        });
    }

    /**
     * Reset state to defaults
     */
    reset() {
        this.state = {
            toolInventory: this.deepClone(DEFAULT_TOOL_INVENTORY),
            expandedStacks: new Set(),
            draggedElement: null,
            lastUpdateTime: null
        };
        this.notifyListeners();
    }
}

// Create singleton instance
const appState = new AppState();

export default appState;
