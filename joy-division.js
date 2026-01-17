function addColor() {
    const colorInputs = document.getElementById('colorInputs');
    const newColorGroup = document.createElement('div');
    newColorGroup.className = 'color-input-group';
    newColorGroup.innerHTML = `
        <input type="color" value="${getRandomHexColor()}">
        <button type="button" class="remove-color">Remove</button>
    `;
    colorInputs.appendChild(newColorGroup);
}

function removeColor(button) {
    const colorInputs = document.getElementById('colorInputs');
    if (colorInputs.children.length > 1) {
        button.parentElement.remove();
    } else {
        alert('You must have at least one color!');
    }
}

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
        // Get all zones
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

        // Calculate which zone this line belongs to
        const linePercentage = (lineIndex / totalLines) * 100;

        let cumulativePercentage = 0;
        for (const zone of zones) {
            cumulativePercentage += zone.percentage;
            if (linePercentage < cumulativePercentage) {
                return zone;
            }
        }

        // If we've gone past all zones, return the last zone's settings
        return zones[zones.length - 1];
    } else {
        // Random color mode - return global settings with random color
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

// Store path data for SVG export
let pathsData = [];

function generateArt() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Get global parameters
    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const numberLines = parseInt(document.getElementById('numberLines').value);
    const backgroundColor = document.getElementById('backgroundColor').value;
    const fillLines = document.getElementById('fillLines').checked;

    // Set canvas size
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Clear paths data
    pathsData = [];

    // Draw each line (top to bottom, so bottom lines are drawn last and appear on top)
    for (let l = 0; l < numberLines; l++) {
        // Get settings for this specific line (zone-specific or global)
        const settings = getSettingsForLine(l, numberLines);

        // Determine weight direction for this line
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

        // Start building the path
        const pathPoints = [];
        let previousHeight = 0;

        // Start point
        pathPoints.push({ x: 0, y: lineCenter, type: 'start' });

        for (let s = 0; s < settings.segments; s++) {
            const distanceFromCenter = Math.abs(s - settings.segments / 2);
            const distanceFromEdge = settings.segments / 2 - distanceFromCenter;

            let newHeight;

            // Edges are flat (first 3 and last 3 segments)
            if (s < 3 || s > settings.segments - 4) {
                newHeight = 0;
                if (s === settings.segments - 4) {
                    previousHeight = 0;
                }
            } else {
                // Calculate height based on weight direction
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

            // Add bezier curve control points
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

        // Draw on canvas
        ctx.beginPath();
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);

        for (let i = 1; i < pathPoints.length; i++) {
            const p = pathPoints[i];
            if (p.type === 'bezier') {
                ctx.bezierCurveTo(p.cp1x, p.cp1y, p.cp2x, p.cp2y, p.x, p.y);
            }
        }

        // If filling, close the path at the bottom
        if (fillLines && fillColor !== 'none') {
            ctx.lineTo(displayWidth, displayHeight);
            ctx.lineTo(0, displayHeight);
            ctx.closePath();
            ctx.fillStyle = fillColor;
            ctx.fill();
        }

        // Stroke the line
        ctx.strokeStyle = settings.lineColor;
        ctx.lineWidth = settings.lineWeight;
        ctx.stroke();

        // Store for SVG export
        pathsData.push({
            points: pathPoints,
            fillColor: fillLines ? fillColor : 'none',
            strokeColor: settings.lineColor,
            strokeWidth: settings.lineWeight
        });
    }
}

function downloadArt() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.download = 'joy-division-art.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function downloadSVG() {
    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const backgroundColor = document.getElementById('backgroundColor').value;

    // Build SVG
    let svgContent = `<?xml version="1.0" encoding="utf-8" ?>
<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}">
<rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" fill="${backgroundColor}"/>
`;

    // Add paths
    for (const pathData of pathsData) {
        let pathString = `M ${pathData.points[0].x} ${pathData.points[0].y} `;

        for (let i = 1; i < pathData.points.length; i++) {
            const p = pathData.points[i];
            if (p.type === 'bezier') {
                pathString += `C ${p.cp1x} ${p.cp1y}, ${p.cp2x} ${p.cp2y}, ${p.x} ${p.y} `;
            }
        }

        // Close path for filling
        if (pathData.fillColor !== 'none') {
            pathString += `L ${displayWidth} ${displayHeight} L 0 ${displayHeight} Z`;
        }

        const fillAttr = pathData.fillColor !== 'none' ? `fill="${pathData.fillColor}"` : 'fill="none"';

        svgContent += `<path d="${pathString}" ${fillAttr} stroke="${pathData.strokeColor}" stroke-width="${pathData.strokeWidth}"/>\n`;
    }

    svgContent += '</svg>';

    // Download
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = 'joy-division-art.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
}

function bindControls() {
    const addColorButton = document.getElementById('addColorButton');
    const addZoneButton = document.getElementById('addZoneButton');
    const generateButton = document.getElementById('generateButton');
    const downloadPngButton = document.getElementById('downloadPngButton');
    const downloadSvgButton = document.getElementById('downloadSvgButton');
    const colorInputs = document.getElementById('colorInputs');
    const zoneInputs = document.getElementById('zoneInputs');
    const colorModeSelect = document.getElementById('colorMode');

    addColorButton.addEventListener('click', addColor);
    addZoneButton.addEventListener('click', addZone);
    generateButton.addEventListener('click', generateArt);
    downloadPngButton.addEventListener('click', downloadArt);
    downloadSvgButton.addEventListener('click', downloadSVG);
    colorModeSelect.addEventListener('change', toggleColorMode);

    colorInputs.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-color')) {
            removeColor(event.target);
        }
    });

    zoneInputs.addEventListener('click', (event) => {
        if (event.target.classList.contains('zone-remove')) {
            removeZone(event.target);
        }
    });
}

// Update color controls visibility based on fill checkbox
const fillLinesToggle = document.getElementById('fillLines');
fillLinesToggle.addEventListener('change', function() {
    const colorModeGroup = document.getElementById('colorModeGroup');
    const randomControls = document.getElementById('randomColorControls');
    const zoneControls = document.getElementById('zoneColorControls');

    if (this.checked) {
        colorModeGroup.style.display = 'block';
        // Show the appropriate color controls based on current mode
        toggleColorMode();
    } else {
        colorModeGroup.style.display = 'none';
        randomControls.style.display = 'none';
        zoneControls.style.display = 'none';
    }
});

window.addEventListener('load', () => {
    bindControls();
    if (fillLinesToggle.checked) {
        toggleColorMode();
    }
    generateArt();
});
