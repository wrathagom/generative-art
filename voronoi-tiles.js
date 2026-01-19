let tilesData = [];
let lastBackgroundColor = '#f8fafc';
let currentSeed = null;

const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'seedCount', 'cellSize', 'jitter',
    'showBorders', 'borderWidth', 'borderColor', 'backgroundColor'
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

function generateSeeds(count, width, height, jitter) {
    const seeds = [];
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < count; i++) {
        const randomX = random() * width;
        const randomY = random() * height;
        const x = centerX + (randomX - centerX) * jitter;
        const y = centerY + (randomY - centerY) * jitter;
        seeds.push({ x, y });
    }

    return seeds;
}

function findNearestSeed(seeds, x, y) {
    let nearestIndex = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < seeds.length; i++) {
        const dx = seeds[i].x - x;
        const dy = seeds[i].y - y;
        const dist = dx * dx + dy * dy;
        if (dist < nearestDist) {
            nearestDist = dist;
            nearestIndex = i;
        }
    }

    return nearestIndex;
}

function generateArt(seed = null) {
    currentSeed = seed !== null ? seed : generateSeed();
    seedRng(currentSeed);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const seedCount = parseInt(document.getElementById('seedCount').value);
    const cellSize = parseInt(document.getElementById('cellSize').value);
    const jitter = parseFloat(document.getElementById('jitter').value);
    const showBorders = document.getElementById('showBorders').checked;
    const borderWidth = parseFloat(document.getElementById('borderWidth').value);
    const borderColor = document.getElementById('borderColor').value;
    const backgroundColor = document.getElementById('backgroundColor').value;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    lastBackgroundColor = backgroundColor;

    const palette = getColorScheme();
    const seeds = generateSeeds(seedCount, displayWidth, displayHeight, jitter);
    const tileCols = Math.ceil(displayWidth / cellSize);
    const tileRows = Math.ceil(displayHeight / cellSize);

    tilesData = [];

    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = borderColor;

    for (let col = 0; col < tileCols; col++) {
        for (let row = 0; row < tileRows; row++) {
            const x = col * cellSize;
            const y = row * cellSize;
            const centerX = x + cellSize / 2;
            const centerY = y + cellSize / 2;
            const seedIndex = findNearestSeed(seeds, centerX, centerY);
            const color = palette[seedIndex % palette.length];
            const width = Math.min(cellSize, displayWidth - x);
            const height = Math.min(cellSize, displayHeight - y);

            ctx.fillStyle = color;
            ctx.fillRect(x, y, width, height);

            if (showBorders && borderWidth > 0) {
                ctx.strokeRect(x, y, width, height);
            }

            tilesData.push({
                x,
                y,
                width,
                height,
                color
            });
        }
    }

    setFaviconFromCanvas(canvas);
}

function downloadArt() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.download = 'voronoi-tiles-art.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function downloadSVG() {
    if (tilesData.length === 0) {
        generateArt();
    }

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const showBorders = document.getElementById('showBorders').checked;
    const borderWidth = parseFloat(document.getElementById('borderWidth').value);
    const borderColor = document.getElementById('borderColor').value;

    let svgContent = `<?xml version="1.0" encoding="utf-8" ?>\n`;
    svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}">\n`;
    svgContent += `<rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" fill="${lastBackgroundColor}"/>\n`;

    for (const tile of tilesData) {
        const stroke = showBorders && borderWidth > 0 ? borderColor : 'none';
        const strokeWidth = showBorders && borderWidth > 0 ? borderWidth : 0;
        svgContent += `<rect x="${tile.x}" y="${tile.y}" width="${tile.width}" height="${tile.height}" fill="${tile.color}" stroke="${stroke}" stroke-width="${strokeWidth}"/>\n`;
    }

    svgContent += '</svg>';

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = 'voronoi-tiles-art.svg';
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

    const params = new URLSearchParams(window.location.search);
    const hasSeed = deserializeParamsToForm(FORM_INPUT_IDS);

    if (hasSeed && params.has('seed')) {
        generateArt(parseInt(params.get('seed')));
    } else {
        generateArt();
    }

    handleAutoDownload({ png: downloadArt, svg: downloadSVG });
});
