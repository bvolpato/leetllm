import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, describe, expect, test, vi } from "vitest"
import { extractLessonBody } from "./lesson-content"
import {
    applyPersonalizedVisuals,
    canonicalVisualNumericFacts,
    extractPersonalizationVisuals,
    insertVisualPlaceholders,
    parseVizmaticSceneSource,
    validatePersonalizedMermaidSource,
    type PersonalizationVisualSource,
} from "./personalization-visuals"
import { getQuestionBySlug, getQuestions } from "./questions"

const fixtureRoots: string[] = []

afterEach(() => {
    for (const root of fixtureRoots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function visualFixture(body: string) {
    const root = mkdtempSync(join(process.cwd(), "src", "content", ".audience-visuals-"))
    fixtureRoots.push(root)
    const slug = "audience-visual-fixture"
    const articleDir = join(root, slug)
    mkdirSync(join(articleDir, "illustrations"), { recursive: true })
    writeFileSync(join(articleDir, "content.md"), body)
    writeFileSync(join(articleDir, "illustrations", "shared.tsx"), 'export const alt = "Website source alt"\nexport const title = "Website visual source"')
    return slug
}

describe("personalized visual sources", () => {
    test("never selects book-only source or captions when the website reuses the same illustration", () => {
        const slug = visualFixture([
            "<!-- leetllm: audience:book:start -->",
            '```tsx render="illustration" name="shared"',
            'export const title = "Book-only visual source"',
            "```",
            '<figure><img src="illustrations/_generated/shared_dark.png" alt="Book-only alt" /><figcaption>Book-only caption.</figcaption></figure>',
            "<!-- leetllm: audience:book:end -->",
            "<!-- leetllm: audience:website:start -->",
            '<figure><img src="illustrations/_generated/shared_dark.png" alt="Website alt" /><figcaption>Website caption.</figcaption></figure>',
            "<!-- leetllm: audience:website:end -->",
        ].join("\n"))
        const canonicalMarkup = '<figure><img src="/cdn/content-image/test/shared_dark.png" alt="Website alt" /><figcaption>Website caption.</figcaption></figure>'

        const visuals = extractPersonalizationVisuals(slug, canonicalMarkup)

        expect(visuals).toHaveLength(1)
        expect(visuals[0]).toMatchObject({ name: "shared", alt: "Website alt", caption: "Website caption.", canonicalMarkup })
        expect(visuals[0].source).toContain("Website visual source")
        expect(JSON.stringify(visuals)).not.toContain("Book-only")
    })

    test("retains full-source Mermaid indices after omitting an earlier book diagram", () => {
        const visibleSource = "flowchart LR\nC[Website input] --> D[Website output]"
        const slug = visualFixture([
            "<!-- leetllm: audience:book:start -->",
            "```mermaid",
            "flowchart LR\nA[Book-only input] --> B[Book-only output]",
            "```",
            "<!-- leetllm: audience:book:end -->",
            "```mermaid",
            visibleSource,
            "```",
        ].join("\n"))
        const canonicalMarkup = '<figure><img src="/cdn/content-image/test/content_diagram_1_dark.png" alt="Website flow" /></figure>'

        const visuals = extractPersonalizationVisuals(slug, canonicalMarkup)

        expect(visuals).toEqual([{
            id: "M0001",
            kind: "mermaid",
            name: "content_diagram_1",
            source: visibleSource,
            alt: "Website flow",
            caption: undefined,
            canonicalMarkup,
        }])
        expect(JSON.stringify(visuals)).not.toContain("Book-only")
    })

    test("expands the hypothesis lesson's external Vizmatic sources", () => {
        const question = getQuestionBySlug("hypothesis-tests-confidence-intervals-passk")
        expect(question).toBeDefined()
        const content = extractLessonBody(question!.content).content

        const visuals = extractPersonalizationVisuals(question!.slug, content)

        expect(visuals.map(({ id, kind, name }) => ({ id, kind, name }))).toEqual([
            { id: "M0001", kind: "mermaid", name: "content_diagram_0" },
            { id: "V0002", kind: "vizmatic", name: "chapter_flow" },
            { id: "V0003", kind: "vizmatic", name: "paired_test_rule" },
            { id: "V0004", kind: "vizmatic", name: "paired_variance_reduction" },
            { id: "V0005", kind: "vizmatic", name: "interval_overlap" },
            { id: "V0006", kind: "vizmatic", name: "passk_estimation" },
        ])
        expect(visuals[1].source).toContain("MiniBarChart")
        expect(visuals[2].source).toContain("BarChart")
        expect(visuals[4].source).toContain("AxisPlot")
        expect(visuals.every((visual) => visual.canonicalMarkup.startsWith("<figure"))).toBe(true)
        expect(visuals.every((visual) => visual.canonicalMarkup.includes("/cdn/content-image/"))).toBe(true)
    })

    test("extracts every visual from lessons with dense illustration coverage", () => {
        const question = getQuestionBySlug("multimodal-llms-architecture-design")
        expect(question).toBeDefined()
        const content = extractLessonBody(question!.content).content

        const visuals = extractPersonalizationVisuals(question!.slug, content)

        expect(visuals.length).toBeGreaterThanOrEqual(10)
        expect(visuals.length).toBeLessThanOrEqual(16)
    })

    test("replaces only mapped figures with stable visual placeholders", () => {
        const visual: PersonalizationVisualSource = {
            id: "M0001",
            kind: "mermaid",
            name: "content_diagram_0",
            source: "flowchart LR\nA[1 request] --> B[2 checks]",
            alt: "One request passes through two checks.",
            canonicalMarkup: "<figure><img src=\"diagram.png\" /></figure>",
        }
        const prepared = insertVisualPlaceholders(`Before\n\n${visual.canonicalMarkup}\n\nAfter`, [visual])

        expect(prepared.markdown).toContain("[[LEETLLM_VISUAL_M0001]]")
        expect(prepared.markdown).not.toContain("diagram.png")
        expect(prepared.visuals).toEqual([visual])
    })

    test("restores validated Mermaid and rejects unsafe or fact-changing diagrams", () => {
        const visual: PersonalizationVisualSource = {
            id: "M0001",
            kind: "mermaid",
            name: "content_diagram_0",
            source: "flowchart LR\nA[1 request] --> B[2 checks]",
            alt: "One request passes through two checks.",
            canonicalMarkup: "<figure />",
        }
        const markdown = "[[LEETLLM_VISUAL_M0001]]"
        const validator = vi.fn()

        expect(applyPersonalizedVisuals(markdown, [visual], [{
            id: "M0001",
            kind: "mermaid",
            source: "flowchart LR\nA[1 simple request] --> B[2 careful checks]",
        }], validator)).toContain("```mermaid")
        expect(() => applyPersonalizedVisuals(markdown, [visual], [{
            id: "M0001",
            kind: "mermaid",
            source: "flowchart LR\nA --> B\nclick A https://evil.example",
        }], validator)).toThrow("unsafe directives")
        expect(() => applyPersonalizedVisuals(markdown, [visual], [{
            id: "M0001",
            kind: "mermaid",
            source: "flowchart LR\nA[request] --> B[checks]",
        }], validator)).toThrow("changed canonical numeric facts")
        expect(() => applyPersonalizedVisuals(markdown, [visual], [{
            id: "M0001",
            kind: "mermaid",
            source: visual.source,
        }], validator)).toThrow("must adapt at least one label")
    })

    test("keeps exact Mermaid topology and rejects malformed, reversed, or injected diagrams", () => {
        const canonical = "flowchart LR\nA[1 request] --> B[2 checks]\nB --> C[release]"

        expect(validatePersonalizedMermaidSource(
            canonical,
            "flowchart TB\nA[1 learner request] --> B[2 safety checks]\nB --> C[release decision]",
        )).toContain("flowchart TB")
        expect(() => validatePersonalizedMermaidSource(
            canonical,
            "flowchart LR\nB[2 checks] --> A[1 request]\nB --> C[release]",
        )).toThrow("changed canonical nodes, edges, or direction")
        expect(() => validatePersonalizedMermaidSource(
            canonical,
            "flowchart LR\nA[1 request] --> B[2 checks]\nB --> C[release]\nC --> D[99 invented]",
        )).toThrow("changed canonical nodes, edges, or direction")
        expect(() => validatePersonalizedMermaidSource(canonical, "flowchart LR\nA -->"))
            .toThrow("malformed edge")
        expect(() => validatePersonalizedMermaidSource(canonical, "flowchart LR\nA --> B\n```\n<script>"))
            .toThrow("unsafe directives")
        expect(() => validatePersonalizedMermaidSource(canonical, "flowchart LR\nA --> B\nstyle A fill:url(//evil.example/x)"))
            .toThrow("unsafe directives")
    })

    test("ignores standard flowchart accessibility metadata only for topology", () => {
        const canonical = "flowchart LR\nA[1 request] --> B[2 checks]"
        const singleLine = `flowchart LR
accTitle: Request checks
accDescr: A request moves through the policy check.
A[1 learner request] --> B[2 policy checks]`
        const multiline = `flowchart LR
accDescr {
    Follow the request into the policy gate.
    A --> This sentence is descriptive text, not a graph edge.
}
A[1 learner request] --> B[2 policy checks]`

        expect(validatePersonalizedMermaidSource(canonical, singleLine)).toContain("accTitle: Request checks")
        expect(validatePersonalizedMermaidSource(canonical, multiline)).toContain("This sentence is descriptive text")
        expect(() => validatePersonalizedMermaidSource(
            canonical,
            singleLine.replace("A[1 learner request] --> B", "A[1 learner request] --> C"),
        )).toThrow("changed canonical nodes, edges, or direction")
        expect(() => validatePersonalizedMermaidSource(
            canonical,
            singleLine.replace("A[1 learner request]", "A[9 learner request]"),
        )).toThrow("changed canonical numeric facts")
        expect(() => validatePersonalizedMermaidSource(
            canonical,
            `flowchart LR\naccDescr: This claims 3 checks.\nA[1 learner request] --> B[2 policy checks]`,
        )).toThrow("changed canonical numeric facts")
    })

    test("ignores sequence accessibility metadata without changing messages or numeric facts", () => {
        const canonical = `sequenceDiagram
participant A as API
participant B as Ranker
A->>B: Score 1 candidate
B-->>A: Return 2 eligible items`
        const personalized = `sequenceDiagram
accTitle: Candidate scoring
accDescr {
    The API asks the ranker to score each candidate.
    A-->>B: This sentence is descriptive, not another message.
}
participant A as Learner API
participant B as Candidate ranker
A->>B: Score 1 candidate
B-->>A: Return 2 eligible items`

        expect(validatePersonalizedMermaidSource(canonical, personalized)).toContain("accDescr {")
        expect(() => validatePersonalizedMermaidSource(
            canonical,
            personalized.replace("score each candidate.", "score 3 candidates."),
        )).toThrow("changed canonical numeric facts")
        expect(() => validatePersonalizedMermaidSource(
            canonical,
            personalized.replace("B-->>A: Return 2 eligible items", "A-->>B: Return 2 eligible items"),
        )).toThrow("changed canonical nodes, edges, or direction")
    })

    test("validates accessibility metadata before ignoring it for topology", () => {
        const canonical = "flowchart LR\nA[1 request] --> B[2 checks]"

        expect(() => validatePersonalizedMermaidSource(
            canonical,
            `flowchart LR\naccDescr: <img src=x>\nA[1 request] --> B[2 checks]`,
        )).toThrow("unsafe directives")
        expect(() => validatePersonalizedMermaidSource(
            canonical,
            `flowchart LR\naccDescr {\n${"x".repeat(20_001)}\n}\nA[1 request] --> B[2 checks]`,
        )).toThrow("exceeds size limits")
        expect(() => validatePersonalizedMermaidSource(
            canonical,
            `flowchart LR\naccDescr {\nA[1 request] --> B[2 checks]`,
        )).toThrow("Malformed Mermaid accessibility description")
    })

    test("keeps numeric facts attached to their canonical Mermaid nodes", () => {
        const canonical = "flowchart LR\nA[5 passed] --> B[10 failed]"

        expect(validatePersonalizedMermaidSource(
            canonical,
            "flowchart TB\naccTitle: Fixed quantities\naccDescr: Keep each quantity with its original node.\nA[5 checks passed] --> B[10 checks failed]",
        )).toContain("5 checks passed")
        expect(() => validatePersonalizedMermaidSource(
            canonical,
            "flowchart TB\naccTitle: Fixed quantities\naccDescr: Keep each quantity with its original node.\nA[10 checks passed] --> B[5 checks failed]",
        )).toThrow("changed canonical numeric fact associations")
    })

    test("preserves invisible layout links between flowchart subgraphs", () => {
        const canonical = `flowchart TB
subgraph missCase ["Changing tail"]
A[1 request] --> B[cache miss]
end
subgraph hitCase ["Stable prefix"]
C[1 request] --> D[cache hit]
end
missCase ~~~ hitCase`
        const adapted = canonical.replace("cache miss", "prefix cache miss")

        expect(validatePersonalizedMermaidSource(canonical, adapted)).toContain("~~~")
        expect(() => validatePersonalizedMermaidSource(canonical, adapted.replace("~~~", "-->")))
            .toThrow("changed canonical nodes, edges, or direction")
        expect(() => validatePersonalizedMermaidSource(canonical, adapted.replace("missCase ~~~ hitCase", "")))
            .toThrow("changed canonical nodes, edges, or direction")
        expect(() => validatePersonalizedMermaidSource(canonical, adapted.replace("~~~ hitCase", "~~~")))
            .toThrow("malformed edge")
    })

    test("preserves visible undirected Mermaid links", () => {
        const canonical = "graph TB\nSRAM[On-chip storage] --- HBM[GPU memory]\nHBM --- DRAM[Host memory]"
        const adapted = canonical.replace("On-chip storage", "Fast on-chip storage")

        expect(validatePersonalizedMermaidSource(canonical, adapted)).toContain("SRAM[Fast on-chip storage] --- HBM")
        expect(() => validatePersonalizedMermaidSource(canonical, adapted.replace("---", "~~~")))
            .toThrow("changed canonical nodes, edges, or direction")
        expect(() => validatePersonalizedMermaidSource(canonical, adapted.replace("---", "-->")))
            .toThrow("changed canonical nodes, edges, or direction")
    })

    test("preserves block-beta grid layout and numeric fact ownership", () => {
        const canonical = `block-beta
columns 2
A["3 requests"] B["5 seconds"]
A --> B`
        const adapted = canonical
            .replace("3 requests", "3 input requests")
            .replace("5 seconds", "5 elapsed seconds")

        expect(validatePersonalizedMermaidSource(canonical, adapted)).toContain("3 input requests")
        expect(() => validatePersonalizedMermaidSource(
            canonical,
            adapted.replace('A["3 input requests"] B["5 elapsed seconds"]', 'B["5 elapsed seconds"] A["3 input requests"]'),
        )).toThrow("changed canonical nodes, edges, or direction")
        expect(() => validatePersonalizedMermaidSource(
            canonical,
            adapted.replace("A --> B", "B --> A"),
        )).toThrow("changed canonical nodes, edges, or direction")
        expect(() => validatePersonalizedMermaidSource(
            canonical,
            adapted.replace("3 input requests", "5 input requests").replace("5 elapsed seconds", "3 elapsed seconds"),
        )).toThrow("changed canonical numeric fact associations")
        expect(() => validatePersonalizedMermaidSource(
            canonical,
            adapted.replace("columns 2", "columns 3"),
        )).toThrow("block row does not match its column count")
    })

    test("supports every canonical Mermaid topology in visible lessons", () => {
        const failures: string[] = []
        let diagrams = 0
        for (const question of getQuestions()) {
            const content = extractLessonBody(question.content).content
            for (const visual of extractPersonalizationVisuals(question.slug, content)) {
                if (visual.kind !== "mermaid") continue
                diagrams++
                const safeSource = visual.source
                    .split(/\r?\n/)
                    .filter((line) => !/^\s*(?:classDef|class|style|linkStyle)\b/.test(line))
                    .join("\n")
                    .replace(/<br\s*\/?\s*>/gi, " / ")
                try {
                    validatePersonalizedMermaidSource(visual.source, safeSource)
                } catch (error) {
                    failures.push(`${question.slug}/${visual.name}: ${error instanceof Error ? error.message : String(error)}`)
                }
            }
        }

        expect(diagrams).toBeGreaterThan(30)
        expect(failures).toEqual([])
    })

    test("preserves sequence messages, notes, and control structure", () => {
        const canonical = `sequenceDiagram
participant A as API
participant D as Database
critical Authorized request
A->>D: Read private data
Note over A,D: audit access<br/>retain 2 entries
end`

        const adapted = canonical.replace("API", "Learner API").replace("<br/>", " / ")
        expect(validatePersonalizedMermaidSource(canonical, adapted))
            .toContain("Learner API")
        expect(() => validatePersonalizedMermaidSource(canonical, canonical))
            .toThrow("unsafe directives")
        expect(() => validatePersonalizedMermaidSource(
            canonical,
            adapted.replace("critical Authorized request", "loop Forever").replace("Read private data", "Delete private data"),
        )).toThrow("changed canonical nodes, edges, or direction")
    })

    test("emits data-only Vizmatic fences after schema validation", () => {
        const visual: PersonalizationVisualSource = {
            id: "V0001",
            kind: "vizmatic",
            name: "flow",
            source: "const count = 2",
            alt: "Two stages preserve 2 checks.",
            caption: "A focused two-stage path.",
            canonicalMarkup: "<figure><img src=\"/cdn/content-image/lesson/flow_dark.png?v=1\" /><img src=\"/cdn/content-image/lesson/flow_light.png?v=1\" /></figure>",
        }
        const scene = {
            width: 800,
            height: 400,
            root: {
                type: "Scene",
                props: { title: "Two clear stages" },
                children: [{ type: "Flow", props: { stages: [{ title: "2 checks" }] } }],
            },
        }
        const validator = vi.fn(() => true)

        const result = applyPersonalizedVisuals("[[LEETLLM_VISUAL_V0001]]", [visual], [{
            id: "V0001",
            kind: "vizmatic",
            source: JSON.stringify(scene),
        }], validator)

        expect(validator).toHaveBeenCalledWith(scene)
        expect(result).toContain("```vizmatic")
        expect(result).toContain('"alt":"Two stages preserve 2 checks."')
        expect(result).toContain('"fallbackDarkSrc":"/cdn/content-image/lesson/flow_dark.png?v=1"')
        expect(result).toContain('"fallbackLightSrc":"/cdn/content-image/lesson/flow_light.png?v=1"')
        expect(result).not.toContain("const count")
    })

    test("rejects numeric facts invented inside Vizmatic semantic content", () => {
        const visual: PersonalizationVisualSource = {
            id: "V0001",
            kind: "vizmatic",
            name: "flow",
            source: "const count = 2",
            alt: "Two stages preserve 2 checks.",
            canonicalMarkup: "<figure />",
        }
        const source = JSON.stringify({
            width: 800,
            height: 400,
            root: {
                type: "Scene",
                props: {},
                children: [{ type: "TextLabel", props: { text: "2 checks and 99 invented failures" } }],
            },
        })

        expect(() => applyPersonalizedVisuals("[[LEETLLM_VISUAL_V0001]]", [visual], [{
            id: "V0001",
            kind: "vizmatic",
            source,
        }], () => true)).toThrow("invented numeric fact 99")
    })

    test("preserves Vizmatic datasets without treating layout dimensions as facts", () => {
        const visual: PersonalizationVisualSource = {
            id: "V0001",
            kind: "vizmatic",
            name: "rates",
            source: "const width = 1120\nconst data = [0.5, 0.72]",
            alt: "Two observed rates.",
            canonicalMarkup: "<figure />",
        }
        expect(canonicalVisualNumericFacts(visual)).toEqual(["0.5", "0.72"])
        const source = JSON.stringify({
            width: 800,
            height: 400,
            root: {
                type: "Scene",
                props: {},
                children: [{ type: "TextLabel", props: { text: "Rates 0.5 and 0.72 from 1120 approvals" } }],
            },
        })

        expect(() => applyPersonalizedVisuals("[[LEETLLM_VISUAL_V0001]]", [visual], [{
            id: "V0001",
            kind: "vizmatic",
            source,
        }], () => true)).toThrow("invented numeric fact 1120")
    })

    test.each(["ScatterPlot", "QuadrantChart", "AxisPlot"])(
        "preserves %s coordinates without treating marker size as data",
        (componentType) => {
            const visual: PersonalizationVisualSource = {
                id: "V0001",
                kind: "vizmatic",
                name: "coordinate-plot",
                source: `const points = [
                    { x: 0.18, y: 0.22, label: "prompt", size: 7 },
                    { x: 0.78, y: 0.28, label: "retrieval", size: 8 },
                ]\n<${componentType} points={points} />`,
                alt: "Two points compare routing choices.",
                canonicalMarkup: "<figure />",
            }
            expect(canonicalVisualNumericFacts(visual)).toEqual(["0.18", "0.22", "0.78", "0.28"])

            const scene = (points: Array<Record<string, unknown>>) => JSON.stringify({
                width: 900,
                height: 500,
                root: {
                    type: "Scene",
                    props: {},
                    children: [{ type: componentType, props: { points } }],
                },
            })
            const faithful = scene([
                { x: 0.18, y: 0.22, label: "prompt", size: 20 },
                { x: 0.78, y: 0.28, label: "retrieval", size: 24 },
            ])

            expect(() => applyPersonalizedVisuals("[[LEETLLM_VISUAL_V0001]]", [visual], [{
                id: "V0001",
                kind: "vizmatic",
                source: faithful,
            }], () => true)).not.toThrow()
            expect(() => applyPersonalizedVisuals("[[LEETLLM_VISUAL_V0001]]", [visual], [{
                id: "V0001",
                kind: "vizmatic",
                source: scene([
                    { x: 0.19, y: 0.22, label: "prompt", size: 20 },
                    { x: 0.78, y: 0.28, label: "retrieval", size: 24 },
                ]),
            }], () => true)).toThrow("removed canonical numeric fact 0.18")
        },
    )

    test("keeps Vizmatic values attached to their canonical labels", () => {
        const visual: PersonalizationVisualSource = {
            id: "V0001",
            kind: "vizmatic",
            name: "labeled-bars",
            source: `const data = [
                { label: "passed", value: 5 },
                { label: "failed", value: 10 },
            ]\n<BarChart data={data} />`,
            alt: "Passed and failed checks.",
            canonicalMarkup: "<figure />",
        }
        const scene = (passed: number, failed: number) => JSON.stringify({
            width: 900,
            height: 500,
            root: {
                type: "Scene",
                props: {},
                children: [{
                    type: "BarChart",
                    props: {
                        data: [
                            { label: "Passed", value: passed },
                            { label: "Failed", value: failed },
                        ],
                    },
                }],
            },
        })

        expect(() => applyPersonalizedVisuals("[[LEETLLM_VISUAL_V0001]]", [visual], [{
            id: "V0001",
            kind: "vizmatic",
            source: scene(5, 10),
        }], () => true)).not.toThrow()
        expect(() => applyPersonalizedVisuals("[[LEETLLM_VISUAL_V0001]]", [visual], [{
            id: "V0001",
            kind: "vizmatic",
            source: scene(10, 5),
        }], () => true)).toThrow("changed canonical labeled numeric fact associations")
    })

    test("treats chart values as facts without double-counting display labels", () => {
        const visual: PersonalizationVisualSource = {
            id: "V0001",
            kind: "vizmatic",
            name: "interval",
            source: `const data = [{
                label: "paired lift",
                low: -10,
                mid: 7.5,
                high: 25,
                lowLabel: "−10",
                midLabel: "+7.5",
                highLabel: "+25",
            }]\n<IntervalPlot data={data} />`,
            alt: "Paired lift interval.",
            canonicalMarkup: "<figure />",
        }
        expect(canonicalVisualNumericFacts(visual)).toEqual(["-10", "7.5", "25"])
        const source = JSON.stringify({
            width: 900,
            height: 500,
            root: {
                type: "Scene",
                props: {},
                children: [{
                    type: "IntervalPlot",
                    props: {
                        data: [{
                            label: "Paired lift",
                            low: -10,
                            mid: 7.5,
                            high: 25,
                            lowLabel: "−10 pts",
                            midLabel: "+7.5 pts",
                            highLabel: "+25 pts",
                        }],
                    },
                }],
            },
        })

        expect(() => applyPersonalizedVisuals("[[LEETLLM_VISUAL_V0001]]", [visual], [{
            id: "V0001",
            kind: "vizmatic",
            source,
        }], () => true)).not.toThrow()

        const invalid = JSON.parse(source)
        const invalidDatum = invalid.root.children[0].props.data[0]
        invalidDatum.lowLabel = "−999 pts"
        invalidDatum.midLabel = "+999 pts"
        invalidDatum.highLabel = "+999 pts"
        expect(() => applyPersonalizedVisuals("[[LEETLLM_VISUAL_V0001]]", [visual], [{
            id: "V0001",
            kind: "vizmatic",
            source: JSON.stringify(invalid),
        }], () => true)).toThrow("changed canonical numeric display labels")
    })

    test("repairs bounded model JSON and distinguishes ranges from negative values", () => {
        expect(parseVizmaticSceneSource('{"width":800,"height":400,"root":{"type":"Scene","props":{},"children":[]}}]'))
            .toMatchObject({ width: 800, height: 400 })

        const visual: PersonalizationVisualSource = {
            id: "V0001",
            kind: "vizmatic",
            name: "range",
            source: "unused",
            alt: "A 13-to-3 reduction keeps an interval from minus 3 to plus 4.",
            canonicalMarkup: "<figure />",
        }
        const source = JSON.stringify({
            width: 800,
            height: 400,
            root: {
                type: "Scene",
                props: {},
                children: [{ type: "TextLabel", props: { text: "13 inputs become 3; interval -3 to +4" } }],
            },
        })

        expect(() => applyPersonalizedVisuals("[[LEETLLM_VISUAL_V0001]]", [visual], [{
            id: "V0001",
            kind: "vizmatic",
            source,
        }], () => true)).not.toThrow()
    })
})
