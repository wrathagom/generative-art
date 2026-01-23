// =============================================================================
// SEEDED RANDOM NUMBER GENERATOR
// =============================================================================

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

function seedRng(seed) {
    seededRng = createSeededRandom(seed);
}

function clearSeededRng() {
    seededRng = null;
}

function random() {
    return seededRng ? seededRng() : Math.random();
}

function randint(min, max) {
    return Math.floor(random() * (max - min + 1)) + min;
}

function generateSeed() {
    return Math.floor(Math.random() * 2147483647);
}

// =============================================================================
// COLOR UTILITIES
// =============================================================================

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

// =============================================================================
// COLOR INPUT MANAGEMENT
// These functions manage the dynamic color input UI used across generators
// =============================================================================

function createColorInputGroup(colorValue) {
    const newColorGroup = document.createElement('div');
    newColorGroup.className = 'color-input-group';
    newColorGroup.innerHTML = `
        <input type="color" value="${colorValue}">
        <button type="button" class="remove-color">Remove</button>
    `;
    return newColorGroup;
}

function addColor(colorValue = getRandomHexColor()) {
    const colorInputs = document.getElementById('colorInputs');
    if (colorInputs) {
        colorInputs.appendChild(createColorInputGroup(colorValue));
    }
}

function removeColor(button) {
    const colorInputs = document.getElementById('colorInputs');
    if (colorInputs && colorInputs.children.length > 1) {
        button.parentElement.remove();
    } else {
        alert('You must have at least one color!');
    }
}

function setColors(colors, mode) {
    const colorInputs = document.getElementById('colorInputs');
    if (!colorInputs) return;

    if (mode === 'overwrite') {
        colorInputs.innerHTML = '';
    }
    colors.forEach(color => colorInputs.appendChild(createColorInputGroup(color)));
}

// Bind color input removal via event delegation
function bindColorInputEvents() {
    const colorInputs = document.getElementById('colorInputs');
    if (colorInputs) {
        colorInputs.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-color')) {
                removeColor(event.target);
            }
        });
    }
}

// =============================================================================
// COOLORS MODAL
// Handles the import-from-Coolors modal dialog
// =============================================================================

function openCoolorsModal() {
    const modal = document.getElementById('coolorsModal');
    const input = document.getElementById('coolorsImportUrl');
    if (modal && input) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        input.value = '';
        input.focus();
    }
}

function closeCoolorsModal() {
    const modal = document.getElementById('coolorsModal');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}

function importCoolors(mode) {
    const input = document.getElementById('coolorsImportUrl');
    if (!input) return;

    const colors = parseColorsFromUrl(input.value);

    if (!colors) {
        alert('Please enter a valid Coolors palette URL.');
        return;
    }

    setColors(colors, mode);
    closeCoolorsModal();
}

// Bind all Coolors modal events
function bindCoolorsModalEvents() {
    const coolorsModal = document.getElementById('coolorsModal');
    const coolorsModalClose = document.getElementById('coolorsModalClose');
    const importCancelButton = document.getElementById('importCancelButton');
    const importAddButton = document.getElementById('importAddButton');
    const importOverwriteButton = document.getElementById('importOverwriteButton');
    const importColorsButton = document.getElementById('importColorsButton');

    if (importColorsButton) {
        importColorsButton.addEventListener('click', openCoolorsModal);
    }

    if (coolorsModal) {
        coolorsModal.addEventListener('click', (event) => {
            if (event.target === coolorsModal) {
                closeCoolorsModal();
            }
        });
    }

    if (coolorsModalClose) {
        coolorsModalClose.addEventListener('click', closeCoolorsModal);
    }

    if (importCancelButton) {
        importCancelButton.addEventListener('click', closeCoolorsModal);
    }

    if (importAddButton) {
        importAddButton.addEventListener('click', () => importCoolors('add'));
    }

    if (importOverwriteButton) {
        importOverwriteButton.addEventListener('click', () => importCoolors('overwrite'));
    }

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && coolorsModal && coolorsModal.classList.contains('active')) {
            closeCoolorsModal();
        }
    });
}

// =============================================================================
// URL SERIALIZATION / SHARING
// =============================================================================

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
            colorInputs.innerHTML = '';
            for (const color of colors) {
                colorInputs.appendChild(createColorInputGroup(color));
            }
        }
    }

    return params.has('seed');
}

function copyToClipboard(text) {
    return navigator.clipboard.writeText(text);
}

// Generic share function - creates shareable URL and copies to clipboard
function shareArt(formInputIds, currentSeed, extraParams = {}) {
    const params = serializeFormToParams(formInputIds);
    params.set('seed', currentSeed);

    // Add any extra parameters (e.g., zones for joy-division)
    for (const [key, value] of Object.entries(extraParams)) {
        params.set(key, value);
    }

    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    copyToClipboard(url).then(() => {
        const feedback = document.getElementById('shareFeedback');
        if (feedback) {
            feedback.textContent = 'Link copied!';
            feedback.classList.add('visible');
            setTimeout(() => {
                feedback.classList.remove('visible');
            }, 2000);
        }
    });
}

// =============================================================================
// DOWNLOAD UTILITIES
// =============================================================================

// Generic PNG download
function downloadCanvasAsPng(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Generic SVG download
function downloadSvgContent(svgContent, filename) {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
}

// =============================================================================
// GIF EXPORT
// =============================================================================

let gifLibraryPromise = null;

function loadGifLibrary() {
    if (window.GIF) {
        return Promise.resolve();
    }

    if (!gifLibraryPromise) {
        gifLibraryPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'vendor/gif.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load GIF library.'));
            document.head.appendChild(script);
        });
    }

    return gifLibraryPromise;
}

function getExportDurationMs(defaultSeconds = 5, maxSeconds = 30) {
    const input = document.getElementById('exportDuration');
    const seconds = input ? parseFloat(input.value) : defaultSeconds;
    const clamped = Math.min(maxSeconds, Math.max(1, isNaN(seconds) ? defaultSeconds : seconds));
    return clamped * 1000;
}

// Generic GIF export - requires animation to be running
// Options: { canvas, filename, fps, onStart, onCapture, onRender, onComplete, onError }
async function exportGif(options) {
    const {
        canvas,
        filename = 'animation.gif',
        fps = 10,
        buttonId = null,
        durationMs = null
    } = options;

    const button = buttonId ? document.getElementById(buttonId) : null;

    if (button) {
        button.disabled = true;
        button.textContent = 'Preparing GIF...';
    }

    try {
        await loadGifLibrary();
    } catch (error) {
        alert('Could not load the GIF exporter. Please try again.');
        if (button) {
            button.disabled = false;
            button.textContent = 'Download GIF';
        }
        return;
    }

    const duration = durationMs || getExportDurationMs();
    const frameDelay = Math.round(1000 / fps);
    const totalFrames = Math.max(1, Math.floor(duration / frameDelay));

    const gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: 'vendor/gif.worker.js',
        width: canvas.width,
        height: canvas.height
    });

    let captured = 0;
    if (button) {
        button.textContent = `Capturing 0/${totalFrames}`;
    }

    await new Promise((resolve) => {
        const captureFrame = () => {
            gif.addFrame(canvas, { copy: true, delay: frameDelay });
            captured += 1;
            if (button) {
                button.textContent = `Capturing ${captured}/${totalFrames}`;
            }

            if (captured >= totalFrames) {
                resolve();
                return;
            }

            setTimeout(captureFrame, frameDelay);
        };

        captureFrame();
    });

    if (button) {
        button.textContent = 'Rendering GIF...';
    }

    gif.on('finished', (blob) => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);

        if (button) {
            button.disabled = false;
            button.textContent = 'Download GIF';
        }
    });

    gif.on('error', () => {
        alert('GIF export failed. Please try again.');
        if (button) {
            button.disabled = false;
            button.textContent = 'Download GIF';
        }
    });

    gif.render();
}

// =============================================================================
// WEBM/VIDEO EXPORT
// =============================================================================

function pickRecordingMimeType() {
    const candidates = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
    ];

    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

// Generic WebM recording
// Options: { canvas, filename, fps, durationMs, buttonId, onStart, onStop }
function recordWebm(options) {
    const {
        canvas,
        filename = 'animation.webm',
        fps = 30,
        durationMs = null,
        buttonId = null,
        onStart = null,
        onStop = null
    } = options;

    const button = buttonId ? document.getElementById(buttonId) : null;

    if (button) {
        button.disabled = true;
        button.textContent = 'Recording...';
    }

    if (typeof MediaRecorder === 'undefined') {
        alert('Video recording is not supported in this browser.');
        if (button) {
            button.disabled = false;
            button.textContent = 'Record WebM';
        }
        return;
    }

    if (onStart) onStart();

    const stream = canvas.captureStream(fps);
    const mimeType = pickRecordingMimeType();
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
            chunks.push(event.data);
        }
    };

    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
        const link = document.createElement('a');
        link.download = filename;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);

        if (button) {
            button.disabled = false;
            button.textContent = 'Record WebM';
        }

        if (onStop) onStop();
    };

    recorder.start();
    const duration = durationMs || getExportDurationMs();
    setTimeout(() => recorder.stop(), duration);
}

// =============================================================================
// FAVICON
// =============================================================================

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

// =============================================================================
// THEME TOGGLE
// =============================================================================

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
        // Ignore storage errors
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

// =============================================================================
// AUTO-DOWNLOAD (for headless/programmatic use)
// =============================================================================

function handleAutoDownload(supportedFormats) {
    const params = new URLSearchParams(window.location.search);
    const format = params.get('autodownload');

    if (!format) return false;

    const normalizedFormat = format.toLowerCase();

    if (!supportedFormats[normalizedFormat]) {
        console.warn(`Auto-download format "${format}" not supported. Available: ${Object.keys(supportedFormats).join(', ')}`);
        return false;
    }

    const animatedFormats = ['gif', 'webm'];
    const delay = animatedFormats.includes(normalizedFormat) ? 100 : 50;

    setTimeout(() => {
        supportedFormats[normalizedFormat]();
    }, delay);

    return true;
}

// =============================================================================
// GENERATOR INITIALIZATION HELPER
// Simplifies the common initialization pattern across generators
// =============================================================================

function initGenerator(options) {
    const {
        formInputIds,
        generateFn,
        downloadFns,
        extraBindings = null,
        onParamsLoaded = null
    } = options;

    // Bind common UI events
    bindColorInputEvents();
    bindCoolorsModalEvents();

    // Bind add color button
    const addColorButton = document.getElementById('addColorButton');
    if (addColorButton) {
        addColorButton.addEventListener('click', () => addColor());
    }

    // Load params from URL
    const params = new URLSearchParams(window.location.search);
    const hasSeed = deserializeParamsToForm(formInputIds);

    // Call extra setup if provided
    if (onParamsLoaded) {
        onParamsLoaded(params);
    }

    // Generate initial art
    if (hasSeed && params.has('seed')) {
        generateFn(parseInt(params.get('seed')));
    } else {
        generateFn();
    }

    // Handle auto-download
    handleAutoDownload(downloadFns);

    // Run any extra bindings
    if (extraBindings) {
        extraBindings();
    }
}
