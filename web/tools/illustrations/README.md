# Author an illustration

Keep one teaching job per figure. Start with the article's actual inputs, units and
question. Choose the representation that makes the relationship visible.

Use the pinned Vizmatic components for layout, charts, labels and themes. Use
custom geometry when a shared scale, physical ownership or vector construction is
the teaching mechanism. The [framework reference](../../../docs/illustration-framework.md)
and [quality guidelines](../../../ILLUSTRATION_GUIDELINES.md) cover the APIs and visual review.

## Start a figure

Run from `web/`:

```sh
pnpm illustrations:new --article section/article-slug --name memory_budget
pnpm illustrations:new --article section/article-slug --name capacity_curve --kind plot
```

The generator creates a formatted, typed example in an existing article. It
refuses to overwrite files. Replace its sample model, labels and alt text with the
article's worked example before publishing.

The layout recipe uses `Scene`, `Column`, `StackedBar` and `TextLabel`. The plot
recipe computes points from a model and uses `AxisPlot`. Both keep the model,
named picture function and theme entry separate. Preserve those boundaries as the
figure grows. Avoid nested anonymous render functions and compressed statements.

A figure entry exports `width`, `height`, `alt`, `create(theme)` and a default
picture. Add `createFilm(theme)` for a new stage animation, retaining `create(theme)`
as its print and initial-reading figure. The builder emits themed MP4s and the
article offers native play, pause, seek, and fullscreen controls. Existing
`createScenes` and `createAnimation` exports remain supported. Use readable names for computed quantities and keep units in
the model or field names. Draw labels and geometry from the same values.

## Organize larger figures

```text
article/
  content.md
  illustrations/
    capacity_curve.tsx          # render entry
    _parts/
      capacity-model.ts         # checked arithmetic
      capacity-marks.tsx        # named reusable picture parts
    _generated/                 # renderer output
```

Every `.tsx` below `illustrations/` is an entry except files within `_parts/`,
`_generated/` or `node_modules/`. Other nested directories can hold figure entries.
The builder and strict typecheck use this contract. An explicit `--file` cannot
render an `_parts` helper. Helpers remain in the transitive source fingerprint and
are typechecked through the entries that import them. Use literal local imports;
computed module paths cannot produce a reliable source fingerprint.

Existing article-root helpers remain supported. Shared Vizmatic primitives should
be imported from `vizmatic`; do not copy a palette or create a second renderer.

An embedded illustration fence is rendered only if a same-name standalone TSX
entry does not exist. Keep one authoritative authored copy when adding a new
figure. Formatting commands leave Markdown and its fences unchanged.

## Format and verify

```sh
pnpm illustrations:format
pnpm illustrations:format:check
pnpm illustrations:typecheck --file src/content/section/article/illustrations/capacity_curve.tsx
pnpm illustrations:build:article section/article
```

Formatting uses exact Prettier 3.9.10, four spaces, single quotes, preserved
property quotes, no semicolons and a 100-column target. Prose, formulas and alt text
can exceed that width. The command formats standalone entries, `_parts` helpers
and illustration tools, excluding generated files and unrelated web code. It
converges bounded formatter passes and fails if the output will not stabilize.
Before writing anything, it checks the complete selection for parsed syntax and
emitted JSX equivalence. An unsafe JSX text rewrite needs an explicit string
expression that retains the same children, followed by a fresh render comparison.

For an isolated rebuild without changing `_generated` assets or normal cache:

```sh
pnpm illustrations:build --article section/article --output /tmp/figure-review
```

The output preserves the section/article directory structure. Inspect both themes
on their actual page backgrounds, at desktop size and at the 343px phone width.
Transparent pixels viewed against an unrelated black surface can produce a false
contrast alarm. The readability audit measures the cropped output and page height
cap:

```sh
pnpm exec tsx tools/illustrations/audit-readability.ts --article section/article
```

A formatting or file-splitting pass needs parser and runtime validation as well as
fresh dark/light pixel parity. Compare exported metadata, literal strings,
computed geometry, crop dimensions and RGBA pixels using the same pinned runtime
and fonts. For animated figures, inspect the full scene/frame sequence. Web PNG
parity does not establish parity for the book's separate print layout.

Preserve old sources, images and review receipts. New source bytes need a new
provenance record even when their output pixels are identical. Keep any semantic
or visual repair separate from formatting so its changed result can be reviewed.
