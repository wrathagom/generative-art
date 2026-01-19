let animationId = null;
let lastFrameTime = 0;
let columns = [];
let settings = null;
let currentSeed = null;
let gifLibraryPromise = null;

// Form input IDs for serialization
const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'fontSize', 'speed', 'trailOpacity',
    'density', 'glyphs', 'backgroundColor', 'textColor'
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

function generateArt(seed = null) {
    stopAnimation();

    // Set up seeded RNG for initial state
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

function getExportDurationMs() {
    const input = document.getElementById('exportDuration');
    const seconds = input ? parseFloat(input.value) : 5;
    const clamped = Math.min(20, Math.max(1, isNaN(seconds) ? 5 : seconds));
    return clamped * 1000;
}

function loadGifLibrary() {
    if (window.GIF) {
        return Promise.resolve();
    }

    if (!gifLibraryPromise) {
        gifLibraryPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'vendor/gif.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load GIF library.'));
            document.head.appendChild(script);
        });
    }

    return gifLibraryPromise;
}

async function downloadGif() {
    const button = document.getElementById('downloadGifButton');
    button.disabled = true;
    button.textContent = 'Preparing GIF...';

    try {
        await loadGifLibrary();
    } catch (error) {
        alert('Could not load the GIF exporter. Please try again.');
        button.disabled = false;
        button.textContent = 'Download GIF';
        return;
    }

    const canvas = document.getElementById('canvas');
    const wasRunning = Boolean(animationId);
    if (!wasRunning) {
        startAnimation();
    }

    const durationMs = getExportDurationMs();
    const fps = 10;
    const frameDelay = Math.round(1000 / fps);
    const totalFrames = Math.max(1, Math.floor(durationMs / frameDelay));

    const gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: 'vendor/gif.worker.js',
        width: canvas.width,
        height: canvas.height
    });

    let captured = 0;
    button.textContent = `Capturing 0/${totalFrames}`;

    await new Promise((resolve) => {
        const captureFrame = () => {
            gif.addFrame(canvas, { copy: true, delay: frameDelay });
            captured += 1;
            button.textContent = `Capturing ${captured}/${totalFrames}`;

            if (captured >= totalFrames) {
                resolve();
                return;
            }

            setTimeout(captureFrame, frameDelay);
        };

        captureFrame();
    });

    button.textContent = 'Rendering GIF...';

    gif.on('finished', (blob) => {
        const link = document.createElement('a');
        link.download = 'code-rain-art.gif';
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);

        button.disabled = false;
        button.textContent = 'Download GIF';
    });

    gif.on('error', () => {
        alert('GIF export failed. Please try again.');
        button.disabled = false;
        button.textContent = 'Download GIF';
    });

    gif.render();

    if (!wasRunning) {
        stopAnimation();
    }
}

function pickRecordingMimeType() {
    const candidates = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
    ];

    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

function recordWebm() {
    const button = document.getElementById('recordWebmButton');
    button.disabled = true;
    button.textContent = 'Recording...';

    if (typeof MediaRecorder === 'undefined') {
        alert('Video recording is not supported in this browser.');
        button.disabled = false;
        button.textContent = 'Record WebM';
        return;
    }

    const canvas = document.getElementById('canvas');
    const wasRunning = Boolean(animationId);
    if (!wasRunning) {
        startAnimation();
    }

    const stream = canvas.captureStream(30);
    const mimeType = pickRecordingMimeType();
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
            chunks.push(event.data);
        }
    };

    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
        const link = document.createElement('a');
        link.download = 'code-rain-art.webm';
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);

        button.disabled = false;
        button.textContent = 'Record WebM';

        if (!wasRunning) {
            stopAnimation();
        }
    };

    recorder.start();
    setTimeout(() => recorder.stop(), getExportDurationMs());
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
    const generateButton = document.getElementById('generateButton');
    const toggleButton = document.getElementById('toggleButton');
    const downloadButton = document.getElementById('downloadPngButton');
    const downloadGifButton = document.getElementById('downloadGifButton');
    const recordWebmButton = document.getElementById('recordWebmButton');
    const shareButton = document.getElementById('shareButton');
    const addColorButton = document.getElementById('addColorButton');
    const importColorsButton = document.getElementById('importColorsButton');
    const coolorsModal = document.getElementById('coolorsModal');
    const coolorsModalClose = document.getElementById('coolorsModalClose');
    const importCancelButton = document.getElementById('importCancelButton');
    const importAddButton = document.getElementById('importAddButton');
    const importOverwriteButton = document.getElementById('importOverwriteButton');
    const colorInputs = document.getElementById('colorInputs');

    generateButton.addEventListener('click', () => generateArt());
    toggleButton.addEventListener('click', toggleAnimation);
    downloadButton.addEventListener('click', downloadArt);
    downloadGifButton.addEventListener('click', downloadGif);
    recordWebmButton.addEventListener('click', recordWebm);
    shareButton.addEventListener('click', shareArt);
    addColorButton.addEventListener('click', addColor);
    importColorsButton.addEventListener('click', openCoolorsModal);

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
