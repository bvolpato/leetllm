# LeetLLM Content Guidelines

This handbook defines the voice, teaching standards, and structural contracts for LeetLLM. Every article, blog post, book chapter, figure, and mastery check exists to help an intelligent reader genuinely understand AI/ML and LLM engineering from first principles.

---

## Teaching Philosophy and Voice

LeetLLM is a coherent, progressive curriculum taking a motivated engineer, student, or career switcher from computing and math foundations to production LLM systems and code-level studies of modern AI infrastructure. Interview readiness is the natural byproduct of mastery, never a cram sheet.

Write at the caliber of **O'Reilly systems monographs, Andrej Karpathy's walkthroughs, and 3Blue1Brown's visual intuition**:

- **Teach generously from intuition to mechanism.** Start from why an idea exists, trace small concrete numbers by hand, and build one complete working mechanism cleanly before introducing formalism, edge cases, or alternatives.
- **Respect the reader's intelligence and time.** Use "you" and "we" naturally. Never dismiss hard steps with `"obviously"`, `"trivially"`, `"just"`, or `"simply"`.
- **Keep one voice across web and print.** Every paragraph should earn its place on both the website and the printed page of *The AI & LLM Systems Engineering Handbook* (`BOOK.md`, `docs/book-voice.md`).
- **Use analogies and visual intuition confidently.** A marble rolling down a valley makes gradient descent visible; a branching maze makes search tangible. Map the familiar object cleanly to the real math and carry it while it clarifies the computation.

### Curriculum-Wide Convention for Worked Examples

Small worked examples, tiny datasets, and hypothetical numbers throughout LeetLLM are constructed so the reader can trace a calculation or mechanism by hand. Cited measurements and recorded model runs preserve real inputs and outputs. A prepared example can illustrate an idea; claiming that a model produced an output requires a real run.

**State this convention here and in `BOOK.md`, never as an inline disclaimer inside articles, captions, or figures.**

---

## The 10 Teaching NONOs

Eliminate these ten anti-patterns across all prose, captions, quizzes, code blocks, and illustrations.

### NONO 1: Lawyer-Vetted Defensive Disclaimers

Never interrupt teaching with paranoid caveats (`"does not prove/guarantee/measure/establish X"`, `"Treat these numbers as an illustrative walkthrough"`, `"simplified example does not capture..."`, `"synthetic fixture"`, `"FIXTURE ONLY"`). State real assumptions once beside the calculation they affect, and place real numerical or operational limits where the reader can understand their consequences.

| Avoid | Teach instead |
|---|---|
| "Treat these numbers as an illustrative walkthrough; they do not establish production latency." | "On this four-request batch, KV reuse cuts prefill work by 60%. Benchmark steady-state throughput on your target GPU before tuning batch size." |
| "This small example does not prove convergence in general." | "With step size 0.1, loss drops from 4.20 to 0.08 in twelve steps. Above $2 / L$, updates overshoot and diverge." |

### NONO 2: SOC2, Compliance, and SRE Ticket Roleplay in Non-Ops Lessons

Never shoehorn bureaucratic vocabulary or corporate ticket theater into math, ML, deep learning, NLP, vision, RL, or GPU lessons.

- **Ban corporate roleplay casts** (`Luna`, `acct_10234`, `K10234`, `P-7`, `P-14`, `RUN-842`, `C17`, `R42`, `DeployBuddy`, `INC-48291`, `luna-48291`, `09:12`, `ticket #48291`, `0.005000 USD` gateway ceilings, escalation workflows) outside lessons literally about support workflows, billing, or IAM.
- **Ban compliance dialect in non-ops prose:** replace `fixture`, `contract`, `boundary`, `admit`/`admission`, `receipt`, `provenance`, `authority`, `establish` (hedging), `supplied`, `bounded`, `fail-closed`, `governed`, `policy`, `gate`, `audit`, `ledger`, and `needn't` with plain technical English. Keep narrow literal exceptions (`pytest fixture`, `decision/token/word boundary`, API/schema contract, formal data lineage, IAM authorization, RL `policy`, LSTM/SwiGLU `gate`, and genuine ops/serving/security lessons).
- **Use domain-native examples:** familiar English words and sentences for NLP/attention (`"The dog chased the cat"`), image tensors and kernels for vision, gridworlds and MDPs for RL, vectors/matrices/distributions for math and stats, tiles/warps/SRAM/HBM/KV blocks for GPU and serving, repos/diffs/tests for coding agents, and docs/chunks/citations for RAG.

### NONO 3: Zero-ML Mocks, Pocket-Calculator Filler, and `isinstance` Type-Police Boilerplate

Never fake ML code with unused `import numpy as np`, 200-line CRUD dict validators, hardcoded model answers, or walls of `isinstance(x, bool)`, `type(x) not in (int, float)`, and repetitive `math.isfinite(...)` checks. Use real, runnable **NumPy, PyTorch, scikit-learn, SciPy**, or crisp algorithmic code that genuinely computes the mechanism. Reserve validation boilerplate strictly for schema-validation, data-quality, or numerical-stability lessons.

- **Only include code when it teaches mechanism:** Never insert a Python block solely to multiply three constants, assert an obvious sum, or print a small lookup table that a one-line equation or Markdown table explains faster.
- **Highlight the mechanism and fold runnable scaffolding (GitHub PR-diff style):** Keep scripts runnable end to end, but tuck non-teaching setup (imports, dataclasses, fixture data, and trailing print/assert harnesses) behind clickable `...` edge expanders using `# fold:start <label>` / `# fold:end` comment pairs or `focus="12-26"` fence metadata (longer Python blocks also auto-fold leading imports and trailing print/assert drivers unless `nofold` is set). Readers see the core 10 to 30 lines immediately and click `...` to inspect the full runnable scaffolding.

### NONO 4: Kitchen-Sink Scope Creep in Core and Easy Lessons

Do not derail introductory lessons with premature edge cases or tangential proofs (Gauss-Markov BLUE in introductory linear regression, SQLite triggers in a first LLM app, or all-`-\infty` `NaN` mask trivia and `BFloat16` corners before teaching the forward pass of attention). Build one clean core mechanism first; move optional proofs or deep corners into `<details><summary>Deep dive: ...</summary>...</details>` or a later lesson.

### NONO 5: Ephemeral Library Changelogs in Timeless Conceptual Prose

Never bake dated package trivia (`"As of TRL 1.17.1, rechecked Nov 4, 2026"`, `"bitsandbytes 0.50.2 / scikit-learn 1.9"`) into timeless conceptual prose. Teach durable principles; isolate brief version notes or volatile blog metadata (`verifiedAt` / `refreshAfter`) only when genuinely needed.

### NONO 6: Dry Syllabus-Abstract Openings

Never open with `"In this lesson, you will learn X, Y, and Z"`, `"This section introduces..."`, `"Where this chapter sits"`, or a course-position table. Open with a curiosity gap, surprising failure mode, concrete question, or vivid intuition accessible with zero prior ML background.

| Avoid | Open like this |
|---|---|
| "Self-attention computes a weighted combination of value vectors." | "When you read 'The cat sat on the mat because *it* was tired,' you instantly know *it* refers to *the cat*. Self-attention gives a Transformer the same ability to link words across a sentence." |
| "In this lesson, you will learn linear regression, MSE, and gradient descent." | "You have five prompt lengths and their latencies, and you want one straight line to predict the sixth. How do you score a line, and how do you slide it toward the best fit?" |

### NONO 7: Starved or Hidden Payoffs

Never hide the climax, final output, or key result inside `<details>`, and never rig random weights or canned strings to fake learning. Show real, legible worked numbers, plots, or runnable outputs directly in the reading flow.

### NONO 8: Assembly-Line Rhythm, Walls of Text, and Over-Policed Prose

Avoid monotonous 6-line prose walls, stamped template headings (`Tiny Story`, `Slow Walkthrough`, `Mini Test`, `Before Clicking Next`), and mechanical `"Before running/reading/checking..., predict..."` prompts before every code block.

- **Welcome crisp contrasts and varied rhythm.** Direct contrasts (including clear `"Y, not X"` distinctions when they sharpen an idea), short punchy paragraphs that let a result land, and fuller paragraphs for derivations all belong in strong technical writing. Never pad short paragraphs to hit a sentence-count ratio.
- **Ask questions only when earned.** Pose a conceptual question when prior steps equip the reader to reason toward an illuminating answer, then give clear feedback.
- **Avoid AI-slop filler words:** replace `delve into`, `leverage`, `utilize`, `moreover`, `furthermore`, `it's worth noting`, `in essence`, `holistic`, `myriad`, `plethora`, `tapestry`, `underscores`, `underpin`, `pivotal`, `seamless`, `intricacies`, figurative `landscape`/`navigate`, `let's unpack`, `hack the interview`, `cram`, and `cheat sheet` with concrete engineering prose.
- **Natural contractions are welcome** (`don't`, `won't`, `it's`; never stilted `needn't`).

### NONO 9: Bloated 6,000 to 11,000 Word Monologues

Length is not depth. Trim repetitive recaps, redundant checklists, and padded scenarios:

- **Core lessons:** target roughly **2,000 to 3,500 words**.
- **Deep multi-lab capstones or system designs:** up to **~4,500 words** when every section carries distinct code, math, or architecture.
- **Dual-edition alignment:** Where `edition:reader` and `edition:reference` exist, keep the Reader edition (default web view) tight and self-contained, moving secondary extensions into `<details>` Deep Dive blocks or Reference sections.

### NONO 10: Zero Em Dashes Everywhere

Never use em dashes in authored prose, headings, captions, quiz text, or metadata. Use commas, colons, parentheses, or separate sentences instead. Preserve literal characters inside code blocks, inline code, and exact quotations.

---

## Structuring a Great Lesson

### Flexible Arcs and Causal Hinges

Each `##` section performs one distinct teaching job, linked to the next by a causal hinge (confirm what the previous step showed, pose the question that makes the next step necessary, then answer it directly without `"next we'll cover"` boilerplate):

- **Mechanism:** observable behavior -> tiny hand trace -> internal states -> runnable code -> failure modes.
- **Derivation:** concrete numbers -> notation -> derivation -> numerical check -> edge case.
- **Systems:** request/batch lifecycle -> component roles -> bottlenecks -> observability -> recovery.
- **Decision / Lab:** goal or constraints -> build or compare -> visible output -> deliberate break -> fix.

Carry **one domain-native running example** consistently across prose, tables, code, diagrams, and visuals until its job is done.

### Accessibility, Glossary, Headings, and Callouts

- **Terms and prerequisites:** Define unfamiliar terms and acronyms on first use (skip ubiquitous terms like API, GPU, JSON). Recap prerequisites in 1-2 sentences with an inline link. Wrap reusable terms on first mention with `<span data-glossary="term-id">label</span>` (entries live in `web/src/content/glossary/<id>.md` with frontmatter `title`, `importance`, optional `kind: code`, unique `aliases`, definition, `## Example`, `## Why it matters here`, and `## Related terms` using `[Term](glossary://id)`; rebuild via `pnpm --dir web glossary:build`).
- **Title ownership and headings:** Page shells render metadata `title` as the sole H1. Never put `# ...` H1 headings in `content.md`. Use `##`, `###`, and `####` (never standalone bold pseudo-headings like `**Benefits:**`). Rename interview-cram headings (`## Interview Tips` -> `## Key takeaways`, `## Model Answer Framework` -> `## Summary`, `## Common Interview Mistakes` -> `## Common misconceptions`, `## Strong Follow-up Answers` -> `## Going deeper`; delete `## Interview Signal`).
- **Video coverage heading safety:** Before renaming any `##` H2 heading, run `rg -uu "<exact heading>" videos/coverage/` and preserve any heading referenced there so video coverage checks stay green.
- **Semantic callouts (no decorative emoji):** Use standard prefixes (`> **Key insight:**`, `> **Common mistake:**`, `> **Production tip:**`, `> **Research insight:**`, `> **Intuition:**`, `> **Takeaway:**`, `> **Warning:**`, `> **Note:**`) or `<div data-callout="info|warning|tip|success" data-callout-title="Title"><p>...</p></div>` for platform notes.

---

## Structural and Technical Contracts

### File Layout and Frontmatter Schema

Lessons live at `web/src/content/<folder>/<slug>/content.md` with JSON frontmatter matching `web/src/content/metadata.schema.json`. Legacy `metadata.json` bundles remain readable; preserve stub directories containing only `illustrations/`.

| Field | Rule |
|---|---|
| `id`, `slug` | Required; must match directory name (URL-safe). |
| `title` | Concise, topic-focused (aim for <= 40 chars). |
| `section`, `category` | Must match schema enums (15 roadmap phases). |
| `order`, `difficulty` | 1-indexed order; `"Easy"`, `"Medium"`, or `"Hard"`. |
| `shortDescription` | 1-2 sentences for cards and SEO. |
| `keyConceptsTested`, `companies` | Tagging arrays. |
| `coverImage` | Optional override (fallback: social banner -> first image -> default OG). |
| `visibility` | Optional `{ "website": true, "book": true }`; pair with `<!-- leetllm: audience:... -->` or `<!-- leetllm: edition:... -->` variants (`BOOK.md`). |

**Never persist derived or body-owned fields:** omit `timeEstimate`, `references`, `isPremium` (LeetLLM is nonprofit and 100% open access), `rubricPoints`, `followUpQuestions`, and `commonPitfalls`.

### Math, Currency, and Runnable Code

- **LaTeX math:** Use `$inline$` and multi-line display blocks with each `$$` on its own line surrounded by blank lines (one-line `$$eq$$` parses as inline math). Keep display lines <= 400 chars using `aligned`/`split` and KaTeX-supported commands (`\tau^{*}`, not `\tau^\*`). Never put teaching equations inside `text`, `math`, or `latex` fences.
- **Currency escaping:** Escape literal dollar amounts as `\$10` in Markdown prose, captions, and `checkpoint` blocks, and as `\\$10` inside `mastery-quiz` JSON strings. Leave `$` literal inside code fences, inline code, HTML `<code>`, and output blocks. Use `\text{USD}` inside equations.
- **Code presentation:** Always introduce code before showing it (what it computes, inputs, outputs). Every fenced block needs a language tag. Add descriptive `title="filename.py"` (or `title="terminal"`) on longer multi-line scripts/files (> 8 lines); short inline snippets (<= 8 lines) and `text`/`output` blocks do not need synthetic filenames.
- **Runnable Python labs (`COURSE_CORE.md`):** Mark self-contained Python examples with `<!-- leetllm: test -->` directly above the fence and validate with `uv run scripts/validate-python-examples.py --article <slug>`. Use `output=show` / `output=folded`, linear `id=` / `continue=`, `output_title="..."`, and `output_head` / `output_tail` / `edges:2:5`; refresh outputs with `--write-outputs`. Place downloadable data in `assets/` and link via `assets/<file>`.

### Citations and Primary-Source Fact Verification

Verify benchmark numbers, model specs, equations, and historical claims against **primary sources** (original papers > official docs > first-party engineering blogs > authoritative textbooks > reputable community explainers; never secondary-only tutorials).

- Cite inline as `[^key]` (`{first_author_surname}{year}`, e.g. `[^vaswani2017]`), resolved via `web/src/content/references.json` (required: `title`, `authors`, `year`, `url`, `type` of `"paper"` or `"resource"`; optional: `venue`, `note`). Never write manual footnote definitions in `content.md` or add `references` to frontmatter.
- **Performance evidence:** Speedup, latency, throughput, or memory claims should name hardware/software, workload, precision/algorithm, baseline, and correctness check (or omit the ungrounded figure).
- **Volatile provider facts:** Keep no undated "current models" table here. Verify model IDs, limits, and prices against official provider docs on the day of edit, cite in `references.json`, and set `verifiedAt` + `refreshAfter` in volatile blog metadata. Preserve historical model names when citing papers.
- **Research packets:** Sibling `_research.md` files are read-only background context, not verified evidence.

### Visuals, Diagrams, Illustrations, and Animations

Place visuals at conceptual pressure points where geometry, tensor shapes, data flow, or curves clarify an idea faster than prose alone.

- **Mermaid diagrams:** Use `LR` for horizontal flows and `TB`/`TD` for vertical grouping. Quote special-char labels (`A["Text (note)"]`). Apply semantic classes (`:::primary`, `:::secondary`, `:::success`, `:::warning`, `:::danger`, `:::accent`, `:::muted`) outside closing brackets (`A["text"]:::primary`), never on `subgraph` lines, and never write manual `style` or `classDef`.
- **Custom Vizmatic TSX illustrations (`ILLUSTRATION_GUIDELINES.md`):**
  - Must pass the **value gate**: genuine visual encoding (plots, matrices, heatmaps, vector geometry, network graphs, compact flows). Reject HTML-tables-as-PNGs, prose card strips, and tall receipt towers.
  - Export `width`, `height`, `alt`, `create(theme)`, and default export using Vizmatic theme tokens and Vizmatic arrows (`Arrow`, `FlowArrow`, `Connector`, never `▶` text glyphs).
  - Compact aspect: `height <= 1.35 * width` and source `height <= 820px` (800x500 default). Legible at 672px web column, phone width, and 8.5pt print.
  - Zero prose paragraphs and zero fictional-data disclaimers inside PNGs.
  - Every `.tsx` file under `illustrations/` must be referenced in `content.md` via its rendered PNG inside `<figure>...<figcaption>...</figcaption></figure>` (never embed `.tsx` directly). Inspect light/dark renders via `uv run scripts/review-illustrations.py`.
- **Animations (`vizmatic/stage` or `createAnimation(theme)`):** Use motion when it reveals transformation, concurrency, routing, or geometry. Supply a self-contained static fallback (`create(theme)`) whose `<figcaption>` agrees with the still frame.
- **Social banners:** 1200x630 `social_banner.png` (prefer reproducible `social_banner.tsx` at article root outside `illustrations/`), dark theme, single title, LeetLLM watermark, accurate to article.

### Mastery Quizzes

Every visible learn article ends with **one** `mastery-quiz` JSON block immediately before the final `Next` / `Course complete` callout, separated by a blank line:

- **Question count:** Target **3 to 6 sharp questions** testing decisions, calculations, failure diagnosis, and transfer (validator accepts **3 to 10**, allowing up to 10 for multi-lab capstones; never pad with filler).
- **Schema contract:** JSON array of objects with non-empty `question`, `options` (exactly 4 distinct non-empty strings), `answer` (exact match to one option), and instructive `explanation`. Pass threshold is 75%; runtime shuffles option order. Distractors must be realistic misconceptions without length or polish giveaways.
- Validate with `uv run scripts/validate-mastery-quizzes.py`.

### Blog Posts

Blog posts live in `web/src/content/blog/` (`blog/metadata.schema.json`: `blog-` id prefix, `author`, `publishedAt`, `excerpt`, `tags`, no learn-only fields). On slug renames, add `"aliases": ["old-slug"]` on the canonical post and run `uv run scripts/generate-content-lastmod.py` (`redirectTo` only for a retired post keeping its bundle). Keep blog posts visually rich and domain-native.

---

## Linear Curriculum Path (199 Visible Lessons)

The `/learn` roadmap is one global Easy -> Medium -> Hard progression across 15 phases, canonically ordered in `web/src/lib/questions.ts` (`ROADMAP_SECTION_SEQUENCE` and `SECTION_ROADMAP_SLUG_ORDER`). Never place an Easy lesson after a Medium or Hard lesson globally.

- **Easy (1 to 31):** Computing foundations, math/stats intuition, neural-network basics, first end-to-end LLM app.
- **Medium (32 to 85):** Classical ML, statistical learning, production ML systems, core LLM mechanics, applied LLM engineering.
- **Hard (86 to 199):** Portfolio capstones, Transformer internals, advanced training, advanced agents/retrieval, GPU and inference scale, system design capstones, AI lab interviewing, and 17 project deep dives.

| Phase | Folder | Lessons | Focus |
|---|---|---:|---|
| Computing Foundations | `foundations/` | 9 | Git, shell, Linux, Docker, Python, NumPy, CUDA/MPS, data structures, SQL, complexity |
| Math & Statistics | `foundations/` + `preparation/` | 9 | Calculus, linear algebra, optimization, probability, Bayes, MCMC, uncertainty |
| Preparation & Prerequisites | `preparation/` | 13 | Neural nets, CNNs, RNNs, VAEs, training math, softmax, Transformers, prompting, first app |
| ML Algorithms & Evaluation | `foundations/` | 15 | Regression, classification, trees, RL, validation, conformal, clustering, causal, PyTorch |
| Production ML Systems | `foundations/` | 6 | Feature pipelines, parity, boosted trees, ranking, forecasting, monitoring |
| Core LLM Foundations | multiple | 8 | Scaling, tokenization, embeddings, eval basics, ingestion, chunking, chat templates |
| Applied LLM Engineering | multiple | 25 | Reasoning, tools, context, safety, privacy, human feedback, RAG, evals, caching, routing |
| Portfolio Capstones | `foundations/` | 9 | Shippable ETA, ranking, forecasting, vision, ML pipeline, doc QA, evals, classifier, research |
| Transformer Deep Dives | `fundamentals/` | 8 | Contrastive embeddings, attention, vision encoders, positions, norms, interp, decoding |
| Advanced Training & Adaptation | `training/` + `fundamentals/` | 18 | Scaling laws, pretraining, JAX, SFT, mixed precision, FSDP/ZeRO, LoRA, RLHF/DPO, merging |
| Advanced Agents & Retrieval | multiple | 17 | Vector indexes, GraphRAG, RBAC, structured outputs, code/GUI agents, sandboxing, memory |
| Inference & Production Scale | `fundamentals/` + `llmops/` | 31 | GPU architecture, profiling, kernels, GEMM, low precision, KV cache, batching, serving |
| System Design Capstones | `system-design/` | 10 | End-to-end architectures for AI products and agent sandboxes |
| AI Lab Interviewing | `interviewing/` | 4 | Coding, system design, behavioral evidence, technical presentation |
| Project Deep Dives | `projects/` | 17 | Code-level studies from vLLM, FlashAttention, and Megatron through SGLang and Light-PEFT |

### Final **Next:** Callout Contract

Every visible learn lesson except the last (`deep-dive-light-peft`, which ends with `> **Course complete:**`) ends immediately after its `mastery-quiz` block with:

```markdown
> **Next:** Continue to [Exact Title of Next Lesson](/learn/exact-next-slug). One or two crisp sentences connecting what the reader can now build or explain to the next concept it unlocks.
```

---

## Validation and Pre-Publish Checklist

Deploy-time checks (`./deploy.sh`) run `validate-metadata.py`, `update-time-estimates.py --check`, `validate-references.py --skip-http`, illustration references, `pnpm test`, illustration/diagram builds, and Next.js build.

Before finishing any bundle review, confirm:

- [ ] **Zero NONOs:** No em dashes, lawyer disclaimers, non-ops SOC2/ticket roleplay, zero-ML mocks/type-police, kitchen-sink scope creep, ephemeral changelogs, dry syllabus openings, hidden payoffs, template/prompt spam, or bloated monologues.
- [ ] **Teaching quality:** A reader can trace the main domain-native example by hand, follow every equation and output, and transfer the mechanism to a new case.
- [ ] **Factual and citation integrity:** External claims verified against primary sources and cited inline via `[^key]` in `web/src/content/references.json`.
- [ ] **Code, math, and visuals:** Runnable Python executes cleanly; KaTeX math and currency escapes render cleanly; Mermaid uses `:::className`; custom illustrations pass `ILLUSTRATION_GUIDELINES.md` in dark and light themes with explanatory `<figcaption>` tags.
- [ ] **Validators green:** `validate-metadata.py`, `validate-references.py --skip-http`, `validate-content-structure.py`, `validate-mastery-quizzes.py`, `validate-python-examples.py --article <slug>`, `audit-content-quality.py --path <section>/<slug> --strict`, `node videos/atlas.mjs --check`, and `web` tests pass.
