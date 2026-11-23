import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"
import { ArticleFooterNav } from "./article-footer-nav"

test("ArticleFooterNav gives adjacent titles two lines instead of early truncation", () => {
    const previousTitle =
        "Previous article title with enough detail to explain what came before"
    const nextTitle =
        "Next article title with enough detail to explain what comes after"

    render(
        <ArticleFooterNav
            previous={{ href: "/learn/previous", title: previousTitle }}
            next={{ href: "/learn/next", title: nextTitle }}
        />
    )

    const previous = screen.getByText(previousTitle)
    const next = screen.getByText(nextTitle)

    expect(previous.className).toContain("line-clamp-2")
    expect(previous.className).not.toContain("truncate")
    expect(next.className).toContain("line-clamp-2")
    expect(next.className).not.toContain("truncate")
})
