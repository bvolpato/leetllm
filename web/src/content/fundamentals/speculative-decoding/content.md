---
{
  "id": "speculative-decoding",
  "title": "Speculative Decoding",
  "slug": "speculative-decoding",
  "section": "Inference & Production Scale",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 21,
  "coverImage": "illustrations/_generated/draft_verify_dark.png",
  "companies": ["Google", "DeepMind", "Meta", "Anthropic", "OpenAI"],
  "shortDescription": "Guess several tokens with a cheap proposer, then accept or correct them so the target's distribution stays the same in exact arithmetic.",
  "keyConceptsTested": [
    "Draft-then-verify protocol",
    "Rejection sampling proof",
    "Memory bandwidth bottleneck",
    "Arithmetic intensity",
    "Speedup dynamics",
    "Speculative tree attention",
    "Concurrency and verification cost",
    "KV cache rollback",
    "Prompt lookup decoding"
  ],
  "prerequisites": [
    "slm-specialization-edge-deployment",
    "local-llm-deployment-hardware-quantization",
    "scaling-llm-inference-batching-kv-cache",
    "kv-cache-paged-attention-llm-serving",
    "decoding-strategies-greedy-beam-nucleus"
  ],
  "relatedQuestions": [
    "long-context-window-management",
    "prefix-caching-prompt-caching",
    "continuous-batching-request-scheduling",
    "llm-deployment-gpu-serving-autoscaling",
    "model-gateways-routing-fallbacks",
    "reasoning-models-test-time-compute"
  ]
}
---

Your large language model starts its answer promptly, but streams out remaining tokens at a frustrating crawl. Prompt processing isn't the culprit. Each next-token decode step stalls waiting for an expensive target forward pass. Could a cheaper model guess several tokens ahead without altering the output distribution users receive?

The previous chapter deployed a [small language model](/learn/slm-specialization-edge-deployment) as the primary engine answering queries. Here, a cheap mechanism proposes tokens for the target to verify together. It can be a separate model, a trained prediction head, or a lookup in existing text. An exact sampler commits an accepted prefix and corrects the first rejection. This procedure is <span data-glossary="speculative-decoding">speculative decoding</span>. The classic algorithm preserves the target's sequence distribution in exact arithmetic, provided its actual conditional probabilities and stopping rules are respected.[^leviathan2023][^chen2023a]

The same seed need not produce the same text, because the two algorithms consume random draws differently. Floating-point kernels can also change the probabilities evaluated in serial versus verification passes. Not every heuristic called speculative decoding is exact. Before any sampler proof, the slowdown needs an explanation. Is one-token decode short of arithmetic, or is it waiting on the weights?

## Why memory bandwidth throttles autoregressive decoding

Standard target sampling has a sequential dependency: its next-token distribution conditions on tokens already selected. A transformer can score a known continuation in parallel with causal masking, but the next unknown sample is needed before the following ordinary decoding step.

Batch-one dense decoding is often limited by weight traffic, though attention, cache traffic, communication, and launch overhead can dominate particular workloads. Consider a dense decoder with $P=30\times10^9$ active BF16 matrix weights per step. Assume each weight is fetched once from HBM per pass and multiply-add counts as two FLOPs. That gives $60$ GB of weight traffic and about $60$ GFLOPs per position. This approximation excludes attention and other work; an embedding lookup does not read every stored embedding row. Under these assumptions, the weight contribution to <span data-glossary="arithmetic-intensity">arithmetic intensity</span> is:

$$
I = \frac{2P \text{ FLOPs}}{2P \text{ bytes}} = 1\text{ FLOP/byte}.
$$

NVIDIA lists 3.35 TB/s and 80 GB for H100 SXM. Its advertised BF16 rate of 1,979 TFLOP/s includes structured sparsity; the corresponding dense rate is about 989.5 TFLOP/s.[^nvidia2026h100] The weight-only peak-rate floors are:

$$
T_{\text{memory}} = \frac{60 \times 10^9\text{ bytes}}{3.35 \times 10^{12}\text{ bytes/second}} \approx 17.91\text{ ms},
$$

$$
T_{\text{compute}} = \frac{60 \times 10^9\text{ FLOPs}}{989.5 \times 10^{12}\text{ FLOPs/second}} \approx 0.061\text{ ms}.
$$

The roofline estimate uses the larger floor because memory and arithmetic can overlap. The ridge is about $989.5/3.35=295.4$ FLOP/byte. At intensity one, peak bandwidth supports roughly $1/295.4 \approx 0.34\%$ of dense peak arithmetic throughput. This rate comparison sets an arithmetic ceiling; measure GPU utilization to estimate idle time. Thin matrix operations may fall below the advertised Tensor Core peak. A $60$ GB payload leaves only part of nominal device capacity for caches and working memory; include those allocations when checking model fit.

Verification can amortize weight traffic across several known positions. Let $K$ be draft depth throughout this lesson. A common cached implementation processes one pending committed token plus $K$ proposals, producing $K+1$ next-token distributions. With $m$ input positions, a matrix-vector operation becomes a matrix-matrix operation ($Y=WX$, with $X\in\mathbb{R}^{d\times m}$). If that pass fetches the weights once and reuses them across all $m$ positions, its weight-only intensity becomes:

$$
I = \frac{2Pm\text{ FLOPs}}{2P\text{ bytes}} = m\text{ FLOP/byte}.
$$

For $K=5$ and $m=6$, the compute floor rises to about $0.364$ ms while the assumed weight-transfer floor stays $17.91$ ms. The calculation shows the opportunity created by weight reuse; measure verification time with cache reads/writes, activations, logits, masks, kernel shapes, and communication included. Tiling may fetch weights more than once. The original papers analyze conditions where short-block scoring stays close to one-step latency.[^chen2023a]

<figure>
  <img src="illustrations/_generated/weight_reuse_verification_dark.png" alt="A 30B active BF16 weight set occupies 60 GB. One pending position or six positions reuse that same stream in separate passes. The memory time floor is 17.91 ms in both cases. Compute takes 0.061 or 0.364 ms, so memory remains the slower floor. Weight reuse raises arithmetic intensity from 1 to 6 FLOP per byte." />
  <figcaption>The worksheet assumes 30B active BF16 weights (60 GB) and excludes other traffic; six positions reuse one weight read.</figcaption>
</figure>

```checkpoint
Does parallel verification violate autoregressive causality?
---
No. The probability of proposal k is read from the preceding position's logits, conditioned on the committed prefix and proposals 1 through k-1. The input position holding proposal k may attend to itself and its preceding context; its logits predict the next token. This one-position shift matters. No position can attend to future proposals.
```

## The draft-verify protocol and cache state

The classic chain method alternates sequential drafting with parallel target verification.

Let $M_q$ propose and $M_p$ verify. A draft pass fetching $2$ GB over the same peak-rate bus has a weight-transfer floor of about $2\text{ GB}/(3.35\text{ TB/s}) \approx 0.6$ ms. Five sequential passes have about a $3$ ms floor, excluding all other work. Actual drafting includes cache synchronization, kernels, sampling, and any catch-up tokens, so parameter ratio alone cannot predict its cost.

| Phase | Component | Operations performed | Latency impact |
|---|---|---|---|
| Draft | Proposer $M_q$ | Generates $K$ candidates and records the actual proposal distributions | Measure sequential drafting and catch-up work |
| Verify | Target $M_p$ | Scores candidates and bonus position, reusing cached context | Measure the actual input layout and kernels |
| Commit | Exact sampler | Accepts in order; corrects the first rejection | Sampling, synchronization, and transfer can matter |
| Synchronize | Serving engine | Keeps valid computed states and processes pending emitted tokens | Crop, gather, block ownership, or recomputation depends on the cache |

Managing <span data-glossary="kv-cache">key-value (KV) cache</span> state requires strict bookkeeping across these phases:

1. **Distinguish output from computed state.** A token is sampled from logits produced before that token is fed through the model. Emitting a token does not compute its KV entries. In ordinary cached drafting, the last sampled proposal may still be pending in the draft cache.
2. **Align verification rows.** With cached prefix `C` and pending committed token `u`, inputs `[u, x1, ..., xK]` produce distributions `[p1, p2, ..., p(K+1)]`. Row `p1` scores `x1`; the final row supplies the bonus distribution. Prefix `C` is not recomputed, though attention can still read its cache.
3. **Stop at the first rejection.** If `x1` through `xk` survive but `x(k+1)` fails, discard that token and all its descendants. Sample the correction from that position's residual distribution.
4. **Retain valid states only.** The target can keep computed KV through `xk`; rejected-path states must not be reused as the corrected prefix. Each model's valid computed length can differ. The correction must be processed before its KV exists, often as the pending input to the next pass. A token ID is not a cache entry.
5. **Handle full acceptance and termination.** Emit all $K$ proposals and a target bonus. The bonus is also pending computation. Draft catch-up and cache compaction remain implementation work. Apply EOS, stop sequences, and output limits in emitted order; stop at the first terminating event rather than publishing the rest of a speculative block.

Trace how KV cache rows lag behind emitted token IDs across a speculative round:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="emitted-is-not-computed.py"
import numpy as np

proposals = np.array([1, 2, 3], dtype=np.int64)
kv_cache = np.zeros((4, 2), dtype=np.float32)  # [seq_len, head_dim]
prefix_digests = []
digest = 0
for pos, token in enumerate(proposals):
    digest = 10 * digest + int(token)
    prefix_digests.append(digest)
    kv_cache[pos] = [float(token), float(digest)]

accepted, correction = 2, 4
valid_kv = kv_cache[:accepted].copy()
retained = prefix_digests[:accepted]
committed = np.append(proposals[:accepted], correction)
assert prefix_digests[-1] == 123  # state for rejected token 3, not correction 4
print(f"committed tokens={committed.size}, computed states={valid_kv.shape[0]}")

next_digest = 10 * retained[-1] + correction
retained.append(next_digest)
valid_kv = np.vstack([valid_kv, [[float(correction), float(next_digest)]]])
assert retained[-1] == 124 and valid_kv.shape == (3, 2)
print("after processing correction:", retained)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
committed tokens=3, computed states=2
after processing correction: [1, 12, 124]
```
<!-- leetllm: output:end -->

Suppose our committed prefix is `The train` and the draft proposes `arrives at noon`. Let $q$ represent the draft probability and $p$ represent the target probability at each prefix position.

| Proposed token | Draft $q(x)$ | Target $p(x)$ | Acceptance probability $\alpha(x)$ |
|---|---:|---:|---:|
| arrives | 0.40 | 0.60 | $\min(1, 0.60 / 0.40) = 1.00$ |
| at | 0.35 | 0.40 | $\min(1, 0.40 / 0.35) = 1.00$ |
| noon | 0.60 | 0.40 | $\min(1, 0.40 / 0.60) = 2/3$ |

The first two proposals are accepted unconditionally. The third proposal survives with probability $2/3$, even though the target model assigns it lower probability than the draft did. In this run, a uniform random draw of $0.90$ exceeds $2/3$, triggering a rejection for `noon`.

<figure>
  <img src="illustrations/_generated/draft_verify_dark.png" alt="The train arrives at noon is assembled from a committed prefix and three draft tokens. Arrives and at have q no greater than p and are kept. Noon has acceptance probability two-thirds; draw 0.90 rejects it, and one residual draw supplies dawn. The target cache retains the prefix through at. Dawn is emitted before its key and value are computed." />
  <figcaption>One possible stochastic round. Draw 0.90 rejects noon, and the pictured residual sample supplies dawn. The target cache retains the computed prefix through at; dawn is pending computation.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/logit_alignment_pending_state_dark.png" alt="The pending input u produces p1, which scores x1; x1 produces p2 for x2, x2 produces p3 for x3, and x3 produces p4 for the bonus. When proposal 3 is rejected, proposals 1 and 2 stay in the output and valid target KV. Correction 4 is emitted with pending KV, then processed on the next pass to form 124." />
  <figcaption>Each logit row predicts one step ahead. After rejection at 3, retain valid state through 2 and process correction 4 on the next pass.</figcaption>
</figure>

## Exact correction sampling and distribution proof

Rejecting `noon` does not by itself mean the user sees a different distribution from ordinary target sampling. This argument is for the exact classic sampler. It preserves target probabilities, including the target's mistakes. Verification is not factual checking. Approximate acceptance heuristics and a changed target checkpoint need separate claims about their output behavior.[^leviathan2023][^chen2023a]

Let $V$ be the vocabulary. For a candidate token $x$ proposed from distribution $q$, the acceptance probability is:

$$
\alpha(x) = \min\left(1, \frac{p(x)}{q(x)}\right).
$$

Because $x$ was sampled from $q$, we know $q(x) > 0$, making this ratio well-defined. If $q(x) \le p(x)$, the target assigns at least as much probability mass to $x$ as the draft proposed, so the token survives unconditionally ($\alpha = 1$). If $q(x) > p(x)$, the draft overproduced $x$, so we thin its frequency by accepting it with probability $p(x)/q(x)$.

When a token fails the acceptance test, we discard it along with every subsequent proposal in the draft chain. We immediately sample a replacement token from the normalized residual distribution:

$$
r(x) = \frac{[p(x) - q(x)]_+}{Z}, \quad \text{where } [z]_+ = \max(0, z), \quad Z = \sum_{y \in V} [p(y) - q(y)]_+.
$$

The term $[p(x) - q(x)]_+$ extracts only the positive probability deficit, identifying tokens where the target demands more probability mass than the draft provided.

<figure>
  <img src="illustrations/_generated/acceptance_residual_dark.png" alt="A three-token categorical example aligns draft q, target p, and their shared overlap on a common 0-to-0.6 scale. Noon has 0.2 excess draft mass, while dawn has 0.2 missing target mass. The rejection probability is 0.2 and the normalized residual is all dawn. Adding the 0.2 correction to the overlap reconstructs target probabilities 0.4, 0.5, 0.1." />
  <figcaption>Blue marks shared mass, red marks draft excess, and gold marks the target deficit. The rejection mass is 0.20; normalizing the 0.20 dawn deficit gives residual probabilities (0, 1, 0).</figcaption>
</figure>

### Account for both branches

To prove that the emitted token $X$ follows the exact target distribution $p(x)$, trace the two mutually exclusive paths that can generate an output: acceptance or rejection.

**Branch 1: Proposal accepted.** A token $x$ is proposed with probability $q(x)$ and accepted with probability $\alpha(x)$. Multiplying these gives the probability of proposing and accepting $x$:

$$
\Pr(\text{proposed } x \text{ and accepted}) = q(x) \cdot \min\left(1, \frac{p(x)}{q(x)}\right) = \min(q(x), p(x)).
$$

For $q(x)=0$, the proposal-and-accept contribution is zero without evaluating a $0/0$ ratio.

Summing across all vocabulary tokens yields the total probability of accepting any proposal:

$$
\Pr(\text{accepted}) = \sum_{y \in V} \min(q(y), p(y)).
$$

**Branch 2: Proposal rejected, correction sampled.** The probability of rejecting the proposal is the complement of total acceptance:

$$
\Pr(\text{rejected}) = 1 - \sum_{y \in V} \min(q(y), p(y)) = \sum_{y \in V} p(y) - \sum_{y \in V} \min(q(y), p(y)) = \sum_{y \in V} (p(y) - \min(q(y), p(y))).
$$

For any real numbers $a$ and $b$, the identity $a - \min(a, b) = \max(0, a - b) = [a - b]_+$ holds. Substituting $p(y)$ and $q(y)$:

$$
\Pr(\text{rejected}) = \sum_{y \in V} [p(y) - q(y)]_+ = Z.
$$

The normalization constant $Z$ of the residual distribution is the exact probability of entering the rejection branch. When rejection happens, we draw token $x$ from the normalized residual $r(x)$, so the probability of taking this branch and emitting $x$ is:

$$
\Pr(\text{rejected and emit } x) = \Pr(\text{rejected}) \cdot r(x) = Z \cdot \frac{[p(x) - q(x)]_+}{Z} = [p(x) - q(x)]_+.
$$

**Combining both branches.** By the law of total probability, the marginal probability of emitting token $x$ is the sum of both contributions:

$$
\Pr(X = x) = \min(q(x), p(x)) + [p(x) - q(x)]_+.
$$

Applying the algebraic identity $\min(a, b) + \max(0, a - b) = a$ directly confirms:

$$
\Pr(X = x) = p(x) \quad \forall x \in V.
$$

The sampling scheme recovers the target distribution exactly. If $p = q$, then $Z = 0$, rejection becomes impossible, and proposals survive with probability 1. Tokens that the draft model never proposes ($q(x) = 0 < p(x)$) remain reachable through the residual branch. Verify this arithmetic with exact fractions below, and notice how resampling directly from raw target $p$ after a rejection distorts the output by over-allocating mass to already-accepted tokens.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="reconstruct-the-target.py"
import numpy as np

q = np.array([0.6, 0.3, 0.1], dtype=np.float64)
p = np.array([0.4, 0.5, 0.1], dtype=np.float64)
overlap = np.minimum(p, q)
missing = np.maximum(0.0, p - q)
z = float(missing.sum())
r = missing / z
correct = overlap + z * r
wrong = overlap + z * p
assert np.allclose(correct, p, atol=1e-12)
assert not np.allclose(wrong, p, atol=1e-6)
print("rejection probability:", round(z, 4))
print("correction probabilities:", [round(float(x), 4) for x in r])
print("correct output:", [round(float(x), 4) for x in correct])
print("resampling raw target:", [round(float(x), 4) for x in wrong])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rejection probability: 0.2
correction probabilities: [0.0, 1.0, 0.0]
correct output: [0.4, 0.5, 0.1]
resampling raw target: [0.48, 0.4, 0.12]
```
<!-- leetllm: output:end -->

```checkpoint
Why does sampling from raw p after rejection distort the output distribution?
---
The accepted branch already accounted for the overlap min(p, q). If you draw from raw p on rejection, tokens that were already accepted get sampled again in proportion to p. That double-counts overlap tokens and under-represents tokens where the target needed extra mass.
```

## Serving transformations and tokenizer alignment

The mathematical proof assumes $p$ and $q$ represent the true probabilities governing the generation event. Serving-time transformations must therefore be incorporated into $p$ before computing acceptance ratios. If your production serving engine applies temperature scaling, top-$p$ nucleus filtering, top-$k$ truncation, min-$p$ cutoffs, or repetition penalties, $p$ must be the post-transformation, normalized categorical distribution, because comparing pre-transformation logits invalidates the proof.

The two models **don't require identical sampling settings**. A deterministic proposer, such as prompt lookup decoding, assigns probability $q(x) = 1$ to its proposed candidate and 0 elsewhere. Its acceptance probability simplifies to:

$$
\alpha(x) = \min\left(1, \frac{p(x)}{1}\right) = p(x).
$$

If the proposed token is rejected, the residual distribution samples from the remaining target mass with $x$ zeroed out:

$$
r(y) = \frac{p(y)}{1 - p(x)} \quad \forall y \ne x.
$$

A stochastic target can safely verify candidates proposed by a deterministic heuristic.[^leviathan2023] Note one implementation trap: suppose the target uses top-2 truncation while the proposer samples without truncation, so only the target distribution receives truncation:

<!-- leetllm: test, output=show -->
```python title="actual-sampling-distributions.py"
raw_target = [0.55, 0.30, 0.15]
q = [0.40, 0.35, 0.25]  # the actual, untruncated proposal distribution
p = [raw_target[0] / 0.85, raw_target[1] / 0.85, 0.0]
for token_id in (1, 2):
    wrong = min(1.0, raw_target[token_id] / q[token_id])
    correct = min(1.0, p[token_id] / q[token_id])
    print(f"token {token_id}: raw ratio={wrong:.3f}, correct={correct:.3f}")
assert p[2] == 0.0  # a target-forbidden token must never survive
```

<!-- leetllm: output:start -->
```text title="Output" output compact
token 1: raw ratio=0.857, correct=1.000
token 2: raw ratio=0.600, correct=0.000
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/transformed_distribution_dark.png" alt="The draft q remains [.40, .35, .25]. Top-2 truncation retains target masses .55 for noon and .30 for dawn, removes dusk at .15, then renormalizes .85 to p=[.6470588, .3529412, 0]. Raw acceptance factors (1, .857, .600) become (1, 1, 0), while q stays unchanged." />
  <figcaption>Top-2 renormalization changes p and its acceptance factors from (1, .857, .600) to (1, 1, 0); q remains the proposal distribution.</figcaption>
</figure>

The proof also requires a common token event space. Blindly comparing ID 4012 in one vocabulary with ID 4012 in another is invalid if they mean different tokens. Identical tokenizers are a convenient direct-implementation requirement, not a mathematical necessity: neither every tokenizer uses byte-pair merges nor every cross-tokenizer scheme requires identical segmentation.

**Checked September 22, 2026:** vLLM's Token-Level Intersection option maps normalized token strings, restricts drafts to shared tokens, and translates their IDs to the target vocabulary. Its documented heterogeneous-vocabulary path supports greedy draft sampling only. A remapped proposer must record probabilities for the distribution it actually samples; renaming IDs alone does not solve general split/merge alignment.[^vllm2026spec]

## Implement a complete probability-level round

When every proposal in a depth-$K$ round survives, sample a **bonus token** directly from the target distribution at position $K+1$. If rejection happens at position $i$, compute the correction using row $p_i$ and row $q_i$ at that exact position.

<figure>
  <img src="illustrations/_generated/round_control_and_stopping_dark.png" alt="A round drafts K tokens, scores the K proposal rows and one bonus position, then branches on the first rejection. Rejection emits the accepted prefix followed by a residual correction; full acceptance emits all K proposals followed by the target bonus. The scripted outcomes are dawn, noon dusk, and noon noon dawn. In the stopping example, the sequence uses noon as EOS, includes it, and drops the remaining block; a cap at two keeps x1 and x2 and drops x3." />
  <figcaption>Reject-at-one and reject-at-two follow the residual path, while full acceptance emits a target bonus. The EOS and cap examples show which generated tokens enter the output.</figcaption>
</figure>

This CPU implementation constructs a probability-level round over a three-token categorical model (`noon`, `dawn`, `dusk`). The target table changes with preceding context, exposing row-index mistakes. It includes an optional EOS token and output cap, but no language model, transformer, KV cache, GPU parallelism, multi-token stop matcher, or performance benchmark:

<!-- leetllm: test, id=speculative-round, output=show -->
```python title="speculative-round.py"
from math import fsum, isclose, isfinite
from random import Random

VOCAB = ("noon", "dawn", "dusk")


def checked(row):
    row = tuple(row)
    if (len(row) != len(VOCAB)
            or any(not 0 <= x <= 1 or not isfinite(x) for x in row)
            or not isclose(fsum(row), 1.0, abs_tol=1e-12, rel_tol=0)):
        raise ValueError("expected a finite normalized vocabulary distribution")
    total = fsum(row)
    return tuple(x / total for x in row)  # normalize tolerated rounding drift


def sample(row, rng):
    draw, cumulative = rng.random(), 0.0
    for token_id, probability in enumerate(row):
        cumulative += probability
        if draw < cumulative:
            return token_id
    # Only a floating-point rounding gap may reach here. Never choose zero mass.
    return max(i for i, probability in enumerate(row) if probability > 0)


def target(prefix):
    rows = {None: (0.4, 0.5, 0.1), 0: (0.1, 0.6, 0.3),
            1: (0.6, 0.2, 0.2), 2: (0.3, 0.2, 0.5)}
    return rows[prefix[-1] if prefix else None]


def proposer(prefix):
    return (0.2, 0.3, 0.5) if prefix and prefix[-1] == 2 else (0.6, 0.3, 0.1)


def speculative_round(prefix, p_model, q_model, depth, rng):
    if depth < 0:
        raise ValueError("depth must be a nonnegative integer")
    prefix = tuple(prefix)
    draft, q_rows = [], []
    for _ in range(depth):
        q = checked(q_model(prefix + tuple(draft)))
        q_rows.append(q)
        draft.append(sample(q, rng))

    # A transformer obtains these rows together with the appropriate causal mask.
    p_rows = [checked(p_model(prefix + tuple(draft[:i])))
              for i in range(depth + 1)]
    for i, token in enumerate(draft):
        p, q = p_rows[i], q_rows[i]
        if rng.random() < min(1.0, p[token] / q[token]):
            continue
        missing = [max(0.0, pi - qi) for pi, qi in zip(p, q)]
        z = sum(missing)
        if z <= 0:
            raise ArithmeticError("rejection requires positive residual mass")
        correction = sample(checked([x / z for x in missing]), rng)
        return draft[:i] + [correction], f"reject at {i + 1}"
    return draft + [sample(p_rows[-1], rng)], "bonus"


def generate(count, rng, depth=2, eos_id=None):
    if count < 0:
        raise ValueError("count must be a nonnegative integer")
    if depth < 0:
        raise ValueError("depth must be a nonnegative integer")
    if eos_id is not None and not 0 <= eos_id < len(VOCAB):
        raise ValueError("EOS must be a vocabulary ID")
    prefix = []
    while len(prefix) < count:
        emitted, _ = speculative_round(prefix, target, proposer, depth, rng)
        for token in emitted:
            prefix.append(token)
            if token == eos_id or len(prefix) == count:
                return prefix  # include EOS, discard the rest of this block
    return prefix


class Draws:
    """Scripted uniform draws to exercise particular branches, not random evidence."""
    def __init__(self, values):
        self.values = iter(values)

    def random(self):
        return next(self.values)


# First two draws propose noon, noon. Later draws decide acceptance and output.
cases = [
    ([0.05, 0.05, 0.90, 0.10], [1], "reject at 1"),
    ([0.05, 0.05, 0.10, 0.90, 0.95], [0, 2], "reject at 2"),
    ([0.05, 0.05, 0.10, 0.10, 0.20], [0, 0, 1], "bonus"),
]
for draws, expected, expected_outcome in cases:
    emitted, outcome = speculative_round([], target, proposer, 2, Draws(draws))
    assert (emitted, outcome) == (expected, expected_outcome)
    print(outcome + ":", " ".join(VOCAB[i] for i in emitted))
assert generate(0, Random(0)) == []
assert len(generate(7, Random(0))) == 7
assert generate(7, Draws([0.05, 0.05, 0.10, 0.10, 0.20]), eos_id=0) == [0]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
reject at 1: dawn
reject at 2: noon dusk
bonus: noon noon dawn
```
<!-- leetllm: output:end -->

### Test sequences across multiple positions

Matching the first-token distribution alone can miss stale or incorrect prefix updates. This empirical test runs 60,000 generations and compares the observed frequencies of all nine two-token sequences against the exact joint target probabilities:

<!-- leetllm: test, continue=speculative-round, output=show -->
```python title="sampling-checks.py"
from collections import Counter
from itertools import product

rng = Random(2026)
trials = 60_000
counts = Counter(tuple(generate(2, rng)) for _ in range(trials))
errors = []
for first, second in product(range(3), repeat=2):
    expected = target(())[first] * target((first,))[second]
    errors.append(abs(counts[(first, second)] / trials - expected))
assert max(errors) < 0.006  # reproducible numerical smoke check with stated tolerance

same, outcome = speculative_round([], target, target, 3, Random(1))
assert len(same) == 4 and outcome == "bonus"  # no zero-residual normalization
p_only = lambda prefix: (0.0, 1.0, 0.0)
q_only = lambda prefix: (1.0, 0.0, 0.0)
assert speculative_round([], p_only, q_only, 2, Random(1)) == ([1], "reject at 1")
assert len(speculative_round([], target, proposer, 0, Random(1))[0]) == 1
for invalid in ((0.5, 0.5), (0.5, -0.1, 0.6), (float("nan"), 0, 1),
                (0, 0, 0), (10**1000, 0, 0), (-0.1, 0.5, 0.6)):
    try:
        checked(invalid)
    except ValueError:
        pass
    else:
        raise AssertionError("invalid distribution accepted")
print(f"two-token maximum absolute frequency error: {max(errors):.4f}")
print("identical, disjoint, zero-depth, and invalid-input checks passed")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
two-token maximum absolute frequency error: 0.0037
identical, disjoint, zero-depth, and invalid-input checks passed
```
<!-- leetllm: output:end -->

This fixed-seed run has maximum absolute frequency error about 0.0037. It is a reproducible smoke check, not a statistical proof or evidence about a GPU sampler. The sequence-distribution proof follows by applying the conditional identity at every emitted prefix, then applying the same stopping rules.

```checkpoint
What state changes occur when proposal two is rejected?
---
Emit proposal one and a residual correction at position two. Discard proposal two and its descendants. Retain each model's already-computed valid prefix; the correction's state must be computed before reuse. The next distributions condition on the corrected output, not the discarded draft.
```

## Speedup dynamics and serving load

How many tokens does a speculative round generate on average? Assume every reached position has the same conditional acceptance probability $\alpha$; a fleet-wide average describes the geometric model only when per-position rates support that assumption. Before termination/output caps, a round emits one correction or bonus plus its accepted prefix, so reaching $i$ accepted proposals has probability $\alpha^i$. Summing across all positions gives the expected token yield $\mathbb{E}[N]$ per round:[^leviathan2023]

$$
\mathbb{E}[N] = 1 + \alpha + \alpha^2 + \dots + \alpha^K = \sum_{i=0}^K \alpha^i = \frac{1 - \alpha^{K+1}}{1 - \alpha}.
$$

The quotient applies for $\alpha\ne1$, while at $\alpha=1$ all proposals survive and $\mathbb{E}[N]=K+1$; the finite sum handles both endpoints. With $\alpha = 0.8$ and $K = 5$, the system yields:

$$
\mathbb{E}[N] = \frac{1 - 0.8^6}{1 - 0.8} = \frac{1 - 0.2621}{0.20} \approx 3.69\text{ tokens/round}.
$$

Measure time relative to one ordinary target decode step. Let $c=T_{\text{draft}}/T_{\text{target}}$ and let $v(K)=T_{\text{verify}}(K)/T_{\text{target}}$ be normalized verification cost. For the simple serial draft/verify model, include sampler, catch-up, transfer, and scheduling time in these costs or add a separate normalized overhead term. Ignoring that extra term, the modeled long-generation speedup is:

$$
\text{Speedup} \approx \frac{\mathbb{E}[N]}{v(K) + K \cdot c} = \frac{\frac{1 - \alpha^{K+1}}{1 - \alpha}}{v(K) + K \cdot c}.
$$

If drafting cost is $c = 0.1$ and verification cost remains flat ($v(K) = 1.0$), depth $K = 5$ achieves a modeled speedup of $3.69/(1.0 + 5 \times 0.1) = 3.69/1.50 \approx 2.46$ times. If verification duration grows slightly ($v(K) = 1.0 + 0.05K = 1.25$), speedup declines to $3.69/1.75 \approx 2.11$ times.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="modeled-speculation-speedup.py"
import numpy as np


def expected_tokens(alpha: float, depth: int) -> float:
    return float(np.sum(np.power(alpha, np.arange(depth + 1, dtype=np.float64))))


def modeled_speedup(alpha: float, depth: int, draft_cost: float, verify_cost: float) -> float:
    return expected_tokens(alpha, depth) / (verify_cost + depth * draft_cost)


for depth in (1, 5, 10):
    flat = modeled_speedup(0.8, depth, 0.1, 1.0)
    growing = modeled_speedup(0.8, depth, 0.1, 1.0 + 0.05 * depth)
    print(f"K={depth}: expected={expected_tokens(0.8, depth):.2f}, "
          f"flat={flat:.2f}x, growing={growing:.2f}x")
assert expected_tokens(0.0, 5) == 1.0
assert expected_tokens(1.0, 5) == 6.0
assert modeled_speedup(0.45, 1, 0.1, 1.0) > 1.0  # no universal 60% threshold
```

<!-- leetllm: output:start -->
```text title="Output" output compact
K=1: expected=1.80, flat=1.64x, growing=1.57x
K=5: expected=3.69, flat=2.46x, growing=2.11x
K=10: expected=4.57, flat=2.29x, growing=1.83x
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/speedup_surface_dark.png" alt="Modeled speedup compares two verification-cost curves for alpha .8 and draft cost .1. Flat cost peaks at K=6 with 2.46964 times; rising cost peaks at K=5 with 2.10816 times. At K=5, a proportional bar splits 3.68928 expected emitted tokens into one correction or bonus and 2.68928 accepted-prefix tokens, the sum of 1, .8, .64, .512, .4096, and .32768." />
  <figcaption>At K=5, expected yield is 3.68928: one correction or bonus plus 2.68928 accepted-prefix yield. The cost comparison uses 1 + .5 for flat verification and 1.25 + .5 for rising verification.</figcaption>
</figure>

For $0\le\alpha<1$, expected yield approaches $1/(1-\alpha)$, while positive per-step draft cost keeps growing. At $\alpha=0.8$, the limit is five emitted tokens, not five accepted proposals. A useful depth depends on the measured cost curve, acceptance by position, termination, and load. There is no universal three-to-six-token optimum; parallel draft methods do not even incur the same $Kc$ cost pattern.

### Why larger batches can change the answer

Concurrency changes the resources available for verification: it can reduce gains or produce a slowdown, though a fixed batch-size cutoff cannot be inferred from this worksheet. If weights are reused across $B$ streams, the same approximation gives:

$$
I_{\text{batch}} = \frac{2P \cdot B}{2P} = B\text{ FLOP/byte}.
$$

At $B=64$, this is only 64 FLOP/byte, still below the worksheet's dense H100 ridge of about 295.4. It cannot prove compute saturation. Attention/cache traffic and actual GEMM efficiency also matter; request concurrency is not necessarily the scheduler's current decode batch.

For a deliberately restrictive model, assume ordinary decoding and verification are fully compute-limited, each position costs the same, and verification processes $K+1$ positions per stream. Then $v(K)=K+1$. Since $\mathbb{E}[N]\le K+1$, positive sequential draft cost makes the predicted gain below one for $K>0$:

$$
\text{Speedup}_{\text{equal-cost positions}} \approx \frac{\mathbb{E}[N]}{K+1+Kc}<1\quad(K>0,\ c>0).
$$

That result follows from the stated assumptions, not from $B\ge32$. Draft weights, states, scratch space, and graph reservations may compete with serving capacity. Shared-feature or parallel proposers can have different costs; adaptive depth may make different decisions at different loads.

There is a concrete counterexample to a universal batching collapse. EAGLE-3's paper reports $1.38\times$ throughput at batch size $64$ for LLaMA-Instruct 3.1 8B on one H100 in SGLang v0.4.4, using MT-Bench and a length-three chain without tree verification. The original EAGLE gave $0.99\times$ in that test. These results describe the paper's setup; current engines and other workloads need fresh measurements.[^li2025eagle3]

Compare useful delivered throughput, latency, and capacity under the actual offered load. Speculation and continuous batching can be combined; neither wins automatically.

### Verification work isn't committed output

Scheduling budgets count submitted verification positions separately from tokens later accepted; engines can reserve a fixed window or adapt its size, so inspect the installed scheduler's rules. If each verified stream passes $1$ pending committed token plus $K$ proposals, the target forward pass consumes $K+1$ sequence positions per request. A server handling $16$ concurrent streams with $K=4$ must evaluate $16 \times (4 + 1) = 80$ positions simultaneously. If the engine's current step budget is capped at $64$ positions, that batch can't be scheduled in one pass, even if acceptance rate is near $100\%$:

<!-- leetllm: test, output=show -->
```python title="verification-budget.py"
streams, budget, alpha = 16, 64, 0.8
for depth in (0, 2, 4, 8):
    positions = streams * (depth + 1)
    expected_output = streams * sum(alpha**i for i in range(depth + 1))
    print(f"K={depth}: positions={positions}/{budget}, "
          f"expected output={expected_output:.1f}, fits={positions <= budget}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
K=0: positions=16/64, expected output=16.0, fits=True
K=2: positions=48/64, expected output=39.0, fits=True
K=4: positions=80/64, expected output=53.8, fits=False
K=8: positions=144/64, expected output=69.3, fits=False
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/verification_budget_dark.png" alt="With 16 concurrent streams and a 64-position budget, depth K asks for K+1 positions per stream. K=0 and K=2 request 16 and 48 positions and fit. K=4 and K=8 request 80 and 144, exceeding capacity. Their expected yields are 16, 39.04, 53.7856, and 69.26258 tokens under conditional acceptance .8; yield does not change the number of positions scheduled." />
  <figcaption>The bars compare requested verification positions with a 64-slot step budget; the yield column is expected output under the stated acceptance assumption.</figcaption>
</figure>

```checkpoint
If acceptance drops from 0.80 to 0.45, should you increase draft depth K to compensate?
---
Under the constant-conditional-rate model, yield still increases with depth but approaches $1/(1-0.45) \approx 1.82$ tokens. Compare the incremental yield with draft and verification cost. Even $\alpha=0.45$ gives about $1.32\times$ at $K=1$ if $c=0.1$ and $v=1$. This modeled case shows why an acceptance threshold depends on cost assumptions; inspect mismatch and test depth, method, or disabling speculation under the actual workload.
```

## Speculative tree architectures and heuristic drafting

An early rejection makes later chain proposals unusable. Under constant conditional acceptance, full-chain survival is $\alpha^K$: at $\alpha=0.70$ and $K=5$, about $0.168$. Actual acceptance depends on position and context.

A tree spends more verification work on alternatives instead of only one path. Compare verification cost with the additional accepted tokens to determine whether it lowers cost per emitted token.

| Proposer approach | Mechanism | Extra resources | What to check |
|---|---|---|---|
| Separate autoregressive draft | A smaller transformer samples a chain | Weights, draft states, sequential passes | Task match, actual proposal probabilities, placement |
| Medusa | Extra heads predict future positions from target features | Head weights, candidate/tree buffers | Frozen versus jointly changed backbone; exact versus typical acceptance |
| EAGLE-2 / EAGLE-3 | Target-conditioned trained drafter with dynamic proposals | Draft weights/states, extracted features, verification buffers | Exact target/checkpoint compatibility; the two versions have different objectives |
| Native multi-token prediction (MTP) | Model-family prediction modules supply drafts | Architecture-specific modules and state | Whether the engine supports that family's MTP/assistant path |
| Parallel draft model | A trained proposer generates several positions together | Draft weights and block/state buffers | Its joint/conditional proposal scheme and supported verification |
| Prompt lookup / n-gram | Match a suffix and propose a following span | Search/cache structures and verification buffers; no extra neural weights | Repeated text, search cost, and engine-specific lookup scope |

### Tree attention masks for parallel verification

How does a target model verify multiple competing tree branches in a single parallel forward pass without cross-branch contamination?

For an explicit tree mask, flatten $M$ candidate nodes and construct $M_{\text{tree}}\in\{0,1\}^{M\times M}$. Within candidate columns, node $j$ can attend to an ancestor or itself:

$$
M_{\text{tree}}[j, i] = \begin{cases} 1 & \text{if candidate } i \text{ is an ancestor of candidate } j \text{ or } i = j, \\ 0 & \text{otherwise.} \end{cases}
$$

Sibling branches have disallowed attention scores masked to $-\infty$ before softmax, giving zero attention probability. For a model using RoPE, candidate positions use the committed-prefix offset plus tree depth, rather than the flattened index. Other positional schemes and hybrid state require their own compatible handling.

All candidate nodes also attend to the appropriate committed prefix. The mask describes scoring, not an exact stochastic sampler. Greedy decoding can follow the longest path matching target choices; stochastic tree methods need their own proposal ordering and correction algorithm. Arbitrarily picking the longest high-probability path does not preserve $p$.[^cai2024][^li2024eagle2]

Try a four-node forest attached to the same committed prefix. Nodes 0 and 1 are alternatives; node 2 extends 0 and node 3 extends 1. Self-attention is permitted, but sibling branches stay separate:

<!-- leetllm: test, deps=numpy, id=tree-lab, output=show -->
```python title="tree-visibility.py"
import numpy as np

parents = [None, None, 0, 1]
rows, depths = [], []
for node in range(len(parents)):
    ancestors, cursor = set(), node
    while cursor is not None:
        ancestors.add(cursor)
        cursor = parents[cursor]
    rows.append([int(other in ancestors) for other in range(len(parents))])
    depths.append(len(ancestors))
mask = np.array(rows, dtype=np.int64)
assert mask[2].tolist() == [1, 0, 1, 0]
assert mask[3].tolist() == [0, 1, 0, 1]
for row in mask.tolist():
    print(row)
print("depths:", depths)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[1, 0, 0, 0]
[0, 1, 0, 0]
[1, 0, 1, 0]
[0, 1, 0, 1]
depths: [1, 1, 2, 2]
```
<!-- leetllm: output:end -->

This worksheet traces tree visibility, with prefix columns and their position offset omitted. A fused attention implementation and tree-sampling correctness check require separate steps. Candidate input 2's logits predict a continuation after node 2, not the probability of node 2 itself.

<figure>
  <img src="illustrations/_generated/tree_visibility_and_position_dark.png" alt="Two alternatives at tree depth one become nodes 0 and 1 at position ID 10. Their children 2 and 3 share position ID 11. With parents [None, None, 0, 1], candidate attention rows are 1000, 0100, 1010, and 0101: each node sees itself and its ancestors, so sibling branches stay hidden. Shared-prefix columns are omitted from this candidate-only matrix." />
  <figcaption>Candidate keys follow the ancestor mask; shared prefix columns remain visible in the full attention layout. Nodes at equal depth share a position ID.</figcaption>
</figure>

Turn the mask into a weighted-value computation for node 2. Give off-branch node 1 a large score, then change its value. A correctly isolated branch must remain unchanged. An ordinary lower-triangular mask over flattened nodes includes node 1 and fails this check:

<!-- leetllm: test, continue=tree-lab, output=show -->
```python title="flattened-causal-mask-leaks-an-off-branch-node.py"
scores = np.array([-1.0, 4.0, 0.0, 3.0], dtype=np.float64)
values = np.array([1.0, 100.0, 2.0, 200.0], dtype=np.float64)

def attend(visible_row: np.ndarray, val: np.ndarray) -> float:
    masked = np.where(visible_row.astype(bool), scores, -np.inf)
    weights = np.exp(masked - np.max(masked))
    return float((weights / weights.sum()) @ val)

tree_result = attend(mask[2], values)
flat_mask = np.tril(np.ones((4, 4), dtype=np.int64))[2]
flat_result = attend(flat_mask, values)
changed_off_branch = np.array([1.0, 10_000.0, 2.0, 200.0], dtype=np.float64)
assert np.isclose(attend(mask[2], changed_off_branch), tree_result)
assert not np.isclose(attend(flat_mask, changed_off_branch), flat_result)
prefix_length = 10  # cached positions 0 through 9, no pending input in this forest
positions = [prefix_length + depth - 1 for depth in depths]
assert positions == [10, 10, 11, 11]
print(f"node 2: tree={tree_result:.3f}; flattened causal={flat_result:.3f}")
print("candidate position IDs:", positions)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
node 2: tree=1.731; flattened causal=97.598
candidate position IDs: [10, 10, 11, 11]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/tree_sibling_counterexample_dark.png" alt="For query node 2, tree attention includes ancestor node 0 and itself while excluding off-branch node 1. Raising that off-branch value from 100 to 10000 leaves the correct tree-masked output at 1.731. A flattened causal mask leaks the value, moving its output from 97.598 to 9755.630 on the plotted logarithmic axis." />
  <figcaption>Changing off-branch node 1 leaves the tree-masked result at 1.731; the flattened causal mask leaks its value into query 2.</figcaption>
</figure>

The printed values are the attention output for a single query under the tree mask, which is the quantity the target model would feed forward to produce verification logits. Alternatives at the same depth have the same position ID. If the verification layout also includes a pending committed token, account for its position before placing proposals; don't apply this forest's offset blindly to a different layout.[^cai2024]

Original EAGLE predicts features immediately before the target LM head, using target features and a token sequence shifted one step ahead. The target head turns predicted features into draft token probabilities; EAGLE still proposes tokens. Its paper calls these second-to-top-layer features, rather than a separate earlier transformer block.[^li2024] EAGLE-2 makes the draft tree context-dependent using draft confidence, with expansion and reranking.[^li2024eagle2]

EAGLE-3 removes the feature-prediction constraint and directly trains token prediction. It fuses low-, mid-, and high-layer target features and simulates multi-step drafting during training. Describing the entire family as feature prediction misses this important change.[^li2025eagle3]

Medusa also needs a distinction: Medusa-1 freezes the backbone, while Medusa-2 trains it jointly with the heads. Joint training can change the target itself. The paper's typical acceptance heuristic explicitly relaxes distribution matching for stochastic generation, so analyze its output distribution under that procedure separately from the exact residual-correction method above.[^cai2024]

Prompt lookup requires no extra model training. A common scheme matches a trailing token n-gram against prompt text and proposes the following span. Some engines also search generated-text caches. It can be useful when outputs repeat available text, but searching, maintaining indexes, and verifying candidates still cost memory and time. A copied span remains a proposal, not a trusted legal or factual answer.[^vllmNgram2026][^sglang2026speculative]

**Implementation snapshot, October 10, 2026:** vLLM documents MTP and parallel PARD drafting in addition to EAGLE and n-grams; compatibility depends on the trained method and model family.[^vllmMTP2026][^vllmParallelDraft2026] SGLang documents EAGLE-3, standalone drafting, MTP, and DFlash block verification, among other methods.[^sglang2026speculative] This map summarizes documented methods; speed comparisons require measurements on the same workload.

The first-rejection rule above belongs to token-wise verification. SGLang also documents optional block verification for supported stochastic proposal paths: it tests draft prefixes jointly and can retain a longer accepted prefix after an earlier prefix test failed. That method requires its own correction distribution; simply continuing the sampler above after rejection would not preserve exactness.[^sglang2026speculative]

Record engine version, target/draft revisions, quantization, attention backend, parallel topology, and sampler settings. Check returned-logprob, grammar, penalties, multimodal, graph, and scheduler compatibility for that exact method. vLLM documents finite-precision/logprob variability; neither seed equality nor greedy equality proves arbitrary stochastic correctness.[^vllm2026spec]

## Measure serving speedup with paired benchmarks

Speculative decoding performance depends heavily on your specific serving environment, so validate improvements using a strictly controlled paired experiment before rolling out to production. Keep the target model checkpoint, quantization format, prompt distribution, sampling parameters, and server hardware topology identical across both arms. Record non-speculative baseline latency, then run the speculative configuration under matching offered load while tracking these production metrics:

- **Client TTFT and completion latency:** Include queueing, target prefill, draft initialization, and delivery. Speculation accelerates generation work; it does not remove prompt processing. Measure any first-token regression against the product requirement.
- **Delivered token gaps:** Record client timestamps and tail pauses. Tokens from one round may arrive in a burst followed by a long gap; average server time per token does not describe that experience. Separate reasoning tokens from visible answer tokens when relevant.
- **Accepted proposals and emitted yield:** Log both distributions. Yield includes a correction or bonus and can be reduced by termination. Set health thresholds from the workload's measured acceptance and latency behavior.
- **Acceptance by reached position:** Count accepted/reached at each depth and segment by task, context, and sampling mode. A first-position rate alone cannot decide whether drafting is profitable.
- **Useful capacity under load:** Sweep representative offered request rates and scheduler batches, beyond 64 if relevant. Track delivered throughput, latency SLO attainment, memory peaks, failures, and queue growth. A sampled crossover has uncertainty and can change with workload or adaptive depth.

Use repeated paired prompt sets, report uncertainty, and account for stochastic output lengths. For a fixed-token timing experiment, state the token cap and EOS treatment; for completed user tasks, report the actual completion-length distribution. Track extra verification positions and draft work separately from useful output. Extra work can raise cost per completed task or reduce SLO-qualified serving capacity even when an isolated stream runs faster.

### Follow-up questions

#### How do position-dependent acceptance rates affect expected length?

Let $a_i$ denote the conditional probability of accepting the $i$-th candidate given that candidates 1 through $i-1$ were accepted. The expected emitted tokens per round is:

$$
\mathbb{E}[N] = 1 + a_1 + a_1 a_2 + a_1 a_2 a_3 + \dots + \prod_{i=1}^K a_i.
$$

Measure acceptance rates strictly from reached positions, not all drafted positions, because if position 1 acceptance drops on challenging reasoning prompts, expected length collapses rapidly across all downstream positions. Even the arithmetic mean of conditional rates loses crucial information, as these depth-two examples show:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="position-order-matters.py"
import numpy as np

for rates in ((0.9, 0.1), (0.5, 0.5), (0.1, 0.9)):
    arr = np.array(rates, dtype=np.float64)
    expected = 1.0 + float(np.cumprod(arr).sum())
    print(f"rates={rates}, mean={arr.mean():.2f}, yield={expected:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rates=(0.9, 0.1), mean=0.50, yield=1.99
rates=(0.5, 0.5), mean=0.50, yield=1.75
rates=(0.1, 0.9), mean=0.50, yield=1.19
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/reached_position_yield_dark.png" alt="Three depth-two rate schedules have the same arithmetic mean conditional acceptance, .50. Their ordered rates produce survival products .09, .25, and .09 after two proposals. Adding the guaranteed correction or bonus and each reached accepted proposal gives yields 1.99, 1.75, and 1.19 tokens per round." />
  <figcaption>Position order changes expected yield even when the arithmetic mean conditional acceptance is .50.</figcaption>
</figure>

#### How do you isolate a sampler defect from GPU kernel precision shifts?

First, isolate the probability sampler on synthetic fixed probability distributions across CPU and GPU. Test edge cases including complete agreement ($p=q$), zero overlap, and scripted rejections at every position. If fixed tables match, compare target model logits produced during serial decoding against logits produced during batched verification.

Model-only discrepancies narrow the investigation to masks, position/logit alignment, cache state, preprocessing, and numerical behavior, rather than identifying a single cause. Quantized kernels, deterministic reduction-order differences, and batch-dependent rounding can matter without random kernel execution. Check serial/verification logits under matched inputs and tolerances, then test the complete sampler, stopping, and delivery paths, remembering that a finite frequency test cannot prove equality across every prompt or tiny-probability event. Finally, a measured speedup still needs its own account of weight traffic, and a rejected draft token is not a change in the target distribution, since the correction still has to be processed before its cache state exists.

### What strong answers show

- State the assumptions behind weight-only intensity and distinguish a roofline floor from measured latency or idle time.
- Derive the residual identity for actual conditional sampling distributions; qualify numerics, termination, tokenizer mapping, and approximate acceptance.
- Align verification logits and retain only valid computed states. Explain why a correction or bonus remains pending until processed.
- Compare yield against measured drafting, verification, and scheduling cost under actual load, including burst delivery and serving capacity.
- Distinguish original EAGLE, EAGLE-3, Medusa variants, MTP, parallel drafting, and lookup methods without turning one benchmark into a universal ranking.

## Check your understanding

```mastery-quiz
[
  {
    "question": "A proposed token has q = 0.45 and p = 0.27. The drawn acceptance uniform is 0.58. Which ratio and decision follow?",
    "options": [
      "0.27; accept the proposal.",
      "0.60; reject the proposal.",
      "0.60; accept the proposal.",
      "0.45; reject the proposal."
    ],
    "answer": "0.60; accept the proposal.",
    "explanation": "Use min(1, p/q) = 0.27/0.45 = 0.60. Since 0.58 is below 0.60, this proposal survives; it need not be the target argmax."
  },
  {
    "question": "At one prefix, p = (0.2, 0.5, 0.3) and q = (0.5, 0.4, 0.1). Which pair gives the rejection mass Z and normalized correction law?",
    "options": [
      "Z = 0.3; r = (0, 1/3, 2/3).",
      "Z = 0.3; r = (0.2, 0.5, 0.3).",
      "Z = 0.6; r = (0, 1/3, 2/3).",
      "Z = 0.3; r = (0, 0.1, 0.2)."
    ],
    "answer": "Z = 0.3; r = (0, 1/3, 2/3).",
    "explanation": "Positive p minus q is (0, 0.1, 0.2), totaling 0.3. Normalize by 0.3. The accepted overlap plus Z times this residual reconstructs p; raw-target resampling and unnormalized deficits do not."
  },
  {
    "question": "The raw target is (0.50, 0.35, 0.15), with top-2 target truncation. The actual proposer stays q = (0.20, 0.50, 0.30). What acceptance factors apply to IDs 1 and 2, using zero-based IDs?",
    "options": [
      "ID 1: 0.700; ID 2: 0.500.",
      "ID 1: 0.824; ID 2: 0.500.",
      "ID 1: 0.700; ID 2: 0.000.",
      "ID 1: 0.824; ID 2: 0.000."
    ],
    "answer": "ID 1: 0.824; ID 2: 0.000.",
    "explanation": "Normalize the retained target mass 0.85. ID 1 has p = 0.35/0.85 = 7/17, so p/q = 14/17≈0.824. ID 2 is removed by the target policy, hence acceptance 0. The actual proposer law stays unchanged."
  },
  {
    "question": "Cached prefix C is followed by pending committed u. Verification inputs are [u, r, s, t]. Proposal r survives and s is rejected. Which scoring row and state transition are correct?",
    "options": [
      "Score s with the row after s; retain C/u/r and emit a pending correction.",
      "Score s with the row after r; retain C/u/r and emit a pending correction.",
      "Score s with the row after r; retain C/u/r/s and reuse the correction state.",
      "Score s with the row after s; retain C/u/r/s and reuse the correction state."
    ],
    "answer": "Score s with the row after r; retain C/u/r and emit a pending correction.",
    "explanation": "A row predicts the next token, so logits after r score s. The target may retain computed state through r, while s and t belong to the rejected path. Sampling the correction gives an ID whose state still needs computation."
  },
  {
    "question": "Depth-three examples A and B have reached-position acceptance rates A = (0.60, 0.25, 0.80) and B = (0.80, 0.25, 0.60). Before stopping limits, what are their expected emitted yields?",
    "options": [
      "A: 1.87; B: 1.87.",
      "A: 1.87; B: 2.12.",
      "A: 2.12; B: 1.87.",
      "A: 2.65; B: 2.65."
    ],
    "answer": "A: 1.87; B: 2.12.",
    "explanation": "Add one plus each cumulative prefix product. A gives 1 + 0.6 + 0.15 + 0.12 = 1.87; B gives 1 + 0.8 + 0.2 + 0.12 = 2.12. Their arithmetic mean acceptance is the same, but earlier acceptance controls whether later positions are reached."
  },
  {
    "question": "A scheduler has 38 input positions available for its next verification step. Each of seven streams has one committed token waiting for the target to process. How many input positions would all seven streams request with two proposals per stream? How many would they request with five?",
    "options": [
      "14 and 35",
      "21 and 38",
      "28 and 49",
      "21 and 42"
    ],
    "answer": "21 and 42",
    "explanation": "Count the pending token and every proposal when checking the budget. With two proposals per stream, all seven streams need 7 × 3 = 21 positions and fit. With five, they need 7 × 6 = 42 positions, four over budget. The counts 14 and 35 omit the pending tokens. The pair 21 and 38 caps the second request at the number of available positions. The counts 28 and 49 add an input for a possible bonus token. The target can already sample that bonus from the final proposal’s output row."
  },
  {
    "question": "A candidate forest has parents [none, none, 0, 0, 2]. The committed cache ends at position 6, with no pending input. Which candidate-key row belongs to node 4 and which position ID does node 4 use?",
    "options": [
      "Visibility [1,0,1,0,1]; position 9.",
      "Visibility [1,1,1,1,1]; position 9.",
      "Visibility [1,0,1,0,1]; position 11.",
      "Visibility [1,1,1,1,1]; position 11."
    ],
    "answer": "Visibility [1,0,1,0,1]; position 9.",
    "explanation": "Node 4 has ancestor 2, ancestor 0 and itself, excluding other branches. Root candidates start at 7, their children at 8, and node 4 at 9. Flat index 4 would place it at 11 and lose the equal-depth position rule."
  },
  {
    "question": "Experiment A retains the baseline target checkpoint and uses the exact conditional residual sampler. B jointly updates the backbone and uses a typical-token heuristic. Which target-preservation claims are justified by these configurations?",
    "options": [
      "A: preservation unestablished; B: baseline law preserved.",
      "A: baseline law preserved; B: baseline law preserved.",
      "A: baseline law preserved; B: preservation unestablished.",
      "A: preservation unestablished; B: preservation unestablished."
    ],
    "answer": "A: baseline law preserved; B: preservation unestablished.",
    "explanation": "A preserves the same target law under the exact sampler assumptions. B changes the target checkpoint and relaxes stochastic acceptance, so neither change inherits that baseline-law claim. A frozen or changed backbone and an exact or heuristic sampler are separate choices."
  },
  {
    "question": "Two matched 10-second service trials require at least 95% offered-request attainment. A offers 100 requests and qualifies 96; B offers 140 and qualifies 130. Which highest tested passing offered rate and qualified throughput follow?",
    "options": [
      "A: 10 offered requests/s; 9.6 qualified requests/s.",
      "B: 14 offered requests/s; 13.0 qualified requests/s.",
      "A: 9.6 offered requests/s; 10 qualified requests/s.",
      "B: 13.0 offered requests/s; 14 qualified requests/s."
    ],
    "answer": "A: 10 offered requests/s; 9.6 qualified requests/s.",
    "explanation": "A attains 96/100 = 96%; B attains 130/140 ≈ 92.86%, which fails 95%. A is the highest passing tested point even though B achieves more qualified responses per second. Both denominators retain the full 10-second window and offered population."
  },
  {
    "question": "A deterministic lookup proposes the third event under target p = (0.20, 0.35, 0.45). Its acceptance uniform is 0.50. Which decision and correction law apply?",
    "options": [
      "Accept; correction law (4/11, 7/11, 0).",
      "Reject; correction law (4/11, 7/11, 0).",
      "Accept; correction law (0.20, 0.35, 0.45).",
      "Reject; correction law (0.20, 0.35, 0.45)."
    ],
    "answer": "Reject; correction law (4/11, 7/11, 0).",
    "explanation": "The actual proposer is a point mass at the third event. Acceptance is p(third) = 0.45, so 0.50 rejects. Remove that event and renormalize remaining mass 0.55: 0.20/0.55 = 4/11 and 0.35/0.55 = 7/11. A copied token remains a proposal rather than a trusted answer."
  }
]
```

> **Next:** Continue to [Long Context Window Management](/learn/long-context-window-management). Speculation can amortize weight traffic, while the model's full, windowed, or recurrent attention determines context work and state. The next chapter examines those memory and quality trade-offs.
