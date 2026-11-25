/** Reviewed print captions, keyed by article path and original Mermaid ordinal. */
export const BOOK_DIAGRAM_CAPTIONS: Record<string, string> = {
    'agents/structured-output-constrained-generation/1': 'The parser state masks illegal tokens at each step. A legal end token permits completion, followed by parsing and validation.',
    'agents/structured-output-constrained-generation/2': 'The schema admits exactly project, run_id, and status. Caller scope project-alpha then permits its own project and denies project-beta before any CI lookup.',
    'agents/structured-output-constrained-generation/3': 'The trusted RUN-842 snapshot says failed. A matching claim supports display, while an unsupported claim stays unresolved and rollback retains its separate action contract.',
    'preparation/transformer-architecture-end-to-end/0': 'Trace positioned vectors through the masked blocks, then use the final position to predict the next token.',
    'fundamentals/inference-mechanics-ttft-tps-kv-cache/0': 'Prefill emits y1. The cache holds K/V for p1-p4; decode appends y1 before emitting y2.',
    'fundamentals/inference-mechanics-ttft-tps-kv-cache/2': 'Separate worker pools require a compatible state handoff. The raw K/V transfer times shown are lower bounds, before other handoff work.',
    'retrieval/chunking-strategies-document-processing/1': 'Search the small indexed child, then follow its parent pointer to recover the larger section as cited context.',
    'llmops/llm-evaluation-benchmarks-limitations/0': 'Trace weak results through retrieval, generation, and scoring before the release gate decides whether the system is ready.',
    'agents/function-calling-tool-use-llms/1': 'The model proposes a release lookup. The trusted host checks and executes it, then returns a linked observation for the next model turn.',
    'fundamentals/long-context-engineering-beyond-management/0': 'Discover skills through compact metadata, load a matching skill body when needed, then read the required reference or run the needed script.',
    'agents/agentic-architectures-react-plan-execute/0': 'A proposal crosses the runtime gate before the CI call. Its bounded observation informs the next proposal or answer.',
    'agents/agent-memory-persistence-patterns/1': 'Writing and recalling evidence provide context for a patch proposal. Current merge policy supplies the separate execution decision.',
    'agents/agent-memory-persistence-patterns/3': 'Retrieval memory preserves recalled evidence; a workflow checkpoint preserves pending work. Recovery must still reconcile live CI, approval, and side effects.',
    'agents/agent-failure-states-retry-fallback/1': 'Closed admits calls, open rejects them, and half-open admits one probe. An unclassified probe error releases the slot without establishing dependency health.',
    'llmops/hallucination-detection-mitigation/0': 'Check draft claims against the admitted record before deciding to serve, shorten, or abstain.',
}
