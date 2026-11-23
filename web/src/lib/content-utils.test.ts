import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, test } from "vitest"
import {
    contentImageUrl,
    estimateReadingTime,
    extractCitationKeys,
    formatReadingTime,
    pngDisplaySize,
    pngNaturalSize,
    resolveAssetLinks,
    resolveDiagrams,
    resolveGlossaryEntryMedia,
    resolveIllustrations,
    resolveReferences,
    summarizeMermaidDiagram,
} from "./content-utils"

function pngHeader(width: number, height: number): Buffer {
    const buffer = Buffer.alloc(24)
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(buffer)
    buffer.write("IHDR", 12, "ascii")
    buffer.writeUInt32BE(width, 16)
    buffer.writeUInt32BE(height, 20)
    return buffer
}

describe("contentImageUrl", () => {
    test("uses content hash instead of file timestamp for cache versioning", () => {
        const contentDir = mkdtempSync(join(tmpdir(), "leetllm-content-image-"))
        const imagePath = join(contentDir, "image.png")
        try {
            writeFileSync(imagePath, "stable image bytes")
            const initialURL = contentImageUrl(imagePath)

            utimesSync(imagePath, new Date(0), new Date(0))
            expect(contentImageUrl(imagePath)).toBe(initialURL)

            writeFileSync(imagePath, "changed image bytes")
            expect(contentImageUrl(imagePath)).not.toBe(initialURL)
        } finally {
            rmSync(contentDir, { recursive: true, force: true })
        }
    })
})

describe("audience-filtered diagrams", () => {
    test("keeps full-source asset ordinals when an earlier diagram is omitted", () => {
        const articleDir = mkdtempSync(join(tmpdir(), "leetllm-audience-diagram-"))
        const generatedDir = join(articleDir, "diagrams", "_generated")
        mkdirSync(generatedDir, { recursive: true })
        const first = '```mermaid\ngraph LR\n  A[Website] --> B[Browser]\n```'
        const second = '```mermaid\ngraph LR\n  A[Book] --> B[Reader]\n```'
        try {
            writeFileSync(join(generatedDir, "content_diagram_0_light.png"), pngHeader(100, 100))
            writeFileSync(join(generatedDir, "content_diagram_1_light.png"), pngHeader(800, 400))
            const result = resolveDiagrams(second, articleDir, "content.md", `${first}\n\n${second}`)
            expect(result).toContain("content_diagram_1_light.png")
            expect(result).not.toContain("content_diagram_0_light.png")
            expect(result).toContain('width="400" height="200"')
            expect(() => resolveDiagrams(second, articleDir, "content.md", first)).toThrow(/does not match its full source/)
        } finally {
            rmSync(articleDir, { recursive: true, force: true })
        }
    })
})

describe("summarizeMermaidDiagram", () => {
    test("uses and normalizes a single-line authored accessibility description", () => {
        const mermaid = `flowchart TB
    accDescr: Run &quot;003&quot; and inspect<br/>the release review.
    A["Incident"] --> B["Decision"]`

        expect(summarizeMermaidDiagram(mermaid)).toBe("Run \"003\" and inspect the release review.")
    })

    test("uses and normalizes a multiline authored accessibility description", () => {
        const mermaid = `flowchart TB
    accDescr {
        Compare every prediction with its supplied route.
        A zero-error run earns a fresh independent review.
    }
    A["Incident"] --> B["Decision"]`

        expect(summarizeMermaidDiagram(mermaid)).toBe(
            "Compare every prediction with its supplied route. A zero-error run earns a fresh independent review.",
        )
    })

    test("falls back to the generated label summary when the authored description is empty", () => {
        const mermaid = `flowchart TB
    accDescr:
    A["Input"] --> B["Release gate"]`

        expect(summarizeMermaidDiagram(mermaid)).toBe("Diagram showing Input and Release gate.")
    })

    test("includes the release gate in a five-stage linear evaluation flow", () => {
        const mermaid = `flowchart TB
    C["1. Private cases<br/>question + expected facts"]:::primary --> R["2. Retrieve evidence<br/>policy chunks"]:::secondary
    R --> A["3. Generate answer<br/>with source ID"]:::secondary
    A --> S["4. Score behavior<br/>facts + risk + format"]:::warning
    S --> G{"5. Release gate<br/>ship, route, reject"}:::success`

        expect(summarizeMermaidDiagram(mermaid)).toBe(
            "Diagram showing 1. Private cases question + expected facts, 2. Retrieve evidence policy chunks, 3. Generate answer with source ID, 4. Score behavior facts + risk + format, and 5. Release gate ship, route, reject.",
        )
    })

    test("keeps branched diagrams concise instead of listing every node", () => {
        const mermaid = `flowchart TB
    A["Input"] --> B["Normalize"]
    B --> C["Model"]
    C --> D["Score"]
    C --> E["Review"]
    D --> F["Gate"]
    E --> F`

        expect(summarizeMermaidDiagram(mermaid)).toBe("Diagram showing Input, Normalize, Model, and Score.")
    })
})

describe("resolveIllustrations", () => {
    test("reads actual attributes rather than attribute-like examples inside quoted values", () => {
        const articleDir = mkdtempSync(join(tmpdir(), "leetllm-alt-quoted-attributes-"))
        const generatedDir = join(articleDir, "illustrations", "_generated")
        mkdirSync(generatedDir, { recursive: true })
        writeFileSync(join(generatedDir, "subwords_dark.png"), pngHeader(800, 400))
        writeFileSync(join(generatedDir, "subwords_light.png"), pngHeader(800, 400))

        try {
            const external = `<img alt='Example src="illustrations/_generated/subwords_dark.png"' src="/external.png">`
            expect(resolveIllustrations(external, articleDir)).toBe(external)

            const local = `<img title='Example alt="wrong"' alt="Correct alt" src='illustrations/_generated/subwords_dark.png'>`
            const rendered = document.createElement("div")
            rendered.innerHTML = resolveIllustrations(local, articleDir)
            expect(rendered.querySelector("img")?.getAttribute("alt")).toBe("Correct alt")
            expect(rendered.querySelector("img")?.getAttribute("data-themed-image")).toBe("true")
        } finally {
            rmSync(articleDir, { recursive: true, force: true })
        }
    })

    test("keeps a complete HTML image tag when manifest alt contains raw angle brackets", () => {
        const articleDir = mkdtempSync(join(tmpdir(), "leetllm-alt-manifest-"))
        const generatedDir = join(articleDir, "illustrations", "_generated")
        mkdirSync(generatedDir, { recursive: true })
        const manifestAlt = `Known <pl> and ed> pieces & \"quotes\"`
        writeFileSync(join(generatedDir, "alt.json"), JSON.stringify({ subwords: manifestAlt }))
        writeFileSync(join(generatedDir, "subwords_dark.png"), pngHeader(800, 400))
        writeFileSync(join(generatedDir, "subwords_light.png"), pngHeader(800, 400))

        try {
            const source = '<figure><img src="illustrations/_generated/subwords_dark.png" alt="Fallback <pl> marker" /><figcaption>Visible caption.</figcaption></figure>'
            const resolved = resolveIllustrations(source, articleDir)
            const rendered = document.createElement("div")
            rendered.innerHTML = resolved

            expect(rendered.querySelector("img")?.getAttribute("alt")).toBe(manifestAlt)
            expect(rendered.querySelector("figcaption")?.textContent).toBe("Visible caption.")
            expect(rendered.textContent).toBe("Visible caption.")
        } finally {
            rmSync(articleDir, { recursive: true, force: true })
        }
    })

    test("preserves decoded entities in an already-encoded HTML alt fallback", () => {
        const articleDir = mkdtempSync(join(tmpdir(), "leetllm-alt-fallback-"))
        const generatedDir = join(articleDir, "illustrations", "_generated")
        mkdirSync(generatedDir, { recursive: true })
        writeFileSync(join(generatedDir, "subwords_dark.png"), pngHeader(800, 400))
        writeFileSync(join(generatedDir, "subwords_light.png"), pngHeader(800, 400))

        try {
            const source = '<figure><img alt="A &amp; B &quot;charge&quot; &lt;token&gt; &#39;single&#39;" src="illustrations/_generated/subwords_dark.png" /><figcaption>Caption.</figcaption></figure>'
            const resolved = resolveIllustrations(source, articleDir)
            const rendered = document.createElement("div")
            rendered.innerHTML = resolved

            expect(rendered.querySelector("img")?.getAttribute("alt")).toBe('A & B "charge" <token> \'single\'')
            expect(rendered.textContent).toBe("Caption.")
        } finally {
            rmSync(articleDir, { recursive: true, force: true })
        }
    })

    test("preserves full HTML character-reference semantics in fallback alt text", () => {
        const articleDir = mkdtempSync(join(tmpdir(), "leetllm-alt-character-references-"))
        const generatedDir = join(articleDir, "illustrations", "_generated")
        mkdirSync(generatedDir, { recursive: true })
        writeFileSync(join(generatedDir, "subwords_dark.png"), pngHeader(800, 400))

        try {
            const source = '<img src="illustrations/_generated/subwords_dark.png" alt="Copyright &copy; &rarr; &#x1F600; &notit=1 &amp;copy;">'
            const original = document.createElement("div")
            original.innerHTML = source
            const rendered = document.createElement("div")
            rendered.innerHTML = resolveIllustrations(source, articleDir)

            expect(rendered.querySelector("img")?.getAttribute("alt")).toBe(original.querySelector("img")?.getAttribute("alt"))
            expect(rendered.querySelector("img")?.getAttribute("alt")).toBe("Copyright © → 😀 &notit=1 &copy;")
        } finally {
            rmSync(articleDir, { recursive: true, force: true })
        }
    })

    test.each(["timeline", "scene-stepper", "film"] as const)("round-trips ampersands and quotes in %s alt metadata", (kind) => {
        const articleDir = mkdtempSync(join(tmpdir(), `leetllm-alt-${kind}-`))
        const generatedDir = join(articleDir, "illustrations", "_generated")
        mkdirSync(generatedDir, { recursive: true })
        const logicalAlt = `A & B; literal &amp; text, <pl>, \"charge\", and 'phone'`
        writeFileSync(join(generatedDir, "alt.json"), JSON.stringify({ sequence: logicalAlt }))

        if (kind === "film") {
            writeFileSync(join(generatedDir, "sequence_film.json"), JSON.stringify({ width: 1920, height: 1080, duration: 12000, fps: 30 }))
            for (const theme of ["dark", "light"]) {
                writeFileSync(join(generatedDir, `sequence_${theme}.mp4`), `${theme} movie`)
                writeFileSync(join(generatedDir, `sequence_${theme}.vtt`), 'WEBVTT\n')
                writeFileSync(join(generatedDir, `sequence_${theme}.png`), pngHeader(800, 400))
            }
        } else if (kind === "timeline") {
            writeFileSync(join(generatedDir, "sequence_animation.json"), JSON.stringify({ width: 800, height: 400, duration: 1000, fps: 10 }))
            for (const theme of ["dark", "light"]) {
                writeFileSync(join(generatedDir, `sequence_${theme}.gif`), `${theme} gif`)
                writeFileSync(join(generatedDir, `sequence_${theme}.png`), pngHeader(800, 400))
            }
        } else {
            for (const theme of ["dark", "light"]) {
                writeFileSync(join(generatedDir, `sequence_${theme}_manifest.json`), JSON.stringify({ width: 800, height: 400, scenes: [{ index: 0, duration: 1000 }] }))
                writeFileSync(join(generatedDir, `sequence_scene0_${theme}.png`), pngHeader(800, 400))
            }
        }

        try {
            const resolved = resolveIllustrations("![Sequence](illustrations/_generated/sequence_dark.png)", articleDir)
            const rendered = document.createElement("div")
            rendered.innerHTML = resolved
            const metadata = JSON.parse(rendered.querySelector("[data-animated-illustration]")?.getAttribute("data-animated-illustration") ?? "null")

            expect(metadata.alt).toBe(logicalAlt)
            if (kind === "film") {
                expect(metadata.kind).toBe("film")
                expect(metadata.darkVideo).toContain("sequence_dark.mp4?v=")
                expect(metadata.lightVideo).toContain("sequence_light.mp4?v=")
                expect(metadata.darkFallback).toContain("sequence_dark.png?v=")
                expect(metadata.duration).toBe(12000)
                expect(rendered.querySelector("figure > img")?.getAttribute("src")).toContain("sequence_dark.png?v=")
                expect(rendered.querySelector("img")?.getAttribute("data-light-src")).toContain("sequence_light.png?v=")
            }
        } finally {
            rmSync(articleDir, { recursive: true, force: true })
        }
    })

    test("hydrates timeline GIFs with themed static fallbacks", () => {
        const articleDir = mkdtempSync(join(tmpdir(), "leetllm-animation-"))
        const generatedDir = join(articleDir, "illustrations", "_generated")
        mkdirSync(generatedDir, { recursive: true })
        writeFileSync(join(generatedDir, "ring_animation.json"), JSON.stringify({
            width: 960,
            height: 480,
            duration: 6400,
            fps: 12,
        }))
        for (const theme of ["dark", "light"]) {
            writeFileSync(join(generatedDir, `ring_${theme}.gif`), `${theme} gif`)
            writeFileSync(join(generatedDir, `ring_${theme}.png`), `${theme} png`)
        }

        try {
            const result = resolveIllustrations(
                "![Ring transfer](illustrations/_generated/ring_dark.png)",
                articleDir,
            )
            const rendered = document.createElement("div")
            rendered.innerHTML = result
            const metadata = JSON.parse(rendered.querySelector("[data-animated-illustration]")?.getAttribute("data-animated-illustration") ?? "null")

            expect(result).toContain("data-animated-illustration")
            expect(metadata.kind).toBe("timeline")
            expect(metadata.darkGif).toContain("ring_dark.gif")
            expect(metadata.lightGif).toContain("ring_light.gif")
            expect(metadata.darkFallback).toContain("ring_dark.png")
            expect(metadata.lightFallback).toContain("ring_light.png")
        } finally {
            rmSync(articleDir, { recursive: true, force: true })
        }
    })

    test.each(["", "./"])("uses actual dark file references with prefix %j as theme-aware illustration bases", (prefix) => {
        const articleDir = mkdtempSync(join(tmpdir(), "leetllm-illustration-"))
        const generatedDir = join(articleDir, "illustrations", "_generated")
        mkdirSync(generatedDir, { recursive: true })
        writeFileSync(join(generatedDir, "approval_policies_dark.png"), "")
        writeFileSync(join(generatedDir, "approval_policies_light.png"), "")

        const result = resolveIllustrations(
            `![Approval Policies](${prefix}illustrations/_generated/approval_policies_dark.png)`,
            articleDir
        )

        expect(result).toContain("approval_policies_dark.png")
        expect(result).toContain("approval_policies_light.png")
        expect(result.match(/<img\b/g)).toHaveLength(1)
        expect(result).toContain('data-themed-image="true"')
        expect(result).toContain('data-dark-src=')
        expect(result).toContain('data-light-src=')
    })

    test("preserves natural pixel widths alongside retina display dimensions", () => {
        const articleDir = mkdtempSync(join(tmpdir(), "leetllm-natural-illustration-"))
        const generatedDir = join(articleDir, "illustrations", "_generated")
        mkdirSync(generatedDir, { recursive: true })
        writeFileSync(join(generatedDir, "attention_dark.png"), pngHeader(2400, 1200))
        writeFileSync(join(generatedDir, "attention_light.png"), pngHeader(1600, 1000))

        try {
            const result = resolveIllustrations(
                "![Attention](illustrations/_generated/attention_dark.png)",
                articleDir,
            )

            expect(pngNaturalSize(join(generatedDir, "attention_dark.png"))).toEqual({ w: 2400, h: 1200 })
            expect(pngDisplaySize(join(generatedDir, "attention_dark.png"))).toEqual({ w: 1200, h: 600 })
            expect(result).toContain('width="1200" height="600" data-natural-width="2400"')
            expect(result).toContain('data-dark-width="1200" data-dark-height="600" data-dark-natural-width="2400"')
            expect(result).toContain('data-light-width="800" data-light-height="500" data-light-natural-width="1600"')
        } finally {
            rmSync(articleDir, { recursive: true, force: true })
        }
    })

    test.each(["", "./"])("preserves author figure wrappers with prefix %j when resolving HTML images", (prefix) => {
        const articleDir = mkdtempSync(join(tmpdir(), "leetllm-figure-"))
        const generatedDir = join(articleDir, "illustrations", "_generated")
        mkdirSync(generatedDir, { recursive: true })
        writeFileSync(join(generatedDir, "salary_by_level_dark.png"), "")
        writeFileSync(join(generatedDir, "salary_by_level_light.png"), "")

        const result = resolveIllustrations(
            `<figure>
  <img src="${prefix}illustrations/_generated/salary_by_level_dark.png" alt="Salary by level" />
  <figcaption>Caption text.</figcaption>
</figure>`,
            articleDir
        )

        expect(result.match(/<figure/g)?.length).toBe(1)
        expect(result).toContain("salary_by_level_dark.png")
        expect(result).toContain("salary_by_level_light.png")
        expect(result).toContain("<figcaption>Caption text.</figcaption>")
    })

    test("adds diagram alt summaries from mermaid structure", () => {
        const articleDir = mkdtempSync(join(tmpdir(), "leetllm-diagram-"))
        const generatedDir = join(articleDir, "diagrams", "_generated")
        mkdirSync(generatedDir, { recursive: true })
        writeFileSync(join(generatedDir, "content_diagram_0_dark.png"), pngHeader(2048, 1024))
        writeFileSync(join(generatedDir, "content_diagram_0_light.png"), pngHeader(1800, 900))

        const result = resolveDiagrams(
            `\`\`\`mermaid
flowchart LR
    subgraph A["Tensor A (2, 3, 4)"]
        A0["2"]
    end
    subgraph B["Tensor B (4,)"]
        B0["4"]
    end
    subgraph R["Result (2, 3, 4)"]
        R0["4"]
    end
\`\`\``,
            articleDir,
            "content.md",
        )

        expect(result).toContain('data-diagram-alt="Diagram showing Tensor A (2, 3, 4), Tensor B (4,), and Result (2, 3, 4)."')
        expect(result).toContain('alt="Diagram showing Tensor A (2, 3, 4), Tensor B (4,), and Result (2, 3, 4)."')
        expect(result.match(/<img\b/g)).toHaveLength(1)
        expect(result).toContain('data-themed-image="true"')
        expect(result).toContain('width="1024" height="512" data-natural-width="2048"')
        expect(result).toContain('data-dark-width="1024" data-dark-height="512" data-dark-natural-width="2048"')
        expect(result).toContain('data-light-width="900" data-light-height="450" data-light-natural-width="1800"')
    })

    test("renders the complete five-stage flow description as an accessible alt", () => {
        const articleDir = mkdtempSync(join(tmpdir(), "leetllm-five-stage-diagram-"))
        const generatedDir = join(articleDir, "diagrams", "_generated")
        mkdirSync(generatedDir, { recursive: true })
        writeFileSync(join(generatedDir, "content_diagram_0_dark.png"), pngHeader(800, 400))

        try {
            const source = `\`\`\`mermaid
flowchart TB
    C["1. Private cases<br/>question + expected facts"]:::primary --> R["2. Retrieve evidence<br/>policy chunks"]:::secondary
    R --> A["3. Generate answer<br/>with source ID"]:::secondary
    A --> S["4. Score behavior<br/>facts + risk + format"]:::warning
    S --> G{"5. Release gate<br/>ship, route, reject"}:::success
\`\`\``
            const resolved = resolveDiagrams(source, articleDir, "content.md")
            const rendered = document.createElement("div")
            rendered.innerHTML = resolved

            const description = "Diagram showing 1. Private cases question + expected facts, 2. Retrieve evidence policy chunks, 3. Generate answer with source ID, 4. Score behavior facts + risk + format, and 5. Release gate ship, route, reject."
            expect(rendered.querySelector("img")?.getAttribute("alt")).toBe(description)
            expect(rendered.querySelector("figure")?.getAttribute("data-diagram-alt")).toBe(description)
            expect(rendered.textContent?.trim()).toBe("")
        } finally {
            rmSync(articleDir, { recursive: true, force: true })
        }
    })
})

describe("resolveDiagrams", () => {
    test("escapes an authored Mermaid description into both image and figure alt attributes", () => {
        const articleDir = mkdtempSync(join(tmpdir(), "leetllm-authored-diagram-alt-"))
        const generatedDir = join(articleDir, "diagrams", "_generated")
        mkdirSync(generatedDir, { recursive: true })
        writeFileSync(join(generatedDir, "content_diagram_0_dark.png"), pngHeader(800, 400))

        try {
            const source = `\`\`\`mermaid
flowchart TB
    accDescr: Run &quot;003&quot; and report & review.
    A["Input"] --> B["Release gate"]
\`\`\``
            const resolved = resolveDiagrams(source, articleDir, "content.md")
            const rendered = document.createElement("div")
            rendered.innerHTML = resolved
            const description = 'Run "003" and report & review.'

            expect(resolved).toContain('alt="Run &quot;003&quot; and report &amp; review."')
            expect(rendered.querySelector("img")?.getAttribute("alt")).toBe(description)
            expect(rendered.querySelector("figure")?.getAttribute("data-diagram-alt")).toBe(description)
        } finally {
            rmSync(articleDir, { recursive: true, force: true })
        }
    })
})

describe("resolveGlossaryEntryMedia", () => {
    test("resolves glossary mermaid fences to themed CDN img tags when PNGs exist", () => {
        // resolveGlossaryEntryMedia uses CONTENT_DIR under web/src/content.
        // Write into the real glossary tree under a throwaway id, then clean up.
        const contentRoot = join(process.cwd(), "src", "content", "glossary")
        const entryId = `_test_glossary_media_${Date.now()}`
        const entryDir = join(contentRoot, entryId)
        const generatedDir = join(entryDir, "diagrams", "_generated")
        mkdirSync(generatedDir, { recursive: true })
        writeFileSync(join(generatedDir, `${entryId}_diagram_0_dark.png`), "png")
        writeFileSync(join(generatedDir, `${entryId}_diagram_0_light.png`), "png")

        try {
            const result = resolveGlossaryEntryMedia(
                entryId,
                "```mermaid\nflowchart LR\n  A-->B\n```\n",
            )
            expect(result).toContain("<figure")
            expect(result).toContain(`${entryId}_diagram_0_dark.png`)
            expect(result).toContain(`${entryId}_diagram_0_light.png`)
            expect(result).toContain("/cdn/content-image/")
            expect(result).not.toContain("```mermaid")
        } finally {
            rmSync(entryDir, { recursive: true, force: true })
        }
    })
})

describe("content asset and reference helpers", () => {
    test.each(["", "./"])("rewrites article asset links with prefix %j to content asset URLs", (prefix) => {
        const articleDir = mkdtempSync(join(tmpdir(), "leetllm-assets-"))
        const assetsDir = join(articleDir, "assets")
        mkdirSync(assetsDir, { recursive: true })
        writeFileSync(join(assetsDir, "shakespeare.txt"), "KING LEAR")

        const result = resolveAssetLinks(
            `[Download corpus](${prefix}assets/shakespeare.txt)\n<a href="${prefix}assets/shakespeare.txt">Download</a>`,
            articleDir,
        )

        expect(result.match(/\/api\/content-asset\//g)).toHaveLength(2)
        expect(result).toContain("/assets/shakespeare.txt")
    })

    test("extracts citation keys in first-use order without footnote definitions", () => {
        const citations = extractCitationKeys("One[^vaswani2017] two[^dao2022]\n\n[^dao2022]: duplicate\nAgain[^vaswani2017]")

        expect(citations).toEqual(["vaswani2017", "dao2022"])
    })

    test("renders citations as external reference links with hover metadata", () => {
        const result = resolveReferences("Read the result[^vaswani2017].", {
            vaswani2017: {
                title: "Attention Is All You Need",
                authors: "Vaswani et al.",
                year: 2017,
                url: "https://arxiv.org/abs/1706.03762",
                type: "paper",
                venue: "NeurIPS",
            },
        })

        expect(result).toContain('href="https://arxiv.org/abs/1706.03762"')
        expect(result).toContain('target="_blank"')
        expect(result).toContain('data-reference-link="true"')
        expect(result).toContain('data-reference-title="Attention Is All You Need"')
        expect(result).toContain('data-reference-url="https://arxiv.org/abs/1706.03762"')
        expect(result).not.toContain('href="#ref-vaswani2017"')
    })

    test("derives reading-time floors from content type and difficulty", () => {
        expect(estimateReadingTime("Short article.", "Easy", false)).toBe(5)
        expect(estimateReadingTime("Short article.", "Hard", false)).toBe(9)
        expect(estimateReadingTime("Short blog post.", "Medium", true)).toBe(5)
    })

    test("does not count mastery quiz authoring JSON as reading time", () => {
        const longQuiz = `\`\`\`mastery-quiz\n${"question option explanation ".repeat(2000)}\n\`\`\``
        expect(estimateReadingTime(`Short article.\n\n${longQuiz}`, "Easy", false)).toBe(5)
    })

    test("does not clip long blog posts", () => {
        const longBlog = "parameter gradient checkpoint rollout learner reward policy update. ".repeat(4500)
        expect(estimateReadingTime(longBlog, "Medium", true)).toBeGreaterThan(60)
    })

    test("formats reading times as compact hours and minutes", () => {
        expect(formatReadingTime(45)).toBe("45 min")
        expect(formatReadingTime(60)).toBe("1h")
        expect(formatReadingTime(186)).toBe("3h 6m")
    })

})
