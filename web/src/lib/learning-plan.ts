import { getSectionCheckHref, getSectionCheckSlug, SECTION_CHECK_QUESTION_COUNT } from "./section-check"
import { QUIZ_PASS_PERCENT } from "./mastery-quiz"
import type { TrackLesson } from "./tracks"

export type LearnerGoal =
    | "foundations"
    | "ml"
    | "rag"
    | "agents"
    | "inference"
    | "training"
    | "research"
    | "interviews"

export type ExperienceLevel = "new" | "working" | "advanced"
export type WeeklyHours = 2 | 4 | 6

export type PlanAnswers = {
    goal: LearnerGoal
    level: ExperienceLevel
    weeklyHours: WeeklyHours
}

export type PlanTrack = {
    slug: string
    title: string
    description: string
    outcome: string
    lessons: TrackLesson[]
    omittedMilestoneIndices?: number[]
}

export type PlanPracticeProblem = {
    slug: string
    title: string
    summary: string
    difficulty: string
    timeEstimateMinutes: number
}

export type PlanTheoryQuiz = {
    slug: string
    title: string
    description: string
    level: string
    estimatedMinutes: number
}

export type LearningPlanCatalog = {
    practiceProblems: PlanPracticeProblem[]
    theoryQuizzes: PlanTheoryQuiz[]
}

export type PlanActivityKind = "lesson" | "section" | "coding" | "exam" | "milestone"

export type PlanActivity = {
    id: string
    kind: PlanActivityKind
    title: string
    description: string
    minutes: number
    href?: string
    lesson?: TrackLesson
    lessonSlug?: string
    lessonSlugs?: string[]
    practiceSlug?: string
    quizSlug?: string
    required: boolean
}

export type PlanWeek = {
    number: number
    title: string
    focus: string
    lessons: TrackLesson[]
    activities: PlanActivity[]
    lessonMinutes: number
    activityMinutes: number
    totalMinutes: number
}

export type LearningPlan = {
    answers: PlanAnswers
    track: PlanTrack
    weeks: PlanWeek[]
    totalLessonMinutes: number
    totalActivityMinutes: number
    practiceMinutesPerWeek: number
    foundationBridgeLessonCount: number
}

export type LearningPlanProgress = {
    readLessonSlugs: ReadonlySet<string>
    passedSectionSlugs: ReadonlySet<string>
    completedPracticeSlugs: ReadonlySet<string>
    passedTheorySlugs: ReadonlySet<string>
}

export const learnerGoalOptions: Array<{
    value: LearnerGoal
    title: string
    description: string
    trackSlug: string
}> = [
    {
        value: "foundations",
        title: "AI engineer",
        description: "Build strong foundations and your first complete AI applications.",
        trackSlug: "ai-engineer-foundations",
    },
    {
        value: "ml",
        title: "Production ML engineer",
        description: "Build validated data, training, deployment, and monitoring pipelines.",
        trackSlug: "production-ml-systems",
    },
    {
        value: "rag",
        title: "RAG and search engineer",
        description: "Build retrieval, reranking, evaluation, and secure knowledge systems.",
        trackSlug: "rag-and-search-systems",
    },
    {
        value: "agents",
        title: "Agent engineer",
        description: "Build reliable tool-using agents with memory, recovery, and review.",
        trackSlug: "agents-and-tools",
    },
    {
        value: "inference",
        title: "Inference engineer",
        description: "Run models with deliberate latency, throughput, and cost tradeoffs.",
        trackSlug: "inference-and-serving",
    },
    {
        value: "training",
        title: "Model training engineer",
        description: "Learn data pipelines, adaptation, alignment, and distributed training.",
        trackSlug: "training-and-alignment",
    },
    {
        value: "research",
        title: "AI research scientist",
        description: "Design controlled experiments, study model behavior, and evaluate new methods rigorously.",
        trackSlug: "ai-research-scientist",
    },
    {
        value: "interviews",
        title: "AI lab candidate",
        description: "Prepare for coding, systems design, eval, and technical interviews.",
        trackSlug: "ai-lab-interview-prep",
    },
]

export const experienceLevelOptions: Array<{
    value: ExperienceLevel
    title: string
    description: string
}> = [
    {
        value: "new",
        title: "New to AI/ML",
        description: "I want more time for concepts, examples, and review.",
    },
    {
        value: "working",
        title: "Building with AI",
        description: "I know core terms and want a steady engineering path.",
    },
    {
        value: "advanced",
        title: "Experienced practitioner",
        description: "I can move faster and focus on implementation details.",
    },
]

export const weeklyHourOptions: Array<{
    value: WeeklyHours
    title: string
    description: string
}> = [
    { value: 2, title: "2+ hours", description: "Two lessons weekly; project weeks may take up to four hours" },
    { value: 4, title: "4 hours", description: "Two focused sessions" },
    { value: 6, title: "6 hours", description: "A deeper weekly cadence" },
]

const levelTimeMultiplier: Record<ExperienceLevel, number> = {
    new: 1.35,
    working: 1.15,
    advanced: 1,
}

const levelWeekBounds: Record<ExperienceLevel, { min: number; max: number }> = {
    new: { min: 8, max: 20 },
    working: { min: 6, max: 16 },
    advanced: { min: 4, max: 18 },
}

type PracticeAssignment = { slug: string; unlockAfterLessonSlug: string }

const goalPracticeAssignments: Record<LearnerGoal, PracticeAssignment[]> = {
    foundations: [
        { slug: "repository-diff", unlockAfterLessonSlug: "numpy-and-tensor-shapes" },
        { slug: "repo-ignore-filter", unlockAfterLessonSlug: "numpy-and-tensor-shapes" },
        { slug: "duplicate-file-groups", unlockAfterLessonSlug: "numpy-and-tensor-shapes" },
        { slug: "file-patch-applier", unlockAfterLessonSlug: "numpy-and-tensor-shapes" },
        { slug: "secret-redactor", unlockAfterLessonSlug: "numpy-and-tensor-shapes" },
        { slug: "log-error-parser", unlockAfterLessonSlug: "cross-validation-leakage-generalization" },
        { slug: "ttl-key-value-store", unlockAfterLessonSlug: "neural-networks-from-scratch" },
        { slug: "in-memory-filesystem", unlockAfterLessonSlug: "neural-networks-from-scratch" },
        { slug: "lru-ttl-cache", unlockAfterLessonSlug: "pytorch-training-loops" },
        { slug: "lfu-ttl-cache", unlockAfterLessonSlug: "pytorch-training-loops" },
        { slug: "longest-match-tokenizer", unlockAfterLessonSlug: "tokenization-bpe-wordpiece-sentencepiece" },
        { slug: "context-window-packer", unlockAfterLessonSlug: "language-modeling-next-token-prediction" },
        { slug: "retry-backoff-planner", unlockAfterLessonSlug: "chain-of-thought-advanced-prompting" },
        { slug: "streaming-token-assembler", unlockAfterLessonSlug: "structured-output-constrained-generation" },
        { slug: "sse-event-parser", unlockAfterLessonSlug: "structured-output-constrained-generation" },
    ],
    ml: [
        { slug: "repository-hash-tree", unlockAfterLessonSlug: "numpy-and-tensor-shapes" },
        { slug: "bounded-worker-queue", unlockAfterLessonSlug: "linear-regression-from-scratch" },
        { slug: "worker-lease-registry", unlockAfterLessonSlug: "decision-trees-random-forests-gradient-boosting" },
        { slug: "workflow-state-machine", unlockAfterLessonSlug: "cross-validation-leakage-generalization" },
        { slug: "experiment-traffic-splitter", unlockAfterLessonSlug: "experiment-design-ab-testing" },
        { slug: "sliding-window-error-counter", unlockAfterLessonSlug: "feature-engineering-production-ml" },
        { slug: "canary-metric-judge", unlockAfterLessonSlug: "llm-deployment-gpu-serving-autoscaling" },
        { slug: "idempotent-ledger", unlockAfterLessonSlug: "llm-deployment-gpu-serving-autoscaling" },
    ],
    rag: [
        { slug: "same-host-crawler", unlockAfterLessonSlug: "chunking-strategies-document-processing" },
        { slug: "streaming-markdown-parser", unlockAfterLessonSlug: "chunking-strategies-document-processing" },
        { slug: "rag-chunk-selector", unlockAfterLessonSlug: "core-retrieval-algorithms" },
        { slug: "codebase-symbol-index", unlockAfterLessonSlug: "core-retrieval-algorithms" },
        { slug: "eval-failure-aggregator", unlockAfterLessonSlug: "design-production-rag-pipeline" },
        { slug: "document-permission-filter", unlockAfterLessonSlug: "design-production-rag-pipeline" },
        { slug: "secret-redactor", unlockAfterLessonSlug: "prompt-injection-defense-strategies" },
        { slug: "lru-ttl-cache", unlockAfterLessonSlug: "llm-cost-engineering-token-economics" },
        { slug: "lfu-ttl-cache", unlockAfterLessonSlug: "llm-cost-engineering-token-economics" },
        { slug: "sliding-window-error-counter", unlockAfterLessonSlug: "graphrag-knowledge-graphs-vector-search" },
        { slug: "canary-metric-judge", unlockAfterLessonSlug: "design-llm-powered-search-engine" },
    ],
    agents: [
        { slug: "retry-backoff-planner", unlockAfterLessonSlug: "chain-of-thought-advanced-prompting" },
        { slug: "streaming-token-assembler", unlockAfterLessonSlug: "structured-output-constrained-generation" },
        { slug: "sse-event-parser", unlockAfterLessonSlug: "structured-output-constrained-generation" },
        { slug: "tool-call-schema-validator", unlockAfterLessonSlug: "function-calling-tool-use-llms" },
        { slug: "webhook-idempotency-receiver", unlockAfterLessonSlug: "function-calling-tool-use-llms" },
        { slug: "context-window-packer", unlockAfterLessonSlug: "long-context-engineering-beyond-management" },
        { slug: "prompt-section-extractor", unlockAfterLessonSlug: "prompt-injection-defense-strategies" },
        { slug: "secret-redactor", unlockAfterLessonSlug: "prompt-injection-defense-strategies" },
        { slug: "eval-failure-aggregator", unlockAfterLessonSlug: "agent-evaluation-benchmarks" },
        { slug: "agent-event-timeline", unlockAfterLessonSlug: "agent-failure-states-retry-fallback" },
        { slug: "command-log-classifier", unlockAfterLessonSlug: "agent-failure-states-retry-fallback" },
        { slug: "file-patch-applier", unlockAfterLessonSlug: "code-generation-agents-sandboxing" },
        { slug: "pr-readiness-gate", unlockAfterLessonSlug: "code-generation-agents-sandboxing" },
        { slug: "patch-conflict-detector", unlockAfterLessonSlug: "code-generation-agents-sandboxing" },
        { slug: "codebase-symbol-index", unlockAfterLessonSlug: "code-generation-agents-sandboxing" },
        { slug: "ttl-key-value-store", unlockAfterLessonSlug: "agent-memory-persistence-patterns" },
        { slug: "transactional-kv-store", unlockAfterLessonSlug: "agent-memory-persistence-patterns" },
        { slug: "circuit-breaker-state", unlockAfterLessonSlug: "agent-failure-states-retry-fallback" },
        { slug: "idempotent-ledger", unlockAfterLessonSlug: "agent-failure-states-retry-fallback" },
        { slug: "workflow-state-machine", unlockAfterLessonSlug: "multi-agent-dags-langgraph-orchestration" },
        { slug: "bounded-worker-queue", unlockAfterLessonSlug: "multi-agent-dags-langgraph-orchestration" },
        { slug: "dependency-scheduler-retries", unlockAfterLessonSlug: "multi-agent-dags-langgraph-orchestration" },
    ],
    inference: [
        { slug: "streaming-token-assembler", unlockAfterLessonSlug: "inference-mechanics-ttft-tps-kv-cache" },
        { slug: "sse-event-parser", unlockAfterLessonSlug: "inference-mechanics-ttft-tps-kv-cache" },
        { slug: "lru-ttl-cache", unlockAfterLessonSlug: "kv-cache-paged-attention-llm-serving" },
        { slug: "lfu-ttl-cache", unlockAfterLessonSlug: "kv-cache-paged-attention-llm-serving" },
        { slug: "batch-inference-scheduler", unlockAfterLessonSlug: "continuous-batching-request-scheduling" },
        { slug: "bounded-worker-queue", unlockAfterLessonSlug: "continuous-batching-request-scheduling" },
        { slug: "priority-deadline-scheduler", unlockAfterLessonSlug: "continuous-batching-request-scheduling" },
        { slug: "multi-tenant-job-scheduler", unlockAfterLessonSlug: "continuous-batching-request-scheduling" },
        { slug: "context-window-packer", unlockAfterLessonSlug: "speculative-decoding" },
        { slug: "model-fallback-router", unlockAfterLessonSlug: "llm-cost-engineering-token-economics" },
        { slug: "token-bucket-rate-limiter", unlockAfterLessonSlug: "llm-cost-engineering-token-economics" },
        { slug: "token-budget-ledger", unlockAfterLessonSlug: "llm-cost-engineering-token-economics" },
        { slug: "circuit-breaker-state", unlockAfterLessonSlug: "llm-deployment-gpu-serving-autoscaling" },
        { slug: "sliding-window-error-counter", unlockAfterLessonSlug: "llm-deployment-gpu-serving-autoscaling" },
        { slug: "canary-metric-judge", unlockAfterLessonSlug: "serving-benchmark-engineering" },
    ],
    training: [
        { slug: "repository-hash-tree", unlockAfterLessonSlug: "pre-training-data-pipelines-scale" },
        { slug: "bounded-worker-queue", unlockAfterLessonSlug: "pre-training-data-pipelines-scale" },
        { slug: "worker-lease-registry", unlockAfterLessonSlug: "distributed-training-fsdp-deepspeed-zero" },
        { slug: "eval-failure-aggregator", unlockAfterLessonSlug: "supervised-fine-tuning-pipeline" },
        { slug: "experiment-traffic-splitter", unlockAfterLessonSlug: "lora-parameter-efficient-fine-tuning" },
        { slug: "canary-metric-judge", unlockAfterLessonSlug: "rlvr-verifiable-rewards-training" },
    ],
    research: [
        { slug: "experiment-traffic-splitter", unlockAfterLessonSlug: "experiment-design-ab-testing" },
        { slug: "tool-call-schema-validator", unlockAfterLessonSlug: "function-calling-tool-use-llms" },
        { slug: "repository-hash-tree", unlockAfterLessonSlug: "pre-training-data-pipelines-scale" },
        { slug: "agent-event-timeline", unlockAfterLessonSlug: "rlvr-verifiable-rewards-training" },
        { slug: "eval-failure-aggregator", unlockAfterLessonSlug: "llm-evaluation-benchmarks-limitations" },
        { slug: "canary-metric-judge", unlockAfterLessonSlug: "reasoning-models-test-time-compute" },
    ],
    interviews: [
        { slug: "log-error-parser", unlockAfterLessonSlug: "probability-for-machine-learning" },
        { slug: "ttl-key-value-store", unlockAfterLessonSlug: "hypothesis-tests-confidence-intervals-passk" },
        { slug: "lru-ttl-cache", unlockAfterLessonSlug: "experiment-design-ab-testing" },
        { slug: "workflow-state-machine", unlockAfterLessonSlug: "pytorch-training-loops" },
        { slug: "bounded-worker-queue", unlockAfterLessonSlug: "softmax-cross-entropy-optimization" },
        { slug: "priority-deadline-scheduler", unlockAfterLessonSlug: "transformer-architecture-end-to-end" },
        { slug: "circuit-breaker-state", unlockAfterLessonSlug: "llm-evaluation-benchmarks-limitations" },
        { slug: "sse-event-parser", unlockAfterLessonSlug: "llm-as-judge-automated-evaluation" },
        { slug: "tool-call-schema-validator", unlockAfterLessonSlug: "scaled-dot-product-attention" },
        { slug: "model-fallback-router", unlockAfterLessonSlug: "agent-evaluation-benchmarks" },
        { slug: "batch-inference-scheduler", unlockAfterLessonSlug: "inference-mechanics-ttft-tps-kv-cache" },
        { slug: "canary-metric-judge", unlockAfterLessonSlug: "ai-lab-coding-interview-python-systems" },
    ],
}

const beginnerFriendlyMediumProblems = new Set([
    "rag-chunk-selector",
    "document-permission-filter",
    "tool-call-schema-validator",
    "context-window-packer",
    "agent-event-timeline",
    "circuit-breaker-state",
    "batch-inference-scheduler",
    "model-fallback-router",
])

const finalQuizSlugByLevel: Record<ExperienceLevel, string> = {
    new: "beginner-ai-systems-foundations",
    working: "intermediate-llm-product-systems",
    advanced: "advanced-training-inference-architecture",
}

const projectByGoal: Record<LearnerGoal, string> = {
    foundations: "small AI application",
    ml: "production ML system",
    rag: "cited document Q&A system",
    agents: "tool-using agent",
    inference: "model serving benchmark",
    training: "model adaptation experiment",
    research: "reproducible research study",
    interviews: "AI systems interview packet",
}

export type GoalMilestone = {
    title: string
    deliverable: string
    completionCriteria: string
    estimatedMinutes: number
    unlockAfterLessonSlug: string
}

export const goalMilestones: Record<LearnerGoal, readonly [GoalMilestone, GoalMilestone, GoalMilestone, GoalMilestone]> = {
    foundations: [
        {
            title: "Build a clean tensor and gradient baseline",
            deliverable: "Write a small NumPy script verifying matrix shapes, gradients, and a finite-difference check.",
            completionCriteria: "analytical gradients match numerical checks to 1e-6 on fresh random inputs",
            estimatedMinutes: 45,
            unlockAfterLessonSlug: "calculus-gradients-backpropagation-optimization",
        },
        {
            title: "Build a trustworthy data split and baseline",
            deliverable: "Turn a raw sample into leakage-free train and validation splits with documented baseline metrics.",
            completionCriteria: "the script rejects malformed rows and reports calibrated error intervals",
            estimatedMinutes: 60,
            unlockAfterLessonSlug: "cross-validation-leakage-generalization",
        },
        {
            title: "Train and inspect a small neural language model",
            deliverable: "Save PyTorch training code, a loss curve, validation perplexity, and sample generations.",
            completionCriteria: "another person can rerun training and explain the largest observed failure mode",
            estimatedMinutes: 75,
            unlockAfterLessonSlug: "language-modeling-next-token-prediction",
        },
        {
            title: "Ship an evaluated structured LLM workflow",
            deliverable: "Expose one constrained-output LLM workflow through a CLI or API and run a fixed evaluation set against it.",
            completionCriteria: "the README links a working run, validated schema outputs, latency/cost numbers, and three eval misses",
            estimatedMinutes: 75,
            unlockAfterLessonSlug: "structured-output-constrained-generation",
        },
    ],
    ml: [
        {
            title: "Build a calibrated classification baseline",
            deliverable: "Train logistic regression and baseline models with precision-recall and calibration curves.",
            completionCriteria: "a reviewer can inspect calibration error and threshold tradeoffs on a held-out split",
            estimatedMinutes: 45,
            unlockAfterLessonSlug: "logistic-regression-classification-metrics-from-scratch",
        },
        {
            title: "Define the target and leakage-free split",
            deliverable: "Write the target, prediction timestamp, data cutoff, split method, and baseline metric for one predictive task.",
            completionCriteria: "a reviewer can verify exactly what information is available when each prediction is made",
            estimatedMinutes: 60,
            unlockAfterLessonSlug: "cross-validation-leakage-generalization",
        },
        {
            title: "Build a point-in-time feature and drift pipeline",
            deliverable: "Create one command that builds point-in-time features, trains a baseline, and checks covariate shift.",
            completionCriteria: "two runs from the same data snapshot reproduce the metrics and drift checks cleanly",
            estimatedMinutes: 75,
            unlockAfterLessonSlug: "feature-engineering-production-ml",
        },
        {
            title: "Package monitored production serving",
            deliverable: "Package health checks, latency SLO alerts, and autoscaling thresholds for a deployed model.",
            completionCriteria: "another engineer can inspect live health and diagnose a simulated traffic spike",
            estimatedMinutes: 75,
            unlockAfterLessonSlug: "llm-deployment-gpu-serving-autoscaling",
        },
    ],
    rag: [
        {
            title: "Build the corpus and chunking baseline",
            deliverable: "Ingest and chunk a small document corpus with evaluation queries and expected source passages.",
            completionCriteria: "each query has source-backed expected passages or an explicit abstain outcome",
            estimatedMinutes: 60,
            unlockAfterLessonSlug: "chunking-strategies-document-processing",
        },
        {
            title: "Measure hybrid retrieval and reranking",
            deliverable: "Compare BM25, dense search, RRF, and cross-encoder reranking on recall@k, MRR, and latency.",
            completionCriteria: "the report separates missed evidence from ranking errors on every failed query",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "design-production-rag-pipeline",
        },
        {
            title: "Tune vector indexes and audit faithfulness",
            deliverable: "Benchmark HNSW/IVF recall-latency curves and fix the largest unsupported-claim failure class.",
            completionCriteria: "the same evaluation set verifies the improvement without dropping citation coverage",
            estimatedMinutes: 75,
            unlockAfterLessonSlug: "vector-database-internals-hnsw-ivf",
        },
        {
            title: "Design an end-to-end cited search engine",
            deliverable: "Publish a working query pipeline with citations, hybrid search, vector index tuning, and latency breakdown.",
            completionCriteria: "a reviewer can trace each answer to source passages and reproduce the eval table",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "design-llm-powered-search-engine",
        },
    ],
    agents: [
        {
            title: "Design constrained schemas and tool interfaces",
            deliverable: "Define typed tool schemas, read/write boundaries, and validation checks for one agent task.",
            completionCriteria: "a test run accepts valid tool calls and rejects malformed or out-of-scope arguments",
            estimatedMinutes: 60,
            unlockAfterLessonSlug: "structured-output-constrained-generation",
        },
        {
            title: "Build a plan-and-execute tool loop",
            deliverable: "Implement a multi-step agent loop with explicit state transitions and working-context pruning.",
            completionCriteria: "the trace shows every tool call, observation, and stop condition cleanly",
            estimatedMinutes: 75,
            unlockAfterLessonSlug: "agentic-architectures-react-plan-execute",
        },
        {
            title: "Isolate tool execution in a sandbox",
            deliverable: "Run agent-generated code inside a restricted sandbox with memory, CPU, and filesystem limits.",
            completionCriteria: "a malicious probe trying to escape the workspace or read secrets is blocked cleanly",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "code-generation-agents-sandboxing",
        },
        {
            title: "Evaluate end-to-end agent trajectories",
            deliverable: "Run pass@k and pass^k benchmarks across multi-step tasks and inspect every failure trajectory.",
            completionCriteria: "the evaluation report pinpoints tool errors, loop stalls, and prompt-injection resilience",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "agent-evaluation-benchmarks",
        },
    ],
    inference: [
        {
            title: "Build a roofline and KV-cache capacity sheet",
            deliverable: "Calculate prefill FLOPs, decode memory bandwidth, KV-cache bytes, and max concurrency for a target GPU.",
            completionCriteria: "the sheet predicts measurable TTFT and throughput ceilings before benchmarking",
            estimatedMinutes: 45,
            unlockAfterLessonSlug: "inference-mechanics-ttft-tps-kv-cache",
        },
        {
            title: "Measure batching and scheduling tradeoffs",
            deliverable: "Compare static vs continuous batching and chunked prefill on TTFT, TPOT, and goodput.",
            completionCriteria: "repeated runs quantify p50/p95 latency under increasing arrival rates",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "continuous-batching-request-scheduling",
        },
        {
            title: "Benchmark quantization or speculative decoding",
            deliverable: "Compare one quantization or speculative-decoding change against FP16 under identical load.",
            completionCriteria: "the comparison reports latency, throughput, memory, and perplexity/quality delta together",
            estimatedMinutes: 75,
            unlockAfterLessonSlug: "speculative-decoding",
        },
        {
            title: "Run an open-loop serving benchmark",
            deliverable: "Publish a reproducible serving benchmark avoiding coordinated omission with autoscaling headroom.",
            completionCriteria: "an engineer can rerun the benchmark and reproduce the goodput curve",
            estimatedMinutes: 75,
            unlockAfterLessonSlug: "serving-benchmark-engineering",
        },
    ],
    training: [
        {
            title: "Audit a pretraining data pipeline",
            deliverable: "Document deduplication, quality filtering, tokenization packing, and contamination checks on a corpus sample.",
            completionCriteria: "every sample resolves cleanly to its source filter stats and token distribution",
            estimatedMinutes: 60,
            unlockAfterLessonSlug: "pre-training-data-pipelines-scale",
        },
        {
            title: "Run a reproducible SFT baseline",
            deliverable: "Pin base model, chat template, hyperparameters, and seed, then save loss curves and eval outputs.",
            completionCriteria: "a second run reproduces the loss curve and eval metrics within expected variance",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "supervised-fine-tuning-pipeline",
        },
        {
            title: "Compare SFT, LoRA, and preference alignment",
            deliverable: "Run a controlled LoRA vs DPO ablation against the baseline and inspect reward margins.",
            completionCriteria: "the report shows quality gains, regressions, compute cost, and failure slices",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "rlhf-dpo-aligning-language-models",
        },
        {
            title: "Distill or verify reasoning gains",
            deliverable: "Evaluate a distilled or RLVR-trained checkpoint on held-out verifiable tasks with latency comparison.",
            completionCriteria: "a reviewer can reproduce the checkpoint eval and inspect pass@k vs compute cost",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "knowledge-distillation-llms",
        },
    ],
    research: [
        {
            title: "Design a controlled experiment and power plan",
            deliverable: "Write the hypothesis, baseline, metrics, seed plan, and failure criteria before running ablations.",
            completionCriteria: "a reviewer can reconstruct every planned comparison and rejection threshold",
            estimatedMinutes: 75,
            unlockAfterLessonSlug: "experiment-design-ab-testing",
        },
        {
            title: "Reproduce an architecture or training baseline",
            deliverable: "Implement and train a clean PyTorch GPT baseline with pinned seeds and saved loss curves.",
            completionCriteria: "a clean checkout regenerates the baseline metrics within declared seed tolerance",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "build-gpt-from-scratch-lab",
        },
        {
            title: "Run a controlled post-training ablation",
            deliverable: "Compare one targeted intervention across seeds with confidence intervals and slice breakdowns.",
            completionCriteria: "the evidence separates real mechanism gains from seed noise or judge bias",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "rlhf-dpo-aligning-language-models",
        },
        {
            title: "Analyze test-time compute scaling",
            deliverable: "Measure accuracy vs token budget across verifiable problems and publish plots, code, and negative findings.",
            completionCriteria: "a peer can rerun every table and figure from the saved scripts",
            estimatedMinutes: 75,
            unlockAfterLessonSlug: "reasoning-models-test-time-compute",
        },
    ],
    interviews: [
        {
            title: "Establish a timed ML systems coding baseline",
            deliverable: "Solve and test one Python LLM systems problem under time pressure, then refactor edge cases.",
            completionCriteria: "the scorecard records time spent, missed edge cases, and clean test passes",
            estimatedMinutes: 60,
            unlockAfterLessonSlug: "pytorch-training-loops",
        },
        {
            title: "Build an evaluation judgment writeup",
            deliverable: "Answer one evaluation scenario with metric choice, dataset splits, failure slices, and ship criteria.",
            completionCriteria: "the recommendation changes clearly when a stated failure slice crosses threshold",
            estimatedMinutes: 60,
            unlockAfterLessonSlug: "llm-evaluation-benchmarks-limitations",
        },
        {
            title: "Record a 35-minute AI system design walkthrough",
            deliverable: "Deliver a full design with capacity math, architecture, bottlenecks, and eval plan.",
            completionCriteria: "a self-review identifies one concrete bottleneck fix and updates the diagram",
            estimatedMinutes: 60,
            unlockAfterLessonSlug: "design-code-completion-system",
        },
        {
            title: "Assemble the full AI lab interview packet",
            deliverable: "Package systems coding notes, two end-to-end design diagrams, and quantitative capacity sheets.",
            completionCriteria: "every format has been rehearsed timed with concrete follow-up answers",
            estimatedMinutes: 60,
            unlockAfterLessonSlug: "ai-lab-system-design-interview",
        },
    ],
}

const beginnerFoundationBridgeSlugs = [
    "numpy-and-tensor-shapes",
    "linear-algebra-machine-learning-deeper",
    "calculus-gradients-backpropagation-optimization",
    "probability-for-machine-learning",
    "neural-networks-from-scratch",
    "pytorch-training-loops",
    "transformer-architecture-end-to-end",
    "language-modeling-next-token-prediction",
    "chain-of-thought-advanced-prompting",
    "structured-output-constrained-generation",
]

export const learningPlanConfiguration = {
    schemaVersion: 3,
    foundationTrackSlug: "ai-engineer-foundations",
    goals: learnerGoalOptions,
    levels: experienceLevelOptions.map((option) => ({
        ...option,
        timeMultiplier: levelTimeMultiplier[option.value],
        minWeeks: levelWeekBounds[option.value].min,
        maxWeeks: levelWeekBounds[option.value].max,
    })),
    weeklyHours: weeklyHourOptions,
}

export const MIN_PLAN_LESSONS_PER_WEEK = 2
export const MAX_PLAN_LESSONS_PER_WEEK = SECTION_CHECK_QUESTION_COUNT
export const MAX_TWO_HOUR_PLAN_WEEK_MINUTES = 240
const WEEKLY_SECTION_CHECK_MINUTES = 15

function milestoneDescription(milestone: GoalMilestone): string {
    return `${milestone.deliverable} Done when ${milestone.completionCriteria}.`
}

function withBeginnerFoundations(tracks: PlanTrack[], track: PlanTrack, level: ExperienceLevel): PlanTrack {
    if (level !== "new" || track.slug === learningPlanConfiguration.foundationTrackSlug) return track

    const foundationTrack = tracks.find((candidate) => candidate.slug === learningPlanConfiguration.foundationTrackSlug)
    if (!foundationTrack) throw new Error("Missing AI Engineer Foundations track")

    const foundationBySlug = new Map(foundationTrack.lessons.map((lesson) => [lesson.slug, lesson]))
    const bridgeLessons = beginnerFoundationBridgeSlugs
        .map((slug) => foundationBySlug.get(slug))
        .filter((lesson): lesson is TrackLesson => Boolean(lesson))
    const lessons = new Map<string, TrackLesson>()
    for (const lesson of [...bridgeLessons, ...track.lessons]) lessons.set(lesson.slug, lesson)

    return {
        ...track,
        lessons: [...lessons.values()].map((lesson, index) => ({ ...lesson, index: index + 1 })),
    }
}

function evenlySpacedWeeks(weekCount: number, itemCount: number): number[] {
    const weeks = new Set<number>()
    for (let index = 1; index <= itemCount; index += 1) {
        weeks.add(Math.max(1, Math.round((index * weekCount) / itemCount)))
    }
    return [...weeks].sort((left, right) => left - right)
}

class MilestoneSchedulingError extends Error { }

function relaxMilestoneWeeks(
    lessonWeeks: TrackLesson[][],
    milestoneWeeks: number[],
    milestones: GoalMilestone[],
    timeMultiplier: number,
    maximumWeeklyMinutes: number,
): number[] {
    const weeks = [...milestoneWeeks]
    const lessonLoad = lessonWeeks.map((lessons) => (
        lessons.reduce((total, lesson) => total + estimatedLessonMinutes(lesson, timeMultiplier), 0) +
        WEEKLY_SECTION_CHECK_MINUTES
    ))
    const loadsWithMilestones = () => {
        const loads = [...lessonLoad]
        for (const [index, week] of weeks.entries()) loads[week - 1] += milestones[index].estimatedMinutes
        return loads
    }

    for (let guard = 0; guard < weeks.length * lessonWeeks.length; guard += 1) {
        const loads = loadsWithMilestones()
        const overflowing = weeks.findIndex((week) => loads[week - 1] > maximumWeeklyMinutes)
        if (overflowing < 0) break
        const current = weeks[overflowing]
        const nextMilestoneWeek = weeks[overflowing + 1] ?? lessonWeeks.length + 1
        let moved = false
        for (let candidate = current + 1; candidate < nextMilestoneWeek; candidate += 1) {
            const source = loads[current - 1] - milestones[overflowing].estimatedMinutes
            const destination = loads[candidate - 1] + milestones[overflowing].estimatedMinutes
            if (source <= maximumWeeklyMinutes && destination <= maximumWeeklyMinutes) {
                weeks[overflowing] = candidate
                moved = true
                break
            }
        }
        if (!moved) break
    }
    return weeks
}

function milestoneWeeksFor(answers: PlanAnswers, lessonWeeks: TrackLesson[][], milestones: GoalMilestone[]): number[] {
    const weeks = milestones.map((milestone) => {
        const index = lessonWeeks.findIndex((lessons) => (
            lessons.some((lesson) => lesson.slug === milestone.unlockAfterLessonSlug)
        ))
        if (index < 0) {
            throw new Error(`Missing milestone prerequisite in ${answers.goal} plan: ${milestone.unlockAfterLessonSlug}`)
        }
        return index + 1
    })

    for (let index = 1; index < weeks.length; index += 1) {
        weeks[index] = Math.max(weeks[index], weeks[index - 1] + 1)
    }
    if ((weeks.at(-1) ?? 0) > lessonWeeks.length) {
        throw new MilestoneSchedulingError(`Not enough weeks to separate ${answers.goal} milestones after their prerequisite lessons`)
    }
    return weeks
}

function selectPracticeProblems(
    catalog: LearningPlanCatalog,
    answers: PlanAnswers,
    lessons: TrackLesson[],
) {
    const bySlug = new Map(catalog.practiceProblems.map((problem) => [problem.slug, problem]))
    const lessonIndex = new Map(lessons.map((lesson, index) => [lesson.slug, index]))
    const assignments = goalPracticeAssignments[answers.goal]
    const pool = assignments
        .map((assignment, index) => ({ assignment, problem: bySlug.get(assignment.slug), index }))
        .filter((item): item is { assignment: PracticeAssignment; problem: PlanPracticeProblem; index: number } => (
            Boolean(item.problem) && lessonIndex.has(item.assignment.unlockAfterLessonSlug)
        ))
        .filter(({ problem }) => {
            if (answers.level === "new") return problem.difficulty === "Easy" || beginnerFriendlyMediumProblems.has(problem.slug)
            if (answers.level === "advanced") return problem.difficulty !== "Easy"
            return problem.difficulty !== "Hard"
        })
        .sort((left, right) => {
            const anchorOrder = lessonIndex.get(left.assignment.unlockAfterLessonSlug)! - lessonIndex.get(right.assignment.unlockAfterLessonSlug)!
            return anchorOrder || left.index - right.index
        })
    const requestedCount = answers.weeklyHours === 2 ? 2 : answers.weeklyHours === 4 ? 6 : 8
    const count = Math.min(pool.length, Math.max(2, requestedCount))
    if (count >= pool.length) return pool

    return Array.from({ length: count }, (_, index) => (
        pool[Math.round((index * (pool.length - 1)) / (count - 1))]
    ))
}

function estimatedLessonMinutes(lesson: TrackLesson, timeMultiplier: number) {
    return Math.ceil(lesson.timeEstimate * timeMultiplier)
}

function selectFinalQuiz(catalog: LearningPlanCatalog, answers: PlanAnswers) {
    const slug = answers.level === "advanced" && (answers.goal === "agents" || answers.goal === "interviews")
        ? "expert-ai-platform-judgment"
        : finalQuizSlugByLevel[answers.level]
    return catalog.theoryQuizzes.find((quiz) => quiz.slug === slug)
}

function assignPracticeWeeks(
    practiceProblems: ReturnType<typeof selectPracticeProblems>,
    lessonWeeks: TrackLesson[][],
    baseOverheadMinutes: number[],
    weeklyBudget: number,
    timeMultiplier: number,
    milestoneWeeks: number[],
) {
    const loadByWeek = lessonWeeks.map((lessons, index) => (
        lessons.reduce((total, lesson) => total + estimatedLessonMinutes(lesson, timeMultiplier), 0) + baseOverheadMinutes[index]
    ))
    const countByWeek = Array.from({ length: lessonWeeks.length }, () => 0)

    return practiceProblems.map(({ assignment, problem }) => {
        const unlockIndex = Math.max(0, lessonWeeks.findIndex((lessons) => (
            lessons.some((lesson) => lesson.slug === assignment.unlockAfterLessonSlug)
        )))
        const candidates = Array.from({ length: lessonWeeks.length - unlockIndex }, (_, index) => unlockIndex + index)
        const selectedIndex = candidates.reduce((best, candidate) => {
            const total = loadByWeek[candidate] + problem.timeEstimateMinutes
            const overflow = Math.max(0, total - weeklyBudget)
            const collision = countByWeek[candidate] * 120
            const milestone = milestoneWeeks.includes(candidate + 1) ? 20 : 0
            const finalWeek = candidate === lessonWeeks.length - 1 ? 30 : 0
            const score = overflow * 1000 + collision + milestone + finalWeek + loadByWeek[candidate]

            const bestTotal = loadByWeek[best] + problem.timeEstimateMinutes
            const bestOverflow = Math.max(0, bestTotal - weeklyBudget)
            const bestScore = bestOverflow * 1000 + countByWeek[best] * 120 + (milestoneWeeks.includes(best + 1) ? 20 : 0) + (best === lessonWeeks.length - 1 ? 30 : 0) + loadByWeek[best]
            return score < bestScore ? candidate : best
        }, candidates[0])

        loadByWeek[selectedIndex] += problem.timeEstimateMinutes
        countByWeek[selectedIndex] += 1
        return selectedIndex + 1
    })
}

function activitySchedule(
    catalog: LearningPlanCatalog,
    answers: PlanAnswers,
    lessons: TrackLesson[],
    lessonWeeks: TrackLesson[][],
    weeklyBudget: number,
    maximumWeeklyMinutes: number,
    timeMultiplier: number,
    milestones: GoalMilestone[],
) {
    const weekCount = lessonWeeks.length
    const practiceProblems = selectPracticeProblems(catalog, answers, lessons)
    const milestoneWeeks = relaxMilestoneWeeks(
        lessonWeeks,
        milestoneWeeksFor(answers, lessonWeeks, milestones),
        milestones,
        timeMultiplier,
        maximumWeeklyMinutes,
    )
    const finalQuiz = selectFinalQuiz(catalog, answers)
    const baseOverheadMinutes = Array.from({ length: weekCount }, () => WEEKLY_SECTION_CHECK_MINUTES)
    for (const [index, week] of milestoneWeeks.entries()) {
        baseOverheadMinutes[week - 1] += milestones[index].estimatedMinutes
    }
    let finalQuizWeek = weekCount - 1
    const finalQuizRequired = answers.goal === "foundations" && answers.level === "new"
    if (finalQuiz && finalQuizRequired) baseOverheadMinutes[finalQuizWeek] += finalQuiz.estimatedMinutes
    const practiceWeeks = assignPracticeWeeks(
        practiceProblems,
        lessonWeeks,
        baseOverheadMinutes,
        weeklyBudget,
        timeMultiplier,
        milestoneWeeks,
    )
    const overheadMinutes = [...baseOverheadMinutes]
    for (const [index, week] of practiceWeeks.entries()) overheadMinutes[week - 1] += practiceProblems[index]?.problem.timeEstimateMinutes ?? 0

    if (finalQuiz && !finalQuizRequired) {
        const finalLessonMinutes = lessonWeeks[weekCount - 1].reduce(
            (total, lesson) => total + estimatedLessonMinutes(lesson, timeMultiplier),
            0,
        )
        if (finalLessonMinutes + overheadMinutes[weekCount - 1] + finalQuiz.estimatedMinutes > weeklyBudget) {
            const availableWeeks = lessonWeeks
                .map((lessons, index) => ({
                    index,
                    total: lessons.reduce((total, lesson) => total + estimatedLessonMinutes(lesson, timeMultiplier), 0) + overheadMinutes[index],
                }))
                .filter(({ index }) => index !== weekCount - 1)
            finalQuizWeek = availableWeeks
                .filter(({ total }) => total + finalQuiz.estimatedMinutes <= weeklyBudget)
                .at(-1)?.index
                ?? availableWeeks.sort((left, right) => left.total - right.total)[0]?.index
                ?? finalQuizWeek
        }
        overheadMinutes[finalQuizWeek] += finalQuiz.estimatedMinutes
    }
    return { practiceProblems, practiceWeeks, milestoneWeeks, finalQuiz, finalQuizWeek, overheadMinutes }
}

function partitionLessons(
    lessons: TrackLesson[],
    overheadMinutes: number[],
    weeklyBudget: number,
    timeMultiplier: number,
): TrackLesson[][] {
    const weekCount = overheadMinutes.length
    const lessonCount = lessons.length
    if (
        lessonCount < weekCount * MIN_PLAN_LESSONS_PER_WEEK ||
        lessonCount > weekCount * MAX_PLAN_LESSONS_PER_WEEK
    ) {
        throw new Error(`Cannot place ${lessonCount} lessons into ${weekCount} weeks with ${MIN_PLAN_LESSONS_PER_WEEK} to ${MAX_PLAN_LESSONS_PER_WEEK} lessons per week`)
    }
    const prefixMinutes = [0]
    for (const lesson of lessons) prefixMinutes.push(prefixMinutes.at(-1)! + estimatedLessonMinutes(lesson, timeMultiplier))

    const costs = Array.from({ length: weekCount + 1 }, () => Array<number>(lessonCount + 1).fill(Number.POSITIVE_INFINITY))
    const starts = Array.from({ length: weekCount + 1 }, () => Array<number>(lessonCount + 1).fill(-1))
    costs[0][0] = 0

    for (let week = 1; week <= weekCount; week += 1) {
        const remainingWeeks = weekCount - week
        const minEnd = Math.max(
            week * MIN_PLAN_LESSONS_PER_WEEK,
            lessonCount - remainingWeeks * MAX_PLAN_LESSONS_PER_WEEK,
        )
        const maxEnd = Math.min(
            week * MAX_PLAN_LESSONS_PER_WEEK,
            lessonCount - remainingWeeks * MIN_PLAN_LESSONS_PER_WEEK,
        )
        for (let end = minEnd; end <= maxEnd; end += 1) {
            const minStart = Math.max(
                (week - 1) * MIN_PLAN_LESSONS_PER_WEEK,
                end - MAX_PLAN_LESSONS_PER_WEEK,
            )
            const maxStart = Math.min(
                (week - 1) * MAX_PLAN_LESSONS_PER_WEEK,
                end - MIN_PLAN_LESSONS_PER_WEEK,
            )
            for (let start = minStart; start <= maxStart; start += 1) {
                const previous = costs[week - 1][start]
                if (!Number.isFinite(previous)) continue
                const total = prefixMinutes[end] - prefixMinutes[start] + overheadMinutes[week - 1]
                const difference = total - weeklyBudget
                const overflow = Math.max(0, difference)
                const cost = previous + difference * difference + overflow * overflow * 20
                if (cost < costs[week][end]) {
                    costs[week][end] = cost
                    starts[week][end] = start
                }
            }
        }
    }

    const weeks = Array.from({ length: weekCount }, () => [] as TrackLesson[])
    let end = lessonCount
    for (let week = weekCount; week >= 1; week -= 1) {
        const start = starts[week][end]
        if (start < 0) throw new Error("Could not partition learning plan lessons")
        weeks[week - 1] = lessons.slice(start, end)
        end = start
    }
    return weeks
}

function weekTitle(lessons: TrackLesson[]) {
    const sections = [...new Set(lessons.map((lesson) => lesson.section))]
    if (sections.length <= 1) return sections[0] ?? "Core concepts"
    return `${sections[0]} to ${sections.at(-1)}`
}

export function isPlanAnswers(value: unknown): value is PlanAnswers {
    if (!value || typeof value !== "object") return false
    const candidate = value as Partial<PlanAnswers>
    return (
        learnerGoalOptions.some((option) => option.value === candidate.goal) &&
        experienceLevelOptions.some((option) => option.value === candidate.level) &&
        weeklyHourOptions.some((option) => option.value === candidate.weeklyHours)
    )
}

export function buildLearningPlan(
    tracks: PlanTrack[],
    answers: PlanAnswers,
    catalog: LearningPlanCatalog,
): LearningPlan {
    const goal = learnerGoalOptions.find((option) => option.value === answers.goal)
    const track = tracks.find((candidate) => candidate.slug === goal?.trackSlug)

    if (!track) throw new Error(`Missing learning track for goal: ${answers.goal}`)

    const plannedTrack = withBeginnerFoundations(tracks, track, answers.level)
    const milestones = goalMilestones[answers.goal]
        .map((definition, index) => ({ definition, index }))
        .filter(({ index }) => !plannedTrack.omittedMilestoneIndices?.includes(index))
    const milestoneDefinitions = milestones.map(({ definition }) => definition)
    const level = learningPlanConfiguration.levels.find((candidate) => candidate.value === answers.level)
    if (!level) throw new Error(`Missing learning plan configuration for level: ${answers.level}`)
    if (plannedTrack.lessons.length === 0) {
        milestoneWeeksFor(answers, [], milestoneDefinitions)
        return {
            answers,
            track: plannedTrack,
            weeks: [],
            totalLessonMinutes: 0,
            totalActivityMinutes: 0,
            practiceMinutesPerWeek: 0,
            foundationBridgeLessonCount: 0,
        }
    }

    const totalLessonMinutes = plannedTrack.lessons.reduce(
        (total, lesson) => total + estimatedLessonMinutes(lesson, level.timeMultiplier),
        0,
    )
    const maxWeeks = Math.min(
        Math.floor(plannedTrack.lessons.length / MIN_PLAN_LESSONS_PER_WEEK),
        level.maxWeeks,
    )
    const minWeeks = Math.max(
        Math.min(maxWeeks, level.minWeeks),
        Math.ceil(plannedTrack.lessons.length / MAX_PLAN_LESSONS_PER_WEEK),
    )
    const weeklyBudget = answers.weeklyHours * 60
    const maximumWeeklyMinutes = answers.weeklyHours === 2
        ? MAX_TWO_HOUR_PLAN_WEEK_MINUTES
        : weeklyBudget
    let lessonWeeks: TrackLesson[][] = []
    let schedule: ReturnType<typeof activitySchedule> | null = null
    let lowestPeakMinutes = Number.POSITIVE_INFINITY

    for (let candidate = minWeeks; candidate <= maxWeeks; candidate += 1) {
        const milestoneWeeks = evenlySpacedWeeks(candidate, milestones.length)
        const finalQuiz = selectFinalQuiz(catalog, answers)
        const initialOverhead = Array.from({ length: candidate }, () => WEEKLY_SECTION_CHECK_MINUTES)
        for (const [index, week] of milestoneWeeks.entries()) {
            initialOverhead[week - 1] += milestones[index].definition.estimatedMinutes
        }
        if (finalQuiz && answers.goal === "foundations" && answers.level === "new") {
            initialOverhead[candidate - 1] += finalQuiz.estimatedMinutes
        }
        let candidateWeeks: TrackLesson[][]
        let candidateSchedule: ReturnType<typeof activitySchedule>
        try {
            candidateWeeks = partitionLessons(plannedTrack.lessons, initialOverhead, weeklyBudget, level.timeMultiplier)
            candidateSchedule = activitySchedule(
                catalog,
                answers,
                plannedTrack.lessons,
                candidateWeeks,
                weeklyBudget,
                maximumWeeklyMinutes,
                level.timeMultiplier,
                milestoneDefinitions,
            )

            for (let iteration = 0; iteration < 4; iteration += 1) {
                candidateWeeks = partitionLessons(
                    plannedTrack.lessons,
                    candidateSchedule.overheadMinutes,
                    weeklyBudget,
                    level.timeMultiplier,
                )
                candidateSchedule = activitySchedule(
                    catalog,
                    answers,
                    plannedTrack.lessons,
                    candidateWeeks,
                    weeklyBudget,
                    maximumWeeklyMinutes,
                    level.timeMultiplier,
                    milestoneDefinitions,
                )
            }
        } catch (error) {
            if (error instanceof MilestoneSchedulingError) continue
            throw error
        }

        const peakMinutes = Math.max(...candidateWeeks.map((lessons, index) => (
            lessons.reduce((total, lesson) => total + estimatedLessonMinutes(lesson, level.timeMultiplier), 0) +
            candidateSchedule.overheadMinutes[index]
        )))
        if (peakMinutes < lowestPeakMinutes) {
            lessonWeeks = candidateWeeks
            schedule = candidateSchedule
            lowestPeakMinutes = peakMinutes
        }
        if (peakMinutes <= weeklyBudget) {
            break
        }
    }

    if (!schedule) throw new Error("Could not build learning plan schedule")
    const exceedsMaximum = lessonWeeks.some((lessons, index) => (
        lessons.reduce((total, lesson) => total + estimatedLessonMinutes(lesson, level.timeMultiplier), 0) +
        schedule.overheadMinutes[index] > maximumWeeklyMinutes
    ))
    if (exceedsMaximum) {
        throw new Error(`Could not keep ${answers.weeklyHours}-hour plan within ${maximumWeeklyMinutes} minutes per week`)
    }
    const { practiceProblems, practiceWeeks, milestoneWeeks, finalQuiz, finalQuizWeek } = schedule
    const weeks: PlanWeek[] = lessonWeeks.map((lessons, weekIndex) => {
        const number = weekIndex + 1
        const activities: PlanActivity[] = []
        for (const lesson of lessons) {
            activities.push({
                id: `lesson:${lesson.slug}`,
                kind: "lesson",
                title: lesson.title,
                description: lesson.shortDescription,
                minutes: estimatedLessonMinutes(lesson, level.timeMultiplier),
                href: `/learn/${lesson.slug}`,
                lesson,
                lessonSlug: lesson.slug,
                required: true,
            })
        }

        const lessonSlugs = lessons.map((lesson) => lesson.slug)
        const sectionCheckSlug = getSectionCheckSlug(answers, number, lessonSlugs)
        activities.push({
            id: `section:${sectionCheckSlug}`,
            kind: "section",
            title: `Week ${number} section check`,
            description: `Answer ${SECTION_CHECK_QUESTION_COUNT} questions across this week's ${lessons.length} ${lessons.length === 1 ? "lesson" : "lessons"}. Score ${QUIZ_PASS_PERCENT}% or higher.`,
            minutes: WEEKLY_SECTION_CHECK_MINUTES,
            href: getSectionCheckHref(answers, number),
            lessonSlugs,
            quizSlug: sectionCheckSlug,
            required: true,
        })

        for (const [practiceIndex, practiceWeek] of practiceWeeks.entries()) {
            if (practiceWeek !== number) continue
            const practice = practiceProblems[practiceIndex]?.problem
            if (!practice) continue
            activities.push({
                id: `coding:${practice.slug}`,
                kind: "coding",
                title: practice.title,
                description: `${practice.difficulty} coding lab. ${practice.summary}`,
                minutes: practice.timeEstimateMinutes,
                href: `/practice/${practice.slug}`,
                practiceSlug: practice.slug,
                required: true,
            })
        }

        if (number === finalQuizWeek + 1 && finalQuiz) {
            const required = answers.goal === "foundations" && answers.level === "new"
            activities.push({
                id: `exam:${finalQuiz.slug}`,
                kind: "exam",
                title: required ? "Final cumulative exam" : "Optional cross-track diagnostic",
                description: required
                    ? `${finalQuiz.title}. Score ${QUIZ_PASS_PERCENT}% or higher without notes, then revisit weak sections.`
                    : `${finalQuiz.title} samples adjacent domains too. Use it only to choose your next topics.`,
                minutes: finalQuiz.estimatedMinutes,
                href: `/practice?quiz=${finalQuiz.slug}#theory-quiz`,
                quizSlug: finalQuiz.slug,
                required,
            })
        }

        for (const [milestoneIndex, milestoneWeek] of milestoneWeeks.entries()) {
            if (milestoneWeek !== number) continue
            const { definition: milestone, index: configuredIndex } = milestones[milestoneIndex]
            activities.push({
                id: `milestone:${plannedTrack.slug}:${configuredIndex + 1}`,
                kind: "milestone",
                title: milestone.title,
                description: milestoneDescription(milestone),
                minutes: milestone.estimatedMinutes,
                required: false,
            })
        }

        const lessonMinutes = lessons.reduce(
            (total, lesson) => total + estimatedLessonMinutes(lesson, level.timeMultiplier),
            0,
        )
        const activityMinutes = activities
            .filter((activity) => activity.kind !== "lesson")
            .reduce((total, activity) => total + activity.minutes, 0)

        return {
            number,
            title: weekTitle(lessons),
            focus: `Read the week's lessons, connect them in one section check, then apply them to ${projectByGoal[answers.goal]}.`,
            lessons,
            activities,
            lessonMinutes,
            activityMinutes,
            totalMinutes: lessonMinutes + activityMinutes,
        }
    })
    const totalActivityMinutes = weeks.reduce((total, week) => total + week.activityMinutes, 0)

    return {
        answers,
        track: plannedTrack,
        weeks,
        totalLessonMinutes,
        totalActivityMinutes,
        practiceMinutesPerWeek: Math.round(totalActivityMinutes / weeks.length),
        foundationBridgeLessonCount: plannedTrack.lessons.length - track.lessons.length,
    }
}

export function getCompletedPlanActivityIds(plan: LearningPlan, progress: LearningPlanProgress) {
    const completed = new Set<string>()

    for (const week of plan.weeks) {
        for (const activity of week.activities) {
            if (activity.kind === "lesson" && activity.lessonSlug && progress.readLessonSlugs.has(activity.lessonSlug)) completed.add(activity.id)
            if (activity.kind === "section" && activity.quizSlug && progress.passedSectionSlugs.has(activity.quizSlug)) completed.add(activity.id)
            if (activity.kind === "coding" && activity.practiceSlug && progress.completedPracticeSlugs.has(activity.practiceSlug)) completed.add(activity.id)
            if (activity.kind === "exam" && activity.quizSlug && progress.passedTheorySlugs.has(activity.quizSlug)) completed.add(activity.id)
        }
    }

    return completed
}
