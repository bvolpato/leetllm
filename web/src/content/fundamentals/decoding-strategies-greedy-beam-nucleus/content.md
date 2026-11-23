---
{
  "id": "decoding-strategies-greedy-beam-nucleus",
  "title": "Decoding Strategies: Greedy to Nucleus",
  "slug": "decoding-strategies-greedy-beam-nucleus",
  "category": "NLP Fundamentals",
  "difficulty": "Hard",
  "prerequisites": [
    "decoding-algorithms"
  ],
  "coverImage": "illustrations/_generated/decoding_strategies_dark.png",
  "companies": [
    "Google",
    "OpenAI",
    "Meta",
    "Anthropic",
    "Google DeepMind"
  ],
  "shortDescription": "The most likely next token can begin a weaker full sequence. Trace one probability row from greedy decoding through beam search, temperature, and nucleus sampling.",
  "keyConceptsTested": [
    "Greedy decoding as a local argmax rather than global sequence search",
    "Beam search with length penalty: structured tasks",
    "Temperature scaling: controls distribution sharpness mathematically",
    "Top-k sampling: fixed vocabulary truncation",
    "Top-p (nucleus) sampling: dynamic cumulative probability threshold",
    "Min-p as a confidence-scaled truncation variant",
    "Top-p weakness at high temperatures (long tail problem)",
    "Repetition and frequency/presence penalties",
    "Sampler order is implementation-specific across inference stacks",
    "Sequence likelihood is not a measure of factual or human-rated quality"
  ],
  "section": "Transformer Deep Dives",
  "order": 8
}
---

<!-- leetllm: edition:reference:start -->

Suppose an autoregressive language model receives the prefix `The autumn light is` and must choose how to continue the sentence. At each step, the <span data-glossary="transformer">transformer</span> outputs raw scores over its entire vocabulary, not a finished sentence, leaving the decoder to pick one <span data-glossary="token">token</span> at a time from those scores and feed it back into the context for the next step. Because each chosen token alters the conditioning prefix seen at every subsequent step, the decoding rule quietly determines whether a model repeats itself, stays concise, explores diverse phrasing, or drifts into nonsense.

The four-token probability row in the table above makes these trade-offs concrete before writing a single line of code. Each word occupies a single token slot, and the eight remaining tokens each contribute one percent so that cumulative probability sums cleanly to one. Watching how greedy argmax and stochastic sampling diverge on this single step illustrates why decoding policy controls fluency and diversity independently of model weights.

| Token | Probability | Plausible continuation |
|-------|-------------|------------------------|
| `bright` | 0.45 | `bright .` |
| `fading` | 0.30 | `fading fast` |
| `soft` | 0.15 | `soft gold` |
| `pale` | 0.02 | rare adjective |
| tail | 0.08 | eight rare tokens at 0.01 each |

Under greedy decoding, the decoder immediately commits to `bright` because 0.45 wins step one. Under stochastic sampling, the decoder could instead draw `fading` and follow it into `fading fast`, or draw `soft` and reach `soft gold`. Even though the prompt, tokenizer, and neural weights remain identical, the decoding policy reshapes the generated text because it governs how much probability mass stays eligible at each branch. For example, <span data-glossary="top-p">top-p sampling</span> at `p = 0.90` retains tokens until their sorted probabilities reach 0.90 (`0.45 + 0.30 + 0.15 = 0.90`), renormalizing `bright`, `fading`, and `soft` to `0.50`, `0.333...`, and `0.166...` while cutting `pale` and the entire eight-token tail. Whether an engine uses `>=` or `>` when checking the cutoff changes both the surviving candidate pool and the final sampling weights whenever a sum hits the threshold cleanly.

<!-- leetllm: audience:website:start -->The earlier [decoding algorithms](/learn/decoding-algorithms) lesson built numerically stable <span data-glossary="softmax">softmax</span> probabilities from raw next-token scores (<span data-glossary="logits">logits</span>). This lesson tracks how greedy decoding, beam search, temperature, truncation filters, and repetition penalties transform that same vector of probabilities and interact inside modern inference engines.<!-- leetllm: audience:website:end --><!-- leetllm: audience:book:start -->The online companion's [Decoding Algorithms](/learn/decoding-algorithms) lesson derives numerically stable <span data-glossary="softmax">softmax</span> probabilities from raw next-token scores (<span data-glossary="logits">logits</span>). This chapter tracks how greedy decoding, beam search, temperature, truncation filters, and repetition penalties transform that vector of probabilities and interact inside modern inference engines.<!-- leetllm: audience:book:end -->

When serving latency matters, <span data-glossary="speculative-decoding">speculative decoding</span> pairs a fast draft model with parallel verification by the target model. An exact rejection-sampling verifier preserves the target model's full sampling distribution after all active logit processors and filters run, though it does not guarantee matching the exact pseudo-random token stream produced without speculation. Approximate verification drops that exact distributional equivalence in exchange for higher acceptance speed.[^leviathan2023]

<figure>
  <img src="illustrations/_generated/decoding_strategies_dark.png" alt="Horizontal probability comparison for two-token continuations after The autumn light is. First-step probabilities are bright 0.45, fading 0.30, soft 0.15, and nine tail tokens totaling 0.10. Width-2 beam search retains bright and fading while pruning soft and the tail. Greedy commits to bright followed by period at 0.180, whereas beam search rescues fading followed by fast at 0.270." />
  <figcaption>Each terminal score multiplies the first-step probability by its conditional continuation probability. Beam width 2 keeps `fading` alive, allowing `fading fast` at 0.270 to outscore greedy's `bright .` at 0.180.</figcaption>
</figure>

## Greedy decoding

```checkpoint
Why can greedy decoding miss the highest-probability sequence even though it picks the top token at every step?
---
Greedy decoding optimizes only one conditional factor at a time without lookahead. A slightly lower-scoring first token can unlock a near-certain continuation whose joint product exceeds the path starting from the step-one mode. Neither local nor sequence likelihood proves factual correctness, which requires grounding outside the sampler.
```

To see why local optimality diverges from global sequence likelihood, compare two-token continuations after `The autumn light is`. Suppose `bright` (0.45) branches evenly across `.` (0.40), `today` (0.35), and `now` (0.25), while `fading` (0.30) concentrates sharply on `fast` (0.90) versus `slowly` (0.10). Checking each branch's conditional next-step probabilities makes the joint comparison immediate.

| Path | First token | Continuation | Sequence probability |
|------|-------------|--------------|----------------------|
| `bright .` | 0.45 | 0.40 | 0.18 |
| `fading fast` | 0.30 | 0.90 | 0.27 |

Greedy argmax commits to `bright` at step one and never evaluates any branch starting from `fading`. Multiplying each conditional step along the path confirms that `fading fast` achieves fifty percent higher two-token probability (`0.27` vs `0.18`). Running this calculation in NumPy verifies both the step-one greedy choice and the winning two-token sequence.

<!-- leetllm: test, id=decoding-paths, output=show, output_title="Local versus sequence score", deps=numpy -->
```python title="greedy-can-miss-higher-scoring-sequence.py"
import numpy as np

vocab = [
    "bright",
    "fading",
    "soft",
    "pale",
    "crisp",
    "dim",
    "low",
    "cool",
    "warm",
    "still",
    "sharp",
    "faint",
]
first_probs = np.array([0.45, 0.30, 0.15, 0.02] + [0.01] * 8)

continuations = {
    "bright": {".": 0.40, "today": 0.35, "now": 0.25},
    "fading": {"fast": 0.90, "slowly": 0.10},
    "soft": {"gold": 0.70, "gray": 0.30},
}
for token in vocab:
    if token not in continuations:
        continuations[token] = {".": 1.0}

greedy_first = vocab[int(np.argmax(first_probs))]
path_scores = {
    f"{prefix} {next_tok}": float(prob * cond_prob)
    for prefix, prob in zip(vocab, first_probs)
    for next_tok, cond_prob in continuations[prefix].items()
}
highest_sequence = max(path_scores, key=path_scores.get)

print(f"greedy first token: {greedy_first}")
print(
    "selected paths:",
    {k: round(path_scores[k], 3) for k in ["bright .", "fading fast"]},
)
print(f"higher-probability sequence: {highest_sequence}")

assert greedy_first == "bright"
assert highest_sequence == "fading fast"
assert path_scores["fading fast"] > path_scores["bright ."]
```

<!-- leetllm: output:start -->
```text title="Local versus sequence score" output compact
greedy first token: bright
selected paths: {'bright .': 0.18, 'fading fast': 0.27}
higher-probability sequence: fading fast
```
<!-- leetllm: output:end -->

### The myopic trap and likelihood collapse

At each autoregressive step, greedy decoding selects the immediate argmax across the entire vocabulary:

$$
w_t = \arg\max_{w \in V} P(w \mid w_{<t})
$$

Because greedy search maintains no alternative prefixes, it behaves like width-one beam search when ranking uncompleted prefixes without separate hypothesis queues. Once the transformer forward pass computes logits, selecting the top index costs $O(|V|)$ time per step without random draws or backtracking. Given bit-identical logits and a fixed tie-breaking convention, greedy decoding emits a deterministic token sequence, though reproducible logits across requests also depend on consistent serving kernels and batching.

The chain rule of probability explains why step-by-step maximization misses stronger complete sequences:

$$
P(w_1, w_2, \ldots, w_T) = \prod_{t=1}^T P(w_t \mid w_{<t})
$$

Maximizing an individual factor $P(w_t \mid w_{<t})$ ignores how sharply later steps concentrate their mass. In our example, picking the second-best token at step one unlocks a high-confidence continuation (`0.30 * 0.90 = 0.27`) that beats every continuation available after `bright` (`0.45 * 0.40 = 0.18`). For single-label classification or deterministic key extraction, low variance makes greedy decoding a clean baseline, provided structured decoding constraints validate required schemas separately.

For open-ended generation, maximizing likelihood often turns text bland or repetitive. Holtzman et al. showed in GPT-2 experiments that likelihood-maximizing decoding easily falls into repetitive loops once a recurring phrase becomes the local mode.[^holtzman2020] That observation does not trace every repetition loop to a single universal attention failure, nor does it guarantee that sampling never loops, since aggressive truncation or narrow prompts can also trap a stochastic sampler. Similarly, the DeepSeek-R1 report noted higher repetition and stronger checkpoint-to-checkpoint variance when decoding long chain-of-thought rollouts greedily, leading them to estimate pass@1 from repeated samples at $T = 0.6$ and $p = 0.95$.[^deepseekr1_2025]

## Beam search

Whereas greedy decoding tracks a single hypothesis, beam search keeps $B$ active prefixes at every step, expands each survivor across its top candidates, and retains only the best $B$ extended prefixes. Carrying multiple hypotheses lets a weaker initial token stay alive long enough to reveal a decisive second or third step. Running width $B = 2$ on `The autumn light is` shows explicitly which first-step tokens survive pruning and which two-token path takes the lead.

Because pruned prefixes can never re-enter the candidate pool later, beam search remains an approximate search algorithm rather than exact optimization. Exact global search would track up to $|V|^T$ branches across length $T$, growing exponentially out of reach even for tiny vocabularies. When ranking same-length prefixes strictly by cumulative log-probability with deterministic tie-breaking, expanding only the top $B$ children per parent already recovers the global top $B$ extensions among active beams, because a parent's $(B+1)$-th child is strictly dominated by its first $B$ siblings. Finished-hypothesis quotas and diversity penalties alter that invariant and require keeping extra beams.

The NumPy walkthrough below verifies each surviving hypothesis and joint sequence probability explicitly:

<!-- leetllm: test, continue=decoding-paths, output=show, output_title="Width-2 beam recovers the better path" -->
```python title="two-step-beam-search.py"
beam_width = 2
top_indices = np.argsort(-first_probs, kind="stable")[:beam_width]
step_one = [(vocab[idx], float(first_probs[idx])) for idx in top_indices]

step_two = []
for prefix, prefix_prob in step_one:
    for next_tok, cond_prob in continuations[prefix].items():
        step_two.append((f"{prefix} {next_tok}", prefix_prob * cond_prob))

step_two.sort(key=lambda item: item[1], reverse=True)
best_greedy_next = max(continuations[greedy_first], key=continuations[greedy_first].get)
greedy_path = f"{greedy_first} {best_greedy_next}"

print(f"beam after step 1: {step_one}")
print(
    "beam after step 2:",
    [(text, round(score, 3)) for text, score in step_two[:beam_width]],
)
print(f"greedy path: {greedy_path}")
print(f"beam winner: {step_two[0][0]}")

assert [tok for tok, _ in step_one] == ["bright", "fading"]
assert greedy_path == "bright ."
assert step_two[0][0] == "fading fast"
```

<!-- leetllm: output:start -->
```text title="Width-2 beam recovers the better path" output compact
beam after step 1: [('bright', 0.45), ('fading', 0.3)]
beam after step 2: [('fading fast', 0.27), ('bright .', 0.18)]
greedy path: bright .
beam winner: fading fast
```
<!-- leetllm: output:end -->

Keeping `fading` (0.30) alongside `bright` (0.45) at step one lets the width-2 search prune `soft` (0.15) and still uncover `fading fast` (0.27) at step two. Even width 2 can still miss the global optimum, however, if both retained prefixes split their step-two probability across ten alternatives (`0.045` and `0.030`) while pruned `soft` would have continued deterministically into `gold` (`0.15`). Note also that this short example stops at length two without scoring an end-of-sequence (`EOS`) token, whereas full autoregressive decoders must score `EOS` explicitly and track whether truncated hypotheses are eligible when search hits its step limit.

### Length penalty

Because probabilities lie in $[0, 1]$, adding another token multiplies the running sequence probability by a factor at most 1 and adds a negative (or zero) term to cumulative log-probability. Left uncorrected, raw cumulative log-probability inherently rewards shorter completions that emit `EOS` early, even when a longer sentence fits much better overall. To counter short-sequence bias, Google's Neural Machine Translation (GNMT) system divided sequence log-probability by a smooth length factor:

$$
\text{score}(Y) = \frac{\log P(Y)}{(5 + |Y|)^\alpha / 6^\alpha}
$$

Setting $\alpha = 0$ reduces the denominator to 1 and restores raw unnormalized log-probability, while larger $\alpha$ reduces penalty pressure on longer sequences. While GNMT initially explored $\text{length}^\alpha$ around `0.6–0.7` and reported `alpha = 0.2` alongside a separate coverage penalty in its final system, no value acts as a universal optimum.[^wu2016gnmt] Tune $\alpha$ on validation metrics matching your stopping convention and token counting rule (here $|Y|$ counts output tokens before `EOS`). The example below compares two completed sentences under `alpha = 0.6` to show how length normalization flips the preference toward the fuller completion:

<!-- leetllm: test, output=show, output_title="Length-normalized ranking", deps=numpy -->
```python title="beam-length-normalization.py"
import numpy as np

alpha = 0.6
texts = ["bright.", "fading across hills now ."]
log_probs = np.array([-1.00, -1.08])
lengths = np.array([2, 5])

length_penalties = ((5.0 + lengths) / 6.0) ** alpha
normalized_scores = log_probs / length_penalties

raw_winner = texts[int(np.argmax(log_probs))]
norm_winner = texts[int(np.argmax(normalized_scores))]
print(f"raw sequence score chooses: {raw_winner}")
print(f"length-normalized score chooses: {norm_winner}")
print("normalized scores:", [round(float(s), 4) for s in normalized_scores])

assert raw_winner == "bright."
assert norm_winner == "fading across hills now ."
```

<!-- leetllm: output:start -->
```text title="Length-normalized ranking" output compact
raw sequence score chooses: bright.
length-normalized score chooses: fading across hills now .
normalized scores: [-0.9117, -0.7949]
```
<!-- leetllm: output:end -->

```checkpoint
A summarization model decoded with beam width 8 repeatedly emits terse one-line fragments instead of full summaries. Which parts of the decoder configuration should you inspect first?
---
Check length normalization (`alpha`), `EOS` token scores, early-stopping bounds, and maximum output limits before suspecting the weights. Unnormalized log-probability favors premature `EOS`, and length-normalized beam scores can actually increase upon extension, invalidating naive early-stop conditions that assume scores fall monotonically.
```

### Better model score, worse answer

Tightly constrained tasks such as machine translation benefit from searching for high-probability translations conditioned on the source sentence. For open-ended dialogue, creative writing, or verifiable code synthesis, higher model probability does not reliably correlate with human preference or correctness, because valid creative or algorithmic outputs often carry lower sequence probability than safe clichés. Holtzman et al. documented that wide beams often collapse onto generic phrasing or premature termination on GPT-2.[^holtzman2020] Meister et al. later interpreted beam search through an entropy-regularized objective, linking its uniform-surprisal behavior to BLEU gains in translation while underscoring that beam width should be selected by task-level evaluation rather than raw likelihood.[^meister2020]

Wider beams also trade away serving throughput in nuanced ways. At each step, width-$B$ search tracks up to $B$ active prefixes whose shared prompt prefix can reuse paged <span data-glossary="kv-cache">KV-cache</span> memory while divergent suffixes consume additional batch slots and compute. Larger beam width does not imply monotonically rising downstream accuracy or $B\times$ wall-clock slowdown; both require measuring on the target batching runtime. Finally, remember that length normalization changes stopping bounds: with $\alpha = 0.6$, a 1-token prefix scoring $-1.0$ rises to $-0.921$ when extended by a token of probability `0.99`, so early-stopping rules must account for upward score drift.

## Temperature scaling

Beam search optimizes sequence probability deterministically, whereas sampling lets calibrated randomness determine which continuations get explored. Modeled after the Boltzmann distribution $\exp(-E_i / (k_B T))$, <span data-glossary="temperature">temperature</span> $T > 0$ rescales raw logits $z_i$ before softmax without adding noise itself, leaving the categorical draw to supply randomness: $P(w_i) = \exp(z_i / T) / \sum_{j=1}^{|V|} \exp(z_j / T)$. Dividing logits by $T$ controls pairwise competition exponentially through the log-odds ratio $\exp((z_A - z_B) / T)$.

When $z_A - z_B = 2.0$, changing $T$ shifts how heavily token $A$ dominates $B$: at $T = 1.0$, $P(A)/P(B) = \exp(2.0) \approx 7.39$; cooling to $T = 0.5$ raises the odds ratio over sevenfold to $\exp(4.0) \approx 54.60$; warming to $T = 1.5$ compresses the ratio down to $\exp(1.33) \approx 3.79$. To quantify this global spread across the entire vocabulary, examine Shannon entropy $H(P) = -\sum_{i=1}^{|V|} P(w_i) \log_2 P(w_i)$:
- **As $T \to 0^+$:** Mass concentrates evenly on the $r$ tied maximum logits, driving $P(w_i) \to \mathbf{1}[z_i = z_{\max}]/r$ and entropy to $\log_2 r$. When a single unique top logit exists, this limit reduces to greedy choice; when ties occur, a random draw differs from deterministic tie-breaking.
- **As $T \to \infty$:** Over any set of $N$ finite, unmasked logits, probabilities flatten toward the uniform $1/N$ distribution with entropy approaching $\log_2 N$. Tokens masked to $-\infty$ remain impossible regardless of how large $T$ grows.

For fixed finite logits, entropy is monotone nondecreasing in $T$ because $\frac{dH}{dT} = \operatorname{Var}_{P_T}(z) / T^3 \ge 0$ in nats. Keeping $T = 1$ leaves the model's trained logit scale untouched, though temperature alone cannot calibrate factual accuracy on downstream tasks. Returning to the `The autumn light is` distribution (`0.45, 0.30, 0.15, 0.02`, plus eight rare tokens at `0.01` each), notice a subtle aggregation error to avoid: raising already-grouped probabilities to $1/T$ fails because scaling must happen on every individual token event before summing tail buckets. When all twelve tokens are scaled properly at $T = 1.5$, the eight tail tokens grow collectively from `8.0%` to `21.07%` (nearly three times larger than the mistaken `11.8%` from scaling a single `0.08` bucket):

| Token | $T = 0.3$ | $T = 1.0$ | $T = 1.5$ |
|-------|-----------|-----------|-----------|
| `bright` | 0.7785 | 0.45 | 0.3331 |
| `fading` | 0.2015 | 0.30 | 0.2542 |
| `soft` | 0.0200 | 0.15 | 0.1602 |
| `pale` | 0.000024 | 0.02 | 0.0418 |
| eight-token tail | 0.000019 | 0.08 | 0.2107 |
| entropy $H$ (bits, twelve tokens) | 0.86 | 2.09 | 2.75 |

In practice, compute scaled softmax safely in log space by subtracting the largest unmasked logit $(z_i - z_{\max}) / T$ before exponentiating, avoiding overflow even when logits reach hundreds. Because $T = 0$ triggers division by zero, decoders must treat `temperature=0` as an explicit greedy branch before calling softmax scaling. In Hugging Face Transformers, greedy decoding selects `do_sample=False` alongside `num_beams=1`, whereas the sampling temperature warper strictly requires a positive value.[^huggingface2026logits]

<!-- leetllm: test, output=show, output_title="Scale twelve tokens before grouping the tail", deps=torch -->
```python title="temperature-reshapes-probability.py"
import torch

base_probs = torch.tensor([0.45, 0.30, 0.15, 0.02] + [0.01] * 8, dtype=torch.float64)
logits = torch.log(base_probs)


def apply_temperature(raw_logits, temperature):
    if temperature <= 0:
        raise ValueError("temperature must be positive; route T=0 to greedy argmax")
    return torch.softmax(raw_logits / temperature, dim=-1)


def entropy_bits(probs):
    nonzero = probs[probs > 0]
    return float(-(nonzero * torch.log2(nonzero)).sum())


low_t = apply_temperature(logits, 0.3)
high_t = apply_temperature(logits, 1.5)
for temp, dist in [(0.3, low_t), (1.5, high_t)]:
    grouped = [float(x) for x in dist[:4]] + [float(dist[4:].sum())]
    print(f"T={temp}:", [round(x, 6) for x in grouped])

print(
    "entropy bits:",
    round(entropy_bits(low_t), 3),
    round(entropy_bits(base_probs), 3),
    round(entropy_bits(high_t), 3),
)

assert round(float(low_t[0]), 4) == 0.7785
assert round(float(high_t[0]), 4) == 0.3331
assert entropy_bits(low_t) < entropy_bits(base_probs) < entropy_bits(high_t)

try:
    apply_temperature(logits, 0.0)
except ValueError as err:
    print("zero temperature:", err)
```

<!-- leetllm: output:start -->
```text title="Scale twelve tokens before grouping the tail" output compact
T=0.3: [0.778468, 0.201498, 0.019991, 2.4e-05, 1.9e-05]
T=1.5: [0.333144, 0.254237, 0.160159, 0.0418, 0.210659]
entropy bits: 0.861 2.094 2.751
zero temperature: temperature must be positive; route T=0 to greedy argmax
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/sampling_distribution_dark.png" alt="Line chart comparing a twelve-token next-word distribution after The autumn light is across temperatures 0.3, 1.0, and 1.5. Original probabilities are bright 45 percent, fading 30, soft 15, pale 2, and eight 1-percent tail tokens totaling 8 percent. Rescaling all twelve tokens before summing the tail shifts bright from 77.8 percent at T=0.3 to 33.3 percent at T=1.5 while the grouped tail rises from under 0.01 percent to 21.1 percent, with Shannon entropy increasing from 0.86 to 2.09 to 2.75 bits." />
  <figcaption>Each curve rescales all twelve logits before summing the eight rare tail tokens. Raising temperature from 0.3 to 1.5 flattens the mode and lifts combined tail mass above 21%.</figcaption>
</figure>

Lower temperature tightens sampling around top logits, while higher temperature flattens the curve and preserves long-tail options. Because temperature affects every step uniformly without consulting retrieved context or factual truth, match candidate sweeps carefully to each task slice rather than using one global value everywhere. Evaluating accuracy, validity, and repetition side by side exposes where extra entropy helps versus where it injects errors.

| Evaluation slice | Temperature candidates | What to measure |
|------------------|------------------------|-----------------|
| Code generation | 0.0, 0.2, 0.5 | Tests passed, format validity, diversity |
| Factual QA | 0.0, 0.2, 0.5 | Grounded accuracy and unsupported claims |
| General assistant dialogue | 0.3, 0.7, 1.0 | Helpfulness, repetition, instruction adherence |
| Creative writing | 0.7, 1.0, 1.3 | Novelty, coherence, tone consistency |

```checkpoint
Why is a single global temperature setting problematic across mixed tasks?
---
Tasks penalize variance differently: deterministic classification or factual QA benefits from low temperature paired with retrieval grounding, whereas creative writing trades focus for lexical variety. Tune temperature against held-out task metrics for each slice rather than applying one preset everywhere.
```

## Top-k sampling

Temperature reshapes probabilities but still assigns non-zero probability to all tens of thousands of tokens in the vocabulary. <span data-glossary="top-k">Top-k</span> sampling, popularized for neural story generation by Fan et al., removes the long tail by keeping only the $k$ highest-scoring tokens and renormalizing over that reduced support.[^fan2018] On our `The autumn light is` distribution, setting $k = 2$ retains only `bright` (`0.45`) and `fading` (`0.30`), renormalizing them to `0.60` and `0.40`.

Notice an important implementation detail around ties. A strict count implementation retains exactly $k$ tokens sorted by score and index order, whereas Transformers' `TopKLogitsWarper` keeps all tokens tied at or above the $k$-th score threshold (`[2, 2, 2, 0]` with `k = 1` keeps three tokens). Verify your runtime's tie behavior when benchmarking deterministic edge cases.

The deeper limitation of top-$k$ is that a fixed token count ignores how confident the model actually is on a given prefix. A narrow factual completion (`The capital of France is`) might concentrate 98% of mass on one or two tokens, so `k = 50` admits forty-eight irrelevant tail words whenever high temperature gives them non-negligible weight. Conversely, on an open creative prompt (`The opening chapter begins`), dozens of reasonable continuations may share mass smoothly, so `k = 10` clips valid choices too early.

| Context | Distribution shape | Candidate $k$ values to evaluate |
|---------|-------------------|----------------------------------|
| `The capital of Portugal is` | Sharp peak | 1, 3, 10 |
| `The opening chapter begins` | Flat multi-way continuation | 10, 30, 50 |
| `The function returns` | Prompt-dependent | Measure across validation slices |

```checkpoint
Why does fixed top-k behave inconsistently across confident and uncertain steps?
---
Top-k keeps a rigid integer count regardless of entropy. On peaked steps, moderate k retains weak tail noise; on flat steps, small k prematurely cuts valid continuations. Adaptive methods scale support size with distribution shape instead.
```

<!-- leetllm: test, deps=torch -->
```python title="top-k-vs-top-p-survivors.py"
import torch

tokens = ["bright", "fading", "soft", "warm", "clear", "pale", "dim"]
probs = torch.tensor([0.45, 0.30, 0.15, 0.04, 0.03, 0.02, 0.01])

_, top_k_idx = torch.topk(probs, k=2)
top_k_kept = [tokens[int(i)] for i in top_k_idx]

sorted_probs, sorted_idx = torch.sort(probs, descending=True)
cum_probs = torch.cumsum(sorted_probs, dim=0)
cutoff_mask = cum_probs - sorted_probs < 0.80
top_p_kept = [tokens[int(i)] for i in sorted_idx[cutoff_mask]]

assert top_k_kept == ["bright", "fading"]
assert top_p_kept == ["bright", "fading", "soft"]
```

## Nucleus (top-p) sampling

To solve top-$k$'s fixed-count blindness, Holtzman et al. proposed nucleus (top-$p$) sampling, shifting the truncation criterion from "how many tokens?" to "how much probability mass?".[^holtzman2020] Sorting tokens in decreasing order of probability, nucleus sampling takes the smallest prefix $V_p = \{w_{(1)}, \ldots, w_{(m)}\}$ whose cumulative probability reaches at least threshold $p$:

$$
m = \min \left\{j : \sum_{i=1}^{j} P(w_{(i)}) \ge p \right\}
$$

Once $V_p$ is identified, probabilities outside the nucleus are zeroed (or masked to $-\infty$ before softmax), and surviving tokens are divided by their summed mass so the pool sums to 1. On `The autumn light is`, setting `p = 0.80` selects `bright`, `fading`, and `soft` (reaching cumulative mass `0.90` at `soft`) and renormalizes them to `0.500`, `0.333`, and `0.167`.

<!-- leetllm: test, output=show, output_title="Nucleus renormalization", deps=numpy -->
```python title="nucleus-renormalization.py"
import numpy as np

tokens = ["bright", "fading", "soft", "pale"] + [f"rare{i}" for i in range(8)]
probs = np.array([0.45, 0.30, 0.15, 0.02] + [0.01] * 8)
threshold = 0.80

order = np.argsort(-probs, kind="stable")
sorted_probs = probs[order]
cum_before = np.cumsum(sorted_probs) - sorted_probs
keep = (cum_before < threshold) & (sorted_probs > 0)

kept_idx = order[keep]
kept_probs = probs[kept_idx]
kept_probs = kept_probs / kept_probs.sum()

rounded = [(tokens[int(i)], round(float(p), 3)) for i, p in zip(kept_idx, kept_probs)]
print("renormalized nucleus:", rounded)

assert rounded == [("bright", 0.5), ("fading", 0.333), ("soft", 0.167)]
assert round(float(kept_probs.sum()), 3) == 1.0
```

<!-- leetllm: output:start -->
```text title="Nucleus renormalization" output compact
renormalized nucleus: [('bright', 0.5), ('fading', 0.333), ('soft', 0.167)]
```
<!-- leetllm: output:end -->

With fixed `p = 0.90`, the effective candidate count fluctuates smoothly across distributions from single-word peaks to flat tails. A confident distribution reaches ninety percent in one word, whereas an uncertain distribution admits half a dozen contenders automatically. Comparing the three regimes below highlights how mass adapts without changing hyperparameters.

| Sorted probabilities | Smallest prefix reaching 0.90 | Survivors |
|----------------------|-------------------------------|-----------|
| 0.92, 0.04, 0.02, 0.01, 0.01 | 0.92 | 1 |
| 0.45, 0.30, 0.15, 0.07, 0.03 | 0.45 + 0.30 + 0.15 = 0.90 | 3 |
| 0.22, 0.19, 0.17, 0.15, 0.13, 0.08, 0.06 | 0.94 | 6 |

### The long-tail failure at high $T$

Nucleus sampling struggles when paired with high temperature ($T > 1$). Raising temperature shifts mass out of the top modes and spreads it across thousands of weak tail tokens, forcing a $p = 0.90$ nucleus to swell and admit individually implausible words. Checking the PyTorch experiment below quantifies how temperature widens nucleus support even on six logits.

```checkpoint
Why can top-p still pull in low-quality tail tokens at high temperature?
---
Temperature flattening transfers mass from dominant tokens into the long tail. Because top-p integrates cumulative probability up to threshold p, flattening pushes hundreds of individually unlikely tokens into the kept set before reaching 90% cumulative mass.
```

<!-- leetllm: test, output=show, output_title="Temperature changes nucleus size", deps=torch -->
```python title="temperature-expands-a-nucleus.py"
import torch

logits = torch.tensor([4.0, 2.0, 1.0, 0.0, -0.5, -1.0])


def nucleus_size(raw_logits, temperature, p=0.90):
    probs = torch.softmax(raw_logits / temperature, dim=0)
    sorted_probs, _ = torch.sort(probs, descending=True)
    cum = torch.cumsum(sorted_probs, dim=0)
    return int((cum - sorted_probs < p).sum())


focused = nucleus_size(logits, temperature=0.7)
flattened = nucleus_size(logits, temperature=1.5)
print(f"nucleus size at T=0.7: {focused}")
print(f"nucleus size at T=1.5: {flattened}")

assert focused == 1
assert flattened == 3
assert flattened > focused
```

<!-- leetllm: output:start -->
```text title="Temperature changes nucleus size" output compact
nucleus size at T=0.7: 1
nucleus size at T=1.5: 3
```
<!-- leetllm: output:end -->

## Beyond nucleus: min-p

Min-p addresses top-$p$'s high-temperature tail problem by comparing every candidate against the peak probability rather than targeting a fixed cumulative sum. Proposed by Nguyen et al., min-$p$ retains every token whose probability is at least a fraction $\rho$ of the most probable token:[^nguyen2025]

$$
V_{\min\text{-}p} = \{w : P(w) \geq \rho \cdot \max_v P(v)\}
$$

When the model is highly confident ($P_{\max} = 0.80$) and $\rho = 0.1$, every token below `0.08` gets pruned cleanly regardless of how much collective tail mass remains. When uncertainty is high ($P_{\max} = 0.05$), the bar drops proportionally to `0.005`, widening exploration automatically:

| Scenario | Top-p ($p = 0.9$) | Min-p ($\rho = 0.1$) |
|----------|-------------------|----------------------|
| Model confident ($P_{\max} = 0.80$) | Collects tokens until reaching 90% mass, risking a tail | Drops every candidate below $0.08$ |
| Model uncertain ($P_{\max} = 0.05$) | Keeps expanding until cumulative mass reaches 90% | Lowers admission cutoff to $P \ge 0.005$ |
| High temperature ($T = 1.5$) | Flattened long tail can inflate support | Relative threshold scales with the peak |

The side-by-side plots below contrast fixed top-$k$, cumulative top-$p$, and peak-relative min-$p$ on a peaked distribution versus a flatter distribution whose 10% tail splits across ten 1% tokens. Notice how the cumulative curve crosses `0.90` at rank two on the peaked row and exactly at rank five on the flat row. Meanwhile, scaling the cutoff relative to the peak shifts the min-$p$ threshold downward from `7.2%` to `4.0%`.

<figure>
  <img src="illustrations/_generated/adaptive_truncation_dark.png" alt="Side-by-side probability bar and cumulative distribution plots comparing peaked (72, 20, 5, 2, 1 percent) and flat (40, 20, 15, 11.5, 3.5, plus ten 1-percent tokens) distributions. Fixed top-k 3 keeps three tokens in both. Top-p 0.90 adapts from two to five tokens via cumulative mass, while min-p 0.10 adapts from two to four tokens by scaling the cutoff from 7.2 percent to 4.0 percent." />
  <figcaption>Fixed `top-k = 3` keeps three tokens regardless of shape. `top-p = 0.90` expands from two to five tokens on the flat curve, while `min-p = 0.10` lowers its probability bar from 7.2% to 4.0% and retains four tokens.</figcaption>
</figure>

The NumPy function below evaluates min-$p$ filtering across both a peaked context (`bright` at 0.80) and a flat multi-option context (`bright` at 0.05). Running the assertions confirms that the relative threshold narrows the pool down to two words when confident while expanding automatically when mass spreads across alternatives. Try changing `rho` to see how smoothly the surviving set tracks peak confidence.

<!-- leetllm: test, deps=numpy -->
```python title="min-p-tracks-the-peak.py"
import numpy as np


def min_p_tokens(tokens, probs, rho):
    threshold = rho * probs.max()
    kept = probs >= threshold
    return [tok for tok, ok in zip(tokens, kept) if ok]


confident_toks = ["bright", "fading", "pale"] + [f"rare{i}" for i in range(10)]
confident_probs = np.array([0.80, 0.09, 0.01] + [0.01] * 10)

uncertain_toks = ["bright", "fading", "soft"] + [f"rare{i}" for i in range(220)]
uncertain_probs = np.array([0.05, 0.04, 0.03] + [0.004] * 220)

assert min_p_tokens(confident_toks, confident_probs, rho=0.1) == ["bright", "fading"]
assert min_p_tokens(uncertain_toks, uncertain_probs, rho=0.1) == ["bright", "fading", "soft"]
```

Treat min-$p$ as one competitive candidate to benchmark empirically rather than a universal default. While Nguyen et al. introduced it for stabilizing high-temperature creative sampling, a later controlled reanalysis argued that min-$p$ did not systematically outperform well-tuned top-$p$ and temperature sweeps across broader quality-diversity benchmarks.[^nguyen2025][^minp_critique2025] Any published preset, such as DeepSeek-R1's `T = 0.6, top_p = 0.95` pass@1 setup, should serve as an experimental starting point rather than a blind constant.[^deepseekr1_2025]

### Min-p still depends on temperature and order

When min-$p$ runs *after* temperature scaling for $\rho > 0$, taking logs of $P_T(w_i) \ge \rho P_T(w_{\max})$ reveals an exact linear cutoff in original logit units:

$$
z_i \ge z_{\max} + T \log \rho
$$

As $T$ rises, $T \log \rho$ grows more negative because $\log \rho < 0$, making the logit admission window progressively wider. Running min-$p$ *before* temperature fixes $T = 1$ in that cutoff and yields a different survivor set. Moreover, on a completely uniform distribution, any $\rho \le 1$ retains every single candidate token in the vocabulary, so neither method strictly dominates top-$p$:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="minp-order-and-a-uniform-counterexample.py"
import numpy as np


def minp_ids(logits, rho, temperature):
    cutoff = logits.max() + temperature * np.log(rho)
    return [int(i) for i in np.flatnonzero(logits >= cutoff)]


logits = np.array([0.0, -2.0, -4.0])
before_t2 = minp_ids(logits, rho=0.1, temperature=1.0)
after_t2 = minp_ids(logits, rho=0.1, temperature=2.0)

uniform_minp = minp_ids(np.zeros(8), rho=0.1, temperature=2.0)
uniform_top_p = 6  # Six 1/8 tokens reach p=0.75 exactly.

print("min-p before T=2:", before_t2)
print("min-p after T=2:", after_t2)
print(f"uniform pool: min-p={len(uniform_minp)}, top-p={uniform_top_p}")

assert before_t2 == [0, 1]
assert after_t2 == [0, 1, 2]
assert len(uniform_minp) == 8
```

<!-- leetllm: output:start -->
```text title="Output" output compact
min-p before T=2: [0, 1]
min-p after T=2: [0, 1, 2]
uniform pool: min-p=8, top-p=6
```
<!-- leetllm: output:end -->

| Method | Threshold | Adapts to distribution shape? | Main tradeoff |
|--------|-----------|-------------------------------|---------------|
| Top-k | Fixed $k$ tokens | No | Simple, but rigid across entropy shifts |
| Top-p | Fixed $p$ cumulative mass | Yes | Adapts support width, but high $T$ admits long tails |
| Min-p | $\rho \times P_{\max}$ | Yes | Confidence-relative cutoff; compare empirically with top-p |

## Repetition penalty

When generation slips into a feedback loop, recently emitted words retain inflated attention weights and keep winning argmax or top-of-nucleus draws:

> "The river flows north. The river flows north. The river..."

To break such loops, Keskar et al. introduced a repetition multiplier $\theta > 1$ in CTRL, finding that near-greedy generation with $\theta \approx 1.2$ prevented degenerative repetition without distorting prose.[^keskar2019] Modern libraries such as Hugging Face <span data-glossary="hugging-face-transformers">Transformers</span> expose a **sign-aware** `RepetitionPenaltyLogitsProcessor`: for any token already in the generated history, it *divides* positive logits by $\theta$ and *multiplies* negative logits by $\theta$.[^huggingface2026logits] Handling the sign explicitly guarantees that every penalized token moves downward in preference rather than accidentally pulling negative logits closer toward zero.

<!-- leetllm: test, output=show, output_title="Sign-aware repetition penalty", deps=torch -->
```python title="sign-aware-repetition-penalty.py"
import torch


def apply_repetition_penalty(logits, seen_ids, penalty=1.2):
    adjusted = logits.clone()
    seen = torch.tensor(sorted(set(seen_ids)), dtype=torch.long)
    adjusted[seen] = torch.where(
        adjusted[seen] > 0,
        adjusted[seen] / penalty,
        adjusted[seen] * penalty,
    )
    return adjusted


logits = torch.tensor([2.4, -0.5, 0.7])
penalized = apply_repetition_penalty(logits, seen_ids=[0, 1], penalty=1.2)
print("original logits:", [round(float(v), 3) for v in logits])
print("penalized logits:", [round(float(v), 3) for v in penalized])

assert penalized[0] < logits[0]
assert penalized[1] < logits[1]
assert penalized[2] == logits[2]
```

<!-- leetllm: output:start -->
```text title="Sign-aware repetition penalty" output compact
original logits: [2.4, -0.5, 0.7]
penalized logits: [2.0, -0.6, 0.7]
```
<!-- leetllm: output:end -->

Token `0` dropped from `2.4` to `2.0`, negative token `1` dropped further negative from `-0.5` to `-0.6`, and unseen token `2` stayed untouched at `0.7`. Had the implementation naively divided `-0.5` by `1.2`, token `1` would have moved upward to `-0.417` and become *more* likely. Note also that the penalty applies once per distinct token ID in the tracked history (not once per occurrence), and unlike softmax, it is *not* invariant to shifting logits by a constant. Subtracting $\max(z)$ for softmax stability before applying repetition penalty flips the signs of logits and can reverse which token stays on top:

<!-- leetllm: test, output=show, deps=torch -->
```python title="centering-before-a-penalty-changes-the-policy.py"
import torch


def penalize(scores, seen, factor=1.2):
    out = scores.clone()
    idx = torch.tensor(sorted(seen), dtype=torch.long)
    out[idx] = torch.where(out[idx] > 0, out[idx] / factor, out[idx] * factor)
    return out


scores = torch.tensor([2.4, 2.1, 1.2, 0.3])
names = ["bright", "clear", "warm", "pale"]

penalty_first = penalize(scores, {0}, 1.2)
centered_first = penalize(scores - scores.max(), {0}, 1.2)
print("penalty then argmax:", names[int(torch.argmax(penalty_first))])
print("center first then penalty:", names[int(torch.argmax(centered_first))])

# Penalizing a strong competitor B more heavily can raise seen token A's probability.
before = float(torch.softmax(torch.tensor([2.0, 10.0, 0.0]), dim=0)[0])
after = float(torch.softmax(penalize(torch.tensor([2.0, 10.0, 0.0]), {0, 1}, 2.0), dim=0)[0])
print(f"seen A probability: {before:.4f} -> {after:.4f}")

assert int(torch.argmax(penalty_first)) == 1
assert int(torch.argmax(centered_first)) == 0
assert after > before
```

<!-- leetllm: output:start -->
```text title="Output" output compact
penalty then argmax: clear
center first then penalty: bright
seen A probability: 0.0003 -> 0.0179
```
<!-- leetllm: output:end -->

### Frequency and presence penalties

While multiplicative repetition penalty acts multiplicatively around zero, additive frequency ($\alpha$) and presence ($\beta$) penalties subtract directly from raw logits according to how often each token appeared in the generated history:

$$
\text{logit}_{\text{adjusted}} = \text{logit} - \alpha \cdot \text{count}(\text{token}) - \beta \cdot \mathbb{1}[\text{count}(\text{token}) > 0]
$$

For positive coefficients, frequency penalty $\alpha$ scales linearly with token reuse (five occurrences cost $5\alpha$), discouraging verbatim phrases from snowballing, whereas presence penalty $\beta$ imposes a flat one-time deduction to encourage introducing fresh vocabulary. Because both track raw token IDs rather than semantic concepts, overly aggressive settings can suppress valid variable names in code or mandatory JSON keys. Always verify whether the serving engine includes the prompt in `count(token)` or only generated completion tokens, and note that suppressing repetition never adds missing knowledge or repairs factual errors.

## Combining strategies in production

Inference stacks such as vLLM, SGLang, and TensorRT-LLM execute decoding as an ordered pipeline of logit processors, hard constraints, scaling, and truncation stages. Because these stages do not commute, identical scalar settings can produce different outputs across serving engines depending on pipeline order:

1. **Biases and constraints:** Apply custom logit biases and mask grammar-forbidden tokens to $-\infty$. Structured grammars enforce syntactic validity (such as valid JSON) rather than factual accuracy, and if no token survives masking, the engine must raise a constraint error instead of sampling a forbidden token.
2. **History penalties:** Apply multiplicative repetition penalty and additive frequency/presence deductions across the designated history window.
3. **Greedy branch:** When exact deterministic selection is configured (`temperature = 0` or `do_sample=False`), return argmax immediately after validating that at least one finite unmasked logit exists.
4. **Stochastic sampling branch ($T > 0$):**
   - Center and scale eligible logits by temperature: $\tilde{z}_i = (z_i - z_{\max}) / T$.
   - Apply optional top-$k$ truncation, masking excluded logits to $-\infty$.
   - Compute softmax probabilities over surviving logits.
   - Apply top-$p$ and/or min-$p$ truncation and renormalize remaining probabilities to sum to 1.0.
   - Sample an output token ID using the active pseudo-random generator state.
5. **Termination checks:** Inspect end-of-sequence token IDs, configured stop strings (handling multi-token stop sequences such as Transformers' `StopStringCriteria`), and maximum token budgets so callers can distinguish complete stops from truncation.[^huggingface2026logits]

When checked on October 10, 2026, Hugging Face Transformers' generation pipeline applies temperature before top-$k$, top-$p$, and min-$p$ warpers when enabled, whereas engine integrations and feature flags continue to evolve.[^huggingface2026logits] On the same check date, vLLM's sampling validation explicitly rejected combining min-$p$ or logit bias with speculative decoding, illustrating that mathematical compatibility does not ensure every runtime supports every control pair.[^vllmSamplingParams2026]

Watch how two different order flips alter the surviving candidate set in different ways. Moving temperature before vs after top-$p$ preserves token ranks yet changes cumulative mass and therefore nucleus membership, whereas swapping top-$k$ and top-$p$ changes both distribution normalization and cutoff membership:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="filter-order-changes-candidate-support.py"
import numpy as np


def top_p_ids(probs, p):
    order = np.argsort(-probs, kind="stable")
    cum = np.cumsum(probs[order])
    cutoff = np.searchsorted(cum, p, side="left") + 1
    return [int(i) for i in order[:cutoff]]


base = np.array([0.45, 0.30, 0.15, 0.02] + [0.01] * 8)
hot = base ** (1.0 / 1.5)
hot /= hot.sum()
print("top-p 0.90 before/after T=1.5:", len(top_p_ids(base, 0.90)), len(top_p_ids(hot, 0.90)))

four_tokens = np.array([0.45, 0.30, 0.15, 0.10])
after_top_k = four_tokens.copy()
after_top_k[3:] = 0.0
after_top_k /= after_top_k.sum()

k_then_p = top_p_ids(after_top_k, 0.80)
p_then_k = top_p_ids(four_tokens, 0.80)[:3]
print("top-k 3 then top-p 0.8:", k_then_p)
print("top-p 0.8 then top-k 3:", p_then_k)

assert len(top_p_ids(base, 0.90)) == 3
assert len(top_p_ids(hot, 0.90)) == 9
assert k_then_p == [0, 1] and p_then_k == [0, 1, 2]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
top-p 0.90 before/after T=1.5: 3 9
top-k 3 then top-p 0.8: [0, 1]
top-p 0.8 then top-k 3: [0, 1, 2]
```
<!-- leetllm: output:end -->

```checkpoint
After migrating an application between two inference servers with identical temperature and top-p settings, output length and style drift noticeably. What configuration property should you inspect first?
---
Check the exact ordering of penalties, grammar masks, temperature scaling, top-k/top-p truncation, and zero-temperature branching. No universal pipeline order governs all engines, so identical numeric settings produce different supports when applied in a different sequence.
```

### Reproducibility is a property of the serving stack

Setting `temperature = 0` eliminates the random draw, while passing a PRNG `seed` fixes the pseudo-random stream on a single local process. Neither setting guarantees identical outputs across different GPUs, batch sizes, or server versions, because changes in parallel reduction order, tensor core kernels, or floating-point precision flip near-tied logits and compound down every subsequent token. As checked on October 10, 2026, vLLM documents deterministic scheduling and a `VLLM_BATCH_INVARIANT=1` batch-invariance mode scoped to specific hardware and model architectures, often with throughput overhead.[^vllmSamplingParams2026] When exact replay matters, log the model revision, tokenizer/chat template, engine version, numeric dtype, hardware, sampler pipeline, stopping rules, and seed, then test repeat prompts both in isolation and under realistic concurrent load.

Tracing our four-token logit example (`bright: 2.4, clear: 2.1, warm: 1.2, pale: 0.3`) through the full pipeline connects every transform visually. Because `bright` already appeared in the context, a `1.2` repetition penalty drops its logit from `2.4` to `2.0`, placing `clear` (`2.1`) first under greedy decoding. Applying softmax produces `clear: 0.404, bright: 0.365, warm: 0.164, pale: 0.067`, and accumulating down that sorted row reaches `0.933` at `warm` to cross `top-p = 0.90` and eliminate `pale`:

<figure>
  <img src="illustrations/_generated/production_sampler_stack_dark.png" alt="Two side-by-side charts showing repetition penalty and top-p truncation order on four tokens: bright, clear, warm, and pale. Left chart shows seen token bright dropping from logit 2.4 to 2.0 under penalty 1.2, placing clear at 2.1 as the new greedy winner. Right chart plots sorted softmax probabilities 0.404, 0.365, 0.164, 0.067 and their cumulative CDF reaching 0.933 at rank 3 warm to cross top-p 0.90, eliminating pale." />
  <figcaption>Repetition penalty pushes `bright` below `clear` (changing the greedy output to `clear`), while `top-p = 0.90` cuts `pale` and leaves a stochastic sample to draw from `clear`, `bright`, or `warm`.</figcaption>
</figure>

The PyTorch implementation below executes that exact pipeline (repetition penalty, greedy branch, temperature scaling, and nucleus sampling) while rejecting an all-masked vocabulary explicitly instead of emitting an illegal token. Tracing each tensor operation step by step clarifies how intermediate masking keeps invalid tokens permanently out of contention. Running the sample confirms how history shifts the greedy winner to `clear` while stochastic sampling stays free to explore the kept pool.

<!-- leetllm: test, id=sampler-stack, output=show, output_title="Penalty then greedy or nucleus", deps=torch -->
```python title="penalty-then-sample.py"
import random
import torch


def apply_penalty(logits, seen_ids, penalty=1.2):
    adjusted = logits.clone()
    if seen_ids:
        idx = torch.tensor(sorted(set(seen_ids)), dtype=torch.long)
        adjusted[idx] = torch.where(
            adjusted[idx] > 0,
            adjusted[idx] / penalty,
            adjusted[idx] * penalty,
        )
    return adjusted


def masked_softmax(logits):
    if torch.isneginf(logits).all() or torch.isnan(logits).any():
        raise ValueError("need at least one finite unmasked logit")
    return torch.softmax(logits, dim=-1)


def sample_next_token(logits, seen_ids, temperature, top_p, rng):
    adjusted = apply_penalty(logits, seen_ids, penalty=1.2)
    masked_softmax(adjusted)  # Ensure at least one legal token exists even on greedy.
    if temperature == 0:
        return int(torch.argmax(adjusted))
    probs = masked_softmax(adjusted / temperature)
    sorted_probs, sorted_idx = torch.sort(probs, descending=True)
    cum = torch.cumsum(sorted_probs, dim=0)
    keep = (cum - sorted_probs < top_p) & (sorted_probs > 0)
    kept_ids = [int(i) for i in sorted_idx[keep]]
    kept_weights = [float(w) for w in sorted_probs[keep]]
    return rng.choices(kept_ids, weights=kept_weights, k=1)[0]


logits = torch.tensor([2.4, 2.1, 1.2, 0.3])
names = ["bright", "clear", "warm", "pale"]
rng = random.Random(0)

greedy_id = sample_next_token(logits, seen_ids=[0], temperature=0, top_p=0.90, rng=rng)
sampled_id = sample_next_token(logits, seen_ids=[0], temperature=1.0, top_p=0.90, rng=rng)
print(f"greedy token: {names[greedy_id]}")
print(f"sampled token: {names[sampled_id]}")

assert names[greedy_id] == "clear"
assert names[sampled_id] == "warm"
assert sample_next_token(torch.tensor([-torch.inf, 1.0]), [], 0, 1.0, rng) == 1
assert sample_next_token(torch.tensor([1000.0, 999.0]), [], 0.0001, 1.0, rng) == 0
```

<!-- leetllm: output:start -->
```text title="Penalty then greedy or nucleus" output compact
greedy token: clear
sampled token: warm
```
<!-- leetllm: output:end -->

With seed `0`, the categorical sample draws `warm`, which sits cleanly inside the `0.90` nucleus without being the top logit. That single draw demonstrates why stochastic sampling preserves secondary continuations even when a narrow pool contains a clear mode. Changing the generator seed explores `clear` and `bright` in proportion to their renormalized weights.

Now look at how incompatible processor order creates a subtle failure mode when mixing grammar constraints with truncation. Suppose three candidate tokens carry probabilities `[0.6, 0.3, 0.1]`, and a JSON grammar permits only token `2`. Running `top-p = 0.80` *before* applying the grammar mask eliminates token `2` (`0.6 + 0.3 = 0.9 >= 0.8`), leaving the grammar mask with an empty eligible set. Applying the grammar mask *first* renormalizes token `2` to probability `1.0`, so `top-p = 0.80` preserves it cleanly. Transformers runs prefix constraints before sampling warpers in its standard generation loop, whereas custom samplers must enforce that ordering explicitly.[^huggingface2026logits]

<!-- leetllm: test, continue=sampler-stack, output=show, output_title="A legal token can be lost before masking" -->
```python title="grammar-mask-before-nucleus.py"
scores = torch.log(torch.tensor([0.6, 0.3, 0.1]))
grammar_mask = torch.tensor([False, False, True])

grammar_first = scores.masked_fill(~grammar_mask, -torch.inf)
chosen = sample_next_token(grammar_first, [], 1.0, 0.80, random.Random(0))
print("grammar first selects:", chosen)
assert chosen == 2

probs = torch.softmax(scores, dim=0)
sorted_probs, sorted_idx = torch.sort(probs, descending=True)
keep = (torch.cumsum(sorted_probs, dim=0) - sorted_probs) < 0.80
retained_mask = torch.zeros_like(grammar_mask)
retained_mask[sorted_idx[keep]] = True
cutoff_first = scores.masked_fill(~(retained_mask & grammar_mask), -torch.inf)
assert int(retained_mask.sum()) == 2

for label, masked in [
    ("cutoff before grammar", cutoff_first),
    ("grammar allows nothing", torch.full((3,), -torch.inf)),
]:
    for temp in [0.0, 1.0]:
        try:
            sample_next_token(masked, [], temp, 0.80, random.Random(0))
        except ValueError as err:
            print(f"{label}, T={temp}: {err}")
        else:
            raise AssertionError("an empty eligible pool must fail explicitly")
```

<!-- leetllm: output:start -->
```text title="A legal token can be lost before masking" output compact
grammar first selects: 2
cutoff before grammar, T=0.0: need at least one finite unmasked logit
cutoff before grammar, T=1.0: need at least one finite unmasked logit
grammar allows nothing, T=0.0: need at least one finite unmasked logit
grammar allows nothing, T=1.0: need at least one finite unmasked logit
```
<!-- leetllm: output:end -->

Both errors raise the same exception, yet point to distinct engineering fixes: recompute truncation strictly over grammar-legal tokens for the first failure, and inspect the schema grammar or tokenizer boundary for the second rather than silently dropping constraints.

### Evaluation configurations

| Evaluation slice | Temperature candidates | Sampler candidates | Repetition-penalty candidates | Goal |
|------------------|------------------------|--------------------|-------------------------------|------|
| Code generation | 0.0, 0.2, 0.5 | Greedy, top-p=0.95 | 1.0, 1.05 | Tests and format validity |
| Factual QA | 0.0, 0.2, 0.5 | Greedy, top-p=0.9 | 1.0, 1.05 | Grounded accuracy |
| Chat | 0.3, 0.7, 1.0 | Top-p=0.9, min-p=0.1 | 1.0, 1.1 | Helpfulness and repetition |
| Creative writing | 0.7, 1.0, 1.3 | Top-p=0.95, min-p=0.05 | 1.0, 1.1 | Diversity and coherence |
| Published DeepSeek-R1 <span data-glossary="pass-at-k">pass@1</span> setting | 0.6 | Top-p=0.95 | Not reported | One evaluation configuration[^deepseekr1_2025] |

Treat the top four rows as starting experimental sweeps rather than universal defaults. DeepSeek's reported pass@1 reflects mean accuracy across sampled completions under fixed settings; when reporting best-of-$N$ voting or reranking gains, account explicitly for the extra sampling and verifier cost.[^deepseekr1_2025]

## Choosing a policy by task

Select decoding policies from task requirements rather than habit. First decide how much output <span data-glossary="variance">variance</span> an endpoint tolerates, because extraction and code synthesis fail under unconstrained randomness while creative prose stagnates under argmax. Next, benchmark candidate settings side by side on representative prompts and evaluate quality, schema adherence, repetition, and latency together.

| Strategy | Selection | Candidate-count rule | Candidate evaluation fit |
|----------|-----------|----------------------|--------------------------|
| **Greedy** | Argmax | One token | Extraction, classification |
| **Beam search** | Scored prefix search | At most $B$ active prefixes | Translation, summarization |
| **Top-k** | Sample retained tokens | Fixed $k$, capped by eligible vocabulary | Simple truncation baseline |
| **Top-p** | Sample retained tokens | Dynamic via cumulative mass | General generation |
| **Min-p** | Sample retained tokens | Dynamic via relative peak ratio | Compare empirically with top-p |
| **Temperature** | Score modifier | Modifies all logits | Reshapes next-token sharpness |
| **Rep penalty** | Score modifier | Adjusts seen-token logits | Suppresses repetition loops |

## Decoding trade-offs and evaluation criteria

Verify each decoding mechanism directly through worked calculations rather than relying on intuition alone. The criteria below highlight the exact numerical comparisons, boundary conditions, and runtime interactions you should be able to derive from scratch. Walking through each item ensures you can diagnose silent sampler drift across serving engines.

| Decision | Verification bar |
|----------|------------------|
| **Greedy vs sampling** | Compute the 0.18 versus 0.27 two-token path scores and explain why sequence likelihood alone never guarantees factual truth. |
| **Beam search** | Explain why wider beams can lift translation metrics yet produce generic dialogue, and when GNMT length normalization flips rankings. |
| **Temperature** | Trace how rescaling every token shifts Shannon entropy before grouping tail buckets into summary bars. |
| **Top-k vs top-p vs min-p** | Compute exact survivor counts and renormalized weights on both peaked and flat probability vectors. |
| **Penalty knobs** | Distinguish sign-aware multiplicative repetition scaling from additive frequency and presence deductions, including non-invariance to centering. |
| **Production choice** | Justify separate sampler stacks for factual QA, code completion, and creative writing under measured latency constraints. |
| **Runtime ordering** | Name two pipeline ordering bugs that change outputs or empty a valid candidate pool even when numeric parameters match. |

## Common failures and fixes

### Beam search made chat sound robotic

Increasing beam width often yields bland, repetitive dialogue because beam search pursues globally high-probability phrasings, which in open-ended conversation tend to be safe, repetitive boilerplate. Unlike translation, dialogue rewards informative specificity that carries slightly lower sequence likelihood. Benchmark stochastic sampling against beam search on held-out conversational prompts while keeping model weights, prompts, stopping rules, and token budgets constant.

### Lowering temperature did not stop hallucinations

Cooling a sampler from $T = 1.0$ to $T = 0.1$ improves consistency across repeated calls, yet leaves token ranking untouched. When a model lacks retrieved grounding, an inaccurate token often remains the top logit, so low temperature merely makes errors more repeatable. Fix grounding through retrieval, prompt constraints, or verification rather than tuning temperature alone.

### High temperature plus top-p pulled in nonsense tail tokens

Warm creative settings can emit erratic fragments because temperature flattening distributes enough combined mass across thousands of weak tail tokens for top-$p$ to admit them. On self-hosted runtimes, reduce temperature, tighten `top-p`, or benchmark `min-p`. On hosted reasoning APIs, note that sampling knobs may be rejected or silently ignored: as checked in November 2026, OpenAI removes `temperature` and `top_p` whenever reasoning effort is not `none`, Anthropic's `2026-10-21` API rejects them with HTTP 400, and Google's Gemini 3.6 Flash ignores them silently.[^openai2026LatestModel][^anthropic2026ApiMigration][^geminiWhatsNew362026]

### Fixed top-k clipped valid options

Using one integer cutoff `k` across all prompts leaves factual answers noisy when entropy is low and truncates creative answers when entropy is flat. That rigidity comes directly from ignoring relative logit drop-off at step $t$. Replace rigid top-$k$ with `top-p` or `min-p` whenever candidate breadth should track next-step uncertainty.

### Identical settings diverged after a runtime swap

Switching between inference servers with matching numeric hyperparameters can shift output distributions whenever engines apply penalties, masks, temperature, and truncation in different orders or handle `temperature = 0` differently. Differences in floating-point kernel reductions or tie-breaking conventions can amplify those shifts across long generations. Inspect the engine's exact logit-processor stack and verify intermediate distributions on representative test cases before attributing drift to weights.

### `temperature=0` crashed or produced `NaN`s

Passing zero directly into $z_i / T$ causes division by zero or `NaN` propagation across softmax. Even floating-point underflow can invert tiny differences before division triggers infinity. Route `temperature == 0` explicitly to a greedy argmax branch before scaling logits, as vLLM implements, or reject zero explicitly in sampling-only helpers.[^vllmSamplingParams2026]

### Truncated probabilities failed to sum to one

Zeroing filtered probabilities without renormalizing leaves diagnostic distributions summing below 1.0, distorting downstream weighted checks and perplexity audits. Any weighted sample drawn over unnormalized scores still requires renormalization or explicit scaling inside the sampler call. Either mask excluded logits to $-\infty$ before softmax or divide remaining probabilities explicitly by their surviving mass.

## Practice drill

Test these mechanics locally by modifying the executable examples above. Editing small numerical distributions lets you isolate a single interaction without GPU noise or network latency. Try each targeted experiment below to test edge behavior directly:

1. Verify every conditional distribution sums to 1.0, then replace the step-2 continuations after `bright` and `fading` with uniform `0.1` distributions across ten tokens so `soft gold` (`0.15`) becomes the counterexample pruned by width-2 beam search.
2. Compare `top-p = 0.90` nucleus sizes before and after raising temperature to `T = 1.5` on the twelve-token distribution, verifying the jump from `3` to `9` survivors.
3. Reverse the application order of `temperature = 1.5` and `top-p = 0.80` on a peaked vs flat logit vector, verifying why token rankings stay constant while retained supports diverge.
4. Pass an all-masked vector `[-torch.inf, -torch.inf, -torch.inf]` into both greedy (`T = 0`) and stochastic (`T = 1.0`) paths to verify explicit rejection.

To extend these checks into a benchmark plan across factual QA, Python code completion, and creative fiction, hold prompts, weights, and token limits fixed while varying three candidate settings (`temperature`, `top-p`/`min-p`, repetition penalty) and recording task accuracy, format validity, repetition rate, and latency per slice. Separate evaluation slices prevent high-variance creative presets from contaminating deterministic extraction workloads. Measure how changing a single processor alters both output quality and candidate pool stability before freezing a production preset.

```mastery-quiz
[
  {
    "question": "The first token is A with probability 0.52, B with 0.28, or C with 0.20. After A, the four children A1 through A4 are equally likely. After B, B1 and B2 are equally likely. After C, the only child is C1. Break ties in the displayed ID order. Which paths do greedy decoding, width-2 beam search, and exhaustive search return, and what are their two-token probabilities?",
    "options": [
      "Greedy A1: 0.130; beam B1: 0.140; exhaustive B1: 0.140.",
      "Greedy A1: 0.130; beam B1: 0.140; exhaustive C1: 0.200.",
      "Greedy B1: 0.140; beam A1: 0.130; exhaustive C1: 0.200.",
      "Greedy B1: 0.140; beam A1: 0.130; exhaustive B1: 0.140."
    ],
    "answer": "Greedy A1: 0.130; beam B1: 0.140; exhaustive C1: 0.200.",
    "explanation": "Greedy starts with A. Its four paths tie at 0.52 × 0.25 = 0.130 each, so A1 wins the tie. The width-2 beam keeps A and B. Both B paths score 0.28 × 0.5 = 0.140, so B1 wins. Exhaustive search also reaches C1, which scores 0.20 × 1 = 0.200 and wins overall. Giving B1 to greedy and A1 to the beam swaps the searches that keep one and two prefixes. Returning B1 for exhaustive search skips the C branch. The triple B1, A1, B1 makes both mistakes."
  },
  {
    "question": "A complete-only decoder uses the GNMT score with alpha=1 and length excluding EOS. Completed S has log probability −1.4 and length 2; completed L has −1.6 and length 4. Active U reaches the length cap at −1.0 and length 4 without EOS. Which eligible candidate has the highest normalized score, and what is that score?",
    "options": [
      "S; normalized score −1.2000.",
      "U; normalized score −0.6667.",
      "L; normalized score −1.6000.",
      "L; normalized score −1.0667."
    ],
    "answer": "L; normalized score −1.0667.",
    "explanation": "L wins. S scores −1.4 ÷ (7/6) = −1.2000. L starts with a lower raw score of −1.6000, but its larger length divisor gives it −1.6 ÷ (9/6) ≈ −1.0667, above S. U scores about −0.6667 as a prefix. It reached the cap before emitting EOS, so the decoder excludes it."
  },
  {
    "question": "The next-token probabilities are leader 0.36 and four separate tail tokens of 0.16 each. Apply temperature 0.5 to individual events, then group the tail for display. What are the leader and combined-tail probabilities?",
    "options": [
      "Leader 55.86%; combined tail 44.14%.",
      "Leader 24.04%; combined tail 75.96%.",
      "Leader 36.00%; combined tail 64.00%.",
      "Leader 20.00%; combined tail 80.00%."
    ],
    "answer": "Leader 55.86%; combined tail 44.14%.",
    "explanation": "Temperature 0.5 squares each individual probability. The denominator is 0.36² + 4 × 0.16² = 0.232. The leader gets 0.1296/0.232 ≈ 55.86%. Squaring the aggregated 0.64 tail instead would incorrectly treat four events as one. Dividing all probabilities by 0.5 and renormalizing would leave the original row unchanged."
  },
  {
    "question": "Tokens A/B/C/D have scores [4,2,2,1]. For k=2, an exact-count implementation breaks ties by A/B/C/D order. A second implementation masks only scores below the kth score. Which retained-ID pair follows?",
    "options": [
      "Exact count: [A,B,C]; score threshold: [A,B].",
      "Exact count: [A,B]; score threshold: [A,B].",
      "Exact count: [A,B]; score threshold: [A,B,C].",
      "Exact count: [A,B,C]; score threshold: [A,B,C]."
    ],
    "answer": "Exact count: [A,B]; score threshold: [A,B,C].",
    "explanation": "The exact-count rule returns two IDs, A and B. The kth score is 2, and both B and C meet that threshold, so the score-threshold implementation returns A, B and C. The tie convention changes support before normalization or sampling."
  },
  {
    "question": "A/B/C/D have probabilities [0.50,0.20,0.18,0.12]. Compare top-k=3 followed by renormalization and top-p=0.72, against top-p=0.72 followed by exact top-k=3. Which pair of final supports follows?",
    "options": [
      "k then p: [A,B,C]; p then k: [A,B].",
      "k then p: [A,B]; p then k: [A,B].",
      "k then p: [A,B]; p then k: [A,B,C].",
      "k then p: [A,B,C]; p then k: [A,B,C]."
    ],
    "answer": "k then p: [A,B]; p then k: [A,B,C].",
    "explanation": "Top-k first retains mass 0.88. After renormalization, A and B total 0.70/0.88 ≈ 0.7955, reaching 0.72. On the original row, 0.70 is insufficient, so top-p retains C as well; the later top-k keeps all three. Positive rank preservation does not make a cumulative-mass operation commute with other filters."
  },
  {
    "question": "A/B/C have logits [0,−1.5,−3]. Use min-p rho=0.25. Compare selecting the min-p support before temperature 2 with selecting it after temperature 2. Which supports follow?",
    "options": [
      "Before temperature: [A]; after temperature: [A,B].",
      "Before temperature: [A,B]; after temperature: [A].",
      "Before temperature: [A,B]; after temperature: [A,B,C].",
      "Before temperature: [A]; after temperature: [A,B,C]."
    ],
    "answer": "Before temperature: [A]; after temperature: [A,B].",
    "explanation": "The logit cutoff is z_max + T ln(rho). Before temperature it is ln(0.25) ≈ −1.3863, admitting only A. After temperature 2 it is about −2.7726 on the original logit scale, admitting A and B. The relative cutoff still depends on the temperature scale."
  },
  {
    "question": "A/B/C have raw logits [3,−1,2] and generation counts [2,1,0]. First apply a sign-aware repetition factor of 2 once per distinct seen ID, then frequency 0.25 and presence 0.5. Which adjusted row and mode follow?",
    "options": [
      "Row [−0.25,−2.75,2]; mode C.",
      "Row [0.5,−1.25,2]; mode C.",
      "Row [−0.25,−1.25,2]; mode C.",
      "Row [0.5,−2.75,2]; mode C."
    ],
    "answer": "Row [0.5,−2.75,2]; mode C.",
    "explanation": "A appeared twice. Divide its positive logit by 2 once, then subtract 0.25 for each occurrence and 0.5 for presence. That gives 3 ÷ 2 − 2 × 0.25 − 0.5 = 0.5. B appeared once and has a negative logit, so its score is −1 × 2 − 0.25 − 0.5 = −2.75. C is unseen and keeps the highest score, 2. An A score of −0.25 comes from dividing by 2 twice. A B score of −1.25 comes from dividing its negative logit by 2. The row with both values makes both mistakes."
  },
  {
    "question": "A/B/C/D have probabilities [0.52,0.24,0.16,0.08], but a hard grammar permits only D. A top-p=0.85 filter ran before the mask and produced an empty intersection. Recompute with grammar first. Separately, every token is masked on the local T=0 branch. What should the two results be?",
    "options": [
      "Emit D; select the lowest-ID masked token.",
      "Emit D; reject the all-masked input.",
      "Retain an empty intersection; reject the all-masked input.",
      "Retain an empty intersection; select the lowest-ID masked token."
    ],
    "answer": "Emit D; reject the all-masked input.",
    "explanation": "Grammar first leaves D as the only eligible token, with normalized probability 1, so it survives top-p. In the separate all-masked case, argmax cannot authorize any token. The local sampler validates eligibility even at T=0 and rejects the input. Retaining the original failed intersection would skip the requested recomputation."
  },
  {
    "question": "Two greedy runs use the same prompt and seed. Their only candidates are token IDs 17 and 52. In that order, the final logits are [−0.32, −0.31] on the first run and [−0.30, −0.31] on the second. Separately, a hosted sampler gives different replies to the same prompt. Its response metadata logs (requested temperature, effective temperature) as (0.3, 0.8) and (1.1, 0.8). Which IDs does greedy emit in order, and what do the hosted replies show?",
    "options": [
      "52 then 17. The replies show variation at one temperature.",
      "52 then 17. The replies show the effect of changing temperature.",
      "52 then 52. The replies show variation at one temperature.",
      "52 then 52. The replies show the effect of changing temperature."
    ],
    "answer": "52 then 17. The replies show variation at one temperature.",
    "explanation": "Greedy takes the higher logit on each run. ID 52 leads with −0.31 on the first run, and ID 17 leads with −0.30 on the second. Giving 52 twice attributes seed control over a deterministic argmax. Both hosted requests ran at 0.8. Attributing the different replies to a temperature change confuses the values requested with the value the sampler used."
  },
  {
    "question": "Four held-out prompts each receive three sampled drafts. Their correctness rows are [1,1,0], [0,1,0], [1,1,1] and [0,0,0]. What are the average sampled-correctness estimate and the fraction of prompts with at least one correct draft?",
    "options": [
      "Average sampled correctness 75%; any-correct prompt fraction 50%.",
      "Average sampled correctness 50%; any-correct prompt fraction 75%.",
      "Average sampled correctness 50%; any-correct prompt fraction 50%.",
      "Average sampled correctness 75%; any-correct prompt fraction 75%."
    ],
    "answer": "Average sampled correctness 50%; any-correct prompt fraction 75%.",
    "explanation": "There are 6 correct drafts among 12, giving 50% average sampled correctness. Three of the four prompts contain a correct draft, giving 75% any-correct coverage. The second number does not mean a system returns the right answer 75% of the time without a selector; include its selection rule and the twelve-draft verification budget."
  }
]
```

> **Next:** Continue to [Scaling Laws & Compute-Optimal Training](/learn/scaling-laws-compute-optimal-training). Now that you can shape how a model turns scores into words, follow the question upstream: how should parameters, data, and compute change those scores in the first place?
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

Imagine a language model continuing the sentence `The autumn light is` across three consecutive requests. Under one decoder configuration, it ends immediately with `bright.` Under another, it chooses `fading fast`. Under a third, each call produces a slightly different phrase. Same neural network weights, same prompt, and same tokenizer: all that changed is the piece of inference code that turns next-token scores into chosen words.

The previous chapter showed how a forward pass produces a row of next-token probabilities. A decoder converts that probability row into a sequential action by selecting one token, appending it to the prompt, and running the model again to generate the next row. Because every chosen word reshapes the conditioning prefix seen at future steps, small decoding choices compound rapidly across a reply. This chapter traces what each decoding strategy does mathematically to those scores so you can choose settings deliberately.

To keep every calculation transparent by hand, trace a single twelve-token probability row where each word occupies one token. Eight low-probability tokens each contribute one percent so the entire row sums cleanly to one. Working through exact arithmetic on one concrete row reveals differences that aggregate averages hide.

| Next token | Probability |
|---|---|
| `bright` | 0.45 |
| `fading` | 0.30 |
| `soft` | 0.15 |
| `pale` | 0.02 |
| eight other tokens | 0.01 each |

Keep one distinction firmly in mind before tuning any sampler parameter. Next-token probabilities reflect statistical continuation patterns given the prompt, never external truth or factual verification. Grounded accuracy comes from putting verified facts into context and validating outputs afterward, regardless of whether the sampler uses greedy argmax or nucleus sampling.

## The most likely word can start the wrong sentence

The simplest decoding algorithm picks the single highest-probability token at every step. This is **greedy decoding**, which outputs `bright` immediately after `The autumn light is`. Greedy selection requires no random sampling, adds negligible latency overhead beyond the model forward pass, and provides a steady baseline when an application needs a single extracted field or classification label.

Its fundamental blind spot is a complete lack of lookahead across future tokens. An autoregressive language model scores an entire completion $y_{1:L}$ given prompt $x$ by multiplying step-by-step conditional probabilities: $P(y_{1:L}\mid x)=\prod_{t=1}^{L}P(y_t\mid x,y_{<t})$. Maximizing the first factor in a product does not guarantee the largest final product. Suppose that after `bright`, the most likely next token is simply a period at `0.40`, whereas after `fading`, the model turns decisively confident and puts `0.90` on `fast`, producing the step-by-step comparison charted below.

<figure>
  <img src="illustrations/_generated/decoding_strategies_dark.png" alt="Horizontal probability comparison for two-token continuations after The autumn light is. First-step probabilities are bright 0.45, fading 0.30, soft 0.15, and nine tail tokens totaling 0.10. Width-2 beam search retains bright and fading while pruning soft and the tail. Greedy commits to bright followed by period at 0.180, whereas beam search rescues fading followed by fast at 0.270." />
  <figcaption>Greedy decoding commits to `bright` at step one and never evaluates `fading fast`. Each bar measures joint two-token sequence probability, where `fading fast` (`0.270`) overtakes `bright .` (`0.180`).</figcaption>
</figure>

The branch starting with the step-one winner ends at `0.18`, while the runner-up branch reaches `0.27`. Nothing shifted in the first-step scores; looking one token deeper simply uncovered a tighter continuation. On longer open-ended outputs, short-sighted argmax also risks falling into repetitive loops whenever an echoed phrase keeps claiming the highest conditional probability, as Holtzman et al. observed in GPT-2 experiments and the DeepSeek-R1 technical report later noted on unguided greedy reasoning rollouts.[^holtzman2020][^deepseekr1_2025]

## Beam search keeps a second opinion alive

**Beam search** fixes greedy myopia partially by retaining the top $B$ partial sequences at every step instead of discarding all runners-up. With beam width $B = 2$ on our running sentence, the decoder retains both `bright` and `fading`, expands both forward by one word, and discovers `fading fast` at joint probability `0.27`. Comparing greedy selection and beam expansion in NumPy confirms how keeping a second hypothesis avoids premature commitment.

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
print("beam:", beam_text, f"{beam_score:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
greedy: bright . 0.18
beam: fading fast 0.27
```
<!-- leetllm: output:end -->

Beam search still discards lower-scoring prefixes irreversibly at each step. If both `bright` and `fading` split their next step evenly across ten tokens (`0.045` and `0.030`), a pruned `soft` followed deterministically by `gold` would have scored `0.15` and beaten both without ever appearing inside the beam. Only exhaustive tree search avoids pruning winners, and exhaustive search grows exponentially with sequence length.

Long generations expose two further engineering realities in beam search. First, implementations sum log probabilities rather than multiplying probabilities directly so long sequences do not underflow floating-point precision. Second, because every extra word adds a negative log-probability term, raw cumulative scores tilt toward short sequences that end early. Google's Neural Machine Translation system countered that bias by dividing log probability by a tunable length term:

$$
\text{score}(Y)=\frac{\log P(Y)}{(5+|Y|)^\alpha/6^\alpha}.
$$

Setting $\alpha = 0$ restores raw log probability, while increasing $\alpha$ favors longer, more complete responses; tune $\alpha$ on held-out validation metrics rather than borrowing published constants blindly.[^wu2016gnmt] Run the length-normalization comparison below to see how `alpha = 0.6` overturns a short candidate:

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

Notice an important operational principle: **beam search maximizes model probability, which diverges from conversational quality in open-ended tasks.** Higher-probability continuations often sound overly generic or repetitive in chat, so reserve beam search mainly for tightly conditioned sequence-to-sequence tasks such as translation while starting conversational generation with calibrated sampling.[^holtzman2020] Keep in mind that width-$B$ beams also carry up to $B$ divergent suffix paths in KV-cache memory, trading extra compute per generated token.

## Sampling treats the row as a distribution

Rather than chasing a single highest-scoring sequence, **sampling** draws each next token at random in proportion to its probability, choosing `bright` 45% of the time and `fading` 30% of the time on our example step. That variability unlocks creative variety across retries when brainstorming prose, while requiring tight constraints whenever an endpoint expects consistent structured extraction. **Temperature** controls how concentrated or spread out those random draws become by dividing every raw logit $z_i$ by a positive scalar $T > 0$ prior to softmax: $p_i(T)=\exp(z_i/T)/\sum_j\exp(z_j/T)$.

Temperature governs relative log-odds exponentially through the ratio $\exp((z_A - z_B)/T)$. For a logit gap of `2.0`, token $A$ beats $B$ by `7.4x` at $T = 1.0$, jumps to `54.6x` when cooled to $T = 0.5$, and compresses down to `3.8x` when warmed to $T = 1.5$. Comparing these three temperature regimes visually makes clear how fast probability mass drains out of the top token and flows into the long tail.

<figure>
  <img src="illustrations/_generated/sampling_distribution_dark.png" alt="Line chart comparing a twelve-token next-word distribution after The autumn light is across temperatures 0.3, 1.0, and 1.5. Original probabilities are bright 45 percent, fading 30, soft 15, pale 2, and eight 1-percent tail tokens totaling 8 percent. Rescaling all twelve tokens before summing the tail shifts bright from 77.8 percent at T=0.3 to 33.3 percent at T=1.5 while the grouped tail rises from under 0.01 percent to 21.1 percent, with Shannon entropy increasing from 0.86 to 2.09 to 2.75 bits." />
  <figcaption>Each curve rescales all twelve individual logits before summing the eight rare tail words. Heating from `T = 0.3` to `T = 1.5` drops `bright` from 77.8% to 33.3% while lifting the combined tail past 21%.</figcaption>
</figure>

Notice how the eight rare tail tokens grow from `8%` at `T = 1.0` to over `21%` collectively at `T = 1.5`, surpassing `soft` even though no individual rare word makes sense alone. Always apply temperature scaling to individual logits before grouping tail buckets into summary bars, because token events rescale individually rather than as a merged bucket. Keep four foundational properties in mind whenever tuning temperature:

- **Positive temperature preserves token rank.** Dividing every logit by $T > 0$ never flips which token sits at the top; it only controls how aggressively sampling favors leaders over runners-up.
- **Zero requires explicit branching.** Dividing by $T = 0$ is undefined mathematically; local engines treat `temperature = 0` as a dedicated greedy branch while hosted reasoning models often reject or ignore sampling controls outright.[^vllmSamplingParams2026][^huggingface2026logits][^openai2026LatestModel][^anthropic2026ApiMigration]
- **Hard constraints override high temperature.** Tokens masked to $-\infty$ by a grammar remain at probability zero at any finite positive temperature.
- **Temperature never adds factual knowledge.** Cooling a model sharpens consistency around its highest logits, which simply amplifies repeatable mistakes whenever the underlying context lacks grounding.

## Trim the tail, but know which rule you are using

Leaving the entire vocabulary open during sampling means tens of thousands of improbable tokens can still get drawn occasionally. Practical samplers truncate weak candidates first using one of three criteria:

- **Top-k** keeps only the $k$ most likely tokens and renormalizes.[^fan2018] On our `The autumn light is` distribution, `k = 2` keeps `bright` (`0.45`) and `fading` (`0.30`), rescaling them to `0.60` and `0.40`. Its rigid count overlooks confidence: `k = 50` admits clutter when the model is nearly certain, yet clips good alternatives when probability spreads wide. Also verify how your runtime breaks ties at rank $k$ (Transformers keeps every token tied at the $k$-th score).
- **Top-p (nucleus)** accumulates probability mass from the top downward until reaching threshold $p$, retaining the token that crosses the threshold.[^holtzman2020] At `p = 0.90`, our example reaches `0.45 + 0.30 + 0.15 = 0.90` on `soft` and stops at three tokens (`0.50, 0.33, 0.17`).
- **Min-p** retains tokens whose probability reaches at least a fraction $\rho$ of the leading token's probability ($P(w) \ge \rho \cdot \max_v P(v)$).[^nguyen2025] A dominant 80% leader sets a steep `0.08` cutoff at $\rho = 0.1$, whereas an uncertain 5% leader drops the floor to `0.005`.

The side-by-side plots below demonstrate why adaptive rules adjust support size automatically as a distribution flattens from peaked to broad. On the left, concentrated probability lets both `top-p` and `min-p` prune after just two tokens while `top-k` still keeps three. On the right, spreading mass into the tail pushes `top-p` to five tokens while `min-p` stops at four.

<figure>
  <img src="illustrations/_generated/adaptive_truncation_dark.png" alt="Side-by-side probability bar and cumulative distribution plots comparing peaked (72, 20, 5, 2, 1 percent) and flat (40, 20, 15, 11.5, 3.5, plus ten 1-percent tokens) distributions. Fixed top-k 3 keeps three tokens in both. Top-p 0.90 adapts from two to five tokens via cumulative mass, while min-p 0.10 adapts from two to four tokens by scaling the cutoff from 7.2 percent to 4.0 percent." />
  <figcaption>Fixed `top-k = 3` keeps three tokens in both regimes. `top-p = 0.90` adapts from two to five tokens as cumulative mass slows, whereas `min-p = 0.10` drops its relative bar from 7.2% to 4.0% and retains four tokens.</figcaption>
</figure>

The short NumPy check below executes top-$p$ across both shapes and verifies the exact rank-5 boundary hit at `0.90`. Running both cases side by side also confirms that the surviving weights sum cleanly to 1.0 after renormalization. Notice how sensitive that fifth rank is to an inclusive versus exclusive threshold whenever cumulative probability equals the target exactly.

<!-- leetllm: test, output=show, id=reader-decoding-nucleus, deps=numpy -->
```python title="inspect-the-nucleus-boundary.py"
import numpy as np


def nucleus(probs, threshold):
    order = np.argsort(-probs, kind="stable")
    sorted_probs = probs[order]
    cum_before = np.cumsum(sorted_probs) - sorted_probs
    kept_idx = order[cum_before < threshold]
    kept_probs = probs[kept_idx]
    return kept_idx, kept_probs / kept_probs.sum()


for row in [
    np.array([0.72, 0.20, 0.05, 0.02, 0.01]),
    np.array([0.40, 0.20, 0.15, 0.115, 0.035] + [0.01] * 10),
]:
    kept, norm = nucleus(row, 0.90)
    mass = float(row[kept].sum())
    print("kept:", len(kept), "mass:", f"{mass:.2f}", "renormalized:", abs(float(norm.sum()) - 1.0) < 1e-12)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
kept: 2 mass: 0.92 renormalized: True
kept: 5 mass: 0.90 renormalized: True
```
<!-- leetllm: output:end -->

Keep a close eye on how temperature interacts with truncation before enabling high-temperature sampling. Raising temperature shifts mass outward into weak tail tokens, causing a fixed `top-p = 0.90` nucleus on our twelve-token sentence to expand rapidly from 3 tokens at `T = 1.0` to 9 tokens at `T = 1.5`. The PyTorch experiment below computes the exact surviving counts and combined tail mass across three temperature levels.

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

That high-temperature tail inflation motivated min-$p$.[^nguyen2025] Still, when min-$p$ reads temperature-scaled logits, its admission rule reduces to $z_i \ge z_{\max} + T \ln \rho$, so its threshold widens with $T$ too, and a subsequent empirical reanalysis found no consistent quality-diversity advantage over carefully tuned top-$p$ baselines.[^minp_critique2025] Treat top-$p$ as your default truncation baseline and let direct task measurements justify switching.

```checkpoint
Suppose a self-hosted question-answering endpoint gives erratic replies at `temperature = 1.0`, so you lower temperature to `0.2`. Responses become highly consistent. What changed, and what remained unchanged? What changes if a hosted API rejects `temperature` altogether?
---
Lowering temperature increased consistency by sharpening probabilities around the leading tokens, yet added no factual accuracy because token rankings remained identical. To improve grounded truth, feed verified facts into context and validate outputs. When a hosted API rejects temperature, achieve consistency via tighter prompts, schema constraints, and multi-sample validation rather than client-side temperature tuning.
```

## Order is part of the configuration

Production decoders execute a sequence of transforms, including penalties, constraints, scaling, and truncation, whose final result depends on their order. Consider a sign-aware **repetition penalty** ($\theta = 1.2$), introduced in CTRL and implemented in Transformers to divide positive logits of previously generated tokens by $\theta$ while multiplying negative logits by $\theta$ so all penalized tokens move downward.[^keskar2019][^huggingface2026logits] Starting from raw logits `[2.4, 2.1, 1.2, 0.3]` for `["bright", "clear", "warm", "pale"]` when `bright` already appeared in history, the figure and PyTorch script below trace how repetition penalty flips argmax to `clear` while `top-p = 0.90` retains three candidates and seed `0` draws `warm`.

<figure>
  <img src="illustrations/_generated/production_sampler_stack_dark.png" alt="Two side-by-side charts showing repetition penalty and top-p truncation order on four tokens: bright, clear, warm, and pale. Left chart shows seen token bright dropping from logit 2.4 to 2.0 under penalty 1.2, placing clear at 2.1 as the new greedy winner. Right chart plots sorted softmax probabilities 0.404, 0.365, 0.164, 0.067 and their cumulative CDF reaching 0.933 at rank 3 warm to cross top-p 0.90, eliminating pale." />
  <figcaption>A `1.2` repetition penalty pulls `bright` down from `2.4` to `2.0`, handing greedy selection to `clear` (`2.1`). Accumulating sorted softmax probabilities crosses `0.90` at `warm`, eliminating `pale`.</figcaption>
</figure>

<!-- leetllm: test, output=show, id=reader-decoding-stack, deps=torch -->
```python title="run-a-small-sampler-stack.py"
import random
import torch


def sample_next(logits, seen, penalty, temperature, top_p, rng):
    adjusted = logits.clone()
    if seen:
        idx = torch.tensor(sorted(set(seen)), dtype=torch.long)
        adjusted[idx] = torch.where(
            adjusted[idx] > 0, adjusted[idx] / penalty, adjusted[idx] * penalty
        )
    if temperature == 0:
        return int(torch.argmax(adjusted))
    probs = torch.softmax(adjusted / temperature, dim=0)
    sorted_probs, sorted_idx = torch.sort(probs, descending=True)
    cum = torch.cumsum(sorted_probs, dim=0)
    keep = (cum - sorted_probs) < top_p
    return rng.choices([int(i) for i in sorted_idx[keep]], weights=[float(w) for w in sorted_probs[keep]], k=1)[0]


tokens = ["bright", "clear", "warm", "pale"]
logits = torch.tensor([2.4, 2.1, 1.2, 0.3])
greedy = sample_next(logits, [0], 1.2, 0.0, 0.90, random.Random(0))
drawn = sample_next(logits, [0], 1.2, 1.0, 0.90, random.Random(0))
print("greedy:", tokens[greedy])
print("seeded draw:", tokens[drawn])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
greedy: clear
seeded draw: warm
```
<!-- leetllm: output:end -->

Remember that repetition, frequency, and presence penalties act strictly on raw token IDs without semantic awareness, so overly strong penalties can suppress essential variable names or schema field names. Check the interaction with structured constraints as well before locking down a configuration. Watch closely in the NumPy trace below how combining structured grammars with probability truncation can accidentally eliminate the only valid token:

<!-- leetllm: test, output=show, id=reader-decoding-order, deps=numpy -->
```python title="show-a-filter-order-failure.py"
import numpy as np

tokens = ["red", "blue", "green"]
probs = np.array([0.60, 0.30, 0.10])
allowed = {"green"}

top_two = {tokens[int(i)] for i in np.argsort(-probs, kind="stable")[:2]}
filter_then_constraint = [t for t in top_two if t in allowed]

legal_idx = np.array([i for i, t in enumerate(tokens) if t in allowed])
legal_order = legal_idx[np.argsort(-probs[legal_idx], kind="stable")[:2]]
constraint_then_filter = [tokens[int(i)] for i in legal_order]

print("filter then constraint:", filter_then_constraint)
print("constraint then filter:", constraint_then_filter)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
filter then constraint: []
constraint then filter: ['green']
```
<!-- leetllm: output:end -->

Truncating before applying the grammar empties the pool even though a valid token existed. Similarly, moving temperature across `top-p` changes surviving candidates because cumulative probability shifts, while Transformers runs temperature before truncation warpers and vLLM forbids mixing `min-p` or logit bias with speculative decoding.[^vllmSamplingParams2026] Treat processor ordering as part of your tested serving configuration, never silently dropping grammar constraints when an intersection empties.

## Endings, budgets, and seeds

Clean termination requires checking checkpoint-specific end-of-turn token IDs alongside a maximum output budget, distinguishing true EOS completion from token-cap truncation so callers never mistake a cut-off reply for a complete answer. Rely on token IDs whenever APIs support them rather than naive substring scans that can break inside multi-token matches. Remember too that a random `seed` only fixes PRNG draws after logits arrive: floating-point reduction differences across batch sizes, hardware, or server builds can still flip close logits unless deterministic modes such as vLLM's `VLLM_BATCH_INVARIANT=1` are enabled, and hosted providers treat `seed` as best-effort rather than deterministic.[^openai2026ChatReference]

## What a hosted API lets you set

Self-hosted weights expose the entire logit pipeline, whereas modern hosted APIs increasingly lock down or ignore low-level sampling parameters. Some reasoning endpoints reject `temperature` and `top_p` with HTTP 400 errors, while other thinking modes ignore those settings silently without warning. Check exact provider capabilities in the comparison table below, as documented in guides checked in November 2026:[^openai2026LatestModel][^openai2026ChatReference][^openai_structured_outputs][^anthropic2026ApiMigration][^anthropic2026MessagesReference][^anthropic2026Effort][^anthropic2026StructuredOutputs]

| Setting | Weights you run | OpenAI, GPT-6 models | Anthropic, API version `2026-10-21` |
|---|---|---|---|
| Temperature, top-p | Yes | Remove them unless reasoning effort is `none` | 400 error, even at default value |
| Top-k | Yes | Not in the API reference | 400 error, even at default value |
| Min-p, beam search | Depends on engine | Not in the API reference | Not in the API reference |
| Token probabilities | Yes | Remove them unless reasoning effort is `none` | Not in the API reference |
| Effort | Model-dependent (`reasoning_effort` on gpt-oss[^gptOss20bTemplate2025]) | `reasoning.effort` | `output_config.effort` |
| Output shape | Engine grammar support | Structured outputs | `output_config.format` |

Models with mandatory reasoning effort, silent ignores such as Gemini 3.6 Flash or DeepSeek thinking mode, and strict API errors make checking provider release notes essential before sweeping temperatures.[^geminiWhatsNew362026][^deepseek2026thinking] Even when sampling controls are unavailable, reliability still comes from grounding prompts cleanly, constraining shapes with structured output schemas, and measuring variance across repeated test runs.

## Choose settings with a small experiment

Start from task tolerance for output variance, hold prompts, weights, retrieved context, and budgets fixed, and benchmark small candidate sweeps across quality, format adherence, repetition, and latency. Comparing single-knob changes across narrow slices makes it easy to separate decoding effects from prompt drift. The sweep table below offers practical starting candidates across four common LLM workloads.

| Task | Temperatures to try | Samplers to try | What to measure |
|---|---|---|---|
| Code generation | 0.0, 0.2, 0.5 | Greedy, top-p 0.95 | Tests passed, valid format |
| Factual questions | 0.0, 0.2, 0.5 | Greedy, top-p 0.9 | Grounded accuracy, unsupported claims |
| Chat | 0.3, 0.7, 1.0 | Top-p 0.9, min-p 0.1 | Helpfulness, repetition |
| Creative writing | 0.7, 1.0, 1.3 | Top-p 0.95, min-p 0.05 | Variety, coherence |

Use published configurations such as DeepSeek-R1's `temperature = 0.6, top_p = 0.95` pass@1 setup as one benchmark candidate rather than a universal law, and account for verifier costs whenever comparing single draws against multi-sample reranking.[^deepseekr1_2025]

## When decoding goes wrong

| Symptom | Likely cause | What to do |
|---|---|---|
| Chat turned generic after widening the beam | Beam search favors high-likelihood boilerplate | Compare against sampling on held-out prompts |
| Lower temperature, still confidently wrong | Temperature sharpens scores without adding facts | Fix retrieval, prompt grounding, or schema checks |
| Creative mode emits odd fragments | High temperature pushed weak tail tokens into top-p | Lower temperature, tighten top-p, or test min-p |
| A 400 error on `temperature` or `top_p` | Reasoning model or API version forbids sampling knobs | Remove blocked knobs and follow provider docs |
| Temperature sweep shows zero difference | Provider silently ignores temperature in thinking mode | Verify provider behavior before running sweeps |
| Identical knobs changed output after engine swap | Sampler pipeline order or `T=0` branch differs | Inspect engine logit-processor ordering |
| Crash or `NaN` at `temperature=0` | Logits divided by zero | Branch to greedy before scaling, or reject zero |
| Changing temperature changes nothing | Probabilities divided by `T` and renormalized | Scale raw logits before softmax |
| Logged probabilities sum below one | Zeroed tail without renormalization | Mask logits with $-\infty$ before softmax or divide by kept mass |
| Empty candidate pool | Truncation ran before grammar mask | Apply grammar masks before truncation filters |

```checkpoint
Suppose a new distribution assigns `bright` 0.50, `clear` 0.25, `warm` 0.15, `pale` 0.06, and `dim` 0.04. What does greedy pick? What do top-k=2 (renormalized), top-p=0.85, and min-p=0.20 retain? What probability does `bright` reach at T=0.5, and what if a hosted provider rejects `temperature`?
---
Greedy selects `bright` at any positive temperature. Top-k=2 retains `bright` and `clear` at 0.67 and 0.33. Top-p=0.85 needs `0.50 + 0.25 + 0.15 = 0.90` and retains three tokens; min-p=0.20 sets cutoff `0.20 * 0.50 = 0.10` and also retains three. Halving temperature squares each probability before renormalization, lifting `bright` to `0.25 / 0.3402 ≈ 73.5%`. When a provider rejects temperature, verify supported controls such as reasoning effort and output schemas instead of assuming sampling behavior.
```

You can now predict how any standard decoding rule transforms a vector of next-token scores, spot subtle ordering failures across penalties and grammar masks, and verify which controls an engine or hosted API actually honors. Next, step upstream from token selection to ask how training scale shapes those underlying model probabilities in the first place in [Scaling Laws & Compute-Optimal Training](/learn/scaling-laws-compute-optimal-training).

<!-- leetllm: edition:reader:end -->
