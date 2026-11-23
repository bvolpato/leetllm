---
name: leetllm-review-content
description: Review, audit, and fix LeetLLM article or blog content against repository content guidelines. Use to perform a full, deep-dive review of an article bundle (including all text, metadata, citations, and illustrations) to ensure absolute compliance with guidelines.
---

# Review LeetLLM Content

## Core Rule

Review content as a production editor and senior technical reviewer. Read the complete source files, verify facts against primary sources, fix flaws directly, and run validation before reporting completion.

Review the teaching first. Find the central question, the first complete worked result, and the reasoning that connects them. Give the learner a generous explanation with intuition, useful analogies, intermediate calculations, and practice that transfers to a new case. Preserve depth while moving extensions after the core mechanism. A clean wording audit is not an editorial signoff.

Always load these repository documents first:
- `CONTENT_GUIDELINES.md`
- `ILLUSTRATION_GUIDELINES.md`
- `AGENTS_TESTING.md`

For a single article bundle, also read `.agent/prompts/review-content.md` and follow its scoping rules.

## Scope

You must review **all** content in the target bundle carefully and deeply, not just changed files or hunks. Do not take shortcuts.

Build an inventory of the bundle before editing:

```bash
find web/src/content -path "*/<target_article>/*" -type f
```

Group work by article bundle. A full review must cover:
- `content.md`: Read the complete JSON frontmatter and article body. Verify metadata against its schema, then inspect technical accuracy, prose flow, examples, code, citations, and visual embeds.
- Legacy `metadata.json`, only when present: verify fields against the appropriate schema without requiring a legacy file for canonical frontmatter bundles.
- `illustrations/`: Inspect every `.tsx` illustration source (both standalone files and inline fences in `content.md`) and view the rendered dark and light PNGs.
- Article-local research files such as `_research.md` (read-only unless the user explicitly asks to refresh them).

Read full files line by line rather than inspecting only diffs. You are responsible for ensuring the entire article meets LeetLLM's textbook and engineering bar.

## Review Checklist

Apply `CONTENT_GUIDELINES.md` and `ILLUSTRATION_GUIDELINES.md` as the sources of truth for voice, structure, code, references, and visuals.

Check every reviewed article for:
- **Zero em dashes** in authored prose, captions, quiz strings, or metadata. Preserve code, literal strings, and exact quotations.
- **No bureaucratic or SOC2 dialect:** Outside lessons literally teaching IAM permissions, ledgers, or the explicit exceptions in `CONTENT_GUIDELINES.md` (pytest fixtures or eval datasets, real API or schema contracts, ML decision boundaries or OS sandboxes, and data lineage), replace `fixture`/`fixtures`, `contract`/`contracts`, `boundary`/`boundaries`, `admit`/`admitted`/`admission`, `receipt`/`receipts`, `provenance`, `authority`, `establish`/`establishes`, `supplied`, `bounded`, `fail-closed`, `governed`, and unnatural `needn't`.
- **No inline fictional-data disclaimers:** Remove phrases such as `"Treat these numbers as an illustrative walkthrough..."`, `"does not establish..."`, `"synthetic fixture"`, and `"FIXTURE ONLY"` from prose, captions, and PNGs. `CONTENT_GUIDELINES.md` and `BOOK.md` hold the single curriculum-wide convention note.
- **No premature edge-case hijacking:** Do not dump `NaN` mask corners, dropout non-convexity caveats, `BFloat16` underflow trivia, or operational disclaimers into opening sections before teaching the core mechanism cleanly. Teach intuition, small hand-worked numbers, and core mechanics first, then cover edge cases and failure modes in their own later section.
- **Natural textbook pacing:** Develop complete reasoning steps with varied sentences and paragraphs. Use questions where an answer reveals something worth understanding, with helpful feedback. Remove mechanical prediction prompts, but impose no paragraph-length or question-count quota.
- **Domain-native examples:** Remove shoehorned SRE/IAM roleplay (`Luna`, `acct_10234`, `K10234`, `P-7`, `P-14`, `RUN-842`, `C17`, `R42`, `DeployBuddy`, `INC-48291`, `0.005000 USD` gateway ceilings, duplicate-charge tickets, or warehouse orders) from unrelated ML, DL, NLP, CV, RL, math, and GPU lessons. Use tokens and sentences for NLP, image tensors for CV, gridworlds and MDPs for RL, matrices and distributions for math and stats, and tiles, warps, and HBM for GPU kernels.
- **Examples that compute what they teach:** Use numerical libraries, small from-scratch implementations, and faithful simulations as appropriate. Replace canned model responses or hardcoded correctness flags when they pretend to demonstrate learning or improvement. For prompting, show the actual prompt, response, revision, and comparison cases. Remove distracting type checks unless validation is the topic, and execute examples to verify their displayed outputs.
- **Analogy and simplification:** Welcome familiar stories, physical models, and visual metaphors that lower the reader's entry cost. Connect them to technical objects and keep useful mappings alive. State an assumption where it affects a result; explain an analogy's limit when it prevents a meaningful misunderstanding. Remove qualifications that merely defend the passage against remote interpretations.
- **No banned filler phrases:** Remove every cliché in the `CONTENT_GUIDELINES.md` banned-phrases list (`delve into`, `leverage`, `moreover`, `it's worth noting`, `holistic`, `tapestry`, `seamless`, and similar phrasing).
- **Direct technical explanations:** Lead with the mechanism, result, or required action. Rewrite formulaic `"Y, not X"` contrast hooks and defensive disclaimers in context while keeping genuine technical negation, mathematical constraints, uncertainty, code, and exact quotations intact.
- **Visual quality and aspect discipline:** Every custom illustration uses real visual encoding (plots, matrices, heatmaps, vector geometry, network or architecture diagrams, or compact flows), avoids HTML-tables-as-PNGs, prose card strips, and tall receipt towers, stays within `height <= 1.35 * width` and source `height <= 820px`, contains zero prose paragraphs or disclaimers inside the PNG, and preserves static-PNG/caption parity for animated figures.
- **Formatting and metadata integrity:** Code blocks are introduced before they appear and use correct language tags and `title="..."` metadata, currency values are escaped as `\$` in Markdown/MDX (and `\\$` inside `mastery-quiz` JSON), Mermaid diagrams use valid syntax and semantic `:::className` classes, metadata matches schema without `timeEstimate` or `references`, and open-access nonprofit positioning stays intact.

After the bundle review, read its previous and next handoffs and compare the reader edition, book opening, figures, quiz, and selected video. Check that examples, symbols, and prerequisites still agree. Fix related formats only within the authorized scope, and report pending formats explicitly. Ask a reviewer to trace the example and solve a small unfamiliar variant from the explanation before calling its teaching complete.

## Fact Review

Never rely on memory for technical facts. Verify claims involving:
- Model names, model versions, pricing, context windows, benchmark scores, release dates, or current provider behavior.
- Architecture specs, training details, equations, algorithm steps, asymptotic complexity, and historical attribution.
- Superlatives or comparisons such as faster, cheaper, better, first, latest, current, or best.

Use primary sources first:
- Original papers, arXiv preprints, and conference proceedings.
- Official provider documentation, pricing pages, model cards, and changelogs.
- First-party engineering blogs and upstream open-source implementations.

Verify claims using web search, URL reading, and documentation lookups. If a claim cannot be verified against a primary source, remove it, narrow its scope to what is verified, or cite a stronger source.

## Citation Rules

Use the repository reference registry:
- Reuse keys from `web/src/content/references.json` whenever a source already exists.
- Add missing sources to `references.json` before referencing them in prose.
- Keep `references` out of article frontmatter; the content loader derives them from inline citations.
- Ensure every `[^key]` citation in `content.md` resolves to `references.json` and actually supports the nearby claim.
- Never append footnote definitions manually inside `content.md`.

## Editing Rules

Fix direct defects rather than merely listing them, while preserving LeetLLM's patient, rigorous teaching voice.

Preserve:
- Raw `_research.md` files unless the user explicitly asks to refresh them.

Rewrite weak sentences, fragmented paragraphs, contrived roleplay sections, or broken code labs completely when they fail `CONTENT_GUIDELINES.md`. Thoroughness and technical depth take priority over speed.

## Validation

Run targeted checks after edits, then broader checks when scope is large:

```bash
uv run scripts/validate-metadata.py
uv run scripts/validate-references.py --skip-http
uv run scripts/validate-content-structure.py
uv run scripts/validate-mastery-quizzes.py
uv run scripts/validate-python-examples.py --article <slug>
git diff --check
cd web && pnpm test --run
cd web && pnpm lint
cd web && pnpm typecheck
```

When citations or external URLs changed, also run:

```bash
uv run scripts/validate-references.py
```

When illustrations or diagrams changed, run:

```bash
cd web && pnpm illustrations:build:article <section>/<slug> --force
cd web && pnpm diagrams:build:article <section>/<slug>
cd ..
uv run scripts/validate-illustration-refs.py
uv run scripts/validate-illustration-quality.py --fail-layout-warnings
uv run scripts/validate-illustration-density.py --strict-text
uv run scripts/review-illustrations.py
```

Inspect every updated PNG in both dark and light themes before finishing. For broad content reviews, finish with `cd web && pnpm build` and report any remaining warnings clearly enough for a reviewer to assess risk.
