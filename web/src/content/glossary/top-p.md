---
title: Top-p
aliases: ["nucleus sampling"]
importance: 78
---
Top-p sampling (also called **nucleus sampling**) draws the next token from the *smallest* set of highest-probability tokens whose cumulative probability is at least $p$. That set is the *nucleus*. Tokens outside it get probability zero; mass inside is renormalized; then one token is sampled.

Holtzman et al. (2019) introduced nucleus sampling after showing that pure sampling often hits an unreliable long tail (incoherent text) while likelihood maximization (greedy or beam search) collapses into bland or repetitive loops. The candidate set follows *probability mass*: a peaked distribution yields few candidates, while a flat distribution yields many.

## Intuition

At each decode step the model produces a full next-token distribution over vocabulary size $V$ (often tens or hundreds of thousands of tokens). Most of the mass sits on a small head. The rest is a long, noisy tail. Top-p keeps only enough of the head to cover fraction $p$ of the probability, then samples *inside* that head.

Fixed [top-k](glossary://top-k) always keeps exactly $k$ tokens. On a peaked step, $k=50$ can still admit junk after renormalization. On a flat step (many legitimate next words), $k=10$ can discard good options. Nucleus size adapts with the shape of $P(\cdot \mid x_{1:i-1})$.

Temperature reshapes the distribution *before* the nucleus is built. Lower temperature shrinks the nucleus; higher temperature flattens scores so more tokens enter the cumulative set for the same $p$.

## Formula

Given next-token probabilities $P(x \mid x_{1:i-1})$ (usually from [softmax](glossary://softmax) on temperature-scaled [logits](glossary://logits)), sort tokens by descending probability with a tie rule. For $0 < p \le 1$, define $V^{(p)}$ as the **shortest prefix of that ordering** such that

$$
\sum_{x \in V^{(p)}} P(x \mid x_{1:i-1}) \ge p.
$$

Let $p' = \sum_{x \in V^{(p)}} P(x \mid x_{1:i-1})$. Renormalize and sample:

$$
P'(x \mid x_{1:i-1}) =
\begin{cases}
P(x \mid x_{1:i-1}) / p' & \text{if } x \in V^{(p)} \\
0 & \text{otherwise.}
\end{cases}
$$

Operationally: sort tokens by descending probability, walk down the list adding mass until the cumulative sum first exceeds or equals $p$, keep that prefix (including the token that crossed the threshold), zero the rest, renormalize, then sample.

Typical API ranges put $p$ near $0.9$–$0.95$ for open-ended generation. $p = 1$ keeps the full support (no nucleus filter). Values near $0$ collapse toward the mode (often a single top token after the first mass is kept).

## Example

Five tokens after softmax (toy vocab), with $p = 0.9$:

| Token | $P$ | Cumulative |
|---|---:|---:|
| `return` | $0.42$ | $0.42$ |
| `yield` | $0.28$ | $0.70$ |
| `pass` | $0.15$ | $0.85$ |
| `raise` | $0.10$ | $0.95$ |
| `print` | $0.05$ | $1.00$ |

Walk the sorted list: $0.42 + 0.28 + 0.15 = 0.85 < 0.9$, so include `raise` ($0.95 \ge 0.9$). Nucleus $V^{(0.9)} = \{\texttt{return}, \texttt{yield}, \texttt{pass}, \texttt{raise}\}$ with $p' = 0.95$. Drop `print`. Renormalized:

| Token | $P'$ |
|---|---:|
| `return` | $0.42 / 0.95 \approx 0.442$ |
| `yield` | $0.28 / 0.95 \approx 0.295$ |
| `pass` | $0.15 / 0.95 \approx 0.158$ |
| `raise` | $0.10 / 0.95 \approx 0.105$ |

If the same step were more peaked ($P(\texttt{return}) = 0.92$), the nucleus would be only `return` for $p = 0.9$. That adaptivity is the point of top-p versus top-k.

Minimal Python (same rule as Holtzman / common library implementations):

```python
import numpy as np

def nucleus_sample(probs: np.ndarray, p: float, rng=np.random.default_rng()) -> int:
    """probs: 1D non-negative vector that already sums to 1."""
    if not 0 < p <= 1:
        raise ValueError("p must be in (0, 1]")
    order = np.argsort(-probs, kind="stable")
    sorted_p = probs[order]
    cum = np.cumsum(sorted_p)
    # Keep the first index where cumulative mass reaches p (inclusive).
    cutoff = int(np.searchsorted(cum, p, side="left"))
    keep = order[: cutoff + 1]
    nucleus = probs[keep]
    nucleus = nucleus / nucleus.sum()
    return int(rng.choice(keep, p=nucleus))
```

In production stacks the same idea appears as `top_p` / `nucleus` on Chat Completions and as Hugging Face `GenerationConfig.top_p` (keep the smallest set whose probabilities add up to `top_p` or higher when `top_p < 1`).

## How it works in the sampler stack

A common [autoregressive decoding](glossary://autoregressive-decoding) order:

1. Model forward → raw logits.
2. Optional processors: masks, logit bias, repetition penalties.
3. Temperature: $z_i \leftarrow z_i / \tau$.
4. Softmax → probabilities.
5. Optional fixed top-k filter (engines often apply top-k then top-p).
6. Top-p nucleus cut + renormalize.
7. Multinomial sample (or argmax if the surviving set is effectively one token).

Order matters. Temperature changes which tokens enter the nucleus. Applying top-p to unscaled logits (or after a broken softmax) is a different algorithm than the paper definition. When both top-k and top-p are set, many libraries intersect the two filters: candidates must survive the rank cut *and* the mass cut.

OpenAI documents `top_p` as nucleus sampling over the tokens that make up the top probability mass (for example $0.1$ keeps about the top 10% of mass) and generally recommends changing one of temperature and `top_p` at a time unless an evaluation supports combining them. This avoids compounding randomness knobs without clear evidence.

## Trade-offs

| Setting | Effect |
|---|---|
| Lower $p$ (e.g. $0.5$–$0.8$) | Smaller nucleus, more conservative, less variety |
| Higher $p$ (e.g. $0.9$–$0.98$) | Larger nucleus, closer to full sampling, more diversity and more tail risk |
| $p = 1$ | No mass truncation; full-vocabulary sampling after other filters |
| Top-p and top-k | Top-p adapts to probability mass; top-k fixes candidate count; each has failure modes |
| High $\tau$ + high $p$ | Flattened mass can pull many weak tokens into the nucleus |

**What fails in production**

- **Style only.** Treat missing retrieval context or a wrong tool path as a grounding issue; top-p controls sampling style. Confident unsupported claims call for grounding fixes, while changing $p$ adjusts generation randomness.
- **High temperature expansion.** With $\tau > 1$, many individually weak tokens gain enough combined mass to enter a $p = 0.9$ nucleus. Outputs can look "creative" but include nonsense tokens or brittle JSON. Tighten $\tau$ first, then $p$, on a held-out slice.
- **Over-truncation.** Very low $p$ mimics greedy: safer for extraction and code-ish formats, but bland open-ended prose and higher risk of loops if the mode is repetitive.
- **Silent engine differences.** Moving a product to a new inference stack with the same `temperature` and `top_p` can still change outputs if top-k defaults, warper order, or `p = 0` edge cases differ. Diff sampler configs and decode one fixed seed on a golden prompt set when migrating.

## Why it matters here

Top-p is the standard production truncation policy for open-ended LLM generation: chat, drafting, and diverse candidate generation for [pass@k](glossary://pass-at-k)-style evals. Decoding applies a **policy over probabilities** to model outputs. The curriculum pairs it with temperature (shape), top-k (fixed rank), and beam search (search) so you can choose a policy that matches the task: tight nucleus for grounded answers, wider mass for brainstorming, and deterministic or constrained paths when validity is the priority.

## Related terms

- [Temperature](glossary://temperature)
- [Top-k](glossary://top-k)
- [Softmax](glossary://softmax)
- [Logits](glossary://logits)
- [Autoregressive decoding](glossary://autoregressive-decoding)
