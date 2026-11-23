export const PERSONALIZATION_TONES = ["clear", "friendly", "professional", "cowboy"] as const
export const PERSONALIZATION_EXPLANATION_LEVELS = ["eli5", "beginner", "balanced", "advanced"] as const

export type PersonalizationTone = typeof PERSONALIZATION_TONES[number]
export type PersonalizationExplanationLevel = typeof PERSONALIZATION_EXPLANATION_LEVELS[number]

export type PersonalizationProfile = {
    tone: PersonalizationTone
    explanationLevel: PersonalizationExplanationLevel
    customInstructions: string
    learnerContext: string
    resumeContext: string
    resumeFileName: string | null
    resumeUpdatedAt: string | null
    revision: number
    updatedAt: string | null
}

export type PersonalizationProfileInput = Pick<
    PersonalizationProfile,
    "tone" | "explanationLevel" | "customInstructions" | "learnerContext"
> & { clearResumeContext: boolean }

export const PERSONALIZATION_LIMITS = {
    customInstructions: 2_000,
    learnerContext: 4_000,
    resumeContext: 6_000,
    resumeBytes: 5 * 1024 * 1024,
} as const

export const DEFAULT_PERSONALIZATION_PROFILE: PersonalizationProfile = {
    tone: "clear",
    explanationLevel: "balanced",
    customInstructions: "",
    learnerContext: "",
    resumeContext: "",
    resumeFileName: null,
    resumeUpdatedAt: null,
    revision: 0,
    updatedAt: null,
}

type ProfileRow = {
    tone_preset: unknown
    explanation_level: unknown
    custom_instructions: unknown
    learner_context: unknown
    resume_context: unknown
    resume_filename: unknown
    resume_updated_at: unknown
    revision: unknown
    updated_at: unknown
}

function textLength(value: string): number {
    return Array.from(value).length
}

function validateText(value: unknown, label: string, maxLength: number): string {
    if (typeof value !== "string") throw new Error(`${label} is required`)
    const normalized = value.trim()
    if (textLength(normalized) > maxLength) throw new Error(`${label} must be ${maxLength.toLocaleString()} characters or fewer`)
    return normalized
}

export function validateResumeContext(value: unknown): string {
    const context = validateText(value, "Resume context", PERSONALIZATION_LIMITS.resumeContext)
    if (!context) throw new Error("Resume analysis returned no learner context")
    return context
}

export function validatePersonalizationProfileInput(value: unknown): PersonalizationProfileInput {
    if (!value || typeof value !== "object") throw new Error("Invalid personalization profile")
    const input = value as Record<string, unknown>
    if (!PERSONALIZATION_TONES.includes(input.tone as PersonalizationTone)) throw new Error("Invalid tone")
    if (!PERSONALIZATION_EXPLANATION_LEVELS.includes(input.explanationLevel as PersonalizationExplanationLevel)) {
        throw new Error("Invalid explanation level")
    }
    if (typeof input.clearResumeContext !== "boolean") throw new Error("Invalid resume context action")

    return {
        tone: input.tone as PersonalizationTone,
        explanationLevel: input.explanationLevel as PersonalizationExplanationLevel,
        customInstructions: validateText(input.customInstructions, "Custom instructions", PERSONALIZATION_LIMITS.customInstructions),
        learnerContext: validateText(input.learnerContext, "Learner context", PERSONALIZATION_LIMITS.learnerContext),
        clearResumeContext: input.clearResumeContext,
    }
}

export function toPersonalizationProfile(row: ProfileRow | null): PersonalizationProfile {
    if (!row) return { ...DEFAULT_PERSONALIZATION_PROFILE }
    const profile = validatePersonalizationProfileInput({
        tone: row.tone_preset,
        explanationLevel: row.explanation_level,
        customInstructions: row.custom_instructions,
        learnerContext: row.learner_context,
        clearResumeContext: false,
    })
    const resumeContext = row.resume_context === "" ? "" : validateResumeContext(row.resume_context)
    const validResumeFileName = row.resume_filename === null || (
        typeof row.resume_filename === "string" && row.resume_filename.length > 0 && row.resume_filename.length <= 255
    )
    const validResumeUpdatedAt = row.resume_updated_at === null || typeof row.resume_updated_at === "string"
    if (!validResumeFileName || !validResumeUpdatedAt || !Number.isInteger(row.revision) || (row.revision as number) < 1 || typeof row.updated_at !== "string") {
        throw new Error("Invalid stored personalization profile")
    }
    return {
        tone: profile.tone,
        explanationLevel: profile.explanationLevel,
        customInstructions: profile.customInstructions,
        learnerContext: profile.learnerContext,
        resumeContext,
        resumeFileName: row.resume_filename as string | null,
        resumeUpdatedAt: row.resume_updated_at as string | null,
        revision: row.revision as number,
        updatedAt: row.updated_at,
    }
}

type UploadedFile = Blob & { name: string }

export function isUploadedFile(value: FormDataEntryValue | null): value is File {
    return value instanceof Blob && typeof (value as UploadedFile).name === "string"
}

export async function validateResumeUpload(file: File): Promise<{
    bytes: Uint8Array
    fileName: string
    mimeType: string
}> {
    const fileName = file.name.trim()
    if (!fileName || fileName.length > 255) throw new Error("Invalid resume file name")
    if (file.size < 1 || file.size > PERSONALIZATION_LIMITS.resumeBytes) {
        throw new Error("Resume must be no larger than 5 MiB")
    }

    const extension = fileName.toLowerCase().match(/\.(pdf|txt|md)$/)?.[1]
    if (!extension) throw new Error("Resume must be a PDF, TXT, or MD file")
    const allowedTypes: Record<string, string[]> = {
        pdf: ["application/pdf"],
        txt: ["text/plain", ""],
        md: ["text/markdown", "text/plain", ""],
    }
    if (!allowedTypes[extension].includes(file.type)) throw new Error("Resume file type does not match its extension")

    const bytes = new Uint8Array(await file.arrayBuffer())
    if (extension === "pdf") {
        const signature = new TextDecoder().decode(bytes.slice(0, 5))
        if (signature !== "%PDF-") throw new Error("Resume is not a valid PDF")
    } else {
        let text: string
        try {
            text = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
        } catch {
            throw new Error("Resume text must use UTF-8 encoding")
        }
        if (text.includes("\0")) throw new Error("Resume text contains invalid characters")
    }

    return {
        bytes,
        fileName,
        mimeType: extension === "pdf" ? "application/pdf" : extension === "md" ? "text/markdown" : "text/plain",
    }
}
