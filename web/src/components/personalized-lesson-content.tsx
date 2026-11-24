"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { LoaderCircle, RefreshCw, RotateCcw, Sparkles, Trash2, WandSparkles } from "lucide-react"
import { useCallback, useEffect, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { useIsLoggedIn } from "@/lib/use-is-logged-in"

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
    const { user, isLoggedIn, authLoaded } = useIsLoggedIn()
    const userId = isLoggedIn ? user?.id ?? null : null
    const identityKey = userId ?? "anonymous"

    return (
        <PersonalizedLessonContentState
            key={`${identityKey}:${slug}`}
            slug={slug}
            content={content}
            canonicalContent={canonicalContent ?? children}
            userId={userId}
            authLoaded={authLoaded}
        />
    )
}

function PersonalizedLessonContentState({
    slug,
    content,
    canonicalContent,
    userId,
    authLoaded,
}: {
    slug: string
    content?: string
    canonicalContent?: ReactNode
    userId: string | null
    authLoaded: boolean
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
    const loginHref = `/login?next=${encodeURIComponent(`/learn/${slug}`)}`

    return (
        <>
            <div data-print-hidden className="reader-prose-block mb-7 rounded-xl border border-primary/20 bg-primary/[0.045] p-3.5 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-0.5 rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary">
                            <WandSparkles className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold [color:var(--reading-heading)]">Personalize this lesson</p>
                            <p className="mt-0.5 text-xs leading-relaxed [color:var(--reading-subtle)]">
                                {personalized
                                    ? `Saved version uses ${presetLabel(preset)}. Explanations and teaching visuals adapt while facts stay fixed.`
                                    : "Adapt explanations and teaching visuals to your background and preferred voice."}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {visibleAuthStatus === "loading" ? (
                            <Button type="button" variant="outline" size="sm" disabled>
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                Loading
                            </Button>
                        ) : visibleAuthStatus === "anonymous" ? (
                            <Button asChild variant="outline" size="sm">
                                <Link href={loginHref}><Sparkles className="h-3.5 w-3.5" /> Sign in to personalize</Link>
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
                                <Link href="/settings/personalization"><Sparkles className="h-3.5 w-3.5" /> Set preferences</Link>
                            </Button>
                        ) : personalized ? (
                            <>
                                <Button
                                    type="button"
                                    variant={mode === "original" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setMode("original")}
                                    disabled={loading}
                                >
                                    <RotateCcw className="h-3.5 w-3.5" /> Original
                                </Button>
                                <Button
                                    type="button"
                                    variant={mode === "personalized" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setMode("personalized")}
                                    disabled={loading}
                                >
                                    <Sparkles className="h-3.5 w-3.5" /> Personalized
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    aria-label="Regenerate personalized lesson"
                                    title="Regenerate"
                                    onClick={() => void generate(true)}
                                    disabled={loading}
                                >
                                    {loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Delete personalized lesson"
                                    title="Delete personalized version"
                                    onClick={() => void removePersonalized()}
                                    disabled={loading}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </>
                        ) : (
                            <Button type="button" size="sm" onClick={() => void generate(false)} disabled={loading}>
                                {loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <WandSparkles className="h-3.5 w-3.5" />}
                                {loading ? "Personalizing…" : "Personalize"}
                            </Button>
                        )}
                    </div>
                </div>
                {error && (
                    <p role="alert" className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                        {error}
                    </p>
                )}
            </div>
            {showPersonalized && personalized ? (
                <DynamicMarkdownRenderer
                    content={personalized}
                    showTableOfContents
                    personalizationSlug={slug}
                />
            ) : canonicalContent !== undefined ? (
                canonicalContent
            ) : content !== undefined ? (
                <DynamicMarkdownRenderer
                    content={content}
                    showTableOfContents
                />
            ) : null}
        </>
    )
}
