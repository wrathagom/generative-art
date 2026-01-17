let animationId = null;
let lastFrameTime = 0;
let columns = [];
let settings = null;

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

function readSettings() {
    const palette = getColorScheme();
    const hasPalette = palette && palette.length > 0;
    return {
        width: parseInt(document.getElementById('displayWidth').value),
        height: parseInt(document.getElementById('displayHeight').value),
        fontSize: parseInt(document.getElementById('fontSize').value),
        speed: parseInt(document.getElementById('speed').value),
        trailOpacity: parseFloat(document.getElementById('trailOpacity').value),
        density: parseFloat(document.getElementById('density').value),
        glyphs: document.getElementById('glyphs').value || '01',
        backgroundColor: document.getElementById('backgroundColor').value,
        textColor: document.getElementById('textColor').value,
        palette: hasPalette ? palette : [document.getElementById('textColor').value]
    };
}

function resetColumns() {
    const columnCount = Math.floor(settings.width / settings.fontSize);
    columns = Array.from({ length: columnCount }, () => ({
        y: Math.floor(Math.random() * settings.height),
        speed: randint(1, 4)
    }));
}

function drawFrame(timestamp) {
    if (!settings) return;
    if (timestamp - lastFrameTime < settings.speed) {
        animationId = requestAnimationFrame(drawFrame);
        return;
    }
    lastFrameTime = timestamp;

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = settings.backgroundColor;
    ctx.globalAlpha = settings.trailOpacity;
    ctx.fillRect(0, 0, settings.width, settings.height);

    ctx.globalAlpha = 1;
    ctx.font = `${settings.fontSize}px monospace`;

    for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        const x = i * settings.fontSize;
        const drawCount = Math.max(1, Math.floor(settings.density));
        const extraChance = settings.density - Math.floor(settings.density);
        const totalDraws = drawCount + (Math.random() < extraChance ? 1 : 0);

        if (settings.density < 1 && Math.random() > settings.density) {
            continue;
        }

        for (let d = 0; d < totalDraws; d++) {
            const charIndex = randint(0, settings.glyphs.length - 1);
            const glyph = settings.glyphs.charAt(charIndex);
            const y = column.y - d * (settings.fontSize * 0.7);
            ctx.fillStyle = settings.palette[randint(0, settings.palette.length - 1)];
            ctx.fillText(glyph, x, y);
        }

        if (column.y > settings.height + settings.fontSize) {
            column.y = randint(-settings.height, 0);
        } else {
            column.y += settings.fontSize * column.speed;
        }
    }

    animationId = requestAnimationFrame(drawFrame);
}

function startAnimation() {
    if (animationId) return;
    lastFrameTime = 0;
    animationId = requestAnimationFrame(drawFrame);
}

function stopAnimation() {
    if (!animationId) return;
    cancelAnimationFrame(animationId);
    animationId = null;
}

function generateArt() {
    stopAnimation();
    settings = readSettings();

    const canvas = document.getElementById('canvas');
    canvas.width = settings.width;
    canvas.height = settings.height;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = settings.backgroundColor;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, settings.width, settings.height);

    resetColumns();
    startAnimation();
    updateToggleButton();
}

function toggleAnimation() {
    if (animationId) {
        stopAnimation();
    } else {
        startAnimation();
    }
    updateToggleButton();
}

function updateToggleButton() {
    const toggleButton = document.getElementById('toggleButton');
    toggleButton.textContent = animationId ? 'Stop' : 'Start';
}

function downloadArt() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.download = 'code-rain-art.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function bindControls() {
    const generateButton = document.getElementById('generateButton');
    const toggleButton = document.getElementById('toggleButton');
    const downloadButton = document.getElementById('downloadPngButton');
    const addColorButton = document.getElementById('addColorButton');
    const colorInputs = document.getElementById('colorInputs');

    generateButton.addEventListener('click', generateArt);
    toggleButton.addEventListener('click', toggleAnimation);
    downloadButton.addEventListener('click', downloadArt);
    addColorButton.addEventListener('click', addColor);

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
