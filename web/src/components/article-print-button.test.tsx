import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { expect, test, vi } from "vitest"
import { ArticlePrintButton } from "./article-print-button"

test("prepares article assets before opening browser print dialog", async () => {
    let samePageHrefDuringPrint: string | null = null
    let otherPageHrefDuringPrint: string | null = null
    let imageSrcDuringPrint: string | null = null
    let sourceSrcsetDuringPrint: string | null = null
    const print = vi.fn(() => {
        samePageHrefDuringPrint = document.querySelector<HTMLAnchorElement>("#same-page")?.getAttribute("href") ?? null
        otherPageHrefDuringPrint = document.querySelector<HTMLAnchorElement>("#other-page")?.getAttribute("href") ?? null
        imageSrcDuringPrint = document.querySelector<HTMLImageElement>('img[data-themed-image="true"]')?.getAttribute("src") ?? null
        sourceSrcsetDuringPrint = document.querySelector<HTMLSourceElement>("picture source")?.getAttribute("srcset") ?? null
    })
    vi.stubGlobal("print", print)

    const { container } = render(
        <div data-print-article>
            {/* eslint-disable @next/next/no-html-link-for-pages */}
            <picture>
                <source srcSet="/diagram-dark.png" />
                <img
                    src="/diagram-dark.png"
                    alt="Example"
                    data-themed-image="true"
                    data-dark-src="/diagram-dark.png"
                    data-light-src="/diagram-light.png"
                    data-dark-width="1200"
                    data-dark-height="600"
                    data-light-width="1180"
                    data-light-height="580"
                    width="1200"
                    height="600"
                />
            </picture>
            <a id="same-page" href="/#chapter">Chapter</a>
            <a id="other-page" href="/learn/other">Other lesson</a>
            {/* eslint-enable @next/next/no-html-link-for-pages */}
            <ArticlePrintButton />
        </div>,
    )
    const image = container.querySelector("img") as HTMLImageElement
    Object.defineProperty(image, "complete", { configurable: true, value: true })
    image.decode = vi.fn().mockResolvedValue(undefined)

    fireEvent.click(screen.getByRole("button", { name: "Print / Save PDF" }))

    await waitFor(() => expect(print).toHaveBeenCalledOnce())
    expect(image.loading).toBe("eager")
    expect(image.decode).toHaveBeenCalledOnce()
    expect(samePageHrefDuringPrint).toBe("#chapter")
    expect(otherPageHrefDuringPrint).toBe("http://localhost:3000/learn/other")
    expect(imageSrcDuringPrint).toBe("/diagram-light.png")
    expect(sourceSrcsetDuringPrint).toBe("/diagram-light.png")
    expect(image.getAttribute("src")).toBe("/diagram-dark.png")
    expect(image.getAttribute("width")).toBe("1200")
    expect(image.getAttribute("height")).toBe("600")
    expect(container.querySelector("source")?.getAttribute("srcset")).toBe("/diagram-dark.png")
    expect(container.querySelector<HTMLAnchorElement>("#same-page")?.getAttribute("href")).toBe("/#chapter")
    expect(container.querySelector<HTMLAnchorElement>("#other-page")?.getAttribute("href")).toBe("/learn/other")
    expect(screen.getByRole("button", { name: "Print / Save PDF" })).toBeTruthy()
})
