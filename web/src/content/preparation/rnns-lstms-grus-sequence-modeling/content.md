---
{
  "id": "rnns-lstms-grus-sequence-modeling",
  "title": "RNNs, LSTMs, GRUs, and Sequence Modeling",
  "slug": "rnns-lstms-grus-sequence-modeling",
  "section": "Preparation & Prerequisites",
  "category": "Model Architecture",
  "difficulty": "Easy",
  "order": 6,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Anthropic",
    "Microsoft",
    "Amazon",
    "Apple"
  ],
  "shortDescription": "Trace an RNN over ordered events, see why gradients fade or grow, and use LSTM and GRU gates to control memory.",
  "keyConceptsTested": [
    "Order-sensitive sequence modeling",
    "RNN recurrence and shared weights",
    "State, gate, and parameter dimensions",
    "Backpropagation through time",
    "Vanishing and exploding gradients",
    "LSTM cell state and gates",
    "GRU update and reset gates",
    "Framework-specific GRU gate conventions",
    "Encoder-decoder sequence compression",
    "Self-attention path length"
  ]
}
---

A sentiment classifier reads a short review phrase token by token: `slow`, then `yet`, then `engaging`. Reverse that order to `engaging`, `yet`, `slow`, and the verdict flips from an early caveat redeemed by praise to a bright opening dragged down at the end. Word order changes meaning, so how does one neural network preserve order across phrases of any length?

We will keep the same three-class <span data-glossary="logits">logits</span> and <span data-glossary="softmax">softmax</span> head from the [previous lesson](/learn/softmax-cross-entropy-optimization) (`negative`, `positive`, `neutral`), and build the recurrent backbone that folds a variable-length token stream into the single fixed-size vector that head expects.

## Order is part of the input

A bag-of-words sum treats every permutation identically because addition commutes. An order-aware recurrence folds each step's running state into the next calculation. Multiply the previous state by `0.6` before adding the current token weight, and later tokens carry more direct weight in the final number:

<!-- leetllm: test, output=show -->
```python title="order-changes-the-state.py"
signals = {
    "slow": 1.0,
    "yet": 0.4,
    "engaging": 0.9,
}

def running_state(tokens):
    state = 0.0
    for token in tokens:
        state = 0.6 * state + signals[token]
    return state

phrase_order = ["slow", "yet", "engaging"]
reversed_order = list(reversed(phrase_order))

print("phrase order:", round(running_state(phrase_order), 3))
print("reversed order:", round(running_state(reversed_order), 3))
print("same tokens:", sorted(phrase_order) == sorted(reversed_order))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
phrase order: 1.5
reversed order: 1.564
same tokens: True
```
<!-- leetllm: output:end -->

The forward phrase computes `0.6 * (0.6 * 1.0 + 0.4) + 0.9 = 1.5`. Reversing the tokens puts the largest token weight `1.0` in the final position, yielding `0.6 * (0.6 * 0.9 + 0.4) + 1.0 = 1.564`. A plain sum returns `2.3` in both cases, whereas recurrence makes sequence order inseparable from the final value.

## One cell, reused at every step

A **<span data-glossary="recurrent-neural-network">recurrent neural network</span> (RNN)** makes this update rule trainable. Its **hidden state** ($h_t$) is a running vector carried from one token to the next, serving as working memory across positions. The learned update rule is called a **recurrent cell**, and each new token advances the sequence by one **timestep**.

Start with a scalar hidden state. Multiply the incoming token by `0.8`, multiply the previous hidden state by `0.5`, add them, and squash the sum through **<span data-glossary="tanh">hyperbolic tangent (tanh)</span>** into $(-1, 1)$. Starting from $h_0 = 0.0$ on token `1.0`, $h_1 = \tanh(0.8) \approx 0.664$; on token `0.4`, $h_2 = \tanh(0.8 \times 0.4 + 0.5 \times 0.664) \approx 0.573$:

<!-- leetllm: test, output=show -->
```python title="one-dimensional-rnn.py"
import math

tokens = [1.0, 0.4, 0.9]
w_input, w_state, bias = 0.8, 0.5, 0.0
state = 0.0

for step, token in enumerate(tokens, start=1):
    state = math.tanh(w_input * token + w_state * state + bias)
    print(f"h_{step} = {state:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
h_1 = 0.664
h_2 = 0.573
h_3 = 0.764
```
<!-- leetllm: output:end -->

Three scalar inputs condense into one final scalar summary, showing the core idea in one dimension. To represent richer linguistic context such as sentiment polarity, negation, and clause structure simultaneously, an RNN expands the hidden state into a multi-dimensional <span data-glossary="vector">vector</span> $h_t \in \mathbb{R}^{d_h}$. Each step updates that vector using the standard recurrence:

$$
h_t = \tanh(W_{xh}x_t + W_{hh}h_{t-1} + b_h)
$$

Here $x_t \in \mathbb{R}^{d_x}$ is the current input vector, $h_{t-1} \in \mathbb{R}^{d_h}$ is the prior hidden state, and $b_h \in \mathbb{R}^{d_h}$ is a bias vector. The weight <span data-glossary="matrix">matrices</span> $W_{xh} \in \mathbb{R}^{d_h \times d_x}$ and $W_{hh} \in \mathbb{R}^{d_h \times d_h}$ project the new observation and transition the prior state, with `tanh` applied elementwise into $(-1, 1)$. Because every timestep executes the same $W_{xh}$, $W_{hh}$, and $b_h$, parameter count stays completely invariant to sequence length, from 3 tokens to 3,000 tokens.[^pascanu2013]

```checkpoint
Why can an RNN read either 3 tokens or 30 tokens without changing its parameter count?
---
It reuses the exact same input and recurrent weight matrices at every timestep. The number of learned weights depends only on input width $d_x$ and hidden width $d_h$, not sequence length. Memory during training still increases with sequence length when saving activations for backpropagation.
```


## Trace a vector RNN

To watch the vector update work on concrete numbers, represent each review token with three binary features indicating its semantic cue (`slow` maps to `cue_opening`, `yet` maps to `cue_contrast`, and `engaging` maps to `cue_praise`):

| Token | `cue_opening` | `cue_contrast` | `cue_praise` |
|---|---:|---:|---:|
| `slow` | 1 | 0 | 0 |
| `yet` | 0 | 1 | 0 |
| `engaging` | 0 | 0 | 1 |

These are **one-hot** token vectors where one coordinate is `1` and all others are `0`, encoding only the active token at timestep $t$. Setting $d_h = 2$, $h_0 = [0.0, 0.0]^T$, and zero biases ($b_h = [0.0, 0.0]^T$) lets us track every matrix entry cleanly by hand. On step 1 (`slow`, $x_1 = [1, 0, 0]^T$), $W_{hh} h_0$ is zero and $W_{xh} x_1$ extracts column 1 of $W_{xh}$ (`[0.8, 0.1]`), giving $h_1 = [\tanh(0.8), \tanh(0.1)]^T \approx [0.664, 0.100]^T$. On step 2 (`yet`), the previous state mixes through $W_{hh}$ before adding $W_{xh} x_2$ and applying `tanh`. Grouping every vector and weight matrix by tensor shape shows why the architecture decouples sequence length from model size:

| Object | This example | General shape | Role |
|---|---|---|---|
| $x_t$ | `(3,)` | $(d_x,)$ | One incoming token vector |
| $h_t$, $b_h$ | `(2,)` | $(d_h,)$ | Hidden state and bias vectors |
| $W_{xh}$ | `(2, 3)` | $(d_h, d_x)$ | Maps current token into hidden space |
| $W_{hh}$ | `(2, 2)` | $(d_h, d_h)$ | Maps prior hidden state to new hidden state |

Trace the full hidden-state trajectory across all three one-hot tokens in NumPy:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="vector-rnn-forward-pass.py"
import numpy as np

tokens = np.eye(3)
W_xh = np.array([
    [0.8, 0.2, 0.1],
    [0.1, 0.7, 0.4],
])
W_hh = np.array([
    [0.5, 0.1],
    [0.0, 0.6],
])

state = np.zeros(2)
for step, token in enumerate(tokens, start=1):
    state = np.tanh(W_xh @ token + W_hh @ state)
    print(f"h_{step} = {[round(float(v), 3) for v in state]}")

print("final width:", state.shape[0])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
h_1 = [0.664, 0.1]
h_2 = [0.494, 0.641]
h_3 = [0.39, 0.655]
final width: 2
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/unrolled_rnn_dark.png" alt="Top diagram traces one shared recurrent cell across three review tokens: slow produces state [0.664, 0.100], yet updates it to [0.494, 0.641], and engaging reaches final state [0.390, 0.655]. Bottom left bars show final softmax probabilities: 29.1% negative, 38.9% positive, and 32.0% neutral. Bottom right bars show backward scalar sensitivity falling from 0.333 at step 3 to 0.112 at step 2 and 0.031 at step 1." />
  <figcaption>A single $2\times3$ input matrix and $2\times2$ recurrent matrix advance the state across all three tokens to $h_3\approx[0.390,0.655]$. Softmax scores over the rounded final vector assign 38.9% to `positive`, while the scalar sensitivity chart compares backward gradient strength across steps.</figcaption>
</figure>

Attach a **classification head** to that final hidden state via a linear projection $W_{\text{out}} \in \mathbb{R}^{3 \times 2}$ followed by softmax, reusing the multiclass output layer from the previous lesson. Row 1 (`negative`) computes pre-activation logit $0.7 \times 0.390 - 0.3 \times 0.655 = 0.0765$, while rows 2 and 3 yield $0.368$ (`positive`) and $0.170$ (`neutral`). Because $0.368$ is the largest score, `positive` takes the highest probability after exponentiation and normalization:

<!-- leetllm: test, output=show -->
```python title="final-state-sentiment-head.py"
import math

final_state = [0.390, 0.655]
W_out = [
    [0.7, -0.3],   # negative
    [-0.4, 0.8],   # positive
    [0.1, 0.2],    # neutral
]
labels = ["negative", "positive", "neutral"]

logits = [
    sum(weight * value for weight, value in zip(row, final_state, strict=True))
    for row in W_out
]
shift = max(logits)
weights = [math.exp(logit - shift) for logit in logits]
total = sum(weights)
probabilities = [weight / total for weight in weights]

print("logits:", [round(logit, 3) for logit in logits])
print("probabilities:", [round(probability, 3) for probability in probabilities])
print("prediction:", labels[probabilities.index(max(probabilities))])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
logits: [0.076, 0.368, 0.17]
probabilities: [0.291, 0.389, 0.32]
prediction: positive
```
<!-- leetllm: output:end -->

With these weights and rounded final state, the classifier predicts `positive` at 38.9% probability. Crucially, the output head reads only the fixed-width vector $[0.390, 0.655]^T$, never inspecting earlier token vectors directly. Counting trainable parameters in a biased version gives 6 weights in $W_{xh}$, 4 in $W_{hh}$, 2 biases in $b_h$, plus 6 weights and 3 biases in the classifier head, totaling 21 parameters shared across sequences of any length:

<!-- leetllm: test, output=show -->
```python title="shared-parameter-count.py"
input_size, hidden_size, output_size = 3, 2, 3
rnn_parameters = hidden_size * input_size + hidden_size * hidden_size + hidden_size
head_parameters = output_size * hidden_size + output_size

for timesteps in [3, 30, 300]:
    print(f"{timesteps:>3} tokens -> {rnn_parameters + head_parameters} parameters")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
  3 tokens -> 21 parameters
 30 tokens -> 21 parameters
300 tokens -> 21 parameters
```
<!-- leetllm: output:end -->

Fixing the hidden width creates a fundamental compression bottleneck because useful context from every token must fit inside $h_t$ without overflowing its finite coordinates. At the same time, reusing those transitions across steps creates a training challenge: when the loss sits at the end of a long sequence, gradient credit assignment back to early tokens must survive every intermediate step. Checking both forward capacity and backward gradient flow reveals why plain RNNs struggle on long spans.

## Backpropagation through time: why a distant signal can fade

The forward pass assigned its highest probability to `positive`. During training, a target label and cross-entropy loss measure prediction error against that score. **Backpropagation through time (BPTT)** then applies the chain rule backward across the unrolled steps to accumulate gradients for the shared matrices.[^pascanu2013] Because $W_{hh}$ acts at every step, its summed-loss gradient collects every earlier step $k$ reaching each later loss $t$:

$$
\frac{\partial L}{\partial W_{hh}} = \sum_{t=1}^T \sum_{k=1}^t \frac{\partial L_t}{\partial h_t} \frac{\partial h_t}{\partial h_k} \frac{\partial^+ h_k}{\partial W_{hh}}
$$

Here $\frac{\partial^+ h_k}{\partial W_{hh}}$ differentiates step $k$ while holding $h_{k-1}$ fixed, isolating how the weights enter that single transition. Long-range credit assignment therefore hinges on the temporal Jacobian product $\frac{\partial h_t}{\partial h_k} = J_t J_{t-1}\cdots J_{k+1}$, where $J_j = \frac{\partial h_j}{\partial h_{j-1}}$. To watch this product drive vanishing behavior, inspect the scalar recurrence $h_j = \tanh(0.8 x_j + 0.5 h_{j-1})$, whose local derivative is $(1 - h_j^2) w_{\text{state}}$. Because $1 - h_j^2 \in (0, 1]$ and $w_{\text{state}} = 0.5$, every backward link cuts the signal by more than half:

<!-- leetllm: test, output=show -->
```python title="bptt-one-dimensional-product.py"
import math

tokens = [1.0, 0.4, 0.9]
w_input, w_state = 0.8, 0.5
state = 0.0
factor = 1.0

for step, token in enumerate(tokens, start=1):
    state = math.tanh(w_input * token + w_state * state)
    local = (1.0 - state * state) * w_state
    factor *= local
    print(f"step {step}: h={state:.3f}  local factor={local:.6f}  product so far={factor:.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
step 1: h=0.664  local factor=0.279528  product so far=0.279528
step 2: h=0.573  local factor=0.335820  product so far=0.093871
step 3: h=0.764  local factor=0.207910  product so far=0.019517
```
<!-- leetllm: output:end -->

The resulting three-step sensitivity $\partial h_3 / \partial h_0 \approx 0.0195$ governs how much downstream error reaches the initial hidden state. If a final-loss gradient delivers $g = \partial L / \partial h_3$, then only `0.0195 * g` arrives back at $h_0$. Under two percent of the learning signal survives across just three tokens. When every recurrent step compounds a constant contraction such as `0.6`, the signal falls off exponentially across deeper spans:

<!-- leetllm: test, output=show -->
```python title="vanishing-gradient-product.py"
for steps in [1, 4, 8, 12]:
    gradient_factor = 0.6 ** steps
    print(f"{steps:>2} recurrent steps: {gradient_factor:.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
 1 recurrent steps: 0.600000
 4 recurrent steps: 0.129600
 8 recurrent steps: 0.016796
12 recurrent steps: 0.002177
```
<!-- leetllm: output:end -->

### A matrix bound, and what it actually proves

In multiple dimensions, each transition has a **Jacobian matrix** $J_j = \frac{\partial h_j}{\partial h_{j-1}} = \operatorname{diag}(1 - h_j^2) W_{hh}$. Backpropagating a final-step loss gradient to step $k$ multiplies by transposed Jacobians in reverse time order:[^bengio1994][^pascanu2013]

$$
\nabla_{h_k} L = J_{k+1}^{\mathsf{T}} J_{k+2}^{\mathsf{T}}\cdots J_T^{\mathsf{T}}\nabla_{h_T} L
$$

Taking induced Euclidean norms yields the classic bound:

$$
\left\| \frac{\partial h_T}{\partial h_k} \right\| \le \prod_{j=k+1}^T \left\| \operatorname{diag}\left(1 - h_j^2\right) \right\| \cdot \| W_{hh} \| \le \left( \gamma \, \sigma_{\max}(W_{hh}) \right)^{T-k}
$$

Here $\gamma = \max_j \|\operatorname{diag}(1 - h_j^2)\| \le 1$ and $\sigma_{\max}(W_{hh})$ is the spectral norm (largest singular value) of $W_{hh}$. Whenever $\gamma\sigma_{\max}(W_{hh}) < 1$, distant gradients are guaranteed to decay exponentially. When $\gamma\sigma_{\max}(W_{hh}) > 1$, growth becomes possible but not automatic, because actual trajectory growth depends on vector directions and Jacobian alignment.[^pascanu2013]

```checkpoint
For a linear recurrence, take W = [[0.5, 1], [0, 0.5]]. Its largest singular value is about 1.21. Does that prove distant gradients grow without bound?
---
No. Here Wⁿ = [[0.5ⁿ, n·0.5ⁿ⁻¹], [0, 0.5ⁿ]], which tends to zero. Some directions can grow temporarily, but repeated multiplication eventually contracts. The exact powers decay even though the bound ‖Wⁿ‖ ≤ 1.21ⁿ grows, so inspect the matrix power before inferring gradient growth.
```

> **Key insight:** Vanishing gradients hurt training long before float32 underflow. Even when $0.6^{50} \approx 8 \times 10^{-12}$ is still representable in float32, distant gradients are dwarfed by near-term gradients and barely move the weights.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Left column outlines four steps in the sequence modeling guide: shared-weight recurrence, skipping padding slots, additive LSTM and coupled GRU gates, and direct attention paths. Right chart plots exponential backward decay over 12 steps: an LSTM gate of 0.98 keeps 0.785, a 0.60 factor drops to 0.002, and a 0.28 factor vanishes near zero." />
  <figcaption>Constant path factors show how exponential decay scales with backward distance: $0.98^{12}\approx0.785$, $0.60^{12}\approx0.002177$, and $0.28^{12}\approx2.32\times10^{-7}$. In the scalar RNN trace, actual local derivatives multiply backward to $\partial h_3/\partial h_0\approx0.019517$ across three steps.</figcaption>
</figure>

### Truncation and gradient clipping

Two standard controls manage recurrent gradients: **truncated BPTT** caps backward memory by splitting long sequences into chunks and calling `h = h.detach()` (and `c.detach()` in an LSTM) between chunks, while **gradient norm clipping** rescales exploding gradients back to a ceiling $c$. Detaching keeps the exact forward state value while cutting backward credit assignment across the chunk boundary:

<!-- leetllm: test, deps=torch, output=show -->
```python title="same-state-different-credit.py"
import torch

def trace(cut_after_second):
    tokens = torch.tensor([1.0, 0.4, 0.9], dtype=torch.float64,
                          requires_grad=True)
    weight = torch.tensor(0.5, dtype=torch.float64, requires_grad=True)
    state = torch.zeros((), dtype=torch.float64)
    for step, token in enumerate(tokens, start=1):
        state = torch.tanh(0.8 * token + weight * state)
        if cut_after_second and step == 2:
            state = state.detach()
    # Differentiate the final state directly to compare path sensitivity.
    state.backward()
    return state.item(), tokens.grad, weight.grad.item()

full_state, full_tokens, full_weight = trace(False)
cut_state, cut_tokens, cut_weight = trace(True)
assert full_state == cut_state
assert full_tokens[0] > 0 and cut_tokens[0] == 0
print(f"final states: full={full_state:.6f}, truncated={cut_state:.6f}")
print("token derivatives, full:", [round(g, 6) for g in full_tokens.tolist()])
print("token derivatives, truncated:", [round(g, 6) for g in cut_tokens.tolist()])
print(f"weight derivative: full={full_weight:.6f}, truncated={cut_weight:.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
final states: full=0.764316, truncated=0.764316
token derivatives, full: [0.031227, 0.111713, 0.332657]
token derivatives, truncated: [0.0, 0.0, 0.332657]
weight derivative: full=0.331003, truncated=0.238277
```
<!-- leetllm: output:end -->

Detaching preserves the numeric state value forward while erasing its computational history backward. The final token can still train the shared weight through its direct step, though it can no longer reinforce earlier uses of that same weight. In full training loops with an optimizer step between chunks, the carried state may also originate from an earlier weight version.

**Gradient norm clipping** addresses exploding gradients whenever the $L_2$ norm of the gradient vector exceeds a threshold $c$, rescaling every component proportionally:

$$
g \leftarrow \min\left(1, \frac{c}{\|g\|_2}\right) g
$$

<!-- leetllm: test, output=show -->
```python title="exploding-gradients-and-clipping.py"
import math

raw_x = 1.4 ** 12
raw_y = -0.8 * raw_x
raw_norm = math.hypot(raw_x, raw_y)
max_norm = 5.0
scale = min(1.0, max_norm / raw_norm)
clipped = (raw_x * scale, raw_y * scale)

print("raw norm:", round(raw_norm, 3))
print("clipped norm:", round(math.hypot(*clipped), 3))
print("clipped gradient:", [round(value, 3) for value in clipped])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw norm: 72.604
clipped norm: 5.0
clipped gradient: [3.904, -3.123]
```
<!-- leetllm: output:end -->

Norm clipping shrinks oversized gradients while preserving their direction,[^pascanu2013] capping exploding updates without solving vanishing gradients. Fixing vanishing memory requires changing the cell architecture itself.

## LSTM: Additive cell state and gated memory

Whereas gradient clipping caps large updates after they occur, LSTMs add an additive cell-state path that carries stored values across steps without sending the cell itself through a saturating activation. **<span data-glossary="lstm">Long short-term memory (LSTM)</span>** organizes recurrent memory into two related state vectors:[^hochreiter1997]
- **Internal cell state ($c_t \in \mathbb{R}^{d_h}$):** A vector the cell updates by addition, so a stored coordinate can move forward without passing through tanh on that step.
- **Working hidden state ($h_t \in \mathbb{R}^{d_h}$):** The exposed memory vector passed to the next layer and the output classifier.

Information flow is controlled by **gates**, which are learned coordinate-wise affine projections squashed by the sigmoid function ($\sigma(z) \in (0, 1)$). A gate value near 0 acts as a closed valve, while a value near 1 leaves the valve open. The standard modern formulation adds the forget gate introduced by Gers et al.[^gers2000]

Suppose a single coordinate in our cell state holds `0.855` after reading an opening negative cue token like `"slow"`. Next, a neutral transition token `"midway"` arrives, and we want to retain that earlier clause cue while writing almost nothing new from `"midway"`:

| Control | Value | Role | Calculation |
|---|---:|---|---|
| Forget gate ($f_t$) | `0.98` | Fraction of old cell memory to keep | Retain `0.98 * 0.855 = 0.8379` |
| Input gate ($i_t$) | `0.02` | Fraction of new candidate to write | Write `0.02 * 0.10 = 0.0020` |
| Cell update ($c_t$) | | Additive combination of both paths | $0.8379 + 0.0020 = 0.8399$ |
| Output gate ($o_t$) | `0.80` | Fraction of filtered cell to expose | Expose $0.80 \times \tanh(0.8399) \approx 0.549$ |

Notice that the stored cell value ($c_t \approx 0.840$) differs from the exposed hidden state ($h_t \approx 0.549$). Closing the output gate can hide a stored coordinate without erasing it from memory. At the same time, the two states remain coupled because future gates still read the hidden state at the next step. Using hand-chosen gate weights, step through three token transitions in pure Python:

<!-- leetllm: test, output=show -->
```python title="lstm-keep-write-expose.py"
import math

cell = 0.0
steps = [
    ("token: slow",     0.00, 0.95, 0.90, 0.80),
    ("token: midway",   0.98, 0.02, 0.10, 0.80),
    ("token: engaging", 0.97, 0.15, 0.50, 0.90),
]

for label, forget, write, candidate, expose in steps:
    cell = forget * cell + write * candidate
    hidden = expose * math.tanh(cell)
    print(f"{label:<20} c={cell:.3f}  h={hidden:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
token: slow          c=0.855  h=0.555
token: midway        c=0.840  h=0.549
token: engaging      c=0.890  h=0.640
```
<!-- leetllm: output:end -->

### The full LSTM equations

In a trainable LSTM, learned affine projections compute these gate vectors from the concatenation of the prior working state $h_{t-1}$ and the current input $x_t$, written $[h_{t-1}, x_t] \in \mathbb{R}^{d_h + d_x}$, and update both state vectors via coordinate-wise Hadamard products ($\odot$):

$$
\begin{aligned}
f_t &= \sigma(W_f [h_{t-1}, x_t] + b_f) && \text{(Forget gate: what to discard)} \\
i_t &= \sigma(W_i [h_{t-1}, x_t] + b_i) && \text{(Input gate: what to write)} \\
\tilde{c}_t &= \tanh(W_c [h_{t-1}, x_t] + b_c) && \text{(Candidate state: proposed facts)} \\
c_t &= f_t \odot c_{t-1} + i_t \odot \tilde{c}_t && \text{(Cell update: additive memory highway)} \\
o_t &= \sigma(W_o [h_{t-1}, x_t] + b_o) && \text{(Output gate: what to expose)} \\
h_t &= o_t \odot \tanh(c_t) && \text{(Exposed working state)}
\end{aligned}
$$

### Follow the direct cell-state gradient path

In the standard LSTM without peephole connections, the cell receives $(h_{t-1},c_{t-1})$ as separate state inputs. Holding $h_{t-1}$ and $x_t$ fixed keeps every gate and candidate vector fixed as well. Under those fixed gates, the direct cell-state Jacobian reduces to a diagonal matrix whose entries are simply the forget gates:

$$
\left.\frac{\partial c_t}{\partial c_{t-1}}\right|_{\text{gates fixed}} = \operatorname{diag}(f_t)
$$

Multiplying that direct Jacobian across several steps yields a simple diagonal product rather than powers of a dense recurrent weight matrix. Because diagonal matrices commute and multiply entrywise, each coordinate tracks its own survival factor cleanly across the horizon:

$$
\text{direct-path factor} = \prod_{j=k+1}^T \operatorname{diag}(f_j) = \operatorname{diag}\left( \prod_{j=k+1}^T f_j \right)
$$

Contrast this directly with the vanilla RNN product $\prod \operatorname{diag}(1 - h_j^2) W_{hh}$:
1. **Direct diagonal path:** No $W_{hh}^{T-k}$ factor acts along this channel.
2. **Additive cell update:** The cell state passes through no $\tanh$ during the update.
3. **Controllable retention:** Forget gates near one slow decay. If every gate on a coordinate is 0.999 for 100 transitions, its direct-path factor is about 0.905, retaining 90.5%. At 0.5, the same product is approximately $7.89\times10^{-31}$.

> **Key insight:** An LSTM protects long-range memory with an *additive* highway ($c_t = f_t \odot c_{t-1} + i_t \odot \tilde{c}_t$). Along the direct cell path, derivatives multiply by the diagonal forget gates $\prod f_j$ instead of repeated powers of $W_{hh}$ and $\tanh$ derivatives.[^hochreiter1997][^gers2000]

```checkpoint
What does an LSTM forget gate value near 1 do?
---
It passes almost the entire corresponding cell-state coordinate into the next timestep. Paired with an input gate near 0, it shields that stored feature from decay and overwriting across the current step.
```

## GRU: Unified hidden state and streamlined gating

LSTMs maintain two state vectors ($c_t$ and $h_t$) alongside four learned affine projections per timestep. The **<span data-glossary="gru">gated recurrent unit (GRU)</span>** streamlines the design by merging cell and hidden state into a single vector $h_t$. It replaces the independent forget and input gates with one coupled **update gate** ($z_t$) forming a convex mixture:[^cho2014]

$$
h_t = z_t \odot h_{t-1} + (1 - z_t) \odot \tilde{h}_t
$$

Because the two weights always sum to 1, retention and writing trade off directly along every coordinate. Choosing an old state of `0.80`, a candidate of `-0.20`, and $z_t = 0.95$ automatically sets the write fraction to 5%, giving `0.95 * 0.80 + 0.05 * (-0.20) = 0.750`. A second **reset gate** ($r_t$) scales how much prior history enters the proposed candidate $\tilde{h}_t$, yielding the full four-line recurrence:

$$
\begin{aligned}
z_t &= \sigma(W_z [h_{t-1}, x_t] + b_z) && \text{(Update gate: retain vs. overwrite balance)} \\
r_t &= \sigma(W_r [h_{t-1}, x_t] + b_r) && \text{(Reset gate: how much prior history candidate sees)} \\
\tilde{h}_t &= \tanh(W_h [r_t \odot h_{t-1}, x_t] + b_h) && \text{(Candidate state)} \\
h_t &= z_t \odot h_{t-1} + (1 - z_t) \odot \tilde{h}_t && \text{(Unified hidden state)}
\end{aligned}
$$

When $r_t \to 0$, the candidate ignores past history and behaves like a feedforward projection of $x_t$ alone. Conversely, when $z_t \to 1$, the gate carries the old hidden coordinate unchanged across the step. Sweep three keep fractions in Python to inspect the linear blend:

<!-- leetllm: test, output=show -->
```python title="gru-keep-gate.py"
old_state = 0.80
candidate = -0.20

for keep_gate in [0.95, 0.50, 0.05]:
    new_state = keep_gate * old_state + (1.0 - keep_gate) * candidate
    print(f"z={keep_gate:.2f} -> h={new_state:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
z=0.95 -> h=0.750
z=0.50 -> h=0.300
z=0.05 -> h=-0.150
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/gated_memory_tracks_dark.png" alt="A single LSTM coordinate retains 0.98 times the old cell 0.855, adds 0.02 times candidate 0.10, and stores cell 0.8399. The same cell exposes hidden 0.549 through output gate 0.80 or hidden 0.069 through output gate 0.10. All gate bars share a zero-to-one scale. Below, GRU keep fractions 0.95, 0.50, and 0.05 form complementary mixture strips producing states 0.750, 0.300, and minus 0.150 between candidate minus 0.20 and old state 0.80." />
  <figcaption>On the neutral token transition, the LSTM cell retains $0.98\times0.855=0.8379$ and writes $0.02\times0.10=0.0020$, giving stored cell $c=0.8399$. Changing only the output gate from $0.80$ to $0.10$ shifts the exposed hidden state from about $0.549$ to $0.069$, while all gate bars share a zero-to-one scale. Below, the GRU mixtures follow the keep convention $h=z h_{\mathrm{old}}+(1-z)\widetilde h$ with candidate $-0.20$, where the two segments of each mixture strip sum to one and the reset gate controls how that candidate is formed.</figcaption>
</figure>

### Reset gate placement: Cho et al. versus PyTorch

Here $z$ explicitly denotes the fraction **kept** from the old state, matching both Cho et al. and PyTorch. Because some descriptions use the complementary name for the update weight, checking how each paper defines $z$ avoids sign flips. In Cho et al.'s candidate, the recurrent block $U_h$ scales the reset-masked prior state as $U_h(r_t\odot h_{t-1})$ before the linear map.[^cho2014] <span data-glossary="pytorch">PyTorch</span>'s `nn.GRU` applies the reset gate after the linear transformation instead:[^pytorch2026gru]

$$
\tilde{h}_t = \tanh\left(W_{in} x_t + b_{in} + r_t \odot (W_{hn} h_{t-1} + b_{hn})\right)
$$

PyTorch makes this change so recurrent matrix projections can fuse before applying the reset gate. Because matrix multiplication and coordinate-wise scaling do not commute ($U_h(r\odot h) \ne r\odot(U_hh)$) for non-diagonal weights, the two conventions yield different candidate vectors:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="gru-reset-placement.py"
import numpy as np

old = np.array([0.8, -0.2])
reset = np.array([0.1, 0.9])
recurrent = np.array([[1.0, 2.0], [3.0, 4.0]])

before = recurrent @ (reset * old)
after = reset * (recurrent @ old)
print("reset before matrix:", np.round(before, 3))
print("reset after matrix: ", np.round(after, 3))
print("candidate before:   ", np.round(np.tanh(before), 3))
print("candidate after:    ", np.round(np.tanh(after), 3))
assert not np.allclose(before, after)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
reset before matrix: [-0.28 -0.48]
reset after matrix:  [0.04 1.44]
candidate before:    [-0.273 -0.446]
candidate after:     [0.04  0.894]
```
<!-- leetllm: output:end -->

The two candidate implementations diverge sharply (`-0.273` versus `0.040`). Mixing coordinates before or after scaling with $r_t$ yields completely different directions once $U_h$ couples features across dimensions. Always verify the exact reset formula before porting GRU weights between frameworks.

## Parameter auditing and tensor geometry

Every gate and candidate block in a recurrent cell outputs $d_h$ values from $[h_{t-1}, x_t]$ of width $d_h + d_x$:

| Cell | Affine blocks | General parameter formula | Our example ($d_x=3, d_h=2$) |
|---|---:|---|---:|
| Vanilla RNN | 1 ($h$) | $d_h(d_x + d_h) + d_h$ | $2(3 + 2) + 2 = 12$ |
| GRU | 3 ($z$, $r$, candidate) | $3 \left[d_h(d_x + d_h) + d_h\right]$ | $3 \times 12 = 36$ |
| LSTM | 4 ($f$, $i$, candidate, $o$) | $4 \left[d_h(d_x + d_h) + d_h\right]$ | $4 \times 12 = 48$ |

With equal hidden width, a GRU uses three-quarters as many parameters as an LSTM. Why does PyTorch's `nn.GRU(3, 2)` report **42** parameters instead of **36**? PyTorch keeps two biases per block ($b_{in}$ and $b_{hn}$), adding $3 d_h = 6$ parameters (and in the candidate block, $b_{hn}$ sits inside the reset gate multiplication, so it cannot fold into $b_{in}$):[^pytorch2026gru]

$$
\text{PyTorch GRU parameters} = 3 \times \left[ d_h(d_x + d_h) + 2d_h \right] = 3 \times (10 + 4) = 42
$$

A unidirectional 1-layer `nn.GRU(3, 2, batch_first=True)` maps `(B, T, 3)` to per-step outputs `(B, T, 2)` and final hidden state `(1, B, 2)`, where the first axis is `num_layers * num_directions`.

```checkpoint
Why can the textbook parameter formula and framework parameter count differ for the same GRU?
---
Our textbook formula counts one bias per block. PyTorch stores input-hidden and hidden-hidden biases for each block, adding $d_h$ parameters per block. In the candidate, the hidden-hidden bias sits inside the reset multiplication, so equivalent dynamics require matching both bias placement and reset placement.
```

## Sequence padding and batch masking

When sequences in a batch have different lengths, frameworks pad shorter items (often with zeros) into a rectangular <span data-glossary="tensor">tensor</span>. Running an unmasked RNN over those filler slots still executes another state update:

$$
h_t = \tanh(W_{hh} h_{t-1} + W_{xh} \mathbf{0} + b_h) = \tanh(W_{hh} h_{t-1} + b_h)
$$

> **Common mistake:** Assuming zero-padded rows leave the RNN hidden state untouched. Even an all-zero input vector still multiplies $h_{t-1}$ by $W_{hh}$ and adds $b_h$, shifting the final state away from the last real token.

Watch both zero and nonzero filler rows perturb our vector RNN state in NumPy:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="padding-is-another-update.py"
import numpy as np

W_xh = np.array([
    [0.8, 0.2, 0.1],
    [0.1, 0.7, 0.4],
])
W_hh = np.array([
    [0.5, 0.1],
    [0.0, 0.6],
])

def run(tokens):
    state = np.zeros(2)
    for token in tokens:
        state = np.tanh(W_xh @ token + W_hh @ state)
    return [round(float(v), 3) for v in state]

two_tokens = [np.array([1.0, 0.0, 0.0]), np.array([0.0, 1.0, 0.0])]
print("two real tokens:      ", run(two_tokens))
print("plus a zero pad row:  ", run(two_tokens + [np.zeros(3)]))
print("plus a junk pad row:  ", run(two_tokens + [np.array([9.0, -9.0, 9.0])]))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
two real tokens:       [0.494, 0.641]
plus a zero pad row:   [0.302, 0.367]
plus a junk pad row:   [1.0, -0.889]
```
<!-- leetllm: output:end -->

The hidden state shifts from `[0.494, 0.641]` to `[0.302, 0.367]` on a zero row, and jumps to `[1.0, -0.889]` on arbitrary pad values. That drift corrupts the representation long after the true phrase ended. Any downstream classifier reading that final hidden vector ends up scoring filler slots instead of real tokens.

<figure>
  <img src="illustrations/_generated/padding_state_boundary_dark.png" alt="After two real tokens, the vector RNN state is [0.494, 0.641]. Applying a valid length of two stops before the third slot and retains that state. Processing a zero row instead shifts the state to [0.302, 0.367], while processing [9, -9, 9] shifts it to [1.000, -0.889]. Each branch starts from the same two-token state using the chapter weight matrices." />
  <figcaption>Each branch begins from the same two-token vector-RNN state $[0.494,0.641]$. Stopping at the valid length retains that state untouched, whereas continuing into a zero pad row yields $[0.302,0.367]$ and continuing into $[9,-9,9]$ yields $[1.000,-0.889]$ in full precision. The packed-GRU check below verifies the same masking rule on a separate recurrent module.</figcaption>
</figure>

PyTorch's `pack_padded_sequence` packages valid right-padded prefixes and per-step batch counts so the recurrent layer skips padded positions on CPU or GPU.[^pytorch2026packpaddedsequence] When calling it, pass a CPU tensor of positive lengths (`enforce_sorted=False` sorts internally) so every sequence stops at its true end. Compare packed and unpacked final states when filler rows vary:

<!-- leetllm: test, deps=torch, output=show -->
```python title="packed-gru-ignores-padding.py"
import torch
from torch import nn
from torch.nn.utils.rnn import pack_padded_sequence

torch.manual_seed(7)
gru = nn.GRU(input_size=3, hidden_size=2, batch_first=True)
lengths = torch.tensor([3, 2])
base = torch.tensor([
    [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]],
    [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 0.0]],
])
changed_padding = base.clone()
changed_padding[1, 2] = torch.tensor([9.0, -9.0, 9.0])

def packed_final(batch):
    packed = pack_padded_sequence(
        batch, lengths.cpu(), batch_first=True, enforce_sorted=False
    )
    _, hidden = gru(packed)
    return hidden[-1]

def unpacked_final(batch):
    _, hidden = gru(batch)
    return hidden[-1]

packed_changed = not torch.allclose(packed_final(base), packed_final(changed_padding))
unpacked_changed = not torch.allclose(unpacked_final(base), unpacked_final(changed_padding))

print("batch shape:", tuple(base.shape))
print("packed final shape:", tuple(packed_final(base).shape))
print("packed state changed by padding:", packed_changed)
print("unpacked state changed by padding:", unpacked_changed)
output, hidden = gru(base)
parameter_count = sum(parameter.numel() for parameter in gru.parameters())
print("unpacked output shape:", tuple(output.shape))
print("unpacked hidden shape:", tuple(hidden.shape))
print("GRU parameters:", parameter_count)
assert not packed_changed and unpacked_changed
assert parameter_count == 42
assert output.shape == (2, 3, 2) and hidden.shape == (1, 2, 2)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
batch shape: (2, 3, 3)
packed final shape: (2, 2)
packed state changed by padding: False
unpacked state changed by padding: True
unpacked output shape: (2, 3, 2)
unpacked hidden shape: (1, 2, 2)
GRU parameters: 42
```
<!-- leetllm: output:end -->

Packing stops the second sequence cleanly at $t=2$, leaving its final representation identical regardless of what values sit in the padded third slot.

```checkpoint
Why can padding corrupt a final-state classifier even if every padded row uses zeros?
---
Without masking or packing, the recurrent cell processes each zero row as another input token. Because the recurrent transition and bias still update $h_t$ unless the prior vector already sits at a fixed point, the final hidden vector drifts away from the end of the real sequence.
```

## Sequence compression and the encoder-decoder bottleneck

The vector RNN we built is an **encoder** that maps a variable-length sequence of tokens into a single fixed-width hidden vector $h_T$. In 2014, Cho et al.[^cho2014] and Sutskever et al.[^sutskever2014] paired recurrent encoders with recurrent decoders for sequence-to-sequence translation, differing mainly in whether the decoder reads the fixed context throughout decoding or receives it once as an initial state. Both designs force the entire source sequence through one fixed-width summary vector:

| Prefix consumed | Final context vector | Width |
|---|---|---:|
| `slow` | `[0.664, 0.100]` | 2 |
| `slow, yet` | `[0.494, 0.641]` | 2 |
| `slow, yet, engaging` | `[0.390, 0.655]` | 2 |

Three short words already share a two-number bottleneck. A hundred-word paragraph must still compress every entity, clause cue, and syntactic link into that same final vector because the decoder cannot inspect earlier hidden states directly. Even before hitting capacity limits, the recurrent cell also faces a runtime constraint because step $t$ cannot execute until step $t-1$ finishes.

## The sequential bottleneck, and how attention changes it

Because every nonlinear recurrent step $s_t = f(s_{t-1}, x_t)$ waits for $s_{t-1}$ to finish, a 4,096-token sequence runs 4,096 serial steps along the time axis, leaving modern GPU matrix units underutilized at small batch sizes.[^nvidiaCuDNNRNN2026]

### Self-attention breaks the serial chain

A Transformer replaces serial recurrence with **<span data-glossary="self-attention">self-attention</span>**, projecting all known tokens in parallel ($Q = X W_Q, K = X W_K, V = X W_V$) and routing directly between any two allowed positions in one layer:[^vaswani2017]

$$
\operatorname{Attention}(Q, K, V) = \operatorname{softmax}\left(\frac{QK^{\mathsf{T}}}{\sqrt{d_k}}+M\right) V
$$

With a causal mask ($M_{ij} = -\infty$ for $j > i$), position 4,096 reads position 1 in a single layer instead of crossing 4,095 recurrent steps (and positional encodings supply word order since attention itself is permutation-symmetric). During autoregressive decoding, generating new tokens one by one remains serial in both architectures.

| Property | Recurrent layer (RNN / LSTM / GRU) | Self-attention layer (Transformer) |
|---|---|---|
| Sequential ops during training | $O(T)$ serial steps | $O(1)$ parallel across tokens |
| Path length between distant tokens | $O(T)$ transitions | $O(1)$ direct dot product |
| Compute (width $d$) | $O(Td^2)$ | $O(T^2d + Td^2)$ |
| Carried state | Fixed-width $h_t$ (and $c_t$) | Explicit KV cache of all allowed positions |

FlashAttention tiles self-attention in GPU SRAM to avoid materializing the $T \times T$ score matrix in HBM,[^dao2022] while structured state-space models such as Mamba recover parallel training via input-dependent linear associative scans while keeping constant inference state per token.[^gu2023]

## Diagnosing recurrent failure modes

Three subtle bugs show up directly in the numbers from this lesson: forgetting to reset hidden state between independent sequences, assuming the LSTM output gate alters the stored cell, and testing GRU compatibility on diagonal weights. Check each one below:

```checkpoint
In the scalar RNN, start a second, independent review containing only token 0.4. What happens if you mistakenly reuse the first sequence's final state instead of resetting to zero?
---
Resetting gives `tanh(0.8 * 0.4) ≈ 0.310`. Reusing the previous final state (about `0.764`) gives `tanh(0.32 + 0.5 * 0.764) ≈ 0.606`. Detachment preserves numeric values across the chunk split, so each independent sequence must reset to its intended initial state (zero here, or a learned initial vector) to prevent cross-sequence contamination.
```

```checkpoint
In the LSTM step for `"midway"`, change only the output gate from 0.80 to 0.10. Which state changes, and which stays fixed at this step?
---
The cell state remains exactly `0.8399` because its additive update depends only on the forget gate, input gate, and candidate state. The exposed working state drops to `0.10 * tanh(0.8399) ≈ 0.069`. Future cell updates may shift downstream because future gates read $h_t$, yet the current cell update is decoupled from the output gate.
```

```checkpoint
In the reset-placement example, replace the recurrent matrix with the 2-by-2 identity matrix. Why do both candidates now agree, and why is that a weak test of GRU compatibility?
---
Both paths reduce to `reset * old` because the identity matrix does not mix coordinates across dimensions and there are no biases. A diagonal matrix always commutes with coordinate-wise scaling, so compatibility checks need a non-diagonal recurrent matrix that mixes coordinates.
```

When debugging training runs, monitor gradient norms alongside loss curves because forward loss can fall while early-step gradients vanish completely. Sequence order shifts final states, repeated factors below one decay over long spans, and gated additive memory preserves features across steps that repeated $\tanh$ projections would otherwise compress.


```mastery-quiz
[
  {
    "question": "A scalar recurrence starts at zero and applies `s = 0.5*s + x`. Compare input sequences `[0.8, 0.2, 0.5]` and `[0.5, 0.2, 0.8]` under that shared update rule. Which final-state pair results?",
    "options": [
      "Original `1.025`, reversed `0.800`.",
      "Original `1.500`, reversed `1.500`.",
      "Original `0.800`, reversed `1.025`.",
      "Original `0.500`, reversed `0.800`."
    ],
    "answer": "Original `0.800`, reversed `1.025`.",
    "explanation": "Original gives `0.5*(0.5*0.8+0.2)+0.5=0.8`, whereas reversing gives `0.5*(0.5*0.5+0.2)+0.8=1.025`. Shared weights discount earlier tokens more strongly, while an order-insensitive sum would produce 1.5 in both cases."
  },
  {
    "question": "A tanh RNN starts a step with hidden state `[0.2, -0.4]`. The recurrent matrix has rows `[0.5, 0.1]` and `[0, 0.6]`, and the current token embedding contributes `[0.3, 0.1]`. The sentiment classifier head has rows `[0.7, -0.3]` for negative, `[-0.4, 0.8]` for positive, and `[0.1, 0.2]` for neutral, with zero biases. What are the three logits after the update, in that order, rounded to three decimal places?",
    "options": [
      "`[0.283, -0.249, 0.007]`",
      "`[0.294, -0.256, 0.008]`",
      "`[0.200, -0.027, 0.062]`",
      "`[0.260, -0.400, -0.060]`"
    ],
    "answer": "`[0.283, -0.249, 0.007]`",
    "explanation": "The recurrent rows give `0.5 × 0.2 + 0.1 × (-0.4) = 0.06` and `0.6 × (-0.4) = -0.24`, and adding the input gives `[0.36, -0.14]`. Applying tanh to each coordinate produces `[0.345214, -0.139092]`, whose dot products with the classifier head yield `0.7 × 0.345214 - 0.3 × (-0.139092) ≈ 0.283` for negative, `-0.249` for positive, and `0.007` for neutral. The `0.294` vector skips tanh, the `0.200` vector drops the minus sign on the second coordinate, and `0.260` uses the prior state."
  },
  {
    "question": "A gradient travels backward across ten recurrent links, each with local derivative `0.7`. Separately, norm clipping reduces a gradient vector's norm from 10 to 2. Which pair gives the surviving path factor (rounded to five decimal places) and the clipping multiplier, in that order?",
    "options": [
      "`(0.04035, 0.2)`",
      "`(0.02825, 0.8)`",
      "`(0.04035, 0.8)`",
      "`(0.02825, 0.2)`"
    ],
    "answer": "`(0.02825, 0.2)`",
    "explanation": "Each link passes 70% of the gradient it receives, so ten links leave `0.7^10 ≈ 0.02825` while nine links leave `0.04035`. Clipping rescales the separate vector by `2/10 = 0.2` to preserve direction, whereas `0.8` is the removed fraction and leaves the recurrent decay unchanged."
  },
  {
    "question": "In an LSTM coordinate, the old cell is `0.60`, forget gate `0.90`, input gate `0.25`, candidate `-0.40`, and output gate `0.70`. Which stored cell and exposed hidden value result?",
    "options": [
      "Cell approximately `0.5400`, hidden approximately `0.3451`.",
      "Cell approximately `0.4400`, hidden approximately `0.2896`.",
      "Cell approximately `0.4400`, hidden approximately `0.4400`.",
      "Cell approximately `0.4136`, hidden approximately `0.2741`."
    ],
    "answer": "Cell approximately `0.4400`, hidden approximately `0.2896`.",
    "explanation": "The additive cell is `0.90*0.60 + 0.25*(-0.40) = 0.44`, and the exposed hidden coordinate is `0.70*tanh(0.44) ≈ 0.289551`. Retention, candidate writing, and exposure act on separate paths."
  },
  {
    "question": "Holding the other state inputs and gates fixed, a single LSTM cell coordinate passes through forget gates `0.90`, `0.80`, then `0.95`. What is this three-step direct cell-path derivative?",
    "options": [
      "`0.684`, the product of the three forget gates.",
      "`0.883`, the mean of the three forget gates.",
      "`0.001`, the product of their complements.",
      "`2.650`, the sum of the three forget gates."
    ],
    "answer": "`0.684`, the product of the three forget gates.",
    "explanation": "The local fixed-gate Jacobian is diagonal with forget-gate entries, so the direct contribution along this coordinate is `0.90*0.80*0.95 = 0.684`, while the complete gradient also includes paths through hidden states, gates, candidates, and readouts."
  },
  {
    "question": "A GRU uses the keep convention `h = z*old + (1-z)*candidate`. Old is `-0.60`, candidate is `0.40`, and z is `0.70`. What new hidden coordinate results?",
    "options": [
      "`0.100`",
      "`-0.420`",
      "`-0.300`",
      "`-0.200`"
    ],
    "answer": "`-0.300`",
    "explanation": "The gate keeps `0.70 × (-0.60) = -0.42` from the old state and adds `0.30 × 0.40 = 0.12` from the candidate, giving `-0.300`. Swapping the weights gives `0.100`, dropping the candidate gives `-0.420`, and summing unweighted values gives `-0.200`."
  },
  {
    "question": "A batch-first one-layer GRU processes two sequences with valid lengths `[4, 1]` inside a tensor of four slots each, right padded. Which execution choice keeps the shorter sequence's final hidden state invariant when its three filler rows change?",
    "options": [
      "Sort by decreasing length, then use each unpacked final hidden state after all four updates.",
      "Pack the CPU lengths with `enforce_sorted=False`, then use each returned final hidden state.",
      "Detach the shorter sequence after its first update, then process the remaining three rows.",
      "Run all four updates, then zero only the output vectors at the padded positions."
    ],
    "answer": "Pack the CPU lengths with `enforce_sorted=False`, then use each returned final hidden state.",
    "explanation": "Packing the valid right-padded prefixes stops the shorter sequence before the filler rows. Sorting alone alters no updates, detachment cuts gradients rather than forward arithmetic, and zeroing padded outputs afterward leaves an already altered final hidden state intact unless an explicit state mask skips those updates."
  },
  {
    "question": "A quantized encoder context has three coordinates storing two bits each, and a decoder receives only that context. Across 65 distinct source sequences, what does the finite context capacity force?",
    "options": [
      "There are 8 distinct contexts, so at least two sequences must share one context.",
      "There are 65 distinct contexts, so every source sequence can receive a different context.",
      "There are 128 distinct contexts, so the context is guaranteed to preserve all sequences.",
      "There are 64 distinct contexts, so at least two sequences must share one context."
    ],
    "answer": "There are 64 distinct contexts, so at least two sequences must share one context.",
    "explanation": "Three two-bit coordinates store six bits, giving `2^6 = 64` distinct representations. Mapping 65 distinct source sequences into 64 states guarantees a collision under that binary capacity ceiling."
  },
  {
    "question": "A one-layer unidirectional PyTorch GRU has input width 4, hidden width 3, and biases enabled. Given batch-first input shape `(5, 6, 4)`, which output shape, final hidden shape, and parameter count match this module?",
    "options": [
      "Output `(5, 6, 3)`, final hidden `(1, 5, 3)`, 72 parameters.",
      "Output `(6, 5, 3)`, final hidden `(1, 5, 3)`, 81 parameters.",
      "Output `(5, 6, 3)`, final hidden `(1, 5, 3)`, 81 parameters.",
      "Output `(5, 6, 3)`, final hidden `(1, 6, 3)`, 72 parameters."
    ],
    "answer": "Output `(5, 6, 3)`, final hidden `(1, 5, 3)`, 81 parameters.",
    "explanation": "Three gate blocks contribute `3*(3*4 + 3*3 + 2*3) = 81` parameters: 36 input weights, 27 recurrent weights, and 18 biases. Batch-first output keeps `(batch, time, hidden)`, while the final hidden state stays `(layers * directions, batch, hidden)`, giving `(1, 5, 3)`."
  },
  {
    "question": "Six tokens are already available. Compare the shortest path from position 1 to position 6 in a standard RNN and in full causal self-attention. How many recurrent transitions and attention layers do the two paths take, how many query-key pairs does one causal head allow including the diagonal, and how many successive sampling steps does ordinary autoregressive decoding take to generate two more tokens?",
    "options": [
      "5 recurrent transitions, 1 attention layer, 21 pairs, 2 sampling steps",
      "1 recurrent transition, 5 attention layers, 21 pairs, 1 sampling step",
      "5 recurrent transitions, 1 attention layer, 36 pairs, 1 sampling step",
      "1 recurrent transition, 5 attention layers, 36 pairs, 2 sampling steps"
    ],
    "answer": "5 recurrent transitions, 1 attention layer, 21 pairs, 2 sampling steps",
    "explanation": "Position 1 crosses five recurrent links to reach position 6, whereas query 6 can read position 1 directly in a single attention layer. Query 1 sees one key, query 2 sees two, and so on up to query 6, giving `1 + 2 + 3 + 4 + 5 + 6 = 21` allowed pairs rather than all `6 × 6 = 36` entries. During autoregressive decoding, the model must sample token 7 before conditioning on it to sample token 8."
  }
]
```

> **Next:** Continue to [Autoencoders and VAEs](/learn/autoencoders-vaes-generative-modeling-basics). A recurrent encoder compressed an ordered token sequence into a two-number state. Next you'll train encoders and decoders around a learned representation bottleneck, using it for reconstruction and sampling.
