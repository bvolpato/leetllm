---
{
  "id": "state-space-models-mamba-alternatives",
  "title": "Mamba & State Space Models",
  "slug": "state-space-models-mamba-alternatives",
  "section": "Inference & Production Scale",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 24,
  "coverImage": "illustrations/_generated/mamba_vs_transformer_dark.png",
  "companies": [
    "Cartesia",
    "Together AI",
    "AI21 Labs",
    "NVIDIA",
    "Google DeepMind"
  ],
  "shortDescription": "Replace a growing KV cache with a fixed state, then test what selection, prefix scans, and branch rollback can and cannot restore.",
  "keyConceptsTested": [
    "Structured State Spaces (S4) and HiPPO initialization",
    "Mamba's selective scan mechanism",
    "Linear-time sequence modeling vs. quadratic attention",
    "Mamba-2 and state space duality (SSD)",
    "Mamba-3 inference-first refinements",
    "Hybrid Transformer-SSM architectures (Jamba, Nemotron-H)",
    "Workload-specific memory, retrieval, and latency trade-offs",
    "Recurrent checkpoints and speculative state rollback"
  ],
  "prerequisites": [
    "mixture-of-experts-architecture",
    "long-context-window-management",
    "long-context-engineering-beyond-management",
    "flashattention-memory-efficient-attention",
    "kv-cache-paged-attention-llm-serving",
    "rnns-lstms-grus-sequence-modeling"
  ],
  "relatedQuestions": [
    "reasoning-models-test-time-compute",
    "llm-deployment-gpu-serving-autoscaling",
    "model-parallelism-for-llm-inference",
    "multi-query-grouped-query-attention",
    "prefix-caching-prompt-caching",
    "design-reasoning-agent-test-time-compute"
  ]
}
---

Every token a standard Transformer generates appends another row to its <span data-glossary="kv-cache">KV cache</span>. At 64K tokens, a 32-layer model holds 32 GiB of history for a single request. What if you replaced that growing table with a single fixed-size running summary that never grows past 5 MiB, no matter how long the conversation gets?

That is the bet behind **<span data-glossary="state-space-model">State Space Models (SSMs)</span>** and **<span data-glossary="mamba">Mamba</span>**.[^gu2023] Full <span data-glossary="self-attention">self-attention</span> keeps every past token directly addressable in memory, making exact verbatim lookup natural at $O(L)$ cache cost. An SSM folds history into a fixed recurrent state $h_t$, giving $O(1)$ per-request decode memory and linear-time training at the price of compressing past tokens into a finite vector.

<figure>
  <img src="illustrations/_generated/mamba_vs_transformer_dark.png" alt="Side-by-side comparison of Transformer KV cache versus Mamba-1 fixed state. Top panel shows KV slots t1 through t4 and tL growing linearly with query q[L+1] reaching back to K2 (O(L) history). Bottom panel shows Mamba-1 updating one fixed recurrent state slot from h[t] to h[t+1] alongside a four-slot rolling conv window [t-3, t-2, t-1, now] (O(1) per token)." />
  <figcaption>Attention appends a KV entry for every position ($O(L)$ memory). Mamba-1 instead updates one fixed recurrent state and a four-slot rolling convolution window ($O(1)$ live memory per request).</figcaption>
</figure>

```checkpoint
What is the core serving tradeoff between attention and Mamba-style SSMs?
---
Attention keeps token-level access to prior context through a KV cache that grows linearly with sequence length. Mamba-style SSMs keep a fixed-size recurrent state, eliminating context-length memory growth during decode while compressing history.
```

## A discrete recurrence you can compute by hand

At its heart, a discrete SSM is two linear equations that update a hidden state $h_t$ and read out an output $y_t$:

$$
h_t = \bar{A}\, h_{t-1} + \bar{B}\, x_t, \qquad y_t = \bar{C}\, h_t + \bar{D}\, x_t
$$

The first term carries prior memory forward; the second writes the new token into state. Set $\bar{A} = 0.9$, $\bar{B} = 0.2$, $\bar{C} = 1.0$, $\bar{D} = 0$, and step through the four inputs $x = [3, 1, 4, 2]$ starting from $h_0 = 0$:

| Step $t$ | Input $x_t$ | Carry $0.9\,h_{t-1}$ | Write $0.2\,x_t$ | State $h_t$ |
|:---:|:---:|:---:|:---:|:---:|
| 1 | 3 | 0.0000 | 0.60 | **0.6000** |
| 2 | 1 | 0.5400 | 0.20 | **0.7400** |
| 3 | 4 | 0.6660 | 0.80 | **1.4660** |
| 4 | 2 | 1.3194 | 0.40 | **1.7194** |

Look at how clean that is: memory never grows, yet step 4 still carries echoes of all four inputs. Lower $\bar{A}$ from `0.9` to `0.1`, and the final state plunges to `0.4826` because early inputs wash out almost immediately. State retention depends on the **decay dynamics**, not just the state width.

<figure>
  <img src="illustrations/_generated/ssm_recurrence_dark.png" alt="Two-panel scalar SSM trace across steps t=1 to t=4 on inputs [3, 1, 4, 2]. Top bar chart tracks state h[t] rising from 0.6000 to 0.7400, 1.4660, and 1.7194 on a 0-to-2 axis. Bottom matrix decomposes each step into carried state 0.9 h[t-1] (0.0000, 0.5400, 0.6660, 1.3194), incoming write 0.2 x[t] (0.60, 0.20, 0.80, 0.40), and updated h[t]." />
  <figcaption>Tracing $h_t = 0.9 h_{t-1} + 0.2 x_t$ on $[3, 1, 4, 2]$. By step 4, most of $h_4 = 1.7194$ comes from carried history rather than the latest write.</figcaption>
</figure>

## Where $\bar{A}$ and $\bar{B}$ come from

SSMs begin in continuous time as a linear differential equation driven by signal $x(t)$:

$$
h'(t) = \mathbf{A}h(t) + \mathbf{B}x(t), \qquad y(t) = \mathbf{C}h(t) + \mathbf{D}x(t)
$$

Because language arrives as discrete tokens rather than smooth waveforms, we discretize over a step width $\Delta$ using a **zero-order hold (ZOH)** (holding $x(t)$ constant across each step $\Delta$):[^gu2023]

$$
\bar{\mathbf{A}} = e^{\Delta \mathbf{A}}, \qquad
\bar{\mathbf{B}} = (\Delta \mathbf{A})^{-1}(e^{\Delta \mathbf{A}} - \mathbf{I})\,\Delta \mathbf{B} = \int_0^\Delta e^{u\mathbf{A}}\mathbf{B}\,du
$$

For scalar $A = -1, B = 1, \Delta = 1$, exact ZOH gives $\bar{A} = e^{-1} \approx 0.368$ and $\bar{B} = 1 - e^{-1} \approx 0.632$. Near $A = 0$, evaluating $(e^{\Delta A} - 1)/A$ directly loses precision, so numerical implementations use `np.expm1` and fall back to $\bar{B} = \Delta B$ at $A = 0$.

## S4: structured state spaces

An arbitrary random transition matrix $\mathbf{A}$ either explodes or forgets everything after a few dozen steps. **S4** (Structured State Spaces)[^gu2022] solves long-horizon memory with **HiPPO initialization**[^gu2021], which projects input history onto orthogonal polynomials so different coordinates preserve information across many timescales right from step zero.

Because S4's coefficients $(\bar{\mathbf{A}}, \bar{\mathbf{B}}, \mathbf{C})$ stay **fixed across every token** (a **Linear Time-Invariant**, or **LTI**, system), the exact same model runs in two mathematically identical modes:

- **Recurrent mode (generation):** $h_t = \bar{\mathbf{A}} h_{t-1} + \bar{\mathbf{B}} x_t$, updating in $O(s)$ time and $O(s)$ memory per channel.
- **Convolutional mode (training):** Unrolling from $h_0 = 0$ turns the entire sequence into a single causal convolution $y = x * \bar{K} + \mathbf{D}x$ with impulse-response kernel $\bar{K}_j = \mathbf{C}\bar{\mathbf{A}}^j\bar{\mathbf{B}}$, computed in parallel via FFT in $O(L \log L)$ time! (Starting from nonzero $h_0$ adds the decaying homogeneous term $\mathbf{C}\bar{\mathbf{A}}^t h_0$.)

<!-- leetllm: test, deps=numpy, output=show -->
```python title="zoh-and-convolution-duality.py"
import numpy as np

# 1. Exact ZOH discretization (stable near A=0 via expm1)
for a in (-1.0, 0.0, -1e-12):
    delta = 1.0
    a_bar = np.exp(delta * a)
    b_bar = delta if a == 0.0 else np.expm1(delta * a) / a
    print(f"ZOH A={a:g}: A_bar={a_bar:.6f}, B_bar={b_bar:.6f}")

# 2. Causal convolution matches sequential recurrence bit for bit
x = np.array([3.0, 1.0, 4.0, 2.0])
kernel = 0.2 * (0.9 ** np.arange(len(x)))
conv_out = np.convolve(x, kernel)[:len(x)]

h, rec_out = 0.0, []
for val in x:
    h = 0.9 * h + 0.2 * float(val)
    rec_out.append(h)

assert np.allclose(conv_out, rec_out, atol=1e-12)
print("recurrence == convolution:", np.round(conv_out, 4).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
ZOH A=-1: A_bar=0.367879, B_bar=0.632121
ZOH A=0: A_bar=1.000000, B_bar=1.000000
ZOH A=-1e-12: A_bar=1.000000, B_bar=1.000000
recurrence == convolution: [0.6, 0.74, 1.466, 1.7194]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/recurrence_convolution_dark.png" alt="Top causal Toeplitz weight matrix aligns inputs 3, 1, 4, and 2 with kernel weights 0.200, 0.180, 0.162, and 0.146 across four steps. Bottom bar chart displays identical step outputs 0.600, 0.740, 1.466, and 1.719 for both convolution and recurrence." />
  <figcaption>With fixed LTI coefficients, unrolling the recurrence becomes a Toeplitz matrix-vector product (causal convolution) with kernel $[0.200, 0.180, 0.162, 0.146]$, producing identical outputs in parallel.</figcaption>
</figure>

> **Key insight:** LTI convolution has one fatal blind spot for language: because $\bar{\mathbf{A}}$, $\bar{\mathbf{B}}$, and $\mathbf{C}$ never look at the current token, the model applies the exact same forget/write rule to filler words like *"the"* and critical identifiers like `max_retries`.

## Mamba: selective state spaces

**Mamba** breaks the LTI bottleneck by making $\mathbf{B}_t$, $\mathbf{C}_t$, and step size $\Delta_t$ **functions of the current token activation $x_t$** while keeping diagonal $\mathbf{A} < 0$ and skip $\mathbf{D}$ input-independent:[^gu2023]

$$
\mathbf{B}_t = \text{Linear}_B(x_t), \qquad \mathbf{C}_t = \text{Linear}_C(x_t), \qquad \Delta_t = \text{softplus}(\text{Linear}_\Delta(x_t))
$$

Because $\mathbf{A}$ has negative diagonal entries, $\Delta_t$ acts like a continuous content-aware gate:
- **Large $\Delta_t$:** shrinks carryover $e^{\Delta_t A}$ (forgetting old clutter) and amplifies the new write $\Delta_t B_t x_t$ (writing an important token into state).
- **Small $\Delta_t$:** keeps $e^{\Delta_t A} \approx 1$ (preserving memory) and skips over filler tokens.

Inside a **Mamba-1 block**, the projected input splits into two branches: the upper path runs a short causal 1D convolution (`k=4`) and SiLU before driving the selective SSM scan, and the lower `SiLU(z)` branch gates the output elementwise.[^gu2023][^mamba2026scanref][^mamba2026implementation]

<figure>
  <img src="illustrations/_generated/mamba_block_dark.png" alt="Dataflow diagram of the Mamba selective SSM block. Input x[t] enters Proj (2E), splitting upward into Conv (k=4 SiLU) and downward into SiLU(z) Gate. Conv feeds Select (D, B, C) and SSM (Scan + D), and Select also feeds SSM. SSM and SiLU(z) merge at Mul (y * gate) and exit downward to Out y[t] (D)." />
  <figcaption>Mamba-1 block: the main stream applies a width-4 causal convolution, SiLU, and input-selective SSM scan, then multiplies elementwise by a parallel SiLU(z) gate.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/selective_update_terms_dark.png" alt="Three-panel selective update trace for x = [3, 1, 4, 2]. Top panel shows stacked carry plus write bars on a shared 0-to-1.65 axis. Middle table lists x[t], Delta, a_bar, C[t], and h[t] across t=1..4. Bottom bar chart displays modulated readouts y[t] = C[t] h[t]: 0.67, 0.45, 1.76, and 1.19." />
  <figcaption>Selective update trace on $x = [3, 1, 4, 2]$: larger inputs trigger bigger $\Delta_t$ (faster decay of old state, stronger new write) and modulated readouts $y_t = C_t h_t$.</figcaption>
</figure>

### How do you parallelize a non-LTI recurrence on GPUs?

Once $\bar{\mathbf{A}}_t$ and $\bar{\mathbf{B}}_t$ vary per token, FFT convolution no longer applies. Mamba recovers $O(\log L)$ parallel depth with two ideas:

1. **Associative parallel scan:** Every step is an affine transform $h \mapsto a_t h + b_t$. Composing two steps $(a_1, b_1)$ then $(a_2, b_2)$ yields $(a_2 a_1, a_2 b_1 + b_2)$. That composition is **associative** (though non-commutative, so left-to-right order stays fixed), letting a binary prefix-scan tree compute all $L$ states in parallel!
2. **SRAM fusion:** Like [FlashAttention](/learn/flashattention-memory-efficient-attention), Mamba's <span data-glossary="cuda">CUDA</span> kernel fuses discretization and scan inside fast on-chip SRAM so expanded states never materialize in slow HBM.[^gu2023]

<figure>
  <img src="illustrations/_generated/selective_scan_dark.png" alt="Three-panel associative prefix scan diagram for steps t1..t4. Top upward tree reduces adjacent pairs into (0.81, 0.74) and (0.81, 1.12) and root (0.6561, 1.7194). Middle downward tree propagates identity (1, 0) left and prefix (0.81, 0.74) right. Bottom grid shows applied prefix states h1=0.600, h2=0.740, h3=1.466, and h4=1.7194." />
  <figcaption>A two-pass Blelloch-style associative prefix scan composes affine pairs upward and distributes prefixes downward, recovering every intermediate state in $O(\log L)$ depth.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="associative-prefix-scan.py"
def compose(right, left):
    a_r, b_r = right
    a_l, b_l = left
    return a_r * a_l, a_r * b_l + b_r

def prefix_scan(steps, initial=0.0):
    n = len(steps)
    size = 1
    while size < n:
        size *= 2
    tree = [(1.0, 0.0)] * (2 * size)
    tree[size:size + n] = steps
    for node in range(size - 1, 0, -1):
        tree[node] = compose(tree[2 * node + 1], tree[2 * node])

    out = [0.0] * n
    def down(node, before):
        if node >= size:
            idx = node - size
            if idx < n:
                a, b = compose(tree[node], before)
                out[idx] = a * initial + b
            return
        down(2 * node, before)
        down(2 * node + 1, compose(tree[2 * node], before))

    down(1, (1.0, 0.0))
    return out

steps = [(0.9, 0.6), (0.9, 0.2), (0.9, 0.8), (0.9, 0.4)]
print("prefix scan states:", [round(v, 4) for v in prefix_scan(steps)])
print("order matters (non-commutative):", compose(steps[1], steps[0]) != compose(steps[0], steps[1]))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
prefix scan states: [0.6, 0.74, 1.466, 1.7194]
order matters (non-commutative): True
```
<!-- leetllm: output:end -->

```checkpoint
Why can an associative scan parallelize selective SSMs, but not a standard RNN whose transition depends on the previous hidden state?
---
In a selective SSM, every affine pair (a_t, b_t) depends only on the input sequence x_t, so all pairs exist upfront before the scan. A nonlinear RNN mixes h_{t-1} inside its transition, preventing associative pre-composition.
```

## Mamba-2 and Mamba-3: Tensor Cores and decode intensity

Mamba-1 was linear time, yet its custom elementwise scan underutilized GPU Tensor Cores.

- **Mamba-2 (State Space Duality, SSD)**[^dao2024] constrains each head's transition $\mathbf{A}_t$ to a scalar multiple of the identity matrix. That restriction exposes a direct duality with masked linear attention and splits sequence work into chunks (e.g., width 256): intra-chunk outputs and chunk-end states run as **batched Tensor Core matrix multiplications**, leaving only a tiny inter-chunk scan across chunk boundaries. Core layers run **2–8x faster** than Mamba-1's scan!
- **Mamba-3**[^gu2026] targets memory-bound decoding along three axes: **exponential-trapezoidal discretization** ($h_t = \alpha_t h_{t-1} + (1-\lambda_t)\Delta_t\alpha_t B_{t-1}x_{t-1} + \lambda_t\Delta_t B_t x_t$, replacing the separate conv buffer with a previous-write slot), **complex-valued rotations** for stronger state tracking (like parity and modular arithmetic), and **multi-input, multi-output (MIMO)** state updates that execute up to 4x more decode FLOPs at matched H100 latency by increasing <span data-glossary="arithmetic-intensity">arithmetic intensity</span> inside the memory-bound state read.

<figure>
  <img src="illustrations/_generated/ssd_boundary_chunks_dark.png" alt="Top-left 4x16 grid shows 16,384 tokens filling 64 green chunks of width B=256; top-right 5x16 grid shows 16,385 tokens filling 64 blue chunks plus 1 active cell in the 65th chunk with 255 pad slots. Bottom graph shows Chunks C (B=256 slices) branching into parallel End states (Scan h0..hk) and Local matmul (Y_diag chunk), summing into Final Y (Y_diag + C*h)." />
  <figcaption>Mamba-2's SSD divides sequences into fixed chunks (e.g., 256 tokens), executing local work via Tensor Core matmuls and propagating only compact chunk-end states across chunks.</figcaption>
</figure>

## Complexity comparison and hybrid architectures

Compare per-request live decode memory for a 32-layer model (2 bytes/element) as context scales from 128 to 65,536 tokens:

| Architecture | Training | Decode / token | Live decode state | At 64K context (32L) |
|---|---|---|---|---|
| **Transformer (MHA-32)** | $O(L^2 d)$ | $O(Ld)$ | $O(Ld)$ linear | **32,768 MiB** (32 GiB) |
| **Hybrid (4 Attn + 28 SSM)** | Mixed | Mixed | $O(Ld)$ (12.5% slope) | **4,100 MiB** (4.0 GiB) |
| **Pure Mamba-1 SSM** | $O(L s d)$ | $O(sd)$ | $O(sd)$ **constant** | **5.0 MiB** |

<figure>
  <img src="illustrations/_generated/complexity_scaling_dark.png" alt="Two-panel live decode-state scaling across contexts 128 to 65,536 tokens. Top line chart shows Transformer KV cache reaching 32 GiB and a 4-attention/28-SSM hybrid reaching 4.004 GiB on a zero-based GiB axis, while the pure SSM stack hugs zero. Bottom zoomed bar chart shows the 32-layer SSM stack constant at 5.0 MiB across every context length." />
  <figcaption>Live decode memory across context lengths: Transformer KV climbs to 32 GiB at 64K, a 4-attention/28-SSM hybrid drops to 4.0 GiB, and a pure SSM stays flat at 5.0 MiB.</figcaption>
</figure>

Why do **hybrid architectures** dominate practical long-context SSM deployments? Because pure fixed-state models compress history into a finite vector: two distinct prefixes can collide into the **exact same state** (`summarize([3, 1]) == summarize([1, 2]) == 1.25` under $h_t = 0.5 h_{t-1} + 0.5 x_t$), making exact verbatim copying harder over long documents. Interleaving a handful of attention layers restores token-addressable lookup while slashing KV growth by 8x–12x:

- **Jamba-v0.1**[^ai21labs2024]: 1 attention + 7 Mamba layers per 8-layer block (with MoE MLPs).
- **Nemotron-H 8B**[^nvidia2025]: 4 attention + 24 Mamba-2 + 24 FFN sublayers (~8% attention).
- **Qwen3.6-35B-A3B**[^qwen3635b2026]: alternates 3 Gated DeltaNet layers with 1 gated-attention layer alongside MoE FFNs.

<figure>
  <img src="illustrations/_generated/hybrid_architecture_dark.png" alt="Left column shows a hybrid layer flow: SSM sublayers (Fixed state O(1)) into Sparse attention (KV lookup O(L)) into FFN / MoE (Stateless mix). Right column shows published layer counts: Jamba 8-layer block with 1 Attn and 7 Mamba layers, and Nemotron-H-8B 52 sublayers with 4 Attn, 24 Mamba-2, and 24 FFN." />
  <figcaption>Hybrid backbones run every token sequentially through mostly recurrent layers plus occasional full-attention layers that restore direct token lookup at a fraction of the KV cost.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/state_collision_continuation_dark.png" alt="Left-to-right flow graph showing sequences B: [1, 2] and A: [3, 1] both merging at Collision h2 = 1.250 under h[t] = 0.5 h[t-1] + 0.5 x[t], then advancing identically along + x3=4 (h3 = 2.625) and + x4=2 (h4 = 2.313)." />
  <figcaption>Two distinct prefixes $[3, 1]$ and $[1, 2]$ collide at $h_2 = 1.250$, illustrating why finite recurrent summaries cannot always recover arbitrary earlier tokens verbatim.</figcaption>
</figure>

## Serving subtleties: checkpoints, conv buffers, and rollback

Fixed live decode state changes how serving engines handle prefix caching and [speculative decoding](/learn/speculative-decoding):

1. **Prefix snapshots still grow with length:** To resume a shared 64K prompt at arbitrary boundaries without re-running prefill, engines like vLLM cache periodic SSM checkpoints (e.g., 5 MiB every 1,024 tokens = `320 MiB` of snapshots beside the `5 MiB` live state).[^vllmMambaCache2026]
2. **Save EVERY stateful buffer:** Resuming a Mamba-1 block requires saving *both* the recurrent state $h_t$ and the rolling causal convolution window. Restoring only $h_t$ while zeroing the conv buffer silently corrupts the very next token!
3. **Speculative rollback needs snapshots, not truncation:** Unlike a KV cache (where rejecting draft tokens simply truncates trailing slots), an SSM mutates one state slot in place. And you cannot algebraically invert the step, because tiny decay factors like $e^{-1000}$ underflow to `0.0`! Engines must restore an accepted checkpoint or replay from the last accepted token.

<figure>
  <img src="illustrations/_generated/fixed_state_checkpoint_policy_dark.png" alt="Two-panel state retention comparison. Top bar chart compares 1 live state (5 MiB), 8 concurrent live requests (40 MiB), 8K context with 8 snapshots (45 MiB), and 64K context with 64 snapshots (325 MiB). Bottom panel illustrates the 64K footprint as a 64-tile snapshot grid next to a stacked 5 MiB live vs 320 MiB saved-snapshot bar (98.5% snapshots)." />
  <figcaption>Periodic prefix checkpoints (every 1,024 tokens) grow linearly to 320 MiB at 64K context even though the active decode state stays flat at 5 MiB.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/stream_buffer_restore_dark.png" alt="Top flow branches from Prefix [3,1] (h2 = 2.15) into two paths on suffix [4, 2]: green Restore +4 -> Match +2 yields u=2.9, h=3.98 then u=2.4, h=4.388, while red dashed Zero +4 -> Drift +2 yields u=2.0, h=3.08 then u=2.2, h=3.738. Bottom panels compare Saved conv window [3*0.2, 1*0.3, 4*0.5] summing to u3 = 2.90 against Cleared conv window [0*0.2, 0*0.3, 4*0.5] summing to u3 = 2.00." />
  <figcaption>Restoring only $h_2$ while clearing the rolling conv window drops the next filtered input from 2.90 to 2.00 and drifts the stream.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/recurrent_rollback_dark.png" alt="Left-to-right rollback graph starting at Prefix [3,1] (h2 = 1.250) to Accept 99 (Save 50.125), branching to dashed green Rollback + 4 (Valid 27.063) versus amber Reject 77 (Dirty 63.563) followed by red Dirty + 4 (Drift 33.781)." />
  <figcaption>When speculative draft token 77 is rejected, stepping from the mutated state drifts to 33.781; restoring the saved snapshot after accepted token 99 recovers the exact state 27.063.</figcaption>
</figure>

Let's verify both failure modes (missing conv buffer and dirty speculative rollback) plus the prefill-vs-decode latency crossover in one short NumPy script:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="ssm-state-checkpoint-and-rollback.py"
import numpy as np

# 1. Conv buffer + recurrence checkpoint restoration
w = np.array([0.2, 0.3, 0.5])
def run_conv_ssm(vals, h=0.0, buf=None):
    buf = np.zeros(3) if buf is None else buf.copy()
    out = []
    for v in vals:
        buf = np.roll(buf, -1); buf[-1] = v
        h = 0.5 * h + float(np.dot(w, buf))
        out.append(h)
    return out, h, buf

full, _, _ = run_conv_ssm([3., 1., 4., 2.])
_, h2, b2 = run_conv_ssm([3., 1.])
exact, _, _ = run_conv_ssm([4., 2.], h2, b2)
broken, _, _ = run_conv_ssm([4., 2.], h2, None)
print("conv+SSM exact vs missing-conv:", np.round(exact, 4).tolist(), "vs", np.round(broken, 4).tolist())

# 2. Speculative rollback: accept 99, reject 77, sample correction 4
step = lambda h, x: 0.5 * h + 0.5 * x
h_prefix = step(step(0.0, 3.0), 1.0)
h_after_99 = step(h_prefix, 99.0)
h_dirty_77 = step(h_after_99, 77.0)
print(f"speculative rollback exact={step(h_after_99, 4.0):.4f}, dirty={step(h_dirty_77, 4.0):.4f}")

# 3. Prefill vs decode crossover (prefill emits token 1, so N-1 decode steps)
for n in (16, 256):
    t_attn = 120.0 + (n - 1) * 3.2
    t_ssm  = 150.0 + (n - 1) * 1.8
    print(f"N={n:3d} tokens -> attn={t_attn:.1f} ms, ssm={t_ssm:.1f} ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
conv+SSM exact vs missing-conv: [3.975, 4.3875] vs [3.075, 3.7375]
speculative rollback exact=27.0625, dirty=33.7812
N= 16 tokens -> attn=168.0 ms, ssm=177.0 ms
N=256 tokens -> attn=936.0 ms, ssm=609.0 ms
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/prefill_decode_crossing_dark.png" alt="Top line chart plots total generation latency against output tokens N from 1 to 64, showing Attention (120 ms + 3.2 ms/step) crossing SSM (150 ms + 1.8 ms/step) at 22.4 tokens. Bottom stacked bar breakdown compares prefill versus decode at 16 tokens (168 vs 177 ms) and 256 tokens (936 vs 609 ms)." />
  <figcaption>Attention wins short 16-token answers thanks to lower prefill latency, while lower per-token decode cost lets the SSM overtake after 23 tokens and lead by 327 ms at 256 tokens.</figcaption>
</figure>

## When to use SSMs vs. transformers vs. hybrids

| Workload | Best starting point | Why |
|---|---|---|
| Short-to-medium chat / few-shot copy | **Transformer** | Mature fused attention kernels and exact token lookup |
| 128K+ long-document serving | **Hybrid (SSM + sparse attention)** | Slashes KV memory 8x–12x while keeping exact recall paths |
| Real-time streaming / tight edge RAM | **Pure SSM or SSM-heavy hybrid** | Flat $O(1)$ live decode memory regardless of stream length |

Before adopting any pure SSM for retrieval-heavy tasks, run the multi-depth NIAH and variable-tracking benchmarks from [Long Context Window Management](/learn/long-context-window-management) alongside peak memory and throughput measurements.

## Where fixed-state models lead

SSMs trade token-indexed KV tables for compact, learned recurrences, and hybrid backbones capture most of the memory win without abandoning exact retrieval. Next, we turn to [Reasoning & Test-Time Compute](/learn/reasoning-models-test-time-compute), where models deliberately spend thousands of extra decode tokens thinking through hard problems.

```mastery-quiz
[
  {
    "question": "A team will benchmark decode memory and rare identifier lookup on 256K-token API specs. It replaces 18 of 24 identical full-attention layers with fixed-state SSM layers. The remaining attention layers keep their original KV dimensions. For one request, what fraction of the original KV growth per token remains, and which layers keep a separate entry for each earlier position?",
    "options": [
      "25% of the KV growth, with separate entries in the SSM layers.",
      "75% of the KV growth, with separate entries in the attention layers.",
      "25% of the KV growth, with separate entries in the attention layers.",
      "75% of the KV growth, with separate entries in the SSM layers."
    ],
    "answer": "25% of the KV growth, with separate entries in the attention layers.",
    "explanation": "Six attention layers still append a key and a value at each position, so the KV cache grows at 6/24 = 25% of its original rate. The 75% figure counts the layers that were replaced. Each SSM layer updates a fixed-size summary. The retained attention entries give a query a route to an earlier identifier. Measure exact answers and peak memory to see whether the hybrid meets both requirements."
  },
  {
    "question": "A scalar SSM starts a step with state 6 and input 4. Its discrete coefficients are A = 0.5, B = 2, C = 1 and D = 0.5. An engineer replays that step with C = 3 and all other values unchanged. What pair (updated state, output) should the replay produce?",
    "options": [
      "(11, 33)",
      "(26, 80)",
      "(11, 13)",
      "(11, 35)"
    ],
    "answer": "(11, 35)",
    "explanation": "The state update uses A and B, so it gives 0.5 × 6 + 2 × 4 = 11 on both runs. The new readout gives 3 × 11 + 0.5 × 4 = 35. An output of 33 omits the direct input through D. An output of 13 uses the old C. A state of 26 uses the new C in place of A to carry the previous state, which then inflates the output to 80."
  },
  {
    "question": "A scalar SSM obeys $h'(t)=-2h(t)+3x(t)$. Each step lasts 0.75 time units, and the input stays constant during the step. In the discrete update $h_{\\mathrm{next}}=a h_{\\mathrm{old}}+b x$, which pair $(a,b)$ reproduces the continuous dynamics? Round each coefficient to three decimal places.",
    "options": [
      "(0.223, 1.554)",
      "(0.223, 1.165)",
      "(4.482, 5.223)",
      "(−0.500, 2.250)"
    ],
    "answer": "(0.223, 1.165)",
    "explanation": "The old state retains $e^{-2(0.75)}$, about 0.223. Integrating $3e^{-2u}$ over the step gives $3(1-e^{-1.5})/2$, about 1.165. A write of 1.554 is the average of the integrand. It still needs the interval width of 0.75 to give the integral. Using a growth rate of +2 gives 4.482 and 5.223. A forward Euler step gives a carry of $1-2(0.75)=-0.5$ and a write of $3(0.75)=2.25$. It approximates both coefficients. Mamba-1 uses that same write coefficient with an exponential carry."
  },
  {
    "question": "From zero, process [2,5,1,3] using h_t=0.5 h_(t-1)+0.5 x_t. What final state follows?",
    "options": [
      "3.0000",
      "2.0000",
      "2.5000",
      "5.5000"
    ],
    "answer": "2.5000",
    "explanation": "The successive states are 1,3,2,2.5. Stopping before the last update gives 2; using the current input alone gives 3. State history enters through its retained half."
  },
  {
    "question": "An S4 layer has two state coordinates with different fixed decay rates. Both start at zero. After decay, each coordinate adds the current input. The output is their sum. Which probe produces outputs you can use directly as a causal convolution kernel for full training sequences, and what should the decoder save between tokens?",
    "options": [
      "Probe with [1, 0, 0, …]. Save the last output.",
      "Probe with [1, 1, 1, …]. Save both state coordinates.",
      "Probe with [1, 0, 0, …]. Save both state coordinates.",
      "Probe with [1, 1, 1, …]. Save the last output."
    ],
    "answer": "Probe with [1, 0, 0, …]. Save both state coordinates.",
    "explanation": "A single 1 followed by zeros reveals what one input contributes at each lag. An FFT can apply the resulting causal convolution to a full training sequence. A string of ones adds a new write at every step, so its outputs are cumulative sums of the kernel weights. During generation, each coordinate must decay at its own rate before the next write. Saving only their sum loses the split needed for that update."
  },
  {
    "question": "An LTI SSM treats a routine token and a `max_retries` identifier with the same update rule. In Mamba-1, what makes the update selective, and what does a very large $\\Delta_t$ do when $A<0$?",
    "options": [
      "Selective B_t,C_t,Delta_t; fixed negative A. Larger Delta_t reduces exponential carry and increases the implemented input-write multiplier.",
      "Selective A_t,D_t; fixed B and C. Larger Delta_t increases exponential carry and preserves more of the previous running state.",
      "Selective prior-token positions; sparse KV history. Larger Delta_t chooses a cached token and copies it into an explicitly addressed state.",
      "Fixed B,C,Delta with a changing output projection. Larger Delta_t changes output readout while leaving exponential retention unchanged."
    ],
    "answer": "Selective B_t,C_t,Delta_t; fixed negative A. Larger Delta_t reduces exponential carry and increases the implemented input-write multiplier.",
    "explanation": "Mamba-1 computes selective parameters from the post-convolution activation. Negative $A$ makes larger $\\Delta_t$ reduce carryover. Holding $B_t x_t$ fixed, its implemented input write scales with $\\Delta_t$; this does not cap that write at one or guarantee how the final state changes."
  },
  {
    "question": "A reference Mamba implementation loops over sequence positions in Python on GPU and spills intermediate states to HBM. It is mathematically correct but slow. What production change addresses this bottleneck?",
    "options": [
      "Reduce Delta toward zero and retain the Python loop; this saves state arithmetic while preserving the layer's learned update behavior.",
      "Fuse selective-scan updates around fast local state storage and associative prefix work; reduce intermediate traffic and expose position parallelism.",
      "Freeze B_t and C_t, retain the learned outputs, and substitute attention kernels for the original content-dependent state transition.",
      "Retain each intermediate state in a KV cache and replace the scan with rereading stored states, treating that cache as the original recurrence."
    ],
    "answer": "Fuse selective-scan updates around fast local state storage and associative prefix work; reduce intermediate traffic and expose position parallelism.",
    "explanation": "A Python loop keeps the recurrence readable but destroys GPU parallelism and causes expensive memory traffic. Mamba's production path uses fused hardware-aware scan kernels so discretization and state updates stay on fast memory where possible, while associative scan recovers parallelism."
  },
  {
    "question": "A profile shows Mamba-1 underusing Tensor Cores, and a proposal says Mamba-3 is just the Tensor Core rewrite. Which statement correctly separates Mamba-2 from Mamba-3?",
    "options": [
      "Mamba-2: explicit token KV memory. Mamba-3: context-growing state buffers with attention selection over the previously stored token records.",
      "Mamba-2: fixed-parameter FFT convolution. Mamba-3: original input-selective B/C/Delta updates with the original fused selective-scan method.",
      "Mamba-2: SSD chunked matmuls and shorter inter-chunk state propagation. Mamba-3: inference-first recurrence, complex states, state efficiency and MIMO.",
      "Mamba-2: the original selective scan with unchanged formulation. Mamba-3: SSD chunked matmuls and shorter inter-chunk state propagation."
    ],
    "answer": "Mamba-2: SSD chunked matmuls and shorter inter-chunk state propagation. Mamba-3: inference-first recurrence, complex states, state efficiency and MIMO.",
    "explanation": "Mamba-2's SSD reformulation expresses more work as chunked batched matrix multiplications. Inter-chunk state propagation uses a scan or structured matrix multiplication on the shorter chunk-state sequence. Mamba-3 takes an inference-first approach with exponential-trapezoidal discretization, complex-valued state updates, and MIMO updates aimed at quality, state efficiency, and decode behavior."
  },
  {
    "question": "Starting from zero, an inclusive scan applies $h \\mapsto 0.4h+3$ first and $h \\mapsto 0.25h+2$ second. Which list of states does it return?",
    "options": [
      "[3, 2.75]",
      "[2, 3.8]",
      "[3, 5]",
      "[2.75]"
    ],
    "answer": "[3, 2.75]",
    "explanation": "The first update gives 3. The second gives 0.25 × 3 + 2 = 2.75, so the scan returns both states in order. Reversing the updates gives 2 followed by 0.4 × 2 + 3 = 3.8. Adding the two writes to get 5 skips the second update’s 0.25 multiplier on the first write. Returning only 2.75 gives the final reduction and loses the first prefix."
  },
  {
    "question": "A latency benchmark measures attention prefill at 90 ms and subsequent decode at 2.8 ms/step, while an SSM takes 120 ms for prefill and 1.4 ms/step for decode. Prefill produces token 1. Which totals follow at 16 and 256 generated tokens?",
    "options": [
      "16 outputs: attention 132 ms, SSM 141 ms; 256 outputs: attention 804 ms, SSM 477 ms.",
      "16 outputs: attention 134.8 ms, SSM 142.4 ms; 256 outputs: attention 806.8 ms, SSM 478.4 ms.",
      "16 outputs: attention 132 ms, SSM 142.4 ms; 256 outputs: attention 804 ms, SSM 478.4 ms.",
      "16 outputs: attention 134.8 ms, SSM 141 ms; 256 outputs: attention 806.8 ms, SSM 477 ms."
    ],
    "answer": "16 outputs: attention 132 ms, SSM 141 ms; 256 outputs: attention 804 ms, SSM 477 ms.",
    "explanation": "Use N − 1 later steps: 90 + 15 × 2.8 = 132 ms and 120 + 15 × 1.4 = 141 ms. At 256 outputs, 90 + 255 × 2.8 = 804 ms and 120 + 255 × 1.4 = 477 ms. The lower per-token decode cost outweighs the higher prefill latency at 256 tokens."
  }
]
```

> **Next:** Continue to [Reasoning & Test-Time Compute](/learn/reasoning-models-test-time-compute). Extra generated tokens either grow a KV cache or update a fixed recurrent state. Reasoning models spend those extra tokens on purpose, so the next chapter asks when that <span data-glossary="test-time-compute">test-time compute</span> is worth the decode-memory and latency bill.
