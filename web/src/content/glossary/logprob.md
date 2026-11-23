---
title: Logprob
aliases: ["log probability", "log-probability"]
importance: 75
---
A **logprob** is the natural logarithm of a probability assigned to a token, class, or sequence step: $\mathrm{logprob}=\log p$ with base $e$ (not $\log_{10}$). Because $p \in (0,1]$, logprobs live in $(-\infty, 0]$. A value of $0$ means probability $1$; more negative values mean less mass. Units are **nats** (natural units of information).

Engineers work in log space so joint likelihoods stay numerically usable: products of tiny probabilities become sums of logprobs. Training losses, beam scores, perplexity, and many confidence gates all consume $\log p$ rather than $p$ itself.

Logprob measures model preference under the current context and the distribution the engine reports. That may be the raw model distribution or a distribution after decoding controls; it may differ from the distribution used to sample. Truth, grounding, and usefulness require separate evidence: a fluent but wrong answer can still carry high logprob if the model strongly prefers that phrasing.

## Intuition

Next-token prediction is a categorical distribution over a huge vocabulary. Many tokens get probabilities like $10^{-6}$ or smaller. Multiplying dozens of those factors underflows float32 toward zero; summing their logs does not. The same numbers also make ranking easy: larger logprob is always more likely, and gaps are readable on a log scale (a difference of $\ln 2 \approx 0.693$ is a $2\times$ probability ratio; $\ln 10 \approx 2.303$ is a $10\times$ ratio).

When an API returns `top_logprobs`, you are seeing a truncated view of its reported categorical distribution at one position: the chosen token and a few alternatives. Check whether its scores are raw or processed rather than inferring this from the request's temperature and filters.

## Formula

For a single event with probability $p$:

$$
\mathrm{logprob}(p) = \log p, \qquad p = e^{\mathrm{logprob}}
$$

From logits $z$ over the vocabulary, the stable path is log-softmax (not `log(softmax(z))`, which can underflow):

$$
\log p_i = z_i - \log\sum_j e^{z_j} = z_i - \mathrm{LSE}(z)
$$

where $\mathrm{LSE}$ is [log-sum-exp](glossary://log-sum-exp). For a temperature-processed distribution with $\tau > 0$, replace $z$ by $z/\tau$ before this step. As $\tau \to 0$, mass concentrates on the maximum: a unique winner's logprob approaches $0$, while $k$ exact tied maxima each approach $-\log k$. Large $\tau$ pulls finite unmasked logits toward a uniform distribution over the allowed support, not over masked tokens.

For an autoregressive sequence $t_1,\ldots,t_n$:

$$
\log P(t_{1:n}) = \sum_{i=1}^{n} \log P(t_i \mid t_{<i})
$$

so the sequence logprob is the sum of per-token logprobs. The mean per-token logprob is $\frac{1}{n}\sum_i \log P(t_i \mid t_{<i})$. The negative of that mean is [cross-entropy](glossary://cross-entropy) under teacher forcing; [perplexity](glossary://perplexity) is $\exp(-\text{mean logprob})$.

Training next-token prediction minimizes average negative log probability of the true token, $-\log p_y$. That is the same quantity an eval would call the gold token's logprob, up to sign and averaging.

## Worked numbers

Natural log throughout. Three candidates for one critical token:

| token | $p$ | logprob $\log p$ |
|-------|----:|-----------------:|
| `yes` | $0.90$ | $\approx -0.105$ |
| `no` | $0.09$ | $\approx -2.408$ |
| `maybe` | $0.01$ | $\approx -4.605$ |

$\exp(-0.105) \approx 0.90$. The gap between `yes` and `no` is about $2.3$ nats, a factor of roughly $10$ in probability. If an API returns the chosen token's logprob as $-0.1$ on one path and $-4.2$ on another, the second path was far less preferred even when both strings read fluently.

For a short completion with token logprobs $[-0.1, -0.2, -0.05]$:

- sequence logprob $= -0.35$
- mean logprob $\approx -0.117$
- joint probability $\approx e^{-0.35} \approx 0.70$
- perplexity $\approx e^{0.117} \approx 1.12$

```python
import math

token_logprobs = [-0.1, -0.2, -0.05]
seq_lp = sum(token_logprobs)
mean_lp = seq_lp / len(token_logprobs)
print(seq_lp, math.exp(seq_lp), math.exp(-mean_lp))
# -0.35, ~0.705, ~1.124
```

From raw logits, avoid materializing softmax then taking `log`:

```python
import math

z = [3.0, 2.8, 0.5]  # cache, cash, case
m = max(z)
lse = m + math.log(sum(math.exp(v - m) for v in z))
logprobs = [v - lse for v in z]
# ≈ [-0.642, -0.842, -3.142]
```

## Example

**Forced-choice classification with an API.** Choose labels verified to be distinct single tokens under the model tokenizer and expected whitespace convention, request `logprobs=true` and `top_logprobs`, then gate on that label position. Strings such as `Technology`, `Politics`, `Sports`, and `Art` may tokenize differently across models; verify each label with the target tokenizer. If labels span tokens, score the complete label rather than its first fragment.

OpenAI-style Chat Completions return natural-log values: $0.0$ means certainty under the returned distribution; more negative means less mass. Typical fields per step: `token`, `logprob`, optional `top_logprobs[]`, and sometimes `bytes` for exact UTF-8 reconstruction.

Concrete pattern:

1. Constrain the answer format to one known label string (or a boolean `True`/`False`).
2. Read the chosen token's logprob and the nearest alternatives.
3. Accept when $\log p$ clears a tuned threshold *and* the second-best is far enough below (a soft peak check).
4. Route near-ties and low mass to review or [abstention](glossary://abstention).

Illustrative numbers for a headline classifier on the first output token:

| headline theme | chosen | logprob | $p=e^{\mathrm{lp}}$ | second-best gap |
|----------------|--------|--------:|--------------------:|----------------:|
| clear tech product | `Technology` | $0.0$ | $1.00$ | huge |
| clear local government | `Politics` | $\approx 0$ | $\approx 1.00$ | huge |
| mixed sports + art | `Art` | $-0.028$ | $\approx 0.97$ | Sports at $\approx -4.3$ |

The third case still ranks `Art` first, but the mass is softer; a product that only auto-tags above $0.99$ linear probability would send it to review.

**Self-hosted stacks.** Hugging Face generation can return processed step `scores`; `compute_transition_scores(..., normalize_logits=True)` normalizes those scores and selects the generated-token values (supply `beam_indices` for beam outputs). These are not necessarily raw forward-pass likelihoods. Native vLLM `SamplingParams.logprobs` is an integer count; its Chat Completions HTTP contract uses a boolean `logprobs` and integer `top_logprobs`. The chosen token is included even if outside the requested top set, so native output may contain $k+1$ entries. Current vLLM exposes a `logprobs_mode` setting: raw logprobs are the default, and processed modes are available. Pin and record the reporting mode.

**Scoring a fixed string.** Generation logprobs score the path the sampler took. To score a known completion (gold label, candidate rewrite, draft for speculative verify), run a teacher-forced forward pass over that string and sum $\log p$ of each gold token. Hosted APIs often only expose generation-side top-$k$; full-vocabulary scoring of an arbitrary token may need a local model or a dedicated scoring endpoint.

## Reading and comparing values

- Higher logprob means higher probability. Compare candidates on the same prompt, model, tokenizer, and decoding settings.
- Raw sequence sums grow more negative with length because each extra factor is typically less than $1$. Prefer mean per-token logprob (or a documented [length penalty](glossary://length-penalty), as in beam search) when lengths differ.
- `top_logprobs` show near-ties and brittle choices: if the winner is $-0.4$ and the second is $-0.5$, the decision is soft; if the winner is $0.0$ and the second is $-8$, the model was peaked.
- Convert only when you need linear probability: $p = e^{\mathrm{logprob}}$. Keep products and ranking in log space.
- Temperature and nucleus/top-$k$ filters change sampling, but affect reported logprobs only when the engine reports processed scores. Compare values under matched reporting modes; raw logprobs at different temperatures may still describe the same model distribution at the same context.
- Constrained decoding and [logit bias](glossary://logit-bias) reshape mass: a forced schema token can show logprob near $0$ even when the *semantic* answer is uncertain.

## What fails in production

**Truth and calibration.** High logprob means the model assigns high likelihood under its training and context. Distribution shift, missing retrieval, jailbreaks, and overfitted phrasing can still produce confident wrong answers. Pair logprob gates with task metrics and [calibration](glossary://calibration) on a labeled holdout before treating thresholds as reliability SLOs.

**Wrong distribution.** Processed scores after temperature, top-$p$, logit bias, or grammar constraints are not the unconstrained model distribution. Raw reporting can still return unconstrained scores while generation uses those controls. Some vLLM reporting modes return logits in the same output fields; those are not log probabilities and must not be exponentiated as if normalized. Document which mode produced the number; compare matched distributions.

**Length and span choice.** Summing logprobs over a full essay punishes length; scoring only the label token ignores hedging elsewhere. For free-form answers, min or mean logprob over the *answer span* is often more informative than the first token alone. For classification, force a short label so the score attaches to the decision.

**Truncated alternatives.** Serving stacks return top-$k$ alternatives from the vocabulary. Exact mass for an arbitrary token requires a scoring pass when the gold label is absent from `top_logprobs`.

**Missing or null fields.** Some providers may omit logprobs even when requested (schema allows null). Absence means the client has no confidence signal.

**Units and base mix-ups.** Using $\log_{10}$ thresholds against natural-log APIs (or the reverse) silently breaks gates by a factor of $\ln 10$. Stay in nats unless a library documents otherwise.

## Why it matters here

Logprobs sit between [logits](glossary://logits) / [softmax](glossary://softmax) and everything that consumes confidence or likelihood: decoding search, perplexity, cross-entropy training, preference and policy gradients, and production gates that abstain or escalate. Reading them correctly (scale, length, constraints, non-calibration) is a core LLM engineering skill.

## Related terms

- [Logits](glossary://logits)
- [Softmax](glossary://softmax)
- [Log-sum-exp](glossary://log-sum-exp)
- [Perplexity](glossary://perplexity)
- [Calibration](glossary://calibration)
