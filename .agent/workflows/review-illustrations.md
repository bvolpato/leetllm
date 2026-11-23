---
description: Review all illustrations for quality, consistency, and legibility
---

# Review Illustrations

Manual visual review of Vizmatic and Satori-generated illustrations. The gallery exporter copies images and context for human inspection; automated scripts check structure and layout constraints without judging teaching value.

## Steps

1. Generate the visual review gallery from the repository root:

```bash
uv run scripts/review-illustrations.py
```

2. Open the review page in a browser tab:
   - Gallery path: `/tmp/leetllm_illustrations/index.html`
   - The page shows every illustration as a side-by-side light and dark pair grouped by article.
   - Use the shared agent browser instead of launching a separate browser instance.

3. Review each illustration against `ILLUSTRATION_GUIDELINES.md`:
   - **Genuine visual encoding:** Confirm that position, direction, size, color, grouping, or axes carry the explanation through plots (`LineChart`, `BarChart`, `ScatterPlot`, `IntervalPlot`, `AxisPlot`), matrices or heatmaps (`Matrix`, `Heatmap`, `TiledMatrix`), vector geometry (`VectorArrow`), network or architecture graphs (`LayeredNetwork`, `GraphDiagram`), or compact flows (`Flow`). Reject HTML-tables-as-PNGs, prose card strips, and tall vertical receipt towers.
   - **Aspect ratio and height ceiling:** Reject any figure whose aspect ratio exceeds `height <= 1.35 * width` or whose source height exceeds `820px`.
   - **Zero prose paragraphs or disclaimers inside PNGs:** Reject multi-sentence text blocks, lesson summaries, and fictional-data disclaimers (`"FIXTURE ONLY"`, `"synthetic"`, `"Treat these numbers as an illustrative walkthrough"`, `"does not establish"`) stamped inside rendered artwork. Explanations belong in `<figcaption>` and article prose.
   - **Domain-native fidelity:** Verify calculations, tensor shapes, axis scales, arrow directions, and symbols against the article. Flag any unrelated SRE/IAM roleplay (`Luna`, `acct_10234`, `K10234`, `DeployBuddy`, `INC-48291`, `0.005000 USD`) leaking into ML, DL, NLP, CV, RL, math, or GPU visuals.
   - **Static-PNG and caption parity for animated figures:** When an illustration exports `createAnimation(theme)`, inspect its static `create(theme)` fallback PNG alongside `<figcaption>`. The static image must independently justify every claim in the caption and show a complete, interpretable teaching state for reduced-motion readers and print output.
   - **Motion and discovery:** For a film or animation, inspect the complete transformation at reading size. Track one object through its states, check that attention follows the important change, and give the result time to settle. Welcome useful analogies, morphs, progressive constructions, and camera movement. Check pause/replay behavior and the matching static figure or sequence. State what a learner can now see or infer that was difficult before.
   - **Legibility and dark/light parity:** Confirm crisp contrast in both themes at 672px desktop and 343px phone reading widths, with no overlapping labels, clipped edges, or missing theme variants.

4. Run programmatic quality and density validators:

```bash
uv run scripts/validate-illustration-refs.py
uv run scripts/validate-illustration-quality.py --fail-layout-warnings
uv run scripts/validate-illustration-density.py --strict-text
```

   Also inspect the rendered gallery in the browser to confirm zero broken images (`naturalWidth === 0`) and matching light/dark dimensions. Remember that passing automated validators never guarantees educational value or mathematical accuracy on its own.

5. If defects are found:
   - Record the article slug, illustration name, visual failure, and required fix.
   - Redesign, simplify, or delete low-value figures in the article bundle and rebuild through `pnpm --dir web illustrations:build:article <section>/<slug> --force`.
   - Re-inspect the updated dark and light PNGs directly before marking the bundle complete.
   - Compare the figure's example and symbols with the article, reader chapter, and selected lesson video. Report any pending format instead of treating a new PNG as a completed cross-format revision.
