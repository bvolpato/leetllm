"use client"

import { useState } from "react"
import { LoaderCircle, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ASSET_WAIT_MS = 5_000

function nextPaint() {
    return new Promise<void>((resolve) => {
        if (typeof window.requestAnimationFrame !== "function") {
            resolve()
            return
        }
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))
    })
}

async function waitForImage(image: HTMLImageElement) {
    image.loading = "eager"

    if (!image.complete) {
        await new Promise<void>((resolve) => {
            const finish = () => {
                window.clearTimeout(timeout)
                image.removeEventListener("load", finish)
                image.removeEventListener("error", finish)
                resolve()
            }
            const timeout = window.setTimeout(finish, ASSET_WAIT_MS)
            image.addEventListener("load", finish, { once: true })
            image.addEventListener("error", finish, { once: true })
        })
    }

    if (typeof image.decode === "function") {
        await image.decode().catch(() => undefined)
    }
}

async function prepareArticleForPrint() {
    const article = document.querySelector<HTMLElement>("[data-print-article]")
    const images = article ? Array.from(article.querySelectorAll("img")) : []
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts

    await Promise.all([
        fonts?.ready ?? Promise.resolve(),
        ...images.map(waitForImage),
    ])
    await nextPaint()
}

function prepareThemedImagesForPrint() {
    const article = document.querySelector<HTMLElement>("[data-print-article]")
    const originals: Array<{
        image: HTMLImageElement
        source: HTMLSourceElement | null
        src: string | null
        srcset: string | null
        width: string | null
        height: string | null
    }> = []

    for (const image of article?.querySelectorAll<HTMLImageElement>('img[data-themed-image="true"][data-light-src]') ?? []) {
        const lightSrc = image.dataset.lightSrc
        if (!lightSrc) continue

        const source = image.closest("picture")?.querySelector("source") ?? null
        originals.push({
            image,
            source,
            src: image.getAttribute("src"),
            srcset: source?.getAttribute("srcset") ?? null,
            width: image.getAttribute("width"),
            height: image.getAttribute("height"),
        })

        image.setAttribute("src", lightSrc)
        source?.setAttribute("srcset", lightSrc)
        if (image.dataset.lightWidth) image.setAttribute("width", image.dataset.lightWidth)
        if (image.dataset.lightHeight) image.setAttribute("height", image.dataset.lightHeight)
    }

    return () => {
        for (const original of originals) {
            if (original.src === null) original.image.removeAttribute("src")
            else original.image.setAttribute("src", original.src)
            if (original.width === null) original.image.removeAttribute("width")
            else original.image.setAttribute("width", original.width)
            if (original.height === null) original.image.removeAttribute("height")
            else original.image.setAttribute("height", original.height)
            if (original.source) {
                if (original.srcset === null) original.source.removeAttribute("srcset")
                else original.source.setAttribute("srcset", original.srcset)
            }
        }
    }
}

function prepareArticleLinksForPrint() {
    const article = document.querySelector<HTMLElement>("[data-print-article]")
    const currentUrl = new URL(window.location.href)
    const originals: Array<{ link: HTMLAnchorElement; href: string }> = []

    for (const link of article?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []) {
        const href = link.getAttribute("href")
        if (!href) continue

        const resolved = new URL(href, currentUrl)
        if (resolved.protocol !== "http:" && resolved.protocol !== "https:") continue

        const sameDocument = resolved.origin === currentUrl.origin
            && resolved.pathname === currentUrl.pathname
            && resolved.search === currentUrl.search
            && resolved.hash.length > 1

        originals.push({ link, href })
        link.setAttribute("href", sameDocument ? resolved.hash : resolved.href)
    }

    return () => {
        for (const { link, href } of originals) {
            link.setAttribute("href", href)
        }
    }
}

export function ArticlePrintButton({ className }: { className?: string }) {
    const [preparing, setPreparing] = useState(false)

    async function printArticle() {
        setPreparing(true)
        const restoreImages = prepareThemedImagesForPrint()
        try {
            await prepareArticleForPrint()
            const restoreLinks = prepareArticleLinksForPrint()
            try {
                window.print()
            } finally {
                restoreLinks()
            }
        } finally {
            restoreImages()
            setPreparing(false)
        }
    }

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void printArticle()}
            disabled={preparing}
            className={cn("gap-2", className)}
            data-print-hidden
            title="Open browser print dialog, then choose Save as PDF"
        >
            {preparing
                ? <LoaderCircle className="h-4 w-4 animate-spin" />
                : <Printer className="h-4 w-4" />}
            {preparing ? "Preparing PDF" : "Print / Save PDF"}
        </Button>
    )
}
