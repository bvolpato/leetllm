/** Reviewed print captions, keyed by article path and original Mermaid ordinal. */
export const BOOK_DIAGRAM_CAPTIONS: Record<string, string> = {
    'foundations/numpy-and-tensor-shapes/0': 'Transposing k from (B, T, D) to (B, D, T) aligns the shared feature axis D so batched multiplication produces the (B, T, T) score grid.',
    'llmops/llm-evaluation-benchmarks-limitations/0': 'Trace weak results through retrieval, generation, and scoring before the ship check decides whether to accept, route, or reject.',
    'training/rlvr-verifiable-rewards-training/0': 'The generator pairs vLLM rollouts with sandbox verification, passes masked token trajectories to the GRPO trainer, and syncs updated weights back to the inference replicas.',
    'agents/structured-output-constrained-generation/1': 'The parser state masks illegal tokens at each step. A legal end token permits completion, followed by parsing and validation.',
    'fundamentals/long-context-engineering-beyond-management/0': 'Discover skills through compact metadata, load a matching skill body when needed, then read the required reference or run the needed script.',
    'retrieval/chunking-strategies-document-processing/1': 'Search the small indexed child, then follow its parent pointer to recover the larger section as cited context.',
    'agents/agent-memory-persistence-patterns/1': 'Writing and recalling evidence provide context for a patch proposal. Current merge policy supplies the separate execution decision.',
    'agents/agent-memory-persistence-patterns/3': 'Retrieval memory preserves recalled evidence; a workflow checkpoint preserves pending work. Recovery must still reconcile live CI, approval, and side effects.',
}
