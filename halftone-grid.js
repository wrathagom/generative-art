let dotsData = [];
let lastBackgroundColor = '#0f172a';
let currentSeed = null;

const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'spacing', 'minRadius', 'maxRadius',
    'noiseScale', 'patternMode', 'dotShape', 'backgroundColor'
];

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function normalizeValue(value) {
    return clamp((value + 1) / 2, 0, 1);
}

function generateArt(seed = null) {
    currentSeed = seed !== null ? seed : generateSeed();
    seedRng(currentSeed);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const spacing = parseInt(document.getElementById('spacing').value);
    const minRadius = parseFloat(document.getElementById('minRadius').value);
    const maxRadius = parseFloat(document.getElementById('maxRadius').value);
    const noiseScale = parseFloat(document.getElementById('noiseScale').value);
    const patternMode = document.getElementById('patternMode').value;
    const dotShape = document.getElementById('dotShape').value;
    const backgroundColor = document.getElementById('backgroundColor').value;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    lastBackgroundColor = backgroundColor;

    const palette = getColorScheme();
    const offsetA = random() * Math.PI * 2;
    const offsetB = random() * Math.PI * 2;
    const offsetC = random() * Math.PI * 2;

    dotsData = [];

    const centerX = displayWidth / 2;
    const centerY = displayHeight / 2;
    const maxDistance = Math.hypot(centerX, centerY);

    for (let x = spacing / 2; x < displayWidth; x += spacing) {
        for (let y = spacing / 2; y < displayHeight; y += spacing) {
            let value = 0;

            if (patternMode === 'radial') {
                const distance = Math.hypot(x - centerX, y - centerY);
                value = clamp(1 - distance / maxDistance, 0, 1);
            } else if (patternMode === 'wave') {
                const wave = Math.sin(x * noiseScale * 3 + offsetA) + Math.cos(y * noiseScale * 3 + offsetB);
                value = normalizeValue(wave / 2);
            } else {
                const noise = Math.sin(x * noiseScale + offsetA) + Math.cos(y * noiseScale + offsetB) + Math.sin((x + y) * noiseScale * 0.7 + offsetC);
                value = normalizeValue(noise / 3);
            }

            const radius = minRadius + value * (maxRadius - minRadius);
            const colorIndex = Math.floor(value * (palette.length - 1));
            const color = palette[clamp(colorIndex, 0, palette.length - 1)];

            if (dotShape === 'square') {
                const size = radius * 2;
                ctx.fillStyle = color;
                ctx.fillRect(x - radius, y - radius, size, size);
                dotsData.push({ x, y, radius, color, shape: 'square' });
            } else {
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                dotsData.push({ x, y, radius, color, shape: 'circle' });
            }
        }
    }

    drawTextOverlays(ctx, displayWidth, displayHeight);
    setFaviconFromCanvas(canvas);
}

function downloadArt() {
    downloadCanvasAsPng(document.getElementById('canvas'), 'halftone-grid-art.png');
}

function downloadSVG() {
    if (dotsData.length === 0) {
        generateArt();
    }

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const overlaySvg = buildTextOverlaySvg(displayWidth, displayHeight);

    let svgContent = `<?xml version="1.0" encoding="utf-8" ?>\n`;
    svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}">\n`;
    svgContent += `<rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" fill="${lastBackgroundColor}"/>\n`;
    svgContent += overlaySvg.defs;

    for (const dot of dotsData) {
        if (dot.shape === 'square') {
            const size = dot.radius * 2;
            svgContent += `<rect x="${(dot.x - dot.radius).toFixed(2)}" y="${(dot.y - dot.radius).toFixed(2)}" width="${size.toFixed(2)}" height="${size.toFixed(2)}" fill="${dot.color}"/>\n`;
        } else {
            svgContent += `<circle cx="${dot.x.toFixed(2)}" cy="${dot.y.toFixed(2)}" r="${dot.radius.toFixed(2)}" fill="${dot.color}"/>\n`;
        }
    }

    svgContent += overlaySvg.content;
    svgContent += '</svg>';
    downloadSvgContent(svgContent, 'halftone-grid-art.svg');
}

function handleShare() {
    shareArt(FORM_INPUT_IDS, currentSeed);
}

function bindControls() {
    document.getElementById('generateButton').addEventListener('click', () => generateArt());
    document.getElementById('downloadPngButton').addEventListener('click', downloadArt);
    document.getElementById('downloadSvgButton').addEventListener('click', downloadSVG);
    document.getElementById('shareButton').addEventListener('click', handleShare);
}

window.addEventListener('load', () => {
    initGenerator({
        formInputIds: FORM_INPUT_IDS,
        generateFn: generateArt,
        downloadFns: { png: downloadArt, svg: downloadSVG },
        extraBindings: bindControls
    });
});
