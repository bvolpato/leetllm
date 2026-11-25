"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { Clock, LoaderCircle, RefreshCw, RotateCcw, Sparkles, Trash2, WandSparkles } from "lucide-react"
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react"
import { Button } from "@/components/ui/button"
import { useIsLoggedIn } from "@/lib/use-is-logged-in"

function formatReadingMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainder = minutes % 60
    return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`
}

const DynamicMarkdownRenderer = dynamic(
    () => import("./markdown-renderer").then((mod) => mod.MarkdownRenderer),
    {
        loading: () => (
            <div className="reader-prose-block py-6 text-sm [color:var(--reading-muted)]">
                Loading personalized lesson...
            </div>
        ),
    },
)

interface PersonalizedPayload {
    profileConfigured?: boolean
    personalized?: { markdown: string; generatedAt: string } | null
    markdown?: string
    generatedAt?: string
    preset?: { tone: string; explanationLevel: string }
    error?: string
    profileRequired?: boolean
}

function presetLabel(preset?: PersonalizedPayload["preset"]) {
    if (!preset) return "your saved style"
    const values = [
        preset.tone === "clear" ? null : preset.tone === "cowboy" ? "Cowboy" : preset.tone,
        preset.explanationLevel === "balanced"
            ? null
            : preset.explanationLevel === "eli5"
                ? "ELI5"
                : preset.explanationLevel,
    ].filter(Boolean)
    return values.length > 0 ? values.join(" + ") : "your saved style"
}

interface ArticleReaderContextValue {
    slug: string
    activeTimeEstimate: number
    visibleAuthStatus: "loading" | "authenticated" | "anonymous" | "unavailable"
    personalized: string | null
    profileConfigured: boolean | null
    preset: PersonalizedPayload["preset"]
    mode: "original" | "personalized"
    setMode: (next: "original" | "personalized") => void
    loading: boolean
    error: string
    showPersonalized: boolean
    generate: (regenerate: boolean) => Promise<void>
    removePersonalized: () => Promise<void>
}

const ArticleReaderContext = createContext<ArticleReaderContextValue | null>(null)

function useArticleReaderContext() {
    const context = useContext(ArticleReaderContext)
    if (!context) {
        throw new Error("ArticleReader components must be used inside ArticleReaderProvider")
    }
    return context
}

export function ArticleReaderProvider({
    slug,
    readerTimeEstimate,
    children,
}: {
    slug: string
    readerTimeEstimate: number
    children: ReactNode
}) {
    const { user, isLoggedIn, authLoaded } = useIsLoggedIn()
    const userId = isLoggedIn ? user?.id ?? null : null
    const identityKey = userId ?? "anonymous"

    return (
        <ArticleReaderProviderState
            key={`${identityKey}:${slug}`}
            slug={slug}
            readerTimeEstimate={readerTimeEstimate}
            userId={userId}
            authLoaded={authLoaded}
        >
            {children}
        </ArticleReaderProviderState>
    )
}

function ArticleReaderProviderState({
    slug,
    readerTimeEstimate,
    userId,
    authLoaded,
    children,
}: {
    slug: string
    readerTimeEstimate: number
    userId: string | null
    authLoaded: boolean
    children: ReactNode
}) {
    const [authStatus, setAuthStatus] = useState<"loading" | "authenticated" | "anonymous" | "unavailable">("loading")
    const [personalized, setPersonalized] = useState<string | null>(null)
    const [profileConfigured, setProfileConfigured] = useState<boolean | null>(null)
    const [preset, setPreset] = useState<PersonalizedPayload["preset"]>()
    const [mode, setMode] = useState<"original" | "personalized">("original")
    const [loading, setLoading] = useState(Boolean(authLoaded && userId))
    const [error, setError] = useState("")

    useEffect(() => {
        if (!authLoaded || !userId) return

        const controller = new AbortController()
        fetch(`/api/personalization/lesson?slug=${encodeURIComponent(slug)}`, {
            cache: "no-store",
            signal: controller.signal,
        })
            .then(async (response) => {
                const payload = await response.json() as PersonalizedPayload
                if (response.status === 401) {
                    setAuthStatus("anonymous")
                    return
                }
                setAuthStatus("authenticated")
                if (!response.ok) throw new Error(payload.error ?? "Could not load personalization")
                setProfileConfigured(payload.profileConfigured === true)
                setPreset(payload.preset)
                if (payload.personalized?.markdown) {
                    setPersonalized(payload.personalized.markdown)
                    setMode("personalized")
                }
            })
            .catch((loadError) => {
                if (loadError instanceof Error && loadError.name !== "AbortError") {
                    setAuthStatus("unavailable")
                    setError(loadError.message)
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false)
            })

        return () => controller.abort()
    }, [authLoaded, slug, userId])

    const generate = useCallback(async (regenerate: boolean) => {
        if (!authLoaded || !userId) return
        setLoading(true)
        setError("")
        try {
            const response = await fetch("/api/personalization/lesson", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug, regenerate }),
            })
            const payload = await response.json() as PersonalizedPayload
            if (!response.ok || payload.error) {
                if (response.status === 401) setAuthStatus("anonymous")
                if (payload.profileRequired) setProfileConfigured(false)
                throw new Error(payload.error ?? "Could not personalize lesson")
            }
            if (!payload.markdown) throw new Error("Personalization returned no lesson")
            setPersonalized(payload.markdown)
            setPreset(payload.preset)
            setProfileConfigured(true)
            setMode("personalized")
        } catch (generationError) {
            setError(generationError instanceof Error ? generationError.message : "Could not personalize lesson")
        } finally {
            setLoading(false)
        }
    }, [authLoaded, slug, userId])

    const removePersonalized = useCallback(async () => {
        if (!authLoaded || !userId) return
        setLoading(true)
        setError("")
        try {
            const response = await fetch(`/api/personalization/lesson?slug=${encodeURIComponent(slug)}`, {
                method: "DELETE",
            })
            const payload = await response.json() as PersonalizedPayload
            if (!response.ok) {
                if (response.status === 401) setAuthStatus("anonymous")
                throw new Error(payload.error ?? "Could not remove personalized lesson")
            }
            setPersonalized(null)
            setMode("original")
        } catch (removeError) {
            setError(removeError instanceof Error ? removeError.message : "Could not remove personalized lesson")
        } finally {
            setLoading(false)
        }
    }, [authLoaded, slug, userId])

    const visibleAuthStatus = !authLoaded ? "loading" : !userId ? "anonymous" : authStatus
    const showPersonalized = visibleAuthStatus === "authenticated" && mode === "personalized" && Boolean(personalized)

    return (
        <ArticleReaderContext.Provider
            value={{
                slug,
                activeTimeEstimate: readerTimeEstimate,
                visibleAuthStatus,
                personalized,
                profileConfigured,
                preset,
                mode,
                setMode,
                loading,
                error,
                showPersonalized,
                generate,
                removePersonalized,
            }}
        >
            {children}
        </ArticleReaderContext.Provider>
    )
}

export function ArticleReadingTime() {
    const { activeTimeEstimate } = useArticleReaderContext()
    return (
        <span className="inline-flex items-center gap-1.5 text-sm [color:var(--reading-subtle)]">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {formatReadingMinutes(activeTimeEstimate)} read
        </span>
    )
}

export function PersonalizeToolbarPopover({ align = "right" }: { align?: "left" | "right" }) {
    const {
        slug,
        visibleAuthStatus,
        personalized,
        profileConfigured,
        preset,
        mode,
        setMode,
        loading,
        error,
        showPersonalized,
        generate,
        removePersonalized,
    } = useArticleReaderContext()
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const loginHref = `/login?next=${encodeURIComponent(`/learn/${slug}`)}`

    useEffect(() => {
        if (!open) return

        function handlePointerDown(event: MouseEvent) {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false)
        }

        document.addEventListener("mousedown", handlePointerDown)
        window.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("mousedown", handlePointerDown)
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [open])

    return (
        <div ref={containerRef} data-print-hidden className="relative inline-flex flex-wrap items-center gap-1.5">
            {visibleAuthStatus === "authenticated" && personalized && (
                <div
                    role="group"
                    aria-label="Lesson version"
                    className="inline-flex items-center rounded-full border [border-color:var(--reading-border)] [background:var(--reading-panel-solid)] p-0.5 text-xs shadow-xs"
                >
                    <button
                        type="button"
                        aria-pressed={mode === "original"}
                        onClick={() => setMode("original")}
                        disabled={loading}
                        className={[
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                            mode === "original"
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "[color:var(--reading-muted)] hover:[color:var(--reading-heading)]",
                        ].join(" ")}
                    >
                        <RotateCcw className="h-3 w-3" aria-hidden="true" />
                        Original
                    </button>
                    <button
                        type="button"
                        aria-pressed={mode === "personalized"}
                        onClick={() => setMode("personalized")}
                        disabled={loading}
                        className={[
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                            mode === "personalized"
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "[color:var(--reading-muted)] hover:[color:var(--reading-heading)]",
                        ].join(" ")}
                    >
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        Personalized
                    </button>
                </div>
            )}
            <Button
                type="button"
                variant="outline"
                size="sm"
                aria-expanded={open}
                aria-haspopup="dialog"
                onClick={() => setOpen((current) => !current)}
                className={showPersonalized
                    ? "gap-1.5 border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
                    : "gap-1.5 border-[color:var(--reading-border)] [color:var(--reading-muted)] hover:[color:var(--reading-heading)]"}
                title="Personalize this lesson"
            >
                {loading ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                    <WandSparkles className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{showPersonalized ? "Personalization" : "Personalize"}</span>
            </Button>

            {open && (
                <div
                    role="dialog"
                    aria-label="Personalize this lesson"
                    className={[
                        "absolute top-full z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border [border-color:var(--reading-border)] [background:var(--reading-panel-solid)] p-4 text-left shadow-xl shadow-black/20",
                        align === "left" ? "left-0" : "right-0",
                    ].join(" ")}
                >
                    <p className="text-sm font-semibold [color:var(--reading-heading)]">
                        Personalize this lesson
                    </p>
                    <p className="mt-1 text-xs leading-relaxed [color:var(--reading-subtle)]">
                        {personalized
                            ? `Saved version uses ${presetLabel(preset)}. Explanations and teaching visuals adapt while facts stay fixed.`
                            : "Adapt explanations and teaching visuals to your background and preferred voice."}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {visibleAuthStatus === "loading" ? (
                            <Button type="button" variant="outline" size="sm" disabled>
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                Loading
                            </Button>
                        ) : visibleAuthStatus === "anonymous" ? (
                            <Button asChild variant="outline" size="sm">
                                <Link href={loginHref}>
                                    <Sparkles className="h-3.5 w-3.5" /> Sign in to personalize
                                </Link>
                            </Button>
                        ) : visibleAuthStatus === "unavailable" ? (
                            <Button type="button" variant="outline" size="sm" disabled>
                                <WandSparkles className="h-3.5 w-3.5" /> Personalization unavailable
                            </Button>
                        ) : loading && profileConfigured === null ? (
                            <Button type="button" variant="outline" size="sm" disabled>
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                Loading
                            </Button>
                        ) : profileConfigured === false ? (
                            <Button asChild variant="outline" size="sm">
                                <Link href="/settings/personalization">
                                    <Sparkles className="h-3.5 w-3.5" /> Set preferences
                                </Link>
                            </Button>
                        ) : personalized ? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    aria-label="Regenerate personalized lesson"
                                    title="Regenerate"
                                    onClick={() => void generate(true)}
                                    disabled={loading}
                                >
                                    {loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                    Regenerate
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Delete personalized lesson"
                                    title="Delete personalized version"
                                    onClick={() => void removePersonalized()}
                                    disabled={loading}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                </Button>
                            </>
                        ) : (
                            <Button type="button" size="sm" onClick={() => void generate(false)} disabled={loading}>
                                {loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <WandSparkles className="h-3.5 w-3.5" />}
                                {loading ? "Personalizing..." : "Generate personalized lesson"}
                            </Button>
                        )}
                    </div>

                    {error && (
                        <p role="alert" className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                            {error}
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

export function ArticleReaderBody({
    readerContent,
    fallbackMarkdown,
    hideInlineTocOnDesktop = true,
}: {
    readerContent?: ReactNode
    fallbackMarkdown?: string
    hideInlineTocOnDesktop?: boolean
}) {
    const { slug, showPersonalized, personalized, error } = useArticleReaderContext()

    return (
        <>
            {error && (
                <p role="alert" data-print-hidden className="reader-prose-block mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive">
                    {error}
                </p>
            )}
            {showPersonalized && personalized ? (
                <DynamicMarkdownRenderer
                    content={personalized}
                    showTableOfContents
                    hideInlineTocOnDesktop={hideInlineTocOnDesktop}
                    personalizationSlug={slug}
                />
            ) : readerContent !== undefined ? (
                readerContent
            ) : fallbackMarkdown !== undefined ? (
                <DynamicMarkdownRenderer
                    content={fallbackMarkdown}
                    showTableOfContents
                    hideInlineTocOnDesktop={hideInlineTocOnDesktop}
                />
            ) : null}
        </>
    )
}

export function PersonalizedLessonContent({
    slug,
    content,
    canonicalContent,
    children,
}: {
    slug: string
    content?: string
    canonicalContent?: ReactNode
    children?: ReactNode
}) {
    return (
        <ArticleReaderProvider slug={slug} readerTimeEstimate={10}>
            <div data-print-hidden className="reader-prose-block mb-4 flex items-center justify-end">
                <PersonalizeToolbarPopover />
            </div>
            <ArticleReaderBody
                readerContent={canonicalContent ?? children}
                fallbackMarkdown={content}
                hideInlineTocOnDesktop={false}
            />
        </ArticleReaderProvider>
    )
}
