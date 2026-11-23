import { expect, test } from "vitest"
import { toJsonLd } from "./utils"

test("toJsonLd stringifies and escapes < character", () => {
    const data = {
        title: "Test <script>alert(1)</script>",
        description: "This contains < and > and &",
    }
    const result = toJsonLd(data)

    // Check that it's valid JSON
    const parsed = JSON.parse(result)
    expect(parsed.title).toBe(data.title)

    // Check that < is escaped
    expect(result).toContain("\\u003cscript\\u003e")
    expect(result).not.toContain("<script>")
})

test("toJsonLd handles nested objects", () => {
    const data = {
        author: {
            name: "Author <Name>",
        }
    }
    const result = toJsonLd(data)
    expect(result).toContain("Author \\u003cName\\u003e")
})
