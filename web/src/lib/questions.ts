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
import { isVisibleToAudience, type ContentAudience, type ContentEdition } from "./content-audience"

// Re-export Reference so existing imports from questions.ts keep working
export type { Reference } from "./content-utils"

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type Difficulty = "Easy" | "Medium" | "Hard"
export type Section =
    | "Computing Foundations"
    | "Math & Statistics"
    | "Preparation & Prerequisites"
    | "Core LLM Foundations"
    | "ML Algorithms & Evaluation"
    | "Production ML Systems"
    | "Applied LLM Engineering"
    | "Portfolio Capstones"
    | "Transformer Deep Dives"
    | "Advanced Training & Adaptation"
    | "Advanced Agents & Retrieval"
    | "Inference & Production Scale"
    | "System Design Capstones"
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
    "Computing Foundations",
    "Math & Statistics",
    "Preparation & Prerequisites",
    "Core LLM Foundations",
    "ML Algorithms & Evaluation",
    "Production ML Systems",
    "Applied LLM Engineering",
    "Portfolio Capstones",
    "Transformer Deep Dives",
    "Advanced Training & Adaptation",
    "Advanced Agents & Retrieval",
    "Inference & Production Scale",
    "System Design Capstones",
    "AI Lab Interviewing",
    "Project Deep Dives",
])
const VALID_DIFFICULTIES = new Set<string>(["Easy", "Medium", "Hard"])

// Content resolution utilities (resolveIllustrations, resolveDiagrams, resolveReferences,
// pngDisplaySize) are now in content-utils.ts and shared with the blog system.

function fallbackLastModified(paths: string[]): string {
    return new Date(Math.max(...paths.map((path) => statSync(path).mtime.getTime()))).toISOString()
}

function getQuestionLastModified(slug: string, paths: string[]): string {
    const generatedDate = contentLastModifiedBySlug[slug]
    if (generatedDate && !Number.isNaN(Date.parse(generatedDate))) {
        return generatedDate
    }
    return fallbackLastModified(paths)
}

function loadQuestion(questionDir: string, audience: ContentAudience, preloadedBundle?: ContentBundle): Question {
    const bundle = preloadedBundle ?? loadContentBundle(questionDir, audience)
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

    const rawContent = bundle.body
    const resolvedRefs = resolveReferencesFromContent(rawContent, contentPath)
    const content = resolveContent(rawContent, questionDir, resolvedRefs, "content.md", bundle.sourceBody)
    const timeEstimate = estimateReadingTime(rawContent, metadata.difficulty, false)

    const socialBannerPath = join(questionDir, "social_banner.png")
    const socialImage = existsSync(socialBannerPath)
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
    const rawRubric = (metadata as Record<string, unknown>).rubricPoints
    let rubricPoints: string[] = []
    if (learningSections.rubricPoints.length > 0) {
        rubricPoints = learningSections.rubricPoints
    } else if (Array.isArray(rawRubric)) {
        rubricPoints = rawRubric.map((item: unknown) => {
            if (typeof item === "string") return item
            const obj = item as { point?: string; text?: string }
            return obj.point || obj.text || ""
        })
    }
    const followUpQuestions = learningSections.followUpQuestions.length > 0
        ? learningSections.followUpQuestions
        : metadata.followUpQuestions ?? []
    const commonPitfalls = learningSections.commonPitfalls.length > 0
        ? learningSections.commonPitfalls
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
    }
}

const DIFFICULTY_ORDER: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2 }
const ROADMAP_SECTION_SEQUENCE: Section[] = [
    "Computing Foundations",
    "Math & Statistics",
    "Preparation & Prerequisites",
    "ML Algorithms & Evaluation",
    "Production ML Systems",
    "Core LLM Foundations",
    "Applied LLM Engineering",
    "Portfolio Capstones",
    "Transformer Deep Dives",
    "Advanced Training & Adaptation",
    "Advanced Agents & Retrieval",
    "Inference & Production Scale",
    "System Design Capstones",
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
    "Computing Foundations": [
        "git-shell-linux-reproducible-ai",
        "docker-containerization-reproducible-ai",
        "python-for-ai-engineering",
        "numpy-and-tensor-shapes",
        "cuda-gpu-computing-for-ml",
        "mps-metal-mac-ml-training",
        "data-structures-for-ai-systems",
        "sql-databases-data-modeling-ai",
        "algorithms-complexity-ml-engineers",
    ],
    "Math & Statistics": [
        "calculus-gradients-backpropagation-optimization",
        "vectors-matrices-tensors",
        "linear-algebra-machine-learning-deeper",
        "optimization-algorithms-adam-schedulers",
        "probability-for-machine-learning",
        "bayesian-inference-priors-posteriors",
        "statistics-estimation-uncertainty",
        "distributions-sampling-simulation",
        "hypothesis-tests-confidence-intervals-passk",
    ],
    "Preparation & Prerequisites": [
        "neural-networks-from-scratch",
        "convolutional-neural-networks-from-scratch",
        "training-backpropagation-gradient-descent",
        "softmax-cross-entropy-optimization",
        "rnns-lstms-grus-sequence-modeling",
        "autoencoders-vaes-generative-modeling-basics",
        "transformer-architecture-end-to-end",
        "language-modeling-next-token-prediction",
        "gpt-to-modern-llms",
        "prompt-engineering-fundamentals",
        "calling-llm-apis-production",
        "first-ai-app-end-to-end",
        "llm-lifecycle-training-to-deployment",
    ],
    "Core LLM Foundations": [
        "bitter-lesson-compute-over-heuristics",
        "tokenization-bpe-wordpiece-sentencepiece",
        "word-embeddings-contextual-representations",
        "perplexity-language-model-evaluation",
        "file-ingestion-pdfs-html-ocr-markdown",
        "chunking-strategies-document-processing",
        "llm-evaluation-benchmarks-limitations",
        "instruction-tuning-chat-templates",
    ],
    "ML Algorithms & Evaluation": [
        "linear-regression-from-scratch",
        "logistic-regression-classification-metrics-from-scratch",
        "decision-trees-random-forests-gradient-boosting",
        "introduction-to-reinforcement-learning-fundamentals",
        "cross-validation-leakage-generalization",
        "statistical-learning-theory-generalization",
        "conformal-prediction-uncertainty-sets",
        "clustering-pca-representation-learning",
        "probabilistic-generative-models-em",
        "core-retrieval-algorithms",
        "decoding-algorithms",
        "experiment-design-ab-testing",
        "causal-inference-confounding-counterfactuals",
        "pytorch-training-loops",
        "dataset-pipelines-data-quality",
    ],
    "Production ML Systems": [
        "feature-engineering-production-ml",
        "batch-streaming-feature-pipelines",
        "gradient-boosted-trees-production",
        "ranking-recommendation-systems",
        "forecasting-anomaly-detection",
        "monitoring-predictive-models",
    ],
    "Applied LLM Engineering": [
        "dimensionality-reduction-embeddings",
        "chain-of-thought-advanced-prompting",
        "function-calling-tool-use-llms",
        "mcp-tool-protocol-standards",
        "long-context-engineering-beyond-management",
        "prompt-injection-defense-strategies",
        "responsible-ai-governance-ethics-compliance",
        "privacy-preserving-ml-differential-privacy",
        "data-labeling-human-feedback-active-learning",
        "agent-evaluation-benchmarks",
        "design-production-rag-pipeline",
        "hybrid-search-dense-sparse-retrieval",
        "reranking-cross-encoders-rag",
        "rag-evaluation-faithfulness-relevance",
        "llm-as-judge-automated-evaluation",
        "bias-detection-fairness-llms",
        "hallucination-detection-mitigation",
        "observability-monitoring-llm-systems",
        "experiment-tracking-mlflow-wandb",
        "programmatic-prompt-optimization-dspy",
        "model-versioning-continuous-deployment",
        "semantic-caching-cost-latency-optimization",
        "llm-cost-engineering-token-economics",
        "model-gateways-routing-fallbacks",
        "design-conversational-ai-support-bot",
    ],
    "Portfolio Capstones": [
        "capstone-delivery-eta-prediction",
        "capstone-product-ranking-recommendation",
        "capstone-demand-forecasting-alerts",
        "capstone-damaged-package-vision-classifier",
        "capstone-production-ml-pipeline",
        "capstone-document-qa-product",
        "capstone-evaluation-dashboard",
        "capstone-fine-tuned-classifier",
        "capstone-reproducible-research-study",
    ],
    "Transformer Deep Dives": [
        "sentence-embeddings-contrastive-learning",
        "embeddings-cosine-dot-product-quantization",
        "scaled-dot-product-attention",
        "vision-transformers-image-encoders",
        "positional-encoding-rope-alibi",
        "layer-normalization-pre-ln-post-ln",
        "mechanistic-interpretability-sparse-autoencoders",
        "decoding-strategies-greedy-beam-nucleus",
    ],
    "Advanced Training & Adaptation": [
        "scaling-laws-compute-optimal-training",
        "pre-training-data-pipelines-scale",
        "build-gpt-from-scratch-lab",
        "jax-for-ml-research",
        "continued-pretraining-domain-adaptation",
        "synthetic-data-generation-pipelines-llms",
        "supervised-fine-tuning-pipeline",
        "mixed-precision-training-loss-scaling",
        "distributed-training-fsdp-deepspeed-zero",
        "lora-parameter-efficient-fine-tuning",
        "training-run-operations",
        "reward-modeling-from-preference-data",
        "rlhf-dpo-aligning-language-models",
        "constitutional-ai-automated-red-teaming",
        "rlvr-verifiable-rewards-training",
        "knowledge-distillation-llms",
        "decision-models-jev-kev",
        "model-merging-weight-interpolation",
    ],
    "Advanced Agents & Retrieval": [
        "vector-database-internals-hnsw-ivf",
        "advanced-rag-query-rewriting-self-rag",
        "graphrag-knowledge-graphs-vector-search",
        "enterprise-rag-security-rbac-access-control",
        "structured-output-constrained-generation",
        "agentic-architectures-react-plan-execute",
        "guardrails-safety-filters-production",
        "code-generation-agents-sandboxing",
        "local-agent-sandboxing-seatbelt-landlock",
        "computer-use-gui-browser-agents",
        "human-in-the-loop-agent-architecture",
        "ai-coding-workflow-with-agents",
        "agent-memory-persistence-patterns",
        "agent-failure-states-retry-fallback",
        "recursive-language-models-rlm",
        "multi-agent-dags-langgraph-orchestration",
        "capstone-production-llm-agent",
    ],
    "Inference & Production Scale": [
        "inference-mechanics-ttft-tps-kv-cache",
        "multi-query-grouped-query-attention",
        "kv-cache-paged-attention-llm-serving",
        "prefix-caching-prompt-caching",
        "flashattention-memory-efficient-attention",
        "continuous-batching-request-scheduling",
        "scaling-llm-inference-batching-kv-cache",
        "model-parallelism-for-llm-inference",
        "accelerator-architecture-field-guide",
        "gpu-profiling-correctness-benchmarking",
        "gpu-kernel-performance-engineering-lab",
        "gpu-parallel-primitives-lab",
        "gpu-compilers-kernel-languages",
        "gemm-naive-cuda-tensor-cores",
        "low-precision-gpu-programming",
        "gpu-runtime-execution-lab",
        "ai-generated-kernel-engineering",
        "model-quantization-gptq-awq-gguf",
        "local-llm-deployment-hardware-quantization",
        "slm-specialization-edge-deployment",
        "speculative-decoding",
        "long-context-window-management",
        "mixture-of-experts-architecture",
        "state-space-models-mamba-alternatives",
        "reasoning-models-test-time-compute",
        "advanced-mlops-devops-ai",
        "llm-deployment-gpu-serving-autoscaling",
        "gpu-failure-operations",
        "distributed-inference-data-plane",
        "serving-benchmark-engineering",
        "ab-testing-online-evaluation-llms",
    ],
    "System Design Capstones": [
        "design-real-time-content-moderation-system",
        "design-code-completion-system",
        "design-multi-tenant-llm-serving-platform",
        "design-agent-sandbox-platform",
        "design-llm-powered-search-engine",
        "vision-language-models-clip-beyond",
        "multimodal-llms-architecture-design",
        "image-generation-diffusion-models",
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
        "deep-dive-vllm",
        "deep-dive-skyrl",
        "deep-dive-flashattention",
        "deep-dive-flashinfer",
        "deep-dive-deepgemm",
        "deep-dive-nccl",
        "deep-dive-megatron",
        "deep-dive-deepspeed",
        "deep-dive-ray",
        "deep-dive-mlflow",
        "deep-dive-pytorch",
        "deep-dive-transformers",
        "deep-dive-sglang",
        "deep-dive-slime",
        "deep-dive-deepep",
        "deep-dive-tinker",
        "deep-dive-light-peft",
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
        const sectionDir = join(CONTENT_DIR, folderName)
        if (!existsSync(sectionDir)) continue

        const articleDirs = readdirSync(sectionDir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name)

        for (const slug of articleDirs) {
            const questionDir = join(sectionDir, slug)
            const bundle = loadContentBundle(questionDir, audience, edition)
            if (!bundle) continue
            const metadata = bundle.metadata as QuestionMetadata
            if (metadata.visibility?.website === false) websiteExcludedSlugs.add(metadata.slug)
            if (!isVisibleToAudience(bundle.metadata, audience)) continue
            allQuestions.push(loadQuestion(questionDir, audience, bundle))
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

export function getQuestions(audience: ContentAudience = "website", edition: ContentEdition = "reference"): Question[] {
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

function loadQuestionByIndexedSlug(slug: string): Question | undefined {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return undefined

    const cached = _singleQuestionCache.get(slug)
    if (cached) return cached

    const route = getQuestionRoute(slug)
    if (!route || route.hidden) return undefined

    const questionDir = join(CONTENT_DIR, route.directory)
    const bundle = loadContentBundle(questionDir, "website")
    if (!bundle || !isVisibleToAudience(bundle.metadata, "website")) return undefined

    const question = loadQuestion(questionDir, "website", bundle)
    if (question.slug !== route.canonicalSlug) return undefined
    if (question.slug !== slug && !question.aliases?.includes(slug)) return undefined

    _singleQuestionCache.set(question.slug, question)
    for (const alias of question.aliases ?? []) {
        _singleQuestionCache.set(alias, question)
    }
    return question
}

function findQuestionBySlugOrAlias(slug: string): Question | undefined {
    if (_questionsCache.has("website:reference") || isDev) {
        return getQuestions().find((q) => q.slug === slug || q.aliases?.includes(slug))
    }

    return loadQuestionByIndexedSlug(slug)
}

export function getCanonicalQuestionSlug(slug: string): string | undefined {
    return findQuestionBySlugOrAlias(slug)?.slug
}

/**
 * Get a single question by slug. All lessons are open, so this returns full
 * content for anonymous and logged-in users alike.
 */
export function getQuestionForUser(slug: string, _legacyAccessFlag: boolean): QuestionSummary | undefined {
    void _legacyAccessFlag
    return findQuestionBySlugOrAlias(slug)
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
    "Computing Foundations": {
        icon: "🛠️",
        description: "Get comfortable with arrays, data, and the computing tools you will use to run and understand AI experiments.",
        color: "text-cyan-400",
    },
    "Math & Statistics": {
        icon: "📊",
        description: "Make sense of the numbers behind a model: how it learns, what a result tells you, and how much uncertainty remains.",
        color: "text-sky-400",
    },
    "Preparation & Prerequisites": {
        icon: "📚",
        description: "See how a neural network learns, work through its calculations, and build a first AI application you can follow end to end.",
        color: "text-lime-400",
    },
    "Core LLM Foundations": { icon: "🧪", description: "Follow text into a model and back into an answer, then learn how to tell whether that answer is useful.", color: "text-emerald-400" },
    "ML Algorithms & Evaluation": { icon: "🧮", description: "Build small models and experiments you can inspect. Learn why a promising score can hide a problem with the data or the test.", color: "text-amber-400" },
    "Production ML Systems": { icon: "📦", description: "Keep predictions useful as data changes. Connect your model to feature pipelines, monitoring, and decisions about when to retrain.", color: "text-teal-400" },
    "Applied LLM Engineering": { icon: "🧰", description: "Give a model useful context and tools, then check the answers, costs, and behavior of the application you are building.", color: "text-blue-400" },
    "Portfolio Capstones": { icon: "🎓", description: "Turn what you have learned into a project you can run, inspect, and explain to someone else.", color: "text-red-400" },
    "Transformer Deep Dives": { icon: "🧠", description: "Look inside the model's calculations. Trace how representations, attention, and decoding shape the output you see.", color: "text-violet-400" },
    "Advanced Training & Adaptation": { icon: "🧬", description: "Investigate a behavior you want to improve, then connect your data and training choices to experiments that could test the improvement.", color: "text-rose-400" },
    "Advanced Agents & Retrieval": { icon: "🤖", description: "Build assistants that can search, remember, and act. Work through what they need to recover from mistakes and involve a person.", color: "text-purple-400" },
    "Inference & Production Scale": { icon: "⚡", description: "Find what keeps requests waiting. Follow the work through memory, kernels, and serving systems before choosing an optimization.", color: "text-yellow-400" },
    "System Design Capstones": { icon: "🏗️", description: "Bring the pieces together around an AI product. Work through its requests, tradeoffs, and failure cases as a complete design.", color: "text-orange-400" },
    "AI Lab Interviewing": { icon: "🎤", description: "Practice solving unfamiliar problems and explaining your choices, with concrete work you can discuss in an interview.", color: "text-fuchsia-400" },
    "Project Deep Dives": { icon: "🔬", description: "Open the code behind AI infrastructure projects. Follow a mechanism into its implementation and see why the project makes those choices.", color: "text-cyan-300" },
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
