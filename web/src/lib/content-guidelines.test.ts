import { existsSync, readdirSync, readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, test } from "vitest"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import katex from "katex"
import { loadContentBundle } from "./content-bundle"
import { extractMasteryQuiz, MIN_MASTERY_QUIZ_QUESTIONS } from "./mastery-quiz"

type Bundle = {
    id: string
    section: string
    content: string
    metadata: {
        section?: string
        title?: string
        slug?: string
        status?: string
        prerequisites?: string[]
        relatedQuestions?: string[]
        keyConceptsTested?: string[]
        difficulty?: string
        hidden?: boolean
    } & Record<string, unknown>
}

function countBundlesInFolder(folderName: string) {
    const folder = join(contentRoot, folderName)
    return readdirSync(folder, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .filter((entry) => loadContentBundle(join(folder, entry.name)) !== null)
        .length
}

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "../..")
const repoRoot = join(webRoot, "..")
const contentRoot = join(webRoot, "src/content")
const maxDisplayMathLineLength = 400
const learnSections = new Set([
    "agents",
    "foundations",
    "fundamentals",
    "interviewing",
    "llmops",
    "preparation",
    "projects",
    "retrieval",
    "system-design",
    "training",
])
function stripFencedCode(markdown: string) {
    return markdown.replace(/```[\s\S]*?```/g, "")
}

type MathNode = {
    type: string
    value?: string
    lang?: string
    position?: { start: { line: number; offset?: number }; end: { offset?: number } }
    children?: MathNode[]
}

const katexValidationCache = new Map<string, string | null>()

function validateKatexExpression(value: string, displayMode: boolean): string | null {
    const cacheKey = `${displayMode ? "1" : "0"}:${value}`
    const cached = katexValidationCache.get(cacheKey)
    if (cached !== undefined) return cached
    try {
        katex.renderToString(value, {
            displayMode,
            throwOnError: true,
            strict: "error",
            trust: false,
        })
        katexValidationCache.set(cacheKey, null)
        return null
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        katexValidationCache.set(cacheKey, message)
        return message
    }
}

function mathRenderingIssues(markdown: string, id: string): string[] {
    if (
        !markdown.includes("$")
        && !markdown.includes("checkpoint")
        && !markdown.includes("mastery-quiz")
        && !markdown.includes("<figcaption")
    ) {
        return []
    }
    const issues: string[] = []
    ReactMarkdown({
        children: markdown,
        remarkPlugins: [remarkGfm, remarkMath, () => (tree: MathNode) => {
            function visit(node: MathNode) {
                const location = `${id}:${node.position?.start.line ?? 1}`
                if (node.type === "code") {
                    if (node.lang === "checkpoint") {
                        const [question = "", answer = ""] = (node.value ?? "").split(/^---+$/m)
                        issues.push(...mathRenderingIssues(question, `${location} checkpoint question`))
                        issues.push(...mathRenderingIssues(answer, `${location} checkpoint answer`))
                    } else if (node.lang === "mastery-quiz") {
                        const questions = JSON.parse(node.value ?? "[]") as Array<{
                            question: string; options: string[]; explanation: string
                        }>
                        for (const [index, question] of questions.entries()) {
                            for (const text of [question.question, ...question.options, question.explanation]) {
                                issues.push(...mathRenderingIssues(text, `${location} quiz ${index + 1}`))
                            }
                        }
                    }
                    return
                }
                if (node.type === "math" || node.type === "inlineMath") {
                    const source = markdown.slice(node.position?.start.offset, node.position?.end.offset)
                    if (node.type === "inlineMath" && source.startsWith("$$")) {
                        issues.push(`${location}: double-dollar expression parsed as inline math`)
                    }
                    const errorMessage = validateKatexExpression(node.value ?? "", node.type === "math")
                    if (errorMessage !== null) {
                        issues.push(`${location}: ${errorMessage}`)
                    }
                    return
                }
                if (node.type === "html" && node.value?.includes("<figcaption")) {
                    const fragment = document.createElement("template")
                    fragment.innerHTML = node.value
                    for (const caption of fragment.content.querySelectorAll("figcaption")) {
                        for (const text of caption.childNodes) {
                            if (text.nodeType === Node.TEXT_NODE) {
                                issues.push(...mathRenderingIssues(text.textContent ?? "", `${location} caption`))
                            }
                        }
                    }
                }
                node.children?.forEach(visit)
            }
            visit(tree)
        }],
    })
    return issues
}

function stripFencedCodePreserveLines(markdown: string) {
    return markdown.replace(/```[\s\S]*?```/g, (match) => "\n".repeat(match.split("\n").length - 1))
}

function stripNonRenderedFencesPreserveLines(markdown: string) {
    return markdown.replace(/^```([^\n]*)\n[\s\S]*?^```/gm, (match, rawLanguage) => {
        const language = rawLanguage.trim().split(/\s+/)[0]
        if (language === "checkpoint") {
            return match
        }
        return "\n".repeat(match.split("\n").length - 1)
    })
}

function stripInlineCode(markdown: string) {
    return markdown.replace(/`[^`\n]*`/g, "")
}

function stripRawHtmlBlocksPreserveLines(markdown: string) {
    return markdown.replace(/<figure>[\s\S]*?<\/figure>/g, (match) => "\n".repeat(match.split("\n").length - 1))
}

function hasMarkdownTable(markdown: string) {
    return /^\|[^\n]+\|\n\|[-: |]+\|/m.test(stripFencedCode(markdown))
}

function hasMermaidDiagram(markdown: string) {
    return /```mermaid/.test(markdown)
}

function isVisibleLearnBundle(bundle: Bundle) {
    return bundle.section !== "blog" && bundle.metadata.status !== "hidden" && bundle.metadata.hidden !== true
}

function isPublishedContentBundle(bundle: Bundle) {
    return bundle.metadata.draft !== true && bundle.metadata.hidden !== true && bundle.metadata.status !== "hidden"
}

function isLearnBundle(bundle: Bundle) {
    return learnSections.has(bundle.section)
}

function findUnescapedCurrency(markdown: string, bundleId: string) {
    const issues: string[] = []
    const lines = stripInlineCode(
        stripRawHtmlBlocksPreserveLines(stripFencedCodePreserveLines(markdown))
    ).split("\n")

    lines.forEach((line, index) => {
        for (let position = 0; position < line.length; position += 1) {
            if (line[position] !== "$" || line[position - 1] === "\\" || !/\d/.test(line[position + 1] ?? "")) {
                continue
            }

            const numericToken = line.slice(position + 1).match(/^[0-9][0-9.,]*(?:[kKmMbB])?/)?.[0]
            if (!numericToken) {
                continue
            }

            const directClose = line[position + 1 + numericToken.length] === "$"
            if (directClose) {
                continue
            }

            const nextDollar = line.indexOf("$", position + 1)
            const inlineMathBody = nextDollar === -1 ? "" : line.slice(position + 1, nextDollar)
            const looksLikeMath = nextDollar !== -1 && /[\\/_^{}=()+*<>A-Za-z-]/.test(inlineMathBody)
            if (looksLikeMath) {
                continue
            }

            issues.push(`${bundleId}: unescaped currency on line ${index + 1}`)
            break
        }
    })

    return issues
}

function findLiteralEscapedCurrency(markdown: string, bundleId: string) {
    const issues: string[] = []
    const renderedMarkdown = stripNonRenderedFencesPreserveLines(markdown)

    for (const match of renderedMarkdown.matchAll(/`[^`\n]+`/g)) {
        if (!match[0].includes("\\$")) {
            continue
        }
        const line = renderedMarkdown.slice(0, match.index).split("\n").length
        issues.push(`${bundleId}: escaped currency inside inline code on line ${line}`)
    }

    for (const match of renderedMarkdown.matchAll(/<([a-z][a-z0-9-]*)\b[^>]*>[\s\S]*?<\/\1>/gi)) {
        const literalHtml = match[0].replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/gi, "")
        if (!literalHtml.includes("\\$")) {
            continue
        }
        const line = renderedMarkdown.slice(0, match.index).split("\n").length
        issues.push(`${bundleId}: escaped currency inside raw HTML on line ${line}`)
    }

    return issues
}

function removeInlineMath(line: string) {
    return stripInlineCode(line)
        .replace(/\$\$.*?\$\$/g, "")
        .replace(/(?<!\\)\$[^$\n]+(?<!\\)\$/g, "")
}

function findUnsupportedLatexDelimiters(markdown: string, bundleId: string) {
    const issues: string[] = []
    const lines = stripFencedCodePreserveLines(markdown).split("\n")

    lines.forEach((line, index) => {
        if (/\\[()[\]]/.test(stripInlineCode(line))) {
            issues.push(`${bundleId}: unsupported LaTeX delimiter on line ${index + 1}`)
        }
    })

    return issues
}

function findRawLatexCommandsOutsideMath(markdown: string, bundleId: string) {
    const issues: string[] = []
    const lines = stripFencedCodePreserveLines(markdown).split("\n")
    let inDisplayMath = false
    const latexCommandRe =
        /\\(?:alpha|beta|gamma|delta|Delta|epsilon|varepsilon|theta|lambda|mu|pi|sigma|Sigma|Omega|kappa|tau|phi|rho|sqrt|frac|sum|prod|begin|end|boxed|text|mathbb|mathbf|operatorname|hat|tilde|bar|cdot|times|left|right|leq?|geq?|neq|approx|infty|partial|nabla|odot|top|mid|parallel|lVert|rVert|Vert|cos|sin|tanh|log|exp|min|max|argmax|argmin)\b/

    lines.forEach((line, index) => {
        const trimmed = line.trim()

        if (trimmed === "$$") {
            inDisplayMath = !inDisplayMath
            return
        }

        if (inDisplayMath || (trimmed.startsWith("$$") && trimmed.endsWith("$$"))) {
            return
        }

        const proseOnly = removeInlineMath(line)
        if (latexCommandRe.test(proseOnly)) {
            issues.push(`${bundleId}: raw LaTeX command outside math on line ${index + 1}`)
        }
    })

    return issues
}

function findLongSingleLineDisplayMath(markdown: string, bundleId: string) {
    const issues: string[] = []
    const lines = stripFencedCodePreserveLines(markdown).split("\n")
    let inDisplayMath = false

    lines.forEach((line, index) => {
        const trimmed = line.trim()
        if (
            trimmed.startsWith("$$")
            && trimmed.endsWith("$$")
            && trimmed !== "$$"
            && trimmed.length > maxDisplayMathLineLength
        ) {
            issues.push(`${bundleId}: long one-line display math on line ${index + 1}`)
        }

        if (trimmed === "$$") {
            inDisplayMath = !inDisplayMath
            return
        }

        if (inDisplayMath && trimmed.length > maxDisplayMathLineLength) {
            issues.push(`${bundleId}: long display math line ${index + 1}`)
        }
    })

    return issues
}

function findDoubleEscapedLatexCommands(markdown: string, bundleId: string) {
    const issues: string[] = []
    const lines = stripFencedCodePreserveLines(markdown).split("\n")
    const doubleEscapedLatexCommandRe =
        /\\\\(?:alpha|beta|gamma|delta|Delta|epsilon|varepsilon|theta|lambda|mu|pi|sigma|Sigma|Omega|kappa|tau|phi|rho|sqrt|frac|sum|prod|begin|end|boxed|text|mathbb|mathbf|operatorname|hat|tilde|bar|cdot|times|left|right|leq?|geq?|neq|approx|infty|partial|nabla|odot|top|mid|parallel|lVert|rVert|Vert|cos|sin|tanh|log|exp|min|max|argmax|argmin)\b/

    lines.forEach((line, index) => {
        if (doubleEscapedLatexCommandRe.test(stripInlineCode(line))) {
            issues.push(`${bundleId}: double-escaped LaTeX command on line ${index + 1}`)
        }
    })

    return issues
}

function extractPythonStringList(source: string, constantName: string) {
    const match = source.match(new RegExp(`${constantName}\\s*=\\s*\\[([\\s\\S]*?)\\]`))
    if (!match) return []

    return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])
}

function loadBundles(): Bundle[] {
    return readdirSync(contentRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .filter((entry) => entry.name !== "practice" && entry.name !== "glossary")
        .flatMap((sectionEntry) => {
            const sectionDir = join(contentRoot, sectionEntry.name)

            return readdirSync(sectionDir, { withFileTypes: true })
                .filter((entry) => entry.isDirectory())
                .map((articleEntry) => {
                    const dir = join(sectionDir, articleEntry.name)
                    const contentPath = join(dir, "content.md")
                    const bundle = loadContentBundle(dir)

                    if (!existsSync(contentPath) || !bundle) {
                        return null
                    }

                    return {
                        id: articleEntry.name,
                        section: sectionEntry.name,
                        content: bundle.body,
                        metadata: bundle.metadata,
                    }
                })
                .filter((bundle): bundle is Bundle => bundle !== null)
        })
}

// Check packaging and rendering contracts here. Accuracy, teaching order,
// examples, and editorial voice require a manual review of the full bundle.
describe("content packaging and rendering regressions", () => {
    const bundles = loadBundles()
    const bundleById = new Map(bundles.map((bundle) => [bundle.id, bundle]))

    test("visible curriculum keeps the canonical 102-lesson path", () => {
        const visibleLearnCount = bundles.filter(isVisibleLearnBundle).length

        expect(visibleLearnCount).toBe(102)
    })

    test("learn articles end with valid mastery quizzes", () => {
        const issues = bundles
            .filter(isLearnBundle)
            .flatMap((bundle) => {
                try {
                    const { questions } = extractMasteryQuiz(bundle.content)
                    if (!questions) {
                        return [`${bundle.id}: missing mastery quiz`]
                    }
                    if (questions.length < MIN_MASTERY_QUIZ_QUESTIONS) {
                        return [`${bundle.id}: only ${questions.length} mastery questions`]
                    }
                    return []
                } catch (error) {
                    return [`${bundle.id}: ${error}`]
                }
            })

        expect(issues).toEqual([])
    })

    test("learn articles do not repeat the page title as a Markdown H1", () => {
        const issues = bundles
            .filter(isLearnBundle)
            .filter((bundle) => {
                const firstH1 = bundle.content.match(/^#\s+(.+?)\s*$/m)?.[1]
                return firstH1?.trim().toLowerCase() === bundle.metadata.title?.trim().toLowerCase()
            })
            .map((bundle) => `${bundle.id}: repeats page title as Markdown H1`)

        expect(issues).toEqual([])
    })

    test("does not persist fields derived by content loaders", () => {
        const derivedFields = ["timeEstimate", "references"]
        const issues = bundles.flatMap((bundle) =>
            derivedFields
                .filter((field) => field in bundle.metadata)
                .map((field) => `${bundle.id}: ${field}`)
        )

        expect(issues).toEqual([])
    })

    test("core curriculum chapters remain available", () => {
        const requiredArticleIds = [
            "numpy-and-tensor-shapes",
            "softmax-cross-entropy-optimization",
            "scaled-dot-product-attention",
            "multi-query-grouped-query-attention",
            "pytorch-training-loops",
            "distributed-training-fsdp-deepspeed-zero",
            "llm-deployment-gpu-serving-autoscaling",
            "agent-evaluation-benchmarks",
        ]

        const issues: string[] = []

        // Chapter coverage is a curriculum contract; exact prose and notation are not.
        for (const id of requiredArticleIds) {
            if (!bundleById.has(id)) {
                issues.push(`${id}: missing article`)
            }
        }

        expect(issues).toEqual([])
    })

    test("page-owned content bodies omit top-level headings", () => {
        const issues = bundles.flatMap((bundle) =>
            stripFencedCodePreserveLines(bundle.content)
                .split("\n")
                .flatMap((line, index) =>
                    /^#\s+\S/.test(line)
                        ? [`${bundle.id}: content body H1 on line ${index + 1}`]
                        : []
                )
        )

        expect(issues).toEqual([])
    })

    test("metadata learning links point to published content", () => {
        const slugs = new Set(bundles.map((bundle) => bundle.metadata.slug ?? bundle.id))
        const publishedLearnSlugs = new Set(
            bundles
                .filter((bundle) => bundle.section !== "blog" && isPublishedContentBundle(bundle))
                .map((bundle) => bundle.metadata.slug ?? bundle.id)
        )
        const issues = bundles.flatMap((bundle) => {
            return ["prerequisites", "relatedQuestions"].flatMap((field) => {
                const values = bundle.metadata[field as "prerequisites" | "relatedQuestions"] ?? []

                return values
                    .filter((slug) => !slugs.has(slug))
                    .map((slug) => `${bundle.id}: ${field} -> ${slug}`)
            })
        })
        const publicSurfaceIssues = bundles
            .filter((bundle) => bundle.section !== "blog" && isPublishedContentBundle(bundle))
            .flatMap((bundle) => {
                return ["prerequisites", "relatedQuestions"].flatMap((field) => {
                    const values = bundle.metadata[field as "prerequisites" | "relatedQuestions"] ?? []

                    return values
                        .filter((slug) => !publishedLearnSlugs.has(slug))
                        .map((slug) => `${bundle.id}: ${field} points outside published learn path -> ${slug}`)
                })
            })

        expect([...issues, ...publicSurfaceIssues]).toEqual([])
    })

    test("live content smoke defaults point to published slugs", () => {
        const script = readFileSync(join(repoRoot, "scripts/validate-live-content-routes.py"), "utf8")
        const learnSlugs = extractPythonStringList(script, "DEFAULT_LEARN_SLUGS")
        const blogSlugs = extractPythonStringList(script, "DEFAULT_BLOG_SLUGS")
        const publishedLearnSlugs = new Set(
            bundles
                .filter((bundle) => bundle.section !== "blog" && isPublishedContentBundle(bundle))
                .map((bundle) => bundle.metadata.slug ?? bundle.id)
        )
        const publishedBlogSlugs = new Set(
            bundles
                .filter((bundle) => bundle.section === "blog" && isPublishedContentBundle(bundle))
                .map((bundle) => bundle.metadata.slug ?? bundle.id)
        )
        const issues = [
            ...learnSlugs
                .filter((slug) => !publishedLearnSlugs.has(slug))
                .map((slug) => `learn smoke slug not published: ${slug}`),
            ...blogSlugs
                .filter((slug) => !publishedBlogSlugs.has(slug))
                .map((slug) => `blog smoke slug not published: ${slug}`),
        ]

        expect(issues).toEqual([])
    })

    test("markdown code fence openings use language tags", () => {
        const issues = bundles.flatMap((bundle) => {
            const bundleIssues: string[] = []
            let activeFenceLength = 0
            let fenceIndex = 0

            for (const line of bundle.content.split("\n")) {
                const fence = line.match(/^(`{3,})(.*)$/)
                if (!fence) continue

                if (!activeFenceLength) {
                    fenceIndex += 1
                    if (!fence[2].trim()) {
                        bundleIssues.push(`${bundle.id}: fence ${fenceIndex} missing language`)
                    }
                    activeFenceLength = fence[1].length
                } else if (fence[1].length >= activeFenceLength) {
                    activeFenceLength = 0
                }
            }

            if (activeFenceLength) {
                bundleIssues.push(`${bundle.id}: unclosed code fence`)
            }

            return bundleIssues
        })

        expect(issues).toEqual([])
    })

    test("longer code-like fences include descriptive title metadata", () => {
        const shortCodeFenceMaxLines = 8
        const codeLikeLanguages = new Set([
            "bash",
            "diff",
            "dockerfile",
            "gitignore",
            "jinja2",
            "json",
            "jsonl",
            "lua",
            "markdown",
            "powershell",
            "py",
            "python",
            "sh",
            "sql",
            "ts",
            "typescript",
            "xml",
            "yaml",
            "yml",
        ])

        const issues = bundles.flatMap((bundle) => {
            const bundleIssues: string[] = []
            const lines = bundle.content.split("\n")
            let activeFenceLength = 0
            let activeLanguage = ""
            let activeInfo = ""
            let activeStartLine = 0
            let activeBodyLines = 0

            lines.forEach((line, index) => {
                const fence = line.match(/^(?:[ \t]{0,3}>\s?)?[ \t]{0,3}(`{3,})([^`\n]*)$/)
                if (!fence) {
                    if (activeFenceLength > 0) {
                        activeBodyLines += 1
                    }
                    return
                }

                if (!activeFenceLength) {
                    activeFenceLength = fence[1].length
                    activeInfo = fence[2].trim()
                    activeLanguage = activeInfo.split(/\s+/)[0]?.toLowerCase() ?? ""
                    activeStartLine = index + 1
                    activeBodyLines = 0
                } else if (fence[1].length >= activeFenceLength && !fence[2].trim()) {
                    if (
                        activeLanguage
                        && codeLikeLanguages.has(activeLanguage)
                        && activeBodyLines > shortCodeFenceMaxLines
                        && !/\b(title|filename)=/.test(activeInfo)
                        && !/\b(output|bare)\b/.test(activeInfo)
                    ) {
                        bundleIssues.push(
                            `${bundle.id}: ${activeLanguage} fence on line ${activeStartLine} (${activeBodyLines} lines) has no title metadata`,
                        )
                    }
                    activeFenceLength = 0
                } else {
                    activeBodyLines += 1
                }
            })

            return bundleIssues
        })

        expect(issues).toEqual([])
    })

    test("foundation and preparation generated figures have nonempty captions", () => {
        const figureRe = /<figure>[\s\S]*?<\/figure>/gi
        const imgRe = /<img\s+[^>]*src="illustrations\/_generated\/([^"]+\.png)"[^>]*>/gi
        const captionRe = /<figcaption>([\s\S]*?)<\/figcaption>/i
        const issues = bundles
            .filter((bundle) => bundle.section === "foundations" || bundle.section === "preparation")
            .flatMap((bundle) => {
                const articleIssues: string[] = []
                const figures = [...bundle.content.matchAll(figureRe)]

                for (const imgMatch of bundle.content.matchAll(imgRe)) {
                    const figure = figures.find((candidate) => {
                        return candidate.index !== undefined
                            && imgMatch.index !== undefined
                            && candidate.index <= imgMatch.index
                            && imgMatch.index < candidate.index + candidate[0].length
                    })

                    if (!figure) {
                        articleIssues.push(`${bundle.id}: ${imgMatch[1]} is not wrapped in figure`)
                        continue
                    }

                    const caption = figure[0].match(captionRe)?.[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
                    if (!caption) {
                        articleIssues.push(`${bundle.id}: ${imgMatch[1]} lacks a nonempty caption`)
                    }
                }

                return articleIssues
            })

        expect(issues).toEqual([])
    })

    const mathSections = [...new Set([...bundles.map((bundle) => bundle.section), "glossary"])].sort()
    test.each(mathSections)("%s math parses and renders with KaTeX, including checkpoints and quizzes", (section) => {
        const sources = section === "glossary"
            ? readdirSync(join(contentRoot, "glossary"))
                .filter((file) => file.endsWith(".md"))
                .map((file) => ({
                    id: `glossary/${file}`,
                    content: readFileSync(join(contentRoot, "glossary", file), "utf8")
                        .replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, ""),
                }))
            : bundles.filter((bundle) => bundle.section === section)
        const issues = sources.flatMap((bundle) => mathRenderingIssues(bundle.content, bundle.id))

        expect(issues).toEqual([])
    }, 45_000)

    test("display math stays mobile-readable", () => {
        const issues = bundles.flatMap((bundle) => findLongSingleLineDisplayMath(bundle.content, bundle.id))

        expect(issues).toEqual([])
    })

    test("LaTeX uses Markdown math delimiters that render with KaTeX", () => {
        const issues = bundles.flatMap((bundle) => [
            ...findUnsupportedLatexDelimiters(bundle.content, bundle.id),
            ...findRawLatexCommandsOutsideMath(bundle.content, bundle.id),
            ...findDoubleEscapedLatexCommands(bundle.content, bundle.id),
        ])

        expect(issues).toEqual([])
    })

    test("currency values in prose are escaped for MDX", () => {
        const issues = bundles.flatMap((bundle) => findUnescapedCurrency(bundle.content, bundle.id))

        expect(issues).toEqual([])
    })

    test("currency escapes are not used in literal render contexts", () => {
        const issues = bundles.flatMap((bundle) => findLiteralEscapedCurrency(bundle.content, bundle.id))

        expect(issues).toEqual([])
    })

    test("README content inventory matches the bundles", () => {
        const issues: string[] = []
        const readme = readFileSync(join(repoRoot, "README.md"), "utf8")

        if (!readme.includes(`preparation/      # Free 0-to-1 prerequisite on-ramp (${countBundlesInFolder("preparation")})`)) {
            issues.push("README: stale preparation folder count")
        }
        if (!readme.includes(`fundamentals/     # Transformer and inference fundamentals (${countBundlesInFolder("fundamentals")})`)) {
            issues.push("README: stale fundamentals folder count")
        }
        if (!readme.includes(`agents/           # Agent systems and orchestration (${countBundlesInFolder("agents")})`)) {
            issues.push("README: stale agents folder count")
        }

        expect(issues).toEqual([])
    })

    test("learn articles include citations and visual support", () => {
        const issues = bundles
            .filter((bundle) => bundle.section !== "blog")
            .flatMap((bundle) => {
                const articleIssues: string[] = []
                const citationCount = bundle.content.match(/\[\^[A-Za-z0-9_]+\]/g)?.length ?? 0
                const hasVisualExplanation =
                    bundle.content.includes("illustrations/_generated/")
                    || hasMarkdownTable(bundle.content)
                    || hasMermaidDiagram(bundle.content)

                if (citationCount < 1) {
                    articleIssues.push(`${bundle.id}: no inline citations`)
                }
                if (!hasVisualExplanation) {
                    articleIssues.push(`${bundle.id}: no visual explanation`)
                }

                return articleIssues
            })

        expect(issues).toEqual([])
    })

    test("article image embeds use rendered assets, not illustration source files", () => {
        const issues = bundles
            .filter((bundle) => /!\[[^\]]*\]\([^)]*\.tsx\)|<img\b[^>]*src=["'][^"']*\.tsx["']/i.test(stripFencedCode(bundle.content)))
            .map((bundle) => `${bundle.id}: image embeds a TSX source instead of a rendered image`)

        expect(issues).toEqual([])
    })

    test("learn article visuals include explanatory captions", () => {
        const issues = bundles
            .filter((bundle) => bundle.section !== "blog")
            .flatMap((bundle) => {
                const articleIssues: string[] = []
                const generatedImageCount = bundle.content.match(/(?:<img[^>]+|!\[[^\]]*\]\()illustrations\/_generated\//g)?.length ?? 0
                const figureCaptionCount = bundle.content.match(/<figcaption>[\s\S]*?<\/figcaption>/g)?.length ?? 0

                if (generatedImageCount > figureCaptionCount) {
                    articleIssues.push(
                        `${bundle.id}: generated visuals need explanatory figcaptions (${generatedImageCount} images, ${figureCaptionCount} captions)`,
                    )
                }

                return articleIssues
            })

        expect(issues).toEqual([])
    })

    test("inventory covers all learn + blog content.md bodies (excludes glossary/practice)", () => {
        // Curriculum review scope: every published body under content/ except glossary and practice.
        expect(bundles.length).toBe(125)
        expect(bundles.filter((b) => b.section === "blog").length).toBe(23)
        expect(bundles.filter(isLearnBundle).length).toBe(102)
    })
})
