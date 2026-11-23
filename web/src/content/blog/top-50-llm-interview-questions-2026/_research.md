# Checked source packet: 50 LLM Interview Questions for 2026

Reviewed 2026-09-23. This packet replaces the original research draft's unsupported serving absolutes and hiring claims. The article is a diagnostic study guide, not a survey of employer interviews. Historical papers support mechanisms and their own experiments; they do not prove current fleet performance or universal quality guarantees.

## Architecture, tokens, and representations

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762): scaled dot-product attention, masking, and concatenated head outputs. The variance explanation assumes independent, zero-mean, unit-variance coordinates. Dense full-sequence attention has quadratic interactions; a cached single-position decode step has linear prefix attention work.
- [Fast Transformer Decoding](https://arxiv.org/abs/1911.02150) and [GQA](https://arxiv.org/abs/2305.13245): shared Key/Value heads reduce decode memory traffic and cache size. GQA's uptraining experiment is evidence for that conversion, not a guarantee for every checkpoint or hardware shape.
- [RoFormer](https://arxiv.org/abs/2104.09864): rotations encode positions and relative displacement in query-key products. The formula does not guarantee accurate retrieval beyond trained lengths.
- [On Layer Normalization](https://arxiv.org/abs/2002.04745): Pre-LN versus Post-LN initialization-gradient analysis. [RMSNorm](https://arxiv.org/abs/1910.07467) removes mean centering; it is not numerically identical to LayerNorm.
- [Subword units](https://arxiv.org/abs/1508.07909), [SentencePiece](https://arxiv.org/abs/1808.06226), and [the author's implementation](https://github.com/google/sentencepiece): BPE is an algorithm; SentencePiece supports BPE and unigram models trained from raw sentences. Tokenizer IDs and normalization must match the checkpoint.
- [word2vec](https://arxiv.org/abs/1301.3781) and [BERT](https://arxiv.org/abs/1810.04805): static word representations versus contextual states. Neither shows that an arbitrary LLM hidden state is a calibrated retrieval embedding.

## Serving and memory

- [PagedAttention](https://arxiv.org/abs/2309.06180): fixed-size non-contiguous cache blocks and flexible sharing reduce fragmentation and duplication. Paging does not eliminate required live-token cache bytes or change attention semantics. Do not describe this as eliminating all virtual-memory fragmentation.
- [Orca](https://www.usenix.org/conference/osdi22/presentation/yu): iteration-level scheduling changes active requests between iterations. Continuous batching is a scheduling choice, not a mandatory property of every production server or of PagedAttention.
- [GPTQ](https://arxiv.org/abs/2210.17323) uses approximate second-order information for post-training weight quantization. [AWQ](https://arxiv.org/abs/2306.00978) uses activation statistics and equivalent channel scaling. [GGUF specification](https://github.com/ggml-org/ggml/blob/master/docs/gguf.md) defines a file format, not a competing quantization algorithm. Hardware and kernel support determine runtime effects.
- [Speculative decoding](https://arxiv.org/abs/2211.17192): exact acceptance/correction preserves the target sampling distribution. Speed depends on draft overhead and acceptance; distributional equivalence does not promise the same random-seed string.
- The CPU example is an explicit full-attention cache calculation: $2\times32\times8\times128\times100000\times2=13107200000$ bytes. Four independent sequences consume 52.4288 decimal GB; five consume 65.536; forty consume 524.288. Sliding windows, compressed caches, sharing, unequal lengths, and workspace require other accounting. No GPU capacity or latency benchmark was run.
- TTFT includes queueing and processing before the first returned token. A long prefill can be important; no source here shows that prefill always dominates. Fleet tokens per second and request latency are different measurements.

## Retrieval and adaptation

- [RAG](https://arxiv.org/abs/2005.11401): parametric and external retrieved memory. The article's eligibility, permission, and source-tracking checks are application design advice, not features proved by the original model.
- [Reciprocal Rank Fusion, author's copy](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf): sum of $1/(k+rank)$ across rankings. The ACM landing page returned 403 during review; the two-page author-hosted paper was checked instead.
- [Ragas](https://arxiv.org/abs/2309.15217) separates retrieval/context and generation assessment. Its automated scores are not ground-truth permission or factual-correctness guarantees.
- [GraphRAG](https://arxiv.org/abs/2404.16130): entity graph, community summaries, and query-focused global sensemaking. Do not reduce this contribution to generic multi-hop vector retrieval or claim every relationship query needs a graph.
- [LoRA](https://arxiv.org/abs/2106.09685): frozen base weights plus low-rank trainable updates. [QLoRA](https://arxiv.org/abs/2305.14314): gradients through a frozen quantized base into adapters, NF4, double quantization, and paged optimizers. Training-memory savings do not replace the base checkpoint or dictate serving export.
- [InstructGPT](https://arxiv.org/abs/2203.02155) uses demonstrations, ranked-output reward training, and policy optimization. [DPO](https://arxiv.org/abs/2305.18290) derives a classification-style preference objective without a separate reward model or online RL sampling loop.
- [Tülu 3, Section 6](https://arxiv.org/html/2411.15124v5): extracted-answer exact matching for GSM8K/MATH and prompt-specific instruction verifiers. This is not a claim about verified mathematical proofs or universal AST checks. [DeepSeek-R1, reward modeling and final RL](https://arxiv.org/html/2501.12948v1): rule-based math/code accuracy rewards, format rewards, and learned rewards for general preference tasks. Do not describe all R1 training rewards as rule-based or RLVR as universally cheaper and complete.
- [Kaplan scaling laws](https://arxiv.org/abs/2001.08361) and [Chinchilla](https://arxiv.org/abs/2203.15556): empirical training-loss and compute allocation results under their studied dense-model regimes. A historical tokens-per-parameter ratio is not a universal modern training prescription.

## Agents, evaluation, and operation

- [ReAct](https://arxiv.org/abs/2210.03629): interleaved reasoning traces and actions in studied tasks. It does not provide authorization, rollback, or a reason to persist private reasoning text.
- MCP is explicitly checked against version 2025-11-25: [architecture](https://modelcontextprotocol.io/specification/2025-11-25/architecture), [server primitives](https://modelcontextprotocol.io/specification/2025-11-25/server/index), [tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools). Host creates clients and handles authorization; each client maintains one server connection; capabilities are negotiated; servers enforce their access constraints. Protocol discovery is not blanket permission to call a tool.
- [Indirect prompt injection](https://arxiv.org/abs/2302.12173): instructions may arrive through retrieved data. Application-side privilege restrictions limit side effects; classifier accuracy remains an empirical question.
- [Hugging Face perplexity documentation](https://huggingface.co/docs/transformers/perplexity): exponentiated average negative log-likelihood, with tokenization and context strategy affecting comparison.
- [MT-Bench/Chatbot Arena judge paper](https://arxiv.org/abs/2306.05685) discusses position, verbosity, and self-enhancement biases. [LLMs are not Fair Evaluators](https://arxiv.org/abs/2305.17926) tests ordering bias and balanced-order/human calibration. Report disagreement rather than treating a judge score as infallible.
- [GPTCache](https://aclanthology.org/2023.nlposs-1.24/) supports the semantic-cache mechanism. Similarity does not prove equivalent authorization, current policy, or correct user state. The article's tenant/version/freshness checks are practitioner controls, not demonstrated guarantees from GPTCache.

## Advanced architectures and safety

- [Mixtral](https://arxiv.org/abs/2401.04088): sparse routed feed-forward experts. [DeepSeek-V3, model hyperparameters](https://arxiv.org/html/2412.19437v2): 671B total, 37B active per token, one shared plus 256 routed experts per MoE layer, eight routed experts activated per token. Total model storage remains relevant, but all experts need not reside on one GPU; distribution and offload alter residency and transfer cost. The top-2 illustration is a toy, not DeepSeek-V3's router.
- [Mamba](https://arxiv.org/abs/2312.00752): input-dependent selective state-space mechanism and hardware-aware recurrent scan. [Original Jamba, Section 3.1](https://arxiv.org/html/2403.19887v1): attention:Mamba ratio 1:7, MoE every second layer. Linear core sequence scaling is not a guarantee of exact recall or constant total application latency.
- [Test-time compute scaling](https://arxiv.org/abs/2408.03314): studied candidate search/adaptive response distributions, with effects dependent on prompt difficulty. Extra output tokens alone are not evidence of improved reasoning.
- [FlashAttention](https://arxiv.org/abs/2205.14135): tiled exact dense attention with reduced HBM traffic. [FlashAttention-3](https://arxiv.org/abs/2407.08608): Hopper asynchrony and FP8 paths; floating-point order and low precision have numerical effects. No local speedup was measured.
- [Distillation](https://arxiv.org/abs/1503.02531): teacher distributions transfer information to a student. The article also discusses generated supervision as a training option, without attributing every modern generation method to this paper.
- [Constitutional AI](https://arxiv.org/abs/2212.08073): supervised critique/revision followed by AI preferences and reinforcement learning. Human-authored principles are not a complete runtime safety mechanism.
- [BBQ](https://aclanthology.org/2022.findings-acl.165/) studies QA bias in specified U.S. English contexts. [WinoBias](https://arxiv.org/abs/1804.06876) studies gender bias in occupation/pronoun coreference. Neither benchmark alone proves fairness for an entire deployed product.

## Editorial scope

Keep all fifty diagnostic questions and the existing worked examples. Define acronyms before relying on them. The admission-control checkpoint distinguishes decimal GB from GiB and stated arithmetic from a measured safe limit. Add no mandatory answer-template, diagram quota, or employer-outcome assurances. Social artwork uses the same cache geometry as the opening example and has reproducible source. No model API, GPU workload, or hiring-outcome experiment was executed.
