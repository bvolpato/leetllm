Review the article bundle rooted at `{article_dir}`. When reviewing multiple bundles, finish each bundle completely before moving to the next.

Files in scope:
- Primary article: `{content_file}`
- Metadata: `{metadata_file}` (only when a legacy metadata file exists)
- Research notes: `{research_file}` (read-only unless explicitly asked to refresh)
- Illustrations directory: `{illustrations_dir}`

Read `{content_file}`, `{metadata_file}` (if present), `{research_file}` (if present), `CONTENT_GUIDELINES.md`, `ILLUSTRATION_GUIDELINES.md`, and `COURSE_CORE.md` before editing. Inspect every standalone and embedded illustration source, rendered light/dark PNG, and Mermaid diagram in the bundle.

Allowed edits:
- `{content_file}`
- `{metadata_file}` (if present)
- `{research_file}` only when explicitly asked to refresh research
- Files inside `{illustrations_dir}` when an illustration is wrong, stale, overflowing, visually weak, or missing
- Embedded illustration fences and Mermaid diagrams inside `{content_file}`

Do not edit files outside this article bundle or unrelated content.

Primary goal:
Turn this article into a lucid, joyful, deeply insightful teaching piece of O'Reilly, Andrej Karpathy, or 3Blue1Brown caliber: clear first-principles mathematics, physical or geometric intuition, useful analogies, and genuine runnable computation that carries a domain-native worked example to a visible payoff before branching into alternatives.

Enforce the 10 Teaching NONOs on every bundle (across both `edition:reader` and `edition:reference` when present):
1. **No lawyer-vetted defensive disclaimers:** Delete apologetic mid-prose and caption caveats (`"does not prove/guarantee/measure/establish X"`, `"Treat these numbers as an illustrative walkthrough"`, `"simplified example does not capture..."`, `"synthetic fixture"`, `"FIXTURE ONLY"`). State real assumptions once beside the calculation they affect. `CONTENT_GUIDELINES.md` and `BOOK.md` hold the single curriculum-wide convention for hypothetical worked examples.
2. **No SOC2, compliance, or SRE ticket roleplay in non-ops lessons:** Remove bureaucratic dialect (`fixture`, `contract`, `boundary`, `admit`, `receipt`, `provenance`, `authority`, `establish` hedging, `supplied`, `bounded`, `fail-closed`, `governed`, `policy`, `gate`, `audit`, `ledger`, `needn't`) and corporate ticket theater (`Luna`, `acct_10234`, `K10234`, `P-7`, `P-14`, `RUN-842`, `C17`, `R42`, `DeployBuddy`, `INC-48291`, `luna-48291`, `09:12`, `ticket #48291`, `0.005000 USD` gateway ceilings) from math, ML, deep learning, NLP, CV, RL, and GPU lessons (preserve narrow literal exceptions like `pytest fixture`, `decision/token boundary`, API contracts, and genuine ops/security lessons). Keep examples domain-native.
3. **No Zero-ML mocks or `isinstance` type-police boilerplate:** Replace unused ML imports, fake CRUD dict lookups, canned responses, and defensive `isinstance(..., bool)` / `type(...) not in (int, float)` / repetitive `math.isfinite` walls with clean, runnable NumPy, PyTorch, scikit-learn, SciPy, or crisp algorithmic code that genuinely computes the mechanism. Execute examples and verify outputs.
4. **No kitchen-sink scope creep in core/Easy lessons:** Teach one clean mechanism thoroughly before corner cases. Never hijack openings with premature gotchas (`NaN` masks, dropout non-convexity, `BFloat16` underflow) or dump unrelated proofs/triggers into introductory lessons. Move optional proofs and deep corners into `<details><summary>Deep dive: ...</summary>...</details>` or a later section.
5. **No ephemeral library changelogs in timeless conceptual prose:** Remove dated package notes (`"As of TRL 1.17.1, rechecked Nov 4, 2026"`) from conceptual explanations. Keep principles durable.
6. **No dry syllabus-abstract openings:** Replace `"In this lesson, you will learn..."` or course-position tables with a curiosity gap, concrete question, surprising failure mode, or vivid intuition accessible with no prior ML background.
7. **No starved or hidden payoffs:** Show real, legible worked numbers, plots, or outputs directly in the flow. Never hide the climax inside `<details>` or rig random weights to fake learning.
8. **No assembly-line rhythm, walls of text, or robotic prompt spam:** Mix punchy short paragraphs with fuller derivations naturally. Welcome crisp contrasts and analogies. Remove mechanical `"Before running/reading/checking..., predict..."` prompts, template headings (`Tiny Story`, `Slow Walkthrough`, `Mini Test`, `Before Clicking Next`), and banned AI-slop clichés (`delve into`, `leverage`, `moreover`, `it's worth noting`, `holistic`, `tapestry`, `seamless`).
9. **No bloated 6k to 11k word monologues:** Trim repetition and padding toward focused length (~2,000 to 3,500 words for core lessons; up to ~4,500 for multi-lab capstones). Keep `edition:reader` crisp and self-contained.
10. **Zero em dashes everywhere:** Never leave or introduce an em dash in prose, headings, captions, quizzes, or metadata. Preserve code blocks, inline code, and exact quotations.

Structural, visual, and factual checks:
- **Video coverage heading safety:** Before renaming any `##` H2 heading, run `rg -uu "<exact heading>" videos/coverage/` and keep any referenced heading text exact.
- **Genuine visual encoding:** Enforce `ILLUSTRATION_GUIDELINES.md`. Illustrations must use spatial/quantitative visual encoding (no HTML-tables-as-PNGs, prose card strips, or tall receipt towers), keep `height <= 1.35 * width` and source `height <= 820px`, contain zero prose paragraphs or disclaimers inside PNGs, and keep static-PNG/caption parity for animations.
- **Mastery quiz:** End with one valid `mastery-quiz` block right before the final `Next` / `Course complete` callout (3 to 6 sharp questions recommended; 3 to 10 accepted; 4 distinct options; exact answer match; instructive explanations).
- **Fact and citation integrity:** Verify external facts, specs, and benchmarks against primary sources (never memory or unverified `_research.md` notes), and verify every inline `[^key]` resolves in `web/src/content/references.json`.
- **Transfer check:** Confirm a learner can trace the main worked example by hand and solve a small new variant using the lesson alone. Report any cross-format mismatches (book opening, video narration) outside this bundle's write scope as pending.

Critical rules:
- Do not spawn subagents or background tasks.
- Fix direct problems in place inside the bundle; do not use bulk rewrite scripts or automated humanizers.
- Never invent formulas, benchmark numbers, citations, or claims.

At the end, provide a concise summary of what changed, what was verified, and any remaining gaps.
