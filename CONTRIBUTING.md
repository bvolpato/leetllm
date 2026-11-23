# Contributing to LeetLLM

Thank you for helping make AI/ML and LLM engineering education open, accurate, and accessible to everyone. All code and curriculum content in this repository is licensed under the [MIT License](./LICENSE).

## Ways to Contribute

- **Fix technical errors or unclear explanations** in any of the 199 lessons, 757 glossary entries, or 47 coding practice problems.
- **Improve visuals and animations** in Vizmatic TSX illustrations (`illustrations/*.tsx`) or Mermaid diagrams.
- **Add or sharpen coding practice problems** (Python + Java tests, edge cases, and reference guides).
- **Improve the web app, practice sandbox, book pipeline, video pipeline, or iOS app.**
- **Report bugs, broken links, or stale references** using the issue templates.

## Local Development Setup

### Prerequisites

- Node.js 22+
- pnpm `10.33.0` (`corepack enable`)
- Python 3.12+ and [uv](https://docs.astral.sh/uv/) (for content and example validators)
- OpenJDK 21 (optional, needed only when running Java practice tests locally)

### Quickstart

```bash
git clone https://github.com/bvolpato/leetllm.git
cd leetllm/web
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The entire curriculum, mastery quizzes, glossary, and coding practice problems work locally without any cloud accounts or secrets.

To enable authentication, progress sync, or AI personalization locally, copy [`web/.env.local.example`](./web/.env.local.example) to `web/.env.local` (gitignored) and follow the setup section in [`README.md`](./README.md).

## Content Standards

Before editing lessons, quizzes, illustrations, or practice problems, review:

- [`CONTENT_GUIDELINES.md`](./CONTENT_GUIDELINES.md) for editorial voice, mathematical clarity, runnable code requirements, and citation rules.
- [`ILLUSTRATION_GUIDELINES.md`](./ILLUSTRATION_GUIDELINES.md) for visual quality, dark/light theme parity, and density checks.
- [`COURSE_CORE.md`](./COURSE_CORE.md) for canonical prerequisites and library conventions.

Each lesson lives in `web/src/content/<section>/<slug>/`:

- `content.md`: JSON frontmatter, prose, runnable examples, checkpoints, and end-of-lesson `mastery-quiz`.
- `_research.md`: primary-source verification notes.
- `illustrations/`: theme-aware Vizmatic TSX components (rendered to `_generated/` at build time).
- `web/src/content/references.json`: shared citation registry for `[^key]` footnotes.

Canonical roadmap order is owned by `web/src/lib/questions.ts` (`ROADMAP_SECTION_SEQUENCE` and `SECTION_ROADMAP_SLUG_ORDER`). Update both when adding or reordering lessons.

## Validation Checks Before Opening a PR

### Web App & Practice Changes

```bash
cd web
pnpm audit:dependencies
pnpm lint
pnpm test --run
pnpm typecheck
pnpm build
```

If you changed practice problems or sandbox logic:

```bash
cd web
pnpm practice:validate
```

### Content, Quiz, and Visual Changes

```bash
uv run scripts/validate-metadata.py
uv run scripts/update-time-estimates.py --check
uv run scripts/validate-references.py --skip-http
uv run scripts/validate-content-structure.py
uv run scripts/validate-next-callouts.py
uv run scripts/validate-mastery-quizzes.py
uv run scripts/validate-python-examples.py --article <slug>
```

If you changed TSX illustrations:

```bash
cd web
pnpm illustrations:format:check
pnpm illustrations:typecheck -- --base main
pnpm illustrations:build:article <section>/<slug>
cd ..
uv run scripts/validate-illustration-refs.py
uv run scripts/validate-illustration-quality.py --fail-layout-warnings
```

## Pull Request Process

1. Fork the repository and create a focused branch from `main`.
2. Keep PRs scoped to one logical change (one lesson bundle, one bug fix, or one feature).
3. Run the relevant validation commands above and summarize what you verified in the PR description.
4. Never commit `.env*`, files in `secrets/` or `private/`, signing certificates (`.p12`, `.p8`, `.mobileprovision`), or personal credentials.
5. All community interactions follow our [Code of Conduct](./CODE_OF_CONDUCT.md).
