# Generative Art Gallery - Agent Guide

This repo is a flat, static site: open `index.html` in a browser to use it. No build step, no dependencies.

## Structure

- `index.html`: gallery landing page
- `chaotic-lines.html` + `chaotic-lines.js`: chaotic line grid generator
- `diagonal-lines.html` + `diagonal-lines.js`: diagonal grid generator
- `joy-division.html` + `joy-division.js`: wavy line generator
- `styles.css`: shared styles for all pages
- `utils.js`: shared helpers (random + color utilities)

## Workflow

- Run by opening `index.html` directly in a browser.
- PNG and SVG downloads are client-side; SVG output should match the last generated canvas.

## Conventions

- Prefer shared helpers in `utils.js` for random and color parsing.
- Wire UI interactions via JS event listeners, not inline HTML handlers.
- Keep the project dependency-free (vanilla HTML/CSS/JS).
- Use ASCII in edits unless existing files require Unicode.

## Common Tasks

- Add a new generator: create `name.html` + `name.js`, link it from `index.html`, and style via `styles.css`.
- Update UI controls: keep inputs grouped in `.controls-panel` and wire events in the generator JS.

## Quick Checks

- Open each generator page and click Generate/Download to sanity-check behavior.
- Verify SVG matches the last canvas output (especially after refactors).
