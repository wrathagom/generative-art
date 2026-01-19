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

document.addEventListener('DOMContentLoaded', updateIndexFavicon);
