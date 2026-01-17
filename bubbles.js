let bubblesData = [];
let lastBackgroundColor = '#0b0f1a';

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
        return Math.random() > 0.5 ? 'filled' : 'outline';
    }
    return style;
}

function generateArt() {
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

function bindControls() {
    const addColorButton = document.getElementById('addColorButton');
    const generateButton = document.getElementById('generateButton');
    const downloadPngButton = document.getElementById('downloadPngButton');
    const downloadSvgButton = document.getElementById('downloadSvgButton');
    const colorInputs = document.getElementById('colorInputs');

    addColorButton.addEventListener('click', addColor);
    generateButton.addEventListener('click', generateArt);
    downloadPngButton.addEventListener('click', downloadArt);
    downloadSvgButton.addEventListener('click', downloadSVG);

    colorInputs.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-color')) {
            removeColor(event.target);
        }
    });
}

window.addEventListener('load', () => {
    bindControls();
    generateArt();
});
