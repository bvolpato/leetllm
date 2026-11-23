import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { expect, test, vi } from "vitest"
import { LeetyLauncherPlacement } from "./leety-launcher-placement"

test("places the compact launcher in the persistent host and keeps it focusable", async () => {
    const onClick = vi.fn()
    render(
        <>
            <div id="leety-launcher-host" />
            <LeetyLauncherPlacement fallback={<button className="fixed bottom-5">Launcher</button>}>
                <button type="button" aria-label="Ask Leety about this page" onClick={onClick}>
                    Ask Leety
                </button>
            </LeetyLauncherPlacement>
        </>,
    )

    const launcher = await screen.findByRole("button", { name: "Ask Leety about this page" })
    await waitFor(() => expect(document.querySelector("#leety-launcher-host")?.contains(launcher)).toBe(true))

    launcher.focus()
    expect(document.activeElement).toBe(launcher)
    fireEvent.click(launcher)
    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.queryByText("Launcher")).toBeNull()
})

test("keeps the floating launcher when the persistent header host is absent", () => {
    render(
        <LeetyLauncherPlacement fallback={<button className="fixed bottom-5">Fallback launcher</button>}>
            <button type="button">Header launcher</button>
        </LeetyLauncherPlacement>,
    )

    expect(screen.getByRole("button", { name: "Fallback launcher" }).className).toContain("fixed")
    expect(screen.queryByRole("button", { name: "Header launcher" })).toBeNull()
})
