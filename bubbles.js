let bubblesData = [];
let lastBackgroundColor = '#0b0f1a';
let currentSeed = null;
let animationFrameId = null;
let lastTimestamp = 0;
let animationEnabled = false;
let animationSpeed = 0;
let animationBuffer = null;
let animationBufferCtx = null;
let lastFaviconUpdate = -1000;

const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'bubbleCount', 'minRadius', 'maxRadius',
    'bubbleStyle', 'strokeWidth', 'overlapMode', 'animateBubbles', 'bubbleSpeed',
    'backgroundColor'
];

// =============================================================================
// COMPOSITE MODES
// =============================================================================

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

// =============================================================================
// ANIMATION SETTINGS
// =============================================================================

function getAnimationSettings() {
    const animateBubbles = document.getElementById('animateBubbles');
    const bubbleSpeed = document.getElementById('bubbleSpeed');
    const speed = Math.max(0, parseFloat(bubbleSpeed.value) || 0);

    return {
        enabled: animateBubbles.checked,
        speed
    };
}

function updateAnimationControlState() {
    const animateBubbles = document.getElementById('animateBubbles');
    const bubbleSpeed = document.getElementById('bubbleSpeed');
    bubbleSpeed.disabled = !animateBubbles.checked;
}

// =============================================================================
// RENDERING
// =============================================================================

function ensureAnimationBuffer(width, height) {
    if (!animationBuffer) {
        animationBuffer = document.createElement('canvas');
    }
    animationBuffer.width = width;
    animationBuffer.height = height;
    animationBufferCtx = animationBuffer.getContext('2d');
}

function renderFrame() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    if (!animationBufferCtx) {
        ensureAnimationBuffer(canvas.width, canvas.height);
    }

    animationBufferCtx.clearRect(0, 0, canvas.width, canvas.height);

    for (const bubble of bubblesData) {
        animationBufferCtx.globalCompositeOperation = bubble.composite;
        animationBufferCtx.beginPath();
        animationBufferCtx.arc(bubble.cx, bubble.cy, bubble.radius, 0, Math.PI * 2);

        if (bubble.drawMode === 'filled') {
            animationBufferCtx.fillStyle = bubble.color;
            animationBufferCtx.fill();
        } else {
            animationBufferCtx.strokeStyle = bubble.color;
            animationBufferCtx.lineWidth = bubble.strokeWidth;
            animationBufferCtx.stroke();
        }
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = lastBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(animationBuffer, 0, 0);

    const now = performance.now();
    if (now - lastFaviconUpdate > 1000) {
        setFaviconFromCanvas(canvas);
        lastFaviconUpdate = now;
    }
}

function updatePositions(deltaSeconds) {
    const canvas = document.getElementById('canvas');
    const width = canvas.width;
    const height = canvas.height;

    for (const bubble of bubblesData) {
        if (!bubble.vx && !bubble.vy) continue;

        bubble.cx += bubble.vx * deltaSeconds;
        bubble.cy += bubble.vy * deltaSeconds;

        if (bubble.cx - bubble.radius <= 0) {
            bubble.cx = bubble.radius;
            bubble.vx = Math.abs(bubble.vx);
        } else if (bubble.cx + bubble.radius >= width) {
            bubble.cx = width - bubble.radius;
            bubble.vx = -Math.abs(bubble.vx);
        }

        if (bubble.cy - bubble.radius <= 0) {
            bubble.cy = bubble.radius;
            bubble.vy = Math.abs(bubble.vy);
        } else if (bubble.cy + bubble.radius >= height) {
            bubble.cy = height - bubble.radius;
            bubble.vy = -Math.abs(bubble.vy);
        }
    }
}

// =============================================================================
// ANIMATION
// =============================================================================

function animateFrame(timestamp) {
    if (!animationEnabled) return;

    if (!lastTimestamp) {
        lastTimestamp = timestamp;
    }

    const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
    updatePositions(deltaSeconds);
    renderFrame();

    lastTimestamp = timestamp;
    animationFrameId = requestAnimationFrame(animateFrame);
}

function startAnimation() {
    if (animationFrameId || !animationEnabled) return;
    lastTimestamp = 0;
    animationFrameId = requestAnimationFrame(animateFrame);
}

function stopAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    lastTimestamp = 0;
}

function applySpeedToBubbles(speed) {
    const safeSpeed = Math.max(0, speed || 0);
    for (const bubble of bubblesData) {
        const hasVelocity = bubble.vx || bubble.vy;
        const angle = hasVelocity ? Math.atan2(bubble.vy, bubble.vx) : random() * Math.PI * 2;
        bubble.vx = Math.cos(angle) * safeSpeed;
        bubble.vy = Math.sin(angle) * safeSpeed;
    }
}

// =============================================================================
// GENERATION
// =============================================================================

function generateArt(seed = null) {
    currentSeed = seed !== null ? seed : generateSeed();
    seedRng(currentSeed);

    const canvas = document.getElementById('canvas');

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const bubbleCount = parseInt(document.getElementById('bubbleCount').value);
    const minRadius = parseFloat(document.getElementById('minRadius').value);
    const maxRadius = parseFloat(document.getElementById('maxRadius').value);
    const bubbleStyle = document.getElementById('bubbleStyle').value;
    const strokeWidth = parseFloat(document.getElementById('strokeWidth').value);
    const overlapMode = document.getElementById('overlapMode').value;
    const backgroundColor = document.getElementById('backgroundColor').value;
    const animationSettings = getAnimationSettings();

    const colorScheme = getColorScheme();

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ensureAnimationBuffer(displayWidth, displayHeight);

    animationBufferCtx.globalCompositeOperation = 'source-over';
    bubblesData = [];
    let hasContent = false;
    stopAnimation();
    animationSpeed = animationSettings.speed;
    animationEnabled = animationSettings.enabled && animationSpeed > 0;

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

        hasContent = true;
        const angle = random() * Math.PI * 2;
        const vx = animationEnabled ? Math.cos(angle) * animationSpeed : 0;
        const vy = animationEnabled ? Math.sin(angle) * animationSpeed : 0;
        bubblesData.push({
            cx,
            cy,
            radius,
            color,
            drawMode,
            strokeWidth,
            operation,
            composite,
            vx,
            vy
        });
    }

    lastBackgroundColor = backgroundColor;
    renderFrame();

    if (animationEnabled) {
        startAnimation();
    }
}

// =============================================================================
// EXPORT
// =============================================================================

function downloadArt() {
    const canvas = document.getElementById('canvas');
    downloadCanvasAsPng(canvas, 'bubbles-art.png');
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
    downloadSvgContent(svgContent, 'bubbles-art.svg');
}

function handleShare() {
    shareArt(FORM_INPUT_IDS, currentSeed);
}

// =============================================================================
// INITIALIZATION
// =============================================================================

function bindControls() {
    const animateBubbles = document.getElementById('animateBubbles');
    const bubbleSpeed = document.getElementById('bubbleSpeed');

    document.getElementById('generateButton').addEventListener('click', () => generateArt());
    document.getElementById('downloadPngButton').addEventListener('click', downloadArt);
    document.getElementById('downloadSvgButton').addEventListener('click', downloadSVG);
    document.getElementById('shareButton').addEventListener('click', handleShare);

    animateBubbles.addEventListener('change', () => {
        updateAnimationControlState();
        const settings = getAnimationSettings();
        animationSpeed = settings.speed;
        animationEnabled = settings.enabled && animationSpeed > 0;

        if (settings.enabled) {
            applySpeedToBubbles(animationSpeed);
            if (animationEnabled) {
                startAnimation();
            } else {
                stopAnimation();
                renderFrame();
            }
        } else {
            animationEnabled = false;
            stopAnimation();
            renderFrame();
        }
    });

    bubbleSpeed.addEventListener('input', () => {
        if (!animateBubbles.checked) return;
        const settings = getAnimationSettings();
        animationSpeed = settings.speed;
        animationEnabled = settings.enabled && animationSpeed > 0;

        applySpeedToBubbles(animationSpeed);
        if (animationEnabled) {
            startAnimation();
        } else {
            stopAnimation();
            renderFrame();
        }
    });
}

window.addEventListener('load', () => {
    initGenerator({
        formInputIds: FORM_INPUT_IDS,
        generateFn: generateArt,
        downloadFns: { png: downloadArt, svg: downloadSVG },
        extraBindings: bindControls,
        onParamsLoaded: () => updateAnimationControlState()
    });
});
