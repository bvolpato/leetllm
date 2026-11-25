---
{
  "id": "transformer-architecture-end-to-end",
  "title": "The Transformer Architecture End-to-End",
  "slug": "transformer-architecture-end-to-end",
  "section": "Core LLM Foundations",
  "category": "Transformer Architecture",
  "difficulty": "Medium",
  "order": 3,
  "coverImage": "illustrations/_generated/transformer_full_architecture_dark.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Anthropic",
    "Microsoft",
    "Amazon",
    "Apple",
    "Hugging Face"
  ],
  "shortDescription": "Follow `function returns the` through a causal decoder until the last row becomes a score for the next token.",
  "keyConceptsTested": [
    "Decoder-only Transformer forward path from tokens to next-token logits",
    "Queries, keys, values, scaled dot-product attention, and causal masking",
    "Multi-head shape bookkeeping",
    "Feed-forward sublayers, residual connections, and normalization",
    "Encoder-only, decoder-only, and encoder-decoder visibility rules",
    "Diagnosing mask leakage and shape errors"
  ],
  "aliases": [
    "gpt-to-modern-llms",
    "llm-lifecycle-training-to-deployment"
  ]
}
---

<!-- leetllm: edition:reference:start -->

Autocomplete has read `function returns the` and needs one more <span data-glossary="token">token</span>. `result` feels plausible, but picking it requires each token to carry its own information while `the` consults its history without peeking at the answer. What changes between that text and the final choice?

Follow one small decoder-only <span data-glossary="transformer">Transformer</span> from token IDs to next-token probabilities. Three token IDs become positioned vectors, causal attention exchanges context without peeking ahead, each block updates every row while preserving its width, and a final linear head scores the vocabulary. Small NumPy snippets unpack each operation one piece at a time, and linked <span data-glossary="pytorch">PyTorch</span> cells assemble the full decoder and train it on a tiny context-dependent corpus so you can watch attention learn to predict the right next token from scratch.

<!-- leetllm: audience:website:start -->The preceding [autoencoder lesson](/learn/autoencoders-vaes-generative-modeling-basics) squeezed an input through a narrow latent code. Here we keep one vector per token and let those vectors communicate. You'll reuse matrix multiplication, nonlinear layers, and the softmax calculation from [Softmax & Cross-Entropy](/learn/softmax-cross-entropy-optimization). The same differentiation rules support this forward pass.<!-- leetllm: audience:website:end --><!-- leetllm: audience:book:start -->The online companion's [autoencoder lesson](/learn/autoencoders-vaes-generative-modeling-basics) compresses an input through a narrow latent code. Here, a Transformer keeps one vector per token and lets those vectors communicate. Its forward pass uses matrix multiplication, nonlinear layers, and softmax. For the underlying gradient calculations, see the online companion's [Softmax & Cross-Entropy](/learn/softmax-cross-entropy-optimization) lesson. The same differentiation rules support this forward pass.<!-- leetllm: audience:book:end -->

Tracing the shapes across the forward pass keeps every layer concrete. With three tokens and width four, the hidden state stays `[3, 4]` through each block, and projecting the selected final row yields six vocabulary logits.

<figure>
  <img src="illustrations/_generated/transformer_full_architecture_dark.png" alt="A compact decoder processes the prompt function returns the. Three token IDs map to a 3 by 4 matrix of positioned vectors, pass through repeated causal decoder blocks while keeping shape 3 by 4, and multiply by a vocabulary head to yield 3 by 6 logits. The last row converts to next-token probabilities: result 35.3 percent, value 27.3, None 17.6, the 10.4, returns 6.9, and function 2.5." />
  <figcaption>The full path keeps the positioned stream at shape `[1, 3, 4]` through each decoder block, drawn here without its batch axis as `[3, 4]`, then maps the last position to six token scores. In this executed PyTorch example, `result` has the largest logit, 1.382, and probability about 35.3%. The separate hand calculation below makes one attention read inspectable.</figcaption>
</figure>

That path is what we mean by a Transformer here: a stack of attention and position-wise feed-forward updates that carries a same-width representation forward.

The architecture introduced in 2017 paired an encoder with a decoder for translation. A text-generation decoder-only model keeps the decoder's masked <span data-glossary="self-attention">self-attention</span> path and predicts each token from preceding context.[^vaswani2017][^radford2018]

## Tokens become positioned vectors

Begin at the input table with a six-word autocomplete vocabulary. These small integer IDs keep the forward pass readable, whereas production tokenizers define larger vocabularies:

| Text so far | Token IDs | Desired continuation |
|---|---|---|
| `function returns the` | `[0, 1, 2]` | likely `result` |

Our decoder maps each token ID to a learned vector, then adds the vector for its position. Moving `the` changes which position vector it receives.

Unmasked self-attention without position information is permutation equivariant: shuffle input rows, and its output rows follow the same shuffle. A fixed causal mask changes that argument because shuffling content changes which tokens precede which queries. Explicit positional mechanisms still give the decoder a direct way to distinguish positions and distances.[^vaswani2017]

Examples of positional mechanisms include:

1. **Fixed sinusoidal encodings**: The original 2017 Transformer generated sine and cosine waves of varying frequencies, allowing relative shifts to be expressed as linear transformations without adding learned parameters.[^vaswani2017]
2. **Learned absolute positional embeddings**: The original GPT and BERT use an embedding table $W_{\text{pos}} \in \mathbb{R}^{T_{\text{max}} \times d_{\text{model}}}$ and add row $t$ to the token vector.[^radford2018][^devlin2019] An unmodified table has no row beyond that range. Extending it requires a model change, and usable performance at longer lengths needs evaluation.
3. **Rotary Position Embedding (RoPE)**: LLaMA's 2023 architecture rotates pairs of query and key coordinates by position-dependent angles.[^su2021][^touvron2023] Their dot product depends on the content vectors and a rotation for relative distance $(m-n)$. Evaluate model quality when using positions beyond the trained context length.

Other positional designs include T5's learned relative-position biases on attention scores.[^raffel2020]

Our arithmetic uses small additive vectors to keep every coordinate inspectable by hand:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="positioned-token-vectors.py"
import numpy as np

tokens = ["function", "returns", "the"]
ids = np.array([0, 1, 2])
embedding_table = np.array([
    [1.0, 0.0, 0.4, 0.0],  # function
    [0.2, 1.0, 0.5, 0.0],  # returns
    [0.0, 0.3, 0.8, 1.0],  # the
    [0.1, 0.5, 1.0, 0.9],  # result
    [0.0, 0.1, 0.0, 0.1],  # None
    [0.2, 0.0, 0.4, 0.5],  # value
])
position = np.array([
    [0.00, 0.00, 0.00, 0.00],
    [0.05, 0.00, 0.00, 0.05],
    [0.10, 0.00, 0.00, 0.10],
])

x = embedding_table[ids] + position
print("tokens:", tokens)
print("ids shape:", ids.shape)
print("hidden shape:", x.shape)
print("last positioned vector:", np.round(x[-1], 2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tokens: ['function', 'returns', 'the']
ids shape: (3,)
hidden shape: (3, 4)
last positioned vector: [0.1 0.3 0.8 1.1]
```
<!-- leetllm: output:end -->

A row belongs to one token position, and a column is one feature of that position. Real models use far wider <span data-glossary="vector">vectors</span> and batches, but the axes mean the same thing:

| Axis | Tiny example | General name |
|---|---:|---|
| Number of sequences | omitted | `B` (batch size) |
| Token positions | `3` | `T` (sequence length) |
| Features per token | `4` | `d_model` (model width) |

The full vocabulary is `function`, `returns`, `the`, `result`, `None`, `value`, in that ID order. The output head will score those same six tokens. Input and output weights do not have to be tied, though a generated ID must remain meaningful when fed back into the embedding table.

## Attention lets a token read earlier tokens

At `the`, the model needs a useful read of its history. An <span data-glossary="recurrent-neural-network">RNN</span> transports information through one recurrent state. Self-attention takes a different route: every position computes a read from the visible positions, then blends their value vectors.

For a decoder, "visible" means the current and earlier tokens only. That rule lets the model process a whole training sequence without letting a later answer flow backward.

Each token produces three learned projections:

- A **query** asks what information this position needs.
- A **key** advertises what a position contains.
- A **value** carries information if the query matches its key.

Why separate queries, keys, and values instead of computing $X X^T$ directly? Direct self-matching forces symmetric raw scores (though row-wise softmax can still produce asymmetric weights when row denominators differ). Separate learned query and key projections let the model learn an asymmetric matching rule, while the value projection independently decides what information to extract.[^vaswani2017]

For one head, $W_q$ and $W_k$ map `d_model` to key width $d_k$, and $W_v$ maps to value width $d_v$ (usually equal to $d_k$). Comparing three query rows against three key rows produces a `[3, 3]` score matrix whose causal mask removes future entries next.

To see the multiplication, take one two-feature <span data-glossary="attention-head">attention head</span>. These handpicked arrays isolate the dot product and differ from the learned projections used by the complete model later:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="query-key-scores.py"
import numpy as np

q = np.array([
    [1.0, 0.0],  # function position
    [0.5, 1.0],  # returns position
    [0.2, 1.2],  # the position
])
k = np.array([
    [1.0, 0.0],
    [0.4, 1.0],
    [0.0, 0.8],
])
v = np.array([
    [1.0, 0.0],
    [0.3, 1.0],
    [0.0, 0.6],
])

raw_scores = q @ k.T
print("Q shape:", q.shape, "K shape:", k.shape, "V shape:", v.shape)
print("Q @ K.T shape:", raw_scores.shape)
print("raw score row for 'the':", np.round(raw_scores[2], 2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Q shape: (3, 2) K shape: (3, 2) V shape: (3, 2)
Q @ K.T shape: (3, 3)
raw score row for 'the': [0.2  1.28 0.96]
```
<!-- leetllm: output:end -->

There is one score for every query-key pair. That square `T x T` matrix also explains the quadratic cost of standard attention. Doubling `T` creates four times as many pair scores before the value mix.

Scores only decide where to read. After scaling and masking, softmax turns each row into weights, and multiplying those weights by `V` produces one mixed value row for each position. The `the` row becomes a two-feature update that the heads will merge back into model width.

### Scale before softmax

Scaled dot-product attention divides query-key scores by the square root of the head width before applying <span data-glossary="softmax">softmax</span>:

$$
\operatorname{Attention}(Q, K, V)
=
\operatorname{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V
$$

Why divide by $\sqrt{d_k}$? Consider the statistical distribution of raw scores. If the components of query $q \in \mathbb{R}^{d_k}$ and key $k \in \mathbb{R}^{d_k}$ are independent random variables with mean zero and variance one, their dot product is:

$$
q \cdot k = \sum_{i=1}^{d_k} q_i k_i
$$

Each individual product $q_i k_i$ has mean $\mathbb{E}[q_i k_i] = \mathbb{E}[q_i]\mathbb{E}[k_i] = 0$ and variance:

$$
\operatorname{Var}(q_i k_i) = \mathbb{E}[(q_i k_i)^2] - (\mathbb{E}[q_i k_i])^2 = \operatorname{Var}(q_i)\operatorname{Var}(k_i) = 1 \times 1 = 1
$$

Because the components are independent, their variances sum directly:

$$
\operatorname{Var}(q \cdot k) = \sum_{i=1}^{d_k} \operatorname{Var}(q_i k_i) = d_k
$$

Under those assumptions, the raw dot product's standard deviation grows as $\sqrt{d_k}$: 8 at width 64, or about 11.31 at width 128. Large score gaps push softmax near one-hot saturation, where its Jacobian entries $\frac{\partial s_i}{\partial z_j} = s_i(\delta_{ij}-s_j)$ collapse toward zero and shrink gradients.[^vaswani2017] Dividing by $\sqrt{d_k}$ keeps unit variance at initialization so attention starts in a responsive gradient regime.

The original Transformer used $d_{\text{model}}=512$ with $h=8$ heads ($d_k=64$). Compare unscaled versus scaled softmax on scores `[12.4, 9.1, 3.8]`:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="why-scale-attention.py"
import numpy as np

def softmax(values):
    shifted = values - values.max()
    exp = np.exp(shifted)
    return exp / exp.sum()

scores = np.array([12.4, 9.1, 3.8])
scaled = scores / np.sqrt(64)

print("unscaled weights:", np.round(softmax(scores), 3))
print("scaled scores:", np.round(scaled, 3))
print("scaled weights:", np.round(softmax(scaled), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
unscaled weights: [0.964 0.036 0.   ]
scaled scores: [1.55  1.138 0.475]
scaled weights: [0.499 0.33  0.17 ]
```
<!-- leetllm: output:end -->

The unscaled row puts nearly all attention mass on one key, while the scaled row spreads it across visible choices. Scaling reduces the width-related sharpening in the preceding statistical model. Learned projections can still produce sharp scores and confident choices.

Use the earlier `the` row to finish one attention read. Its raw scores `[0.2, 1.28, 0.96]` become `[0.141, 0.905, 0.679]` after division by $\sqrt{2}$. Softmax gives weights about `[0.21, 0.44, 0.35]`, and applying them to the three value rows produces the contextual vector `[0.34, 0.65]`. Vocabulary scores come later.

<figure>
  <img src="illustrations/_generated/shape_trace_pipeline_dark.png" alt="A separate two-dimensional hand calculation follows the query for the token the. Its scaled dot scores produce attention weights of about 0.21, 0.44, and 0.35 for function, returns, and the, and their value vectors combine to about [0.34, 0.65]. In the four-token training sequence, the future target result is masked from the query at the, and it is absent from the three-token inference calculation." />
  <figcaption>This two-dimensional hand example shows one weighted read. During training on the full text, the query at `the` masks the future target `result`, whereas that target key is not part of the three-token inference calculation shown above.</figcaption>
</figure>

## The causal mask prevents answer leakage

Training can process the positions in `function returns the result` in parallel within each layer, but position `the` is still responsible for predicting `result`. If its query can read the `result` representation, it sees the answer. A **<span data-glossary="causal-mask">causal mask</span>** sets future scores to negative infinity before softmax so those entries receive probability zero. Setting them to zero wouldn't work: $e^0 = 1$, so forbidden keys would still receive active attention weight. Using $-\infty$ guarantees $e^{-\infty} = 0$.

Each row in the causal table follows directly from position ordering: the `the` row can read `function`, `returns`, and `the`, while blocking `result`. The final row can see all four inputs because no later position appears in this sequence.

| Query position | Can read |
|---|---|
| `function` | `function` |
| `returns` | `function`, `returns` |
| `the` | `function`, `returns`, `the` |
| `result` | all four positions |

Here is a separate four-position score matrix that includes the future `the → result` cell. The earlier dot-product example uses three positions.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="causal-mask.py"
import numpy as np

scores = np.array([
    [2.0, 1.5, 0.5, 1.0],
    [1.0, 2.5, 1.5, 0.5],
    [0.5, 1.0, 3.0, 2.0],
    [1.5, 0.5, 1.0, 2.5],
])
future = np.triu(np.ones_like(scores, dtype=bool), k=1)
masked_scores = np.where(future, -np.inf, scores)

shifted = masked_scores - masked_scores.max(axis=-1, keepdims=True)
weights = np.exp(shifted)
weights /= weights.sum(axis=-1, keepdims=True)
assert np.all(weights[future] == 0.0)
assert np.allclose(weights.sum(axis=-1), 1.0)

print("masked weights:")
print(np.round(weights, 3))
print("future attention mass:", float(weights[future].sum()))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
masked weights:
[[1.    0.    0.    0.   ]
 [0.182 0.818 0.    0.   ]
 [0.067 0.111 0.821 0.   ]
 [0.213 0.078 0.129 0.579]]
future attention mass: 0.0
```
<!-- leetllm: output:end -->

The output shows `future attention mass: 0.0`. Read row `the` (row index `2`) as `[0.067, 0.111, 0.821, 0.000]`: its unrounded weights sum to one, and the `result` column is zero. If this next-token decoder assigns weight to a future input, inspect its mask and position alignment. The model could be reading an answer that won't exist at generation time. The mask stopped that leak. It still left `the` with only one weighted average of the visible values. What if that position needs a second, separate read of the same history?

```checkpoint
Why can't the representation at `the` attend to `result` while training a decoder-only next-token model?
---
`result` is the target token the `the` position is supposed to predict. Letting `the` read it would expose the answer before prediction, so training loss would no longer measure generation from preceding context.
```

## Heads run in parallel; blocks run in sequence

One head is that single average. A token often needs several different reads at once: one head might track syntactic dependencies (matching a verb to its subject `function`), while another tracks typing or semantic scoping, and a third tracks the immediate prior token.

**Multi-head attention** gives a block several such views: it projects model features into heads, applies attention independently in each head, concatenates their outputs, and projects back to `d_model`.[^vaswani2017] Each projection can use every input feature. Head 1 can draw on all original embedding coordinates before its projection selects a subspace.

$$
\operatorname{MultiHead}(Q, K, V) = \operatorname{Concat}(\operatorname{head}_1, \dots, \operatorname{head}_h) W^O
$$

Suppose our small model width is four and it has two heads, so each head owns two features. Splitting `[1, 3, 4]` into `[1, 2, 3, 2]` and merging back to `[1, 3, 4]` must preserve every token position:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="split-and-merge-heads.py"
import numpy as np

batch, tokens, d_model, heads = 1, 3, 4, 2
assert d_model % heads == 0
d_head = d_model // heads
projected = np.arange(batch * tokens * d_model).reshape(batch, tokens, d_model)

split = projected.reshape(batch, tokens, heads, d_head).transpose(0, 2, 1, 3)
merged = split.transpose(0, 2, 1, 3).reshape(batch, tokens, d_model)
assert np.array_equal(projected, merged)

print("all-heads shape:", split.shape)
print("merged shape:", merged.shape)
print("merge restores values:", bool(np.array_equal(projected, merged)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
all-heads shape: (1, 2, 3, 2)
merged shape: (1, 3, 4)
merge restores values: True
```
<!-- leetllm: output:end -->

The head axis describes independent work **inside one block**. The block axis is sequential depth: output from block 1 enters block 2. Stacked blocks usually have separate projection weights. Some architectures share weights across blocks. Mixing heads with blocks loses that dependency.

## A block alternates communication and local transformation

Attention lets token positions exchange information across sequence steps. The next sublayer changes each row on its own, using the same weights at every position. That **<span data-glossary="feed-forward-network">feed-forward network</span>** (FFN) is where a token's mixed context gets a per-position nonlinear transformation. Geva et al. interpreted FFNs in their studied language models as key-value memories: keys correlate with textual patterns, while values influence the output vocabulary distribution. In this interpretation, a neuron can respond to patterns and shape many output scores without storing only a single isolated fact.[^geva2021]

The original Transformer used two linear layers with a ReLU nonlinearity between them, widening from $d_{\text{model}}=512$ to $d_{\text{ff}}=2048$ (a $4\times$ expansion) and back:[^vaswani2017]

$$
\operatorname{FFN}(x) = \operatorname{ReLU}(xW_1 + b_1)W_2 + b_2
$$

The first projection widens the feature dimension; the second returns it to `d_model`, which keeps blocks stackable. This isolated FFN demo feeds in our positioned vectors to show `[3, 4] -> [3, 6] -> [3, 4]`. In a complete pre-LN block, the FFN instead receives the normalized stream after attention's residual addition. Bias terms are omitted here so the matrix sizes stay visible.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="position-wise-ffn.py"
import numpy as np

x = np.array([
    [1.00, 0.00, 0.40, 0.00],
    [0.25, 1.00, 0.50, 0.05],
    [0.10, 0.30, 0.80, 1.10],
])
w1 = np.array([
    [1.0, 0.0, 0.5, 0.0, 0.0, 0.2],
    [0.0, 1.0, 0.0, 0.5, 0.2, 0.0],
    [0.4, 0.2, 1.0, 0.0, 0.0, 0.5],
    [0.0, 0.2, 0.0, 1.0, 0.4, 0.0],
])
w2 = np.array([
    [0.3, 0.0, 0.0, 0.1],
    [0.0, 0.3, 0.1, 0.0],
    [0.2, 0.0, 0.3, 0.0],
    [0.0, 0.2, 0.0, 0.3],
    [0.1, 0.0, 0.0, 0.2],
    [0.0, 0.1, 0.2, 0.0],
])

expanded = np.maximum(0.0, x @ w1)
ffn_output = expanded @ w2
print("input shape:", x.shape)
print("expanded shape:", expanded.shape)
print("returned shape:", ffn_output.shape)
print("last-token update:", np.round(ffn_output[-1], 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
input shape: (3, 4)
expanded shape: (3, 6)
returned shape: (3, 4)
last-token update: [0.346 0.496 0.407 0.517]
```
<!-- leetllm: output:end -->

Each FFN multiplication maps token rows independently, producing token-by-feature matrices without row-to-row interaction. Attention's `Q @ K.T` multiplication instead produces token-to-token scores.

Gated FFNs add another way to transform features. The 2023 LLaMA architecture uses **<span data-glossary="swiglu">SwiGLU</span>** (Swish Gated Linear Unit):[^shazeer2020][^touvron2023]

$$
\operatorname{SwiGLU}(x) = (\operatorname{Swish}(x W_{\text{gate}}) \odot (x W_{\text{up}})) W_{\text{down}}
$$

Here, $\operatorname{Swish}(z)=z\sigma(z)$ is Swish with its parameter set to one, also called SiLU. Two upward projections run in parallel; the activated branch multiplies the other branch elementwise before $W_{\text{down}}$ returns to model width. The gate is an unconstrained scalar that can reverse a branch's sign or scale it above one.

Ignoring biases, three matrices at intermediate width $d_{\text{ff}}$ have $3d_{\text{model}}d_{\text{ff}}$ parameters. Matching a two-matrix FFN at width $4d_{\text{model}}$ gives $d_{\text{ff}}=\frac{8}{3}d_{\text{model}}$. LLaMA uses this sizing idea; other models choose other widths.[^shazeer2020][^touvron2023] The original Gemma report specifies **GeGLU**, with a GELU gate.[^gemmaTeam2024Architecture]

### Residual paths and normalization

A residual connection adds a sublayer result back to its input. Because attention and the FFN return to `d_model`, addition keeps the running stream at the same shape. It creates an identity path through deep stacks, following the residual-network concept from He et al.[^he2015]

Placement of normalization changes gradient paths and can affect optimization:

- **Post-LayerNorm (2017 original)**: Normalization sits directly in the residual stream after each addition:[^vaswani2017]
  $$
  x_{l+1} = \operatorname{LayerNorm}(x_l + \operatorname{SubLayer}(x_l))
  $$
  Its Jacobian has the form $J_{\text{LN}}(I+J_{\text{SubLayer}})$, which produces large gradients near the output at initialization, so Post-LN models typically need learning-rate warmup to train stably.[^xiong2020]
- **Pre-LayerNorm (used by GPT-2 and our decoder)**: Normalization precedes each sublayer, leaving the main residual addition untouched:[^radford2019code][^xiong2020]
  $$
  x_{l+1} = x_l + \operatorname{SubLayer}(\operatorname{LayerNorm}(x_l))
  $$
  Its Jacobian is $I+J_{\text{SubLayer}}J_{\text{LN}}$, preserving a clean identity path through the stack. Pre-LN trains more stably at initialization (though large models like LLaMA still use warmup as part of their schedule).[^xiong2020][^touvron2023]

Architectures also differ in the normalization statistic itself:

- **LayerNorm**: Centers by subtracting mean $\mu$, then scales by standard deviation $\sqrt{\sigma^2 + \epsilon}$ with learned scale $\gamma$ and shift $\beta$.[^ba2016]
- **RMSNorm**: Divides by a root-mean-square statistic without subtracting the feature mean:
  $$
  \operatorname{RMSNorm}(x) = \frac{x}{\operatorname{RMS}(x)} \odot \gamma, \quad \text{where } \operatorname{RMS}(x) = \sqrt{\frac{1}{d} \sum_{i=1}^d x_i^2 + \epsilon}
  $$
  Dropping mean centering and the additive shift simplifies the kernel while preserving comparable quality, which is why LLaMA and Gemma adopt RMSNorm.[^zhang2019][^touvron2023][^gemmaTeam2024Architecture]

LayerNorm puts each row near mean `0` and <span data-glossary="variance">variance</span> `1`, and adding the update leaves the residual output at shape `[2, 4]`. The code below simulates that pre-normalization order with a small update.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="pre-normalized-residual.py"
import numpy as np

def normalize(x, eps=1e-5):
    mean = x.mean(axis=-1, keepdims=True)
    variance = ((x - mean) ** 2).mean(axis=-1, keepdims=True)
    return (x - mean) / np.sqrt(variance + eps)

x = np.array([
    [1.0, 2.0, 0.0, 1.0],
    [0.2, 0.4, 0.8, 0.6],
])
normalized = normalize(x)
sublayer_update = 0.1 * normalized
residual_output = x + sublayer_update

print("normalized means:", np.round(normalized.mean(axis=-1), 6))
print("normalized variances:", np.round(normalized.var(axis=-1), 4))
print("residual output shape:", residual_output.shape)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
normalized means: [0. 0.]
normalized variances: [1.     0.9998]
residual output shape: (2, 4)
```
<!-- leetllm: output:end -->

The small `eps` keeps division defined even for a constant row. It also explains why the variances are slightly below one. Learned scale and offset can change those statistics afterward; mean zero and variance one describe the normalized values before those learned affine terms. In the block view, follow the attention update into `x₁`, then the FFN update into `x₂`. Both additions preserve `[3, 4]`.

<figure>
  <img src="illustrations/_generated/pre_ln_transformer_block_dark.png" alt="Pre-LN and Post-LN blocks compared left to right across the same 3 by 4 stream. In Pre-LN, a direct identity skip path runs unbroken from input X through two residual additions to output Y while each branch applies LayerNorm before Attention or FFN. In Post-LN, LayerNorm sits directly on the main spine after each residual addition." />
  <figcaption>Follow each residual route through both sublayers. Pre-LN adds the unchanged stream to each branch update before the next normalization, whereas Post-LN normalizes each sum. The direct route yields an identity contribution in Pre-LN, while derivatives through each branch still contribute to the full gradient.</figcaption>
</figure>

## Implement masked attention in PyTorch

The NumPy example exposed the mask entry by entry. Now implement the same causal multi-head self-attention rule as a reusable layer. The projections are learned linear maps, and the mask is built from token positions. Calling `masked_fill` enforces that visibility rule by turning every future score into negative infinity before softmax.

Trace the shapes before running it: `[1, 4, 8]` becomes `[1, 2, 4, 4]` for each of `q`, `k`, and `v`; scores and weights stay `[1, 2, 4, 4]`; merging heads returns `[1, 4, 8]`. The largest future weight should be exactly zero.

<!-- leetllm: test, id=causal-attention, deps=torch, output=show -->
```python title="causal-self-attention.py"
import math
import torch
from torch import nn

class CausalSelfAttention(nn.Module):
    def __init__(self, d_model=8, heads=2):
        super().__init__()
        if d_model <= 0 or heads <= 0 or d_model % heads != 0:
            raise ValueError("d_model and heads must be positive; heads must divide d_model")
        self.heads = heads
        self.d_head = d_model // heads
        self.qkv = nn.Linear(d_model, 3 * d_model, bias=False)
        self.out = nn.Linear(d_model, d_model, bias=False)

    def forward(self, x):
        if x.ndim != 3 or x.shape[-1] != self.qkv.in_features:
            raise ValueError("expected [batch, tokens, d_model] input")
        if x.shape[1] == 0:
            raise ValueError("at least one token is required")
        batch, tokens, d_model = x.shape
        q, k, v = self.qkv(x).chunk(3, dim=-1)
        def split_heads(tensor):
            return tensor.view(batch, tokens, self.heads, self.d_head).transpose(1, 2)
        q, k, v = map(split_heads, (q, k, v))

        scores = q @ k.transpose(-2, -1) / math.sqrt(self.d_head)
        future = torch.triu(
            torch.ones(tokens, tokens, dtype=torch.bool, device=x.device),
            diagonal=1,
        )
        weights = torch.softmax(scores.masked_fill(future, float("-inf")), dim=-1)
        mixed = weights @ v
        merged = mixed.transpose(1, 2).contiguous().view(batch, tokens, d_model)
        return self.out(merged), weights

torch.manual_seed(4)
x = torch.randn(1, 4, 8)
attention = CausalSelfAttention()
output, weights = attention(x)
future = torch.triu(torch.ones(4, 4, dtype=torch.bool), diagonal=1)
assert torch.all(weights[0, :, future] == 0)
assert torch.allclose(weights.sum(dim=-1), torch.ones_like(weights.sum(dim=-1)))

print("attention output shape:", tuple(output.shape))
print("weights shape:", tuple(weights.shape))
print("largest future weight:", f"{weights[0, :, future].max().item():.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
attention output shape: (1, 4, 8)
weights shape: (1, 2, 4, 4)
largest future weight: 0.000000
```
<!-- leetllm: output:end -->

The output shape matches the input shape, and the `[batch, heads, tokens, tokens]` weight <span data-glossary="tensor">tensor</span> exposes each head's routing decisions. The zero future weight is the causal invariant in PyTorch form.

The PyTorch cell uses random inputs to test shapes and visibility separately from the hand-worked values. It omits padding, dropout, and a KV cache. Every query has a real token on its diagonal; with finite unmasked scores, no row is fully masked. Input validation also rejects zero width, incompatible shapes, and empty token sequences.

`torch.nn.functional.scaled_dot_product_attention` (SDPA) implements the same attention operation and chooses a backend based on its inputs and device. Eligible fused GPU kernels can avoid storing full score and weight matrices; a math fallback may store them. Backend changes can alter floating-point rounding. This API returns the mixed values; inspectable attention weights require a separate calculation.[^pytorchSdpaDocs2026]

In SDPA, a boolean mask's `True` means **allow**, the inverse of our `future` mask passed to `masked_fill`. SDPA defaults to `dropout_p=0.0`. If your module passes a dropout probability during training, pass zero during evaluation. Calling `.eval()` on the module does not override the argument. Keep the preceding Python session open for this comparison:

<!-- leetllm: test, id=sdpa-comparison, continue=causal-attention, deps=torch, output=show -->
```python title="sdpa-mask-and-cache-alignment.py"
from torch.nn import functional as F

torch.manual_seed(11)
q, k, v = [torch.randn(1, 2, 4, 4) for _ in range(3)]
future = torch.triu(torch.ones(4, 4, dtype=torch.bool), diagonal=1)
scores = q @ k.transpose(-2, -1) / math.sqrt(4)
dense = scores.masked_fill(future, float("-inf")).softmax(-1) @ v
causal = F.scaled_dot_product_attention(q, k, v, is_causal=True, dropout_p=0.0)
allowed = F.scaled_dot_product_attention(q, k, v, attn_mask=~future, dropout_p=0.0)

# One query at absolute position 3 may read all cached keys at positions 0..3.
last_query = F.scaled_dot_product_attention(
    q[:, :, -1:, :], k, v,
    attn_mask=torch.ones(1, 4, dtype=torch.bool), dropout_p=0.0,
)
misaligned = F.scaled_dot_product_attention(
    q[:, :, -1:, :], k, v, is_causal=True, dropout_p=0.0,
)
only_first_key = torch.allclose(misaligned, v[:, :, :1, :], atol=1e-6)
assert only_first_key and not torch.allclose(misaligned, last_query)
checks = [torch.allclose(causal, dense, atol=1e-6),
          torch.allclose(allowed, dense, atol=1e-6),
          torch.allclose(last_query, dense[:, :, -1:, :], atol=1e-6)]
assert all(checks)
print("causal API matches dense:", checks[0])
print("True-means-allow mask matches:", checks[1])
print("cached last query matches:", checks[2])
print("misaligned cached query reads only key zero:", only_first_key)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
causal API matches dense: True
True-means-allow mask matches: True
cached last query matches: True
misaligned cached query reads only key zero: True
```
<!-- leetllm: output:end -->

For a non-square query-key layout, SDPA's `is_causal=True` uses upper-left alignment. A `[1,4]` mask then exposes only key zero, which is wrong for our query at absolute position three. Its sole softmax weight is one, so the returned vector is exactly that first key's value, whatever the query scores. The final check catches this silent error, which still has a valid output shape. Use a mask or causal-bias object aligned to the actual query and cached-key positions. Chunked decoding needs the same care.[^pytorchSdpaDocs2026]

## Assemble one decoder block

Attention now returns a same-width update, so it can sit inside a full pre-normalized block. Read the sequence before the code: normalize, attend, add; normalize, widen through the FFN, return to width eight, and add again. For input `[2, 4, 8]` and `d_ff=24`, every residual merge should still be `[2, 4, 8]`.

PyTorch's `LayerNorm` includes the learned scale and offset that the earlier NumPy calculation omitted. This block uses GELU instead of the original Transformer's ReLU, the same activation family as GPT-2's MLP. GPT-2 uses a tanh approximation; `nn.GELU()` below uses the default exact formulation. Either way, the FFN's structural role stays the same: widen, transform, and return to `d_model`.[^hendrycks2016][^radford2019code]

Continue in the same Python session so `CausalSelfAttention` remains defined. The attention module returns both its update and its weights; the block needs only the update for the residual addition.

<!-- leetllm: test, id=decoder-block, continue=sdpa-comparison, deps=torch, output=show -->
```python title="decoder-block.py"
class DecoderBlock(nn.Module):
    def __init__(self, d_model=8, heads=2, d_ff=24):
        super().__init__()
        self.norm1 = nn.LayerNorm(d_model)
        self.attention = CausalSelfAttention(d_model, heads)
        self.norm2 = nn.LayerNorm(d_model)
        self.ffn = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Linear(d_ff, d_model),
        )

    def forward(self, x):
        update, _ = self.attention(self.norm1(x))
        x = x + update
        x = x + self.ffn(self.norm2(x))
        return x

torch.manual_seed(5)
x = torch.randn(2, 4, 8, requires_grad=True)
block = DecoderBlock()
output = block(x)
output.square().mean().backward()
assert output.shape == x.shape
assert x.grad is not None and torch.isfinite(x.grad).all()

print("input -> output:", tuple(x.shape), "->", tuple(output.shape))
print("input gradient is finite:", bool(torch.isfinite(x.grad).all()))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
input -> output: (2, 4, 8) -> (2, 4, 8)
input gradient is finite: True
```
<!-- leetllm: output:end -->

The finite-gradient check catches a broken backward pass for this input. A deep stack's training behavior depends on its depth, initialization, data, and optimization settings. The block produces contextual vectors with the same `[B, T, d_model]` shape as its input, so another block can consume them.

## Project the final position into a vocabulary

The block stack has finished its same-width work. The vocabulary head changes the stream's output width from model features to token scores. GPT-2 applies a final `ln_f` normalization immediately before computing logits.[^radford2019code]

A learned output matrix converts each hidden vector into one raw score per vocabulary item. These scores are <span data-glossary="logits">logits</span>. Vaswani et al. share the output matrix with token embeddings; GPT-2 reuses `wte` similarly.[^vaswani2017][^radford2019code] With a common vocabulary and width, **weight tying** replaces two $V \times d_{\text{model}}$ weight arrays with one shared array. That halves those two arrays' parameters, not the whole model, activation memory, or vocabulary-projection computation. The worked module below keeps a separate `output_weight` so the matrix multiply stays visible.

Now assemble the complete decoder and watch it actually **learn**. Continue in the same Python session so `DecoderBlock` stays defined. Instead of rigging hand-picked weights to fake a prediction, we train a tiny `TinyDecoder` (width 8, 2 heads, 1 block) for 150 steps of Adam on two contrasting four-token sequences:

- `function returns the` $\to$ `result`
- `value returns the` $\to$ `None`

Notice the puzzle: both prompts end with the exact same two tokens (`returns the`). A model that only looks at the last token can never tell whether `result` or `None` comes next. To drive cross-entropy loss near zero, causal self-attention at position `the` **must** reach back to position 0 (`function` vs `value`) and route that context into the final logits!

<!-- leetllm: test, id=complete-decoder, continue=decoder-block, deps=torch, output=show -->
```python title="train-tiny-decoder.py"
vocab = ["function", "returns", "the", "result", "None", "value"]

class TinyDecoder(nn.Module):
    def __init__(self, vocab_size=6, max_len=4, d_model=8, heads=2, d_ff=16):
        super().__init__()
        self.tok_emb = nn.Embedding(vocab_size, d_model)
        self.pos_emb = nn.Embedding(max_len, d_model)
        self.block = DecoderBlock(d_model=d_model, heads=heads, d_ff=d_ff)
        self.final_norm = nn.LayerNorm(d_model)
        self.head = nn.Linear(d_model, vocab_size, bias=False)

    def forward(self, ids):
        positions = torch.arange(ids.size(1), device=ids.device)
        x = self.tok_emb(ids) + self.pos_emb(positions)
        x = self.block(x)
        return self.head(self.final_norm(x))

torch.manual_seed(7)
model = TinyDecoder()
# Two sequences sharing "returns the" so attention must read token 0
seqs = torch.tensor([
    [0, 1, 2, 3],  # function returns the result
    [5, 1, 2, 4],  # value    returns the None
])
inputs, targets = seqs[:, :-1], seqs[:, 1:]

with torch.no_grad():
    p_before = model(inputs)[0, -1].softmax(dim=-1)[3].item()

opt = torch.optim.Adam(model.parameters(), lr=0.05)
for step in range(150):
    logits = model(inputs)
    loss = F.cross_entropy(logits.reshape(-1, len(vocab)), targets.reshape(-1))
    opt.zero_grad()
    loss.backward()
    opt.step()

model.eval()
with torch.no_grad():
    logits = model(inputs)
    probs = logits[:, -1].softmax(dim=-1)

assert logits.shape == (2, 3, len(vocab))
print(f"final cross-entropy loss: {loss.item():.4f}")
print(f"P(result | function returns the): {p_before:.3f} -> {probs[0, 3].item():.3f}")
print(f"P(None   | value    returns the): {probs[1, 4].item():.3f}")
print("top predictions:", [vocab[i] for i in probs.argmax(dim=-1).tolist()])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
final cross-entropy loss: 0.0001
P(result | function returns the): 0.077 -> 1.000
P(None   | value    returns the): 1.000
top predictions: ['result', 'None']
```
<!-- leetllm: output:end -->

> **Key insight:** Both prompts end in `returns the`, yet the trained decoder assigns over 99% probability to `result` after `function` and over 99% to `None` after `value`. That separation is impossible from the last token alone: causal attention learned to pull the subject from position 0 into the final hidden row.

The projection applies the vocabulary head independently at every position (`[2, 3, 8] -> [2, 3, 6]`), so slicing the last position before or after projection produces the exact same six logits. Choosing the largest logit is **greedy decoding**, which appends `result` to make `function returns the result`.

Alternatively, sampling introduces temperature scaling $T > 0$ to soften or sharpen the logits before softmax:

$$
P(w_i) = \frac{\exp(\text{logit}_i / T)}{\sum_j \exp(\text{logit}_j / T)}
$$

As $T \to 0^+$, probability concentrates on the highest logit; at $T = 1$, softmax is unscaled; as $T \to \infty$, probabilities flatten toward uniform. Always subtract the row maximum before dividing by a very small temperature to prevent overflow.

<!-- leetllm: audience:website:start -->To run another step, add a fourth row to the positional table as well as appending the new token ID. Our three-position demo isn't an unlimited text generator. Optimized serving reuses earlier attention keys and values through a <span data-glossary="kv-cache">KV cache</span> instead of recomputing them for every new token.[^huggingface2026kvcache] We haven't implemented that optimization here. The next lesson turns this single step into a generation loop and a training objective.<!-- leetllm: audience:website:end --><!-- leetllm: audience:book:start -->To run another step, add a fourth row to the positional table as well as appending the new token ID. Our three-position demo isn't an unlimited text generator. Optimized serving reuses earlier attention keys and values through a <span data-glossary="kv-cache">KV cache</span> instead of recomputing them for every new token.[^huggingface2026kvcache] We haven't implemented that optimization here. This is one forward step: autoregressive generation repeats it after appending a selected token, while training compares predicted scores with target tokens.<!-- leetllm: audience:book:end -->

## Encoder, decoder, and encoder-decoder visibility

Decoder-only generation is one member of the Transformer family. Once the job changes, the visibility rule must change with it: classification can use the whole input, while translation needs a full source plus a causal target. Compare which positions each variant may read:

| Variant | Visibility rule | Suitable lesson example | Representative source |
|---|---|---|---|
| Encoder-only | Each input position can read both left and right context | Classify a complete snippet as Python code or prose | BERT[^devlin2019] |
| Decoder-only | Each position can read only itself and prior tokens | Generate the next token of `function returns the` | GPT, Llama[^radford2018][^touvron2023] |
| Encoder-decoder | Encoder reads source; decoder reads source plus prior output tokens | Translate a short docstring from English to another language | T5[^raffel2020] |

<figure>
  <img src="illustrations/_generated/encoder_decoder_variants_dark.png" alt="Three larger visibility patterns compare Transformer families. Encoder-only self-attention can read every input position; decoder-only self-attention reads the current and earlier positions; encoder-decoder target self-attention is causal while each target query can read every source position." />
  <figcaption>Rows are queries and columns are keys. The encoder-only matrix is fully visible; the decoder-only matrix is lower triangular. In encoder-decoder models such as T5, target self-attention remains causal while cross-attention reads the encoded source.</figcaption>
</figure>

For this autocomplete task, a decoder-only design gives a direct training and generation path:

1. **Targets from ordinary text**: Shifting a sequence by one token produces next-token labels without manual annotation. (Encoder-decoder pretraining like T5 similarly creates self-supervised targets by corrupting text spans and predicting the missing pieces.[^raffel2020])
2. **Prompt conditioning**: Instructions and examples sit right in front of generation in the same token stream, with no separate cross-attention module.
3. **Reusable attention state**: During autoregressive decoding, caching earlier keys and values avoids recomputing the prefix at every step.[^huggingface2026kvcache]
4. **Predictable scaling**: Language-model loss follows smooth power-law trends across model size, data, and compute, which helps teams budget training runs.[^kaplan2020]

In self-attention, queries, keys, and values come from one sequence. In encoder-decoder **<span data-glossary="cross-attention">cross-attention</span>**, decoder queries read keys and values produced by the encoder. A plain decoder-only text generator has no separate source sequence, so its core path is causal self-attention.

## From GPT-1 to modern decoder architectures

The causal decoder above became the blueprint for modern large language models through four milestones:

1. **GPT-1 (2018, 117M):** Generative pretraining on BooksCorpus followed by per-task linear heads and supervised fine-tuning.[^radford2018]
2. **GPT-2 (2019, 1.5B):** Moved normalization to Pre-LN with a final `ln_f` and showed zero-shot task transfer from prompt cues (`TL;DR:`) without updating weights.[^radford2019]
3. **GPT-3 (2020, 175B on 300B tokens):** Unlocked **in-context few-shot learning**, where prompt demonstrations steer next-token predictions with zero gradient updates.[^brown2020]
4. **InstructGPT (2022) and modern alignment:** Base decoders extend documents rather than following instructions. Three-stage RLHF (SFT, reward modeling, PPO) and later preference objectives like DPO turned raw text predictors into conversational assistants.[^ouyang2022] Match base checkpoints to fine-tuning and instruct/chat checkpoints (with their exact chat templates[^huggingface2026chattemplates]) to interactive turns, and remember that **"open weights"** means downloadable tensors under specific license terms rather than unrestricted open source.[^meta2023OriginalLlamaRelease][^osi2024]

### Modern block upgrades, KV cache compression, and MoE

Frontier decoders kept the exact same residual-stream skeleton while upgrading four internal components for training stability and serving efficiency:

- **Pre-LN + RMSNorm, RoPE, and SwiGLU:** Modern stacks like LLaMA and Gemma combine Pre-LN with RMSNorm (dropping mean-centering), SwiGLU gated FFNs at width $\frac{8}{3}d$, and RoPE rotations where $R_{\Theta, m}^\top R_{\Theta, n} = R_{\Theta, n - m}$ makes dot products depend strictly on relative offset $n - m$.[^touvron2023][^su2021][^shazeer2020]
- **Prefill, decode, and Grouped-Query Attention (GQA):** Serving runs in two distinct phases: **prefill** processes all $T$ prompt tokens in parallel (compute-bound, high weight reuse) and populates each layer's <span data-glossary="kv-cache">KV cache</span>; **decode** emits one token per step (memory-bandwidth bound at small batch sizes). For batch $B$, sequence length $L$, and $P$ bytes per element (2 for FP16/BF16), raw KV cache memory scales directly with KV head count:

$$
\text{Memory}_{\text{KV}} = 2 \times B \times L \times n_{\text{layers}} \times n_{\text{kv\_heads}} \times d_{\text{head}} \times P
$$

  Sharing KV heads across query groups cuts that payload linearly: Multi-Query Attention (**MQA**, $n_{\text{kv}} = 1$)[^shazeer2019] and Grouped-Query Attention (**GQA**, $g$ shared KV heads)[^ainslie2023] shrink cache footprint by $n_q / n_{\text{kv}}$. At $B=8, L=8192$, 32 layers, $d_{\text{head}}=128$, BF16, 32-head MHA uses **32 GiB**, 8-head GQA drops to **8 GiB**, and MQA drops to **1 GiB**.
- **Sparse Mixture-of-Experts (MoE):** Replaces each dense FFN with $E$ experts and a router executing only the top-$k$ per token (for example, Mixtral 8x7B holds **47B total parameters** while running **13B active parameters** per token).[^jiang2024] Active parameters govern per-token FLOPs, while **all total parameters** must fit in resident GPU VRAM unless offloaded.
- **Long context and lost-in-the-middle recall:** Accepting 128k or 1M tokens reflects input capacity, not flat recall. Liu et al. swept an answer-bearing passage across 20 retrieved slots and observed a **U-shaped curve** with sharp recall drops in the middle.[^liu2023lost] Place decisive evidence near the start or end of the prompt and run controlled slot sweeps when evaluating long-context workloads.

## Diagnose a broken forward pass

When a forward pass fails, do not inspect every weight first. Identify which invariant broke: visibility, tensor shape, device placement, or normalization. The symptom usually narrows the search:

| Symptom | Likely cause | Check |
|---|---|---|
| Training loss looks suspiciously tiny, but generation fails | Future tokens leaked through attention | Assert masked future attention mass is zero |
| Head split crashes or silently produces the wrong shape | `d_model` isn't divisible by `heads`, or axes were transposed incorrectly | Check `[B, H, T, d_head]` then merge back to `[B, T, d_model]` |
| Attention works on CPU but fails after moving the block to a <span data-glossary="gpu">GPU</span> | Causal mask stayed on CPU while scores moved to the accelerator | Create the mask on `x.device` |
| A block can't be stacked with another block | FFN or output projection changed model width too early | Keep block output at `d_model`, and project to vocabulary only at the end |
| Manual softmax produces `NaN` | A row was fully masked, so subtracting its maximum computes $-\infty - (-\infty)$ | Give every real query a visible key, and handle fully padded queries explicitly |
| Changing temperature leaves probabilities unchanged | Probability entries were divided by $T$ and then renormalized, so the factor cancels | Scale logits before softmax, knowing equal logits remain uniform at every positive temperature |

Use a deliberately broken mask to inspect <span data-glossary="feature-leakage">leakage</span> directly: the unmasked matrix assigns positive mass to future cells, whereas the causal version reduces that mass to `0.000`.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="detect-mask-leakage.py"
import numpy as np

scores = np.array([
    [2.0, 5.0, 4.0],
    [1.0, 2.0, 6.0],
    [0.5, 1.0, 2.0],
])
future = np.triu(np.ones_like(scores, dtype=bool), k=1)

def softmax_rows(matrix):
    exp = np.exp(matrix - matrix.max(axis=-1, keepdims=True))
    return exp / exp.sum(axis=-1, keepdims=True)

unmasked = softmax_rows(scores)
masked = softmax_rows(np.where(future, -np.inf, scores))
print("unmasked future mass across rows:", f"{unmasked[future].sum():.3f}")
print("masked future mass across rows:", f"{masked[future].sum():.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
unmasked future mass across rows: 1.940
masked future mass across rows: 0.000
```
<!-- leetllm: output:end -->

The unmasked total exceeds one because it adds probability mass from several separately normalized rows. Each row still sums to one. A zero future total checks the mask. Also change a future input and confirm that earlier outputs stay fixed; this checks for leakage elsewhere in the block.

<!-- leetllm: mastery:start -->

## Test causality through the whole block

Continue the PyTorch session. Replace the final token in the prompt with a different token while keeping the first two positions fixed. Causality requires the first two output rows to stay identical, even after attention, the FFN, and residual additions, while the last row changes.

<!-- leetllm: test, continue=complete-decoder, deps=torch, output=show -->
```python title="future-input-invariance.py"
prompt = inputs[:1]                # [function, returns, the]
changed = prompt.clone()
changed[:, -1] = 4                 # [function, returns, None]
with torch.no_grad():
    original_logits = model(prompt)
    changed_logits = model(changed)

prefix_unchanged = torch.allclose(original_logits[:, :-1], changed_logits[:, :-1], atol=1e-6)
last_changed = not torch.allclose(original_logits[:, -1], changed_logits[:, -1])
assert prefix_unchanged and last_changed
print("earlier outputs unchanged:", prefix_unchanged)
print("last output changed:", last_changed)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
earlier outputs unchanged: True
last output changed: True
```
<!-- leetllm: output:end -->

Try removing `masked_fill` in `CausalSelfAttention`. The earlier outputs should now change, causing this test to fail. Keep dropout disabled for this comparison; otherwise random dropout masks can change outputs even when causality is correct.

```checkpoint
You double the prompt from 3 tokens to 6, keeping width 4 and two heads. Which tensors grow fourfold, and which only double?
---
Each head's score and attention-weight matrices grow from `[3,3]` to `[6,6]`, four times as many entries. Hidden states, Q/K/V, and FFN activations double their token dimension. Model parameter shapes don't change. This describes the explicit full matrices in our implementation, not every optimized attention kernel's memory use.
```

```checkpoint
You replace the FFN's GELU with no activation at all. The code still preserves shape. What capability disappears from that sublayer?
---
Two consecutive affine transformations without an intervening nonlinearity combine into one affine map: $W_1W_2$ with bias $b_1W_2+b_2$. Without biases, it is linear. Expansion alone doesn't provide nonlinear per-token transformation. The overall Transformer remains nonlinear because attention and normalization remain, but this FFN loses that additional nonlinearity.
```

```checkpoint
The attention output is `[1,3,4]`, but you change the FFN's final projection to width 6. Why can't the residual addition be repaired just by reshaping?
---
The residual has 12 entries and the FFN update has 18. More importantly, addition must match the same token and feature coordinates. Project the six-wide update back to four features with a learned map; don't reinterpret token or feature axes to hide the mismatch.
```

<!-- leetllm: mastery:end -->

```mastery-quiz
[
  {
    "question": "A token embedding is [0.5, -1.0, 2.0] and its additive position vector is [0.2, 0.1, -0.3]. Which input row enters the first block?",
    "options": [
      "[0.5, -1.0, 2.0]",
      "[0.2, 0.1, -0.3]",
      "[0.7, -0.9, 1.7]",
      "[0.3, -1.1, 2.3]"
    ],
    "answer": "[0.7, -0.9, 1.7]",
    "explanation": "Add each position coordinate to the matching embedding coordinate. The sums are 0.5 + 0.2 = 0.7, -1.0 + 0.1 = -0.9, and 2.0 + (-0.3) = 1.7. The row [0.5, -1.0, 2.0] omits position, and [0.2, 0.1, -0.3] omits the embedding. Subtracting the position vector gives [0.3, -1.1, 2.3]."
  },
  {
    "question": "An attention query [1, -1] reads keys [2, 0] and [0, 1], with values [3, 0] and [0, 6]. At key width 2, which approximate read and interpretation follow?",
    "options": [
      "[2.679, 0.642] as a weighted feature mixture.",
      "[2.858, 0.285] as a weighted feature mixture.",
      "[2.679, 0.642] as next-token vocabulary probabilities.",
      "[1.500, 3.000] as next-token vocabulary probabilities."
    ],
    "answer": "[2.679, 0.642] as a weighted feature mixture.",
    "explanation": "Raw scores are 2 and -1. Dividing by sqrt(2) and normalizing exponentials gives weights near 0.893 and 0.107, so weighted values give [3*0.893, 6*0.107], near [2.679, 0.642]. Omitting scaling gives about [2.858, 0.285], and attention coordinates remain feature vectors rather than vocabulary probabilities."
  },
  {
    "question": "A cached SDPA query is at absolute position 7 and its keys are at positions 0 through 7. With shape [1,8], is_causal=True unexpectedly returns exactly the first key's value. Which fix and mask meaning fit this API?",
    "options": [
      "Keep the upper-left mask where boolean True means allow.",
      "Keep the upper-left mask where boolean True means block.",
      "Use an absolute-position-aligned mask where boolean True means block.",
      "Use an absolute-position-aligned mask where boolean True means allow."
    ],
    "answer": "Use an absolute-position-aligned mask where boolean True means allow.",
    "explanation": "The non-square upper-left causal bias permits only key zero for one query. The real last query may read all eight keys, so construct an explicit position-aligned mask. In SDPA a boolean True permits participation, unlike a future-is-True mask for masked_fill."
  },
  {
    "question": "An equal-split model receives [B=3,T=7,d=18] and has 3 query heads per block. Which query and score shapes and block dependency are correct?",
    "options": [
      "Q [3,3,7,6] and scores [3,3,7,7] while blocks share the original input in parallel.",
      "Q [3,3,7,6] and scores [3,3,7,7] where block 2 consumes block 1.",
      "Q [3,3,3,18] and scores [3,3,3,3] where block 2 consumes block 1.",
      "Q [3,3,7,18] and scores [3,3,7,7] while blocks share the original input in parallel."
    ],
    "answer": "Q [3,3,7,6] and scores [3,3,7,7] where block 2 consumes block 1.",
    "explanation": "Head width is 18/3=6, every head retains all seven positions, and each query scores seven keys. Heads may run in parallel inside a block, while blocks form a sequential residual-stream chain. Copying width 18 into each equal-split head or splitting tokens changes the attention layout."
  },
  {
    "question": "A constant row [5,5,5] uses unit learned scales, zero LayerNorm shift and a small positive epsilon. Which LayerNorm and RMSNorm outputs and Pre-LN gradient property follow?",
    "options": [
      "Near ones then zeros, with a direct path guaranteeing nonvanishing gradients.",
      "Zeros then near ones, with a direct path guaranteeing nonvanishing gradients.",
      "Near ones then zeros, while branch derivatives still affect gradients.",
      "Zeros then near ones, while branch derivatives still affect gradients."
    ],
    "answer": "Zeros then near ones, while branch derivatives still affect gradients.",
    "explanation": "Centering the constant row gives zeros before LayerNorm's affine terms. RMSNorm does not subtract its mean and returns values near one here. Pre-LN adds a direct identity path, while branch derivatives and products across updates still affect gradients."
  },
  {
    "question": "One FFN removes the activation between two affine layers. At model width 15, a separate bias-free SwiGLU branch must store the same number of matrix weights as a bias-free two-matrix FFN of intermediate width 60. What map does the first FFN now compute, and what intermediate width does SwiGLU need?",
    "options": [
      "The first becomes affine, and the gated width is 40.",
      "The first remains nonlinear, and the gated width is 40.",
      "The first becomes affine, and the gated width is 60.",
      "The first remains nonlinear, and the gated width is 60."
    ],
    "answer": "The first becomes affine, and the gated width is 40.",
    "explanation": "Without the activation, the two matrices multiply into one matrix and the biases combine into one offset. The resulting map is affine even if the intermediate layer is wide. The plain branch stores 2 * 15 * 60 = 1,800 weights. Each intermediate feature in SwiGLU uses 15 weights in each of three projections (gate, up, and down), so 1,800 / 45 = 40 features fit. Using width 60 would require 2,700 weights."
  },
  {
    "question": "Hidden states are [2,5,7] and the vocabulary has 19 entries. After tying compatible input and output tables, which logits shape, shared weight count and projection-work conclusion follow?",
    "options": [
      "[2,5,7] with 133 shared weights and unchanged projection work.",
      "[2,5,19] with 266 shared weights and halved projection work.",
      "[2,5,19] with 133 shared weights and unchanged projection work.",
      "[2,19] with 266 shared weights and halved projection work."
    ],
    "answer": "[2,5,19] with 133 shared weights and unchanged projection work.",
    "explanation": "The head maps each seven-feature row to 19 scores, producing [2,5,19]. One tied table holds 19 * 7 = 133 weights rather than 266 in two separate tables. Tying storage does not remove the per-row vocabulary matrix multiply."
  },
  {
    "question": "Task A uses an encoder to classify a complete product review. Task B uses an encoder-decoder to translate that review as target tokens arrive. Which paired attention visibility rule fits?",
    "options": [
      "A reads its input causally while B uses causal targets and all encoded source positions.",
      "A reads its whole input while B uses causal targets and all encoded source positions.",
      "A reads its whole input while B lets targets read future target tokens and all source positions.",
      "A reads its input causally while B lets targets read future target tokens and all source positions."
    ],
    "answer": "A reads its whole input while B uses causal targets and all encoded source positions.",
    "explanation": "The encoder can read both left and right input context. In the encoder-decoder, target self-attention is causal and cross-attention reads the completed encoded source. Future target access would leak unavailable answers."
  },
  {
    "question": "Trace A compares two runs of unchanged inputs with different active dropout masks. Trace B disables dropout, holds weights and earlier inputs fixed, changes only a future input, and observes earlier outputs change. Which trace proves a causal-path leak under these controls?",
    "options": [
      "B proves a failure, whereas A alone does not.",
      "A proves a failure, whereas B alone does not.",
      "Both prove a failure independently.",
      "Neither proves a failure under these controls."
    ],
    "answer": "B proves a failure, whereas A alone does not.",
    "explanation": "Trace A can differ because the random dropout masks differ. Trace B controls that source of variation and detects a violation of future-input invariance. Check earlier layers and other cross-position operations as well as the final attention mask."
  },
  {
    "question": "A two-entry vocabulary has logits [ln(16), 0]. Apply temperature 2 before softmax. What are the probabilities in the same order?",
    "options": [
      "[16/17, 1/17]",
      "[1/2, 1/2]",
      "[256/257, 1/257]",
      "[4/5, 1/5]"
    ],
    "answer": "[4/5, 1/5]",
    "explanation": "Divide both logits by 2 to get [ln(4), 0]. Their exponentials are 4 and 1, so dividing by their sum gives [4/5, 1/5]. Skipping temperature gives [16/17, 1/17]. Dividing those probabilities by 2 and renormalizing also leaves them unchanged. Multiplying the logits by 2 gives masses 256 and 1, hence [256/257, 1/257]. For these unequal logits, the shares approach [1/2, 1/2] as temperature grows, but they still differ at temperature 2."
  }
]
```

> **Next:** Continue to [Language Modeling & Next Tokens](/learn/language-modeling-next-token-prediction).
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

Imagine a model whose training loss looks fantastic and whose generated text is useless. You check the data, the learning rate, and the optimizer, and each one seems fine. The real problem is one missing mask, which lets every position read the word it is supposed to predict. The model learned to copy the answer from the next row. It passed every test you ran, because you were testing it with the answers visible.

You can only find a bug like that if you can follow the data through the network, and that is what this chapter teaches. The tokenizer gave each piece of text an ID, and an embedding table turned each ID into a vector. At this point, every occurrence of `rain` starts from an identical vector, whatever surrounds it. A Transformer is the machine that lets those vectors absorb their context, then turns the result into a score for every possible next token.

Follow the short prompt `function returns the`. A decoder has to produce a distribution over what comes next, such as `result`, `None`, or `value`. The whole forward pass fits in one picture:

<figure>
  <img src="illustrations/_generated/transformer_full_architecture_dark.png" alt="A small decoder processes the prompt function returns the. Three token IDs become a three by four matrix of positioned vectors. Repeated causal decoder blocks keep that shape. An output layer widens it to three by six, one score per vocabulary word for each position. The last row becomes next-token probabilities: result 35.3 percent, value 27.3, None 17.6, the 10.4, returns 6.9, and function 2.5." />
  <figcaption>The tensors are drawn to scale. Blocks keep the shape, and only the output layer changes the width. Generation uses the last row. You will run this tiny model at the end of the chapter. We chose its weights by hand, so the ranking shows the mechanism, not any learned knowledge of English.</figcaption>
</figure>

Notice what the blocks do not do: change the shape. Three positions and four features go in, and three positions and four features come out, however many blocks you stack. That one fact explains why Transformers can be made deeper by repeating a block, and it gives you your first debugging tool.

## Give every axis a meaning

Let the input contain $T$ token positions, with $d$ features per position. The hidden stream $X$ has shape $T\times d$. A batch adds an outer axis, so code usually holds $B\times T\times d$ in one array. Keep these straight, because almost every shape bug is a confusion between them. A longer prompt adds rows. A wider model adds features to every row.

Tokens also need to know where they are. Attention by itself compares vectors and has no notion of order. Without positional information, shuffle the input rows of unmasked self-attention and the output rows simply shuffle the same way. So models add position in some form. The original Transformer added fixed sine and cosine waves.[^vaswani2017] GPT and BERT learn a table with one vector per position, which means a position past the end of that table simply has no row.[^radford2018][^devlin2019] LLaMA rotates query and key coordinates by position-dependent angles, an approach called RoPE.[^su2021][^touvron2023] It has lasted: Llama 3's report and gpt-oss-120b's configuration both use it.[^dubey2024][^gptOss120bConfig2025] Our small example adds explicit position vectors so that you can see every number. The token `the` starts from its embedding row `[0.0, 0.3, 0.8, 1.0]`, and position 2 adds `[0.10, 0.0, 0.0, 0.10]`, which gives `[0.10, 0.3, 0.8, 1.1]`. The opening figure calls these positioned vectors.

The rest of a block alternates between two jobs. **Attention** moves information between positions. A **feed-forward network** transforms the features within each position. Residual additions combine each update with the stream that entered it, and normalization keeps the scales under control. Keep that division of labor in mind, because it tells you where to look when something breaks. If changing a future token changes an earlier output, inspect the attention masks and any other operation that mixes positions, including normalization over the token axis. If the number of positions changes, inspect a shape operation. If scores make no sense, inspect how the output layer maps back to the tokenizer.

## Attention is a weighted read

Attention sounds mysterious, and the math turns out to be a lookup with soft edges. Each position produces three vectors from its current state:

$$
Q=XW_q,\qquad K=XW_k,\qquad V=XW_v.
$$

Think of a database. A **query** describes what this position is looking for. A **key** advertises what each position has to offer. A **value** is what you actually get back. The analogy breaks in one useful way: a database returns one row, and attention returns a blend of all of them. Treat the names as a helpful story too. A learned dimension has no obligation to mean anything a person could name.

For one head with key width $d_k$, the whole operation is

$$
A=\operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}+M\right),\qquad H=AV.
$$

Read it from the inside out. $K^\top$ is $K$ with its rows turned into columns, so $QK^\top$ compares every query with every key, giving a score matrix with one row per query and one column per key. The mask $M$ adds zero where reading is allowed and negative infinity where it is forbidden. Softmax turns each row into weights that are nonnegative and sum to one. Multiplying by $V$ mixes the values using those weights.

Take the query at `the` to be `[0.2, 1.2]`, and follow it through:

<figure>
  <img src="illustrations/_generated/shape_trace_pipeline_dark.png" alt="One attention read for the query at the token the, with query vector 0.2, 1.2. A table lists function, returns, and the, with dot-product scores 0.20, 1.28, and 0.96, scaled scores 0.14, 0.91, and 0.68, and softmax weights 0.21, 0.44, and 0.35 drawn as bars. A fourth row for the future target result is masked. On the right, a plot shows the three value vectors as the corners of a triangle and the weighted read at about 0.34, 0.65 inside it." />
  <figcaption>Weights that are positive and sum to one always land the read inside the triangle of value vectors. The future token `result` exists during training on the full sentence, and the mask removes it from this read.</figcaption>
</figure>

<!-- leetllm: test, output=show, id=reader-transformer-attention -->
```python title="compute-one-attention-read.py"
import math

query = [0.2, 1.2]
keys = [[1.0, 0.0], [0.4, 1.0], [0.0, 0.8]]
values = [[1.0, 0.0], [0.3, 1.0], [0.0, 0.6]]
scores = [sum(a * b for a, b in zip(query, key)) / math.sqrt(2)
          for key in keys]
shifted = [math.exp(score - max(scores)) for score in scores]
weights = [value / sum(shifted) for value in shifted]
read = [sum(weight * value[column]
            for weight, value in zip(weights, values))
        for column in range(2)]
print("weights:", [round(value, 2) for value in weights])
print("read:", [round(value, 2) for value in read])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
weights: [0.21, 0.44, 0.35]
read: [0.34, 0.65]
```
<!-- leetllm: output:end -->

The result is a new feature vector. A common mistake is to read those three weights as the probability of generating those three words. They are not. Vocabulary probabilities come much later, from the output layer. (You will see it called the vocabulary head. It has nothing to do with the attention heads coming up.) These weights only say how much of each position's value this position absorbed on this one read.

Why divide by $\sqrt{d_k}$? Under a simple model where query and key components are independent with mean zero and variance one, the variance of their dot product is $d_k$. Wider heads therefore produce larger score gaps, and large gaps push softmax toward a sharp, almost one-hot output with very small derivatives. Dividing by $\sqrt{d_k}$ removes that growth.[^vaswani2017] Real components are often correlated, so read this as the reason for the division, not a law about real scores.

Separate query and key projections also make the matching rule richer. Using $XX^\top$ alone gives symmetric raw scores, but the weights can be asymmetric when the softmax denominators differ between rows. Each row of an attention heatmap shows how one query distributes its read across the available keys.

## Causality is a property of the whole path

Now back to that cheating model. A causal model predicts the next token from earlier tokens. During training the full sentence sits in memory, so nothing physically stops the state predicting `result` from reading `result`. The mask is what stops it. With zero-based positions, query $i$ may read key $j$ only when $j$ is at most $i$. For four tokens, the visibility matrix is lower triangular:

$$
\begin{bmatrix}
1&0&0&0\\
1&1&0&0\\
1&1&1&0\\
1&1&1&1
\end{bmatrix}.
$$

Rows are readers, and columns are possible sources. A subtle implementation point matters here. A zero in this matrix means negative infinity in the score, because setting a forbidden score to zero would leave it with positive probability after exponentiation.

Mask conventions also differ between APIs, which makes this an easy place to get things backward. In PyTorch's `scaled_dot_product_attention`, a boolean `True` means "allowed," the opposite of a `future` mask that you would pass to `masked_fill`. Read which one your call expects.[^pytorchSdpaDocs2026]

Use a deliberately bad mask to see what leakage looks like. Each row below sums to one on its own, so the total across rows can exceed one.

<!-- leetllm: test, deps=numpy, output=show, id=reader-transformer-leak -->
```python title="detect-mask-leakage.py"
import numpy as np

scores = np.array([
    [2.0, 5.0, 4.0],
    [1.0, 2.0, 6.0],
    [0.5, 1.0, 2.0],
])
future = np.triu(np.ones_like(scores, dtype=bool), k=1)

def softmax_rows(matrix):
    exp = np.exp(matrix - matrix.max(axis=-1, keepdims=True))
    return exp / exp.sum(axis=-1, keepdims=True)

unmasked = softmax_rows(scores)
masked = softmax_rows(np.where(future, -np.inf, scores))
print("unmasked future mass across rows:",
      f"{unmasked[future].sum():.3f}")
print("masked future mass across rows:",
      f"{masked[future].sum():.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
unmasked future mass across rows: 1.940
masked future mass across rows: 0.000
```
<!-- leetllm: output:end -->

Checking one mask is not enough, because leakage does not stay where it starts. A future token that slips through one attention layer contaminates the residual stream, and no later mask can remove it. So I recommend a stronger test, which is to change a future input and confirm that earlier outputs stay exactly the same. You will run that test at the end of this chapter.

Training and generation also have to agree about what predicts what. At inference on three prompt tokens, the fourth token does not exist yet. During training on four tokens, the fourth token is present, and the causal mask hides it from the first three positions. Common training code compares the vocabulary logits at position $t$ with the target token at $t+1$.

Different jobs need different masks, and the same blocks support all of them:

<figure>
  <img src="illustrations/_generated/encoder_decoder_variants_dark.png" alt="Visibility grids for three Transformer families, where rows are queries and columns are keys. Encoder-only self-attention fills all sixteen cells. Decoder-only self-attention is lower triangular. An encoder-decoder model has two grids: causal target self-attention and full cross-attention, where each target query can read every source position." />
  <figcaption>Rows are queries and columns are keys, and a filled cell may be read. BERT is an encoder, GPT and Llama are decoders, and T5 pairs the two with cross-attention.[^devlin2019][^radford2018][^touvron2023][^raffel2020]</figcaption>
</figure>

Classifying a finished snippet can read the whole input, so an encoder fits. Translation has a complete source and an unfinished target, so its target side stays causal while it reads the source freely through cross-attention. Generating text only has the past, which is why the chat models in the rest of this book are decoders.

Decoders also have practical conveniences. Shifting ordinary text by one position gives you next-token labels without any human annotation, and instructions and examples can sit in the same stream as the prompt, with no separate cross-attention module.

## Several heads read different projections

One read gives each position a single blend. Multi-head attention gives it several, each with its own projections. With model width $d$ and $h$ equal-width heads, a common choice gives each head width $d/h$. Each head computes its own weighted read, the outputs are concatenated back to width $d$, and a learned projection mixes them.[^vaswani2017]

Trace the shapes for $T=3$, $d=4$, and $h=2$. The stream starts at `[3, 4]`. Splitting the feature axis gives two heads of `[3, 2]`. Each head forms a `[3, 3]` score grid. Their reads concatenate back into `[3, 4]`. This is a good place to check your implementation, because splitting the sequence axis by mistake also produces tidy-looking tensors while giving each head a different slice of history. That bug may raise no error. The width also has to divide evenly by the head count, so assert it.

You will often see diagrams with one head labeled "syntax" and another labeled "names." Treat those as hypotheses. The architecture gives heads capacity to learn different interactions, and it assigns no job to any particular head.

Don't confuse heads with blocks, either. Heads work in parallel inside one block, all reading the same input. Blocks work in sequence, with the output of one entering the next. Stacked blocks usually have separate projection weights. The two passes in this chapter’s small program reuse the same block parameters.

## Residuals, normalization, and feature updates

A common pre-normalized block is two lines:

$$
U=X+\operatorname{Attention}(\operatorname{Norm}(X)),\qquad
Y=U+\operatorname{FFN}(\operatorname{Norm}(U)).
$$

Attention reads between positions, and the feed-forward branch applies the same learned transformation separately to each row. You can see the difference in the matrix shapes: attention's $QK^\top$ produces token-by-token scores, while the feed-forward network's multiplications produce token-by-feature rows that never touch each other.

A simple form of that network is $\operatorname{ReLU}(xW_1+b_1)W_2+b_2$. It usually expands to a wider intermediate dimension before projecting back. The original Transformer went from width 512 to 2,048 and back, a fourfold expansion.[^vaswani2017] The return to model width is the part that matters for debugging, because it is what lets the next block accept the output. Gated variants change the transformation and keep its role. LLaMA's SwiGLU, for example, runs two upward projections in parallel and multiplies them elementwise, using an intermediate width near $\tfrac{8}{3}d$ so that its three matrices hold about as many parameters as a two-matrix network at width $4d$.[^shazeer2020][^touvron2023]

The additions are what make deep stacks trainable. Each one gives the stream a direct route around its sublayer, an idea from residual networks.[^he2015] Where you put normalization relative to that route matters more than it first appears:

<figure>
  <img src="illustrations/_generated/pre_ln_transformer_block_dark.png" alt="Two residual blocks compare LayerNorm placement. In Pre-LN, a straight line runs from input to output through two additions, and each branch normalizes before its attention or feed-forward layer. In Post-LN, the same line passes through a LayerNorm after each addition. Both blocks keep a three by four stream." />
  <figcaption>Follow the thick line. In Pre-LN it reaches the output through additions alone, while branch derivatives still contribute to the full gradient. In Post-LN, normalization sits on the line itself.</figcaption>
</figure>

The 2017 Transformer normalized after each addition.[^vaswani2017] Xiong et al. found that this arrangement produces large gradients near the output at the start of training, so a high learning rate can blow up. Warmup, which starts the learning rate small and ramps it up, helps. Their Pre-LN models trained without it.[^xiong2020] Do not turn that into a rule, though. LLaMA uses pre-normalization and still reports 2,000 warmup steps.[^touvron2023] GPT-2 also uses pre-normalization, and adds a final normalization just before the logits.[^radford2019code] For a checkpoint you are loading, the placement is simply a fact you have to match.

Layer normalization computes statistics across the features within one token's row, then applies a learned scale and shift.[^ba2016] It never uses other token rows, so it can't leak the future. LLaMA uses RMS normalization instead, which takes the root mean square without subtracting the mean, so a constant nonzero row that layer normalization would flatten to zero can survive it. Both need the right feature axis, epsilon, and parameters to match the checkpoint.

## From features to words

After the last block, one more projection maps width $d$ to one score per vocabulary row. We already spent $V$ on values, so in this chapter $N$ is the vocabulary size, the number the last chapter called $V$. These unnormalized scores are **logits**, and softmax turns a row of them into a distribution. In training, a loss compares that distribution with the real next token. In generation, a decoding rule picks a token, appends its ID, and runs the forward pass again. Serving systems avoid repeating work on the earlier positions by keeping their keys and values in a KV cache, which you will meet again when we get to serving.

The original Transformer and GPT-2 share this output matrix with the token embedding, a trick called weight tying.[^vaswani2017][^radford2019code] It replaces two $N\times d$ arrays with one, which is the memory saving you saw in the last chapter. It does not shrink the rest of the model, activation memory, or the computation of the projection.

## Assemble it and try to break it

The self-contained implementation below wires the full forward pass end to end in pure Python: it looks up three token embeddings, adds positional vectors, runs two causal attention-and-MLP blocks with residual connections and RMS normalization, and projects the final hidden states onto a six-word vocabulary.

Appending an altered fourth row leaves the first three rows *exactly* unchanged, because every read is causal and every other layer operates independently within each row.

<!-- leetllm: test, output=show, id=reader-transformer-complete -->
```python title="trace-a-small-causal-block.py"
import math

vocab = ["function", "returns", "the", "result", "None", "value"]
embedding = [[1.0, 0.0, 0.4, 0.0], [0.2, 1.0, 0.5, 0.0],
             [0.0, 0.3, 0.8, 1.0], [0.1, 0.5, 1.0, 0.9],
             [0.0, 0.1, 0.0, 0.1], [0.2, 0.0, 0.4, 0.5]]
position = [[0.00, 0.0, 0.0, 0.00], [0.05, 0.0, 0.0, 0.05],
            [0.10, 0.0, 0.0, 0.10]]
gains = [0.0, 0.2, 0.7, 1.3]
output_table = [[1.0, 0.0, 0.0, 0.0], [0.2, 0.0, 0.0, 0.0],
                [0.0, 0.0, 0.0, 0.2], [0.0, 0.0, 0.5, 1.0],
                [0.0, -1.0, 0.0, 0.0], [0.0, 0.0, 1.0, 0.0]]

def softmax(scores):
    values = [math.exp(score - max(scores)) for score in scores]
    return [value / sum(values) for value in values]

def normalize(row):
    mean = sum(row) / len(row)
    variance = sum((value - mean) ** 2 for value in row) / len(row)
    scale = math.sqrt(variance + 1e-5)
    return [(value - mean) / scale for value in row]

def block(rows):
    normalized = [normalize(row) for row in rows]
    after_attention = []
    for index, query in enumerate(normalized):
        visible = normalized[:index + 1]
        scores = [sum(a * b for a, b in zip(query, key)) / 2
                  for key in visible]
        weights = softmax(scores)
        read = [sum(weight * value[column]
                    for weight, value in zip(weights, visible))
                for column in range(4)]
        after_attention.append(
            [a + b for a, b in zip(rows[index], read)])
    result = []
    for row in after_attention:
        features = normalize(row)
        update = [gains[column] * max(0, features[(column + 1) % 4])
                  for column in range(4)]
        result.append([a + b for a, b in zip(row, update)])
    return result

prompt = [[e + p for e, p in zip(embedding[token], position[index])]
          for index, token in enumerate([0, 1, 2])]
states = block(block(prompt))
extended = block(block(prompt + [[90, -50, 20, 10]]))
assert states == extended[:3]
last = normalize(states[-1])
logits = [sum(a * b for a, b in zip(last, row))
          for row in output_table]
probabilities = softmax(logits)
print("the, with position:", [round(value, 2) for value in prompt[2]])
print("hidden shape:", (len(states), len(states[0])))
print("vocabulary scores:", len(logits))
print("earlier states unchanged:", states == extended[:3])
ranked = sorted(zip(vocab, probabilities), key=lambda pair: -pair[1])
for word, probability in ranked:
    print(f"{word}: {probability:.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
the, with position: [0.1, 0.3, 0.8, 1.1]
hidden shape: (3, 4)
vocabulary scores: 6
earlier states unchanged: True
result: 35.3%
value: 27.3%
None: 17.6%
the: 10.4%
returns: 6.9%
function: 2.5%
```
<!-- leetllm: output:end -->

There are the opening figure's numbers, with `result` on top at 35.3 percent, plus the causality check from the start of this chapter. Change `index + 1` to `len(normalized)` in `block` and the check fails immediately.

Hand-picked weights show the shapes, but the real payoff is watching a Transformer **learn** to route context on its own. Train a tiny PyTorch decoder on two four-token sequences that share the exact same ending (`returns the`), so the last position can only choose between `result` and `None` by attending back to position 0:

<!-- leetllm: test, deps=torch, output=show, id=reader-transformer-train -->
```python title="reader-train-tiny-decoder.py"
import math
import torch
from torch import nn
from torch.nn import functional as F

vocab = ["function", "returns", "the", "result", "None", "value"]

class TinyDecoder(nn.Module):
    def __init__(self, vocab_size=6, max_len=4, d_model=8, heads=2):
        super().__init__()
        self.tok = nn.Embedding(vocab_size, d_model)
        self.pos = nn.Embedding(max_len, d_model)
        self.qkv = nn.Linear(d_model, 3 * d_model, bias=False)
        self.out = nn.Linear(d_model, d_model, bias=False)
        self.ln1, self.ln2, self.ln_f = nn.LayerNorm(d_model), nn.LayerNorm(d_model), nn.LayerNorm(d_model)
        self.ffn = nn.Sequential(nn.Linear(d_model, 16), nn.GELU(), nn.Linear(16, d_model))
        self.head = nn.Linear(d_model, vocab_size, bias=False)
        self.heads = heads

    def forward(self, ids):
        B, T = ids.shape
        x = self.tok(ids) + self.pos(torch.arange(T, device=ids.device))
        h = self.ln1(x)
        q, k, v = [t.view(B, T, self.heads, -1).transpose(1, 2) for t in self.qkv(h).chunk(3, dim=-1)]
        mask = torch.triu(torch.ones(T, T, dtype=torch.bool, device=ids.device), diagonal=1)
        scores = (q @ k.transpose(-2, -1)) / math.sqrt(q.size(-1))
        attn = scores.masked_fill(mask, float("-inf")).softmax(dim=-1) @ v
        x = x + self.out(attn.transpose(1, 2).contiguous().view(B, T, -1))
        x = x + self.ffn(self.ln2(x))
        return self.head(self.ln_f(x))

torch.manual_seed(7)
model = TinyDecoder()
seqs = torch.tensor([[0, 1, 2, 3], [5, 1, 2, 4]])  # function/value returns the result/None
inputs, targets = seqs[:, :-1], seqs[:, 1:]

with torch.no_grad():
    p_before = model(inputs)[0, -1].softmax(dim=-1)[3].item()

opt = torch.optim.Adam(model.parameters(), lr=0.05)
for _ in range(150):
    loss = F.cross_entropy(model(inputs).reshape(-1, len(vocab)), targets.reshape(-1))
    opt.zero_grad(); loss.backward(); opt.step()

model.eval()
with torch.no_grad():
    probs = model(inputs)[:, -1].softmax(dim=-1)

print(f"loss: {loss.item():.4f}")
print(f"P(result | function returns the): {p_before:.3f} -> {probs[0, 3].item():.3f}")
print(f"P(None   | value    returns the): {probs[1, 4].item():.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
loss: 0.0001
P(result | function returns the): 0.077 -> 1.000
P(None   | value    returns the): 1.000
```
<!-- leetllm: output:end -->

> **Key insight:** Both sequences end with `returns the`, yet gradient descent taught causal attention to reach back to token 0 (`function` vs `value`) and flip the next-token prediction from `result` to `None` with over 99% confidence.

```checkpoint
Training loss drops far faster than expected, but the model generates poor text. What would you test first, and how?
---
Test for future leakage through the whole block. Change a token late in the sequence and confirm that outputs at earlier positions do not change at all. Then assert that attention weights on future keys are zero.
```

## The same recipe at real scale

Our model has one or two blocks, tiny width, and six vocabulary rows. Now scale it up. Llama 3's largest model repeats its block 126 times at width 16,384 with 128 heads, so each head reads at width 128.[^dubey2024] The same steps are still there: attention reads, feature updates, residual additions, and a final projection. Position and normalization work differently, as you saw, and the shapes still hold. Its embedding table alone holds about 2.1 billion weights, roughly half a percent of the 405 billion total, so most of what a model stores lives in the blocks. Here are a few published sizes:

| Model | Blocks | Width $d$ | Heads $h$ | Vocabulary $N$ |
|---|---:|---:|---:|---:|
| GPT-2 XL | 48 | 1,600 | 25 | 50,257 |
| Llama 3 405B | 126 | 16,384 | 128 | 128,256 |
| gpt-oss-120b | 36 | 2,880 | 64 | 201,088 |
| DeepSeek-V4-Pro | 61 | 7,168 | 128 | 129,280 |
| Gemma 4 31B | 60 | 5,376 | 32 | 262,144 |

These dimensions come from each model's published report or configuration.[^gpt2XlConfig2019][^dubey2024][^metaLlama3Tokenizer2024][^gptOss120bConfig2025][^deepseek2026v4modelcard][^gemma431bConfig2026] Watching the family evolve from 2018 to today shows how the same decoder loop absorbed four major upgrades:

- **From completion to assistants:** GPT-1 (117M) pretrained and fine-tuned per task;[^radford2018] GPT-2 (1.5B) adopted Pre-LN and solved tasks zero-shot from prompts;[^radford2019] GPT-3 (175B) unlocked few-shot in-context learning with frozen weights;[^brown2020] and InstructGPT used RLHF to turn raw text continuation into instruction following.[^ouyang2022] Base checkpoints still extend documents, whereas instruct checkpoints expect their exact chat template, and "open weights" carry specific licenses rather than automatic open-source status.[^huggingface2026chattemplates][^osi2024]
- **Leaner attention and KV caches:** Serving splits into parallel **prefill** (populating the KV cache across all prompt tokens) and step-by-step **decode** (streaming weights and cached keys/values from GPU memory). Grouped-Query Attention (GQA) lets multiple query heads share a single KV head, shrinking raw KV cache memory ($2 \cdot B \cdot L \cdot n_{\text{layers}} \cdot n_{\text{kv}} \cdot d_{\text{head}} \cdot P$) by $4\times$ to $8\times$ with near-MHA quality.[^ainslie2023]
- **Sparse experts and sliding windows:** Mixture-of-Experts (MoE) layers replace one dense FFN with many experts and route each token to top-$k$ (so active parameters govern per-token FLOPs while *total* parameters still determine resident GPU VRAM).[^jiang2024] Other models bend head rules too: gpt-oss-120b sets head width to 64 (not $d/h = 45$) and alternates full attention with a 128-token causal sliding window.
- **Long context is not uniform recall:** A 128k context window accepts long prompts, yet retrieval accuracy often follows a U-shaped "lost in the middle" curve, peaking at the beginning and end of the prompt.[^liu2023lost] Put key evidence near those edges and test recall across positions.

**If you only call hosted models,** none of this is yours to inspect. You get text and token counts back, not hidden states, so you can't change a future token and compare. Providers generally publish a context window and a price, not block counts or widths. The picture still pays off. Every position you send has to pass through every block at least once, unless a cache already holds that work, which is why long prompts cost real compute, and the last row of scores is what a decoder draws from, even on a server you never see.

```checkpoint
Take GPT-2's small version: width 768, 12 heads, and a vocabulary of 50,257. You run a batch of 8 prompts, each 20 tokens long. What is the shape of the hidden stream, the width of each head, the size of each head's score grid, and the shape of the logits? How many weights would separate embedding and output tables hold? Then one read by hand: at $d_k=2$, a query `[1, 0]` reads keys `[1, 0]` and `[0, 1]`, whose values are `[2, 0]` and `[0, 4]`. What comes back?
---
The stream is `[8, 20, 768]`. Each head has width $768/12=64$, so the split is `[8, 12, 20, 64]`, and each head forms a `[20, 20]` score grid. The logits are `[8, 20, 50257]`. Two separate tables hold $2\times50{,}257\times768=77{,}194{,}752$ weights, and GPT-2 ties them, which leaves half that. For the read, the scaled scores are $1/\sqrt2\approx0.71$ and $0$, softmax gives weights 0.67 and 0.33, and the read is `[1.34, 1.32]`.
```

## When the forward pass breaks

Most Transformer bugs have recognizable symptoms. Start by asking which invariant broke: visibility, tensor shape, device placement, or normalization.

| Symptom | Likely cause | Check |
|---|---|---|
| Training loss looks suspiciously tiny, but generation fails | Future tokens leak through attention | Assert that future attention mass is zero, and run the future-change test |
| A head split crashes or gives the wrong shape | $d$ does not divide by the head count, or axes were transposed | Trace `[B, h, T, d/h]`, then merge back to `[B, T, d]` |
| It works on CPU and fails on a GPU | The causal mask stayed on the CPU | Create the mask on the input's device |
| Blocks refuse to stack | The FFN or output projection changed the width too early | Keep block output at $d$, and project to the vocabulary only at the end |
| Manual softmax returns `NaN` | A row was fully masked, so its maximum is $-\infty$ | Give every real query a visible key, and handle padded queries explicitly |

You can now take a prompt all the way to a row of probabilities. That row is not yet an answer, because something still has to choose. The [decoding chapter](/learn/decoding-strategies-greedy-beam-nucleus) starts from the distribution you just computed and shows how each choice changes everything the model sees next.

<!-- leetllm: edition:reader:end -->
