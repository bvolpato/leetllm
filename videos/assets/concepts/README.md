# LeetLLM Concept Atlas

Original SVG symbols for teaching machine learning and AI systems.

Serve this folder with a local HTTP server, then open gallery.html. The gallery includes dark and light SVG downloads, size previews, search, teaching briefs and a source coverage index. All asset references are relative. Browsing requires no package installation.

## Files

- *.svg: transparent 64 × 64 symbols with named data-part elements for animation.
- manifest.json: stable symbol IDs, meanings, filenames and palette variants.
- catalog.json: concepts, identifying symbols, preferred teaching formats, visual briefs, pitfalls and source references.
- curation/: the source review inputs used to assemble the catalog.
- checksums.sha256: hashes included in the exported archive.

The SVG is an identifying symbol. A diagram or simulation brief describes a larger teaching explanation to build. The corpus index records an opportunity review of article metadata, structure and visual cues, glossary definition leads, and selected full sections. Each source states its review basis. Sources without a selected reusable concept may still benefit from custom illustrations.

## Reuse and extension

Copy this folder into a dedicated project to keep the gallery and collection together. Preserve stable IDs when improving geometry. Match the transparent 0 0 64 64 viewBox, explicit palette, rounded strokes, accessible title and description, and named parts. Keep larger teaching figures separate from their symbols.

The LeetLLM repository provides the audited SVG-to-video painter in videos/lib/concepts.mjs. It renders supported shapes through the lesson layout and occlusion checks. videos/atlas.mjs rebuilds the catalog against the full corpus and rejects missing, duplicate or stale source reviews. videos/export-atlas.py produces this portable archive.

## License

MIT, copyright 2026 Bruno Volpato. See LICENSE.
