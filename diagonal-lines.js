// Store the tracking grid and line data for SVG export
let trackingGrid = [];
let linesData = [];
let diamondsData = [];
let pathData = [];
let currentSeed = null;

// Form input IDs for serialization
const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'gridSize', 'strokeWidth', 'fillSquares',
    'showPathfinders', 'pathfinderMode', 'pathfinderColor', 'pathfinderStyle',
    'pathfinderWidth', 'pathfinderMinLength'
];

function triangleForSide(orientation, side) {
    if (orientation === 0) {
        if (side === 'top' || side === 'left') {
            return 0;
        }
        return 1;
    }

    if (side === 'bottom' || side === 'left') {
        return 0;
    }
    return 1;
}

function nodeId(x, y, triangle, yGridCount) {
    return (x * yGridCount + y) * 2 + triangle;
}

function nodeFromId(id, yGridCount) {
    const cell = Math.floor(id / 2);
    const triangle = id % 2;
    const x = Math.floor(cell / yGridCount);
    const y = cell % yGridCount;
    return { x, y, triangle };
}

function triangleCenter(x, y, triangle, orientation, gridSize) {
    const x0 = x * gridSize;
    const y0 = y * gridSize;
    const x1 = x0 + gridSize;
    const y1 = y0 + gridSize;

    if (orientation === 0) {
        if (triangle === 0) {
            return { x: (2 * x0 + x1) / 3, y: (2 * y0 + y1) / 3 };
        }
        return { x: (2 * x1 + x0) / 3, y: (y0 + 2 * y1) / 3 };
    }

    if (triangle === 0) {
        return { x: (2 * x0 + x1) / 3, y: (y0 + 2 * y1) / 3 };
    }
    return { x: (x0 + 2 * x1) / 3, y: (2 * y0 + y1) / 3 };
}

function buildNeighbors(xGridCount, yGridCount) {
    const totalNodes = xGridCount * yGridCount * 2;
    const neighbors = Array.from({ length: totalNodes }, () => []);

    for (let x = 0; x < xGridCount; x++) {
        for (let y = 0; y < yGridCount; y++) {
            const orientation = trackingGrid[x][y];

            if (y > 0) {
                const currentTriangle = triangleForSide(orientation, 'top');
                const neighborTriangle = triangleForSide(trackingGrid[x][y - 1], 'bottom');
                const currentId = nodeId(x, y, currentTriangle, yGridCount);
                const neighborId = nodeId(x, y - 1, neighborTriangle, yGridCount);
                neighbors[currentId].push(neighborId);
                neighbors[neighborId].push(currentId);
            }

            if (y < yGridCount - 1) {
                const currentTriangle = triangleForSide(orientation, 'bottom');
                const neighborTriangle = triangleForSide(trackingGrid[x][y + 1], 'top');
                const currentId = nodeId(x, y, currentTriangle, yGridCount);
                const neighborId = nodeId(x, y + 1, neighborTriangle, yGridCount);
                neighbors[currentId].push(neighborId);
                neighbors[neighborId].push(currentId);
            }

            if (x > 0) {
                const currentTriangle = triangleForSide(orientation, 'left');
                const neighborTriangle = triangleForSide(trackingGrid[x - 1][y], 'right');
                const currentId = nodeId(x, y, currentTriangle, yGridCount);
                const neighborId = nodeId(x - 1, y, neighborTriangle, yGridCount);
                neighbors[currentId].push(neighborId);
                neighbors[neighborId].push(currentId);
            }

            if (x < xGridCount - 1) {
                const currentTriangle = triangleForSide(orientation, 'right');
                const neighborTriangle = triangleForSide(trackingGrid[x + 1][y], 'left');
                const currentId = nodeId(x, y, currentTriangle, yGridCount);
                const neighborId = nodeId(x + 1, y, neighborTriangle, yGridCount);
                neighbors[currentId].push(neighborId);
                neighbors[neighborId].push(currentId);
            }
        }
    }

    return neighbors;
}

function getBoundaryNodes(xGridCount, yGridCount) {
    const boundaryNodes = new Set();

    for (let x = 0; x < xGridCount; x++) {
        const topTriangle = triangleForSide(trackingGrid[x][0], 'top');
        boundaryNodes.add(nodeId(x, 0, topTriangle, yGridCount));

        const bottomTriangle = triangleForSide(trackingGrid[x][yGridCount - 1], 'bottom');
        boundaryNodes.add(nodeId(x, yGridCount - 1, bottomTriangle, yGridCount));
    }

    for (let y = 0; y < yGridCount; y++) {
        const leftTriangle = triangleForSide(trackingGrid[0][y], 'left');
        boundaryNodes.add(nodeId(0, y, leftTriangle, yGridCount));

        const rightTriangle = triangleForSide(trackingGrid[xGridCount - 1][y], 'right');
        boundaryNodes.add(nodeId(xGridCount - 1, y, rightTriangle, yGridCount));
    }

    return Array.from(boundaryNodes);
}

function findLongestPathFrom(startId, neighbors) {
    const totalNodes = neighbors.length;
    const distance = Array(totalNodes).fill(-1);
    const previous = Array(totalNodes).fill(-1);
    const queue = [startId];
    distance[startId] = 0;

    for (let i = 0; i < queue.length; i++) {
        const current = queue[i];
        for (const neighbor of neighbors[current]) {
            if (distance[neighbor] === -1) {
                distance[neighbor] = distance[current] + 1;
                previous[neighbor] = current;
                queue.push(neighbor);
            }
        }
    }

    let farthestId = startId;
    let maxDistance = 0;
    for (let i = 0; i < totalNodes; i++) {
        if (distance[i] > maxDistance) {
            maxDistance = distance[i];
            farthestId = i;
        }
    }

    const path = [];
    let current = farthestId;
    while (current !== -1) {
        path.push(current);
        current = previous[current];
    }
    path.reverse();

    return { path, length: maxDistance };
}

function drawPaths(ctx, paths, color, width, gridSize, yGridCount, style) {
    pathData = [];

    for (const entry of paths) {
        if (entry.path.length < 2) {
            continue;
        }

        const points = entry.path.map((id) => {
            const node = nodeFromId(id, yGridCount);
            const orientation = trackingGrid[node.x][node.y];
            return triangleCenter(node.x, node.y, node.triangle, orientation, gridSize);
        });

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        if (style === 'smooth' && points.length > 2) {
            for (let i = 0; i < points.length - 1; i++) {
                const current = points[i];
                const next = points[i + 1];
                const midX = (current.x + next.x) / 2;
                const midY = (current.y + next.y) / 2;
                if (i === 0) {
                    ctx.quadraticCurveTo(current.x, current.y, midX, midY);
                } else {
                    ctx.quadraticCurveTo(current.x, current.y, midX, midY);
                }
            }
            ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        } else {
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();

        pathData.push({ points, color, width, style });
    }
}

function generateArt(seed = null) {
    // Set up seeded RNG
    currentSeed = seed !== null ? seed : generateSeed();
    seedRng(currentSeed);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Get parameters from form
    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const gridSize = parseInt(document.getElementById('gridSize').value);
    const strokeWidth = parseInt(document.getElementById('strokeWidth').value);
    const fillSquares = document.getElementById('fillSquares').checked;

    // Set canvas size
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Calculate grid dimensions
    const xGridCount = Math.floor(displayWidth / gridSize);
    const yGridCount = Math.floor(displayHeight / gridSize);

    // Initialize tracking grid (0 = /, 1 = \)
    trackingGrid = Array(xGridCount).fill(null).map(() => Array(yGridCount).fill(0));
    linesData = [];
    diamondsData = [];

    // Draw background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Generate diagonal lines
    for (let xGrid = 0; xGrid < xGridCount; xGrid++) {
        for (let yGrid = 0; yGrid < yGridCount; yGrid++) {
            const minX = gridSize * xGrid - (0.35 * strokeWidth);
            const minY = gridSize * yGrid - (0.35 * strokeWidth);
            const maxX = gridSize * (xGrid + 1) + (0.35 * strokeWidth);
            const maxY = gridSize * (yGrid + 1) + (0.35 * strokeWidth);

            const orientation = randint(1, 2);

            if (orientation === 1) {
                // / (forward slash)
                ctx.beginPath();
                ctx.moveTo(minX, maxY);
                ctx.lineTo(maxX, minY);
                ctx.strokeStyle = 'black';
                ctx.lineWidth = strokeWidth;
                ctx.stroke();

                trackingGrid[xGrid][yGrid] = 0;
                linesData.push({ x1: minX, y1: maxY, x2: maxX, y2: minY });
            } else {
                // \ (backslash)
                ctx.beginPath();
                ctx.moveTo(minX, minY);
                ctx.lineTo(maxX, maxY);
                ctx.strokeStyle = 'black';
                ctx.lineWidth = strokeWidth;
                ctx.stroke();

                trackingGrid[xGrid][yGrid] = 1;
                linesData.push({ x1: minX, y1: minY, x2: maxX, y2: maxY });
            }
        }
    }

    // Fill diamond patterns if enabled
    if (fillSquares) {
        // Look for pattern [[0,1],[1,0]] which creates diamonds
        for (let xGrid = 0; xGrid < xGridCount - 1; xGrid++) {
            for (let yGrid = 0; yGrid < yGridCount - 1; yGrid++) {
                // Check for the diamond pattern
                const topLeft = trackingGrid[xGrid][yGrid];
                const topRight = trackingGrid[xGrid + 1][yGrid];
                const bottomLeft = trackingGrid[xGrid][yGrid + 1];
                const bottomRight = trackingGrid[xGrid + 1][yGrid + 1];

                // Pattern: top-left=0, top-right=1, bottom-left=1, bottom-right=0
                if (topLeft === 0 && topRight === 1 && bottomLeft === 1 && bottomRight === 0) {
                    // Draw a diamond
                    const points = [
                        { x: (xGrid + 1) * gridSize, y: yGrid * gridSize },
                        { x: (xGrid + 2) * gridSize, y: (yGrid + 1) * gridSize },
                        { x: (xGrid + 1) * gridSize, y: (yGrid + 2) * gridSize },
                        { x: xGrid * gridSize, y: (yGrid + 1) * gridSize }
                    ];

                    ctx.beginPath();
                    ctx.moveTo(points[0].x, points[0].y);
                    ctx.lineTo(points[1].x, points[1].y);
                    ctx.lineTo(points[2].x, points[2].y);
                    ctx.lineTo(points[3].x, points[3].y);
                    ctx.closePath();
                    ctx.fillStyle = 'black';
                    ctx.fill();
                    ctx.strokeStyle = 'black';
                    ctx.stroke();

                    diamondsData.push(points);
                }
            }
        }
    }

    // Generate pathfinders if enabled
    const showPathfinders = document.getElementById('showPathfinders').checked;
    if (showPathfinders) {
        const pathfinderMode = document.getElementById('pathfinderMode').value;
        const pathfinderColor = document.getElementById('pathfinderColor').value;
        const pathfinderWidth = parseFloat(document.getElementById('pathfinderWidth').value);
        const pathfinderStyle = document.getElementById('pathfinderStyle').value;
        const pathfinderMinLength = parseInt(document.getElementById('pathfinderMinLength').value);

        const neighbors = buildNeighbors(xGridCount, yGridCount);
        const boundaryNodes = getBoundaryNodes(xGridCount, yGridCount);
        const paths = boundaryNodes
            .map((node) => findLongestPathFrom(node, neighbors))
            .filter((entry) => entry.length >= pathfinderMinLength);

        let pathsToDraw = paths;
        if (pathfinderMode === 'longest') {
            let longest = null;
            for (const entry of paths) {
                if (!longest || entry.length > longest.length) {
                    longest = entry;
                }
            }
            pathsToDraw = longest ? [longest] : [];
        }

        drawPaths(ctx, pathsToDraw, pathfinderColor, pathfinderWidth, gridSize, yGridCount, pathfinderStyle);
    } else {
        pathData = [];
    }

    setFaviconFromCanvas(canvas);
}

function downloadArt() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.download = 'diagonal-lines-art.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function downloadSVG() {
    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const strokeWidth = parseInt(document.getElementById('strokeWidth').value);

    // Build SVG
    let svgContent = `<?xml version="1.0" encoding="utf-8" ?>
<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}">
<rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" fill="#FFFFFF"/>
`;

    // Add lines
    for (const line of linesData) {
        svgContent += `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="black" stroke-width="${strokeWidth}" fill="none"/>\n`;
    }

    // Add diamonds
    for (const diamond of diamondsData) {
        const points = diamond.map(p => `${p.x},${p.y}`).join(' ');
        svgContent += `<polygon points="${points}" fill="black" stroke="black"/>\n`;
    }

    // Add paths
    for (const path of pathData) {
        if (path.points.length < 2) {
            continue;
        }
        let pathString = `M ${path.points[0].x} ${path.points[0].y} `;
        if (path.style === 'smooth' && path.points.length > 2) {
            for (let i = 0; i < path.points.length - 1; i++) {
                const current = path.points[i];
                const next = path.points[i + 1];
                const midX = (current.x + next.x) / 2;
                const midY = (current.y + next.y) / 2;
                pathString += `Q ${current.x} ${current.y} ${midX} ${midY} `;
            }
            const last = path.points[path.points.length - 1];
            pathString += `L ${last.x} ${last.y} `;
        } else {
            for (let i = 1; i < path.points.length; i++) {
                pathString += `L ${path.points[i].x} ${path.points[i].y} `;
            }
        }
        svgContent += `<path d="${pathString.trim()}" stroke="${path.color}" stroke-width="${path.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>\n`;
    }

    svgContent += '</svg>';

    // Download
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = 'diagonal-lines-art.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
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

// Generate on page load
function bindControls() {
    const generateButton = document.getElementById('generateButton');
    const downloadPngButton = document.getElementById('downloadPngButton');
    const downloadSvgButton = document.getElementById('downloadSvgButton');
    const shareButton = document.getElementById('shareButton');

    generateButton.addEventListener('click', () => generateArt());
    downloadPngButton.addEventListener('click', downloadArt);
    downloadSvgButton.addEventListener('click', downloadSVG);
    shareButton.addEventListener('click', shareArt);
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
