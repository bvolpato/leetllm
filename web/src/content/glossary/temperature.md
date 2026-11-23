---
title: Temperature
importance: 86
---
**Temperature** ($\tau$ or $T$) is a positive scalar applied to [logits](glossary://logits) *before* [softmax](glossary://softmax). It reshapes the probability distribution used for sampling or for a temperature-scaled loss, without changing the argmax ranking of the logits. Lower $\tau$ sharpens the distribution (top scores dominate). Higher $\tau$ flattens it (more mass on weaker candidates). $\tau = 1$ leaves the model logits unscaled.

In LLM decoding, temperature is an inference knob on next-token sampling. The same math appears in knowledge distillation (soft targets at high $T$), contrastive losses such as [InfoNCE](glossary://infonce) / NT-Xent, and post-hoc [probability calibration](glossary://probability-calibration) (Guo et al. temperature scaling). In every case it changes *how sharply scores compete*; it does not invent knowledge, fix retrieval, or make raw softmax outputs calibrated by magic.

## Intuition

Softmax turns relative logits into probability mass that sums to 1. Dividing by $\tau < 1$ amplifies score gaps, so the leading token receives more mass. Dividing by $\tau > 1$ compresses gaps, so lower-ranked tokens retain more mass.

As $\tau \to 0^+$, the distribution approaches a one-hot if the maximum logit is unique; tied maxima share the limiting mass. As $\tau \to \infty$, probabilities approach uniform over the unmasked vocabulary. API "temperature 0" is usually implemented as greedy / near-greedy decoding, not a literal division by zero.

Temperature does **not** reorder tokens by score. If token A has a higher logit than token B, it still has higher probability after any $\tau > 0$. Truncation methods ([top-k](glossary://top-k), [top-p](glossary://top-p)) can still remove tokens after the reshape. Order of operations is almost always: masks and biases → temperature → optional nucleus/top-k → sample.

## Formula

For next-token logits $z \in \mathbb{R}^{V}$ and temperature $\tau > 0$:

$$
p_i(\tau) = \frac{\exp(z_i / \tau)}{\sum_{j=1}^{V} \exp(z_j / \tau)}
$$

Equivalently, $p(\tau) = \mathrm{softmax}(z / \tau)$. Stable code subtracts $\max_j (z_j / \tau)$ before the exponential (log-sum-exp).

Limits that match the usual decoding story:

- $\tau = 1$: sample from the model’s native softmax
- $\tau \to 0^+$: $p$ concentrates on $\arg\max_i z_i$
- $\tau \to \infty$: $p_i \to 1/V$ over unmasked tokens

**Argmax is invariant** for any $\tau > 0$:

$$
\arg\max_i p_i(\tau) = \arg\max_i z_i
$$

So temperature alone cannot flip which token would win a pure greedy decode. It only changes how often sampling picks non-greedy tokens.

**Contrastive / InfoNCE form.** With cosine (or other) similarity $\mathrm{sim}$ and temperature $\tau$:

$$
\mathcal{L}_i = -\log \frac{\exp\big(\mathrm{sim}(z_i, z_{+}) / \tau\big)}{\sum_{k} \exp\big(\mathrm{sim}(z_i, z_k) / \tau\big)}
$$

Small $\tau$ makes hard negatives dominate the gradient (Wang & Liu, CVPR 2021 analysis of contrastive temperature). SimCLR’s NT-Xent is this structure over augmented views in a batch.

**Distillation (Hinton et al., 2015).** Soft targets use a raised teacher temperature $T$:

$$
q_i = \frac{\exp(z_i^{\mathrm{teacher}} / T)}{\sum_j \exp(z_j^{\mathrm{teacher}} / T)}
$$

The student matches those soft labels (often with an extra $T^2$ factor on the KL term so gradient scale stays sane when $T$ is large). At inference the student uses $T = 1$.

**Calibration temperature scaling (Guo et al., 2017).** A single scalar $T$ is fit on a hold-out set by minimizing NLL of $\mathrm{softmax}(z / T)$. Class prediction (argmax) is unchanged; only confidences move. That is a *learned* temperature for reliability, not a creativity knob.

## Worked numbers

Take three candidate logits $z = [2.0,\ 1.0,\ 0.1]$:

| $\tau$ | $p$ (approx.) | Effect |
| --- | --- | --- |
| $1.0$ | $[0.659,\ 0.242,\ 0.099]$ | Model scale |
| $0.5$ | $[0.864,\ 0.117,\ 0.019]$ | Sharper; favorite usually wins |
| $0.2$ | $[0.993,\ 0.007,\ 0.000]$ | Near-greedy |
| $2.0$ | $[0.502,\ 0.304,\ 0.194]$ | Flatter; more surprises |

Same math on two contrastive similarities $0.90$ and $0.20$:

| $\tau$ | Scaled logits | Softmax mass on first |
| --- | --- | --- |
| $0.05$ | $18.0,\ 4.0$ | $\approx 1.0$ |
| $0.5$ | $1.8,\ 0.4$ | $\approx 0.80$ |
| $1.0$ | $0.9,\ 0.2$ | $\approx 0.67$ |

A low contrastive $\tau$ makes the largest similarity dominate the distribution, whether that candidate is positive or a hard negative. A higher $\tau$ softens that competition.

```python
import math

def softmax_temp(logits, tau):
    scaled = [z / tau for z in logits]
    m = max(scaled)
    exps = [math.exp(z - m) for z in scaled]
    s = sum(exps)
    return [e / s for e in exps]

print([round(p, 4) for p in softmax_temp([2.0, 1.0, 0.1], 0.5)])
# [0.8638, 0.1169, 0.0193]
```

## Example

You ship an eval classifier that must return a fixed JSON schema (`case_id`, `severity`, `needs_review`). Two decode settings on the same prompt and model:

| Setting | Behavior in practice |
| --- | --- |
| $\tau = 0$ (or very low) + schema constraint | Constraint enforces the supported schema; low temperature reduces sampling variation, but field values can still be wrong |
| $\tau = 0.9$ + no truncation or schema constraint | More sampling variation; JSON validity and field accuracy must be measured |

These settings change both temperature and constraints, so they do not isolate temperature's effect. At a concrete token step after the key `"severity": "`, logits might rank `high` above `medium`. Lower temperature increases the higher-ranked token's relative probability; the actual selection rate depends on the logit gap and all other candidates. A higher temperature can increase tail-token selection when those tokens are permitted, but a grammar constraint can exclude invalid JSON tokens at either temperature.

Pair temperature with structure, not alone: constrained decoding / tool JSON mode, [top-p](glossary://top-p) to cut the unreliable tail (Holtzman et al., nucleus sampling), and retries on parse failure. Raising temperature will not recover a missing policy document from RAG.

## How it works

1. **Forward pass** produces next-token logits $z$ (plus any [logit bias](glossary://logit-bias), banned tokens, or grammar masks).
2. **Divide by $\tau$** (skip if greedy path treats $\tau = 0$ as argmax).
3. **Softmax** → probabilities. For APIs returning [logprobs](glossary://logprob), check whether they expose original-model or processed sampling probabilities; this is provider-specific.
4. **Optional filters:** top-k and/or top-p renorm over a restricted set. Temperature still ran first, so the nucleus size depends on the *reshaped* mass.
5. **Sample** one token (or take argmax). Autoregressive decode repeats from step 1.

Hugging Face `generate` only applies temperature when sampling is on (`do_sample=True`); with greedy decode the value is ignored. Hosted APIs often document ranges such as $0$–$2$ with default $1$. Batching, seed handling, and backend changes can still affect exact outputs at $\tau = 0$.

## Trade-offs

| Goal | Typical direction | Watch for |
| --- | --- | --- |
| Extraction, tools, SQL, classifiers-as-text | Low $\tau$ | Dull repetition; still wrong if context is wrong |
| Brainstorming, varied summaries | Moderate $\tau$ (often with top-p) | Schema breaks, style drift |
| Very high $\tau$ alone | Rarely useful | Near-uniform noise, not "more creative truth" |
| Contrastive training | Small $\tau$ (e.g. SimCLR-scale) | Over-penalizing false negatives; brittle batches |
| Calibration $T$ | Fit on hold-out | Stale after drift; not a decode creativity setting |

Changing temperature and top-p together multiplies two distribution edits. Many production guides keep one primary diversity knob fixed and sweep the other on a golden set (pass rate, parse rate, toxicity, length, dedup rate).

## Why it matters here

Temperature is the easiest sampling parameter to over-credit. It changes *variance* of generations and *sharpness* of contrastive or distillation losses. It does not add missing facts, repair a bad prompt, or turn uncalibrated scores into trustworthy probabilities without a proper calibration procedure. In LLM products you pick low temperature when the cost of a random wrong token is high (tool arguments, code patches, structured fields), moderate temperature when diversity is the product feature, and you treat training-time $\tau$ as a separate hyperparameter with its own ablations.

## Related terms

- [Logits](glossary://logits)
- [Softmax](glossary://softmax)
- [Top-p sampling](glossary://top-p)
- [Top-k](glossary://top-k)
- [InfoNCE](glossary://infonce)
