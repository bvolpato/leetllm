import { NextRequest, NextResponse } from "next/server"
import {
    PersonalizedVizmaticBusyError,
    renderVizmaticSceneSvg,
    validatePersonalizedVizmaticTheme,
    validateVizmaticSceneSpec,
    vizmaticSceneFingerprint,
} from "@/lib/personalization-vizmatic"
import { isSameOrigin } from "@/lib/request-origin"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const PRIVATE_HEADERS = {
    "Cache-Control": "private, no-store, max-age=0",
    Vary: "Cookie, Authorization",
}
const MAX_REQUEST_BYTES = 20 * 1024

function json(error: string, status: number, headers?: HeadersInit) {
    return NextResponse.json({ error }, {
        status,
        headers: { ...PRIVATE_HEADERS, ...headers },
    })
}

function isRenderRequest(value: unknown): value is { spec: unknown; theme: unknown; slug: string } {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false
    const record = value as Record<string, unknown>
    return Object.keys(record).length === 3
        && Object.hasOwn(record, "spec")
        && Object.hasOwn(record, "theme")
        && typeof record.slug === "string"
        && /^[a-z0-9-]{1,200}$/.test(record.slug)
        && validateVizmaticSceneSpec(record.spec)
        && validatePersonalizedVizmaticTheme(record.theme)
}

function cachedLessonContainsScene(markdown: string, spec: unknown) {
    const fingerprint = vizmaticSceneFingerprint(spec)
    for (const match of markdown.matchAll(/```vizmatic[^\n]*\n([\s\S]*?)\n```/g)) {
        try {
            const candidate = JSON.parse(match[1]) as unknown
            if (validateVizmaticSceneSpec(candidate) && vizmaticSceneFingerprint(candidate) === fingerprint) {
                return true
            }
        } catch {
            // Stored malformed blocks are never eligible for rendering.
        }
    }
    return false
}

export async function POST(request: NextRequest) {
    if (!isSameOrigin(request)) return json("Request rejected", 403)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return json("Not authenticated", 401)

    const contentLength = Number(request.headers.get("content-length"))
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
        return json("Invalid visualization", 400)
    }

    let input: unknown
    try {
        const body = await request.text()
        if (new TextEncoder().encode(body).byteLength > MAX_REQUEST_BYTES) {
            return json("Invalid visualization", 400)
        }
        input = JSON.parse(body)
    } catch {
        return json("Invalid visualization", 400)
    }
    if (!isRenderRequest(input)) return json("Invalid visualization", 400)

    const { data: cached, error: cacheError } = await supabase
        .from("user_personalized_lessons")
        .select("markdown")
        .eq("user_id", user.id)
        .eq("article_slug", input.slug)
        .maybeSingle()
    if (cacheError || !cached || !cachedLessonContainsScene(cached.markdown, input.spec)) {
        return json("Visualization unavailable", 403)
    }

    try {
        const svg = await renderVizmaticSceneSvg(input.spec, input.theme, { signal: request.signal })
        return new NextResponse(svg, {
            status: 200,
            headers: {
                ...PRIVATE_HEADERS,
                "Content-Type": "image/svg+xml; charset=utf-8",
                "Content-Disposition": "inline",
                "Content-Security-Policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox",
                "X-Content-Type-Options": "nosniff",
            },
        })
    } catch (error) {
        if (error instanceof PersonalizedVizmaticBusyError) {
            return json("Visualization renderer is busy", 503, { "Retry-After": "1" })
        }
        return json("Could not render visualization", 422)
    }
}
