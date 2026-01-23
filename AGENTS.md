# Generative Art Gallery - Agent Guide

This repo is a flat, static site: open `index.html` in a browser to use it. No build step required.

## Project Structure

```
generative-art/
├── index.html              # Gallery landing page
├── index.js                # Gallery page functionality
├── styles.css              # Shared styles for all pages
├── utils.js                # Shared utilities (see below)
├── vendor/                 # Third-party libraries
│   ├── gif.js              # GIF export library
│   └── gif.worker.js       # GIF worker
│
├── [generator].html        # Generator UI pages
├── [generator].js          # Generator logic
│
└── node_modules/           # Dev dependencies (puppeteer for headless export)
```

## Generators

Each generator follows the pattern `name.html` + `name.js`:

| Generator | Description | Animation | Exports |
|-----------|-------------|-----------|---------|
| flow-field | Particle traces through vector field | Yes (3 modes) | PNG, SVG, GIF, WebM |
| code-rain | Matrix-style falling glyphs | Yes (continuous) | PNG, GIF, WebM |
| bubbles | Bouncing circles with blend modes | Yes (optional) | PNG, SVG |
| joy-division | Wavy lines with zone support | No | PNG, SVG |
| chaotic-lines | Grid of chaotic line patterns | No | PNG, SVG |
| diagonal-lines | Diagonal grid patterns | No | PNG, SVG |
| circle-packing | Circle packing algorithm | No | PNG, SVG |
| halftone-grid | Halftone dot patterns | No | PNG, SVG |
| kaleidoscope | Kaleidoscope patterns | No | PNG, SVG |
| lissajous-weave | Lissajous curve patterns | No | PNG, SVG |
| voronoi-tiles | Voronoi diagram tiles | No | PNG, SVG |

## utils.js - Shared Utilities

The `utils.js` file contains all shared functionality. Generator files should use these instead of implementing their own.

### Random Number Generation
```javascript
seedRng(seed)           // Initialize seeded RNG
clearSeededRng()        // Revert to Math.random
random()                // Get random 0-1 (seeded if set)
randint(min, max)       // Get random integer in range
generateSeed()          // Generate a new random seed
```

### Color Utilities
```javascript
getColorScheme()                    // Get colors from UI inputs
getRandomHexColor()                 // Generate random hex color
parseColorsFromUrl(url)             // Parse Coolors.co URL
```

### Color Input Management
```javascript
createColorInputGroup(colorValue)   // Create color input HTML
addColor(colorValue)                // Add color to palette
removeColor(button)                 // Remove color from palette
setColors(colors, mode)             // Set multiple colors ('add' or 'overwrite')
bindColorInputEvents()              // Bind removal event delegation
```

### Coolors Modal
```javascript
openCoolorsModal()                  // Open import modal
closeCoolorsModal()                 // Close modal
importCoolors(mode)                 // Import from Coolors URL
bindCoolorsModalEvents()            // Bind all modal events
```

### URL Serialization / Sharing
```javascript
serializeFormToParams(inputIds)     // Serialize form to URL params
deserializeParamsToForm(inputIds)   // Restore form from URL params
copyToClipboard(text)               // Copy text to clipboard
shareArt(formInputIds, seed, extra) // Create shareable URL and copy
```

### Download Utilities
```javascript
downloadCanvasAsPng(canvas, filename)   // Download canvas as PNG
downloadSvgContent(svgContent, filename) // Download SVG string
```

### GIF Export
```javascript
loadGifLibrary()                    // Lazy-load gif.js
getExportDurationMs(default, max)   // Get duration from exportDuration input
exportGif({                         // Export animation as GIF
  canvas,
  filename,
  fps,
  buttonId,
  durationMs
})
```

### WebM/Video Export
```javascript
pickRecordingMimeType()             // Get best supported codec
recordWebm({                        // Record animation as WebM
  canvas,
  filename,
  fps,
  durationMs,
  buttonId,
  onStart,
  onStop
})
```

### Other Utilities
```javascript
setFaviconFromCanvas(canvas, size)  // Set favicon from canvas
handleAutoDownload(supportedFormats) // Handle ?autodownload=png param
initGenerator(options)              // Initialize a generator (see below)
```

### Theme Toggle
Automatically initialized on DOMContentLoaded. Uses `[data-theme-toggle]` buttons.

## Creating a New Generator

### 1. Create the HTML file

Copy an existing generator HTML as template. Required elements:
- `<canvas id="canvas">` - The drawing canvas
- `#colorInputs` - Container for color inputs
- `#generateButton`, `#downloadPngButton`, `#shareButton`
- `#coolorsModal` - Import modal (copy from existing)
- Include `utils.js` before your generator JS

### 2. Create the JS file

Minimal generator structure:

```javascript
let currentSeed = null;

const FORM_INPUT_IDS = [
    'displayWidth', 'displayHeight', /* your inputs */
];

function generateArt(seed = null) {
    currentSeed = seed !== null ? seed : generateSeed();
    seedRng(currentSeed);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Read settings from form
    const width = parseInt(document.getElementById('displayWidth').value);
    // ...

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Your drawing logic here
    // Use random() and randint() for seeded randomness
    // Use getColorScheme() for colors

    setFaviconFromCanvas(canvas);
}

function downloadArt() {
    downloadCanvasAsPng(document.getElementById('canvas'), 'my-art.png');
}

function downloadSVG() {
    // Build SVG string
    let svgContent = `<?xml version="1.0" ?>...`;
    downloadSvgContent(svgContent, 'my-art.svg');
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
```

### 3. Add to gallery

Link from `index.html` in the gallery grid.

## Adding Animation Support

For animated generators:

1. Add animation controls to HTML:
```html
<select id="animationMode">
    <option value="none">None</option>
    <option value="yourMode">Your Mode</option>
</select>
<input type="number" id="animationSpeed" value="30">
<input type="number" id="exportDuration" value="5">
```

2. Add animation buttons:
```html
<button id="toggleButton">Pause</button>
<button id="downloadGifButton">Download GIF</button>
<button id="recordWebmButton">Record WebM</button>
```

3. In JS, implement animation loop with `requestAnimationFrame`
4. Use `exportGif()` and `recordWebm()` from utils.js

## Conventions

- **Use shared utils**: Always prefer `utils.js` functions over custom implementations
- **Seeded randomness**: Use `seedRng()`, `random()`, `randint()` for reproducible results
- **Event listeners**: Wire via JS, not inline HTML handlers
- **No build step**: Keep it vanilla HTML/CSS/JS
- **ASCII only**: Use ASCII in edits unless Unicode is required
- **SVG export**: Should match the canvas output exactly

## Testing

1. Open each generator in browser
2. Click Generate - verify art renders
3. Click Download PNG/SVG - verify downloads
4. Click Share - verify URL copies and works when pasted
5. For animated: test GIF/WebM export

## Auto-download (Headless)

Add `?autodownload=png` (or svg, gif, webm) to URL for programmatic export:
```
flow-field.html?seed=12345&autodownload=png
```

## Common Patterns

### Reading form values
```javascript
const width = parseInt(document.getElementById('displayWidth').value);
const opacity = parseFloat(document.getElementById('opacity').value);
const mode = document.getElementById('mode').value;
const enabled = document.getElementById('checkbox').checked;
```

### Getting colors
```javascript
const palette = getColorScheme();
const color = palette[randint(0, palette.length - 1)];
```

### Building SVG
```javascript
let svg = `<?xml version="1.0" encoding="utf-8" ?>\n`;
svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">\n`;
svg += `<rect x="0" y="0" width="${w}" height="${h}" fill="${bg}"/>\n`;
// Add elements...
svg += '</svg>';
downloadSvgContent(svg, 'filename.svg');
```

### Extra share params (like joy-division zones)
```javascript
function handleShare() {
    const extraParams = { customData: btoa(JSON.stringify(data)) };
    shareArt(FORM_INPUT_IDS, currentSeed, extraParams);
}
```
