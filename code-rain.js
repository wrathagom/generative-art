let animationId = null;
let lastFrameTime = 0;
let columns = [];
let settings = null;
let currentSeed = null;
let lastFaviconUpdate = -1000;

const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'fontSize', 'speed', 'trailOpacity',
    'density', 'glyphs', 'backgroundColor', 'textColor'
];

// =============================================================================
// SETTINGS
// =============================================================================

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
        y: Math.floor(random() * settings.height),
        speed: randint(1, 4)
    }));
}

// =============================================================================
// ANIMATION
// =============================================================================

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
        const totalDraws = drawCount + (random() < extraChance ? 1 : 0);

        if (settings.density < 1 && random() > settings.density) {
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

    if (timestamp - lastFaviconUpdate > 1000) {
        setFaviconFromCanvas(canvas);
        lastFaviconUpdate = timestamp;
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

// =============================================================================
// GENERATION
// =============================================================================

function generateArt(seed = null) {
    stopAnimation();

    currentSeed = seed !== null ? seed : generateSeed();
    seedRng(currentSeed);

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

// =============================================================================
// EXPORT
// =============================================================================

function downloadArt() {
    const canvas = document.getElementById('canvas');
    downloadCanvasAsPng(canvas, 'code-rain-art.png');
}

async function downloadGif() {
    const wasRunning = Boolean(animationId);
    if (!wasRunning) {
        startAnimation();
    }

    await exportGif({
        canvas: document.getElementById('canvas'),
        filename: 'code-rain-art.gif',
        buttonId: 'downloadGifButton'
    });

    if (!wasRunning) {
        stopAnimation();
    }
}

function downloadWebm() {
    const wasRunning = Boolean(animationId);
    if (!wasRunning) {
        startAnimation();
    }

    recordWebm({
        canvas: document.getElementById('canvas'),
        filename: 'code-rain-art.webm',
        buttonId: 'recordWebmButton',
        onStop: () => {
            if (!wasRunning) {
                stopAnimation();
            }
        }
    });
}

function handleShare() {
    shareArt(FORM_INPUT_IDS, currentSeed);
}

// =============================================================================
// INITIALIZATION
// =============================================================================

function bindControls() {
    document.getElementById('generateButton').addEventListener('click', () => generateArt());
    document.getElementById('toggleButton').addEventListener('click', toggleAnimation);
    document.getElementById('downloadPngButton').addEventListener('click', downloadArt);
    document.getElementById('downloadGifButton').addEventListener('click', downloadGif);
    document.getElementById('recordWebmButton').addEventListener('click', downloadWebm);
    document.getElementById('shareButton').addEventListener('click', handleShare);
}

window.addEventListener('load', () => {
    initGenerator({
        formInputIds: FORM_INPUT_IDS,
        generateFn: generateArt,
        downloadFns: { png: downloadArt, gif: downloadGif, webm: downloadWebm },
        extraBindings: bindControls
    });
});
