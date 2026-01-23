let linesData = [];
let lastBackgroundColor = '#232634';
let currentSeed = null;

const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'xGridCount', 'yGridCount', 'linesPerGrid',
    'gridGap', 'orientationMode', 'basketWeaveWidth', 'basketWeaveHeight',
    'focalPointX', 'focalPointY', 'backgroundColor'
];

const FOCAL_MODES = new Set([
    'radial', 'perpendicular', 'spiral', 'rings', 'swirl-bands',
    'jitter', 'polar-snap', 'orbit-drift'
]);

function isFocalMode(mode) {
    return FOCAL_MODES.has(mode);
}

function generateArt(seed = null) {
    currentSeed = seed !== null ? seed : generateSeed();
    seedRng(currentSeed);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const xGridCount = parseInt(document.getElementById('xGridCount').value);
    const yGridCount = parseInt(document.getElementById('yGridCount').value);
    const linesPerGrid = parseInt(document.getElementById('linesPerGrid').value);
    const gridGap = parseInt(document.getElementById('gridGap').value);
    const orientationMode = document.getElementById('orientationMode').value;
    const basketWeaveWidth = Math.max(1, parseInt(document.getElementById('basketWeaveWidth').value) || 1);
    const basketWeaveHeight = Math.max(1, parseInt(document.getElementById('basketWeaveHeight').value) || 1);
    const useFocalPoint = isFocalMode(orientationMode);
    const focalPointX = parseInt(document.getElementById('focalPointX').value);
    const focalPointY = parseInt(document.getElementById('focalPointY').value);
    const backgroundColor = document.getElementById('backgroundColor').value;

    const minLineWidth = Math.floor(displayWidth / xGridCount / 500) || 1;
    const maxLineWidth = Math.floor(displayWidth / yGridCount / 20) || 5;

    const colorScheme = getColorScheme();

    const lineOrientations = orientationMode === 'chaos'
        ? ['horizontal', 'vertical', 'chaos']
        : [orientationMode];

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    lastBackgroundColor = backgroundColor;

    linesData = [];

    const totalGapX = gridGap * (xGridCount - 1);
    const totalGapY = gridGap * (yGridCount - 1);
    const cellWidth = Math.max(1, (displayWidth - totalGapX) / xGridCount);
    const cellHeight = Math.max(1, (displayHeight - totalGapY) / yGridCount);
    const maxRadius = Math.hypot(displayWidth, displayHeight);

    for (let xGrid = 0; xGrid < xGridCount; xGrid++) {
        for (let yGrid = 0; yGrid < yGridCount; yGrid++) {
            let lineOrientation = lineOrientations[randint(0, lineOrientations.length - 1)];
            if (orientationMode === 'basket-weave') {
                const blockX = Math.floor(xGrid / basketWeaveWidth);
                const blockY = Math.floor(yGrid / basketWeaveHeight);
                lineOrientation = (blockX + blockY) % 2 === 0 ? 'horizontal' : 'vertical';
            }
            const color = colorScheme[randint(0, colorScheme.length - 1)];

            for (let line = 0; line < linesPerGrid; line++) {
                const xRangeMin = Math.floor(xGrid * (cellWidth + gridGap));
                const xRangeMax = Math.floor(xRangeMin + cellWidth);
                const yRangeMin = Math.floor(yGrid * (cellHeight + gridGap));
                const yRangeMax = Math.floor(yRangeMin + cellHeight);

                let xStart, xEnd, yStart, yEnd;

                if (useFocalPoint) {
                    const centerX = randint(xRangeMin, xRangeMax);
                    const centerY = randint(yRangeMin, yRangeMax);
                    let dx = centerX - focalPointX;
                    let dy = centerY - focalPointY;
                    const angle = Math.atan2(dy, dx);
                    const lengthBase = Math.min(xRangeMax - xRangeMin, yRangeMax - yRangeMin);
                    const minLength = Math.max(4, Math.floor(lengthBase * 0.4));
                    const maxLength = Math.max(8, Math.floor(lengthBase * 1.1));
                    const length = randint(minLength, maxLength);

                    if (dx === 0 && dy === 0) {
                        dx = randint(-1, 1);
                        dy = randint(-1, 1);
                    }

                    const magnitude = Math.hypot(dx, dy) || 1;
                    const ux = dx / magnitude;
                    const uy = dy / magnitude;
                    let dirX = ux;
                    let dirY = uy;

                    if (orientationMode === 'perpendicular') {
                        const sign = random() < 0.5 ? -1 : 1;
                        dirX = -uy * sign;
                        dirY = ux * sign;
                    } else if (orientationMode === 'spiral') {
                        const sign = random() < 0.5 ? -1 : 1;
                        const tx = -uy * sign;
                        const ty = ux * sign;
                        const spiralStrength = 0.8;
                        dirX = ux + tx * spiralStrength;
                        dirY = uy + ty * spiralStrength;
                        const dirMag = Math.hypot(dirX, dirY) || 1;
                        dirX /= dirMag;
                        dirY /= dirMag;
                    } else if (orientationMode === 'rings') {
                        const bandSize = Math.max(cellWidth, cellHeight) * 1.1;
                        const bandIndex = Math.floor(magnitude / bandSize);
                        const sign = bandIndex % 2 === 0 ? 1 : -1;
                        dirX = -uy * sign;
                        dirY = ux * sign;
                    } else if (orientationMode === 'swirl-bands') {
                        const sign = (xGrid + yGrid) % 2 === 0 ? 1 : -1;
                        const tx = -uy * sign;
                        const ty = ux * sign;
                        const spiralStrength = 0.9;
                        dirX = ux + tx * spiralStrength;
                        dirY = uy + ty * spiralStrength;
                        const dirMag = Math.hypot(dirX, dirY) || 1;
                        dirX /= dirMag;
                        dirY /= dirMag;
                    } else if (orientationMode === 'jitter') {
                        const jitterScale = Math.min(1, magnitude / maxRadius);
                        const maxJitter = Math.PI * 0.5 * jitterScale;
                        const jitter = (random() * 2 - 1) * maxJitter;
                        const jitterAngle = angle + jitter;
                        dirX = Math.cos(jitterAngle);
                        dirY = Math.sin(jitterAngle);
                    } else if (orientationMode === 'polar-snap') {
                        const spokes = 12;
                        const step = (Math.PI * 2) / spokes;
                        const snapped = Math.round(angle / step) * step;
                        dirX = Math.cos(snapped);
                        dirY = Math.sin(snapped);
                    } else if (orientationMode === 'orbit-drift') {
                        const sign = random() < 0.5 ? -1 : 1;
                        const driftStrength = 0.35 + random() * 0.35;
                        dirX = -uy * sign + ux * driftStrength;
                        dirY = ux * sign + uy * driftStrength;
                        const dirMag = Math.hypot(dirX, dirY) || 1;
                        dirX /= dirMag;
                        dirY /= dirMag;
                    }
                    const half = length / 2;

                    xStart = centerX - dirX * half;
                    yStart = centerY - dirY * half;
                    xEnd = centerX + dirX * half;
                    yEnd = centerY + dirY * half;

                    xStart = Math.max(xRangeMin, Math.min(xRangeMax, xStart));
                    xEnd = Math.max(xRangeMin, Math.min(xRangeMax, xEnd));
                    yStart = Math.max(yRangeMin, Math.min(yRangeMax, yStart));
                    yEnd = Math.max(yRangeMin, Math.min(yRangeMax, yEnd));
                } else {
                    xStart = randint(xRangeMin, xRangeMax);
                    xEnd = lineOrientation === 'vertical' ? xStart : randint(xRangeMin, xRangeMax);

                    yStart = randint(yRangeMin, yRangeMax);
                    yEnd = lineOrientation === 'horizontal' ? yStart : randint(yRangeMin, yRangeMax);
                }

                const lineWidth = randint(minLineWidth, maxLineWidth);
                const opacity = random();

                ctx.beginPath();
                ctx.moveTo(xStart, yStart);
                ctx.lineTo(xEnd, yEnd);
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                ctx.globalAlpha = opacity;
                ctx.stroke();

                linesData.push({
                    x1: xStart, y1: yStart, x2: xEnd, y2: yEnd,
                    color, lineWidth, opacity
                });
            }
        }
    }

    ctx.globalAlpha = 1.0;
    setFaviconFromCanvas(canvas);
}

function downloadArt() {
    downloadCanvasAsPng(document.getElementById('canvas'), 'chaotic-lines-art.png');
}

function downloadSVG() {
    if (linesData.length === 0) {
        generateArt();
    }

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);

    let svgContent = `<?xml version="1.0" encoding="utf-8" ?>
<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}">
<rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" fill="${lastBackgroundColor}"/>
`;

    for (const line of linesData) {
        svgContent += `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="${line.color}" stroke-width="${line.lineWidth}" stroke-opacity="${line.opacity}" fill="none"/>\n`;
    }

    svgContent += '</svg>';
    downloadSvgContent(svgContent, 'chaotic-lines-art.svg');
}

function handleShare() {
    shareArt(FORM_INPUT_IDS, currentSeed);
}

function updateOrientationVisibility() {
    const mode = document.getElementById('orientationMode').value;
    const focalPointInputs = document.getElementById('focalPointInputs');
    const basketWeaveInputs = document.getElementById('basketWeaveInputs');
    focalPointInputs.classList.toggle('is-hidden', !isFocalMode(mode));
    basketWeaveInputs.classList.toggle('is-hidden', mode !== 'basket-weave');
}

function bindControls() {
    document.getElementById('generateButton').addEventListener('click', () => generateArt());
    document.getElementById('downloadPngButton').addEventListener('click', downloadArt);
    document.getElementById('downloadSvgButton').addEventListener('click', downloadSVG);
    document.getElementById('shareButton').addEventListener('click', handleShare);
    document.getElementById('orientationMode').addEventListener('change', updateOrientationVisibility);
}

window.addEventListener('load', () => {
    initGenerator({
        formInputIds: FORM_INPUT_IDS,
        generateFn: generateArt,
        downloadFns: { png: downloadArt, svg: downloadSVG },
        extraBindings: bindControls,
        onParamsLoaded: () => updateOrientationVisibility()
    });
});
