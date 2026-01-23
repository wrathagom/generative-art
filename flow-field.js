let pathsData = [];
let lastBackgroundColor = '#0f172a';
let currentSeed = null;
let animationId = null;
let animationState = null;
let gifLibraryPromise = null;

const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'particleCount', 'steps', 'stepSize',
    'fieldScale', 'lineWidth', 'lineOpacity', 'backgroundColor',
    'animationMode', 'animationSpeed', 'exportDuration'
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

function calculatePaths(settings) {
    const { displayWidth, displayHeight, particleCount, steps, stepSize, fieldScale, lineWidth, lineOpacity, palette } = settings;

    const offsetA = random() * Math.PI * 2;
    const offsetB = random() * Math.PI * 2;
    const offsetC = random() * Math.PI * 2;

    const fieldAngle = (x, y) => {
        const nx = x * fieldScale;
        const ny = y * fieldScale;
        const value = Math.sin(nx + offsetA) + Math.cos(ny + offsetB) + Math.sin((nx + ny) * 0.7 + offsetC);
        return value * Math.PI;
    };

    const paths = [];

    for (let i = 0; i < particleCount; i++) {
        let x = random() * displayWidth;
        let y = random() * displayHeight;
        const color = palette[randint(0, palette.length - 1)];
        const points = [{ x, y }];

        for (let step = 0; step < steps; step++) {
            const angle = fieldAngle(x, y);
            const nx = x + Math.cos(angle) * stepSize;
            const ny = y + Math.sin(angle) * stepSize;

            if (nx < 0 || nx > displayWidth || ny < 0 || ny > displayHeight) {
                break;
            }

            x = nx;
            y = ny;
            points.push({ x, y });
        }

        if (points.length >= 2) {
            paths.push({
                color,
                lineWidth,
                opacity: lineOpacity,
                points
            });
        }
    }

    return paths;
}

function drawPath(ctx, path, endIndex = null) {
    const points = path.points;
    const end = endIndex !== null ? Math.min(endIndex, points.length) : points.length;

    if (end < 2) return;

    ctx.strokeStyle = path.color;
    ctx.lineWidth = path.lineWidth;
    ctx.globalAlpha = path.opacity;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let p = 1; p < end; p++) {
        ctx.lineTo(points[p].x, points[p].y);
    }
    ctx.stroke();
}

function drawAllPaths(ctx, paths) {
    for (const path of paths) {
        drawPath(ctx, path);
    }
    ctx.globalAlpha = 1;
}

function stopAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    animationState = null;
}

function updateToggleButton() {
    const toggleButton = document.getElementById('toggleButton');
    const animationMode = document.getElementById('animationMode').value;

    if (animationMode === 'none') {
        toggleButton.style.display = 'none';
    } else {
        toggleButton.style.display = '';
        toggleButton.textContent = animationId ? 'Pause' : 'Resume';
    }
}

function toggleAnimation() {
    if (animationId) {
        stopAnimation();
    } else if (animationState) {
        resumeAnimation();
    }
    updateToggleButton();
}

function resumeAnimation() {
    if (!animationState) return;

    const { mode } = animationState;
    if (mode === 'allGrow') {
        animateAllGrow();
    } else if (mode === 'sequential') {
        animateSequential();
    } else if (mode === 'staggered') {
        animateStaggered();
    }
}

function animateAllGrow() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const { paths, settings, maxSteps } = animationState;
    const frameDelay = 1000 / settings.animationSpeed;
    let lastFrameTime = 0;

    function frame(timestamp) {
        if (timestamp - lastFrameTime < frameDelay) {
            animationId = requestAnimationFrame(frame);
            return;
        }
        lastFrameTime = timestamp;

        // Clear and redraw background
        ctx.globalAlpha = 1;
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, settings.displayWidth, settings.displayHeight);

        // Draw all paths up to current step
        for (const path of paths) {
            drawPath(ctx, path, animationState.currentStep + 1);
        }

        animationState.currentStep++;

        if (animationState.currentStep >= maxSteps) {
            // Animation complete - loop or stop
            animationState.currentStep = 0;
        }

        setFaviconFromCanvas(canvas);
        animationId = requestAnimationFrame(frame);
    }

    animationId = requestAnimationFrame(frame);
}

function animateSequential() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const { paths, settings } = animationState;
    const frameDelay = 1000 / settings.animationSpeed;
    let lastFrameTime = 0;

    function frame(timestamp) {
        if (timestamp - lastFrameTime < frameDelay) {
            animationId = requestAnimationFrame(frame);
            return;
        }
        lastFrameTime = timestamp;

        const currentPath = paths[animationState.currentPathIndex];
        drawPath(ctx, currentPath, animationState.currentStep + 1);

        animationState.currentStep++;

        if (animationState.currentStep >= currentPath.points.length) {
            // Move to next path
            animationState.currentPathIndex++;
            animationState.currentStep = 0;

            if (animationState.currentPathIndex >= paths.length) {
                // Animation complete - reset for loop
                ctx.globalAlpha = 1;
                ctx.fillStyle = settings.backgroundColor;
                ctx.fillRect(0, 0, settings.displayWidth, settings.displayHeight);
                animationState.currentPathIndex = 0;
            }
        }

        setFaviconFromCanvas(canvas);
        animationId = requestAnimationFrame(frame);
    }

    animationId = requestAnimationFrame(frame);
}

function animateStaggered() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const { paths, settings, staggerOffset } = animationState;
    const frameDelay = 1000 / settings.animationSpeed;
    let lastFrameTime = 0;

    function frame(timestamp) {
        if (timestamp - lastFrameTime < frameDelay) {
            animationId = requestAnimationFrame(frame);
            return;
        }
        lastFrameTime = timestamp;

        // Clear and redraw background
        ctx.globalAlpha = 1;
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, settings.displayWidth, settings.displayHeight);

        // Draw each path with staggered progress
        let allComplete = true;
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            const pathStart = i * staggerOffset;
            const pathStep = animationState.globalStep - pathStart;

            if (pathStep > 0) {
                const endIndex = Math.min(pathStep, path.points.length);
                drawPath(ctx, path, endIndex);

                if (endIndex < path.points.length) {
                    allComplete = false;
                }
            } else {
                allComplete = false;
            }
        }

        animationState.globalStep++;

        if (allComplete) {
            // Reset for loop
            animationState.globalStep = 0;
        }

        setFaviconFromCanvas(canvas);
        animationId = requestAnimationFrame(frame);
    }

    animationId = requestAnimationFrame(frame);
}

function generateArt(seed = null) {
    stopAnimation();

    currentSeed = seed !== null ? seed : generateSeed();
    seedRng(currentSeed);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const particleCount = parseInt(document.getElementById('particleCount').value);
    const steps = parseInt(document.getElementById('steps').value);
    const stepSize = parseFloat(document.getElementById('stepSize').value);
    const fieldScale = parseFloat(document.getElementById('fieldScale').value);
    const lineWidth = parseFloat(document.getElementById('lineWidth').value);
    const lineOpacity = parseFloat(document.getElementById('lineOpacity').value);
    const backgroundColor = document.getElementById('backgroundColor').value;
    const animationMode = document.getElementById('animationMode').value;
    const animationSpeed = parseInt(document.getElementById('animationSpeed').value) || 30;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    lastBackgroundColor = backgroundColor;

    const palette = getColorScheme();

    const settings = {
        displayWidth, displayHeight, particleCount, steps, stepSize,
        fieldScale, lineWidth, lineOpacity, backgroundColor, animationSpeed, palette
    };

    pathsData = calculatePaths(settings);

    if (animationMode === 'none') {
        // Draw everything at once
        drawAllPaths(ctx, pathsData);
        ctx.globalAlpha = 1;
        setFaviconFromCanvas(canvas);
    } else {
        // Set up animation state
        const maxSteps = Math.max(...pathsData.map(p => p.points.length));

        animationState = {
            mode: animationMode,
            paths: pathsData,
            settings,
            currentStep: 0,
            currentPathIndex: 0,
            globalStep: 0,
            maxSteps,
            staggerOffset: Math.max(1, Math.floor(maxSteps / pathsData.length * 3))
        };

        if (animationMode === 'allGrow') {
            animateAllGrow();
        } else if (animationMode === 'sequential') {
            animateSequential();
        } else if (animationMode === 'staggered') {
            animateStaggered();
        }
    }

    updateToggleButton();
}

function downloadArt() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.download = 'flow-field-art.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function downloadSVG() {
    if (pathsData.length === 0) {
        generateArt();
    }

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);

    let svgContent = `<?xml version="1.0" encoding="utf-8" ?>\n`;
    svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}">\n`;
    svgContent += `<rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" fill="${lastBackgroundColor}"/>\n`;

    for (const path of pathsData) {
        const d = path.points.map((point, index) => {
            const command = index === 0 ? 'M' : 'L';
            return `${command}${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
        }).join(' ');
        svgContent += `<path d="${d}" stroke="${path.color}" stroke-width="${path.lineWidth}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="${path.opacity}" fill="none"/>\n`;
    }

    svgContent += '</svg>';

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = 'flow-field-art.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
}

function getExportDurationMs() {
    const input = document.getElementById('exportDuration');
    const seconds = input ? parseFloat(input.value) : 5;
    const clamped = Math.min(30, Math.max(1, isNaN(seconds) ? 5 : seconds));
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
    const animationMode = document.getElementById('animationMode').value;
    if (animationMode === 'none') {
        alert('Please select an animation mode to export a GIF.');
        return;
    }

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
    if (!wasRunning && animationState) {
        resumeAnimation();
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
        link.download = 'flow-field-art.gif';
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
        updateToggleButton();
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
    const animationMode = document.getElementById('animationMode').value;
    if (animationMode === 'none') {
        alert('Please select an animation mode to record a video.');
        return;
    }

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
    if (!wasRunning && animationState) {
        resumeAnimation();
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
        link.download = 'flow-field-art.webm';
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);

        button.disabled = false;
        button.textContent = 'Record WebM';

        if (!wasRunning) {
            stopAnimation();
            updateToggleButton();
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
    const colorInputs = document.getElementById('colorInputs');
    const addColorButton = document.getElementById('addColorButton');
    const importColorsButton = document.getElementById('importColorsButton');
    const coolorsModal = document.getElementById('coolorsModal');
    const coolorsModalClose = document.getElementById('coolorsModalClose');
    const importCancelButton = document.getElementById('importCancelButton');
    const importAddButton = document.getElementById('importAddButton');
    const importOverwriteButton = document.getElementById('importOverwriteButton');
    const generateButton = document.getElementById('generateButton');
    const toggleButton = document.getElementById('toggleButton');
    const downloadPngButton = document.getElementById('downloadPngButton');
    const downloadSvgButton = document.getElementById('downloadSvgButton');
    const downloadGifButton = document.getElementById('downloadGifButton');
    const recordWebmButton = document.getElementById('recordWebmButton');
    const shareButton = document.getElementById('shareButton');

    addColorButton.addEventListener('click', addColor);
    importColorsButton.addEventListener('click', openCoolorsModal);
    generateButton.addEventListener('click', () => generateArt());
    toggleButton.addEventListener('click', toggleAnimation);
    downloadPngButton.addEventListener('click', downloadArt);
    downloadSvgButton.addEventListener('click', downloadSVG);
    downloadGifButton.addEventListener('click', downloadGif);
    recordWebmButton.addEventListener('click', recordWebm);
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

    handleAutoDownload({ png: downloadArt, svg: downloadSVG, gif: downloadGif, webm: recordWebm });
});
