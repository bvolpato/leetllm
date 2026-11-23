import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, test } from "vitest"
import { collectImageTargets } from "./ios-image-targets"

const fixtures: string[] = []

afterEach(() => {
    for (const fixture of fixtures.splice(0)) rmSync(fixture, { recursive: true, force: true })
})

describe("iOS image target collection", () => {
    test("hydrates both GIF themes for the referenced animated training illustration", () => {
        const contentRoot = join(process.cwd(), "src", "content")
        const targets = collectImageTargets(contentRoot)
        const generatedDir = "projects/deep-dive-nccl/illustrations/_generated"

        expect(targets).toContain(`${generatedDir}/nccl_allgather_dark.gif`)
        expect(targets).toContain(`${generatedDir}/nccl_allgather_light.gif`)
    })

    test("includes both animation GIF themes for referenced animated PNGs only", () => {
        const contentRoot = mkdtempSync(join(tmpdir(), "leetllm-ios-image-targets-"))
        fixtures.push(contentRoot)

        const articleDir = join(contentRoot, "blog", "training")
        const illustrationDir = join(articleDir, "illustrations")
        const generatedDir = join(articleDir, "illustrations", "_generated")
        mkdirSync(generatedDir, { recursive: true })
        writeFileSync(
            join(articleDir, "content.md"),
            [
                "![Animated process group](illustrations/_generated/parallelism_fold_dark.png)",
                "![Static diagram](illustrations/_generated/static_diagram_dark.png)",
                '```typescript render="illustration" name="animated_component"',
                "export default function Figure() { return null }",
                "```",
            ].join("\n"),
        )
        writeFileSync(join(illustrationDir, "parallelism_fold.tsx"), "export function createAnimation() {}\n")
        writeFileSync(join(illustrationDir, "animated_component.tsx"), "export const createAnimation = () => ({})\n")
        writeFileSync(join(illustrationDir, "static_diagram.tsx"), "export function create() {}\n")

        const targets = collectImageTargets(contentRoot)

        expect(targets).toContain("blog/training/illustrations/_generated/parallelism_fold_dark.png")
        expect(targets).toContain("blog/training/illustrations/_generated/parallelism_fold_light.png")
        expect(targets).toContain("blog/training/illustrations/_generated/parallelism_fold_dark.gif")
        expect(targets).toContain("blog/training/illustrations/_generated/parallelism_fold_light.gif")
        expect(targets).toContain("blog/training/illustrations/_generated/animated_component_dark.gif")
        expect(targets).toContain("blog/training/illustrations/_generated/animated_component_light.gif")
        expect(targets).toContain("blog/training/illustrations/_generated/static_diagram_dark.png")
        expect(targets).toContain("blog/training/illustrations/_generated/static_diagram_light.png")
        expect(targets.some((target) => target.includes("static_diagram") && target.endsWith(".gif"))).toBe(false)
    })
})
