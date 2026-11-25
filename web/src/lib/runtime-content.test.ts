import { readFileSync } from "fs"
import { join } from "path"
import { test, expect } from "vitest"
import { isRuntimeContentPath } from "../../scripts/validate-runtime-content"

test("Docker runtime image collects validated runtime content without bundling Codex", () => {
    const dockerfile = readFileSync(join(process.cwd(), "..", "Dockerfile"), "utf8")

    expect(dockerfile).toContain("ARG NEXT_PUBLIC_CONTENT_ASSETS_ORIGIN=https://assets.leetllm.com")
    expect(dockerfile).toContain("scripts/validate-runtime-content.ts --collect /runtime-content")
    expect(dockerfile).toContain("src/generated/content-image-manifest.json")
    expect(dockerfile).toContain("src/generated/glossary-data.json")
    expect(dockerfile).not.toContain("npm install --global @openai/codex")

    expect(isRuntimeContentPath("references.json")).toBe(true)
    expect(isRuntimeContentPath("foundations/test/content.md")).toBe(true)
    expect(isRuntimeContentPath("blog/private-post/social_banner.png")).toBe(true)
    expect(isRuntimeContentPath("foundations/test/illustrations/_generated/alt.json")).toBe(true)
    expect(isRuntimeContentPath("training/build-gpt/assets/shakespeare.txt")).toBe(true)
})
