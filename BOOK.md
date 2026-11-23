# The LeetLLM Book Pipeline

The book builder turns the curriculum into a 7.5 by 9.25 inch technical book by default. Chromium renders the print layout. The merger validates the rendered parts, resolves the table of contents, and adds running heads, page numbers, PDF bookmarks, and an index.

The configuration lives in [`web/tools/book/book-config.json`](web/tools/book/book-config.json). Chapter counts come from the current lesson inventory, and page counts come from rendered PDFs. Do not copy an old estimate into the book metadata or treat a text-page estimate as the final length.

## Example Data Convention

This book adopts one global convention stated in the front matter: small worked examples, datasets, and numeric walkthroughs are constructed to help you trace the mechanics by hand. Cited measurements and explicitly recorded model runs retain their actual inputs and outputs. A prepared response can explain an idea; a claim that a model produced it requires a real run. Individual chapters and figures never repeat inline disclaimers such as `"Treat these numbers as an illustrative walkthrough"`, `"synthetic fixture"`, `"FIXTURE ONLY"`, or `"does not establish"`. Explain assumptions and limits where they change the calculation or the reader's decision.

## Build and inspect

Run these commands from the repository root:

```bash
# Show the current selection and rough source-text statistics
./build-book.sh --estimate

# Render one chapter for a fast layout proof
./build-book.sh --slug scaled-dot-product-attention

# Render one configured part
./build-book.sh --part 1

# Render the cover, reading guide, and contents
./build-book.sh --frontmatter

# Render all parts, resolve pagination, validate, and assemble the book
./build-book.sh --all

# Assemble the complete current build without rendering it again
./build-book.sh --merge

# Build the edition that includes computing, mathematics, and ML foundations
./build-book.sh --preset full --all

# Build the extended LLM reference, including project tours and specialist labs
./build-book.sh --preset reference --all
```

Install the web dependencies with `pnpm` before building. The renderer needs Chromium or Chrome; set `CHROMIUM_PATH` if the browser lives outside the detected locations. The Python merger runs through `uv` with its script dependencies.

Outputs are separated by preset:

```text
build/book/<preset>/
├── chapters/<slug>.pdf
├── parts/part-0a-cover.pdf
├── parts/part-0b-toc.pdf
├── parts/part-<number>.pdf
├── parts/part-zb-bibliography.pdf
├── parts/part-zi-index.pdf
├── index-terms.json
├── manifest.json
├── offsets.json
└── The-AI-and-LLM-Systems-Engineering-Handbook.pdf
```

Chapter and part PDFs are proofs, and a PDF viewer numbers each proof locally. The assembled book is the final artifact with printed folios, running heads, a resolved contents page, an index, and hierarchical bookmarks. Run `--all` after changing the selection, source content, rendering, or layout. `--merge` requires every current part and rejects incomplete or stale builds.

## Editions and reading order

The default `curated` edition is a reader's edition with 47 selected chapters. It is written for working software and infrastructure engineers who can read code and have no machine-learning background. Part 0 teaches the mathematics, Python and PyTorch usage, and hardware facts that later chapters assume. Individually authored reader passages develop a coherent path from a model's token stream to a reliable production application. They retain the core mechanisms, worked examples, useful figures, and engineering decisions while the complete tutorials and longer implementation labs remain available online and in the reference editions. Readers who need the prerequisites should begin with the [online curriculum](https://leetllm.com/learn) or the `full` reference edition.

The reader's edition follows seven parts:

0. **How a Model Learns.** Fit a line by gradient descent, then add the dot product and tensor shapes, softmax and cross-entropy, gradients and backpropagation. Train a next-character language model in plain Python and in PyTorch, then budget its memory and time on a GPU. Part 0 ends where tokenization begins.
1. **Models, Messages, and Measurement.** Follow tokenization into a complete Transformer, decoding, chat serialization, likelihood, and task evaluation.
2. **Evidence and Grounded Answers.** Preserve source records through ingestion and chunking, then develop retrieval, hybrid search, reranking, answer evaluation, model judges, and access control.
3. **Learning from Examples and Preferences.** Turn reviewed labels into supervised fine-tuning, correct numerical updates, adapters, reward modeling, preference optimization, and constitutional training. Reward modeling directly precedes the alignment chapter that reuses its preference example.
4. **Agents That Can Act and Recover.** Build tool schemas, constrained output, capped control loops, context selection, injection defenses, human review, and recovery from uncertain effects.
5. **Serving Under Real Workloads.** Measure end-to-end timing from the client clock before KV allocation, prefix reuse, scheduling, and quantization. Connect those mechanisms to observation, versioned releases, ready capacity, and a reproducible benchmark.
6. **Production Support Operations and Accountability.** Apply the preceding runtime and review mechanisms to responsible AI operations. Then carry one cost budget into a gateway and a complete support agent, passing named artifacts cleanly through inspectable outcomes (Part 6 in `web/tools/book/book-config.json`).

The `reference` preset preserves the earlier 133-chapter selection and its six-part order. It includes the wider architecture survey, advanced training methods, retrieval variants, orchestration, kernel labs, operator procedures, multiple system designs, and source-code tours. Use it to investigate a particular implementation after reading the focused edition.

The `full` preset retains 185 chapters. It adds computing, mathematics, neural-network, classical ML, and production ML foundations to the extended reference, producing a curriculum archive. The `curated` preset remains the default reading volume.

These counts describe the current inventory. Section-based reference presets can grow when lessons are added. The reader's edition uses explicit ordered `chapterSlugs` in each part, so a new website lesson does not silently add a book chapter. Its `readingEdition: true` setting enables the prerequisite guidance and a balanced contents layout. A part may instead select whole `sections` in canonical order, without mixing both selectors in one part. Changing this configuration does not change website navigation.

The order is specific to the book. Model mechanics and the request lifecycle precede adaptation and serving optimization. Evaluation precedes preference training and the later release decisions. Retrieval and access control precede agents that consume private evidence. Prerequisites and companion coverage are explained in the reading guide. Links to omitted lessons remain usable online.

## Selection and exclusions

Every preset omits the **Portfolio Capstones** and **AI Lab Interviewing** sections. They also omit `capstone-production-llm-agent`, which depends on the excluded document-QA, evaluation-dashboard, and fine-tuned-classifier projects.

The reader's edition excludes exhaustive project tours, kernel implementation labs, hardware catalogs, browser automation, elaborate multi-agent orchestration, operator runbooks, additional system designs, and exhaustive model-family surveys. Dedicated static-embedding history, attention internals, vector-index internals, pretraining, distributed training, protocol implementations, memory surveys, and model-parallel and MoE specialist chapters remain in the extended reference and online companion. The reader includes one complete Transformer refresher from **Preparation & Prerequisites**. Later chapters build on computing, mathematics, neural-network, classical ML, and production ML foundations that readers are expected to bring.

Evaluation, operational accountability, labeling, access control, injection defense, human review, recovery, and spending budgets remain in the reading path. Oversight follows the agent controls it relies on, including evidence of who bears errors and review friction. Differential privacy, dedicated fairness, and deeper execution-isolation treatments remain in the reference presets and online. Release decisions still require independent measurements of the actual system.

Each retained chapter adds a distinct decision, mechanism, or control. Model judges extend deterministic evaluation. Later agent chapters reuse earlier permission and evaluation checks, and the serving chapters begin with measurement before introducing optimizations. Specialist material stays available without interrupting that argument.

The builder selects visible learn lessons through the shared content loader. Blog posts, glossary entries, research packets, social banners, illustration sources, and directories containing only illustration stubs do not become chapters. Configured section and slug exclusions apply before numbering. The planner rejects duplicate assignments, unknown sections or slugs, and explicitly selected lessons excluded by visibility or book metadata.

## Independent book and website content

Use article frontmatter to declare where a lesson is eligible to appear:

```json
"visibility": {
  "website": true,
  "book": false
}
```

Omitted flags default to `true`. Set `website` to `false` and `book` to `true` for a chapter written only for the book. `hidden: true` excludes a quarantined bundle from both outputs. Book eligibility does not add a chapter automatically: the preset must still select its slug or section. Website visibility controls listings, direct routes, aliases, and Markdown exports. Blog posts support website visibility but remain outside the curriculum book selection.

Unmarked prose is shared. Use paired audience comments for explanations, exercises, figures, or transitions that belong to one output:

```markdown
<!-- leetllm: audience:website:start -->
Continue to the next lesson using the course navigation.
<!-- leetllm: audience:website:end -->

<!-- leetllm: audience:book:start -->
Use the chapter bookmarks to revisit the retrieval pipeline before extending it.
<!-- leetllm: audience:book:end -->
```

The same markers can surround a short inline phrase. Put block markers on their own unindented lines and keep each fenced code block or figure complete inside its intended audience. Nested blocks use the intersection of their audiences, so a website-only block nested inside a book-only block appears in neither. Every start must close with the same audience, including in omitted content. Invalid markers fail with the source file and line. Literal examples of markers inside fenced, indented, or inline code remain unchanged.

The loaders select the audience before resolving citations, reading time, exercises, and images. Website consumers and the extended reference use the `reference` edition by default. The curated book uses `getQuestions("book", "reader")`. Cache keys include both choices. Full source stays available to authoring tools. Mermaid images retain their original source ordinals when an earlier diagram is omitted. Book-specific illustration layouts and reviewed caption notes remain separate from website artwork.

Use edition blocks when a chapter needs a separately edited reading manuscript:

```markdown
<!-- leetllm: edition:reference:start -->
The complete tutorial, including its implementation variants and exercises.
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->
The chapter's continuous argument, worked example, and transition.
<!-- leetllm: edition:reader:end -->
```

Edition and audience blocks may nest, and both conditions must match for text to appear. Preserve the complete reference body when adding a reader manuscript; author the new version deliberately and verify its examples separately. A chapter without edition blocks remains shared. The `readingEdition` preset setting chooses the reader manuscript and its print assets. Original Mermaid ordinals remain stable across both editions.

Keep variants beside the shared explanation in `content.md` rather than adding renderer string replacements for editorial wording. The selected lesson order can then change without silently editing the website's teaching path. Validate both rendered views after an audience edit:

```bash
(cd web && corepack pnpm exec vitest run src/lib/content-audience.test.ts src/lib/content-bundle.test.ts src/lib/questions-audience.test.ts src/lib/blog-audience.test.ts)
uv run scripts/test-content-audience.py
uv run scripts/validate-content-structure.py
uv run scripts/validate-python-examples.py --audience book --edition reader --no-default-deps
```

The example validator selects the requested view before execution and preserves original source offsets when refreshing output. `--no-default-deps` uses each example's declared dependencies and explicit `--with` packages, avoiding the validator's broad tutorial-library defaults. Run reference examples separately when their implementation changes.

## Print presentation

| Element | Book treatment |
|---|---|
| Paper | 7.5 × 9.25 inches, with mirrored margins, set by `trimSize`. `letter` and `a4` also work. |
| Fonts | Source Serif 4, Inter, and JetBrains Mono, bundled in `web/tools/book/fonts` under the SIL Open Font License |
| Body | 10.5/14.5 pt serif, justified and hyphenated, on a column 5.65 inches wide |
| Code | 7.75/11 pt listings with preserved indentation, a restrained syntax palette, and faint line numbers |
| Output | Separate output listings without line numbers |
| Checkpoints | Question followed by its answer, with Markdown, code, and math preserved |
| Figures | Cropped vector art, with ordinary labels near 8.75 pt and numbered 8 pt captions |
| Sources | A bibliography for each chapter, and one for the whole book |
| Navigation | Contents, running heads, folios, an index of glossary terms, and PDF bookmarks |

The renderer removes browser-only mastery quizzes and navigation callouts such as **Next** and **Course complete**, along with headings left empty by those removals. It keeps substantive exercises, worked answers, recap sections, and technical conclusions. A heading named "Next steps" is not sufficient reason to discard the rest of a chapter.

Paragraphs split across pages with widow and orphan control. Compact code listings stay together; longer listings keep small opening and closing fragments. Code results stay with the preceding listing where space permits.

A figure cannot split, so one that does not fit jumps to the next page and leaves a hole behind. [`web/tools/book/reflow.ts`](web/tools/book/reflow.ts) lets the following text move up and the figure float to the top of the next page, as a typesetter would. It measures the real page breaks in the browser and keeps the arrangement with the smallest holes. It does not move a figure past a major heading, another figure, or text that refers to the figure above. `scripts/review-book-layout.py` measures the result.

Course links included in the edition receive chapter references. Links to omitted lessons and other companion material use public website URLs. Add `?view=online` to a lesson link when it explicitly opens the complete online tutorial, including for a lesson present in the book. That link remains external in the assembled PDF. Citations become a numbered bibliography at the end of each chapter so a printed copy still identifies its sources.

## Part and chapter opening pages

Each part in the reader's edition opens with a motivational narrative and a numbered, clickable map of its chapters. A part's `description` in `book-config.json` accepts either one plain-text string or an array of paragraphs. Use the part opening to frame why the broader journey is worth taking and pose a clear technical question the reader can carry through it. Keep mechanism summaries, worked cases, and detailed learning goals in the chapter introductions. Chapter links come from the planned selection and become internal PDF destinations during assembly.

The reader's edition enables `chapterIntroductions: true`. Every selected chapter must have an authored file at `web/tools/book/introductions/<slug>.json`. The builder rejects missing or malformed introductions before rendering. Other presets can enable the same setting once their selected chapters have introductions. Review prerequisite and next-chapter connections whenever a preset changes the reading order.

Each file contains a `paragraphs` array of plain-text strings. Choose its length to suit the chapter. A `framing` heading, an `outcomes` array, and a `question` are optional; include them only when they add something the chapter opening needs. Outcomes describe skills the chapter actually teaches. A question should invite reasoning about a concrete puzzle. Omitted components produce no labels, boxes, or extra spacing.

Opening material is authored book text. Shared technical explanations and edition-specific passages stay in the article's `content.md`. The introduction uses the chapter title and replaces its short metadata summary. When the chapter already opens with a clear problem or worked example, use `{ "paragraphs": [] }` to begin directly with that body. Add orientation only where it makes the transition from the preceding chapter easier. Avoid repeating the first worked example or forcing an otherwise unnecessary page break.

Introduction files and their loader participate in the build fingerprint. After editing them, rebuild with `--all`. Review each opening alongside its chapter body and inspect a rendered proof for repeated motivation, stranded headings, and excessive space before the first explanation. A successful schema check never guarantees the prose quality of an introduction.

## Book illustrations

The builder creates separate print assets automatically through [`web/tools/illustrations/book.ts`](web/tools/illustrations/book.ts) and [`web/tools/diagrams/book.ts`](web/tools/diagrams/book.ts). The renderer rejects unresolved Mermaid blocks rather than printing diagram source as code. There is no need to rebuild website assets before making a book.

Print assets live in `build/book/illustrations/<section>/<slug>/`. Each figure is a cropped SVG so it stays sharp at any zoom, with a PNG beside it as a fallback. [`web/tools/illustrations/lib/svg-print.ts`](web/tools/illustrations/lib/svg-print.ts) removes the masks and nested images in Satori's output, because Chromium's PDF backend turns them into small bitmaps. Assets use a light palette, transparent backgrounds, and cropping in both dimensions. The transform removes the outer frame, decorative shadows, and presentation titles. It moves subtitles and explanatory notes into caption notes while preserving compact labels, formulas, axes, and internal borders that show technical grouping. Every figure must use genuine visual encoding within `height <= 1.35 * width` and `height <= 820px`, contain zero prose paragraphs or disclaimers inside the image, and keep its static print render completely aligned with its `<figcaption>` (including when the web version is animated).

Print-specific layouts live in `web/tools/book/figures/<article-slug>/<figure-name>.tsx`. These modules export `width`, `height`, and `create(theme)`. Use them when a wide web figure needs larger labels or a different arrangement for the reading page. The builder retains caption notes from the original figure by default. An override can export `captionNotes` to replace those notes after editorial review, including an empty array when the authored caption and adjacent prose already explain every removed band. Check the combined printed figure and caption before omitting notes. Separate source corrections can improve the website article too; print layouts do not replace its generated assets.

A reviewed `<figure data-book-caption="complete">` also suppresses extracted presentation notes for that figure. Use it only after checking that the authored caption and adjacent prose preserve every qualification. Unmarked figures retain their notes.

Only illustrations retained by the selected book edition require print assets. Omitted figures do not enter the print manifest. The illustration cache fingerprints article sources, print overrides, every local file that they import at any depth, the book transform, local fonts, the lockfile, and the installed Vizmatic renderer bytes. Editing those inputs regenerates the affected print assets on the next render. Run `pnpm install --frozen-lockfile` before building so the installed renderer matches the source pin.

The reader's edition raises ordinary illustration labels to an 8.5 pt target and preserves mathematical script proportions. Each figure then prints at the scale that puts its ordinary labels near 8.75 pt, within the column and a height limit of 465 pt. Labels therefore match across the book, whatever canvas a figure was drawn on.

Raising a label keeps its hand-placed position, so it can grow into its neighbor. The builder checks the layout for labels that overlap, wrap out of a fixed-height line, or spill out of their box. It steps the target down until the figure is clean, and it warns with `Colliding labels` or `Small print labels` when a figure needs redrawing for the column. Treat those warnings as work for an authored print override. The archival full and reference presets retain their authored typography; their complete illustration sets have not received this review.

Mermaid print assets live in `build/book/diagrams/<section>/<slug>/`. Print uses SVG text labels, so a diagram embeds as vector art with the bundled fonts. A diagram with math keeps HTML labels and embeds as a PNG at four times its layout size. Both variants use the light theme on a transparent background, with a small buffer for strokes and glyphs. Website frames, gradients, shadows, and padded panels are omitted; semantic node and cluster borders remain. Their cache fingerprints the retained source diagrams, renderer, local fonts, and package versions. Original source ordinals remain stable when an earlier diagram is website-only. Reviewed captions in `web/tools/book/diagram-captions.ts` explain the retained reader's-edition diagrams without listing every node again.

Print Mermaid layouts use larger node and edge labels with tighter spacing. Each diagram prints at the scale that puts its labels near 8.75 pt, like other figures; wide or tall diagrams must still meet the 8pt final-size minimum. Wide flows can use book-only vertical layouts; long sequence diagrams can become two focused diagrams while retaining their participants, decisions, and handoffs. Keep website and book fences inside explicit audience blocks when their layouts differ.

Website figures have a full-size reading view with zoom, panning, keyboard dismissal, and theme-appropriate artwork. Review inline legibility separately from that enlarged view. A sharp high-resolution image can still have type that is too small at article width.

A transform cannot judge whether a sentence is essential to understanding a visual. Inspect the generated figure together with its caption. Confirm that labels, values, relationships, and qualifications remain clear at the size used on the printed page. Redesign an individual source figure when its layout still depends on slide-like prose, HTML-table cards, or oversized empty panels.

## Pagination and assembly

The full build renders a cover, draft frontmatter, every planned part, and the bibliography. It scans chapter opening labels in the PDFs to find actual page offsets, finds glossary terms on the body pages, and renders the index. Then it renders the contents again, and it repeats the scan until the page offsets stop changing. It fails if pagination does not converge.

`manifest.json` records the selection, rendering fingerprint, and hashes of rendered artifacts. `offsets.json` records the matching part and chapter page offsets. The merger checks that the planned chapters appear exactly once and in order, verifies the input PDFs, and requires matching offsets before writing the final volume.

The title page, contents, every part, every chapter, and the back matter open on a right-hand page. The merger adds a blank page when one would otherwise start on the left, including the inside cover. Front matter uses roman numerals from the contents onward, and the cover, title page, and copyright page carry none. Arabic numbering starts at 1 with the first part. PDF page labels match the printed folios, so a PDF viewer shows the same numbers.

The merger adds the folio and a running head at the outer edge of each body page. A left page names the chapter, and a right page names the current section. It finds sections through named destinations that Chromium emits for hidden anchors in each chapter. Openings carry only a folio at the foot, and blank pages carry nothing. Chromium's local proof headers are disabled for assembled parts, preventing duplicate headers.

The index is generated automatically. The merger looks for each glossary term on the body pages and keeps the eight pages that use it most. It drops terms that appear on more than a fifth of the pages, because an entry for those helps nobody. Treat it as a concordance of glossary terms rather than a hand-curated index.

The cover and part openers use art from [`web/tools/book/cover-art.ts`](web/tools/book/cover-art.ts). Each is a Vizmatic stage arc diagram of real scaled dot-product attention weights, computed with a causal mask over tokens: the opening sentences of the book for the cover, and the chapter titles for a part. The renderer embeds the art as vector. Optional `coverTitleLines` in the configuration sets deliberate line breaks; the lines must join to the complete `title`. Review the cover at full size and as a thumbnail after changing either the title or subtitle.

## Public PDF

Publish editions under `gs://static.brunovolpato.com/books/`. Keep an immutable object containing the edition, release date, and SHA-256 prefix, then copy the verified release to its alias:

| Preset | Public alias |
|---|---|
| `curated` | `leetllm-handbook.pdf` |
| `full` | `leetllm-handbook-full.pdf` |
| `reference` | `leetllm-handbook-reference.pdf` |

The application route [`web/src/app/book/route.ts`](web/src/app/book/route.ts) redirects GET and HEAD requests at [leetllm.com/book](https://leetllm.com/book) to the reader's-edition alias. Updating a PDF alias takes effect independently of application deployments.

Before uploading, run `--merge` to verify the current source fingerprint, part hashes, and offsets. Upload with `Content-Type: application/pdf` and an inline content disposition so browsers can view the book. Use an immutable one-year cache policy for a versioned object and a five-minute cache policy for the alias. Use GCS generation preconditions to prevent accidental replacement of a versioned release or a concurrent alias update. The bucket already permits public object reads; publication does not require changing its IAM policy.

Verify the public object's full SHA-256 against the local PDF, its content type and disposition, HTTP byte-range support, and the complete `/book` redirect chain. Sample the published PDF again before announcing it. Keep the previous versioned release available for rollback.

## Editorial validation

Run the focused rendering and PDF assembly checks from the repository root:

```bash
(cd web && corepack pnpm exec vitest run tools/book tools/illustrations/book.test.tsx)
uv run scripts/test-merge-book.py
uv run scripts/test-review-book-layout.py
uv run scripts/review-book-layout.py build/book/curated/The-AI-and-LLM-Systems-Engineering-Handbook.pdf --out build/book/layout-review --dpi 85 --margin-pt 12
```

The layout utility rasterizes every page and produces labeled contact sheets, image geometry, and a JSON review queue. Use a fresh output directory for each changed PDF. It also measures how far the ink reaches down each body page, and it queues pages that end with more than a quarter of the text block empty (`--max-hole`). The `page_fill` block in its summary reports the mean, the 90th percentile, and the worst pages. Chapter endings, openings, blank pages, and front matter do not count. Bounds, replacement glyphs, and sparse-page hints help locate problems, though they never prove that illustrations, pagination, or prose are correct. Inspect the sheets, then open suspect pages and representative figures at reading size.

Before distributing an edition:

- Review the contents and part descriptions for prerequisite continuity. Check chapter openings and endings at each moved section transition.
- Inspect representative pages with long code, wide tables, display math, checkpoints, nested callouts, and figures. Look for clipped text, small labels, stranded headings, and unnecessary blank space.
- Verify contents page numbers, continuous folios, bookmarks, and the first and last chapter in every part against the assembled PDF.
- Check exclusions and confirm that browser quiz JSON, course navigation, research packets, and social artwork do not appear as book content.
- Read and verify individual chapter bundles against [`CONTENT_GUIDELINES.md`](CONTENT_GUIDELINES.md), including their cited primary sources, runnable examples, and figures. The PDF builder checks assembly and rendering; factual accuracy and teaching quality require individual editorial review.

## Implementation map

| File | Responsibility |
|---|---|
| [`build-book.sh`](build-book.sh) | Root command wrapper |
| [`web/tools/book/book-config.json`](web/tools/book/book-config.json) | Editions, exclusions, part order, and publication metadata |
| [`web/tools/book/build.ts`](web/tools/book/build.ts) | Selection, source fingerprints, asset preparation, rendering, and pagination loop |
| [`web/tools/book/planner.ts`](web/tools/book/planner.ts) | Ordered chapter and section selection |
| [`web/src/lib/content-audience.ts`](web/src/lib/content-audience.ts) | Shared article visibility and passage selection |
| [`web/tools/book/renderer.tsx`](web/tools/book/renderer.tsx) | Print content, checkpoints, figures, citations, frontmatter, and contents |
| [`web/tools/book/styles.ts`](web/tools/book/styles.ts) | Print typography, page geometry, and break rules |
| [`web/tools/book/fonts.ts`](web/tools/book/fonts.ts) | Bundled fonts as `@font-face` rules |
| [`scripts/build-book-fonts.py`](scripts/build-book-fonts.py) | Cuts the static Source Serif 4 instances from the variable sources |
| [`web/tools/book/reflow.ts`](web/tools/book/reflow.ts) | Moves figures past following text to close page holes |
| [`web/tools/book/cover-art.ts`](web/tools/book/cover-art.ts) | Cover and part-opener art from real attention weights |
| [`web/tools/illustrations/lib/svg-print.ts`](web/tools/illustrations/lib/svg-print.ts) | Removes the SVG constructs that Chromium would rasterize |
| [`web/tools/illustrations/book.ts`](web/tools/illustrations/book.ts) | Cached print variants of illustrations |
| [`web/tools/diagrams/book.ts`](web/tools/diagrams/book.ts) | Cached transparent Mermaid print variants |
| [`scripts/merge-book.py`](scripts/merge-book.py) | PDF validation, offset scanning, running heads, folios, index terms, and bookmark assembly |
