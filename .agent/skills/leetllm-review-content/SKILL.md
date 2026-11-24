---
name: leetllm-review-content
description: Review, audit, and fix LeetLLM article or blog content against repository content guidelines. Use to perform a full, deep-dive review of an article bundle (including all text, metadata, citations, and illustrations) to ensure absolute compliance with guidelines.
---

# Review LeetLLM Content

## Core Rule

Review content as a senior technical editor and educator (O'Reilly, Karpathy, or 3Blue1Brown caliber). Read complete source files, verify facts against primary sources, fix flaws directly, and run validation before reporting completion.

Review the teaching first. Find the opening hook, the central mechanism, the first complete worked payoff, and the reasoning that connects them. Give the learner a lucid, generous explanation with intuition, analogies, intermediate calculations, and runnable code that genuinely computes the concept. A clean validator run is necessary, never sufficient as an editorial signoff.

Always load these repository documents first:
- `CONTENT_GUIDELINES.md`
- `ILLUSTRATION_GUIDELINES.md`
- `COURSE_CORE.md`
- `AGENTS_TESTING.md`

For a single article bundle, also read `.agent/prompts/review-content.md` and follow its scoping rules.

## Scope

Review **all** content in the target bundle carefully, not just changed hunks. Build an inventory before editing:

```bash
find web/src/content -path "*/<target_article>/*" -type f
```

Cover every piece of the bundle:
- `content.md`: Read the full JSON frontmatter and body across both `edition:reader` and `edition:reference` (if present). Verify schema, technical accuracy, prose quality, code, citations, quiz, and visual embeds.
- Legacy `metadata.json`, only when present: verify fields without requiring legacy files on canonical frontmatter bundles.
- `illustrations/`: Inspect every `.tsx` illustration source (standalone and embedded) and view rendered dark and light PNGs.
- `_research.md`: Read-only background context unless the user explicitly asks to refresh it.

## Review Checklist (The 10 Teaching NONOs + Structural Contracts)

Apply `CONTENT_GUIDELINES.md` and `ILLUSTRATION_GUIDELINES.md` as the sources of truth. Eliminate all 10 Teaching NONOs on every bundle:

1. **No lawyer-vetted defensive disclaimers:** Delete paranoid mid-prose and caption caveats (`"does not prove/guarantee/measure/establish X"`, `"Treat these numbers as an illustrative walkthrough"`, `"simplified example does not capture..."`, `"synthetic fixture"`, `"FIXTURE ONLY"`). State real assumptions once beside the calculation they affect.
2. **No SOC2, compliance, or SRE ticket roleplay in non-ops lessons:** Scrub bureaucratic vocabulary (`fixture`, `contract`, `boundary`, `admit`, `receipt`, `provenance`, `authority`, `establish` hedging, `supplied`, `bounded`, `fail-closed`, `governed`, `policy`, `gate`, `audit`, `ledger`, `needn't`) and corporate ticket theater (`Luna`, `acct_10234`, `K10234`, `P-7`, `P-14`, `RUN-842`, `C17`, `R42`, `DeployBuddy`, `INC-48291`, `luna-48291`, `09:12`, `ticket #48291`, `0.005000 USD` gateway ceilings) outside lessons literally teaching IAM, security, ledgers, or operations. Keep examples domain-native (tokens/sentences for NLP, image tensors for CV, gridworlds/MDPs for RL, matrices/distributions for math/stats, tiles/warps/HBM/KV blocks for GPU/serving).
3. **No Zero-ML mocks or `isinstance` type-police boilerplate:** Replace unused ML imports, CRUD dict validators, canned predictions, and defensive `isinstance(..., bool)` / `type(x) not in (int, float)` / repetitive `math.isfinite` walls with clean, runnable NumPy, PyTorch, scikit-learn, SciPy, or crisp algorithmic code that exposes the mechanism. Execute examples to verify outputs.
4. **No kitchen-sink scope creep in core/Easy lessons:** Never hijack openings with premature edge-case caveats (`NaN` masks, dropout non-convexity, `BFloat16` underflow) or cram tangential proofs/triggers into introductory lessons. Develop one clean mechanism first; move optional proofs or deep corners into `<details><summary>Deep dive: ...</summary>...</details>` or a later section.
5. **No ephemeral library changelogs in timeless conceptual prose:** Remove dated version stamps (`"As of TRL 1.17.1, rechecked Nov 4, 2026"`, `"bitsandbytes 0.50.2"`) from conceptual prose. Teach durable principles; isolate brief version notes only when truly needed.
6. **No dry syllabus-abstract openings:** Replace `"In this lesson, you will learn X, Y, and Z"` or course-position tables with a curiosity gap, concrete question, surprising failure mode, or vivid intuition accessible without prior ML background.
7. **No starved or hidden payoffs:** Show real, legible worked numbers, plots, or training outputs directly in the reading flow. Never hide the climax inside `<details>` or rig random weights to fake learning.
8. **No assembly-line rhythm, walls of text, or robotic prompt spam:** Vary paragraph length naturally (punchy short paragraphs for emphasis, fuller ones for derivations). Welcome crisp contrasts and analogies. Remove repetitive `"Before running/reading/checking..., predict..."` filler, template headings (`Tiny Story`, `Slow Walkthrough`, `Mini Test`), and banned AI-slop clichés (`delve into`, `leverage`, `moreover`, `it's worth noting`, `holistic`, `tapestry`, `seamless`, etc.).
9. **No bloated 6k to 11k word monologues:** Trim redundant recaps and padding toward focused teaching length (~2,000 to 3,500 words for core lessons; up to ~4,500 for multi-lab capstones). Keep `edition:reader` crisp and self-contained alongside `edition:reference` when both exist.
10. **Zero em dashes everywhere:** Never leave or introduce an em dash in prose, headings, captions, quiz strings, or metadata. Preserve code blocks, inline code, and exact quotations.

Also verify every structural and visual invariant:
- **Video coverage heading safety:** Before renaming any `##` H2 heading, run `rg -uu "<exact heading>" videos/coverage/`. If referenced, keep the exact heading text intact.
- **Visual quality and aspect discipline:** Every custom TSX illustration encodes meaning spatially or quantitatively (no HTML-tables-as-PNGs, prose card strips, or receipt towers), respects `height <= 1.35 * width` and source `height <= 820px`, has zero prose paragraphs or disclaimers inside PNGs, uses Vizmatic arrows, and keeps static-PNG/caption parity for animated figures.
- **Formatting, math, and metadata:** No `# H1` in body; code introduced before shown; language tags on all fences (`title="..."` on multi-line scripts/files > 8 lines; optional on short snippets and output blocks); currency escaped as `\$` in Markdown/captions/checkpoints and `\\$` in `mastery-quiz` JSON; Mermaid uses `:::className` without inline `style`/`classDef`; metadata matches schema without `timeEstimate`, `references`, or `isPremium`.
- **Mastery quiz:** One `mastery-quiz` block immediately before the final `Next` / `Course complete` callout, with 3 to 6 sharp questions recommended (3 to 10 accepted), 4 distinct realistic options per question, exact answer match, and instructive explanations.

After the bundle review, check adjacent prev/next handoffs and report any out-of-scope cross-format mismatches (book opening, video narration) as pending rather than silently expanding write scope.

## Fact Review and Citations

Never rely on memory for model names, versions, pricing, context windows, benchmark scores, release dates, architecture specs, equations, or "first to" claims. Verify against primary sources (original papers, official docs/model cards, first-party engineering blogs, upstream source code). If a claim cannot be verified, cut it or narrow its scope honestly.

- Reuse keys from `web/src/content/references.json`, adding missing primary sources there before citing inline with `[^key]`.
- Never put `references` in frontmatter or manual footnote definitions in `content.md`.

## Editing Rules

Fix flaws directly rather than only listing them. Preserve `_research.md` unless explicitly asked to refresh it. Rewrite weak openings, contrived roleplay, or broken code labs cleanly instead of patching around them. Never use bulk replacement scripts or automated humanizers as editorial judgment.

## Validation

Run targeted checks after edits:

```bash
uv run scripts/validate-metadata.py
uv run scripts/validate-references.py --skip-http
uv run scripts/validate-content-structure.py
uv run scripts/validate-mastery-quizzes.py
uv run scripts/validate-python-examples.py --article <slug>
uv run scripts/audit-content-quality.py --path <section>/<slug> --strict
node videos/atlas.mjs --check
git diff --check
cd web && pnpm test --run
cd web && pnpm lint
cd web && pnpm typecheck
```

When citations or external URLs changed, also run `uv run scripts/validate-references.py`.

When illustrations or diagrams changed, also run:

```bash
cd web && pnpm illustrations:build:article <section>/<slug> --force
cd web && pnpm diagrams:build:article <section>/<slug>
cd ..
uv run scripts/validate-illustration-refs.py
uv run scripts/validate-illustration-quality.py --fail-layout-warnings
uv run scripts/validate-illustration-density.py --strict-text
uv run scripts/review-illustrations.py
```

Inspect every updated PNG in both dark and light themes before finishing. For broad reviews, finish with `cd web && pnpm build`.
