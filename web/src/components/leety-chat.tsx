"use client"

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { LoaderCircle, LockKeyhole } from "lucide-react"
import { LeetyMark } from "@/components/leety-mark"
import { useIsLoggedIn } from "@/lib/use-is-logged-in"
import { LeetyLauncherPlacement } from "./leety-launcher-placement"
import type { LeetyChat as LeetyChatComponent } from "./leety-chat-experience"

const CHAT_STORAGE_PREFIX = "leetllm:leety:conversation:"
const AUTO_RESUME_MAX_AGE_MS = 10 * 60_000
const LEGACY_TRANSPORT_ERRORS = new Set(["Load failed", "Failed to fetch", "Network request failed"])

type LeetyChatProps = Parameters<typeof LeetyChatComponent>[0]

function supportedContentPath(pathname: string) {
    return /^\/(learn|blog)\/[a-z0-9][a-z0-9-]{0,159}\/?$/.test(pathname)
}

function hasRecoverableConversation(accountId: string, pathname: string) {
    try {
        const stored = JSON.parse(localStorage.getItem(`${CHAT_STORAGE_PREFIX}${accountId}:${pathname}`) ?? "null") as {
            messages?: unknown
            pending?: unknown
        } | null
        if (!stored) return false

        const pending = stored.pending
        if (pending && typeof pending === "object" && !Array.isArray(pending)) {
            const request = pending as { id?: unknown; messages?: unknown; createdAt?: unknown }
            const messages = Array.isArray(request.messages) ? request.messages : []
            const last = messages.at(-1) as { role?: unknown } | undefined
            if (
                typeof request.id === "string"
                && typeof request.createdAt === "number"
                && Date.now() - request.createdAt < AUTO_RESUME_MAX_AGE_MS
                && last?.role === "user"
            ) return true
        }

        const messages = Array.isArray(stored.messages) ? stored.messages : []
        const last = messages.at(-1) as { role?: unknown; refusal?: unknown; content?: unknown } | undefined
        const previous = messages.at(-2) as { role?: unknown } | undefined
        return last?.role === "assistant"
            && last.refusal === true
            && typeof last.content === "string"
            && LEGACY_TRANSPORT_ERRORS.has(last.content.trim())
            && previous?.role === "user"
    } catch {
        return false
    }
}

function Launcher({
    busy = false,
    retry = false,
    compact = false,
    onClick,
}: {
    busy?: boolean
    retry?: boolean
    compact?: boolean
    onClick: () => void
}) {
    return (
        <button
            type="button"
            data-print-hidden
            aria-label={busy ? "Opening Leety" : retry ? "Retry opening Leety" : "Ask Leety about this page"}
            aria-busy={busy || undefined}
            disabled={busy}
            onClick={onClick}
            title={busy ? "Opening Leety" : retry ? "Retry opening Leety" : "Ask Leety about this page"}
            className={compact
                ? "flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-background text-primary shadow-sm hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                : "group fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full border border-primary/30 bg-background/95 p-2 text-primary shadow-xl shadow-primary/20 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:bottom-6 sm:right-6 sm:pr-3"}
        >
            <span className={compact
                ? "grid size-7 place-items-center rounded-full bg-primary/12"
                : "grid size-10 place-items-center rounded-full bg-primary/12 transition group-hover:rotate-3 group-hover:bg-primary/18"}
            >
                {busy
                    ? <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
                    : retry
                        ? <LeetyMark className={compact ? "size-6" : "size-8"} />
                        : <LeetyMark className={compact ? "size-6" : "size-8"} />}
            </span>
            <span className={compact ? "sr-only" : "hidden text-left leading-tight sm:block"}>
                <span className="block text-sm font-semibold text-foreground">Ask Leety</span>
                <span className="block text-[11px] text-muted-foreground">
                    {busy ? "Opening chat…" : retry ? "Try loading again" : "Make this click"}
                </span>
            </span>
        </button>
    )
}

export function LeetyGate() {
    const pathname = usePathname()
    const { user, isLoggedIn, authLoaded } = useIsLoggedIn()
    const [linkAccess, setLinkAccess] = useState<{ pathname: string; allowed: boolean } | null>(null)
    const [ChatExperience, setChatExperience] = useState<ComponentType<LeetyChatProps> | null>(null)
    const [chatRequested, setChatRequested] = useState(false)
    const [initialOpen, setInitialOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadError, setLoadError] = useState(false)
    const loadingRef = useRef(false)

    const accountId = isLoggedIn
        ? user?.id ?? null
        : linkAccess?.pathname === pathname && linkAccess.allowed
            ? "link-guest"
            : null

    const loadChatExperience = useCallback((openAfterLoad: boolean, fromUserAction: boolean) => {
        if (openAfterLoad) {
            setChatRequested(true)
            setInitialOpen(true)
            setLoadError(false)
        }
        if (ChatExperience || loadingRef.current) return

        loadingRef.current = true
        if (fromUserAction) setLoading(true)
        void import("./leety-chat-experience")
            .then(({ LeetyChat }) => {
                setChatExperience(() => LeetyChat)
                setLoadError(false)
            })
            .catch(() => {
                if (fromUserAction) setLoadError(true)
            })
            .finally(() => {
                loadingRef.current = false
                setLoading(false)
            })
    }, [ChatExperience])

    useEffect(() => {
        let active = true
        queueMicrotask(() => {
            if (active) {
                setLinkAccess({
                    pathname,
                    allowed: document.querySelector('[data-leety-access="link"]') !== null,
                })
            }
        })
        return () => {
            active = false
        }
    }, [pathname])

    useEffect(() => {
        if (!authLoaded || !accountId || !supportedContentPath(pathname)) return
        let active = true
        queueMicrotask(() => {
            if (active && hasRecoverableConversation(accountId, pathname)) {
                loadChatExperience(false, false)
            }
        })
        return () => {
            active = false
        }
    }, [accountId, authLoaded, loadChatExperience, pathname])

    const handleInitialOpen = useCallback(() => setInitialOpen(false), [])

    if (!authLoaded || !supportedContentPath(pathname)) return null

    if (!isLoggedIn && linkAccess?.pathname !== pathname) return null
    if (!isLoggedIn && !linkAccess?.allowed) {
        const loginHref = `/login?next=${encodeURIComponent(pathname)}`
        const loginLauncher = (compact: boolean) => (
            <Link
                href={loginHref}
                data-print-hidden
                data-leety-login
                aria-label="Sign in to ask Leety about this page"
                title="Sign in to ask Leety about this page"
                className={compact
                    ? "relative flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    : "group fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full border border-border bg-background/95 p-2 text-muted-foreground shadow-xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:bottom-6 sm:right-6 sm:pr-3"}
            >
                <span className={compact
                    ? "relative grid size-7 place-items-center rounded-full bg-muted"
                    : "relative grid size-10 place-items-center rounded-full bg-muted transition group-hover:bg-primary/10"}
                >
                    <LeetyMark className={compact ? "size-6 opacity-70" : "size-8 opacity-70 transition group-hover:opacity-100"} />
                    <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full border border-background bg-muted-foreground text-background">
                        <LockKeyhole className="size-2.5" />
                    </span>
                </span>
                <span className={compact ? "sr-only" : "hidden text-left leading-tight sm:block"}>
                    <span className="block text-sm font-semibold text-foreground">Ask Leety</span>
                    <span className="block text-[11px]">Sign in to chat</span>
                </span>
            </Link>
        )

        return (
            <LeetyLauncherPlacement fallback={loginLauncher(false)}>
                {loginLauncher(true)}
            </LeetyLauncherPlacement>
        )
    }

    if (!accountId) return null

    if (ChatExperience) {
        return (
            <ChatExperience
                key={`${accountId}:${pathname}`}
                accountId={accountId}
                initialOpen={initialOpen}
                onInitialOpen={handleInitialOpen}
            />
        )
    }

    const launcher = (compact: boolean) => (
        <Launcher
            compact={compact}
            busy={chatRequested && loading}
            retry={chatRequested && loadError}
            onClick={() => loadChatExperience(true, true)}
        />
    )

    return (
        <>
            <LeetyLauncherPlacement fallback={launcher(false)}>
                {launcher(true)}
            </LeetyLauncherPlacement>
            {chatRequested && loadError && (
                <span className="sr-only" role="alert">Leety could not load. You can retry from the Ask Leety button.</span>
            )}
        </>
    )
}
