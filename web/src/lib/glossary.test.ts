import { existsSync, readdirSync, readFileSync, statSync } from "fs"
import { join } from "path"
import { describe, expect, test } from "vitest"
import { parseGlossarySections as parseGlossaryMarkdownSections } from "../../scripts/glossary-sections"
import { loadContentBundle } from "./content-bundle"
import { GLOSSARY_ENTRIES, GLOSSARY_ENTRIES_BY_IMPORTANCE } from "@/generated/glossary"

const CONTENT_ROOT = join(process.cwd(), "src", "content")
const GLOSSARY_ROOT = join(CONTENT_ROOT, "glossary")
const GLOSSARY_SPAN_RE = /<span\s+[^>]*data-glossary="([^"]+)"/g
const GLOSSARY_LINK_RE = /\]\(glossary:\/\/([a-z0-9-]+)\)/g

/** Well-known optional teaching scaffolds. Not required. */
const OPTIONAL_SCAFFOLD_SECTIONS = new Set([
    "Intuition",
    "Example",
    "Formula",
    "Decision rule",
    "Common mistake",
    "Why it matters here",
    "Related terms",
    "See also",
    "Failure surface",
    "Failure modes",
    "Failure mode",
    "Failure symptoms",
    "Failure pattern",
])

function isOptionalScaffoldSection(title: string) {
    return OPTIONAL_SCAFFOLD_SECTIONS.has(title) || title.startsWith("Example:")
}

const FORBIDDEN_GLOSSARY_SNIPPETS = [
    "related rabbit holes",
    "Related rabbit holes",
    "Study check:",
    "part of the retrieval bridge between a user question and evidence",
    "Do not optimize",
    "operational control surface",
    "define the live signal, threshold, owner",
    "turns AI prototypes into systems",
    "supports the implementation layer",
    "helps explain how models are trained",
    "supports the math behind",
    "gives LeetLLM learners a precise handle",
    "LeetLLM uses this term because",
    "Those details matter",
    "is connector vocabulary",
    "protects RAG systems, agents, coding tools",
    "## Operational signal",
    "defines part of the runtime boundary",
    "concrete tool choice with runtime consequences",
    "about seeing the system clearly under real traffic",
    "quality guardrail for changes",
    "release-control pattern",
    "Platform debugging should connect the deploy artifact",
    "Reliability controls need counters",
    "Recovery logic that isn't tested becomes another failure mode",
    "Write the trigger metric, the owner, and the rollback or fallback before you ship the change that depends on this concept",
    "TODO",
    "TBD",
    "lorem ipsum",
    "as an AI language model",
]

/** Terms whose teaching needs math or a concrete numeric derivation. */
const MATH_DEPTH_IDS = new Set([
    "softmax",
    "cross-entropy",
    "gradient",
    "matrix",
    "vector",
    "tensor",
    "dot-product",
    "self-attention",
    "cosine-similarity",
    "kl-divergence",
    "variance",
    "mean-absolute-error",
    "backpropagation",
    "learning-rate",
    "rope",
    "svd",
    "pca",
    "layernorm",
    "rmsnorm",
    "attention-head",
    "logits",
    "temperature",
    "top-p",
    "top-k",
    "ndcg",
    "mrr",
    "recall-at-k",
    "precision-recall",
    "perplexity",
    "log-sum-exp",
])

/** Systems / algorithm terms that should show operational code or a concrete sizing formula. */
const CODE_OR_SIZING_IDS = new Set([
    "react",
    "reflexion",
    "context-rot",
    "static-batching",
    "test-time-compute",
    "virtual-memory",
    "s-lora",
    "kv-cache",
    "pagedattention",
    "continuous-batching",
    "prefix-cache",
    "token-bucket",
    "lru-cache",
    "heapq",
    "collections-deque",
    "thread-pool-executor",
    "asyncio-queue",
    "softmax",
    "bpe",
    "numpy-array",
    "gradient-clipping",
    "loss-scaling",
    "speculative-decoding",
])

function contentFiles(dir: string): string[] {
    if (!existsSync(dir)) return []

    return readdirSync(dir)
        .flatMap((name) => {
            const path = join(dir, name)
            const stat = statSync(path)
            if (stat.isDirectory()) {
                return contentFiles(path)
            }
            return name === "content.md" ? [path] : []
        })
}

function undiscoverableContentUrls(dir = CONTENT_ROOT): Set<string> {
    const urls = new Set<string>()

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue

        const childDir = join(dir, entry.name)
        const bundle = loadContentBundle(childDir)
        if (!bundle) {
            for (const url of undiscoverableContentUrls(childDir)) urls.add(url)
            continue
        }

        const metadata = bundle.metadata as {
            slug?: string
            private?: boolean
            draft?: boolean
            hidden?: boolean
            redirectTo?: string
        }
        if (!metadata.private && !metadata.draft && !metadata.hidden && !metadata.redirectTo) continue

        const slug = metadata.slug ?? entry.name
        const isBlog = childDir.startsWith(join(CONTENT_ROOT, "blog"))
        urls.add(isBlog ? `/blog/${slug}` : `/learn/${slug}`)
    }

    return urls
}

function bodyOf(content: string) {
    return content.replace(/^---\n[\s\S]*?\n---\n?/, "")
}

function parseGlossarySections(content: string) {
    return Array.from(parseGlossaryMarkdownSections(bodyOf(content)).sections, ([title, sectionContent]) => ({
        title,
        content: sectionContent,
    }))
}

describe("glossary entries", () => {
    test("generated entries match glossary markdown files", () => {
        const markdownIds = readdirSync(GLOSSARY_ROOT)
            .filter((name) => name.endsWith(".md"))
            .map((name) => name.replace(/\.md$/, ""))
            .sort()

        expect(Object.keys(GLOSSARY_ENTRIES).sort()).toEqual(markdownIds)
    })

    test("usage backreferences never expose private, draft, hidden, or redirected content", () => {
        const blockedUrls = undiscoverableContentUrls()
        const leaks: string[] = []

        expect(blockedUrls.size).toBeGreaterThan(0)
        for (const [id, entry] of Object.entries(GLOSSARY_ENTRIES)) {
            for (const usage of entry.usage ?? []) {
                if (blockedUrls.has(usage.url)) leaks.push(`${id}: ${usage.url}`)
            }
        }

        expect(leaks).toEqual([])
    })

    test("content references existing glossary ids", () => {
        const knownIds = new Set(Object.keys(GLOSSARY_ENTRIES))
        const unknown: string[] = []

        for (const path of contentFiles(CONTENT_ROOT)) {
            const content = readFileSync(path, "utf8")
            for (const match of content.matchAll(GLOSSARY_SPAN_RE)) {
                if (!knownIds.has(match[1])) {
                    unknown.push(`${path.replace(`${CONTENT_ROOT}/`, "")}: ${match[1]}`)
                }
            }
        }

        expect(unknown).toEqual([])
    })

    test("every coding practice problem links a relevant glossary term", () => {
        const practiceFiles = contentFiles(join(CONTENT_ROOT, "practice"))
        const missing = practiceFiles
            .filter((path) => Array.from(readFileSync(path, "utf8").matchAll(GLOSSARY_SPAN_RE)).length === 0)
            .map((path) => path.replace(`${CONTENT_ROOT}/`, ""))

        expect(practiceFiles.length).toBeGreaterThan(0)
        expect(missing).toEqual([])
    })

    test("markdown entries meet lean pedagogical surface without forced stock scaffolds", () => {
        const knownIds = new Set(Object.keys(GLOSSARY_ENTRIES))
        const problems: string[] = []

        for (const name of readdirSync(GLOSSARY_ROOT).filter((entry) => entry.endsWith(".md"))) {
            const id = name.replace(/\.md$/, "")
            const content = readFileSync(join(GLOSSARY_ROOT, name), "utf8")
            const frontmatter = content.match(/^---\n([\s\S]*?)\n---/)
            const importance = frontmatter?.[1].match(/^importance:\s*(\d+)$/m)?.[1]

            if (!importance || Number(importance) < 0 || Number(importance) > 100) {
                problems.push(`${name}: missing importance 0-100`)
            } else if (GLOSSARY_ENTRIES[id as keyof typeof GLOSSARY_ENTRIES].importance !== Number(importance)) {
                problems.push(`${name}: generated importance mismatch`)
            }

            // Relevance and related terms stay universal. Example headings may name the scenario.
            for (const section of ["## Why it matters here", "## Related terms"]) {
                if (!content.includes(section)) {
                    problems.push(`${name}: missing ${section}`)
                }
            }

            for (const snippet of FORBIDDEN_GLOSSARY_SNIPPETS) {
                if (content.includes(snippet)) {
                    problems.push(`${name}: contains stale glossary template phrase "${snippet}"`)
                }
            }
            if (content.includes("## See also")) {
                problems.push(`${name}: use ## Related terms instead of ## See also`)
            }

            const sections = parseGlossarySections(content)
            if (!sections.some((section) => section.title === "Example" || section.title.startsWith("Example:"))) {
                problems.push(`${name}: missing Example or Example: ... teaching section`)
            }
            const termSpecific = sections.filter((section) => !isOptionalScaffoldSection(section.title))
            const teachingSections = sections.filter(
                (section) =>
                    section.title !== "Example" &&
                    !section.title.startsWith("Example:") &&
                    section.title !== "Why it matters here" &&
                    section.title !== "Related terms" &&
                    section.title !== "See also",
            )

            // At least one teaching section beyond the lean baseline (intuition, formula, or term-specific).
            // Decision rule / Common mistake alone do not satisfy this — they are optional scaffolds.
            const nonStockTeaching = teachingSections.filter(
                (section) =>
                    section.title !== "Decision rule" &&
                    section.title !== "Common mistake" &&
                    section.title !== "Failure surface",
            )
            if (nonStockTeaching.length === 0 && termSpecific.length === 0) {
                problems.push(
                    `${name}: needs at least one term-specific teaching section (not Decision rule / Common mistake)`,
                )
            }

            const definition = bodyOf(content).split("\n## ")[0]?.trim() ?? ""
            if (definition.length < 80) {
                problems.push(`${name}: definition too thin`)
            }

            for (const section of nonStockTeaching) {
                if (section.content.length < 60) {
                    problems.push(`${name}: teaching section ${section.title} is too thin`)
                }
            }

            // If stock scaffolds are present, they must be substantive and term-specific.
            for (const stock of ["Decision rule", "Common mistake", "Failure surface"]) {
                const section = sections.find((item) => item.title === stock)
                if (!section) continue
                if (section.content.length < 60) {
                    problems.push(`${name}: optional ${stock} is too thin; remove it or deepen it`)
                }
            }

            const related = Array.from(content.matchAll(GLOSSARY_LINK_RE)).map((match) => match[1])
            if (related.length === 0) {
                problems.push(`${name}: missing glossary:// related links`)
            }
            for (const relatedId of related) {
                if (!knownIds.has(relatedId)) {
                    problems.push(`${name}: unknown glossary link ${relatedId}`)
                }
            }
        }

        expect(problems).toEqual([])
    })

    test("markdown entries avoid repeated boilerplate study sections", () => {
        const repeated: string[] = []
        const seen = new Map<string, string[]>()

        for (const name of readdirSync(GLOSSARY_ROOT).filter((entry) => entry.endsWith(".md"))) {
            const content = readFileSync(join(GLOSSARY_ROOT, name), "utf8")
            for (const section of parseGlossarySections(content)) {
                if (section.content.length < 90) continue

                const key = `${section.title}: ${section.content}`
                const files = seen.get(key) ?? []
                files.push(name)
                seen.set(key, files)
            }
        }

        for (const [key, files] of seen.entries()) {
            if (files.length > 3) {
                repeated.push(`${key.slice(0, 120)}... repeated in ${files.length} files`)
            }
        }

        expect(repeated).toEqual([])
    })

    test("importance list sorts highest scoring entries first", () => {
        expect(GLOSSARY_ENTRIES_BY_IMPORTANCE).toHaveLength(Object.keys(GLOSSARY_ENTRIES).length)
        expect(GLOSSARY_ENTRIES_BY_IMPORTANCE[0]).toMatchObject({
            id: "transformer",
            importance: 100,
        })

        for (let index = 1; index < GLOSSARY_ENTRIES_BY_IMPORTANCE.length; index += 1) {
            expect(GLOSSARY_ENTRIES_BY_IMPORTANCE[index - 1].importance).toBeGreaterThanOrEqual(
                GLOSSARY_ENTRIES_BY_IMPORTANCE[index].importance,
            )
        }
    })

    test("every entry meets flexible teaching depth bar", () => {
        const problems: string[] = []
        const mathSignal = /(\$\$|\$[^$\n]+\$|\\frac|\\mathrm|\\partial|## Formula)/
        const codeOrSizingSignal =
            /(```|O\(|bytes?|GB|MB|ms\b|tokens?\/s|batch size|sequence length|shape \[|dtype)/i

        for (const name of readdirSync(GLOSSARY_ROOT).filter((entry) => entry.endsWith(".md"))) {
            const id = name.replace(/\.md$/, "")
            const content = readFileSync(join(GLOSSARY_ROOT, name), "utf8")
            const body = bodyOf(content)
            const words = body.split(/\s+/).filter(Boolean).length

            if (words < 180) {
                problems.push(`${name}: body too short for teaching depth (${words} words)`)
            }

            const example =
                parseGlossarySections(content).find(
                    (section) => section.title === "Example" || section.title.startsWith("Example:"),
                )?.content ?? ""
            const exampleWords = example.trim().split(/\s+/).filter(Boolean).length
            if (example.trim().length < 80 || exampleWords < 12) {
                problems.push(`${name}: example too thin`)
            }

            if (MATH_DEPTH_IDS.has(id) && !mathSignal.test(content)) {
                problems.push(`${name}: math-depth term needs formula or LaTeX teaching`)
            }

            if (CODE_OR_SIZING_IDS.has(id) && !codeOrSizingSignal.test(content)) {
                problems.push(`${name}: systems/algorithm term needs code or concrete sizing math`)
            }
        }

        for (const mathId of MATH_DEPTH_IDS) {
            if (!existsSync(join(GLOSSARY_ROOT, `${mathId}.md`))) {
                problems.push(`MATH_DEPTH_IDS references missing glossary id: ${mathId}`)
            }
        }

        expect(problems).toEqual([])
    })

    test("stock decision/pitfall scaffolds are not mass-templated", () => {
        const hits: string[] = []
        const sharedOpeners =
            /Write the trigger metric, the owner, and the rollback|Avoid this failure mode:|Wrong move:|Common failure:|The failure usually looks fine in a demo path/
        for (const name of readdirSync(GLOSSARY_ROOT).filter((entry) => entry.endsWith(".md"))) {
            const content = readFileSync(join(GLOSSARY_ROOT, name), "utf8")
            if (sharedOpeners.test(content)) {
                hits.push(name)
            }
        }
        expect(hits).toEqual([])
    })

    test("glossary inventory stays fully generated and linked", () => {
        const markdownIds = readdirSync(GLOSSARY_ROOT)
            .filter((name) => name.endsWith(".md"))
            .map((name) => name.replace(/\.md$/, ""))
        expect(markdownIds.length).toBeGreaterThanOrEqual(370)
        expect(Object.keys(GLOSSARY_ENTRIES).length).toBe(markdownIds.length)

        const withRelated = markdownIds.filter((id) => {
            const entry = GLOSSARY_ENTRIES[id as keyof typeof GLOSSARY_ENTRIES] as {
                seeAlso?: string
                related?: { id: string; title: string }[]
            }
            return Boolean(entry.seeAlso || (entry.related && entry.related.length > 0))
        })
        expect(withRelated.length).toBe(markdownIds.length)
    })

    test("optional stock scaffolds are not required on every entry", () => {
        // Contract: flexible structure is allowed. At least some entries may omit Decision rule / Common mistake.
        // After the pedagogical rewrite, most entries should omit them unless they teach something specific.
        const names = readdirSync(GLOSSARY_ROOT).filter((entry) => entry.endsWith(".md"))
        let withoutDecision = 0
        let withoutMistake = 0
        for (const name of names) {
            const content = readFileSync(join(GLOSSARY_ROOT, name), "utf8")
            if (!content.includes("## Decision rule")) withoutDecision += 1
            if (!content.includes("## Common mistake")) withoutMistake += 1
        }
        // Once rewrites land, a material share of the glossary should be free of forced scaffolds.
        // Floor is low enough to pass mid-migration, high enough to prove flexibility is real.
        expect(withoutDecision).toBeGreaterThan(0)
        expect(withoutMistake).toBeGreaterThan(0)
    })

    test("retained glossary Mermaid diagrams ship pre-rendered PNGs", () => {
        const names = readdirSync(GLOSSARY_ROOT).filter((entry) => entry.endsWith(".md"))
        const withMermaid: string[] = []
        const missingPng: string[] = []

        for (const name of names) {
            const id = name.replace(/\.md$/, "")
            const content = readFileSync(join(GLOSSARY_ROOT, name), "utf8")
            const diagrams = [...content.matchAll(/```mermaid[^\n]*\n([\s\S]*?)\n```/g)]
            if (diagrams.length === 0) continue
            withMermaid.push(id)
            diagrams.forEach((_, index) => {
                const darkPng = join(GLOSSARY_ROOT, id, "diagrams", "_generated", `${id}_diagram_${index}_dark.png`)
                const lightPng = join(GLOSSARY_ROOT, id, "diagrams", "_generated", `${id}_diagram_${index}_light.png`)
                if (!existsSync(darkPng) || !existsSync(lightPng)) {
                    missingPng.push(`${id}:${index}`)
                }
            })
        }

        // Text-only entries are valid when an image would repeat a complete prose/table example.
        expect(withMermaid.length).toBeGreaterThan(0)
        expect(missingPng).toEqual([])

        // Generated module should resolve at least one diagram to CDN figure HTML (not leave mermaid as code field).
        const sample = GLOSSARY_ENTRIES["softmax"] as { details?: { content: string }[]; code?: { language: string } }
        const detailBlob = (sample.details ?? []).map((d) => d.content).join("\n")
        expect(detailBlob).toMatch(/data-diagram-alt|content-image\/glossary\/softmax/)
        expect(sample.code?.language).not.toBe("mermaid")
    })
})
