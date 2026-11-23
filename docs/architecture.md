# LeetLLM Design Overview

## Vision

LeetLLM is an open-source curriculum for AI/ML and LLM engineering. It publishes a structured set of lessons and blog posts with references, runnable examples, generated diagrams, and generated illustrations.

## Architecture

LeetLLM is a Next.js application deployed to Google Cloud Run. Supabase handles auth and PostgreSQL persistence for user-owned state such as profiles, reading progress, and article comments.

```
leetllm.com/
├── web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (public)/       # landing, learn, blog, terms, privacy
│   │   │   ├── (auth)/         # login, signup, OAuth entrypoints
│   │   │   ├── (app)/          # authenticated dashboard and practice pages
│   │   │   ├── api/            # comments, progress, markdown, media, search
│   │   │   ├── sitemap.ts
│   │   │   └── robots.ts
│   │   ├── components/
│   │   ├── content/            # lessons and blog posts
│   │   ├── generated/          # build-generated content metadata
│   │   └── lib/                # Supabase clients, content loaders, search
│   └── tools/                  # illustration and diagram builders
├── supabase/schema/            # SQL migrations
├── scripts/                    # validation and content tooling
├── deploy.sh                   # Cloud Run deployment
└── Dockerfile
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16+ App Router |
| Language | TypeScript |
| Styling | Tailwind CSS + Shadcn UI |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL with RLS |
| Hosting | Google Cloud Run |
| CDN | Cloudflare |
| Package manager | pnpm |

## Authentication

Supabase Auth supports email/password and GitHub OAuth. Server-side auth uses Supabase user validation, middleware protects authenticated routes, and public learning pages remain readable without login. Login is only needed for saved state such as progress and comments.

## Database

### `profiles`

Extends `auth.users` with app display data.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key and foreign key to `auth.users` |
| `display_name` | TEXT | User display name |
| `created_at` | TIMESTAMPTZ | Profile creation time |
| `updated_at` | TIMESTAMPTZ | Last profile update |

### Other Tables

- `user_read_progress`: per-user lesson completion state.
- `article_comments`: signed-in article comments and replies.
- `article_comment_votes`: signed-in comment voting state.

RLS limits user-owned data to the current authenticated user. Service-role access is reserved for server-side administration.

## Content Model

Lessons live under `web/src/content/{section}/{slug}/`.

Each lesson has:

- `content.md`: JSON frontmatter for title, description, category, difficulty, companies, and SEO, followed by the complete lesson, quizzes, and learning material.
- `metadata.json`: optional legacy metadata accepted by the loader; new lessons keep canonical metadata in `content.md` frontmatter.
- `references.json`: shared citation registry resolved from inline `[^key]` references rather than copied into lesson metadata.
- `illustrations/`: optional TSX illustration sources rendered to PNG.
- `diagrams/`: optional Mermaid diagrams rendered to PNG.

The content loader derives reading time, references, follow-up material, and open-access status at build/runtime. Persisted `timeEstimate` and frontmatter `references` are invalid. Visible lesson ordering lives in `web/src/lib/questions.ts` through `ROADMAP_SECTION_SEQUENCE` and `SECTION_ROADMAP_SLUG_ORDER`.

## Build Assets

Illustrations are TSX components rendered to PNG by `pnpm illustrations:build`. Diagrams are Mermaid blocks rendered by `pnpm diagrams:build`. Both generated asset families are validated before full deployment.

## Deployment

`./deploy.sh` is the authoritative production path. It runs content validation, runnable Python example checks, Vitest, illustration rendering and validation, diagram rendering, Cloud Run candidate deployment, smoke-tag validation, traffic migration, Cloudflare purge, and production route smoke checks.

`./deploy.sh --fast` skips heavier pre-deploy validation but still builds changed illustrations, deploys a no-traffic candidate, validates known routes, migrates traffic, purges Cloudflare, and runs production smoke checks.

## Caching

Public pages use Cloudflare and Next.js cache headers. Anonymous learn and blog pages are CDN-cacheable; authenticated routes and API routes remain dynamic.

Key public cache headers use:

```text
Cache-Control: public, s-maxage=14400, stale-while-revalidate=3600, max-age=0
```

## Analytics

GA4 tracks page views, CTA clicks, signup starts, and article views. Analytics load only in production.

## UX

The product prioritizes dense technical reading, fast navigation, readable code, stable diagrams, and predictable article navigation. Public content is first-class; auth features support optional persistence rather than access control.
