import mermaid from "mermaid"
import { expect, test } from "vitest"

test("installed Mermaid runtime parses personalized fenced-block output", async () => {
    mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        htmlLabels: false,
    })

    const parsed = await mermaid.parse(
        'flowchart LR\nrequest["1 API request"] --> checks["2 safety checks"] --> release["release decision"]',
    )

    expect(parsed.diagramType).toBe("flowchart-v2")
})
