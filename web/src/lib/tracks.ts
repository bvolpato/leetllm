import { getQuestions, type Difficulty, type Question, type Section, type Category } from "./questions"
import { join } from "path"
import { isVisibleToAudience } from "./content-audience"
import { loadContentBundle } from "./content-bundle"
import { getQuestionRoute } from "./content-route-index"

export type LearningTrack = {
    slug: string
    title: string
    description: string
    audience: string
    outcome: string
    level: "Beginner" | "Intermediate" | "Advanced"
    timeEstimate: string
    lessonSlugs: string[]
}

export type TrackLesson = {
    index: number
    title: string
    slug: string
    section: Section
    category: Category
    difficulty: Difficulty
    timeEstimate: number
    shortDescription: string
}

export const learningTracks: LearningTrack[] = [
    {
        slug: "ai-engineer-foundations",
        title: "AI Engineer Foundations",
        description: "Curious about how models work? Start with small experiments and build the foundations for your first LLM app.",
        audience: "Software engineers, students, and career switchers new to ML systems.",
        outcome: "You can read model diagrams, run Python experiments, call LLM APIs, and explain the first full AI app path.",
        level: "Beginner",
        timeEstimate: "23 lessons",
        lessonSlugs: [
            "git-shell-linux-reproducible-ai",
            "docker-containerization-reproducible-ai",
            "python-for-ai-engineering",
            "numpy-and-tensor-shapes",
            "data-structures-for-ai-systems",
            "sql-databases-data-modeling-ai",
            "dataset-pipelines-data-quality",
            "calculus-gradients-backpropagation-optimization",
            "vectors-matrices-tensors",
            "probability-for-machine-learning",
            "statistics-estimation-uncertainty",
            "neural-networks-from-scratch",
            "training-backpropagation-gradient-descent",
            "pytorch-training-loops",
            "transformer-architecture-end-to-end",
            "language-modeling-next-token-prediction",
            "gpt-to-modern-llms",
            "tokenization-bpe-wordpiece-sentencepiece",
            "word-embeddings-contextual-representations",
            "prompt-engineering-fundamentals",
            "calling-llm-apis-production",
            "first-ai-app-end-to-end",
            "llm-evaluation-benchmarks-limitations",
        ],
    },
    {
        slug: "production-ml-systems",
        title: "Production ML Systems",
        description: "Take a model beyond the notebook. Follow what happens to its data, predictions, and reliability once people depend on it.",
        audience: "ML engineers, data scientists, and backend engineers shipping predictive systems beyond notebooks.",
        outcome: "You can build a reproducible training pipeline, preserve batch and online feature parity, and operate a monitored model release.",
        level: "Intermediate",
        timeEstimate: "25 lessons",
        lessonSlugs: [
            "python-for-ai-engineering",
            "numpy-and-tensor-shapes",
            "sql-databases-data-modeling-ai",
            "probability-for-machine-learning",
            "statistics-estimation-uncertainty",
            "linear-regression-from-scratch",
            "logistic-regression-classification-metrics-from-scratch",
            "decision-trees-random-forests-gradient-boosting",
            "cross-validation-leakage-generalization",
            "dataset-pipelines-data-quality",
            "feature-engineering-production-ml",
            "batch-streaming-feature-pipelines",
            "gradient-boosted-trees-production",
            "ranking-recommendation-systems",
            "forecasting-anomaly-detection",
            "convolutional-neural-networks-from-scratch",
            "monitoring-predictive-models",
            "experiment-design-ab-testing",
            "experiment-tracking-mlflow-wandb",
            "model-versioning-continuous-deployment",
            "capstone-delivery-eta-prediction",
            "capstone-product-ranking-recommendation",
            "capstone-demand-forecasting-alerts",
            "capstone-damaged-package-vision-classifier",
            "capstone-production-ml-pipeline",
        ],
    },
    {
        slug: "rag-and-search-systems",
        title: "RAG and Search Systems",
        description: "Help someone find an answer in documents they do not have time to search by hand, with sources they can check.",
        audience: "Builders working on search, support bots, internal knowledge assistants, and document QA.",
        outcome: "You can design a retrieval pipeline, debug faithfulness failures, and choose vector, lexical, and graph retrieval pieces deliberately.",
        level: "Intermediate",
        timeEstimate: "22 lessons",
        lessonSlugs: [
            "word-embeddings-contextual-representations",
            "sentence-embeddings-contrastive-learning",
            "embeddings-cosine-dot-product-quantization",
            "dimensionality-reduction-embeddings",
            "file-ingestion-pdfs-html-ocr-markdown",
            "chunking-strategies-document-processing",
            "core-retrieval-algorithms",
            "design-production-rag-pipeline",
            "vector-database-internals-hnsw-ivf",
            "hybrid-search-dense-sparse-retrieval",
            "reranking-cross-encoders-rag",
            "rag-evaluation-faithfulness-relevance",
            "llm-as-judge-automated-evaluation",
            "hallucination-detection-mitigation",
            "observability-monitoring-llm-systems",
            "advanced-rag-query-rewriting-self-rag",
            "graphrag-knowledge-graphs-vector-search",
            "enterprise-rag-security-rbac-access-control",
            "model-versioning-continuous-deployment",
            "semantic-caching-cost-latency-optimization",
            "capstone-document-qa-product",
            "design-llm-powered-search-engine",
        ],
    },
    {
        slug: "agents-and-tools",
        title: "Agents and Tool Use",
        description: "Build an assistant you could delegate useful work to, then learn how to inspect its progress and help it recover when an approach fails.",
        audience: "Engineers building coding agents, workflow agents, browser agents, or production tool-use systems.",
        outcome: "You can design agent loops with tools, state, recovery policy, evals, and review gates.",
        level: "Intermediate",
        timeEstimate: "25 lessons",
        lessonSlugs: [
            "prompt-engineering-fundamentals",
            "calling-llm-apis-production",
            "function-calling-tool-use-llms",
            "structured-output-constrained-generation",
            "mcp-tool-protocol-standards",
            "agentic-architectures-react-plan-execute",
            "long-context-engineering-beyond-management",
            "prompt-injection-defense-strategies",
            "responsible-ai-governance-ethics-compliance",
            "guardrails-safety-filters-production",
            "agent-evaluation-benchmarks",
            "observability-monitoring-llm-systems",
            "code-generation-agents-sandboxing",
            "computer-use-gui-browser-agents",
            "human-in-the-loop-agent-architecture",
            "ai-coding-workflow-with-agents",
            "agent-memory-persistence-patterns",
            "agent-failure-states-retry-fallback",
            "multi-agent-dags-langgraph-orchestration",
            "design-conversational-ai-support-bot",
            "model-versioning-continuous-deployment",
            "capstone-document-qa-product",
            "capstone-evaluation-dashboard",
            "capstone-fine-tuned-classifier",
            "capstone-production-llm-agent",
        ],
    },
    {
        slug: "inference-and-serving",
        title: "Inference and Serving",
        description: "Find out why a model keeps people waiting, where the hardware spends its time, and which changes improve the experience.",
        audience: "Engineers responsible for GPU performance, latency, cost, local deployment, model gateways, and serving reliability.",
        outcome: "You can measure kernels and serving systems, diagnose bottlenecks, and choose the optimization that fits each workload.",
        level: "Advanced",
        timeEstimate: "33 lessons",
        lessonSlugs: [
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
            "reasoning-models-test-time-compute",
            "llm-cost-engineering-token-economics",
            "model-gateways-routing-fallbacks",
            "observability-monitoring-llm-systems",
            "model-versioning-continuous-deployment",
            "llm-deployment-gpu-serving-autoscaling",
            "gpu-failure-operations",
            "distributed-inference-data-plane",
            "serving-benchmark-engineering",
            "ab-testing-online-evaluation-llms",
        ],
    },
    {
        slug: "training-and-alignment",
        title: "Training and Alignment",
        description: "Choose a model behavior you want to improve. Learn how data, feedback, and training experiments can help you teach it.",
        audience: "Readers moving from API usage into model adaptation, post-training, and training infrastructure.",
        outcome: "You can explain the lifecycle of a model update and choose the right adaptation method for a product constraint.",
        level: "Advanced",
        timeEstimate: "26 lessons",
        lessonSlugs: [
            "llm-lifecycle-training-to-deployment",
            "pytorch-training-loops",
            "scaling-laws-compute-optimal-training",
            "dataset-pipelines-data-quality",
            "pre-training-data-pipelines-scale",
            "build-gpt-from-scratch-lab",
            "instruction-tuning-chat-templates",
            "continued-pretraining-domain-adaptation",
            "llm-as-judge-automated-evaluation",
            "synthetic-data-generation-pipelines-llms",
            "supervised-fine-tuning-pipeline",
            "experiment-tracking-mlflow-wandb",
            "cuda-gpu-computing-for-ml",
            "mixed-precision-training-loss-scaling",
            "distributed-training-fsdp-deepspeed-zero",
            "lora-parameter-efficient-fine-tuning",
            "training-run-operations",
            "data-labeling-human-feedback-active-learning",
            "reward-modeling-from-preference-data",
            "rlhf-dpo-aligning-language-models",
            "constitutional-ai-automated-red-teaming",
            "rlvr-verifiable-rewards-training",
            "knowledge-distillation-llms",
            "llm-evaluation-benchmarks-limitations",
            "model-versioning-continuous-deployment",
            "capstone-fine-tuned-classifier",
        ],
    },
    {
        slug: "ai-research-scientist",
        title: "AI Research Scientist",
        description: "Learn to turn open questions into reproducible studies across model training, reinforcement learning, agents, and evaluation.",
        audience: "Aspiring research scientists and research engineers who need rigorous experimental judgment, implementation depth, and public evidence.",
        outcome: "You can frame a falsifiable question, reproduce a baseline, run controlled ablations, evaluate agent and model behavior, and publish a defensible research artifact.",
        level: "Advanced",
        timeEstimate: "45 lessons",
        lessonSlugs: [
            "linear-algebra-machine-learning-deeper",
            "optimization-algorithms-adam-schedulers",
            "probability-for-machine-learning",
            "statistics-estimation-uncertainty",
            "distributions-sampling-simulation",
            "hypothesis-tests-confidence-intervals-passk",
            "cross-validation-leakage-generalization",
            "experiment-design-ab-testing",
            "introduction-to-reinforcement-learning-fundamentals",
            "dataset-pipelines-data-quality",
            "experiment-tracking-mlflow-wandb",
            "pytorch-training-loops",
            "cuda-gpu-computing-for-ml",
            "transformer-architecture-end-to-end",
            "language-modeling-next-token-prediction",
            "scaled-dot-product-attention",
            "layer-normalization-pre-ln-post-ln",
            "inference-mechanics-ttft-tps-kv-cache",
            "flashattention-memory-efficient-attention",
            "scaling-laws-compute-optimal-training",
            "pre-training-data-pipelines-scale",
            "build-gpt-from-scratch-lab",
            "jax-for-ml-research",
            "instruction-tuning-chat-templates",
            "continued-pretraining-domain-adaptation",
            "llm-as-judge-automated-evaluation",
            "synthetic-data-generation-pipelines-llms",
            "supervised-fine-tuning-pipeline",
            "mixed-precision-training-loss-scaling",
            "distributed-training-fsdp-deepspeed-zero",
            "training-run-operations",
            "data-labeling-human-feedback-active-learning",
            "reward-modeling-from-preference-data",
            "rlhf-dpo-aligning-language-models",
            "constitutional-ai-automated-red-teaming",
            "rlvr-verifiable-rewards-training",
            "function-calling-tool-use-llms",
            "agentic-architectures-react-plan-execute",
            "agent-evaluation-benchmarks",
            "llm-evaluation-benchmarks-limitations",
            "kv-cache-paged-attention-llm-serving",
            "continuous-batching-request-scheduling",
            "ab-testing-online-evaluation-llms",
            "mechanistic-interpretability-sparse-autoencoders",
            "capstone-reproducible-research-study",
        ],
    },
    {
        slug: "ai-lab-interview-prep",
        title: "AI Lab Interview Prep",
        description: "Practice building, debugging, and explaining AI systems so you have concrete work and clear reasoning to bring into an interview.",
        audience: "Engineers preparing for AI lab, applied research engineer, or LLM systems interviews.",
        outcome: "You can practice the concepts interviewers probe while still learning the underlying systems deeply.",
        level: "Advanced",
        timeEstimate: "20 lessons",
        lessonSlugs: [
            "python-for-ai-engineering",
            "data-structures-for-ai-systems",
            "algorithms-complexity-ml-engineers",
            "probability-for-machine-learning",
            "hypothesis-tests-confidence-intervals-passk",
            "softmax-cross-entropy-optimization",
            "pytorch-training-loops",
            "ai-lab-coding-interview-python-systems",
            "transformer-architecture-end-to-end",
            "llm-evaluation-benchmarks-limitations",
            "experiment-design-ab-testing",
            "agent-evaluation-benchmarks",
            "llm-as-judge-automated-evaluation",
            "inference-mechanics-ttft-tps-kv-cache",
            "design-code-completion-system",
            "design-multi-tenant-llm-serving-platform",
            "design-reasoning-agent-test-time-compute",
            "ai-lab-system-design-interview",
            "ai-lab-behavioral-interview",
            "ai-lab-technical-presentation",
        ],
    },
]

function publicTrack(track: LearningTrack, questions: Question[]): LearningTrack {
    const { lessons } = resolveTrackLessons(track, questions)
    return { ...track, lessonSlugs: lessons.map(lesson => lesson.slug), timeEstimate: `${lessons.length} ${lessons.length === 1 ? "lesson" : "lessons"}` }
}

export function getTracks(questions: Question[] = getQuestions()): LearningTrack[] {
    return learningTracks.map(track => publicTrack(track, questions))
}

export function getTrackBySlug(slug: string): LearningTrack | undefined {
    const track = learningTracks.find((track) => track.slug === slug)
    return track ? publicTrack(track, getQuestions()) : undefined
}

export function resolveTrackLessons(track: LearningTrack, questions: Question[] = getQuestions()) {
    const bySlug = new Map(questions.map((question) => [question.slug, question]))
    const excludedLessonSlugs = track.lessonSlugs.filter((slug) => {
        const question = bySlug.get(slug)
        if (question) return !isVisibleToAudience({ ...question }, "website")
        const route = getQuestionRoute(slug)
        if (!route || route.canonicalSlug !== slug) return false
        if (process.env.NODE_ENV === "production") return route.hidden
        const bundle = loadContentBundle(join(process.cwd(), "src", "content", route.directory), "website")
        return bundle !== null && !isVisibleToAudience(bundle.metadata, "website")
    })
    const excluded = new Set(excludedLessonSlugs)
    const selectedSlugs = track.lessonSlugs.filter((slug) => !excluded.has(slug))
    const missing = selectedSlugs.filter((slug) => !bySlug.has(slug))

    if (missing.length > 0) {
        throw new Error(`Track "${track.slug}" references missing lesson slugs: ${missing.join(", ")}`)
    }

    const lessons: TrackLesson[] = selectedSlugs.map((slug, index) => {
        const question = bySlug.get(slug)
        if (!question) {
            throw new Error(`Track "${track.slug}" references missing lesson slug: ${slug}`)
        }

        return {
            index: index + 1,
            title: question.title,
            slug: question.slug,
            section: question.section,
            category: question.category,
            difficulty: question.difficulty,
            timeEstimate: question.timeEstimate,
            shortDescription: question.shortDescription,
        }
    })
    return { lessons, excludedLessonSlugs }
}

export function getTrackLessons(track: LearningTrack, questions: Question[] = getQuestions()): TrackLesson[] {
    return resolveTrackLessons(track, questions).lessons
}
