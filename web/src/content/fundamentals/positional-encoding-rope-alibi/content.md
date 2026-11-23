---
{
  "id": "positional-encoding-rope-alibi",
  "title": "Positional Encoding: RoPE & ALiBi",
  "slug": "positional-encoding-rope-alibi",
  "section": "Transformer Deep Dives",
  "category": "Transformer Architecture",
  "difficulty": "Hard",
  "order": 5,
  "prerequisites": [
    "vision-transformers-image-encoders"
  ],
  "coverImage": "social_banner.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Anthropic",
    "DeepMind",
    "NVIDIA"
  ],
  "shortDescription": "Unmasked attention follows tokens when they move. Sinusoids, RoPE, and ALiBi put order back in different places, and a longer formula still needs a retrieval test.",
  "keyConceptsTested": [
    "Permutation Equivariance",
    "Sinusoidal Positional Encoding",
    "Learned Embeddings",
    "Rotary Position Embeddings (RoPE)",
    "ALiBi",
    "Long-Context Extrapolation",
    "Position Interpolation",
    "NTK-Aware Scaling",
    "YaRN",
    "Attention Bias"
  ]
}
---

"The model loaded the checkpoint" and "The checkpoint loaded the model" share the exact same words, but reverse who loaded what. Content-only, unmasked self-attention follows each word wherever it moves; it has no slot index that marks the subject as preceding the object.

<span data-glossary="vision-transformer">Vision transformers</span> expose that gap with image patches. Text models face the same gap. <span data-glossary="self-attention">Self-attention</span> compares content, not sequence position. If the <span data-glossary="token">token</span> rows for "model", "loaded", and "ckpt" trade places, should the output stay in the original order, or move with the rows?

A <span data-glossary="positional-encoding">position signal</span> is what can break that symmetry inside a <span data-glossary="transformer">transformer</span>. It may be an additive vector in the <span data-glossary="embedding">embeddings</span>, a <span data-glossary="rope">RoPE</span> rotation of queries and keys, or <span data-glossary="alibi">ALiBi</span>'s linear distance bias on the attention <span data-glossary="logits">logits</span>. Without one of those signals, reordering the input sequence produces an exact row-reordered output. Evaluating long-range capability also separates mathematical validity from learned behavior: RoPE arithmetic produces values at position 32,000 even after 4,096-token pretraining, yet passkey retrieval at that length still requires adaptation and empirical testing. Meanwhile, one structural rule always stays fixed: a position method ranks permitted keys, whereas a causal mask must still block future keys regardless of how indices transform.

---

## First, watch attention lose the order

Consider what happens when every token vector stays fixed while the sequence rows change order inside an unmasked attention block. Standard self-attention computes dot products between queries and keys solely from token contents, without attaching a slot number to any row. For an input sequence of $N$ tokens represented as matrix $X \in \mathbb{R}^{N \times d_{\text{model}}}$, linear projection matrices $W_Q, W_K \in \mathbb{R}^{d_{\text{model}} \times d_k}$ and $W_V \in \mathbb{R}^{d_{\text{model}} \times d_v}$ produce $Q = X W_Q$, $K = X W_K$, and $V = X W_V$. Dividing $Q K^T$ by $\sqrt{d_k}$ keeps score variance controlled before row-wise <span data-glossary="softmax">softmax</span> turns scores into weight matrix $A$ and mixes values into output $Y = A V \in \mathbb{R}^{N \times d_v}$, with no term anywhere reading "first", "second", or "third."[^vaswani2017]

$$
\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right) V
$$

Now permute those input rows using an arbitrary $N \times N$ permutation matrix $P$, forming $X' = P X$. Because right-multiplying by learned projection weights commutes with left-multiplying by a row permutation, queries, keys, and values all reorder cleanly ($Q' = P Q$, $K' = P K$, $V' = P V$). Propagating $(P K)^T = K^T P^T$ through the scaled score product conjugate-permutes the attention logit matrix on both rows and columns:

$$
Q' = (P X) W_Q = P Q, \quad K' = (P X) W_K = P K, \quad V' = (P X) W_V = P V
$$

$$
S' = \frac{Q' (K')^T}{\sqrt{d_k}} = \frac{(P Q)(P K)^T}{\sqrt{d_k}} = P \left(\frac{Q K^T}{\sqrt{d_k}}\right) P^T = P S P^T
$$

Next, row-wise softmax normalizes each query row across all keys independently, so simultaneous row and column permutations pass straight through to give $A' = P A P^T$. Multiplying those permuted weights by $V' = P V$ places the inner factor $P^T P$ directly between $A$ and $V$. Since every permutation matrix is orthogonal ($P^T P = I$), the interior permutations cancel identically to return $Y' = P Y$:

$$
A' = \text{softmax}(P S P^T) = P \text{softmax}(S) P^T = P A P^T
$$

$$
Y' = A' V' = (P A P^T)(P V) = P A (P^T P) V = P A I V = P (A V) = P Y
$$

That equality, $\text{Attention}(P X) = P \text{Attention}(X)$, defines **permutation equivariance** for deterministic, unmasked self-attention. Shuffling input rows shuffles output rows by the exact same index map; token-wise projections, residual connections, and normalization layers preserve this behavior, while dropout masks would also need matching permutation for strict numerical equality. Take a three-token slice of our running example with 2D coordinates `[1, 0]` for "model", `[0, 1]` for "loaded", and `[1, 1]` for "ckpt" (`P = [2, 0, 1]` reorders the sequence into ckpt, model, loaded):

| Token | Vector |
|-------|--------|
| model | $[1, 0]$ |
| loaded | $[0, 1]$ |
| ckpt | $[1, 1]$ |

<figure>
  <img src="illustrations/_generated/position_blind_attention_dark.png" alt="Two attention traces compare token order before and after permutation P=[2,0,1]. Token rows and attention-weight matrices reorder together, producing Y' = P Y and showing permutation equivariance without a position signal." />
  <figcaption>Unmasked self-attention is content-based. The weight matrix reorders with the tokens. Position encodings supply the missing index, direction, and distance signal.</figcaption>
</figure>

The small check below recomputes unmasked attention after shuffling the token rows into `ckpt, model, loaded`. Reading `True` confirms numerically that output coordinates reorder identically with the tokens, proving no hidden position counter entered the calculation:

<!-- leetllm: test, output=show -->
```python title="permutation-equivariance.py"
import math

tokens = {
    "model": [1.0, 0.0],
    "loaded": [0.0, 1.0],
    "ckpt": [1.0, 1.0],
}
order = ["model", "loaded", "ckpt"]
permutation = [2, 0, 1]

def attention(rows: list[list[float]]) -> list[list[float]]:
    scores = [
        [sum(q_i * k_i for q_i, k_i in zip(q, k)) / math.sqrt(2) for k in rows]
        for q in rows
    ]
    outputs = []
    for row in scores:
        maximum = max(row)
        exponentials = [math.exp(value - maximum) for value in row]
        normalizer = sum(exponentials)
        weights = [value / normalizer for value in exponentials]
        outputs.append([
            sum(weight * value[column] for weight, value in zip(weights, rows))
            for column in range(2)
        ])
    return outputs

baseline = attention([tokens[name] for name in order])
shuffled = attention([tokens[order[index]] for index in permutation])
expected = [baseline[index] for index in permutation]

same_output_up_to_permutation = all(
    abs(actual - target) < 1e-12
    for actual_row, target_row in zip(shuffled, expected)
    for actual, target in zip(actual_row, target_row)
)
print(same_output_up_to_permutation)
print([round(row[0], 3) for row in baseline])
print([round(row[0], 3) for row in shuffled])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
True
[0.802, 0.599, 0.752]
[0.752, 0.802, 0.599]
```
<!-- leetllm: output:end -->

A <span data-glossary="causal-mask">causal mask</span> changes the symmetry by removing future keys from view. In a decoder, token $i$ sees keys $j \le i$, including itself. If token rows move while that triangular mask stays fixed, the score calculation generally changes. Permuting the mask along with the rows would preserve equivariance, but would represent a different visibility pattern.

Haviv et al. trained NoPos causal language models and found competitive perplexity in their tested 125M-to-1.3B settings. Probes recovered approximate absolute positions; counting visible predecessors is their proposed explanation, and softmax itself has no explicit position counter.[^haviv2022] Identical value rows illustrate the limit: their weighted average stays identical even when one query sees more rows. The causal mask supplies a position signal through visible predecessors; whether a model learns useful positions depends on its objective, data, and architecture.

**Parallel prefill retains the decoder's causal mask.** The model computes many query rows at once, and each query still sees only earlier positions. A BERT-style masked-language-model objective uses a different visibility pattern: masking input words alone leaves attention bidirectional unless the mask applies triangular visibility. Without any position or order-dependent signal, an unmasked block stays permutation equivariant and can still learn content relationships. Haviv et al.'s bidirectional NoPos language-model experiment degraded sharply in its tested setup; evaluate other permutation-equivariant tasks on their own evidence.

```checkpoint
You compute all decoder query rows in one prefill call. May the query at position 2 see the key at position 3?
---
No. Parallel computation changes scheduling, not causal visibility. Keep the future key masked. Removing that mask changes the model and leaks later prompt tokens into earlier representations.
```

Absolute encodings, RoPE, and ALiBi inject position at three distinct stages inside the Transformer block. Each choice changes which intermediate tensor first carries positional information, and hybrid architectures can even combine signals, so reproducing a checkpoint means checking its exact injection point. The table below maps where position enters and what downstream quantity feels the offset first:

| Approach | How it works | What it modifies | Examples |
|----------|--------------|------------------|----------|
| Absolute (additive) | Add a <span data-glossary="vector">position vector</span> to the token embedding | Embeddings | Original Transformer, BERT, GPT-2[^vaswani2017][^devlin2019][^radford2019code] |
| Rotary | Rotate Q and K using absolute positions; their product exposes relative offset | Projected Q/K | RoFormer, Llama family[^su2021][^dubey2024] |
| Relative (additive bias) | Add a distance penalty to attention logits | Attention scores | ALiBi[^press2022] |

<figure>
  <img src="illustrations/_generated/positional_encoding_dark.png" alt="Three attention pipelines compare where position enters: additive embeddings modify token vectors before QKV projections, RoPE rotates projected queries and keys in 2D pairs while leaving values unrotated, and ALiBi adds a distance penalty directly to pre-softmax logits." />
  <figcaption>Additive encodings inject position before projections, RoPE rotates Q and K while leaving V unrotated, and ALiBi alters pre-softmax attention logits directly. One block, three distinct insertion points.</figcaption>
</figure>

When debugging a position mismatch, always inspect the earliest tensor that changed: the input embedding, the projected queries and keys, or the attention score matrix. Accidentally enabling an extra mechanism alongside a model's native encoding corrupts calculations even if both run without shape errors. Starting with the first entry in our map, let us examine what happens when we add multi-speed waves directly to embeddings before any Q, K, or V projection.

---

## Absolute position: give every slot a multi-speed fingerprint

Nearby tokens need rapidly changing features to distinguish adjacent slots, while distant tokens need slow waves that track broad sequence location. The original Transformer achieves both scales simultaneously by adding geometric pairs of sine and cosine waves directly onto each token embedding.[^vaswani2017] At position 0, every sine channel starts at 0 and every cosine channel starts at 1; stepping forward to position 2 advances the fastest pair by two radians while slower dimensions barely shift, writing a unique position fingerprint for every index across position $\text{pos}$, dimension index $i$, and width $d_{\text{model}}$:

$$
PE_{(\text{pos}, 2i)} = \sin\left(\frac{\text{pos}}{10000^{2i/d_{\text{model}}}}\right), \qquad PE_{(\text{pos}, 2i+1)} = \cos\left(\frac{\text{pos}}{10000^{2i/d_{\text{model}}}}\right)
$$

Because trigonometric addition formulas turn phase shifts into linear coordinate mixes, stepping any pair $[\sin(p\omega), \cos(p\omega)]$ forward by offset $k$ corresponds to multiplication by a $2 \times 2$ orthogonal matrix depending solely on offset $k$, not starting index $p$. Note that this sine-first matrix convention swaps off-diagonal signs relative to the Cartesian $[x, y]$ rotation pairs we will use for RoPE below. Giving later projection layers a linear path to recover fixed offsets is algebraically convenient, yet simply adding position onto embeddings does not force trained attention weights to stay shift-invariant:

$$
\begin{bmatrix}
\sin((p+k)\omega) \\
\cos((p+k)\omega)
\end{bmatrix}
=\begin{bmatrix}
\cos(k\omega)&\sin(k\omega) \\
-\sin(k\omega)&\cos(k\omega)
\end{bmatrix}
\begin{bmatrix}
\sin(p\omega) \\
\cos(p\omega)
\end{bmatrix}
$$

The Python generator below builds an 8-by-8 sinusoidal table so you can inspect the exact zero-angle origin row alongside the shifted fast pair at slot 2 without guesswork:

<!-- leetllm: test, output=show -->
```python title="sinusoidal-positional-encoding.py"
import math

def sinusoidal_positional_encoding(max_len: int, d_model: int) -> list[list[float]]:
    if max_len < 0 or d_model <= 0 or d_model % 2:
        raise ValueError("max_len must be nonnegative and d_model positive and even")
    table: list[list[float]] = []
    for pos in range(max_len):
        row = [0.0] * d_model
        for i in range(0, d_model, 2):
            frequency = math.exp(-(math.log(10000.0) * i) / d_model)
            angle = pos * frequency
            row[i] = math.sin(angle)
            row[i + 1] = math.cos(angle)
        table.append(row)
    return table

pe = sinusoidal_positional_encoding(max_len=8, d_model=8)
print(len(pe), len(pe[0]))
print([round(x, 3) for x in pe[0]])
print(round(pe[2][0], 3), round(pe[2][1], 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
8 8
[0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0]
0.909 -0.416
```
<!-- leetllm: output:end -->

The dials have different wavelengths. With $d_{\text{model}}=512$, a pair whose first dimension is $r$ has wavelength $\lambda_r = 2\pi\cdot10000^{r/d_{\text{model}}}$. Here $r=2i$: the pair index and the dimension index aren't interchangeable.

| Dimension pair | Wavelength | What it tracks |
|----------------|------------|----------------|
| $(0, 1)$ | $\sim 6$ tokens | Fine local position |
| $(64, 65)$ | $\sim 20$ tokens | Medium-scale structure |
| $(510, 511)$ | $\sim 60{,}000$ tokens | Coarse global position |

<!-- leetllm: test, output=show -->
```python title="sinusoidal-wavelengths.py"
import math

d_model = 512
for first_dimension in [0, 64, 510]:
    angular_frequency = 10000 ** (-first_dimension / d_model)
    wavelength = 2 * math.pi / angular_frequency
    print(first_dimension, round(wavelength))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
0 6
64 20
510 60611
```
<!-- leetllm: output:end -->

Plotting the waves directly reveals how dramatically wavelengths spread across a 512-dimensional embedding: by position 12, pair `(0, 1)` has swung nearly twice around the circle (`12.00 rad`), pair `(64, 65)` has rotated roughly `3.80 rad`, and pair `(510, 511)` has moved just `0.001 rad`. Compare both the exact sinusoidal coordinates and their traveled radians side by side below:

<figure>
  <img src="illustrations/_generated/sinusoidal_waves_dark.png" alt="Sinusoidal waves across dimension pairs (0,1), (64,65), and (510,511) for d_model=512 over positions 0 to 32. At position 12, sine and cosine equal [-0.537, 0.844], [-0.608, -0.794], and [0.001, 1.000], with cumulative phases 12.00, 3.80, and 0.001 radians." />
  <figcaption>Across tokens 0 to 32, fast pair (0,1) oscillates with wavelength 6.28 while trailing pair (510,511) stays nearly constant with wavelength 60,611. At position p = 12, stored [sin, cos] coordinates equal [−0.537, 0.844], [−0.608, −0.794], and [0.001, 1.000], matching cumulative phases of 12.00, 3.80, and 0.001 radians.</figcaption>
</figure>

### What addition guarantees, and what it leaves learned

Adding a position vector to a content vector lets subsequent attention dot products mix content and position in four distinct ways. Let token $m$ combine content $x_m$ with position $p_m$ and token $n$ combine content $x_n$ with position $p_n$, giving projections $q_m = (x_m + p_m) W_Q$ and $k_n = (x_n + p_n) W_K$. Expanding their unscaled row-vector dot product $q_m k_n^T$ (which equals column-vector $q_m^T k_n$) exposes a pure content term, two content-position cross terms, and a pure position-position term:

$$
q_m k_n^T = (x_m + p_m) W_Q W_K^T (x_n + p_n)^T = \underbrace{x_m W_Q W_K^T x_n^T}_{\text{content-content}} + \underbrace{x_m W_Q W_K^T p_n^T}_{\text{content-position}} + \underbrace{p_m W_Q W_K^T x_n^T}_{\text{position-content}} + \underbrace{p_m W_Q W_K^T p_n^T}_{\text{position-position}}
$$

Examining that expansion resolves three practical design questions cleanly:

1. **Is the position-only term relative?** If $W_Q W_K^T=I$, each sine/cosine pair contributes $\cos((m-n)\omega)$, so that term depends only on offset. For a general learned product, shared-shift invariance holds only when the relevant bilinear form satisfies $M_k^T A M_k=A$ for column vectors with matrix $A$; an exact block-diagonal rotation is not the only solution. Even setting $W_Q=W_K$ does not ensure this condition.
2. **Do the cross-terms vanish?** No. Content can interact with absolute position, which may help some tasks or hurt shift generalization. Test learned representations and task behavior to identify any spurious affinity.
3. **Can we look up an unseen position?** A learned table with $L_{\max}$ rows has indices $0$ through $L_{\max}-1$. Position $L_{\max}$ lies outside it, so extending or remapping rows changes the design and requires adaptation.[^devlin2019][^radford2019code] A sinusoidal formula has no fixed table limit, though a cached implementation may still need a larger buffer, and bounded coordinates cannot by themselves force good extrapolation: Press et al. measured poor length generalization for sinusoidal language models past their training length.[^press2022]

| Property | Sinusoidal | Learned |
|----------|-----------|---------|
| Parameters | 0 (fixed formula) | $L_{\max} \times d$ |
| Flexibility | Fixed inductive bias | Adapts during training |
| Past the trained range | Formula is defined; buffer limits and quality still need checking | Extend or remap missing rows before lookup |
| Original Transformer translation ablation | Fixed encoding baseline | Nearly identical result in that experiment |

Vaswani et al. tested both and reported "nearly identical results" (Table 3, row E). Sinusoids were attractive because their formula can be evaluated at unseen indices, but definition isn't generalization.

Why add instead of concatenate? Put two $d$-wide vectors side by side and the next layer sees width $2d$. Unless you project back down, square matrices such as $W_Q$, $W_K$, and $W_V$ then grow about 4x. Addition keeps width $d$, but it also gives later projections one mixed vector rather than separate content and position channels.

```checkpoint
Why do absolute positional encodings get added to token embeddings instead of concatenated?
---
Concatenation would double the hidden width from $d$ to $2d$ unless the model projected back down. If the transformer stayed at width $2d$, square projections such as $W_Q$, $W_K$, and $W_V$ would become roughly 4x larger. Addition keeps width $d$ and gives later layers one combined vector. Whether those layers use the mixture well is empirical.
```

Absolute methods leave us with three questions. Does quality hold beyond the trained length? Can the model infer an offset from two absolute vectors? Is mixing content and position in one stream a good trade? Relative methods move the distance signal into attention itself, which is the next experiment.

---

## RoPE: make a shared offset visible inside QK

Moving the position signal past the embedding layer avoids mixing coordinates permanently with token features before any routing happens. Keep one unrotated query vector and one key vector fixed, place them at sequence slots $(m, n)$, and shift both forward by 100 steps. Rotary Position Embedding (RoPE) rotates 2D pairs of query and key coordinates in plane subspaces so that for fixed unrotated vectors and one shared frequency schedule, their dot product depends solely on the relative distance $n - m$.[^su2021] Because earlier Transformer layers already propagate sequence context into $Q$ and $K$, this identity describes the rotation operation itself rather than making an entire multilayer network strictly translation invariant:

<figure>
  <img src="illustrations/_generated/rope_rotation_dark.png" alt="Two RoPE unit-circle panels compare positions (m=2, n=1) and (m=102, n=101) for q=k=[1,0] at theta=0.5. Shifting both positions by 100 rotates both vectors around the circle, while keeping relative angle -0.5 rad and dot product q′·k′=0.878 identical." />
  <figcaption>Shifting both (m, n) forward by +100 moves q′ and k′ around the circle, yet their angular gap stays at −0.5 radians so q′·k′ remains 0.878.</figcaption>
</figure>

### The 2D rotation matrix and relative offset invariance

To encode sequence index $m$ into a 2D coordinate pair $(q_{2i}, q_{2i+1})$, RoPE multiplies the pair by a $2 \times 2$ orthogonal rotation matrix $R_{\theta_i, m}$. Stacking $d_k / 2$ independent 2D blocks along the diagonal forms the block-diagonal transform $R_{\Theta, m} \in \mathbb{R}^{d_k \times d_k}$ across rotary width $d_{\text{rotary}} \le d_k$ with base $b$, where partial RoPE leaves trailing coordinates untouched and preserves total vector norm:

$$
\begin{pmatrix}
q_{2i}^{(m)} \\
q_{2i+1}^{(m)}
\end{pmatrix}
=
\begin{pmatrix}
\cos(m\theta_i) & -\sin(m\theta_i) \\
\sin(m\theta_i) & \cos(m\theta_i)
\end{pmatrix}
\begin{pmatrix}
q_{2i} \\
q_{2i+1}
\end{pmatrix}, \qquad
\theta_i = b^{-2i/d_{\text{rotary}}}, \quad i \in \left\{0, 1, \dots, \frac{d_{\text{rotary}}}{2} - 1\right\}
$$

$$
R_{\Theta, m} = \begin{pmatrix}
R_{\theta_0, m} & 0 & \dots & 0 \\
0 & R_{\theta_1, m} & \dots & 0 \\
\vdots & \vdots & \ddots & \vdots \\
0 & 0 & \dots & R_{\theta_{d_k/2 - 1}, m}
\end{pmatrix}
$$

Raising the frequency base $b$ (for instance from the original 10,000 up to Llama 3.1's 500,000 alongside its piecewise schedule) slows rotation across trailing pairs $i > 0$ while keeping the fastest frequency $\theta_0 = 1$ unchanged.[^metaLlama31Rope2026] Now expand the inner product between rotated query $q^{(m)} = R_{\Theta, m} q$ and rotated key $k^{(n)} = R_{\Theta, n} k$, which equals $q^T (R_{\Theta, m}^T R_{\Theta, n}) k$. Because $R_{\Theta, m}$ is block-diagonal, the transposed key-query product reduces block-by-block, and standard trigonometric angle-difference identities collapse each $2 \times 2$ block straight into the relative rotation $R_{\theta, n - m}$:

$$
(q^{(m)})^T k^{(n)} = (R_{\Theta, m} q)^T (R_{\Theta, n} k) = q^T (R_{\Theta, m}^T R_{\Theta, n}) k
$$

$$
R_{\theta, m}^T R_{\theta, n} =
\begin{pmatrix}
\cos(m\theta) & \sin(m\theta) \\
-\sin(m\theta) & \cos(m\theta)
\end{pmatrix}
\begin{pmatrix}
\cos(n\theta) & -\sin(n\theta) \\
\sin(n\theta) & \cos(n\theta)
\end{pmatrix}
=
\begin{pmatrix}
\cos((n-m)\theta) & -\sin((n-m)\theta) \\
\sin((n-m)\theta) & \cos((n-m)\theta)
\end{pmatrix}
= R_{\theta, n-m}
$$

Applying that block identity across the entire head cancels both absolute indices completely whenever unrotated vectors and frequencies match, giving $(R_{\Theta, m} q)^T (R_{\Theta, n} k) = q^T R_{\Theta, n-m} k$. Shifting both $m$ and $n$ forward by 1,000 steps leaves $R_{\Theta, (n+1000)-(m+1000)} = R_{\Theta, n-m}$ unchanged in exact arithmetic, though finite floating-point angles can still introduce small rounding differences. Viewing each 2D coordinate pair as a complex number makes the arithmetic even clearer:

### Complex number formulation and implementation

Identifying coordinate pair $(q_{2i}, q_{2i+1})$ with complex scalar $z = q_{2i} + i q_{2i+1} \in \mathbb{C}$ turns 2D rotation into unit-circle complex multiplication by $e^{i m \theta_i}$. Because the Euclidean inner product of two real 2D vectors equals the real part of their complex inner product $\text{Re}(z_1 z_2^*)$, conjugating the key factor yields $\text{Re}(q \bar{k} e^{i (m - n)\theta_i})$, making relative-phase dependence explicit at a glance. In real GPU kernels, implementations avoid allocating sparse $d_k \times d_k$ matrices and evaluate the exact rotation through two cached elementwise products:

$$
q^{(m)} = (q_{2i} + i q_{2i+1}) e^{i m \theta_i}, \quad k^{(n)} = (k_{2i} + i k_{2i+1}) e^{i n \theta_i}, \qquad \langle q^{(m)}, k^{(n)} \rangle = \text{Re}\left( (q e^{i m \theta_i}) (k e^{i n \theta_i})^* \right)
$$

$$
R_{\theta_i, m} \begin{pmatrix} q_{2i} \\ q_{2i+1} \end{pmatrix} = \begin{pmatrix} q_{2i} \\ q_{2i+1} \end{pmatrix} \odot \begin{pmatrix} \cos(m\theta_i) \\ \cos(m\theta_i) \end{pmatrix} + \begin{pmatrix} -q_{2i+1} \\ q_{2i} \end{pmatrix} \odot \begin{pmatrix} \sin(m\theta_i) \\ \sin(m\theta_i) \end{pmatrix}
$$

This rotation has two core geometric properties:

1. **Norm preservation:** An orthogonal rotation satisfies $\|R_{\Theta,m}q\|_2=\|q\|_2$ in exact arithmetic. Individual coordinate variances can still change. An extra YaRN amplitude factor is a separate scaling operation.
2. **Routing versus aggregation:** Standard RoPE here rotates Q/K and leaves V unrotated. That introduces position into routing without directly rotating the retrieved values. Other trained architectures can modify values; adding an unexpected V rotation to this checkpoint would change its computation.

<!-- leetllm: test, output=show -->
```python title="rope-relative-offset.py"
import math

def rotate_2d(vec: list[float], pos: int, theta: float) -> list[float]:
    cosine, sine = math.cos(pos * theta), math.sin(pos * theta)
    x, y = vec
    return [x * cosine - y * sine, x * sine + y * cosine]

def dot(left: list[float], right: list[float]) -> float:
    return sum(x * y for x, y in zip(left, right))

query = [0.8, 0.6]
key = [0.7, 0.5]
theta = 0.5
score_a = dot(rotate_2d(query, 5, theta), rotate_2d(key, 2, theta))
score_b = dot(rotate_2d(query, 105, theta), rotate_2d(key, 102, theta))
print(round(score_a, 6), round(score_b, 6))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
0.040884 0.040884
```
<!-- leetllm: output:end -->

The output confirms the shared-shift prediction. It also marks the limit of this toy proof: a trained model’s <span data-glossary="context-window">context window</span> depends on content-dependent Q and K vectors across many layers, not on this identity alone.

Use a unit-vector walk-through to isolate the phase term. Let $q = k = [1, 0]$ and $\theta = 0.5$.

- Query at $m=2$, key at $n=1$: offset $d = n-m = -1$, score $\cos(-0.5) \approx 0.878$.
- Query at $m=102$, key at $n=101$: same offset, same score.

At offset $-2$, a unit pair with $\theta = 0.5$ scores $\cos(-1.0) \approx 0.540$, yet cosine waves can swing negative and recover at wider lags, so summing a full head depends on all frequency bands together. Take an eight-dimensional head ($d_k = d_{\text{rotary}} = 8$) with standard base-10,000 frequencies $1$, $0.1$, $0.01$, and $0.001$, set every coordinate pair to $q = k = [1, 0]$, and compare query $m = 4$ against key $n = 2$. At offset $-2$, only the fastest pair turns negative ($\cos(-2) = -0.416$) while the three slower lanes stay near $+1.000$, yielding dot product $2.564$ and scaled logit $0.906$:

<figure>
  <img src="illustrations/_generated/rope_pair_mechanics_dark.png" alt="RoPE with rotary and key dimensions both 8. Four pairs at frequencies 1, 0.1, 0.01, and 0.001 contribute -0.416, 0.980, 1.000, and 1.000. Their dot-product sum is 2.564; dividing by sqrt(8) gives attention logit 0.906." />
  <figcaption>The fast pair has gone negative at offset $-2$. The slow pairs still look almost aligned. Sum the four pair scores to get the dot product, then divide by $\sqrt{d_k}$ for the attention logit.</figcaption>
</figure>

Complex multiplication performs that same 2D rotation cleanly as $(x + i y)\,e^{i m \theta}$. The helper below applies full-vector complex rotation and verifies that shifting both indices by +1 preserves both the score and vector norm across every pair:

<!-- leetllm: test, output=show -->
```python title="rope-complex-rotation.py"
import cmath

def rope_freqs(dim: int, base: float = 10000.0) -> list[float]:
    if dim <= 0 or dim % 2 or base <= 0:
        raise ValueError("rotary dimension must be positive and even; base must be positive")
    return [1.0 / (base ** (index / dim)) for index in range(0, dim, 2)]

def rotate(vec: list[float], pos: int, freqs: list[float]) -> list[float]:
    if len(vec) != 2 * len(freqs):
        raise ValueError("this helper rotates the full vector: one frequency per pair")
    rotated: list[float] = []
    for pair, freq in enumerate(freqs):
        x, y = vec[2 * pair], vec[2 * pair + 1]
        spun = complex(x, y) * cmath.rect(1.0, pos * freq)
        rotated.extend([spun.real, spun.imag])
    return rotated

def dot(left: list[float], right: list[float]) -> float:
    return sum(x * y for x, y in zip(left, right))

freqs = rope_freqs(dim=4)
vec = [1.0, 0.0, 1.0, 0.0]
score_a = dot(rotate(vec, 0, freqs), rotate(vec, 2, freqs))
score_b = dot(rotate(vec, 1, freqs), rotate(vec, 3, freqs))
print(round(score_a, 6), round(score_b, 6))
print("norm preserved:", abs(dot(vec, vec) - dot(rotate(vec, 2, freqs), rotate(vec, 2, freqs))) < 1e-12)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
0.583653 0.583653
norm preserved: True
```
<!-- leetllm: output:end -->

This helper uses adjacent pairs and rotates the entire vector. With partial RoPE, rotate only the configured prefix and concatenate the untouched suffix. Other implementations pair the first and second halves instead. These conventions are equivalent after a matching coordinate permutation, but swapping them on an existing checkpoint without converting its projections changes its scores.[^llamaRotaryImplementation2026]

For four coordinates, adjacent pairing reads `[(x0, y0), (x1, y1)]` from `[x0, y0, x1, y1]`. Split-half `rotate_half` reads the same pairs from `[x0, x1, y0, y1]`: its partner transform is `[-y0, -y1, x0, x1]`. The cosine/sine arrays must follow that layout too. Meta's reference uses adjacent complex pairs; Transformers' Llama code uses split halves.[^metaLlama31Rope2026][^llamaRotaryImplementation2026]

Both rotations preserve norms, so a norm check won't catch a layout mismatch. Compare scores after converting both Q and K, then deliberately skip the conversion:

<!-- leetllm: test, output=show -->
```python title="rope-pair-layouts.py"
import math

def rotate_layout(vector, position, frequencies, split_half=False):
    result = vector.copy()
    half = len(vector) // 2
    for pair, frequency in enumerate(frequencies):
        a, b = (pair, pair + half) if split_half else (2 * pair, 2 * pair + 1)
        cosine, sine = math.cos(position * frequency), math.sin(position * frequency)
        result[a] = vector[a] * cosine - vector[b] * sine
        result[b] = vector[a] * sine + vector[b] * cosine
    return result

def score(q, k, split_half=False):
    rq = rotate_layout(q, 5, [1.0, 0.01], split_half)
    rk = rotate_layout(k, 2, [1.0, 0.01], split_half)
    return sum(a * b for a, b in zip(rq, rk))

q, k = [1.0, 2.0, 3.0, 4.0], [4.0, 3.0, 2.0, 1.0]
permutation = [0, 2, 1, 3]
converted_q = [q[i] for i in permutation]
converted_k = [k[i] for i in permutation]
adjacent = score(q, k)
converted = score(converted_q, converted_k, split_half=True)
wrong_layout = score(q, k, split_half=True)

print("adjacent score", round(adjacent, 6))
print("converted split-half score", round(converted, 6))
print("unconverted split-half score", round(wrong_layout, 6))
assert math.isclose(adjacent, converted, abs_tol=1e-12)
assert not math.isclose(adjacent, wrong_layout, abs_tol=1e-12)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
adjacent score -0.760002
converted split-half score -0.760002
unconverted split-half score -1.61558
```
<!-- leetllm: output:end -->

For a checkpoint conversion, this permutation belongs on the Q/K projection output coordinates for every affected head, including their biases if present. Keep it within the configured rotary region for partial RoPE. Reordering cached rotated keys or swapping a helper alone doesn't convert the model.

RoPE rotates Q and K, not V in the standard attention setup here. Q and K route attention, so their relative geometry decides which value rows get weight. V supplies the rows being mixed and isn’t directly rotated in that attention step, though earlier layers can already have put position-dependent context into it.

```checkpoint
Why does RoPE rotate Q and K without directly rotating V?
---
Q and K decide which values receive attention weight, so rotating them makes the routing score depend on relative offset. V supplies the information being mixed and isn't rotated in that attention step. After earlier layers, V can still carry position-dependent context.
```

Keep routing and aggregation separate when comparing the three methods:

| Property | Sinusoidal | Learned | RoPE |
|----------|-----------|---------|------|
| Position info | Added to embeddings | Added to embeddings | Applied to Q, K only |
| Relative position | Implicit | Implicit | Explicit in the dot product |
| Direct position input to V | Included in $V=(X+PE)W_V$ | Included in $V=(X+P)W_V$ | No direct rotary transform here |
| Extra parameters | 0 | $L_{\max} \times d$ | 0 |

### Image patches need height and width coordinates

The [vision lesson](/learn/vision-transformers-image-encoders) flattened a patch grid into rows. That storage order doesn't require a position method to forget the grid. A simple axial RoPE assigns one set of coordinate pairs to height and another to width. With just two pairs, write

$$
R(h,w)=\operatorname{diag}\left(R_{\theta_h,h},R_{\theta_w,w}\right).
$$

Its QK identity now depends on two offsets, $(h_k-h_q,w_k-w_q)$, rather than one sequence distance. Shifting both patches by the same height and width leaves the fixed-vector score unchanged. Raster index `h * grid_width + w` has a different limitation: the index gap for vertically adjacent patches changes when the grid width changes.

Qwen2.5-VL's report describes a three-axis MRoPE design for time, height, and width. Text uses the same position ID on all axes; an image uses a constant temporal ID and spatial IDs for its patch locations.[^bai2025qwen25vl] The next two-axis toy isolates that geometry. It isn't the checkpoint's complete frequency allocation or processor.

<!-- leetllm: test, output=show -->
```python title="rope-patch-coordinates.py"
import math

def rotate_patch(vector, height, width):
    result = []
    for (x, y), coordinate in zip([vector[:2], vector[2:]], [height, width]):
        angle = 0.5 * coordinate
        result.extend([x * math.cos(angle) - y * math.sin(angle),
                       x * math.sin(angle) + y * math.cos(angle)])
    return result

def patch_score(query_position, key_position):
    vector = [1.0, 0.0, 1.0, 0.0]
    query = rotate_patch(vector, *query_position)
    key = rotate_patch(vector, *key_position)
    return sum(q * k for q, k in zip(query, key))

original = patch_score((1, 1), (0, 1))
shifted = patch_score((5, 8), (4, 8))
lost_height = patch_score((0, 1), (0, 1))
print("one row apart", round(original, 6))
print("shared spatial shift", round(shifted, 6))
print("height IDs discarded", round(lost_height, 6))
vertical_gaps = []
for grid_width in [2, 4]:
    query_index = 1 * grid_width + 1  # query at (height=1, width=1)
    key_index = 0 * grid_width + 1    # key directly above it
    vertical_gaps.append(query_index - key_index)
print("vertical raster gaps", vertical_gaps)
assert math.isclose(original, shifted, abs_tol=1e-12)
assert not math.isclose(original, lost_height, abs_tol=1e-12)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
one row apart 1.877583
shared spatial shift 1.877583
height IDs discarded 2.0
vertical raster gaps [2, 4]
```
<!-- leetllm: output:end -->

Dropping height IDs makes the two different patches appear colocated to this position transform. In a multimodal runtime, preserve the processor's axis IDs, frequency-band allocation, and the checkpoint's continuation-position rule. Advancing every axis by the cache's token count invents a different geometry.[^huggingface2026rope]

### A relative phase can rise again

While RoFormer proves a long-term decay *bound* when integrating across a dense frequency spectrum, a single coordinate pair's unit-vector score $S_{\Delta} = \cos(\Delta\theta)$ simply oscillates rather than decaying monotonically.[^su2021] Because cosine climbs back up as $\Delta\theta$ crosses $\pi$, increasing separation does not guarantee weaker positional affinity on every frequency band. Tracking offsets 1 through 8 directly demonstrates that a pair score can drop close to $-1$ at lag 6 and immediately rebound upward at lag 8:

<!-- leetllm: test, output=show -->
```python title="rope-offset-is-not-monotonic.py"
import math

theta = 0.5
distances = [1, 2, 4, 6, 8]
scores = [math.cos(distance * theta) for distance in distances]
print(distances)
print([round(score, 3) for score in scores])
print(scores[-1] > scores[-2])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[1, 2, 4, 6, 8]
[0.878, 0.54, -0.416, -0.99, -0.654]
True
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/rope_decay_curve_dark.png" alt="One chart compares a RoPE pair score S(Δ)=cos(0.5Δ) with the ALiBi bias B(Δ)=−0.1Δ. Between offsets 6 and 8, the RoPE score rises from −0.990 to −0.654 while the ALiBi score falls from −0.600 to −0.800." />
  <figcaption>One RoPE frequency oscillates. ALiBi's logit bias keeps dropping. A full RoPE head is a sum over frequencies plus content, so you still have to measure it.</figcaption>
</figure>

Men et al. document why non-monotonic oscillation creates a practical trap in Llama-2 long-context tests: aggregate next-token <span data-glossary="perplexity">perplexity</span> can stay low while passkey retrieval breaks whenever the RoPE base falls below their derived threshold (including small bases like 500 and even some larger settings).[^men2024] Whenever you alter a RoPE schedule, evaluate retrieval accuracy explicitly across the full deployed length rather than trusting average loss alone. Whereas RoPE expresses offset indirectly through rotating phases that can rise again, ALiBi enforces a strictly monotonic "farther is weaker" preference directly on pre-softmax scores.

---

## ALiBi: make recency a score bias

Suppose two visible keys yield identical content dot products with a query, yet one sits four positions earlier in the sequence. Should each attention head subtract a fixed recency margin from older keys without modifying token embeddings or rotating $Q$ and $K$? ALiBi (Attention with Linear Biases) injects a static, head-specific linear distance penalty straight into pre-softmax attention logits, adding $-m_h(i - j)$ for $j \le i$ after scaling $QK^T$ by $1/\sqrt{d_k}$ (scaling the bias too would tie slope strength to $d_k$) while the causal mask hard-blocks future keys $j > i$ with $-\infty$:[^press2022]

$$
\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}} + B^{(h)}\right) V,\quad B^{(h)}_{ij} = -m_h(i-j)\ \text{for}\ j \le i
$$

### Slope schedule derivation and the recency spectrum

The geometric slope schedule $m_h = 2^{-8h/H}$ for $h \in \{1, \dots, H\}$ gives different heads distinct attention horizons, ranging in an eight-head layer from steepest slope $m_1 = 1/2$ down to gentlest slope $m_8 = 1/256$ (for non-power-of-two head counts, the reference schedule uses base power $p = 2^{\lfloor \log_2 H \rfloor}$ plus strided slopes from $2p$).[^alibiReferenceCode2026] In Head 1, looking back 10 tokens adds a $-5$ logit penalty ($e^{-5} \approx 0.0067$ odds ratio against an equal-score self-key), whereas Head 8 loses just $-1$ over 256 tokens; in both cases, strong content matches can outvote the distance bias rather than hitting a hard window cutoff:

$$
m_h = \left(2^{-8/H}\right)^h = 2^{-8h/H}, \quad h \in \{1, 2, \dots, H\}
$$

<figure>
  <img src="illustrations/_generated/alibi_bias_dark.png" alt="ALiBi recency penalties across 8 heads at distance 16 range from -8.0 in Head 1 to -0.06 in Head 8, paired with the 4x4 Head 1 causal bias matrix and a query i=2 trace showing finite past weights [0.186, 0.307, 0.506] and masked future weight 0.000." />
  <figcaption>Distance penalties at lag 16 span −8.0 on Head 1 to −0.06 on Head 8. On query i = 2 against equal raw logits of 2.0, finite bias shifts softmax weights toward recency ([0.186, 0.307, 0.506]) while causal masking zeros future key k3.</figcaption>
</figure>

Read the distance-16 penalty table below alongside a four-token sequence (`"The"` at 0, `"model"` at 1, `"has"` at 2, `"loaded"` at 3): if `"loaded"` scores 2.5 against both `"model"` and `"The"`, Head 4 ($m = 0.0625$) yields logits 2.375 and 2.3125 while Head 1 subtracts 1.0 and 1.5, demonstrating both how slope selects recency and how semantic score spikes overcome it:

| Head | Slope $m$ | Distance penalty at $\Delta = 16$ | Effect |
|------|-----------|-----------------------------------|--------|
| Head 1 | $1/2$ | $-8.0$ | Strongest bias in this eight-head set |
| Head 4 | $1/16$ | $-1.0$ | Intermediate bias |
| Head 8 | $1/256$ | $-0.0625$ | Weakest bias in this set |

The Python helper below evaluates ALiBi for a single query-key pair given an already-scaled `raw_score` ($q^T k / \sqrt{d_k}$), computing distance 4 under slopes $1/2$ and $1/256$ and verifying that future keys receive $-\infty$ from causal masking:

<!-- leetllm: test, output=show -->
```python title="alibi-one-score.py"
def alibi_score(raw_score: float, query_pos: int, key_pos: int, slope: float) -> float:
    if query_pos < 0 or key_pos < 0 or slope < 0:
        raise ValueError("positions and slope must be nonnegative")
    if key_pos > query_pos:
        return float("-inf")  # causal mask, not the distance bias
    distance = query_pos - key_pos
    return raw_score - slope * distance

raw = 4.0
query_pos = 10
key_pos = 6
head_1 = alibi_score(raw, query_pos, key_pos, slope=1 / 2)
head_8 = alibi_score(raw, query_pos, key_pos, slope=1 / 256)
print(head_1, round(head_8, 3))
print("future:", alibi_score(raw, query_pos, key_pos=11, slope=1 / 2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
2.0 3.984
future: -inf
```
<!-- leetllm: output:end -->

A single pair hides an important distinction between causal masking and recency penalties, so the next snippet constructs the full causal bias <span data-glossary="tensor">tensor</span> across heads (including non-power-of-two head counts), leaving $-\infty$ strictly on future columns $j > i$:

<!-- leetllm: test, output=show -->
```python title="alibi-bias-matrix.py"
def alibi_slopes_power_of_two(n_heads: int) -> list[float]:
    if n_heads <= 0 or n_heads & (n_heads - 1):
        raise ValueError("n_heads must be a positive power of two")
    start = 2 ** (-8 / n_heads)
    return [start * (start ** head) for head in range(n_heads)]

def alibi_slopes(n_heads: int) -> list[float]:
    if n_heads <= 0:
        raise ValueError("n_heads must be a positive integer")
    if n_heads & (n_heads - 1) == 0:
        return alibi_slopes_power_of_two(n_heads)
    closest = 1 << (n_heads.bit_length() - 1)
    extra = alibi_slopes(2 * closest)[0::2][: n_heads - closest]
    return alibi_slopes_power_of_two(closest) + extra

def build_alibi_bias(n_heads: int, seq_len: int) -> list[list[list[float]]]:
    if seq_len <= 0:
        raise ValueError("seq_len must be a positive integer")
    slopes = alibi_slopes(n_heads)
    bias: list[list[list[float]]] = []
    for slope in slopes:
        head = []
        for query in range(seq_len):
            row = []
            for key in range(seq_len):
                if key > query:
                    row.append(float("-inf"))
                else:
                    row.append(-slope * (query - key))
            head.append(row)
        bias.append(head)
    return bias

bias = build_alibi_bias(n_heads=4, seq_len=4)
print(len(bias), len(bias[0]), len(bias[0][0]))
print([round(value, 4) for value in bias[0][3]])
print([round(value, 4) for value in bias[-1][3]])
print("3-head slopes:", alibi_slopes(3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
4 4 4
[-0.75, -0.5, -0.25, -0.0]
[-0.0117, -0.0078, -0.0039, -0.0]
3-head slopes: [0.0625, 0.00390625, 0.25]
```
<!-- leetllm: output:end -->

### Extrapolation mechanics and the long-range penalty trap

ALiBi's rule has no finite table limit or periodic phase, so it evaluates smoothly at previously unseen distances even though those larger negative biases remain unfamiliar to the trained weights. Press et al.'s 1.3B experiment trained at length 1,024 and evaluated at 2,048, matching a longer-trained sinusoidal baseline's validation perplexity with roughly 11% less memory and 11% faster step progress in their setup.[^press2022] Those gains describe specific training runs rather than guaranteeing universal extrapolation across arbitrary context ratios.

Its **monotonic recency prior** is a tradeoff worth calculating. At distance 16,384, the eight-head slopes above give biases of $-8192$ and $-64$ at the extremes. Compare the gentlest head's far key against the self-key: with equal content scores, the far-to-self odds are $e^{-64}$. A content-score advantage greater than 64 reverses that two-key comparison. Against an adjacent key, the bias difference is $(16384-1)/256$, not exactly 64.

Content logits depend on learned norms and projections, and other heads and layers can relay information. A single head's penalty therefore does not determine the whole model's retrieval ability. RoPE uses relative phase rather than this linear bias; its frequency and training choices also need evaluation.

<!-- leetllm: test, output=show -->
```python title="alibi-bias-is-not-a-mask.py"
import math

def softmax(logits: list[float]) -> list[float]:
    maximum = max(logits)
    shifted = [math.exp(value - maximum) for value in logits]
    total = sum(shifted)
    return [value / total for value in shifted]

raw_scores = [2.0, 2.0, 2.0, 100.0]
query_position = 2
biased_scores = [
    score - 0.5 * (query_position - key) if key <= query_position else -math.inf
    for key, score in enumerate(raw_scores)
]
weights = softmax(biased_scores)
print([round(weight, 3) for weight in weights])
print(weights[0] > 0)
print("future weight:", weights[3])
far_vs_self = softmax([65.0 - 16384 / 256, 0.0])
print("far key with a 65-logit advantage:", round(far_vs_self[0], 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[0.186, 0.307, 0.506, 0.0]
True
future weight: 0.0
far key with a 65-logit advantage: 0.731
```
<!-- leetllm: output:end -->

```checkpoint
Two past tokens have equal raw attention scores, but one is four positions farther from the query under ALiBi. Does ALiBi mask the farther token?
---
No. With equal raw scores, the farther visible token gets a smaller weight, not a hard mask. Its weight remains positive in exact arithmetic. Only the separate causal mask removes future positions outright; floating-point underflow is a different issue.
```

## Long context: a defined formula still needs evidence

Imagine serving a checkpoint trained at 4K context on a 32K target prompt where an early passkey fact must answer a question around token 30,000. Evaluating $PE_{32000}$ or $R_{32000}$ proves only that the arithmetic formula accepts index 32,000, not that attention heads still route information accurately across that gap. Although unchanged RoPE produces valid coordinates at larger distances, fast dimensions have wrapped repeatedly while slow dimensions visit untrained phase regions and face far more distractors; Chen et al. observed direct extension failing on LLaMA checkpoints, so always compute phases cleanly and test long-context behavior empirically.[^chen2023b][^men2024] The table below separates what each rule's formula does past $L_{\text{train}}$ from what experiments actually observed:

| Method | What happens past training length | What the papers actually measured |
|--------|-----------------------------------|-----------------------------------|
| Sinusoidal | Formula can compute unseen indices | Press et al.: sharp WikiText-103 perplexity increase past train $L$ |
| Learned absolute | No row for index $L_{\max}$ or later | Extend or replace the table, then train and evaluate |
| RoPE (unchanged) | Rotations continue at unseen offsets | Chen et al.: poor direct extension in their Llama runs |
| ALiBi | Same linear bias at new distances | Press et al.: 1024 → 2048 perplexity match in their 1.3B setup |
| RoPE with PI or YaRN | Geometry is rescaled, usually with adaptation | Chen et al.: PI up to 32K; Peng et al.: YaRN up to 128K on evaluated Llama-family models |

Use two evidence gates: short-context behavior must survive, and retrieval plus target tasks must work at the new length. Sweep evidence positions and evidence-to-query distances, include distractors and missing-evidence cases, and reserve tokens for generation. Next-token perplexity averages over predictable local tokens, so it cannot replace targeted retrieval tests.[^men2024]

Even correct position IDs can be lost before the rotation. Casting indices `4096` and `4097` to `bfloat16` rounds both to `4096`. Computing cosine in `float32` afterward can't recover the distinction. Transformers' Llama implementation computes phases from floating-point position IDs and frequencies in `float32`, then casts the resulting sine/cosine tensors to the activation dtype.[^llamaRotaryImplementation2026]

<!-- leetllm: test, deps=torch, output=show -->
```python title="rope-position-precision.py"
import torch

positions = torch.tensor([4096, 4097], dtype=torch.int64)
rounded_first = positions.to(torch.bfloat16).float()
phase_fp32 = positions.float()  # fastest pair has frequency 1
bad_cosine = rounded_first.cos()
good_cosine = phase_fp32.cos()

print("positions after bfloat16", rounded_first.tolist())
print("bad phases identical", bool(torch.equal(rounded_first[:1], rounded_first[1:])))
print("bad cosines", [round(x, 6) for x in bad_cosine.tolist()])
print("float32 cosines", [round(x, 6) for x in good_cosine.tolist()])
assert bad_cosine[0] == bad_cosine[1]
assert good_cosine[0] != good_cosine[1]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
positions after bfloat16 [4096.0, 4096.0]
bad phases identical True
bad cosines [0.803991, 0.803991]
float32 cosines [0.803991, 0.934772]
```
<!-- leetllm: output:end -->

Keep position IDs as integers until deliberate phase computation. Check the phase tensor's dtype separately from Q/K and the cache dtype. This CPU example diagnoses a conversion error; it doesn't benchmark a fused kernel. `float32` also has finite precision, so a proposed much larger range needs numerical checks at its actual indices.

### PI: compress coordinates into the trained range

Position Interpolation (PI) linearly compresses target sequence coordinates by $s = L_{\text{target}} / L_{\text{train}}$ so every effective coordinate $m' = m / s$ falls back inside the pretrained window $[0, L_{\text{train}})$, which is mathematically identical to scaling all rotary frequencies down to $\theta_i / s$.[^chen2023b] Because $m'$ takes fractional values across the interval, PI relies on continuous phase interpolation rather than discrete lookup indices; Chen et al. extended 2,048-token LLaMA checkpoints up to 32,768 within 1,000 fine-tuning steps, and in a $4\text{K} \to 16\text{K}$ ($s = 4$) layout index 16,383 maps cleanly to $4095.75$:

$$
m' = m \cdot \frac{L_{\text{train}}}{L_{\text{target}}} = \frac{m}{s}
$$

<!-- leetllm: test, output=show -->
```python title="position-interpolation-map.py"
train_length = 4096
target_length = 16384
scale = train_length / target_length

for target_position in [0, 4096, 8192, 16383]:
    effective_position = target_position * scale
    print(target_position, round(effective_position, 2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
0 0.0
4096 1024.0
8192 2048.0
16383 4095.75
```
<!-- leetllm: output:end -->

PI also compresses every adjacent-token phase difference by $1/s$, including the fastest pair. YaRN's authors hypothesize that this loss of high-frequency separation contributes to short-context degradation in tested extensions.[^peng2023] It does not make adjacent indices identical or prove a universal grammar failure. Measure short tasks after adaptation as well as long retrieval.

### NTK-aware scaling: stretch frequencies unevenly

The name **NTK-aware** comes from neural tangent kernel intuition about Fourier frequency separation rather than forming a mathematical proof of length generalization for trained LLMs.[^peng2023] Instead of slowing every coordinate pair uniformly like PI, it scales the rotary base upward to $b' = b \cdot s^{d/(d-2)}$ (defined for even $d = d_{\text{rotary}} > 2$), transforming $\theta_i' = \theta_i \cdot s^{-2i/(d-2)}$ so the highest-frequency pair keeps $\theta_0' = 1$, intermediate bands interpolate smoothly, and the slowest pair ($\theta_{d/2 - 1}' = \theta_{d/2 - 1} / s$) stretches fully:

$$
b' = b \cdot s^{d/(d-2)}, \qquad \theta_i' = \left( b \cdot s^{d/(d-2)} \right)^{-2i/d} = \theta_i \cdot s^{-2i/(d-2)}
$$

Consider how those endpoints behave across the rotary spectrum:

- **Highest frequency ($i=0$):** $\theta_0'=1$. This pair keeps its original phase step. Evaluate syntax and local model behavior on the extended context separately.
- **Lowest frequency ($i=d/2-1$):** $\theta_{d/2-1}'=\theta_{d/2-1}/s$.
- **Middle frequencies:** Smoothly transition from zero compression to full interpolation.

Code Llama raises its rotary base to $10^6$ during long-context fine-tuning.[^roziere2023] Choosing a larger base manually shares this frequency-stretching intuition, though raising $b$ alone does not confirm that a checkpoint follows the exact NTK power formula above.

### YaRN: treat frequency bands differently

YaRN combines **NTK-by-parts** band splitting with an empirical attention temperature adjustment.[^peng2023] Using each pair's wavelength $\lambda_i = 2\pi / \theta_i$, it counts how many full rotations $r_i = L_{\text{train}} \theta_i / (2\pi)$ fit inside the original pretraining window, then ramps smoothly across rotation-count thresholds $\alpha$ and $\beta$ (with LLaMA defaults $\alpha = 1$, $\beta = 32$) so fast pairs completing over 32 turns stay untouched, slow pairs completing under 1 turn interpolate fully by $1/s$, and intermediate pairs blend linearly:

$$
r_i = \frac{L_{\text{train}}}{\lambda_i} = \frac{L_{\text{train}}\theta_i}{2\pi}, \qquad \gamma_i = \operatorname{clip}\left(\frac{r_i-\alpha}{\beta-\alpha},0,1\right), \qquad \theta_i' = \left(1-\gamma_i\right)\frac{\theta_i}{s}+\gamma_i\theta_i
$$

Notice that $\alpha$ and $\beta$ count rotations rather than token wavelengths, whereas Hugging Face Transformers 5.17.0 parameterizes YaRN with linear pair-index bounds and optional rounding.[^transformersYarn5172026] The worked helper below computes the original paper's rotation-count ramp for $d = 8$, $L = 4,096$, and $s = 4$ across frequencies `[1, 0.1, 0.01, 0.001]`, verifying that the first two pairs exceed 32 turns while the slowest pair completes under one turn:

<!-- leetllm: test, output=show -->
```python title="yarn-frequency-bands.py"
import math

def yarn_paper_frequencies(dim: int, train_length: int, scale: float,
                           base: float = 10000.0,
                           alpha: float = 1.0, beta: float = 32.0) -> list[float]:
    if dim <= 0 or dim % 2 or train_length <= 0 or scale < 1 or base <= 1 or not 0 <= alpha < beta:
        raise ValueError("positive even dim, positive length, scale >= 1, base > 1, 0 <= alpha < beta")
    frequencies = [base ** (-2 * pair / dim) for pair in range(dim // 2)]
    result = []
    for frequency in frequencies:
        turns = train_length * frequency / (2 * math.pi)
        preserve = min(1.0, max(0.0, (turns - alpha) / (beta - alpha)))
        result.append(frequency * (preserve + (1 - preserve) / scale))
    return result

original = [1.0, 0.1, 0.01, 0.001]
adjusted = yarn_paper_frequencies(8, 4096, 4)
turns = [4096 * frequency / (2 * math.pi) for frequency in original]
print("turns:", [round(value, 3) for value in turns])
print("new frequencies:", [round(value, 6) for value in adjusted])
print("ratios:", [round(new / old, 3) for new, old in zip(adjusted, original)])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
turns: [651.899, 65.19, 6.519, 0.652]
new frequencies: [1.0, 0.1, 0.003835, 0.00025]
ratios: [1.0, 1.0, 0.384, 0.25]
```
<!-- leetllm: output:end -->

YaRN additionally uses $a=\sqrt{1/t}=1+0.1\ln s$ as an empirical fit for tested LLaMA/Llama 2 models. Multiplying both rotated Q and K by $a$ multiplies their dot-product logits by $a^2$. For $s=4$, $a\approx1.139$, $a^2\approx1.296$, and $t\approx0.771$. This scaling changes norms and, for nonuniform logits, sharpens softmax. More keys do not inevitably increase entropy: a newly added key with a dominant score can concentrate the distribution. The empirical adjustment needs its own task evaluation.

<!-- leetllm: test, output=show -->
```python title="rope-scaling-numbers.py"
import math

rotary_dim, base, scale = 128, 10000.0, 4.0
new_base = base * scale ** (rotary_dim / (rotary_dim - 2))
ratios = [(base / new_base) ** (2 * pair / rotary_dim) for pair in [0, 16, 32, 48, 63]]
amplitude = 1 + 0.1 * math.log(scale)
print("new base:", round(new_base))
print("frequency ratios:", [round(value, 3) for value in ratios])
print("q/k factor:", round(amplitude, 3))
print("logit factor:", round(amplitude ** 2, 3))
print("temperature:", round(1 / amplitude ** 2, 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
new base: 40890
frequency ratios: [1.0, 0.703, 0.495, 0.348, 0.25]
q/k factor: 1.139
logit factor: 1.296
temperature: 0.771
```
<!-- leetllm: output:end -->

### Cache positions are part of the computation

During cached generation, use each new query's true logical position ID alongside the exact same frequency schedule used to populate the cached keys. Storage slot indices inside a ring buffer need not match sequence positions when padding, packed sequences, or sliding windows are active, and resetting a query index or rotating keys twice corrupts relative offsets. For a single-layer fixed-Q/K check, the PyTorch snippet below tests full-pass causal equivalence against step-by-step decoding and two-query chunks, and shows how position resets or mismatched query schedules break equivalence:

<!-- leetllm: test, deps=torch, output=show -->
```python title="rope-cache-consistency.py"
import torch
import torch.nn.functional as F

def rotate_pairs(rows: torch.Tensor, positions: torch.Tensor,
                 frequencies: torch.Tensor) -> torch.Tensor:
    if rows.ndim != 2 or rows.shape[1] != 2 * frequencies.numel():
        raise ValueError("one frequency per adjacent coordinate pair")
    if positions.shape != (rows.shape[0],) or frequencies.ndim != 1:
        raise ValueError("one position per row and a one-dimensional frequency schedule")
    pairs = rows.reshape(rows.shape[0], -1, 2)
    angles = positions[:, None] * frequencies[None, :]
    cos, sin = angles.cos(), angles.sin()
    x, y = pairs[..., 0], pairs[..., 1]
    return torch.stack((x * cos - y * sin, x * sin + y * cos), -1).flatten(1)

q = torch.tensor([[1., 0., 1., 0.], [0., 1., 1., 1.],
                  [1., 1., 0., 1.]], dtype=torch.float64)
k = torch.tensor([[1., 1., 1., 0.], [1., 0., 0., 1.],
                  [0., 1., 1., 1.]], dtype=torch.float64)
v = torch.eye(3, dtype=torch.float64)
positions = torch.arange(800, 803, dtype=torch.float64)
frequencies = torch.tensor([1., 0.01], dtype=torch.float64)
rotated_q = rotate_pairs(q, positions, frequencies)
rotated_k = rotate_pairs(k, positions, frequencies)

def attend(query, keys, values, causal=False, mask=None):
    return F.scaled_dot_product_attention(query[None, None], keys[None, None],
                                         values[None, None], dropout_p=0.,
                                         is_causal=causal, attn_mask=mask)[0, 0]

full = attend(rotated_q, rotated_k, v, causal=True)
cached = torch.cat([attend(rotated_q[i:i+1], rotated_k[:i+1], v[:i+1])
                    for i in range(3)])
chunk_mask = positions[None, :] <= positions[1:, None]
chunk = attend(rotated_q[1:], rotated_k, v, mask=chunk_mask)
unmasked_chunk = attend(rotated_q[1:], rotated_k, v)
reset_query = rotate_pairs(q[-1:], torch.zeros(1, dtype=q.dtype), frequencies)
new_frequencies = torch.tensor([1., 0.005], dtype=q.dtype)
mixed_query = rotate_pairs(q[-1:], positions[-1:], new_frequencies)
consistent_keys = rotate_pairs(k, positions, new_frequencies)
fixed_layer_repaired = attend(mixed_query, consistent_keys, v)
all_new = attend(rotate_pairs(q, positions, new_frequencies), consistent_keys, v, causal=True)

print("full and cached match:", torch.allclose(full, cached, atol=1e-12, rtol=0))
print("full and cached chunk match:", torch.allclose(full[1:], chunk, atol=1e-12, rtol=0))
print("chunk without mask matches:", torch.allclose(full[1:], unmasked_chunk, atol=1e-12, rtol=0))
print("chunk first query sees future:", bool(chunk_mask[0, -1]))
print("reset position matches:", torch.allclose(full[-1:], attend(reset_query, rotated_k, v), atol=1e-12, rtol=0))
print("mixed schedules match new pass:", torch.allclose(all_new[-1:], attend(mixed_query, rotated_k, v), atol=1e-12, rtol=0))
print("fixed layer repaired:", torch.allclose(all_new[-1:], fixed_layer_repaired, atol=1e-12, rtol=0))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
full and cached match: True
full and cached chunk match: True
chunk without mask matches: False
chunk first query sees future: False
reset position matches: False
mixed schedules match new pass: False
fixed layer repaired: True
```
<!-- leetllm: output:end -->

Every single-token step sees only its current prefix, so it needs no additional causal mask. Its one-row query is already the last position. The two-token chunk is different: query `801` must hide key `802`, while query `802` may see it. The explicit mask compares their logical positions; in this PyTorch API, `True` permits a pair. A rectangular `is_causal=True` call can have different alignment; use the explicit offset-aware mask from the [attention lesson](/learn/scaled-dot-product-attention) for cached chunks. Matching rotary offsets doesn't repair future-token leakage.

YaRN's paper recommends caching unrotated keys when applying a changing schedule.[^peng2023] Converting old rotated keys with $R_{\mathrm{new}}(p)R_{\mathrm{old}}(p)^T$ repairs the rotation for **fixed unrotated keys** in exact arithmetic. In a multilayer decoder, earlier attention changes can also change later K/V features; rerotating stored keys alone need not reproduce a full pass under the new schedule. Use a supported cache policy or recompute the prefix when full-pass equivalence is required. This toy verifies arithmetic, not trained-model cache quality.

<figure>
  <img src="illustrations/_generated/rope_scaling_methods_dark.png" alt="Comparison of PI, NTK-aware scaling, and YaRN for 4K-to-16K extension (s=4, d=128). PI compresses all frequency pairs uniformly to 0.25x and maps index 16,383 to 4,095.75, NTK-aware base 40,890 decays geometrically from 1.0x to 0.25x, and YaRN keeps fast bands at 1.0x while scaling attention logits by a^2=1.296 (t=0.771)." />
  <figcaption>For 4K-to-16K scaling (s = 4), PI compresses every frequency band uniformly to 0.25x, NTK-aware base 40,890 preserves pair 0 while slowing trailing pairs smoothly, and YaRN leaves fast bands above 32 turns unscaled alongside an attention scale factor of a = 1.139 on Q and K (logit factor 1.296, temperature 0.771).</figcaption>
</figure>

### Read the whole checkpoint configuration

Llama 3.1's reference code starts from base $500{,}000$ and uses a piecewise transform based on the original 8,192-token window.[^metaLlama31Rope2026] Wavelengths below 2,048 stay unchanged; those above 8,192 have frequencies divided by eight; the middle blends the two using the rotation-count ratio. That factor of eight parameterizes frequency scaling alongside staged long-context training in the Llama 3 report rather than guaranteeing 128K capability from arithmetic alone.[^dubey2024]

Gemma 3 (2025) uses five local attention layers for each global layer, with bases 10,000 locally and 1,000,000 globally.[^gemma3Technical2025] Combining local-global bases with long-context fine-tuning in the 4B/12B/27B checkpoints shows why reading a single base constant misses much of the architecture. Similarly, LongRoPE2 (2025) searches per-dimension scaling ratios against needle-answer loss and mixes short-context original RoPE with rescaled long-context training on LLaMA3-8B and Phi3-mini, demonstrating the principle of optimizing distant-evidence use while guarding against short-context regression.[^shang2025longrope2] As checked October 10, 2026, Transformers' documentation exposes variants through `rope_parameters` per layer type, so always inspect the checkpoint configuration for rotary width, pair layout, base, ramp, amplitude scaling, and cache handling.[^huggingface2026rope]

---

## Choose by mechanism, then earn the window

Pick the insertion point that matches the positional behavior your architecture requires, from embedding addition to rotary geometry or logit biases. Then validate short-context stability, long-range passkey retrieval, multi-needle reasoning, and full generation across the exact context length you plan to serve:

| Goal | Candidate | What you still have to measure |
|------|-----------|--------------------------------|
| Reproduce the original Transformer | Sinusoidal absolute encoding | Quality at trained lengths and any longer lengths you serve |
| Finite learned slots | Learned absolute embeddings | How new rows are initialized and adapted |
| Relative offset inside QK scores | RoPE | Target-length retrieval and generation, especially after scaling |
| Explicit monotonic recency bias | ALiBi | Whether the recency prior hides evidence long tasks need |
| Extend an existing RoPE checkpoint | PI or YaRN-style adaptation | Short-context regression and long-context behavior after adaptation |

Your choice of positional mechanism determines which tensor first encodes order, yet arithmetic support at large indices never earns a context window on its own. Identify the exact tensor carrying position, keep rotary schedules consistent with the cache, and prove deployed context capacity directly through retrieval and task benchmarks.

<!-- leetllm: mastery:start -->

## Check the three insertion points

- Explain why unmasked self-attention without a position signal is permutation equivariant.
- Point to where sinusoids, RoPE, and ALiBi insert position: embeddings, Q/K geometry, or logits.
- Compute a RoPE relative phase and an ALiBi distance penalty on a tiny example.
- Compare full-pass and cached-chunk outputs while holding pairing, frequency schedule, position IDs, and permitted keys fixed.
- Treat configured context length as a claim that needs retrieval and task evidence at the deployed length.

## Common misconceptions

- `Order seems implicit`: Symptom: you say unmasked attention already knows sequence order. Cause: you skipped the permutation-equivariance check. Fix: start from content-only attention, then account separately for position signals and masking.
- `All methods sound the same`: Symptom: sinusoids, learned tables, RoPE, and ALiBi blur together. Cause: you aren't tracking the insertion point. Fix: embeddings vs Q/K geometry vs <span data-glossary="logit-bias">logit bias</span>.
- `RoPE rotates the wrong tensor`: Symptom: you apply RoPE to embeddings or V. Cause: routing and aggregation got merged. Fix: rotate Q and K after projection; leave V without a direct RoPE rotation.
- `Long context looks solved on paper`: Symptom: perplexity improves but retrieval still fails. Cause: you treated mathematical validity as behavioral proof. Fix: run passkey, retrieval, summarization, and target-task evals at the deployed length.
- `Any base change is enough`: Symptom: the config advertises a larger window but distant facts disappear. Cause: a new $\theta$ doesn't teach the model to use long-range evidence. Fix: pair geometry changes with an adaptation method, long-context data, and task-level checks.
- `Concatenate by default`: Symptom: width and projection cost balloon. Cause: you doubled the hidden width without accounting for downstream matrices. Fix: reproduce the checkpoint's position design; a new concatenated design can project back down or explicitly budget for a wider stack.

<!-- leetllm: mastery:end -->

```mastery-quiz
[
  {
    "question": "An unmasked, position-free attention block with dropout disabled gives output rows A=[2,1], B=[4,3], C=[6,5] and D=[8,7]. Its input order changes from A/B/C/D to C/A/D/B, with each token vector unchanged. Which output row order should the recomputed block produce?",
    "options": [
      "[2,1], [4,3], [6,5], [8,7]",
      "[5,6], [1,2], [7,8], [3,4]",
      "[8,7], [6,5], [4,3], [2,1]",
      "[6,5], [2,1], [8,7], [4,3]"
    ],
    "answer": "[6,5], [2,1], [8,7], [4,3]",
    "explanation": "Permutation equivariance moves outputs with the same token rows, giving C/A/D/B. Keeping the old row order would assert invariance; swapping coordinates or reversing the order is a different transformation. The conditions remove both positional signals and a fixed causal mask."
  },
  {
    "question": "A sine-first absolute position pair uses 0.25 radians per slot at position 3. A separate design concatenates content and position vectors, each of width 96, and widens its square attention projections from 96 to the combined width. What values does the position pair store, and by what factor does the number of entries in each projection matrix grow?",
    "options": [
      "[0.682, 0.732] and 4× as many entries",
      "[0.732, 0.682] and 4× as many entries",
      "[0.682, 0.732] and 2× as many entries",
      "[0.732, 0.682] and 2× as many entries"
    ],
    "answer": "[0.682, 0.732] and 4× as many entries",
    "explanation": "At position 3 the angle is 3 × 0.25 = 0.75 radians. Storing sine first gives [0.682, 0.732]. Concatenation doubles both the row count and the column count, so each matrix has 192² / 96² = 4 times as many entries. The pair [0.732, 0.682] puts cosine first. Counting only the rows gives 2×. Choosing the reversed pair with 2× makes both mistakes."
  },
  {
    "question": "One RoPE pair has fixed unrotated q=[2,0], k=[1,0] and frequency 0.25. Compare positions (m=7,n=4) with (m=37,n=34). The standard attention setup leaves V unrotated. Which score pair follows?",
    "options": [
      "0.732 and 0.732",
      "1.463 and 0.986",
      "1.463 and 1.463",
      "2.000 and 2.000"
    ],
    "answer": "1.463 and 1.463",
    "explanation": "The norm product is 2 and both offsets are −3, so both dot products are 2 cos(−0.75)≈1.463. The smaller 0.732 result drops the query magnitude. A shared shift changes absolute angles while preserving their difference; it does not require a direct rotation of V."
  },
  {
    "question": "A six-coordinate head stores adjacent rotary pairs in its first four coordinates: [1,2,3,4,5,6]. The last two coordinates are outside the rotary region. Which coordinate order converts it to a matching split-half convention without changing the represented pairs?",
    "options": [
      "[1,4,2,5,3,6]",
      "[1,3,2,4,5,6]",
      "[1,2,3,4,6,5]",
      "[3,1,4,2,5,6]"
    ],
    "answer": "[1,3,2,4,5,6]",
    "explanation": "The first four coordinates are [x₀,y₀,x₁,y₁]. Split halves require [x₀,x₁,y₀,y₁], producing [1,3,2,4], while the untouched suffix stays [5,6]. Changing pair order or mixing in suffix coordinates fails to preserve the same pair-to-frequency assignment. A checkpoint conversion must apply the matching permutation to both affected Q/K projection outputs and their biases."
  },
  {
    "question": "One RoPE pair encodes height and another encodes width. On each axis, the unrotated query and key both equal [1, 0], and the rotation is 0.25 radians per position. The query patch is at (3, 2) and the key patch is at (1, 1), in (height, width) order. What is the dot product of the rotated vectors before and after both patches shift by (7, 9)?",
    "options": [
      "0.732 then 0.732",
      "1.969 then 1.969",
      "1.846 then −1.429",
      "1.846 then 1.846"
    ],
    "answer": "1.846 then 1.846",
    "explanation": "The key is two rows and one column behind the query. The two pairs contribute cos(−0.5) + cos(−0.25) ≈ 1.846 in total. Moving both patches preserves both offsets. Combining the angles inside one cosine gives 0.732. Dropping the height offset makes the height contribution 1 and the total 1.969. Moving only the query leaves the key nine rows and ten columns behind, giving −1.429."
  },
  {
    "question": "An ALiBi query at 12 compares a visible key at 5. Its already-scaled content logit is 5.0. Two head slopes are 1/4 and 1/32. Which pair of logits enters softmax?",
    "options": [
      "6.750 and 5.219",
      "3.250 and 4.781",
      "1.750 and 0.219",
      "3.250 and 3.250"
    ],
    "answer": "3.250 and 4.781",
    "explanation": "Distance is 7. Subtract 7/4=1.75 and 7/32=0.21875 from the already-scaled 5.0, giving 3.25 and 4.78125. The positive alternatives add the bias; the small pair reports penalties rather than logits; equal penalties ignore the different head slopes. These finite past-key penalties are distinct from the future mask."
  },
  {
    "question": "Apply the stated NTK-aware base transform to rotary width 6 and extension scale 9. For pair indices 0,1,2, which frequency ratios new/original follow?",
    "options": [
      "[1,1/3,1/9]",
      "[1/9,1/9,1/9]",
      "[1,1/9,1/81]",
      "[1,1/√3,1/3]"
    ],
    "answer": "[1,1/3,1/9]",
    "explanation": "The ratio is scale raised to −2i/(d−2). With d = 6 the exponents are 0, −1/2, −1, so scale 9 gives 1, 1/3, 1/9. Uniform 1/9 is Position Interpolation instead; the other schedules use an incorrect denominator or exponent. The calculation describes geometry, not empirical length generalization."
  },
  {
    "question": "An attention head uses softmax at temperature 1. For each permitted key, the logit equals the rotated query–key dot product divided by the square root of the head width. The head now multiplies both rotated vectors by 1.2. By what factor does it scale the logits, and what temperature on the original logits gives the same weights for every input?",
    "options": [
      "1.20 and 0.833",
      "1.00 and 1.000",
      "1.44 and 0.694",
      "0.694 and 1.440"
    ],
    "answer": "1.44 and 0.694",
    "explanation": "Each term in the dot product picks up one factor of 1.2 from the query and one from the key. The head width stays fixed, so the logit multiplier is 1.2² = 1.44. Dividing the original logits by a temperature of 1 / 1.44 ≈ 0.694 gives the same weights. A multiplier of 1.20 counts one vector, and 1.00 treats the amplitude change as a pure rotation. Using 0.694 as the multiplier swaps the multiplier and the temperature."
  },
  {
    "question": "A cached chunk has query logical positions 51 and 54. Its cached keys are physically stored in the order [54,49,52], and their rotary coordinates are correct. If true means allowed, which permission rows preserve causal visibility in that physical storage order?",
    "options": [
      "Query 51: [true,true,false]; query 54: [true,true,true].",
      "Query 51: [false,true,false]; query 54: [true,true,true].",
      "Query 51: [false,true,true]; query 54: [false,true,true].",
      "Query 51: [true,false,true]; query 54: [true,true,true]."
    ],
    "answer": "Query 51: [false,true,false]; query 54: [true,true,true].",
    "explanation": "A query permits each key whose logical position is no greater than its own. In storage order [54,49,52], query 51 permits only key 49, while query 54 permits all three. Storage-column order does not define causal age. Correct RoPE cannot repair an incorrect permitted-key set."
  },
  {
    "question": "A deployment specification requires at most 8192 total prompt-plus-generation tokens, short-task accuracy at least 0.85, long-task accuracy at least 0.80, and cache computation matching the evaluated frequency schedule. Candidate A uses 6200 prompt+1800 generation tokens, scores 0.88/0.83 and recomputes the entire prefix under the evaluated schedule. Candidate B uses 6000+1500 tokens and scores 0.90/0.86, but changes only new-query frequencies while retaining old-schedule cached keys. Which evidence decision follows?",
    "options": [
      "A needs a shorter prompt; B satisfies the listed gates.",
      "A satisfies the listed gates; B satisfies the listed gates.",
      "A needs a shorter prompt; B needs consistent-cache recomputation.",
      "A satisfies the listed gates; B needs consistent-cache recomputation."
    ],
    "answer": "A satisfies the listed gates; B needs consistent-cache recomputation.",
    "explanation": "A totals 8000 tokens, within 8192, and meets both declared quality floors with a matching prefix. B meets its token and quality numbers but violates the consistent cache-schedule rule. Good task averages do not make mixed rotary schedules equivalent to the evaluated pass. Satisfying these listed checks does not grant an unstated approval for general release."
  }
]
```

> **Next:** Continue to [Layer Normalization: Pre-LN vs Post-LN](/learn/layer-normalization-pre-ln-post-ln). Position methods decide how attention scores depend on index and distance. <span data-glossary="layernorm">Layer normalization</span> decides whether the residual updates that follow those scores stay well scaled as the stack gets deeper.
