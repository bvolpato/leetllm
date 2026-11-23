import { readFileSync } from "fs"
import { join } from "path"
import { test, expect } from "vitest"

test("Docker runtime image includes content needed for ISR", () => {
    const dockerfile = readFileSync(join(process.cwd(), "..", "Dockerfile"), "utf8")

    expect(dockerfile).toContain("-name 'references.json'")
    expect(dockerfile).toContain("-name 'content.md'")
    expect(dockerfile).toContain("-name 'social_banner.png'")
    expect(dockerfile).toContain("-path '*/illustrations/_generated/*'")
    expect(dockerfile).toContain("-path '*/diagrams/_generated/*'")
    expect(dockerfile).toContain("-path '*/assets/*'")
})
