// Seeded PRNG state
let seededRng = null;

// Mulberry32 PRNG - creates a seeded random number generator
function createSeededRandom(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// Initialize seeded RNG with a given seed
function seedRng(seed) {
    seededRng = createSeededRandom(seed);
}

// Clear seeded RNG (revert to Math.random)
function clearSeededRng() {
    seededRng = null;
}

// Random function that uses seeded RNG if available, otherwise Math.random
function random() {
    return seededRng ? seededRng() : Math.random();
}

function randint(min, max) {
    return Math.floor(random() * (max - min + 1)) + min;
}

function parseColorsFromUrl(url) {
    if (!url || url.trim() === '') return null;

    try {
        const parts = url.split('/');
        const colorPart = parts[parts.length - 1];
        const colors = colorPart.split('-').map(c => '#' + c);
        return colors.length > 0 ? colors : null;
    } catch (e) {
        console.error('Error parsing Coolors URL:', e);
        return null;
    }
}

function getColorScheme() {
    const coolorsInput = document.getElementById('coolorsUrl');
    if (coolorsInput) {
        const colorsFromUrl = parseColorsFromUrl(coolorsInput.value);
        if (colorsFromUrl) {
            return colorsFromUrl;
        }
    }

    const colorInputs = document.querySelectorAll('#colorInputs input[type="color"]');
    return Array.from(colorInputs).map(input => input.value);
}

function getRandomHexColor() {
    return `#${Math.floor(random() * 16777215).toString(16).padStart(6, '0')}`;
}

// URL helpers for shareable links
function serializeFormToParams(inputIds) {
    const params = new URLSearchParams();

    for (const id of inputIds) {
        const element = document.getElementById(id);
        if (!element) continue;

        if (element.type === 'checkbox') {
            params.set(id, element.checked ? '1' : '0');
        } else {
            params.set(id, element.value);
        }
    }

    // Handle color inputs specially - serialize as hyphen-separated hex values
    const colorInputs = document.querySelectorAll('#colorInputs input[type="color"]');
    if (colorInputs.length > 0) {
        const colors = Array.from(colorInputs).map(input => input.value.replace('#', '')).join('-');
        params.set('colors', colors);
    }

    return params;
}

function deserializeParamsToForm(inputIds) {
    const params = new URLSearchParams(window.location.search);
    if (params.size === 0) return false;

    for (const id of inputIds) {
        const element = document.getElementById(id);
        if (!element || !params.has(id)) continue;

        if (element.type === 'checkbox') {
            element.checked = params.get(id) === '1';
        } else {
            element.value = params.get(id);
        }
    }

    // Handle color inputs - restore from hyphen-separated hex values
    if (params.has('colors')) {
        const colors = params.get('colors').split('-').map(c => '#' + c);
        const colorInputs = document.getElementById('colorInputs');
        if (colorInputs && colors.length > 0) {
            // Clear existing colors
            colorInputs.innerHTML = '';
            // Add colors from URL
            for (const color of colors) {
                const newColorGroup = document.createElement('div');
                newColorGroup.className = 'color-input-group';
                newColorGroup.innerHTML = `
                    <input type="color" value="${color}">
                    <button type="button" class="remove-color">Remove</button>
                `;
                colorInputs.appendChild(newColorGroup);
            }
        }
    }

    return params.has('seed');
}

function copyToClipboard(text) {
    return navigator.clipboard.writeText(text);
}

function generateSeed() {
    return Math.floor(Math.random() * 2147483647);
}

function setFaviconFromCanvas(sourceCanvas, size = 32) {
    if (!sourceCanvas) return;
    const faviconCanvas = document.createElement('canvas');
    faviconCanvas.width = size;
    faviconCanvas.height = size;
    const ctx = faviconCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(sourceCanvas, 0, 0, size, size);

    let link = document.querySelector('link[rel~="icon"]');
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = faviconCanvas.toDataURL('image/png');
}

const THEME_STORAGE_KEY = 'theme-preference';
const THEME_ORDER = ['system', 'light', 'dark'];

function getStoredTheme() {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        return THEME_ORDER.includes(stored) ? stored : 'system';
    } catch (e) {
        return 'system';
    }
}

function applyThemePreference(mode) {
    const root = document.documentElement;
    if (mode === 'system') {
        root.removeAttribute('data-theme');
    } else {
        root.setAttribute('data-theme', mode);
    }
}

function updateThemeToggleLabel(mode) {
    const label = mode.charAt(0).toUpperCase() + mode.slice(1);
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
        button.textContent = `Theme: ${label}`;
        button.setAttribute('aria-label', `Theme: ${label}`);
    });
}

function setThemePreference(mode) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
        // Ignore storage errors (private mode or blocked storage).
    }
    applyThemePreference(mode);
    updateThemeToggleLabel(mode);
}

function cycleThemePreference() {
    const current = getStoredTheme();
    const currentIndex = THEME_ORDER.indexOf(current);
    const next = THEME_ORDER[(currentIndex + 1) % THEME_ORDER.length];
    setThemePreference(next);
}

function initThemeToggle() {
    const mode = getStoredTheme();
    applyThemePreference(mode);
    updateThemeToggleLabel(mode);

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
        button.addEventListener('click', cycleThemePreference);
    });
}

document.addEventListener('DOMContentLoaded', initThemeToggle);
