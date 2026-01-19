function drawChaoticLinesFavicon(ctx, size) {
    const palette = ['#f97316', '#38bdf8', '#f43f5e', '#a855f7', '#eab308'];
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    const grid = 6;
    const cell = size / grid;
    const lineWidth = Math.max(1, Math.floor(size / 36));
    ctx.lineWidth = lineWidth;
    ctx.globalAlpha = 0.9;

    for (let x = 0; x < grid; x++) {
        for (let y = 0; y < grid; y++) {
            const startX = x * cell;
            const startY = y * cell;
            const endX = startX + cell;
            const endY = startY + cell;
            const lineCount = randint(1, 3);

            for (let i = 0; i < lineCount; i++) {
                const color = palette[randint(0, palette.length - 1)];
                ctx.strokeStyle = color;
                ctx.beginPath();
                if (random() > 0.5) {
                    ctx.moveTo(startX, startY + random() * cell);
                    ctx.lineTo(endX, startY + random() * cell);
                } else {
                    ctx.moveTo(startX + random() * cell, startY);
                    ctx.lineTo(startX + random() * cell, endY);
                }
                ctx.stroke();
            }
        }
    }

    ctx.globalAlpha = 1;
}

function drawDiagonalLinesFavicon(ctx, size) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = Math.max(1, Math.floor(size / 24));

    const grid = 7;
    const cell = size / grid;
    for (let x = 0; x < grid; x++) {
        for (let y = 0; y < grid; y++) {
            const x1 = x * cell;
            const y1 = y * cell;
            const x2 = x1 + cell;
            const y2 = y1 + cell;
            ctx.beginPath();
            if (random() > 0.5) {
                ctx.moveTo(x1, y2);
                ctx.lineTo(x2, y1);
            } else {
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
            ctx.stroke();
        }
    }
}

function drawJoyDivisionFavicon(ctx, size) {
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = Math.max(1, Math.floor(size / 40));

    const lines = 8;
    for (let i = 0; i < lines; i++) {
        const y = (i + 1) * (size / (lines + 1));
        ctx.beginPath();
        ctx.moveTo(0, y);
        const waveCount = 4;
        for (let w = 0; w <= waveCount; w++) {
            const x = (w / waveCount) * size;
            const amplitude = (random() * 0.4 + 0.2) * (size / 10);
            const direction = w % 2 === 0 ? 1 : -1;
            ctx.quadraticCurveTo(x + size / (waveCount * 2), y + amplitude * direction, x + size / waveCount, y);
        }
        ctx.stroke();
    }
}

function drawBubblesFavicon(ctx, size) {
    const palette = ['#ff6b6b', '#feca57', '#54a0ff', '#5f27cd', '#1dd1a1'];
    ctx.fillStyle = '#0b0f1a';
    ctx.fillRect(0, 0, size, size);

    const bubbleCount = 12;
    for (let i = 0; i < bubbleCount; i++) {
        const radius = randint(Math.floor(size / 12), Math.floor(size / 4));
        const cx = randint(radius, size - radius);
        const cy = randint(radius, size - radius);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = palette[randint(0, palette.length - 1)];
        ctx.globalAlpha = 0.7;
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawCodeRainFavicon(ctx, size) {
    ctx.fillStyle = '#04110b';
    ctx.fillRect(0, 0, size, size);

    const columns = 6;
    const colWidth = size / columns;
    for (let c = 0; c < columns; c++) {
        const x = c * colWidth + colWidth / 4;
        const blockCount = randint(3, 6);
        for (let b = 0; b < blockCount; b++) {
            const y = randint(0, size - Math.floor(colWidth));
            const width = Math.max(2, Math.floor(colWidth / 2));
            const height = Math.max(3, Math.floor(colWidth * 0.8));
            ctx.fillStyle = b === blockCount - 1 ? '#ccff90' : '#22c55e';
            ctx.fillRect(x, y, width, height);
        }
    }
}

function updateIndexFavicon() {
    const canvas = document.createElement('canvas');
    const size = 96;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const styles = [
        drawChaoticLinesFavicon,
        drawDiagonalLinesFavicon,
        drawJoyDivisionFavicon,
        drawBubblesFavicon,
        drawCodeRainFavicon
    ];
    const pick = styles[randint(0, styles.length - 1)];
    pick(ctx, size);
    setFaviconFromCanvas(canvas);
}

function setupPreviewCanvas(canvas) {
    const container = canvas.closest('.card-preview');
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    canvas.width = width;
    canvas.height = height;
    return { width, height };
}

function drawChaoticLinesPreview(ctx, width, height) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const palette = ['#f97316', '#38bdf8', '#f43f5e', '#a855f7', '#eab308'];
    const grid = 10;
    const cellW = width / grid;
    const cellH = height / grid;
    ctx.lineWidth = Math.max(1, Math.floor(width / 180));
    ctx.globalAlpha = 0.75;

    for (let x = 0; x < grid; x++) {
        for (let y = 0; y < grid; y++) {
            const startX = x * cellW;
            const startY = y * cellH;
            const endX = startX + cellW;
            const endY = startY + cellH;
            const lineCount = randint(2, 5);
            for (let i = 0; i < lineCount; i++) {
                ctx.strokeStyle = palette[randint(0, palette.length - 1)];
                ctx.beginPath();
                if (random() > 0.5) {
                    ctx.moveTo(startX, startY + random() * cellH);
                    ctx.lineTo(endX, startY + random() * cellH);
                } else {
                    ctx.moveTo(startX + random() * cellW, startY);
                    ctx.lineTo(startX + random() * cellW, endY);
                }
                ctx.stroke();
            }
        }
    }
    ctx.globalAlpha = 1;
}

function drawDiagonalLinesPreview(ctx, width, height) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = Math.max(1, Math.floor(width / 120));

    const grid = 12;
    const cellW = width / grid;
    const cellH = height / grid;
    for (let x = 0; x < grid; x++) {
        for (let y = 0; y < grid; y++) {
            const x1 = x * cellW;
            const y1 = y * cellH;
            const x2 = x1 + cellW;
            const y2 = y1 + cellH;
            ctx.beginPath();
            if (random() > 0.5) {
                ctx.moveTo(x1, y2);
                ctx.lineTo(x2, y1);
            } else {
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
            ctx.stroke();
        }
    }
}

function drawJoyDivisionPreview(ctx, width, height) {
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = Math.max(1, Math.floor(width / 220));

    const lines = 10;
    for (let i = 0; i < lines; i++) {
        const y = (i + 1) * (height / (lines + 2));
        ctx.beginPath();
        ctx.moveTo(0, y);
        const waveCount = 6;
        for (let w = 0; w <= waveCount; w++) {
            const x = (w / waveCount) * width;
            const amplitude = (random() * 0.6 + 0.2) * (height / 12);
            const direction = w % 2 === 0 ? 1 : -1;
            ctx.quadraticCurveTo(x + width / (waveCount * 2), y + amplitude * direction, x + width / waveCount, y);
        }
        ctx.stroke();
    }
}

function drawBubblesPreview(ctx, width, height) {
    ctx.fillStyle = '#0b0f1a';
    ctx.fillRect(0, 0, width, height);
    const palette = ['#ff6b6b', '#feca57', '#54a0ff', '#5f27cd', '#1dd1a1'];
    const bubbleCount = 18;
    for (let i = 0; i < bubbleCount; i++) {
        const radius = randint(Math.floor(width / 18), Math.floor(width / 7));
        const cx = randint(radius, width - radius);
        const cy = randint(radius, height - radius);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = palette[randint(0, palette.length - 1)];
        ctx.globalAlpha = 0.65;
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawCodeRainPreview(ctx, width, height) {
    ctx.fillStyle = '#04110b';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#22c55e';
    const columns = 12;
    const colWidth = width / columns;
    ctx.font = `${Math.max(10, Math.floor(width / 26))}px monospace`;
    for (let c = 0; c < columns; c++) {
        const x = c * colWidth + colWidth / 3;
        const glyphCount = randint(6, 10);
        for (let g = 0; g < glyphCount; g++) {
            const y = randint(10, height - 10);
            ctx.fillStyle = g === glyphCount - 1 ? '#ccff90' : '#22c55e';
            ctx.fillText(random() > 0.5 ? '0' : '1', x, y);
        }
    }
}

function drawFlowPreview(ctx, width, height) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    const palette = ['#38bdf8', '#f97316', '#f43f5e', '#22c55e', '#eab308'];
    const fieldScale = 0.01;
    const offsetA = random() * Math.PI * 2;
    const offsetB = random() * Math.PI * 2;
    const offsetC = random() * Math.PI * 2;

    const fieldAngle = (x, y) => {
        const nx = x * fieldScale;
        const ny = y * fieldScale;
        const value = Math.sin(nx + offsetA) + Math.cos(ny + offsetB) + Math.sin((nx + ny) * 0.7 + offsetC);
        return value * Math.PI;
    };

    ctx.lineWidth = Math.max(1, Math.floor(width / 240));
    ctx.globalAlpha = 0.65;
    const paths = 120;
    for (let i = 0; i < paths; i++) {
        let x = random() * width;
        let y = random() * height;
        ctx.strokeStyle = palette[randint(0, palette.length - 1)];
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let s = 0; s < 40; s++) {
            const angle = fieldAngle(x, y);
            x += Math.cos(angle) * 4;
            y += Math.sin(angle) * 4;
            if (x < 0 || x > width || y < 0 || y > height) break;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

function drawVoronoiPreview(ctx, width, height) {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    const palette = ['#f97316', '#0ea5e9', '#e11d48', '#22c55e', '#a855f7'];
    const seeds = [];
    const seedCount = 20;
    for (let i = 0; i < seedCount; i++) {
        seeds.push({ x: random() * width, y: random() * height });
    }
    const tileSize = 12;
    for (let x = 0; x < width; x += tileSize) {
        for (let y = 0; y < height; y += tileSize) {
            let nearest = 0;
            let dist = Infinity;
            for (let i = 0; i < seeds.length; i++) {
                const dx = seeds[i].x - (x + tileSize / 2);
                const dy = seeds[i].y - (y + tileSize / 2);
                const d = dx * dx + dy * dy;
                if (d < dist) {
                    dist = d;
                    nearest = i;
                }
            }
            ctx.fillStyle = palette[nearest % palette.length];
            ctx.fillRect(x, y, tileSize, tileSize);
        }
    }
}

function drawPackingPreview(ctx, width, height) {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    const palette = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9'];
    const circles = [];
    const maxCircles = 70;
    const maxAttempts = 500;
    const padding = 2;

    const canPlace = (x, y, radius) => {
        if (x - radius - padding < 0 || x + radius + padding > width) return false;
        if (y - radius - padding < 0 || y + radius + padding > height) return false;
        for (const circle of circles) {
            const dx = x - circle.x;
            const dy = y - circle.y;
            const minDist = radius + circle.radius + padding;
            if (dx * dx + dy * dy < minDist * minDist) return false;
        }
        return true;
    };

    for (let attempt = 0; attempt < maxAttempts && circles.length < maxCircles; attempt++) {
        const x = random() * width;
        const y = random() * height;
        if (!canPlace(x, y, 6)) continue;
        let radius = 6;
        while (radius < 30 && canPlace(x, y, radius + 1)) {
            radius += 1;
        }
        circles.push({ x, y, radius, color: palette[randint(0, palette.length - 1)] });
    }

    ctx.globalAlpha = 0.85;
    for (const circle of circles) {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fillStyle = circle.color;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#111827';
        ctx.stroke();
        ctx.globalAlpha = 0.85;
    }
    ctx.globalAlpha = 1;
}

function drawHalftonePreview(ctx, width, height) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    const palette = ['#f9a8d4', '#facc15', '#38bdf8', '#a78bfa', '#34d399'];
    const spacing = 20;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDistance = Math.hypot(centerX, centerY);

    for (let x = spacing / 2; x < width; x += spacing) {
        for (let y = spacing / 2; y < height; y += spacing) {
            const distance = Math.hypot(x - centerX, y - centerY);
            const value = Math.max(0, 1 - distance / maxDistance);
            const radius = 2 + value * 8;
            const color = palette[Math.floor(value * (palette.length - 1))];
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }
    }
}

function drawLissajousPreview(ctx, width, height) {
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, width, height);
    const palette = ['#f43f5e', '#f97316', '#38bdf8', '#a855f7', '#22c55e'];
    const centerX = width / 2;
    const centerY = height / 2;
    const amplitude = Math.min(width, height) * 0.32;
    const layers = 4;
    const points = 260;

    ctx.lineWidth = Math.max(1, Math.floor(width / 220));
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let i = 0; i < layers; i++) {
        const phase = (i * 30 + 40) * (Math.PI / 180);
        ctx.strokeStyle = palette[i % palette.length];
        ctx.beginPath();
        for (let p = 0; p <= points; p++) {
            const t = (p / points) * Math.PI * 2;
            const x = centerX + amplitude * Math.sin(3 * t + phase);
            const y = centerY + amplitude * Math.sin(4 * t);
            if (p === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }
}

function drawKaleidoPreview(ctx, width, height) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    const palette = ['#f97316', '#f43f5e', '#38bdf8', '#a855f7', '#22c55e'];
    const centerX = width / 2;
    const centerY = height / 2;
    const wedgeCount = 10;
    const wedgeAngle = (Math.PI * 2) / wedgeCount;
    const maxRadius = Math.min(width, height) * 0.45;

    ctx.lineWidth = Math.max(1, Math.floor(width / 220));
    ctx.globalAlpha = 0.8;

    for (let i = 0; i < 50; i++) {
        const r1 = Math.sqrt(random()) * maxRadius;
        const r2 = Math.sqrt(random()) * maxRadius;
        const a1 = random() * wedgeAngle;
        const a2 = random() * wedgeAngle;
        const color = palette[randint(0, palette.length - 1)];
        ctx.strokeStyle = color;

        for (let w = 0; w < wedgeCount; w++) {
            const angle = wedgeAngle * w;
            const mirror = w % 2 === 1;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            const y1 = mirror ? -Math.sin(a1) * r1 : Math.sin(a1) * r1;
            const y2 = mirror ? -Math.sin(a2) * r2 : Math.sin(a2) * r2;
            const x1 = Math.cos(a1) * r1;
            const x2 = Math.cos(a2) * r2;

            const sx = centerX + x1 * cosA - y1 * sinA;
            const sy = centerY + x1 * sinA + y1 * cosA;
            const ex = centerX + x2 * cosA - y2 * sinA;
            const ey = centerY + x2 * sinA + y2 * cosA;

            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
        }
    }
    ctx.globalAlpha = 1;
}

function renderPreviews() {
    const previewMap = {
        chaotic: drawChaoticLinesPreview,
        diagonal: drawDiagonalLinesPreview,
        joy: drawJoyDivisionPreview,
        bubbles: drawBubblesPreview,
        'code-rain': drawCodeRainPreview,
        flow: drawFlowPreview,
        voronoi: drawVoronoiPreview,
        packing: drawPackingPreview,
        halftone: drawHalftonePreview,
        lissajous: drawLissajousPreview,
        kaleido: drawKaleidoPreview
    };

    document.querySelectorAll('[data-preview]').forEach((container) => {
        const type = container.getAttribute('data-preview');
        const canvas = container.querySelector('canvas');
        const drawFn = previewMap[type];
        if (!canvas || !drawFn) return;

        const size = setupPreviewCanvas(canvas);
        if (!size) return;
        const ctx = canvas.getContext('2d');
        drawFn(ctx, size.width, size.height);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateIndexFavicon();
    renderPreviews();
});
