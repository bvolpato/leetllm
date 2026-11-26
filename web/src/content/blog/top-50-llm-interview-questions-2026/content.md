---
{
  "id": "blog-top-50-llm-interview-questions-2026",
  "title": "50 LLM Interview Questions for 2026",
  "slug": "top-50-llm-interview-questions-2026",
  "author": {
    "name": "LeetLLM Team"
  },
  "publishedAt": "2026-03-21",
  "updatedAt": "2026-11-23",
  "verifiedAt": "2026-11-23",
  "refreshAfter": "2027-01-22",
  "excerpt": "Fifty LLM engineering questions that connect model mechanics to serving, retrieval, agents, evaluation, and safety through evidence and failure diagnosis.",
  "tags": [
    "AI Engineering",
    "Interview Preparation",
    "Architecture",
    "System Design"
  ],
  "coverImage": "social_banner.png",
  "featured": false
}
---

An interviewer asks why decode ran out of memory even though the model weights fit. You sketch one live request: 32 layers, 8 KV heads, a head dimension of 128, 100,000 cached tokens, and two bytes per value. The <span data-glossary="kv-cache">key-value (KV) cache</span> alone is about 13.1 GB. Then the interviewer changes concurrency from 4 to 40 and waits for you to update the diagnosis.

Prefill processes the prompt and builds its cached state. Decode generates the response one token at a time while reusing that state. Running out of memory (OOM) during decode therefore asks about live request state as well as stored weights.

Each question below asks you to connect a definition to a decision. Use them to practice applied reasoning; interview formats vary by employer. Try an answer before you read the explanation. Use the linked lesson when you need the derivation or the implementation.

| If the symptom is... | Inspect first | Evidence to request |
|---|---|---|
| First token is slow | Queue time, prompt length, and <span data-glossary="prefill">prefill</span> | Time to first token (TTFT) split by queue and prefill |
| Decode runs out of memory | KV-cache shape and active concurrency | Cache bytes per sequence and free blocks |
| Retrieval-Augmented Generation (RAG) cites the wrong rule | Eligibility, retrieval, reranking, and context assembly | Retrieved chunk IDs and <span data-glossary="recall-at-k">recall@k</span> slice |
| Agent repeats a tool | Progress state, repeated-call detection, and stop policy | <span data-glossary="tracing">Tool trace</span> and state transitions |
| Offline score rises while users regress | Dataset slices, judge <span data-glossary="calibration">calibration</span>, and rollout | Human-reviewed failures and canary metrics |

## Start with one request trace

The opening estimate treated weights and cache as different objects. [Next-token prediction](/learn/language-modeling-next-token-prediction) defines the prediction task, and the [end-to-end Transformer](/learn/transformer-architecture-end-to-end) explains how token states become <span data-glossary="logits">logits</span> and then <span data-glossary="token">token</span> probabilities. Stored weights stay loaded. Activations and cached states occupy memory only while requests are live. A <span data-glossary="context-window">context window</span> limits prompt plus generated tokens.

The questions below keep asking which of those objects actually failed. Weights that fit say little about how many long requests a server can admit.

## Transformer architecture and attention

### 1. If a later token ignores an earlier instruction, what do you inspect first?

Inspect the assembled request first: was the instruction included, truncated, contradicted by a higher-priority instruction, or presented as quoted data? If the request is correct, attention helps explain how earlier tokens can affect later ones, but its formula alone can't diagnose instruction following. Each token representation is projected into Query, Key, and Value <span data-glossary="vector">vectors</span>. Query-key scores determine which positions contribute to the mixture of Values.

Query-key <span data-glossary="dot-product">dot products</span> produce routing scores, <span data-glossary="softmax">softmax</span> turns each row into weights, and those weights mix the values:

$$
\text{Attention}(Q,K,V)=\text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}+M\right)V
$$

$M$ is a mask. In a causal decoder, it blocks future positions. If $d_k=64$, the scale factor is $\sqrt{64}=8$. Under the simplifying assumption of independent, zero-mean, unit-variance coordinates, an unscaled dot product has variance $d_k$; dividing by $\sqrt{d_k}$ keeps that variance from growing with head width.[^vaswani2017]

If an instruction was truncated, attention cannot retrieve its missing tokens. When investigating a hosted-model answer, first verify the input and truncation path; inspect a faulty mask when you control or can observe the model implementation. Full-sequence dense causal attention processes a triangular set of interactions, giving <span data-glossary="big-o-notation">$O(n^2)$</span> work in sequence length. One cached decode step attends from one new position to the prefix, with attention work linear in prefix length. [Scaled Dot-Product Attention](/learn/scaled-dot-product-attention) works through the shapes and implementation.

### 2. What would an attention-head visualization actually prove?

<span data-glossary="multi-head-attention">Multi-head attention (MHA)</span> runs several learned Query, Key, and Value projections in parallel. Each head works in a lower-dimensional subspace; their outputs are concatenated and projected back to model width.[^vaswani2017] A heatmap can show which positions received high weights for one input.

That picture suggests a hypothesis. Computation is distributed across heads and layers, so syntax, entities, and factual recall can depend on multiple components. Test a proposed role with an intervention or ablation, then check whether the behavior changes on held-out inputs.

### 3. Decode is memory-bound. How do MHA, GQA, and MQA change the KV cache?

Hold eight Query heads fixed. <span data-glossary="multi-head-attention">Multi-head attention</span> stores eight Key and Value groups, <span data-glossary="grouped-query-attention">Grouped-Query Attention (GQA)</span> might store two, and Multi-Query Attention (MQA) stores one shared pair. MQA therefore reduces the cache and memory traffic most, while GQA keeps some independent groups for quality.[^shazeer2019][^ainslie2023]

In the GQA paper's evaluated uptraining conversion, quality stayed close to MHA while speed approached MQA. Expect results to depend on the model and training setup. Fewer KV heads can relieve cache capacity and <span data-glossary="memory-bandwidth">memory bandwidth</span> pressure, but may do little for compute-bound prefill. This choice changes checkpoint architecture: converting an MHA checkpoint requires modifying weights and typically further training. [Multi-Query and Grouped-Query Attention](/learn/multi-query-grouped-query-attention) derives the serving math.

<figure>
  <img src="illustrations/_generated/attention_heads_dark.png" alt="Attention KV sharing comparison where eight query heads stay fixed while stored key-value groups fall from eight in MHA, to two in GQA, to one in MQA, with relative cache bars of eight, two, and one." />
  <figcaption>With layer count, head dimension, sequence length, and dtype fixed, cache sizes are 8:2:1 in this example. The bars use <span data-glossary="multi-query-attention">MQA</span> as the 1× baseline; query-head count stays at eight.</figcaption>
</figure>

### 4. A model accepts a longer prompt. What hasn't RoPE solved?

Unmasked self-attention without positional information is permutation-equivariant: reordering inputs reorders outputs. A causal mask introduces ordering constraints, but explicit positional mechanisms give the model richer position information. <span data-glossary="rope">Rotary Position Embedding (RoPE)</span> rotates Query and Key coordinates according to position. Their dot product then depends on relative displacement as well as learned content.[^su2021]

Longer sequence capacity describes ingestion; retrieval quality needs its own test. A model can ingest the tokens and still lose needle accuracy or position sensitivity past the lengths seen in training. Evaluate context extension on long-context tasks. [RoPE and ALiBi](/learn/positional-encoding-rope-alibi) develops that distinction.

### 5. A deep decoder is unstable at init. Does Pre-LN vs Post-LN change the first hypothesis?

Post-LN applies <span data-glossary="layernorm">layer normalization</span> after the residual addition. Pre-LN normalizes before the attention or feed-forward sublayer, leaving a more direct gradient route through the residual path. The cited analysis found better-behaved gradients at initialization for Pre-LN.[^xiong2020] A loss spike still has several possible causes: inspect normalization order alongside learning rate, precision, data, masks, and gradient statistics.

RMSNorm removes LayerNorm's mean-centering step and normalizes by root mean square.[^zhang2019] It can reduce computation, but it's a different operation rather than a drop-in identity. Architecture details vary, so inspect the exact block and norm implementation. [Layer Normalization](/learn/layer-normalization-pre-ln-post-ln) traces both layouts.

## Tokens and representations

Attention cannot recover text the tokenizer never emitted. A tokenizer swap can change the bill and the sequence before any attention weight moves.

### 6. Billed tokens jumped after a tokenizer swap. What do you check?

Word vocabularies handle unseen strings poorly, while character vocabularies make common text needlessly long. <span data-glossary="subword-tokenization">Subword</span> methods keep frequent pieces intact and decompose rarer strings into reusable units. Byte-pair encoding (BPE) and SentencePiece are related tools, not synonyms: BPE is a segmentation algorithm, while SentencePiece is a language-independent tokenizer framework that can train BPE or unigram models on raw text.[^sennrich2016][^kudo2018]

Compare token counts for the same prompts under each model's own tokenizer. Names, code, whitespace, Unicode, and mixed languages can split differently. Token IDs must match the checkpoint's embedding and output tables, so a tokenizer migration must update the model's token mappings and weights together. Use the deployed model's tokenizer for context estimates, and the provider's usage accounting for billing. [Tokenization with BPE, WordPiece, and SentencePiece](/learn/tokenization-bpe-wordpiece-sentencepiece) compares the algorithms.

### 7. Why would a static embedding table fail as a retrieval index?

A retrieval query containing "port" exposes the distinction. Static embeddings such as word2vec assign one vector to that vocabulary item regardless of its sentence.[^mikolov2013] An LLM's input embedding lookup is also context-free, but <span data-glossary="transformer">Transformer</span> layers update token states using surrounding positions. When "port" has the same token ID, a shipping report and a networking trace start with the same lookup vector but can produce different contextual states.[^devlin2019]

An <span data-glossary="embedding">embedding</span> model turns a selected contextual state or pooled sequence into a retrieval vector. That pooling choice and training objective matter, so an arbitrary hidden state isn't automatically a good semantic-search embedding. If near-duplicates collide or opposite senses rank together, inspect the embedding checkpoint and pooling contract before blaming the index. [Contextual Embeddings](/learn/sentence-embeddings-contrastive-learning) follows the transformation.

### 8. Rankings flipped after switching cosine for dot product. What broke?

For query $q=(1,0)$, compare $a=(1,0)$ with $b=(2,2)$. Dot product prefers $b$: its score is 2 rather than 1. Cosine prefers $a$: its score is 1 rather than $1/\sqrt{2}\approx0.707$. Cosine removes magnitude from the comparison. On unit-normalized embeddings, cosine and dot-product rankings are identical.

That is the test to run after a metric swap: compare rankings and score distributions on the same queries, then recheck any threshold calibrated under the old metric. Match the index metric to the embedding model's training objective and preprocessing contract. [Embedding Similarity](/learn/embeddings-cosine-dot-product-quantization) includes the geometry and <span data-glossary="quantization">quantization</span> effects.

## Inference and serving

Token counts and similarity metrics can be settled while decode still runs out of memory. At serving time, the same model has two very different jobs. Prefill reads the prompt and builds state. Decode reuses that state while adding one token at a time. Keep those phases separate, because a fix for queueing or prefill may do nothing for a decode OOM.

### 9. Decode OOMs while weights still fit. What does the KV cache store?

Autoregressive generation adds one token at a time. The <span data-glossary="kv-cache">KV cache</span> stores past Key and Value <span data-glossary="tensor">tensors</span> so each decode step doesn't recompute the full prefix. Weights can fit once and still leave too little room for the live states.

For standard full attention with the same KV geometry in every layer, equal sequence lengths, and no shared prefixes, a useful estimate is:

$$
\begin{aligned}
M_{\mathrm{KV}} &= 2 \times L \times H_{\mathrm{KV}} \times d_{\mathrm{head}} \\
&\quad \times T \times b \times N_{\mathrm{seq}}
\end{aligned}
$$

Here, $L$ is the layer count, $H_{\mathrm{KV}}$ the KV-head count, $d_{\mathrm{head}}$ the head dimension, $T$ the cached token count, $b$ the bytes per value, and $N_{\mathrm{seq}}$ the active sequence count. The leading 2 stores both K and V. A 32-layer model with 8 KV heads, head dimension 128, 100,000 cached tokens, and 2-byte values needs about 13.1 GB for one sequence. With 32 KV heads, the same geometry needs about 52.4 GB. Real admission control also reserves allocator and kernel workspace headroom. [KV Cache and PagedAttention](/learn/kv-cache-paged-attention-llm-serving) derives the capacity math.

The function below also answers the opening follow-up: forty independent sequences need about 524.3 GB for this cache alone. Sliding-window layers, compressed caches, prefix sharing, and other architectures need different accounting.

<!-- leetllm: test, output=show, output_title="KV cache memory sizing across head configurations" -->
```python title="kv_cache_sizing.py"
def estimate_kv_cache_gb(
    layers: int,
    kv_heads: int,
    head_dim: int,
    tokens: int,
    active_sequences: int = 1,
    bytes_per_value: int = 2,
) -> float:
    """Calculate KV cache memory in decimal gigabytes (10^9 bytes)."""
    for name, value, minimum in [
        ("layers", layers, 1), ("kv_heads", kv_heads, 1),
        ("head_dim", head_dim, 1), ("bytes_per_value", bytes_per_value, 1),
        ("tokens", tokens, 0), ("active_sequences", active_sequences, 0),
    ]:
        if type(value) is not int or value < minimum:
            raise ValueError(f"{name} must be an integer >= {minimum}")
    total_bytes = 2 * layers * kv_heads * head_dim * tokens * bytes_per_value * active_sequences
    return total_bytes / 1e9


print("32 layers, head_dim 128, 100k tokens, FP16 (2 bytes):")
print(f"  GQA (8 KV heads, 1 seq):   {estimate_kv_cache_gb(32, 8, 128, 100_000, 1):.1f} GB")
print(f"  MHA (32 KV heads, 1 seq):  {estimate_kv_cache_gb(32, 32, 128, 100_000, 1):.1f} GB")
print(f"  GQA (8 KV heads, 4 seqs):  {estimate_kv_cache_gb(32, 8, 128, 100_000, 4):.1f} GB")
print(f"  GQA (8 KV heads, 40 seqs): {estimate_kv_cache_gb(32, 8, 128, 100_000, 40):.1f} GB")
```

<!-- leetllm: output:start -->
```text title="KV cache memory sizing across head configurations" output compact
32 layers, head_dim 128, 100k tokens, FP16 (2 bytes):
  GQA (8 KV heads, 1 seq):   13.1 GB
  MHA (32 KV heads, 1 seq):  52.4 GB
  GQA (8 KV heads, 4 seqs):  52.4 GB
  GQA (8 KV heads, 40 seqs): 524.3 GB
```
<!-- leetllm: output:end -->

The helper accepts positive integer geometry and whole-byte cache values; zero tokens or zero active sequences produce an empty cache. A negative token count, fractional sequence count, or Boolean must fail instead of returning a plausible memory estimate. Packed sub-byte caches need a separate calculation that includes scales, alignment, and the runtime's actual layout.

> **Checkpoint:** Suppose the deployment has 60 decimal GB left for KV storage after reserving weights and workspace. Four of these independent GQA sequences require 52.4 GB; a fifth requires 65.5 GB, so it exceeds that budget. For a device reporting GiB, convert the budget before comparing: 1 GiB is $2^{30}$ bytes, while this program uses $10^9$. Confirm safe concurrency by measuring runtime allocations and workspace on the target deployment.

> **Common mistake:** Don't treat weight <span data-glossary="vram">VRAM</span> as the out-of-memory story when decode dies. Count KV bytes for live tokens and concurrency first.

### 10. Throughput is low and memory is fragmented. What problem does PagedAttention solve?

PagedAttention stores a sequence's KV cache in fixed-size, non-contiguous blocks. Blocks can be allocated as a sequence grows, freed when it finishes, and shared where prefixes are safely reusable.[^kwon2023] The serving system wastes less memory waiting for one contiguous allocation.

That cuts fragmentation, over-reservation, and redundant copies; it doesn't change attention semantics or remove the KV bytes required by live tokens. <span data-glossary="pagedattention">PagedAttention</span> manages cache blocks, while continuous batching decides when sequences enter or leave execution. A server can use either mechanism without getting the other automatically.

### 11. Fleet TPS rose and users still wait. How do TTFT, ITL, TPOT, and TPS differ?

<span data-glossary="ttft">Time to first token (TTFT)</span> includes queueing, request preparation, prompt prefill, and first-token generation. A long prompt can make prefill a large component; measure the split for the actual workload. During decode, inter-token latency (ITL), also called time between tokens, measures each gap in the stream. Time per output token (TPOT) summarizes decode pacing over a completion, while tokens per second (TPS) must be labeled as per-request or fleet aggregate.

Suppose aggregate <span data-glossary="tokens-per-second">TPS</span> rises while users report a slower first token. One number can't stand in for all four: a scheduler can raise fleet throughput while worsening tail TTFT and ITL. Split TTFT into queue versus prefill before changing kernels. [Inference Mechanics](/learn/inference-mechanics-ttft-tps-kv-cache) connects these metrics to compute-heavy prefill and memory-heavy decode.

### 12. Output lengths vary and GPUs sit idle. Why does continuous batching help?

Static batches hold a fixed group until its longest sequence finishes. Continuous, or iteration-level, batching admits waiting requests and removes completed ones between decoding iterations.[^yu2022] A short response can leave the batch while a long response continues, so the freed slot can do useful work.

Higher utilization can still hurt tail latency or fairness. A live scheduler needs admission control, queue <span data-glossary="slo">SLOs</span>, token budgets, and protection against long requests starving short ones. [Continuous Batching](/learn/continuous-batching-request-scheduling) works through that scheduling pressure.

### 13. The 4-bit file is smaller. Why might inference still be slower or worse?

Quantization represents weights or runtime state with fewer bits. <span data-glossary="gptq">GPTQ</span> and <span data-glossary="awq">AWQ</span> are <span data-glossary="post-training-quantization">post-training quantization</span> methods with different calibration strategies.[^gptq2023][^lin2023] <span data-glossary="gguf">GGUF</span> stores model tensors and metadata for `llama.cpp`-family runtimes. GPTQ and AWQ describe ways to quantize weights; GGUF describes how a model artifact is packaged.[^gguf_spec2026]

Inference speed depends on kernel support, dequantization, memory bandwidth, hardware, context length, and batch shape. Quality loss is task-dependent, so compare the quantized artifact against its source checkpoint on held-out slices. Treat file-size reduction as a serving improvement only when the target kernel and workload use it well. [Model Quantization](/learn/model-quantization-gptq-awq-gguf) covers the formats and measurement plan.

### 14. Speculative decoding didn't speed you up. When does it actually help?

A faster draft path proposes several tokens, and the target model verifies those candidates in parallel. Exact speculative sampling variants preserve the target distribution through an acceptance and correction procedure.[^leviathan2023] Measure accepted tokens per draft attempt to capture useful progress.

Speedup depends on draft cost, acceptance length, verification overhead, and the target's bottleneck. Low acceptance can erase the benefit, and approximate variants use different acceptance rules. Preserving a distribution defines output probabilities; exact strings remain dependent on the random-number stream and execution details. [Speculative Decoding](/learn/speculative-decoding) derives the acceptance path.

## Retrieval and grounded generation

Runtime tuning can't supply a fact that never entered the request. Retrieval introduces a second path to debug: source eligibility and indexing happen before the model call, while selection and grounding happen inside the request.

### 15. Which RAG stages can fail before the model call?

A cited policy can be valid and still belong to a different tenant. Retrieval-Augmented Generation (RAG) supplies external evidence before generation.[^lewis2020] Offline work parses sources, preserves lineage and permissions, creates chunks, computes sparse or dense representations, and updates indexes. Online work interprets the query, applies eligibility filters, retrieves and reranks candidates, assembles context, generates an answer, then validates claims and citations.

If the cited rule is wrong, trace whether the source was eligible, retrieved, selected into context, and actually used before changing the generator. Record those boundaries so each wrong answer has a replayable trace.

### 16. When is hybrid search better than dense-only retrieval?

Dense retrieval handles paraphrases and semantic similarity. Sparse retrieval such as BM25 scores lexical matches and can help with identifiers, error codes, and rare names, provided its text analyzer preserves those terms. <span data-glossary="hybrid-search">Hybrid search</span> combines ranked lists, often with Reciprocal Rank Fusion (RRF), which adds reciprocal rank contributions without requiring raw sparse and dense scores to share a scale.[^cormack2009]

If a query mixes "how do I rotate credentials?" with an exact error code, ask which retriever can surface both pieces. Hybrid is a good baseline when paraphrases and exact identifiers matter. Keep it only if evals beat sparse-only and dense-only baselines on the relevant slices. [Hybrid Search](/learn/core-retrieval-algorithms) covers fusion and <span data-glossary="reranker">reranking</span>.

### 17. How should RAG evaluation separate retrieval from generation?

Retrieval asks whether relevant evidence entered the candidate set and selected context. Recall@k is the fraction of labeled relevant items found in the top $k$. If two passages are relevant and only one appears, recall is $1/2$, while hit rate (at least one relevant result) is 1. Mean reciprocal rank (MRR) rewards the first relevant result appearing early; normalized discounted cumulative gain (nDCG) handles graded relevance and rank. Generation asks whether claims are supported, relevant, complete, and correctly cited.

Use a retrieval slice first: if the needed passage never enters the top $k$, generation has no chance to cite it. RAGAS-style automated metrics and LLM judges can scale review, but their scores need calibration against human-labeled cases.[^es2023][^zheng2023] A final-answer score can't tell whether the first failure was eligibility, retrieval, context assembly, or generation. [RAG Evaluation](/learn/design-production-rag-pipeline) teaches that attribution trace.

### 18. How should you choose a chunking strategy?

Fixed-size chunks are easy to reproduce but can split a sentence, table, or policy condition. Structural chunks preserve headings and document units. Semantic splitting uses model signals to find topic changes, adding cost and another versioned dependency.

Compare chunk sizes under the same retrieval and context budgets. Preserve conditions and exceptions together where possible; overly small chunks lose context, while large ones can bury evidence and consume the prompt budget. Tune size and overlap from failures, including questions that need neighboring passages or a document summary. [Chunking Strategies](/learn/chunking-strategies-document-processing) supplies the experiments.

### 19. Vector retrieval found the right passages. Why might GraphRAG still be the next experiment?

Suppose vector retrieval finds several local passages, but the question asks for the main themes across an entire corpus. Microsoft's GraphRAG method extracts entities and relationships, builds a hierarchical community structure, summarizes those communities, and uses the summaries for query-focused sensemaking across a corpus.[^edge2024] That global-search job differs from retrieving a few semantically similar chunks.

Use a graph when relationship structure or corpus-wide themes are central and simpler retrieval misses them. Extraction errors, graph updates, community summaries, and provenance add new failure surfaces. If evals show local chunks are already sufficient, don't add the graph. [GraphRAG](/learn/graphrag-knowledge-graphs-vector-search) compares local, global, and vector paths.

## Training and adaptation

A better prompt or a better index can still leave a repeated format wrong. These questions ask which training stage, if any, should move, and which memory cost comes with that choice.

### 20. Format is wrong vs. preferred style is wrong. Which training stage do you touch?

Pre-training optimizes next-token loss over a broad corpus. Supervised fine-tuning (SFT) continues token-level training on curated demonstrations so prompts, responses, formats, and tool traces become more likely. Preference optimization then uses comparisons or rewards to shift which plausible responses the model favors.[^ouyang2022]

Before training for malformed tool calls, check the schema, prompt, truncation, and any supported constrained-output mechanism. If a representative evaluation still exposes a behavior gap, demonstrations provide direct examples of the desired output; preference pairs express which alternatives are better. These objectives overlap in what they can teach. Choose the data and objective from the observed failure and allow for overlap in what SFT and preference learning can improve.

### 21. Fine-tuning memory blew up. What do LoRA and QLoRA actually save?

LoRA freezes a base weight matrix and learns a low-rank update alongside it.[^hu2021] That reduces trainable parameters and optimizer state, and it produces a compact adapter. The base model remains part of training and inference; the adapter reduces training memory while the base checkpoint supplies the original weights.

QLoRA keeps the frozen base model quantized during adapter training and uses 4-bit NormalFloat plus additional memory techniques in the original method.[^dettmers2023] It lowers fine-tuning memory, but it doesn't dictate the final serving format. A merged or exported model needs its own quantization and quality evaluation. If serving still needs the full-width checkpoint, you saved training memory, not decode VRAM. [LoRA and QLoRA](/learn/lora-parameter-efficient-fine-tuning) develops the memory accounting.

### 22. Preference data is solid. Why might you still keep an explicit reward model?

The InstructGPT-style reinforcement learning from human feedback (RLHF) pipeline trains a reward model on ranked outputs, then optimizes the language-model policy against that learned reward with a constraint to stay near a reference policy.[^ouyang2022] Direct Preference Optimization (DPO) derives a classification-style objective over preferred and rejected responses, avoiding a separately trained reward model and online RL loop.[^rafailov2023]

Choose based on the question you need to answer. DPO has a simpler training pipeline, but it still depends on preference-data quality, a reference policy, and objective choices. RLHF's explicit reward model can be inspected or reused, yet it creates another model that can be exploited. [RLHF and DPO](/learn/rlhf-dpo-aligning-language-models) compares those boundaries.

### 23. When are verifiable rewards useful?

Reinforcement Learning with Verifiable Rewards (RLVR) replaces a learned preference reward with a verifier that checks correctness for a supported domain. Tülu 3 used answer matching and constraint checks; code execution can provide another verifier when tests capture the task.[^lambert2024rlvr] DeepSeek-R1 later showed large-scale reinforcement-learning pipelines with rule-based rewards for math and code tasks.[^deepseekai2025]

The test is whether the verifier measures the behavior users need. Reliable verifiers can provide a direct training signal, but they don't cover subjective quality and can reward shortcuts or test exploits. Hold out verifier-backed evaluations and inspect reward hacking rather than assuming an objective checker is complete. [RLVR and Verifiable Rewards](/learn/rlvr-verifiable-rewards-training) develops the training and evaluation loop.

### 24. When should you use prompting, RAG, fine-tuning, or a combination?

Diagnose the missing capability before changing weights. Prompt changes fit unclear instructions. RAG fits missing, private, changing, or citation-dependent facts. Fine-tuning fits repeated behavior or format gaps that survive a good prompt baseline. A combined system makes sense when it needs both external knowledge and stable learned behavior.

| Measured gap | First experiment | New burden |
|---|---|---|
| Instructions are ambiguous | Rewrite prompt and add examples | Longer context and prompt maintenance |
| Evidence is absent or stale | Add retrieval | Ingestion, permissions, retrieval evals, citations |
| Behavior is repeatedly wrong | Fine-tune on representative data | Training data, model versioning, regression evals |
| Facts and behavior both fail | RAG plus fine-tuning | Both systems and their interaction |

These are starting experiments, and systems can combine the approaches. Retrieved examples can demonstrate a format, and fine-tuning can encode facts. The practical difference is how the information is supplied, updated, and checked.

### 25. A larger model lost to a smaller one at the same compute. What did Chinchilla change?

Scaling-law work modeled how language-model loss changes with parameters, data, and compute.[^kaplan2020] Chinchilla's experiments showed that, under its dense-model training setup and fixed compute budget, several large models used too many parameters and too few training tokens.[^hoffmann2022]

Compare training tokens, data mixture, architecture, optimization, and post-training together. Compute-optimal findings are empirical fits within a regime; re-estimate them when that regime changes. [Scaling Laws](/learn/scaling-laws-compute-optimal-training) explains how to read them.

## Agents and tool use

Training loss will not show you a stuck tool call. A tool-using agent adds application state to inspect: the requested action, returned observation, progress toward the task, and the policy that permits another step. Read-only research agents need these controls too, even when they never modify an external system.

### 26. When is a repeated tool call a loop rather than a retry?

ReAct interleaves reasoning traces with actions and observations, letting new tool evidence affect the next decision.[^yao2023react] The trusted runtime should record action inputs, tool results, state transitions, and stop decisions. It doesn't need to expose or persist private chain-of-thought to make execution debuggable.

Polling an unfinished job twice can be correct if the runtime enforces a deadline and backoff. Repeating the same invalid search query after a deterministic validation error is different: nothing about the second call can repair the rejected argument. Compare the error class, intended progress, arguments, and retry budget. Stop or revise the plan when repetition can't help; don't use identical observations alone as proof of a broken agent.

### 27. What does MCP standardize, and what remains application policy?

Model Context Protocol (MCP) defines client-server messages and discovery for prompts, resources, and tools. In the 2026-07-28 stateless specification, requests carry per-request protocol and capability metadata, and servers declare supported versions and capabilities through `server/discover` rather than a stateful initialization handshake.[^mcp_server_overview2026][^mcp_architecture2026][^mcp_discover2026] Tools expose executable functions, resources expose contextual data, and prompts expose user-selectable templates.

Now ask what happens when a discovered tool can write to a database. Discovery isn't authorization. The host must enforce its consent and execution policy, and the server must enforce access to its own resources.[^mcp_tools2026] Identity, permissions, timeouts, validation, and audit still need implementation. Even passing schema validation only establishes argument shape, not permission to execute. [MCP Standards](/learn/function-calling-tool-use-llms) follows those trust boundaries.

### 28. When does a multi-agent design earn its complexity?

Multiple agents can separate permissions, contexts, specialized evaluators, or independent work that truly runs in parallel. They also add calls, handoff contracts, latency, duplicated state, and harder failure attribution.

Start with one agent and a clear tool/runtime boundary. Add another role when an observed failure has a named owner and the handoff can be validated. "Planner, worker, critic" labels alone don't guarantee a benefit. [Multi-Agent Orchestration](/learn/multi-agent-dags-langgraph-orchestration) covers state and reconciliation.

### 29. How should an agent runtime classify failures?

Separate invalid tool calls, deterministic application errors, transient service failures, repeated-action loops, budget exhaustion, and unsafe side effects. Recovery depends on that class. Retrying unchanged arguments after a schema error won't help, while replaying a write may duplicate an external action.

Use the failure class to choose the control: argument validation for bad inputs, retries for bounded transient errors, idempotency keys for replayable writes, checkpoints for recovery, circuit breakers for unhealthy dependencies, and human review for irreversible actions. [Agent Failure States](/learn/agent-failure-states-retry-fallback) maps each symptom to a recovery policy.

### 30. Why can't prompt filters solve prompt injection?

Prompt injection occurs when untrusted content tries to influence instructions or tool use, including content retrieved from documents or websites.[^greshake2023] A classifier can catch known patterns, but natural language can't create a reliable trust boundary by itself.

Keep authorization and side-effect policy in trusted code. Tag untrusted content, minimize tool privileges, validate arguments and outputs, isolate sensitive retrieval, and require confirmation for consequential writes. [Prompt Injection Defense](/learn/prompt-injection-defense-strategies) develops the threat model.

## Evaluation and release decisions

Once an agent can act, "better" needs an operational definition. A score can move because tokenization changed, a judge preferred a longer answer, or a canary reached a different traffic mix. These questions turn a number into a testable release decision.

### 31. Two checkpoints have different perplexity. Can you rank them?

Perplexity is exponentiated average negative log-likelihood:

$$
\text{PPL}=\exp\left(-\frac{1}{N}\sum_{i=1}^{N}\log p(x_i\mid x_{<i})\right)
$$

Lower perplexity means the model assigned higher probability to the observed token sequence. Compare checkpoints on the same corpus, tokenization, and evaluation protocol, including how context windows and scored tokens are handled.[^huggingface_ppl] Tokenizer differences change the measurement basis, so align them before comparing averages. Evaluate instruction following, factual support, tool success, and product usefulness separately. [Perplexity](/learn/perplexity-language-model-evaluation) connects it to cross-entropy.

### 32. How do you calibrate an LLM judge?

An LLM judge scores or compares outputs against a rubric. It can scale review, but position, verbosity, style, and model-family preferences can move scores.[^wang2023c][^zheng2023]

Give the judge a calibration slice before trusting its ranking. Blind model identity, swap pair order, test concise and verbose controls, and measure agreement against a human-labeled calibration set. Keep deterministic facts outside the judge when code or exact matching can check them. [LLM-as-a-Judge](/learn/llm-as-judge-automated-evaluation) builds that calibration report.

### 33. How do you reduce and detect unsupported claims?

A plausible answer can still be unsupported by available evidence. Retrieval helps only if the right evidence reaches context and the model uses it correctly. Requiring a citation helps only if the cited passage supports the nearby claim.

Split the answer into claims, then check each claim against allowed evidence. Return uncertainty when support is missing, route high-risk cases to review, and preserve source IDs and versions so a failure can be replayed. [Hallucination Mitigation](/learn/hallucination-detection-mitigation) covers claim-level validation.

### 34. How should offline evals and online tests work together?

Offline evals provide repeatable release checks across task, safety, retrieval, latency, and cost slices. Public benchmarks can help screen models, but contamination and harness differences limit their value as release gates. Private fixtures and verifiers should match the deployed task.

Define release gates before seeing the candidate's scores. Include rare but consequential failures and plausible abuse alongside average traffic. After passing those gates, use canaries or A/B tests to measure traffic shape, provider errors, latency, and user outcomes the suite misses. Safety or reliability regressions can block rollout even when average quality improves. [A/B Testing for LLMs](/learn/experiment-design-ab-testing) covers staged decisions, while [Understanding SWE-bench](/blog/swe-bench-deep-dive) shows why harness details change benchmark meaning.

## System design under follow-up pressure

Follow-ups change ownership and constraints rather than asking for another definition. Freeze one failed request, locate the first broken boundary, and then choose an architecture that makes that boundary observable.

### 35. How do you isolate the first failure in a RAG regression?

Consider a support query: "Can I export audit logs?" The eligible, current policy passage `P-17` says that enterprise accounts can. Retrieval returns it at rank 2, behind an irrelevant passage `P-04`. A context selector keeps only rank 1, and the answer says exports are unavailable.

The first loss occurs at context selection: retrieval found `P-17`, and generation never received it. Replay with the same authorized source snapshot and selection policy. Supplying `P-17` in a diagnostic replay can test whether generation then succeeds; it doesn't justify bypassing permissions or declare every downstream bug fixed.

<figure>
  <img src="illustrations/_generated/rag_failure_isolation_dark.png" alt="Worked RAG trace: required policy P-17 is eligible and retrieved at rank 2, but is absent from selected context, which contains only irrelevant P-04. The first evidence loss is context selection." />
  <figcaption>Track the same evidence ID across stages. A successful retrieval hit does not prove that the generator received the passage.</figcaption>
</figure>

### 36. What drives the design of an inline code-completion system?

Inline completion is latency-sensitive and becomes stale as soon as the user edits again. The request may combine cursor prefix and suffix, current file, nearby files, language-server symbols, and recent edits, then route to a model trained for the chosen completion contract.

Cancel obsolete requests when the cursor moves, cache reusable context, cap prompt work, and evaluate acceptance plus edit survival rather than raw generation alone. Larger or slower models can serve explicit refactors and chat without sitting on the keystroke path. [Code Completion Design](/learn/design-code-completion-system) develops that split.

### 37. How should a moderation system choose thresholds and escalation?

Start with policy categories and the cost of false positives and false negatives for each one. Deterministic rules and small classifiers can handle clear cases; richer models can review ambiguity; humans can own appeals and high-risk uncertainty.

One global threshold hides category-specific harm. Track precision, recall, calibration, latency, appeal reversals, and slice performance by policy class. [Content Moderation Design](/learn/prompt-injection-defense-strategies) turns those measurements into a tiered architecture.

## Production operation

An architecture becomes expensive and opaque when its units of work are unclear. Cost asks what an accepted answer consumed; observability records where that work spent time and which boundary owned the result; caching adds a correctness constraint to both.

### 38. How do you reason about inference cost?

Count input tokens, output tokens, retries, tool calls, cache behavior, model prices, and human review. For self-hosting, include accelerators, headroom, storage, networking, platform labor, and accepted throughput at the required latency.

Normalize by successful, accepted work rather than raw tokens. A cheaper call that produces more retries or rejected answers may cost more end to end. [LLM Cost Engineering](/learn/llm-cost-engineering-token-economics) builds the ledger.

### 39. Which signals make an LLM request debuggable?

Trace queue time, TTFT, ITL, token counts, model and configuration version, route decision, retrieval IDs and scores, tool inputs and error classes, policy version, and final outcome. Self-hosted serving also needs GPU utilization, batch shape, free KV blocks, and preemption.

Store raw prompts, documents, or outputs only under an explicit access and retention policy. A useful trace identifies whether retrieval, context assembly, model behavior, a tool, or timeout owned the failure without creating a second data leak. [LLM Observability](/learn/llm-deployment-gpu-serving-autoscaling) defines that trace.

### 40. When is semantic caching unsafe?

Semantic caching embeds a request and reuses a response for a nearby request.[^bang2023] Similar wording doesn't prove equivalent intent, permissions, time sensitivity, or user state. A loose threshold can return a plausible answer that belongs to another policy version or identity.

Treat a semantic cache hit as a proposed reuse. Reuse requires equivalent intent, current authorization, and fresh data. Partition keys by tenant and permission boundary, include model and data versions, and recheck authorization and freshness before serving. Bypass personalized or high-risk requests where equivalence is uncertain, and evaluate false hits alongside hit rate. [Semantic Caching](/learn/llm-cost-engineering-token-economics) covers those controls.

## Advanced model architecture

These questions change the unit you count. Sparse experts separate active FLOPs from resident memory; state-space layers trade direct access for compressed state; tiled attention changes memory traffic without changing the equation. Keep each claim tied to the workload that exposes the trade-off.

### 41. Only 37B parameters are active. Why can an MoE still OOM?

A sparse Mixture of Experts (MoE) layer routes each token to a subset of feed-forward experts. Compute per token depends on active experts, while model capacity depends on the full expert set.[^jiang2024] In a serving deployment, resident experts still consume memory even when a token activates only a few of them, and routing adds load-balancing and communication costs.

DeepSeek-V3 makes the distinction concrete: its report lists 671B total parameters, 37B active per token, 256 routed experts plus one shared expert per MoE layer, and eight routed experts selected for each token.[^deepseekv3_2024] Operators can distribute or offload experts across devices. Account for residency, transfers, cache, and routing placement alongside active FLOPs. [Mixture of Experts](/learn/mixture-of-experts-architecture) separates stored capacity from active compute.

<figure>
  <img src="illustrations/_generated/moe_routing_dark.png" alt="Mixture-of-experts routing graph where a router selects two active experts while other experts remain stored in the serving system, then combines the selected outputs." />
  <figcaption>This small top-2 example separates active compute from stored capacity. One token executes only selected experts, while the complete expert set still consumes storage and creates routing and placement constraints. DeepSeek-V3 selects eight routed experts plus one shared expert, not two.</figcaption>
</figure>

### 42. Long-context cost dropped. Why might exact recall still fail?

Selective <span data-glossary="state-space-model">state-space models</span> such as Mamba update a recurrent state and use a hardware-aware <span data-glossary="selective-scan">selective scan</span> for training, giving sequence-length scaling that is linear rather than quadratic for the core sequence operation.[^gu2023] Attention instead creates direct content-dependent interactions between positions inside its window.

Those mechanisms have different memory and retrieval behavior. The original Jamba configuration combines attention and Mamba layers in a 1:7 ratio and uses MoE on every other layer.[^ai21labs2024] A missed buried identifier has several possible causes. Check the actual input, truncation, position, and training distribution, then compare controlled variants where possible. Evaluate exact recall separately on hybrid-attention models. [Mamba and State Space Models](/learn/state-space-models-mamba-alternatives) compares the mechanisms.

### 43. Extra decode tokens didn't help. What counts as test-time compute scaling?

Extra inference compute can produce revisions, sample candidates in parallel, search over candidates, or verify intermediate and final outputs. The best allocation depends on base-model capability, problem difficulty, verifier quality, and the number of times the workload will run.[^snell2024]

Evaluate extra test-time computation by pass rate, latency, and verifier quality. Easy tasks may waste latency, hard tasks may need a stronger model, and weak verifiers can select polished errors. If pass rate stays flat while latency rises, the extra computation has not earned its cost on that evaluation. Inspect candidate quality and selection errors before increasing the budget again. [Reasoning Models and Test-Time Compute](/learn/reasoning-models-test-time-compute) develops the proposer-verifier view.

### 44. Attention memory exploded. How does FlashAttention stay exact with less traffic?

FlashAttention tiles Query, Key, and Value blocks into on-chip memory and maintains online softmax statistics, avoiding a materialized full attention matrix in high-bandwidth memory.[^dao2022] "Exact" means it computes dense attention rather than a sparse or low-rank approximation; changed floating-point operation order need not produce bit-identical outputs.

FlashAttention-3 adds Hopper-focused asynchronous execution and low-precision paths, including FP8, which has its own numerical error.[^shah2024] Runtime speed depends on hardware, dtype, shape, mask, and kernel dispatch. Reading the KV cache is itself attention I/O; avoiding large intermediates doesn't eliminate those reads. Profile the actual prefill and decode kernels before predicting a latency gain. [FlashAttention](/learn/flashattention-memory-efficient-attention) traces the I/O savings.

### 45. The student copies a teacher error. What can distillation transfer?

Distillation trains a student from a teacher's softer output distribution or generated supervision instead of relying only on hard labels.[^hinton2015] The student can learn behavior useful for a narrower workload while using fewer parameters or less inference compute.

It can also inherit teacher errors and coverage gaps. Use representative prompts, keep ground-truth and safety slices separate from teacher-generated data, and compare against a directly trained baseline. [Knowledge Distillation](/learn/knowledge-distillation-llms) covers those choices.

## Safety and governance

Safety claims become useful only when they survive an adversarial case and end at an owner. A principle can shape training, a metric can expose unequal harm, and a guardrail can block a side effect, but those are different controls.

### 46. A team cites a constitution as the safety control. What evidence would you demand?

Constitutional AI uses a written set of principles to have a model critique and revise responses, producing supervised examples, then uses AI-generated preference comparisons during reinforcement learning from AI feedback.[^bai2022]

The constitution remains a human-authored policy artifact. Coverage gaps, conflicts between principles, evaluator errors, and deployment context still need review and red-team evidence. Review failed cases the principles missed alongside the document itself. [Constitutional AI](/learn/rlhf-dpo-aligning-language-models) follows the pipeline.

### 47. How do you audit bias without hiding it in one score?

Start with a product-specific harm definition, then test slices where the harm could differ. Benchmark prompts, counterfactual swaps, and production outcome audits expose different failure types.[^parrish2022][^zhao2018]

Report uncertainty, sample size, false-positive and false-negative costs, and intersectional slices. Averages can improve while a small group regresses, so make the affected slice visible beside the aggregate. [Bias and Fairness](/learn/llm-evaluation-benchmarks-limitations) connects measurement to mitigation.

### 48. What makes a guardrail enforceable?

An enforceable guardrail runs at a trusted boundary: input policy, authorization, tool permission, schema validation, rate or cost limit, output check, circuit breaker, or human approval. A prompt instruction can guide model behavior, but it can't authorize its own side effect.

Log the policy version and decision, test bypasses, and define fail-open or fail-closed behavior for dependency outages. A model-based output classifier can still misclassify content even when trusted code enforces its decision. Keep that uncertainty separate from deterministic permission checks. [Guardrails](/learn/prompt-injection-defense-strategies) covers the runtime design.

### 49. What does context engineering include beyond prompt wording?

Context engineering selects and orders system instructions, examples, retrieved evidence, tool schemas, conversation state, summaries, and token budgets. It also decides what to omit, when to refresh data, and how to preserve source and permission boundaries.

Inspect the assembled context before blaming the base model. Look for stale instructions, lost evidence, conflicting examples, truncation, and irrelevant passages displacing needed evidence from the token budget. [Long-Context Engineering](/learn/long-context-engineering-beyond-management) develops those checks.

### 50. How should weight access and hosting affect model choice?

Open-weight means model parameters are downloadable. It doesn't by itself establish open-source status, permissive commercial rights, reproducibility, privacy, lower cost, or sufficient task quality. Hosting is a separate choice: a provider can serve an open-weight model too. A managed API changes who operates inference, while the product team still owns its data policy, evaluation, routing, and application controls.

Eliminate options that fail data, license, deployment, or operating constraints. Then compare task quality, tail latency, cost per accepted answer, reliability, and team ownership on one dated workload. [Open-Weight vs Closed API LLMs](/blog/open-source-vs-closed-source-llms-2026) provides a current evidence-driven comparison.

## Turn the questions into practice

You should be able to say which object changed: weights, cache, retrieved evidence, tool state, or the score itself. Pick one question and answer it in 90 seconds without notes. Then change one constraint: longer context, stale permissions, higher concurrency, a stricter latency target, or an irreversible tool. Write down which part of your first answer broke and which metric would make you reverse the new design. The opening memory estimate is one of those reversals. Concurrency can move from 4 to 40 while the weights stay fixed, and the cache is what you have to resize.

[AI Lab System Design Interview](/learn/ai-lab-system-design-interview) provides requirement, scale, reliability, and rollout drills. [AI Lab Coding Interview](/learn/ai-lab-coding-interview-python-systems) turns the same reasoning into stateful Python systems, while [AI Lab Technical Presentation](/learn/ai-lab-system-design-interview) focuses on defending mechanisms, failures, evidence, and ownership without overclaiming.
