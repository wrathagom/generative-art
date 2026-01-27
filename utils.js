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
// TEXT OVERLAYS
// =============================================================================

const TEXT_OVERLAY_DEFAULTS = {
    text: 'Overlay Text',
    x: 50,
    y: 50,
    size: 64,
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontStyle: 'normal',
    fontWeight: '700',
    align: 'center',
    baseline: 'middle',
    color: '#ffffff',
    opacity: 1,
    borderColor: '#000000',
    borderWidth: 0,
    appearance: 'solid',
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowBlur: 12,
    shadowOffsetX: 4,
    shadowOffsetY: 4
};

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeXml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function createTextOverlayCard(data = {}) {
    const overlay = { ...TEXT_OVERLAY_DEFAULTS, ...data };
    const card = document.createElement('div');
    card.className = 'text-overlay-card';
    card.innerHTML = `
        <div class="text-overlay-header">
            <input type="text" class="text-overlay-text" value="${escapeHtml(overlay.text)}" placeholder="Overlay text">
            <button type="button" class="text-overlay-remove">Remove</button>
        </div>

        <div class="text-overlay-group">
            <div class="text-overlay-group-title">Position & Size</div>
            <div class="text-overlay-grid">
                <div class="text-overlay-field">
                    <label>Position X (%)</label>
                    <input type="number" class="text-overlay-x" min="0" max="100" step="0.1" value="${overlay.x}">
                </div>
                <div class="text-overlay-field">
                    <label>Position Y (%)</label>
                    <input type="number" class="text-overlay-y" min="0" max="100" step="0.1" value="${overlay.y}">
                </div>
                <div class="text-overlay-field">
                    <label>Size (px)</label>
                    <input type="number" class="text-overlay-size" min="6" max="400" step="1" value="${overlay.size}">
                </div>
            </div>
        </div>

        <div class="text-overlay-group">
            <div class="text-overlay-group-title">Font</div>
            <div class="text-overlay-grid">
                <div class="text-overlay-field">
                    <label>Family</label>
                    <select class="text-overlay-font">
                        <option value="Georgia, &quot;Times New Roman&quot;, serif"${overlay.fontFamily === 'Georgia, "Times New Roman", serif' ? ' selected' : ''}>Georgia</option>
                        <option value="&quot;Times New Roman&quot;, serif"${overlay.fontFamily === '"Times New Roman", serif' ? ' selected' : ''}>Times New Roman</option>
                        <option value="Arial, sans-serif"${overlay.fontFamily === 'Arial, sans-serif' ? ' selected' : ''}>Arial</option>
                        <option value="&quot;Trebuchet MS&quot;, sans-serif"${overlay.fontFamily === '"Trebuchet MS", sans-serif' ? ' selected' : ''}>Trebuchet MS</option>
                        <option value="&quot;Courier New&quot;, monospace"${overlay.fontFamily === '"Courier New", monospace' ? ' selected' : ''}>Courier New</option>
                        <option value="&quot;Lucida Console&quot;, monospace"${overlay.fontFamily === '"Lucida Console", monospace' ? ' selected' : ''}>Lucida Console</option>
                        <option value="&quot;Palatino Linotype&quot;, serif"${overlay.fontFamily === '"Palatino Linotype", serif' ? ' selected' : ''}>Palatino Linotype</option>
                        <option value="Impact, sans-serif"${overlay.fontFamily === 'Impact, sans-serif' ? ' selected' : ''}>Impact</option>
                    </select>
                </div>
                <div class="text-overlay-field">
                    <label>Style</label>
                    <select class="text-overlay-style">
                        <option value="normal"${overlay.fontStyle === 'normal' ? ' selected' : ''}>Normal</option>
                        <option value="italic"${overlay.fontStyle === 'italic' ? ' selected' : ''}>Italic</option>
                    </select>
                </div>
                <div class="text-overlay-field">
                    <label>Weight</label>
                    <select class="text-overlay-weight">
                        <option value="300"${overlay.fontWeight === '300' ? ' selected' : ''}>Light</option>
                        <option value="400"${overlay.fontWeight === '400' ? ' selected' : ''}>Regular</option>
                        <option value="600"${overlay.fontWeight === '600' ? ' selected' : ''}>Semibold</option>
                        <option value="700"${overlay.fontWeight === '700' ? ' selected' : ''}>Bold</option>
                        <option value="900"${overlay.fontWeight === '900' ? ' selected' : ''}>Black</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="text-overlay-group">
            <div class="text-overlay-group-title">Alignment</div>
            <div class="text-overlay-grid">
                <div class="text-overlay-field">
                    <label>Align</label>
                    <select class="text-overlay-align">
                        <option value="left"${overlay.align === 'left' ? ' selected' : ''}>Left</option>
                        <option value="center"${overlay.align === 'center' ? ' selected' : ''}>Center</option>
                        <option value="right"${overlay.align === 'right' ? ' selected' : ''}>Right</option>
                    </select>
                </div>
                <div class="text-overlay-field">
                    <label>Baseline</label>
                    <select class="text-overlay-baseline">
                        <option value="top"${overlay.baseline === 'top' ? ' selected' : ''}>Top</option>
                        <option value="middle"${overlay.baseline === 'middle' ? ' selected' : ''}>Middle</option>
                        <option value="bottom"${overlay.baseline === 'bottom' ? ' selected' : ''}>Bottom</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="text-overlay-group">
            <div class="text-overlay-group-title">Fill</div>
            <div class="text-overlay-grid">
                <div class="text-overlay-field">
                    <label>Color</label>
                    <input type="color" class="text-overlay-color" value="${overlay.color}">
                </div>
                <div class="text-overlay-field">
                    <label>Opacity</label>
                    <input type="number" class="text-overlay-opacity" min="0" max="1" step="0.05" value="${overlay.opacity}">
                </div>
            </div>
        </div>

        <div class="text-overlay-group">
            <div class="text-overlay-group-title">Border</div>
            <div class="text-overlay-grid">
                <div class="text-overlay-field">
                    <label>Color</label>
                    <input type="color" class="text-overlay-border-color" value="${overlay.borderColor}">
                </div>
                <div class="text-overlay-field">
                    <label>Width</label>
                    <input type="number" class="text-overlay-border-width" min="0" max="20" step="1" value="${overlay.borderWidth}">
                </div>
            </div>
        </div>

        <div class="text-overlay-group">
            <div class="text-overlay-group-title">Shadow</div>
            <div class="text-overlay-grid">
                <div class="text-overlay-field">
                    <label>Appearance</label>
                    <select class="text-overlay-appearance">
                        <option value="solid"${overlay.appearance === 'solid' ? ' selected' : ''}>Solid</option>
                        <option value="drop-shadow"${overlay.appearance === 'drop-shadow' ? ' selected' : ''}>Drop Shadow</option>
                        <option value="inner-shadow"${overlay.appearance === 'inner-shadow' ? ' selected' : ''}>Inner Shadow</option>
                    </select>
                </div>
                <div class="text-overlay-field">
                    <label>Color</label>
                    <input type="color" class="text-overlay-shadow-color" value="${overlay.shadowColor}">
                </div>
                <div class="text-overlay-field">
                    <label>Opacity</label>
                    <input type="number" class="text-overlay-shadow-opacity" min="0" max="1" step="0.05" value="${overlay.shadowOpacity}">
                </div>
                <div class="text-overlay-field">
                    <label>Blur</label>
                    <input type="number" class="text-overlay-shadow-blur" min="0" max="60" step="1" value="${overlay.shadowBlur}">
                </div>
                <div class="text-overlay-field">
                    <label>Offset X</label>
                    <input type="number" class="text-overlay-shadow-offset-x" min="-100" max="100" step="1" value="${overlay.shadowOffsetX}">
                </div>
                <div class="text-overlay-field">
                    <label>Offset Y</label>
                    <input type="number" class="text-overlay-shadow-offset-y" min="-100" max="100" step="1" value="${overlay.shadowOffsetY}">
                </div>
            </div>
        </div>
    `;
    return card;
}

function addTextOverlay(data = {}) {
    const list = document.getElementById('textOverlayList');
    if (!list) return;
    list.appendChild(createTextOverlayCard(data));
}

function removeTextOverlay(button) {
    const card = button.closest('.text-overlay-card');
    if (card) {
        card.remove();
    }
}

function bindTextOverlayEvents() {
    const list = document.getElementById('textOverlayList');
    const addButton = document.getElementById('addTextOverlayButton');

    if (list) {
        list.addEventListener('click', (event) => {
            if (event.target.classList.contains('text-overlay-remove')) {
                removeTextOverlay(event.target);
            }
        });
    }

    if (addButton) {
        addButton.addEventListener('click', () => addTextOverlay());
    }
}

function getTextOverlays() {
    const list = document.getElementById('textOverlayList');
    if (!list) return [];
    const cards = Array.from(list.querySelectorAll('.text-overlay-card'));
    return cards.map((card) => {
        const getValue = (selector) => card.querySelector(selector)?.value ?? '';
        const getNumber = (selector, fallback) => {
            const value = parseFloat(getValue(selector));
            return isNaN(value) ? fallback : value;
        };

        return {
            text: getValue('.text-overlay-text').trim(),
            x: getNumber('.text-overlay-x', TEXT_OVERLAY_DEFAULTS.x),
            y: getNumber('.text-overlay-y', TEXT_OVERLAY_DEFAULTS.y),
            size: getNumber('.text-overlay-size', TEXT_OVERLAY_DEFAULTS.size),
            fontFamily: getValue('.text-overlay-font') || TEXT_OVERLAY_DEFAULTS.fontFamily,
            fontStyle: getValue('.text-overlay-style') || TEXT_OVERLAY_DEFAULTS.fontStyle,
            fontWeight: getValue('.text-overlay-weight') || TEXT_OVERLAY_DEFAULTS.fontWeight,
            align: getValue('.text-overlay-align') || TEXT_OVERLAY_DEFAULTS.align,
            baseline: getValue('.text-overlay-baseline') || TEXT_OVERLAY_DEFAULTS.baseline,
            color: getValue('.text-overlay-color') || TEXT_OVERLAY_DEFAULTS.color,
            opacity: getNumber('.text-overlay-opacity', TEXT_OVERLAY_DEFAULTS.opacity),
            borderColor: getValue('.text-overlay-border-color') || TEXT_OVERLAY_DEFAULTS.borderColor,
            borderWidth: getNumber('.text-overlay-border-width', TEXT_OVERLAY_DEFAULTS.borderWidth),
            appearance: getValue('.text-overlay-appearance') || TEXT_OVERLAY_DEFAULTS.appearance,
            shadowColor: getValue('.text-overlay-shadow-color') || TEXT_OVERLAY_DEFAULTS.shadowColor,
            shadowOpacity: getNumber('.text-overlay-shadow-opacity', TEXT_OVERLAY_DEFAULTS.shadowOpacity),
            shadowBlur: getNumber('.text-overlay-shadow-blur', TEXT_OVERLAY_DEFAULTS.shadowBlur),
            shadowOffsetX: getNumber('.text-overlay-shadow-offset-x', TEXT_OVERLAY_DEFAULTS.shadowOffsetX),
            shadowOffsetY: getNumber('.text-overlay-shadow-offset-y', TEXT_OVERLAY_DEFAULTS.shadowOffsetY)
        };
    }).filter((overlay) => overlay.text.length > 0);
}

function setTextOverlays(overlays = []) {
    const list = document.getElementById('textOverlayList');
    if (!list) return;
    list.innerHTML = '';
    overlays.forEach((overlay) => addTextOverlay(overlay));
}

function applyTextStyles(ctx, overlay) {
    ctx.font = `${overlay.fontStyle} ${overlay.fontWeight} ${overlay.size}px ${overlay.fontFamily}`;
    ctx.textAlign = overlay.align;
    ctx.textBaseline = overlay.baseline;
}

function drawInnerShadowText(ctx, width, height, overlay, x, y) {
    ctx.fillStyle = overlay.color;
    ctx.fillText(overlay.text, x, y);

    const shadowBlur = Math.max(0, overlay.shadowBlur);

    if (shadowBlur <= 0) {
        return;
    }

    // Step 1: Create a mask with text as a transparent "hole"
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d');

    applyTextStyles(maskCtx, overlay);

    // Fill with opaque color, then cut out the text
    maskCtx.fillStyle = '#000000';
    maskCtx.fillRect(0, 0, width, height);
    maskCtx.globalCompositeOperation = 'destination-out';
    maskCtx.fillText(overlay.text, x, y);

    // Step 2: Draw the mask with shadow - shadow falls into the hole
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = width;
    shadowCanvas.height = height;
    const shadowCtx = shadowCanvas.getContext('2d');

    shadowCtx.shadowColor = overlay.shadowColor;
    shadowCtx.shadowBlur = shadowBlur;
    shadowCtx.shadowOffsetX = overlay.shadowOffsetX;
    shadowCtx.shadowOffsetY = overlay.shadowOffsetY;
    shadowCtx.drawImage(maskCanvas, 0, 0);

    // Step 3: Clip to just the text shape to extract only the inner shadow
    shadowCtx.globalCompositeOperation = 'destination-in';
    shadowCtx.shadowColor = 'transparent';
    shadowCtx.shadowBlur = 0;
    shadowCtx.shadowOffsetX = 0;
    shadowCtx.shadowOffsetY = 0;
    applyTextStyles(shadowCtx, overlay);
    shadowCtx.fillStyle = '#ffffff';
    shadowCtx.fillText(overlay.text, x, y);

    ctx.save();
    ctx.globalAlpha = Math.min(1, Math.max(0, overlay.shadowOpacity));
    ctx.drawImage(shadowCanvas, 0, 0);
    ctx.restore();
}

function drawTextOverlays(ctx, width, height, overlays = null) {
    const items = overlays || getTextOverlays();
    if (!items.length) return;

    for (const overlay of items) {
        const x = (overlay.x / 100) * width;
        const y = (overlay.y / 100) * height;
        const hasBorder = overlay.borderWidth > 0;

        ctx.save();
        applyTextStyles(ctx, overlay);
        ctx.globalAlpha = overlay.opacity;
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw border first (underneath fill)
        if (hasBorder) {
            ctx.strokeStyle = overlay.borderColor;
            ctx.lineWidth = overlay.borderWidth;
            ctx.lineJoin = 'round';
            ctx.strokeText(overlay.text, x, y);
        }

        if (overlay.appearance === 'drop-shadow') {
            ctx.shadowColor = overlay.shadowColor;
            ctx.shadowBlur = Math.max(0, overlay.shadowBlur);
            ctx.shadowOffsetX = overlay.shadowOffsetX;
            ctx.shadowOffsetY = overlay.shadowOffsetY;
            ctx.fillStyle = overlay.color;
            ctx.fillText(overlay.text, x, y);
        } else if (overlay.appearance === 'inner-shadow') {
            drawInnerShadowText(ctx, width, height, overlay, x, y);
        } else {
            ctx.fillStyle = overlay.color;
            ctx.fillText(overlay.text, x, y);
        }

        ctx.restore();
    }
}

function parseHexColor(hex) {
    if (!hex || hex[0] !== '#') return { r: 0, g: 0, b: 0 };
    const value = hex.slice(1);
    const normalized = value.length === 3
        ? value.split('').map((v) => v + v).join('')
        : value.padEnd(6, '0');
    const intValue = parseInt(normalized.slice(0, 6), 16);
    return {
        r: (intValue >> 16) & 255,
        g: (intValue >> 8) & 255,
        b: intValue & 255
    };
}

function buildTextOverlaySvg(width, height, overlays = null) {
    const items = overlays || getTextOverlays();
    if (!items.length) {
        return { defs: '', content: '' };
    }

    let defs = '';
    let content = '';

    items.forEach((overlay, index) => {
        const x = ((overlay.x / 100) * width).toFixed(2);
        const y = ((overlay.y / 100) * height).toFixed(2);
        const anchor = overlay.align === 'left' ? 'start' : overlay.align === 'right' ? 'end' : 'middle';
        const baseline = overlay.baseline === 'top' ? 'hanging' : overlay.baseline === 'bottom' ? 'text-after-edge' : 'middle';
        const fontFamily = escapeXml(overlay.fontFamily);
        const fontStyle = overlay.fontStyle;
        const fontWeight = overlay.fontWeight;
        const opacity = Math.min(1, Math.max(0, overlay.opacity));

        let filterId = '';
        if (overlay.appearance === 'drop-shadow') {
            filterId = `textOverlayDropShadow${index}`;
            const shadow = parseHexColor(overlay.shadowColor);
            const shadowOpacity = Math.min(1, Math.max(0, overlay.shadowOpacity));
            defs += `
                <filter id="${filterId}" x="0" y="0" width="${width}" height="${height}" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="${overlay.shadowOffsetX}" dy="${overlay.shadowOffsetY}" stdDeviation="${Math.max(0, overlay.shadowBlur)}" flood-color="rgb(${shadow.r},${shadow.g},${shadow.b})" flood-opacity="${shadowOpacity}" />
                </filter>
            `;
        } else if (overlay.appearance === 'inner-shadow') {
            filterId = `textOverlayInnerShadow${index}`;
            const shadow = parseHexColor(overlay.shadowColor);
            const shadowOpacity = Math.min(1, Math.max(0, overlay.shadowOpacity));
            defs += `
                <filter id="${filterId}" x="0" y="0" width="${width}" height="${height}" filterUnits="userSpaceOnUse">
                    <feOffset dx="${overlay.shadowOffsetX}" dy="${overlay.shadowOffsetY}" />
                    <feGaussianBlur stdDeviation="${Math.max(0, overlay.shadowBlur)}" result="blur" />
                    <feComposite in="blur" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="inner-shadow" />
                    <feColorMatrix in="inner-shadow" type="matrix"
                        values="0 0 0 0 ${shadow.r / 255}
                                0 0 0 0 ${shadow.g / 255}
                                0 0 0 0 ${shadow.b / 255}
                                0 0 0 ${shadowOpacity} 0" />
                    <feComposite in2="SourceGraphic" operator="over" />
                </filter>
            `;
        }

        const filterAttr = filterId ? ` filter="url(#${filterId})"` : '';
        const strokeAttr = overlay.borderWidth > 0 ? ` stroke="${overlay.borderColor}" stroke-width="${overlay.borderWidth}" stroke-linejoin="round" paint-order="stroke fill"` : '';
        content += `<text x="${x}" y="${y}" fill="${overlay.color}" fill-opacity="${opacity}"${strokeAttr} font-family="${fontFamily}" font-size="${overlay.size}" font-weight="${fontWeight}" font-style="${fontStyle}" text-anchor="${anchor}" dominant-baseline="${baseline}"${filterAttr}>${escapeXml(overlay.text)}</text>\n`;
    });

    const defsBlock = defs ? `<defs>${defs}\n</defs>\n` : '';
    return { defs: defsBlock, content };
}

function encodeBase64Unicode(text) {
    return btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
    }));
}

function decodeBase64Unicode(text) {
    return decodeURIComponent(Array.prototype.map.call(atob(text), (char) => {
        return '%' + char.charCodeAt(0).toString(16).padStart(2, '0');
    }).join(''));
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

    const textOverlays = getTextOverlays();
    if (textOverlays.length > 0) {
        params.set('textOverlay', encodeBase64Unicode(JSON.stringify(textOverlays)));
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

    if (params.has('textOverlay')) {
        try {
            const raw = decodeBase64Unicode(params.get('textOverlay'));
            const overlays = JSON.parse(raw);
            if (Array.isArray(overlays)) {
                setTextOverlays(overlays);
            }
        } catch (e) {
            console.warn('Failed to restore text overlays from URL.', e);
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
    bindTextOverlayEvents();

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
