# Generative Art Gallery

A small, static gallery of canvas-based generative art experiments. Each generator runs entirely in the browser and can export PNG or SVG.

## How to Run

Open `index.html` in a browser and pick a generator card.

## Included Generators

- Chaotic Lines: randomized line grids with palette controls
- Diagonal Lines: diagonal grids with optional diamond fills
- Joy Division Waves: wavy line fields inspired by Unknown Pleasures
- Bubbles: layered circles with size ranges and blend modes
- Code Rain: matrix-style glyph cascade with adjustable trails

## Notes

- SVG exports match the last generated canvas output.
- All pages are static HTML, CSS, and vanilla JavaScript.
- Code Rain supports GIF/WebM export (GIF uses a vendored library; see `THIRD_PARTY_NOTICES.md`).
- Third-party notices are listed in `THIRD_PARTY_NOTICES.md`.
