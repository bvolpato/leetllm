import { NextRequest, NextResponse } from "next/server"
import { CodexPersonalizationError } from "@/lib/codex-personalization"
import { PersonalizationProviderError } from "@/lib/personalization-provider"
import { answerWithLeety, type LeetyMessage } from "@/lib/leety"
import { getLeetyPageContext } from "@/lib/leety-context"
import { getClientIp } from "@/lib/googlebot"
import { isSameOrigin } from "@/lib/request-origin"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PRIVATE_HEADERS = {
    "Cache-Control": "private, no-store, max-age=0, no-transform",
    Vary: "Cookie, Authorization",
}
const MAX_MESSAGES = 24
const MAX_MESSAGE_CHARS = 4_000
const MAX_CONVERSATION_CHARS = 24_000
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_REQUESTS = 3
const REQUEST_CACHE_TTL_MS = 10 * 60_000
const requestBuckets = new Map<string, number[]>()
const requestCache = new Map<string, {
    fingerprint: string
    promise: ReturnType<typeof answerWithLeety>
    expiresAt: number
}>()
let nextBucketSweepAt = 0
let nextRequestCacheSweepAt = 0

function json(body: unknown, init?: ResponseInit) {
    return NextResponse.json(body, {
        ...init,
        headers: { ...PRIVATE_HEADERS, ...init?.headers },
    })
}

function parseMessages(value: unknown): LeetyMessage[] | null {
    if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) return null

    let totalChars = 0
    const messages: LeetyMessage[] = []
    for (const message of value) {
        if (!message || typeof message !== "object" || Array.isArray(message)) return null
        const keys = Object.keys(message)
        if (keys.length !== 2 || !keys.includes("role") || !keys.includes("content")) return null
        const { role, content } = message as { role?: unknown; content?: unknown }
        if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null
        const trimmed = content.trim()
        if (!trimmed || trimmed.length > MAX_MESSAGE_CHARS) return null
        totalChars += trimmed.length
        if (totalChars > MAX_CONVERSATION_CHARS) return null
        messages.push({ role, content: trimmed })
    }

    return messages.at(-1)?.role === "user" ? messages : null
}

function claimRateLimit(userId: string, now = Date.now()) {
    if (now >= nextBucketSweepAt) {
        for (const [id, timestamps] of requestBuckets) {
            if (!timestamps.some((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)) {
                requestBuckets.delete(id)
            }
        }
        nextBucketSweepAt = now + RATE_LIMIT_WINDOW_MS
    }

    const active = (requestBuckets.get(userId) ?? []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)
    if (active.length >= RATE_LIMIT_REQUESTS) {
        requestBuckets.set(userId, active)
        return {
            allowed: false,
            retryAfterSeconds: Math.max(1, Math.ceil((active[0] + RATE_LIMIT_WINDOW_MS - now) / 1_000)),
        }
    }
    active.push(now)
    requestBuckets.set(userId, active)
    return { allowed: true, retryAfterSeconds: 0 }
}

function findCachedRequest(
    userId: string,
    requestId: string,
    fingerprint: string,
    now = Date.now(),
) {
    if (now >= nextRequestCacheSweepAt) {
        for (const [key, request] of requestCache) {
            if (request.expiresAt <= now) requestCache.delete(key)
        }
        nextRequestCacheSweepAt = now + RATE_LIMIT_WINDOW_MS
    }

    const key = `${userId}:${requestId}`
    const existing = requestCache.get(key)
    if (existing && existing.expiresAt > now) {
        return existing.fingerprint === fingerprint
            ? { promise: existing.promise, conflict: false }
            : { promise: null, conflict: true }
    }
    return null
}

function cacheRequest(
    userId: string,
    requestId: string,
    fingerprint: string,
    promise: ReturnType<typeof answerWithLeety>,
    now = Date.now(),
) {
    const key = `${userId}:${requestId}`
    requestCache.set(key, { fingerprint, promise, expiresAt: now + REQUEST_CACHE_TTL_MS })
    void promise.catch(() => {
        if (requestCache.get(key)?.promise === promise) requestCache.delete(key)
    })
}

export async function POST(request: NextRequest) {
    if (!isSameOrigin(request)) return json({ error: "Cross-origin request rejected" }, { status: 403 })

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return json({ error: "Invalid request" }, { status: 400 })
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return json({ error: "Invalid request" }, { status: 400 })
    }
    const keys = Object.keys(body)
    if (
        (keys.length !== 2 && keys.length !== 3)
        || !keys.includes("pathname")
        || !keys.includes("messages")
        || (keys.length === 3 && !keys.includes("requestId"))
    ) {
        return json({ error: "Invalid request" }, { status: 400 })
    }

    const { pathname, messages: rawMessages, requestId } = body as {
        pathname?: unknown
        messages?: unknown
        requestId?: unknown
    }
    if (requestId !== undefined && (typeof requestId !== "string" || !/^[a-zA-Z0-9_-]{16,128}$/.test(requestId))) {
        return json({ error: "Invalid request" }, { status: 400 })
    }
    const context = getLeetyPageContext(pathname)
    if (!context) return json({ error: "Leety is available on lesson and article pages" }, { status: 400 })

    const messages = parseMessages(rawMessages)
    if (!messages) return json({ error: "Invalid conversation" }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user && !context.allowAnonymous) return json({ error: "Not authenticated" }, { status: 401 })

    const principalId = user?.id
        ?? `guest:${getClientIp(request) || "unknown"}:${context.canonicalPath}`
    let answerPromise: ReturnType<typeof answerWithLeety>
    if (requestId) {
        const fingerprint = JSON.stringify({ pathname: context.canonicalPath, messages })
        const cached = findCachedRequest(principalId, requestId, fingerprint)
        if (cached?.conflict) {
            return json({ error: "Request ID was already used for another question" }, { status: 409 })
        }
        if (cached?.promise) {
            answerPromise = cached.promise
        } else {
            const rateLimit = claimRateLimit(principalId)
            if (!rateLimit.allowed) {
                return json(
                    { error: "Leety allows three questions per minute. Try again shortly.", retryable: true },
                    { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
                )
            }
            answerPromise = answerWithLeety(context, messages)
            cacheRequest(principalId, requestId, fingerprint, answerPromise)
        }
    } else {
        const rateLimit = claimRateLimit(principalId)
        if (!rateLimit.allowed) {
            return json(
                { error: "Leety allows three questions per minute. Try again shortly.", retryable: true },
                { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
            )
        }
        answerPromise = answerWithLeety(context, messages)
    }

    try {
        const response = await answerPromise
        return json({ ...response, pageTitle: context.title })
    } catch (error) {
        if (error instanceof CodexPersonalizationError || error instanceof PersonalizationProviderError) {
            return json({ error: error.message, retryable: error.retryable }, { status: error.status })
        }
        return json({ error: "Leety could not answer right now", retryable: true }, { status: 502 })
    }
}
