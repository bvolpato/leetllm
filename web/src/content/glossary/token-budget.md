---
title: Token budget
importance: 86
---
A **token budget** is an explicit cap on how many model tokens a request, step, or workflow may spend, then a deliberate allocation of that cap across the pieces of context that compete for space: system policy, user text, history, retrieved evidence, tool results, schemas, scratch state, and the reserved answer. The [context window](glossary://context-window) $W$ is the hard model ceiling (input plus output on most APIs). A token budget is product and runtime policy *inside* that ceiling: it decides what is allowed to consume capacity before the model ever runs.

Without a budget, packing becomes "append until full." Important evidence dies late and silently, answer space is stolen by long tool JSON, and cost or [prefill](glossary://prefill) latency rises even when answer quality does not.

## Intuition

The context window cannot grow mid-request. Every admitted section reduces room available to the others. Provider APIs treat tokens as the shared unit of capacity, billing, and limits, so the packer must reserve output space before it fills the input.

A budget answers four different questions that teams often blur:

| Question | Who owns it | Typical unit |
|---|---|---|
| What is the model hard limit? | Model card / API | $W$ tokens (in + out) |
| How much may *this product path* spend? | Product / routing | $B \le W$ |
| How is $B$ split among sections? | Prompt packer | $b_{\mathrm{sys}}, b_{\mathrm{hist}}, b_{\mathrm{evid}}, \ldots$ |
| How much may multi-step agents burn? | Workflow controller | tokens per turn, per session, or per job |

[Rate limits](glossary://rate-limit) and [quotas](glossary://quota) throttle *across* requests. A packing budget governs one request or agent step so that truncation and output caps stay intentional. A separate cumulative workflow budget can span many requests and exceed any single request's context window.

## Formula

For many chat and completion APIs, one request must satisfy:

$$
n_{\mathrm{in}} + n_{\mathrm{out}} \le W,
$$

where $n_{\mathrm{in}}$ counts everything the model attends over before generation (system, user, history, tools, templates, images as tokenized by that model) and $n_{\mathrm{out}}$ is generated tokens. Providers often also enforce a separate max-output cap $n_{\mathrm{out}} \le M$ even when space remains under $W$.

A product budget $B$ and section budgets $b_i$ with residual margin $m$ (chat template overhead, tool-schema tokens, safety headroom) obey:

$$
\sum_{i} b_i + m \le B \le W.
$$

Reserve output space before filling the input:

$$
n_{\mathrm{in}} \le B - b_{\mathrm{out}}, \qquad n_{\mathrm{out}} \le \min(b_{\mathrm{out}}, M, B - n_{\mathrm{in}}).
$$

In API terms, $b_{\mathrm{out}}$ is what you pass as `max_tokens`, `max_completion_tokens`, or `max_output_tokens`, depending on the API. For reasoning models, hidden reasoning tokens can consume part of that allowance, leaving fewer tokens for the visible answer. Setting it too high can make the request illegal if $n_{\mathrm{in}} + b_{\mathrm{out}} > W$; setting it too low truncates a valid answer even when $W$ still had room.

Count with the **same tokenizer** the model uses, such as a pinned `tiktoken` encoding or the provider's count endpoint. Character or word heuristics are planning aids only. Code, model IDs, JSON keys, and non-English text routinely cost more tokens per visible character.


## Example

Support answer on an 8,192-token model path. Product budget $B = 6{,}000$ (leaves headroom under $W$ for template tokens and rare spikes). Explicit allocation:

```python
budget = {
    "system": 700,      # policy + JSON schema (trusted, fixed)
    "user": 300,        # current user turn
    "history": 900,     # last turns or a summary
    "evidence": 2_400,  # RAG chunks after rerank
    "tools": 800,       # progress lookup, retrieval diagnostics
    "answer": 500,      # max_tokens / completion reserve
}
margin = 200
assert sum(budget.values()) + margin <= 6_000
```

Retrieval returns five chunks totaling 4,100 tokens. The packer admits chunks by rank until `evidence` hits 2,400, drops near-duplicates, and keeps source IDs. If tools return a 3,000-token raw JSON blob, the runtime truncates or projects fields under the 800-token tool line while preserving the answer reserve.

If the packer "forgets" `answer: 500`, a long evidence pack can leave $n_{\mathrm{in}} = 5{,}900$ with only 100 tokens available under the 6,000-token product policy, even though the 8,192-token model window has more room. If the runtime then caps output at 100 tokens, an unfinished answer can still arrive with HTTP 200. If it keeps a 500-token output cap instead, it violates the product budget. Both outcomes trace to packing policy: reserve output tokens before admitting evidence.

## How it works

1. **Pick $B$ for the route.** Interactive FAQ may use a small $B$ for cost and [TTFT](glossary://ttft). Deep research or coding agents may use a larger $B$, still $\le W$, on a slower lane.
2. **Name mandatory vs optional sections.** System policy and the user turn are mandatory. History, evidence, and tool dumps are useful but truncatable under a priority rank.
3. **Measure each section with the model tokenizer** after chat templates and tool schemas are applied. Include wrapper-added special tokens when calculating the true $n_{\mathrm{in}}$.
4. **Reserve $b_{\mathrm{out}}$ first.** Then fill remaining capacity top-down by priority (or fill high-signal ends of the prompt if position bias matters; see below).
5. **Enforce on overflow.** Drop lowest-rank chunks, compress history, clear old tool results, or refuse with a controlled error. Never silently clip system rules to keep junk evidence.
6. **Wire API caps.** Set completion max to $b_{\mathrm{out}}$, and reject or repack when $n_{\mathrm{in}} + b_{\mathrm{out}} > B$.
7. **For agents, budget the loop.** Each tool turn grows $n_{\mathrm{in}}$. Cap turns, clear or summarize old observations, and track cumulative tokens per job so a stuck loop cannot burn the session quota.

## Worked numbers

**Admission under an evidence cap.** Ranked chunk sizes (tokens): $1200,\,900,\,800,\,700,\,600$. Evidence budget $b_{\mathrm{evid}} = 2000$.

Taking a contiguous prefix by rank and stopping at the first overflow keeps only $1200$, since $1200 + 900 = 2100 > 2000$. A greedy policy that skips oversized next chunks can instead keep $1200 + 800 = 2000$. Alternatively, $900 + 800 = 1700$ may be more useful if those two chunks cover complementary facts and the 1200 is redundant. Same budget, different packing quality. The budget number alone does not pick the right subset; the admission policy does.

**Illegal request vs truncated answer.** Window $W = 8192$, packed $n_{\mathrm{in}} = 7800$, `max_tokens = 1000`:

$$
n_{\mathrm{in}} + \texttt{max\_tokens} = 8800 > 8192.
$$

Many APIs reject this before generation. With `max_tokens = 300`:

$$
7800 + 300 = 8100 \le 8192,
$$

so the call is legal but answers longer than ~300 tokens are cut. Fix by shrinking evidence/history, not by raising `max_tokens` past remaining room.

**Cost and latency pressure.** Suppose the input price is $p$ dollars per million tokens and the output price is $q$ dollars per million tokens. One packed request costs about:

$$
\mathrm{cost} \approx \frac{n_{\mathrm{in}}}{10^6}p + \frac{n_{\mathrm{out}}}{10^6}q.
$$

Doubling $n_{\mathrm{in}}$ doubles input spend at a fixed uncached token price and about *quadruples* pairwise attention score FLOPs for dense full-context prefill. Exact attention kernels such as FlashAttention reduce memory traffic without removing that quadratic pairwise computation; chunked prefill changes scheduling, while sparse attention changes which pairs are evaluated. Arithmetic intensity and total model FLOPs do not automatically quadruple. Wall-clock latency rarely scales exactly $4\times$; utilization and implementation dominate measured prefill time. [KV cache](glossary://kv-cache) memory for a retained dense sequence also grows with length, so large budgets reduce concurrent capacity on shared GPUs even when the answer is short.

## Capacity vs useful tokens

Filling the budget can still use tokens poorly. Liu et al. (2023), *Lost in the Middle*, showed multi-document QA often peaks when relevant evidence sits at the beginning or end of a long context and degrades when the same evidence is buried mid-window. Anthropic's context-engineering guidance treats each token as drawing on a finite attention budget: prefer the smallest high-signal set that still drives the desired behavior.

Improve quality through both budget policy and prose style:

- Rank and admit fewer strong chunks over stuffing $b_{\mathrm{evid}}$ with weak ones.
- Place critical instructions and the highest-value evidence where your evals show the model actually uses them.
- Summarize old history instead of replaying every tool trace.
- Evaluate position sensitivity and citation quality alongside whether the prompt fits.

## Sizing

| Knob | Too small | Too large |
|---|---|---|
| $B$ vs $W$ | Frequent overflow, thin answers | Waste under load; little quality gain past signal |
| $b_{\mathrm{out}}$ | Truncated JSON / mid-sentence stops | Blocks legal long prompts; rejects under $W$ |
| $b_{\mathrm{evid}}$ | Missing citations | Distractors, higher TTFT, lost-in-the-middle risk |
| $b_{\mathrm{hist}}$ | Forgets prior constraints | Stale turns crowd out new evidence |
| $m$ | Template/schema surprises blow the limit | Starves useful sections |

Start from measured p95 section sizes on real traffic, not from "use 80% of $W$." Leave margin for uncertainty in chat templates, tool definitions, and multimodal accounting. Reserve hidden reasoning within the output allowance when the API counts it there; do not assume that a separate usage field makes it free of context or generation limits.

## Debug path

When answers miss citations, drop rules, or stop early:

1. Log $n_{\mathrm{in}}$, $n_{\mathrm{out}}$, $B$, $W$, and per-section counts from the real tokenizer.
2. Check whether $n_{\mathrm{in}} + b_{\mathrm{out}} > W$ (reject) or $n_{\mathrm{out}} = b_{\mathrm{out}}$ with unfinished structure (output budget too tight).
3. Diff what the packer *intended* to include versus what survived truncation order.
4. Inspect whether system/policy tokens were clipped (priority bug) or only low-rank evidence (expected under pressure).
5. For agents, plot tokens per turn; linear growth usually means missing compaction of tool results.
6. Re-run the same case with a fixed admission policy after the fix so cost and quality move together.

## Why it matters here

Token budgets turn product requirements into enforceable packing policy: cost, latency, context quality, and completion length share one ledger. Curriculum topics on RAG, agents, long context, and serving all assume you can decide which tokens deserve the window *before* the model runs. Engineers who only grow $W$ still fail when packing is first-come, first-served; engineers who allocate $B$ and measure sections can trade evidence depth against answer space on purpose.

## Related terms

- [Context window](glossary://context-window)
- [Context engineering](glossary://context-engineering)
- [Prefill](glossary://prefill)
- [Chunking](glossary://chunking)
- [Latency budget](glossary://latency-budget)
