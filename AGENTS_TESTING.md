# LeetLLM - Testing Guide

## Validation Policy

GitHub Actions runs web validation and the published/development Vizmatic checks on GitHub-hosted `ubuntu-24.04` runners for pull requests targeting `main`. These checks use locked dependencies, install FFmpeg and rendering fonts, and restore GitHub Actions caches without depending on the shared ARC queue. They do not run on pushes and are not required merge gates.

PR CI audits all dependencies, restores the generated visual cache, rebuilds visuals for changed content bundles, hydrates unchanged production visuals, and regenerates a small missing production set when needed. It removes stale generated illustration PNGs and validates illustration quality before saving the visual cache, exports shared iOS content, then runs lint, Vitest, type checking, and the production web build.

Run the full web gate before pushing or deploying web changes. Native iOS tests and unsigned archives run in `.github/workflows/ios-testflight.yml` on the pinned Xcode 27 workflow. Trigger it with a GitHub-verified signed `testflight-ios-<build-number>` tag or dispatch it with a positive build number. The Linux job syncs and validates the iOS content; the macOS job runs the full `LeetLLM` scheme and archives the iPhone/iPad app. The workflow does not sign or upload builds. To distribute from Linux, download the archive and use the pinned shared BruTV release helper with the local distribution certificate, matching profile, App Store Connect key, and zsign installation. Do not put Apple signing files or credentials in Actions. Local `./test.sh` still requires macOS and Xcode; Linux can export and validate shared iOS content but cannot run native tests. See [the iOS release guide](mobile/ios/RELEASE.md) for archive, signing, and upload steps.

For full local validation:

Use pnpm 10.33.0, matching `web/package.json` and the deployment image. If the host has another pnpm version, put Corepack's shim first on `PATH` so nested lifecycle commands use the pinned version too. Set `CI=true` for noninteractive installation:

```bash
task_pnpm_dir="$(mktemp -d)"
corepack enable --install-directory "$task_pnpm_dir" pnpm
export PATH="$task_pnpm_dir:$PATH"
export CI=true
```

```bash
cd web
pnpm install --frozen-lockfile
pnpm test:dependency-audit
pnpm audit:dependencies
pnpm lint
pnpm test --run
pnpm typecheck
pnpm build

cd ../mobile/ios/LeetLLM
./test.sh
```

`./test.sh` requires macOS with Xcode. It regenerates and validates iOS content before running native tests.

The dependency-audit wrapper preserves the raw `pnpm audit` report and rejects every vulnerability finding except the reviewed `minimatch@3.1.5` / `GHSA-g3hv-75wg-m249` finding at the single `eslint-plugin-import` path. That advisory describes a 10.2.6 preprocessing path absent from v3.1.5; the wrapper reports this version-specific exception and blocks all other findings.

The development dependency `braces@3.0.3` has no published fix for [CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). `web/patches/braces@3.0.3.patch` applies the depth guards proposed in [upstream PR 72](https://github.com/micromatch/braces/pull/72). The regression suite in `web/src/test/braces-security.test.ts` checks the installed transitive dependency, including deeply nested patterns and direct AST inputs. The audit exception suppresses only this locally patched CVE. Replace the patch and remove the exception when an upstream fixed release is available; other advisories remain blocking.

## Test Commands

### Frontend Tests (Vitest)

```bash
cd web

# Run all tests
pnpm test --run

# Run in watch mode (development)
pnpm test
```

### Linting

```bash
cd web
pnpm lint
```

### Type Checking

```bash
cd web
pnpm typecheck
```

## Pre-Deploy Smoke Tests

The `deploy.sh` deployment path automatically runs validation before deployment:

After a candidate revision starts, deployment also runs an authenticated Leety integration smoke test with credentials from `leetllm-e2e-user` in Secret Manager. It verifies web session cookies, iOS-style Bearer authentication, Supabase token refresh, and a real grounded Leety answer before traffic moves. The same validation repeats through the production origin after traffic migration.

### 1. Metadata Validation

```bash
uv run scripts/validate-metadata.py
```

Validates all content frontmatter against the schema for routing, Learn cards, SEO/search labels, publication dates, and cover images. Article-level learning material such as rubrics, follow-up questions, common pitfalls, mastery criteria, and practice answers belongs in `content.md`, not metadata.

### 2. Reading-Time Estimates

```bash
uv run scripts/update-time-estimates.py --check
```

Verifies that no article persists `timeEstimate`; reading time is derived from content length. If this fails, inspect each reported bundle and remove its stale field directly.

### 3. Reference Validation

```bash
uv run scripts/validate-references.py --skip-http
```

Cross-checks `[^ref]` citations in `content.md` against global `references.json`.

### 4. Content Structure

```bash
uv run scripts/validate-content-structure.py
```

Fails Markdown/MDX structures that can render incorrectly in production:
- Article and blog `content.md` bodies with source-level H1 headings; page shells own metadata title rendering
- Display math with `$$` on content lines, which the Markdown parser treats as inline math
- Foundation and preparation generated images without a `<figure>` wrapper and nonempty `<figcaption>`

Caption accuracy, useful visual explanations, and article-specific composition require manual review. The structure validator does not judge them through character counts, wording, or illustration filenames.

The content rendering regression suite also parses article, checkpoint, quiz, and glossary formulas through the Markdown math parser and KaTeX with strict errors. It rejects malformed formulas, unsupported commands, and double-dollar expressions parsed as inline math. This checks rendering, not mathematical correctness or whether prose and code were assigned the right format.

### 4a. Editorial Review

Read and review one complete article at a time against [CONTENT_GUIDELINES.md](./CONTENT_GUIDELINES.md). Verify facts against primary sources, run its examples, inspect both illustration themes and any animation, and check mastery questions for ambiguity and useful feedback. Trace the central example from its introduction to its result. Check that new concepts arrive when the reader needs them, analogies explain specific relationships, and exercises ask the learner to apply what was taught. Inspect the preceding and following lessons and corresponding book and video sources for consistent examples and prerequisites.

There is no automatic passing-review command. `scripts/audit-content-quality.py --strict` checks mechanical rules and reports editorial signals. Paragraph length, repeated questions, and library-token detection are warnings for review, not writing quotas. A scalar implementation or computed simulation may teach the mechanism better than a library call. Structural checks never guarantee accuracy, natural prose, or pedagogical quality. Record concrete findings and remaining gaps directly in the review summary.

### 5. Next Callouts

```bash
uv run scripts/validate-next-callouts.py
```

Checks every `> **Next:**` handoff against canonical roadmap order so article-level navigation stays in sync with `web/src/lib/questions.ts`.

Production content smoke tests validate blog slug history as permanent redirects to canonical replacements. For an ordinary blog slug change, add the old slug to the canonical post's `aliases` array. Keep `redirectTo` only when a retired post remains as its own content bundle. Alias generation rejects duplicate aliases, canonical-slug conflicts, drafts, and redirect-chain targets. Private posts can preserve direct URLs through aliases without entering public listings, RSS, sitemap, glossary backreferences, or the iOS bundle. The sitemap includes public canonical posts only.

The same live smoke test requires representative HTML, raw Markdown, and downloadable text routes to negotiate `Content-Encoding: gzip` when clients send `Accept-Encoding: gzip`. It also verifies that an `identity` request remains uncompressed. This runs against both the no-traffic Cloud Run candidate and the Cloudflare production URL during deployment.

Volatile blog metadata may declare `verifiedAt` and `refreshAfter` as a pair. `refreshAfter` must be later than `verifiedAt`. Published posts fail metadata validation after `refreshAfter`; drafts and private posts do not expire while unpublished. Reverify claims against primary sources, update both dates, then rerun metadata validation.

### 6. Illustration References

Verifies that every `.tsx` illustration file in `content/*/illustrations/` is referenced in the corresponding `content.md`.

```bash
uv run scripts/validate-illustration-refs.py
```

Run this after `pnpm illustrations:build`, because it verifies that Markdown image references point to real generated files. For themed illustrations, content should reference an existing variant such as `illustrations/_generated/foo_dark.png`; the renderer strips `_dark` and `_light` and emits one image carrying both theme sources so browsers, Reader mode, and print extraction see one visual.

### 6a. Mastery Quizzes

```bash
uv run scripts/validate-mastery-quizzes.py
```

Checks that every learn article has exactly one end-of-lesson `mastery-quiz` block with 5 to 10 questions. It validates JSON syntax, required nonempty fields, four distinct options, a matching answer key, and block placement. Option labels are case-sensitive, matching the application runtime.

Review quizzes within one complete article at a time. Read the lesson before choosing the question count, check each correct answer against the explanation or runnable example, and write distractors from plausible misconceptions about that question. Check coverage, ambiguity, and answer cues after editing. Passing the schema validator checks format only; it never proves the quiz teaches or measures understanding. Do not generate, replace, or revise quizzes through a corpus-wide script or shared bulk prompt.

### 7. Illustration Quality

```bash
uv run scripts/validate-illustration-quality.py --fail-layout-warnings
uv run scripts/validate-illustration-density.py
uv run scripts/validate-illustration-density.py --strict-text
```

Fails text arrowhead glyphs (▶ ▼ ▲ ◀), unsupported `zIndex`, missing generated PNGs, oversized or implausibly small cropped outputs, and negative-positioning layout risks. Article PNGs crop both axes at 2x resolution, so output width and height can be smaller than the declared canvas. The validator also checks edge clipping, excessive vertical gutters, source dimension exports, and both generated theme variants (or scene variants).

The density validator flags overpacked visuals, missing visual encoding (card/table-only layouts), and aspect ratio or height violations (`height <= 1.35 * width` and source `height <= 820px`). `--strict-text` flags slide-like images with long paragraphs, dense explanation cards, or disclaimers inside the PNG. Redesign low-value or oversized visuals rather than allowlisting them.

To rank remaining text-heavy visuals:

```bash
uv run scripts/validate-illustration-density.py --text-report
```

For large batches of new or updated illustrations, also generate the visual review gallery:

```bash
uv run scripts/review-illustrations.py
# Then open /tmp/leetllm_illustrations/index.html
```

### 8. Cover Images

```bash
uv run scripts/validate-coverimages.py
```

Confirms that every declared `coverImage` path resolves to a real asset. Missing fields are valid: runtime uses a social banner, the first article image, or a default OG fallback without forcing filler art.

### 9. Runnable Python Examples

```bash
uv run scripts/validate-python-examples.py
```

Executes every Python code fence preceded by `<!-- leetllm: test -->`. Use that marker only for complete copy-runnable examples; leave fragments and external-service API examples unmarked until they become self-contained labs.

For one article, pass its slug. Targeted mode requires at least one marked example by default; corpus-wide mode keeps the deploy floor of 10.

```bash
uv run scripts/validate-python-examples.py --article python-for-ai-engineering
```

Use `<!-- leetllm: test, output=show -->` when stdout should appear directly after the code block, or `output=folded` when stdout belongs inside a collapsed `Output` accordion. Use `id=mini-lab` on a cell that should expose state to later cells, then `continue=mini-lab` on the next cell to reuse the same Python session and generate a separate output block for that cell. Add `output_title="Sample completion"` when the block should render with a custom label instead of generic `Output`. Keep continuations linear, with one next cell per `id`. Use `output_head=10`, `output_tail=10`, or `edges:2:5` to trim long stdout while preserving headers and final summary lines. Refresh generated output blocks after changing those examples:

When an article ships local downloadable data in `assets/`, the validator copies that folder into the temporary run directory. Marked examples can read files such as `Path("assets/shakespeare.txt")` directly.

```bash
uv run scripts/validate-python-examples.py --article python-for-ai-engineering --write-outputs
```

Finish editing that bundle before refreshing its outputs. The validator rejects changes made after it collected the examples; rerun it against the current file instead of applying stale offsets.

### 10. Content Integrity Tests

```bash
cd web && pnpm test --run
```

Tests content renderability and integrity via Vitest.

### 11. Glossary Generation

```bash
cd web && pnpm glossary:build
```

Review glossary annotations within each article. Add a glossary span directly only where its definition helps the reader, then regenerate `web/src/generated/glossary.ts`. Keyword matches alone never warrant adding an annotation to a lesson.

`web/src/generated/glossary.ts` is an ignored build artifact. Dev, lint, tests, typecheck, builds, and iOS export regenerate it from glossary Markdown.

## Build-Time Asset Tests

### Illustrations

```bash
cd web

# Build all illustrations
pnpm illustrations:build

# Build specific article
pnpm illustrations:build:article fundamentals/attention
```

### Diagrams

```bash
cd web

# Build all diagrams
pnpm diagrams:build

# Check current Mermaid outputs for stale files and over-wide renders
uv run ../scripts/validate-diagram-quality.py

# Build specific article
pnpm diagrams:build:article fundamentals/attention

# Force rebuild all
pnpm diagrams:build -- --force
```

## Manual Testing Checklist

| Check | Command/Action |
|-------|---------------|
| Dev server | `pnpm dev` -> http://localhost:3000 |
| Build | `pnpm build` (no errors) |
| Lint | `pnpm lint` (no errors; warning-only baseline currently exists) |
| Metadata | `uv run scripts/validate-metadata.py` |
| Reading-time estimates | `uv run scripts/update-time-estimates.py --check` |
| References | `uv run scripts/validate-references.py --skip-http` |
| Content structure | `uv run scripts/validate-content-structure.py` |
| Diagram quality | `pnpm diagrams:build` first, then `uv run scripts/validate-diagram-quality.py` |
| Next callouts | `uv run scripts/validate-next-callouts.py` |
| Mastery quizzes | `uv run scripts/validate-mastery-quizzes.py` |
| Python examples | `uv run scripts/validate-python-examples.py` |
| Illustrations | `pnpm illustrations:build` first, then `uv run scripts/validate-illustration-refs.py` and `uv run scripts/validate-illustration-quality.py --fail-layout-warnings` |
| Cover images | `uv run scripts/validate-coverimages.py` |

## Troubleshooting Tests

**Metadata validation fails:**
```bash
# Check specific file
uv run scripts/validate-metadata.py 2>&1 | grep -A5 "ERROR"
```

**Illustration build fails:**
```bash
cd web
pnpm install --frozen-lockfile
pnpm exec tsx tools/illustrations/build.ts --article foundations/docker-containerization-reproducible-ai --force
```

TSX illustrations render through Vizmatic; they do not need Playwright or Chromium. Inspect the reported source or layout error. A `CanvasOverflowError` requires correcting that illustration's dimensions or layout and inspecting both themes after rebuilding.

**Diagram build fails with "Chromium not found":**
```bash
cd web
pnpm dlx playwright install chromium
CHROMIUM_PATH="$(find "$HOME/.cache/ms-playwright" -path '*/chrome-linux64/chrome' -type f | sort | tail -1)" pnpm diagrams:build

# For full deploy from repo root:
CHROMIUM_PATH="$(find "$HOME/.cache/ms-playwright" -path '*/chrome-linux64/chrome' -type f | sort | tail -1)" ./deploy.sh
```

**Reference validation fails:**
```bash
# List all broken references
uv run scripts/validate-references.py 2>&1 | grep "missing"
```
