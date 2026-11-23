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
        { slug: "repository-diff", unlockAfterLessonSlug: "git-shell-linux-reproducible-ai" },
        { slug: "repo-ignore-filter", unlockAfterLessonSlug: "git-shell-linux-reproducible-ai" },
        { slug: "duplicate-file-groups", unlockAfterLessonSlug: "git-shell-linux-reproducible-ai" },
        { slug: "file-patch-applier", unlockAfterLessonSlug: "git-shell-linux-reproducible-ai" },
        { slug: "secret-redactor", unlockAfterLessonSlug: "git-shell-linux-reproducible-ai" },
        { slug: "log-error-parser", unlockAfterLessonSlug: "python-for-ai-engineering" },
        { slug: "ttl-key-value-store", unlockAfterLessonSlug: "data-structures-for-ai-systems" },
        { slug: "in-memory-filesystem", unlockAfterLessonSlug: "data-structures-for-ai-systems" },
        { slug: "lru-ttl-cache", unlockAfterLessonSlug: "data-structures-for-ai-systems" },
        { slug: "lfu-ttl-cache", unlockAfterLessonSlug: "data-structures-for-ai-systems" },
        { slug: "longest-match-tokenizer", unlockAfterLessonSlug: "tokenization-bpe-wordpiece-sentencepiece" },
        { slug: "context-window-packer", unlockAfterLessonSlug: "language-modeling-next-token-prediction" },
        { slug: "retry-backoff-planner", unlockAfterLessonSlug: "calling-llm-apis-production" },
        { slug: "streaming-token-assembler", unlockAfterLessonSlug: "calling-llm-apis-production" },
        { slug: "sse-event-parser", unlockAfterLessonSlug: "calling-llm-apis-production" },
    ],
    ml: [
        { slug: "repository-hash-tree", unlockAfterLessonSlug: "dataset-pipelines-data-quality" },
        { slug: "bounded-worker-queue", unlockAfterLessonSlug: "batch-streaming-feature-pipelines" },
        { slug: "worker-lease-registry", unlockAfterLessonSlug: "batch-streaming-feature-pipelines" },
        { slug: "workflow-state-machine", unlockAfterLessonSlug: "batch-streaming-feature-pipelines" },
        { slug: "experiment-traffic-splitter", unlockAfterLessonSlug: "experiment-design-ab-testing" },
        { slug: "sliding-window-error-counter", unlockAfterLessonSlug: "monitoring-predictive-models" },
        { slug: "canary-metric-judge", unlockAfterLessonSlug: "model-versioning-continuous-deployment" },
        { slug: "idempotent-ledger", unlockAfterLessonSlug: "model-versioning-continuous-deployment" },
    ],
    rag: [
        { slug: "same-host-crawler", unlockAfterLessonSlug: "file-ingestion-pdfs-html-ocr-markdown" },
        { slug: "streaming-markdown-parser", unlockAfterLessonSlug: "file-ingestion-pdfs-html-ocr-markdown" },
        { slug: "rag-chunk-selector", unlockAfterLessonSlug: "core-retrieval-algorithms" },
        { slug: "codebase-symbol-index", unlockAfterLessonSlug: "core-retrieval-algorithms" },
        { slug: "eval-failure-aggregator", unlockAfterLessonSlug: "rag-evaluation-faithfulness-relevance" },
        { slug: "document-permission-filter", unlockAfterLessonSlug: "enterprise-rag-security-rbac-access-control" },
        { slug: "secret-redactor", unlockAfterLessonSlug: "enterprise-rag-security-rbac-access-control" },
        { slug: "lru-ttl-cache", unlockAfterLessonSlug: "semantic-caching-cost-latency-optimization" },
        { slug: "lfu-ttl-cache", unlockAfterLessonSlug: "semantic-caching-cost-latency-optimization" },
        { slug: "sliding-window-error-counter", unlockAfterLessonSlug: "observability-monitoring-llm-systems" },
        { slug: "canary-metric-judge", unlockAfterLessonSlug: "observability-monitoring-llm-systems" },
    ],
    agents: [
        { slug: "retry-backoff-planner", unlockAfterLessonSlug: "calling-llm-apis-production" },
        { slug: "streaming-token-assembler", unlockAfterLessonSlug: "calling-llm-apis-production" },
        { slug: "sse-event-parser", unlockAfterLessonSlug: "calling-llm-apis-production" },
        { slug: "tool-call-schema-validator", unlockAfterLessonSlug: "function-calling-tool-use-llms" },
        { slug: "webhook-idempotency-receiver", unlockAfterLessonSlug: "function-calling-tool-use-llms" },
        { slug: "context-window-packer", unlockAfterLessonSlug: "long-context-engineering-beyond-management" },
        { slug: "prompt-section-extractor", unlockAfterLessonSlug: "prompt-injection-defense-strategies" },
        { slug: "secret-redactor", unlockAfterLessonSlug: "prompt-injection-defense-strategies" },
        { slug: "eval-failure-aggregator", unlockAfterLessonSlug: "agent-evaluation-benchmarks" },
        { slug: "agent-event-timeline", unlockAfterLessonSlug: "observability-monitoring-llm-systems" },
        { slug: "command-log-classifier", unlockAfterLessonSlug: "observability-monitoring-llm-systems" },
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
        { slug: "lru-ttl-cache", unlockAfterLessonSlug: "prefix-caching-prompt-caching" },
        { slug: "lfu-ttl-cache", unlockAfterLessonSlug: "prefix-caching-prompt-caching" },
        { slug: "batch-inference-scheduler", unlockAfterLessonSlug: "continuous-batching-request-scheduling" },
        { slug: "bounded-worker-queue", unlockAfterLessonSlug: "continuous-batching-request-scheduling" },
        { slug: "priority-deadline-scheduler", unlockAfterLessonSlug: "continuous-batching-request-scheduling" },
        { slug: "multi-tenant-job-scheduler", unlockAfterLessonSlug: "continuous-batching-request-scheduling" },
        { slug: "context-window-packer", unlockAfterLessonSlug: "long-context-window-management" },
        { slug: "model-fallback-router", unlockAfterLessonSlug: "model-gateways-routing-fallbacks" },
        { slug: "token-bucket-rate-limiter", unlockAfterLessonSlug: "model-gateways-routing-fallbacks" },
        { slug: "token-budget-ledger", unlockAfterLessonSlug: "llm-cost-engineering-token-economics" },
        { slug: "circuit-breaker-state", unlockAfterLessonSlug: "observability-monitoring-llm-systems" },
        { slug: "sliding-window-error-counter", unlockAfterLessonSlug: "observability-monitoring-llm-systems" },
        { slug: "canary-metric-judge", unlockAfterLessonSlug: "model-versioning-continuous-deployment" },
    ],
    training: [
        { slug: "repository-hash-tree", unlockAfterLessonSlug: "pre-training-data-pipelines-scale" },
        { slug: "bounded-worker-queue", unlockAfterLessonSlug: "pre-training-data-pipelines-scale" },
        { slug: "worker-lease-registry", unlockAfterLessonSlug: "distributed-training-fsdp-deepspeed-zero" },
        { slug: "eval-failure-aggregator", unlockAfterLessonSlug: "supervised-fine-tuning-pipeline" },
        { slug: "experiment-traffic-splitter", unlockAfterLessonSlug: "experiment-tracking-mlflow-wandb" },
        { slug: "canary-metric-judge", unlockAfterLessonSlug: "model-versioning-continuous-deployment" },
    ],
    research: [
        { slug: "experiment-traffic-splitter", unlockAfterLessonSlug: "experiment-design-ab-testing" },
        { slug: "tool-call-schema-validator", unlockAfterLessonSlug: "function-calling-tool-use-llms" },
        { slug: "repository-hash-tree", unlockAfterLessonSlug: "pre-training-data-pipelines-scale" },
        { slug: "agent-event-timeline", unlockAfterLessonSlug: "agent-evaluation-benchmarks" },
        { slug: "eval-failure-aggregator", unlockAfterLessonSlug: "llm-evaluation-benchmarks-limitations" },
        { slug: "canary-metric-judge", unlockAfterLessonSlug: "ab-testing-online-evaluation-llms" },
    ],
    interviews: [
        { slug: "log-error-parser", unlockAfterLessonSlug: "ai-lab-coding-interview-python-systems" },
        { slug: "ttl-key-value-store", unlockAfterLessonSlug: "ai-lab-coding-interview-python-systems" },
        { slug: "lru-ttl-cache", unlockAfterLessonSlug: "ai-lab-coding-interview-python-systems" },
        { slug: "workflow-state-machine", unlockAfterLessonSlug: "ai-lab-coding-interview-python-systems" },
        { slug: "bounded-worker-queue", unlockAfterLessonSlug: "ai-lab-coding-interview-python-systems" },
        { slug: "priority-deadline-scheduler", unlockAfterLessonSlug: "ai-lab-coding-interview-python-systems" },
        { slug: "circuit-breaker-state", unlockAfterLessonSlug: "ai-lab-coding-interview-python-systems" },
        { slug: "sse-event-parser", unlockAfterLessonSlug: "ai-lab-coding-interview-python-systems" },
        { slug: "tool-call-schema-validator", unlockAfterLessonSlug: "ai-lab-coding-interview-python-systems" },
        { slug: "model-fallback-router", unlockAfterLessonSlug: "ai-lab-coding-interview-python-systems" },
        { slug: "batch-inference-scheduler", unlockAfterLessonSlug: "ai-lab-coding-interview-python-systems" },
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
            title: "Create a reproducible workspace",
            deliverable: "Create a repo with locked dependencies, sample input, and a documented run command.",
            completionCriteria: "a clean checkout reproduces the same result with one command",
            estimatedMinutes: 45,
            unlockAfterLessonSlug: "docker-containerization-reproducible-ai",
        },
        {
            title: "Build a trustworthy data pipeline",
            deliverable: "Turn a raw sample into validated train and test data, then document shapes, missing values, and split rules.",
            completionCriteria: "the pipeline rejects one deliberately malformed row and reruns without manual cleanup",
            estimatedMinutes: 60,
            unlockAfterLessonSlug: "statistics-estimation-uncertainty",
        },
        {
            title: "Train and inspect a baseline model",
            deliverable: "Save training code, a loss curve, a validation metric, and examples of correct and incorrect predictions.",
            completionCriteria: "another person can rerun training and explain the largest observed failure mode",
            estimatedMinutes: 75,
            unlockAfterLessonSlug: "language-modeling-next-token-prediction",
        },
        {
            title: "Ship an evaluated AI application",
            deliverable: "Expose one model or LLM workflow through a CLI or API and run a fixed evaluation set against it.",
            completionCriteria: "the README links a successful run, a handled failure, measured cost or latency, three evaluation misses, and the next fix",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "llm-evaluation-benchmarks-limitations",
        },
    ],
    ml: [
        {
            title: "Freeze the prediction contract",
            deliverable: "Write the target, prediction timestamp, data cutoff, split method, baseline metric, and leakage risks for one predictive task.",
            completionCriteria: "a reviewer can identify exactly what information is available when each prediction is made",
            estimatedMinutes: 45,
            unlockAfterLessonSlug: "cross-validation-leakage-generalization",
        },
        {
            title: "Build a reproducible training path",
            deliverable: "Create one command that builds features, trains a baseline, evaluates it, and saves versioned model and metric artifacts.",
            completionCriteria: "two runs from the same data version produce equivalent metrics and traceable artifacts",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "batch-streaming-feature-pipelines",
        },
        {
            title: "Create a model release gate",
            deliverable: "Evaluate important slices and define drift, quality, and latency thresholds for a candidate model.",
            completionCriteria: "the gate makes an explicit ship or block decision and names the failing slice or threshold",
            estimatedMinutes: 75,
            unlockAfterLessonSlug: "monitoring-predictive-models",
        },
        {
            title: "Package a production ML case study",
            deliverable: "Package architecture, data and model versions, canary results, rollback conditions, and an operator runbook.",
            completionCriteria: "another engineer can deploy the candidate, inspect its health, and roll it back using only the case study",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "capstone-production-ml-pipeline",
        },
    ],
    rag: [
        {
            title: "Create the corpus and answer contract",
            deliverable: "Version a small document corpus and write evaluation queries with expected evidence, citation rules, and access boundaries.",
            completionCriteria: "each query has a source-backed expected answer or an explicit abstain outcome",
            estimatedMinutes: 60,
            unlockAfterLessonSlug: "chunking-strategies-document-processing",
        },
        {
            title: "Build a retrieval baseline",
            deliverable: "Run ingestion and retrieval on the fixed query set, then save recall at k, latency, retrieved chunks, and cited answers.",
            completionCriteria: "the report exposes both missed evidence and irrelevant retrieved chunks for every failed query",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "reranking-cross-encoders-rag",
        },
        {
            title: "Write a RAG failure report",
            deliverable: "Classify retrieval misses, unsupported answers, and permission failures, then fix the largest failure class.",
            completionCriteria: "the same evaluation set shows the change without weakening citation or access-control checks",
            estimatedMinutes: 75,
            unlockAfterLessonSlug: "enterprise-rag-security-rbac-access-control",
        },
        {
            title: "Ship a cited search demo",
            deliverable: "Publish a working query path with citations, access-control tests, evaluation results, operating limits, and an incident runbook.",
            completionCriteria: "a reviewer can trace each answer to allowed source text and reproduce the evaluation results",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "capstone-document-qa-product",
        },
    ],
    agents: [
        {
            title: "Define the tool and authority contract",
            deliverable: "Document tool schemas, allowed reads and writes, validation boundaries, and escalation rules for one concrete agent task.",
            completionCriteria: "a test run accepts one allowed action and rejects one out-of-scope action",
            estimatedMinutes: 60,
            unlockAfterLessonSlug: "structured-output-constrained-generation",
        },
        {
            title: "Record a replayable agent trace",
            deliverable: "Save one end-to-end run with state transitions, tool inputs and outputs, retry behavior, and final result or escalation.",
            completionCriteria: "the trace can be replayed far enough to explain every tool call and state change",
            estimatedMinutes: 75,
            unlockAfterLessonSlug: "agent-failure-states-retry-fallback",
        },
        {
            title: "Build an agent release suite",
            deliverable: "Test prompt injection, tool failure, duplicate execution, timeout, and human escalation against fixed scenarios.",
            completionCriteria: "the report records pass rates, traces every failure, and names unresolved release risks",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "human-in-the-loop-agent-architecture",
        },
        {
            title: "Publish an auditable agent case study",
            deliverable: "Publish a runnable demo, replayable traces, evaluation results, cost, known limits, and write-safety controls.",
            completionCriteria: "another engineer can reproduce a successful run, a blocked unsafe action, and a recovery from tool failure",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "capstone-production-llm-agent",
        },
    ],
    inference: [
        {
            title: "Write the workload and capacity sheet",
            deliverable: "Record model size, prompt and output distributions, concurrency, TTFT and TPS targets, memory budget, and cost ceiling.",
            completionCriteria: "the sheet predicts a testable throughput and memory limit for one hardware target",
            estimatedMinutes: 45,
            unlockAfterLessonSlug: "inference-mechanics-ttft-tps-kv-cache",
        },
        {
            title: "Build a repeatable serving benchmark",
            deliverable: "Pin model, hardware, engine, load shape, and warmup rules, then capture latency, throughput, memory, and errors.",
            completionCriteria: "repeated runs produce comparable p50 and p95 results and preserve the raw benchmark output",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "scaling-llm-inference-batching-kv-cache",
        },
        {
            title: "Prove one serving optimization",
            deliverable: "Compare one cache, batching, quantization, or decoding change against the baseline under identical load.",
            completionCriteria: "the comparison reports latency, throughput, memory, cost, and quality regressions before recommending the change",
            estimatedMinutes: 75,
            unlockAfterLessonSlug: "speculative-decoding",
        },
        {
            title: "Prepare a guarded serving release",
            deliverable: "Publish canary criteria, autoscaling signals, cost and latency dashboards, rollback thresholds, and exact serving configuration.",
            completionCriteria: "an operator can detect a bad canary and execute the documented rollback without guessing",
            estimatedMinutes: 75,
            unlockAfterLessonSlug: "llm-deployment-gpu-serving-autoscaling",
        },
    ],
    training: [
        {
            title: "Version the data and evaluation contract",
            deliverable: "Save dataset sources, licenses, filters, splits, contamination checks, and a fixed evaluation set for one adaptation goal.",
            completionCriteria: "every training example and evaluation score resolves to a versioned source and transformation",
            estimatedMinutes: 60,
            unlockAfterLessonSlug: "pre-training-data-pipelines-scale",
        },
        {
            title: "Run a reproducible adaptation baseline",
            deliverable: "Pin base model, code, hyperparameters, seed, and compute, then save checkpoint, training curves, and evaluation results.",
            completionCriteria: "a second run follows the same recipe and lands within the stated metric tolerance",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "supervised-fine-tuning-pipeline",
        },
        {
            title: "Compare an adaptation decision",
            deliverable: "Run one controlled SFT, LoRA, preference, or reward ablation against the baseline.",
            completionCriteria: "the report shows quality gains, regressions, compute cost, and failure slices before choosing a method",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "rlhf-dpo-aligning-language-models",
        },
        {
            title: "Publish a model release packet",
            deliverable: "Publish a model card, dataset and checkpoint IDs, evaluation tables, safety limits, inference recipe, and rollback recommendation.",
            completionCriteria: "a reviewer can reproduce the chosen checkpoint and decide whether it is safe to release",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "capstone-fine-tuned-classifier",
        },
    ],
    research: [
        {
            title: "Pre-register a research question",
            deliverable: "Write the claim, competing explanation, intervention, controls, baseline, metrics, seed or sample plan, stopping rule, and evidence that would reject the claim.",
            completionCriteria: "a reviewer can reconstruct every planned comparison and rejection condition before seeing results",
            estimatedMinutes: 75,
            unlockAfterLessonSlug: "experiment-design-ab-testing",
        },
        {
            title: "Reproduce and audit a baseline",
            deliverable: "Pin source commit, environment, data, seeds, hardware, and exact command; rerun a published or course baseline and record every deviation.",
            completionCriteria: "a clean checkout regenerates the raw result and states whether it matches the expected result within a declared tolerance",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "jax-for-ml-research",
        },
        {
            title: "Run the ablation matrix",
            deliverable: "Compare the baseline with one-factor ablations across planned seeds, report uncertainty and cost, and inspect slices where each treatment helps or hurts.",
            completionCriteria: "the evidence separates the proposed mechanism from seed noise, evaluator bias, environment drift, and unrelated run changes",
            estimatedMinutes: 90,
            unlockAfterLessonSlug: "agent-evaluation-benchmarks",
        },
        {
            title: "Release a research artifact",
            deliverable: "Publish code, configs, raw results, figure-generation scripts, methods, uncertainty, negative findings, limitations, exact reproduction commands, and a ten-minute talk.",
            completionCriteria: "a peer can rerun every reported table or figure and distinguish measured results, interpretation, and unresolved limitations",
            estimatedMinutes: 75,
            unlockAfterLessonSlug: "capstone-reproducible-research-study",
        },
    ],
    interviews: [
        {
            title: "Establish a timed coding baseline",
            deliverable: "Solve and test one production-shaped Python problem under time pressure, then rewrite the weak parts.",
            completionCriteria: "the scorecard records time spent, missed cases, communication gaps, and the improved submission",
            estimatedMinutes: 60,
            unlockAfterLessonSlug: "algorithms-complexity-ml-engineers",
        },
        {
            title: "Build an evaluation judgment packet",
            deliverable: "Answer one evaluation scenario with metric choice, dataset design, failure slices, threshold tradeoffs, and launch recommendation.",
            completionCriteria: "the recommendation changes when a stated metric or failure threshold is crossed",
            estimatedMinutes: 60,
            unlockAfterLessonSlug: "llm-evaluation-benchmarks-limitations",
        },
        {
            title: "Record a system design walkthrough",
            deliverable: "Deliver a 35-minute design with requirements, estimates, architecture, bottlenecks, evaluation, and rollback.",
            completionCriteria: "a rubric-based review identifies one concrete design change and the revised diagram includes it",
            estimatedMinutes: 60,
            unlockAfterLessonSlug: "design-code-completion-system",
        },
        {
            title: "Assemble the interview packet",
            deliverable: "Package coding results, two design diagrams, four evidence-backed stories, a technical talk, and mock feedback.",
            completionCriteria: "the packet names the next three practice priorities and includes a timed rehearsal for each interview format",
            estimatedMinutes: 60,
            unlockAfterLessonSlug: "ai-lab-technical-presentation",
        },
    ],
}

const beginnerFoundationBridgeSlugs = [
    "git-shell-linux-reproducible-ai",
    "python-for-ai-engineering",
    "numpy-and-tensor-shapes",
    "vectors-matrices-tensors",
    "probability-for-machine-learning",
    "neural-networks-from-scratch",
    "transformer-architecture-end-to-end",
    "language-modeling-next-token-prediction",
    "prompt-engineering-fundamentals",
    "calling-llm-apis-production",
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
