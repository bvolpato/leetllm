---
{
  "id": "speculative-decoding",
  "title": "Speculative Decoding",
  "slug": "speculative-decoding",
  "section": "GPU Systems & LLM Inference",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 6,
  "coverImage": "illustrations/_generated/draft_verify_dark.png",
  "companies": [
    "Google",
    "DeepMind",
    "Meta",
    "Anthropic",
    "OpenAI"
  ],
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
    "continuous-batching-request-scheduling",
    "kv-cache-paged-attention-llm-serving",
    "decoding-strategies-greedy-beam-nucleus"
  ],
  "relatedQuestions": [
    "positional-encoding-rope-alibi",
    "kv-cache-paged-attention-llm-serving",
    "continuous-batching-request-scheduling",
    "llm-deployment-gpu-serving-autoscaling",
    "llm-cost-engineering-token-economics",
    "reasoning-models-test-time-compute"
  ]
}
---

Your LLM finishes reading the prompt in milliseconds, then dribbles out its answer one token at a time. Each step waits on a full read of tens of billions of weights. What if a tiny draft model guessed five tokens ahead, and the big target model graded all five in one pass in roughly the time of a single step, **without changing the output distribution at all**?

That is <span data-glossary="speculative-decoding">speculative decoding</span>.[^leviathan2023][^chen2023a] Whereas the previous chapter deployed a [small language model](/learn/local-llm-deployment-hardware-quantization) directly, here a cheap proposer (a smaller model, extra prediction heads, or n-gram prompt lookup) drafts candidates and an exact rejection-sampling rule accepts the valid prefix and corrects the first mismatch. In exact arithmetic, the output matches sampling from the target model alone in distribution.

## Why memory bandwidth throttles autoregressive decoding

Autoregressive generation is sequential: you cannot sample token $t+1$ until token $t$ is chosen. At batch size 1, a dense 30B BF16 model reads $60\text{ GB}$ of weights from HBM for just $60\text{ GFLOPs}$ of linear math per token, an <span data-glossary="arithmetic-intensity">arithmetic intensity</span> of **1 FLOP/byte** ($I = 2P / 2P = 1$).

On an NVIDIA H100 SXM (3.35 TB/s HBM bandwidth and 989.5 TFLOP/s dense BF16 peak, half of the 1,979 TFLOP/s sparse headline[^nvidia2026h100]):

$$
T_{\text{memory}} = \frac{60 \times 10^9\text{ B}}{3.35 \times 10^{12}\text{ B/s}} \approx 17.91\text{ ms}, \qquad T_{\text{compute}} = \frac{60 \times 10^9\text{ FLOPs}}{989.5 \times 10^{12}\text{ FLOPs/s}} \approx 0.061\text{ ms}.
$$

Single-token decode uses just $0.34\%$ of dense peak (ridge point $295.4$ FLOPs/byte). Passing $m = K + 1$ known positions (1 pending committed token plus $K$ draft proposals) through the target model turns matrix-vector products into matrix-matrix products ($Y = WX$) reusing the same 60 GB weight read across all $m$ positions ($I = m$ FLOP/byte). For $K = 5$ ($m = 6$), the compute floor climbs to $0.364\text{ ms}$ while weight transfer stays flat at **$17.91\text{ ms}$**: scoring six positions rides nearly for free on the memory read you already paid for one.[^chen2023a]

<figure>
  <img src="illustrations/_generated/weight_reuse_verification_dark.png" alt="A 30B active BF16 weight set occupies 60 GB. One pending position or six positions reuse that same stream in separate passes. The memory time floor is 17.91 ms in both cases. Compute takes 0.061 or 0.364 ms, so memory remains the slower floor. Weight reuse raises arithmetic intensity from 1 to 6 FLOP per byte." />
  <figcaption>Reusing one 60 GB weight stream across 6 positions raises arithmetic intensity 6× while leaving the 17.91 ms weight-transfer floor unchanged.</figcaption>
</figure>

## The draft-verify protocol and cache state

One speculative cycle alternates sequential drafting ($M_q$) with one parallel target verification pass ($M_p$):

| Phase | Operations | Latency driver |
|---|---|---|
| **Draft ($M_q$)** | Proposes $K$ tokens and records $q_1 \dots q_K$ | $K$ tiny serial passes + catch-up |
| **Verify ($M_p$)** | Scores `[u, x1, ..., xK]` in parallel, emitting $p_1 \dots p_{K+1}$ | One batched target pass + KV attention |
| **Commit & sync** | Accepts in order, corrects first rejection (or emits bonus), crops KV cache | Lightweight sampling + cache crop |

Clean <span data-glossary="kv-cache">KV cache</span> bookkeeping rests on one rule: **emitting a token ID does not compute its KV entry.** With cached prefix `C` and pending committed token `u`, verification runs on `[u, x1, ..., xK]`. Under causal masking, logits `p1` (after `u`) score `x1`, logits `p2` (after `x1`) score `x2`, and `p(K+1)` supplies the bonus distribution if all $K$ proposals survive. If `x1..xk` survive and `x(k+1)` fails, the target keeps computed KV through `xk`, discards `x(k+1)` onward, and queues the correction token as the next round's pending input.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="emitted-is-not-computed.py"
import numpy as np

proposals = np.array([1, 2, 3], dtype=np.int64)
kv_cache = np.zeros((4, 2), dtype=np.float32)
digests, d = [], 0
for pos, tok in enumerate(proposals):
    d = 10 * d + int(tok)
    digests.append(d)
    kv_cache[pos] = [float(tok), float(d)]

accepted, correction = 2, 4
valid_kv = kv_cache[:accepted].copy()
retained = digests[:accepted]
committed = np.append(proposals[:accepted], correction)
print(f"committed tokens={committed.size}, computed KV states={valid_kv.shape[0]}")

next_d = 10 * retained[-1] + correction
retained.append(next_d)
valid_kv = np.vstack([valid_kv, [[float(correction), float(next_d)]]])
print("after processing correction:", retained)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
committed tokens=3, computed KV states=2
after processing correction: [1, 12, 124]
```
<!-- leetllm: output:end -->

Trace a round on prefix `The train` where the draft proposes `arrives at noon` with $(q, p)$ pairs `(0.40, 0.60)`, `(0.35, 0.40)`, and `(0.60, 0.40)`. The first two survive automatically because $q \le p$. At `noon`, $\alpha = 0.40 / 0.60 = 2/3$; a uniform draw of `0.90` rejects it, crops target KV back to `at`, and samples `dawn` from the residual distribution.

<figure>
  <img src="illustrations/_generated/draft_verify_dark.png" alt="The train arrives at noon is assembled from a committed prefix and three draft tokens. Arrives and at have q no greater than p and are kept. Noon has acceptance probability two-thirds; draw 0.90 rejects it, and one residual draw supplies dawn. The target cache retains the prefix through at. Dawn is emitted before its key and value are computed." />
  <figcaption>One speculative round: `arrives` and `at` survive unconditionally, draw 0.90 rejects `noon`, and the residual branch emits `dawn` while retaining target KV through `at`.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/logit_alignment_pending_state_dark.png" alt="The pending input u produces p1, which scores x1; x1 produces p2 for x2, x2 produces p3 for x3, and x3 produces p4 for the bonus. When proposal 3 is rejected, proposals 1 and 2 stay in the output and valid target KV. Correction 4 is emitted with pending KV, then processed on the next pass to form 124." />
  <figcaption>One-position logit shift: row $p_i$ comes from the preceding token. After rejecting proposal 3, valid KV ends at 2 and correction 4 is processed on the next pass.</figcaption>
</figure>

## Exact correction sampling and distribution proof

For any candidate $x$ sampled from $q$ ($q(x) > 0$), accept it with probability $\alpha(x) = \min(1, p(x)/q(x))$.[^leviathan2023][^chen2023a] On rejection, discard the remaining draft tail and sample a replacement from the normalized positive deficit:

$$
r(x) = \frac{[p(x) - q(x)]_+}{Z}, \qquad [z]_+ = \max(0, z), \qquad Z = \sum_{y \in V} [p(y) - q(y)]_+.
$$

<figure>
  <img src="illustrations/_generated/acceptance_residual_dark.png" alt="A three-token categorical example aligns draft q, target p, and their shared overlap on a common 0-to-0.6 scale. Noon has 0.2 excess draft mass, while dawn has 0.2 missing target mass. The rejection probability is 0.2 and the normalized residual is all dawn. Adding the 0.2 correction to the overlap reconstructs target probabilities 0.4, 0.5, 0.1." />
  <figcaption>Blue shows shared mass $\min(p, q)$, red shows draft excess that triggers rejection ($Z = 0.20$), and gold shows the target deficit that the residual branch refills.</figcaption>
</figure>

### Account for both branches

An emitted token $X = x$ arrives through two mutually exclusive paths:

1. **Accepted:** $\Pr(\text{proposed } x \text{ and accepted}) = q(x)\min(1, p(x)/q(x)) = \min(q(x), p(x))$.
2. **Rejected and corrected:** Total rejection probability equals $1 - \sum_y \min(q(y), p(y)) = \sum_y [p(y) - q(y)]_+ = Z$. Multiplying by $r(x) = [p(x) - q(x)]_+ / Z$ cancels $Z$, giving $[p(x) - q(x)]_+$.

Summing both branches via $\min(a, b) + \max(0, a - b) = a$ recovers $p(x)$ identically for every token in $V$ (including tokens with $q(x) = 0$):

$$
\Pr(X = x) = \min(q(x), p(x)) + [p(x) - q(x)]_+ = p(x) \quad \forall x \in V.
$$

> **Common mistake:** Never resample from raw $p$ after rejection. Acceptance already contributed $\min(p, q)$, so redrawing from raw $p$ double-counts overlap tokens instead of exclusively refilling $[p(x) - q(x)]_+$.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="reconstruct-the-target.py"
import numpy as np

q = np.array([0.6, 0.3, 0.1])
p = np.array([0.4, 0.5, 0.1])
overlap = np.minimum(p, q)
missing = np.maximum(0.0, p - q)
z = float(missing.sum())
r = missing / z

print("rejection mass Z:", round(z, 4))
print("residual r:      ", np.round(r, 4).tolist())
print("exact output:    ", np.round(overlap + z * r, 4).tolist())
print("naive raw-p bug: ", np.round(overlap + z * p, 4).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rejection mass Z: 0.2
residual r:       [0.0, 1.0, 0.0]
exact output:     [0.4, 0.5, 0.1]
naive raw-p bug:  [0.48, 0.4, 0.12]
```
<!-- leetllm: output:end -->

## Serving transformations and tokenizer alignment

The proof requires $p$ and $q$ to be the **post-transformation** distributions actually sampled at serving time (after temperature, top-$p$, top-$k$, min-$p$, and repetition penalties). Draft and target need not share sampling rules: a deterministic prompt lookup sets $q(x) = 1$ on its proposed token, reducing acceptance to $\alpha(x) = p(x)$ and the residual to $r(y) = p(y)/(1 - p(x))$ for $y \ne x$.[^leviathan2023] When the target applies top-2 truncation while the draft stays untruncated, renormalize the retained target mass (`0.85`) so forbidden tokens get acceptance probability `0`:

<!-- leetllm: test, output=show -->
```python title="actual-sampling-distributions.py"
raw_target = [0.55, 0.30, 0.15]
q = [0.40, 0.35, 0.25]
p = [raw_target[0] / 0.85, raw_target[1] / 0.85, 0.0]  # top-2 truncated target
for tid in (1, 2):
    print(f"token {tid}: raw ratio={min(1.0, raw_target[tid] / q[tid]):.3f}, correct={min(1.0, p[tid] / q[tid]):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
token 1: raw ratio=0.857, correct=1.000
token 2: raw ratio=0.600, correct=0.000
```
<!-- leetllm: output:end -->

Both models must share one token event space: an identical tokenizer is cleanest, while cross-tokenizer engines such as vLLM's Token-Level Intersection map shared token strings into target IDs.[^vllm2026spec]

## Implement a complete probability-level round

Below is a full speculative round on a 3-token Markov model (`noon`, `dawn`, `dusk`), covering rejection at position 1, rejection at position 2, and full acceptance with a target bonus token. Always apply EOS and length caps in emitted order so tokens generated past EOS are discarded:

<!-- leetllm: test, id=speculative-round, output=show -->
```python title="speculative-round.py"
from random import Random

VOCAB = ("noon", "dawn", "dusk")

def sample(row, rng):
    draw, acc = rng.random(), 0.0
    for tid, prob in enumerate(row):
        acc += prob
        if draw < acc:
            return tid
    return max(i for i, prob in enumerate(row) if prob > 0)

def target(prefix):
    table = {None: (0.4, 0.5, 0.1), 0: (0.1, 0.6, 0.3),
             1: (0.6, 0.2, 0.2), 2: (0.3, 0.2, 0.5)}
    return table[prefix[-1] if prefix else None]

def proposer(prefix):
    return (0.2, 0.3, 0.5) if prefix and prefix[-1] == 2 else (0.6, 0.3, 0.1)

def speculative_round(prefix, p_model, q_model, depth, rng):
    prefix = tuple(prefix)
    draft, q_rows = [], []
    for _ in range(depth):
        q = q_model(prefix + tuple(draft))
        q_rows.append(q)
        draft.append(sample(q, rng))

    p_rows = [p_model(prefix + tuple(draft[:i])) for i in range(depth + 1)]
    for i, tok in enumerate(draft):
        p, q = p_rows[i], q_rows[i]
        if rng.random() < min(1.0, p[tok] / q[tok]):
            continue
        missing = [max(0.0, pi - qi) for pi, qi in zip(p, q)]
        z = sum(missing)
        return draft[:i] + [sample([x / z for x in missing], rng)], f"reject at {i + 1}"
    return draft + [sample(p_rows[-1], rng)], "bonus"

def generate(count, rng, depth=2, eos_id=None):
    prefix = []
    while len(prefix) < count:
        emitted, _ = speculative_round(prefix, target, proposer, depth, rng)
        for tok in emitted:
            prefix.append(tok)
            if tok == eos_id or len(prefix) == count:
                return prefix
    return prefix

class Draws:
    def __init__(self, vals):
        self.it = iter(vals)
    def random(self):
        return next(self.it)

for draws in ([0.05, 0.05, 0.90, 0.10], [0.05, 0.05, 0.10, 0.90, 0.95], [0.05, 0.05, 0.10, 0.10, 0.20]):
    emitted, outcome = speculative_round([], target, proposer, 2, Draws(draws))
    print(f"{outcome}: {' '.join(VOCAB[i] for i in emitted)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
reject at 1: dawn
reject at 2: noon dusk
bonus: noon noon dawn
```
<!-- leetllm: output:end -->

### Test sequences across multiple positions

Testing only position 1 misses stale-prefix bugs. Comparing all nine pair frequencies over 60,000 two-token runs against exact joint probabilities $p(x_1)p(x_2 \mid x_1)$ verifies multi-position conditioning:

<!-- leetllm: test, continue=speculative-round, output=show -->
```python title="sampling-checks.py"
from collections import Counter
from itertools import product

rng, trials = Random(2026), 60_000
counts = Counter(tuple(generate(2, rng)) for _ in range(trials))
max_err = max(
    abs(counts[(a, b)] / trials - target(())[a] * target((a,))[b])
    for a, b in product(range(3), repeat=2)
)
assert max_err < 0.006
assert speculative_round([], target, target, 3, Random(1))[1] == "bonus"
assert speculative_round([], lambda _: (0, 1, 0), lambda _: (1, 0, 0), 2, Random(1)) == ([1], "reject at 1")
print(f"Max two-token frequency error over {trials:,} runs: {max_err:.4f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Max two-token frequency error over 60,000 runs: 0.0037
```
<!-- leetllm: output:end -->

## Speedup dynamics and serving load

Under constant conditional acceptance $\alpha$ at each reached position, a depth-$K$ round emits 1 guaranteed token (correction or bonus) plus each surviving prefix token with probability $\alpha^i$:[^leviathan2023]

$$
\mathbb{E}[N] = \sum_{i=0}^K \alpha^i = \frac{1 - \alpha^{K+1}}{1 - \alpha}, \qquad \text{Speedup} \approx \frac{\mathbb{E}[N]}{v(K) + K \cdot c}
$$

Here $c = T_{\text{draft}}/T_{\text{target}}$ and $v(K) = T_{\text{verify}}(K)/T_{\text{target}}$. At $\alpha = 0.8, c = 0.1, K = 5$, yield is **3.69 tokens/round**, giving **$2.46\times$** under flat verification ($v = 1.0$) or **$2.11\times$** if verification grows ($v = 1 + 0.05K$). Yield saturates at $1/(1-\alpha) = 5$ while drafting cost $Kc$ climbs linearly, creating an interior peak.

<figure>
  <img src="illustrations/_generated/speedup_surface_dark.png" alt="Modeled speedup compares two verification-cost curves for alpha .8 and draft cost .1. Flat cost peaks at K=6 with 2.46964 times; rising cost peaks at K=5 with 2.10816 times. At K=5, a proportional bar splits 3.68928 expected emitted tokens into one correction or bonus and 2.68928 accepted-prefix tokens, the sum of 1, .8, .64, .512, .4096, and .32768." />
  <figcaption>Yield saturates toward $1/(1-\alpha) = 5$ while drafting cost grows linearly with $K$, creating an interior optimum around $K = 5\text{ to }6$ for $\alpha=0.8, c=0.1$.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="modeled-speculation-speedup.py"
import numpy as np

def expected_tokens(alpha: float, depth: int) -> float:
    return float(np.sum(np.power(alpha, np.arange(depth + 1, dtype=np.float64))))

for depth in (1, 5, 10):
    y = expected_tokens(0.8, depth)
    print(f"K={depth:>2}: yield={y:.2f}, flat(v=1)={y / (1.0 + 0.1*depth):.2f}x, growing(v=1+0.05K)={y / (1.0 + 0.15*depth):.2f}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
K= 1: yield=1.80, flat(v=1)=1.64x, growing(v=1+0.05K)=1.57x
K= 5: yield=3.69, flat(v=1)=2.46x, growing(v=1+0.05K)=2.11x
K=10: yield=4.57, flat(v=1)=2.29x, growing(v=1+0.05K)=1.83x
```
<!-- leetllm: output:end -->

### Why larger batches can change the answer

As batch size $B$ climbs, ordinary decode already amortizes weights ($I_{\text{batch}} \approx B$ FLOPs/byte). In the compute-limited extreme where every verified position costs a full step ($v(K) = K + 1$), $\mathbb{E}[N] / (K + 1 + Kc) < 1$ whenever $K > 0, c > 0$. Still, there is no universal batch cliff: on Llama 3.1 8B (H100, SGLang, MT-Bench), **EAGLE-3** reached **$1.38\times$ throughput at batch 64** with a length-3 chain, while original EAGLE sat at $0.99\times$.[^li2025eagle3]

### Verification work isn't committed output

Schedulers reserve step capacity for **submitted verification positions**, not accepted output. With $16$ concurrent streams and a 64-position step budget, each stream submits $K + 1$ positions (1 pending + $K$ drafts): $K = 2$ fits (`48 / 64`), whereas $K = 4$ requests `80 / 64` and overflows regardless of acceptance rate.

<figure>
  <img src="illustrations/_generated/verification_budget_dark.png" alt="With 16 concurrent streams and a 64-position budget, depth K asks for K+1 positions per stream. K=0 and K=2 request 16 and 48 positions and fit. K=4 and K=8 request 80 and 144, exceeding capacity. Their expected yields are 16, 39.04, 53.7856, and 69.26258 tokens under conditional acceptance .8; yield does not change the number of positions scheduled." />
  <figcaption>Submitted positions scale as $B(K+1)$, overflowing the 64-position step budget at $K=4$ even when expected yield stays under 54 tokens.</figcaption>
</figure>

## Speculative tree architectures and heuristic drafting

On a single chain, one early rejection discards all downstream guesses ($\alpha^5 = 16.8\%$ at $\alpha = 0.70$). Tree and self-drafting designs widen the bet without a separate full draft model:

| Approach | Mechanism | Key distinction |
|---|---|---|
| Separate draft model | Smaller transformer proposes a chain | Exact with residual sampler; extra weights + KV cache |
| **Medusa**[^cai2024] | Extra LM heads predict $t+1 \dots t+k$ from target features | Medusa-1 freezes backbone; Medusa-2 tunes jointly; typical acceptance relaxes exactness |
| **EAGLE 1/2/3**[^li2024][^li2024eagle2][^li2025eagle3] | Lightweight target-conditioned drafter | EAGLE predicts features; EAGLE-2 builds dynamic trees; EAGLE-3 fuses multi-layer features for direct token prediction |
| **Native MTP & parallel drafts**[^vllmMTP2026][^vllmParallelDraft2026] | Multi-token prediction heads or parallel proposers | Native support in vLLM and SGLang[^sglang2026speculative] |
| **Prompt lookup / n-gram**[^vllmNgram2026][^sglang2026speculative] | Copies matching n-gram spans from prompt/cache | Zero extra weights; exact when verified as $q(x) = 1$ |

(Engines like SGLang also offer optional **block verification** that tests draft prefixes jointly under its own correction rule, distinct from token-wise verification.[^sglang2026speculative])

### Tree attention masks for parallel verification

To verify competing branches in one pass without leaking sibling tokens across paths, flatten all $M$ tree nodes and build an ancestor mask $M_{\text{tree}}[j, i] = 1$ iff candidate $i$ is an ancestor of $j$ or $i = j$. Assign RoPE position IDs by **prefix offset + tree depth** so sibling alternatives share the same position!

<figure>
  <img src="illustrations/_generated/tree_visibility_and_position_dark.png" alt="Two alternatives at tree depth one become nodes 0 and 1 at position ID 10. Their children 2 and 3 share position ID 11. With parents [None, None, 0, 1], candidate attention rows are 1000, 0100, 1010, and 0101: each node sees itself and its ancestors, so sibling branches stay hidden. Shared-prefix columns are omitted from this candidate-only matrix." />
  <figcaption>Ancestor attention mask isolates sibling branches (`1010` for node 2, `0101` for node 3) while nodes at equal depth share position IDs (10 and 11).</figcaption>
</figure>

Perturbing off-branch node 1 from `100` to `10,000` proves why a standard flattened causal mask fails: the tree mask holds node 2 fixed at `1.731`, whereas the flattened mask leaks the off-branch edit (`97.598` $\to$ `9755.630`):

<!-- leetllm: test, deps=numpy, output=show -->
```python title="tree-visibility-and-isolation.py"
import numpy as np

parents = [None, None, 0, 1]
rows, depths = [], []
for node in range(len(parents)):
    anc, cur = set(), node
    while cur is not None:
        anc.add(cur)
        cur = parents[cur]
    rows.append([int(o in anc) for o in range(len(parents))])
    depths.append(len(anc))
mask = np.array(rows, dtype=np.int64)

scores = np.array([-1.0, 4.0, 0.0, 3.0])
def attend(visible_row, vals):
    masked = np.where(visible_row.astype(bool), scores, -np.inf)
    w = np.exp(masked - masked.max())
    return float((w / w.sum()) @ vals)

flat_row = np.tril(np.ones((4, 4), dtype=np.int64))[2]
v1 = np.array([1.0, 100.0, 2.0, 200.0])
v2 = np.array([1.0, 10_000.0, 2.0, 200.0])
print(f"Tree mask node 2:     v1={attend(mask[2], v1):.3f}, v2={attend(mask[2], v2):.3f} (isolated)")
print(f"Flat causal node 2:   v1={attend(flat_row, v1):.3f}, v2={attend(flat_row, v2):.3f} (leaked!)")
print("RoPE position IDs (prefix_len=10):", [10 + d - 1 for d in depths])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Tree mask node 2:     v1=1.731, v2=1.731 (isolated)
Flat causal node 2:   v1=97.598, v2=9755.630 (leaked!)
RoPE position IDs (prefix_len=10): [10, 10, 11, 11]
```
<!-- leetllm: output:end -->

## Measure serving speedup with paired benchmarks

Run a paired benchmark holding target checkpoint, quantization, prompts, sampling settings, and hardware fixed across both arms, tracking:
- **TTFT, completion latency, and tail token gaps:** Speculation emits bursts of 3 to 5 tokens separated by longer pauses, so track client tail gaps alongside mean TPS.
- **Acceptance by reached position (`accepted / reached`)** segmented by depth and task.
- **SLO-qualified capacity:** Sweep offered request rate and report the highest tested rate meeting the attainment threshold (e.g., $\ge 95\%$ of offered requests within SLO) plus its qualified throughput over the full window.

### Follow-up questions

#### How do position-dependent acceptance rates affect expected length?

With conditional acceptance rates $a_i = \Pr(\text{accept } i \mid \text{accepted } 1 \dots i-1)$, expected yield is $\mathbb{E}[N] = 1 + a_1 + a_1 a_2 + \dots + \prod_{i=1}^K a_i$. Early acceptance dominates because later positions are only reached if earlier ones survive: three depth-2 schedules with identical mean `0.50` yield `1.99`, `1.75`, and `1.19` tokens/round:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="position-order-matters.py"
import numpy as np

for rates in ((0.9, 0.1), (0.5, 0.5), (0.1, 0.9)):
    arr = np.array(rates, dtype=np.float64)
    print(f"rates={rates}, mean={arr.mean():.2f}, yield={1.0 + float(np.cumprod(arr).sum()):.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rates=(0.9, 0.1), mean=0.50, yield=1.99
rates=(0.5, 0.5), mean=0.50, yield=1.75
rates=(0.1, 0.9), mean=0.50, yield=1.19
```
<!-- leetllm: output:end -->

#### How do you isolate a sampler defect from GPU kernel precision shifts?

Verify the rejection sampler first on fixed synthetic probability tables ($p = q$, disjoint support, scripted rejections), then compare serial target logits against batched verification logits on identical inputs to isolate mask, position-ID, KV-alignment, or quantized reduction-order bugs.[^vllm2026spec]

### What strong answers show

- Tie single-token decode slowness to HBM weight bandwidth and show how verifying $K+1$ positions reuses one weight read.
- Prove $\min(p, q) + [p - q]_+ = p$ on post-transformation serving distributions and keep logit alignment, KV cropping, and pending correction states distinct.
- Size speculation against draft cost, step position budgets $B(K+1)$, and SLO-qualified throughput under load, distinguishing exact samplers from heuristic/joint-tuned methods like Medusa-2.

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
    "explanation": "Normalize the retained target mass 0.85. ID 1 has p = 0.35/0.85 = 7/17, so p/q = 14/17≈0.824. ID 2 is removed by the target truncation, hence acceptance 0. The actual proposer law stays unchanged."
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

> **Next:** Continue to [Model Quantization: GPTQ, AWQ & GGUF](/learn/model-quantization-gptq-awq-gguf).
