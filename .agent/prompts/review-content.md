Review the article bundle rooted at `{article_dir}`. When the user requests a larger review, finish each bundle before moving to the next.

Files in scope:
- Primary article: `{content_file}`
- Metadata: `{metadata_file}`
- Research notes: `{research_file}`
- Illustrations directory: `{illustrations_dir}`

Read `{content_file}`, `{metadata_file}`, `{research_file}`, `CONTENT_GUIDELINES.md`, `ILLUSTRATION_GUIDELINES.md`, and `COURSE_CORE.md` before editing. If `{illustrations_dir}` exists, inspect every illustration source and rendered image it contains. Also inspect all embedded illustration fences and Mermaid diagrams inside `{content_file}`.

Allowed edits:
- `{content_file}`
- `{metadata_file}`
- `{research_file}` only when the user explicitly asks to refresh research
- Files inside `{illustrations_dir}` when an illustration is wrong, stale, overflowing, visually weak, or missing
- Embedded illustration fences and Mermaid diagrams inside `{content_file}`

Do not edit:
- Files outside this article bundle
- Unrelated content

Primary goal:
Turn this article into a generous, engaging learning resource for an engineer moving through the LeetLLM curriculum. Write like a first-rate technical textbook (O'Reilly, Karpathy, or 3Blue1Brown caliber): deep first-principles mathematics, clear physical or geometric intuition, useful analogies, and concrete runnable computation. Find the central question and carry a worked example to a satisfying result before branching into alternatives. Comprehensive teaching supplies the reasoning a learner needs to reconstruct and apply an idea.

Editorial standards to enforce on every bundle:
1. **Varied, lucid prose flow:** Develop complete thoughts with natural sentence and paragraph rhythm. Use short paragraphs for emphasis and longer ones where a derivation needs room. Do not impose word, sentence, or paragraph quotas. Never use em dashes in authored prose or metadata.
2. **No bureaucratic dialect:** Outside lessons literally teaching IAM permissions, ledgers, or the narrow literal exceptions in `CONTENT_GUIDELINES.md` (pytest fixtures or eval datasets, real API or schema contracts, ML decision boundaries or OS sandboxes, and data lineage), replace `fixture`/`fixtures`, `contract`/`contracts`, `boundary`/`boundaries`, `admit`/`admitted`/`admission`, `receipt`/`receipts`, `provenance`, `authority`, `establish`/`establishes`, `supplied`, `bounded`, `fail-closed`, `governed`, and unnatural `needn't` with plain, accurate technical English.
3. **No inline fictional-data disclaimers:** Delete apologetic notes such as `"Treat these numbers as an illustrative walkthrough..."`, `"does not establish..."`, `"synthetic fixture"`, or `"FIXTURE ONLY"` stamps inside prose, captions, or PNGs. `CONTENT_GUIDELINES.md` and `BOOK.md` state the single curriculum-wide convention for hypothetical worked examples.
4. **Core mechanism before edge cases:** Ban premature edge-case hijacking ("gotcha-first teaching"). Never dump `NaN` behavior from all-`-\infty` attention masks, dropout non-convexity caveats, `BFloat16` underflow corners, or production disclaimers into opening sections before teaching the core idea cleanly. Teach intuition, small hand-worked numbers, and the core mechanism first, then place numerical stability corners and failure modes in a dedicated later section.
5. **Questions that teach:** Remove mechanical prediction prompts. Keep conceptual questions when the reader can reason from prior material and the feedback reveals a useful relationship. Choose their number according to the lesson.
6. **Domain-native examples:** Ban shoehorning the repetitive SRE/IAM roleplay universe (`Luna`, `acct_10234`, `K10234`, `P-7`, `P-14`, `RUN-842`, `C17`, `R42`, `DeployBuddy`, `INC-48291`, `0.005000 USD` gateway ceilings, duplicate-charge tickets, or warehouse orders) into unrelated ML, deep learning, NLP, CV, RL, math, or GPU lessons. Use domain-native inputs: tokens and sentences for NLP and attention, image tensors and patches for CV, gridworlds and MDPs for RL, vectors and distributions for math and statistics, and tiles, warps, and HBM transfers for GPU kernels.
7. **Code that demonstrates the mechanism:** Use numerical libraries, from-scratch calculations, or faithful simulations as the subject needs. The code should compute the claimed behavior. Canned predictions and hardcoded success dictionaries cannot demonstrate a model learning or a prompt improving. Introduce each example, verify its output, and omit defensive type-police boilerplate unless validation is the topic.
8. **Genuine visual encoding:** Enforce `ILLUSTRATION_GUIDELINES.md`. Every custom illustration must encode meaning spatially or quantitatively (plots, matrices, heatmaps, vector geometry, network or architecture diagrams, or compact flows). Reject HTML-tables-as-PNGs, prose card strips, and tall vertical receipt towers. Enforce aspect ratio `height <= 1.35 * width` and source `height <= 820px`, zero prose paragraphs or disclaimers inside PNGs, and static-PNG/caption parity for animated figures.
9. **Freedom to explain:** Use familiar analogies, playful examples, and simplified models when they make the idea easier to understand. Connect them to the actual computation. State a necessary assumption once where it matters; move useful extensions after the mechanism and remove defensive qualifications that do not help the learner.

Structural and factual checks:
- Do not preserve generic template headings such as `What You Learn`, `Step Map`, `Tiny Story`, `Slow Walkthrough`, `Mini Test`, `Mastery Criteria`, `Study Loop`, `Production Check`, or `Before Clicking Next` unless that exact heading is genuinely the clearest fit. Prefer natural section headings named after the concept or reasoning step.
- Verify prerequisites, reverse outline dependency order, causal transitions between sections, common mistakes (symptom, cause, fix), practice feedback, and the final conceptual handoff to the next lesson.
- Compare current examples and terminology with the previous and next lessons, reader edition, book opening, figures, quiz, and selected video. Report mismatches outside this bundle's write scope so they remain pending.
- Ask whether a learner can trace the main example and solve a small new case using the explanation alone. Imports, word scans, output snapshots, and schema checks cannot answer this question.
- Verify metadata, inline `[^key]` citations against `web/src/content/references.json`, and factual claims against primary sources rather than memory or unverified `_research.md` summaries.
- Lead explanations directly with the mechanism, result, or required action instead of stock `"This is Y, not X"` contrast hooks. Preserve real technical limits, uncertainty, safety constraints, code, and exact quotations.

Critical instructions:
- Do not spawn subagents.
- Do not invoke background tasks.
- Review article bundles individually within the requested scope and fix direct problems in place.
- Keep edits scoped to the article bundle.
- Do not use bulk rewrite scripts, automatic humanizers, or keyword counts as editorial judgment.
- Never invent formulas, benchmark numbers, citations, or claims.

At the end, provide a concise summary of what changed, what was verified, and why.
