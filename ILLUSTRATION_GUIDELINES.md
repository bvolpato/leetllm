# LeetLLM Illustration Guidelines

## Goal

Every illustration must make a technical concept easier to see, reason about, or remember. Illustration count is never a quality metric. A polished graphic that merely repeats nearby prose should be redesigned or removed.

Aim for visual explanations worth spending time with: strong composition, readable type, purposeful color, and a clear moment of discovery. Familiar objects and visual analogies are welcome when their geometry or behavior makes the technical relationship easier to grasp. Connect them to the lesson's quantities and keep that mapping consistent.

Use these guidelines for custom TSX/Vizmatic illustrations and Mermaid diagrams. Framework API details live in [docs/illustration-framework.md](./docs/illustration-framework.md).

## Value Gate

An illustration ships only when all five statements hold true:

1. **Incremental value:** It reveals a relationship, mechanism, tensor shape, quantity, path, or trade-off that prose alone cannot show as clearly.
2. **Genuine visual encoding:** Position, direction, size, color, grouping, geometry, or axes carry meaning through plots (`LineChart`, `BarChart`, `ScatterPlot`, `IntervalPlot`, `AxisPlot`), matrices or heatmaps (`Matrix`, `Heatmap`, `TiledMatrix`), vector geometry (`VectorArrow`, `createPlotArea`), network or architecture diagrams (`LayeredNetwork`, `GraphDiagram`), or compact directional flows (`Flow`). It is not prose or an HTML table arranged inside a PNG.
3. **Single teaching job:** Its purpose fits in one clear sentence. Remove any panel that does not directly serve that purpose.
4. **Domain-native technical fidelity:** Labels, formulas, data, directions, scales, and states match the article explanation and running example, using domain-native objects (tokens and sequences for NLP, image tensors for CV, MDPs for RL, matrices and distributions for math, and tiles/warps/HBM for GPU kernels). Never leak unrelated SRE or IAM roleplay (`Luna`, `acct_10234`, `K10234`, `DeployBuddy`, `INC-48291`, `0.005000 USD`) into ML, math, or systems visuals.
5. **Visual polish and compact geometry:** Composition is balanced, crisp in both themes, tightly fitted, free from overlaps or clipping, within `height <= 1.35 * width`, and within `height <= 820px` in source dimensions.

If any statement fails, redesign or delete the image. Visual density goals never justify low-value art.

## Keep, Redesign, or Delete

| Outcome | Use when |
|---|---|
| **Keep** | The figure delivers a genuine visual insight and passes all five value gates. |
| **Redesign** | The concept benefits from a visual, but its encoding, aspect ratio, density, hierarchy, or rendering is weak. |
| **Delete or move to prose** | The figure is a title card, HTML table exported as a PNG, prose card strip, tall vertical receipt tower, learning prompt, article outline, or decorative summary. |

## Pick Representation by Teaching Job

| Teaching job | Preferred representation |
|---|---|
| Order or handoff | Short flow with 3 to 5 connected stages |
| Branching or feedback | Graph with explicit edge direction and labels |
| Model layers or hierarchy | Layered network, tree, or stacked architecture |
| Exact mapping or weights | Numeric matrix, heatmap, or tiled tensor grid |
| Quantity or trend | Bar, line, scatter, interval, or calibrated axis plot |
| Vector geometry or projections | Coordinate plot with vector arrows and angles |
| Before/after behavior | Aligned comparison using identical scales and labels |
| Code or request trace | Compact visual trace linking inputs, state transitions, and output |

Do not draw a multi-box flow when sequence order is trivial. Do not export `DataTable`, `TileGrid`, `KeyValueList`, or `Panel` prose strips as a PNG when a Markdown table or prose paragraph teaches the comparison better.

## Content, Aspect Ratio, and Text Discipline

- **Strict size and aspect ceiling:** Keep every illustration within `height <= 1.35 * width` and source `height <= 820px` (with matching cropped dimensions). Never build tall vertical receipt towers, scrolling log stacks, or stacked prose card columns.
- **Zero prose paragraphs inside PNGs:** Keep text inside rendered images strictly to short labels, numeric values, axis names, and compact equations. Move explanations, caveats, learning questions, reflection prompts, and decision rules into `<figcaption>` or the article body.
- **Zero fictional-data disclaimers inside PNGs:** Never stamp `"FIXTURE ONLY"`, `"synthetic"`, `"synthetic fixture"`, `"Treat these numbers as an illustrative walkthrough..."`, or `"does not establish..."` inside an illustration. `CONTENT_GUIDELINES.md` and `BOOK.md` state the curriculum-wide example convention once.
- **Show concrete mechanisms:** Use the article's actual tensors, shapes, symbols, probabilities, or state transitions rather than abstract placeholders.
- **Keep hero figures focused:** Include at most one flow plus one supporting visual in hero figures, and avoid generic `concept -> build -> failure -> production` templates.
- **No duplicate headings or footers:** Drop redundant outer titles and explanatory footer rows when the article heading and `<figcaption>` already supply that context.
- **Define symbols cleanly:** Define compact symbols such as `n`, `d`, `k`, `p`, and `q` directly in the figure or its `<figcaption>`, and format mathematical subscripts and superscripts with shared math primitives.

## Animated Figures and Static-PNG Parity

- Use `vizmatic/stage` films for new motion explanations through the repository's supported player and export path. Use `createAnimation(theme)` to animate an existing TSX figure. Read the installed version's APIs before choosing components.
- Animate constructions as well as processes: a vector rotating into a projection, a matrix becoming a set of dot products, a gradient reshaping a decision boundary, or a camera revealing the scale of a tensor. Progressive drawing, morphs, and camera direction can give the viewer time to understand one relationship before the next appears.
- Preserve recognizable objects, stable color meanings, and legible reference points. A moving label can follow its object; inspect the whole transition so labels remain readable and avoid collisions. Let a result settle before moving on.
- **Static fallback parity:** Every animated figure must also export `create(theme)` rendering a self-contained static fallback PNG (used for reduced-motion readers, initial page load, and printed book pages). That static PNG must show a complete, informative state and match every claim made in `<figcaption>` on its own. Never write a caption that describes motion or intermediate values absent from the static PNG.

For a film, provide an equivalent self-contained static figure or sequence and a matching caption for print and reduced-motion reading. Review the inline player at actual desktop and phone widths, including pause, replay, captions where present, and both themes. A beautiful export still needs to teach clearly in the article where it appears.

## Composition

- Fit the canvas tightly to content using autocrop or minimal explicit dimensions instead of leaving large empty gutters.
- Choose Mermaid diagram direction (`LR` or `TD`/`TB`) to fit the relationships and column reading width. Group long paths, use lanes, or split dense graphs into focused diagrams rather than shrinking labels.
- Add Mermaid's `accDescr:` line or `accDescr { ... }` block whenever its generated label summary would miss a meaningful branch, dataset, or decision. Keep the description concise and accurate, because LeetLLM uses it for alt text and book descriptions. See [Mermaid accessibility syntax](https://mermaid.js.org/config/accessibility.html).
- Keep outer padding visually even with a compact transparent gutter that protects arrowheads and edge labels without wasting reading width.
- Align repeated panels, chart baselines, and columns to a shared visual grid.
- Size components for their data rather than stretching short metric lists inside oversized boxes or forcing mismatched panel heights when top alignment works better.
- Avoid nested frames around a single chart. Use one semantic surface and keep standalone takeaways in `<figcaption>`.
- Make the primary visualization (plot, matrix, network, or geometry) the largest visual element so legends and badges stay subordinate.
- Prefer a clear visual silhouette so the reader grasps the main comparison or path immediately upon glancing at the figure.

## Typography

- Keep labels terse. Longer explanations belong in `<figcaption>` or the surrounding lesson.
- Follow [State the idea directly](./CONTENT_GUIDELINES.md#state-the-idea-directly) in labels, captions, and alt text, preserving real technical limits and uncertainty without defensive disclaimers.
- Maintain clear visual hierarchy across title, column or axis headers, primary labels, and annotations, making headers visibly stronger than cell values.
- Ensure crisp contrast in both light and dark themes, including secondary annotations.
- Judge typography at displayed reading size. Because a 2x bitmap makes edges sharper without enlarging CSS pixels, target at least 12 CSS px for primary teaching labels at both 672px desktop width and 343px phone width, and keep secondary annotations at least 10 CSS px.
- Verify website figures inline at desktop, tablet, and phone widths across both themes. The interactive zoom viewer helps inspect dense details, not excuse unreadable inline labels.
- In the reader's edition PDF, target 8.5pt for ordinary labels and maintain at least 8pt after scaling while keeping mathematical subscripts and superscripts at their natural relative scale. Reflow a wide website layout into a print override when enlarging text would otherwise cause collisions.
- Center captions only beneath symmetric visuals; left-align scan-heavy tables and traces.
- Never allow text to collide with connectors, borders, chart marks, or adjacent labels.

## Connectors and Networks

- Use the shared `Flow`, `GraphDiagram`, `Arrow`, `FlowArrow`, `Connector`, or `AxisPlot` primitives from `vizmatic`.
- Keep arrowheads proportional: `4` to `6` is standard, and never exceed `8` for article figures.
- Connect node edges cleanly so lines stay clear of text and borders.
- Maintain one consistent directional flow per figure.
- Place edge labels in open connector space, increasing spacing or rerouting edges whenever a label feels cramped.
- Minimize edge crossings; if crossings stay ambiguous, rearrange the layout or split the figure.
- Render connectors behind nodes and labels unless foreground emphasis is explicitly required.

## Charts, Axes, and Quantitative Figures

- Label axes with both variable name and unit, and state denominators for rates or sample sizes for counts when relevant.
- Use honest, aligned, shared scales for quantitative comparisons.
- Keep the chart area larger than supporting scorecards or annotations.
- Use `IntervalPlot` or whisker primitives to show confidence intervals and uncertainty explicitly, explaining in the caption what the interval represents.
- Display exact numeric values only when they help the reader verify a calculation.

## Theme and Color

- Render and inspect light and dark variants side by side.
- Inspect transparent PNGs against matching light and dark host backgrounds, including at phone width. Remember that standalone image viewers often render alpha transparency as black.
- Keep the root canvas alpha-transparent so figures blend cleanly into web surfaces and printed pages, while giving cards, panels, charts, and active regions their own theme-aware fills.
- Use an opaque root background only when the background itself carries meaning or legibility requires it.
- Give each semantic tone one consistent meaning across a figure rather than reusing the same color for unrelated roles.
- Never rely on color alone: pair color with explicit labels, position, line style, or shape.
- Select themes strictly through `ThemeMode` and Vizmatic's theme APIs rather than inferring light mode by inspecting hex color strings.
- Use the shared sans-serif font for prose and headings, reserving monospace for code and positionally aligned numbers.
- Audit explicit `Scene` and `Board` backgrounds so decorative paper-colored slabs are removed while surfaces encoding regions, states, or comparisons remain distinct.

## Curation Examples

- **Matrix multiplication:** Highlight one selected row, one selected column, their elementwise products, and the resulting scalar entry inside clean numeric arrays rather than wrapping them in three dashboard panels and a prose footer.
- **Attention mechanism:** Pair a query-key score matrix or heatmap with softmax probability bars and scaled value vectors instead of putting three summary paragraphs inside cards.
- **Glossary or concept figure:** Replace generic `input -> process -> result` boxes with concrete geometry, numerical values, tensor shapes, or branching execution paths.
- **Wide graphs:** Reflow a dense horizontal graph into clean lanes or a print layout before scaling fonts up. Never collapse a meaningful graph into a tall wall of text cards.

## Caption and Alt Text

A strong `<figcaption>` tells the reader what to look at and the key technical takeaway in one or two crisp sentences without mechanically narrating every box.

Rich `alt` text describes the visual layout, meaningful labels, numerical relationships, and conclusion for readers using screen readers. Define unfamiliar symbols inline or through the article text.

## Review Workflow

```bash
cd web
pnpm illustrations:build -- --force
cd ..
uv run scripts/review-illustrations.py
uv run scripts/validate-illustration-refs.py
uv run scripts/validate-illustration-quality.py --fail-layout-warnings
uv run scripts/validate-illustration-density.py --strict-text
```

Measure nominal label sizes for each changed article using the readability audit:

```bash
cd web
pnpm exec tsx tools/illustrations/audit-readability.ts --article foundations/python-for-ai-engineering --display-width 343 --max-display-height 800 --min-css-px 10
```

The audit evaluates the final cropped PNG dimensions and inherited font sizes against the article page's 800px height cap. When checking a narrower container or print override, pass the measured display width to `--display-width` and adjust `--max-display-height` as needed.

Inspect `/tmp/leetllm_illustrations/index.html` in canonical course order, then blog order:

1. View light and dark renders side by side.
2. Read the article title, figure name, `<figcaption>`, and `alt` text together.
3. Apply the five-part Value Gate before judging visual polish.
4. Zoom into the image to check alignment, spacing, formulas, axis scales, and arrowheads, and confirm static-PNG parity if animated.
5. Note concrete failures and required redesigns whenever a figure falls short.
6. Fix the `.tsx` source, force-rebuild the article, and re-inspect both themes.
7. Verify website inline sizing and reader's edition PDF renders at actual reading width rather than relying solely on contact sheets.

Automated validators catch structural, aspect, and text-burden defects, but they never confirm teaching value or mathematical accuracy. Completion requires human visual inspection of every rendered PNG.

Strictly typecheck changed illustration TSX files before committing:

```bash
cd web
pnpm illustrations:typecheck -- --file src/content/foundations/python-for-ai-engineering/illustrations/chapter_flow.tsx
pnpm illustrations:typecheck -- --base origin/main
pnpm illustrations:typecheck -- --all
```

## Fast Rejection Patterns

Redesign or delete an illustration immediately if it matches any of these anti-patterns:

- HTML table or Markdown comparison wrapped as a PNG (`DataTable` or grid alone with no visual encoding)
- Prose card strip (row or grid of text-heavy cards with no spatial or quantitative encoding)
- Tall vertical receipt tower, audit log stack, or figure exceeding `height <= 1.35 * width` or `height <= 820px`
- Any prose paragraph, reflection question, or fictional-data disclaimer (`"FIXTURE ONLY"`, `"synthetic"`, `"illustrative walkthrough"`, `"does not establish"`) inside the PNG
- Animated figure whose static `create(theme)` PNG disagrees with `<figcaption>`
- Generic article title card or `concept -> build -> failure -> production` box strip
- Unrelated SRE or IAM roleplay characters inside ML, math, or systems artwork
- Visual whose single-sentence teaching purpose cannot be stated clearly
