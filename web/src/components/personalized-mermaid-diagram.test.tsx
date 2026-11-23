import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, expect, test, vi } from "vitest"
import { PersonalizedMermaidDiagram } from "./personalized-mermaid-diagram"

const mocks = vi.hoisted(() => ({
    initialize: vi.fn(),
    render: vi.fn(),
    resolvedTheme: "dark",
}))

vi.mock("mermaid", () => ({
    default: {
        initialize: mocks.initialize,
        render: mocks.render,
    },
}))

vi.mock("next-themes", () => ({
    useTheme: () => ({ resolvedTheme: mocks.resolvedTheme }),
}))

beforeEach(() => {
    mocks.initialize.mockReset()
    mocks.render.mockReset()
    mocks.resolvedTheme = "dark"
})

test("renders Mermaid SVG as an encoded image with strict local configuration", async () => {
    mocks.render.mockResolvedValue({ svg: '<svg><text>Safe</text></svg>', diagramType: "flowchart" })

    render(<PersonalizedMermaidDiagram chart={"flowchart LR\nA --> B"} />)

    const image = await screen.findByRole("img", { name: "Personalized Mermaid diagram" })
    const source = image.getAttribute("src") ?? ""
    expect(source).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    expect(decodeURIComponent(source.slice(source.indexOf(",") + 1))).toBe("<svg><text>Safe</text></svg>")
    expect(mocks.initialize).toHaveBeenCalledWith(expect.objectContaining({
        startOnLoad: false,
        securityLevel: "strict",
        htmlLabels: false,
        suppressErrorRendering: true,
        maxTextSize: 20_000,
        maxEdges: 160,
        theme: "dark",
    }))
    expect(mocks.render.mock.calls[0][0]).toMatch(/^personalized-mermaid-[A-Za-z0-9_-]+-1$/)
    expect(mocks.render.mock.calls[0][1]).toBe("flowchart LR\nA --> B")
    expect(mocks.render.mock.calls[0][2]).toBeInstanceOf(HTMLDivElement)
    const renderHost = mocks.render.mock.calls[0][2] as HTMLDivElement
    expect(renderHost.childNodes).toHaveLength(0)
    expect(renderHost.isConnected).toBe(false)
    expect(screen.getByRole("button", { name: /View larger/ })).toBeTruthy()
})

test("rerenders with light Mermaid theme when application theme changes", async () => {
    mocks.render
        .mockResolvedValueOnce({ svg: "<svg>dark</svg>", diagramType: "flowchart" })
        .mockResolvedValueOnce({ svg: "<svg>light</svg>", diagramType: "flowchart" })
    const view = render(<PersonalizedMermaidDiagram chart={"flowchart LR\nA --> B"} />)
    await screen.findByRole("img", { name: "Personalized Mermaid diagram" })

    mocks.resolvedTheme = "light"
    view.rerender(<PersonalizedMermaidDiagram chart={"flowchart LR\nA --> B"} />)

    await waitFor(() => expect(mocks.render).toHaveBeenCalledTimes(2))
    await waitFor(() => {
        const source = screen.getByRole("img", { name: "Personalized Mermaid diagram" }).getAttribute("src") ?? ""
        expect(decodeURIComponent(source.slice(source.indexOf(",") + 1))).toBe("<svg>light</svg>")
    })
    expect(mocks.initialize).toHaveBeenLastCalledWith(expect.objectContaining({ theme: "default" }))
    expect(mocks.render.mock.calls[1][0]).toMatch(/^personalized-mermaid-[A-Za-z0-9_-]+-2$/)
})

test("shows a safe error after render failure and rejects oversized input client-side", async () => {
    mocks.render.mockRejectedValue(new Error("Parse error"))
    const view = render(<PersonalizedMermaidDiagram chart={"flowchart LR\nA -->"} />)

    expect((await screen.findByRole("alert")).textContent).toContain("Diagram could not be rendered.")
    expect(screen.queryByText(/flowchart LR/)).toBeNull()

    mocks.render.mockClear()
    view.rerender(<PersonalizedMermaidDiagram chart={`flowchart LR\n${"A".repeat(20_001)}`} />)

    expect(screen.getByRole("alert").textContent).toContain("Diagram is too large to render safely.")
    expect(mocks.render).not.toHaveBeenCalled()
})

test("uses embedded labels and canonical themed fallback without rendering metadata", async () => {
    mocks.render.mockRejectedValue(new Error("Parse error"))
    const metadata = Buffer.from(JSON.stringify({
        alt: "Personalized release path",
        caption: "Canonical fallback remains available.",
        fallbackDarkSrc: "/cdn/content-image/lesson/diagram_dark.png?v=1",
        fallbackLightSrc: "/cdn/content-image/lesson/diagram_light.png?v=1",
    })).toString("base64url")

    render(<PersonalizedMermaidDiagram chart={`%% leetllm-meta: ${metadata}\nflowchart LR\nA --> B`} />)

    const fallback = await screen.findByRole("img", { name: "Personalized release path" })
    expect(fallback.getAttribute("src")).toBe("/cdn/content-image/lesson/diagram_dark.png?v=1")
    expect(screen.getByText("Canonical fallback remains available.")).toBeTruthy()
    expect(mocks.render.mock.calls[0][1]).toBe("flowchart LR\nA --> B")
})
