"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react"

type IllustrationViewerProps = {
    children?: ReactNode
    src: string
    alt: string
    displayWidth?: number | string
    displayHeight?: number | string
    caption?: ReactNode
    onOpen?: () => void
    onClose?: () => void
}

type Dimensions = { width: number; height: number }

function positiveDimension(value: number | string | undefined): number | undefined {
    const parsed = typeof value === "number" ? value : Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function svgDimensions(src: string): Dimensions | undefined {
    if (!src.startsWith("data:image/svg+xml")) return undefined

    try {
        const comma = src.indexOf(",")
        if (comma < 0) return undefined
        const markup = decodeURIComponent(src.slice(comma + 1))
        const attributes = markup.match(/<svg\b([^>]*)>/i)?.[1]
        if (!attributes) return undefined

        const viewBox = attributes.match(/\bviewBox=["']\s*[-+\d.eE]+[\s,]+[-+\d.eE]+[\s,]+([-+\d.eE]+)[\s,]+([-+\d.eE]+)\s*["']/i)
        const width = positiveDimension(attributes.match(/\bwidth=["']\s*([\d.]+)(?:px)?\s*["']/i)?.[1])
            ?? positiveDimension(viewBox?.[1])
        const height = positiveDimension(attributes.match(/\bheight=["']\s*([\d.]+)(?:px)?\s*["']/i)?.[1])
            ?? positiveDimension(viewBox?.[2])
        return width && height ? { width, height } : undefined
    } catch {
        return undefined
    }
}

function imageDisplayScale(src: string) {
    return /\/_generated\/[^/?#]+\.png(?:[?#]|$)/i.test(src) ? 2 : 1
}

export function IllustrationViewer({
    children,
    src,
    alt,
    displayWidth,
    displayHeight,
    caption,
    onOpen,
    onClose,
}: IllustrationViewerProps) {
    const [open, setOpen] = useState(false)
    const [zoom, setZoom] = useState(1)
    const [fitMode, setFitMode] = useState(false)
    const [measuredSize, setMeasuredSize] = useState<Dimensions>()
    const [viewportSize, setViewportSize] = useState<Dimensions>({ width: 0, height: 0 })
    const viewportRef = useRef<HTMLDivElement>(null)
    const vectorSize = svgDimensions(src)

    const width = positiveDimension(displayWidth) ?? vectorSize?.width ?? measuredSize?.width ?? 1080
    const height = positiveDimension(displayHeight) ?? vectorSize?.height ?? measuredSize?.height ?? width * 0.625
    const fitScale = viewportSize.width > 0 && viewportSize.height > 0
        ? Math.max(0.05, Math.min(1, viewportSize.width / width, viewportSize.height / height))
        : 1
    const activeScale = fitMode ? fitScale : zoom
    const renderedWidth = Math.max(1, Math.round(width * activeScale))
    const renderedHeight = Math.max(1, Math.round(height * activeScale))
    const imageFits = renderedWidth <= viewportSize.width && renderedHeight <= viewportSize.height

    const measureViewport = useCallback(() => {
        const viewport = viewportRef.current
        if (!viewport) return
        const rect = viewport.getBoundingClientRect()
        const style = window.getComputedStyle(viewport)
        const inset = (value: string) => Number.parseFloat(value) || 0
        setViewportSize({
            width: Math.max(0, (rect.width || window.innerWidth - 64) - inset(style.paddingLeft) - inset(style.paddingRight)),
            height: Math.max(0, (rect.height || window.innerHeight - 176) - inset(style.paddingTop) - inset(style.paddingBottom)),
        })
    }, [])

    useEffect(() => {
        if (!open) return
        measureViewport()
        // Radix may portal the dialog contents after this effect starts. Measure once more after that mount.
        const measureTimer = window.setTimeout(measureViewport, 0)
        window.addEventListener("resize", measureViewport)
        const viewport = viewportRef.current
        const observer = viewport && typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(measureViewport)
            : null
        if (viewport && observer) observer.observe(viewport)
        return () => {
            window.clearTimeout(measureTimer)
            window.removeEventListener("resize", measureViewport)
            observer?.disconnect()
        }
    }, [measureViewport, open])

    const handleImageLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
        if (positiveDimension(displayWidth) && positiveDimension(displayHeight)) return
        const scale = imageDisplayScale(src)
        setMeasuredSize({
            width: event.currentTarget.naturalWidth / scale,
            height: event.currentTarget.naturalHeight / scale,
        })
    }, [displayHeight, displayWidth, src])

    function updateZoom(nextZoom: number) {
        setFitMode(false)
        setZoom(Math.max(0.25, Math.min(4, Math.round(nextZoom * 100) / 100)))
    }

    function handleOpenChange(nextOpen: boolean) {
        if (nextOpen) {
            setFitMode(false)
            setZoom(1)
            onOpen?.()
        } else {
            onClose?.()
        }
        setOpen(nextOpen)
    }

    const trigger = (
        <span className="my-1 flex w-full justify-end" data-print-hidden>
            <DialogPrimitive.Trigger asChild>
                <button
                    type="button"
                    aria-label={`View larger: ${alt || "illustration"}`}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium [border-color:var(--reading-border)] [color:var(--reading-muted)] transition-colors hover:[background:var(--reading-panel)] hover:[color:var(--reading-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                    View larger
                </button>
            </DialogPrimitive.Trigger>
        </span>
    )

    return (
        <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
            {children}
            {trigger}
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/80" />
                <DialogPrimitive.Content className="fixed inset-2 z-[101] m-0 flex max-h-none max-w-none flex-col overflow-hidden rounded-xl border p-0 text-left shadow-2xl outline-none [background:var(--reading-panel-solid)] [border-color:var(--reading-border)] [color:var(--reading-ink)] sm:inset-4">
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b px-3 py-3 sm:px-5 [border-color:var(--reading-border)]">
                        <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
                            <DialogPrimitive.Title className="text-sm font-semibold [color:var(--reading-heading)]">
                                Figure viewer
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Description className="mt-0.5 text-xs [color:var(--reading-muted)]">
                                Opens at 100%. Use Fit to see the whole figure; scroll or swipe to inspect it at full size.
                            </DialogPrimitive.Description>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5" role="group" aria-label="Figure zoom controls">
                            <button
                                type="button"
                                onClick={() => setFitMode(true)}
                                aria-label="Fit figure to viewer"
                                aria-pressed={fitMode}
                                className="min-h-11 min-w-11 rounded-md border px-2 text-sm font-medium [border-color:var(--reading-border)] [color:var(--reading-ink)] hover:[background:var(--reading-panel)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:min-h-8 sm:min-w-8 sm:text-xs"
                            >
                                Fit
                            </button>
                            <button
                                type="button"
                                onClick={() => { setFitMode(false); setZoom(1) }}
                                aria-label="View figure at 100 percent"
                                aria-pressed={!fitMode && zoom === 1}
                                className="min-h-11 min-w-11 rounded-md border px-2 text-sm font-medium [border-color:var(--reading-border)] [color:var(--reading-ink)] hover:[background:var(--reading-panel)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:min-h-8 sm:min-w-8 sm:text-xs"
                            >
                                100%
                            </button>
                            <button
                                type="button"
                                onClick={() => updateZoom(activeScale / 1.25)}
                                aria-label="Zoom out"
                                className="inline-flex h-11 w-11 items-center justify-center rounded-md border [border-color:var(--reading-border)] [color:var(--reading-ink)] hover:[background:var(--reading-panel)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:h-8 sm:w-8"
                            >
                                <ZoomOut className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <span className="min-w-10 text-center font-mono text-xs tabular-nums [color:var(--reading-muted)]" aria-live="polite">
                                {Math.round(activeScale * 100)}%
                            </span>
                            <button
                                type="button"
                                onClick={() => updateZoom(activeScale * 1.25)}
                                aria-label="Zoom in"
                                className="inline-flex h-11 w-11 items-center justify-center rounded-md border [border-color:var(--reading-border)] [color:var(--reading-ink)] hover:[background:var(--reading-panel)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:h-8 sm:w-8"
                            >
                                <ZoomIn className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <DialogPrimitive.Close asChild>
                                <button
                                    type="button"
                                    aria-label="Close figure viewer"
                                    className="ml-1 inline-flex h-11 w-11 items-center justify-center rounded-md border [border-color:var(--reading-border)] [color:var(--reading-ink)] hover:[background:var(--reading-panel)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:h-8 sm:w-8"
                                >
                                    <span aria-hidden="true" className="text-lg leading-none">×</span>
                                </button>
                            </DialogPrimitive.Close>
                        </div>
                    </header>
                    <div
                        ref={viewportRef}
                        role="region"
                        aria-label={`Scrollable full-size view of ${alt || "illustration"}`}
                        tabIndex={0}
                        className={`flex min-h-0 flex-1 overflow-auto p-3 sm:p-5 ${imageFits ? "items-center justify-center" : "items-start justify-start"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50`}
                    >
                        {/* Use the original source without srcSet so zooming reads the full-resolution asset. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={src}
                            alt={alt}
                            width={renderedWidth}
                            height={renderedHeight}
                            onLoad={handleImageLoad}
                            draggable={false}
                            className="block max-w-none shrink-0"
                            style={{ width: renderedWidth, height: renderedHeight }}
                        />
                    </div>
                    {caption && (
                        <div className="border-t px-3 py-2 text-sm leading-relaxed [border-color:var(--reading-border)] [color:var(--reading-muted)] sm:px-5">
                            {caption}
                        </div>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
