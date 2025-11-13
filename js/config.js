/**
 * Configuration Module
 * Centralized configuration and constants
 */

export const CONFIG = {
    // Business Rules
    CREW_COUNT: 8,
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds

    // Storage Keys
    STORAGE_KEYS: {
        SCHEDULE: 'toolCheckoutSchedule',
        DATE: 'toolCheckoutDate',
        UPDATE_TIME: 'toolLastUpdateTime',
        INVENTORY: 'toolInventory'
    },

    // Tool Categories
    CATEGORIES: {
        HAMMERS: 'hammers',
        DRIVERS: 'drivers',
        MEASURING: 'measuring',
        CUTTING: 'cutting',
        PLIERS: 'pliers',
        BATTERIES: 'batteries',
        POWER: 'power',
        SAFETY: 'safety',
        MISC: 'misc'
    },

    // Category Display Names
    CATEGORY_LABELS: {
        hammers: '🔨 Hammers & Impact',
        drivers: '🔧 Drivers & Bits',
        measuring: '📐 Measuring & Layout',
        cutting: '✂️ Cutting Tools',
        pliers: '🔗 Pliers & Wrenches',
        batteries: '🔋 Batteries & Chargers',
        power: '⚡ Power Tools',
        safety: '🦺 Safety Equipment',
        misc: '📦 Miscellaneous'
    },

    // Category to CSS Class Mapping
    CATEGORY_CLASSES: {
        hammers: 'hammer',
        drivers: 'screwdriver',
        measuring: 'measuring',
        cutting: 'cutting',
        pliers: 'pliers',
        batteries: 'battery',
        power: 'power-tool',
        safety: 'safety',
        misc: 'misc'
    },

    // Pool IDs
    POOL_IDS: {
        hammers: 'hammersPool',
        drivers: 'driversPool',
        measuring: 'measuringPool',
        cutting: 'cuttingPool',
        pliers: 'pliersPool',
        batteries: 'batteriesPool',
        power: 'powerPool',
        safety: 'safetyPool',
        misc: 'miscPool',
        broken: 'brokenPool'
    },

    // DOM Element IDs
    ELEMENTS: {
        CURRENT_DATE: 'currentDate',
        UPDATE_TIME: 'updateTime',
        CREWS_CONTAINER: 'crewsContainer',
        ADD_MODAL: 'addModal',
        TOOL_NAME_INPUT: 'toolName',
        TOOL_CATEGORY_SELECT: 'toolCategory',
        TOOL_QUANTITY_INPUT: 'toolQuantity'
    },

    // Date/Time Formats
    DATE_FORMAT: {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    },

    TIME_FORMAT: {
        hour: '2-digit',
        minute: '2-digit'
    },

    DATETIME_FORMAT: {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    },

    // Validation Rules
    VALIDATION: {
        MIN_TOOL_NAME_LENGTH: 1,
        MAX_TOOL_NAME_LENGTH: 100,
        MIN_QUANTITY: 1,
        MAX_QUANTITY: 999
    },

    // Accessibility
    ARIA: {
        LIVE_REGION: 'polite'
    }
};

/**
 * Default Tool Inventory
 * This can be extended or modified as needed
 */
export const DEFAULT_TOOL_INVENTORY = {
    hammers: [
        { name: 'Claw Hammer', qty: 8, class: 'hammer' },
        { name: 'Mini Sledge', qty: 4, class: 'hammer' },
        { name: 'Dead Blow', qty: 3, class: 'hammer' },
        { name: 'Framing Hammer', qty: 6, class: 'hammer' }
    ],
    drivers: [
        { name: 'Phillips Screwdriver', qty: 10, class: 'screwdriver' },
        { name: 'Flathead Screwdriver', qty: 10, class: 'screwdriver' },
        { name: 'Impact Bit Set', qty: 6, class: 'screwdriver' },
        { name: 'Multi-bit Driver', qty: 6, class: 'screwdriver' }
    ],
    measuring: [
        { name: 'Level 2ft', qty: 6, class: 'measuring' },
        { name: 'Level 4ft', qty: 4, class: 'measuring' },
        { name: 'Framing Square', qty: 5, class: 'measuring' },
        { name: 'Chalk Line', qty: 8, class: 'measuring' },
        { name: 'String Line', qty: 10, class: 'measuring' },
        { name: 'Tape Measure', qty: 15, class: 'measuring' }
    ],
    cutting: [
        { name: 'Machete', qty: 4, class: 'cutting' },
        { name: 'Utility Knife', qty: 12, class: 'cutting' },
        { name: 'Hacksaw', qty: 4, class: 'cutting' },
        { name: 'Tin Snips', qty: 6, class: 'cutting' }
    ],
    pliers: [
        { name: 'Pliers', qty: 10, class: 'pliers' },
        { name: 'Needle Nose Pliers', qty: 8, class: 'pliers' },
        { name: 'Wire Strippers', qty: 6, class: 'pliers' },
        { name: 'Wrench Set', qty: 5, class: 'fastening' },
        { name: 'Adjustable Wrench', qty: 6, class: 'fastening' }
    ],
    batteries: [
        { name: 'DeWalt 20V Battery', qty: 12, class: 'battery' },
        { name: 'Milwaukee M18 Battery', qty: 8, class: 'battery' },
        { name: 'Battery Charger', qty: 4, class: 'battery' }
    ],
    power: [
        { name: 'Paint Gun', qty: 2, class: 'power-tool' },
        { name: 'Impact Driver', qty: 6, class: 'power-tool' },
        { name: 'Drill', qty: 8, class: 'power-tool' },
        { name: 'Circular Saw', qty: 4, class: 'power-tool' }
    ],
    safety: [
        { name: 'Safety Glasses', qty: 20, class: 'safety' },
        { name: 'Work Gloves', qty: 30, class: 'safety' },
        { name: 'Ear Protection', qty: 15, class: 'safety' }
    ],
    misc: [
        { name: 'Tool Belt', qty: 10, class: 'misc' },
        { name: 'Extension Cord', qty: 6, class: 'misc' },
        { name: 'Work Light', qty: 5, class: 'misc' }
    ]
};

export default CONFIG;
