# Paper figures

Prepare small, readable paper crops before compiling a film. Keep the original
paper's colors and typography, and add the explanation, citation and highlights
as Stage nodes. Use a figure when its actual method, evidence or notation helps
the current lesson.

## Prepare an asset

Install Poppler's `pdfinfo` and `pdftoppm`, then run:

```sh
uv run videos/tools/prepare-paper-figure.py \
  videos/assets/papers/attention-is-all-you-need-v7/recipe.json
```

The recipe pins the HTTPS PDF URL, version and SHA-256, authors, year, locator,
one-based page, crop and DPI. Crop coordinates are PDF points measured from the
top-left of the displayed CropBox after rotation. Pixel bounds round outward at
`dpi / 72`. Inspect the result at its intended display size.

The tool checks the PDF digest and page bounds, renders with Poppler, and writes
PNGs plus `manifest.json`. The manifest records dimensions, PNG hashes, exact
source identity, crop, recipe and tool hashes, and Poppler versions. Repeating
the recipe with the same source and tools produces the same bytes.

Original PDFs are cached under ignored `build/paper-source-cache/`. For a local
source, pass `--local-pdf /path/to/paper.pdf`. Use `--offline` to require local or
cached bytes. Only the derivative PNGs, recipe and provenance are shipped.

## Compose a Stage reference

Load the local PNG once with `resolveImageAsset` before compiling the film. Pass
its declared hash and dimensions, then use the same Stage package to construct
the film and its image nodes.

```js
const prepared = await resolveImageAsset(entry.path, {
  baseDir: repositoryRoot,
  sha256: entry.sha256,
  width: entry.width,
  height: entry.height,
});

const reference = paperFigure(prepared, {
  source: entry.source,
  caption: 'Each head forms its own weighted read.',
  width: 1500,
  height: 900,
  highlights: [{
    id: 'scaled-dot-product',
    region: { x: 115, y: 95, width: 350, height: 590 },
  }],
});

stage.play(fadeIn(reference));
stage.play(fadeIn(reference.highlights['scaled-dot-product']));
```

Highlight coordinates are intrinsic pixels in the prepared PNG. Highlights
begin hidden and use normal Stage timing. The component fits the actual image,
keeps its white paper backing in both themes, and places vector caption and
attribution below it. Image preparation and decoding finish before frames run.

The standalone [Attention demo](attention-is-all-you-need-v7/demo.mjs) shows the
title alone, Figure 2 and Equation 1. Its recipe records the paper's scoped
attribution permission. Other papers need their own reuse evidence.

[catalog.json](catalog.json) lists the prepared references, their teaching
moments and source-specific limits. [gallery.mjs](gallery.mjs) fits every crop
with a vector caption and citation. CC BY and CC BY-SA references also display
their license identifier. Keep the full source and license metadata with an
inserted figure and its published credits.

The FlashInfer derivative retains its CC BY-SA terms. The catalog separately
records sources whose noncommercial restrictions or unresolved figure rights
exclude them from this production batch. A paper's model or software license
does not establish figure reuse rights.

For a source manifest, declare `assets: manifest.assets` and include the recipe
and provenance JSON as ordinary source files. Asset paths are relative to the
collector's explicit repository root. Omit `source.path` when the original PDF
stays only in the ignored cache; its exact URL, version and digest remain in the
shipped provenance.
