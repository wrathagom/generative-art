let circlesData = [];
let lastBackgroundColor = '#f8fafc';
let currentSeed = null;

const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'maxCircles', 'maxAttempts', 'minRadius',
    'maxRadius', 'padding', 'fillOpacity', 'showStroke', 'strokeWidth',
    'strokeColor', 'backgroundColor'
];

function canPlaceCircle(x, y, radius, circles, padding, width, height) {
    if (x - radius - padding < 0 || x + radius + padding > width) {
        return false;
    }
    if (y - radius - padding < 0 || y + radius + padding > height) {
        return false;
    }

    for (const circle of circles) {
        const dx = x - circle.x;
        const dy = y - circle.y;
        const minDist = radius + circle.radius + padding;
        if (dx * dx + dy * dy < minDist * minDist) {
            return false;
        }
    }

    return true;
}

function generateArt(seed = null) {
    currentSeed = seed !== null ? seed : generateSeed();
    seedRng(currentSeed);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const maxCircles = parseInt(document.getElementById('maxCircles').value);
    const maxAttempts = parseInt(document.getElementById('maxAttempts').value);
    const minRadius = parseFloat(document.getElementById('minRadius').value);
    const maxRadius = parseFloat(document.getElementById('maxRadius').value);
    const padding = parseFloat(document.getElementById('padding').value);
    const fillOpacity = parseFloat(document.getElementById('fillOpacity').value);
    const showStroke = document.getElementById('showStroke').checked;
    const strokeWidth = parseFloat(document.getElementById('strokeWidth').value);
    const strokeColor = document.getElementById('strokeColor').value;
    const backgroundColor = document.getElementById('backgroundColor').value;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    lastBackgroundColor = backgroundColor;

    const palette = getColorScheme();

    circlesData = [];

    for (let attempt = 0; attempt < maxAttempts && circlesData.length < maxCircles; attempt++) {
        const x = random() * displayWidth;
        const y = random() * displayHeight;

        if (!canPlaceCircle(x, y, minRadius, circlesData, padding, displayWidth, displayHeight)) {
            continue;
        }

        let radius = minRadius;
        while (radius < maxRadius) {
            if (canPlaceCircle(x, y, radius + 1, circlesData, padding, displayWidth, displayHeight)) {
                radius += 1;
            } else {
                break;
            }
        }

        const color = palette[randint(0, palette.length - 1)];
        circlesData.push({
            x, y, radius, color,
            opacity: fillOpacity,
            strokeColor,
            strokeWidth: showStroke ? strokeWidth : 0
        });
    }

    ctx.globalAlpha = fillOpacity;
    for (const circle of circlesData) {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fillStyle = circle.color;
        ctx.fill();

        if (showStroke && strokeWidth > 0) {
            ctx.globalAlpha = 1;
            ctx.lineWidth = strokeWidth;
            ctx.strokeStyle = strokeColor;
            ctx.stroke();
            ctx.globalAlpha = fillOpacity;
        }
    }

    ctx.globalAlpha = 1;
    setFaviconFromCanvas(canvas);
}

function downloadArt() {
    downloadCanvasAsPng(document.getElementById('canvas'), 'circle-packing-art.png');
}

function downloadSVG() {
    if (circlesData.length === 0) {
        generateArt();
    }

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);

    let svgContent = `<?xml version="1.0" encoding="utf-8" ?>\n`;
    svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}">\n`;
    svgContent += `<rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" fill="${lastBackgroundColor}"/>\n`;

    for (const circle of circlesData) {
        const stroke = circle.strokeWidth > 0 ? circle.strokeColor : 'none';
        const strokeWidth = circle.strokeWidth > 0 ? circle.strokeWidth : 0;
        svgContent += `<circle cx="${circle.x.toFixed(2)}" cy="${circle.y.toFixed(2)}" r="${circle.radius.toFixed(2)}" fill="${circle.color}" fill-opacity="${circle.opacity}" stroke="${stroke}" stroke-width="${strokeWidth}"/>\n`;
    }

    svgContent += '</svg>';
    downloadSvgContent(svgContent, 'circle-packing-art.svg');
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
