let linesData = [];
let lastBackgroundColor = '#0f172a';
let currentSeed = null;

const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'wedgeCount', 'strokeCount', 'lineWidth',
    'lineOpacity', 'mirrorWedges', 'backgroundColor'
];

function polarPoint(radius, angle) {
    return {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle)
    };
}

function transformPoint(point, angle, mirror, centerX, centerY) {
    const x = point.x;
    const y = mirror ? -point.y : point.y;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return {
        x: centerX + x * cosA - y * sinA,
        y: centerY + x * sinA + y * cosA
    };
}

function generateArt(seed = null) {
    currentSeed = seed !== null ? seed : generateSeed();
    seedRng(currentSeed);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const wedgeCount = parseInt(document.getElementById('wedgeCount').value);
    const strokeCount = parseInt(document.getElementById('strokeCount').value);
    const lineWidth = parseFloat(document.getElementById('lineWidth').value);
    const lineOpacity = parseFloat(document.getElementById('lineOpacity').value);
    const mirrorWedges = document.getElementById('mirrorWedges').checked;
    const backgroundColor = document.getElementById('backgroundColor').value;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    lastBackgroundColor = backgroundColor;

    const palette = getColorScheme();

    linesData = [];

    const centerX = displayWidth / 2;
    const centerY = displayHeight / 2;
    const maxRadius = Math.min(displayWidth, displayHeight) * 0.48;
    const wedgeAngle = (Math.PI * 2) / wedgeCount;

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.globalAlpha = lineOpacity;

    for (let i = 0; i < strokeCount; i++) {
        const r1 = Math.sqrt(random()) * maxRadius;
        const r2 = Math.sqrt(random()) * maxRadius;
        const a1 = random() * wedgeAngle;
        const a2 = random() * wedgeAngle;
        const baseStart = polarPoint(r1, a1);
        const baseEnd = polarPoint(r2, a2);
        const color = palette[randint(0, palette.length - 1)];

        ctx.strokeStyle = color;

        for (let w = 0; w < wedgeCount; w++) {
            const angle = wedgeAngle * w;
            const mirror = mirrorWedges && w % 2 === 1;

            const start = transformPoint(baseStart, angle, mirror, centerX, centerY);
            const end = transformPoint(baseEnd, angle, mirror, centerX, centerY);

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            linesData.push({
                x1: start.x, y1: start.y, x2: end.x, y2: end.y,
                color, lineWidth, opacity: lineOpacity
            });
        }
    }

    ctx.globalAlpha = 1;
    setFaviconFromCanvas(canvas);
}

function downloadArt() {
    downloadCanvasAsPng(document.getElementById('canvas'), 'kaleidoscope-art.png');
}

function downloadSVG() {
    if (linesData.length === 0) {
        generateArt();
    }

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);

    let svgContent = `<?xml version="1.0" encoding="utf-8" ?>\n`;
    svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}">\n`;
    svgContent += `<rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" fill="${lastBackgroundColor}"/>\n`;

    for (const line of linesData) {
        svgContent += `<line x1="${line.x1.toFixed(2)}" y1="${line.y1.toFixed(2)}" x2="${line.x2.toFixed(2)}" y2="${line.y2.toFixed(2)}" stroke="${line.color}" stroke-width="${line.lineWidth}" stroke-opacity="${line.opacity}" stroke-linecap="round"/>\n`;
    }

    svgContent += '</svg>';
    downloadSvgContent(svgContent, 'kaleidoscope-art.svg');
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
