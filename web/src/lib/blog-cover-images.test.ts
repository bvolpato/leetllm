import { join } from "path"
import { describe, expect, test } from "vitest"
import { contentImageUrl, pngNaturalSize } from "./content-utils"
import { getBlogPostBySlug } from "./blog"

describe("blog cover image variants", () => {
    test("uses each theme image's own immutable URL and intrinsic width", () => {
        const post = getBlogPostBySlug("swe-bench-deep-dive")
        expect(post).toBeDefined()

        const articleDir = join(process.cwd(), "src", "content", "blog", "swe-bench-deep-dive")
        const darkPath = join(articleDir, "illustrations", "_generated", "agent_workflow_dark.png")
        const lightPath = join(articleDir, "illustrations", "_generated", "agent_workflow_light.png")

        expect(post?.coverImageThemeUrls).toEqual({
            dark: contentImageUrl(darkPath),
            light: contentImageUrl(lightPath),
        })
        expect(post?.coverImageNaturalWidths).toEqual({
            dark: pngNaturalSize(darkPath)?.w,
            light: pngNaturalSize(lightPath)?.w,
        })
    })
})
