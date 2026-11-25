---
{
  "id": "decoding-strategies-greedy-beam-nucleus",
  "title": "Decoding Strategies: Greedy to Nucleus",
  "slug": "decoding-strategies-greedy-beam-nucleus",
  "category": "NLP Fundamentals",
  "difficulty": "Medium",
  "prerequisites": [],
  "coverImage": "illustrations/_generated/decoding_strategies_dark.png",
  "companies": [
    "Google",
    "OpenAI",
    "Meta",
    "Anthropic",
    "Google DeepMind"
  ],
  "shortDescription": "The most likely next token can begin a weaker full sequence. Trace one probability row from stable softmax and greedy search through beam search, temperature, nucleus sampling, and grammar masks.",
  "keyConceptsTested": [
    "Numerically stable softmax and log-sum-exp overflow prevention",
    "Greedy decoding as a local argmax rather than global sequence search",
    "Beam search with GNMT length normalization",
    "Temperature scaling and Shannon entropy",
    "Top-k, top-p (nucleus), and min-p truncation",
    "Sign-aware repetition, frequency, and presence penalties",
    "Grammar-constrained decoding with negative-infinity masks",
    "Non-commuting sampler pipeline order across inference runtimes"
  ],
  "section": "Core LLM Foundations",
  "order": 5,
  "aliases": [
    "decoding-algorithms"
  ]
}
---

Feed an autoregressive language model the prefix `The autumn light is` across three requests. One run ends immediately with `bright.` Another produces `fading fast`. A third writes a fresh continuation every time. Identical weights, identical prompt, identical tokenizer: all that changed is the decoding code turning raw next-token scores (<span data-glossary="logits">logits</span>) into emitted <span data-glossary="token">tokens</span>. Because each emitted token alters the conditioning context for every later step, decoding controls fluency, repetition, diversity, and schema validity.

Trace every strategy on one twelve-token row where each word is one token and eight rare tail tokens each hold `0.01` probability so the row sums to `1.00`:

| Token | Probability | Plausible continuation |
|-------|-------------|------------------------|
| `bright` | 0.45 | `bright .` |
| `fading` | 0.30 | `fading fast` |
| `soft` | 0.15 | `soft gold` |
| `pale` | 0.02 | rare adjective |
| tail | 0.08 | eight rare tokens at 0.01 each |

Greedy decoding locks onto `bright` (`0.45`). Stochastic sampling can draw `fading` (`0.30`) into `fading fast` or `soft` (`0.15`) into `soft gold`. <span data-glossary="top-p">Top-p sampling</span> at `p = 0.90` retains `bright`, `fading`, and `soft` (`0.45 + 0.30 + 0.15 = 0.90`), renormalizing them to `0.500`, `0.333`, and `0.167`. For low-latency serving, <span data-glossary="speculative-decoding">speculative decoding</span> drafts tokens with a smaller model and verifies them in parallel with exact rejection sampling so the target distribution stays unchanged.[^leviathan2023]

<figure>
  <img src="illustrations/_generated/decoding_strategies_dark.png" alt="Horizontal probability comparison for two-token continuations after The autumn light is. First-step probabilities are bright 0.45, fading 0.30, soft 0.15, and nine tail tokens totaling 0.10. Width-2 beam search retains bright and fading while pruning soft and the tail. Greedy commits to bright followed by period at 0.180, whereas beam search rescues fading followed by fast at 0.270." />
  <figcaption>Each terminal score multiplies the first-step probability by its conditional continuation probability. Beam width 2 keeps <code>fading</code> alive, letting <code>fading fast</code> (0.270) outscore greedy's <code>bright .</code> (0.180).</figcaption>
</figure>

## From logits to numerically stable probabilities

<span data-glossary="softmax">Softmax</span> maps raw logits $z \in \mathbb{R}^{|V|}$ to probabilities. Calling `exp(z)` directly overflows FP16 above $z \approx 11.09$ (`max ≈ 65,504`), FP32 above $z \approx 88.72$ (`max ≈ 3.4e38`), and FP64 above $z \approx 709.78$. Subtracting $m = \max_j z_j$ leaves every ratio exact while keeping all exponents $\le 0$:[^blanchard2019softmax]

$$
p_i = \frac{\exp(z_i - m)}{\sum_{j=1}^{|V|} \exp(z_j - m)}, \qquad \log p_i = (z_i - m) - \log \sum_{j=1}^{|V|} \exp(z_j - m)
$$

The right-hand **log-sum-exp** form lets decoders sum <span data-glossary="logprob">log-probabilities</span> across long sequences without underflowing to zero. Masked $-\infty$ entries map cleanly to `0`, while an all-masked vector must raise an error instead of returning `NaN`:

<!-- leetllm: test, id=stable-softmax, output=show, output_title="Max-shifted softmax prevents overflow", deps=numpy -->
```python title="stable-softmax-overflow.py"
import numpy as np


def stable_softmax(logits) -> np.ndarray:
    z = np.asarray(logits, dtype=np.float64)
    if np.isnan(z).any() or np.isposinf(z).any():
        raise ValueError("NaN and +inf are invalid logits")
    if not np.isfinite(z).any():
        raise ValueError("all tokens are masked")
    w = np.exp(z - np.max(z))
    return w / w.sum()


for dtype, hi in [(np.float16, 12.0), (np.float32, 90.0), (np.float64, 1000.0)]:
    vec = np.array([hi, hi - 1.0, hi - 2.0], dtype=dtype)
    with np.errstate(over="ignore", invalid="ignore"):
        naive = np.exp(vec) / np.exp(vec).sum()
    print(f"{dtype.__name__:7s} naive={naive.tolist()} | stable={stable_softmax(vec).round(3).tolist()}")

print("masked:", stable_softmax([2.0, -np.inf, 1.0]).round(3).tolist())
try:
    stable_softmax([-np.inf, -np.inf])
except ValueError as exc:
    print("all masked:", exc)
```

<!-- leetllm: output:start -->
```text title="Max-shifted softmax prevents overflow" output compact
float16 naive=[nan, 0.0, 0.0] | stable=[0.665, 0.245, 0.09]
float32 naive=[nan, nan, 0.0] | stable=[0.665, 0.245, 0.09]
float64 naive=[nan, nan, nan] | stable=[0.665, 0.245, 0.09]
masked: [0.731, 0.0, 0.269]
all masked: all tokens are masked
```
<!-- leetllm: output:end -->

## Greedy decoding and beam search

**Greedy decoding** picks the step-by-step argmax, $w_t = \arg\max_{w \in V} P(w \mid w_{<t})$. It costs $O(|V|)$ after logits arrive, uses no randomness, and makes a clean baseline for classification or deterministic extraction. Its blind spot is **myopia**: by the chain rule $P(w_{1:T}) = \prod_{t=1}^T P(w_t \mid w_{<t})$, taking the step-one leader can miss a stronger full sequence. Here `bright` (`0.45`) splits across `.` (`0.40`), `today` (`0.35`), and `now` (`0.25`), while `fading` (`0.30`) concentrates on `fast` (`0.90`), so greedy locks into `bright .` (`0.18`) and misses `fading fast` (`0.27`). On long generations, greedy argmax also falls into verbatim repetition loops.[^holtzman2020][^deepseekr1_2025]

Exhaustive search over $|V|^T$ paths is intractable. **<span data-glossary="beam-search">Beam search</span>** retains the top $B$ partial prefixes at each step, expands each survivor, sums log-probabilities, and prunes back to $B$. Pruned prefixes never return, so width $B = 2$ rescues `fading fast` (`0.27`) while discarding `soft` (`0.15`). Because each added token contributes a non-positive log-probability, raw sums reward short outputs that emit `EOS` early. Google's Neural Machine Translation (GNMT) system divided sequence log-probability by a tunable length factor:[^wu2016gnmt]

$$
\text{score}(Y) = \frac{\log P(Y)}{(5 + |Y|)^\alpha / 6^\alpha}
$$

Setting $\alpha = 0$ restores raw log-probability; raising $\alpha$ relieves penalty pressure on longer completions (counting tokens before `EOS`). Length-normalized scores can rise when a prefix adds a near-certain token, so early-stopping logic must not assume monotone decline.

<!-- leetllm: test, id=decoding-paths, output=show, output_title="Greedy vs beam search and GNMT length normalization", deps=numpy -->
```python title="beam-search-and-length-penalty.py"
import numpy as np

vocab = ["bright", "fading", "soft", "pale"]
first_probs = np.array([0.45, 0.30, 0.15, 0.02])
continuations = {
    "bright": {".": 0.40, "today": 0.35, "now": 0.25},
    "fading": {"fast": 0.90, "slowly": 0.10},
    "soft": {"gold": 0.70, "gray": 0.30},
}

greedy_w1 = vocab[int(np.argmax(first_probs))]
greedy_w2 = max(continuations[greedy_w1], key=continuations[greedy_w1].get)
beam_idx = np.argsort(-first_probs, kind="stable")[:2]
step_two = sorted(
    [(f"{vocab[int(i)]} {w2}", float(first_probs[i]) * p) for i in beam_idx for w2, p in continuations[vocab[int(i)]].items()],
    key=lambda x: x[1],
    reverse=True,
)
print(f"greedy: {greedy_w1} {greedy_w2} ({first_probs[0] * continuations[greedy_w1][greedy_w2]:.2f})")
print("beam top-2:", [(t, round(s, 3)) for t, s in step_two[:2]])

# GNMT length normalization (alpha = 0.6) flips short-sequence bias.
texts = ["bright.", "fading across hills now ."]
log_probs, lengths = np.array([-1.00, -1.08]), np.array([2, 5])
norm_scores = log_probs / (((5.0 + lengths) / 6.0) ** 0.6)
print("raw winner:", texts[int(np.argmax(log_probs))], "| length-norm winner:", texts[int(np.argmax(norm_scores))])
assert step_two[0][0] == "fading fast" and texts[int(np.argmax(norm_scores))] == "fading across hills now ."
```

<!-- leetllm: output:start -->
```text title="Greedy vs beam search and GNMT length normalization" output compact
greedy: bright . (0.18)
beam top-2: [('fading fast', 0.27), ('bright .', 0.18)]
raw winner: bright. | length-norm winner: fading across hills now .
```
<!-- leetllm: output:end -->

Beam search excels on tightly conditioned tasks like translation, yet in open-ended dialogue maximizing likelihood favors generic clichés while holding up to $B$ divergent suffix paths in <span data-glossary="kv-cache">KV-cache</span> memory.[^holtzman2020][^meister2020]

```checkpoint
A summarization model decoded with beam width 8 emits terse one-line fragments. What should you inspect first?
---
Check length normalization (`alpha`), `EOS` token scores, early-stopping bounds, and maximum output limits before suspecting the weights. Unnormalized log-probability favors early `EOS`, and length-normalized scores can rise upon extension, breaking naive early-stop rules.
```

## Temperature scaling

Stochastic sampling draws from the conditional distribution. <span data-glossary="temperature">Temperature</span> $T > 0$ divides raw logits before softmax:

$$
P_T(w_i) = \frac{\exp((z_i - z_{\max}) / T)}{\sum_{j=1}^{|V|} \exp((z_j - z_{\max}) / T)}
$$

Pairwise odds scale exponentially as $\exp((z_A - z_B)/T)$: for $z_A - z_B = 2.0$, $P(A)/P(B)$ is `7.39x` at $T = 1.0$, `54.60x` at $T = 0.5$, and `3.79x` at $T = 1.5$. Shannon entropy $H(P_T) = -\sum_i P_T(w_i)\log_2 P_T(w_i)$ is monotone nondecreasing in $T$: route `temperature = 0` to an explicit greedy branch rather than dividing by zero,[^huggingface2026logits][^vllmSamplingParams2026] and always scale every individual token before summing tail buckets (at $T = 1.5$, scaling all eight `0.01` tail tokens lifts combined tail mass from `8.0%` to `21.07%`):

| Token | $T = 0.3$ | $T = 1.0$ | $T = 1.5$ |
|-------|-----------|-----------|-----------|
| `bright` | 0.7785 | 0.45 | 0.3331 |
| `fading` | 0.2015 | 0.30 | 0.2542 |
| `soft` | 0.0200 | 0.15 | 0.1602 |
| `pale` | 0.000024 | 0.02 | 0.0418 |
| eight-token tail | 0.000019 | 0.08 | 0.2107 |
| entropy $H$ (bits) | 0.86 | 2.09 | 2.75 |

<figure>
  <img src="illustrations/_generated/sampling_distribution_dark.png" alt="Line chart comparing a twelve-token next-word distribution after The autumn light is across temperatures 0.3, 1.0, and 1.5. Original probabilities are bright 45 percent, fading 30, soft 15, pale 2, and eight 1-percent tail tokens totaling 8 percent. Rescaling all twelve tokens before summing the tail shifts bright from 77.8 percent at T=0.3 to 33.3 percent at T=1.5 while the grouped tail rises from under 0.01 percent to 21.1 percent, with Shannon entropy increasing from 0.86 to 2.09 to 2.75 bits." />
  <figcaption>Each curve rescales all twelve logits before summing the eight tail tokens. Raising temperature from 0.3 to 1.5 flattens the mode and lifts combined tail mass above 21%.</figcaption>
</figure>

> **Common mistake:** Lowering temperature makes outputs more consistent, not more truthful. Positive temperature preserves logit order, so an unsupported leader simply becomes more repeatable.

## Top-k, top-p, and min-p truncation

Even at moderate temperature, tens of thousands of unlikely tail tokens retain nonzero probability. Truncation filters cut that tail before sampling:

- **<span data-glossary="top-k">Top-k</span>** retains only the $k$ highest-scoring tokens and renormalizes.[^fan2018] Its fixed integer ignores model certainty (`k = 50` admits noise on sharp factual steps; `k = 10` clips valid choices on open prompts).
- **Nucleus (top-p)** sorts probabilities descending and keeps the smallest prefix whose cumulative mass reaches $p$: $m = \min\{j : \sum_{i=1}^j P(w_{(i)}) \ge p\}$.[^holtzman2020] Size adapts automatically with entropy, though heating $T > 1$ pushes mass into the tail and swells our `p = 0.90` nucleus from `3` tokens to `9`.
- **Min-p** retains tokens reaching at least fraction $\rho$ of the leader's probability: $V_{\min\text{-}p} = \{w : P(w) \ge \rho \cdot \max_v P(v)\}$.[^nguyen2025] Applied after temperature, this equals $z_i \ge z_{\max} + T \log \rho$, so higher $T$ still widens the window (and ordering min-$p$ before vs after $T$ changes survivors), while uniform ties retain all tokens and controlled reanalyses found no systematic win over well-tuned top-$p$.[^minp_critique2025]

<figure>
  <img src="illustrations/_generated/adaptive_truncation_dark.png" alt="Side-by-side probability bar and cumulative distribution plots comparing peaked (72, 20, 5, 2, 1 percent) and flat (40, 20, 15, 11.5, 3.5, plus ten 1-percent tokens) distributions. Fixed top-k 3 keeps three tokens in both. Top-p 0.90 adapts from two to five tokens via cumulative mass, while min-p 0.10 adapts from two to four tokens by scaling the cutoff from 7.2 percent to 4.0 percent." />
  <figcaption>Fixed <code>top-k = 3</code> keeps three tokens in both regimes. <code>top-p = 0.90</code> expands from two to five tokens on the flat curve, while <code>min-p = 0.10</code> drops its cutoff from 7.2% to 4.0% and retains four tokens.</figcaption>
</figure>

<!-- leetllm: test, output=show, output_title="Temperature expands top-p and shifts min-p cutoff", deps=torch -->
```python title="temperature-nucleus-and-minp.py"
import math
import torch

base_probs = torch.tensor([0.45, 0.30, 0.15, 0.02] + [0.01] * 8, dtype=torch.float64)
logits = torch.log(base_probs)


def nucleus_size(probs: torch.Tensor, p: float = 0.90) -> int:
    sp, _ = torch.sort(probs, descending=True)
    return int(((torch.cumsum(sp, dim=0) - sp) < p).sum())


for temp in [0.3, 1.0, 1.5]:
    dist = torch.softmax(logits / temp, dim=-1)
    h = float(-(dist[dist > 0] * torch.log2(dist[dist > 0])).sum())
    print(f"T={temp}: bright={float(dist[0]):.4f}, tail={float(dist[4:].sum()):.4f}, H={h:.2f}b, top-p={nucleus_size(dist)}")

# Min-p before vs after T=2 on [0, -2, -4] with rho=0.1.
z = torch.tensor([0.0, -2.0, -4.0])
before = torch.nonzero(z >= z.max() + 1.0 * math.log(0.1)).flatten().tolist()
after = torch.nonzero(z >= z.max() + 2.0 * math.log(0.1)).flatten().tolist()
print(f"min-p before T=2: {before} | after T=2: {after}")
assert before == [0, 1] and after == [0, 1, 2]
```

<!-- leetllm: output:start -->
```text title="Temperature expands top-p and shifts min-p cutoff" output compact
T=0.3: bright=0.7785, tail=0.0000, H=0.86b, top-p=2
T=1.0: bright=0.4500, tail=0.0800, H=2.09b, top-p=3
T=1.5: bright=0.3331, tail=0.2107, H=2.75b, top-p=9
min-p before T=2: [0, 1] | after T=2: [0, 1, 2]
```
<!-- leetllm: output:end -->

## Penalties, grammar masks, and non-commuting pipelines

A multiplicative **repetition penalty** $\theta > 1$ (commonly `1.1–1.2`) breaks verbatim loops using a **sign-aware** rule once per distinct seen token ID: divide positive logits by $\theta$ and multiply negative logits by $\theta$ so every seen token drops.[^keskar2019][^huggingface2026logits] Because sign-aware scaling is **not shift-invariant**, always apply it *before* subtracting `max(z)` for softmax stability, or centering flips positive scores to negative and can reverse the argmax winner:

<!-- leetllm: test, output=show, output_title="Sign-aware penalty and centering order", deps=torch -->
```python title="repetition-penalty-sign-and-centering.py"
import torch


def apply_repetition_penalty(logits: torch.Tensor, seen_ids: set[int], penalty: float = 1.2) -> torch.Tensor:
    out = logits.clone()
    idx = torch.tensor(sorted(seen_ids), dtype=torch.long)
    out[idx] = torch.where(out[idx] > 0, out[idx] / penalty, out[idx] * penalty)
    return out


raw = torch.tensor([2.4, -0.5, 0.7])
print("sign-aware [2.4, -0.5, 0.7]:", [round(float(v), 3) for v in apply_repetition_penalty(raw, {0, 1}, 1.2)])

scores = torch.tensor([2.4, 2.1, 1.2, 0.3])
names = ["bright", "clear", "warm", "pale"]
p_first = apply_repetition_penalty(scores, {0}, 1.2)
c_first = apply_repetition_penalty(scores - scores.max(), {0}, 1.2)
print("penalty first:", names[int(torch.argmax(p_first))], "| center first:", names[int(torch.argmax(c_first))])
assert int(torch.argmax(p_first)) == 1 and int(torch.argmax(c_first)) == 0
```

<!-- leetllm: output:start -->
```text title="Sign-aware penalty and centering order" output compact
sign-aware [2.4, -0.5, 0.7]: [2.0, -0.6, 0.7]
penalty first: clear | center first: bright
```
<!-- leetllm: output:end -->

Additive **frequency** ($\alpha$) and **presence** ($\beta$) penalties subtract directly using token counts: $\text{logit}_{\text{adjusted}} = \text{logit} - \alpha \cdot \text{count}(\text{token}) - \beta \cdot \mathbb{1}[\text{count}(\text{token}) > 0]$. Because all three operate on raw token IDs without syntax awareness, heavy values can suppress repeated code identifiers or required JSON keys.

Serving engines chain logit processors in a fixed order because **stages do not commute**: (1) logit biases and $-\infty$ grammar masks, (2) history penalties before centering, (3) `temperature == 0` greedy branch after checking that at least one finite logit remains, (4) temperature scaling, top-$k$, stable softmax, top-$p$/min-$p$, renormalization, and PRNG draw, and (5) `EOS`, stop-string, and `max_tokens` checks.[^huggingface2026logits]

To enforce JSON Schema, regex, or SQL syntax, **grammar-constrained decoding** pairs generation with an automaton that masks every invalid token to $-\infty$ before softmax.[^willard2023][^xgrammar2024] Always **mask invalid tokens before top-$k$/top-$p$/min-$p$**: if probabilities are `[0.6, 0.3, 0.1]` and only token `2` is legal, running `top-p = 0.80` first drops token `2` and leaves an empty pool, whereas masking first renormalizes token `2` to `1.0`. Remember also that syntax enforcement does not verify facts, and local step-by-step masking can distort full-sequence probabilities relative to conditioning on valid complete strings.[^openai_structured_outputs][^grammarAlignedDecoding2024] See [Structured Outputs & Constrained Generation](/learn/structured-output-constrained-generation) for compiled masks and grammar-aligned sampling.

<figure>
  <img src="illustrations/_generated/production_sampler_stack_dark.png" alt="Two side-by-side charts showing repetition penalty and top-p truncation order on four tokens: bright, clear, warm, and pale. Left chart shows seen token bright dropping from logit 2.4 to 2.0 under penalty 1.2, placing clear at 2.1 as the new greedy winner. Right chart plots sorted softmax probabilities 0.404, 0.365, 0.164, 0.067 and their cumulative CDF reaching 0.933 at rank 3 warm to cross top-p 0.90, eliminating pale." />
  <figcaption>Repetition penalty pushes <code>bright</code> below <code>clear</code> (changing greedy output to <code>clear</code>), while <code>top-p = 0.90</code> cuts <code>pale</code> and lets stochastic sampling draw from <code>clear</code>, <code>bright</code>, or <code>warm</code>.</figcaption>
</figure>

<!-- leetllm: test, id=sampler-stack, output=show, output_title="Sampler pipeline and grammar-before-truncation", deps=torch -->
```python title="production-sampler-and-grammar-order.py"
import random
import torch


def sample_next_token(logits: torch.Tensor, seen_ids: list[int], penalty: float, temperature: float, top_p: float, rng: random.Random) -> int:
    adjusted = logits.clone()
    if seen_ids:
        idx = torch.tensor(sorted(set(seen_ids)), dtype=torch.long)
        adjusted[idx] = torch.where(adjusted[idx] > 0, adjusted[idx] / penalty, adjusted[idx] * penalty)
    if torch.isneginf(adjusted).all() or torch.isnan(adjusted).any():
        raise ValueError("need at least one finite unmasked logit")
    if temperature == 0:
        return int(torch.argmax(adjusted))
    probs = torch.softmax(adjusted / temperature, dim=-1)
    sp, sidx = torch.sort(probs, descending=True)
    keep = ((torch.cumsum(sp, dim=0) - sp) < top_p) & (sp > 0)
    return rng.choices([int(i) for i in sidx[keep]], weights=[float(w) for w in sp[keep]], k=1)[0]


names = ["bright", "clear", "warm", "pale"]
logits = torch.tensor([2.4, 2.1, 1.2, 0.3])
print("greedy:", names[sample_next_token(logits, [0], 1.2, 0.0, 0.90, random.Random(0))])
print("sampled:", names[sample_next_token(logits, [0], 1.2, 1.0, 0.90, random.Random(0))])

scores = torch.log(torch.tensor([0.6, 0.3, 0.1]))
grammar_first = scores.masked_fill(~torch.tensor([False, False, True]), -torch.inf)
chosen = sample_next_token(grammar_first, [], 1.0, 1.0, 0.80, random.Random(0))
print("grammar-first token:", chosen)
assert chosen == 2

try:
    sample_next_token(torch.full((3,), -torch.inf), [], 1.0, 0.0, 0.80, random.Random(0))
except ValueError as err:
    print("empty pool rejected:", err)
```

<!-- leetllm: output:start -->
```text title="Sampler pipeline and grammar-before-truncation" output compact
greedy: clear
sampled: warm
grammar-first token: 2
empty pool rejected: need at least one finite unmasked logit
```
<!-- leetllm: output:end -->

> **Key insight:** Logit processors do not commute. Always apply hard grammar masks before probability truncation (`top-k`, `top-p`, `min-p`) so truncation renormalizes over legal tokens rather than discarding the sole valid continuation.

## Choosing settings, runtime limits, and troubleshooting

Setting `temperature = 0` removes randomness and `seed` fixes PRNG draws, yet batching and GPU floating-point reduction differences can still flip near-tied logits unless batch-invariant modes (`VLLM_BATCH_INVARIANT=1`) are active.[^vllmSamplingParams2026][^openai2026ChatReference] Hosted reasoning APIs frequently lock or ignore `temperature` and `top_p` while reasoning is enabled; rely on prompt grounding and structured schemas when sampling knobs are unavailable.[^openai2026LatestModel][^anthropic2026ApiMigration]

Start sweeps from how much <span data-glossary="variance">variance</span> the task tolerates, changing one knob at a time on held-out prompts:

| Task | Temperature sweep | Sampler candidates | Primary metrics |
|------|-------------------|--------------------|-----------------|
| Code generation | 0.0, 0.2, 0.5 | Greedy, top-p = 0.95 | Tests passed, format validity |
| Factual QA | 0.0, 0.2, 0.5 | Greedy, top-p = 0.90 | Grounded accuracy, unsupported claims |
| General dialogue | 0.3, 0.7, 1.0 | Top-p = 0.90, min-p = 0.10 | Helpfulness, repetition |
| Creative writing | 0.7, 1.0, 1.3 | Top-p = 0.95, min-p = 0.05 | Novelty, coherence |

| Symptom | Root cause | Fix |
|---------|------------|-----|
| `NaN` in custom softmax | Naive `exp(z)` overflowed FP16/FP32 | Subtract `max(z)` before `exp` (log-sum-exp) |
| Crash at `temperature = 0` | Divided logits by zero | Route `T == 0` to greedy argmax before scaling |
| Generic chat with beam search | High likelihood favors boilerplate | Switch to calibrated sampling |
| Lower $T$ still hallucinates | Positive $T$ preserves token rank | Fix retrieval grounding or verification |
| Empty pool with JSON schema | Truncation ran before grammar mask | Apply $-\infty$ masks before top-$k$/top-$p$ |
| Drift after runtime swap | Processor order or tie-break differs | Verify logit-processor ordering |

```mastery-quiz
[
  {
    "question": "First-token probabilities are A: 0.52, B: 0.28, C: 0.20. After A, A1-A4 tie equally; after B, B1-B2 tie equally; after C, C1 has probability 1.0. Breaking ties in ID order, what do greedy, width-2 beam, and exhaustive search return?",
    "options": [
      "Greedy A1 (0.130); beam B1 (0.140); exhaustive B1 (0.140).",
      "Greedy A1 (0.130); beam B1 (0.140); exhaustive C1 (0.200).",
      "Greedy B1 (0.140); beam A1 (0.130); exhaustive C1 (0.200).",
      "Greedy B1 (0.140); beam A1 (0.130); exhaustive B1 (0.140)."
    ],
    "answer": "Greedy A1 (0.130); beam B1 (0.140); exhaustive C1 (0.200).",
    "explanation": "Greedy picks A and ties at 0.52 * 0.25 = 0.130 (A1). Width-2 beam keeps A and B; B1 scores 0.28 * 0.50 = 0.140. Exhaustive search keeps C and finds C1 at 0.20 * 1.0 = 0.200."
  },
  {
    "question": "A complete-only decoder uses GNMT length normalization (alpha = 1, length excludes EOS). Completed S has log-prob -1.4 (len 2); completed L has -1.6 (len 4); active U hits the cap at -1.0 (len 4) without EOS. Which candidate wins?",
    "options": [
      "S at -1.2000.",
      "U at -0.6667.",
      "L at -1.6000.",
      "L at -1.0667."
    ],
    "answer": "L at -1.0667.",
    "explanation": "S scores -1.4 / (7/6) = -1.2000; L scores -1.6 / (9/6) = -1.0667 and wins. U never emitted EOS, so a complete-only decoder excludes it."
  },
  {
    "question": "Probabilities are leader 0.36 and four separate tail tokens of 0.16 each. Apply T = 0.5 to each individual token, then sum the tail. What are leader and combined tail?",
    "options": [
      "Leader 55.86%; combined tail 44.14%.",
      "Leader 24.04%; combined tail 75.96%.",
      "Leader 36.00%; combined tail 64.00%.",
      "Leader 20.00%; combined tail 80.00%."
    ],
    "answer": "Leader 55.86%; combined tail 44.14%.",
    "explanation": "T = 0.5 squares each individual probability: Z = 0.36^2 + 4 * 0.16^2 = 0.2320, so leader gets 0.1296 / 0.2320 = 55.86% and tail gets 44.14%."
  },
  {
    "question": "Tokens A/B/C have logits [3, -1, 2] and counts [2, 1, 0]. Apply sign-aware repetition penalty 2.0 once per distinct seen token, then frequency 0.25 and presence 0.5. What are the adjusted logits and winner?",
    "options": [
      "[-0.25, -2.75, 2.0]; winner C.",
      "[0.5, -1.25, 2.0]; winner C.",
      "[-0.25, -1.25, 2.0]; winner C.",
      "[0.5, -2.75, 2.0]; winner C."
    ],
    "answer": "[0.5, -2.75, 2.0]; winner C.",
    "explanation": "A: 3 / 2 - 2 * 0.25 - 0.5 = 0.5. B: -1 * 2 - 1 * 0.25 - 0.5 = -2.75. Unseen C stays 2.0 and wins."
  },
  {
    "question": "A/B/C/D have probabilities [0.52, 0.24, 0.16, 0.08], and a grammar permits only D. Running top-p = 0.85 first emptied the set. Fixing order to grammar-first, and separately passing all -inf logits to T = 0 greedy, gives what?",
    "options": [
      "Emit D; select lowest-ID masked token.",
      "Emit D; raise an error rejecting the all-masked input.",
      "Keep empty set; raise an error rejecting the all-masked input.",
      "Keep empty set; select lowest-ID masked token."
    ],
    "answer": "Emit D; raise an error rejecting the all-masked input.",
    "explanation": "Grammar-first leaves D at probability 1.0, surviving top-p. An all -inf vector has zero legal tokens and must raise an error even at T = 0."
  }
]
```

> **Next:** Continue to [Perplexity & Model Evaluation](/learn/perplexity-language-model-evaluation).
