---
{
  "id": "sentence-embeddings-contrastive-learning",
  "title": "Sentence Embeddings & Contrastive Loss",
  "slug": "sentence-embeddings-contrastive-learning",
  "category": "Embeddings & Vector Search",
  "difficulty": "Hard",
  "coverImage": "social_banner.png",
  "companies": [
    "Google",
    "OpenAI",
    "Cohere",
    "Meta",
    "Microsoft"
  ],
  "shortDescription": "Train vectors so the right passage outranks a lookalike, then check that ranking against hard negatives, reranking cost, and a smaller index.",
  "keyConceptsTested": [
    "InfoNCE contrastive loss derivation and implementation",
    "Temperature parameter effect on training dynamics",
    "Hard negative mining strategies (BM25, cross-encoder, iterative)",
    "Bi-encoder vs cross-encoder speed-accuracy tradeoff",
    "Late interaction models (ColBERT MaxSim)",
    "Matryoshka Representation Learning for flexible dimensionality",
    "Instruction-tuned embeddings for task adaptation",
    "STS vs MTEB evaluation and task coverage",
    "Two-stage retrieval: bi-encoder + cross-encoder reranking"
  ],
  "section": "Transformer Deep Dives",
  "order": 1
}
---

Consider a search over transformer architecture notes for the query "How does RoPE encode token position?" Two candidate passages share nearly the same technical vocabulary. One explains how Rotary Position Embeddings rotate query and key pairs in two-dimensional subspaces by an angle $m\theta$ so dot products reflect relative offset. The other describes adding learned absolute position vectors from a lookup table before the first attention layer.

Both passages mention positions, vectors, and attention, yet only the first answers the mechanism behind RoPE. A **<span data-glossary="embedding">sentence embedding</span>** compresses each string into one fixed-width <span data-glossary="vector">vector</span> so a retriever can rank candidates efficiently. <span data-glossary="contrastive-learning">Contrastive learning</span> shapes that vector geometry so the matching passage lands nearer the query than topic-adjacent distractors. A fast baseline simply averages token vectors, which immediately tests whether bag-of-words arithmetic preserves enough structure for ranking.

| Query | Passage that should rank near it | Topic-adjacent non-match |
|---|---|---|
| "How does RoPE encode token position?" | "Rotate query and key pairs by angle mθ so dot products encode relative offset." | "Add learned absolute position tables before the first attention layer." |

Keep this target ordering in view throughout training: the RoPE mechanism guide must score above the absolute-position distractor. A falling training loss without higher held-out recall can indicate easy batches rather than a better retriever. Evaluating rankings directly against hard lookalikes separates genuine progress from trivial negative separation.

## From word embeddings to sentence embeddings

[Word embeddings](/learn/word-embeddings-contextual-representations) gave individual <span data-glossary="token">tokens</span> numerical coordinates. Retrieval has to compare variable-length queries and passages with one reusable vector. A sentence encoder performs that compression while trying to preserve the distinctions its task needs from nearby texts.

Averaging context-free word vectors is a useful baseline because it is fast and transparent. It also isolates two functions that are often conflated: <span data-glossary="mean-pooling">mean pooling</span> collapses token states into a single vector, whereas the contrastive objective teaches the encoder which texts belong together. Separating the pooling arithmetic from the training loss makes it easy to inspect what averaging preserves and what it discards.

Mean pooling inside a trained sentence encoder can work well because contextual representations already encode phrase structure. Averaging static word vectors without context acts quite differently. If vector addition treats a sentence as an unordered bag of words, swapping two words in opposite syntactic roles will map distinct meanings to identical coordinates.

## Why pooling alone isn't enough

### Mean pooling of word embeddings

Averaging static word vectors is commutative, so swapping two words leaves the sum unchanged. Running `np.mean` over static lookup vectors for `"compiler calls linker"` and `"linker calls compiler"` makes that invariance immediately inspectable. Even with exact three-dimensional coordinates per word, unweighted averaging collapses two opposite dependency directions into a single vector:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="mean_pool.py"
import numpy as np

word_vectors = {
    "compiler": np.array([0.9, 0.1, 0.0]),
    "calls": np.array([0.8, 0.2, 0.1]),
    "linker": np.array([0.7, 0.1, 0.2]),
    "build": np.array([0.1, 0.9, 0.2]),
    "failed": np.array([0.2, 0.8, 0.1]),
}

def mean_pool(sentence: str, table: dict[str, np.ndarray]) -> np.ndarray:
    vecs = [table[tok] for tok in sentence.lower().split() if tok in table]
    if not vecs:
        raise ValueError("at least one known token is required")
    return np.mean(np.stack(vecs), axis=0)

pooled_a = mean_pool("compiler calls linker", word_vectors)
pooled_b = mean_pool("linker calls compiler", word_vectors)

print("A:", np.round(pooled_a, 3).tolist())
print("B:", np.round(pooled_b, 3).tolist())
print("Same vector:", np.allclose(pooled_a, pooled_b))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
A: [0.8, 0.133, 0.1]
B: [0.8, 0.133, 0.1]
Same vector: True
```
<!-- leetllm: output:end -->

The final line exposes the failure: both sentences produce identical coordinates because averaging **static** word vectors erases word order. Unknown tokens are skipped cleanly unless none match the table. Mean pooling contextual Transformer hidden states behaves differently because self-attention has already folded surrounding context and positional encodings into each token vector before the average runs.

```checkpoint
Why can mean pooling make "compiler calls linker" and "linker calls compiler" identical?
---
Mean pooling adds the same token vectors and divides by the same count. Addition doesn't preserve order, so both sentences get the same average even though they reverse which build component calls the other.
```

#### What averaging throws away

Reversing two tokens is the clearest collision. The same operation also loses other signals a retrieval distinction may need:

- Word order: "compiler calls linker" and "linker calls compiler" get the same vector because addition is commutative ($A+B = B+A$).
- Common-word dilution: Frequent words and boilerplate can wash out rare, informative tokens.
- No context: Static averaging shifts a query identically for every sense of `"head"`, whether text discusses multi-head attention or linked-list pointers.

### [CLS] token from BERT

Taking the [CLS] (Classification) token from BERT (Bidirectional Encoder Representations from Transformers) and treating it as a sentence vector is a tempting shortcut. BERT's original pair architecture feeds both texts through one Transformer for a joint task. Its [CLS] state isn't trained by default so that independently encoded sentences can be ranked by cosine similarity.

That joint path also has the wrong serving shape for a large corpus. Reimers and Gurevych estimated about 50 million pair inferences, or roughly 65 hours on a V100, to find the nearest pair in 10,000 sentences. SBERT (Sentence-BERT) instead encodes each sentence once, then compares the cached vectors with <span data-glossary="cosine-similarity">cosine similarity</span>.[^reimers2019]

The same paper measured how the shortcuts behave. Across seven semantic textual similarity (STS) tasks, raw [CLS] averaged 29.19 and mean-pooled BERT states averaged 54.81, reporting <span data-glossary="spearman-rank-correlation">Spearman rank correlation</span> multiplied by 100. Averaged GloVe (Global Vectors) scored 61.32. These are historical baselines; both pooling choices can work after sentence-level training.[^reimers2019]

#### Anisotropy, collapse, and rankings

One possible obstacle is <span data-glossary="anisotropy">anisotropy</span>: embedding directions occupy some regions more densely than others. Ethayarajh measured this in contextual **word** representations from BERT, ELMo, and GPT-2, with substantial differences between layers.[^ethayarajh2019] That layer behavior does not by itself explain every sentence-retrieval failure.

Uniformly distributed unit vectors have expected pairwise cosine zero. A shared directional component can instead cluster embeddings into a narrow cone, making many unrelated cosines positive. **Representation collapse** is a more severe failure where distinct inputs map to nearly identical coordinates and lose rankable differences. Anisotropy alone does not imply collapse, and selecting `[CLS]` simply picks one hidden state rather than pooling across tokens.

The `intfloat/e5-base-v2` model card describes cosines concentrated around 0.7–1.0 and emphasizes **relative ordering**.[^e5BaseV2Card2026] High baseline scores can still support useful retrieval when the right passages outrank distractors on held-out queries. Inspect score distributions alongside Recall@K. Calibrate any acceptance threshold on labeled cases, and estimate relevance probabilities separately if the application needs them.

<figure>
  <img src="illustrations/_generated/embedding_space_geometry_dark.png" alt="Equal-scale unit circle for a RoPE query at 0 degrees. The positive RoPE guide sits at 6 degrees (cosine 0.995). A hard negative begins at negative 6 degrees (cosine 0.995) before training and separates to 120 degrees (cosine negative 0.500) at the target." />
  <figcaption>A query vector at 0° sits close to its matching guide at 6°. Training separates a crowded distractor from −6° to 120° while keeping the positive aligned.</figcaption>
</figure>

#### Alignment vs uniformity on the unit hypersphere

Wang and Isola analyzed two properties of normalized representations on the unit hypersphere $\mathcal{S}^{d-1}$:[^wang2020]

1. **Alignment:** Positive pairs $(x, x^+)$ should map nearby. One alignment metric is the expected **squared** Euclidean distance:

   $$
   \mathcal{L}_{\text{align}}(f) \triangleq \mathbb{E}_{(x, x^+) \sim p_{\text{pos}}} \left[ \|f(x) - f(x^+)\|_2^2 \right]
   $$

   Because $\|u - v\|_2^2 = \|u\|_2^2 + \|v\|_2^2 - 2(u^\top v) = 2 - 2(u^\top v)$ for unit vectors, minimizing alignment loss directly maximizes cosine similarity $u^\top v \to 1$.

2. **Uniformity:** A second metric rewards spreading sampled representations across the sphere:

   $$
   \mathcal{L}_{\text{uniform}}(f; t) \triangleq \log \mathbb{E}_{x, y \overset{i.i.d.}{\sim} p_{\text{data}}} \left[ \exp\left(-t \|f(x) - f(y)\|_2^2\right) \right], \quad t > 0
   $$

   Nearby pairs contribute more to this Gaussian kernel average than distant pairs. Minimizing it discourages crowding across the distribution. Alignment still pulls semantic positives together.

For a fixed $\tau>0$, a shared unit-normalized encoder, and independently sampled negatives from $p_{\text{data}}$, their population contrastive loss has this infinite-negative limit:

$$
\lim_{K \to \infty} \mathcal{L}_{\text{InfoNCE}}(f; \tau, K) - \log K = -\frac{1}{\tau} \mathbb{E}_{(x, x^+)} [f(x)^\top f(x^+)] + \mathbb{E}_x \left[ \log \mathbb{E}_{y} \left[ \exp\left( \frac{f(x)^\top f(y)}{\tau} \right) \right] \right]
$$

The first term is alignment up to scaling and an additive constant. The second is **related to**, but not equal to, the uniformity metric above: here the outer expectation contains a logarithm; in $\mathcal{L}_{\text{uniform}}$ the logarithm sits outside the pairwise expectation. The paper relates their minimizers under its assumptions. It does not prove that every finite minibatch produces uniformly distributed, useful sentence embeddings.

---

## Contrastive learning for sentence embeddings

### The core idea

Now turn the retrieval failure into a training target. For each query, name a passage that should be nearby and candidates that should not. Contrastive training reshapes the space so that ordering becomes part of the representation instead of a hope at serving time.

**Cosine similarity** measures the angle between two vectors and ignores their length. For two unit vectors, it's their <span data-glossary="dot-product">dot product</span>: +1 is the same direction, 0 is orthogonal, and a negative value is opposing.

Cosine describes vector geometry. Training must make that geometry useful for the intended relevance relation, and evaluation must check the resulting rankings. Here we train the encoder to rank the true passage first.

SimCSE (Simple Contrastive Learning of Sentence Embeddings) showed how lightweight pair construction can be: pass the same sentence through an encoder twice with independent dropout masks to create two correlated views that act as a positive pair.[^gao2021] Because each forward pass drops different hidden activations, the network learns instance-level consistency without manually labeled paraphrases. E5 later scaled dual-encoder training to a large weakly supervised query-passage corpus so single-vector geometry aligns directly with search relevance.[^wang2022a]

The batch-ranking objective used throughout modern bi-encoders is **<span data-glossary="infonce">InfoNCE</span>**, which asks each anchor vector to rank its matched partner above every other candidate in the mini-batch. Each forward step maps queries and passages through the shared encoder into normalized rows and columns of a similarity matrix whose diagonal tracks matching pairs. InfoNCE evaluates cross-entropy across every row, sending corrective gradients backward into weights before the next optimization step.

<figure>
  <img src="illustrations/_generated/contrastive_learning_dark.png" alt="A 0-to-1 cosine scale ranks a matching RoPE rotation positive at 0.91, an absolute-position hard negative at 0.42, and an NF4 quantization easy negative at 0.11. Positive gaps are 0.49 and 0.80. At fixed temperature tau, the higher-scoring negative carries larger softmax probability P_j and stronger score gradient P_j divided by tau." />
  <figcaption>Ranking pressure across three candidate scores: the higher-scoring hard negative receives a larger score derivative at the same temperature; the actual parameter update propagates through the encoder's Jacobian.</figcaption>
</figure>

### InfoNCE loss

We want the matching RoPE explanation close to the query and every non-match farther away. InfoNCE frames that ranking problem as row-wise classification across the batch: for each query row, which passage column is its true partner? In a two-pair batch, query $q_1$ pairs with passage $p_1$ at similarity $0.90$ and sees $p_2$ at similarity $0.20$.

Because dot products of L2-normalized vectors equal cosine similarities, the entire batch interaction simplifies into one matrix product:

| Query | Positive | Similarity |
|-------|----------|------------|
| $q_1$ | $p_1$ | 0.90 |
| $q_1$ | $p_2$ | 0.20 |
| $q_2$ | $p_1$ | 0.15 |
| $q_2$ | $p_2$ | 0.85 |

For query $q_1$, the true match is $p_1$ (similarity 0.90). The other passage in the batch, $p_2$, acts as an in-batch negative (similarity 0.20). InfoNCE turns that ordering into probability: it wants the model to make $p_1$ more likely than $p_2$.

For this worked row, choose a sharp <span data-glossary="temperature">temperature</span> $\tau = 0.05$ and compute the loss contribution for $q_1$ step by step:

1. Scale the similarities into <span data-glossary="logits">logits</span>: positive logit = $0.90 / 0.05 = 18.0$, negative logit = $0.20 / 0.05 = 4.0$
2. Exponentiate (this turns logits into unnormalized probabilities): $\exp(18.0) \approx 65{,}659{,}969$, $\exp(4.0) \approx 54.6$
3. Normalize with <span data-glossary="softmax">softmax</span> into a probability for the positive: $65{,}659{,}969 / (65{,}659{,}969 + 54.6) \approx 0.99999917$
4. Take negative log: $-\log(0.99999917) \approx 0.00000083$ (tiny loss; the model is already very confident)

If the model were wrong ($q_1$ similarity to $p_1$ only 0.20, to $p_2$ 0.90), the positive probability would drop to about $8.3 \times 10^{-7}$ and the loss would jump to roughly 14 nats. The optimizer would receive a strong gradient pushing the correct pair closer.

<figure>
  <img src="illustrations/_generated/info_nce_matrix_dark.png" alt="A two-pair cosine matrix has q1-to-p1 0.90, q1-to-p2 0.20, q2-to-p1 0.15, and q2-to-p2 0.85; diagonal cells are labeled positives. For q1 at temperature 0.05, scores 0.90 and 0.20 become logits 18 and 4, then stable logits 0 and negative 14. Their exponential masses are 1 and about 8.3 times 10 to the negative 7. Softmax gives p1 probability 0.99999917 and p2 probability 0.00000083, so q1 loss is about 8.3 times 10 to the negative 7. Swapping the scores gives loss about 14." />
  <figcaption>InfoNCE reads each similarity row as a multiple-choice question where the diagonal passage is the correct answer and off-diagonal passages are in-batch negatives.</figcaption>
</figure>

```checkpoint
In the $q_1$ example, why is the loss tiny when the positive similarity is 0.90 and the negative similarity is 0.20?
---
After temperature scaling, the positive logit is much larger than the negative logit. Softmax assigns almost all probability to the true match, so $-\log(p_\text{positive})$ is near zero.
```

The one-positive, query-to-passage InfoNCE form for a batch of $N$ positive pairs is:[^oord2018]

$$
\mathcal{L} = -\frac{1}{N} \sum_{i=1}^{N} \log \frac{\exp(\text{sim}(z_i, z_i^+) / \tau)}{\sum_{j=1}^{N} \exp(\text{sim}(z_i, z_j^+) / \tau)}
$$

#### Reading the formula

For each example $i$, the numerator gives the true match $z_i^+$ its score. The denominator adds that positive to every candidate in the batch, turning the row into a multiple-choice question.

Temperature $\tau$ controls how sharply those logits separate. The loss therefore asks for one concrete change: make the true pair more likely than every alternative in the batch.

Where:
- $z_i, z_i^+$ are embeddings of a positive pair (e.g., query and relevant document)
- $\tau$ is the temperature parameter
- All non-matching examples in that denominator act as **in-batch negatives**

Vectorized InfoNCE uses the same matrix multiplication `queries @ positives.T` that powers production contrastive trainers, paired with log-sum-exp stabilization over each row:

<!-- leetllm: test, deps=numpy, id=sentence-info-nce, output=show -->
```python title="info_nce.py"
import numpy as np

def normalize(vector) -> np.ndarray:
    arr = np.asarray(vector, dtype=np.float64)
    scale = float(np.max(np.abs(arr)))
    if scale == 0.0:
        raise ValueError("vector must be nonzero")
    scaled = arr / scale
    return scaled / np.linalg.norm(scaled)

def dot(left, right) -> float:
    return float(np.dot(left, right))

def row_cross_entropy(logits, correct: int) -> float:
    arr = np.asarray(logits, dtype=np.float64)
    peak = float(np.max(arr))
    return float(np.log(np.sum(np.exp(arr - peak))) + (peak - arr[correct]))

def info_nce_loss(
    query_vectors,
    positive_vectors,
    temperature: float = 0.2,
) -> float:
    if temperature <= 0:
        raise ValueError("temperature must be positive")
    queries = np.stack([normalize(v) for v in query_vectors])
    positives = np.stack([normalize(v) for v in positive_vectors])
    logits = (queries @ positives.T) / temperature
    losses = [row_cross_entropy(row, idx) for idx, row in enumerate(logits)]
    return float(np.mean(losses))

query_vectors = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]]
positive_vectors = [
    [0.90, 0.15, float(np.sqrt(1 - 0.90**2 - 0.15**2))],
    [0.20, 0.85, float(np.sqrt(1 - 0.20**2 - 0.85**2))],
]

loss = info_nce_loss(query_vectors, positive_vectors, temperature=0.05)
score_pos = dot(normalize(query_vectors[0]), normalize(positive_vectors[0]))
score_neg = dot(normalize(query_vectors[0]), normalize(positive_vectors[1]))
extreme_loss = row_cross_entropy([1000.0, 986.0], correct=0)

print("loss:", f"{loss:.8f}")
print("q1 positive score:", round(score_pos, 4))
print("q1 negative score:", round(score_neg, 4))
print("stable large-logit loss:", f"{extreme_loss:.8f}")
print("tied extreme logits:", f"{row_cross_entropy([1e308, 1e308], 0):.6f}")
print("tiny vector:", np.round(normalize([1e-300, 1e-300]), 6).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
loss: 0.00000083
q1 positive score: 0.9
q1 negative score: 0.2
stable large-logit loss: 0.00000083
tied extreme logits: 0.693147
tiny vector: [0.707107, 0.707107]
```
<!-- leetllm: output:end -->

The equation is often written with raw exponentials on paper, whereas floating-point code subtracts the row maximum before exponentiating. Keeping `(peak - logits[correct])` separate from the log-sum term avoids catastrophic cancellation when `peak` dwarfs the margin, so tied logits return $\log 2$ even near $10^{308}$. Pre-scaling by `max(abs(arr))` before calling `np.linalg.norm` similarly prevents underflow on subnormal vectors like `[1e-300, 1e-300]`.

#### Tensor shapes and one backward pass

In a real encoder, token states have shape `[batch, tokens, hidden]`. Mask padding before mean pooling, then normalize the pooled vectors when the loss uses cosine. Applying a binary attention mask directly before mean pooling isolates how gradients stop at padding tokens:

<!-- leetllm: test, deps=torch, output=show -->
```python title="tensor_info_nce.py"
import torch
import torch.nn.functional as F

torch.set_default_dtype(torch.float64)
states = torch.tensor([
    [[1., 0.], [0., 1.], [99., 99.]],
    [[0., 2.], [0., 0.], [99., 99.]],
], requires_grad=True)
mask = torch.tensor([[1., 1., 0.], [1., 0., 0.]])
counts = mask.sum(dim=1, keepdim=True)
if torch.any(counts == 0):
    raise ValueError("each sequence needs a non-padding token")
pooled = (states * mask.unsqueeze(-1)).sum(dim=1) / counts
print("masked means:", pooled.detach().tolist())

queries = F.normalize(pooled, dim=-1)
passages = F.normalize(torch.tensor([[1., 0.], [0., 1.]]), dim=-1)
logits = queries @ passages.T / 0.2
targets = torch.arange(len(queries))
loss = F.cross_entropy(logits, targets)
loss.backward()

print("mean row loss:", f"{loss.item():.6f}")
print("padding gradient:", states.grad[:, 2, :].tolist())
print("first token gradient:", [round(v, 6) for v in states.grad[0, 0].tolist()])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
masked means: [[0.5, 0.5], [0.0, 2.0]]
mean row loss: 0.349931
padding gradient: [[-0.0, 0.0], [0.0, 0.0]]
first token gradient: [-0.883883, 0.883883]
```
<!-- leetllm: output:end -->

The first row initially ties both passages with loss $\log 2$, while the second aligns with its positive. Gradients flow cleanly back into unmasked token states through pooling and normalization, while padding tokens receive zero gradient. An actual training loop propagates these gradients through the transformer layers before stepping the optimizer.

#### Dual (symmetric) InfoNCE

The formula above is **query → candidate** only: each query row treats other positives in the batch as negatives. Many dual-encoder and multimodal recipes also run the reverse direction and average both:

$$
\mathcal{L}_{\text{dual}} = \frac{1}{2}\left(\mathcal{L}_{q \to d} + \mathcal{L}_{d \to q}\right)
$$

On the same $N \times N$ similarity matrix $S_{ij} = \text{sim}(z_i^{q}, z_j^{d}) / \tau$:

- **Row CE** ($\mathcal{L}_{q \to d}$): for each query $i$, the correct column is $i$ (query ranks its matched document).
- **Column CE** ($\mathcal{L}_{d \to q}$): for each document $j$, the correct row is $j$ (document ranks its matched query).

CLIP uses this symmetric objective for image↔text.[^radford2021] Asymmetric serving doesn't forbid symmetric training. The reverse loss adds the assumption that each passage has one correct query in this batch, which may be wrong when several queries share a relevant passage. Choose the objective from the labels and compare held-out query-to-document retrieval. Bi-encoder towers may share weights, as in a Siamese encoder, or use separate parameters.

### Triplet loss

InfoNCE compares one anchor with a candidate pool. A second contrastive objective, **<span data-glossary="triplet-loss">triplet loss</span>**, focuses on one anchor-positive-negative triplet instead, making the required distance gap explicit:

$$
\mathcal{L} = \max(0, d(a, p) - d(a, n) + m)
$$

Where:
- $d(\cdot, \cdot)$ is the Euclidean distance between embeddings
- $m$ is a **margin** hyperparameter
- $a$ is the anchor, $p$ is the positive, $n$ is the negative

The loss enforces that the anchor must be **closer** to the positive than to the negative by at least margin $m$: $d(a, p) + m \leq d(a, n)$. If this constraint is already satisfied, the loss is zero. The margin prevents the model from wasting capacity pushing already-distant negatives even farther away.

#### Worked example: computing triplet loss by hand

Consider three transformer architecture descriptions. With the positive at distance $0.2$ and the negative at $0.5$, a margin $m = 0.1$ already leaves slack, whereas a tighter margin leaves error to minimize:

| Role | Sentence |
|------|----------|
| Anchor ($a$) | "How does RoPE encode token position?" |
| Positive ($p$) | "Rotary embeddings rotate query and key pairs by angle mθ." |
| Negative ($n$) | "Absolute position embeddings add a learned vector before layer 0." |

After encoding, suppose the distances are:
- $d(a, p) = 0.2$ (the paraphrase is close)
- $d(a, n) = 0.5$ (the hard negative is farther, but not by much)

With margin $m = 0.1$, plug into the formula:

$$
0.2 - 0.5 + 0.1 = -0.2
$$

$$
\max(0, -0.2) = 0
$$

The loss is zero because the model already satisfies the margin constraint: the positive is closer than the negative by more than 0.1. Now imagine a bad model where $d(a, p) = 0.5$ and $d(a, n) = 0.3$ (the negative is closer than the positive):

$$
0.5 - 0.3 + 0.1 = 0.3
$$

$$
\max(0, 0.3) = 0.3
$$

A non-zero loss tells the optimizer to push the anchor and positive together while pushing the negative away until the gap exceeds the margin.

```checkpoint
For triplet loss, what does zero loss mean?
---
It means the positive is already closer to the anchor than the negative by at least the margin. The model doesn't need to spend more gradient on that triplet.
```

#### Comparing the learning signal

Triplet loss makes the required distance gap explicit. InfoNCE makes competition across a candidate pool explicit. Neither choice removes the need to inspect your labels and training batches:

1. **Comparison unit:** One triplet term contains one negative, but a training step can batch many triplets, mine within the batch, or aggregate multiple negatives per anchor.
2. **Inactive examples:** A satisfied triplet has zero hinge loss. Many satisfied triplets can provide little signal, so the margin and sampling policy matter.
3. **Candidate competition:** InfoNCE scores several candidates in one softmax. A negative's score gradient depends on its probability in that pool; an easy row can still saturate.

InfoNCE has no explicit distance margin $m$. It has other design choices, including temperature, pool size, and negative sampling. Sentence Transformers still documents both triplet objectives and batch-ranking objectives; select a loss that fits your data, then compare held-out retrieval.[^sentenceLosses2026]

### Temperature parameter τ and gradient dynamics

Temperature $\tau$ controls the sharpness of the softmax probability distribution over candidate similarities. It directly governs gradient magnitude and how aggressively the loss concentrates learning pressure on hard negatives.

Let $s_j = \text{sim}(q, c_j)$ denote the cosine similarity between query $q$ and candidate $c_j$. The softmax probability assigned to candidate $c_j$ is:

$$
P_j = \frac{\exp(s_j / \tau)}{\sum_k \exp(s_k / \tau)}
$$

For **one row**, differentiating its InfoNCE loss with respect to the similarity scores gives:
- For the true positive candidate $p^+$: $\frac{\partial \mathcal{L}}{\partial s^+} = -\frac{1}{\tau} (1 - P^+)$
- For any negative candidate $n_j^-$: $\frac{\partial \mathcal{L}}{\partial s_j^-} = \frac{1}{\tau} P_j$

These two derivatives expose the twin mathematical roles of temperature $\tau$:

1. **Scale and saturation:** The factor $\frac{1}{\tau}$ increases as $\tau$ decreases, but $P_j$ changes too. Gradients can shrink on an easy row as its positive probability approaches 1. A mean over $N$ rows adds a factor $1/N$ to each row's contribution.
2. **Hard-negative weighting (hardness-aware gradients):** Compare the gradient penalties applied to two distinct negative candidates $n_1^-$ and $n_2^-$ with similarities $s_1^-$ and $s_2^-$:

   $$
   \frac{\partial \mathcal{L} / \partial s_1^-}{\partial \mathcal{L} / \partial s_2^-} = \frac{P_1}{P_2} = \exp\left( \frac{s_1^- - s_2^-}{\tau} \right)
   $$

This relative penalty grows exponentially with the similarity difference divided by $\tau$:
- **Low temperature (such as $\tau = 0.05$):** Suppose a hard negative scores $s_1^- = 0.72$ and an easy negative scores $s_2^- = 0.20$ (a gap of $\Delta s = 0.52$). The gradient ratio is $\exp\left(\frac{0.52}{0.05}\right) = \exp(10.4) \approx 32{,}860$.
  This ratio compares **partial derivatives with respect to two scores**. To obtain encoder parameter updates, propagate through the encoder's Jacobians and combine contributions from shared parameters and other rows before applying the optimizer.
- **High temperature (such as $\tau = 1.00$):** For that exact same gap of $0.52$, the gradient ratio is $\exp\left(\frac{0.52}{1.00}\right) \approx 1.68$.
  The score-gradient contributions are more evenly distributed. Whether that improves retrieval depends on which negatives and labels are trustworthy.

#### Temperature tradeoffs and failure modes

Choosing temperature is therefore a balance between sharpness and stability:
- **Large $\tau$:** Probabilities flatten for fixed scores. In the limit $\tau\to\infty$, score gradients vanish because of $1/\tau$. This doesn't imply every finite larger temperature gives a smaller gradient.
- **Small $\tau$:** A clearly correct row can have almost no gradient, while a tie or misranked negative can have a large gradient. A false negative that wins substantial softmax mass then receives unwanted separation pressure. Per-row score-gradient magnitudes are capped at $1/\tau$, though their ratio to another negative can be much larger.

Tune $\tau$ against held-out retrieval metrics and gradient behavior. E5 documents $\tau = 0.01$.[^e5BaseV2Card2026] Sentence Transformers' `MultipleNegativesRankingLoss` defaults to `scale=20`, equivalent to $\tau=0.05$ when using cosine.[^sentenceLosses2026] Check the temperature of the particular model and training recipe you use.

For the worked similarity gap ($0.90 - 0.20 = 0.70$), calculate the gradient as well as the probability:

| τ | $P(\text{positive})$ | Absolute positive score gradient $(1-P^+)/\tau$ |
|---|---|---|
| 0.01 | $1.000000$ (rounded) | $3.98\times10^{-29}$ |
| 0.05 | $0.999999$ | $0.000016631$ |
| 0.10 | $0.999089$ | $0.009110512$ |
| 1.00 | $0.668188$ | $0.331812228$ |

Here the larger temperature gives a **larger** absolute gradient. Both the gap and the candidate pool matter. The rounded probability at 0.01 hides a nonzero mathematical gradient; floating-point subtraction `1 - P` can round it to zero.

<figure>
  <img src="illustrations/_generated/temperature_softmax_dark.png" alt="A sampled curve plots positive probability against temperature for a fixed similarity gap of 0.70, with a complete vertical probability scale from zero to one. Exact teaching values are tau 0.05 gives 0.999999, 0.10 gives 0.999089, 0.50 gives 0.802184, and 1.00 gives 0.668188. Samples begin at tau 0.02 and continue through 1.20. The curve shows easy-row probability; gradient magnitude is a separate quantity." />
  <figcaption>Points sample temperatures from 0.02 to 1.20 with the similarity gap fixed at 0.70. Low τ saturates this easy row; high τ flattens the softmax so the true match and the negative share more probability. The probability axis starts at zero.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="temperature.py"
import numpy as np

def probability_of_positive(
    pos_sim: float,
    neg_sim: float,
    temperature: np.ndarray,
) -> np.ndarray:
    scaled_gap = (pos_sim - neg_sim) / temperature
    return 1.0 / (1.0 + np.exp(-np.clip(scaled_gap, -700.0, 700.0)))

taus = np.array([0.01, 0.05, 0.10, 1.00])
probs = probability_of_positive(0.90, 0.20, taus)
# Compute the tiny complementary probability directly rather than via 1 - P.
neg_probs = probability_of_positive(0.20, 0.90, taus)
grads = neg_probs / taus

for tau, prob, grad in zip(taus, probs, grads):
    print(f"tau={tau:.2f}: P(positive)={prob:.6f}, |grad|={grad:.9g}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tau=0.01: P(positive)=1.000000, |grad|=3.97544974e-29
tau=0.05: P(positive)=0.999999, |grad|=1.66305606e-05
tau=0.10: P(positive)=0.999089, |grad|=0.00911051194
tau=1.00: P(positive)=0.668188, |grad|=0.331812228
```
<!-- leetllm: output:end -->

```checkpoint
For the fixed 0.70 gap, does lowering temperature from 1.00 to 0.05 increase the absolute score gradient?
---
No. The positive probability saturates, reducing the absolute gradient from about 0.332 to 0.0000166. The 1/tau factor alone cannot predict the gradient because softmax probabilities also change.
```

---

## Where the pairs come from

A contrastive objective has no way to decide what a pair means. You need texts that should match, texts that shouldn't, and enough variety that the model can't succeed by memorizing topic words. Supervised NLI pairs and SimCSE's dropout views make two useful constructions concrete.

### Supervised: fine-tuning on NLI data

Natural Language Inference (NLI) labels whether a hypothesis follows from a premise (**entailment**), conflicts with it (**contradiction**), or does neither (**neutral**). Entailment is directional: the hypothesis can follow from a more detailed premise while the reverse implication fails. Check equivalence separately when a task needs interchangeable text.

SBERT trained pooled Siamese representations with NLI supervision and evaluated sentence similarity. Its NLI classification setup feeds the two embeddings and their absolute difference to a classifier, showing that sentence-level training does not require InfoNCE.[^reimers2019]

Supervised SimCSE instead uses entailment as a positive and the corresponding contradiction as a hard negative.[^gao2021] Whether either recipe transfers to your retrieval task needs separate evaluation.

The labels say which sentences should meet; SBERT's architecture makes that comparison cheap. It runs both sentences through the same encoder with shared weights, pools each into a single vector, then trains on those pooled embeddings.[^reimers2019]

At inference you keep only the single-sentence path. That shared-weight **<span data-glossary="siamese-network">Siamese network</span>** makes precomputing document embeddings and nearest-neighbor search practical.

### Self-supervised: SimCSE

No labeled NLI data? SimCSE changes where the positive comes from.[^gao2021] Pass the same sentence through the encoder twice with different dropout masks. Dropout zeros different units each time, so you get two slightly different vectors for the same sentence.

Those views are positives, and every other sentence in the batch is a negative. The construction turns an unlabeled batch into a ranking problem. Another row can still be relevant, and the loss will treat it as wrong.

On the paper's STS suite, unsupervised SimCSE with BERT-base reached 76.3 average Spearman correlation multiplied by 100. The supervised NLI variant reached 81.6. Dropout becomes the data augmentation: removing it or sharing the same mask between views substantially worsened the reported results in that recipe.[^gao2021] Other recipes need their own collapse checks. Use training mode to construct these stochastic views. Ordinary embedding inference disables dropout for repeatable outputs.

### Data augmentation

Once dropout makes a safe positive view, other augmentations become hypotheses about meaning preservation:

- **Dropout masks** (SimCSE): different mask patterns per forward pass
- Verified paraphrases or back-translations: use only after checking that technical scope and exceptions survive
- Domain pairs: mine resolved duplicate questions that cite the same approved docs passage
- Reranking with <span data-glossary="cross-encoder">cross-encoders</span>: score candidate paraphrases before accepting them as positives

Avoid casual word deletion or insertion for technical docs: dropping `"not"`, a version condition, or a layer-index constraint changes the mechanism while mislabeling the pair as positive.

### In-batch negatives in practice

Each training batch creates a negative pool without another labeling pass. For $N$ positive pairs, each anchor matches its aligned passage while the other $N-1$ candidates act as negatives, an approach popularized by Dense Passage Retrieval for open-domain QA.[^karpukhin2020]

Larger batches raise the odds of informative competitors, but they also increase **<span data-glossary="false-negative">false negatives</span>**: another row can retrieve the exact same passage ID or an equally valid paraphrase while the loss treats it as wrong. Different document IDs can also answer the same query, so checking ID identity alone cannot guarantee non-relevance. Deduplicate repeated passages, mask known positives, or use a multi-positive objective when multiple answers exist.

An $N=1$ batch without extra negatives gives probability $1$ and loss $0$ regardless of embedding quality. Larger batches create an $N\times N$ score matrix, with quadratic score-storage cost. Distributed training can gather embeddings across GPUs, but must handle gradient propagation deliberately. Plain gradient accumulation doesn't create more in-batch negatives unless the implementation explicitly reuses embeddings across microbatches.

<!-- leetllm: test, deps=torch, output=show -->
```python title="audit_false_negatives.py"
import torch
import torch.nn.functional as F

batch = [
    {"query": "How does RoPE encode token position?", "doc_id": "rope-pair-rotation"},
    {"query": "How do rotary embeddings represent relative offset?", "doc_id": "rope-pair-rotation"},
    {"query": "When are learned absolute position tables added?", "doc_id": "learned-pos-embedding"},
]

false_negatives = []
for anchor_index, anchor in enumerate(batch):
    for candidate_index, candidate in enumerate(batch):
        if anchor_index == candidate_index:
            continue
        if candidate["doc_id"] == anchor["doc_id"]:
            false_negatives.append(
                f"row {anchor_index} treats row {candidate_index} as negative"
            )

print("false negatives:", false_negatives)
print("action: deduplicate shared-doc positives before InfoNCE")

# Isolate row 0: columns 0 and 1 refer to the same matching passage.
for exclude_duplicate in (False, True):
    scores = torch.tensor([0.8, 0.8, 0.1], dtype=torch.float64, requires_grad=True)
    logits = scores / 0.2
    if exclude_duplicate:
        logits = logits.masked_fill(torch.tensor([False, True, False]), -torch.inf)
    loss = F.cross_entropy(logits.unsqueeze(0), torch.tensor([0]))
    loss.backward()
    print(f"exclude duplicate={exclude_duplicate}: loss={loss.item():.6f}; "
          f"score gradients={[round(value, 6) for value in scores.grad.tolist()]}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
false negatives: ['row 0 treats row 1 as negative', 'row 1 treats row 0 as negative']
action: deduplicate shared-doc positives before InfoNCE
exclude duplicate=False: loss=0.708133; score gradients=[-2.537185, 2.462815, 0.074371]
exclude duplicate=True: loss=0.029750; score gradients=[-0.146561, 0.0, 0.146561]
```
<!-- leetllm: output:end -->

The duplicate passage receives a **positive** score derivative in the unmasked row, so gradient descent pushes its score down even though it answers the query. Masking only that duplicate zeros its gradient and focuses learning on separating the true non-match. Because duplicate encodings share weights, opposing score derivatives can still interfere in subtle ways. When both duplicate scores match and the unrelated negative vanishes, the unmasked row also hits a $\log 2$ loss floor since no optimizer can push an identical copy to probability $1$. Masking off-diagonal positives drops them from the denominator, whereas multi-positive objectives retain them explicitly as targets.

---

## Hard negative mining

### Why hard negatives matter

Suppose the encoder already rejects `"NF4 block packing"` for a query on rotary positional embeddings. That unrelated distractor contributes almost zero softmax gradient. **<span data-glossary="hard-negative">Hard negatives</span>** such as `"Sinusoidal absolute position tables"` share positional and attention vocabulary while describing a different mechanism, forcing the encoder to sharpen the semantic distinction.

| Negative type | Anchor | Candidate | Why it matters |
|---------------|--------|-----------|----------------|
| Easy negative | "How does RoPE encode token position?" | "4-bit NF4 block weight quantization" | Different topic; the model separates it almost immediately |
| Hard negative | "How does RoPE encode token position?" | "Sinusoidal absolute position table added to tokens" | Same positional vocabulary, different mechanism; forces fine-grained learning |

<figure>
  <img src="illustrations/_generated/pair_mining_dark.png" alt="For the query How does RoPE encode token position?, label auditing protects a relevant RoPE rotation passage with overlap 3 and score 0.92. Two non-relevant candidates sharing position vocabulary score 0.76 (overlap 5) and 0.68 (overlap 2) and become hard negatives 1 and 2, while an unrelated NF4 quantization passage with overlap 0 and score 0.05 is dropped." />
  <figcaption>Mined hard negatives share query vocabulary while describing a distinct mechanism. Checking explicit relevance judgments keeps valid positives out of the negative pool.</figcaption>
</figure>

### Mining strategies and false negative contamination

Mining provides informative competitors once random in-batch negatives stop producing meaningful gradients. Varied in-batch pools can still be strong on their own, so check similarity distributions and held-out errors before adding a mining stage. Every mining step also introduces **false negative contamination**: an unannotated passage that genuinely answers the query can slip into the negative pool and push the representation in the wrong direction.

Four negative mining strategies balance informativeness against contamination risk:

#### 1. In-batch negatives
In-batch negatives reuse the other passages already present in the current training mini-batch. Encoding $B$ positive pairs requires $2B$ batched sequence forwards and yields $B(B-1)$ off-diagonal comparisons at zero extra encoder cost.[^karpukhin2020] Computing and storing the $B \times B$ similarity matrix still scales quadratically with batch size.
- **Advantage:** Reuses passage representations already computed for the positive pairs.
- **Limitation:** Batch composition determines difficulty; competitors may be trivial, clustered by topic, or unrecognized false negatives.

#### 2. BM25 hard negatives
BM25 lexical retrieval searches the corpus using exact query terms to surface passages with strong keyword overlap that still answer a different question:
```text
Query: "How does RoPE encode token position?"
BM25 Hard Negative: "Add sinusoidal absolute position vectors to token embeddings"  # shares "position" and "token"
Easy Negative: "Pack model weights into 4-bit NF4 quantization blocks"               # shares zero technical terms
```
BM25 negatives push the encoder beyond bag-of-words overlap to track syntax and technical precision. Because lexical search also retrieves genuine paraphrases, pairs need filtering before joining the negative set.

#### 3. Cross-encoder mined negatives and MarginMSE
Cross-encoders use joint self-attention over $[q; d]$ and can be useful teachers when validated on the target task. Their relevance estimates need checks against independent judgments. One possible mining and distillation pipeline is:

1. **Candidate retrieval:** Retrieve the top 100 candidates for query $q$ using BM25 and a baseline bi-encoder.
2. **Cross-encoder scoring:** Score all 100 candidates with a trained cross-encoder.
3. **Candidate auditing:** Inspect candidates ranked highly by the bi-encoder but poorly by the teacher. Use relevance judgments where available; audit uncertain cases before assigning hard-negative labels.
4. **Soft margin distillation (MarginMSE):** Instead of forcing a binary 0/1 contrastive target, train the bi-encoder to match the score difference (margin) predicted by the cross-encoder:

   $$
   \mathcal{L}_{\text{MarginMSE}} = \left( (\text{score}_{student}(q, p^+) - \text{score}_{student}(q, n^-)) - (\text{score}_{teacher}(q, p^+) - \text{score}_{teacher}(q, n^-)) \right)^2
   $$

   Average this squared error over the training triples. Hofstätter and colleagues introduced this margin-based distillation objective.[^hofstatter2020MarginMse] The student inherits the teacher's target margins, including mistakes. Check scoring ranges: a cosine margin lies in $[-2,2]$, so it cannot match an arbitrary unbounded teacher-logit margin. An unnormalized dot-product student or an explicitly validated target scaling avoids that particular mismatch.

**A zero distillation loss can still teach the wrong order.** Suppose the approved passage is relevant, but the teacher assigns it 0.2 and a non-match 0.8. A student copying the margin $-0.6$ obtains zero MarginMSE while ranking the non-match first. Teacher agreement is a training target; held-out relevance remains the outcome to measure.

#### 4. Iterative (self-adversarial) mining
As a bi-encoder changes, different competitors can become informative. Iterative mining re-encodes and re-indexes the corpus with a newer checkpoint, retrieves high-ranked candidates, then audits them for another training round. Keep evaluation queries separate from the mining loop; teacher filtering does not eliminate annotation errors.

#### Avoiding false negative contamination
Relevance annotations are often incomplete, so finding one relevant passage does not prove that every other candidate is wrong. Any valid unlabeled competitor that draws substantial softmax probability receives a negative gradient $P_j/\tau$, with the exact magnitude governed by all competing logits in that row.

To protect against false negative contamination:
- **Known-positive handling:** Deduplicate repeated passages, mask known positive off-diagonal entries, or group positives for a compatible objective. Different document IDs can still answer the same query; a shared topic alone does not prove relevance.
- **Teacher filtering:** A validated score ceiling can remove suspicious high-scoring candidates from a negative pool. It can also miss valid answers or remove useful negatives. Estimate those errors from labeled samples instead of treating the threshold as proof.
- **Multi-positive objectives:** Mark verified positives explicitly. The chosen SupCon formulation averages their negative log-softmax probabilities; it does **not** simply sum positive probability mass inside one logarithm.[^khosla2020SupCon]

#### Two positives, two different objectives

For one anchor, write $P_p=\exp(s_p/\tau)/\sum_a\exp(s_a/\tau)$ over the competing candidates. A SupCon-style row uses the mean-log objective:

$$
\mathcal{L}_{\text{mean-log}}=-\frac{1}{|\mathcal{P}|}\sum_{p\in\mathcal{P}}\log P_p
$$

A positive-mass objective instead computes $-\log\sum_{p\in\mathcal{P}}P_p$. When one positive collects almost all probability mass ($0.999$) while a second relevant passage sits neglected ($0.0005$), those two losses diverge sharply:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="two_positive_objectives.py"
import numpy as np

pos_probs = np.array([0.999, 0.0005])
neg_prob = 0.0005
assert np.isclose(pos_probs.sum() + neg_prob, 1.0)

mass_loss = float(-np.log(pos_probs.sum()))
mean_log_loss = float(-np.mean(np.log(pos_probs)))

print(f"positive-mass loss: {mass_loss:.6f}")
print(f"mean positive log-loss: {mean_log_loss:.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
positive-mass loss: 0.000500
mean positive log-loss: 3.800951
```
<!-- leetllm: output:end -->

The positive-mass loss drops nearly to zero even while the second answer gets only $0.0005$ probability, whereas averaging log probabilities strongly penalizes ignoring either valid passage. The two objectives encode distinct goals, so raw loss magnitudes are not interchangeable metrics. Note that original SupCon excludes the anchor itself and treats same-class items as positives; retrieval pipelines instead rely on explicit query-passage relevance labels.

The mining filter below protects **labeled** positives, discards zero-overlap distractors, and ranks remaining shared-term candidates by teacher score so only genuine hard negatives survive:

<!-- leetllm: test, output=show -->
```python title="mine_hard_negatives.py"
def tokens(text: str) -> set[str]:
    return {part.strip("?.!,").lower() for part in text.split()}

def lexical_overlap(query: str, candidate: str) -> int:
    return len(tokens(query) & tokens(candidate))

def cross_score_pair(query: str, candidate: str) -> float:
    q_terms = tokens(query)
    c_terms = tokens(candidate)
    if "rope" in q_terms and "rotate" in c_terms:
        return 0.92
    if "sinusoidal" in c_terms and "position" in c_terms:
        return 0.76
    if "learned" in c_terms and "position" in c_terms:
        return 0.68
    return 0.05

def mine_hard_negatives(
    query: str,
    corpus: list[dict[str, str | bool]],
    top_k: int = 2,
) -> list[str]:
    known_non_matches = [
        row
        for row in corpus
        if not row["relevant"]
        and lexical_overlap(query, str(row["text"])) > 0
    ]
    ranked = sorted(
        known_non_matches,
        key=lambda row: cross_score_pair(query, str(row["text"])),
        reverse=True,
    )
    return [str(row["text"]) for row in ranked[:top_k]]

query = "How does RoPE encode token position?"
corpus = [
    {"text": "RoPE pair rotation rotates Q and K vectors by position angle", "relevant": True},
    {"text": "Learned position embedding lookup table before attention", "relevant": False},
    {"text": "Sinusoidal absolute position vectors added at layer zero", "relevant": False},
    {"text": "4-bit NF4 block quantization shrinks weight memory", "relevant": False},
]

print(mine_hard_negatives(query, corpus))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
['Sinusoidal absolute position vectors added at layer zero', 'Learned position embedding lookup table before attention']
```
<!-- leetllm: output:end -->

#### Hard negatives in the InfoNCE denominator

Mining changes the loss only after those candidates appear in the softmax. Production trainers usually do one of two things:

1. **Expand the candidate pool:** for each query, score `positive + in-batch negatives + K mined hard negatives` and run InfoNCE over that longer list.
2. **Share a mined candidate bank:** append passages as extra candidate columns, with an explicit positive-column index for each query. Don't add unlabeled query rows or assume every new column is a positive diagonal entry.

Either way, a mined hard negative becomes another competing exponential term inside $\sum_j \exp(\text{sim}(z_i, z_j) / \tau)$. Appending one high-scoring distractor to a row with a well-separated in-batch negative adds immediate denominator mass and lifts the loss:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="hard_negatives_in_denominator.py"
import numpy as np

def row_cross_entropy(logits: list[float], correct: int) -> float:
    arr = np.asarray(logits, dtype=np.float64)
    peak = float(np.max(arr))
    return float(np.log(np.sum(np.exp(arr - peak))) + (peak - arr[correct]))

temperature = 0.05
positive = 0.90
in_batch_negative = 0.20
mined_hard_negative = 0.72

easy_logits = [positive / temperature, in_batch_negative / temperature]
hard_logits = easy_logits + [mined_hard_negative / temperature]

print("loss without mined hard neg:", round(row_cross_entropy(easy_logits, 0), 6))
print("loss with mined hard neg:", round(row_cross_entropy(hard_logits, 0), 6))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
loss without mined hard neg: 1e-06
loss with mined hard neg: 0.026958
```
<!-- leetllm: output:end -->

The positive score stayed fixed, yet adding one hard competitor raised the loss from $10^{-6}$ to $0.027$. That added loss creates training gradient against the lookalike passage without lowering the positive ceiling. Backpropagating through the encoder updates weights to separate those confusing mechanisms on held-out queries.

---

## Bi-encoder vs cross-encoder

The loss trains a vector space. Serving still has to decide *when* the query and the document are allowed to interact. That placement determines which computation can happen offline, shaping latency and index size.

<figure>
  <img src="illustrations/_generated/encoder_tradeoffs_dark.png" alt="Three retrieval architectures place query-passage interaction at different stages. A bi-encoder encodes query and passage tokens separately into single vectors q and d and computes q dot d. A cross-encoder concatenates [query ; passage] for full joint self-attention on a shortlist. Late interaction stores document-token vectors d_j, computes every q_i dot d_j similarity, takes each query row maximum, and sums them." />
  <figcaption>The architectures differ by when query and document tokens meet: never until a single vector score, inside full attention, or at token-level MaxSim after both sides are encoded independently.</figcaption>
</figure>

| Architecture | What you store | Query-time Transformer work | Interaction | Typical job |
|---|---|---|---|---|
| Bi-encoder | 1 vector per document | 1 query encode, then ANN | $q \cdot d$ or cosine | First-stage corpus retrieval |
| Cross-encoder | Raw documents | Joint encoding of $K$ query-document pairs, possibly batched | Self-attention over $[q; d]$ | Rerank a top-$K$ shortlist |
| Late interaction (ColBERT) | Vectors for retained document-token positions | 1 query encode, then token MaxSim | $\sum_i \max_j q_i \cdot d_j$ | Token-level retrieval with a larger index |

### Bi-encoder (dual encoder)

A <span data-glossary="bi-encoder">bi-encoder</span> encodes the query and document independently, then compares them with dot product or cosine similarity. Documents can be pre-encoded and indexed once offline, so serving a query requires just a single forward pass followed by an <span data-glossary="ann-search">approximate nearest neighbor (ANN) search</span>. That speed comes from separating both texts inside the encoder. Without token-to-token cross-attention across `[q; d]`, a single-vector cosine score can overlook fine phrase order, subtle negation modifiers, and exact term co-occurrence.

### Cross-encoder

A <span data-glossary="cross-encoder">cross-encoder</span> concatenates query and document and runs them jointly through every layer of one Transformer. Full self-attention inspects every pair of query and document tokens directly, which consistently tightens precision on subtle syntactic distinctions when applied to a candidate shortlist.

The same interaction makes it expensive: each scored pair requires joint encoding over combined sequence lengths, scaling at $O(N)$ pair forwards per query across $N$ documents. Batching and parallelism help throughput latency, yet they cannot turn cross-attention states into reusable offline document vectors. Measuring latency per scored candidate settles the exact top-$K$ shortlist budget.

### Late interaction: ColBERT and the MaxSim operator

A single-vector score compresses a passage into a fixed-size representation before seeing the query. It can preserve order and negation, but a given model may lose distinctions that matter for retrieval. A cross-encoder instead lets both texts interact through joint **self-attention**, at the cost of query-dependent pair encoding.

ColBERT (Contextualized Late Interaction over BERT)[^khattab2020] offers another tradeoff using **late interaction**:

<figure>
  <img src="illustrations/_generated/late_interaction_maxsim_dark.png" alt="ColBERT MaxSim similarities compare query positions rope and angle with stored document positions shift, rope, and angle. Matrix rows are 0.12, 0.93, 0.08 and 0.19, 0.07, 0.91 across six dot products. Row maxima 0.93 and 0.91 sum to 1.84." />
  <figcaption>MaxSim takes each query token's strongest match across stored document token vectors and sums the row maxima.</figcaption>
</figure>

Instead of pooling into a single vector, ColBERT retains multiple contextual token vectors. The original implementation filters document punctuation and augments queries with mask positions, so these are not simply one vector for every literal word:
1. The query encoder outputs normalized token vectors $E_q \in \mathbb{R}^{|q| \times d}$ (typically projected to $d = 128$).
2. The document encoder outputs normalized token vectors $E_d \in \mathbb{R}^{|d| \times d}$.
3. Relevance is computed using the **MaxSim** operator:

   $$
   \text{Score}(q, d) = \sum_{i=1}^{|q|} \max_{j=1}^{|d|} E_{q,i} \cdot E_{d,j}^\top
   $$

For each query token $i$, MaxSim finds the single document token $j$ that produces the maximum dot product, and sums those peak alignments.

#### What MaxSim preserves
- **Soft token alignment:** Each retained query position selects its own best match. Contextual encoding gives homographs like attention heads and print heads distinct representations, which can be verified directly on disambiguation splits.
- **Offline document indexing:** Because document tokens don't interact with query tokens inside the transformer, documents are encoded and indexed once offline.
- **Query-time vector scoring:** Candidate generation and token comparisons replace joint query-document Transformer encoding. Index traversal, decompression, and memory transfers still contribute to latency.

MaxSim does not enforce a one-to-one alignment: several query positions may select the same document position. Its final sum also does not directly enforce phrase order; order information must come through the contextual vectors. Test modifier and negation queries rather than assuming this scoring rule handles them correctly.

#### Index storage and ColBERTv2 compression
The raw vector payload scales with **token count × token-vector width × bytes per coordinate**. At equal coordinate precision, 100 or 200 vectors of width 128 use about 16.7 or 33.3 times the payload of one width-768 vector, before index overhead. A flat “100×” rule ignores vector width and compression.

ColBERTv2 stores a nearest-centroid ID **and** a quantized residual for each token vector, reconstructing an approximation as centroid plus residual. Its paper describes 1- or 2-bit residual coordinates and reports substantial compression relative to earlier late-interaction representations.[^santhanam2022ColBertV2] Measure total index size and held-out retrieval quality when comparing this compressed representation with a single-vector index.

This is a budget tradeoff:
- **Bi-encoder:** A useful starting point when one vector per passage meets recall and RAM requirements.
- **Late interaction (ColBERT):** A candidate when token-level scoring improves held-out retrieval enough to justify a larger, more complex index.
- **Cross-encoder:** A candidate for reranking a top-$K$ shortlist when measured ordering gains justify joint encoding.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="maxsim.py"
import numpy as np

query_tokens = ["rope", "angle"]
doc_tokens = ["shift", "rope", "angle"]
sim_matrix = np.array([
    [0.12, 0.93, 0.08],
    [0.19, 0.07, 0.91],
])

row_maxima = sim_matrix.max(axis=1)
score = float(row_maxima.sum())

print("best token scores:", dict(zip(query_tokens, np.round(row_maxima, 2).tolist())))
print("MaxSim score:", round(score, 2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
best token scores: {'rope': 0.93, 'angle': 0.91}
MaxSim score: 1.84
```
<!-- leetllm: output:end -->

### A production reranking pattern

<figure>
  <img src="illustrations/_generated/reranking_pipeline_dark.png" alt="Two-stage retrieval pipeline for the query How does RoPE encode token position?. Bi-encoder cosine shortlist at K=3 selects Absolute pos bias (0.84), RoPE rotation proof (0.81), and RoPE base theta notes (0.78), while excluding NF4 quantization (0.10 cosine, 0.05 cross-encoder score uncomputed). Joint cross-encoder reranking reorders the shortlist to RoPE rotation (0.96), RoPE base theta (0.91), and drops Absolute pos bias (0.21) at top_k=2." />
  <figcaption>The two-stage handoff: Stage 1 cosine recall determines which top-K candidates enter the shortlist, while Stage 2 cross-encoder logits reorder only those shortlisted passages.</figcaption>
</figure>

Serving stacks often combine both encoders in a two-stage <span data-glossary="reranker">reranker</span>: a fast bi-encoder retrieves top-$K$ candidates over the full corpus, and a cross-encoder spends joint self-attention only on that shortlist. Stage 1 sets the recall ceiling because Stage 2 cannot promote a passage that never reached the shortlist.

The pipeline below scores four technical passages for `"How does RoPE encode token position?"`. With `candidate_k=3`, `nf4-quantization` stays outside the shortlist so its cross-score (`0.05`) is never evaluated; tightening `candidate_k=1` traps the pipeline on `abs-pos-bias` (`0.84` cosine) before the cross-encoder can demote it:

<!-- leetllm: test, output=show -->
```python title="rerank.py"
documents = [
    {
        "id": "abs-pos-bias",
        "text": "Absolute sinusoidal and learned position bias vectors",
        "bi_score": 0.84,
        "cross_score": 0.21,
    },
    {
        "id": "rope-rotation",
        "text": "Rotate Q and K pairs in 2D subspaces by position angle m*theta",
        "bi_score": 0.81,
        "cross_score": 0.96,
    },
    {
        "id": "rope-theta-base",
        "text": "RoPE base frequency theta scaling for context extension",
        "bi_score": 0.78,
        "cross_score": 0.91,
    },
    {
        "id": "nf4-quantization",
        "text": "4-bit NormalFloat block quantization for linear weights",
        "bi_score": 0.10,
        "cross_score": 0.05,
    },
]

def search_with_rerank(
    corpus: list[dict[str, str | float]],
    candidate_k: int = 3,
    top_k: int = 2,
) -> list[str]:
    candidates = sorted(corpus, key=lambda doc: float(doc["bi_score"]), reverse=True)[:candidate_k]
    reranked = sorted(candidates, key=lambda doc: float(doc["cross_score"]), reverse=True)
    return [str(doc["id"]) for doc in reranked[:top_k]]

print(search_with_rerank(documents))
print("shortlist of one:", search_with_rerank(documents, candidate_k=1))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
['rope-rotation', 'rope-theta-base']
shortlist of one: ['abs-pos-bias']
```
<!-- leetllm: output:end -->

---

## Instruction-tuned embeddings and asymmetric prefixes

### The problem with asymmetric search and task ambiguity

Information retrieval is structurally asymmetric. Search queries are short and interrogative (`"how does FlashAttention reduce HBM traffic?"`, `"grouped-query attention KV cache"`), whereas indexed documents are declarative explanations (`"FlashAttention tiles Q, K, and V blocks in on-chip SRAM to avoid materializing the full attention matrix."`).

Sharing encoder weights does not force questions and answers to identical vectors. However, an encoder used for several tasks needs to know which similarity relation you want. Should `"PyTorch tensor shapes"` cluster with general programming notes, or retrieve a kernel memory guide? Role prefixes and task instructions make that distinction explicit when the checkpoint was trained with them.

### Task-specific prefixes and asymmetric instruction tuning

These checkpoints and interfaces specify distinct input formatting conventions, checked October 10, 2026:

- **`intfloat/e5-base-v2`:** Its card specifies `"query: "` for queries and `"passage: "` for documents in asymmetric retrieval. For symmetric similarity, both inputs use `"query: "`.[^e5BaseV2Card2026]
- **`BAAI/bge-base-en-v1.5`:** Its card recommends a query instruction for short-query-to-passage retrieval, with plain passages. It also documents use without instructions and recommends comparing both settings on your task.[^bgeBaseV15Card2026]
- **Original INSTRUCTOR API:** Accepts `[instruction, text]` pairs for domain and task conditioning.[^instructor2026Usage] Use instructions the model was trained to interpret, then evaluate their effect on the retrieval task.

#### The operational danger of prefix mismatch
Follow the selected checkpoint's model card. E5-base-v2 warns that omitting its prefixes degrades performance; BGE-v1.5 describes a more flexible instruction setting. The effect on recall depends on the checkpoint and workload. Record prompt formatting alongside the checkpoint, pooling, width, and scoring function. If document formatting changes, regenerate the affected corpus vectors and evaluate the resulting index.

<!-- leetllm: test -->
```python title="task_prefixes.py"
def format_e5_pair(query: str, passage: str) -> tuple[str, str]:
    """Asymmetric retrieval inputs for intfloat/e5-base-v2."""
    return f"query: {query}", f"passage: {passage}"


def format_bge_v15_pair(query: str, passage: str) -> tuple[str, str]:
    """Recommended instructed retrieval setting for BAAI/bge-base-en-v1.5."""
    instruction = "Represent this sentence for searching relevant passages: "
    return f"{instruction}{query}", passage


def format_instructor_input(instruction: str, text: str) -> list[str]:
    """One instruction/text pair for the original INSTRUCTOR encode API."""
    return [instruction, text]


sample_query = "how does FlashAttention reduce HBM traffic?"
sample_passage = "FlashAttention tiles Q, K, and V blocks in on-chip SRAM to avoid writing N x N matrices to HBM."

e5_query, e5_passage = format_e5_pair(sample_query, sample_passage)
bge_query, bge_passage = format_bge_v15_pair(sample_query, sample_passage)
instructor_example = format_instructor_input(
    "Represent the machine learning question for retrieving transformer notes:",
    sample_query,
)

assert e5_query.startswith("query: ")
assert e5_passage.startswith("passage: ")
assert bge_query.startswith("Represent this sentence")
assert bge_passage == sample_passage
assert instructor_example[0].startswith("Represent")
assert instructor_example[1] == sample_query
```

---

## Matryoshka representation learning (MRL)

### What arbitrary truncation can lose

Suppose your vector budget allows only 128 dimensions per document. Slicing a width-768 embedding to `vector[:128]` saves coordinates, but it can discard distinctions needed to rank passages. How much quality drops depends on whether early coordinates carry discriminative variance.

Slicing a 2D unit pair `[0.6, 0.8]` versus `[0.6, -0.8]` down to `[0.6]` makes both vectors point in the exact same first-axis direction, so re-normalization collapses their truncated cosine to $1.0$:

<!-- leetllm: test, deps=numpy, id=sentence-prefix-demo, continue=sentence-info-nce, output=show -->
```python title="prefix_collision.py"
# Reuses normalize and dot from info_nce.py.
query = [0.6, 0.8]
match = [0.6, 0.8]
distractor = [0.6, -0.8]
print("full cosines:", [round(dot(query, row), 2) for row in (match, distractor)])
short_query = normalize(query[:1])
print("prefix cosines:", [dot(short_query, normalize(row[:1])) for row in (match, distractor)])
print("a prefix can stay unit:", dot([1.0], [1.0]) == 1.0)
try:
    normalize([0.0])  # Unit vector [0, 1] has a zero first-coordinate prefix.
except ValueError:
    print("zero prefix rejected")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
full cosines: [1.0, -0.28]
prefix cosines: [1.0, 1.0]
a prefix can stay unit: True
zero prefix rejected
```
<!-- leetllm: output:end -->

Re-normalizing restores unit length. These two prefixes still tie because their distinguishing coordinate was discarded. A truncation trained for your target width aims to avoid losing the distinctions the task needs.

### The nested representation mechanism

<span data-glossary="matryoshka-representation-learning">Matryoshka representation learning</span> (MRL) supervises selected prefix widths so one representation can serve several capacity budgets.[^kusupati2022] Named after Russian nesting dolls, it encourages useful shorter representations nested inside a larger vector. The original paper applies the idea to several objectives, including classification; it is not restricted to sentence-level InfoNCE.

For a **cosine-based contrastive application**, choose prefix widths $\mathcal{D} = \{d_1, d_2, \dots, d_M\}$, such as $\{32,64,128,256,512,768\}$. At each selected width, slice both embeddings, normalize nonzero prefixes, and apply the contrastive objective:

$$
\mathcal{L}_{\text{MRL}} = \sum_{d \in \mathcal{D}} w_d \, \mathcal{L}_{\text{InfoNCE}}\left( \frac{z_{1:d}}{\|z_{1:d}\|_2}, \frac{z^+_{1:d}}{\|z^+_{1:d}\|_2}; \tau \right)
$$

<figure>
  <img src="illustrations/_generated/matryoshka_dimensions_dark.png" alt="A 768-dimensional embedding is structured into prefixes at 32, 128, and 768 dimensions, using 4.17 percent, 16.67 percent, and 100 percent of full float storage. Multi-width contrastive training sums prefix losses 0.0088 at d=2, 0.0147 at d=4, and 0.0225 at d=6, giving a mean loss of 0.0153." />
  <figcaption>Matryoshka training applies contrastive losses at multiple prefix sizes simultaneously so shorter slices remain useful instead of breaking when truncated.</figcaption>
</figure>

#### Length and scoring after a cut
For a unit full vector, a prefix has norm **at most 1**. It stays 1 if every discarded coordinate is zero, and it can become zero if all retained coordinates are zero. For dot-product search intended to equal cosine, normalize each nonzero prefix. A cosine function may perform that normalization internally. When a checkpoint expects unnormalized dot products, follow and evaluate that exact similarity rule rather than swapping in cosine.

#### Hierarchical two-stage vector search
MRL enables a high-throughput deployment pattern called **hierarchical (adaptive) retrieval**:
1. **Stage 1 (Short-vector search):** Index a supported 64- or 128-dimensional prefix and retrieve a shortlist, perhaps 500 candidates. Ten million width-64 float32 vectors have a **raw payload** of 2.56 GB, versus 30.72 GB at width 768 (decimal GB). Graph links, IDs, metadata, and other index overhead add storage.
2. **Stage 2 (Full-width rescoring):** Fetch the full vectors for those candidates and rescore with the selected model's scoring function. Full width and numerical precision are separate choices; quantized vectors remain approximate.
3. **Measure the outcome:** Compare first-stage Recall@500, final ranking quality, latency, and total storage against full-width retrieval. The shortlist cannot recover omitted passages. Accuracy retention and speedup depend on the trained checkpoint, retrieval workload, and implementation.

<!-- leetllm: test, deps=numpy, continue=sentence-prefix-demo, output=show -->
```python title="matryoshka_loss.py"
# Reuses info_nce_loss from info_nce.py.
import numpy as np

def matryoshka_loss(
    embeddings_a: np.ndarray,
    embeddings_b: np.ndarray,
    dims: tuple[int, ...] = (2, 4, 6),
) -> float:
    losses = [
        info_nce_loss(embeddings_a[:, :dim], embeddings_b[:, :dim])
        for dim in dims
    ]
    return float(np.mean(losses))

queries = np.array([
    [1.0, 0.0, 0.9, 0.1, 0.5, 0.2],
    [0.0, 1.0, 0.1, 0.9, 0.2, 0.5],
])
positives = np.array([
    [0.95, 0.05, 0.85, 0.15, 0.45, 0.25],
    [0.05, 0.95, 0.15, 0.85, 0.25, 0.45],
])

loss = matryoshka_loss(queries, positives)
for dim in (2, 4, 6):
    print(f"dim={dim} loss={matryoshka_loss(queries, positives, (dim,)):.4f}")
print(round(loss, 4))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
dim=2 loss=0.0088
dim=4 loss=0.0147
dim=6 loss=0.0225
0.0153
```
<!-- leetllm: output:end -->

### Why it matters

| Benefit | Practical impact |
|---------|------------------|
| Flexible deployment | Use the full width when accuracy is paramount, or a smaller trained prefix when RAM is constrained. |
| Supported widths | One trained checkpoint serves several evaluated widths without training a separate model for each. |
| Hierarchical search | Combine a supported short prefix with full-width rescoring, and measure shortlist misses. |
| Scoring rule | Normalize nonzero prefixes when dot product must match cosine, and handle zero vectors explicitly. |

---

## Evaluation: STS and MTEB

### Semantic textual similarity (STS)

STS asks whether embedding similarities preserve human judgments of relatedness. Datasets like STS-B (STS Benchmark) pair sentence comparisons with human scores on a 0-to-5 scale, such as these two CI and Transformer pairs:

```text
"A CI build failed" / "A test run failed" => 4.5
"A CI build failed" / "An attention mask shifts scores" => 1.2
```

Compute cosine similarity for every pair, then calculate **<span data-glossary="spearman-rank-correlation">Spearman rank correlation</span>** against the human ratings. High correlation means similar ordering on those pairs. Probability calibration requires a separate assessment. Measure corpus ranking with labeled retrieval queries and realistic distractors.

### MTEB (Massive text embedding benchmark)

As models improved, optimizing only for STS stopped being enough. A model that's excellent at pairwise relatedness can still fail at retrieval or clustering. The <span data-glossary="mteb">Massive Text Embedding Benchmark (MTEB)</span> was introduced to make those task differences visible.[^muennighoff2023]

The original paper evaluated 33 models on 58 datasets grouped into 8 task categories and found that no one model dominated every category. Much of the retrieval slice comes from BEIR.[^thakur2021]

The table below records the original paper's snapshot. The 2025 **MMTEB** paper expanded evaluation to over 500 quality-controlled tasks across more than 250 languages.[^enevoldsen2025Mmteb] A selected leaderboard benchmark can cover a subset of that collection. Current MTEB offers named benchmark scopes and filters for language, task, modality, and model type.[^mteb_leaderboard] Record the exact scope, dataset revisions, splits, model revision, and input formatting before comparing scores.

| Task | # Datasets | Example |
|------|------------|---------|
| Classification | 12 | Sentiment, topic |
| Clustering | 11 | Document clustering |
| Pair Classification | 3 | Paraphrase detection |
| Reranking | 4 | Passage reranking |
| Retrieval | 15 | Question-passage retrieval |
| STS | 10 | Semantic similarity |
| Summarization | 1 | Summary similarity |
| BitextMining | 2 | Parallel sentence mining |

The original reranking category orders candidate passage lists using embedding similarities. It does not automatically evaluate the cross-encoder pipeline discussed above.[^muennighoff2023]

<figure>
  <img src="illustrations/_generated/evaluation_suite_dark.png" alt="Top table shows Semantic Textual Similarity comparing human relatedness ratings 4.5 and 1.2 out of 5 with cosine rankings via Spearman rank correlation. Bottom bar chart shows the original MTEB paper snapshot of 58 datasets across eight categories: retrieval 15, classification 12, clustering 11, STS 10, reranking 4, pair classification 3, bitext mining 2, and summarization 1." />
  <figcaption>STS checks sentence-pair relatedness via Spearman rank correlation, while the original MTEB benchmark spans eight task groups. Screen candidates broadly, then measure held-out recall, latency, and storage on your own workload.</figcaption>
</figure>

### Choosing a model in practice

Use a leaderboard average to screen candidates, then answer the system questions that govern your retrieval pipeline:

- Does the model expect plain text, query/passage prefixes, or explicit instructions?
- Which shorter widths are supported, and do their measured retrieval results meet your requirements?
- How well does it handle your language mix, domain jargon, and query length distribution?
- What are the latency, throughput, and memory costs once you batch and index it at production scale?
- Do you still need BM25 or a cross-encoder reranker to hit <span data-glossary="recall-at-k">Recall@K</span> and <span data-glossary="ndcg">NDCG</span> (normalized discounted cumulative gain) targets?

Evaluate the whole retrieval path: chunking, shortlist coverage, and label quality all affect the results of an embedding model change. The original MTEB comparison found no model dominating every task category.[^muennighoff2023] Compare candidates within the **same benchmark scope**, then measure technical retrieval, languages, latency, and storage on your own workload.[^mteb_leaderboard] Add a reranker when its measured gains fit your budget.

### Measure coverage and ordering separately

For a query with two relevant passages, retrieving one gives Recall@2 of $1/2$, not $1$. Reciprocal rank asks how high the first match sits, and averaging across queries gives mean reciprocal rank (MRR). Evaluating three fixed rankings isolates recall from ordering:

<!-- leetllm: test, output=show -->
```python title="retrieval_metrics.py"
retrieval_cases = [
    ({"rope-rotation", "theta-base"}, ["abs-bias", "rope-rotation", "theta-base"]),
    ({"alibi-slope"}, ["alibi-slope", "rope-rotation", "abs-bias"]),
    ({"yarn-scale"}, ["abs-bias", "alibi-slope", "rope-rotation"]),
]

def metrics_at_k(relevant: set[str], ranking: list[str], k: int) -> tuple[float, float]:
    selected = ranking[:k]
    recall = len(relevant & set(selected)) / len(relevant)
    reciprocal_rank = next(
        (1 / rank for rank, doc in enumerate(selected, 1) if doc in relevant), 0.0
    )
    return recall, reciprocal_rank

results = [metrics_at_k(relevant, ranking, 2) for relevant, ranking in retrieval_cases]
for i, (recall, rr) in enumerate(results, 1):
    print(f"query {i}: recall@2={recall:.2f}, RR@2={rr:.2f}")
print("mean recall@2:", f"{sum(r for r, _ in results) / len(results):.2f}")
print("MRR@2:", f"{sum(rr for _, rr in results) / len(results):.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
query 1: recall@2=0.50, RR@2=0.50
query 2: recall@2=1.00, RR@2=1.00
query 3: recall@2=0.00, RR@2=0.00
mean recall@2: 0.50
MRR@2: 0.50
```
<!-- leetllm: output:end -->

Moving `rope-rotation` from rank 2 to rank 1 raises query 1's reciprocal rank from $0.5$ to $1.0$ without changing Recall@2. Promoting `theta-base` into the top two increases recall. Neither change fixes query 3 when the right passage sits completely outside the top-two cutoff.

For a real experiment, hold out queries and near-duplicate groups from training and negative mining, record the corpus version, and keep relevance judgments fixed when comparing models. Incomplete judgments can label useful results as misses. Evaluate token truncation and passage chunking too: no pooling rule can recover text that was truncated before encoding.

### Key libraries and tools

Two libraries match the pieces above. One trains and pools the vectors. The other searches them:

| Tool | What it gives you |
|------|-------------------|
| Sentence-Transformers (`sentence-transformers`) | Pretrained sentence embedding models, pooling modules, and contrastive training losses. The library started as the SBERT code release.[^reimers2019] |
| <span data-glossary="faiss">FAISS</span> (Facebook AI Similarity Search) | Efficient similarity search and clustering for dense vectors, including inverted-file and product-quantization indexes.[^johnson2017] |

Follow one ranking from the pooled vector, through its InfoNCE row and hard-negative audit, to the two-stage shortlist. After a training loss falls, check held-out recall and batch difficulty to understand what improved.

---

<!-- leetllm: mastery:start -->

## Mastery check

### Key concepts

- alignment and uniformity in embedding space
- InfoNCE numerator, denominator, and temperature
- hard negatives vs easy negatives
- bi-encoder vs cross-encoder vs late interaction
- reranking as recall first, then precision
- Matryoshka prefix training and evaluation of shorter widths

### Evaluation rubric

- Foundational: Derives the InfoNCE objective and explains what the numerator, denominator, and temperature do.
- Intermediate: Distinguishes static averaging, contextual pooling, and sentence-level training, including padding masks and normalization.
- Intermediate: Explains why hard negatives matter more than random negatives once the model already separates broad topics.
- Advanced: Compares bi-encoders, cross-encoders, and late-interaction models by latency, indexability, accuracy, and storage.
- Advanced: Explains ColBERT's MaxSim scoring and why it keeps more token-level signal than a single document vector.
- Advanced: Explains Matryoshka embeddings and when shorter prefixes are worth the storage-accuracy tradeoff.
- Advanced: Designs a two-stage production retrieval pipeline with recall and latency budgets defended quantitatively.

### Follow-up questions

```checkpoint
Your cross-encoder gives excellent scores when you manually include the correct passage, but production search still misses that passage. Which stage is failing?
---
The first-stage retriever is failing on recall. If the correct passage never reaches the shortlist, reranking quality doesn't matter because the cross-encoder never sees the right candidate.
```

```checkpoint
When might an audited hard negative teach more than an unrelated negative?
---
When the current model already separates the unrelated candidate but confuses the non-relevant lookalike. The lookalike competes for softmax mass, creating a useful ranking gradient. Verify mined negatives against relevance judgments, then measure generalization on held-out queries.
```

```checkpoint
What evidence makes shortening a sentence embedding from 768 dimensions to 128 defensible?
---
Check that the target width is supported by training or the provider's interface, then measure its held-out recall and ranking quality. Arbitrary slicing can lose distinctions; prefix-aware training also needs evaluation. Normalize nonzero prefixes when dot product is intended to equal cosine.
```

```checkpoint
When is a cross-encoder the right tool even if a bi-encoder already exists?
---
When a validated cross-encoder improves ordering within an adequate shortlist and meets the latency budget. Joint pair encoding often makes full-corpus scoring expensive, so compare ranking gains and latency on held-out queries.
```

```checkpoint
What matching signal does ColBERT retain, and what price does it pay?
---
It scores retained query-token positions against their best document-token matches rather than using one pooled score. Multiple vectors increase the raw payload, while compression and index design determine the actual footprint. Measure whether that extra matching signal improves your workload.
```

### Common pitfalls

#### Raw [CLS] is treated like a search-ready sentence embedding

- Symptom: Nearly every query-document pair gets suspiciously similar cosine scores.
- Possible cause: Raw BERT [CLS] lacks sentence-retrieval training. Repeated vectors or a scoring bug can also flatten results; high absolute cosine alone does not diagnose failure.
- Fix: Inspect vectors, masks, and matrix shapes, then compare a retrieval-trained encoder on held-out rankings.

#### Negatives stay too easy

- Symptom: Training loss falls, but recall on realistic queries barely moves.
- Possible cause: Current batch negatives are already separated, or training labels fail to represent held-out queries.
- Fix: Inspect loss-active rows and retrieval errors; add audited confusing non-matches when those errors justify mining.

#### The reranker is asked to save missing recall

- Symptom: The reranker looks good in pairwise inspection, yet the right document is often absent in production results.
- Cause: The correct passage never entered the shortlist.
- Fix: Measure first-stage Recall@K separately. Improve retrieval or increase the shortlist only within a measured latency budget.

#### Dimensions are shortened blindly

- Symptom: Index storage drops as expected, but retrieval quality falls off a cliff.
- Possible cause: The discarded coordinates contained useful distinctions, or prefix normalization and indexing used an inconsistent similarity rule.
- Fix: Use Matryoshka-trained or provider-documented shortening controls and benchmark each target width.

#### Task conditioning is ignored

- Symptom: One embedding model works for clustering but underperforms on retrieval.
- Possible cause: The selected checkpoint expected query/passage prefixes or instructions, but every input was embedded as plain text.
- Fix: Follow the model card format for retrieval, clustering, and classification separately.

---

<!-- leetllm: mastery:end -->

## Try it yourself

These exercises let you verify your understanding without needing a GPU cluster.

### Exercise 1: compute triplet loss by hand

Given an anchor $a$, positive $p$, and negative $n$ with distances $d(a,p) = 0.3$ and $d(a,n) = 0.7$, compute the triplet loss for margins $m = 0.1$ and $m = 0.5$. In which case does the model still have work to do?

Solution sketch: For $m = 0.1$: $0.3 - 0.7 + 0.1 = -0.3$, so $\max(0, -0.3) = 0$. The margin is already satisfied. For $m = 0.5$: $0.3 - 0.7 + 0.5 = 0.1$, so $\max(0, 0.1) = 0.1$. The larger margin forces the model to pull the positive even closer or push the negative farther away.

### Exercise 2: spot the embedding mistake

A teammate gets nearly identical scores for every query-document pair using raw BERT [CLS]. What should you inspect before blaming the embedding geometry, and which model comparison would be useful?

Solution sketch: Check that distinct texts produce distinct vectors, inspect attention masks and pooling, and verify that scoring computes the intended query-by-document matrix. Then compare held-out rankings using a retrieval-trained encoder with its documented input format. Raw `[CLS]` lacks that contrastive objective. Use geometry checks to diagnose anisotropy and held-out rankings to measure retrieval gains.

### Exercise 3: design a two-stage retrieval pipeline

You have 2 million documentation chunks and a latency budget of 200 ms per query. Query encoding takes 10 ms; sequential cross-encoder scoring takes 15 ms per pair. Assume no batching or parallelism. Why does scoring the full corpus miss the budget, and what shortlist might fit?

Solution sketch: $2{,}000{,}000 \times 15\,\text{ms} = 30{,}000{,}000\,\text{ms} \approx 8.3$ hours per query. The cross-encoder is far too slow for the full corpus. Reserve $10\,\text{ms}$ for query encoding and choose a top-10 shortlist only if ANN lookup and overhead fit inside the remaining $40\,\text{ms}$: reranking then costs $10 \times 15\,\text{ms} = 150\,\text{ms}$, for at most $200\,\text{ms}$ total. If Recall@10 is inadequate, the budget or reranker throughput must change; silently widening to top 100 violates the requirement.

---

```mastery-quiz
[
  {
    "question": "A fresh sequence has valid token states [2,0] and [0,4], followed by padding [100,100]. Pool only valid states, then use cosine with [1,0]. Which pooled mean and similarity follow?",
    "options": [
      "Mean [1,2]; cosine equals 1.000.",
      "Mean [2,4]; cosine equals 2.000.",
      "Mean [1,2]; cosine about 0.447.",
      "Mean [34,34.667]; cosine about 0.700."
    ],
    "answer": "Mean [1,2]; cosine about 0.447.",
    "explanation": "Mask the padding before averaging: ([2,0]+[0,4])/2=[1,2]. The cosine with [1,0] is 1/sqrt(5), about 0.447. Averaging all three states leaks padding; using the raw dot product or sum confuses pooling and normalization."
  },
  {
    "question": "A one-positive InfoNCE row has positive score 0.4, negative score 0.6 and temperature 0.2. Which positive probability, loss and raw-score gradient pair are approximately correct?",
    "options": [
      "Probability 0.269; loss 1.313; gradients [−3.655,3.655].",
      "Probability 0.269; loss 0.313; gradients [−0.731,0.731].",
      "Probability 0.731; loss 0.313; gradients [−1.345,1.345].",
      "Probability 0.269; loss 1.313; gradients [3.655,−3.655]."
    ],
    "answer": "Probability 0.269; loss 1.313; gradients [−3.655,3.655].",
    "explanation": "The logits are 2 and 3. Positive probability is 1/(1+e), about 0.269, and negative log probability is 1.313. Divide probability-minus-target by 0.2: gradients are about [−3.655,3.655]. Gradient descent increases the preferred score despite its current lower similarity."
  },
  {
    "question": "Use triplet loss max(0,d_positive−d_negative+margin), with distances 0.45 and 0.55. What losses follow for margins 0.05 and 0.20?",
    "options": [
      "0.05 and 0.20; the selected margin itself is the loss.",
      "0.15 and 0.30; reverse positive and negative distances before adding the margin.",
      "0 and 0; both distance gaps satisfy the requested margin.",
      "0 and 0.10; the larger requested margin remains unsatisfied."
    ],
    "answer": "0 and 0.10; the larger requested margin remains unsatisfied.",
    "explanation": "The distance gap is 0.10. With margin 0.05 the expression is −0.05, clipped to 0. With margin 0.20 it is 0.10. A zero value means this gap satisfies that margin; it does not guarantee complete retrieval."
  },
  {
    "question": "One microbatch contains two positive query-passage pairs and a second contains four. Training uses in-batch negatives and accumulates gradients without sharing embeddings between microbatches. How many text encodings and off-diagonal query-to-passage comparisons does training use in total?",
    "options": [
      "12 encodings and 12 comparisons.",
      "12 encodings and 14 comparisons.",
      "6 encodings and 14 comparisons.",
      "12 encodings and 30 comparisons."
    ],
    "answer": "12 encodings and 14 comparisons.",
    "explanation": "Each of the six pairs contributes two text encodings, one for the query and one for the passage. In the first microbatch, each of two queries sees one other passage. In the second, each of four queries sees three others. That gives 2 × 1 + 4 × 3 = 14 comparisons. Counting one encoding per pair gives six. Using the average batch size of three gives 12 comparisons. Pooling all six pairs gives 30, which would require sharing embeddings across microbatches."
  },
  {
    "question": "One anchor has verified positive softmax probabilities 0.6 and 0.2, plus negative probability 0.2. What are negative-log positive mass and mean positive negative-log loss, respectively?",
    "options": [
      "About 1.060 and 0.223.",
      "About 0.400 and 0.800.",
      "About 0.223 and 0.223.",
      "About 0.223 and 1.060."
    ],
    "answer": "About 0.223 and 1.060.",
    "explanation": "The positive mass is 0.8, giving −log(0.8)=0.223. Mean-log loss is −(log 0.6+log 0.2)/2=1.060. The two aggregations do not express the same supervision, even though their positives and denominator are identical."
  },
  {
    "question": "For one query, a teacher scores the relevant passage 3.25 points below a non-match. The student scores both passages with raw cosines in [−1, 1]. Using the relevant score minus the non-match score for both margins, which student margin comes closest to the teacher's, and what is its squared error?",
    "options": [
      "Margin −2 with squared error 1.5625.",
      "Margin −1 with squared error 5.0625.",
      "Margin +2 with squared error 1.5625.",
      "Margin −2 with squared error 1.25."
    ],
    "answer": "Margin −2 with squared error 1.5625.",
    "explanation": "The teacher's margin is −3.25. Giving the relevant passage a cosine of −1 and the non-match a cosine of +1 reaches the closest possible margin, −2. The gap is 1.25, so its square is 1.5625. A lower bound of −1 applies to one cosine. Subtracting two cosines can reach −2. A margin of +2 fits the opposite ordering and lies 5.25 points from the teacher's target."
  },
  {
    "question": "A late-interaction similarity matrix has query rows [0.4,0.8,0.2], [0.7,0.1,0.5] and [0.3,0.9,0.2] over three document tokens. Which MaxSim score and matching rule follow?",
    "options": [
      "0.9; take one global maximum, allowing a document token to serve more than one query token.",
      "1.8; impose a one-to-one assignment so a document token cannot serve two query tokens.",
      "2.4; sum row maxima, allowing a document token to serve more than one query token.",
      "0.8; average row maxima, allowing a document token to serve more than one query token."
    ],
    "answer": "2.4; sum row maxima, allowing a document token to serve more than one query token.",
    "explanation": "The per-query-token maxima are 0.8,0.7 and 0.9, summing to 2.4. The first and third queries both select the second document position; MaxSim permits that reuse. Its independently stored contextual document-token vectors support late matching without imposing one-to-one phrase alignment."
  },
  {
    "question": "A Matryoshka model indexes one million width-96 float32 vectors out of a 768-d full model. Held-out Recall@200 is 0.86 against a target floor of 0.90. What raw short-vector payload and deployment decision follow?",
    "options": [
      "3.072 GB; deploy because prefix training guarantees the original full-width retrieval accuracy.",
      "384 MB; keep gated because rescoring only retrieved candidates cannot recover missing recall.",
      "384 MB; deploy because full-width rescoring restores passages missed by the shortlist.",
      "3.072 GB; keep gated because higher coordinate precision alone cannot hit the recall target."
    ],
    "answer": "384 MB; keep gated because rescoring only retrieved candidates cannot recover missing recall.",
    "explanation": "The raw payload is 1,000,000×96×4=384,000,000 bytes, or 384 decimal MB, compared to 3.072 GB at full width. Prefix training reduces truncation collapse, yet observed Recall@200 (0.86) misses the 0.90 requirement. Full-width rescoring cannot evaluate a passage absent from the shortlist; index overhead and retained full vectors add storage."
  },
  {
    "question": "A search service has a 175 ms deadline. Query encoding takes 14 ms, lookup takes 19 ms and other overhead takes 12 ms. The cross-encoder takes 11 ms per candidate. All work runs sequentially. What is the largest shortlist that fits, and which stage should you tune if required passages rank below that cutoff?",
    "options": [
      "11 candidates. Tune the cross-encoder's ranking.",
      "12 candidates. Tune the cross-encoder's ranking.",
      "11 candidates. Tune the first-stage retriever's ranking.",
      "12 candidates. Tune the first-stage retriever's ranking."
    ],
    "answer": "11 candidates. Tune the first-stage retriever's ranking.",
    "explanation": "The fixed work takes 14 + 19 + 12 = 45 ms, leaving 130 ms for scoring. Eleven candidates take 166 ms in total. Rounding 130/11 up to 12 would take 177 ms and miss the deadline. The first-stage retriever decides which passages enter the shortlist. Tuning the cross-encoder can change the order of those passages, but it cannot score a passage the retriever left out."
  },
  {
    "question": "A query has relevant judgments {A,B,C}. At cutoff 2, control ranks [X,B,A] and candidate ranks [B,X,A]. The target recall floor is 0.4. Which metric and comparison follow?",
    "options": [
      "Recall stays 1/3; reciprocal rank rises from 1/2 to 1, so both variants fail the recall floor.",
      "Recall stays 1/2; reciprocal rank rises from 1/3 to 1/2, so both variants pass the recall floor.",
      "Recall rises from 1/3 to 2/3; reciprocal rank rises from 1/2 to 1, so the candidate passes.",
      "Recall stays 1/3; reciprocal rank stays 1/2, so both variants fail the recall floor."
    ],
    "answer": "Recall stays 1/3; reciprocal rank rises from 1/2 to 1, so both variants fail the recall floor.",
    "explanation": "Each top-two set contains only B among three relevant judgments, so both recalls are 1/3, below 0.4. B moves from position 2 to 1, improving reciprocal rank from 1/2 to 1. Ordering improves without recovering A or C at this cutoff; both variants miss the recall floor."
  }
]
```

> **Next:** Continue to [Embedding Similarity & Quantization](/learn/embeddings-cosine-dot-product-quantization). InfoNCE, hard negatives, and encoder architecture shape reusable sentence vectors. Next you'll keep those vectors fixed and score them with cosine versus dot product alongside the quantization tradeoffs that govern index memory and recall.
