let dotsData = [];
let lastBackgroundColor = '#0f172a';
let currentSeed = null;

const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'spacing', 'minRadius', 'maxRadius',
    'noiseScale', 'patternMode', 'dotShape', 'backgroundColor'
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

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function normalizeValue(value) {
    return clamp((value + 1) / 2, 0, 1);
}

function generateArt(seed = null) {
    currentSeed = seed !== null ? seed : generateSeed();
    seedRng(currentSeed);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const spacing = parseInt(document.getElementById('spacing').value);
    const minRadius = parseFloat(document.getElementById('minRadius').value);
    const maxRadius = parseFloat(document.getElementById('maxRadius').value);
    const noiseScale = parseFloat(document.getElementById('noiseScale').value);
    const patternMode = document.getElementById('patternMode').value;
    const dotShape = document.getElementById('dotShape').value;
    const backgroundColor = document.getElementById('backgroundColor').value;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    lastBackgroundColor = backgroundColor;

    const palette = getColorScheme();
    const offsetA = random() * Math.PI * 2;
    const offsetB = random() * Math.PI * 2;
    const offsetC = random() * Math.PI * 2;

    dotsData = [];

    const centerX = displayWidth / 2;
    const centerY = displayHeight / 2;
    const maxDistance = Math.hypot(centerX, centerY);

    for (let x = spacing / 2; x < displayWidth; x += spacing) {
        for (let y = spacing / 2; y < displayHeight; y += spacing) {
            let value = 0;

            if (patternMode === 'radial') {
                const distance = Math.hypot(x - centerX, y - centerY);
                value = clamp(1 - distance / maxDistance, 0, 1);
            } else if (patternMode === 'wave') {
                const wave = Math.sin(x * noiseScale * 3 + offsetA) + Math.cos(y * noiseScale * 3 + offsetB);
                value = normalizeValue(wave / 2);
            } else {
                const noise = Math.sin(x * noiseScale + offsetA) + Math.cos(y * noiseScale + offsetB) + Math.sin((x + y) * noiseScale * 0.7 + offsetC);
                value = normalizeValue(noise / 3);
            }

            const radius = minRadius + value * (maxRadius - minRadius);
            const colorIndex = Math.floor(value * (palette.length - 1));
            const color = palette[clamp(colorIndex, 0, palette.length - 1)];

            if (dotShape === 'square') {
                const size = radius * 2;
                ctx.fillStyle = color;
                ctx.fillRect(x - radius, y - radius, size, size);
                dotsData.push({ x, y, radius, color, shape: 'square' });
            } else {
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                dotsData.push({ x, y, radius, color, shape: 'circle' });
            }
        }
    }

    setFaviconFromCanvas(canvas);
}

function downloadArt() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.download = 'halftone-grid-art.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function downloadSVG() {
    if (dotsData.length === 0) {
        generateArt();
    }

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);

    let svgContent = `<?xml version="1.0" encoding="utf-8" ?>\n`;
    svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}">\n`;
    svgContent += `<rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" fill="${lastBackgroundColor}"/>\n`;

    for (const dot of dotsData) {
        if (dot.shape === 'square') {
            const size = dot.radius * 2;
            svgContent += `<rect x="${(dot.x - dot.radius).toFixed(2)}" y="${(dot.y - dot.radius).toFixed(2)}" width="${size.toFixed(2)}" height="${size.toFixed(2)}" fill="${dot.color}"/>\n`;
        } else {
            svgContent += `<circle cx="${dot.x.toFixed(2)}" cy="${dot.y.toFixed(2)}" r="${dot.radius.toFixed(2)}" fill="${dot.color}"/>\n`;
        }
    }

    svgContent += '</svg>';

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = 'halftone-grid-art.svg';
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
