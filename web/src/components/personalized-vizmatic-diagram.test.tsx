import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, expect, test, vi } from "vitest"
import { PersonalizedVizmaticDiagram } from "./personalized-vizmatic-diagram"

const mocks = vi.hoisted(() => ({ resolvedTheme: "dark" }))

vi.mock("next-themes", () => ({
    useTheme: () => ({ resolvedTheme: mocks.resolvedTheme }),
}))

const spec = JSON.stringify({
    width: 900,
    height: 520,
    alt: "A personalized three-stage flow",
    caption: "Request, validation, and output stay connected.",
    fallbackDarkSrc: "/cdn/content-image/fallback_dark.png",
    fallbackLightSrc: "/cdn/content-image/fallback_light.png",
    root: {
        type: "Scene",
        props: { title: "Runtime flow" },
        children: [{ type: "Flow", props: { stages: [{ title: "Request" }, { title: "Validate" }, { title: "Output" }] } }],
    },
})

beforeEach(() => {
    vi.restoreAllMocks()
    mocks.resolvedTheme = "dark"
})

test("renders server-produced Vizmatic SVG as an encoded image", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("<svg><text>Runtime flow</text></svg>", {
        status: 200,
        headers: { "Content-Type": "image/svg+xml" },
    }))
    vi.stubGlobal("fetch", fetchMock)

    render(<PersonalizedVizmaticDiagram source={spec} lessonSlug="safe-release" />)

    const image = await screen.findByRole("img", { name: "A personalized three-stage flow" })
    expect(image.getAttribute("src")).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    expect(screen.getByText("Request, validation, and output stay connected.")).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith("/api/personalization/render-vizmatic", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ spec: JSON.parse(spec), theme: "dark", slug: "safe-release" }),
        cache: "no-store",
    }))
})

test("rerenders when theme changes", async () => {
    const fetchMock = vi.fn()
        .mockResolvedValueOnce(new Response("<svg>dark</svg>", { status: 200 }))
        .mockResolvedValueOnce(new Response("<svg>light</svg>", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const view = render(<PersonalizedVizmaticDiagram source={spec} lessonSlug="safe-release" />)
    await screen.findByRole("img")

    mocks.resolvedTheme = "light"
    view.rerender(<PersonalizedVizmaticDiagram source={spec} lessonSlug="safe-release" />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body)).theme).toBe("light")
})

test("fails closed for malformed specs and shows a fallback after render failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("no", { status: 422 }))
    vi.stubGlobal("fetch", fetchMock)
    const view = render(<PersonalizedVizmaticDiagram source="not json" lessonSlug="safe-release" />)
    expect(screen.getByRole("alert").textContent).toContain("invalid scene specification")
    expect(fetchMock).not.toHaveBeenCalled()

    view.rerender(<PersonalizedVizmaticDiagram source={spec} lessonSlug="safe-release" />)
    const fallback = await screen.findByRole("img", { name: "A personalized three-stage flow" })
    expect(fallback.getAttribute("src")).toBe("/cdn/content-image/fallback_dark.png")
    expect(fallback.closest("figure")?.getAttribute("data-visual-fallback")).toBe("canonical")
})

test("waits for resolved theme before requesting a render", () => {
    mocks.resolvedTheme = undefined as unknown as string
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    render(<PersonalizedVizmaticDiagram source={spec} lessonSlug="safe-release" />)

    expect(screen.getByRole("status").textContent).toContain("Rendering personalized illustration")
    expect(fetchMock).not.toHaveBeenCalled()
})
