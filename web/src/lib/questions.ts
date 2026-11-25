import { readdirSync, existsSync, statSync } from "fs"
import { join } from "path"
import contentLastModifiedManifest from "@/generated/content-lastmod.json"
import {
    type Reference,
    estimateReadingTime,
    resetGlobalRefsCache,
    resolveContent,
    resolveReferencesFromContent,
    contentImageUrl,
    normalizeContentImageUrl,
} from "./content-utils"
import {
    parseLearningSections,
    type ContentFollowUpQuestion,
} from "./learning-sections"
import { loadContentBundle, type ContentBundle } from "./content-bundle"
import { getQuestionRoute } from "./content-route-index"
import {
    defaultEditionForAudience,
    filterContentForAudience,
    isVisibleToAudience,
    type ContentAudience,
    type ContentEdition,
} from "./content-audience"

// Re-export Reference so existing imports from questions.ts keep working
export type { Reference } from "./content-utils"

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type Difficulty = "Easy" | "Medium" | "Hard"
export type Section =
    | "Math & Tensor Foundations"
    | "Classical ML & Evaluation"
    | "Deep Learning Foundations"
    | "Core LLM Foundations"
    | "Production ML Systems"
    | "Applied LLM Engineering & RAG"
    | "Transformer & Multimodal Architectures"
    | "Training, Fine-Tuning & Alignment"
    | "Advanced Agents & Retrieval"
    | "GPU Systems & LLM Inference"
    | "AI System Design"
    | "AI Lab Interviewing"
    | "Project Deep Dives"
export type Category =
    | "Transformer Architecture"
    | "Model Architecture"
    | "Fine-Tuning & Training"
    | "Reasoning & Scaling"
    | "System Design"
    | "NLP Fundamentals"
    | "RAG & Retrieval"
    | "Alignment & Safety"
    | "Inference Optimization"
    | "Embeddings & Vector Search"
    | "Multimodal Models"
    | "LLM Agents & Tool Use"
    | "Evaluation & Benchmarks"
    | "Prompt Engineering"
    | "MLOps & Deployment"

export type FollowUpQuestion = ContentFollowUpQuestion

// Reference type is re-exported from content-utils.ts above

export interface Question {
    id: string
    title: string
    slug: string
    section: Section
    category: Category
    difficulty: Difficulty
    timeEstimate: number
    order?: number // Explicit sort position within a section (lower = earlier)
    hidden?: boolean
    visibility?: Partial<Record<ContentAudience, boolean>>
    companies: string[]
    shortDescription: string
    content: string
    keyConceptsTested: string[]
    rubricPoints: string[]
    followUpQuestions: FollowUpQuestion[]
    commonPitfalls: string[]
    references: Record<string, Reference>
    prerequisites?: string[]
    relatedQuestions?: string[]
    coverImage?: string
    socialImage?: string
    lastModified?: string
    aliases?: string[]
    hasAlternateEdition?: boolean
}

// ═══════════════════════════════════════════════════════════════
//  CONTENT LOADER
// ═══════════════════════════════════════════════════════════════

const CONTENT_DIR = join(process.cwd(), "src", "content")

function isSocialBanner(imagePath: string | undefined): boolean {
    return imagePath?.includes("/social_banner.png") || imagePath === "social_banner.png" || false
}

const CONTENT_SECTION_FOLDERS = [
    "foundations",
    "preparation",
    "fundamentals",
    "agents",
    "retrieval",
    "llmops",
    "training",
    "system-design",
    "interviewing",
    "projects",
] as const

type QuestionMetadata = Omit<Question, "content" | "rubricPoints" | "followUpQuestions" | "commonPitfalls" | "timeEstimate" | "references"> & {
    rubricPoints?: (string | { point?: string; text?: string; tier?: string })[]
    followUpQuestions?: FollowUpQuestion[]
    commonPitfalls?: string[]
}
type ContentLastModifiedManifest = {
    items?: Record<string, string>
}

const contentLastModifiedBySlug = (contentLastModifiedManifest as ContentLastModifiedManifest).items ?? {}

// Valid values derived from exports below — keep in sync.
const VALID_CATEGORIES = new Set<string>([
    "Transformer Architecture", "Model Architecture", "Fine-Tuning & Training",
    "Reasoning & Scaling", "System Design",
    "NLP Fundamentals", "RAG & Retrieval", "Alignment & Safety",
    "Inference Optimization", "Embeddings & Vector Search", "Multimodal Models",
    "LLM Agents & Tool Use", "Evaluation & Benchmarks", "Prompt Engineering",
    "MLOps & Deployment",
])
const VALID_SECTIONS = new Set<string>([
    "Math & Tensor Foundations",
    "Classical ML & Evaluation",
    "Deep Learning Foundations",
    "Core LLM Foundations",
    "Production ML Systems",
    "Applied LLM Engineering & RAG",
    "Transformer & Multimodal Architectures",
    "Training, Fine-Tuning & Alignment",
    "Advanced Agents & Retrieval",
    "GPU Systems & LLM Inference",
    "AI System Design",
    "AI Lab Interviewing",
    "Project Deep Dives",
])
const VALID_DIFFICULTIES = new Set<string>(["Easy", "Medium", "Hard"])

// Content resolution utilities (resolveIllustrations, resolveDiagrams, resolveReferences,
// pngDisplaySize) are now in content-utils.ts and shared with the blog system.

function fallbackLastModified(paths: string[]): string {
    return new Date(Math.max(...paths.map((path) => statSync(/* turbopackIgnore: true */ path).mtime.getTime()))).toISOString()
}

function getQuestionLastModified(slug: string, paths: string[]): string {
    const generatedDate = contentLastModifiedBySlug[slug]
    if (generatedDate && !Number.isNaN(Date.parse(generatedDate))) {
        return generatedDate
    }
    return fallbackLastModified(paths)
}

const MASTERY_QUIZ_FENCE_RE = /```mastery-quiz[^\n]*\r?\n[\s\S]*?\r?\n```/
const TRAILING_HANDOFF_RE = /^>[ \t]*\*\*(?:Next|Course complete):\*\*[^\n]*$/im

function extractTrailingHandoff(markdown: string): string | null {
    const paragraphs = markdown
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    const last = paragraphs.at(-1)
    return last && TRAILING_HANDOFF_RE.test(last) ? last : null
}

function mergeWebsiteReaderCompanionBlocks(readerBody: string, referenceBody: string): string {
    let merged = readerBody
        .trimEnd()
        .replace(/(\(\/learn\/[a-z0-9-]+)\?view=online(\))/g, "$1?edition=reference$2")

    // Always prefer the canonical roadmap handoff from the reference edition when present,
    // replacing any older handoff line inside a reader block.
    const referenceHandoff = extractTrailingHandoff(referenceBody)
    const existingHandoff = extractTrailingHandoff(merged)
    if (existingHandoff && referenceHandoff) {
        const handoffIndex = merged.lastIndexOf(existingHandoff)
        merged = merged.slice(0, handoffIndex).trimEnd()
    }

    const finalHandoff = referenceHandoff ?? existingHandoff
    const hasQuiz = MASTERY_QUIZ_FENCE_RE.test(merged)

    if (!hasQuiz) {
        const referenceQuiz = referenceBody.match(MASTERY_QUIZ_FENCE_RE)?.[0]
        if (referenceQuiz) {
            if (!referenceHandoff && existingHandoff) {
                const handoffIndex = merged.lastIndexOf(existingHandoff)
                const beforeHandoff = merged.slice(0, handoffIndex).trimEnd()
                merged = `${beforeHandoff}\n\n${referenceQuiz}\n\n${existingHandoff}`
                return merged
            }
            merged = `${merged}\n\n${referenceQuiz}`
        }
    }

    if (finalHandoff && (!existingHandoff || referenceHandoff)) {
        merged = `${merged}\n\n${finalHandoff}`
    }

    return merged
}

function loadQuestion(
    questionDir: string,
    audience: ContentAudience,
    preloadedBundle?: ContentBundle,
    edition?: ContentEdition,
): Question {
    const effectiveEdition = edition ?? defaultEditionForAudience(audience)
    const bundle = preloadedBundle ?? (edition ? loadContentBundle(questionDir, audience, edition) : loadContentBundle(questionDir, audience))
    if (!bundle) {
        throw new Error(`[CONTENT ERROR] Missing content bundle in ${questionDir}`)
    }

    const metadata = bundle.metadata as QuestionMetadata
    const metadataPath = bundle.metadataPath ?? bundle.contentPath
    const contentPath = bundle.contentPath

    // ── BUILD-TIME VALIDATION ─────────────────────────────────────────
    // Fail fast with a clear message so bad metadata never ships.
    if (!VALID_CATEGORIES.has(metadata.category)) {
        throw new Error(
            `[CONTENT ERROR] Invalid category "${metadata.category}" in ${metadataPath}\n` +
            `  Valid categories: ${[...VALID_CATEGORIES].join(", ")}`
        )
    }
    if (!VALID_SECTIONS.has(metadata.section)) {
        throw new Error(
            `[CONTENT ERROR] Invalid section "${metadata.section}" in ${metadataPath}\n` +
            `  Valid sections: ${[...VALID_SECTIONS].join(", ")}`
        )
    }
    if (!VALID_DIFFICULTIES.has(metadata.difficulty)) {
        throw new Error(
            `[CONTENT ERROR] Invalid difficulty "${metadata.difficulty}" in ${metadataPath}\n` +
            `  Valid difficulties: Easy, Medium, Hard`
        )
    }
    // ──────────────────────────────────────────────────────────────────

    const referenceFallbackBody = audience === "website" && effectiveEdition === "reader" && bundle.hasEditionVariants
        ? filterContentForAudience(bundle.sourceBody, audience, contentPath, "reference")
        : null
    const rawContent = referenceFallbackBody
        ? mergeWebsiteReaderCompanionBlocks(bundle.body, referenceFallbackBody)
        : bundle.body
    const resolvedRefs = resolveReferencesFromContent(rawContent, contentPath)
    const content = resolveContent(rawContent, questionDir, resolvedRefs, "content.md", bundle.sourceBody)
    const timeEstimate = estimateReadingTime(bundle.body, metadata.difficulty, false)

    const socialBannerPath = join(questionDir, "social_banner.png")
    const socialImage = existsSync(/* turbopackIgnore: true */ socialBannerPath)
        ? contentImageUrl(socialBannerPath)
        : undefined

    const normalizedCover = normalizeContentImageUrl(metadata.coverImage, questionDir)
    let coverImage = isSocialBanner(normalizedCover) ? undefined : normalizedCover
    if (!coverImage) {
        const firstImageMatch = content.match(/<img[^>]+src="([^">]+)"/)
        if (firstImageMatch && !isSocialBanner(firstImageMatch[1])) {
            coverImage = firstImageMatch[1]
        }
    }
    metadata.coverImage = coverImage

    const learningSections = parseLearningSections(rawContent)
    const fallbackSections = referenceFallbackBody && (
        learningSections.rubricPoints.length === 0
        || learningSections.followUpQuestions.length === 0
        || learningSections.commonPitfalls.length === 0
    )
        ? parseLearningSections(referenceFallbackBody)
        : null
    const rawRubric = (metadata as Record<string, unknown>).rubricPoints
    let rubricPoints: string[] = []
    if (learningSections.rubricPoints.length > 0) {
        rubricPoints = learningSections.rubricPoints
    } else if (fallbackSections && fallbackSections.rubricPoints.length > 0) {
        rubricPoints = fallbackSections.rubricPoints
    } else if (Array.isArray(rawRubric)) {
        rubricPoints = rawRubric.map((item: unknown) => {
            if (typeof item === "string") return item
            const obj = item as { point?: string; text?: string }
            return obj.point || obj.text || ""
        })
    }
    const followUpQuestions = learningSections.followUpQuestions.length > 0
        ? learningSections.followUpQuestions
        : fallbackSections && fallbackSections.followUpQuestions.length > 0
            ? fallbackSections.followUpQuestions
            : metadata.followUpQuestions ?? []
    const commonPitfalls = learningSections.commonPitfalls.length > 0
        ? learningSections.commonPitfalls
        : fallbackSections && fallbackSections.commonPitfalls.length > 0
            ? fallbackSections.commonPitfalls
            : metadata.commonPitfalls ?? []

    const lastModifiedPaths = bundle.metadataPath ? [metadataPath, contentPath] : [contentPath]
    const lastModified = getQuestionLastModified(metadata.slug, lastModifiedPaths)

    return {
        ...metadata,
        socialImage,
        timeEstimate,
        references: resolvedRefs,
        rubricPoints,
        followUpQuestions,
        commonPitfalls,
        content,
        lastModified,
        hasAlternateEdition: Boolean(bundle.hasEditionVariants),
    }
}

const DIFFICULTY_ORDER: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2 }
const ROADMAP_SECTION_SEQUENCE: Section[] = [
    "Math & Tensor Foundations",
    "Classical ML & Evaluation",
    "Deep Learning Foundations",
    "Core LLM Foundations",
    "Production ML Systems",
    "Applied LLM Engineering & RAG",
    "Transformer & Multimodal Architectures",
    "Training, Fine-Tuning & Alignment",
    "Advanced Agents & Retrieval",
    "GPU Systems & LLM Inference",
    "AI System Design",
    "AI Lab Interviewing",
    "Project Deep Dives",
]
const SECTION_ORDER: Record<Section, number> = ROADMAP_SECTION_SEQUENCE.reduce(
    (acc, section, index) => {
        acc[section] = index
        return acc
    },
    {} as Record<Section, number>
)

// Explicit roadmap ordering within each section (basic -> advanced).
const SECTION_ROADMAP_SLUG_ORDER: Record<Section, string[]> = {
    "Math & Tensor Foundations": [
        "numpy-and-tensor-shapes",
        "linear-algebra-machine-learning-deeper",
        "calculus-gradients-backpropagation-optimization",
        "probability-for-machine-learning",
        "hypothesis-tests-confidence-intervals-passk",
    ],
    "Classical ML & Evaluation": [
        "linear-regression-from-scratch",
        "logistic-regression-classification-metrics-from-scratch",
        "decision-trees-random-forests-gradient-boosting",
        "clustering-pca-representation-learning",
        "cross-validation-leakage-generalization",
        "dataset-pipelines-data-quality",
        "experiment-design-ab-testing",
        "causal-inference-confounding-counterfactuals",
    ],
    "Deep Learning Foundations": [
        "neural-networks-from-scratch",
        "pytorch-training-loops",
        "softmax-cross-entropy-optimization",
        "optimization-algorithms-adam-schedulers",
        "convolutional-neural-networks-from-scratch",
        "rnns-lstms-grus-sequence-modeling",
        "autoencoders-vaes-generative-modeling-basics",
    ],
    "Core LLM Foundations": [
        "bitter-lesson-compute-over-heuristics",
        "tokenization-bpe-wordpiece-sentencepiece",
        "word-embeddings-contextual-representations",
        "sentence-embeddings-contrastive-learning",
        "transformer-architecture-end-to-end",
        "language-modeling-next-token-prediction",
        "decoding-strategies-greedy-beam-nucleus",
        "perplexity-language-model-evaluation",
        "gpt-to-modern-llms",
        "instruction-tuning-chat-templates",
        "llm-evaluation-benchmarks-limitations",
    ],
    "Production ML Systems": [
        "feature-engineering-production-ml",
        "ranking-recommendation-systems",
        "forecasting-anomaly-detection",
        "monitoring-predictive-models",
    ],
    "Applied LLM Engineering & RAG": [
        "prompt-engineering-fundamentals",
        "calling-llm-apis-production",
        "first-ai-app-end-to-end",
        "chain-of-thought-advanced-prompting",
        "programmatic-prompt-optimization-dspy",
        "structured-output-constrained-generation",
        "function-calling-tool-use-llms",
        "mcp-tool-protocol-standards",
        "file-ingestion-pdfs-html-ocr-markdown",
        "chunking-strategies-document-processing",
        "embeddings-cosine-dot-product-quantization",
        "core-retrieval-algorithms",
        "design-production-rag-pipeline",
        "llm-as-judge-automated-evaluation",
        "hallucination-detection-mitigation",
        "bias-detection-fairness-llms",
        "prompt-injection-defense-strategies",
        "llm-cost-engineering-token-economics",
    ],
    "Transformer & Multimodal Architectures": [
        "scaled-dot-product-attention",
        "positional-encoding-rope-alibi",
        "layer-normalization-pre-ln-post-ln",
        "mixture-of-experts-architecture",
        "state-space-models-mamba-alternatives",
        "vision-transformers-image-encoders",
        "multimodal-llms-architecture-design",
        "image-generation-diffusion-models",
        "mechanistic-interpretability-sparse-autoencoders",
    ],
    "Training, Fine-Tuning & Alignment": [
        "scaling-laws-compute-optimal-training",
        "pre-training-data-pipelines-scale",
        "build-gpt-from-scratch-lab",
        "cuda-gpu-computing-for-ml",
        "mixed-precision-training-loss-scaling",
        "distributed-training-fsdp-deepspeed-zero",
        "training-run-operations",
        "jax-for-ml-research",
        "continued-pretraining-domain-adaptation",
        "synthetic-data-generation-pipelines-llms",
        "supervised-fine-tuning-pipeline",
        "lora-parameter-efficient-fine-tuning",
        "privacy-preserving-ml-differential-privacy",
        "data-labeling-human-feedback-active-learning",
        "introduction-to-reinforcement-learning-fundamentals",
        "reward-modeling-from-preference-data",
        "rlhf-dpo-aligning-language-models",
        "constitutional-ai-automated-red-teaming",
        "rlvr-verifiable-rewards-training",
        "reasoning-models-test-time-compute",
        "knowledge-distillation-llms",
        "model-merging-weight-interpolation",
    ],
    "Advanced Agents & Retrieval": [
        "vector-database-internals-hnsw-ivf",
        "advanced-rag-query-rewriting-self-rag",
        "graphrag-knowledge-graphs-vector-search",
        "agentic-architectures-react-plan-execute",
        "long-context-engineering-beyond-management",
        "agent-memory-persistence-patterns",
        "code-generation-agents-sandboxing",
        "ai-coding-workflow-with-agents",
        "computer-use-gui-browser-agents",
        "agent-failure-states-retry-fallback",
        "multi-agent-dags-langgraph-orchestration",
        "agent-evaluation-benchmarks",
    ],
    "GPU Systems & LLM Inference": [
        "inference-mechanics-ttft-tps-kv-cache",
        "multi-query-grouped-query-attention",
        "kv-cache-paged-attention-llm-serving",
        "prefix-caching-prompt-caching",
        "flashattention-memory-efficient-attention",
        "continuous-batching-request-scheduling",
        "speculative-decoding",
        "long-context-window-management",
        "model-quantization-gptq-awq-gguf",
        "local-llm-deployment-hardware-quantization",
        "model-parallelism-for-llm-inference",
        "distributed-inference-data-plane",
        "accelerator-architecture-field-guide",
        "gpu-kernel-performance-engineering-lab",
        "gpu-parallel-primitives-lab",
        "gpu-compilers-kernel-languages",
        "gemm-naive-cuda-tensor-cores",
        "low-precision-gpu-programming",
        "gpu-runtime-execution-lab",
        "llm-deployment-gpu-serving-autoscaling",
        "gpu-failure-operations",
        "observability-monitoring-llm-systems",
        "serving-benchmark-engineering",
    ],
    "AI System Design": [
        "design-real-time-content-moderation-system",
        "design-code-completion-system",
        "design-multi-tenant-llm-serving-platform",
        "design-agent-sandbox-platform",
        "design-llm-powered-search-engine",
        "design-real-time-voice-ai-agent",
        "design-reasoning-agent-test-time-compute",
    ],
    "AI Lab Interviewing": [
        "ai-lab-coding-interview-python-systems",
        "ai-lab-system-design-interview",
        "ai-lab-behavioral-interview",
        "ai-lab-technical-presentation",
    ],
    "Project Deep Dives": [
        "deep-dive-pytorch",
        "deep-dive-transformers",
        "deep-dive-vllm",
        "deep-dive-sglang",
        "deep-dive-flashinfer",
        "deep-dive-deepgemm",
        "deep-dive-deepep",
        "deep-dive-nccl",
        "deep-dive-megatron",
        "deep-dive-ray",
    ],
}

function getRoadmapIndex(section: Section, slug: string): number {
    const orderedSlugs = SECTION_ROADMAP_SLUG_ORDER[section] ?? []
    const idx = orderedSlugs.indexOf(slug)
    return idx === -1 ? 9999 : idx
}

function validateRoadmapCoverage(allQuestions: Question[], websiteExcludedSlugs: Set<string>): void {
    const errors: string[] = []
    const roadmapSlugs = new Set<string>()

    for (const section of ROADMAP_SECTION_SEQUENCE) {
        const planned = SECTION_ROADMAP_SLUG_ORDER[section] ?? []
        const actual = allQuestions.filter((q) => q.section === section).map((q) => q.slug)
        const plannedSet = new Set(planned)
        const actualSet = new Set(actual)

        const missingFromRoadmap = actual.filter((slug) => !plannedSet.has(slug))
        const extraInRoadmap = planned.filter((slug) => !actualSet.has(slug) && !websiteExcludedSlugs.has(slug))

        if (missingFromRoadmap.length > 0 || extraInRoadmap.length > 0) {
            const parts: string[] = [`Section "${section}"`]
            if (missingFromRoadmap.length > 0) {
                parts.push(`missing: ${missingFromRoadmap.join(", ")}`)
            }
            if (extraInRoadmap.length > 0) {
                parts.push(`extra: ${extraInRoadmap.join(", ")}`)
            }
            errors.push(parts.join(" | "))
        }

        for (const slug of planned) {
            if (roadmapSlugs.has(slug)) {
                errors.push(`Duplicate roadmap slug: ${slug}`)
            }
            roadmapSlugs.add(slug)
        }
    }

    if (errors.length > 0) {
        throw new Error(`[ROADMAP ERROR] Roadmap ordering is out of sync.\n${errors.join("\n")}`)
    }
}

function validateQuestionAliases(allQuestions: Question[]): void {
    const errors: string[] = []
    const slugOwners = new Map(allQuestions.map((q) => [q.slug, q.slug]))
    const aliasOwners = new Map<string, string>()

    for (const question of allQuestions) {
        for (const alias of question.aliases ?? []) {
            if (alias === question.slug) {
                errors.push(`${question.slug}: alias duplicates canonical slug`)
            }
            const slugOwner = slugOwners.get(alias)
            if (slugOwner) {
                errors.push(`${question.slug}: alias "${alias}" conflicts with canonical slug "${slugOwner}"`)
            }
            const aliasOwner = aliasOwners.get(alias)
            if (aliasOwner) {
                errors.push(`${question.slug}: alias "${alias}" is already owned by ${aliasOwner}`)
            }
            aliasOwners.set(alias, question.slug)
        }
    }

    if (errors.length > 0) {
        throw new Error(`[ALIAS ERROR] Question aliases are out of sync.\n${errors.join("\n")}`)
    }
}

function loadAllQuestions(audience: ContentAudience, edition: ContentEdition): Question[] {
    const allQuestions: Question[] = []
    const websiteExcludedSlugs = new Set<string>()

    // Walk each content folder containing article directories.
    for (const folderName of CONTENT_SECTION_FOLDERS) {
        const sectionDir = join(/* turbopackIgnore: true */ CONTENT_DIR, /* turbopackIgnore: true */ folderName)
        if (!existsSync(/* turbopackIgnore: true */ sectionDir)) continue

        const articleDirs = readdirSync(/* turbopackIgnore: true */ sectionDir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name)

        for (const slug of articleDirs) {
            const questionDir = join(/* turbopackIgnore: true */ sectionDir, /* turbopackIgnore: true */ slug)
            const bundle = loadContentBundle(questionDir, audience, edition)
            if (!bundle) continue
            const metadata = bundle.metadata as QuestionMetadata
            if (metadata.visibility?.website === false) websiteExcludedSlugs.add(metadata.slug)
            if (!isVisibleToAudience(bundle.metadata, audience)) continue
            allQuestions.push(loadQuestion(questionDir, audience, bundle, edition))
        }
    }

    if (audience === "website") validateRoadmapCoverage(allQuestions, websiteExcludedSlugs)
    validateQuestionAliases(allQuestions)

    // Sort by section roadmap, then explicit order, then difficulty, then alphabetically.
    return allQuestions.sort((a, b) => {
        const secA = SECTION_ORDER[a.section] ?? 0
        const secB = SECTION_ORDER[b.section] ?? 0
        if (secA !== secB) return secA - secB
        const roadmapA = getRoadmapIndex(a.section, a.slug)
        const roadmapB = getRoadmapIndex(b.section, b.slug)
        if (roadmapA !== roadmapB) return roadmapA - roadmapB
        const ordA = a.order ?? 9999
        const ordB = b.order ?? 9999
        if (ordA !== ordB) return ordA - ordB
        const diffA = DIFFICULTY_ORDER[a.difficulty] ?? 1
        const diffB = DIFFICULTY_ORDER[b.difficulty] ?? 1
        if (diffA !== diffB) return diffA - diffB
        return a.title.localeCompare(b.title)
    })
}

/**
 * All questions, loaded from individual folders on disk.
 *
 * In production: cached in-process after first load (content never changes).
 * In development: reloaded from disk on every access so edits to content.md
 * restarting the dev server.
 */
const _questionsCache = new Map<string, Question[]>()
const _singleQuestionCache = new Map<string, Question>()
const isDev = process.env.NODE_ENV === 'development'

export function getQuestions(
    audience: ContentAudience = "website",
    edition: ContentEdition = defaultEditionForAudience(audience),
): Question[] {
    const key = `${audience}:${edition}`
    if (isDev || !_questionsCache.has(key)) {
        resetGlobalRefsCache() // reload references.json in dev
        _questionsCache.set(key, loadAllQuestions(audience, edition))
    }
    return _questionsCache.get(key)!
}

// ═══════════════════════════════════════════════════════════════
//  ACCESS HELPERS
// ═══════════════════════════════════════════════════════════════

/** A serializable question shape returned to page components */
export type QuestionSummary = Omit<Question, "content" | "rubricPoints" | "followUpQuestions" | "commonPitfalls"> & {
    content: string
    rubricPoints: string[]
    followUpQuestions: FollowUpQuestion[]
    commonPitfalls: string[]
}

/**
 * Get all questions for a user. All lessons are open, so every caller receives
 * full content.
 */
export function getQuestionsForUser(_legacyAccessFlag: boolean): QuestionSummary[] {
    void _legacyAccessFlag
    return getQuestions()
}

function loadQuestionByIndexedSlug(slug: string, edition?: ContentEdition): Question | undefined {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return undefined

    const effectiveEdition = edition ?? defaultEditionForAudience("website")
    const cacheKey = `${slug}:${effectiveEdition}`
    const cached = _singleQuestionCache.get(cacheKey)
    if (cached) return cached

    const route = getQuestionRoute(slug)
    if (!route || route.hidden) return undefined

    const questionDir = join(/* turbopackIgnore: true */ CONTENT_DIR, /* turbopackIgnore: true */ route.directory)
    const bundle = edition
        ? loadContentBundle(questionDir, "website", edition)
        : loadContentBundle(questionDir, "website")
    if (!bundle || !isVisibleToAudience(bundle.metadata, "website")) return undefined

    const question = loadQuestion(questionDir, "website", bundle, effectiveEdition)
    if (question.slug !== route.canonicalSlug) return undefined
    if (question.slug !== slug && !question.aliases?.includes(slug)) return undefined

    _singleQuestionCache.set(`${question.slug}:${effectiveEdition}`, question)
    for (const alias of question.aliases ?? []) {
        _singleQuestionCache.set(`${alias}:${effectiveEdition}`, question)
    }
    return question
}

function findQuestionBySlugOrAlias(slug: string, edition?: ContentEdition): Question | undefined {
    const effectiveEdition = edition ?? defaultEditionForAudience("website")
    if (_questionsCache.has(`website:${effectiveEdition}`) || isDev) {
        return getQuestions("website", effectiveEdition).find((q) => q.slug === slug || q.aliases?.includes(slug))
    }

    return loadQuestionByIndexedSlug(slug, edition)
}

export function getCanonicalQuestionSlug(slug: string): string | undefined {
    return findQuestionBySlugOrAlias(slug)?.slug
}

/**
 * Get a single question by slug. All lessons are open, so this returns full
 * content for anonymous and logged-in users alike.
 */
export function getQuestionForUser(
    slug: string,
    _legacyAccessFlag: boolean,
    edition?: ContentEdition,
): QuestionSummary | undefined {
    void _legacyAccessFlag
    return findQuestionBySlugOrAlias(slug, edition)
}

// ═══════════════════════════════════════════════════════════════
//  LEGACY HELPERS (use getQuestionsForUser/getQuestionForUser instead)
// ═══════════════════════════════════════════════════════════════

/** @deprecated Use getQuestionsForUser() for safe access */
export function getFreeQuestions(): Question[] {
    return getQuestions()
}

/** @deprecated Use getQuestionForUser() for safe access */
export function getQuestionBySlug(slug: string): Question | undefined {
    return findQuestionBySlugOrAlias(slug)
}

export function getQuestionsByCategory(category: Category): Question[] {
    return getQuestions().filter((q) => q.category === category)
}

export function getQuestionsByDifficulty(difficulty: Difficulty): Question[] {
    return getQuestions().filter((q) => q.difficulty === difficulty)
}

export const sections: Section[] = [...ROADMAP_SECTION_SEQUENCE]

export const sectionConfig: Record<Section, { icon: string; description: string; color: string }> = {
    "Math & Tensor Foundations": {
        icon: "📊",
        description: "Build fluent intuition for tensors, linear algebra, gradients, probability, and statistical uncertainty behind every model.",
        color: "text-sky-400",
    },
    "Classical ML & Evaluation": {
        icon: "🧮",
        description: "Build core predictive models from scratch and learn why splits, metrics, experiments, and causality decide real performance.",
        color: "text-amber-400",
    },
    "Deep Learning Foundations": {
        icon: "📚",
        description: "Train neural networks in PyTorch from first principles, from MLP backprop and Adam through CNNs, RNNs, and VAEs.",
        color: "text-lime-400",
    },
    "Core LLM Foundations": {
        icon: "🧪",
        description: "Trace text through tokenization, embeddings, the Transformer block, decoding, perplexity, and instruction tuning.",
        color: "text-emerald-400",
    },
    "Production ML Systems": {
        icon: "📦",
        description: "Take models beyond notebooks with point-in-time feature pipelines, ranking, forecasting, and live drift monitoring.",
        color: "text-teal-400",
    },
    "Applied LLM Engineering & RAG": {
        icon: "🧰",
        description: "Build grounded LLM applications with prompting, structured outputs, tool calling, hybrid retrieval, evaluation, and cost control.",
        color: "text-blue-400",
    },
    "Transformer & Multimodal Architectures": {
        icon: "🧠",
        description: "Look inside modern model architectures: attention, RoPE, LayerNorm, MoE, Mamba, Vision Transformers, multimodal fusion, and diffusion.",
        color: "text-violet-400",
    },
    "Training, Fine-Tuning & Alignment": {
        icon: "🧬",
        description: "Pretrain, adapt, and align language models with scaling laws, CUDA, FSDP, LoRA, RLHF, DPO, RLVR, distillation, and model merging.",
        color: "text-rose-400",
    },
    "Advanced Agents & Retrieval": {
        icon: "🤖",
        description: "Build vector indexes, GraphRAG, and reliable agents with working memory, OS sandboxing, recovery, and multi-agent orchestration.",
        color: "text-purple-400",
    },
    "GPU Systems & LLM Inference": {
        icon: "⚡",
        description: "Eliminate serving bottlenecks from KV caches, PagedAttention, FlashAttention, and CUDA kernels to quantization and fleet autoscaling.",
        color: "text-yellow-400",
    },
    "AI System Design": {
        icon: "🏗️",
        description: "Design complete production AI systems end to end, balancing latency, accuracy, isolation, and cost tradeoffs.",
        color: "text-orange-400",
    },
    "AI Lab Interviewing": {
        icon: "🎤",
        description: "Sharpen Python systems coding, ML system design, behavioral reasoning, and technical presentation skills for AI lab loops.",
        color: "text-fuchsia-400",
    },
    "Project Deep Dives": {
        icon: "🔬",
        description: "Read the architecture behind canonical open-source AI systems from PyTorch and vLLM to FlashInfer, DeepGEMM, NCCL, and Megatron.",
        color: "text-cyan-300",
    },
}

export const categories: Category[] = [
    "NLP Fundamentals",
    "Transformer Architecture",
    "Model Architecture",
    "Embeddings & Vector Search",
    "Inference Optimization",
    "RAG & Retrieval",
    "Prompt Engineering",
    "LLM Agents & Tool Use",
    "Evaluation & Benchmarks",
    "Alignment & Safety",
    "MLOps & Deployment",
    "Fine-Tuning & Training",
    "Reasoning & Scaling",
    "Multimodal Models",
    "System Design",
]

export const difficultyConfig: Record<Difficulty, { color: string; bg: string; border: string }> = {
    Easy: {
        color: "text-emerald-700 dark:text-emerald-300",
        bg: "bg-emerald-500/15 dark:bg-emerald-400/15",
        border: "border-emerald-600/30 dark:border-emerald-300/30",
    },
    Medium: {
        color: "text-amber-800 dark:text-amber-200",
        bg: "bg-amber-400/20 dark:bg-amber-300/15",
        border: "border-amber-600/40 dark:border-amber-200/30",
    },
    Hard: {
        color: "text-red-700 dark:text-red-300",
        bg: "bg-red-500/15 dark:bg-red-400/15",
        border: "border-red-600/30 dark:border-red-300/30",
    },
}

export const categoryConfig: Record<Category, { icon: string; color: string }> = {
    "Transformer Architecture": { icon: "🧠", color: "text-violet-400" },
    "Model Architecture": { icon: "🏛️", color: "text-fuchsia-400" },
    "Fine-Tuning & Training": { icon: "⚡", color: "text-blue-400" },
    "Reasoning & Scaling": { icon: "📈", color: "text-rose-400" },
    "Inference Optimization": { icon: "🚀", color: "text-yellow-400" },
    "System Design": { icon: "🏗️", color: "text-orange-400" },
    "NLP Fundamentals": { icon: "📝", color: "text-green-400" },
    "RAG & Retrieval": { icon: "🔍", color: "text-cyan-400" },
    "Alignment & Safety": { icon: "🛡️", color: "text-rose-400" },
    "Embeddings & Vector Search": { icon: "📐", color: "text-indigo-400" },
    "Multimodal Models": { icon: "👁️", color: "text-pink-400" },
    "LLM Agents & Tool Use": { icon: "🤖", color: "text-teal-400" },
    "Evaluation & Benchmarks": { icon: "📊", color: "text-sky-400" },
    "Prompt Engineering": { icon: "✍️", color: "text-purple-400" },
    "MLOps & Deployment": { icon: "⚙️", color: "text-slate-400" },
}
