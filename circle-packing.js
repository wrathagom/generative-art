let circlesData = [];
let lastBackgroundColor = '#f8fafc';
let currentSeed = null;

const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'maxCircles', 'maxAttempts', 'minRadius',
    'maxRadius', 'padding', 'fillOpacity', 'showStroke', 'strokeWidth',
    'strokeColor', 'backgroundColor'
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

function canPlaceCircle(x, y, radius, circles, padding, width, height) {
    if (x - radius - padding < 0 || x + radius + padding > width) {
        return false;
    }
    if (y - radius - padding < 0 || y + radius + padding > height) {
        return false;
    }

    for (const circle of circles) {
        const dx = x - circle.x;
        const dy = y - circle.y;
        const minDist = radius + circle.radius + padding;
        if (dx * dx + dy * dy < minDist * minDist) {
            return false;
        }
    }

    return true;
}

function generateArt(seed = null) {
    currentSeed = seed !== null ? seed : generateSeed();
    seedRng(currentSeed);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const maxCircles = parseInt(document.getElementById('maxCircles').value);
    const maxAttempts = parseInt(document.getElementById('maxAttempts').value);
    const minRadius = parseFloat(document.getElementById('minRadius').value);
    const maxRadius = parseFloat(document.getElementById('maxRadius').value);
    const padding = parseFloat(document.getElementById('padding').value);
    const fillOpacity = parseFloat(document.getElementById('fillOpacity').value);
    const showStroke = document.getElementById('showStroke').checked;
    const strokeWidth = parseFloat(document.getElementById('strokeWidth').value);
    const strokeColor = document.getElementById('strokeColor').value;
    const backgroundColor = document.getElementById('backgroundColor').value;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    lastBackgroundColor = backgroundColor;

    const palette = getColorScheme();

    circlesData = [];

    for (let attempt = 0; attempt < maxAttempts && circlesData.length < maxCircles; attempt++) {
        const x = random() * displayWidth;
        const y = random() * displayHeight;

        if (!canPlaceCircle(x, y, minRadius, circlesData, padding, displayWidth, displayHeight)) {
            continue;
        }

        let radius = minRadius;
        while (radius < maxRadius) {
            if (canPlaceCircle(x, y, radius + 1, circlesData, padding, displayWidth, displayHeight)) {
                radius += 1;
            } else {
                break;
            }
        }

        const color = palette[randint(0, palette.length - 1)];
        circlesData.push({
            x,
            y,
            radius,
            color,
            opacity: fillOpacity,
            strokeColor,
            strokeWidth: showStroke ? strokeWidth : 0
        });
    }

    ctx.globalAlpha = fillOpacity;
    for (const circle of circlesData) {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fillStyle = circle.color;
        ctx.fill();

        if (showStroke && strokeWidth > 0) {
            ctx.globalAlpha = 1;
            ctx.lineWidth = strokeWidth;
            ctx.strokeStyle = strokeColor;
            ctx.stroke();
            ctx.globalAlpha = fillOpacity;
        }
    }

    ctx.globalAlpha = 1;
    setFaviconFromCanvas(canvas);
}

function downloadArt() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.download = 'circle-packing-art.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function downloadSVG() {
    if (circlesData.length === 0) {
        generateArt();
    }

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);

    let svgContent = `<?xml version="1.0" encoding="utf-8" ?>\n`;
    svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}">\n`;
    svgContent += `<rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" fill="${lastBackgroundColor}"/>\n`;

    for (const circle of circlesData) {
        const stroke = circle.strokeWidth > 0 ? circle.strokeColor : 'none';
        const strokeWidth = circle.strokeWidth > 0 ? circle.strokeWidth : 0;
        svgContent += `<circle cx="${circle.x.toFixed(2)}" cy="${circle.y.toFixed(2)}" r="${circle.radius.toFixed(2)}" fill="${circle.color}" fill-opacity="${circle.opacity}" stroke="${stroke}" stroke-width="${strokeWidth}"/>\n`;
    }

    svgContent += '</svg>';

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = 'circle-packing-art.svg';
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
