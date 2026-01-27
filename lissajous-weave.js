let pathsData = [];
let lastBackgroundColor = '#0b1020';
let currentSeed = null;

const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'layers', 'pointsPerPath', 'aFrequency',
    'bFrequency', 'phase', 'phaseStep', 'amplitude', 'lineWidth',
    'backgroundColor'
];

function generateArt(seed = null) {
    currentSeed = seed !== null ? seed : generateSeed();
    seedRng(currentSeed);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const layers = parseInt(document.getElementById('layers').value);
    const pointsPerPath = parseInt(document.getElementById('pointsPerPath').value);
    const aFrequency = parseInt(document.getElementById('aFrequency').value);
    const bFrequency = parseInt(document.getElementById('bFrequency').value);
    const phase = parseFloat(document.getElementById('phase').value);
    const phaseStep = parseFloat(document.getElementById('phaseStep').value);
    const amplitudePercent = parseFloat(document.getElementById('amplitude').value);
    const lineWidth = parseFloat(document.getElementById('lineWidth').value);
    const backgroundColor = document.getElementById('backgroundColor').value;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    lastBackgroundColor = backgroundColor;

    const palette = getColorScheme();

    pathsData = [];

    const centerX = displayWidth / 2;
    const centerY = displayHeight / 2;
    const amplitude = Math.min(displayWidth, displayHeight) * (amplitudePercent / 100) / 2;

    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let i = 0; i < layers; i++) {
        const loopPhase = (phase + i * phaseStep) * (Math.PI / 180);
        const color = palette[i % palette.length];
        const points = [];

        for (let p = 0; p <= pointsPerPath; p++) {
            const t = (p / pointsPerPath) * Math.PI * 2;
            const x = centerX + amplitude * Math.sin(aFrequency * t + loopPhase);
            const y = centerY + amplitude * Math.sin(bFrequency * t);
            points.push({ x, y });
        }

        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let p = 1; p < points.length; p++) {
            ctx.lineTo(points[p].x, points[p].y);
        }
        ctx.stroke();

        pathsData.push({ color, lineWidth, points });
    }

    drawTextOverlays(ctx, displayWidth, displayHeight);
    setFaviconFromCanvas(canvas);
}

function downloadArt() {
    downloadCanvasAsPng(document.getElementById('canvas'), 'lissajous-weave-art.png');
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
        svgContent += `<path d="${d}" stroke="${path.color}" stroke-width="${path.lineWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>\n`;
    }

    svgContent += overlaySvg.content;
    svgContent += '</svg>';
    downloadSvgContent(svgContent, 'lissajous-weave-art.svg');
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
