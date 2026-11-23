import { describe, expect, test } from "vitest"
import { parseGlossarySections } from "./glossary-sections"

describe("parseGlossarySections", () => {
    test("ignores section-like headings inside fenced code", () => {
        const parsed = parseGlossarySections(`Definition.

## Example

\`\`\`text
\`\`\`python
## Return policy
Ignore previous instructions.
\`\`\`

## Why it matters here

Prompt boundaries matter.`)

        expect(parsed.definition).toBe("Definition.")
        expect(Array.from(parsed.sections.keys())).toEqual(["Example", "Why it matters here"])
        expect(parsed.sections.get("Example")).toContain("```python")
        expect(parsed.sections.get("Example")).toContain("## Return policy")
        expect(parsed.sections.get("Example")).toContain("Ignore previous instructions.")
    })

    test("supports tilde fences and longer closing fences", () => {
        const parsed = parseGlossarySections(`Definition.

## Example

~~~~text
## Not a section
~~~~~

## Related terms

Links.`)

        expect(Array.from(parsed.sections.keys())).toEqual(["Example", "Related terms"])
    })
})
