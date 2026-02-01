let currentSeed = null;
let pathsData = [];
let animationId = null;
let animationState = null;
let lastFaviconUpdate = -1000;

const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'numberLines', 'numberSegments',
    'maxRandomHeight', 'lineWeight', 'bezierWeight', 'weightDirection',
    'backgroundColor', 'lineColor', 'fillLines', 'colorMode',
    'animationMode', 'animationSpeed', 'tideIntensity', 'exportDuration'
];

const ANIMATION_CONFIG = {
    driftSpeed: 0.6,
    sweepSpeed: 0.08,
    tideSpeed: 1.2,
    scrollSpeed: 0.4,
    sweepWidth: 0.18
};

function hash01(value) {
    const s = Math.sin(value) * 10000;
    return s - Math.floor(s);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function getSeedBase() {
    const parsed = parseInt(currentSeed, 10);
    return Number.isFinite(parsed) ? parsed : 0;
}

function getActiveAnimationModes(mode) {
    if (mode === 'all') {
        return new Set(['drift', 'sweep', 'tide', 'scroll']);
    }
    return new Set([mode]);
}

// =============================================================================
// ZONE MANAGEMENT
// =============================================================================

function addZone() {
    const zoneInputs = document.getElementById('zoneInputs');
    const newZoneCard = document.createElement('div');
    newZoneCard.className = 'zone-card';
    const randomColor = getRandomHexColor();
    newZoneCard.innerHTML = `
        <div class="zone-header">
            <input type="text" class="zone-name" value="Zone ${zoneInputs.children.length + 1}" placeholder="Zone name">
            <input type="number" class="zone-percentage" value="25" min="1" max="100" title="Percentage of lines">
            <span class="percentage-label">%</span>
            <button type="button" class="zone-remove">Remove</button>
        </div>
        <div class="zone-settings">
            <div class="zone-setting-row">
                <label>Fill Color</label>
                <input type="color" class="zone-color" value="${randomColor}">
            </div>
            <div class="zone-setting-row">
                <label>Line Color</label>
                <input type="color" class="zone-line-color" value="#ffffff">
            </div>
            <div class="zone-setting-row">
                <label>Segments</label>
                <input type="number" class="zone-segments" value="50" min="10" max="200">
            </div>
            <div class="zone-setting-row">
                <label>Wave Height</label>
                <input type="number" class="zone-wave-height" value="8" min="1" max="50">
            </div>
            <div class="zone-setting-row">
                <label>Line Weight</label>
                <input type="number" class="zone-line-weight" value="2" min="1" max="10">
            </div>
            <div class="zone-setting-row">
                <label>Bezier Weight</label>
                <input type="number" class="zone-bezier-weight" value="2" min="1" max="10" step="0.5">
            </div>
            <div class="zone-setting-row">
                <label>Wave Pattern</label>
                <select class="zone-wave-pattern">
                    <option value="random">Random</option>
                    <option value="center" selected>Center</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                </select>
            </div>
        </div>
    `;
    zoneInputs.appendChild(newZoneCard);
}

function removeZone(button) {
    const zoneInputs = document.getElementById('zoneInputs');
    if (zoneInputs.children.length > 1) {
        button.closest('.zone-card').remove();
    } else {
        alert('You must have at least one zone!');
    }
}

function toggleColorMode() {
    const colorMode = document.getElementById('colorMode').value;
    const randomControls = document.getElementById('randomColorControls');
    const zoneControls = document.getElementById('zoneColorControls');

    if (colorMode === 'zones') {
        randomControls.style.display = 'none';
        zoneControls.style.display = 'block';
    } else {
        randomControls.style.display = 'block';
        zoneControls.style.display = 'none';
    }
}

function getSettingsForLine(lineIndex, totalLines, options = {}) {
    const { isAnimated = false, seedBase = 0 } = options;
    const colorMode = document.getElementById('colorMode').value;

    if (colorMode === 'zones') {
        const zoneCards = document.querySelectorAll('.zone-card');
        const zones = Array.from(zoneCards).map(card => ({
            name: card.querySelector('.zone-name').value,
            fillColor: card.querySelector('.zone-color').value,
            lineColor: card.querySelector('.zone-line-color').value,
            segments: parseInt(card.querySelector('.zone-segments').value),
            waveHeight: parseInt(card.querySelector('.zone-wave-height').value),
            lineWeight: parseInt(card.querySelector('.zone-line-weight').value),
            bezierWeight: parseFloat(card.querySelector('.zone-bezier-weight').value),
            wavePattern: card.querySelector('.zone-wave-pattern').value,
            percentage: parseInt(card.querySelector('.zone-percentage').value)
        }));

        const linePercentage = (lineIndex / totalLines) * 100;

        let cumulativePercentage = 0;
        for (const zone of zones) {
            cumulativePercentage += zone.percentage;
            if (linePercentage < cumulativePercentage) {
                return zone;
            }
        }

        return zones[zones.length - 1];
    } else {
        const colorScheme = getColorScheme();
        const hasPalette = colorScheme.length > 0;
        const paletteIndex = hasPalette
            ? Math.floor(hash01(seedBase + lineIndex * 91.7) * colorScheme.length)
            : 0;
        return {
            fillColor: isAnimated && hasPalette
                ? colorScheme[paletteIndex]
                : colorScheme[randint(0, colorScheme.length - 1)],
            lineColor: document.getElementById('lineColor').value,
            segments: parseInt(document.getElementById('numberSegments').value),
            waveHeight: parseInt(document.getElementById('maxRandomHeight').value),
            lineWeight: parseInt(document.getElementById('lineWeight').value),
            bezierWeight: parseFloat(document.getElementById('bezierWeight').value),
            wavePattern: document.getElementById('weightDirection').value
        };
    }
}

// Zone serialization for sharing
function serializeZones() {
    const zoneCards = document.querySelectorAll('.zone-card');
    const zones = Array.from(zoneCards).map(card => ({
        name: card.querySelector('.zone-name').value,
        percentage: parseInt(card.querySelector('.zone-percentage').value),
        fillColor: card.querySelector('.zone-color').value,
        lineColor: card.querySelector('.zone-line-color').value,
        segments: parseInt(card.querySelector('.zone-segments').value),
        waveHeight: parseInt(card.querySelector('.zone-wave-height').value),
        lineWeight: parseInt(card.querySelector('.zone-line-weight').value),
        bezierWeight: parseFloat(card.querySelector('.zone-bezier-weight').value),
        wavePattern: card.querySelector('.zone-wave-pattern').value
    }));
    return btoa(JSON.stringify(zones));
}

function deserializeZones(encoded) {
    try {
        const zones = JSON.parse(atob(encoded));
        const zoneInputs = document.getElementById('zoneInputs');
        zoneInputs.innerHTML = '';

        for (const zone of zones) {
            const newZoneCard = document.createElement('div');
            newZoneCard.className = 'zone-card';
            newZoneCard.innerHTML = `
                <div class="zone-header">
                    <input type="text" class="zone-name" value="${zone.name}" placeholder="Zone name">
                    <input type="number" class="zone-percentage" value="${zone.percentage}" min="1" max="100" title="Percentage of lines">
                    <span class="percentage-label">%</span>
                    <button type="button" class="zone-remove">Remove</button>
                </div>
                <div class="zone-settings">
                    <div class="zone-setting-row">
                        <label>Fill Color</label>
                        <input type="color" class="zone-color" value="${zone.fillColor}">
                    </div>
                    <div class="zone-setting-row">
                        <label>Line Color</label>
                        <input type="color" class="zone-line-color" value="${zone.lineColor}">
                    </div>
                    <div class="zone-setting-row">
                        <label>Segments</label>
                        <input type="number" class="zone-segments" value="${zone.segments}" min="10" max="200">
                    </div>
                    <div class="zone-setting-row">
                        <label>Wave Height</label>
                        <input type="number" class="zone-wave-height" value="${zone.waveHeight}" min="1" max="50">
                    </div>
                    <div class="zone-setting-row">
                        <label>Line Weight</label>
                        <input type="number" class="zone-line-weight" value="${zone.lineWeight}" min="1" max="10">
                    </div>
                    <div class="zone-setting-row">
                        <label>Bezier Weight</label>
                        <input type="number" class="zone-bezier-weight" value="${zone.bezierWeight}" min="1" max="10" step="0.5">
                    </div>
                    <div class="zone-setting-row">
                        <label>Wave Pattern</label>
                        <select class="zone-wave-pattern">
                            <option value="random" ${zone.wavePattern === 'random' ? 'selected' : ''}>Random</option>
                            <option value="center" ${zone.wavePattern === 'center' ? 'selected' : ''}>Center</option>
                            <option value="left" ${zone.wavePattern === 'left' ? 'selected' : ''}>Left</option>
                            <option value="right" ${zone.wavePattern === 'right' ? 'selected' : ''}>Right</option>
                        </select>
                    </div>
                </div>
            `;
            zoneInputs.appendChild(newZoneCard);
        }
    } catch (e) {
        console.error('Error deserializing zones:', e);
    }
}

// =============================================================================
// GENERATION
// =============================================================================

function renderArt(timeSec = 0, options = {}) {
    const {
        animationMode = 'none',
        updateFavicon = false
    } = options;

    if (currentSeed === null) {
        currentSeed = generateSeed();
    }

    seedRng(currentSeed);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const tideIntensity = parseFloat(document.getElementById('tideIntensity').value);
    const tideStrength = Number.isFinite(tideIntensity) ? tideIntensity : 0.35;

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const numberLines = parseInt(document.getElementById('numberLines').value);
    const backgroundColor = document.getElementById('backgroundColor').value;
    const fillLines = document.getElementById('fillLines').checked;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    const isAnimated = animationMode !== 'none';
    const activeModes = getActiveAnimationModes(animationMode);
    const seedBase = getSeedBase();
    pathsData = [];

    for (let l = 0; l < numberLines; l++) {
        const settings = getSettingsForLine(l, numberLines, { isAnimated, seedBase });

        let weightDirection;
        if (settings.wavePattern === 'random') {
            const options = ['center', 'left', 'right'];
            if (isAnimated) {
                weightDirection = options[Math.floor(hash01(seedBase + l * 57.3) * options.length)];
            } else {
                weightDirection = options[randint(0, options.length - 1)];
            }
        } else {
            weightDirection = settings.wavePattern;
        }

        const lineCenter = l * (displayHeight / numberLines);
        const fillColor = fillLines ? settings.fillColor : 'none';
        const segmentLength = displayWidth / settings.segments;
        const lineNorm = numberLines > 1 ? l / (numberLines - 1) : 0;

        const pathPoints = [];
        let previousHeight = 0;

        pathPoints.push({ x: 0, y: lineCenter, type: 'start' });

        for (let s = 0; s < settings.segments; s++) {
            const distanceFromCenter = Math.abs(s - settings.segments / 2);
            const distanceFromEdge = settings.segments / 2 - distanceFromCenter;

            let newHeight;

            if (s < 3 || s > settings.segments - 4) {
                newHeight = 0;
                if (s === settings.segments - 4) {
                    previousHeight = 0;
                }
            } else {
                if (!isAnimated) {
                    if (weightDirection === 'center') {
                        newHeight = randint(0, settings.waveHeight) * distanceFromEdge;
                    } else if (weightDirection === 'left') {
                        newHeight = randint(0, settings.waveHeight) * (settings.segments - s);
                    } else if (weightDirection === 'right') {
                        newHeight = randint(0, settings.waveHeight) * s;
                    } else {
                        newHeight = randint(0, settings.waveHeight) * (settings.segments / 2);
                    }
                } else {
                    const scrollActive = activeModes.has('scroll');
                    const scrollOffset = scrollActive ? timeSec * ANIMATION_CONFIG.scrollSpeed * settings.segments : 0;
                    const sFloat = scrollActive ? s + scrollOffset : s;
                    const s0 = Math.floor(sFloat);
                    const s1 = s0 + 1;
                    const frac = sFloat - s0;
                    const n0 = hash01(seedBase + l * 131.1 + s0 * 17.71);
                    const n1 = hash01(seedBase + l * 131.1 + s1 * 17.71);
                    const baseRand = scrollActive ? lerp(n0, n1, frac) : n0;

                    let heightScale = 1;
                    if (activeModes.has('drift')) {
                        const phase = hash01(seedBase + l * 12.13) * Math.PI * 2;
                        heightScale *= 0.7 + 0.3 * Math.sin(timeSec * ANIMATION_CONFIG.driftSpeed + phase);
                    }
                    if (activeModes.has('sweep')) {
                        const sweepPos = (timeSec * ANIMATION_CONFIG.sweepSpeed) % 1;
                        const delta = (lineNorm - sweepPos) / ANIMATION_CONFIG.sweepWidth;
                        const band = Math.exp(-(delta * delta) / 2);
                        heightScale *= 0.5 + 0.8 * band;
                    }

                    let distanceFactor;
                    if (weightDirection === 'center') {
                        distanceFactor = distanceFromEdge;
                    } else if (weightDirection === 'left') {
                        distanceFactor = settings.segments - s;
                    } else if (weightDirection === 'right') {
                        distanceFactor = s;
                    } else {
                        distanceFactor = settings.segments / 2;
                    }

                    newHeight = baseRand * settings.waveHeight * distanceFactor * heightScale;

                    if (activeModes.has('tide')) {
                        const tidePhase = hash01(seedBase + l * 193.3 + s * 41.9) * Math.PI * 2;
                        newHeight += Math.sin(timeSec * ANIMATION_CONFIG.tideSpeed + tidePhase) * settings.waveHeight * tideStrength;
                    }
                }
            }

            const cp1x = s * segmentLength + segmentLength / settings.bezierWeight;
            const cp1y = lineCenter + previousHeight;
            const cp2x = (s + 1) * segmentLength - segmentLength / settings.bezierWeight;
            const cp2y = lineCenter + newHeight;
            const endx = (s + 1) * segmentLength;
            const endy = lineCenter + newHeight;

            pathPoints.push({
                type: 'bezier',
                cp1x, cp1y,
                cp2x, cp2y,
                x: endx,
                y: endy
            });

            previousHeight = newHeight;
        }

        ctx.beginPath();
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);

        for (let i = 1; i < pathPoints.length; i++) {
            const p = pathPoints[i];
            if (p.type === 'bezier') {
                ctx.bezierCurveTo(p.cp1x, p.cp1y, p.cp2x, p.cp2y, p.x, p.y);
            }
        }

        if (fillLines && fillColor !== 'none') {
            ctx.lineTo(displayWidth, displayHeight);
            ctx.lineTo(0, displayHeight);
            ctx.closePath();
            ctx.fillStyle = fillColor;
            ctx.fill();
        }

        ctx.strokeStyle = settings.lineColor;
        ctx.lineWidth = settings.lineWeight;
        ctx.stroke();

        pathsData.push({
            points: pathPoints,
            fillColor: fillLines ? fillColor : 'none',
            strokeColor: settings.lineColor,
            strokeWidth: settings.lineWeight
        });
    }

    drawTextOverlays(ctx, displayWidth, displayHeight);

    if (updateFavicon) {
        setFaviconFromCanvas(canvas);
    }
}

function generateArt(seed = null) {
    stopAnimation();

    currentSeed = seed !== null ? seed : generateSeed();
    renderArt(0, {
        animationMode: document.getElementById('animationMode').value,
        updateFavicon: true
    });

    if (document.getElementById('animationMode').value !== 'none') {
        startAnimation();
    }

    updateToggleButton();
}

// =============================================================================
// EXPORT
// =============================================================================

function downloadArt() {
    const canvas = document.getElementById('canvas');
    downloadCanvasAsPng(canvas, 'joy-division-art.png');
}

function downloadSVG() {
    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const backgroundColor = document.getElementById('backgroundColor').value;
    const overlaySvg = buildTextOverlaySvg(displayWidth, displayHeight);

    let svgContent = `<?xml version="1.0" encoding="utf-8" ?>
<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}">
<rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" fill="${backgroundColor}"/>
`;
    svgContent += overlaySvg.defs;

    for (const pathData of pathsData) {
        let pathString = `M ${pathData.points[0].x} ${pathData.points[0].y} `;

        for (let i = 1; i < pathData.points.length; i++) {
            const p = pathData.points[i];
            if (p.type === 'bezier') {
                pathString += `C ${p.cp1x} ${p.cp1y}, ${p.cp2x} ${p.cp2y}, ${p.x} ${p.y} `;
            }
        }

        if (pathData.fillColor !== 'none') {
            pathString += `L ${displayWidth} ${displayHeight} L 0 ${displayHeight} Z`;
        }

        const fillAttr = pathData.fillColor !== 'none' ? `fill="${pathData.fillColor}"` : 'fill="none"';

        svgContent += `<path d="${pathString}" ${fillAttr} stroke="${pathData.strokeColor}" stroke-width="${pathData.strokeWidth}"/>\n`;
    }

    svgContent += overlaySvg.content;
    svgContent += '</svg>';
    downloadSvgContent(svgContent, 'joy-division-art.svg');
}

async function downloadGif() {
    const animationMode = document.getElementById('animationMode').value;
    if (animationMode === 'none') {
        alert('Please select an animation mode to export a GIF.');
        return;
    }

    const wasRunning = Boolean(animationId);
    if (!wasRunning) {
        startAnimation();
    }

    const fps = parseInt(document.getElementById('animationSpeed').value) || 30;
    const durationMs = getExportDurationMs(5, 60);

    await exportGif({
        canvas: document.getElementById('canvas'),
        filename: 'joy-division-art.gif',
        fps,
        buttonId: 'downloadGifButton',
        durationMs
    });

    if (!wasRunning) {
        stopAnimation();
        updateToggleButton();
    }
}

function downloadWebm() {
    const animationMode = document.getElementById('animationMode').value;
    if (animationMode === 'none') {
        alert('Please select an animation mode to record a video.');
        return;
    }

    const wasRunning = Boolean(animationId);
    if (!wasRunning) {
        startAnimation();
    }

    const fps = parseInt(document.getElementById('animationSpeed').value) || 30;
    const durationMs = getExportDurationMs(5, 60);

    recordWebm({
        canvas: document.getElementById('canvas'),
        filename: 'joy-division-art.webm',
        fps,
        durationMs,
        buttonId: 'recordWebmButton',
        onStop: () => {
            if (!wasRunning) {
                stopAnimation();
                updateToggleButton();
            }
        }
    });
}

function handleShare() {
    const colorMode = document.getElementById('colorMode').value;
    const extraParams = colorMode === 'zones' ? { zones: serializeZones() } : {};
    shareArt(FORM_INPUT_IDS, currentSeed, extraParams);
}

// =============================================================================
// INITIALIZATION
// =============================================================================

function drawAnimationFrame(timestamp) {
    if (!animationState) return;

    const fps = parseInt(document.getElementById('animationSpeed').value) || 30;
    const frameDelay = 1000 / fps;
    if (timestamp - animationState.lastFrameTime < frameDelay) {
        animationId = requestAnimationFrame(drawAnimationFrame);
        return;
    }
    animationState.lastFrameTime = timestamp;

    const timeSec = (timestamp - animationState.startTime) / 1000;
    renderArt(timeSec, { animationMode: document.getElementById('animationMode').value });

    if (timestamp - lastFaviconUpdate > 1000) {
        setFaviconFromCanvas(document.getElementById('canvas'));
        lastFaviconUpdate = timestamp;
    }

    animationId = requestAnimationFrame(drawAnimationFrame);
}

function startAnimation() {
    if (animationId) return;
    if (currentSeed === null) {
        currentSeed = generateSeed();
    }
    if (!animationState) {
        animationState = { lastFrameTime: 0, startTime: 0, elapsed: 0 };
    }
    animationState.startTime = performance.now() - (animationState.elapsed || 0);
    animationState.lastFrameTime = 0;
    animationId = requestAnimationFrame(drawAnimationFrame);
}

function stopAnimation() {
    if (!animationId) return;
    cancelAnimationFrame(animationId);
    animationId = null;
    if (animationState) {
        animationState.elapsed = performance.now() - animationState.startTime;
    }
}

function toggleAnimation() {
    if (animationId) {
        stopAnimation();
    } else {
        startAnimation();
    }
    updateToggleButton();
}

function updateToggleButton() {
    const toggleButton = document.getElementById('toggleButton');
    const animationMode = document.getElementById('animationMode').value;
    if (animationMode === 'none') {
        toggleButton.style.display = 'none';
        return;
    }
    toggleButton.style.display = 'inline-flex';
    toggleButton.textContent = animationId ? 'Pause' : 'Resume';
}

function handleAnimationModeChange() {
    const animationMode = document.getElementById('animationMode').value;
    if (animationMode === 'none') {
        stopAnimation();
        renderArt(0, { animationMode: 'none', updateFavicon: true });
    } else if (!animationId) {
        startAnimation();
    }
    updateToggleButton();
}

function bindControls() {
    const fillLinesToggle = document.getElementById('fillLines');
    const colorModeSelect = document.getElementById('colorMode');
    const zoneInputs = document.getElementById('zoneInputs');
    const animationModeSelect = document.getElementById('animationMode');

    document.getElementById('addZoneButton').addEventListener('click', addZone);
    document.getElementById('generateButton').addEventListener('click', () => generateArt());
    document.getElementById('toggleButton').addEventListener('click', toggleAnimation);
    document.getElementById('downloadPngButton').addEventListener('click', downloadArt);
    document.getElementById('downloadSvgButton').addEventListener('click', downloadSVG);
    document.getElementById('downloadGifButton').addEventListener('click', downloadGif);
    document.getElementById('recordWebmButton').addEventListener('click', downloadWebm);
    document.getElementById('shareButton').addEventListener('click', handleShare);
    colorModeSelect.addEventListener('change', toggleColorMode);
    animationModeSelect.addEventListener('change', handleAnimationModeChange);

    zoneInputs.addEventListener('click', (event) => {
        if (event.target.classList.contains('zone-remove')) {
            removeZone(event.target);
        }
    });

    fillLinesToggle.addEventListener('change', function() {
        const colorModeGroup = document.getElementById('colorModeGroup');
        const randomControls = document.getElementById('randomColorControls');
        const zoneControls = document.getElementById('zoneColorControls');

        if (this.checked) {
            colorModeGroup.style.display = 'block';
            toggleColorMode();
        } else {
            colorModeGroup.style.display = 'none';
            randomControls.style.display = 'none';
            zoneControls.style.display = 'none';
        }
    });
}

window.addEventListener('load', () => {
    initGenerator({
        formInputIds: FORM_INPUT_IDS,
        generateFn: generateArt,
        downloadFns: { png: downloadArt, svg: downloadSVG, gif: downloadGif, webm: downloadWebm },
        extraBindings: bindControls,
        onParamsLoaded: (params) => {
            // Restore zones if present
            if (params.has('zones')) {
                deserializeZones(params.get('zones'));
            }
            // Update visibility of color controls
            const fillLinesToggle = document.getElementById('fillLines');
            if (fillLinesToggle.checked) {
                toggleColorMode();
            }
            handleAnimationModeChange();
        }
    });
});
