# Structured Output Generation: manual review notes

Checked September 22, 2026. The article, questions, code, illustration sources, and banner source were read individually. These notes replace the August generated packet; no authoring or review script was used.

## Corrections and teaching choices

- Constrained decoding enforces the backend's compiled language, which may omit original schema constraints. Refusal and incomplete responses need separate handling. OpenAI distinguishes JSON mode from schema adherence and requires closed object schemas with all fields required in strict mode: https://developers.openai.com/api/docs/guides/structured-outputs
- OpenAI's original explanation uses CFGs for recursive structures. JSON syntax permits more than object roots; grammar legality, successful completion, truth, and action authority are separate: https://openai.com/index/introducing-structured-outputs-in-the-api/
- Claude has native JSON outputs through `output_config.format`, not a JSON guarantee in ordinary text mode. Its current documentation permits optional fields, rejects recursive schemas, and documents refusal, token-limit, and string enum capitalization exceptions. Those rules aren't universal provider requirements: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- Gemini supports a schema subset and requires application validation of values. The lesson doesn't present one provider's closed-root rules as all providers' rules: https://ai.google.dev/gemini-api/docs/structured-output
- Willard and Louf precompute state-to-token indices. Constant-time index lookup isn't constant total memory or zero-cost mask application: https://arxiv.org/html/2307.09702v1
- A fixed DFA needs constant working state in output length, but stores its automaton/index separately. Unbounded lists of fixed-depth items can be regular; arbitrary recursive nesting needs stack-aware parsing. The article gives an empty-object-list regex to distinguish length from depth.
- Current Outlines v1 generators return raw strings; the caller parses a Pydantic instance. Reusable backend artifacts aren't universally DFA indices: https://dottxt-ai.github.io/outlines/latest/features/core/generator/ and https://dottxt-ai.github.io/outlines/latest/features/advanced/backends/
- llguidance uses an Earley parser, regex lexer, and tokenizer trie: https://github.com/guidance-ai/llguidance
- llama.cpp's JSON Schema converter can silently skip unsupported constraints. Inspect the converted grammar and retain local validation: https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md
- vLLM removed legacy `guided_*` fields in v0.12.0. Its current `structured_outputs` interface has selectable backends and workload-dependent costs: https://docs.vllm.ai/en/latest/features/structured_outputs/
- SGLang's original compressed-FSM design is historical; its current documentation names XGrammar as the default grammar backend and lists Outlines and llguidance alternatives: https://docs.sglang.io/docs/advanced_features/structured_outputs
- XGrammar overlaps CPU mask calculation with the GPU forward pass using the same prior tokens, synchronizing before sampling. It doesn't calculate a future mask from an unsampled future token: https://arxiv.org/html/2411.15100v1
- Removed the unsupported universal 500 ms–2 s compilation range and claims that recursion necessarily causes state-space explosion or severe decode slowdown. Measure cold/warm latency and per-step work for the deployed backend and representative schema/batch distribution.
- Tam et al.'s 2024 study mixes prompt formatting and JSON mode on contemporary models. Some reasoning tasks worsened, while classification sometimes improved. It doesn't establish that all current structured-output models lose reasoning: https://arxiv.org/html/2408.02442v1
- A constrained final answer does not need to constrain internal reasoning tokens: https://developers.openai.com/api/docs/guides/reasoning
- Evidence-first fields are an evaluation choice. An exact source quote doesn't prove the proposed action is supported. The new CPU continuation changes only the decision to `rollback` and shows that the quote validator still accepts it.
- Legal repetitive whitespace isn't a grammatical dead end. Clear instructions may help without guaranteeing termination; retain token/time bounds and inspect stop rules and backend telemetry.
- Recovery distinguishes length, safety, configuration, and local-validation failures. The 120/400-token fixture budgets are examples. JSON repair may alter meaning, and Pydantic doesn't implement RBAC or truth automatically.
- OpenAI SDK examples return typed responses, while the marked recovery lab intentionally uses dictionary fixtures. Streaming fragments are uncommitted candidates: https://github.com/openai/openai-python/blob/main/helpers.md

## Verification limits

CPU fixtures test explicit parser, type, grammar, evidence-membership, graph-integrity, recovery, approval, and catalog behavior. They don't call hosted APIs, download the example model, test GPU serving, measure reasoning quality, or establish a production security boundary. Native figures use executed fixture values; the probability chart remains a four-token, temperature-one example.
