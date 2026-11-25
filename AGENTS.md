# LeetLLM - Project Overview

## Architecture

AI curriculum platform with 102 visible progressive lessons covering AI/ML and LLM engineering. Next.js 16+ application with Supabase backend and Cloud Run deployment.

**Live:** https://leetllm.com

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16+ (App Router, Server Components) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Shadcn UI |
| **Auth & DB** | Supabase (PostgreSQL + RLS) |
| **Hosting** | Google Cloud Run |
| **CDN** | Cloudflare |
| **Package Manager** | pnpm |

## Project Structure

```
leetllm.com/
├── web/                    # Next.js application
│   ├── src/
│   │   ├── app/            # Pages & API routes
│   │   ├── components/     # Reusable UI
│   │   ├── content/        # 102 visible lessons + blog + practice + glossary
│   │   └── lib/            # Supabase, content loader
│   └── tools/              # Build-time tools (illustrations, diagrams)
├── supabase/schema/        # Database migrations
├── scripts/                # Validation, content export, and operational tools
├── docs/                   # Architecture, auth, visual tooling, troubleshooting
└── deploy.sh              # Cloud Run deployment
```

## Content Model

- **102 visible lessons** across 11 progressive roadmap phases
- **Per-article:** content.md with JSON frontmatter + illustrations/ (legacy metadata.json bundles remain readable)
- **Canonical article order:** `web/src/lib/questions.ts` owns `ROADMAP_SECTION_SEQUENCE` and `SECTION_ROADMAP_SLUG_ORDER`; update both when moving lessons so roadmap, prev/next, and "keep reading" order stays correct.

## Editorial Guidance

Write every article, blog post, book chapter, and tutoring response in lucid, joyful textbook prose of O'Reilly, Karpathy, or 3Blue1Brown caliber, with zero em dashes and zero filler. Follow [CONTENT_GUIDELINES.md](./CONTENT_GUIDELINES.md) and eliminate all [10 Teaching NONOs](./CONTENT_GUIDELINES.md#the-10-teaching-nonos) across articles, metadata, glossary entries, book text, figures, quizzes, and video scripts:

- **Teach generously from intuition to mechanism:** Open with a curiosity gap, concrete puzzle, or vivid intuition rather than a dry syllabus abstract. Work small numbers by hand, build one clean mechanism thoroughly, and show real payoffs directly in the reading flow (never hidden inside `<details>` or faked with rigged weights). Move optional proofs and niche corners into `<details>` Deep Dive blocks or later lessons instead of bloating core lessons.
- **No lawyer disclaimers or ephemeral changelogs:** Never interrupt prose or captions with defensive apologies (`"does not prove/guarantee/measure/establish X"`) or dated library changelogs (`"As of TRL 1.17.1, rechecked Nov 4, 2026"`). State real assumptions once where they matter; `CONTENT_GUIDELINES.md` and `BOOK.md` hold the single curriculum-wide convention for hypothetical worked examples.
- **Domain-native examples and real runnable code:** Use tokens and sentences for NLP, image tensors for vision, gridworlds and MDPs for RL, matrices and distributions for math, and tiles, warps, and KV blocks for GPU/serving lessons. Never shoehorn SRE, compliance, or ticket roleplay (`policy`, `gate`, `audit`, `ledger`, `contract`, `09:12`, `ticket #48291`) into unrelated lessons. Use clean, runnable NumPy, PyTorch, scikit-learn, SciPy, or crisp algorithmic code free of Zero-ML mocks and defensive `isinstance` type-police boilerplate.
- **Natural rhythm and focused scope:** Welcome crisp contrasts, analogies, short punchy paragraphs, and varied pacing instead of monotonous prose walls or robotic prediction prompts. Aim for focused length (~2,000 to 3,500 words for core lessons; tighter Reader editions where present) and check `videos/coverage/` before renaming any `##` H2 heading.
- **Visuals, videos, and quizzes:** Use Vizmatic figures that genuinely encode meaning and Vizmatic films when motion reveals a transformation (with a self-contained static fallback). Lesson videos follow [videos/TEACHING_STANDARD.md](./videos/TEACHING_STANDARD.md). End every visible learn lesson with 3 to 6 sharp mastery-quiz questions (3 to 10 accepted) reviewed against their rules before shipping.

## Build-Time Assets

- **Illustrations:** TSX components render to PNG at build time
- **Diagrams:** Mermaid code blocks render to PNG at build time

Follow the [latest-only storage protocol](./docs/render-storage.md) for generated assets and temporary workspaces. Keep the latest usable outputs and inputs required by active jobs. Retire superseded candidates, screenshots, review archives and workspaces after preserving unique source. Measure storage and reserve capacity before rendering or copying snapshots. New inspection runs require `--storage-budget`; wrap other generated-output commands with `scripts/render-storage.mjs admit`. The targets cover the entire root build (20 GiB) and external project (150 GiB), with no new legacy exemptions.

## Key Commands

```bash
# Development
cd web && pnpm dev

# Build illustrations/diagrams
pnpm illustrations:build
pnpm diagrams:build

# Build PDF book monograph
./build-book.sh --all

# Deploy
./deploy.sh
```

## Documentation

- **[BOOK.md](./BOOK.md)** - Book generation pipeline and CLI
- **[CONTENT_GUIDELINES.md](./CONTENT_GUIDELINES.md)** - Editorial standards
- **[docs/architecture.md](./docs/architecture.md)** - Architecture deep dive
- **[ILLUSTRATION_GUIDELINES.md](./ILLUSTRATION_GUIDELINES.md)** - Value and visual-quality standard
- **[docs/illustration-framework.md](./docs/illustration-framework.md)** - Illustration pipeline
- **[docs/render-storage.md](./docs/render-storage.md)** - Storage budgets, guarded cache eviction and hydration
- **[docs/troubleshooting.md](./docs/troubleshooting.md)** - Debugging guide
- **[mobile/ios/RELEASE.md](./mobile/ios/RELEASE.md)** - iOS & Mac Catalyst release and App Store deployment

## Detailed Guide

For testing, deployment, and monitoring procedures, see:
- [AGENTS_TESTING.md](./AGENTS_TESTING.md) - Testing commands and validation
- [AGENTS_DEPLOY.md](./AGENTS_DEPLOY.md) - Cloud Run deployment
- [AGENTS_MONITOR.md](./AGENTS_MONITOR.md) - Cloud Run logs and health checks
