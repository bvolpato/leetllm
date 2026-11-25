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
  "order": 7,
  "aliases": [
    "decoding-algorithms"
  ]
}
---

<!-- leetllm: edition:reference:start -->

Feed an autoregressive language model the prefix `The autumn light is`. At each step, the <span data-glossary="transformer">transformer</span> outputs one vector of raw next-token scores (<span data-glossary="logits">logits</span>) across its vocabulary. The decoder turns those logits into probabilities, picks one <span data-glossary="token">token</span>, appends it to the prefix, and repeats. Because each emitted token changes the context for every later step, the decoding rule controls fluency, repetition, diversity, and schema validity even with identical weights and prompt.

Trace every strategy on one twelve-token row where each word is a single token and eight rare tail tokens each hold `0.01` probability so the row sums to `1.00`:

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

<span data-glossary="softmax">Softmax</span> maps raw logits $z \in \mathbb{R}^{|V|}$ to probabilities. Evaluating $\exp(z_i) / \sum_j \exp(z_j)$ naively overflows fast: FP16 overflows `exp(z)` above $z \approx 11.09$ (`max ≈ 65,504`), FP32 above $z \approx 88.72$ (`max ≈ 3.4e38`), and FP64 above $z \approx 709.78$. Subtracting $m = \max_j z_j$ leaves every ratio exact while keeping all exponents $\le 0$:[^blanchard2019softmax]

$$
p_i = \frac{\exp(z_i - m)}{\sum_{j=1}^{|V|} \exp(z_j - m)}, \qquad \log p_i = (z_i - m) - \log \sum_{j=1}^{|V|} \exp(z_j - m)
$$

The right-hand **log-sum-exp** form lets decoders sum <span data-glossary="logprob">log-probabilities</span> across long sequences without underflowing to zero. Masked $-\infty$ entries map cleanly to `0`, while an all-masked vector must raise an error instead of returning `NaN`.

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

**Greedy decoding** picks the step-by-step argmax, $w_t = \arg\max_{w \in V} P(w \mid w_{<t})$. It costs $O(|V|)$ after logits arrive, uses no randomness, and makes a clean baseline for classification or deterministic extraction. Its blind spot is **myopia**: by the chain rule, $P(w_{1:T}) = \prod_{t=1}^T P(w_t \mid w_{<t})$, so picking the step-one leader can miss a higher-probability completion. After `The autumn light is`, `bright` (`0.45`) splits across `.` (`0.40`), `today` (`0.35`), and `now` (`0.25`), while `fading` (`0.30`) concentrates on `fast` (`0.90`). Greedy commits to `bright .` (`0.18`), missing `fading fast` (`0.27`). On long open-ended outputs, greedy search also traps models in repetition loops, which Holtzman et al. documented on GPT-2 and DeepSeek-R1 noted on greedy reasoning rollouts.[^holtzman2020][^deepseekr1_2025]

Exhaustive search over $|V|^T$ paths is intractable, and full-prefix attention rules out Markov dynamic programming. <span data-glossary="beam-search">Beam search</span> approximates global search by keeping the top $B$ active prefixes at each step, expanding each survivor, summing log-probabilities, and pruning back to $B$. Pruned prefixes never return, so width $B = 2$ recovers `fading fast` (`0.27`) while still missing `soft gold` if both kept prefixes later split across weak continuations.

Because every added token contributes a non-positive log-probability, raw sums favor short sequences that emit `EOS` early. Google's Neural Machine Translation (GNMT) system divided sequence log-probability by a smooth length factor:[^wu2016gnmt]

$$
\text{score}(Y) = \frac{\log P(Y)}{(5 + |Y|)^\alpha / 6^\alpha}
$$

Setting $\alpha = 0$ restores raw log-probability; raising $\alpha$ relieves penalty pressure on longer outputs (where $|Y|$ counts tokens before `EOS`). Note that length-normalized scores can increase when a prefix extends with a near-certain token, so early-stopping rules must not assume monotone decline.

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

Beam search shines on tightly conditioned tasks like translation, yet in open-ended dialogue higher sequence likelihood often collapses onto generic clichés while holding up to $B$ divergent suffix paths in paged <span data-glossary="kv-cache">KV-cache</span> memory.[^holtzman2020][^meister2020]

```checkpoint
A summarization model decoded with beam width 8 emits terse one-line fragments. What should you inspect first?
---
Check length normalization (`alpha`), `EOS` token scores, early-stopping bounds, and maximum output limits before suspecting the weights. Unnormalized log-probability favors early `EOS`, and length-normalized scores can rise upon extension, breaking naive early-stop rules.
```

## Temperature scaling

Sampling draws directly from the conditional distribution. <span data-glossary="temperature">Temperature</span> $T > 0$ divides raw logits before softmax:

$$
P_T(w_i) = \frac{\exp((z_i - z_{\max}) / T)}{\sum_{j=1}^{|V|} \exp((z_j - z_{\max}) / T)}
$$

Pairwise odds scale exponentially as $\exp((z_A - z_B) / T)$: for $z_A - z_B = 2.0$, $P(A) / P(B)$ is `7.39x` at $T = 1.0$, `54.60x` at $T = 0.5$, and `3.79x` at $T = 1.5$. Shannon entropy $H(P_T) = -\sum_i P_T(w_i)\log_2 P_T(w_i)$ is monotone nondecreasing in $T$:
- **As $T \to 0^+$:** Mass concentrates on tied top logits (reducing to greedy when unique). Because dividing by zero is undefined, route `temperature = 0` to an explicit greedy branch.[^huggingface2026logits][^vllmSamplingParams2026]
- **As $T \to \infty$:** Unmasked finite logits flatten toward uniform $1/N$, while $-\infty$ masked tokens remain at probability zero.

Always scale every individual token before grouping tail buckets for display: scaling our eight `0.01` tail tokens individually at $T = 1.5$ lifts combined tail mass from `8.0%` to `21.07%` (nearly double the `11.8%` obtained by mistakenly scaling a merged `0.08` bucket):

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

> **Common mistake:** Lowering temperature makes a model more consistent, not more truthful. Positive temperature preserves logit order, so an unsupported leader simply becomes more repeatable.

## Top-k, top-p, and min-p truncation

Temperature leaves tens of thousands of improbable tail tokens with nonzero mass. Truncation filters cut that tail before sampling:

- **<span data-glossary="top-k">Top-k</span>** retains only the $k$ highest-scoring tokens and renormalizes.[^fan2018] On our row, `k = 2` keeps `bright` and `fading` (`0.60` and `0.40`). Its fixed integer ignores confidence: `k = 50` admits noise on sharp factual steps, while `k = 10` clips valid choices on flat creative prompts. Verify tie-breaking across runtimes (Transformers' `TopKLogitsWarper` keeps every token tied at the $k$-th score).
- **Nucleus (top-p)** sorts probabilities descending and keeps the smallest prefix $V_p = \{w_{(1)}, \ldots, w_{(m)}\}$ whose sum reaches threshold $p$:[^holtzman2020]

$$
m = \min \left\{j : \sum_{i=1}^{j} P(w_{(i)}) \ge p \right\}
$$

Nucleus size adapts automatically from one token on peaked steps to dozens on uncertain steps. Its failure mode appears at high temperature ($T > 1$): flattening shifts mass into the long tail and swells the `p = 0.90` nucleus from `3` tokens to `9`.

- **Min-p** retains tokens reaching at least fraction $\rho$ of the leading token's probability:[^nguyen2025]

$$
V_{\min\text{-}p} = \{w : P(w) \geq \rho \cdot \max_v P(v)\}
$$

At $\rho = 0.1$, a confident `0.80` leader sets a steep `0.08` bar while an uncertain `0.05` leader drops it to `0.005`. When applied *after* temperature scaling, the rule rearranges in logit space to $z_i \ge z_{\max} + T \log \rho$, so higher temperature still widens the window (and ordering min-$p$ before vs after $T$ changes survivors). On a uniform distribution, any $\rho \le 1$ retains every token, and controlled reanalyses found no systematic win over well-tuned top-$p$.[^minp_critique2025]

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

| Method | Rule | Adapts to entropy? | Main tradeoff |
|--------|------|--------------------|---------------|
| Top-k | Fixed $k$ tokens | No | Rigid across confident vs uncertain steps |
| Top-p | Cumulative mass $\ge p$ | Yes | High $T$ inflates long tail |
| Min-p | $\rho \times P_{\max}$ | Yes | Still widens with $T$; keeps all uniform ties |

## Repetition, frequency, and presence penalties

CTRL introduced a multiplicative **repetition penalty** $\theta > 1$ (commonly `1.1–1.2`) to break verbatim loops.[^keskar2019] Modern stacks like <span data-glossary="hugging-face-transformers">Transformers</span> use a **sign-aware** rule once per distinct seen token ID: divide positive logits by $\theta$ and multiply negative logits by $\theta$ so every seen token moves downward.[^huggingface2026logits] Unlike softmax, sign-aware scaling is **not shift-invariant**: subtracting $\max(z)$ before applying repetition penalty flips signs and can reverse the argmax winner.

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

Additive **frequency** ($\alpha$) and **presence** ($\beta$) penalties subtract directly from logits using token counts:

$$
\text{logit}_{\text{adjusted}} = \text{logit} - \alpha \cdot \text{count}(\text{token}) - \beta \cdot \mathbb{1}[\text{count}(\text{token}) > 0]
$$

Frequency scales linearly with reuse; presence applies a flat one-time deduction. Because all three operate on raw token IDs without semantic awareness, heavy values can suppress valid code identifiers or mandatory JSON keys.

## Combining strategies and grammar constraints

Serving engines (vLLM, SGLang, TensorRT-LLM) chain logit biases, grammar masks, history penalties, scaling, and truncation in a fixed pipeline. Because these stages **do not commute**, identical scalar knobs can yield different supports across engines. Apply stages in this order: (1) logit biases and $-\infty$ grammar masks, (2) history penalties before centering, (3) `temperature == 0` greedy branch after checking that at least one finite logit survives, (4) temperature scaling, top-$k$, stable softmax, top-$p$/min-$p$, renormalization, and PRNG draw, and (5) `EOS` token ID, multi-token stop string, and `max_tokens` checks.[^huggingface2026logits]

### Grammar-constrained decoding

To enforce regex, JSON Schema, or SQL syntax, constrained decoders pair generation with a finite-state machine or pushdown automaton and mask every invalid vocabulary token to $-\infty$ before softmax:[^willard2023][^xgrammar2024]

$$
z_i \leftarrow \begin{cases}
z_i & \text{if token } i \text{ is a valid grammar transition} \\
-\infty & \text{otherwise}
\end{cases}
$$

Two rules are critical. First, **mask invalid tokens before top-$k$/top-$p$/min-$p$ truncation**: if probabilities are `[0.6, 0.3, 0.1]` and only token `2` is legal, running `top-p = 0.80` first drops token `2` and leaves an empty pool, whereas masking first renormalizes token `2` to `1.0`. Second, syntax enforcement is not factual verification, and local step-by-step masking can distort full-sequence probabilities compared with conditioning on valid complete strings.[^openai_structured_outputs][^grammarAlignedDecoding2024] See [Structured Outputs & Constrained Generation](/learn/structured-output-constrained-generation) for compiled token masks, pushdown automata, and grammar-aligned sampling.

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

### Reproducibility and runtime limits

Setting `temperature = 0` removes randomness and `seed` fixes local PRNG draws, yet batching or GPU reduction changes still flip near-tied logits across servers unless batch-invariant modes (`VLLM_BATCH_INVARIANT=1`) are enabled.[^vllmSamplingParams2026] Hosted reasoning APIs frequently lock or ignore `temperature` and `top_p` when reasoning is active; verify provider docs before running sweeps and rely on prompt grounding and structured schemas when sampling knobs are unavailable.[^openai2026LatestModel][^anthropic2026ApiMigration]

## Choosing settings and troubleshooting

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
| Drift after runtime swap | Processor order or tie-break differs | Verify logit-processor order and distributions |

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
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

Imagine a language model continuing `The autumn light is` across three consecutive requests. One decoder ends immediately with `bright.` Another chooses `fading fast`. A third writes a fresh phrase on every run. Same neural weights, same prompt, same tokenizer: all that changed is the piece of inference code that turns next-token scores into chosen words.

At every step, the forward pass outputs one vector of raw scores (<span data-glossary="logits">logits</span>) across the vocabulary. The decoder converts those logits into probabilities, picks one token, appends it to the prefix, and calls the model again. Because each emitted word alters the conditioning context seen at every future step, small decoding choices compound rapidly across a reply.

Trace every strategy on one transparent twelve-token probability row where each word occupies one token and eight rare tail tokens each hold `0.01` so the row sums cleanly to `1.00`:

| Next token | Probability |
|---|---|
| `bright` | 0.45 |
| `fading` | 0.30 |
| `soft` | 0.15 |
| `pale` | 0.02 |
| eight tail tokens | 0.01 each |

Before turning raw logits into that table, decoders must compute <span data-glossary="softmax">softmax</span> safely. Calling `exp(z)` directly overflows FP16 above `11.1` (`max ≈ 65,504`) and FP32 above `88.7` (`max ≈ 3.4e38`), turning probabilities into `NaN`. Subtracting the maximum logit $m = \max_j z_j$ keeps every exponent $\le 0$ without changing a single probability ratio, and its log-space companion (log-sum-exp, $\log p_i = (z_i - m) - \log \sum_j \exp(z_j - m)$) lets decoders add log-probabilities safely across long sequences without underflowing to zero:[^blanchard2019softmax]

$$
p_i = \frac{\exp(z_i - m)}{\sum_j \exp(z_j - m)}
$$

<!-- leetllm: test, output=show, id=reader-decoding-softmax, deps=numpy -->
```python title="reader-stable-softmax.py"
import numpy as np


def stable_softmax(logits):
    z = np.asarray(logits, dtype=np.float64)
    if not np.isfinite(z).any():
        raise ValueError("all tokens are masked")
    w = np.exp(z - np.max(z))
    return w / w.sum()


for dtype, hi in [(np.float16, 12.0), (np.float32, 90.0)]:
    vec = np.array([hi, hi - 1.0, hi - 2.0], dtype=dtype)
    with np.errstate(over="ignore", invalid="ignore"):
        naive = np.exp(vec) / np.exp(vec).sum()
    print(f"{dtype.__name__:7s} naive={naive.tolist()} | stable={stable_softmax(vec).round(3).tolist()}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
float16 naive=[nan, 0.0, 0.0] | stable=[0.665, 0.245, 0.09]
float32 naive=[nan, nan, 0.0] | stable=[0.665, 0.245, 0.09]
```
<!-- leetllm: output:end -->

Keep one rule in mind before tuning any knob: next-token probabilities measure statistical continuation given the prompt, never external truth. Grounded accuracy comes from verified context and downstream checks, whether you use greedy search or sampling.

## The most likely word can start the wrong sentence

**Greedy decoding** picks the highest-probability token at every step, emitting `bright` right after `The autumn light is`. It needs no randomness, adds negligible latency beyond the forward pass, and works well as a steady baseline for single-label classification or deterministic field extraction.

Its blind spot is a total lack of lookahead. An autoregressive model scores a full sequence by multiplying conditional step probabilities: $P(y_{1:L} \mid x) = \prod_{t=1}^L P(y_t \mid x, y_{<t})$. Maximizing the first factor can still miss the largest final product. Suppose `bright` (`0.45`) continues most likely to `.` (`0.40`), while `fading` (`0.30`) continues decisively to `fast` (`0.90`):

<figure>
  <img src="illustrations/_generated/decoding_strategies_dark.png" alt="Horizontal probability comparison for two-token continuations after The autumn light is. First-step probabilities are bright 0.45, fading 0.30, soft 0.15, and nine tail tokens totaling 0.10. Width-2 beam search retains bright and fading while pruning soft and the tail. Greedy commits to bright followed by period at 0.180, whereas beam search rescues fading followed by fast at 0.270." />
  <figcaption>Greedy decoding commits to <code>bright</code> at step one and never evaluates <code>fading fast</code>. Joint two-token probability puts <code>fading fast</code> (<code>0.270</code>) well ahead of <code>bright .</code> (<code>0.180</code>).</figcaption>
</figure>

On longer generations, greedy argmax also falls into repetition loops whenever an echoed phrase stays the local mode, as Holtzman et al. documented on GPT-2 and the DeepSeek-R1 technical report later noted on unguided greedy reasoning rollouts.[^holtzman2020][^deepseekr1_2025]

## Beam search keeps a second opinion alive

**Beam search** fixes greedy myopia partially by retaining the top $B$ partial sequences at every step instead of discarding runners-up. With width $B = 2$, the decoder keeps both `bright` and `fading`, expands both by one word, and discovers `fading fast` (`0.27`).

<!-- leetllm: test, output=show, id=reader-decoding-paths, deps=numpy -->
```python title="compare-local-and-sequence-choices.py"
import numpy as np

first_words = ["bright", "fading", "soft", "other"]
first_probs = np.array([0.45, 0.30, 0.15, 0.10])
second_probs = {
    "bright": {".": 0.40, "today": 0.35, "now": 0.25},
    "fading": {"fast": 0.90, "slowly": 0.10},
}

greedy_w1 = first_words[int(np.argmax(first_probs))]
greedy_w2 = max(second_probs[greedy_w1], key=second_probs[greedy_w1].get)
greedy_score = first_probs[0] * second_probs[greedy_w1][greedy_w2]

beam_idx = np.argsort(-first_probs, kind="stable")[:2]
paths = [
    (float(first_probs[i]) * prob, f"{first_words[i]} {w2}")
    for i in beam_idx
    for w2, prob in second_probs[first_words[i]].items()
]
beam_score, beam_text = max(paths)
print("greedy:", f"{greedy_w1} {greedy_w2}", f"{greedy_score:.2f}")
print("beam:  ", beam_text, f"{beam_score:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
greedy: bright . 0.18
beam:   fading fast 0.27
```
<!-- leetllm: output:end -->

Beam search still prunes lower-scoring prefixes permanently, and because every extra word adds a negative log-probability term, raw cumulative scores favor short answers that stop early. Google's Neural Machine Translation system divided sequence log-probability by a tunable length term:[^wu2016gnmt]

$$
\text{score}(Y) = \frac{\log P(Y)}{(5 + |Y|)^\alpha / 6^\alpha}
$$

Setting $\alpha = 0$ restores raw log-probability; raising $\alpha$ relieves penalty pressure on longer completions. Run the quick check below to watch `alpha = 0.6` flip a two-token completion in favor of a fuller five-token sentence:

<!-- leetllm: test, output=show, id=reader-decoding-length, deps=numpy -->
```python title="flip-a-ranking-with-length.py"
import numpy as np

texts = ["bright.", "fading across hills now ."]
log_probs = np.array([-1.00, -1.08])
lengths = np.array([2, 5])
norm_scores = log_probs / (((5.0 + lengths) / 6.0) ** 0.6)

print("raw winner:", texts[int(np.argmax(log_probs))])
print("normalized winner:", texts[int(np.argmax(norm_scores))])
print("scores:", [round(float(s), 4) for s in norm_scores])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw winner: bright.
normalized winner: fading across hills now .
scores: [-0.9117, -0.7949]
```
<!-- leetllm: output:end -->

Reserve beam search mainly for tightly conditioned tasks like translation; in open-ended chat, maximizing sequence likelihood tends to produce generic boilerplate while carrying up to $B$ divergent suffix paths in KV-cache memory.[^holtzman2020]

```checkpoint
Why can a width-8 beam search produce short, clipped summaries even when the model knows how to write detailed ones?
---
Each generated token adds a negative log-probability term, so raw cumulative log-probability rewards stopping early at `EOS`. Tuning GNMT length normalization (`alpha`) and checking early-stopping bounds prevents short completions from winning by default.
```

## Sampling and temperature

Instead of searching for one maximum-probability path, **sampling** draws each token randomly in proportion to its probability. **Temperature** $T > 0$ reshapes that distribution by dividing every raw logit before softmax: $p_i(T) = \exp((z_i - z_{\max}) / T) / \sum_j \exp((z_j - z_{\max}) / T)$.

For a logit gap of `2.0`, token $A$ beats $B$ by `7.4x` at $T = 1.0$, surges to `54.6x` at $T = 0.5$, and narrows to `3.8x` at $T = 1.5$:

<figure>
  <img src="illustrations/_generated/sampling_distribution_dark.png" alt="Line chart comparing a twelve-token next-word distribution after The autumn light is across temperatures 0.3, 1.0, and 1.5. Original probabilities are bright 45 percent, fading 30, soft 15, pale 2, and eight 1-percent tail tokens totaling 8 percent. Rescaling all twelve tokens before summing the tail shifts bright from 77.8 percent at T=0.3 to 33.3 percent at T=1.5 while the grouped tail rises from under 0.01 percent to 21.1 percent, with Shannon entropy increasing from 0.86 to 2.09 to 2.75 bits." />
  <figcaption>Each curve rescales all twelve logits before summing the eight rare tail words. Heating from <code>T = 0.3</code> to <code>T = 1.5</code> drops <code>bright</code> from 77.8% to 33.3% while lifting combined tail mass past 21%.</figcaption>
</figure>

Keep three rules straight when tuning temperature:
- **Positive $T$ never changes token rank.** Lowering temperature makes a model more consistent, not more accurate; grounding still comes from context and verification.
- **$T = 0$ is a greedy branch, not division by zero.** Local engines route `temperature = 0` straight to argmax before scaling.[^vllmSamplingParams2026][^huggingface2026logits]
- **Scale individual tokens before grouping tails.** Raising $T$ to `1.5` lifts our eight `0.01` tail words from `8%` to `21.1%` combined.

> **Common mistake:** Treating low temperature as a hallucination fix. Scaling logits by $T > 0$ leaves the top-ranked token untouched, so a wrong leader simply becomes more repeatable.

## Trim the tail: top-k, top-p, and min-p

Sampling over the full vocabulary lets tens of thousands of unlikely words slip in occasionally. Three truncation filters prune weak tail tokens before the draw:

- **Top-k** keeps only the $k$ most likely tokens and renormalizes.[^fan2018] On our row, `k = 2` keeps `bright` and `fading` (`0.60` and `0.40`). Its fixed count ignores confidence: `k = 50` admits clutter when the model is sure, while `k = 10` clips valid choices on open prompts.
- **Top-p (nucleus)** keeps the smallest top prefix whose cumulative probability reaches $p$, then renormalizes.[^holtzman2020] At `p = 0.90`, our row stops at three tokens (`0.45 + 0.30 + 0.15 = 0.90`).
- **Min-p** keeps tokens reaching at least $\rho \cdot P_{\max}$.[^nguyen2025] An `80%` leader sets a `0.08` bar at $\rho = 0.1$, whereas an uncertain `5%` leader drops the bar to `0.005`.

<figure>
  <img src="illustrations/_generated/adaptive_truncation_dark.png" alt="Side-by-side probability bar and cumulative distribution plots comparing peaked (72, 20, 5, 2, 1 percent) and flat (40, 20, 15, 11.5, 3.5, plus ten 1-percent tokens) distributions. Fixed top-k 3 keeps three tokens in both. Top-p 0.90 adapts from two to five tokens via cumulative mass, while min-p 0.10 adapts from two to four tokens by scaling the cutoff from 7.2 percent to 4.0 percent." />
  <figcaption>Fixed <code>top-k = 3</code> keeps three tokens in both regimes. <code>top-p = 0.90</code> adapts from two to five tokens on the flat curve, while <code>min-p = 0.10</code> drops its cutoff from 7.2% to 4.0% and retains four tokens.</figcaption>
</figure>

Watch how temperature interacts with top-$p$: heating shifts mass into the tail and swells the `p = 0.90` nucleus from `2` tokens at `T = 0.3` to `9` tokens at `T = 1.5`:

<!-- leetllm: test, output=show, id=reader-decoding-temperature, deps=torch -->
```python title="watch-the-nucleus-grow-with-temperature.py"
import torch

probs = torch.tensor([0.45, 0.30, 0.15, 0.02] + [0.01] * 8, dtype=torch.float64)
logits = torch.log(probs)


def nucleus_size(values, threshold):
    sorted_vals, _ = torch.sort(values, descending=True)
    cum = torch.cumsum(sorted_vals, dim=0)
    return int(((cum - sorted_vals) < threshold).sum())


for temp in [0.3, 1.0, 1.5]:
    scaled = torch.softmax(logits / temp, dim=0)
    tail = float(scaled[4:].sum())
    print(f"T={temp}: top {float(scaled[0]):.3f}, tail {tail:.3f}, top-p 0.90 keeps {nucleus_size(scaled, 0.90)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
T=0.3: top 0.778, tail 0.000, top-p 0.90 keeps 2
T=1.0: top 0.450, tail 0.080, top-p 0.90 keeps 3
T=1.5: top 0.333, tail 0.211, top-p 0.90 keeps 9
```
<!-- leetllm: output:end -->

Although tail inflation motivated min-$p$, its post-temperature cutoff $z_i \ge z_{\max} + T \ln \rho$ still widens with $T$, and controlled reanalyses found no consistent win over well-tuned top-$p$.[^nguyen2025][^minp_critique2025] Start with top-$p$ and let task benchmarks justify switching.

```checkpoint
An endpoint gives erratic QA answers at `temperature = 1.0`, so you cool it to `0.2`. Answers become highly consistent. What changed, and what did not?
---
Lowering temperature concentrated sampling around the leading tokens, increasing consistency across calls. It did not add factual accuracy because positive temperature preserves token rankings; grounding still requires verified context and downstream checks.
```

## Order, penalties, and grammar masks

Production decoders chain history penalties, grammar masks, temperature, and truncation, and their order changes the output. A sign-aware **repetition penalty** ($\theta = 1.2$) divides positive logits of seen tokens by $\theta$ and multiplies negative logits by $\theta$ so every penalized token drops.[^keskar2019][^huggingface2026logits] Always apply sign-aware repetition penalty *before* subtracting $\max(z)$ for softmax stability, because centering shifts positive logits to zero or negative and flips which branch runs. Additive **frequency** ($\alpha$) and **presence** ($\beta$) penalties instead subtract $\alpha \cdot \text{count}(\text{token}) + \beta \cdot \mathbb{1}[\text{count} > 0]$ directly from logits. Because all three track raw token IDs without understanding syntax, aggressive penalties can suppress valid variable names or required JSON keys.

Starting from `[2.4, 2.1, 1.2, 0.3]` for `["bright", "clear", "warm", "pale"]` when `bright` already appeared, penalty `1.2` pulls `bright` down to `2.0`, handing greedy selection to `clear` (`2.1`), while `top-p = 0.90` retains three words and seed `0` draws `warm`:

<figure>
  <img src="illustrations/_generated/production_sampler_stack_dark.png" alt="Two side-by-side charts showing repetition penalty and top-p truncation order on four tokens: bright, clear, warm, and pale. Left chart shows seen token bright dropping from logit 2.4 to 2.0 under penalty 1.2, placing clear at 2.1 as the new greedy winner. Right chart plots sorted softmax probabilities 0.404, 0.365, 0.164, 0.067 and their cumulative CDF reaching 0.933 at rank 3 warm to cross top-p 0.90, eliminating pale." />
  <figcaption>A <code>1.2</code> repetition penalty pulls <code>bright</code> down from <code>2.4</code> to <code>2.0</code>, handing greedy selection to <code>clear</code> (<code>2.1</code>). Cumulative softmax crosses <code>0.90</code> at <code>warm</code>, cutting <code>pale</code>.</figcaption>
</figure>

To enforce valid JSON, regex, or SQL syntax, **grammar-constrained decoding** masks every syntactically illegal vocabulary token to $-\infty$ before softmax.[^willard2023][^xgrammar2024] Always apply hard grammar masks *before* top-$k$ or top-$p$: truncating first can drop the sole legal token and leave an empty pool. Remember also that syntax enforcement does not verify facts, and local step-by-step masking can distort sequence probabilities relative to conditioning on valid complete strings (for example, if valid completions `A x` and `B y` have step probabilities `0.4 * 0.1 = 0.04` and `0.6 * 0.9 = 0.54`, conditioned probability for `A x` is `0.04 / 0.58 = 0.069`, yet local masking picks `A` at `0.400` and then forces `x`, inflating `A x` nearly sixfold).[^openai_structured_outputs][^grammarAlignedDecoding2024] For compiled token masks and pushdown-automaton decoding, see [Structured Outputs & Constrained Generation](/learn/structured-output-constrained-generation).

<!-- leetllm: test, output=show, id=reader-decoding-stack, deps=torch -->
```python title="run-a-small-sampler-stack.py"
import random
import torch


def sample_next(logits, seen, penalty, temperature, top_p, rng):
    adjusted = logits.clone()
    if seen:
        idx = torch.tensor(sorted(set(seen)), dtype=torch.long)
        adjusted[idx] = torch.where(adjusted[idx] > 0, adjusted[idx] / penalty, adjusted[idx] * penalty)
    if torch.isneginf(adjusted).all():
        raise ValueError("no legal token left")
    if temperature == 0:
        return int(torch.argmax(adjusted))
    probs = torch.softmax(adjusted / temperature, dim=0)
    sorted_p, sorted_idx = torch.sort(probs, descending=True)
    keep = ((torch.cumsum(sorted_p, dim=0) - sorted_p) < top_p) & (sorted_p > 0)
    return rng.choices([int(i) for i in sorted_idx[keep]], weights=[float(w) for w in sorted_p[keep]], k=1)[0]


tokens = ["bright", "clear", "warm", "pale"]
logits = torch.tensor([2.4, 2.1, 1.2, 0.3])
print("greedy:     ", tokens[sample_next(logits, [0], 1.2, 0.0, 0.90, random.Random(0))])
print("seeded draw:", tokens[sample_next(logits, [0], 1.2, 1.0, 0.90, random.Random(0))])

# Grammar mask before truncation preserves token 2 ("green") even though its raw probability is 0.10.
scores = torch.log(torch.tensor([0.60, 0.30, 0.10]))
masked = scores.masked_fill(~torch.tensor([False, False, True]), -torch.inf)
print("grammar-first token:", sample_next(masked, [], 1.0, 1.0, 0.80, random.Random(0)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
greedy:      clear
seeded draw: warm
grammar-first token: 2
```
<!-- leetllm: output:end -->

> **Key insight:** Apply hard grammar masks before probability truncation (`top-k`, `top-p`, `min-p`) so truncation operates on legal tokens instead of discarding the only valid continuation.

## Runtime limits, seeds, and quick troubleshooting

Check checkpoint `EOS` token IDs alongside `max_tokens` so callers separate finished answers from length truncation. Remember that `seed` only fixes PRNG draws after logits arrive: batching and GPU floating-point reduction differences can still flip near-tied logits unless batch-invariant kernels are enabled.[^vllmSamplingParams2026][^openai2026ChatReference] Self-hosted engines expose the entire logit pipeline, whereas hosted reasoning APIs often lock or ignore `temperature`, `top_p`, and `top_k`, exposing reasoning effort and structured output schemas instead.[^openai2026LatestModel][^anthropic2026ApiMigration]

| Task | Temperatures to try | Samplers to try | What to measure |
|---|---|---|---|
| Code generation | 0.0, 0.2, 0.5 | Greedy, top-p 0.95 | Tests passed, valid format |
| Factual questions | 0.0, 0.2, 0.5 | Greedy, top-p 0.90 | Grounded accuracy, unsupported claims |
| Chat | 0.3, 0.7, 1.0 | Top-p 0.90, min-p 0.10 | Helpfulness, repetition |
| Creative writing | 0.7, 1.0, 1.3 | Top-p 0.95, min-p 0.05 | Variety, coherence |

| Symptom | Likely cause | Fix |
|---|---|---|
| `NaN` in custom softmax | Naive `exp(z)` overflowed FP16/FP32 | Subtract `max(z)` before `exp` |
| Crash at `temperature = 0` | Logits divided by zero | Branch to greedy before scaling |
| Lower temperature still hallucinates | Temperature preserves rank without adding facts | Fix retrieval, prompt grounding, or schema checks |
| Creative mode emits odd fragments | High $T$ pushed weak tail tokens into top-$p$ | Lower $T$, tighten top-$p$, or test min-$p$ |
| Empty candidate pool | Truncation ran before grammar mask | Mask invalid tokens to $-\infty$ before truncation |
| Identical knobs changed across engines | Pipeline order or `T = 0` handling differs | Inspect engine logit-processor ordering |

```checkpoint
A distribution assigns `bright` 0.50, `clear` 0.25, `warm` 0.15, `pale` 0.06, and `dim` 0.04. What do greedy, top-k = 2, top-p = 0.85, and min-p = 0.20 retain, and what probability does `bright` reach at T = 0.5?
---
Greedy picks `bright`. Top-k = 2 keeps `bright` and `clear` (`0.67` and `0.33`). Top-p = 0.85 needs `0.50 + 0.25 + 0.15 = 0.90` (three tokens); min-p = 0.20 sets cutoff `0.20 * 0.50 = 0.10` (also three tokens). Halving temperature squares each probability before renormalization, lifting `bright` to `0.25 / 0.3402 ≈ 73.5%`.
```

> **Next:** Continue to [Perplexity & Model Evaluation](/learn/perplexity-language-model-evaluation).
<!-- leetllm: edition:reader:end -->
