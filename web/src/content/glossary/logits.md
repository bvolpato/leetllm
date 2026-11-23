---
title: Logits
importance: 95
---
Logits are the raw, unnormalized scores a model produces for candidate classes or tokens *before* a normalization such as softmax (multiclass / next-token) or sigmoid (binary). In frameworks and papers they are the preferred loss and decoding input: unbounded real numbers that need not be positive and need not sum to 1.

In classical statistics, the **logit** of a probability $p$ is the log-odds $\mathrm{logit}(p)=\log\frac{p}{1-p}$. Neural nets reuse the word for the pre-softmax scores that play that role. A binary head with sigmoid uses a single scalar logit equal to the log-odds of the positive class. Multiclass and language-model heads use a vector of free scores; only their *relative* differences matter once softmax runs.


## Intuition

Each logit is an unnormalized score. In an LLM, the final linear layer maps the last hidden state to a vector of length $V$ (vocabulary size). Larger $z_i$ means the model prefers token $i$ relative to the rest. Absolute level does not change softmax: adding a constant $c$ to every $z_i$ cancels in the ratio of exponentials. Gaps between top candidates matter. At temperature one, gaps of $0.2$ and $5$ imply pairwise odds ratios $e^{0.2}$ and $e^5$ respectively. A large gap to the runner-up does not by itself establish near-unit probability: many lower-ranked tokens can collectively carry substantial mass.

## Formula

**Softmax (multiclass / next token).** For logit vector $z \in \mathbb{R}^{C}$:

$$
p_i = \mathrm{softmax}(z)_i = \frac{e^{z_i}}{\sum_{j=1}^{C} e^{z_j}}
$$

Logits are unbounded; probabilities lie in $(0,1)$ and sum to $1$. Stable code subtracts $m=\max_j z_j$ before the exp (log-sum-exp).

**Temperature.** Decoding and some training heads use $z/\tau$ before softmax ($\tau>0$):

$$
p_i(\tau) = \frac{e^{z_i / \tau}}{\sum_j e^{z_j / \tau}}
$$

Small $\tau$ sharpens gaps; large $\tau$ flattens them. Argmax is unchanged by any $\tau>0$ (and by adding a constant to all logits).

**Logprob from logits.** Natural log of a softmax probability is

$$
\log p_i = z_i - \log\sum_j e^{z_j}
$$

APIs that expose token logprobs are usually this quantity (or an equivalent after temperature and filters), not the raw $z_i$.

**Binary log-odds.** For a single logit $z$ and $\sigma(z)=1/(1+e^{-z})$:

$$
z = \log\frac{\sigma(z)}{1-\sigma(z)}
$$

so a binary classification logit is exactly the log-odds of the positive class.

**Training.** PyTorch `CrossEntropyLoss` (and TensorFlow/JAX analogues) expect **raw logits**, not probabilities. Internally they combine log-softmax and NLL. Passing already-softmaxed values double-normalizes and breaks the loss scale. With hard label $y$:

$$
\mathcal{L} = -z_y + \log\sum_j e^{z_j} = -\log p_y
$$

and $\partial\mathcal{L}/\partial z_i = p_i - \mathbf{1}[i=y]$.

## Worked numbers

Tiny next-token vocab: `cache`, `cash`, `case` with logits

$$
z = [3.0,\ 2.8,\ 0.5]
$$

Subtract max $3.0$, then:

| Token | $z_i$ | $e^{z_i-3}$ | $p_i$ | $\log p_i$ (approx.) |
|-------|------:|------------:|------:|---------------------:|
| cache | $3.0$ | $1.000$ | $0.526$ | $-0.642$ |
| cash  | $2.8$ | $0.819$ | $0.431$ | $-0.842$ |
| case  | $0.5$ | $0.082$ | $0.043$ | $-3.142$ |

The top gap is only $0.2$. Greedy decoding still picks `cache`, but sampling can pick `cash` when its support remains allowed by top-$p$. Raise the first logit to $6.0$ and $p_{\text{cache}} \approx 0.957$ at temperature one without filters; greedy always selects it, while sampling still differs about $4.3\%$ of the time. Debug the **gap**, the full top-$k$ logit list, and sampled or greedy outputs together.

## Example

Serving path for one decode step (shape sketch):

```python
# h: [batch, hidden] last-token residual; W: [vocab, hidden]
logits = h @ W.T  # [batch, vocab], raw scores

# Constrained decoding: forbid disallowed token ids
logits[:, banned_ids] = -float("inf")

# Temperature, then stable softmax on the active set
if temperature <= 0:
    raise ValueError("use argmax directly for greedy decoding")
# Require at least one finite allowed logit in every row before normalizing.
scaled = logits / temperature
log_probs = scaled - scaled.logsumexp(dim=-1, keepdim=True)
# sample from exp(log_probs), or take argmax when temperature → 0
```

In production the same tensor is also the handle for bias terms, presence/frequency penalties, grammar masks, and tool-call token restrictions: they edit **logits** before normalization so the distribution stays a valid probability simplex.

## How decoding uses them

1. Transformer produces last-position hidden state $h$.
2. Output projection (`lm_head`) yields $z \in \mathbb{R}^{V}$.
3. Optional controls edit $z$: temperature scale, bans, schema/grammar masks, logit bias.
4. Softmax (or log-softmax) yields $p$ or $\log p$.
5. Policy chooses the next token: greedy, multinomial, top-$k$, top-$p$, beam, or constrained search.

Training uses the same $z$ under teacher forcing: compare gold token $y$ to $\mathrm{softmax}(z)$ via cross-entropy. Match the checkpoint's tokenizer and chat-template conventions at serving. Decoding biases and masks can intentionally differ from training; record them because they change the effective output distribution.

## What fails in production

- **Double softmax / softmax before CE.** Feeding probabilities into a logits-expecting loss flattens gradients and yields wrong loss magnitudes. Keep the head linear through the loss.
- **Treating logits as probabilities.** A logit of $2.0$ is not "200% confidence." Convert with softmax (or report logprobs) before thresholds, calibration, or user-facing scores.
- **Near-ties ignored.** Fluent wrong answers often sit within a small gap of the right token. If two answers both look good, inspect top logits and logprobs alongside the decoded string.
- **Unstable mask values.** Use true `-inf` where the kernel permits it for a hard ban; a finite negative is only an approximate mask and can overflow on assignment in FP16. An all-masked row has no valid distribution and needs an explicit error/abstention policy. Setting a logit to zero can strengthen a previously negative score and never removes it from the competition.
- **Overflow / NaN.** Huge logits without max-subtraction blow `exp` in float16/float32. Use log-sum-exp or framework fused CE. After quantization or mixed precision, compare top-token ranks against a higher-precision baseline if quality drifts.
- **Calibration.** Softmax mass is model-internal belief; compare predicted probabilities with observed correctness frequencies on held-out data. Temperature scaling edits logits ($z/T$), and you must fit $T$ on held-out data for the slice you ship.

## Why it matters here

Logits are the bridge from transformer representations to every visible choice: next tokens, class labels, tool-call structures, and training loss. Softmax, temperature, top-$k$/top-$p$, constrained decoding, cross-entropy, logprobs, and calibration all attach at this layer. If you can read gaps, masks, and numerical scale on the logit tensor, you can debug fluent-but-wrong outputs and broken training loops instead of only staring at decoded text.

## Related terms

- [Softmax](glossary://softmax)
- [Temperature](glossary://temperature)
- [Logprob](glossary://logprob)
- [Cross-entropy](glossary://cross-entropy)
- [Log-sum-exp](glossary://log-sum-exp)
