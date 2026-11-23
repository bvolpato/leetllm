import { getThemeColors, getToneColor } from "vizmatic"
import { describe, expect, test } from "vitest"
import {
    renderVizmaticSceneSvg,
    validateVizmaticSceneSpec,
} from "./personalization-vizmatic"

function validSpec() {
    return {
        width: 900,
        height: 520,
        alt: "Model request flowing through safe checks",
        caption: "Only allowlisted scene primitives reach the renderer.",
        root: {
            type: "Scene",
            props: { title: "Safe visualization" },
            children: [{
                type: "Flow",
                props: {
                    connectorTone: "purple",
                    stages: [
                        { title: "Request", tone: "blue" },
                        { title: "Validate", tone: "purple" },
                        { title: "SVG", tone: "green" },
                    ],
                },
            }],
        },
    }
}

describe("personalized Vizmatic scene runtime", () => {
    test("accepts a bounded theme-aware scene and renders SVG", async () => {
        const spec = validSpec()

        expect(validateVizmaticSceneSpec(spec)).toBe(true)
        const svg = await renderVizmaticSceneSvg(spec, "light")
        const darkSvg = await renderVizmaticSceneSvg(spec, "dark")

        expect(svg).toContain("<svg")
        expect(svg).toContain('width="900"')
        expect(svg).toContain('height="520"')
        // The purple connector resolves to the light theme's purple, whatever that palette value is.
        expect(svg.toLowerCase()).toContain(getToneColor("purple", getThemeColors("light")).toLowerCase())
        expect(darkSvg).toContain("<svg")
        expect(darkSvg).not.toBe(svg)
    })

    test.each([
        ["unknown component", (spec: ReturnType<typeof validSpec>) => { spec.root.children[0].type = "iframe" }],
        ["style prop", (spec: ReturnType<typeof validSpec>) => { Object.assign(spec.root.props, { style: { position: "absolute" } }) }],
        ["background prop", (spec: ReturnType<typeof validSpec>) => { Object.assign(spec.root.props, { background: "red" }) }],
        ["URL text", (spec: ReturnType<typeof validSpec>) => { spec.alt = "See https://example.com" }],
        ["HTML text", (spec: ReturnType<typeof validSpec>) => { spec.caption = "<script>alert(1)</script>" }],
        ["raw color", (spec: ReturnType<typeof validSpec>) => { Object.assign(spec.root.children[0].props.stages[0], { color: "#fff" }) }],
        ["nested component children", (spec: ReturnType<typeof validSpec>) => { Object.assign(spec.root.children[0].props.stages[0], { children: [{ type: "TextLabel", props: { text: "hidden" } }] }) }],
        ["function", (spec: ReturnType<typeof validSpec>) => { Object.assign(spec.root.props, { title: (() => "unsafe") as unknown as string }) }],
    ])("rejects %s", (_name, mutate) => {
        const spec = validSpec()
        mutate(spec)
        expect(validateVizmaticSceneSpec(spec)).toBe(false)
    })

    test("enforces canvas, depth, node, and byte caps", () => {
        const small = validSpec()
        small.width = 639
        expect(validateVizmaticSceneSpec(small)).toBe(false)

        const deep = validSpec()
        let children = deep.root.children
        for (let index = 0; index < 7; index += 1) {
            const node = { type: "Row", props: {}, children: [{ type: "TextLabel", props: { text: "nested" } }] }
            children.splice(0, children.length, node as never)
            children = node.children as never
        }
        expect(validateVizmaticSceneSpec(deep)).toBe(false)

        const crowded = validSpec()
        crowded.root.children = Array.from({ length: 50 }, (_, index) => ({
            type: "TextLabel",
            props: { text: `Node ${index}` },
        })) as never
        expect(validateVizmaticSceneSpec(crowded)).toBe(false)

        const large = validSpec()
        large.root.children = [{
            type: "DataTable",
            props: {
                rows: Array.from({ length: 40 }, (_, index) => [
                    `row-${index}-${"x".repeat(250)}`,
                    `value-${index}-${"y".repeat(250)}`,
                ]),
            },
        }] as never
        expect(validateVizmaticSceneSpec(large)).toBe(false)
    })

    test("rejects donut center labels that overlap in runtime rendering", () => {
        const spec = validSpec()
        spec.root.children = [{
            type: "DonutChart",
            props: {
                segments: [{ label: "ties", value: 5 }, { label: "wins", value: 1 }],
                centerLabel: "evidence",
                centerValue: "1 of 6",
            },
        }] as never

        expect(validateVizmaticSceneSpec(spec)).toBe(false)
    })

    test.each([
        ["oversized padding", { padding: "9999px 9999px" }],
        ["oversized font", { titleFontSize: 10_000 }],
        ["oversized percent", { width: "999%" }],
    ])("rejects %s", (_name, unsafeProps) => {
        const spec = validSpec()
        Object.assign(spec.root.props, unsafeProps)
        expect(validateVizmaticSceneSpec(spec)).toBe(false)
    })

    test("rejects aggregate chart data bombs", () => {
        const spec = validSpec()
        spec.root.children = [{
            type: "Matrix",
            props: { data: Array.from({ length: 50 }, () => Array.from({ length: 50 }, () => 1)) },
        }] as never
        expect(validateVizmaticSceneSpec(spec)).toBe(false)

        const spreadAcrossNodes = validSpec()
        spreadAcrossNodes.root.children = Array.from({ length: 49 }, () => ({
            type: "Matrix",
            props: { data: Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 0)) },
        })) as never
        expect(JSON.stringify(spreadAcrossNodes).length).toBeLessThan(16 * 1024)
        expect(validateVizmaticSceneSpec(spreadAcrossNodes)).toBe(false)
    })

    test("queues a cold page of distinct visuals instead of rejecting after two", async () => {
        const specs = Array.from({ length: 4 }, (_, index) => {
            const spec = validSpec()
            spec.root.props.title = `Safe visualization ${index}`
            return spec
        })

        const svgs = await Promise.all(specs.map((spec) => renderVizmaticSceneSvg(spec, "light")))
        expect(svgs).toHaveLength(4)
        expect(svgs.every((svg) => svg.startsWith("<svg"))).toBe(true)
    })

    test("honors request deadlines and abort signals before rendering", async () => {
        const expired = validSpec()
        expired.root.props.title = "Expired render"
        await expect(renderVizmaticSceneSvg(expired, "light", {
            deadlineAt: Date.now() - 1,
        })).rejects.toThrow("deadline exceeded")

        const controller = new AbortController()
        controller.abort()
        const aborted = validSpec()
        aborted.root.props.title = "Aborted render"
        await expect(renderVizmaticSceneSvg(aborted, "dark", {
            signal: controller.signal,
        })).rejects.toMatchObject({ name: "AbortError" })
    })

    test("crops excessive transparent canvas around compact scenes", async () => {
        const spec = validSpec()
        spec.height = 720
        spec.root.children = [{ type: "TextLabel", props: { text: "Compact visual" } }] as never

        const svg = await renderVizmaticSceneSvg(spec, "light")
        const renderedHeight = Number(svg.match(/\bheight="(\d+)"/)?.[1])

        expect(renderedHeight).toBeGreaterThanOrEqual(1)
        expect(renderedHeight).toBeLessThan(720)
    })
})
