---
title: Context window
aliases: ["context length"]
importance: 97
---
A context window is the maximum number of tokens a model can process in one inference request: usually a single shared budget that covers system instructions, user text, conversation history, retrieved evidence, tool results, control tokens, and the tokens the model is about to generate.

An advertised 128k describes capacity. A request still needs room for output under any shared limit and must satisfy separate input/output caps. Useful performance depends on training, position encoding, attention, and how you pack the prompt.

## Intuition

Treat the window as the model's working desk for one request. Everything the next-token prediction needs must sit on that desk. A larger desk can hold more paper. Training, position encoding, attention, retrieval, ordering, and budgets determine whether the model uses each note effectively and meets latency goals.

## Formula

For many APIs and open models, one request must satisfy roughly:

$$
n_{\mathrm{in}} + n_{\mathrm{out}} \le W
$$

where $W$ is the context-window limit in tokens, $n_{\mathrm{in}}$ includes serialized templates and tool schemas, and $n_{\mathrm{out}}$ includes any generated reasoning tokens counted by the provider, including tokens absent from the visible answer. Some providers also enforce a separate max-output cap $n_{\mathrm{out}} \le M$ even when space remains in $W$.

During prefill, full self-attention forms pairwise scores over the prompt. Score work scales as $O(n^2 d)$ in sequence length $n$ and head dimension $d$ (Vaswani et al., 2017). Doubling prompt length about *quadruples* pairwise attention work before kernel tricks. FlashAttention and similar kernels reduce memory traffic and wall time by changing execution order. They use $O(n)$ attention-matrix memory while retaining the all-pairs $O(n^2 d)$ compute scaling law. Decode then pays for a growing KV cache whose size scales roughly linearly with surviving sequence length.

## Example

A support-agent call against a 32,000-token window might allocate:

| Slot | Tokens | Notes |
|---|---:|---|
| System policy + tools schema | 1,200 | Trusted, fixed |
| Chat history (summarized) | 4,000 | Older turns compressed |
| Retrieved KB chunks | 12,000 | After rerank, not raw top-20 |
| Live tool traces | 3,000 | Truncate long JSON carefully |
| Answer reserve | 2,000 | Must stay free until generation |
| Safety margin | ~1,000 | Chat template, counters, retries |
| **Total** | **~23,200** | Leaves headroom under 32k |

If the packer forgets the answer reserve, generation hits $W$ mid-sentence and stops early. If it dumps ten mediocre chunks instead of three decisive ones, the model still "has context" but answers worse and costs more.

Rule of thumb for English prose: ~100 tokens ≈ 75 words (provider tokenizer docs). Code, SKUs, and non-English text often use more tokens per visible character, so measure with the *model's* tokenizer, not word count.

## Worked numbers

Attention pairs scale with $n^2$. Moving from a 4,096-token prompt to 131,072 tokens multiplies pairwise score volume by about:

$$
\left(\frac{131072}{4096}\right)^2 = 32^2 = 1024
$$

That ratio describes attention-pair growth. Kernels, hardware, and batching determine the corresponding wall-clock change. Long prompts still increase time-to-first-token.

KV-cache memory grows with sequence length $T$. Per concurrent request, roughly:

$$
\mathrm{bytes} \approx 2 \times L \times H_{\mathrm{kv}} \times d_{\mathrm{head}} \times T \times b
$$

with $L$ layers, $H_{\mathrm{kv}}$ KV heads, head dimension $d_{\mathrm{head}}$, and $b$ bytes per element (2 for FP16/BF16). Long $T$ and high concurrency multiply KV-cache demand and define an important GPU-memory limit for the product.

## Capacity vs utilization

Fitting text into $W$ does not mean the model uses it well. Liu et al. (2023), *Lost in the Middle*, showed multi-document QA and key-value retrieval often work best when the relevant item sits at the beginning or end of a long context, and degrade when the same item is buried in the middle, even on models marketed for long context. Needle-in-a-haystack and position-sweep evals test that gap: advertised window versus effective use.

Practical responses: rank and place critical evidence deliberately, prefer fewer high-signal chunks over stuffing the full window, summarize history instead of replaying every turn, and test whether position changes affect answer quality after the API accepts the prompt.

## Budgeting

Separate at least four budgets before packing:

1. **Fixed instructions** (system, safety, schemas)
2. **User input** (this turn)
3. **Retrieved or remembered context** (RAG, memory, tools)
4. **Expected output** (completion + structured fields)

Then decide *where* truncation hits (left, right, middle, or by priority rank). Silent clipping of system rules or the only good citation is a common production bug. Token budgets turn this checklist into enforceable product policy; the context window is the hard ceiling those budgets must sum under.

## Why it matters here

Context windows constrain RAG design, agent memory, prompt packing, latency (especially prefill/TTFT), cost, and serving capacity (KV cache, continuous batching). Curriculum topics on long-context management, prefix caching, chunking, and context engineering all assume this limit is real, shared with the answer, and imperfectly utilized. Engineers who treat $W$ as free storage overspend compute and still miss the middle.

## Related terms

- [Token](glossary://token)
- [Token budget](glossary://token-budget)
- [KV cache](glossary://kv-cache)
- [Prefill](glossary://prefill)
- [Context engineering](glossary://context-engineering)
