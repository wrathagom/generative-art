let linesData = [];
let lastBackgroundColor = '#0f172a';
let currentSeed = null;

const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'wedgeCount', 'strokeCount', 'lineWidth',
    'lineOpacity', 'mirrorWedges', 'backgroundColor'
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

function polarPoint(radius, angle) {
    return {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle)
    };
}

function transformPoint(point, angle, mirror, centerX, centerY) {
    const x = point.x;
    const y = mirror ? -point.y : point.y;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return {
        x: centerX + x * cosA - y * sinA,
        y: centerY + x * sinA + y * cosA
    };
}

function generateArt(seed = null) {
    currentSeed = seed !== null ? seed : generateSeed();
    seedRng(currentSeed);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const wedgeCount = parseInt(document.getElementById('wedgeCount').value);
    const strokeCount = parseInt(document.getElementById('strokeCount').value);
    const lineWidth = parseFloat(document.getElementById('lineWidth').value);
    const lineOpacity = parseFloat(document.getElementById('lineOpacity').value);
    const mirrorWedges = document.getElementById('mirrorWedges').checked;
    const backgroundColor = document.getElementById('backgroundColor').value;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    lastBackgroundColor = backgroundColor;

    const palette = getColorScheme();

    linesData = [];

    const centerX = displayWidth / 2;
    const centerY = displayHeight / 2;
    const maxRadius = Math.min(displayWidth, displayHeight) * 0.48;
    const wedgeAngle = (Math.PI * 2) / wedgeCount;

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.globalAlpha = lineOpacity;

    for (let i = 0; i < strokeCount; i++) {
        const r1 = Math.sqrt(random()) * maxRadius;
        const r2 = Math.sqrt(random()) * maxRadius;
        const a1 = random() * wedgeAngle;
        const a2 = random() * wedgeAngle;
        const baseStart = polarPoint(r1, a1);
        const baseEnd = polarPoint(r2, a2);
        const color = palette[randint(0, palette.length - 1)];

        ctx.strokeStyle = color;

        for (let w = 0; w < wedgeCount; w++) {
            const angle = wedgeAngle * w;
            const mirror = mirrorWedges && w % 2 === 1;

            const start = transformPoint(baseStart, angle, mirror, centerX, centerY);
            const end = transformPoint(baseEnd, angle, mirror, centerX, centerY);

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            linesData.push({
                x1: start.x,
                y1: start.y,
                x2: end.x,
                y2: end.y,
                color,
                lineWidth,
                opacity: lineOpacity
            });
        }
    }

    ctx.globalAlpha = 1;
    setFaviconFromCanvas(canvas);
}

function downloadArt() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.download = 'kaleidoscope-art.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function downloadSVG() {
    if (linesData.length === 0) {
        generateArt();
    }

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);

    let svgContent = `<?xml version="1.0" encoding="utf-8" ?>\n`;
    svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}">\n`;
    svgContent += `<rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" fill="${lastBackgroundColor}"/>\n`;

    for (const line of linesData) {
        svgContent += `<line x1="${line.x1.toFixed(2)}" y1="${line.y1.toFixed(2)}" x2="${line.x2.toFixed(2)}" y2="${line.y2.toFixed(2)}" stroke="${line.color}" stroke-width="${line.lineWidth}" stroke-opacity="${line.opacity}" stroke-linecap="round"/>\n`;
    }

    svgContent += '</svg>';

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = 'kaleidoscope-art.svg';
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
