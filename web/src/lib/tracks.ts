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
        description: "Build real intuition from tensors, math, and neural networks through Transformers, decoding, prompting, and structured outputs.",
        audience: "Software engineers, students, and career switchers new to ML and LLM systems.",
        outcome: "You can read model diagrams, train small PyTorch models, decode and evaluate LLMs, and build reliable structured LLM workflows.",
        level: "Beginner",
        timeEstimate: "19 lessons",
        lessonSlugs: [
            "numpy-and-tensor-shapes",
            "linear-algebra-machine-learning-deeper",
            "calculus-gradients-backpropagation-optimization",
            "probability-for-machine-learning",
            "hypothesis-tests-confidence-intervals-passk",
            "linear-regression-from-scratch",
            "logistic-regression-classification-metrics-from-scratch",
            "cross-validation-leakage-generalization",
            "neural-networks-from-scratch",
            "pytorch-training-loops",
            "softmax-cross-entropy-optimization",
            "tokenization-bpe-wordpiece-sentencepiece",
            "sentence-embeddings-contrastive-learning",
            "transformer-architecture-end-to-end",
            "language-modeling-next-token-prediction",
            "decoding-strategies-greedy-beam-nucleus",
            "llm-evaluation-benchmarks-limitations",
            "chain-of-thought-advanced-prompting",
            "structured-output-constrained-generation",
        ],
    },
    {
        slug: "production-ml-systems",
        title: "Production ML Systems",
        description: "Take predictive models beyond the notebook. Follow what happens to splits, features, A/B tests, drift, and serving once users depend on them.",
        audience: "ML engineers, data scientists, and backend engineers shipping predictive systems beyond notebooks.",
        outcome: "You can build leakage-free training pipelines, maintain point-in-time feature parity, monitor drift, and scale production serving.",
        level: "Intermediate",
        timeEstimate: "13 lessons",
        lessonSlugs: [
            "numpy-and-tensor-shapes",
            "probability-for-machine-learning",
            "hypothesis-tests-confidence-intervals-passk",
            "linear-regression-from-scratch",
            "logistic-regression-classification-metrics-from-scratch",
            "decision-trees-random-forests-gradient-boosting",
            "clustering-pca-representation-learning",
            "cross-validation-leakage-generalization",
            "experiment-design-ab-testing",
            "feature-engineering-production-ml",
            "pytorch-training-loops",
            "convolutional-neural-networks-from-scratch",
            "llm-deployment-gpu-serving-autoscaling",
        ],
    },
    {
        slug: "rag-and-search-systems",
        title: "RAG and Search Systems",
        description: "Build grounded retrieval pipelines that find the right evidence, verify citations, and debug hallucination failures systematically.",
        audience: "Builders working on search, knowledge assistants, and document QA.",
        outcome: "You can design hybrid dense+sparse retrieval, tune vector indexes and rerankers, and evaluate grounded answers rigorously.",
        level: "Intermediate",
        timeEstimate: "13 lessons",
        lessonSlugs: [
            "sentence-embeddings-contrastive-learning",
            "chunking-strategies-document-processing",
            "embeddings-cosine-dot-product-quantization",
            "core-retrieval-algorithms",
            "design-production-rag-pipeline",
            "llm-as-judge-automated-evaluation",
            "hallucination-detection-mitigation",
            "prompt-injection-defense-strategies",
            "llm-cost-engineering-token-economics",
            "vector-database-internals-hnsw-ivf",
            "advanced-rag-query-rewriting-self-rag",
            "graphrag-knowledge-graphs-vector-search",
            "design-llm-powered-search-engine",
        ],
    },
    {
        slug: "agents-and-tools",
        title: "Agents and Tool Use",
        description: "Build tool-using assistants that plan, execute code safely, manage working memory, and recover cleanly when actions fail.",
        audience: "Engineers building coding agents, workflow agents, or production tool-use systems.",
        outcome: "You can design reliable agent loops with constrained schemas, OS sandboxing, persistent memory, recovery, and trajectory evals.",
        level: "Intermediate",
        timeEstimate: "12 lessons",
        lessonSlugs: [
            "chain-of-thought-advanced-prompting",
            "structured-output-constrained-generation",
            "function-calling-tool-use-llms",
            "prompt-injection-defense-strategies",
            "llm-cost-engineering-token-economics",
            "agentic-architectures-react-plan-execute",
            "long-context-engineering-beyond-management",
            "agent-memory-persistence-patterns",
            "code-generation-agents-sandboxing",
            "agent-failure-states-retry-fallback",
            "multi-agent-dags-langgraph-orchestration",
            "agent-evaluation-benchmarks",
        ],
    },
    {
        slug: "inference-and-serving",
        title: "Inference and Serving",
        description: "Find out why a model keeps people waiting, where GPU memory and compute go, and which kernel or serving optimization moves the needle.",
        audience: "Engineers responsible for GPU kernels, latency, throughput, quantization, and fleet serving reliability.",
        outcome: "You can profile GPU kernels and serving engines, diagnose rooflines and KV bottlenecks, and scale production inference.",
        level: "Advanced",
        timeEstimate: "17 lessons",
        lessonSlugs: [
            "llm-cost-engineering-token-economics",
            "inference-mechanics-ttft-tps-kv-cache",
            "multi-query-grouped-query-attention",
            "kv-cache-paged-attention-llm-serving",
            "flashattention-memory-efficient-attention",
            "continuous-batching-request-scheduling",
            "speculative-decoding",
            "model-quantization-gptq-awq-gguf",
            "local-llm-deployment-hardware-quantization",
            "model-parallelism-for-llm-inference",
            "gpu-kernel-performance-engineering-lab",
            "gpu-parallel-primitives-lab",
            "gpu-compilers-kernel-languages",
            "gemm-naive-cuda-tensor-cores",
            "low-precision-gpu-programming",
            "llm-deployment-gpu-serving-autoscaling",
            "serving-benchmark-engineering",
        ],
    },
    {
        slug: "training-and-alignment",
        title: "Training and Alignment",
        description: "Pretrain, fine-tune, and align language models from scratch through FSDP, LoRA, preference optimization, and verifiable rewards.",
        audience: "Engineers moving from API usage into model pretraining, post-training, and distributed training infrastructure.",
        outcome: "You can design training pipelines, pick the right adaptation method, and verify real capability gains without reward hacking.",
        level: "Advanced",
        timeEstimate: "18 lessons",
        lessonSlugs: [
            "pytorch-training-loops",
            "llm-evaluation-benchmarks-limitations",
            "llm-as-judge-automated-evaluation",
            "scaling-laws-compute-optimal-training",
            "pre-training-data-pipelines-scale",
            "build-gpt-from-scratch-lab",
            "cuda-gpu-computing-for-ml",
            "mixed-precision-training-loss-scaling",
            "distributed-training-fsdp-deepspeed-zero",
            "synthetic-data-generation-pipelines-llms",
            "supervised-fine-tuning-pipeline",
            "lora-parameter-efficient-fine-tuning",
            "introduction-to-reinforcement-learning-fundamentals",
            "reward-modeling-from-preference-data",
            "rlhf-dpo-aligning-language-models",
            "rlvr-verifiable-rewards-training",
            "reasoning-models-test-time-compute",
            "knowledge-distillation-llms",
        ],
    },
    {
        slug: "ai-research-scientist",
        title: "AI Research Scientist",
        description: "Turn open questions into controlled experiments across model architectures, scaling laws, reinforcement learning, interpretability, and evaluation.",
        audience: "Aspiring research scientists and research engineers who need deep mathematical intuition, clean ablations, and experimental rigor.",
        outcome: "You can design falsifiable experiments, implement architectures from scratch, run controlled ablations, and interpret model behavior.",
        level: "Advanced",
        timeEstimate: "28 lessons",
        lessonSlugs: [
            "linear-algebra-machine-learning-deeper",
            "probability-for-machine-learning",
            "hypothesis-tests-confidence-intervals-passk",
            "cross-validation-leakage-generalization",
            "experiment-design-ab-testing",
            "pytorch-training-loops",
            "optimization-algorithms-adam-schedulers",
            "transformer-architecture-end-to-end",
            "language-modeling-next-token-prediction",
            "llm-evaluation-benchmarks-limitations",
            "function-calling-tool-use-llms",
            "llm-as-judge-automated-evaluation",
            "scaled-dot-product-attention",
            "layer-normalization-pre-ln-post-ln",
            "mechanistic-interpretability-sparse-autoencoders",
            "scaling-laws-compute-optimal-training",
            "pre-training-data-pipelines-scale",
            "build-gpt-from-scratch-lab",
            "cuda-gpu-computing-for-ml",
            "mixed-precision-training-loss-scaling",
            "distributed-training-fsdp-deepspeed-zero",
            "synthetic-data-generation-pipelines-llms",
            "supervised-fine-tuning-pipeline",
            "introduction-to-reinforcement-learning-fundamentals",
            "reward-modeling-from-preference-data",
            "rlhf-dpo-aligning-language-models",
            "rlvr-verifiable-rewards-training",
            "reasoning-models-test-time-compute",
        ],
    },
    {
        slug: "ai-lab-interview-prep",
        title: "AI Lab Interview Prep",
        description: "Practice building, debugging, and explaining ML and LLM systems so you bring deep first-principles mastery into every interview round.",
        audience: "Engineers preparing for AI lab, applied research engineer, or LLM systems interviews.",
        outcome: "You can solve Python ML systems coding rounds, design high-scale AI platforms, and defend evaluation and architecture tradeoffs.",
        level: "Advanced",
        timeEstimate: "16 lessons",
        lessonSlugs: [
            "probability-for-machine-learning",
            "hypothesis-tests-confidence-intervals-passk",
            "experiment-design-ab-testing",
            "pytorch-training-loops",
            "softmax-cross-entropy-optimization",
            "transformer-architecture-end-to-end",
            "llm-evaluation-benchmarks-limitations",
            "llm-as-judge-automated-evaluation",
            "scaled-dot-product-attention",
            "agent-evaluation-benchmarks",
            "inference-mechanics-ttft-tps-kv-cache",
            "design-code-completion-system",
            "design-multi-tenant-llm-serving-platform",
            "design-reasoning-agent-test-time-compute",
            "ai-lab-coding-interview-python-systems",
            "ai-lab-system-design-interview",
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
