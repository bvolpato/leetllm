---
{
  "id": "blog-how-to-prepare-for-ml-llm-interviews-2026",
  "title": "How to Prepare for ML & LLM Engineering Interviews in 2026",
  "slug": "how-to-prepare-for-ml-llm-interviews-2026",
  "author": { "name": "LeetLLM Team" },
  "publishedAt": "2026-02-16",
  "updatedAt": "2026-11-15",
  "verifiedAt": "2026-11-15",
  "refreshAfter": "2026-12-15",
  "excerpt": "Prepare for the interview you will actually take: confirm the loop format, diagnose LLM systems failures by layer, and practice attention, KV-cache math, LoRA sizing, and retrieval evaluations in code.",
  "tags": ["Career", "Interview Prep", "2026"],
  "featured": false,
  "coverImage": "social_banner.png"
}
---

An engineering assistant answers a question about an internal API endpoint using an outdated deprecation date from two releases ago. A staff interviewer asks what went wrong and what you would change first: did the index store an old snapshot, did retrieval miss the updated changelog chunk, did prompt truncation drop that chunk mid-window, or did the generator ignore retrieved evidence? Reciting glossary definitions will not isolate those layers. Effective interview preparation trains you to inspect raw inputs, derive memory and rank budgets explicitly, write small runnable verification checks, and defend what each measurement establishes or rules out. Work through representative exercises under timed constraints and let failing checks dictate what you study next, tuning depth to the target role: inference-kernel engineering, predictive modeling, and applied RAG systems test markedly different skills.

## Confirm the interview format before scheduling prep

Public engineering guides help you ask concrete questions ahead of time, even though they cannot predict your exact panel schedule. As documented in official hiring guides:

- OpenAI notes that engineering assessments vary by team and may include pair coding, architecture discussions, or take-home projects, emphasizing code quality, performance, and test coverage.[^openai2026interview]
- Anthropic notes that technical screens use live environments such as Colab and CodeSignal and recommends comfort with Python syntax and standard numerical libraries.[^frontier2026careers]
- Anthropic's candidate AI guidance permits using assistants for study while forbidding external AI tools during live rounds and take-homes unless explicitly authorized; OpenAI likewise notes that tool permissions vary by assessment.[^anthropic2026candidateai][^openai2026interview]

Never infer that autocomplete or web lookup is allowed simply because an employer builds AI models. Confirm permitted languages, packages, and tooling with your recruiter before committing hours to the wrong environment, and record five logistics answers before designing your weekly schedule. You can begin timed drills right away as long as you separate confirmed logistics from open assumptions:

| Ask about | Why it shapes preparation |
|---|---|
| Which rounds and skills are assessed? | Coding, modeling, systems design, and research deep dives require distinct drills. |
| Which language, editor, and libraries are allowed? | Practicing in pure NumPy feels very different from relying on framework helpers. |
| What are the time limits and deliverables? | A 45-minute working prototype and an open-ended whiteboard design need different pacing. |
| Is there a project walkthrough or take-home? | Clarify slide expectations, confidentiality rules, and permitted tooling. |
| How can accommodations or clarifications be requested? | Resolve environment and logistics early rather than during the session. |

## Match practice drills to the target role

Select realistic drills directly from the role description rather than collecting unrelated trivia. Roles overlap heavily in day-to-day production work: an applied product engineer benefits from understanding KV-cache pressure, while a research engineer routinely debugs distributed data pipelines, as [What Does an AI Engineer Actually Do?](/blog/what-does-an-ai-engineer-do) details. Run one timed diagnostic attempt before filling weeks with passive reading so you can tell conceptual gaps, like forgetting why causal masks place negative infinity before softmax, apart from indexing mistakes under batched tensors:

| Target role | Representative exercise | Strong defense in review |
|---|---|---|
| Applied AI / RAG | Trace an unsupported answer through search scores, prompt text, and model output | Which layer failed first, how you isolated it, and the smallest regression test |
| Predictive ML | Design a group- and time-aware split for conversion or risk scoring | Which features exist at decision time and which deployment population the metric measures |
| ML Systems / Serving | Profile prefill vs decode latency and KV-cache footprint on a fixed model config | Where HBM bandwidth or FLOPs saturate and how throughput trades off against tail latency |
| Research Engineering | Implement causal Grouped-Query Attention or LoRA rank scaling from scratch in NumPy | Tensor shapes, numerical softmax stability, memory complexity, and shape assertions |
| Research Science | Formulate an ablation isolating context length from retrieval rank quality | Null hypothesis, held-out controls, variance across seeds, and what result would falsify your claim |

## Practice diagnosing an LLM system by layer

Consider a classic applied-LLM failure scenario used in systems interviews. An engineering documentation assistant is asked whether `v3` of the batch embeddings endpoint still accepts synchronous CSV uploads, while the index stores release notes for both `v2` and `v3`. The assistant responds confidently that synchronous CSV uploads work on `v3` up to 10 MB, a limit that actually belonged to `v2` before `v3` removed synchronous CSV uploads completely. Recommending immediate fine-tuning signals that you skipped isolation; instead, interrogate each layer with a targeted falsifiable check:

| Layer | Question to inspect | Mistake to avoid |
|---|---|---|
| Index & ingestion | Were both `v2` and `v3` documents tagged with version metadata and current timestamps? | Assuming ingestion kept version labels intact when chunking Markdown sections. |
| Retrieval ranking | Did top-k chunks include the `v3` deprecation notice, or only `v2` docs with higher term overlap? | Tuning prompt wording when retrieval never surfaced the `v3` chunk. |
| Context assembly | Was the `v3` chunk kept intact in the prompt, or truncated or buried mid-window? | Assuming "returned by vector search" guarantees the text reached the model input.[^liu2023lost] |
| Generation & grounding | Given both snippets with explicit version headers, did the model still merge `v2` limits onto `v3`? | Blaming embeddings for a model-level citation or instruction-following mistake. |

For versioned documentation, metadata filtering combined with version-aware re-ranking consistently outperforms raw dense similarity alone. Once you inspect the submitted prompt, run a controlled replay that pins the retrieved chunks, injects explicit `version=v3` headers, and holds decoding parameters constant to verify whether the answer corrects itself. A single passing replay only confirms that specific failure path, so follow up with a multi-version evaluation suite before shipping the fix.

## Coding drill: Causal Grouped-Query Attention and KV-cache sizing

Live ML coding rounds increasingly replace generic graph puzzles with Transformer tensor primitives, numerical stability, and inference memory arithmetic. Implementing scaled dot-product Grouped-Query Attention (GQA)[^vaswani2017][^ainslie2023] alongside exact KV-cache memory sizing[^kwon2023] tests tensor broadcasting, causal masking, softmax stability, and deployment economics in one concise exercise. Check three implementation invariants carefully before running the forward pass and a 32-layer Llama-style memory comparison in NumPy:

1. **Tensor broadcast for GQA:** When $n_q = 8$ query heads share $n_{kv} = 2$ key-value heads, each KV head serves a group of $g = n_q / n_{kv} = 4$ query heads. Repeating K and V along the head axis (`np.repeat(k, group_size, axis=1)`) aligns shapes without duplicating weights on disk.
2. **Numerical stability in softmax:** Computing $\exp(S)$ directly overflows float16 on moderate logits. Subtracting row-wise $\max(S)$ after applying a strict upper-triangular $-\infty$ causal mask prevents overflow while giving exact zero attention weights to future tokens ($j > i$).
3. **Exact KV-cache accounting:** Autoregressive decoding caches one K tensor and one V tensor per layer and per KV head (`2` tensors total). Memory scales linearly with `n_kv_heads` and `seq_len`:

$$
\text{KV bytes} = 2 \times L \times n_{kv} \times d_{\text{head}} \times T \times b_{\text{elem}}
$$

<!-- leetllm: test deps=numpy output=show output_title="GQA forward pass and KV-cache sizing" -->
```python title="gqa_attention_kv_check.py"
import numpy as np


def gqa_causal_attention(q: np.ndarray, k: np.ndarray, v: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Compute numerically stable causal Grouped-Query Attention.

    Shapes:
      q: [batch, n_q_heads, seq_len, d_head]
      k, v: [batch, n_kv_heads, seq_len, d_head]
    """
    _, n_q_heads, seq_len, d_head = q.shape
    _, n_kv_heads, _, _ = k.shape
    assert n_q_heads % n_kv_heads == 0, "n_q_heads must be divisible by n_kv_heads"

    group_size = n_q_heads // n_kv_heads
    k_expanded = np.repeat(k, group_size, axis=1)
    v_expanded = np.repeat(v, group_size, axis=1)

    scores = np.matmul(q, np.swapaxes(k_expanded, -2, -1)) / np.sqrt(d_head)
    causal_mask = np.triu(np.ones((seq_len, seq_len), dtype=bool), k=1)
    masked_scores = np.where(causal_mask, -np.inf, scores)

    shifted = masked_scores - np.max(masked_scores, axis=-1, keepdims=True)
    weights = np.exp(shifted)
    weights = weights / np.sum(weights, axis=-1, keepdims=True)
    output = np.matmul(weights, v_expanded)
    return output, weights


rng = np.random.default_rng(7)
q = rng.normal(size=(1, 8, 5, 64))
k = rng.normal(size=(1, 2, 5, 64))
v = rng.normal(size=(1, 2, 5, 64))

out, attn = gqa_causal_attention(q, k, v)
assert out.shape == q.shape
assert np.allclose(attn.sum(axis=-1), 1.0)
upper_leak = np.abs(np.triu(attn[0, 0], k=1)).max()
assert upper_leak == 0.0

# 32-layer decoder, d_head=128, 32,768 tokens, FP16 (2 bytes/element)
layers, d_head, seq_len, dtype_bytes = 32, 128, 32768, 2
gib = 1024**3
for label, kv_heads in [("MHA (32 KV)", 32), ("GQA (8 KV)", 8), ("GQA (2 KV)", 2), ("MQA (1 KV)", 1)]:
    kv_gib = (2 * layers * kv_heads * d_head * seq_len * dtype_bytes) / gib
    print(f"{label:12s}: {kv_gib:5.2f} GiB per 32K sequence")
print(f"Causal leak max: {upper_leak:.1f}, output shape: {out.shape}")
```

<!-- leetllm: output:start -->
```text title="GQA forward pass and KV-cache sizing" output compact
MHA (32 KV) : 16.00 GiB per 32K sequence
GQA (8 KV)  :  4.00 GiB per 32K sequence
GQA (2 KV)  :  1.00 GiB per 32K sequence
MQA (1 KV)  :  0.50 GiB per 32K sequence
Causal leak max: 0.0, output shape: (1, 8, 5, 64)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/gqa_kv_memory_check_dark.png" alt="Bar chart compares single-sequence FP16 KV-cache memory at 32,768 tokens for a 32-layer decoder with head dimension 128: Multi-Head Attention with 32 KV heads uses 16.00 GiB, Grouped-Query Attention with 8 KV heads uses 4.00 GiB, GQA with 2 KV heads uses 1.00 GiB, and Multi-Query Attention with 1 KV head uses 0.50 GiB." />
  <figcaption>Each halving of KV heads cuts single-sequence KV memory by half: switching from 32-head MHA to 8-head GQA drops a 32K FP16 sequence from 16.00 GiB to 4.00 GiB, directly unlocking higher batch sizes before optimizer or paging tricks.</figcaption>
</figure>

Notice why interviewers probe beyond the closed-form formula. First, FP16 and BF16 attention kernels still require strict max-subtraction inside softmax; second, GQA trades K and V sharing (fewer KV heads) for memory bandwidth relief during autoregressive decode without shrinking `d_model` or `n_q_heads`.[^ainslie2023][^kwon2023] Follow-up questions connect these tensors to adaptation and evaluation: add a sliding-window mask ($j < i - W$), inject Rotary Positional Embeddings (RoPE) before the dot product[^su2021], or verify LoRA parameter ratios and retrieval MRR@k in a companion script:

<!-- leetllm: test output=show output_title="LoRA rank scaling and retrieval MRR" -->
```python title="lora_and_retrieval_eval.py"
def lora_param_ratio(d_in: int, d_out: int, rank: int) -> tuple[int, int, float]:
    base_params = d_in * d_out
    adapter_params = rank * (d_in + d_out)
    return adapter_params, base_params, adapter_params / base_params


def eval_retrieval(ranked_lists: list[list[str]], relevant: list[set[str]], k: int = 3) -> tuple[float, float]:
    recalls, mrrs = [], []
    for preds, gold in zip(ranked_lists, relevant):
        top_k = preds[:k]
        recalls.append(len(set(top_k) & gold) / len(gold))
        rr = 0.0
        for idx, doc_id in enumerate(top_k, start=1):
            if doc_id in gold:
                rr = 1.0 / idx
                break
        mrrs.append(rr)
    return sum(recalls) / len(recalls), sum(mrrs) / len(mrrs)


adapter, base, ratio = lora_param_ratio(4096, 4096, rank=16)
print(f"LoRA rank-16 params: {adapter:,} / {base:,} ({ratio:.2%})")

queries_relevant = [{"v3_changelog"}, {"auth_migration", "jwt_rotation"}, {"kv_paging"}]
sparse_top = [["v2_docs", "v3_changelog", "faq"], ["faq", "auth_migration", "logs"], ["roofline", "gpu", "kv_paging"]]
hybrid_top = [["v3_changelog", "v2_docs", "faq"], ["auth_migration", "jwt_rotation", "logs"], ["kv_paging", "roofline", "gpu"]]

s_rec, s_mrr = eval_retrieval(sparse_top, queries_relevant, k=3)
h_rec, h_mrr = eval_retrieval(hybrid_top, queries_relevant, k=3)
print(f"Sparse @3 -> Recall: {s_rec:.3f}, MRR: {s_mrr:.3f}")
print(f"Hybrid @3 -> Recall: {h_rec:.3f}, MRR: {h_mrr:.3f}")
```

<!-- leetllm: output:start -->
```text title="LoRA rank scaling and retrieval MRR" output compact
LoRA rank-16 params: 131,072 / 16,777,216 (0.78%)
Sparse @3 -> Recall: 0.833, MRR: 0.444
Hybrid @3 -> Recall: 1.000, MRR: 1.000
```
<!-- leetllm: output:end -->

With just 0.78% trainable parameters per $4096 \times 4096$ projection ($131{,}072$ vs $16{,}777{,}216$), LoRA keeps adaptation cheap in optimizer memory[^hu2021], while evaluating Recall@3 alongside MRR@3 shows why sparse retrieval that barely lands the right document at rank 2 or 3 (`MRR 0.444`) improves dramatically after reranking (`MRR 1.000`). For deeper stateful systems practice, work through [AI Lab Coding Interview: Python Systems](/learn/ai-lab-coding-interview-python-systems).

## For classical ML, make the prediction time explicit

Suppose a predictive modeling interview asks you to predict, at the moment an incident opens, whether it will escalate within 24 hours. Historical rows include an opening timestamp, customer ID, initial severity, final resolution code, and escalation outcome. Before choosing a model family, determine which columns exist at opening time: initial severity is known, whereas final resolution code happens afterward. Including resolution code creates <span data-glossary="feature-leakage">leakage</span> because information recorded after prediction time leaks into training or validation, and feature selection or scaling must likewise be fit strictly on training folds without touching held-out data.[^sklearn2026leakage]

Next, match your split strategy to the deployment population you plan to serve:

- **Future incidents from existing customers:** use a time-based evaluation that respects feature and label availability. For a 24-hour label, do not train on examples whose outcome would still be unknown at the simulated training cutoff.
- **Previously unseen customers:** hold customers out as groups so the same customer's incidents do not appear on both sides merely through a random row split.
- **Future incidents from new customers:** the evaluation may need both time and group restrictions. One splitter's name does not solve both constraints automatically.

Scikit-learn documents why dependent groups and time-ordered observations require distinct cross-validation schemes.[^sklearn2026CrossValidation] The key interview signal is explaining which real-world generalization error your validation measures, then choosing baselines and metrics tied to action costs. If reviewers inspect only a fixed daily queue, compare recall at that queue capacity and check probability calibration before trusting thresholds. When asked why offline AUC dropped after removing resolution code, explain that the earlier score measured future-label leakage rather than predictive signal; [Validation and Leakage](/learn/cross-validation-leakage-generalization) explores these traps in detail.

## For systems work, put numbers beside the diagram

Practice system design in enough quantitative detail that an interviewer can stress-test every bottleneck. For a technical QA assistant, clarify document permissions, freshness latency bounds, acceptable time-to-first-token, and fallback behavior when retrieval finds no relevant chunks. Trace one uncontested request numerically before introducing caches or multi-agent routing: if retrieval takes 120 ms, prompt assembly takes 80 ms, and decoding takes 900 ms sequentially (1,100 ms total), trimming 40 ms of string assembly only saves 3.6% end-to-end while decode latency stays fixed.

Expect the interviewer to perturb constraints immediately: "Now ten concurrent users arrive," or "Updates must appear within one second of commit." Show which numbers shift when concurrency queues prefill kernels or invalidates prefix caches. For inference serving or training roles, anchor claims to precision, batch size, sequence length, memory bandwidth, and profiler traces rather than architectural buzzwords. [AI Lab System Design Interview](/learn/ai-lab-system-design-interview) and [Inference: TTFT, TPS & KV Cache](/learn/inference-mechanics-ttft-tps-kv-cache) connect those calculations directly to serving mechanics.

## Rehearse follow-ups and personal ownership

A polished opening answer rarely settles a strong loop on its own, so practice with peers who interrupt, alter latency budgets, or challenge why a metric moved. You can use AI tools during rehearsal to drill alternative scenarios, provided you verify every technical claim against primary documentation or working code. When presenting past projects, walk concisely through the original bottleneck, your personal implementation scope, rejected alternatives, and verified before/after measurements without inflating unmeasured numbers.

For the attention, KV-cache, and RAG drills above, expect follow-up questions such as:

- How would prefix caching or PagedAttention alter your single-sequence KV-cache estimate when 50 users share a system prompt?
- Why did `MRR@3` improve from `0.444` to `1.000` even though `Recall@3` only changed from `0.833` to `1.000`?
- What numerical issue occurs if softmax runs before adding `-inf` entries to the causal mask?
- How does `r = 16` LoRA change activation memory versus optimizer-state memory during training?
- Which parts of the evaluation harness or model trace did you build yourself?

For research-oriented rounds, frame project defenses around explicit hypotheses, fair baselines, cross-seed variance, and negative results that changed architecture decisions. [AI Lab Behavioral Interview](/learn/ai-lab-system-design-interview) and [AI Lab Technical Presentation](/learn/ai-lab-system-design-interview) outline full-round presentation practice.

## Build a study schedule from failed checks

After every timed drill, log three items: what failed, which trace or metric exposed it, and the exact next exercise. Vague goals like "study transformers" stall progress, whereas concrete failures ("wrong axis for `np.repeat` in GQA and missing max-subtraction in masked softmax" or "retrieval ranked the right chunk, yet prompt assembly truncated it") give you an unambiguous next repair. Spend the following session closing that gap, then verify transfer on a modified variant such as adding sliding-window attention, enforcing group-plus-time splits, or halving available VRAM.

Tailor your cadence to remaining lead time: drill target round formats first when interviews sit within two weeks, and shore up tensor or probability derivations first when foundations feel shaky. Pair timed mock attempts with [50 LLM Interview Questions for 2026](/blog/top-50-llm-interview-questions-2026), writing derivations and verification scripts from scratch before checking answers so your preparation rests on tested execution under changed constraints.
