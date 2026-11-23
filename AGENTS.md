# LeetLLM - Project Overview

## Architecture

AI curriculum platform with 199 visible progressive lessons covering AI/ML and LLM engineering. Next.js 16+ application with Supabase backend and Cloud Run deployment.

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
│   │   ├── content/        # 199 visible lessons + hidden/quarantined lessons + blog
│   │   └── lib/            # Supabase, content loader
│   └── tools/              # Build-time tools (illustrations, diagrams)
├── supabase/schema/        # Database migrations
├── scripts/                # Validation, content export, and operational tools
├── docs/                   # Architecture, auth, visual tooling, troubleshooting
└── deploy.sh              # Cloud Run deployment
```

## Content Model

- **199 visible lessons** across 15 progressive roadmap phases
- **Per-article:** content.md with JSON frontmatter + illustrations/ (legacy metadata.json bundles remain readable)
- **Canonical article order:** `web/src/lib/questions.ts` owns `ROADMAP_SECTION_SEQUENCE` and `SECTION_ROADMAP_SLUG_ORDER`; update both when moving lessons so roadmap, prev/next, and "keep reading" order stays correct.

## Editorial Guidance

Write every article, blog post, book chapter, and tutoring response in varied, lucid textbook prose of O'Reilly, Karpathy, or 3Blue1Brown caliber, with zero em dashes and zero filler. Teach from intuition and worked mathematics to clean mechanisms before introducing corner cases, avoiding gotcha-first openings, choppy staccato fragmentation, and robotic prediction prompts. Follow [Plain English for teaching](./CONTENT_GUIDELINES.md#plain-english-for-teaching) and [State the idea directly](./CONTENT_GUIDELINES.md#state-the-idea-directly) across articles, metadata, glossary definitions, book text, figures, and video scripts.

Teach generously. Use familiar analogies, diagrams, small simulations, and worked examples when they make an idea easier to understand. Develop one complete mechanism before branching into alternatives. Explain the assumptions needed for the current calculation, and introduce limitations when the reader can understand their consequences. Do not interrupt ordinary teaching with defensive qualifications, repeated disclaimers, or a catalogue of everything an example does not prove. Comprehensive coverage means explaining the reasoning and connecting the ideas, not requiring every related topic in the opening. Paragraph length, question counts, library imports, and passing validators cannot establish teaching quality.

Keep examples domain-native (tokens and sequences for NLP, image tensors for vision, gridworlds and MDPs for RL, matrices and distributions for math, and tiles and warps for GPU kernels) instead of shoehorning SRE or IAM roleplay characters into unrelated lessons. Use genuine runnable NumPy, PyTorch, scikit-learn, SciPy, or systems code free of defensive type-police boilerplate and Zero-ML mocks. Avoid SOC2/bureaucratic dialect and inline fictional-data disclaimers; `CONTENT_GUIDELINES.md` and `BOOK.md` document the single curriculum-wide convention for hypothetical worked examples.

Choose the simplest implementation that exposes the mechanism. A short scalar calculation or a simulation that computes its own results can teach well; hardcoded answers cannot demonstrate learning, inference, or a model's response. Use Vizmatic films for motion that reveals a transformation, and provide a self-contained still for print and reduced motion. Keep article, book, quiz, and video examples coherent when revising a lesson.

Lesson videos follow the [video teaching standard](./videos/TEACHING_STANDARD.md): they must teach their topic accurately and completely, and brevity is never a goal by itself. Every mastery quiz is reviewed against its rules before it measures anything.

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
