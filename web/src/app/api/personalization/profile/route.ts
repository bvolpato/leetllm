import { NextRequest, NextResponse } from "next/server"
import {
    PersonalizationProviderError as GeminiPersonalizationError,
    PERSONALIZATION_MODEL,
} from "@/lib/personalization-provider"
import {
    isUploadedFile,
    toPersonalizationProfile,
    validatePersonalizationProfileInput,
    validateResumeContext,
    validateResumeUpload,
} from "@/lib/personalization-profile"
import { isSameOrigin } from "@/lib/request-origin"
import {
    createPersonalizationUsageTracker,
    emitPersonalizationGenerationMetric,
    type PersonalizationUsageMeasurement,
} from "@/lib/personalization-telemetry"
import { createClient } from "@/lib/supabase/server"

const PROFILE_COLUMNS = "tone_preset,explanation_level,custom_instructions,learner_context,resume_context,resume_filename,resume_updated_at,revision,updated_at"
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" }
const MAX_PROFILE_REQUEST_BYTES = 5 * 1024 * 1024 + 64 * 1024

function json(body: unknown, status = 200) {
    return NextResponse.json(body, { status, headers: PRIVATE_HEADERS })
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
    }
}

function requiredString(formData: FormData, key: string): string {
    const value = formData.get(key)
    if (typeof value !== "string") throw new Error(`${key} is required`)
    return value
}

function readProfileInput(formData: FormData) {
    const clearResumeContext = requiredString(formData, "clearResumeContext")
    if (clearResumeContext !== "true" && clearResumeContext !== "false") throw new Error("Invalid resume context action")
    return validatePersonalizationProfileInput({
        tone: requiredString(formData, "tone"),
        explanationLevel: requiredString(formData, "explanationLevel"),
        customInstructions: requiredString(formData, "customInstructions"),
        learnerContext: requiredString(formData, "learnerContext"),
        clearResumeContext: clearResumeContext === "true",
    })
}

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return json({ error: "Not authenticated" }, 401)

    const { data, error } = await supabase
        .from("user_personalization_profiles")
        .select(PROFILE_COLUMNS)
        .eq("user_id", user.id)
        .maybeSingle()
    if (error) return json({ error: "Could not load personalization profile" }, 500)

    try {
        return json({ profile: toPersonalizationProfile(data) })
    } catch {
        return json({ error: "Stored personalization profile is invalid" }, 500)
    }
}

export async function PUT(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return json({ error: "Not authenticated" }, 401)
    if (!isSameOrigin(request)) return json({ error: "Cross-origin request rejected" }, 403)
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
        return json({ error: "Content-Type must be multipart/form-data" }, 415)
    }
    const contentLength = Number(request.headers.get("content-length"))
    if (Number.isFinite(contentLength) && contentLength > MAX_PROFILE_REQUEST_BYTES) {
        return json({ error: "Personalization profile request is too large" }, 413)
    }

    let formData: FormData
    let input: ReturnType<typeof readProfileInput>
    try {
        formData = await request.formData()
        input = readProfileInput(formData)
    } catch (error) {
        return json({ error: error instanceof Error ? error.message : "Invalid personalization profile" }, 400)
    }

    const resumeEntry = formData.get("resume")
    if (resumeEntry !== null && !isUploadedFile(resumeEntry)) return json({ error: "Invalid resume upload" }, 400)
    if (resumeEntry && input.clearResumeContext) return json({ error: "Cannot upload and clear resume context together" }, 400)

    const currentResult = await supabase
        .from("user_personalization_profiles")
        .select(PROFILE_COLUMNS)
        .eq("user_id", user.id)
        .maybeSingle()
    if (currentResult.error) return json({ error: "Could not load personalization profile" }, 500)

    let current
    try {
        current = toPersonalizationProfile(currentResult.data)
    } catch {
        return json({ error: "Stored personalization profile is invalid" }, 500)
    }
    let resumeContext = input.clearResumeContext ? "" : current.resumeContext
    let resumeFileName = input.clearResumeContext ? null : current.resumeFileName
    let resumeUpdatedAt = input.clearResumeContext ? null : current.resumeUpdatedAt
    if (resumeEntry) {
        let resume
        try {
            resume = await validateResumeUpload(resumeEntry)
        } catch (error) {
            return json({ error: error instanceof Error ? error.message : "Invalid resume upload" }, 400)
        }

        const quotaResult = await supabase.rpc("claim_personalization_quota", {
            p_article_slug: null,
            p_request_kind: "resume",
            p_model_id: PERSONALIZATION_MODEL,
            p_hourly_limit: 6,
        })
        if (quotaResult.error) return json({ error: "Could not reserve personalization quota" }, 500)
        if (!quotaResult.data) return json({ error: "Personalization limit reached. Try again in an hour." }, 429)

        const startedAt = Date.now()
        const usageTracker = createPersonalizationUsageTracker()
        try {
            const { analyzeResumeProfile } = await import("@/lib/gemini-personalization")
            const analysis = await analyzeResumeProfile({ ...resume, onUsage: usageTracker.record })
            const usage = usageTracker.measure(PERSONALIZATION_MODEL)
            resumeContext = validateResumeContext(analysis.learnerContext)
            resumeFileName = resume.fileName
            resumeUpdatedAt = new Date().toISOString()
            const durationMs = Date.now() - startedAt
            await finishUsage(supabase, user.id, quotaResult.data, {
                status: "succeeded",
                duration_ms: durationMs,
                input_chars: resume.bytes.byteLength,
                output_chars: resumeContext.length,
                ...usageFields(usage),
            })
            emitPersonalizationGenerationMetric({
                usageId: quotaResult.data,
                articleSlug: null,
                requestKind: "resume",
                status: "succeeded",
                modelId: PERSONALIZATION_MODEL,
                durationMs,
                inputChars: resume.bytes.byteLength,
                outputChars: resumeContext.length,
                usage,
            })
        } catch (error) {
            const usage = usageTracker.measure(PERSONALIZATION_MODEL)
            const errorCode = error instanceof GeminiPersonalizationError ? "provider" : "validation"
            const durationMs = Date.now() - startedAt
            await finishUsage(supabase, user.id, quotaResult.data, {
                status: "failed",
                duration_ms: durationMs,
                input_chars: resume.bytes.byteLength,
                error_code: errorCode,
                ...usageFields(usage),
            })
            emitPersonalizationGenerationMetric({
                usageId: quotaResult.data,
                articleSlug: null,
                requestKind: "resume",
                status: "failed",
                modelId: PERSONALIZATION_MODEL,
                durationMs,
                inputChars: resume.bytes.byteLength,
                usage,
                errorCode,
            })
            if (error instanceof GeminiPersonalizationError) return json({ error: error.message }, error.status)
            return json({ error: "Resume analysis failed. Try again." }, 502)
        }
    }

    const savedResult = await supabase
        .from("user_personalization_profiles")
        .upsert({
            user_id: user.id,
            tone_preset: input.tone,
            explanation_level: input.explanationLevel,
            custom_instructions: input.customInstructions,
            learner_context: input.learnerContext,
            resume_context: resumeContext,
            resume_filename: resumeFileName,
            resume_updated_at: resumeUpdatedAt,
        }, { onConflict: "user_id" })
        .select(PROFILE_COLUMNS)
        .single()
    if (savedResult.error) return json({ error: "Could not save personalization profile" }, 500)

    let profile
    try {
        profile = toPersonalizationProfile(savedResult.data)
    } catch {
        return json({ error: "Saved personalization profile is invalid" }, 500)
    }

    return json({ profile })
}
