# LeetLLM Illustration Framework

> **Quality standard:** Read [ILLUSTRATION_GUIDELINES.md](../ILLUSTRATION_GUIDELINES.md) before creating or reviewing a figure. This framework explains how to render; the guidelines decide whether a visual deserves to exist.

Run the commands below from the repository root unless a section changes directories.

For readable source structure, checked scaffolds, formatting and isolated review output,
start with the [illustration authoring guide](../web/tools/illustrations/README.md).
Imported TSX parts belong in `illustrations/_parts/`; the builder excludes that reserved
folder from render entries while preserving its transitive source dependencies.

## Philosophy

**Problem:** Mermaid handles short left-to-right flowcharts and compact sequence diagrams well, but long paths become unreadably small when forced across a page. It also cannot create rich conceptual illustrations such as neural network architectures, matrix visualizations, probability diagrams, attention heatmaps, and embedding space plots.

**Solution:** A **JSX-to-PNG pipeline** using [Satori](https://github.com/vercel/satori) + [Resvg](https://github.com/nicolo-ribaudo/resvg-js) that renders React-like elements to high-quality images at build time.

Choose Mermaid direction and grouping to fit the relationships being taught. Check the rendered dimensions and final-size labels rather than imposing a five-node limit. For cramped flows, use lanes, grouping, or focused figures instead of shrinking text.

### Why This Approach?

| Requirement | How We Solve It |
|:------------|:----------------|
| **AI-agent friendly** | Satori takes plain JSX/objects - the format AI writes best |
| **Low-coordinate common path** | Shared layout primitives cover ordinary cards, flows, grids, charts, and callouts without manual x/y positioning |
| **Theme-aware output** | Shared layout, typography, semantic color, and light/dark rendering |
| **Surface-aware output** | Alpha-transparent root canvas blends into web and print backgrounds |
| **No browser needed** | Pure Node.js - runs in CI, build scripts, anywhere |
| **Already in stack** | Next.js project already has React & Node.js |
| **Scalable** | Each illustration is a standalone `.tsx` file |
| **NOT SVG** | AI writes JSX + CSS objects, NOT SVG paths/coords |

### How It Works

```
TSX file (JSX + styles)  →  Satori (JSX → SVG)  →  Resvg (SVG → PNG)  →  Embedded in article
```

> #### Watermark
> Article figures render without a watermark by default. The optional
> `--watermark` flag adds the shared LeetLLM mark in the top-right corner.
> Book figures omit it. Individual sources do not need to draw a mark.

---

## Directory Structure

```
web/
├── node_modules/vizmatic/         # Published shared primitives, themes, and renderer
├── tools/illustrations/
│   ├── lib/
│   │   ├── cache.ts               # Build caching and invalidation
│   │   ├── watermark.ts           # LeetLLM-specific watermark
│   │   └── primitives.test.ts     # Integration tests for Vizmatic primitives
│   └── build.ts                   # CLI: renders dark and light article illustrations
└── src/content/{section}/{article}/
    ├── content.md                 # JSON frontmatter plus complete article
    ├── _research.md               # Article-specific primary-source research
    └── illustrations/             # Standalone TSX sources and extracted inline fences
        ├── attention_flow.tsx     # Optional standalone illustration source
        └── _generated/            # Output (gitignored)
            ├── attention_flow_dark.png
            └── attention_flow_light.png
```

Illustrations can also be embedded directly in `content.md` fences:

````markdown
```typescript render="illustration" name="attention_flow" alt="..." caption="..."
import React from 'react'
import { Scene, defineIllustration } from 'vizmatic'

export const width = 920
export const height = 520

const illustration = defineIllustration((c) =>
  React.createElement(Scene, { c, title: 'Attention flow' }, ...)
)

export const create = illustration.create
export default illustration.default
```
````

> #### Important
> Import reusable themes, charts, flows, mathematical labels, connectors, and
> rendering primitives directly from the versioned `vizmatic` dependency.
> `web/tools/illustrations/` owns LeetLLM-specific source discovery, caching,
> watermarking, and light/dark build orchestration. It does not contain a local
> `lib/primitives.ts`, `lib/theme.ts`, or `lib/render.ts` module.

---

## Theme System

All illustrations share a consistent visual language:

### Theme selection

Use the installed Vizmatic theme tokens and semantic color helpers. The current
web dependency is pinned to Vizmatic 0.7.3. Do not copy palette hex values into
figure-local light/dark detection; select the mode explicitly with `ThemeMode`.

`defineIllustration` passes theme colors to its callback. Full illustration modules loaded by this builder do not consume a module's `preset` export. A bare-frame preset processed by the Vizmatic CLI is a different entry point, so adding `export const preset = 'engineering'` to a full module does not change its colors or typography.

Use readable semantic tones for emphasis and transparent composition canvases.
Keep fills on meaningful regions, charts, and selected cells. An explicit
`Board({ background: c.bgSubtle })` paints an opaque surface even when the final
PNG renderer requests transparency.

### Typography

Choose sizes from the figure's final displayed width. At the website's 343px
phone figure width, primary labels and values should remain at least 12px and
secondary annotations at least 10px. Keep prose in the shared sans face; reserve
monospaced type for code and aligned numerical data. The readability audit below
measures the final crop and the page's height cap.

### Dimensions and Aspect Limits

Every article illustration must obey two hard geometric limits: `height <= 1.35 * width` and source `height <= 820px`. These ceilings prevent tall vertical receipt towers, stacked log walls, and cramped phone-width cards.

- **Standard canvas:** 800×500 (landscape diagrams and plots)
- **Wide canvas:** 1000×400 (compact flows and timelines)
- **Square canvas:** 600×600 (matrices, heatmaps, and coordinate plots)
- **Vertical canvas:** 600×800 (layered network or vertical architecture, staying under 1.35× width and 820px height)

---

## Primitives Library

These are pre-built, composable JSX components that AI agents use to construct illustrations.

### Common-case rule

Use `defineIllustration`, `Scene`, `Row`, `Column`, `Flow`, `LayeredNetwork`, `GraphDiagram`, `StepCard`, `MetricCard`, `ProgressRow`, `ProgressList`, `MiniBarChart`, `Panel`, `Card`, `Grid`, `DataTable`, `StackedBar`, `BarChart`, `LineChart`, `ScatterPlot`, `QuadrantChart`, `CalloutCard`, and `BadgePill` before hand-rolling local boxes, arrows, titles, font weights, or x/y coordinates. Drop to raw CSS/SVG only when the diagram needs custom geometry.

Shared text primitives are wrapping-safe by default. `TextLabel`, `Panel`, `Card`, `StepCard`, `MetricCard`, `DataTable`, `Grid`, and chart labels set `minWidth: 0`, cap text to the parent width, and break long labels before they can push fixed cards or chart annotations out of frame. Prefer these components plus explicit `width`, `minWidth`, `height`, `minHeight`, `gap`, and `padding` props over manual `position: absolute`, raw `left` / `top`, negative margins, or hard-coded SVG text coordinates.

### `defineIllustration` - Theme boilerplate removal

Use this instead of repeating `getThemeColors`, `ThemeMode`, `ThemeColors`, `create(theme)`, and default dark export in every fence.

```tsx
const illustration = defineIllustration((c) =>
  React.createElement(Scene, { c, title: 'Title', subtitle: 'Subtitle' }, ...)
)

export const create = illustration.create
export default illustration.default
```

### `Scene` / `Row` / `Column` - Standard page and layout wrappers

`Scene` combines `Canvas` and `TitleBar`, applies shared typography, and provides one content column. `Row` and `Column` are thin flexbox wrappers with shared `gap`, `align`, `justify`, and `wrap` behavior.

Root canvas renders alpha-transparent by default. Keep fills on semantic components such as `Panel`, `Card`, and chart regions. If whole figure requires an opaque theme canvas, export `const opaqueBackground = true`; builder then preserves root `Scene` or `Canvas` background.

Article PNGs omit scene-level titles provided by the surrounding lesson, remove decorative shadows, and crop both axes with a small even gutter. Explicit two-axis cropping also trims small imbalances below Vizmatic's default 10% savings threshold. Internal panel headings, borders, semantic fills, labels, and connector geometry remain intact. The same treatment applies to wrapped scenes and animation poster frames. GIFs retain their fixed frame dimensions so motion does not shift the canvas. Cropping removes outer empty space, though oversized panels still require an authored layout correction. The web cache fingerprints each figure's transitive local import graph and a framework hash containing shared helper files, the builder, `pnpm-lock.yaml`, and the installed Vizmatic version. A local helper change rebuilds figures that depend on it; a lockfile change invalidates the full corpus. The book cache also includes the dependency lockfile.

```tsx
React.createElement(Scene, {
  c,
  title: 'Next-token prediction loop',
  subtitle: 'Predict, append, repeat',
},
  React.createElement(Row, { gap: 12 },
    StepCard({ title: 'Prompt', subtitle: 'The cat sat', c, tone: 'purple' }),
    FlowArrow({ direction: 'right', c }),
    StepCard({ title: 'Next token', subtitle: 'on', c, tone: 'green' }),
  )
)
```

### `ToneName` / `getToneColor` / `getToneGradient`

Use shared tones instead of local `toneGradient` / `toneColor` maps. Current tones: `blue`, `purple`, `green`, `warm`, `cyan`, `pink`, `red`, `critical`, `neutral`, `sunset`, `ocean`, `dark`.

```tsx
const accent = getToneColor("purple", c)
const gradient = getToneGradient("green")
```

### `Panel` / `Card` - Shared card surfaces

Use `Panel` for titled illustration panels with a tone strip. Use `Card` for lighter containers that may or may not have a title.
Both now support `minWidth` / `minHeight`, which is the preferred way to keep flow cards readable without resorting to negative positioning hacks.

```tsx
<Panel title="PCA axes" tone="purple" c={c} width={320} height={180}>
  <TextLabel text="columns of V become directions" c={c} />
</Panel>
```

### `Flow` / `DetailList` / `CalloutCard` - Standard repeated story blocks

Use `Flow` for simple left-to-right or top-to-bottom staged diagrams. Use `DetailList` for repeated short rows inside cards. Use `CalloutCard` for final takeaways or warnings.

```tsx
React.createElement(Flow, {
  c,
  stages: [
    { title: 'Preference data', subtitle: 'chosen vs rejected', tone: 'blue', lines: ['same prompt', 'labeler choice'] },
    { title: 'Reward head', subtitle: 'one scalar score', tone: 'purple', lines: ['base LM', 'score head'] },
    { title: 'Trust check', subtitle: 'before RLHF', tone: 'warm', lines: ['held-out eval', 'watch drift'] },
  ],
})
```

### `LayeredNetwork` - Neural network and DAG anatomy

Use `LayeredNetwork` for common left-to-right network diagrams instead of local x/y helpers for nodes, connection lines, labels, active paths, formulas, and legends.

```tsx
React.createElement(LayeredNetwork, {
  c,
  activePath: [0, 1, 2, 1],
  annotations: ['w * x + b', 'activation', 'softmax'],
  formula: 'neuron output = activation(weighted sum + bias)',
  layers: [
    { title: 'Input', tone: 'blue', nodes: ['x_1', 'x_2', 'x_3'] },
    { title: 'Hidden', tone: 'purple', nodes: ['h_1', 'h_2', 'h_3'] },
    { title: 'Output', tone: 'green', nodes: ['y_1', 'y_2'] },
  ],
})
```

### `GraphDiagram` - Arbitrary DAGs and state transitions

Use normalized node coordinates from 0 to 1. Edges connect cleanly to node edges, include arrowheads, and can be dashed or muted for skipped paths.

```tsx
<GraphDiagram
  c={c}
  nodes={[
    { id: "triage", label: "Triage", x: 0.5, y: 0.1, tone: "purple" },
    { id: "order", label: "Order lookup", x: 0.25, y: 0.5, tone: "blue" },
    { id: "faq", label: "FAQ", x: 0.75, y: 0.5, muted: true },
    { id: "format", label: "Format", x: 0.5, y: 0.9, tone: "green" },
  ]}
  edges={[
    { from: "triage", to: "order", tone: "blue" },
    { from: "triage", to: "faq", muted: true, dashed: true, label: "skip" },
    { from: "order", to: "format", tone: "green" },
  ]}
/>
```

### `Box` - Labeled rectangle

```tsx
<Box label="Multi-Head Attention" color="primary" width={200} />
```

### `Arrow` / `FlowArrow` / `Connector` - Directional connectors

```tsx
<Arrow direction="down" label="residual" />
<FlowArrow direction="right" label="eig" tone="cyan" c={c} />
```

Use `VectorArrow` for arbitrary SVG angles, `VectorSegment` for a vector without an arrowhead, and `SvgPoint` for reusable SVG circles:

```tsx
VectorArrow({ x1: 40, y1: 90, x2: 150, y2: 32, color: c.primaryLight })
VectorSegment({ x1: 80, y1: 80, x2: 140, y2: 42, color: c.secondaryLight })
SvgPoint({ cx: 140, cy: 42, r: 5, fill: c.secondaryLight })
```

Use `AxisPlot` for vector planes, point clouds, PCA axes, and small math plots. Pass `arrow: false` or omit it for vectors with no arrowhead.

```tsx
<AxisPlot
  c={c}
  width={220}
  height={160}
  xMin={-1}
  xMax={1}
  yMin={-1}
  yMax={1}
  vectors={[{ x1: 0, y1: 0, x2: 0.8, y2: 0.6, tone: "blue" }]}
  points={[{ x: 0, y: 0, fill: c.bgCard, stroke: c.borderLight }]}
/>
```

### `Stack` - Vertical/horizontal group

```tsx
<Stack direction="vertical" gap={12}>
  <Box label="Layer Norm" color="secondary" />
  <Box label="Self-Attention" color="primary" />
  <Box label="Feed Forward" color="positive" />
</Stack>
```

### `Matrix` - Grid of values with optional color coding

```tsx
<Matrix
  data={[[0.9, 0.1], [0.3, 0.7]]}
  rowLabels={["cat", "sat"]}
  colLabels={["cat", "sat"]}
  format="decimal"
  colorize
/>
```

### `TiledMatrix` - Symbolic tensors and active block regions

Use `TiledMatrix` when the visual point is spatial structure rather than exact
cell values: active attention tiles, convolution windows, block-sparse regions,
matrix partitioning, and tensors that should not be materialized. Regions use
half-open row and column bounds.

```tsx
<TiledMatrix
  c={c}
  rows={8}
  cols={8}
  regions={[{ rowStart: 2, rowEnd: 4, colStart: 4, colEnd: 6, tone: "green" }]}
  title="active score tile"
/>

<TiledMatrix c={c} rows={8} cols={8} title="full S" crossedOut muted />
```

### `DataTable` - Compact text table

Use this inside a larger diagram for small symbolic tables, matrices with non-numeric entries, or labeled examples rather than local `div` grids. Never export a standalone `DataTable` as a PNG when a Markdown table in the article communicates the same comparison.

```tsx
<DataTable
  rows={[
    ["", "w_1", "w_2"],
    ["x", "0.8", "0.2"],
  ]}
  c={c}
  math
/>
```

### `StackedBar` - Composition and denominator shifts

Use `StackedBar` for proportions, utilization, token budgets, population
composition, and before/after denominator changes. Segment widths remain
proportional to their values. Labels that cannot fit inside narrow segments are
shown in the legend instead of overlapping the chart.

```tsx
<StackedBar
  c={c}
  width={480}
  segments={[
    { label: "fraud", value: 95, color: "primary", valueLabel: "16%" },
    { label: "false alarms", value: 495, color: "warning", valueLabel: "84%" },
  ]}
/>
```

### `Grid` - Plain flex grid

Use `Grid` for non-tabular blocks such as token patches, neighborhoods, tiles, and simple matrix-like visuals that need per-cell tones.

```tsx
<Grid
  rows={[
    [{ label: "q", tone: "purple" }, "k", "v"],
    ["0.7", { label: "0.2", tone: "green" }, "0.1"],
  ]}
  c={c}
  math
/>
```

### `TextLabel` / `formatMathText` / `MathText` - Inline labels

Use `TextLabel` for reusable theme-aware labels. Use `formatMathText` or `MathText` for simple subscripts and superscripts inside HTML text nodes:

```tsx
<TextLabel text="projection axis" c={c} variant="small" color={c.textPrimary} />
formatMathText("w_2 x x_2")
MathText({ text: "L(N,D) = E + A/N^alpha" })
```

Avoid SVG `<text>` for labels unless you have verified the renderer accepts that exact case. Positioned HTML labels are more reliable in Satori.

### `BadgePill` - Small semantic badge

Use this for short stage codes, state pills, and compact labels instead of hand-rolling tiny bordered `div`s.

```tsx
<BadgePill text="KV" tone="cyan" c={c} />
<BadgePill text="Prefill" tone="purple" c={c} filled mono={false} width={100} height={32} />
```

### `GradientChip` - Full-color title + subtitle chip

Use this for prompt blocks, stable-prefix segments, storage tiers, or any prominent labeled chip with a gradient surface.

```tsx
<GradientChip
  title="tool schema"
  subtitle="stable JSON"
  tone="blue"
  c={c}
  width={184}
/>
```

### `StepCard` - Flow/question/decision card

Use this for repeated "question -> signal -> decision" and similar flow layouts instead of local `Card(...)` helpers.

```tsx
<StepCard
  title="24 GB+ GPU"
  subtitle="Room after OS and KV cache"
  tone="green"
  c={c}
  width={205}
/>
```

### `MetricCard` - Compact KPI/value card

Use this for metric rows, cache blocks, and small label/value/detail readouts.

```tsx
<MetricCard
  label="TTFT"
  value="100-500ms"
  detail="End-to-end first token"
  tone="purple"
  c={c}
  width={178}
/>
```

Use `valueFontSize` and `valueColor` when a metric should become the visual focus instead of writing local hero-number markup.

### `ProgressRow` / `ProgressList` - Compact score bars

Use these for router probabilities, relevance scores, budget usage, or ranked rows where a full chart would be too heavy.

```tsx
<ProgressList
  c={c}
  rows={[
    { label: "E1", value: 0.52, valueLabel: "0.52", tone: "green" },
    { label: "E2", value: 0.17, valueLabel: "0.17", muted: true },
  ]}
/>
```

### `MiniBarChart` - Tiny distribution bars

Use this inside panels for histograms, category frequencies, sampling traces, or small value comparisons where full chart axes would add clutter.

```tsx
<MiniBarChart
  c={c}
  data={[
    { label: "0", value: 1, tone: "purple" },
    { label: "1", value: 4, tone: "purple" },
    { label: "2", value: 2, tone: "purple" },
  ]}
  max={4}
  showValues
/>
```

### `Tile` / `TileGrid` - Uniform mini-card grids

Use this alongside charts, diagrams, or arrows when you need uniform compact tiles rather than hand-rolling `.map(...)` over styled `div`s. Never ship a standalone prose card strip of `TileGrid` boxes with no spatial or quantitative encoding. Each tile supports an optional `icon`, `eyebrow`, tone-colored `title`, `subtitle`, and bulleted `lines`. `TileGrid` lays them out in a single wrapping row by default, or in a column of rows when you pass `columns`.

```tsx
<TileGrid
  c={c}
  columns={2}
  tiles={[
    { icon: '🧠', eyebrow: 'lever', title: 'Prompt caching', subtitle: 'reuse stable context', tone: 'blue', lines: ['same prefix', 'cheap hits'] },
    { icon: '🔀', eyebrow: 'lever', title: 'Model routing', subtitle: 'send easy to small', tone: 'purple', lines: ['classifier', 'fallback'] },
    { icon: '📦', title: 'Batch', subtitle: 'latency tolerant', tone: 'green', lines: ['50% off'] },
    { icon: '⚙️', title: 'Quantize', subtitle: 'self-host', tone: 'warm', lines: ['int8/4'] },
  ]}
/>
```

A single `Tile` is also exported for cases where you want to place one tile inside a custom layout.

### `CodeBlock` - Monospace code / scratchpad / trace block

Use this inside a broader mechanism visual for short code snippets, token-merge traces, or JSON payloads instead of hand-rolling stacked `div`s with `fontFamily: 'JetBrains Mono'`. Pair code blocks with genuine visual encoding (arrows, charts, or matrices) rather than exporting standalone text blocks as PNGs. Lines can be plain strings or `{ text, tone, dim, prefix }` specs; a toned line gets a tinted background and colored text. Optional `title` header (with a tone dot), `showLineNumbers`, and `tone` accent.

```tsx
<CodeBlock
  c={c}
  title="token-merge-trace"
  tone="purple"
  showLineNumbers
  lines={[
    'Input: "playing"',
    { text: 'Step 1: [p, l, a, y, i, n, g]', tone: 'blue' },
    { text: 'Step 2: merge (i, n) -> "in"', tone: 'purple' },
    { text: 'Output: ["play", "ing"]', tone: 'green', prefix: '>' },
    { text: '# subword vocabulary hit', dim: true },
  ]}
/>
```

### `Comparison` - Side-by-side tone-labelled panels

Use this for "before vs after", "naive vs optimized", or any 2 to 3 way structural contrast when paired with charts, matrices, or flows, instead of hand-rolling a `Row` of two `Panel`s with tone borders. Each side is a tone-labelled panel (title, optional subtitle/eyebrow, and either `lines` or arbitrary `children`); pass `divider` (or `divider: true` for a "vs" chip) to drop a connector between sides. Panels equalize height automatically.

```tsx
<Comparison
  c={c}
  divider
  sideWidth={320}
  sides={[
    { title: 'Standard attention', subtitle: 'O(N^2) HBM matrix', tone: 'red', eyebrow: 'baseline', lines: ['materializes N x N scores', 'high memory traffic'] },
    { title: 'Tiled FlashAttention', subtitle: 'online softmax in SRAM', tone: 'green', eyebrow: 'improved', lines: ['streams Q, K, V tiles', 'avoids N x N writeback'] },
  ]}
/>
```

### `KeyValueList` - Label-to-value spec rows

Use this as a compact supporting block alongside a chart or diagram for config or hyperparameter readouts (`model: gpt-4o`, `temperature: 0.7`, tensor dimensions) instead of hand-rolling rows with `justifyContent: 'space-between'`. Never ship a standalone `KeyValueList` or receipt tower as an entire PNG. The key sits left, and the value (mono by default) sits right; pass `tone` per row to color a value, and `divider` (default on) for hairlines between rows. Place inside a `Panel` or `Card` for a titled spec block.

```tsx
<KeyValueList
  c={c}
  keyWidth={130}
  rows={[
    { key: 'model', value: 'gpt-4o' },
    { key: 'temperature', value: '0.7', tone: 'green' },
    { key: 'cache_hit', value: 'true', tone: 'cyan' },
    { key: 'latency', value: '42 ms', tone: 'warm' },
  ]}
/>
```

### `WindowFrame` - Browser / terminal / app window chrome

Use this to wrap content in a window chrome (traffic-light dots + title bar) instead of hand-rolling browser mocks, terminal panes, or app windows. `variant: 'browser'` renders the title as a URL pill; `'terminal'` uses a dark mono surface; `'window'` is a plain app window. Body can be any content (compose with `CodeBlock`, `KeyValueList`, `Tile`, etc.).

```tsx
<WindowFrame c={c} variant="browser" title="https://mlflow.example.com/runs/42" width={360}>
  <KeyValueList c={c} rows={[{ key: 'val_loss', value: '0.412', tone: 'blue' }]} />
</WindowFrame>

<WindowFrame c={c} variant="terminal" title="gpu ~ profiler" tone="green" width={340}>
  <CodeBlock c={c} background="transparent" lines={[{ text: '$ nsys profile python train.py', tone: 'green' }]} />
</WindowFrame>
```

### `StatusList` / `StatusRow` - Check / cross / warn status rows

Use this for compact validation gates or pass/fail overlays paired with a visual diagram rather than hand-rolling rows with colored borders, and never ship a prose-only status card list as a PNG. Each row has a `status` (`check`/`cross`/`warn`/`info`/`pending`/`dot`) that picks a glyph marker and default tone (override with `tone`), a `label`, and an optional right-aligned `detail`. Rows are boxed (tinted + bordered) by default; pass `boxed: false` for plain rows.

```tsx
<StatusList
  c={c}
  rows={[
    { label: 'JSON parses', status: 'check' },
    { label: 'within token budget', status: 'check', detail: '820/1024' },
    { label: 'tool timeout', status: 'cross', detail: '>30s' },
    { label: 'low confidence', status: 'warn' },
    { label: 'retry pending', status: 'pending' },
  ]}
/>
```

Note: check/cross glyphs (✓ ✗) are allowed here, whereas directional **arrow** glyphs (→ ▶ ▼) are forbidden (use the `Arrow` primitive for those).

## Layout Guardrails

- Prefer `Scene`, `Row`, `Column`, `Flow`, `LayeredNetwork`, `GraphDiagram`, `Panel`, `Card`, `StepCard`, `MetricCard`, `ProgressList`, `MiniBarChart`, `GradientChip`, `CalloutCard`, and `BadgePill` before writing local helpers.
- Require genuine visual encoding in every figure: include plots (`LineChart`, `BarChart`, `ScatterPlot`, `IntervalPlot`, `AxisPlot`), matrices/heatmaps (`Matrix`, `Heatmap`, `TiledMatrix`), vector geometry (`VectorArrow`, `createPlotArea`), network/architecture diagrams (`LayeredNetwork`, `GraphDiagram`), or directional flows (`Flow`). Reject HTML-tables-as-PNGs (`DataTable`-only figures), prose card strips (`TileGrid`/`StepCard`/`Panel` text walls), and tall vertical receipt towers.
- Enforce compact canvas dimensions: `height <= 1.35 * width` and source `height <= 820px`. Keep zero prose paragraphs and zero fictional-data disclaimers (`"FIXTURE ONLY"`, `"synthetic"`, `"illustrative walkthrough"`, `"does not establish"`) inside rendered PNGs.
- Prefer flexbox wrapping and `minWidth` / `minHeight` over absolute positioning.
- For charts or plot-like visuals, use `BarChart`, `LineChart`, `ScatterPlot`, `QuadrantChart`, `IntervalPlot`, `AxisPlot`, or the shared `createPlotArea` helper. These centralize margins, scales, baseline placement, and clipped point labels so article files do not hand-code `x` / `y` math.
- Avoid negative margins and manual overlap tricks. The validator already treats those as layout warnings and can fail them in CI.
- Generated PNG validation now inspects rendered pixels for content touching canvas edges, so cached images can still fail if they are clipped even when the source render step was skipped.
- Source validation also compares every illustration source against `scripts/illustration-layout-baseline.json`. Existing coordinate-heavy illustrations are grandfathered, but any new source or edited source that increases `position: absolute`, manual edge offsets, or raw SVG coordinate counts fails `validate-illustration-quality.py`. To intentionally migrate an illustration toward safer layout, reduce those counts and then refresh the baseline with `uv run scripts/validate-illustration-quality.py --write-layout-baseline`.

### `Heatmap` - Attention-style weighted grid

```tsx
<Heatmap
  data={attentionWeights}
  xLabels={tokens}
  yLabels={tokens}
  title="Self-Attention Weights"
/>
```

For qualitative comparison matrices, use rectangular cells, wider row labels,
custom cell text, and the semantic strength scale:

```tsx
<Heatmap
  data={[
    [0.2, 0.55, 0.9],
    [0.9, 0.55, 0.2],
  ]}
  labels={[
    ["low", "mid", "high"],
    ["high", "mid", "low"],
  ]}
  xLabels={["Prompt", "RAG", "Fine-tune"]}
  yLabels={["Fresh knowledge", "Easy setup"]}
  cellWidth={150}
  cellHeight={44}
  rowLabelWidth={140}
  colorScale="strength"
/>
```

Keep the default `heat` scale for numeric intensity. Use `strength` only when
higher values consistently mean a stronger relative advantage across every row.

### `ChartFrame` - Standard chart container

Use this when building a custom chart that needs the same title, subtitle, legend, footer, card radius, and theme-aware background as the built-in charts.

### `createPlotArea` - Shared chart margins and scales

Use this when a custom plot genuinely needs raw SVG geometry. It returns one
source of truth for `x`, `y`, `right`, `bottom`, `innerWidth`, and
`innerHeight`, which keeps axes, labels, and marks aligned.

```tsx
const plot = createPlotArea(520, 260, { top: 24, right: 28, bottom: 42, left: 54 })

React.createElement('line', {
  x1: plot.x,
  y1: plot.bottom,
  x2: plot.right,
  y2: plot.bottom,
  stroke: c.borderLight,
})
```

### `BarChart` - Small metric bars with axes

Supports explicit `min`/`max`, custom value formatting, compact labels, and positive/negative domains with a clamped zero baseline.

```tsx
<BarChart
  title="Bootstrap samples"
  data={[
    { label: "r1", value: 0.79, color: "primary" },
    { label: "r2", value: 0.84, color: "primary" },
  ]}
  min={0.7}
  max={0.9}
  format={(value) => value.toFixed(2)}
/>
```

### `LineChart` - Curves, training traces, and tradeoff frontiers

```tsx
<LineChart
  title="Loss over steps"
  series={[
    { name: "train", points: [1.8, 1.1, 0.7, 0.45], color: "positive", area: true },
    { name: "val", points: [1.9, 1.3, 0.9, 0.7], color: "secondary" },
  ]}
  labels={["0", "1", "2", "3"]}
  yAxisLabel="loss"
/>
```

### `ScatterPlot` - 2D math and embedding plots

```tsx
<ScatterPlot
  title="Embedding space"
  points={[
    { x: 0.8, y: 0.9, label: "king", color: "primary" },
    { x: 0.7, y: 0.3, label: "queen", color: "positive" },
  ]}
  xAxisLabel="feature 1"
  yAxisLabel="feature 2"
/>
```

### `QuadrantChart` - Qualitative decision maps

Use normalized point coordinates from 0 to 1. Region labels and semantic shading make routing, risk, and portfolio tradeoffs readable without pretending qualitative axes are precise measurements.

```tsx
<QuadrantChart
  title="Model routing map"
  xAxisLabel="task difficulty"
  yAxisLabel="policy constraint"
  regions={{
    topLeft: { label: "self-hosted", color: "secondary" },
    topRight: { label: "closed frontier", color: "warning" },
    bottomLeft: { label: "efficient lane", color: "positive" },
    bottomRight: { label: "premium reasoning", color: "primary" },
  }}
  points={[
    { x: 0.2, y: 0.2, label: "summary", color: "positive" },
    { x: 0.8, y: 0.8, label: "legal QA", color: "warning" },
  ]}
/>
```

### `IntervalPlot` - Confidence intervals and uncertainty ranges

```tsx
<IntervalPlot
  title="Confidence interval"
  data={[
    { label: "Model A", low: 0.20, mid: 0.50, high: 0.80, color: "secondary" },
    { label: "Model B", low: 0.33, mid: 0.67, high: 1.00, color: "positive" },
  ]}
  min={0}
  max={1}
  axisLabel="sample estimate"
/>
```

### `Pipeline` - Horizontal flow with stages

```tsx
<Pipeline
  stages={[
    { label: "Input" },
    { label: "Tokenize" },
    { label: "Embed" },
    { label: "Transform" },
    { label: "Output" },
  ]}
/>
```

---

## Current Pattern Catalog

Scan scope: 546 embedded illustration sources across `web/src/content/**/content.md`.

### Frequency Summary

| Pattern | Evidence | Component implication |
|:--|:--|:--|
| Modern skeleton | 97 fences use `defineIllustration` / `Scene`; 449 still repeat manual theme exports | New and touched fences should use `defineIllustration` + `Scene` |
| Cards and panels | 160 files define local card/panel helpers; helper names include `card` 52 times and `panel` 31 times | Highest-value base primitive is a flexible `Panel` / `Card` with tone strip, title, subtitle, body, footer, width, and height |
| Flows and connectors | 45 fences use `Flow`; many older fences still compose arrows and local stage cards manually | Use `Flow` for simple stage stories and `FlowArrow` / `Connector` before local connector helpers |
| Charts | 116 files use chart primitives; imports include `BarChart` 91, `LineChart` 45, `ScatterPlot` 5, `IntervalPlot` 4 | Chart primitives are already the strongest reuse story; next work should polish options rather than replace them |
| Tables, matrices, grids | `DataTable` now appears in 28 fences; older snippets still define local table/matrix/grid helpers | Use numeric `Matrix`, symbolic `TiledMatrix`, `DataTable`, and plain `Grid` before local grids |
| Score/rank bars | Router probabilities, retrieval scores, distribution bars, and budget rows repeatedly appeared as local flex bars | Use `ProgressRow` / `ProgressList` and `MiniBarChart` before local score-bar helpers |
| SVG geometry | 66 fences use raw layout or SVG geometry | Use `LayeredNetwork`, `GraphDiagram`, `SvgFrame`, `VectorArrow`, `VectorSegment`, `SvgPoint`, and `AxisPlot` before raw SVG geometry |
| Token/chip/badge/legend UI | Common helper names include `token`, `chip`, `badge`, `legendItem`, and `pill` | Add small primitives for token strips, badges, legends, and labeled swatches |
| Tone/theme mapping | Gradient use is concentrated: blue 199, green 198, purple 188, warm 165, cyan 93, pink 38 | Centralize tone maps so article helpers don't each rebuild `toneGradient` and `toneColor` |

### Section Distribution

| Section | Illustration files |
|:--|--:|
| `fundamentals` | 174 |
| `blog` | 72 |
| `system-design` | 63 |
| `foundations` | 53 |
| `agents` | 39 |
| `llmops` | 51 |
| `training` | 46 |
| `preparation` | 28 |
| `retrieval` | 20 |

### Rollout Order

1. Use `defineIllustration` and `Scene` for new or touched embedded illustrations.
2. Use `Flow`, `DetailList`, `ProgressList`, `MiniBarChart`, `Row`, `Column`, and `CalloutCard` for simple staged diagrams before local helpers.
3. Use `Panel` / `Card`, tone utilities, and chart/grid primitives for repeated pieces.
4. Keep custom SVG, absolute positioning, and local helpers for genuinely custom geometry only.
5. Migrate old hand-rolled snippets opportunistically when touching the article, not as one risky bulk rewrite.

Local article helpers should remain for domain-specific composition, but low-level cards, arrows, tables, labels, circles, and axes should move into primitives as each pattern gets rolled out.

---

## How to Use in Articles

### Referencing Generated Images

In `content.md`, reference illustrations using standard markdown images:

```markdown
![Transformer Architecture](illustrations/_generated/transformer_block.png)
```

The markdown renderer already handles `<img>` tags through `rehype-raw`.

### Build & Review Commands

```bash
# From the repository root:

# Render for one article (recommended during development)
pnpm --dir web illustrations:build:article foundations/linear-regression-from-scratch --force

# Batch review: generates /tmp/leetllm_illustrations/index.html with side-by-side light/dark for every illustration
uv run scripts/review-illustrations.py
```

After any illustration change, also run the automated guards:

```bash
uv run scripts/validate-illustration-quality.py --fail-layout-warnings
uv run scripts/validate-content-structure.py
uv run scripts/validate-illustration-refs.py
```

---

## Creating New Illustrations (Current Best Practice)

The framework has evolved significantly with the addition of 20+ article-specific `chapter_flow` visuals and supporting diagrams. Follow the modern patterns below.

### Workflow

1. Add a `typescript render="illustration"` fence inline in `content.md`.
2. Put `alt` and `caption` on the fence metadata so the article remains readable while editing Markdown.
3. Use `defineIllustration` + `Scene` as the default skeleton.
4. Prefer shared primitives (`Flow`, `LayeredNetwork`, `GraphDiagram`, `Row`, `Column`, `StepCard`, `MetricCard`, `ProgressList`, `MiniBarChart`, `Panel`, `Card`, `DataTable`, `Grid`, `BarChart`, `LineChart`, `ScatterPlot`, `QuadrantChart`, `CalloutCard`, `BadgePill`, etc.) imported directly from `vizmatic`.
5. For complex visuals, define article-specific helpers inside the fence; reusable low-level building blocks belong in the shared `vizmatic` package.
6. Build: `pnpm --dir web illustrations:build:article <section>/<slug> --force`.
7. Review: run `uv run scripts/review-illustrations.py` (generates a side-by-side light/dark HTML gallery at `/tmp/illustration_review.html`) **and** inspect the specific PNGs.
8. Validate: `uv run scripts/validate-illustration-quality.py --fail-layout-warnings` and `uv run scripts/validate-content-structure.py`.

### Import Paths (from an embedded `content.md` illustration fence)

```ts
import { Scene, Flow, StepCard, defineIllustration } from 'vizmatic'
```

### Canonical Modern Skeleton (Recommended)

```tsx
import React from 'react'
import { Flow, Scene, defineIllustration } from 'vizmatic'

export const width = 920
export const height = 560

const illustration = defineIllustration((c) =>
  React.createElement(Scene, {
    c,
    padding: 32,
    title: 'Article-Specific Visual Title',
    subtitle: 'One clear sentence describing the job of this image.',
  },
    React.createElement(Flow, {
      c,
      stages: [
        { title: 'Input', subtitle: 'what arrives', tone: 'blue' },
        { title: 'Transform', subtitle: 'what changes', tone: 'purple' },
        { title: 'Output', subtitle: 'what leaves', tone: 'green' },
      ],
    })
  )
)

export const create = illustration.create
export default illustration.default
```

**Critical rules (enforced or strongly recommended):**
- Always put rich, specific `alt` and `caption` metadata on the fence. Do not duplicate the same text as exported constants unless the illustration is a standalone `.tsx` source.
- Always export `create` and a dark-mode default through `defineIllustration`. The build script uses `create` for theme variants and auto-cropping.
- Use `defineIllustration((c) => ...)` instead of importing `getThemeColors`, `ThemeMode`, or the raw `colors` object in article fences.
- Use shared tone and surface primitives (`ToneName`, `getToneColor`, `getToneGradient`, `Panel`, `Card`) before local tone maps or panel helpers.
- Use shared arrow/vector/point/table/network primitives (`Arrow`, `FlowArrow`, `Connector`, `VectorArrow`, `VectorSegment`, `SvgPoint`, `DataTable`, `Grid`, `Matrix`, `AxisPlot`, `LayeredNetwork`, `GraphDiagram`) before hand-rolling low-level shapes. Local helpers are fine for article-specific composition.
- Use `Arrow` / `FlowArrow` for flex connectors and `VectorArrow` for arbitrary SVG angles. Never use text glyphs (▶ ▼ ▲ ◀) or manual CSS triangles. The quality validator forbids the glyphs.
- `Scene` is the preferred root for new illustrations. Complex `chapter_flow` visuals may still use custom composition, but should keep repeated cards, tables, arrows, tones, and layout wrappers in shared primitives where practical.
- `position: 'absolute'` is supported for overlays (e.g., browser window mocks, precise labels) but every positioned container must still be inside a flex context.
- No React hooks or browser state inside illustration sources. Timeline animation uses explicit serializable state passed to a pure render function.
- Every parent `div` with multiple children **must** declare `display: 'flex'`.

### Animated / Multi-Scene Illustrations

Use the Vizmatic stage engine for new teaching animations. Export `createFilm(theme)` from the illustration's `.tsx` entry alongside `create(theme)`, which supplies the static figure. The film can live in an imported `_parts/*.ts` helper. `createFilm` returns a `FilmDefinition` built with `film` from `vizmatic/stage`; choose `paper` for the light theme and `midnight` for the dark theme, or another legible pair of looks. Keep both versions on the same clock and canvas.

The illustration builder renders themed H.264 MP4s at 1280px width, writes `<name>_film.json` and WebVTT caption tracks, and retains the two static PNGs. The article's existing `<img src="illustrations/_generated/<name>_dark.png">` automatically becomes a film viewer when all these outputs exist. No extra Markdown syntax or browser-side animation package is needed. Playback starts when the reader chooses **Play animation**, with native pause, seeking, captions, fullscreen, and playback-speed controls where supported by the browser. Leaving the viewport pauses playback. The initial figure remains still for readers who prefer reduced motion; they can choose to play it. Printing uses the light static figure.

Use `s.chapter(...)` to divide a longer explanation into meaningful steps, and compute marks, readouts, and checks from the same underlying values. Favor movements that preserve object identity: follow a point through a transformation, propagate values between neighboring states, move tokens through a model, or update a decision boundary as weights change. Use the stage engine's layout helpers, morphs, camera, mathematical notation, and domain objects to make those relationships visible. Allow enough time to inspect each result. A complete explanation can use several focused films beside their corresponding paragraphs.

For an existing TSX figure that only needs a small transition, `createAnimation(theme)` remains supported. It emits dark/light GIFs, static PNG fallbacks, and an animation manifest. GIF playback offers play/restart controls but cannot seek to a particular instant. Choose only one motion export (`createFilm`, `createAnimation`, or `createScenes`) per figure.

**Static-PNG / caption parity:** Because reduced-motion users, initial page loads, and print builds display the static PNG returned by `create(theme)`, that static frame must stand on its own and match every claim made in `<figcaption>`. Never write a caption whose key insight only appears in an intermediate animation frame absent from the static fallback.

```tsx
import { Scene, defineAnimation, getThemeColors, hold, tween, type ThemeMode } from 'vizmatic'

type State = { transfer: number }

function renderFrame(theme: ThemeMode, state: Readonly<State>) {
  const c = getThemeColors(theme)
  return (
    <Scene c={c} title="One mechanism">
      <div style={{ display: 'flex', transform: `translateX(${state.transfer * 500}px)` }}>
        moving value
      </div>
    </Scene>
  )
}

export function createAnimation(theme: ThemeMode) {
  return defineAnimation<State>({
    initial: { transfer: 0 },
    timeline: [
      hold(900, 'input'),
      tween<Partial<State>>(
        { transfer: 1 },
        { duration: 2400, easing: 'ease-in-out', label: 'transfer' },
      ),
      hold(1100, 'output'),
    ],
    fps: 10,
    render: (state) => renderFrame(theme, state),
  })
}

export function create(theme: ThemeMode = 'dark') {
  return renderFrame(theme, { transfer: 1 })
}
```

Keep GIF loops slow enough to read and include input and output holds. Animate one teaching job per GIF. Use opacity, scale, flex width, or transform interpolation so objects keep visual continuity instead of jumping between owners. Stage films can develop a mechanism at its natural pace without a loop-length target.

Use legacy `createScenes(theme)` only for genuinely discrete steps. Builder renders `_sceneN_dark.png` / `_sceneN_light.png` pairs and site viewer provides step controls.

### Chapter Flow Illustrations (Foundations & Preparation)

Most foundations and preparation articles use a dedicated `chapter_flow.tsx` as their primary teaching visual. These must be **highly article-specific**, showing the concrete running example of the lesson (the 5-point latency dataset and residual plot for linear regression, the token-attention heatmap for attention, or the unrolled RNN hidden states on a real token sequence).

- Show the lesson's actual mechanism, data, or state changes with genuine visual encoding inside `height <= 1.35 * width` and `height <= 820px`. Judge this by inspecting the figure with the article; filenames and stock phrases never guarantee teaching value.
- The `<figcaption>` in `content.md` should tell the beginner what to inspect and what the figure demonstrates. Review it with the image for clarity and technical accuracy; there is no minimum character count or forbidden opening phrase.
- The `alt` text in the TSX should be the full descriptive version of the same idea.
- Keep zero prose paragraphs and zero fictional-data disclaimers (`"FIXTURE ONLY"`, `"synthetic"`, `"illustrative walkthrough"`) inside the PNG.

These chapter flows are the visual heart of the foundation layer. Treat them with the same rigor as the written explanation.

---

## What Satori DOES Support

| Feature | Supported | Notes |
|:--------|:---------:|:------|
| `display: flex` | ✅ | Full flexbox support |
| `gap`, `padding`, `margin` | ✅ | All spacing |
| `border`, `borderRadius` | ✅ | Full border support |
| `background`, `backgroundColor` | ✅ | Solid + gradients |
| `backgroundImage` (gradients) | ✅ | Linear + radial |
| `boxShadow` | ✅ | Drop shadows |
| `opacity` | ✅ | Transparency |
| `fontSize`, `fontWeight`, `color` | ✅ | Full text styling |
| `width`, `height` (fixed + %) | ✅ | Dimensional control |
| `overflow: hidden` | ✅ | Clipping |
| Emoji | ✅ | Full emoji support |
| `position: absolute` | ⚠️ | Supported but use sparingly |

## What Satori doesn't support

| Feature | Alternative |
|:--------|:-----------|
| `display: grid` | Use nested `flex` layouts |
| `transform: rotate()` | Use separate elements for angled text |
| CSS animation inside one frame | Use Vizmatic `defineAnimation` and render a GIF timeline |
| `<canvas>` | N/A |
| `<svg>` inline | Limited support |

---

## Example Gallery

### 1. Transformer Block (Architecture)

Uses `Stack` + `Box` + `Arrow` primitives to show the encoder/decoder structure with residual connections.

### 2. Attention Heatmap (Matrix)

Uses `Heatmap` with token labels to visualize which tokens attend to which others.

### 3. Probability with Balls

Uses `Balls` primitive to show Bayes' theorem visually with colored circles.

### 4. Matrix Multiplication

Uses `Matrix` to show how Q×K^T produces attention scores, with color-coded cells.

### 5. Embedding Space

Uses `VectorSpace` to show word analogies (king - man + woman = queen) as 2D points.

### 6. Pipeline Flow

Uses `Pipeline` to show RAG pipeline stages from query to answer.

---

## Quality Review Checklist

After updating illustrations, inspect the generated PNGs in light and dark. Use `uv run scripts/review-illustrations.py` for coverage and composition, then enlarge candidates and every changed figure. Check the website and print variants at reading size.

Run `pnpm exec vizmatic check <source.tsx> --theme dark,light --json` for static layout, typography, and contrast diagnostics. LeetLLM pins the published Vizmatic `0.8.3` package in both web and video lockfiles. The web package also applies `patches/vizmatic@0.8.3.patch`: line-chart endpoints must lie on their axis values, including 0% and 100%, instead of moving inward to accommodate markers. The matching source fix belongs in Vizmatic's next release; remove the package patch after upgrading to that release. The diagnostics and presentation tests under `tools/illustrations/lib/` exercise numeric labels, cropping, and chart geometry. Inspect changed figure output after upgrading the package, since the library version and lockfile participate in the illustration cache fingerprint.

Pay special attention to:
- Genuine visual encoding (plots, matrices, heatmaps, vector geometry, network diagrams, or compact flows), rejecting HTML-tables-as-PNGs, prose card strips, and tall receipt towers
- Aspect ratio `height <= 1.35 * width` and source `height <= 820px`
- Zero prose paragraphs or fictional-data disclaimers (`"FIXTURE ONLY"`, `"synthetic"`, `"illustrative walkthrough"`) inside PNGs
- Static-PNG (`create(theme)`) parity with `<figcaption>` for animated figures
- Fidelity between the image and the explanatory `<figcaption>` in `content.md`
- Whether the visual is truly domain-native and article-specific (no generic learning-flow templates or unrelated SRE roleplay)
- Text overflow inside cards, arrow collisions, and edge clipping (the build catches some via `detectOverflow`, but not all internal layout issues)

### Visual Defects to Watch For

| Defect | Symptom | Root Cause | Fix |
|:-------|:--------|:-----------|:----|
| **Text overflow/clipping** | Text cut off at card edges or runs outside container | Container too narrow for content | Widen or reflow the component, shorten the label, or move explanation into the caption. Preserve readable type and complete technical labels. |
| **Label overlap** | Two text elements stacked on top of each other | Missing gap, wrong flexDirection, or insufficient padding | Add proper `gap` values and ensure `flexDirection: 'column'` with adequate spacing |
| **Empty boxes (□) instead of emoji** | Black squares where icons should be | Satori's emoji rendering needs the element to have no other font-family override | Use emoji in plain text divs without `fontFamily: 'JetBrains Mono'` or similar overrides |
| **Legend overflow** | Bottom legend text spills outside its container | Text placed as child of a dot div instead of a sibling text div | Ensure legend items follow the pattern: `[dot div] + [text div]` not `[dot div with text inside]` |
| **Oversized sparse panels** | A short list occupies the top of a tall box | Fixed height or stretching beside a larger chart | Use natural height and top alignment, or redesign the comparison. Match heights only when aligned rows or scales require it. |
| **Content touching edges** | Elements flush against the image edges | Insufficient padding on the root container | Keep an even gutter of roughly 24 to 48 logical pixels, including space for arrowheads and labels. |
| **Misaligned arrows/connectors** | Arrows or lines not properly centered between elements | Missing `alignItems: 'center'` + `justifyContent: 'center'` on arrow containers, or using text glyphs instead of the Arrow primitive | Import the `Arrow` primitive from `vizmatic`; always center arrow containers |
| **Canvas too small** | Content crammed or overlapping | Declared width/height insufficient for content | Increase `export const width` / `height` to fit content with breathing room while staying within `height <= 1.35 * width` and `height <= 820px` |
| **Absolute positioning issues** | Elements overlapping or escaping their containers in complex layouts (browser mocks, flow labels) | `position: 'absolute'` used without proper containing flex context or z-order | Pair every absolute element with a flex container; prefer flex + gap over absolute when possible |

### Review Process (One-by-One Visual QA)

When doing a large batch of new or updated illustrations (for example across foundations, preparation, or agents):

1. Build the changed article(s) with `--force` (or use multiple `--article` flags in separate invocations).
2. Run `uv run scripts/review-illustrations.py` to generate a single browsable side-by-side light/dark HTML gallery at `/tmp/leetllm_illustrations/index.html`. Open it in a browser for fast scanning across images.
3. For each illustration that looks suspicious, open the individual `_light.png` (and `_dark.png`) and cross-check against the defects table.
4. Fix issues in the source `.tsx`, rebuild only that article, and refresh.
5. Before finishing the batch, run the full automated guards:
   ```bash
   uv run scripts/validate-illustration-refs.py
   uv run scripts/validate-illustration-quality.py --fail-layout-warnings
   uv run scripts/validate-illustration-density.py --strict-text
   uv run scripts/validate-content-structure.py
   ```
6. Review each corresponding `<figcaption>` with its image (including the static fallback for animated figures) and correct unclear or inaccurate explanations. The content validator checks caption presence; a human reviewer must verify whether it explains the figure accurately.

The goal of the one-by-one visual pass is not merely visual polish, but ensuring the visual and its caption together teach the exact mechanism the article promises.

### Common Satori Gotchas

- **Every parent with multiple children MUST have `display: 'flex'`** - Satori crashes otherwise
- **`flexGrow` / `flex: 1`** can collapse to zero-size elements - always verify
- **Text never wraps automatically** unless the container has a fixed width
- **`borderStyle: 'dashed'`** isn't supported by Satori - use solid borders or emoji decoration instead
- Satori treats **`gap`** as a CSS gap (works), but doesn't support `grid` - use nested flex only
- **Long text** in fixed-width cards will overflow - always test with the longest possible content
