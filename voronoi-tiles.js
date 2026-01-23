let tilesData = [];
let lastBackgroundColor = '#f8fafc';
let currentSeed = null;

const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'seedCount', 'cellSize', 'jitter',
    'showBorders', 'borderWidth', 'borderColor', 'backgroundColor'
];

function generateSeeds(count, width, height, jitter) {
    const seeds = [];
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < count; i++) {
        const randomX = random() * width;
        const randomY = random() * height;
        const x = centerX + (randomX - centerX) * jitter;
        const y = centerY + (randomY - centerY) * jitter;
        seeds.push({ x, y });
    }

    return seeds;
}

function findNearestSeed(seeds, x, y) {
    let nearestIndex = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < seeds.length; i++) {
        const dx = seeds[i].x - x;
        const dy = seeds[i].y - y;
        const dist = dx * dx + dy * dy;
        if (dist < nearestDist) {
            nearestDist = dist;
            nearestIndex = i;
        }
    }

    return nearestIndex;
}

function generateArt(seed = null) {
    currentSeed = seed !== null ? seed : generateSeed();
    seedRng(currentSeed);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const seedCount = parseInt(document.getElementById('seedCount').value);
    const cellSize = parseInt(document.getElementById('cellSize').value);
    const jitter = parseFloat(document.getElementById('jitter').value);
    const showBorders = document.getElementById('showBorders').checked;
    const borderWidth = parseFloat(document.getElementById('borderWidth').value);
    const borderColor = document.getElementById('borderColor').value;
    const backgroundColor = document.getElementById('backgroundColor').value;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    lastBackgroundColor = backgroundColor;

    const palette = getColorScheme();
    const seeds = generateSeeds(seedCount, displayWidth, displayHeight, jitter);
    const tileCols = Math.ceil(displayWidth / cellSize);
    const tileRows = Math.ceil(displayHeight / cellSize);

    tilesData = [];

    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = borderColor;

    for (let col = 0; col < tileCols; col++) {
        for (let row = 0; row < tileRows; row++) {
            const x = col * cellSize;
            const y = row * cellSize;
            const centerX = x + cellSize / 2;
            const centerY = y + cellSize / 2;
            const seedIndex = findNearestSeed(seeds, centerX, centerY);
            const color = palette[seedIndex % palette.length];
            const width = Math.min(cellSize, displayWidth - x);
            const height = Math.min(cellSize, displayHeight - y);

            ctx.fillStyle = color;
            ctx.fillRect(x, y, width, height);

            if (showBorders && borderWidth > 0) {
                ctx.strokeRect(x, y, width, height);
            }

            tilesData.push({ x, y, width, height, color });
        }
    }

    setFaviconFromCanvas(canvas);
}

function downloadArt() {
    downloadCanvasAsPng(document.getElementById('canvas'), 'voronoi-tiles-art.png');
}

function downloadSVG() {
    if (tilesData.length === 0) {
        generateArt();
    }

    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const showBorders = document.getElementById('showBorders').checked;
    const borderWidth = parseFloat(document.getElementById('borderWidth').value);
    const borderColor = document.getElementById('borderColor').value;

    let svgContent = `<?xml version="1.0" encoding="utf-8" ?>\n`;
    svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}">\n`;
    svgContent += `<rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" fill="${lastBackgroundColor}"/>\n`;

    for (const tile of tilesData) {
        const stroke = showBorders && borderWidth > 0 ? borderColor : 'none';
        const strokeWidth = showBorders && borderWidth > 0 ? borderWidth : 0;
        svgContent += `<rect x="${tile.x}" y="${tile.y}" width="${tile.width}" height="${tile.height}" fill="${tile.color}" stroke="${stroke}" stroke-width="${strokeWidth}"/>\n`;
    }

    svgContent += '</svg>';
    downloadSvgContent(svgContent, 'voronoi-tiles-art.svg');
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
