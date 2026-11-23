import { NextRequest, NextResponse } from "next/server"
import {
    PersonalizationProviderError as GeminiPersonalizationError,
    PERSONALIZATION_MODEL,
    PERSONALIZATION_PROMPT_VERSION,
} from "@/lib/personalization-provider"
import {
    getPersonalizableLesson,
    getPersonalizableLessonSlug,
    parseLessonPersonalizationRequest,
} from "@/lib/personalization-server"
import { isSameOrigin } from "@/lib/request-origin"
import {
    createPersonalizationUsageTracker,
    emitPersonalizationGenerationMetric,
    type PersonalizationUsageMeasurement,
} from "@/lib/personalization-telemetry"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const PRIVATE_HEADERS = {
    "Cache-Control": "private, no-store, max-age=0, no-transform",
    Vary: "Cookie, Authorization",
}
const STREAM_HEARTBEAT = `${" ".repeat(2_048)}\n`

function json(body: unknown, init?: ResponseInit) {
    return NextResponse.json(body, {
        ...init,
        headers: { ...PRIVATE_HEADERS, ...init?.headers },
    })
}

function streamingJson(task: () => Promise<unknown>) {
    const encoder = new TextEncoder()
    let disconnected = false
    let heartbeat: ReturnType<typeof setInterval> | undefined
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            const enqueue = (value: string) => {
                if (disconnected) return
                try {
                    controller.enqueue(encoder.encode(value))
                } catch {
                    disconnected = true
                    if (heartbeat) clearInterval(heartbeat)
                }
            }
            enqueue(STREAM_HEARTBEAT)
            heartbeat = setInterval(() => {
                enqueue(STREAM_HEARTBEAT)
            }, 15_000)
            void task()
                .catch(() => ({ error: "Could not personalize lesson" }))
                .then((body) => {
                    enqueue(JSON.stringify(body))
                })
                .finally(() => {
                    if (heartbeat) clearInterval(heartbeat)
                    if (!disconnected) controller.close()
                })
        },
        cancel() {
            disconnected = true
            if (heartbeat) clearInterval(heartbeat)
        },
    })
    return new NextResponse(stream, {
        status: 200,
        headers: {
            ...PRIVATE_HEADERS,
            "Content-Type": "application/json; charset=utf-8",
            "Content-Encoding": "identity",
            "X-Accel-Buffering": "no",
        },
    })
}

async function authenticatedClient() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return { supabase, user }
}

async function finishUsage(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    usageId: number | string,
    values: {
        status: "succeeded" | "failed"
        duration_ms: number
        input_chars: number
        output_chars?: number
        error_code?: string
        input_tokens?: number
        cached_input_tokens?: number
        output_tokens?: number
        thinking_tokens?: number
        total_tokens?: number
        provider_calls?: number
        estimated_cost_microusd?: number
        pricing_version?: string
        prompt_version?: string
    },
) {
    try {
        const { error } = await supabase
            .from("personalization_generation_usage")
            .update(values)
            .eq("id", usageId)
            .eq("user_id", userId)
        if (error) {
            console.error(JSON.stringify({
                severity: "ERROR",
                message: "Could not persist personalization usage",
                event: "leetllm.personalization.usage_persistence_failed",
                usage_id: usageId,
            }))
        }
    } catch {
        console.error(JSON.stringify({
            severity: "ERROR",
            message: "Could not persist personalization usage",
            event: "leetllm.personalization.usage_persistence_failed",
            usage_id: usageId,
        }))
    }
}

function usageFields(usage: PersonalizationUsageMeasurement) {
    return {
        input_tokens: usage.inputTokens,
        cached_input_tokens: usage.cachedInputTokens,
        output_tokens: usage.outputTokens,
        thinking_tokens: usage.thinkingTokens,
        total_tokens: usage.totalTokens,
        provider_calls: usage.providerCalls,
        ...(usage.estimatedCostMicrousd === null ? {} : {
            estimated_cost_microusd: usage.estimatedCostMicrousd,
        }),
        ...(usage.pricingVersion === null ? {} : { pricing_version: usage.pricingVersion }),
        prompt_version: PERSONALIZATION_PROMPT_VERSION,
    }
}

const PROFILE_COLUMNS = "tone_preset,explanation_level,custom_instructions,learner_context,resume_context,revision"

export async function GET(request: NextRequest) {
    const { supabase, user } = await authenticatedClient()
    if (!user) return json({ error: "Not authenticated" }, { status: 401 })

    const slug = getPersonalizableLessonSlug(request.nextUrl.searchParams.get("slug"))
    if (!slug) return json({ error: "Unknown lesson" }, { status: 400 })

    const { data: profile, error: profileError } = await supabase
        .from("user_personalization_profiles")
        .select(PROFILE_COLUMNS)
        .eq("user_id", user.id)
        .maybeSingle()

    if (profileError) return json({ error: "Could not load personalization profile" }, { status: 500 })
    if (!profile) return json({ profileConfigured: false, personalized: null })

    const lesson = getPersonalizableLesson(slug)
    if (!lesson) return json({ error: "Unknown lesson" }, { status: 400 })

    const { data: personalized, error } = await supabase
        .from("user_personalized_lessons")
        .select("markdown,generated_at")
        .eq("user_id", user.id)
        .eq("article_slug", lesson.slug)
        .eq("source_hash", lesson.sourceHash)
        .eq("profile_revision", profile.revision)
        .eq("model_id", PERSONALIZATION_MODEL)
        .eq("prompt_version", PERSONALIZATION_PROMPT_VERSION)
        .maybeSingle()

    if (error) return json({ error: "Could not load personalized lesson" }, { status: 500 })
    return json({
        profileConfigured: true,
        preset: {
            tone: profile.tone_preset,
            explanationLevel: profile.explanation_level,
        },
        personalized: personalized ? {
            markdown: personalized.markdown,
            generatedAt: personalized.generated_at,
        } : null,
    })
}

export async function POST(request: NextRequest) {
    if (!isSameOrigin(request)) return json({ error: "Cross-origin request rejected" }, { status: 403 })
    const { supabase, user } = await authenticatedClient()
    if (!user) return json({ error: "Not authenticated" }, { status: 401 })

    let parsed
    try {
        parsed = parseLessonPersonalizationRequest(await request.json())
    } catch (error) {
        return json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 })
    }

    const { lesson, regenerate } = parsed
    const { data: profile, error: profileError } = await supabase
        .from("user_personalization_profiles")
        .select(PROFILE_COLUMNS)
        .eq("user_id", user.id)
        .maybeSingle()

    if (profileError) return json({ error: "Could not load personalization profile" }, { status: 500 })
    if (!profile) {
        return json({ error: "Set personalization preferences first", profileRequired: true }, { status: 409 })
    }

    if (!regenerate) {
        const { data: cached, error: cacheError } = await supabase
            .from("user_personalized_lessons")
            .select("markdown,generated_at")
            .eq("user_id", user.id)
            .eq("article_slug", lesson.slug)
            .eq("source_hash", lesson.sourceHash)
            .eq("profile_revision", profile.revision)
            .eq("model_id", PERSONALIZATION_MODEL)
            .eq("prompt_version", PERSONALIZATION_PROMPT_VERSION)
            .maybeSingle()
        if (cacheError) return json({ error: "Could not load personalized lesson" }, { status: 500 })
        if (cached) {
            emitPersonalizationGenerationMetric({
                articleSlug: lesson.slug,
                requestKind: "lesson",
                status: "cached",
                modelId: PERSONALIZATION_MODEL,
                promptVersion: PERSONALIZATION_PROMPT_VERSION,
                durationMs: 0,
                inputChars: lesson.content.length,
                outputChars: cached.markdown.length,
            })
            return json({
                markdown: cached.markdown,
                generatedAt: cached.generated_at,
                cached: true,
                preset: { tone: profile.tone_preset, explanationLevel: profile.explanation_level },
            })
        }
    }

    const { data: usageId, error: quotaError } = await supabase.rpc("claim_personalization_quota", {
        p_article_slug: lesson.slug,
        p_request_kind: "lesson",
        p_model_id: PERSONALIZATION_MODEL,
        p_hourly_limit: 6,
    })
    if (quotaError) return json({ error: "Could not verify personalization quota" }, { status: 500 })
    if (!usageId) {
        return json(
            { error: "Personalization limit reached. Try again in an hour." },
            { status: 429, headers: { "Retry-After": "3600" } },
        )
    }

    const startedAt = Date.now()
    const usageTracker = createPersonalizationUsageTracker()
    return streamingJson(async () => {
        try {
            const { personalizeLessonMarkdown } = await import("@/lib/gemini-personalization")
            const result = await personalizeLessonMarkdown({
                source: lesson.content,
                visuals: lesson.visuals,
                profile: {
                    tonePreset: profile.tone_preset,
                    explanationLevel: profile.explanation_level,
                    customInstructions: profile.custom_instructions,
                    learnerContext: [profile.learner_context, profile.resume_context].filter(Boolean).join("\n\n"),
                },
                onUsage: usageTracker.record,
            })
            const usage = usageTracker.measure(PERSONALIZATION_MODEL)
            const now = new Date().toISOString()
            const { error } = await createAdminClient().from("user_personalized_lessons").upsert({
                user_id: user.id,
                article_slug: lesson.slug,
                source_hash: lesson.sourceHash,
                profile_revision: profile.revision,
                model_id: PERSONALIZATION_MODEL,
                prompt_version: PERSONALIZATION_PROMPT_VERSION,
                markdown: result.markdown,
                generated_at: now,
                updated_at: now,
            }, { onConflict: "user_id,article_slug" })

            if (error) {
                const durationMs = Date.now() - startedAt
                await finishUsage(supabase, user.id, usageId, {
                    status: "failed",
                    duration_ms: durationMs,
                    input_chars: lesson.content.length,
                    output_chars: result.markdown.length,
                    error_code: "storage",
                    ...usageFields(usage),
                })
                emitPersonalizationGenerationMetric({
                    usageId,
                    articleSlug: lesson.slug,
                    requestKind: "lesson",
                    status: "failed",
                    modelId: PERSONALIZATION_MODEL,
                    promptVersion: PERSONALIZATION_PROMPT_VERSION,
                    durationMs,
                    inputChars: lesson.content.length,
                    outputChars: result.markdown.length,
                    usage,
                    errorCode: "storage",
                })
                return { error: "Could not save personalized lesson" }
            }
            const durationMs = Date.now() - startedAt
            await finishUsage(supabase, user.id, usageId, {
                status: "succeeded",
                duration_ms: durationMs,
                input_chars: lesson.content.length,
                output_chars: result.markdown.length,
                ...usageFields(usage),
            })
            emitPersonalizationGenerationMetric({
                usageId,
                articleSlug: lesson.slug,
                requestKind: "lesson",
                status: "succeeded",
                modelId: PERSONALIZATION_MODEL,
                promptVersion: PERSONALIZATION_PROMPT_VERSION,
                durationMs,
                inputChars: lesson.content.length,
                outputChars: result.markdown.length,
                usage,
            })
            return {
                markdown: result.markdown,
                generatedAt: now,
                cached: false,
                preset: { tone: profile.tone_preset, explanationLevel: profile.explanation_level },
            }
        } catch (error) {
            const usage = usageTracker.measure(PERSONALIZATION_MODEL)
            const errorCode = error instanceof GeminiPersonalizationError ? "provider" : "unknown"
            const durationMs = Date.now() - startedAt
            await finishUsage(supabase, user.id, usageId, {
                status: "failed",
                duration_ms: durationMs,
                input_chars: lesson.content.length,
                error_code: errorCode,
                ...usageFields(usage),
            })
            emitPersonalizationGenerationMetric({
                usageId,
                articleSlug: lesson.slug,
                requestKind: "lesson",
                status: "failed",
                modelId: PERSONALIZATION_MODEL,
                promptVersion: PERSONALIZATION_PROMPT_VERSION,
                durationMs,
                inputChars: lesson.content.length,
                usage,
                errorCode,
            })
            if (error instanceof GeminiPersonalizationError) {
                return { error: error.message }
            }
            return { error: "Could not personalize lesson" }
        }
    })
}

export async function DELETE(request: NextRequest) {
    if (!isSameOrigin(request)) return json({ error: "Cross-origin request rejected" }, { status: 403 })
    const { user } = await authenticatedClient()
    if (!user) return json({ error: "Not authenticated" }, { status: 401 })

    const slug = getPersonalizableLessonSlug(request.nextUrl.searchParams.get("slug"))
    if (!slug) return json({ error: "Unknown lesson" }, { status: 400 })
    const { error } = await createAdminClient()
        .from("user_personalized_lessons")
        .delete()
        .eq("user_id", user.id)
        .eq("article_slug", slug)
    if (error) return json({ error: "Could not reset personalized lesson" }, { status: 500 })
    return json({ ok: true })
}
