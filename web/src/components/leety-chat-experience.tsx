"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { usePathname } from "next/navigation"
import ReactMarkdown, { defaultUrlTransform } from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { useTheme } from "next-themes"
import { Check, Copy, ExternalLink, LoaderCircle, RefreshCw, RotateCcw, Send, Sparkles, WifiOff, X } from "lucide-react"
import { DeferredCodeContent } from "./deferred-code-content"
import { resolvePrismLanguage } from "./prism-language"
import { GlossaryTerm } from "@/components/glossary-term"
import { LeetyMark } from "@/components/leety-mark"
import { LeetyLauncherPlacement } from "./leety-launcher-placement"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
    refusal?: boolean
    sources?: Array<{ title: string; url: string }>
}

interface LeetyResponse {
    status?: "answer" | "refusal"
    answer?: string
    sources?: Array<{ title: string; url: string }>
    pageTitle?: string
    error?: string
    retryable?: boolean
}

const CHAT_STORAGE_PREFIX = "leetllm:leety:conversation:"
const AUTO_RESUME_MAX_AGE_MS = 10 * 60_000
const LEGACY_TRANSPORT_ERRORS = new Set(["Load failed", "Failed to fetch", "Network request failed"])
const CODE_FONT_FAMILY = "var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
const LEETY_THINKING_MESSAGES = [
    "Following the token trail…",
    "Consulting the attention heads…",
    "Connecting the clever bits…",
    "Checking the math twice…",
    "Turning page notes into clarity…",
    "Warming up a tiny lightbulb…",
] as const

interface PendingLeetyRequest {
    id: string
    messages: Array<{ role: "user" | "assistant"; content: string }>
    createdAt: number
}

function storageKey(accountId: string, pathname: string) {
    return `${CHAT_STORAGE_PREFIX}${accountId}:${pathname}`
}

function readStoredConversation(accountId: string, pathname: string) {
    try {
        const parsed = JSON.parse(localStorage.getItem(storageKey(accountId, pathname)) ?? "null") as {
            messages?: unknown
            pageTitle?: unknown
            pending?: unknown
        } | null
        if (!parsed || !Array.isArray(parsed.messages)) return { messages: [], pageTitle: null, pending: null }

        const storedMessages = parsed.messages.filter((message): message is ChatMessage => {
            if (!message || typeof message !== "object" || Array.isArray(message)) return false
            const candidate = message as Partial<ChatMessage>
            return typeof candidate.id === "string"
                && (candidate.role === "user" || candidate.role === "assistant")
                && typeof candidate.content === "string"
        }).slice(-24)
        const lastStoredMessage = storedMessages.at(-1)
        const migratedTransportFailure = lastStoredMessage?.role === "assistant"
            && lastStoredMessage.refusal === true
            && LEGACY_TRANSPORT_ERRORS.has(lastStoredMessage.content.trim())
        const messages = migratedTransportFailure ? storedMessages.slice(0, -1) : storedMessages
        const pendingCandidate = parsed.pending && typeof parsed.pending === "object" && !Array.isArray(parsed.pending)
            ? parsed.pending as Partial<PendingLeetyRequest>
            : null
        const pendingMessages = pendingCandidate && Array.isArray(pendingCandidate.messages)
            ? pendingCandidate.messages.filter((message): message is PendingLeetyRequest["messages"][number] => (
                Boolean(message)
                && typeof message === "object"
                && !Array.isArray(message)
                && ((message as { role?: unknown }).role === "user" || (message as { role?: unknown }).role === "assistant")
                && typeof (message as { content?: unknown }).content === "string"
            )).slice(-24)
            : []
        const parsedPending = pendingCandidate
            && typeof pendingCandidate.id === "string"
            && typeof pendingCandidate.createdAt === "number"
            && pendingMessages.length > 0
            && pendingMessages.at(-1)?.role === "user"
            ? { id: pendingCandidate.id, messages: pendingMessages, createdAt: pendingCandidate.createdAt }
            : null
        const pending = parsedPending ?? (migratedTransportFailure && messages.at(-1)?.role === "user"
            ? {
                id: crypto.randomUUID(),
                messages: messages.map(({ role, content }) => ({ role, content })),
                createdAt: Date.now(),
            }
            : null)
        return {
            messages,
            pageTitle: typeof parsed.pageTitle === "string" ? parsed.pageTitle : null,
            pending,
        }
    } catch {
        return { messages: [], pageTitle: null, pending: null }
    }
}

function writeStoredConversation(
    accountId: string,
    pathname: string,
    messages: readonly ChatMessage[],
    pageTitle: string | null,
    pending: PendingLeetyRequest | null,
) {
    try {
        localStorage.setItem(storageKey(accountId, pathname), JSON.stringify({ messages, pageTitle, pending }))
    } catch {}
}

function supportedContentPath(pathname: string) {
    return /^\/(learn|blog)\/[a-z0-9][a-z0-9-]{0,159}\/?$/.test(pathname)
}

function LeetyCodeBlock({ code, language, isDark }: { code: string; language?: string; isDark: boolean }) {
    const [copied, setCopied] = useState(false)
    const highlighterLanguage = language ? resolvePrismLanguage(language) : null

    async function copyCode() {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1_600)
    }

    return (
        <div
            className="my-3 overflow-hidden rounded-lg border border-border bg-background shadow-sm"
            data-leety-code-language={language}
        >
            <div className="flex h-8 items-center border-b border-border bg-muted/60 px-3">
                <span className="min-w-0 flex-1 truncate font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {language ?? "code"}
                </span>
                <button
                    type="button"
                    onClick={() => void copyCode()}
                    aria-label={copied ? "Code copied" : "Copy code"}
                    className="grid size-6 place-items-center rounded text-muted-foreground transition hover:bg-background hover:text-foreground"
                >
                    {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                </button>
            </div>
            <DeferredCodeContent
                code={code}
                language={highlighterLanguage}
                label={language ?? "code"}
                isDark={isDark}
                className="overflow-x-auto p-3.5 text-xs leading-[1.6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
                style={{
                    fontFamily: CODE_FONT_FAMILY,
                    lineHeight: "1.6",
                }}
                codeStyle={{ fontFamily: CODE_FONT_FAMILY }}
            />
        </div>
    )
}

function MessageMarkdown({ children }: { children: string }) {
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme !== "light"

    return (
        <div className="min-w-0 overflow-hidden [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                urlTransform={defaultUrlTransform}
                components={{
                    a: ({ children: linkChildren, href, ...props }) => {
                        const glossaryId = href?.startsWith("/glossary#")
                            ? href.slice("/glossary#".length)
                            : undefined
                        if (glossaryId) {
                            return <GlossaryTerm id={glossaryId}>{linkChildren}</GlossaryTerm>
                        }
                        return (
                            <a
                                {...props}
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-primary underline underline-offset-2"
                            >
                                {linkChildren}
                            </a>
                        )
                    },
                    h1: ({ children: headingChildren }) => <h1 className="mb-2 mt-4 text-base font-bold first:mt-0">{headingChildren}</h1>,
                    h2: ({ children: headingChildren }) => <h2 className="mb-2 mt-4 text-sm font-bold first:mt-0">{headingChildren}</h2>,
                    h3: ({ children: headingChildren }) => <h3 className="mb-1.5 mt-3 text-sm font-semibold first:mt-0">{headingChildren}</h3>,
                    p: ({ children: paragraphChildren }) => <p className="mb-2 last:mb-0">{paragraphChildren}</p>,
                    ul: ({ children: listChildren }) => <ul className="my-2 list-disc space-y-1 pl-5">{listChildren}</ul>,
                    ol: ({ children: listChildren }) => <ol className="my-2 list-decimal space-y-1 pl-5">{listChildren}</ol>,
                    blockquote: ({ children: quoteChildren }) => (
                        <blockquote className="my-2 border-l-2 border-primary/50 pl-3 text-muted-foreground">{quoteChildren}</blockquote>
                    ),
                    table: ({ children: tableChildren }) => (
                        <table className="my-3 block max-w-full overflow-x-auto border-collapse text-xs">{tableChildren}</table>
                    ),
                    th: ({ children: cellChildren }) => <th className="border border-border bg-muted/60 px-2 py-1.5 text-left font-semibold">{cellChildren}</th>,
                    td: ({ children: cellChildren }) => <td className="border border-border px-2 py-1.5 align-top">{cellChildren}</td>,
                    pre: ({ children: preChildren }) => <>{preChildren}</>,
                    code: ({ className, children: codeChildren, node }) => {
                        const language = /language-([^\s]+)/.exec(className ?? "")?.[1]?.toLowerCase()
                        const code = String(codeChildren).replace(/\n$/, "")
                        const isBlock = Boolean(language)
                            || code.includes("\n")
                            || Boolean(node?.position && node.position.start.line !== node.position.end.line)
                        return isBlock
                            ? <LeetyCodeBlock code={code} language={language} isDark={isDark} />
                            : <code className="rounded border border-border bg-background/80 px-1 py-0.5 font-mono text-[0.92em]">{codeChildren}</code>
                    },
                }}
            >
                {children}
            </ReactMarkdown>
        </div>
    )
}

export function LeetyChat({
    accountId,
    initialOpen = false,
    onInitialOpen,
}: {
    accountId: string
    initialOpen?: boolean
    onInitialOpen?: () => void
}) {
    const pathname = usePathname()
    const available = supportedContentPath(pathname)
    const [open, setOpen] = useState(initialOpen)
    const [draft, setDraft] = useState("")
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [thinkingMessageIndex, setThinkingMessageIndex] = useState(
        () => Math.floor(Math.random() * LEETY_THINKING_MESSAGES.length),
    )
    const [pageTitle, setPageTitle] = useState<string | null>(null)
    const [pendingRequest, setPendingRequest] = useState<PendingLeetyRequest | null>(null)
    const [requestError, setRequestError] = useState<string | null>(null)
    const [hydratedPath, setHydratedPath] = useState<string | null>(null)
    const abortRef = useRef<AbortController | null>(null)
    const hydrationDirtyRef = useRef(false)
    const scrollRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (initialOpen) onInitialOpen?.()
    }, [initialOpen, onInitialOpen])

    useEffect(() => {
        hydrationDirtyRef.current = false
        abortRef.current?.abort()
        abortRef.current = null
        const stored = readStoredConversation(accountId, pathname)
        let active = true
        queueMicrotask(() => {
            if (!active) return
            if (!hydrationDirtyRef.current) {
                setMessages(stored.messages)
                setDraft("")
                setLoading(false)
                setPageTitle(stored.pageTitle)
                setPendingRequest(stored.pending)
                setRequestError(stored.pending && Date.now() - stored.pending.createdAt >= AUTO_RESUME_MAX_AGE_MS
                    ? "Your question is saved and ready to resume."
                    : null)
            }
            setHydratedPath(pathname)
        })
        return () => {
            active = false
            abortRef.current?.abort()
            abortRef.current = null
        }
    }, [accountId, pathname])

    useEffect(() => {
        if (hydratedPath !== pathname) return
        writeStoredConversation(accountId, pathname, messages, pageTitle, pendingRequest)
    }, [accountId, hydratedPath, messages, pageTitle, pathname, pendingRequest])

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }, [loading, messages])

    useEffect(() => {
        if (!loading) return
        const interval = window.setInterval(() => {
            setThinkingMessageIndex((current) => (current + 1) % LEETY_THINKING_MESSAGES.length)
        }, 2_600)
        return () => window.clearInterval(interval)
    }, [loading])

    const conversation = useMemo(
        () => messages.map(({ role, content }) => ({ role, content })),
        [messages],
    )

    const sendPendingRequest = useCallback(async (pending: PendingLeetyRequest, requestPath: string) => {
        if (abortRef.current) return

        setThinkingMessageIndex((current) => (current + 1) % LEETY_THINKING_MESSAGES.length)
        setLoading(true)
        setRequestError(null)
        const controller = new AbortController()
        abortRef.current = controller

        try {
            const response = await fetch("/api/leety", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pathname: requestPath,
                    messages: pending.messages,
                    requestId: pending.id,
                }),
                keepalive: true,
                signal: controller.signal,
            })
            const body = await response.json().catch(() => ({})) as LeetyResponse
            if (!response.ok) {
                const error = new Error(body.error || "Leety could not answer right now") as Error & { retryable?: boolean }
                error.retryable = body.retryable === true || response.status === 429 || response.status >= 500
                throw error
            }

            const assistantMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: body.answer || "I could not form an answer from this page.",
                refusal: body.status === "refusal",
                sources: body.sources,
            }
            const nextPageTitle = body.pageTitle ?? null
            setPageTitle(nextPageTitle)
            setMessages((current) => {
                const next = [...current, assistantMessage].slice(-24)
                writeStoredConversation(accountId, requestPath, next, nextPageTitle, null)
                return next
            })
            setPendingRequest(null)
        } catch (error) {
            if (controller.signal.aborted) return
            const retryable = !(error instanceof Error) || (error as Error & { retryable?: boolean }).retryable !== false
            if (retryable) {
                setRequestError("Connection paused. Your question is saved.")
            } else {
                setPendingRequest(null)
                setRequestError(error instanceof Error ? error.message : "Leety could not answer right now")
            }
        } finally {
            if (abortRef.current === controller) {
                abortRef.current = null
                setLoading(false)
            }
        }
    }, [accountId])

    useEffect(() => {
        function resumeStoredRequest() {
            if (document.visibilityState === "hidden" || !navigator.onLine || abortRef.current) return
            const stored = readStoredConversation(accountId, pathname)
            if (!stored.pending || Date.now() - stored.pending.createdAt >= AUTO_RESUME_MAX_AGE_MS) return
            void sendPendingRequest(stored.pending, pathname)
        }

        resumeStoredRequest()
        window.addEventListener("pageshow", resumeStoredRequest)
        window.addEventListener("online", resumeStoredRequest)
        document.addEventListener("visibilitychange", resumeStoredRequest)
        return () => {
            window.removeEventListener("pageshow", resumeStoredRequest)
            window.removeEventListener("online", resumeStoredRequest)
            document.removeEventListener("visibilitychange", resumeStoredRequest)
        }
    }, [accountId, pathname, sendPendingRequest])

    async function submit() {
        const content = draft.trim()
        if (!content || loading || !available) return

        hydrationDirtyRef.current = true
        const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content }
        const nextConversation = [...conversation, { role: "user" as const, content }].slice(-24)
        const nextMessages = [...messages, userMessage].slice(-24)
        const pending: PendingLeetyRequest = {
            id: crypto.randomUUID(),
            messages: nextConversation,
            createdAt: Date.now(),
        }
        setMessages(nextMessages)
        setDraft("")
        setPendingRequest(pending)
        setRequestError(null)
        writeStoredConversation(accountId, pathname, nextMessages, pageTitle, pending)
        void sendPendingRequest(pending, pathname)
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault()
        void submit()
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            void submit()
        }
    }

    function clearConversation() {
        hydrationDirtyRef.current = true
        abortRef.current?.abort()
        abortRef.current = null
        try {
            localStorage.removeItem(storageKey(accountId, pathname))
        } catch {}
        setMessages([])
        setDraft("")
        setLoading(false)
        setPageTitle(null)
        setPendingRequest(null)
        setRequestError(null)
    }

    const launcher = (compact: boolean) => (
        <SheetTrigger asChild>
            <button
                type="button"
                data-print-hidden
                aria-label="Ask Leety about this page"
                title="Ask Leety about this page"
                className={compact
                    ? "flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-background text-primary shadow-sm hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    : "group fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full border border-primary/30 bg-background/95 p-2 text-primary shadow-xl shadow-primary/20 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:bottom-6 sm:right-6 sm:pr-3"}
            >
                <span className={compact
                    ? "grid size-7 place-items-center rounded-full bg-primary/12"
                    : "grid size-10 place-items-center rounded-full bg-primary/12 transition group-hover:rotate-3 group-hover:bg-primary/18"}
                >
                    <LeetyMark className={compact ? "size-6" : "size-8"} />
                </span>
                <span className={compact ? "sr-only" : "hidden text-left leading-tight sm:block"}>
                    <span className="block text-sm font-semibold text-foreground">Ask Leety</span>
                    <span className="block text-[11px] text-muted-foreground">{available ? "Make this click" : "Open a lesson"}</span>
                </span>
            </button>
        </SheetTrigger>
    )

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <LeetyLauncherPlacement fallback={launcher(false)}>
                {launcher(true)}
            </LeetyLauncherPlacement>
            <SheetContent
                data-print-hidden
                className="w-full gap-0 border-l border-primary/15 p-0 sm:max-w-[440px]"
                showCloseButton={false}
                onOverlayClick={() => setOpen(false)}
            >
                <SheetHeader className="border-b border-border/70 bg-gradient-to-br from-primary/10 via-background to-background px-5 py-4 text-left">
                    <div className="flex items-center gap-3">
                        <div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-sm">
                            <LeetyMark className="size-9" />
                        </div>
                        <div className="min-w-0">
                            <SheetTitle className="flex items-center gap-2 text-base">
                                Leety
                                <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">study buddy</span>
                            </SheetTitle>
                            <SheetDescription className="truncate text-xs">
                                {pageTitle ?? (available ? "Turn hard ideas into working intuition" : "Open a lesson or article to begin")}
                            </SheetDescription>
                        </div>
                        <div className="ml-auto flex shrink-0 items-center gap-1">
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                disabled={messages.length === 0 && !loading}
                                onClick={clearConversation}
                                aria-label="Start a new Leety conversation"
                                title="Start over"
                                className="size-8 rounded-lg"
                            >
                                <RotateCcw className="size-4" />
                            </Button>
                            <SheetClose asChild>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    aria-label="Close Leety"
                                    title="Close"
                                    className="size-8 rounded-lg"
                                >
                                    <X className="size-4" />
                                </Button>
                            </SheetClose>
                        </div>
                    </div>
                </SheetHeader>

                <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
                    {messages.length === 0 && (
                        <div className="mx-auto mt-8 max-w-xs text-center">
                            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl border border-primary/20 bg-primary/8 text-primary">
                                <LeetyMark className="size-12" />
                            </div>
                            <h2 className="font-semibold text-foreground">
                                {available ? "Turn the hard part into your advantage" : "Find something to study"}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                {available
                                    ? "Pull apart a diagram, trace an equation, pressure-test a claim, or ask for the missing intuition."
                                    : "Leety appears for signed-in readers and answers from lesson or article Markdown."}
                            </p>
                            {available && (
                                <div className="mt-5 flex flex-wrap justify-center gap-2">
                                    {["Walk me through the hardest part", "Connect this to a real system", "Challenge my understanding"].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            onClick={() => setDraft(suggestion)}
                                            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            data-leety-message={message.role}
                            data-leety-refusal={message.refusal ? "true" : undefined}
                            className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                        >
                            <div className={cn(
                                "max-w-[88%] rounded-2xl px-3.5 py-3 text-sm leading-6 shadow-sm",
                                message.role === "user"
                                    ? "rounded-br-md bg-primary text-primary-foreground"
                                    : message.refusal
                                        ? "rounded-bl-md border border-amber-500/25 bg-amber-500/8 text-foreground"
                                        : "rounded-bl-md border border-border bg-card text-foreground",
                            )}>
                                {message.role === "assistant" ? <MessageMarkdown>{message.content}</MessageMarkdown> : message.content}
                                {message.sources && message.sources.length > 0 && (
                                    <div className="mt-3 border-t border-border/60 pt-2.5">
                                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sources</p>
                                        <ul className="space-y-1.5">
                                            {message.sources.map((source) => (
                                                <li key={source.url}>
                                                    <a href={source.url} target="_blank" rel="noreferrer" className="flex items-start gap-1.5 text-xs text-primary hover:underline">
                                                        <ExternalLink className="mt-0.5 size-3 shrink-0" />
                                                        <span>{source.title}</span>
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div
                                role="status"
                                aria-live="polite"
                                className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-card px-3.5 py-3 text-sm text-muted-foreground"
                            >
                                <span className="sr-only">Leety is preparing an answer.</span>
                                <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-primary" />
                                <span
                                    key={thinkingMessageIndex}
                                    aria-hidden="true"
                                    className="animate-in fade-in duration-300"
                                >
                                    {LEETY_THINKING_MESSAGES[thinkingMessageIndex]}
                                </span>
                            </div>
                        </div>
                    )}

                    {pendingRequest && !loading && (
                        <div className="flex justify-start">
                            <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-primary/20 bg-primary/5 px-3.5 py-3 text-sm text-foreground">
                                <div className="flex items-start gap-2.5">
                                    <WifiOff className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                                    <div>
                                        <p>{requestError ?? "Your question is saved."}</p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="mt-2 h-7 gap-1.5 rounded-lg text-xs"
                                            onClick={() => void sendPendingRequest(pendingRequest, pathname)}
                                        >
                                            <RefreshCw className="size-3" /> Resume answer
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!pendingRequest && requestError && !loading && (
                        <div className="text-center text-xs text-destructive" role="alert">{requestError}</div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="border-t border-border/70 bg-background p-3.5">
                    <div className="flex items-end gap-2 rounded-2xl border border-border bg-card/60 p-2 transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
                        <textarea
                            value={draft}
                            onChange={(event) => setDraft(event.target.value.slice(0, 4_000))}
                            onKeyDown={handleKeyDown}
                            disabled={!available || loading}
                            rows={1}
                            aria-label="Ask Leety"
                            placeholder={available ? "Ask about this page…" : "Open a lesson or article first"}
                            className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!available || loading || !draft.trim()}
                            aria-label="Send question"
                            className="size-9 shrink-0 rounded-xl"
                        >
                            {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                        </Button>
                    </div>
                    <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground/75">
                        <Sparkles className="size-3" /> Ask why, compare tradeoffs, or request a checkpoint.
                    </p>
                </form>
            </SheetContent>
        </Sheet>
    )
}
