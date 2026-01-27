let currentSeed = null;
let pathsData = [];

const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'numberLines', 'numberSegments',
    'maxRandomHeight', 'lineWeight', 'bezierWeight', 'weightDirection',
    'backgroundColor', 'lineColor', 'fillLines', 'colorMode'
];

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

function getSettingsForLine(lineIndex, totalLines) {
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
        return {
            fillColor: colorScheme[randint(0, colorScheme.length - 1)],
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

function generateArt(seed = null) {
    currentSeed = seed !== null ? seed : generateSeed();
    seedRng(currentSeed);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const numberLines = parseInt(document.getElementById('numberLines').value);
    const backgroundColor = document.getElementById('backgroundColor').value;
    const fillLines = document.getElementById('fillLines').checked;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    pathsData = [];

    for (let l = 0; l < numberLines; l++) {
        const settings = getSettingsForLine(l, numberLines);

        let weightDirection;
        if (settings.wavePattern === 'random') {
            const options = ['center', 'left', 'right'];
            weightDirection = options[randint(0, options.length - 1)];
        } else {
            weightDirection = settings.wavePattern;
        }

        const lineCenter = l * (displayHeight / numberLines);
        const fillColor = fillLines ? settings.fillColor : 'none';
        const segmentLength = displayWidth / settings.segments;

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
                if (weightDirection === 'center') {
                    newHeight = randint(0, settings.waveHeight) * distanceFromEdge;
                } else if (weightDirection === 'left') {
                    newHeight = randint(0, settings.waveHeight) * (settings.segments - s);
                } else if (weightDirection === 'right') {
                    newHeight = randint(0, settings.waveHeight) * s;
                } else {
                    newHeight = randint(0, settings.waveHeight) * (settings.segments / 2);
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
    setFaviconFromCanvas(canvas);
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

function handleShare() {
    const colorMode = document.getElementById('colorMode').value;
    const extraParams = colorMode === 'zones' ? { zones: serializeZones() } : {};
    shareArt(FORM_INPUT_IDS, currentSeed, extraParams);
}

// =============================================================================
// INITIALIZATION
// =============================================================================

function bindControls() {
    const fillLinesToggle = document.getElementById('fillLines');
    const colorModeSelect = document.getElementById('colorMode');
    const zoneInputs = document.getElementById('zoneInputs');

    document.getElementById('addZoneButton').addEventListener('click', addZone);
    document.getElementById('generateButton').addEventListener('click', () => generateArt());
    document.getElementById('downloadPngButton').addEventListener('click', downloadArt);
    document.getElementById('downloadSvgButton').addEventListener('click', downloadSVG);
    document.getElementById('shareButton').addEventListener('click', handleShare);
    colorModeSelect.addEventListener('change', toggleColorMode);

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
        downloadFns: { png: downloadArt, svg: downloadSVG },
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
        }
    });
});
