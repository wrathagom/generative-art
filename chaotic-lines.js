// Store line data for SVG export
let linesData = [];
let lastBackgroundColor = '#232634';
let currentSeed = null;

// Form input IDs for serialization
const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'xGridCount', 'yGridCount', 'linesPerGrid',
    'gridGap', 'lineOrientation', 'useFocalPoint', 'focalPointX', 'focalPointY',
    'backgroundColor'
];

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
    colorInputs.appendChild(createColorInputGroup(colorValue));
}

function removeColor(button) {
    const colorInputs = document.getElementById('colorInputs');
    if (colorInputs.children.length > 1) {
        button.parentElement.remove();
    } else {
        alert('You must have at least one color!');
    }
}

function setColors(colors, mode) {
    const colorInputs = document.getElementById('colorInputs');
    if (mode === 'overwrite') {
        colorInputs.innerHTML = '';
    }
    colors.forEach(color => colorInputs.appendChild(createColorInputGroup(color)));
}

function openCoolorsModal() {
    const modal = document.getElementById('coolorsModal');
    const input = document.getElementById('coolorsImportUrl');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    input.value = '';
    input.focus();
}

function closeCoolorsModal() {
    const modal = document.getElementById('coolorsModal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
}

function importCoolors(mode) {
    const input = document.getElementById('coolorsImportUrl');
    const colors = parseColorsFromUrl(input.value);

    if (!colors) {
        alert('Please enter a valid Coolors palette URL.');
        return;
    }

    setColors(colors, mode);
    closeCoolorsModal();
}

function generateArt(seed = null) {
    // Set up seeded RNG
    currentSeed = seed !== null ? seed : generateSeed();
    seedRng(currentSeed);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Get parameters from form
    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const xGridCount = parseInt(document.getElementById('xGridCount').value);
    const yGridCount = parseInt(document.getElementById('yGridCount').value);
    const linesPerGrid = parseInt(document.getElementById('linesPerGrid').value);
    const gridGap = parseInt(document.getElementById('gridGap').value);
    const lineOrientationMode = document.getElementById('lineOrientation').value;
    const useFocalPoint = document.getElementById('useFocalPoint').checked;
    const focalPointX = parseInt(document.getElementById('focalPointX').value);
    const focalPointY = parseInt(document.getElementById('focalPointY').value);
    const backgroundColor = document.getElementById('backgroundColor').value;

    const minLineWidth = Math.floor(displayWidth / xGridCount / 500) || 1;
    const maxLineWidth = Math.floor(displayWidth / yGridCount / 20) || 5;

    const colorScheme = getColorScheme();

    const lineOrientations = lineOrientationMode === 'chaos'
        ? ['horizontal', 'vertical', 'chaos']
        : [lineOrientationMode];

    // Set canvas size
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    lastBackgroundColor = backgroundColor;

    // Reset stored lines
    linesData = [];

    // Generate art
    const totalGapX = gridGap * (xGridCount - 1);
    const totalGapY = gridGap * (yGridCount - 1);
    const cellWidth = Math.max(1, (displayWidth - totalGapX) / xGridCount);
    const cellHeight = Math.max(1, (displayHeight - totalGapY) / yGridCount);

    for (let xGrid = 0; xGrid < xGridCount; xGrid++) {
        for (let yGrid = 0; yGrid < yGridCount; yGrid++) {
            const lineOrientation = lineOrientations[randint(0, lineOrientations.length - 1)];
            const color = colorScheme[randint(0, colorScheme.length - 1)];

            for (let line = 0; line < linesPerGrid; line++) {
                const xRangeMin = Math.floor(xGrid * (cellWidth + gridGap));
                const xRangeMax = Math.floor(xRangeMin + cellWidth);
                const yRangeMin = Math.floor(yGrid * (cellHeight + gridGap));
                const yRangeMax = Math.floor(yRangeMin + cellHeight);

                let xStart;
                let xEnd;
                let yStart;
                let yEnd;

                if (useFocalPoint) {
                    const centerX = randint(xRangeMin, xRangeMax);
                    const centerY = randint(yRangeMin, yRangeMax);
                    let dx = centerX - focalPointX;
                    let dy = centerY - focalPointY;
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
                    const half = length / 2;

                    xStart = centerX - ux * half;
                    yStart = centerY - uy * half;
                    xEnd = centerX + ux * half;
                    yEnd = centerY + uy * half;

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
                    x1: xStart,
                    y1: yStart,
                    x2: xEnd,
                    y2: yEnd,
                    color,
                    lineWidth,
                    opacity
                });
            }
        }
    }

    // Reset alpha
    ctx.globalAlpha = 1.0;
}

function downloadArt() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.download = 'chaotic-lines-art.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function downloadSVG() {
    if (linesData.length === 0) {
        generateArt();
    }

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);

    // Build SVG
    let svgContent = `<?xml version="1.0" encoding="utf-8" ?>
<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}">
<rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" fill="${lastBackgroundColor}"/>
`;

    for (const line of linesData) {
        svgContent += `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="${line.color}" stroke-width="${line.lineWidth}" stroke-opacity="${line.opacity}" fill="none"/>\n`;
    }

    svgContent += '</svg>';

    // Download
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = 'chaotic-lines-art.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
}

function shareArt() {
    const params = serializeFormToParams(FORM_INPUT_IDS);
    params.set('seed', currentSeed);

    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    copyToClipboard(url).then(() => {
        const feedback = document.getElementById('shareFeedback');
        feedback.textContent = 'Link copied!';
        feedback.classList.add('visible');
        setTimeout(() => {
            feedback.classList.remove('visible');
        }, 2000);
    });
}

function bindControls() {
    const colorInputs = document.getElementById('colorInputs');
    const addColorButton = document.getElementById('addColorButton');
    const importColorsButton = document.getElementById('importColorsButton');
    const coolorsModal = document.getElementById('coolorsModal');
    const coolorsModalClose = document.getElementById('coolorsModalClose');
    const importCancelButton = document.getElementById('importCancelButton');
    const importAddButton = document.getElementById('importAddButton');
    const importOverwriteButton = document.getElementById('importOverwriteButton');
    const generateButton = document.getElementById('generateButton');
    const downloadPngButton = document.getElementById('downloadPngButton');
    const downloadSvgButton = document.getElementById('downloadSvgButton');
    const shareButton = document.getElementById('shareButton');

    addColorButton.addEventListener('click', addColor);
    importColorsButton.addEventListener('click', openCoolorsModal);
    generateButton.addEventListener('click', () => generateArt());
    downloadPngButton.addEventListener('click', downloadArt);
    downloadSvgButton.addEventListener('click', downloadSVG);
    shareButton.addEventListener('click', shareArt);

    colorInputs.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-color')) {
            removeColor(event.target);
        }
    });

    coolorsModal.addEventListener('click', (event) => {
        if (event.target === coolorsModal) {
            closeCoolorsModal();
        }
    });

    coolorsModalClose.addEventListener('click', closeCoolorsModal);
    importCancelButton.addEventListener('click', closeCoolorsModal);
    importAddButton.addEventListener('click', () => importCoolors('add'));
    importOverwriteButton.addEventListener('click', () => importCoolors('overwrite'));

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && coolorsModal.classList.contains('active')) {
            closeCoolorsModal();
        }
    });
}

window.addEventListener('load', () => {
    bindControls();

    // Check for URL params and restore state
    const params = new URLSearchParams(window.location.search);
    const hasSeed = deserializeParamsToForm(FORM_INPUT_IDS);

    if (hasSeed && params.has('seed')) {
        generateArt(parseInt(params.get('seed')));
    } else {
        generateArt();
    }
});
