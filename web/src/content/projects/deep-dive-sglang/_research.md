# Research notes: SGLang programs, RadixAttention, and serving-runtime boundaries

## The core investigation

When two structured-generation requests share a system prefix but diverge later, which SGLang layer owns frontend expressions, tokenization, radix-tree cache reuse, token-budget scheduling, grammar constraints, speculation, and model execution?

## Original paper and current first-party contracts

- The SGLang paper defines the structured language-program frontend, RadixAttention, compressed finite-state-machine ideas, and the original workload-specific throughput comparison: https://arxiv.org/abs/2312.07104
- The public repository and project documentation own present-day runtime architecture, supported model/hardware surfaces, feature flags, and installed behavior: https://github.com/sgl-project/sglang and https://docs.sglang.io/
- Structured-output documentation specifies JSON schema, regex, EBNF, backend selection, and request-level constraints: https://docs.sglang.io/docs/advanced_features/structured_outputs
- Speculative-decoding documentation defines supported draft algorithms, model prerequisites, workload caveats, and the published H100 comparison: https://docs.sglang.io/docs/advanced_features/speculative_decoding
- Prefill/decode disaggregation and server-argument docs govern cross-worker KV transfer and parallel deployment configuration: https://docs.sglang.io/docs/advanced_features/pd_disaggregation and https://docs.sglang.io/docs/advanced_features/server_arguments
- Pinned maintainer and license files support current stewardship and Apache-2.0 source terms: https://github.com/sgl-project/sglang/blob/f8e62a9224815cc9c6fc56b940eb7fde791a8870/.github/MAINTAINER.md and https://github.com/sgl-project/sglang/blob/f8e62a9224815cc9c6fc56b940eb7fde791a8870/LICENSE

## Exact examples and properly scoped numbers

For a six-token scheduling budget, one decoding request consumes `1` token while a new request's `9` unmatched prefill tokens are admitted as `5` and then `4`; after prefill, both decode one token each. A shared four-token prefix is reusable only when token identity and the relevant cache namespace match.

The project's own speculative-decoding table reports `158.34`, `244.10`, and `373.25` tokens per second for no speculation, EAGLE-2, and EAGLE-3 respectively on the stated Llama 3.1 8B Instruct, MT-bench, single-H100 setup. The summary lacks a complete engine revision, precision, concurrency, warmup, and correctness protocol, so the lesson doesn't reproduce those figures as benchmark evidence. The original paper's maximum `6.4x` result measures completed programs per second on its named 2024 workloads and baseline systems. Neither figure is a current universal SLO.

## Correctness and scope caveats

RadixAttention is prefix-cache organization, not the attention kernel or an access-control mechanism. A grammar can constrain syntax without guaranteeing semantic truth. Speculative decoding must preserve token order, tokenizer, position, grammar state, cache ownership, and accepted-token semantics. Prefill/decode disaggregation adds a KV-transfer and failure boundary; it can lose when transfer costs exceed compute savings.

Backend support, grammar defaults, EAGLE/MTP/DFlash modes, release flags, platform parity, and cache-key rules must be checked on the installed commit. Frontend program semantics and plain OpenAI-compatible requests exercise related but different entry surfaces.

## Manual primary-source refresh, September 23, 2026

The live speculative guide also documents UNO: target-transformer LoRA drafting with base-weight verification, CUDA/FA3 and TP=PP=1 requirements, and no grammar decoding support. UNO isn't an enum member at the lesson's pinned `f8e62a9224815cc9c6fc56b940eb7fde791a8870` source snapshot. Keep moving documentation and fixed source capabilities separate. The structured-output guide distinguishes EBNF support (XGrammar and llguidance) from Outlines' JSON-schema/regex support. Prefix lookup belongs to the scheduler/cache boundary after tokenization, not to the tokenizer itself.
