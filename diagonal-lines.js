let trackingGrid = [];
let linesData = [];
let diamondsData = [];
let pathData = [];
let currentSeed = null;
let animationId = null;
let animationState = null;

const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', 'gridSize', 'strokeWidth', 'fillSquares',
    'showPathfinders', 'pathfinderMode', 'pathfinderColor', 'pathfinderStyle',
    'pathfinderWidth', 'pathfinderMinLength', 'backgroundColor', 'lineColor',
    'fillColor', 'lineJitter', 'lineGlow', 'lineBias', 'animationMode',
    'animationSpeed', 'exportDuration'
];

// =============================================================================
// PATHFINDER HELPERS
// =============================================================================

function triangleForSide(orientation, side) {
    if (orientation === 0) {
        return (side === 'top' || side === 'left') ? 0 : 1;
    }
    return (side === 'bottom' || side === 'left') ? 0 : 1;
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
        if (entry.path.length < 2) continue;

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
                ctx.quadraticCurveTo(current.x, current.y, midX, midY);
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
    const showPathfinders = document.getElementById('showPathfinders').checked;

    if (animationMode === 'none' || !showPathfinders) {
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
    if (mode === 'longestPath') {
        animateLongestPath();
    } else if (mode === 'elimination') {
        animateElimination();
    }
}

function drawBaseGrid(ctx, settings) {
    const { displayWidth, displayHeight, backgroundColor, lineColor, fillColor, strokeWidth, lineGlow } = settings;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    ctx.shadowColor = lineColor;
    ctx.shadowBlur = lineGlow;

    for (const line of linesData) {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
    }

    ctx.shadowBlur = 0;

    for (const diamond of diamondsData) {
        ctx.beginPath();
        ctx.moveTo(diamond[0].x, diamond[0].y);
        ctx.lineTo(diamond[1].x, diamond[1].y);
        ctx.lineTo(diamond[2].x, diamond[2].y);
        ctx.lineTo(diamond[3].x, diamond[3].y);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = lineColor;
        ctx.stroke();
    }
}

function drawPathPartial(ctx, points, endIndex, color, width, style) {
    if (endIndex < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    if (style === 'smooth' && endIndex > 2) {
        for (let i = 0; i < endIndex - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            const midX = (current.x + next.x) / 2;
            const midY = (current.y + next.y) / 2;
            ctx.quadraticCurveTo(current.x, current.y, midX, midY);
        }
        ctx.lineTo(points[endIndex - 1].x, points[endIndex - 1].y);
    } else {
        for (let i = 1; i < endIndex; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
}

function animateLongestPath() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const { longestPath, settings } = animationState;
    const frameDelay = 1000 / settings.animationSpeed;
    let lastFrameTime = 0;

    function frame(timestamp) {
        if (timestamp - lastFrameTime < frameDelay) {
            animationId = requestAnimationFrame(frame);
            return;
        }
        lastFrameTime = timestamp;

        drawBaseGrid(ctx, settings);

        const endIndex = Math.min(animationState.currentStep + 2, longestPath.points.length);
        drawPathPartial(ctx, longestPath.points, endIndex, settings.pathfinderColor, settings.pathfinderWidth, settings.pathfinderStyle);

        animationState.currentStep++;

        if (animationState.currentStep >= longestPath.points.length - 1) {
            animationState.currentStep = 0;
        }

        setFaviconFromCanvas(canvas);
        animationId = requestAnimationFrame(frame);
    }

    animationId = requestAnimationFrame(frame);
}

function animateElimination() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const { allPaths, longestPath, settings } = animationState;
    const frameDelay = 1000 / settings.animationSpeed;
    let lastFrameTime = 0;

    function frame(timestamp) {
        if (timestamp - lastFrameTime < frameDelay) {
            animationId = requestAnimationFrame(frame);
            return;
        }
        lastFrameTime = timestamp;

        drawBaseGrid(ctx, settings);

        let allComplete = true;
        const longestLength = longestPath.points.length;

        for (const pathEntry of allPaths) {
            const points = pathEntry.points;
            const pathLength = points.length;
            const endIndex = Math.min(animationState.globalStep + 2, pathLength);

            if (endIndex < pathLength) {
                allComplete = false;
            }

            // Calculate opacity: fade out shorter paths once they're complete
            let opacity = 1;
            if (endIndex >= pathLength && pathLength < longestLength) {
                // Path is complete and not the longest - fade it out
                const fadeSteps = 30;
                const stepsAfterComplete = animationState.globalStep - (pathLength - 2);
                opacity = Math.max(0, 1 - stepsAfterComplete / fadeSteps);
            }

            if (opacity > 0) {
                ctx.globalAlpha = opacity;
                drawPathPartial(ctx, points, endIndex, settings.pathfinderColor, settings.pathfinderWidth, settings.pathfinderStyle);
            }
        }

        ctx.globalAlpha = 1;
        animationState.globalStep++;

        // Reset when longest path is fully drawn and others have faded
        if (allComplete && animationState.globalStep > longestLength + 60) {
            animationState.globalStep = 0;
        }

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
    const gridSize = parseInt(document.getElementById('gridSize').value);
    const strokeWidth = parseInt(document.getElementById('strokeWidth').value);
    const fillSquares = document.getElementById('fillSquares').checked;
    const backgroundColor = document.getElementById('backgroundColor').value;
    const lineColor = document.getElementById('lineColor').value;
    const fillColor = document.getElementById('fillColor').value;
    const lineJitter = parseFloat(document.getElementById('lineJitter').value) || 0;
    const lineGlow = parseFloat(document.getElementById('lineGlow').value) || 0;
    const lineBias = parseFloat(document.getElementById('lineBias').value);
    const slashProbability = Number.isFinite(lineBias) ? Math.min(Math.max(lineBias, 0), 100) / 100 : 0.5;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    const xGridCount = Math.floor(displayWidth / gridSize);
    const yGridCount = Math.floor(displayHeight / gridSize);

    trackingGrid = Array(xGridCount).fill(null).map(() => Array(yGridCount).fill(0));
    linesData = [];
    diamondsData = [];

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    ctx.shadowColor = lineColor;
    ctx.shadowBlur = lineGlow;

    for (let xGrid = 0; xGrid < xGridCount; xGrid++) {
        for (let yGrid = 0; yGrid < yGridCount; yGrid++) {
            const minX = gridSize * xGrid - (0.35 * strokeWidth);
            const minY = gridSize * yGrid - (0.35 * strokeWidth);
            const maxX = gridSize * (xGrid + 1) + (0.35 * strokeWidth);
            const maxY = gridSize * (yGrid + 1) + (0.35 * strokeWidth);

            const orientation = random() < slashProbability ? 1 : 2;
            const jitterX1 = (random() * 2 - 1) * lineJitter;
            const jitterY1 = (random() * 2 - 1) * lineJitter;
            const jitterX2 = (random() * 2 - 1) * lineJitter;
            const jitterY2 = (random() * 2 - 1) * lineJitter;

            if (orientation === 1) {
                ctx.beginPath();
                ctx.moveTo(minX + jitterX1, maxY + jitterY1);
                ctx.lineTo(maxX + jitterX2, minY + jitterY2);
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = strokeWidth;
                ctx.stroke();

                trackingGrid[xGrid][yGrid] = 0;
                linesData.push({ x1: minX + jitterX1, y1: maxY + jitterY1, x2: maxX + jitterX2, y2: minY + jitterY2 });
            } else {
                ctx.beginPath();
                ctx.moveTo(minX + jitterX1, minY + jitterY1);
                ctx.lineTo(maxX + jitterX2, maxY + jitterY2);
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = strokeWidth;
                ctx.stroke();

                trackingGrid[xGrid][yGrid] = 1;
                linesData.push({ x1: minX + jitterX1, y1: minY + jitterY1, x2: maxX + jitterX2, y2: maxY + jitterY2 });
            }
        }
    }

    ctx.shadowBlur = 0;

    if (fillSquares) {
        for (let xGrid = 0; xGrid < xGridCount - 1; xGrid++) {
            for (let yGrid = 0; yGrid < yGridCount - 1; yGrid++) {
                const topLeft = trackingGrid[xGrid][yGrid];
                const topRight = trackingGrid[xGrid + 1][yGrid];
                const bottomLeft = trackingGrid[xGrid][yGrid + 1];
                const bottomRight = trackingGrid[xGrid + 1][yGrid + 1];

                if (topLeft === 0 && topRight === 1 && bottomLeft === 1 && bottomRight === 0) {
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
                    ctx.fillStyle = fillColor;
                    ctx.fill();
                    ctx.strokeStyle = lineColor;
                    ctx.stroke();

                    diamondsData.push(points);
                }
            }
        }
    }

    const showPathfinders = document.getElementById('showPathfinders').checked;
    const animationMode = document.getElementById('animationMode').value;
    const animationSpeed = parseInt(document.getElementById('animationSpeed').value) || 30;
    const pathfinderMode = document.getElementById('pathfinderMode').value;
    const pathfinderColor = document.getElementById('pathfinderColor').value;
    const pathfinderWidth = parseFloat(document.getElementById('pathfinderWidth').value);
    const pathfinderStyle = document.getElementById('pathfinderStyle').value;
    const pathfinderMinLength = parseInt(document.getElementById('pathfinderMinLength').value);

    const settings = {
        displayWidth, displayHeight, backgroundColor, lineColor, fillColor,
        strokeWidth, lineGlow, pathfinderColor, pathfinderWidth, pathfinderStyle,
        animationSpeed
    };

    if (showPathfinders) {
        ctx.shadowBlur = 0;

        const neighbors = buildNeighbors(xGridCount, yGridCount);
        const boundaryNodes = getBoundaryNodes(xGridCount, yGridCount);
        const paths = boundaryNodes
            .map((node) => findLongestPathFrom(node, neighbors))
            .filter((entry) => entry.length >= pathfinderMinLength);

        // Convert paths to point arrays
        const allPathsWithPoints = paths.map((entry) => ({
            length: entry.length,
            points: entry.path.map((id) => {
                const node = nodeFromId(id, yGridCount);
                const orientation = trackingGrid[node.x][node.y];
                return triangleCenter(node.x, node.y, node.triangle, orientation, gridSize);
            })
        }));

        // Find the longest path
        let longestPath = null;
        for (const entry of allPathsWithPoints) {
            if (!longestPath || entry.points.length > longestPath.points.length) {
                longestPath = entry;
            }
        }

        if (animationMode !== 'none' && longestPath) {
            // Set up animation state
            animationState = {
                mode: animationMode,
                longestPath,
                allPaths: allPathsWithPoints,
                settings,
                currentStep: 0,
                globalStep: 0
            };

            if (animationMode === 'longestPath') {
                animateLongestPath();
            } else if (animationMode === 'elimination') {
                animateElimination();
            }
        } else {
            // Static rendering
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
        }
    } else {
        pathData = [];
    }

    updateToggleButton();
    setFaviconFromCanvas(canvas);
}

// =============================================================================
// EXPORT
// =============================================================================

function downloadArt() {
    downloadCanvasAsPng(document.getElementById('canvas'), 'diagonal-lines-art.png');
}

function downloadSVG() {
    const displayWidth = parseInt(document.getElementById('displayWidth').value);
    const displayHeight = parseInt(document.getElementById('displayHeight').value);
    const strokeWidth = parseInt(document.getElementById('strokeWidth').value);
    const backgroundColor = document.getElementById('backgroundColor').value;
    const lineColor = document.getElementById('lineColor').value;
    const fillColor = document.getElementById('fillColor').value;
    const lineGlow = parseFloat(document.getElementById('lineGlow').value) || 0;

    const hasGlow = lineGlow > 0;
    const lineFilter = hasGlow ? ' filter="url(#line-glow)"' : '';
    let svgContent = `<?xml version="1.0" encoding="utf-8" ?>
<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}">
<rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" fill="${backgroundColor}"/>
`;

    if (hasGlow) {
        svgContent += `<defs>
<filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
<feGaussianBlur stdDeviation="${lineGlow}" result="coloredBlur"/>
<feMerge>
<feMergeNode in="coloredBlur"/>
<feMergeNode in="SourceGraphic"/>
</feMerge>
</filter>
</defs>
`;
    }

    for (const line of linesData) {
        svgContent += `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="${lineColor}" stroke-width="${strokeWidth}" fill="none"${lineFilter}/>\n`;
    }

    for (const diamond of diamondsData) {
        const points = diamond.map(p => `${p.x},${p.y}`).join(' ');
        svgContent += `<polygon points="${points}" fill="${fillColor}" stroke="${lineColor}"/>\n`;
    }

    for (const path of pathData) {
        if (path.points.length < 2) continue;
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
    downloadSvgContent(svgContent, 'diagonal-lines-art.svg');
}

async function downloadGif() {
    const animationMode = document.getElementById('animationMode').value;
    const showPathfinders = document.getElementById('showPathfinders').checked;

    if (animationMode === 'none' || !showPathfinders) {
        alert('Please enable pathfinders and select an animation mode to export a GIF.');
        return;
    }

    const wasRunning = Boolean(animationId);
    if (!wasRunning && animationState) {
        resumeAnimation();
    }

    await exportGif({
        canvas: document.getElementById('canvas'),
        filename: 'diagonal-lines-art.gif',
        buttonId: 'downloadGifButton'
    });

    if (!wasRunning) {
        stopAnimation();
        updateToggleButton();
    }
}

function downloadWebm() {
    const animationMode = document.getElementById('animationMode').value;
    const showPathfinders = document.getElementById('showPathfinders').checked;

    if (animationMode === 'none' || !showPathfinders) {
        alert('Please enable pathfinders and select an animation mode to record a video.');
        return;
    }

    const wasRunning = Boolean(animationId);
    if (!wasRunning && animationState) {
        resumeAnimation();
    }

    recordWebm({
        canvas: document.getElementById('canvas'),
        filename: 'diagonal-lines-art.webm',
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
