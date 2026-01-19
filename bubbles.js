let bubblesData = [];
let lastBackgroundColor = '#0b0f1a';
let currentSeed = null;

// Form input IDs for serialization
const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'bubbleCount', 'minRadius', 'maxRadius',
    'bubbleStyle', 'strokeWidth', 'overlapMode', 'backgroundColor'
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

function pickCompositeMode(mode) {
    const options = ['normal', 'add', 'subtract', 'intersect'];
    const operation = mode === 'random' ? options[randint(0, options.length - 1)] : mode;
    const modeMap = {
        normal: 'source-over',
        add: 'lighter',
        subtract: 'destination-out',
        intersect: 'source-atop'
    };

    return {
        operation,
        composite: modeMap[operation] || 'source-over'
    };
}

function pickDrawMode(style) {
    if (style === 'random') {
        return random() > 0.5 ? 'filled' : 'outline';
    }
    return style;
}

function generateArt(seed = null) {
    // Set up seeded RNG
    currentSeed = seed !== null ? seed : generateSeed();
    seedRng(currentSeed);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const bubbleCount = parseInt(document.getElementById('bubbleCount').value);
    const minRadius = parseFloat(document.getElementById('minRadius').value);
    const maxRadius = parseFloat(document.getElementById('maxRadius').value);
    const bubbleStyle = document.getElementById('bubbleStyle').value;
    const strokeWidth = parseFloat(document.getElementById('strokeWidth').value);
    const overlapMode = document.getElementById('overlapMode').value;
    const backgroundColor = document.getElementById('backgroundColor').value;

    const colorScheme = getColorScheme();

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    const buffer = document.createElement('canvas');
    buffer.width = displayWidth;
    buffer.height = displayHeight;
    const bufferCtx = buffer.getContext('2d');

    bufferCtx.globalCompositeOperation = 'source-over';
    bubblesData = [];
    let hasContent = false;

    for (let i = 0; i < bubbleCount; i++) {
        const radius = randint(Math.floor(minRadius), Math.floor(maxRadius));
        const cx = randint(Math.floor(radius), Math.floor(displayWidth - radius));
        const cy = randint(Math.floor(radius), Math.floor(displayHeight - radius));
        const color = colorScheme[randint(0, colorScheme.length - 1)];
        const drawMode = pickDrawMode(bubbleStyle);
        const compositeChoice = pickCompositeMode(overlapMode);
        let composite = compositeChoice.composite;
        let operation = compositeChoice.operation;

        if (!hasContent && (operation === 'intersect' || operation === 'subtract')) {
            composite = 'source-over';
            operation = 'normal';
        }

        bufferCtx.globalCompositeOperation = composite;
        bufferCtx.beginPath();
        bufferCtx.arc(cx, cy, radius, 0, Math.PI * 2);

        if (drawMode === 'filled') {
            bufferCtx.fillStyle = color;
            bufferCtx.fill();
        } else {
            bufferCtx.strokeStyle = color;
            bufferCtx.lineWidth = strokeWidth;
            bufferCtx.stroke();
        }

        hasContent = true;
        bubblesData.push({
            cx,
            cy,
            radius,
            color,
            drawMode,
            strokeWidth,
            operation
        });
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    ctx.drawImage(buffer, 0, 0);
    lastBackgroundColor = backgroundColor;
}

function downloadArt() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.download = 'bubbles-art.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function downloadSVG() {
    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);

    let svgContent = `<?xml version="1.0" encoding="utf-8" ?>
<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}">
<rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" fill="${lastBackgroundColor}"/>
`;

    for (const bubble of bubblesData) {
        const fill = bubble.drawMode === 'filled' ? bubble.color : 'none';
        const stroke = bubble.drawMode === 'filled' ? 'none' : bubble.color;
        const strokeWidth = bubble.drawMode === 'filled' ? 0 : bubble.strokeWidth;
        const blend = bubble.operation === 'add' ? ' style="mix-blend-mode:screen"' : '';

        svgContent += `<circle cx="${bubble.cx}" cy="${bubble.cy}" r="${bubble.radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${blend}/>\n`;
    }

    svgContent += '</svg>';

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = 'bubbles-art.svg';
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
    const colorInputs = document.getElementById('colorInputs');

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
