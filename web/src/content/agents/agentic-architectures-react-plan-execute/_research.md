# ReAct & Plan-and-Execute: manual review notes

Checked September 22, 2026. Full article, metadata, questions, code, original research packet, illustration sources, and banner source read individually. These notes replace the generated July packet. No model loop, delegated review, or authoring script was used.

## Primary evidence and corrections

- ReAct's original actions aren't necessarily structured JSON, and thoughts can occur sparsely. External observations inform reasoning without guaranteeing truth or correct interpretation: https://arxiv.org/html/2210.03629v3
- Historical benchmark scope matters: ALFWorld Table 3 reports 71% for the best of six ReAct prompt variants, 57% for their average, and 37% for BUTLER. WebShop Table 4 reports 40.0% versus 29.1% for IL and 28.7% for IL+RL. These aren't current coding-agent comparisons: https://arxiv.org/html/2210.03629v3
- Anthropic's workflow/agent distinction and simplest-sufficient-pattern advice come from its December 19, 2024 post. The current page points to Managed Agents for current tooling: https://www.anthropic.com/engineering/building-effective-agents
- Plan-and-Solve is plan-first reasoning prompting, not a concurrent tool scheduler: https://aclanthology.org/2023.acl-long.147/
- HuggingGPT separates planning, model selection, execution, and response generation with resource dependencies: https://arxiv.org/html/2303.17580v4
- Reflexion evaluators include exact-match grading, heuristics, and LLM judgments. Reflection text is fallible advice, not authority. Its stored experience buffer is bounded; context adaptation doesn't require neural-weight changes: https://arxiv.org/html/2303.11366v4
- Reflexion's 91% HumanEval result follows iterative refinement. Python MBPP declined from the 80.1% baseline to 77.1%; evaluator false positives are a relevant limitation. Multiple trials don't imply an exact 3x cost or prohibit concurrent independent chains: https://arxiv.org/html/2303.11366v4
- LATS describes six operations: selection, expansion, evaluation, simulation, backpropagation, and reflection. Its model-based value estimates differ from terminal feedback. The article's cell is only a supplied-statistics UCT/backup illustration: https://arxiv.org/html/2310.04406v2
- LATS's text-reset argument doesn't undo external side effects. Valid mutable branch states need isolation or reset mechanisms. The prior "Reversibility Law" was an invented universal rule, especially misleading for read-only tasks and feedback retries: https://arxiv.org/html/2310.04406v2
- Self-consistency samples reasoning paths and aggregates final answers. The fixture adds a conservative majority-or-review policy and doesn't execute candidate writes: https://openreview.net/pdf?id=1PL1NIMMrw
- The full-history arithmetic counts submitted input, not forward passes, compute, or an invoice. Current OpenAI accounting distinguishes cache reads and applicable cache writes; use actual usage and deployed-model rates: https://developers.openai.com/api/docs/guides/prompt-caching
- Lost in the Middle establishes position-dependent evidence-use failures in its tested tasks/models, not a proof that softmax necessarily dilutes all system instructions: https://aclanthology.org/2024.tacl-1.9/
- Anthropic's April 8, 2026 implementation separates durable session events, the harness, and sandboxes. Session storage isn't identical to the selected model context; this isn't a Plan-and-Execute cost theorem: https://www.anthropic.com/engineering/managed-agents
- AWS's request-identity guidance requires service-supported replay semantics and atomic durable effect/token handling. Keys must retain intended-operation identity through retries and replanning; unsupported headers don't deduplicate effects: https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/

## Teaching choices and verification limits

The new CPU cell computes ten submitted inputs totaling 87,500 tokens and ending at 15,500; the first observation appears nine times. A two-increment history totals 45,500. Ideal full-prefix caching splits 72,000 cache-read tokens and 15,500 newly written tokens under explicit assumptions. These are constructed calculations, not provider traces, prices, latency measurements, or evidence of equal answer quality.

Kept the deterministic policy, readiness, permission, reflection-memory, routing, UCT, proposal-deduplication, budget, cycle, and incident-evidence fixtures. They test local contracts without calling a language model or real service. The cycle cell checks that spaces inside string values remain meaningful. The replanning cell is a sequential list transformation, not a dynamic DAG scheduler.

Plan decomposition doesn't require frontier models, different worker models, complete context isolation, or concurrency. Scoped prompts and durable records are implementation choices available to either control pattern. Read-only doesn't mean immutable: a schema snapshot can expire, and undeclared dependencies or changed permissions can invalidate an otherwise completed result. Approval tiers are authored application policy, not automatic permissions granted by a pattern.
