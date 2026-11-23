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

The previous chapter on <span data-glossary="mixture-of-experts">Mixture of Experts</span> reduced feed-forward computation by routing each <span data-glossary="token">token</span> through a small subset of experts. Its Mixtral sequence mixer, however, still relied on full <span data-glossary="self-attention">self-attention</span>. During <span data-glossary="decode-phase">decode</span>, each new token extends every attention layer's <span data-glossary="kv-cache">key-value (KV) cache</span>, whereas hybrid architectures introduce a fundamentally different option by changing how layers carry sequence history.

Consider a service processing a 32K-token API specification. Full causal attention retains a key and value vector at every prior position so a later query can attend directly back to an exact identifier, provided the learned attention heads route to it. A <span data-glossary="state-space-model">state-space model (SSM)</span> replaces that growing token table with a fixed-size running summary, making decode memory constant while making verbatim lookup harder because a compressed state replaces addressable history.[^gu2023]

<span data-glossary="mamba">Mamba</span> makes that running summary selective by letting each incoming activation determine how much state is written, kept, and read out. Across its iterations, Mamba-1 keeps a fixed recurrent state alongside a short four-slot convolution buffer instead of a token-indexed KV cache, while later variants refine or replace those auxiliary buffers. Tracing four scalar inputs reveals both what a fixed summary retains and why the same recurrence can execute in parallel during training.

<figure>
  <img src="illustrations/_generated/mamba_vs_transformer_dark.png" alt="Side-by-side comparison of Transformer KV cache versus Mamba-1 fixed state. Top panel shows KV slots t1 through t4 and tL growing linearly with query q[L+1] reaching back to K2 (O(L) history). Bottom panel shows Mamba-1 updating one fixed recurrent state slot from h[t] to h[t+1] alongside a four-slot rolling conv window [t-3, t-2, t-1, now] (O(1) per token)." />
  <figcaption>Attention appends a key-value pair for every processed position so later queries can attend directly to earlier tokens. Mamba-1 instead updates one fixed-size recurrent state and a rolling four-slot convolution window holding the current activation plus three prior positions, while Mamba-3 replaces that convolution buffer with a previous-write slot. Both panels depict per-token state for a single live request.</figcaption>
</figure>

```checkpoint
What is the core serving tradeoff between attention and Mamba-style SSMs?
---
Attention keeps token-level access to prior context through a KV cache that grows with sequence length. Mamba-style SSMs keep a fixed-size recurrent state, which removes context-length-dependent decode-state growth but compresses history; evaluate exact retrieval and throughput on the target workload.
```

## A discrete recurrence you can compute by hand

The fixed state is an activation vector updated once per token. At each step, the transition matrix scales the carried state and the input projection writes new information. Finally, the readout maps the updated state to an output:

$$
h_t = \bar{A}\, h_{t-1} + \bar{B}\, x_t
$$

$$
y_t = \bar{C}\, h_t + \bar{D}\, x_t
$$

The first term acts as memory carryover while the second acts as an input write. Meanwhile, the readout extracts the layer output without mutating state. Because those tensors depend only on model width and state dimension rather than preceding sequence length, per-request decode memory stays constant during generation.

### Walkthrough with numbers

To see how a single state coordinate behaves across tokens, set:

- $\bar{A} = 0.9$ (the state keeps 90% of its previous value)
- $\bar{B} = 0.2$ (new input contributes 20%)
- $\bar{C} = 1.0$ (read the full state)
- $\bar{D} = 0$ (no skip)

Now process four token activations $x = [3, 1, 4, 2]$. With $\bar{A}=0.9$, older history decays slowly across the trace. At the same time, $\bar{B}=0.2$ gives larger inputs such as $4$ a visibly stronger pull on the running trajectory than $1$, smoothing the signal rather than copying individual tokens:

| Step | Input $x_t$ | State $h_t = 0.9 \, h_{t-1} + 0.2 \, x_t$ | Output $y_t$ |
|------|------------|---------------------------------------------|-------------|
| 1 | 3 | $0.9 \cdot 0 + 0.2 \cdot 3 = 0.60$ | 0.60 |
| 2 | 1 | $0.9 \cdot 0.60 + 0.2 \cdot 1 = 0.74$ | 0.74 |
| 3 | 4 | $0.9 \cdot 0.74 + 0.2 \cdot 4 = 1.466$ | 1.466 |
| 4 | 2 | $0.9 \cdot 1.466 + 0.2 \cdot 2 = 1.7194$ | 1.7194 |

That update illustrates both the strength and the cost of fixed-state compression. Step 4 retains energy from earlier tokens through the $0.9$ carryover, keeping memory constant in sequence length. In exchange, four distinct inputs fold into one summary from which exact past tokens must be inferred rather than directly looked up.

<figure>
  <img src="illustrations/_generated/ssm_recurrence_dark.png" alt="Two-panel scalar SSM trace across steps t=1 to t=4 on inputs [3, 1, 4, 2]. Top bar chart tracks state h[t] rising from 0.6000 to 0.7400, 1.4660, and 1.7194 on a 0-to-2 axis. Bottom matrix decomposes each step into carried state 0.9 h[t-1] (0.0000, 0.5400, 0.6660, 1.3194), incoming write 0.2 x[t] (0.60, 0.20, 0.80, 0.40), and updated h[t]." />
  <figcaption>The bar chart tracks the scalar state across all four inputs on a shared 0–2 scale, while the matrix below breaks each transition into its carried history (0.9 h[t-1]) and new write (0.2 x[t]). By step 4, most of h[4] = 1.7194 comes from carried prior state.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="discrete-recurrence.py"
inputs = [3, 1, 4, 2]
a_bar = 0.9
b_bar = 0.2
state = 0.0
states = []

for value in inputs:
    state = a_bar * state + b_bar * value
    states.append(round(state, 3))

print("states:", states)
print("final state:", states[-1])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
states: [0.6, 0.74, 1.466, 1.719]
final state: 1.719
```
<!-- leetllm: output:end -->

```checkpoint
If you change $\bar{A}$ to $0.5$ and $\bar{B}$ to $0.5$, what is the final state after processing $[3,1,4,2]$ from zero state?
---
Step 1 is $1.5$. Step 2 is $0.5 \cdot 1.5 + 0.5 \cdot 1 = 1.25$. Step 3 is $0.5 \cdot 1.25 + 0.5 \cdot 4 = 2.625$. Step 4 is $0.5 \cdot 2.625 + 0.5 \cdot 2 = 2.3125$.
```

Changing $\bar{A}$ from $0.9$ to $0.1$ while holding inputs and $\bar{B}=0.2$ fixed drops the final state from $1.7194$ to $0.4826$. Earlier contributions wash out almost immediately under fast decay. State dynamics therefore matter just as much as state dimension: a model's ability to retain early facts depends on how slowly its transitions decay, not solely on how many floats it stores.

## Where $\bar{A}$ and $\bar{B}$ come from

The hand calculation hid one design choice: where do $\bar{A}$ and $\bar{B}$ come from? State Space Models borrow a control-theory view of dynamical systems, where a continuous signal changes over time. The continuous variables are:

- $x(t) \in \mathbb{R}$: the input signal
- $h(t) \in \mathbb{R}^s$: the hidden state, a <span data-glossary="vector">vector</span> of dimension $s$ that acts as a compressed summary of all past inputs
- $y(t) \in \mathbb{R}$: the output
- $\mathbf{A} \in \mathbb{R}^{s \times s}$: the state transition <span data-glossary="matrix">matrix</span>, shaping how much past information to retain
- $\mathbf{B} \in \mathbb{R}^{s \times 1}$: the input matrix, shaping how much new information to absorb
- $\mathbf{C} \in \mathbb{R}^{1 \times s}$: the output matrix, which reads out the relevant part of the state

Writing a single channel keeps notation compact. Full sequence-modeling layers run hundreds or thousands of these channels in parallel. Each channel executes the same state update structure, so the scalar ODE extends directly to wide hidden states:

$$
h'(t) = \mathbf{A}h(t) + \mathbf{B}x(t)
$$

$$
y(t) = \mathbf{C}h(t) + \mathbf{D}x(t)
$$

The differential equation links state evolution to both current hidden state ($\mathbf{A}h(t)$) and new input ($\mathbf{B}x(t)$). In parallel, the algebraic readout maps $h(t)$ through $\mathbf{C}$ alongside an optional skip connection $\mathbf{D}$. Discretizing these continuous equations over token intervals produces the exact matrix coefficients used during forward passes.

### Discretization

Tokens arrive at discrete steps rather than as smooth waveforms. Sampling every $\Delta$ time units and holding $x(t)$ constant across each interval defines the **zero-order hold** (ZOH) assumption. Integrating the continuous ODE under that held input converts the system into a token-by-token recurrence (S4 and Mamba variants also use related schemes such as bilinear or Euler steps, though ZOH makes the exact closed-form link explicit):[^gu2023]

$$
\begin{aligned}
\bar{\mathbf{A}} &= e^{\Delta \mathbf{A}} \\
\bar{\mathbf{B}} &= (\Delta \mathbf{A})^{-1}
\left(e^{\Delta \mathbf{A}} - \mathbf{I}\right) \cdot \Delta \mathbf{B}
\end{aligned}
$$

Here $e^{\Delta \mathbf{A}}$ is the matrix exponential. The displayed inverse expression requires invertible $\mathbf{A}$ and $\Delta>0$, whereas the general integral $\bar{\mathbf{B}}=\int_0^\Delta e^{u\mathbf{A}}\mathbf{B}\,du$ stays well defined even when $\mathbf{A}$ is singular and vanishes smoothly at $\Delta=0$. Substituting these discrete matrices recovers the token recurrence:

$$
h_t = \bar{\mathbf{A}} h_{t-1} + \bar{\mathbf{B}} x_t
$$

$$
y_t = \mathbf{C} h_t + \mathbf{D} x_t
$$

Discretization turns continuous-time parameters $(\mathbf{A}, \mathbf{B}, \Delta)$ into the carry and write coefficients $(\bar{\mathbf{A}}, \bar{\mathbf{B}})$ computed per step. For scalar $A=-1$, $B=1$, and $\Delta=1$, exact ZOH yields $\bar{A}\approx0.368$ and $\bar{B}\approx0.632$; when $A=0$, the input simply integrates as $\bar{A}=1$ and $\bar{B}=\Delta B$. Evaluating the ratio $(e^{\Delta A}-1)/A$ directly would suffer from floating-point cancellation when $|\Delta A|$ is tiny, so vectorized NumPy implementations use `np.expm1` and handle the $\Delta A = 0$ limit explicitly.

<!-- leetllm: test, output=show -->
```python title="scalar-zero-order-hold.py"
import numpy as np


def zoh_discretize(a: np.ndarray, b: float, delta: float) -> tuple[np.ndarray, np.ndarray]:
    if delta < 0:
        raise ValueError("nonnegative delta required")
    step = delta * a
    a_bar = np.exp(step)
    safe_a = np.where(step == 0.0, 1.0, a)
    b_bar = np.where(step == 0.0, delta * b, np.expm1(step) / safe_a * b)
    return a_bar, b_bar


a_values = np.array([-1.0, 0.0, -1e-12])
a_bar, b_bar = zoh_discretize(a_values, b=1.0, delta=1.0)
for a, ab, bb in zip(a_values, a_bar, b_bar):
    print(f"A={a:g}: A_bar, B_bar = ({float(ab):.6g}, {float(bb):.6g})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
A=-1: A_bar, B_bar = (0.367879, 0.632121)
A=0: A_bar, B_bar = (1, 1)
A=-1e-12: A_bar, B_bar = (1, 1)
```
<!-- leetllm: output:end -->

Discretization gives a recurrence the model can execute step by step. However, an arbitrary transition matrix still forgets early signals long before a multi-thousand-token prompt ends. Controlling decay across thousands of steps requires a structured initialization for $\mathbf{A}$.

## S4: structured state spaces

The Structured State Space for Sequence Modeling (S4)[^gu2022] solves that long-horizon memory problem while keeping the state size fixed. It combines a diagonal-plus-low-rank parameterization with bilinear discretization (rather than the scalar ZOH rule above) to preserve signals across long sequences. That linear structure yields two mathematically equivalent execution paths: a token-by-token recurrence for generation and a parallel convolution for training.

### HiPPO initialization

S4 initializes the continuous matrix $\mathbf{A}$ from the **HiPPO** (High-order Polynomial Projection Operators) framework.[^gu2021][^gu2022] Rather than letting every direction decay uniformly, HiPPO projects an input history onto orthogonal polynomial bases. Each state coordinate then tracks a distinct temporal scale or basis mode, so early information persists cleanly before training even begins.

### Dual computation modes

Because the full token sequence is known upfront during training but arrives one token at a time during decoding, S4 switches between two algebraic views of the same linear recurrence. Both views are written below for a single channel. Production layers simply evaluate hundreds or thousands of those channels in parallel:

#### Recurrent mode (generation)
Efficient for generation:

$$
h_t = \bar{\mathbf{A}} h_{t-1} + \bar{\mathbf{B}} x_t, \quad y_t = \mathbf{C} h_t + \mathbf{D} x_t
$$

With a structured transition matrix, advancing $L$ positions takes $O(Ls)$ work and $O(s)$ persistent state per channel. That factorization avoids the $O(s^2)$ per-step matrix-vector multiply of an unstructured $s\times s$ transition. During generation, each channel therefore updates in constant memory and constant work per token.

#### Convolutional mode (training)
Efficient for training:

$$
y = x * \bar{K} + \mathbf{D}x, \quad \text{where } \bar{K}_j = \mathbf{C} \bar{\mathbf{A}}^j \bar{\mathbf{B}},\quad j\geq0
$$

#### In plain terms

Starting from zero initial state with coefficients fixed across positions, unrolling the recurrence turns every output into a causal dot product with a single impulse-response kernel $\bar{K}$. Within a training forward pass, an FFT applies that prepared kernel across length $L$ in $O(L\log L)$ work. That transform cost is separate from the work needed to materialize the kernel itself.

For our scalar coefficients ($\bar{A}=0.9$, $\bar{B}=0.2$, $\bar{C}=1$), the first four kernel entries are $[0.2, 0.18, 0.162, 0.1458]$. Taking the causal dot product at position four evaluates to $0.2 \cdot 2 + 0.18 \cdot 4 + 0.162 \cdot 1 + 0.1458 \cdot 3 = 1.7194$. Applying NumPy's `convolve` and truncating to the causal prefix matches the sequential recurrence at every position:

<!-- leetllm: test, output=show -->
```python title="recurrence-equals-causal-convolution.py"
import numpy as np

inputs = np.array([3.0, 1.0, 4.0, 2.0])
kernel = 0.2 * (0.9 ** np.arange(len(inputs)))
convolved = np.convolve(inputs, kernel)[: len(inputs)]

state = 0.0
recurrent = []
for value in inputs:
    state = 0.9 * state + 0.2 * float(value)
    recurrent.append(state)

assert np.allclose(convolved, recurrent, atol=1e-12)
print("matching outputs:", np.round(convolved, 4).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
matching outputs: [0.6, 0.74, 1.466, 1.7194]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/recurrence_convolution_dark.png" alt="Top causal Toeplitz weight matrix aligns inputs 3, 1, 4, and 2 with kernel weights 0.200, 0.180, 0.162, and 0.146 across four steps. Bottom bar chart displays identical step outputs 0.600, 0.740, 1.466, and 1.719 for both convolution and recurrence." />
  <figcaption>Each row of the Toeplitz matrix shifts the decaying lag kernel [0.200, 0.180, 0.162, 0.146] across the available prefix. Taking the four row dot products reproduces the sequential recurrence from zero state identically.</figcaption>
</figure>

When the recurrence starts from a nonzero initial state $h_0$, step $t\geq1$ adds the homogeneous term $\mathbf{C}\bar{\mathbf{A}}^t h_0$ on top of the causal convolution. That extra contribution captures how the pre-existing state decays forward independently of any new inputs. Resuming a stream from a cached prefix depends on carrying both terms together.

```checkpoint
Why does S4 need two computation views?
---
Recurrent mode is natural for generation because it updates one fixed-size state per new token. Convolutional mode is useful for training because it processes a full known sequence in parallel instead of looping token by token.
```

Global convolution works cleanly only because the response at lag $j$ depends purely on how many steps ago an input arrived. It cannot inspect what that token actually meant. That invariance breaks down as soon as a token must alter the layer's retention rule.

### The LTI problem

Inside an LTI SSM, every position uses the same transition and input/output maps. Its input values can differ, and surrounding neural layers can apply pointwise nonlinearities across activations. The SSM coefficients themselves, however, stay constant regardless of token content.

That property is called **Linear Time-Invariant** (LTI) dynamics. Matrices $\mathbf{A}$, $\mathbf{B}$, and $\mathbf{C}$ remain fixed at every step across the sequence. Consequently, the recurrence decays uniformly with lag and cannot switch its write or read policy when a key identifier appears.[^gu2023]

Attention takes a different route by using query-key interactions to provide content-dependent access. Mamba's paper uses selective-copy tasks to expose the limitations of fixed LTI dynamics. It then overcomes that limitation by making part of the state update depend directly on each incoming activation.[^gu2023]

```checkpoint
Why is a fixed LTI SSM weaker than attention for content-dependent retrieval?
---
Its update matrices are the same for every token, so it can't choose a different read/write behavior when a special word appears. Attention can route based on query-key content, which makes exact copying and lookup easier.
```

## Mamba: selective state spaces

Mamba[^gu2023] answers the LTI limitation with one core change: **make part of the SSM input-dependent**. Instead of baking a static convolution kernel across all positions, each incoming activation modulates write strength, readout focus, and decay rate on the fly. That shift trades away LTI global convolution while preserving a linear-time recurrence.

### The selective mechanism

A documentation-QA decoder moving through a long API spec makes the limitation concrete. A filler token such as `the` warrants a small state update so earlier history persists cleanly. In contrast, a rare identifier such as `max_retries` must trigger a stronger write so it survives later clutter.

Mamba builds that selectivity directly into the recurrence. Instead of fixed $\mathbf{B}$, $\mathbf{C}$, and $\Delta$, it computes them dynamically as functions of the input:

$$
\mathbf{B}_t = \text{Linear}_B(x_t), \quad \mathbf{C}_t = \text{Linear}_C(x_t), \quad \Delta_t = \text{softplus}(\text{Linear}_\Delta(x_t))
$$

Here $x_t$ refers to the activation entering the SSM after projection, causal convolution, and SiLU rather than a raw token ID. Unlike S4's fixed maps, Mamba predicts $\mathbf{B}_t$, $\mathbf{C}_t$, and $\Delta_t$ from that activation at every step. Meanwhile, the learned diagonal transition $\mathbf{A}$ and skip term $\mathbf{D}$ stay input-independent across tokens.[^gu2023]

The step size $\Delta_t$ controls how strongly each token overwrites history. Because $\mathbf{A}$ has negative diagonal entries, a larger $\Delta_t$ shrinks the retained fraction $\exp(\Delta_t \mathbf{A})$ while enlarging the write scale $\Delta_t \mathbf{B}_t x_t$, holding $B_t$ and $x_t$ constant:

- **Large $\Delta_t$**: Decay older state faster and amplify the incoming input write $\Delta_t B_t x_t$
- **Small $\Delta_t$**: Retain more of the existing state and attenuate the incoming write

That intuition covers both terms in the state update, though final token influence also depends on $B_t$ and $C_t$. Unlike a sigmoid gate whose multiplier stays capped at one, the selective write scales linearly with $\Delta_t B_t x_t$. Its additive value can therefore take negative signs, grow large, or drop to zero.

<!-- leetllm: test, output=show -->
```python title="delta-controls-retention.py"
import numpy as np

a = -1.0
for delta in (0.1, 1.0, 2.0):
    retained_fraction = float(np.exp(delta * a))
    print(f"delta={delta:.1f} retains {retained_fraction:.3f} of previous state")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
delta=0.1 retains 0.905 of previous state
delta=1.0 retains 0.368 of previous state
delta=2.0 retains 0.135 of previous state
```
<!-- leetllm: output:end -->

```checkpoint
If $\Delta_t$ is very large, does the model remember more or less of the previous state?
---
Less. Mamba-1 uses negative diagonal entries in $\mathbf{A}$, so increasing $\Delta_t$ shrinks each corresponding carryover factor $\exp(\Delta_t A)$. This says nothing by itself about which fact survives a learned multi-channel update.
```

That design gives Mamba a content-dependent recurrent update with linear-time evaluation across sequence length. Every output reads through the compressed state, whereas explicit token-by-token lookup still requires an addressable store such as attention's KV cache. Because an overly large $\Delta_t$ on `the` can still overwrite `max_retries`, the parameter projections must learn when to hold state steady versus overwrite it.

```checkpoint
What does "selective" mean in Mamba?
---
The model computes B_t, C_t, and Delta_t from the current token, so different tokens can write to state, read from state, and forget history differently. This makes the recurrence content-aware rather than fixed.
```

### Architecture

Selective recurrence sits inside a wider gated block. Mamba-1 expands input $x[t]$ via a linear projection into two parallel streams. The main branch runs through a causal 1D convolution (`k=4`) and SiLU before feeding the selective parameter projections (`Delta, B, C`) and `SSM` scan with skip connection `D`. Meanwhile, a parallel `SiLU(z)` gate branch multiplies the scan output elementwise before the output projection.[^gu2023] Here $\mathrm{SiLU}(z) = z\,\mathrm{sigmoid}(z)$ can exceed `[0, 1]`, while $\mathrm{softplus}(z) = \log(1 + e^z)$ keeps step sizes positive using numerically stable log-sum-exp arithmetic.

<figure>
  <img src="illustrations/_generated/mamba_block_dark.png" alt="Dataflow diagram of the Mamba selective SSM block. Input x[t] enters Proj (2E), splitting upward into Conv (k=4 SiLU) and downward into SiLU(z) Gate. Conv feeds Select (D, B, C) and SSM (Scan + D), and Select also feeds SSM. SSM and SiLU(z) merge at Mul (y * gate) and exit downward to Out y[t] (D)." />
  <figcaption>The upper branch applies a causal k=4 convolution and SiLU before computing input-dependent D, B, and C projections for the selective SSM scan with D skip connection. The lower SiLU(z) branch multiplies the scan output elementwise before the output projection.</figcaption>
</figure>

The example below follows Mamba-1's scalar input update, $h_t = e^{\Delta_t A} h_{t-1} + \Delta_t B_t x_t$. That formula matches the official scan implementation's $\bar{B}_t = \Delta_t B_t$ Euler step rather than the exact ZOH integral.[^mamba2026scanref] Both agree closely for small $\Delta_t$, though at $A=-1, B=1, \Delta=1$ their input coefficients diverge ($1$ versus $0.632$). Evaluating explicit functions for $B_t$, $C_t$, and $\Delta_t$ on our four-token sequence `[3, 1, 4, 2]` (omitting convolution, skip, and gating) isolates how selective carry and readout behave step by step.

<!-- leetllm: test, output=show, id=selective-recurrence -->
```python title="selective-ssm.py"
import numpy as np


def softplus(x: np.ndarray) -> np.ndarray:
    return np.maximum(x, 0.0) + np.log1p(np.exp(-np.abs(x)))


inputs = np.array([3.0, 1.0, 4.0, 2.0])
a = -1.0
deltas = softplus(-1.0 + 0.3 * inputs)
retained = np.exp(deltas * a)
writes = deltas * (0.1 * inputs) * inputs
read_weights = 1.0 + 0.05 * inputs

state = 0.0
states = []
for a_bar, additive in zip(retained, writes):
    state = float(a_bar) * state + float(additive)
    states.append(state)

states_arr = np.array(states)
outputs = read_weights * states_arr

print("delta:", np.round(deltas, 3).tolist())
print("retained fraction:", np.round(retained, 3).tolist())
print("states:", np.round(states_arr, 3).tolist())
print("readouts:", np.round(outputs, 3).tolist())
print("final state:", round(float(states_arr[-1]), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
delta: [0.644, 0.403, 0.798, 0.513]
retained fraction: [0.525, 0.668, 0.45, 0.599]
states: [0.58, 0.428, 1.47, 1.085]
readouts: [0.667, 0.449, 1.764, 1.194]
final state: 1.085
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/selective_update_terms_dark.png" alt="Three-panel selective update trace for x = [3, 1, 4, 2]. Top panel shows stacked carry plus write bars on a shared 0-to-1.65 axis. Middle table lists x[t], Delta, a_bar, C[t], and h[t] across t=1..4. Bottom bar chart displays modulated readouts y[t] = C[t] h[t]: 0.67, 0.45, 1.76, and 1.19." />
  <figcaption>Using Δ = softplus(−1 + 0.3x), decay a_bar = exp(−Δ), write Δ × 0.1x², and readout C = 1 + 0.05x, the top stacked bars compare carried history against each new write up to 1.65, the table lists per-step coefficients and states, and the bottom bars plot modulated output y[t] = C[t] h[t].</figcaption>
</figure>

```checkpoint
Why is a Python loop over tokens useful for learning but wrong for production training?
---
It exposes the recurrence clearly, but a Python loop over sequence positions destroys GPU parallelism and spills work through slow paths. Production Mamba uses fused scan kernels that keep state in fast memory and parallelize the sequence update.
```

To compare per-token state footprints side by side without conflating memory math with trained model quality, count the tensor elements retained across two 32-layer models at 2 bytes per element. The attention baseline is a Transformer with 32 KV heads of dimension 128, while the recurrent model is a Mamba-1 stack with 4,096 inner channels and state size 16. Note that for a width-4 causal convolution, three prior activations suffice mathematically before the next token arrives, yet Mamba-1 allocates a rolling four-slot buffer covering the current position as well.[^mamba2026implementation]

<!-- leetllm: test, output=show -->
```python title="state_scaling.py"
def transformer_kv_bytes(layers: int, kv_heads: int, head_dim: int, tokens: int, bytes_per_value: int = 2) -> int:
    return 2 * layers * kv_heads * head_dim * tokens * bytes_per_value


def ssm_state_bytes(
    layers: int,
    inner_channels: int,
    state_size: int,
    conv_width: int,
    bytes_per_value: int = 2,
) -> int:
    recurrent_state = layers * inner_channels * state_size
    convolution_state = layers * inner_channels * conv_width
    return (recurrent_state + convolution_state) * bytes_per_value


layers = 32
heads = 32
head_dim = 128
inner_channels = 4096
state_size = 16
conv_width = 4
attention_layers = 4

for tokens in [128, 512, 2048, 8192, 65536]:
    kv_mb = transformer_kv_bytes(layers, heads, head_dim, tokens) / 1024**2
    ssm_mb = ssm_state_bytes(layers, inner_channels, state_size, conv_width) / 1024**2
    hybrid_mb = kv_mb * attention_layers / layers + ssm_mb * (layers - attention_layers) / layers
    print(
        f"context={tokens:5d} -> transformer_kv={kv_mb:7.1f} MiB, "
        f"hybrid={hybrid_mb:6.1f} MiB, ssm_state={ssm_mb:4.1f} MiB"
    )
```

<!-- leetllm: output:start -->
```text title="Output" output compact
context=  128 -> transformer_kv=   64.0 MiB, hybrid=  12.4 MiB, ssm_state= 5.0 MiB
context=  512 -> transformer_kv=  256.0 MiB, hybrid=  36.4 MiB, ssm_state= 5.0 MiB
context= 2048 -> transformer_kv= 1024.0 MiB, hybrid= 132.4 MiB, ssm_state= 5.0 MiB
context= 8192 -> transformer_kv= 4096.0 MiB, hybrid= 516.4 MiB, ssm_state= 5.0 MiB
context=65536 -> transformer_kv=32768.0 MiB, hybrid=4100.4 MiB, ssm_state= 5.0 MiB
```
<!-- leetllm: output:end -->

### Three debugging questions before writing a kernel

When state dynamics misbehave, three quick diagnostics separate mathematical bugs from kernel issues. First, feed zero input with $A<0$: homogeneous state must decay, whereas nonzero input can still push state arbitrarily large if projections grow. Second, inspect the learned parameter maps across varied tokens whenever outputs collapse onto constant weights, since fixing $B_t$, $C_t$, and $\Delta_t$ reduces the layer back to LTI behavior. Third, profile slow training runs directly rather than altering the math: a naive Python scan, missing fused <span data-glossary="cuda">CUDA</span> kernel, extra tensor copies, or misaligned shapes each require distinct kernel-level fixes.

### The hardware-aware parallel scan

Although backpropagation through a token loop is mathematically valid, sequential loops starve modern <span data-glossary="gpu">GPUs</span>. Because selective parameters depend solely on the input activations rather than preceding hidden states, they can be materialized across positions upfront before running the recurrence. Furthermore, writing intermediate expanded states back to high-bandwidth memory (HBM) on every step turns the recurrence memory-bandwidth-bound, so Mamba fuses discretization and updates inside fast on-chip SRAM and uses a parallel associative scan to expose sequence parallelism.[^gu2023]

The scan reframes each recurrence step as an affine transform $h \mapsto a h + b$. Composing two steps $(a_1, b_1)$ followed by $(a_2, b_2)$ yields $(a_2 a_1, a_2 b_1 + b_2)$, which is associative so subtrees can group in parallel like a binary prefix sum. Crucially, the operator is non-commutative, meaning left-to-right token order must always be preserved.

<figure>
  <img src="illustrations/_generated/selective_scan_dark.png" alt="Three-panel associative prefix scan diagram for steps t1..t4. Top upward tree reduces adjacent pairs into (0.81, 0.74) and (0.81, 1.12) and root (0.6561, 1.7194). Middle downward tree propagates identity (1, 0) left and prefix (0.81, 0.74) right. Bottom grid shows applied prefix states h1=0.600, h2=0.740, h3=1.466, and h4=1.7194." />
  <figcaption>The upward tree combines adjacent affine pairs into ordered subtree transforms, and the downward pass delivers each subtree's incoming prefix transform so every leaf outputs its inclusive state in logarithmic tree depth without reordering inputs.</figcaption>
</figure>

A single upward reduction produces only the final state, whereas training needs every intermediate prefix output. Padding non-power-of-two lengths with the identity transform $(1, 0)$ fills out a uniform binary tree. A two-pass traversal then accumulates upward subtree totals and distributes downward prefixes across all positions:

<!-- leetllm: test, output=show, id=affine-scan -->
```python title="associative-scan-composition.py"
from math import isclose


def compose(right: tuple[float, float], left: tuple[float, float]) -> tuple[float, float]:
    """Compose h -> a*h + b transforms: apply left, then right."""
    a_right, b_right = right
    a_left, b_left = left
    return a_right * a_left, a_right * b_left + b_right


def prefix_scan(steps, initial=0.0):
    if not steps:
        return []
    size = 1
    while size < len(steps):
        size *= 2
    tree = [(1.0, 0.0)] * (2 * size)
    tree[size:size + len(steps)] = steps
    for node in range(size - 1, 0, -1):
        tree[node] = compose(tree[2 * node + 1], tree[2 * node])
    result = [0.0] * len(steps)

    def visit(node, before):
        if node >= size:
            index = node - size
            if index < len(steps):
                a, b = compose(tree[node], before)
                result[index] = a * initial + b
            return
        visit(2 * node, before)
        visit(2 * node + 1, compose(tree[2 * node], before))

    visit(1, (1.0, 0.0))
    return result

steps = [(0.9, 0.6), (0.9, 0.2), (0.9, 0.8), (0.9, 0.4)]
expected = [0.6, 0.74, 1.466, 1.7194]
scanned = prefix_scan(steps)
assert all(isclose(a, b, abs_tol=1e-12) for a, b in zip(scanned, expected))
assert prefix_scan([]) == []
assert isclose(prefix_scan(steps[:3], initial=2)[-1], 0.9**3 * 2 + 1.466)
print("all prefix states:", [round(v, 4) for v in scanned])
print("swapping two updates changes the transform:", compose(steps[1], steps[0]) != compose(steps[0], steps[1]))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
all prefix states: [0.6, 0.74, 1.466, 1.7194]
swapping two updates changes the transform: True
```
<!-- leetllm: output:end -->

```checkpoint
What makes the selective scan "hardware-aware"?
---
It fuses discretization and recurrence work to avoid materializing the full expanded state history in slow device memory. The associative scan exposes parallel work across positions. Input-parameter projections are a separate part of the block, even when a larger fused implementation groups operations together.
```

In this tree layout of $O(L)$ nodes and $O(\log L)$ depth, independent siblings run in parallel on GPU warps, keeping intermediate states in SRAM instead of writing them to HBM.[^gu2023] Note that exact mathematical associativity does not carry over untouched to finite-precision floating-point arithmetic. Setting carryover to $1$ turns `prefix_scan` into a sum where regrouping large opposite values (`1e16`, `-1e16`) alongside `1.0` causes distinct cancellation outcomes between sequential and tree reductions:

<!-- leetllm: test, continue=affine-scan, id=scan-cancellation, output=show -->
```python title="scan-cancellation.py"
from math import fsum

writes = [1e16, 1.0, -1e16, 1.0, 1.0]
serial = 0.0
for write in writes:
    serial += write
tree_result = prefix_scan([(1.0, write) for write in writes])[-1]
reference = fsum(writes)
assert serial == 2.0 and tree_result == 1.0 and reference == 3.0
print("sequential / tree / accurate sum:", serial, tree_result, reference)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
sequential / tree / accurate sum: 2.0 1.0 3.0
```
<!-- leetllm: output:end -->

Both finite-precision traversals drop precision in that extreme case compared with exact compensated summation (`fsum`). Sequential summation cancels early while tree grouping reorders brackets. Kernel verification therefore always checks realistic dynamic ranges against high-precision references before setting tolerances.

Transformers rely on [FlashAttention](/learn/flashattention-memory-efficient-attention) and a mature <span data-glossary="pytorch">PyTorch</span> kernel ecosystem. Custom SSM scan kernels, by contrast, underutilize GPU Tensor Cores because elementwise recurrences spend too little work in dense matrix units. Closing that hardware utilization gap is the central goal of Mamba-2.

## Mamba-2: state space duality

Mamba showed that selective SSMs deliver strong modeling quality, yet its parallel scan still followed a custom hardware path. That custom path bypassed the matrix-multiplication engines (Tensor Cores) that dominate modern GPU throughput. Consequently, raising hardware utilization required reformulating the scan itself.

Mamba-2[^dao2024] attacks that gap through **Structured State Space Duality (SSD)**. Inside each head, its SSM constrains the transition matrix to a scalar multiple of the identity matrix, which is more restrictive than Mamba-1's per-coordinate diagonal transition. That tighter parameterization mathematically links the recurrence to masked kernel attention rather than softmax attention.

Unrolling the recurrence writes each output as a weighted sum of prior inputs whose weights factor into an earlier write, cumulative decay, and current readout. Because the resulting transfer matrix is *semiseparable*, its off-diagonal blocks take compact low-rank factorizations that SSD evaluates without materializing a full $L \times L$ matrix. Its chunked algorithm splits sequence work cleanly:

- intra-chunk outputs are computed in parallel
- chunk final states are computed with batched matrix multiplications
- inter-chunk propagation scans or multiplies the much shorter sequence of chunk-end states
- each chunk's initial-state contribution is added back with batched matrix multiplications

SSD converts most token-level arithmetic into dense batched matrix multiplications while keeping only a brief inter-chunk recurrence. That decomposition preserves fixed-size decode state across sequences. Meanwhile, dense block multiplies map directly onto Tensor Cores.

```checkpoint
Why does Mamba-2 matter if Mamba-1 was already linear time?
---
Linear asymptotic complexity describes work growth; GPU speed also depends on kernel design. Mamba-2 moves more of the work onto batched matrix multiplications and Tensor Cores, reducing reliance on custom scan-heavy kernels.
```

### Mamba-1 vs. Mamba-2 comparison

| Feature | Mamba-1 | Mamba-2 |
|---------|---------|---------|
| **Core Operation** | Selective Scan | SSD block decomposition |
| **Hardware Execution** | Custom scan-heavy CUDA kernels | Batched matmuls and shorter inter-chunk state propagation |
| **Core Layer Speed** | Linear-time scan | 2-8x reported speedup over Mamba-1 core layer[^dao2024] |
| **Theoretical Link** | Selective SSM recurrence | SSD bridge to structured masked attention |

In its reference implementation using state expansion 64, Mamba-2 achieves **2-8x faster** core-layer execution than Mamba-1's selective-scan kernel alongside separate language-modeling quality evaluations.[^dao2024] Moving inner sequence work into chunked matrix multiplies drives those core kernel speedups. Evaluating full serving throughput, however, requires measuring the entire block and attention projections together. End-to-end speed on real servers still varies with hardware, batch geometry, precision, and context distribution.

<!-- leetllm: test, output=show -->
```python title="ssd-chunk-count.py"
chunk_size = 256
for sequence_length in (16384, 16385):
    chunks = (sequence_length + chunk_size - 1) // chunk_size
    final_chunk_tokens = sequence_length - (chunks - 1) * chunk_size
    print(f"tokens={sequence_length}: chunks={chunks}, final chunk={final_chunk_tokens}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tokens=16384: chunks=64, final chunk=256
tokens=16385: chunks=65, final chunk=1
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/ssd_boundary_chunks_dark.png" alt="Top-left 4x16 grid shows 16,384 tokens filling 64 green chunks of width B=256; top-right 5x16 grid shows 16,385 tokens filling 64 blue chunks plus 1 active cell in the 65th chunk with 255 pad slots. Bottom graph shows Chunks C (B=256 slices) branching into parallel End states (Scan h0..hk) and Local matmul (Y_diag chunk), summing into Final Y (Y_diag + C*h)." />
  <figcaption>At chunk width B = 256, 16,384 tokens fill 64 uniform tiles while one extra token spills into a 65th chunk padded by 255 slots. SSD splits execution into parallel intra-chunk local matrix multiplications (Y_diag) and an inter-chunk scan across chunk-end states before combining both into Final Y.</figcaption>
</figure>

### Beyond Mamba-2 toward Mamba-3

While SSD optimizes training and prefill kernels, Mamba-3[^gu2026] focuses on memory-bound decoding. During single-token generation, streaming the hidden state from HBM dominates wall-clock latency, leaving idle arithmetic units inside each update. Taking an inference-first perspective, Mamba-3 alters the recurrence along three complementary axes:

- **Exponential-trapezoidal discretization**, which generalizes the exponential-Euler rule used in Mamba-1 and Mamba-2. Its formal second-order convergence assumes $\lambda_t=1/2+O(\Delta_t)$ plus smoothness conditions, though ablations allow unconstrained $\lambda_t$.
- A **complex-valued** state update implemented through data-dependent rotations, improving state-tracking tasks such as parity and modular arithmetic where Mamba-2 baselines struggle.
- A multi-input, multi-output (MIMO) formulation that raises <span data-glossary="arithmetic-intensity">arithmetic intensity</span> during memory-bound decode by doing more matrix work inside the state update without increasing state memory.

Unlike SISO layers that write and read a single vector direction per head, MIMO shares multiple read and write projections across the same hidden state. In 1.5B-parameter evaluations over 100B FineWeb-Edu tokens (2K context), Mamba-3 SISO improved average downstream accuracy by 0.6 percentage points over Gated DeltaNet (GDN), while MIMO improved it by 1.8 points. In a separate 440M sweep, MIMO at state size 64 matched Mamba-2 <span data-glossary="perplexity">perplexity</span> at state size 128.[^gu2026] On single-step H100 kernel microbenchmarks (batch 128, state sizes 64 and 128), MIMO executes up to 4× more decode FLOPs at matched wall-clock latency because decode is memory-bandwidth-bound rather than compute-bound. Even with that kernel headroom, end-to-end token throughput still depends on precision, batch shape, and sequence length.[^gu2026]

The auxiliary state buffer changes alongside the recurrence. Mamba-3 drops the separate short causal convolution while its trapezoidal rule retains the previous input write $(\Delta B x)_{t-1}$. Thus buffer sizing formulas from Mamba-1's four-slot convolution window do not carry over unchanged across model generations.[^gu2026]

For a single real-valued coordinate, the trapezoidal update takes the form:

$$
h_t=\alpha_t h_{t-1}+(1-\lambda_t)\Delta_t\alpha_t B_{t-1}x_{t-1}+\lambda_t\Delta_t B_t x_t,\qquad \alpha_t=e^{\Delta_t A_t}.
$$

Setting $\lambda_t=1$ recovers Mamba-1's exponential-Euler write. Choosing $\lambda_t=1/2$ instead averages both interval endpoints. Comparing both against the exact held-input ZOH integral for constant $A=-1, B=1$ and unit endpoints isolates the discretization gap cleanly:

<!-- leetllm: test, output=show -->
```python title="three-input-discretizations.py"
import numpy as np

for delta in np.array([1.0, 0.1]):
    alpha = float(np.exp(-delta))
    euler_write = float(delta)
    trapezoidal_write = float(0.5 * delta * (alpha + 1.0))
    exact_held_write = float(-np.expm1(-delta))
    print(f"delta={delta:.1f}: Euler={euler_write:.6f}, "
          f"trapezoidal={trapezoidal_write:.6f}, ZOH={exact_held_write:.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
delta=1.0: Euler=1.000000, trapezoidal=0.683940, ZOH=0.632121
delta=0.1: Euler=0.100000, trapezoidal=0.095242, ZOH=0.095163
```
<!-- leetllm: output:end -->

Trapezoidal integration matches the continuous held-input integral more closely than forward Euler at finite step sizes. As the step size $\Delta$ shrinks toward zero, all three rules converge onto the same first-order slope. Trained downstream benchmarks then determine how much that discretization accuracy improves language quality.

```checkpoint
What kind of improvement does Mamba-3 target compared with earlier Mamba work?
---
It targets inference-first quality and state efficiency: stronger recurrence, complex-valued state tracking, and MIMO updates that the paper evaluates for improved quality or reduced state size at matched decode latency.
```

## Complexity comparison

Separating training cost from per-token decode cost highlights where recurrent state pays off. Using the 32-layer shapes and two-byte precision calculated above, the chart tracks tensor state growth per request across sequence lengths. Underneath, the table summarizes per-layer sequence-mixing asymptotics ($L$ tokens, width $d$, SSM state size $s$).

<figure>
  <img src="illustrations/_generated/complexity_scaling_dark.png" alt="Two-panel live decode-state scaling across contexts 128 to 65,536 tokens. Top line chart shows Transformer KV cache reaching 32 GiB and a 4-attention/28-SSM hybrid reaching 4.004 GiB on a zero-based GiB axis, while the pure SSM stack hugs zero. Bottom zoomed bar chart shows the 32-layer SSM stack constant at 5.0 MiB across every context length." />
  <figcaption>Tensor state payload per live request using the 32-layer, two-byte dimensions calculated above. Transformer KV memory grows linearly to 32 GiB at 65,536 tokens, a 4-attention/28-SSM hybrid drops to 4.0 GiB, and the zoomed MiB bars show a pure SSM stack remaining flat at 5.0 MiB. Weights, extra snapshots, and allocator padding are excluded.</figcaption>
</figure>

| Operation | Training | Generation (per token) | Generation State / Cache |
|-----------|----------|----------------------|----------|
| Self-attention | $O(L^2 d)$ | $O(Ld)$ | $O(L \cdot d)$ grows linearly |
| S4 (LTI SSM) | $O(L \log L \cdot d)$ (FFT convolution) | $O(s \cdot d)$ | $O(s \cdot d)$ **constant** |
| Mamba (selective SSM) | $O(L \cdot s \cdot d)$ (parallel scan) | $O(s \cdot d)$ | $O(s \cdot d)$ **constant** |
| Linear attention | $O(L \cdot d^2)$ | $O(d^2)$ | $O(d^2)$ **constant** |

These complexity bounds fix model width $d$ and vary sequence length $L$. For S4, $O(L\log L \cdot d)$ measures FFT convolution given a precomputed filter; attention reflects standard full-context multi-head KV retention (whereas grouped-query attention shrinks KV width and sliding-window attention caps history); and kernelized linear attention assumes both key and value dimensions scale with $d$. Across pure SSM stacks, persistent decode memory stays around $sd$ recurrent elements per layer plus any short convolution or previous-write slot, whereas even a single full-attention layer in a hybrid preserves $O(L)$ KV cache growth.

### One live state isn't the whole cache policy

In real serving engines, per-request state size captures only part of the memory budget because each active sequence owns mutable state. Shared-prefix caching often stores periodic checkpoints so subsequent requests can resume from an intermediate token position without recomputing the prompt. Saving periodic checkpoints trades extra cache memory for faster prefix hits, so stored snapshot storage grows linearly with sequence length even when live state remains fixed. Whenever conversation branches diverge, each branch must also copy its chosen checkpoint into an independent mutable buffer.

For instance, the pinned vLLM Mamba cache configuration exposes `none`, `all`, and `align` caching policies. It supports distinct dtypes for convolution and SSM buffers. The engine also pairs state checkpointing with replay strategies depending on backend and speculative decoding settings.[^vllmMambaCache2026] Exact compatibility depends on the model class, engine version, cache strategy, and speculative verifier together.

To quantify that retention tradeoff concretely, consider a 5 MiB live state paired with one full 5 MiB checkpoint every 1,024 tokens, omitting prefix sharing and allocator overhead:

<!-- leetllm: test, output=show -->
```python title="fixed-live-state-growing-snapshots.py"
state_mib = 5
checkpoint_interval = 1024
for tokens in (8192, 65536):
    snapshots = tokens // checkpoint_interval
    total_mib = state_mib * (1 + snapshots)
    print(f"tokens={tokens}: live={state_mib} MiB, "
          f"snapshots={snapshots}, total={total_mib} MiB")
print("eight independent live requests:", 8 * state_mib, "MiB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tokens=8192: live=5 MiB, snapshots=8, total=45 MiB
tokens=65536: live=5 MiB, snapshots=64, total=325 MiB
eight independent live requests: 40 MiB
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/fixed_state_checkpoint_policy_dark.png" alt="Two-panel state retention comparison. Top bar chart compares 1 live state (5 MiB), 8 concurrent live requests (40 MiB), 8K context with 8 snapshots (45 MiB), and 64K context with 64 snapshots (325 MiB). Bottom panel illustrates the 64K footprint as a 64-tile snapshot grid next to a stacked 5 MiB live vs 320 MiB saved-snapshot bar (98.5% snapshots)." />
  <figcaption>Saving a 5 MiB state snapshot every 1,024 tokens causes retained cache memory to grow linearly with context length: at 64K tokens, 64 snapshots consume 320 MiB (98.5% of the 325 MiB total) compared with 5 MiB for the single active recurrent state.</figcaption>
</figure>

Notice how quickly retained prefix snapshots dominate a constant live buffer. Production serving engines mitigate that footprint through prefix sharing, eviction policies, partial checkpoints with token replay, or fixed slot pools. Explicitly trading compressed summary state against token-addressable history also motivates mixing both mechanisms inside one model.

Benchmark results underscore that memory advantage. The Mamba-1 paper reports 4–5× higher decode throughput than matched Transformers on an A100 80GB PCIe across 2,048-token prompts and 128-token generations at batch sizes up to 128. Those runs compare trained Mamba 1.4B and an **untrained** 6.9B configuration against GPT-3-style 1.3B and 6.7B Transformers, showing that eliminating KV cache allows much larger batch sizes.[^gu2023] Throughput on production workloads still depends on precision, batch geometry, and matched task quality alongside raw memory savings.

```checkpoint
Why is constant-memory decoding both an advantage and a limitation?
---
It keeps serving memory predictable for long generations, which helps throughput and edge budgets. The limitation is that history is compressed into a fixed state, so exact token-level retrieval can be worse than attention over a full KV cache.
```

## Hybrid architectures: combining trade-offs

A hybrid decoder sends **every token through a fixed stack of both recurrent and attention layers** rather than routing conditionally to attention only on hard lookups. Most layers compress context inside fixed state to keep memory low. Meanwhile, a sparse subset retains token-addressable KV histories for exact recall.

Fixed-state SSM designs can regress on verbatim copy and lookup tasks, whereas pure attention stacks suffer linear KV growth across long prompts. **Hybrid architectures** bridge that tradeoff by combining both sequence mixers inside the same backbone. Production deployments therefore tune the attention fraction whenever a workload demands both high throughput and precise long-range retrieval.

### Hybrid models: Jamba and Nemotron-H

Jamba-v0.1[^ai21labs2024] interleaves Transformer and Mamba blocks while applying MoE to every other MLP layer, using one self-attention layer and seven Mamba layers inside each 8-layer repeating block. By contrast, Nemotron-H[^nvidia2025] keeps self-attention to roughly 8% of sublayers (4 out of 52 in its 8B variant), pairing an even split of 24 Mamba-2 and 24 <span data-glossary="feed-forward-network">FFN</span> sublayers, starting with Mamba-2 and placing an FFN directly after each attention layer. Note that these reported ratios use different counting conventions, because Jamba counts mixer-plus-MLP layers together while Nemotron-H counts mixers and FFNs separately. Both architectures place attention layers statically at training time rather than switching dynamically per prompt.

A hybrid does not need to use Mamba at all. Qwen3.6-35B-A3B alternates three Gated DeltaNet layers with one gated-attention layer repeated ten times alongside MoE feed-forward blocks.[^qwen3635b2026] Delta-rule linear attention and selective SSMs belong to distinct recurrence families with different update rules and state layouts. Cache planners must therefore inspect each model's actual layer state definitions rather than treating all recurrent layers as identical.

<!-- leetllm: test, output=show -->
```python title="hybrid-kv-cache-fraction.py"
total_layers = 32
attention_layers = 4
full_attention_kv_gib = 32.0
hybrid_kv_gib = full_attention_kv_gib * attention_layers / total_layers

print("attention layer fraction:", f"{attention_layers / total_layers:.1%}")
print("full-attention KV at 64K:", f"{full_attention_kv_gib:.1f} GiB")
print("hybrid KV only at 64K:", f"{hybrid_kv_gib:.1f} GiB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
attention layer fraction: 12.5%
full-attention KV at 64K: 32.0 GiB
hybrid KV only at 64K: 4.0 GiB
```
<!-- leetllm: output:end -->

```checkpoint
Why do hybrids keep occasional attention layers instead of using only SSM layers?
---
Attention layers reintroduce explicit token-to-token access. A hybrid can preserve more recall-heavy behavior than a pure SSM while reducing cache growth relative to an all-attention stack, but both outcomes require evaluation.
```

### Why hybrids work

Along the depth axis, every token passes sequentially through both recurrent and attention blocks, while along the sequence axis only the sparse attention layers grow a KV cache:

<figure>
  <img src="illustrations/_generated/hybrid_architecture_dark.png" alt="Left column shows a hybrid layer flow: SSM sublayers (Fixed state O(1)) into Sparse attention (KV lookup O(L)) into FFN / MoE (Stateless mix). Right column shows published layer counts: Jamba 8-layer block with 1 Attn and 7 Mamba layers, and Nemotron-H-8B 52 sublayers with 4 Attn, 24 Mamba-2, and 24 FFN." />
  <figcaption>Each token traverses the full stack (left), yet only the sparse attention sublayers expand KV cache along the sequence axis. Jamba counts mixer-plus-MLP layers per 8-layer block with MoE inside selected MLPs, while Nemotron-H-8B counts attention, Mamba-2, and FFN sublayers separately.</figcaption>
</figure>

## When to use SSMs vs. transformers vs. hybrids

There's no universal winner. Start with the failure you need to avoid: exact copying, growing decode memory, or both. Then benchmark the candidate that addresses it.

| Scenario | Candidate to benchmark | Why |
|----------|------------------|-----|
| Standard chat (short to moderate context) | Transformer | Mature optimized tooling; validate quality and latency |
| Long document analysis (128K+) | Hybrid | Test memory savings against retrieval accuracy |
| Real-time streaming | SSM | Fixed decode state is easier to budget as history grows |
| In-context learning (few-shot) | Transformer | Explicit token access is a strong baseline for copying/matching |
| Edge deployment (limited memory) | SSM or SSM-heavy hybrid | Fixed state is easier to budget than a growing KV cache |
| RAG (Retrieval-Augmented Generation) with precise retrieval | Transformer or Hybrid | Evaluate whether attention layers preserve required evidence use |

Asymptotic complexity doesn't choose a model. <span data-glossary="prefill">Prefill</span> still processes the prompt, and short-context inference may favor optimized attention kernels. Evaluate the actual checkpoints and serving implementations, not architecture names alone.

### Exact-retrieval release gate (NIAH / multi-needle)

Don't ship a pure SSM long-context path on recall <span data-glossary="slo">SLOs</span> without the same style of **needle-in-a-haystack (NIAH)** and multi-needle / variable-tracking suite taught in [Long Context Window Management](/learn/long-context-window-management). Attention keeps explicit token access. A fixed recurrent state compresses history, so middle-depth and multi-hop retrieval can regress even when average language-modeling loss looks fine.

Place identifiers near the beginning, middle, and end of prompts at each supported length. Add distractors, multiple facts, and updates that supersede an earlier value. Compare exact-answer accuracy under the same decoding settings, including unsupported questions that should be declined. Then measure peak device memory, time to first token, and per-token latency under the intended concurrency. Assess document-QA recall across these cases; depth and one successful needle provide only narrow evidence.

### Build a counterexample to exact recovery

Can two different histories leave exactly the same final state? With the scalar update $h_t=0.5h_{t-1}+0.5x_t$, compare prefixes $[3, 1]$ and $[1, 2]$. Both reach $h_2 = 1.25$, so any downstream readout or suffix continuation sees identical states and cannot distinguish the first token even with exact floating-point arithmetic.

<!-- leetllm: test, output=show, id=scalar-history -->
```python title="compressed-history-collision.py"
def summarize(values, initial=0.0):
    state = initial
    for value in values:
        state = 0.5 * state + 0.5 * value
    return state


left, right = [3, 1], [1, 2]
assert left != right and summarize(left) == summarize(right) == 1.25
suffix = [4, 2]
assert summarize(suffix, summarize(left)) == summarize(suffix, summarize(right))
print("different first values:", left[0], right[0])
print("same final state:", summarize(left))
print("same continuation:", summarize(suffix, summarize(left)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
different first values: 3 1
same final state: 1.25
same continuation: 2.3125
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/state_collision_continuation_dark.png" alt="Left-to-right flow graph showing sequences B: [1, 2] and A: [3, 1] both merging at Collision h2 = 1.250 under h[t] = 0.5 h[t-1] + 0.5 x[t], then advancing identically along + x3=4 (h3 = 2.625) and + x4=2 (h4 = 2.313)." />
  <figcaption>Distinct two-token prefixes merge into identical scalar state h2 = 1.250 and follow identical transitions through h3 = 2.625 and h4 = 2.313 when given the suffix [4, 2]. While higher-dimensional states and selective gates preserve distinctions a single scalar discards, fixed-state compression always retains a finite summary rather than addressable history.</figcaption>
</figure>

Notice the geometric lesson behind that collision. Multi-channel vectors and selective gating give Mamba far more capacity than a single scalar slot. Yet any fixed-size summary maps infinitely many token prefixes onto finite vectors, making retrieval evaluations essential on long-context workloads.

### Resume a stream, then deliberately break it

Adapting `prefix_scan` to the selective update across five inputs (`[3.0, 1.0, 4.0, 2.0, 0.5]`) tests both non-power-of-two padding and resuming from a prefix checkpoint. Splitting after two inputs and seeding the tail scan with `initial=first[-1]` matches full-sequence evaluation bit for bit. Starting the tail at zero instead discards the carried prefix and diverges immediately:

<!-- leetllm: test, continue=scan-cancellation, output=show -->
```python title="selective-stream-continuation.py"
from math import exp, log1p, isclose


def selective_pairs(values):
    pairs = []
    for value in values:
        z = -1.0 + 0.3 * value
        delta = max(z, 0.0) + log1p(exp(-abs(z)))
        pairs.append((exp(-delta), delta * (0.1 * value) * value))
    return pairs


updates = selective_pairs([3.0, 1.0, 4.0, 2.0, 0.5])
sequential, state = [], 0.0
for a, b in updates:
    state = a * state + b
    sequential.append(state)
scanned = prefix_scan(updates)
first = prefix_scan(updates[:2])
resumed = first + prefix_scan(updates[2:], initial=first[-1])
reset = first + prefix_scan(updates[2:], initial=0.0)


def matches(left, right):
    return len(left) == len(right) and all(
        isclose(a, b, abs_tol=1e-12) for a, b in zip(left, right)
    )


assert matches(scanned, sequential) and matches(resumed, sequential)
assert not matches(reset, sequential)
print("padded scan matches sequential:", matches(scanned, sequential))
print("resumed stream matches:", matches(resumed, sequential))
print("reset stream matches:", matches(reset, sequential))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
padded scan matches sequential: True
resumed stream matches: True
reset stream matches: False
```
<!-- leetllm: output:end -->

In a full Mamba-1 block, however, the recurrent tensor is not enough by itself. The rolling convolution buffer must survive checkpointing alongside the hidden state. In addition, batched state rows must follow their request IDs whenever a continuous-batching scheduler reorders requests.[^mamba2026implementation] Resetting either buffer upon resumption silently corrupts continuation just as leaking state across fresh requests would.

A minimal causal pipeline combining a width-3 convolution (weights `[0.2, 0.3, 0.5]` from oldest to newest) with a scalar `0.5 h + u` recurrence isolates this dependency directly. Restoring both the recurrent state `h_2 = 2.15` and the rolling convolution window `[0, 3, 1]` before processing suffix `[4, 2]` matches the unbroken run cleanly. Zeroing only the convolution window drops `u_3` from `2.90` to `2.00` before the recurrence even executes:

<!-- leetllm: test, output=show -->
```python title="convolution-stream-checkpoint.py"
import numpy as np

weights = np.array([0.2, 0.3, 0.5])


def run_stream(values, state=0.0, buffer=None):
    buf = np.zeros(3) if buffer is None else buffer.copy()
    outputs = []
    for value in values:
        buf = np.roll(buf, -1)
        buf[-1] = value
        filtered = float(np.dot(weights, buf))
        state = 0.5 * state + filtered
        outputs.append(state)
    return outputs, state, buf


full, _, _ = run_stream([3.0, 1.0, 4.0, 2.0])
prefix, saved_state, saved_buffer = run_stream([3.0, 1.0])
suffix, _, _ = run_stream([4.0, 2.0], saved_state, saved_buffer)
lost_buffer, _, _ = run_stream([4.0, 2.0], saved_state)
assert np.allclose(prefix + suffix, full)
assert not np.isclose(lost_buffer[0], full[2])
print("reference suffix:", np.round(full[2:], 4).tolist())
print("restored both:", np.round(suffix, 4).tolist())
print("restored recurrence only:", np.round(lost_buffer, 4).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
reference suffix: [3.975, 4.3875]
restored both: [3.975, 4.3875]
restored recurrence only: [3.075, 3.7375]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/stream_buffer_restore_dark.png" alt="Top flow branches from Prefix [3,1] (h2 = 2.15) into two paths on suffix [4, 2]: green Restore +4 -> Match +2 yields u=2.9, h=3.98 then u=2.4, h=4.388, while red dashed Zero +4 -> Drift +2 yields u=2.0, h=3.08 then u=2.2, h=3.738. Bottom panels compare Saved conv window [3*0.2, 1*0.3, 4*0.5] summing to u3 = 2.90 against Cleared conv window [0*0.2, 0*0.3, 4*0.5] summing to u3 = 2.00." />
  <figcaption>A checkpoint after prefix [3, 1] must pair h_2 = 2.15 with the rolling convolution window [0, 3, 1]. Dropping the convolution buffer corrupts u_3 from 2.90 down to 2.00 when x_3 = 4 arrives, drifting the resumed state to 3.7375 instead of 4.3875.</figcaption>
</figure>

Because the first token after a split still multiplies earlier activations inside the convolution filter, partial state restoration silently alters layer inputs before the SSM scan runs. A single missing tap corrupts the incoming write and propagates drift into every later state step. Every checkpoint must therefore capture every live stateful buffer of its block and isolate each request's copies independently.

### Rejection requires restoring state

In [Speculative Decoding](/learn/speculative-decoding), rejecting unaccepted draft tokens from an attention layer simply truncates the trailing positions of its KV cache. A recurrent SSM instead overwrites one shared state vector in place across steps. Speculative verification therefore cannot walk backward merely by deleting trailing token IDs: the engine must restore a checkpoint, maintain per-step snapshots, or replay from the last accepted prefix.

Run the scalar half-carry recurrence after prefix `[3, 1]` across provisional tokens `[99, 77]`. Verification accepts `99`, rejects `77`, and samples correction `4`. Restoring the saved snapshot after `99` gives the exact `27.0625`, whereas updating from the contaminated state after rejected `77` drifts to `33.78125`:

<!-- leetllm: test, continue=scalar-history, output=show -->
```python title="recurrent-state-rollback.py"
from math import exp

prefix_state = summarize([3, 1])
snapshots = [prefix_state]
for provisional in (99, 77):
    snapshots.append(summarize([provisional], snapshots[-1]))
accepted_count = 1
restored = snapshots[accepted_count]
corrected = summarize([4], restored)
contaminated = summarize([4], snapshots[-1])
reference = summarize([99, 4], prefix_state)
assert corrected == reference == 27.0625
assert contaminated == 33.78125 and contaminated != reference

# An exp(-1000) carryover underflows to zero in float64 arithmetic.
carryover = exp(-1000.0)
assert carryover == 0.0
assert carryover * 3.0 + 7.0 == carryover * 9.0 + 7.0
print("restored then corrected:", corrected)
print("corrected from rejected state:", contaminated)
print("distinct prior states become identical:", carryover == 0.0)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
restored then corrected: 27.0625
corrected from rejected state: 33.78125
distinct prior states become identical: True
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/recurrent_rollback_dark.png" alt="Left-to-right rollback graph starting at Prefix [3,1] (h2 = 1.250) to Accept 99 (Save 50.125), branching to dashed green Rollback + 4 (Valid 27.063) versus amber Reject 77 (Dirty 63.563) followed by red Dirty + 4 (Drift 33.781)." />
  <figcaption>Accepting 99 and rejecting 77 leaves the live slot dirty at 63.563. Rolling back to the saved snapshot 50.125 produces the exact corrected state 27.063 on input 4, whereas stepping forward from the dirty state drifts to 33.781.</figcaption>
</figure>

Restore every affected layer's valid buffers (including convolution or previous-write states) before processing a sampled correction. Algebraic inversion is unsafe as a general rollback mechanism because decay factors can underflow to zero and make distinct prior states indistinguishable. Dividing by tiny carryover factors also amplifies rounding error, leaving explicit checkpoints or replay as the reliable mechanism.

```checkpoint
Why can associative scan regroup input-dependent updates, but not an arbitrary RNN update whose coefficients depend on the previous hidden state?
---
For selective SSMs, the input sequence determines the affine update pairs before the scan. An arbitrary hidden-state-dependent update may not yield a fixed affine pair until the preceding state is known, so this composition trick no longer applies directly.
```

Finally, separate startup latency from per-token decode cost. Suppose an attention model takes 120 ms for prefill and 3.2 ms per decode step, whereas an SSM takes 150 ms for prefill and 1.8 ms per decode step. Because prefill already emits token 1, generating $N$ tokens requires $N - 1$ decode steps, tipping the latency lead from attention at 16 tokens to the SSM at 256 tokens:

<!-- leetllm: test, output=show -->
```python title="prefill-versus-decode-accounting.py"
transformer = {"prefill_ms": 120, "decode_ms_per_token": 3.2}
ssm = {"prefill_ms": 150, "decode_ms_per_token": 1.8}

for generated_tokens in (16, 256):
    decode_steps = generated_tokens - 1
    transformer_total = transformer["prefill_ms"] + decode_steps * transformer["decode_ms_per_token"]
    ssm_total = ssm["prefill_ms"] + decode_steps * ssm["decode_ms_per_token"]
    winner = "ssm" if ssm_total < transformer_total else "transformer"
    print(f"generated={generated_tokens}: winner={winner}, delta_ms={abs(ssm_total - transformer_total):.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
generated=16: winner=transformer, delta_ms=9.0
generated=256: winner=ssm, delta_ms=327.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/prefill_decode_crossing_dark.png" alt="Top line chart plots total generation latency against output tokens N from 1 to 64, showing Attention (120 ms + 3.2 ms/step) crossing SSM (150 ms + 1.8 ms/step) at 22.4 tokens. Bottom stacked bar breakdown compares prefill versus decode at 16 tokens (168 vs 177 ms) and 256 tokens (936 vs 609 ms)." />
  <figcaption>Total latency combines prefill (which already emits token 1) plus N − 1 decode steps. With lower decode cost offsetting its higher 150 ms prefill latency, the SSM path pulls ahead after token 23, flipping a 9 ms deficit at 16 outputs into a 327 ms lead at 256 outputs.</figcaption>
</figure>

```checkpoint
When should a production team prefer a transformer over an SSM-heavy model despite worse long-context asymptotics?
---
Prefer the transformer if measurements show it meets the workload's quality, memory, and latency requirements better. Short context, exact copying, and mature attention kernels are reasons to benchmark it, not enough evidence on their own to declare a winner.
```


## Where fixed-state models lead

Although scalar traces make recurrence carry, associative prefix scans, and checkpoint dependencies transparent, production choices come down to how many extra decode steps a workload needs. Hybrids contain KV growth across the model stack by keeping attention sparse. Reasoning workloads then amplify every per-token decode cost across long chains of thought, which is the focus of [Reasoning & Test-Time Compute](/learn/reasoning-models-test-time-compute).

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
