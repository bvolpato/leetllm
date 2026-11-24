---
{
  "id": "vectors-matrices-tensors",
  "title": "Vectors, Matrices & Tensors",
  "slug": "vectors-matrices-tensors",
  "section": "Math & Statistics",
  "category": "Model Architecture",
  "difficulty": "Easy",
  "order": 2,
  "coverImage": "illustrations/_generated/vector_matrix_tensor_map_dark.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Anthropic",
    "Microsoft",
    "Amazon",
    "Apple"
  ],
  "shortDescription": "One latency row is two numbers. The same multiply has to survive a batch of requests and a tensor of tokens without mixing the axes.",
  "keyConceptsTested": [
    "vectors as ordered features and gradients",
    "dot products as weighted predictions and similarity scores",
    "matrices as batches and learned transforms",
    "matrix multiplication shape rules",
    "tensors with batch, sequence, and feature axes",
    "broadcasting bugs and shape assertions",
    "shape validation and masked token pooling"
  ],
  "prerequisites": [
    "calculus-gradients-backpropagation-optimization",
    "numpy-and-tensor-shapes"
  ]
}
---

Suppose three AI requests arrive with different prompt lengths and queue delays. You can use two numbers to predict one response time. How can the same small calculation handle all three requests, then keep a separate vector for every <span data-glossary="token">token</span> in each prompt? The arithmetic stays familiar. The challenge is keeping track of which request, token, and feature each number describes.

The [gradients lesson](/learn/calculus-gradients-backpropagation-optimization) computed `[4, 2]` for a CodeAssist latency prediction: one loss slope for the prompt-length weight and one for the queue-delay weight. That ordered list is a **<span data-glossary="vector">vector</span>**. The gradient tells us how loss changes; the learning rate turns it into a weight update. Here, we'll follow those named values as one request becomes a batch and a batch becomes a token tensor.

## Start with the vector you already computed

Before stacking anything, name the object in front of you: a single number such as a loss of `1.0` is a **scalar**, an ordered list of numbers is a **vector**, and a rectangular table of numbers is a **<span data-glossary="matrix">matrix</span>**. The numbers do not carry their own meaning because axis labels and position conventions define what each coordinate represents. We can reuse the two-weight latency row to make those coordinate meanings explicit:

| Vector | Meaning of position 0 | Meaning of position 1 | Values |
|---|---|---|---|
| `features` | prompt length in hundreds of tokens | queue delay in seconds | `[2, 1]` |
| `weights` | seconds per prompt block | seconds per second of queue delay | `[2, 2]` |
| `gradient` | loss slope with respect to the prompt-length weight | loss slope with respect to the queue-delay weight | `[4, 2]` |

Each vector above has length 2, but they play distinct physical roles. Shape tells you the size of each axis, not the array's memory layout. Names and coordinate conventions tell you what the entries mean.

The [NumPy lesson](/learn/numpy-and-tensor-shapes) introduced `.shape`. A shape of `(2,)` denotes a single axis containing two items. That trailing comma is Python's syntax for a one-element tuple so it isn't confused with grouped parentheses. A NumPy scalar or zero-dimensional array has shape `()` because it has zero axes. An ordinary Python `float` doesn't have a `.shape` attribute.

Use NumPy arrays here because ordinary Python lists don't implement `@`. The learning-rate update itself is unchanged; NumPy lets us inspect the shape of each object as well as its values. All three inputs should have shape `(2,)`, and subtracting `0.1 * gradient` should give `[1.6, 1.8]`:

<!-- leetllm: test, output=show -->
```python title="a-gradient-is-a-vector.py"
import numpy as np

features = np.array([2.0, 1.0])
weights = np.array([2.0, 2.0])
gradient = np.array([4.0, 2.0])
updated = weights - 0.1 * gradient

print("features", features.tolist(), "shape", features.shape)
print("weights", weights.tolist(), "shape", weights.shape)
print("gradient", gradient.tolist(), "shape", gradient.shape)
print("updated_weights", updated.tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
features [2.0, 1.0] shape (2,)
weights [2.0, 2.0] shape (2,)
gradient [4.0, 2.0] shape (2,)
updated_weights [1.6, 1.8]
```
<!-- leetllm: output:end -->

An <span data-glossary="embedding">embedding</span> is a learned vector representation. Whereas this latency vector holds two named features or two parameters directly, a token embedding later in the lesson has coordinates learned through training. In either case, an update adjusts the weights, and a dot product applies them to compute the next prediction.

## Let aligned features make one prediction

The latency model uses a <span data-glossary="dot-product">dot product</span>: multiply matching positions, then add. Let $x$ name the features, $w$ the weights, and $\hat{y}$ ("y hat") the predicted latency, where subscripts 1 and 2 identify the two coordinates that Python indexes with 0 and 1:

$$
\hat{y} = x \cdot w = x_1w_1 + x_2w_2
$$

Evaluating that sum with the previous chapter's starting weights `[2, 2]` gives $[2, 1] \cdot [2, 2] = (2 \times 2) + (1 \times 2) = 6$, reproducing the 6-second prediction. Use the weight vector `w = [2, 1]` for the remaining latency examples:

$$
[2, 1] \cdot [2, 1] = (2 \times 2) + (1 \times 1) = 5
$$

Prompt length contributes four seconds and queue delay contributes one, so two vectors of length two produce one scalar. Check the difference between `*`, which keeps the two element-wise contributions separate, and `@`, which sums them into a single scalar matching the hand calculation:

<!-- leetllm: test, output=show -->
```python title="one-request-dot-product.py"
import numpy as np

features = np.array([2.0, 1.0])
weights = np.array([2.0, 1.0])
contributions = features * weights
prediction = features @ weights

print("contributions", contributions.tolist())
print("prediction_seconds", prediction)
print("output_shape", prediction.shape)
assert prediction == sum(a * b for a, b in zip(features, weights, strict=True))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
contributions [4.0, 1.0]
prediction_seconds 5.0
output_shape ()
```
<!-- leetllm: output:end -->

Element-wise multiplication stops at a contribution vector, whereas the dot product adds those contributions into one number. For two real-valued 1-D arrays, NumPy's `@` computes this inner product.[^numpyMatmul2026] Rather than applying weights to one request at a time, we can apply that exact same rule across an entire table of requests at once.

```checkpoint
Why can't you swap the feature order to `[queue_delay, prompt_blocks]` while keeping weights as `[seconds per prompt block, seconds per second of queue delay]`?
---
The lengths would still match, so the code would run, but positions would no longer describe the same quantities. You'd multiply queue delay by the prompt-length weight and prompt length by the queue-delay weight. Length checks catch structural errors; clear axis meaning catches semantic errors.
```

## Stack requests into a matrix

Instead of needing a separate weight vector for each row, put three observed requests into a **matrix**: a rectangular array whose rows are requests and whose columns are features. The row axis lets one shared rule run across all requests:

$$
X =
\begin{bmatrix}
1 & 0 \\
2 & 1 \\
3 & 1
\end{bmatrix}
\quad
w =
\begin{bmatrix}
2 \\
1
\end{bmatrix}
$$

Read conceptual shape `[3, 2]` as three requests by two features, where multiplying every row by the same weight vector returns one prediction per request: `[3, 2] @ [2] -> [3]`. The `@` notation is the matrix multiplication operator you will see throughout library code, meaning "dot each row with `w`." A length-two NumPy vector has shape `(2,)` even though we drew its values vertically in the equation, whereas an explicit column matrix has shape `(2, 1)` and preserves a length-one output axis; with these weights, a short prompt with no queue gives `2`, while the remaining two rows give `5` and `7`:

<!-- leetllm: test, output=show -->
```python title="many-requests-one-weight-vector.py"
import numpy as np

X = np.array([
    [1.0, 0.0],  # short prompt, empty queue
    [2.0, 1.0],  # medium prompt, one second of queue delay
    [3.0, 1.0],  # longer prompt, one second of queue delay
])
weights = np.array([2.0, 1.0])
predictions = X @ weights

print("X_shape", X.shape)
print("weights_shape", weights.shape)
print("predictions_shape", predictions.shape)
print("predicted_seconds", predictions.tolist())
assert (X @ weights[:, None]).shape == (3, 1)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
X_shape (3, 2)
weights_shape (2,)
predictions_shape (3,)
predicted_seconds [2.0, 5.0, 7.0]
```
<!-- leetllm: output:end -->

The one-request computation repeats across each row. Feature lengths must agree, and the row axis survives. The final assertion adds a singleton axis with `[:, None]` to highlight the distinction between a 1D vector and a 2D column matrix.

## Use a matrix to make several outputs

The three predictions above use one shared rule, but a service often needs more than one output. Suppose it also wants a priority score computed from the same two features. While a single weight vector produces one output, a weight **matrix** `W` produces both by placing one column of weights per output:

$$
W =
\begin{bmatrix}
2.0 & 0.2 \\
1.0 & 1.5
\end{bmatrix}
$$

The first column computes response seconds, and the second computes priority. For `x = [2, 1]`, we run both dot products side by side so `[2] @ [2, 2] -> [2]`:

$$
xW = [2, 1]
\begin{bmatrix}
2.0 & 0.2 \\
1.0 & 1.5
\end{bmatrix}
= [5.0, 1.9]
$$

Here the seconds column is the familiar `[2, 1]` rule, and the priority column is a second dot product against the same features. For the whole three-row matrix, the shape rule becomes $[3, 2] \; @ \; [2, 2] \rightarrow [3, 2]$, where we store examples as rows and outputs as columns so we write `X @ W`. Textbooks that store each example as a column write `W x` instead, and either convention works as long as axis meanings stay attached to the numbers.

<figure>
  <img src="illustrations/_generated/matrix_multiply_shape_contract_dark.png" alt="Three open matrices show X times W equals Y. X has three request rows and two feature columns, prompt and queue. W maps the two features to time in seconds and a priority score. Blue highlights request B, [2, 1], and the time column of W, [2, 1]. Their dot product, 2 times 2 plus 1 times 1, fills the green output cell with 5 seconds. The shapes are 3 by 2, 2 by 2, and 3 by 2." />
  <figcaption>The feature order is prompt length, then queue delay in both X’s columns and W’s rows. Blue follows request B through the latency weights to the green 5-second result. Purple marks the two feature dimensions being summed.</figcaption>
</figure>

In the code, `W[:, 0]` selects the seconds column. Compare its predictions with the corresponding column of the full result:

<!-- leetllm: test, output=show -->
```python title="matrix-transforms-request-features.py"
import numpy as np

X = np.array([[1.0, 0.0], [2.0, 1.0], [3.0, 1.0]])
W = np.array([
    [2.0, 0.2],  # prompt contribution to [seconds, priority]
    [1.0, 1.5],  # queue contribution to [seconds, priority]
])

outputs = X @ W

print("shape_rule", X.shape, "@", W.shape, "->", outputs.shape)
print("second_request", outputs[1].tolist())
print("all_seconds_predictions", outputs[:, 0].tolist())
np.testing.assert_allclose(outputs[:, 0], X @ W[:, 0])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
shape_rule (3, 2) @ (2, 2) -> (3, 2)
second_request [5.0, 1.9]
all_seconds_predictions [2.0, 5.0, 7.0]
```
<!-- leetllm: output:end -->

Neural-net layers use the same idea at larger width: one learned matrix mixes input features into many output features for every row at once. That same dimension-matching rule also tells you when a proposed weight matrix cannot consume the available features.

## Match inner dimensions before multiplying

Read the dimensions from the inside out: each row of `X` has two features, whereas suppose `W` expects three (`[3, 2] @ [3, 2]`). Because `X` ends with a feature count of `2` while `W` starts with `3`, there is no third feature to pair and the product cannot be formed. Below we run the invalid multiplication deliberately before testing a compatible matrix, catching `ValueError` to print a concise diagnosis because NumPy's full error string varies across releases:

<!-- leetllm: test, output=show -->
```python title="catch-the-matrix-shape-error.py"
import numpy as np

X = np.array([[1.0, 0.0], [2.0, 1.0], [3.0, 1.0]])
wrong_W = np.zeros((3, 2))
correct_W = np.array([[2.0, 0.2], [1.0, 1.5]])

try:
    X @ wrong_W
except ValueError:
    print("invalid", X.shape, "@", wrong_W.shape)
    print("meeting_dimensions", X.shape[1], "and", wrong_W.shape[0], "do_not_match")
else:
    raise AssertionError("expected incompatible input-feature dimensions")

print("valid_output_shape", (X @ correct_W).shape)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
invalid (3, 2) @ (3, 2)
meeting_dimensions 2 and 3 do_not_match
valid_output_shape (3, 2)
```
<!-- leetllm: output:end -->

When multiplication fails, name the axes first (request rows, input features, and output features), then fix the array whose meaning is wrong. Requests aren't the only extra axis either, because a prompt is a sequence of tokens and needs a third axis saying which token each feature vector belongs to.

## Add token and batch axes with tensors

In library code, a **<span data-glossary="tensor">tensor</span>** means an array with any number of axes: NumPy calls its array type `ndarray`, and <span data-glossary="pytorch">PyTorch</span> calls its type `torch.Tensor`. That practical array definition is the one used here and in the opening linear algebra chapter of *Deep Learning*.[^goodfellow2016] A scalar has zero axes, a vector one, and a matrix two, with the number of axes often called **tensor rank** (`.ndim` in NumPy), whereas **matrix rank** counts independent directions.

So far, we represented each request with two summary features: prompt length and queue delay. To represent its *text*, switch to one vector per token; these token coordinates are distinct from the latency features even though we give them length two, following the same `(B, T, D)` convention introduced on log snippets in the [NumPy lesson](/learn/numpy-and-tensor-shapes):

| Axis | Symbol | Meaning here |
|---|---|---|
| batch | `B` | several prompts processed together |
| sequence | `T` | token positions within each prompt |
| feature | `D` | numbers describing one token at one layer |

Represent three tokens from a short vocabulary with two-dimensional feature vectors:

| Token | Feature 0 | Feature 1 |
|---|---:|---:|
| cat | `1.0` | `0.0` |
| chased | `0.5` | `0.5` |
| dog | `0.0` | `1.0` |

Two prompts, each containing three token-feature vectors, therefore have shape `[2, 3, 2]`.

<figure>
  <img src="illustrations/_generated/vector_matrix_tensor_map_dark.png" alt="Tensor H has shape [2,3,2]: two prompts, three tokens per prompt, and two features per token. Open matrices show H[0] and H[1], with token rows t=0,1,2 and feature columns d=0,1. In H[1], token row 2 is highlighted and feature 0 contains 1.0. An indexing chain reduces H to H[1], then H[1,2], then scalar H[1,2,0]=1.0." />
  <figcaption>Follow the rank reduction path: tensor [2, 3, 2] (rank 3) strips the batch axis at index 1 to yield matrix [3, 2] (rank 2), strips the sequence axis at index 2 to yield vector [2] (rank 1), and strips the feature axis at index 0 to yield scalar 1.0 (rank 0).</figcaption>
</figure>

Read that shape as `B = 2` prompts, `T = 3` token positions, and `D = 2` features per token. Indexing is zero-based, so `H[1, 2, 0]` selects the first feature of the third token in the second prompt. A colon keeps all entries along its axis: `H[:, :, 0]` therefore keeps batch and sequence but fixes the feature. Run both selections:

<!-- leetllm: test, output=show -->
```python title="stack-prompt-sequences-into-a-tensor.py"
import numpy as np

H = np.array([
    [[1.0, 0.0], [0.5, 0.5], [0.0, 1.0]],  # "cat chased dog"
    [[0.0, 1.0], [0.5, 0.5], [1.0, 0.0]],  # "dog chased cat"
])

print("tensor_shape", H.shape, "axes", H.ndim)
print("second_prompt_shape", H[1].shape)
print("third_token", H[1, 2].tolist(), "shape", H[1, 2].shape)
print("H[1,2,0]", H[1, 2, 0])
print("feature_zero_slice", H[:, :, 0].shape)
assert H.size == 2 * 3 * 2
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tensor_shape (2, 3, 2) axes 3
second_prompt_shape (3, 2)
third_token [1.0, 0.0] shape (2,)
H[1,2,0] 1.0
feature_zero_slice (2, 3)
```
<!-- leetllm: output:end -->

The last axis still contains features. Extra axes only organize which prompt and token each vector belongs to. A learned projection should change that last axis and leave the others alone.

## Project each token without mixing positions

In this lesson, a **projection** is a matrix transformation of each token's features whose coefficients neural networks learn from data. Using small handpicked values lets us inspect the arithmetic as matrix `P` maps two input features into three output features via $[B, T, 2] \; @ \; [2, 3] \rightarrow [B, T, 3]$, leaving batch and sequence intact while expanding the feature width from 2 to 3:

<!-- leetllm: test, output=show -->
```python title="project-every-token-vector.py"
import numpy as np

H = np.array([
    [[1.0, 0.0], [0.5, 0.5], [0.0, 1.0]],
    [[0.0, 1.0], [0.5, 0.5], [1.0, 0.0]],
])
P = np.array([
    [1.0, 0.0, 0.5],
    [0.0, 1.0, 0.5],
])

projected = H @ P
by_hand = [[[sum(token[d] * P[d, j] for d in range(2))
             for j in range(3)] for token in prompt] for prompt in H]

print("shape_rule", H.shape, "@", P.shape, "->", projected.shape)
print("first_prompt_first_token", projected[0, 0].tolist())
print("middle_token_shared", np.array_equal(projected[0, 1], projected[1, 1]))
np.testing.assert_allclose(projected, by_hand)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
shape_rule (2, 3, 2) @ (2, 3) -> (2, 3, 3)
first_prompt_first_token [1.0, 0.0, 0.5]
middle_token_shared True
```
<!-- leetllm: output:end -->

Read the inner calculation as "multiply input coordinate `d` by its coefficient for output coordinate `j`, then sum over `d`." The nested Python loops spell out that calculation for every output feature, token, and prompt, and `np.testing.assert_allclose` verifies that the NumPy result matches this explicit version within floating-point tolerance. For a shared projection with shape `[D, output_width]`, each token is transformed independently so neither prompts nor token positions mix. More generally, `@` multiplies the last two axes and broadcasts compatible leading batch axes, so because `P` has no batch axis here, the same matrix serves both prompts.[^numpyMatmul2026]

This also explains an important limit: making the last dimension wider doesn't create new information. Each output is still a weighted combination of the two inputs. A later layer must do more than change width if it needs interactions between token positions.

```checkpoint
A token tensor has shape `[4, 128, 768]` and a projection has shape `[768, 256]`. What output shape should you expect?
---
`[4, 128, 256]`. The meeting feature dimension `768` contracts, while batch and sequence axes remain intact.
```

Multiplication usually fails loudly when inner sizes disagree. Addition can stay quiet while still attaching a number to the wrong axis. Treat broadcasting as an axis-semantics problem: an arithmetically valid result can still attach values to the wrong feature.

## Treat broadcasting as an axis decision

<span data-glossary="broadcasting">Broadcasting</span> lets a smaller array participate in element-wise operations against a larger one. First choose what should repeat. An output bias `[seconds_offset, priority_offset]` should repeat across every request row:

$$
[3, 2] + [2] \rightarrow [3, 2]
$$

NumPy compares dimensions from the right: equal sizes match, a size of `1` can expand, and missing leading dimensions act like size `1`, which makes broadcasting both convenient and prone to hiding an axis mistake.[^numpyBroadcasting2026] Compare both additions side by side on the second request, where adding `feature_bias` yields `[5.1, 1.8]` while adding `row_offsets` yields `[4.9, 1.8]` without raising a shape error:

<!-- leetllm: test, output=show -->
```python title="broadcast-the-right-axis.py"
import numpy as np

outputs = np.array([
    [2.0, 0.2],
    [5.0, 1.9],
    [7.0, 2.1],
])  # columns: [seconds, priority]

feature_bias = np.array([0.1, -0.1])  # one value per output feature
row_offsets = np.array([[0.1], [-0.1], [0.0]])  # one value per request

corrected = outputs + feature_bias
wrong_but_valid = outputs + row_offsets

print("correct_second_request", corrected[1].round(1).tolist())
print("wrong_second_request", wrong_but_valid[1].round(1).tolist())
assert corrected.shape == wrong_but_valid.shape == (3, 2)
assert feature_bias.shape == (outputs.shape[-1],)
assert not np.allclose(corrected, wrong_but_valid)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
correct_second_request [5.1, 1.8]
wrong_second_request [4.9, 1.8]
```
<!-- leetllm: output:end -->

Both results have three rows and two columns, yet only one broadcasts along the intended feature axis. Checking the output shape alone misses this bug, whereas asserting a one-dimensional bias with length equal to the output width catches the `(3, 1)` array. Even with that check in place, named columns and a known-value test remain necessary to catch two feature biases placed in the wrong order.

The same dot product that scored one request can compare token vectors with each other, turning a single scalar score into a pairwise grid.

## Read a score grid as repeated dot products

For three token-feature vectors in one prompt, multiply the token matrix by its **transpose**, which swaps rows and columns so that every row-column dot product compares two tokens:

$$
[T, D] \; @ \; [D, T] \rightarrow [T, T]
$$

Every entry in the output is one dot product between two token positions, with rows naming the first token and columns naming the second:

|  | cat | chased | dog |
|---|---:|---:|---:|
| cat | `1.0` | `0.5` | `0.0` |
| chased | `0.5` | `0.5` | `0.5` |
| dog | `0.0` | `0.5` | `1.0` |

These raw alignment scores depend on vector length as well as direction; for instance, the middle token's self-score is `0.5² + 0.5² = 0.5`, whereas a unit-normalized vector always has self-score `1`. For a real vector $v$, its Euclidean length $\|v\|$ is the square root of the sum of its squared coordinates, and for nonzero vectors cosine similarity is $a \cdot b / (\|a\|\|b\|)$.[^goodfellow2016] Dividing each vector by its length normalizes self-scores to `1`, while zero vectors have no direction and therefore require an explicit edge-case check. Drawing a two-coordinate vector as an arrow from `(0, 0)` to its coordinates makes this geometry direct: cosine similarity is `1` for the same direction, `0` for perpendicular directions, and `-1` for opposite directions, remaining invariant whenever you scale an arrow by a positive number.

<figure>
  <img src="illustrations/_generated/dot_product_alignment_dark.png" alt="Plots with equal horizontal and vertical scales compare a = [0.5, 0.5] and 2a = [1, 1] against unit vector u = [1, 0]. Both point at 45 degrees. Their lengths are approximately 0.707 and 1.414. Their scalar projections onto u, and dot products with u, are 0.5 and 1. Both cosine similarities are 1 divided by the square root of 2, approximately 0.707." />
  <figcaption>Both vectors point along the same 45-degree ray. Doubling vector length doubles the projected shadow and the dot product with [1, 0], from 0.5 to 1. Cosine similarity divides out vector lengths, so both scores remain 1/√2, approximately 0.707.</figcaption>
</figure>

Compute both grids and compare their diagonals. `keepdims=True` gives lengths shape `[3, 1]`, keeping each length attached to its row during normalization:

<!-- leetllm: test, output=show -->
```python title="token-similarity-grid.py"
import numpy as np

tokens = np.array([
    [1.0, 0.0],  # cat
    [0.5, 0.5],  # chased
    [0.0, 1.0],  # dog
])

scores = tokens @ tokens.T  # .T swaps the two axes of this matrix
lengths = np.linalg.norm(tokens, axis=1, keepdims=True)
if np.any(lengths == 0):
    raise ValueError("cosine similarity needs nonzero token vectors")
unit_tokens = tokens / lengths
cosines = unit_tokens @ unit_tokens.T

print("shape_rule", tokens.shape, "@", tokens.T.shape, "->", scores.shape)
print("raw_scores", scores.tolist())
print("cosine_diagonal", np.diag(cosines).round(6).tolist())
np.testing.assert_allclose(np.diag(cosines), 1.0)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
shape_rule (3, 2) @ (2, 3) -> (3, 3)
raw_scores [[1.0, 0.5, 0.0], [0.5, 0.5, 0.5], [0.0, 0.5, 1.0]]
cosine_diagonal [1.0, 1.0, 1.0]
```
<!-- leetllm: output:end -->

Later, attention will create separate query and key vectors, scale the `Q @ K.T` score grid, and convert each row into weights that sum to one.[^vaswani2017] That expression is for one 2-D pair of matrices. For a batch shaped `[B, T, D]`, use `H @ H.swapaxes(-1, -2)` to get `[B, T, T]`. Plain `H.T` reverses *all* three axes and would put batch size in the wrong place.

For the next exercise, use only the first two tokens of each prompt. All three axes now have length `2`. Reversing every axis leaves shape `(2, 2, 2)` unchanged, and a legal multiply produces the expected output shape with the wrong values. Compare against each prompt's own 2-D score grid:

<!-- leetllm: test, output=show -->
```python title="equal-sizes-can-hide-an-axis-swap.py"
import numpy as np

H = np.array([
    [[1.0, 0.0], [0.5, 0.5], [0.0, 1.0]],
    [[0.0, 1.0], [0.5, 0.5], [1.0, 0.0]],
])
H = H[:, :2, :]  # two prompts, two token positions, two features
correct = H @ H.swapaxes(-1, -2)
wrong = H @ H.T
expected = np.stack([prompt @ prompt.T for prompt in H])
np.testing.assert_allclose(correct, expected)
assert wrong.shape == correct.shape == (2, 2, 2)
assert not np.allclose(wrong, expected)
print("Original and H.T shapes:", H.shape, H.T.shape)
print("Both output shapes:", correct.shape)
print("Prompt 0 self-scores, correct:", np.diag(correct[0]).tolist())
print("Prompt 0 self-scores, wrong:  ", np.diag(wrong[0]).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Original and H.T shapes: (2, 2, 2) (2, 2, 2)
Both output shapes: (2, 2, 2)
Prompt 0 self-scores, correct: [1.0, 0.5]
Prompt 0 self-scores, wrong:   [1.0, 0.25]
```
<!-- leetllm: output:end -->

Each self-score should equal that token vector's squared length. The wrong diagonal violates that known-value check. Equal axis sizes don't make the axes interchangeable; they make semantic mistakes harder to detect.

```checkpoint
If `Q` has shape `[5, 8]` and `K` has shape `[5, 8]`, why does `Q @ K.T` have shape `[5, 5]`?
---
Transposing `K` turns `[5, 8]` into `[8, 5]`. The feature dimensions `8` meet, and the surviving dimensions describe five query positions by five key positions.
```

## Build it: trace one tiny prompt projection

Now combine the pieces in a function that accepts a batch of token sequences and a projection matrix. Convert the inputs to numeric arrays first, reject the wrong number of axes, then check feature width. `np.asarray(..., dtype=float)` also rejects ragged lists such as `[[1, 0], [0.5]]`; inspecting only the first row wouldn't catch that missing coordinate.

Use the same two-to-three projection as before. After projecting, average over token positions to produce one summary vector per prompt. NumPy's `mean(axis=1)` removes the sequence axis and retains batch and features.[^numpyMean2026]

<!-- leetllm: test, output=show -->
```python title="build-it-prompt-projection.py"
import numpy as np

def project_prompts(hidden, projection):
    try:
        hidden = np.asarray(hidden, dtype=float)
        projection = np.asarray(projection, dtype=float)
    except (TypeError, ValueError) as error:
        raise ValueError("inputs must be rectangular numeric arrays") from error
    if hidden.ndim != 3:
        raise ValueError("expected [batch, sequence, feature]")
    if projection.ndim != 2:
        raise ValueError("expected projection [input_feature, output_feature]")
    if hidden.shape[-1] != projection.shape[0]:
        raise ValueError("feature axis does not match projection input")
    if 0 in hidden.shape or 0 in projection.shape:
        raise ValueError("this exercise expects nonempty axes")
    return hidden @ projection

hidden = [
    [[1.0, 0.0], [0.5, 0.5], [0.0, 1.0]],
    [[0.0, 1.0], [0.5, 0.5], [1.0, 0.0]],
]
projection = [[1.0, 0.0, 0.5], [0.0, 1.0, 0.5]]

projected = project_prompts(hidden, projection)
prompt_summaries = projected.mean(axis=1)

print("input", np.shape(hidden), "projection", np.shape(projection))
print("projected", projected.shape)
print("prompt_summaries", prompt_summaries.tolist())
np.testing.assert_allclose(prompt_summaries, [[0.5, 0.5, 0.5]] * 2)

bad_inputs = [
    ("feature", hidden, np.zeros((3, 3))),
    ("rank", hidden, [0.0, 0.0]),
    ("ragged", [[[1.0, 0.0], [0.5]]], projection),
    ("empty", np.empty((2, 0, 2)), projection),
]
for name, bad_hidden, bad_projection in bad_inputs:
    try:
        project_prompts(bad_hidden, bad_projection)
    except ValueError as error:
        print(name, str(error))
    else:
        raise AssertionError(f"{name} input should have failed")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
input (2, 3, 2) projection (2, 3)
projected (2, 3, 3)
prompt_summaries [[0.5, 0.5, 0.5], [0.5, 0.5, 0.5]]
feature feature axis does not match projection input
rank expected projection [input_feature, output_feature]
ragged inputs must be rectangular numeric arrays
empty this exercise expects nonempty axes
```
<!-- leetllm: output:end -->

The two summaries are identical even though the token order differs. That's expected: a shared token projection followed by a mean is insensitive to permutations of the tokens. Shape checks can't make this summary understand order. Later sequence models introduce position information and interactions between tokens for that reason.

### Exclude padding from the mean

Real batches often add padding to make sequences equally long. Even zero-valued padding changes an ordinary mean: two real vectors `[1, 0]` and `[0, 1]` average to `[0.5, 0.5]`, but adding two zero rows changes that to `[0.25, 0.25]`.

A **mask** marks real positions. Add a singleton feature axis so one validity bit applies to every coordinate of its token. Sum only real vectors and divide by the count of real tokens. Reject an all-padding prompt because its mean has no valid denominator:

<!-- leetllm: test, output=show -->
```python title="pool-real-tokens-only.py"
import numpy as np

tokens = np.array([[[1.0, 0.0], [0.0, 1.0], [0.0, 0.0], [0.0, 0.0]]])
valid = np.array([[True, True, False, False]])

def masked_mean(tokens, valid):
    if tokens.ndim != 3 or valid.shape != tokens.shape[:2]:
        raise ValueError("mask must match [batch, sequence]")
    if valid.dtype != np.bool_:
        raise ValueError("mask must be boolean")
    counts = valid.sum(axis=1, keepdims=True)
    if np.any(counts == 0):
        raise ValueError("each prompt needs at least one real token")
    selected = np.where(valid[:, :, None], tokens, 0.0)
    return selected.sum(axis=1) / counts

summary = masked_mean(tokens, valid)
print("plain_mean", tokens.mean(axis=1).tolist())
print("masked_mean", summary.tolist())
np.testing.assert_allclose(summary, tokens[:, :2].mean(axis=1))
try:
    masked_mean(tokens, np.zeros_like(valid))
except ValueError as error:
    print("empty_prompt", str(error))
else:
    raise AssertionError("an all-padding prompt must fail")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
plain_mean [[0.25, 0.25]]
masked_mean [[0.5, 0.5]]
empty_prompt each prompt needs at least one real token
```
<!-- leetllm: output:end -->

The mask fixes padding bias, while order-sensitive models such as transformers add positional information and causal or attention masks separately; in real pipelines you also verify that retained token values are finite. Even as token vectors grow wide and matrices become learned parameters, the core rule stays simple: preserve batch and sequence, match the feature axis, and let the multiplication change its width.

## Recognize the shape rule inside a neural-network layer

The same matrix multiplication recurs in four shapes, and in every case the shared feature axis is the one summed away. In the table below, `N` counts rows, `D` is input width, `P` is output width, and `B` and `T` denote batch and sequence; read each rule by naming that summed axis:

| Left `@` right | Summed axis | Surviving shape |
|---|---|---|
| `[D] @ [D]` | matching length | a scalar |
| `[N, D] @ [D]` | feature length | `[N]` |
| `[N, D] @ [D, P]` | `D` | `[N, P]` |
| `[B, T, D] @ [D, P]` | `D` | `[B, T, P]` |

One orientation detail matters when you read model code. PyTorch's `torch.nn.Linear(in_features, out_features)` stores `weight` as `[out_features, in_features]`, the transpose of our `W`, and computes `input @ weight.T + bias` while preserving all input axes except the last, which becomes `out_features`.[^pytorchLinear2026] Because trailing broadcasting leaves leading dimensions untouched, `Linear(2, 3)` accepts `[B, T, 2]` directly and returns `[B, T, 3]` without flattening the batch or token axes first. The API stores the weight matrix in a transposed array layout, yet the linear transformation itself is identical, so always check how a library labels its input and output axes before transposing weights yourself.

## Test shapes before code

Keep the convention fixed: rows represent requests or token positions, and the final dimension represents features. Work through each case and verify your answer against the solution sketches below:

1. A latency feature vector has shape `[3]`, and a weight vector has shape `[3]`. What does `x @ w` return?
2. A training table `X` has shape `[20, 3]`, and `W` has shape `[3, 4]`. What does `X @ W` mean and what shape does it produce?
3. Prompt hidden states have shape `[8, 12, 64]`, and a projection has shape `[64, 16]`. Which axes remain unchanged?
4. Scores have shape `[20, 4]`. Why can adding a value of shape `[20, 1]` be a silent bug when you meant a four-feature bias?
5. Token vectors have shape `[12, 64]`. What transpose is needed to create a pairwise score grid?
6. For `H` with shape `[2, 3, 2]`, what scalar does `H[1, 2, 0]` select, and what shape does a slice that keeps every prompt and token but fixes feature `0` have?

### Solution sketches

1. It returns a scalar because matching feature positions are multiplied and summed.
2. It applies one four-output transformation to each of 20 rows, producing `[20, 4]`.
3. Batch size `8` and sequence length `12` stay unchanged; feature size changes from `64` to `16`, giving `[8, 12, 16]`.
4. `[20, 1]` legally broadcasts one different value across all four output columns in each row. The output shape looks right even though the adjustment is attached to requests instead of features.
5. Use the transpose `[64, 12]`; then `[12, 64] @ [64, 12]` produces `[12, 12]`.
6. `H[1, 2, 0]` selects the first feature of the third token in the second prompt, which is `1.0` in the running tensor. The feature-0 slice keeps prompt and token axes, giving shape `[2, 3]`.

## Carry shape rules forward

Every model operation now reads as a dimension rule:

| Object | Example shape | Question to ask |
|---|---:|---|
| Vector | `[2]` | What does each feature position mean? |
| Matrix of rows | `[3, 2]` | What does one row describe? |
| Weight matrix | `[2, 3]` | Which input feature axis must match? |
| Tensor | `[2, 3, 2]` | What do batch, sequence, and feature axes mean? |
| Indexing | `H[b, t, d]` | Which prompt, token position, and feature does this value select? |
| Similarity grid | `[3, 3]` | Which vector pairs produced these dot products? |

Check the meeting dimensions before running a matrix multiply, name the mismatched axis when an operation fails, and verify which axis a broadcast repeats along even when addition succeeds without error. You can now represent a latency row as a vector, stack rows into a matrix, and project a token tensor without guessing shapes. The next question is whether the matrix carries genuinely independent feature directions or repeats the same mixture, which **matrix rank** and **singular value decomposition** (SVD) reveal in the next lesson.

```mastery-quiz
[
  {
    "question": "A latency rule is 3×prompt_blocks + 0.5×queue_seconds. A payload stores [queue_seconds,prompt_blocks]=[2,4], but inference pairs it with weights [3,0.5]. Which computed value and diagnosis follow?",
    "options": [
      "8 seconds; the feature positions are paired with the wrong weights.",
      "13 seconds; equal vector lengths preserve the original feature meanings.",
      "8 seconds; this is the intended latency rule in the documented order.",
      "13 seconds; transposing the payload automatically restores feature meanings."
    ],
    "answer": "8 seconds; the feature positions are paired with the wrong weights.",
    "explanation": "The code computes 2×3+4×0.5=8. The intended rule gives 4×3+2×0.5=13. Equal lengths allow the incorrect calculation; restoring the named feature order or reordering the weights repairs it. A transpose changes array orientation rather than feature identity."
  },
  {
    "question": "A request uses features `x=[3,2]` and weights `w=[1.5,4.0]` in matching order. Which operation returns one latency prediction?",
    "options": [
      "Add corresponding entries: `[3+1.5, 2+4] = [4.5, 6]`.",
      "Sum corresponding products: `3*1.5 + 2*4 = 12.5`.",
      "Keep corresponding products: `[3*1.5, 2*4] = [4.5, 8]`.",
      "Average corresponding products: `(3*1.5 + 2*4)/2 = 6.25`."
    ],
    "answer": "Sum corresponding products: `3*1.5 + 2*4 = 12.5`.",
    "explanation": "Elementwise multiplication gives `[4.5, 8]`; the prediction rule sums those contributions. Averaging them would halve the result."
  },
  {
    "question": "A request table X has shape [7,5], and W has shape [5,4] with one column per output feature. What is the shape and meaning of X @ W?",
    "options": [
      "Shape [4]: one four-output vector aggregated across all seven requests.",
      "Shape [7,5]: five transformed values for each of the seven requests.",
      "Shape [7,4]: four output values for each of the seven requests.",
      "Shape [4,7]: four output rows, each containing seven request values."
    ],
    "answer": "Shape [7,4]: four output values for each of the seven requests.",
    "explanation": "The five input-feature positions are multiplied and summed for each request/output pair. The seven request rows and four output columns survive. Contracting the feature axis does not aggregate request rows."
  },
  {
    "question": "A projection expects hidden tensors `[batch,sequence,feature]` and matrices `[input_feature,output_feature]`. For hidden `[4,10,32]` and projection `[16,64]`, which guard should reject the call?",
    "options": [
      "Reject the hidden rank: the shared projection requires hidden states with exactly two axes.",
      "Reject the batch size: the projection needs four rows to match the four input prompts.",
      "Reject the sequence length: the projection needs ten rows to match the ten token positions.",
      "Reject the feature width: each token provides 32 features but the projection expects 16."
    ],
    "answer": "Reject the feature width: each token provides 32 features but the projection expects 16.",
    "explanation": "The last hidden axis is the vector consumed independently at each batch and token position. Transposing can change orientation but cannot invent the missing agreement between feature meanings."
  },
  {
    "question": "Hidden states have shape [3,7,4] with axes [prompt,token,feature]. A shared projection has shape [4,6]. Which output preserves independent prompt and token positions?",
    "options": [
      "[3,7,6]: three prompts, seven token positions and six output features.",
      "[3,6]: three prompts, each reduced to one six-feature summary.",
      "[7,3,6]: seven token positions, then three prompts and six features.",
      "[3,4,6]: three prompts, four input features and six output features."
    ],
    "answer": "[3,7,6]: three prompts, seven token positions and six output features.",
    "explanation": "The four input features contract with the projection input axis. Each of the 21 token vectors receives the same map, while prompt and token positions retain their meaning. A separate reduction would be needed to remove tokens."
  },
  {
    "question": "A NumPy output array has shape [5,4], with one row for each of five requests and one column for each of four features. Each feature needs its own offset, shared across requests. Which bias array shape lets you add those offsets directly to the output?",
    "options": [
      "[4]",
      "[4,1]",
      "[5,1]",
      "[1]"
    ],
    "answer": "[4]",
    "explanation": "NumPy lines up shapes from the right. With [4], each offset lines up with a feature column and applies to all five rows. An explicit row with shape [1,4] would work too. With [4,1], the four entries line up with the five requests, so the addition fails. A [5,1] bias adds one offset per request across all four features. A [1] bias adds the same offset to every cell."
  },
  {
    "question": "Token vectors have shape `[4,6]`, with four positions and six features. Which product forms raw pairwise position scores?",
    "options": [
      "`tokens.T @ tokens`, giving a `[6,6]` matrix of feature-pair products summed over positions.",
      "`tokens * tokens`, giving a `[4,6]` matrix of squared feature values for each position.",
      "`tokens @ tokens.T`, giving a `[4,4]` matrix of position-pair dot products summed over features.",
      "`tokens @ tokens.T`, giving a `[4,4]` matrix with every diagonal entry necessarily equal to one."
    ],
    "answer": "`tokens @ tokens.T`, giving a `[4,4]` matrix of position-pair dot products summed over features.",
    "explanation": "The transpose changes `[4,6]` to `[6,4]`, so the inner six dimensions meet and the result indexes four query and four key positions. Cosine similarity divides the dot product by both vector norms; raw dot products also reflect vector magnitude."
  },
  {
    "question": "A prompt has three real vectors [2,0], [0,3], [1,3], followed by one zero-padding vector. Which summary and denominator exclude padding?",
    "options": [
      "[0.75,1.5]; divide the real-vector sum by padded length four.",
      "[3,6]; retain the real-vector sum without dividing.",
      "[0,0]; average only the padding positions.",
      "[1,2]; divide the real-vector sum by valid count three."
    ],
    "answer": "[1,2]; divide the real-vector sum by valid count three.",
    "explanation": "The real vectors sum to [3,6], and three real positions give mean [1,2]. Dividing by four dilutes both coordinates. The validity mask determines the denominator; removing padding does not remove the mean reduction."
  },
  {
    "question": "H has shape [3,5,4] with axes [prompt,token,feature]. What does H[2,3,1] select, and what shape does H[:,:,1] retain?",
    "options": [
      "A scalar at prompt 2, token 3, feature 1; the slice has shape [3,5].",
      "A scalar at prompt 2, token 3, feature 1; the slice has shape [3,5,1].",
      "The full vector of token 3 in prompt 2; the slice has shape [3,5].",
      "A scalar at prompt 1, token 3, feature 2; the slice has shape [5,3]."
    ],
    "answer": "A scalar at prompt 2, token 3, feature 1; the slice has shape [3,5].",
    "explanation": "Each integer index consumes its named axis. Three integers select a scalar; two full slices retain prompt and token axes while the feature integer removes the last axis. Use 1:2 in the feature slot to preserve a singleton feature axis."
  },
  {
    "question": "For H=[[[2,0],[1,1]], [[0,2],[1,1]]], both H @ H.T and H @ H.swapaxes(-1,-2) produce shape [2,2,2]. Which expression and first-prompt diagonal match raw token self-scores?",
    "options": [
      "H @ H.T; diagonal [4,1], because the output shape matches.",
      "H @ H.swapaxes(-1,-2); diagonal [4,2], from each token’s squared length.",
      "H @ H.swapaxes(-1,-2); diagonal [1,1], because raw dot products normalize lengths.",
      "H @ H.T; diagonal [4,2], because .T swaps only the last two axes."
    ],
    "answer": "H @ H.swapaxes(-1,-2); diagonal [4,2], from each token’s squared length.",
    "explanation": "The first prompt’s vectors have squared lengths 2²+0²=4 and 1²+1²=2. Swapping only the final axes preserves prompt ownership. H.T reverses all three axes; equal axis sizes conceal the shape error, while its actual first diagonal [4,1] exposes the semantic error."
  }
]
```

> **Next:** Continue to [Linear Algebra for ML](/learn/linear-algebra-machine-learning-deeper). You can now trace a named vector, a row matrix, a token tensor, and a dot-product grid without guessing shapes. Next you'll look inside a matrix of rows and measure which feature mixes are actually strong, using SVD, rank, and conditioning.
