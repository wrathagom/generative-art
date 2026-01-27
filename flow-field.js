let pathsData = [];
let lastBackgroundColor = '#0f172a';
let currentSeed = null;
let animationId = null;
let animationState = null;

const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'particleCount', 'steps', 'stepSize',
    'fieldScale', 'lineWidth', 'lineOpacity', 'backgroundColor',
    'animationMode', 'animationSpeed', 'exportDuration'
];

// =============================================================================
// PATH CALCULATION
// =============================================================================

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

// =============================================================================
// DRAWING
// =============================================================================

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

// =============================================================================
// ANIMATION
// =============================================================================

function stopAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function resetAnimation() {
    stopAnimation();
    animationState = null;
}

function updateToggleButton() {
    const toggleButton = document.getElementById('toggleButton');
    const animationMode = document.getElementById('animationMode').value;

    if (animationMode === 'none') {
        toggleButton.style.display = 'none';
    } else {
        toggleButton.style.display = '';
        toggleButton.textContent = animationId ? 'Stop' : 'Start';
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

        ctx.globalAlpha = 1;
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, settings.displayWidth, settings.displayHeight);

        for (const path of paths) {
            drawPath(ctx, path, animationState.currentStep + 1);
        }

        animationState.currentStep++;

        if (animationState.currentStep >= maxSteps) {
            animationState.currentStep = 0;
        }

        drawTextOverlays(ctx, settings.displayWidth, settings.displayHeight);
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
            animationState.currentPathIndex++;
            animationState.currentStep = 0;

            if (animationState.currentPathIndex >= paths.length) {
                ctx.globalAlpha = 1;
                ctx.fillStyle = settings.backgroundColor;
                ctx.fillRect(0, 0, settings.displayWidth, settings.displayHeight);
                animationState.currentPathIndex = 0;
            }
        }

        drawTextOverlays(ctx, settings.displayWidth, settings.displayHeight);
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

        ctx.globalAlpha = 1;
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, settings.displayWidth, settings.displayHeight);

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
            animationState.globalStep = 0;
        }

        drawTextOverlays(ctx, settings.displayWidth, settings.displayHeight);
        setFaviconFromCanvas(canvas);
        animationId = requestAnimationFrame(frame);
    }

    animationId = requestAnimationFrame(frame);
}

// =============================================================================
// GENERATION
// =============================================================================

function generateArt(seed = null) {
    resetAnimation();

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
        drawAllPaths(ctx, pathsData);
        ctx.globalAlpha = 1;
        drawTextOverlays(ctx, displayWidth, displayHeight);
        setFaviconFromCanvas(canvas);
    } else {
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

// =============================================================================
// EXPORT
// =============================================================================

function downloadArt() {
    const canvas = document.getElementById('canvas');
    downloadCanvasAsPng(canvas, 'flow-field-art.png');
}

function downloadSVG() {
    if (pathsData.length === 0) {
        generateArt();
    }

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const overlaySvg = buildTextOverlaySvg(displayWidth, displayHeight);

    let svgContent = `<?xml version="1.0" encoding="utf-8" ?>\n`;
    svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}">\n`;
    svgContent += `<rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" fill="${lastBackgroundColor}"/>\n`;
    svgContent += overlaySvg.defs;

    for (const path of pathsData) {
        const d = path.points.map((point, index) => {
            const command = index === 0 ? 'M' : 'L';
            return `${command}${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
        }).join(' ');
        svgContent += `<path d="${d}" stroke="${path.color}" stroke-width="${path.lineWidth}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="${path.opacity}" fill="none"/>\n`;
    }

    svgContent += overlaySvg.content;
    svgContent += '</svg>';
    downloadSvgContent(svgContent, 'flow-field-art.svg');
}

async function downloadGif() {
    const animationMode = document.getElementById('animationMode').value;
    if (animationMode === 'none') {
        alert('Please select an animation mode to export a GIF.');
        return;
    }

    const wasRunning = Boolean(animationId);
    if (!wasRunning && animationState) {
        resumeAnimation();
    }

    await exportGif({
        canvas: document.getElementById('canvas'),
        filename: 'flow-field-art.gif',
        buttonId: 'downloadGifButton'
    });

    if (!wasRunning) {
        stopAnimation();
        updateToggleButton();
    }
}

function downloadWebm() {
    const animationMode = document.getElementById('animationMode').value;
    if (animationMode === 'none') {
        alert('Please select an animation mode to record a video.');
        return;
    }

    const wasRunning = Boolean(animationId);
    if (!wasRunning && animationState) {
        resumeAnimation();
    }

    recordWebm({
        canvas: document.getElementById('canvas'),
        filename: 'flow-field-art.webm',
        buttonId: 'recordWebmButton',
        onStop: () => {
            if (!wasRunning) {
                stopAnimation();
                updateToggleButton();
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
    document.getElementById('downloadSvgButton').addEventListener('click', downloadSVG);
    document.getElementById('downloadGifButton').addEventListener('click', downloadGif);
    document.getElementById('recordWebmButton').addEventListener('click', downloadWebm);
    document.getElementById('shareButton').addEventListener('click', handleShare);
}

window.addEventListener('load', () => {
    initGenerator({
        formInputIds: FORM_INPUT_IDS,
        generateFn: generateArt,
        downloadFns: { png: downloadArt, svg: downloadSVG, gif: downloadGif, webm: downloadWebm },
        extraBindings: bindControls
    });
});
