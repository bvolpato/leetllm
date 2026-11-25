---
{
  "id": "rnns-lstms-grus-sequence-modeling",
  "title": "RNNs, LSTMs, GRUs, and Sequence Modeling",
  "slug": "rnns-lstms-grus-sequence-modeling",
  "section": "Deep Learning Foundations",
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
    "Backpropagation through time",
    "Vanishing and exploding gradients",
    "LSTM cell state and gates",
    "GRU update and reset gates",
    "Sequence padding and masking",
    "Encoder-decoder sequence compression",
    "Self-attention path length"
  ]
}
---

A sentiment classifier reads a review phrase token by token: `slow`, then `yet`, then `engaging`. Reverse it to `engaging`, `yet`, `slow`, and the meaning flips from a slow start redeemed by praise to a bright opening dragged down at the end. Word order carries meaning, so how does one neural network preserve order across phrases of any length?

We will keep the three-class <span data-glossary="logits">logits</span> and <span data-glossary="softmax">softmax</span> head from the [previous lesson](/learn/softmax-cross-entropy-optimization) (`negative`, `positive`, `neutral`), and build the recurrent backbone that folds a variable-length token stream into the single fixed-size vector that head expects.

## Order is part of the input

A bag-of-words sum returns `2.3` for both permutations of `{"slow": 1.0, "yet": 0.4, "engaging": 0.9}` because addition commutes. An order-aware recurrence folds the previous state into each step: $s_t = 0.6\,s_{t-1} + x_t$ starting from $s_0 = 0$. Reading `slow`, `yet`, `engaging` gives `0.6 * (0.6 * 1.0 + 0.4) + 0.9 = 1.500`, whereas reversing places `1.0` last and yields `0.6 * (0.6 * 0.9 + 0.4) + 1.0 = 1.564`. Recurrence makes token order inseparable from the final state.

## One cell, reused at every step

A **<span data-glossary="recurrent-neural-network">recurrent neural network</span> (RNN)** makes that state update trainable. Its **hidden state** $h_t \in \mathbb{R}^{d_h}$ is a running <span data-glossary="vector">vector</span> carried across tokens by one shared **recurrent cell**:

$$
h_t = \tanh(W_{xh}x_t + W_{hh}h_{t-1} + b_h)
$$

Here $x_t \in \mathbb{R}^{d_x}$ is the token input, $W_{xh} \in \mathbb{R}^{d_h \times d_x}$ and $W_{hh} \in \mathbb{R}^{d_h \times d_h}$ are shared weight <span data-glossary="matrix">matrices</span>, $b_h$ is a bias, and **<span data-glossary="tanh">hyperbolic tangent (tanh)</span>** squashes coordinates into $(-1, 1)$. Reusing the same matrices at every step keeps parameter count independent of sequence length.[^pascanu2013]

## Trace a vector RNN

Encode our three words as one-hot vectors (`slow = [1, 0, 0]`, `yet = [0, 1, 0]`, `engaging = [0, 0, 1]`) with $d_h = 2$, $h_0 = [0, 0]^T$, and zero bias. On step 1, $W_{xh} x_1$ selects column 1 (`[0.8, 0.1]`), giving $h_1 = [\tanh(0.8), \tanh(0.1)]^T \approx [0.664, 0.100]^T$. Run all three steps and score $h_3$ through the three-class head:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="vector-rnn-and-head.py"
import numpy as np

W_xh = np.array([[0.8, 0.2, 0.1], [0.1, 0.7, 0.4]])
W_hh = np.array([[0.5, 0.1], [0.0, 0.6]])
h = np.zeros(2)
for step, x in enumerate(np.eye(3), start=1):
    h = np.tanh(W_xh @ x + W_hh @ h)
    print(f"h_{step} = {[round(float(v), 3) for v in h]}")

W_out = np.array([[0.7, -0.3], [-0.4, 0.8], [0.1, 0.2]])
logits = W_out @ h.round(3)
probs = np.exp(logits - logits.max())
probs /= probs.sum()
labels = ["negative", "positive", "neutral"]
print("logits:", [round(float(v), 3) for v in logits], "| probs:", [round(float(v), 3) for v in probs], "| pred:", labels[int(probs.argmax())])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
h_1 = [0.664, 0.1]
h_2 = [0.494, 0.641]
h_3 = [0.39, 0.655]
logits: [0.076, 0.368, 0.17] | probs: [0.291, 0.389, 0.32] | pred: positive
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/unrolled_rnn_dark.png" alt="Shared RNN across slow, yet, engaging reaches h_3 = [0.390, 0.655]. Softmax predicts positive (38.9%), while backward scalar sensitivity drops from 0.333 at step 3 to 0.031 at step 1." />
  <figcaption>One $2\times3$ input matrix and $2\times2$ recurrent matrix advance the state across all three tokens to $h_3\approx[0.390,0.655]$. Softmax assigns 38.9% to `positive`, while the lower-right chart compares backward sensitivity across steps.</figcaption>
</figure>

The head reads only $h_3$, never inspecting earlier tokens directly. That shared chain also shapes training: how does an error at step $T$ send a learning signal back to step 1?

## Backpropagation through time: why a distant signal can fade

**Backpropagation through time (BPTT)** unrolls the cell across steps and applies the chain rule backward to accumulate gradients for $W_{hh}$:[^pascanu2013]

$$
\frac{\partial L}{\partial W_{hh}} = \sum_{t=1}^T \sum_{k=1}^t \frac{\partial L_t}{\partial h_t} \frac{\partial h_t}{\partial h_k} \frac{\partial^+ h_k}{\partial W_{hh}}
$$

Credit assignment across $T - k$ steps multiplies per-step Jacobians $J_j = \operatorname{diag}(1 - h_j^2)W_{hh}$, yielding the spectral bound:[^bengio1994][^pascanu2013]

$$
\left\| \frac{\partial h_T}{\partial h_k} \right\| \le \left( \gamma \, \sigma_{\max}(W_{hh}) \right)^{T-k}
$$

Here $\gamma = \max_j \|\operatorname{diag}(1 - h_j^2)\| \le 1$ comes from `tanh'` and $\sigma_{\max}(W_{hh})$ is the largest singular value of $W_{hh}$. Whenever $\gamma\sigma_{\max}(W_{hh}) < 1$, distant gradients shrink exponentially; above 1, aligned directions can explode instead (actual growth depends on matrix powers, not the norm bound alone).

> **Key insight:** Vanishing gradients stall learning long before float32 underflow. Even though $0.6^{50} \approx 8 \times 10^{-12}$ fits in float32, distant signals are drowned out by near-term gradients.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Four-step sequence guide and exponential backward decay chart over 12 steps: 0.98 keeps 0.785, 0.60 drops to 0.002, and 0.28 vanishes near zero." />
  <figcaption>Constant path factors over 12 steps: $0.98^{12}\approx0.785$, $0.60^{12}\approx0.002177$, and $0.28^{12}\approx2.32\times10^{-7}$. In our 3-step scalar RNN, local derivatives multiply to $\partial h_3/\partial h_0\approx0.019517$.</figcaption>
</figure>

Two standard controls manage BPTT: **truncated BPTT** calls `h = h.detach()` between chunks (preserving forward values while cutting backward credit), and **gradient norm clipping** rescales $g \leftarrow \min(1, c/\|g\|_2)g$ to cap exploding updates without changing direction.[^pascanu2013] Verify all three effects in one script:

<!-- leetllm: test, deps=torch, output=show -->
```python title="bptt-vanishing-and-clipping.py"
import math
import torch


def trace(truncate: bool):
    xs = torch.tensor([1.0, 0.4, 0.9], dtype=torch.float64, requires_grad=True)
    h = torch.zeros((), dtype=torch.float64)
    for step, x in enumerate(xs, start=1):
        h = torch.tanh(0.8 * x + 0.5 * h)
        if truncate and step == 2:
            h = h.detach()
    h.backward()
    return h.item(), [round(g, 6) for g in xs.grad.tolist()]


h_full, g_full = trace(False)
h_cut, g_cut = trace(True)
print(f"h_3={h_full:.6f} | full grads={g_full} | truncated={g_cut}")
print("0.6^k (k=1,4,8,12):", [round(0.6**k, 6) for k in (1, 4, 8, 12)])

rx, ry = 1.4**12, -0.8 * (1.4**12)
norm = math.hypot(rx, ry)
scale = min(1.0, 5.0 / norm)
print(f"clip norm {norm:.3f} -> 5.0: {[round(rx * scale, 3), round(ry * scale, 3)]}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
h_3=0.764316 | full grads=[0.031227, 0.111713, 0.332657] | truncated=[0.0, 0.0, 0.332657]
0.6^k (k=1,4,8,12): [0.6, 0.1296, 0.016796, 0.002177]
clip norm 72.604 -> 5.0: [3.904, -3.123]
```
<!-- leetllm: output:end -->

Even across three tokens, token 1 receives less than a tenth of token 3's gradient (`0.031` vs. `0.333`). Clipping stops explosions, yet cannot rescue vanishing gradients; solving long-range memory requires changing the cell itself.

## LSTM: Additive cell state and gated memory

**<span data-glossary="lstm">Long short-term memory (LSTM)</span>** adds an internal **cell state** $c_t \in \mathbb{R}^{d_h}$ updated by addition alongside the exposed **hidden state** $h_t$, regulated by sigmoid **gates** ($\sigma(\cdot) \in (0, 1)$) acting as learned valves:[^hochreiter1997][^gers2000]

$$
\begin{aligned}
f_t &= \sigma(W_f [h_{t-1}, x_t] + b_f) && \text{(Forget gate: keep vs. discard)} \\
i_t &= \sigma(W_i [h_{t-1}, x_t] + b_i) && \text{(Input gate: how much to write)} \\
\tilde{c}_t &= \tanh(W_c [h_{t-1}, x_t] + b_c) && \text{(Candidate memory)} \\
c_t &= f_t \odot c_{t-1} + i_t \odot \tilde{c}_t && \text{(Additive cell highway)} \\
o_t &= \sigma(W_o [h_{t-1}, x_t] + b_o) && \text{(Output gate: how much to expose)} \\
h_t &= o_t \odot \tanh(c_t) && \text{(Exposed working state)}
\end{aligned}
$$

Holding gates fixed, the direct cell derivative across $T - k$ steps is purely diagonal: $\prod_{j=k+1}^T \operatorname{diag}(f_j)$.

> **Key insight:** Along the LSTM's additive cell highway, gradients multiply by the learned forget gates $\prod f_j$ instead of repeated powers of $W_{hh}$ and `tanh'`. With $f_j = 0.999$ over 100 steps, $0.999^{100} \approx 0.905$, keeping over 90% of the signal intact.[^hochreiter1997][^gers2000]

Notice also that lowering $o_t$ hides a cell coordinate from $h_t$ without erasing $c_t$.

## GRU: Unified hidden state and streamlined gating

The **<span data-glossary="gru">gated recurrent unit (GRU)</span>** merges $c_t$ and $h_t$ into one state and couples keeping and writing through one **update gate** $z_t$ (three affine blocks instead of LSTM's four):[^cho2014]

$$
\begin{aligned}
z_t &= \sigma(W_z [h_{t-1}, x_t] + b_z) && \text{(Update gate: retain vs. overwrite)} \\
r_t &= \sigma(W_r [h_{t-1}, x_t] + b_r) && \text{(Reset gate: history seen by candidate)} \\
\tilde{h}_t &= \tanh(W_h [r_t \odot h_{t-1}, x_t] + b_h) && \text{(Candidate state)} \\
h_t &= z_t \odot h_{t-1} + (1 - z_t) \odot \tilde{h}_t && \text{(Convex blend)}
\end{aligned}
$$

When $z_t \to 1$, the old coordinate copies straight across; when $r_t \to 0$, the candidate ignores history and reads only $x_t$. Trace concrete numbers for both cells:

<!-- leetllm: test, output=show -->
```python title="lstm-and-gru-gates.py"
import math

cell = 0.0
for label, f, i, cand, o in [
    ("slow", 0.00, 0.95, 0.90, 0.80),
    ("midway", 0.98, 0.02, 0.10, 0.80),
    ("engaging", 0.97, 0.15, 0.50, 0.90),
]:
    cell = f * cell + i * cand
    print(f"LSTM {label:<8} c={cell:.4f} h={o * math.tanh(cell):.3f}")

for z in [0.95, 0.50, 0.05]:
    print(f"GRU  z={z:.2f} -> h={z * 0.80 + (1.0 - z) * (-0.20):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
LSTM slow     c=0.8550 h=0.555
LSTM midway   c=0.8399 h=0.549
LSTM engaging c=0.8897 h=0.640
GRU  z=0.95 -> h=0.750
GRU  z=0.50 -> h=0.300
GRU  z=0.05 -> h=-0.150
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/gated_memory_tracks_dark.png" alt="LSTM retains 0.98 * 0.855 + 0.02 * 0.10 = 0.8399 and exposes 0.549 (o=0.80) or 0.069 (o=0.10). GRU keep fractions 0.95, 0.50, 0.05 blend old 0.80 and candidate -0.20 into 0.750, 0.300, -0.150." />
  <figcaption>On the neutral token `midway`, the LSTM cell stores $c=0.8399$; shifting only $o_t$ from $0.80$ to $0.10$ moves $h_t$ from $0.549$ to $0.069$. Below, GRU keep fractions blend $h_{\mathrm{old}}=0.80$ and $\tilde{h}=-0.20$.</figcaption>
</figure>

## Sequence padding and batch masking

Shorter sequences in a batch are right-padded into a rectangular <span data-glossary="tensor">tensor</span>. Running an unmasked RNN over a zero pad row still computes $h_t = \tanh(W_{hh} h_{t-1} + b_h)$, drifting the state away from the last real token.

> **Common mistake:** Assuming zero-padded rows leave hidden states untouched. Every unmasked filler slot executes another recurrent update and corrupts the final vector.

<figure>
  <img src="illustrations/_generated/padding_state_boundary_dark.png" alt="Two-token RNN state [0.494, 0.641] stays unchanged when stopped at length 2, drifts to [0.302, 0.367] on a zero pad row, and jumps to [1.000, -0.889] on [9, -9, 9]." />
  <figcaption>Starting from two-token state $[0.494,0.641]$, stopping at the valid length preserves it, whereas a zero pad row shifts it to $[0.302,0.367]$ and $[9,-9,9]$ shifts it to $[1.000,-0.889]$.</figcaption>
</figure>

In <span data-glossary="pytorch">PyTorch</span>, `pack_padded_sequence` tracks each item's valid length so the recurrent kernel stops at the true end.[^pytorch2026packpaddedsequence] Verify both unmasked drift and packed invariance:

<!-- leetllm: test, deps=torch, output=show -->
```python title="packed-gru-ignores-padding.py"
import numpy as np
import torch
from torch import nn
from torch.nn.utils.rnn import pack_padded_sequence

W_xh = np.array([[0.8, 0.2, 0.1], [0.1, 0.7, 0.4]])
W_hh = np.array([[0.5, 0.1], [0.0, 0.6]])


def run_rnn(seq):
    h = np.zeros(2)
    for x in seq:
        h = np.tanh(W_xh @ x + W_hh @ h)
    return [round(float(v), 3) for v in h]


two = [np.array([1.0, 0.0, 0.0]), np.array([0.0, 1.0, 0.0])]
print("real:", run_rnn(two), "| +zero:", run_rnn(two + [np.zeros(3)]), "| +junk:", run_rnn(two + [np.array([9.0, -9.0, 9.0])]))

torch.manual_seed(7)
gru = nn.GRU(3, 2, batch_first=True)
lengths = torch.tensor([3, 2])
batch = torch.tensor([
    [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]],
    [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 0.0]],
])
junk = batch.clone()
junk[1, 2] = torch.tensor([9.0, -9.0, 9.0])

_, hp_a = gru(pack_padded_sequence(batch, lengths.cpu(), batch_first=True, enforce_sorted=False))
_, hp_b = gru(pack_padded_sequence(junk, lengths.cpu(), batch_first=True, enforce_sorted=False))
_, hu_a = gru(batch)
_, hu_b = gru(junk)
print("packed changed:", not torch.allclose(hp_a, hp_b), "| unpacked changed:", not torch.allclose(hu_a, hu_b))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
real: [0.494, 0.641] | +zero: [0.302, 0.367] | +junk: [1.0, -0.889]
packed changed: False | unpacked changed: True
```
<!-- leetllm: output:end -->

Also reset hidden states to zeros between independent sequences; `detach()` cuts gradients while carrying old values forward.

## From recurrent compression to self-attention

Gated cells solve vanishing gradients, yet recurrence keeps two structural bottlenecks:

1. **Fixed-width compression:** Recurrent encoder-decoder models squeeze an entire source sequence of 3 or 300 words into one fixed-width summary vector $h_T$.[^cho2014][^sutskever2014]
2. **Serial time chain:** Because step $t$ waits for nonlinear step $t - 1$, training a 4,096-token sequence runs 4,096 serial steps, underutilizing GPU matrix units.[^nvidiaCuDNNRNN2026]

Transformers remove both limits with **<span data-glossary="self-attention">self-attention</span>**, projecting all tokens in parallel ($Q = XW_Q, K = XW_K, V = XW_V$) and routing directly between any allowed pair in one layer:[^vaswani2017]

$$
\operatorname{Attention}(Q, K, V) = \operatorname{softmax}\!\left(\frac{QK^{\mathsf{T}}}{\sqrt{d_k}} + M\right) V
$$

With causal mask $M_{ij} = -\infty$ ($j > i$) and positional encodings supplying order, token 4,096 reads token 1 in $O(1)$ hops instead of 4,095 recurrent steps. (Autoregressive decoding still generates one new token at a time in both models.)

| Property | Recurrent (RNN / LSTM / GRU) | Self-attention (Transformer) |
|---|---|---|
| Training serial ops | $O(T)$ steps | $O(1)$ parallel across tokens |
| Distant token path length | $O(T)$ transitions | $O(1)$ direct dot product |
| Compute (width $d$) | $O(Td^2)$ | $O(T^2 d + Td^2)$ |
| Carried state | Fixed-width $h_t$ (and $c_t$) | Growing KV cache of prior tokens |

That compute-versus-state trade-off explains why modern LLMs pair IO-aware FlashAttention[^dao2022] with renewed interest in parallel-scan state-space models such as Mamba that keep constant inference state.[^gu2023]

```mastery-quiz
[
  {
    "question": "A scalar recurrence starts at zero and applies s = 0.5*s + x. What final states result for [0.8, 0.2, 0.5] and its reverse [0.5, 0.2, 0.8]?",
    "options": [
      "Original 1.025, reversed 0.800.",
      "Original 1.500, reversed 1.500.",
      "Original 0.800, reversed 1.025.",
      "Original 0.500, reversed 0.800."
    ],
    "answer": "Original 0.800, reversed 1.025.",
    "explanation": "Original gives 0.5*(0.5*0.8 + 0.2) + 0.5 = 0.800; reversed gives 0.5*(0.5*0.5 + 0.2) + 0.8 = 1.025 because earlier tokens are discounted by 0.5 at each step."
  },
  {
    "question": "A gradient crosses ten recurrent links of derivative 0.7 each. Separately, norm clipping reduces a gradient's norm from 10 to 2. What are the surviving factor and clipping multiplier?",
    "options": [
      "(0.04035, 0.2)",
      "(0.02825, 0.8)",
      "(0.04035, 0.8)",
      "(0.02825, 0.2)"
    ],
    "answer": "(0.02825, 0.2)",
    "explanation": "Ten links leave 0.7^10 = 0.02825. Norm clipping multiplies the vector by 2/10 = 0.2 to cap its norm while preserving direction."
  },
  {
    "question": "In an LSTM coordinate with old cell 0.60, forget gate 0.90, input gate 0.25, candidate -0.40, and output gate 0.70, what are the new cell and exposed hidden values?",
    "options": [
      "Cell 0.5400, hidden 0.3451.",
      "Cell 0.4400, hidden 0.2896.",
      "Cell 0.4400, hidden 0.4400.",
      "Cell 0.4136, hidden 0.2741."
    ],
    "answer": "Cell 0.4400, hidden 0.2896.",
    "explanation": "Cell = 0.90*0.60 + 0.25*(-0.40) = 0.4400, and hidden = 0.70*tanh(0.4400) = 0.2896."
  },
  {
    "question": "A batch-first GRU runs two right-padded sequences of lengths [4, 1] in a 4-slot tensor. Which choice keeps the shorter sequence's final hidden state invariant to filler rows?",
    "options": [
      "Sort by decreasing length, then read unpacked final hidden states.",
      "Pack with pack_padded_sequence using CPU lengths and enforce_sorted=False, then read final hidden states.",
      "Call detach() on the shorter sequence after step 1.",
      "Run all four steps, then zero padded output vectors."
    ],
    "answer": "Pack with pack_padded_sequence using CPU lengths and enforce_sorted=False, then read final hidden states.",
    "explanation": "Packing stops updating the shorter item at length 1. Sorting changes no arithmetic, detach() cuts only gradients, and zeroing outputs leaves the drifted final state corrupted."
  },
  {
    "question": "Six tokens are given. Compare position 1 to position 6 in an RNN versus one causal self-attention layer. How many recurrent transitions, attention layers, and allowed causal pairs occur?",
    "options": [
      "5 recurrent transitions, 1 attention layer, 21 causal pairs.",
      "1 recurrent transition, 5 attention layers, 21 causal pairs.",
      "5 recurrent transitions, 1 attention layer, 36 causal pairs.",
      "1 recurrent transition, 5 attention layers, 36 causal pairs."
    ],
    "answer": "5 recurrent transitions, 1 attention layer, 21 causal pairs.",
    "explanation": "An RNN takes 5 transitions from token 1 to token 6, whereas causal self-attention connects them in 1 layer using 1 + 2 + 3 + 4 + 5 + 6 = 21 causal pairs."
  }
]
```

> **Next:** Continue to [Autoencoders and VAEs](/learn/autoencoders-vaes-generative-modeling-basics).
