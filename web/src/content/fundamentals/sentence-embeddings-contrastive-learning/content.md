---
{
  "id": "sentence-embeddings-contrastive-learning",
  "title": "Sentence Embeddings & Contrastive Loss",
  "slug": "sentence-embeddings-contrastive-learning",
  "category": "Embeddings & Vector Search",
  "difficulty": "Medium",
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
  "section": "Core LLM Foundations",
  "order": 2,
  "aliases": [
    "word-embeddings-contextual-representations"
  ]
}
---

Search your transformer notes for `"How does RoPE encode token position?"` and two passages immediately compete for rank 1. One explains how Rotary Position Embeddings rotate query and key pairs in 2D subspaces by angle $m\theta$ so dot products depend on relative offset. The other describes adding a learned absolute position table before layer 0. Both share almost the same technical vocabulary (`position`, `token`, `vector`, `attention`), yet only the first answers the question.

A **<span data-glossary="embedding">sentence embedding</span>** compresses an entire string into one fixed-width <span data-glossary="vector">vector</span> so a search engine can score millions of passages in milliseconds. <span data-glossary="contrastive-learning">Contrastive learning</span> is the training objective that bends that vector space until the true answer lands closer to the query than every topic-adjacent lookalike.

| Query | Passage that should rank near it | Topic-adjacent non-match |
|---|---|---|
| "How does RoPE encode token position?" | "Rotate query and key pairs by angle mθ so dot products encode relative offset." | "Add learned absolute position tables before the first attention layer." |

## From static word tables to contextual representations

Before encoding whole passages, NLP built representations for individual words through a trainable lookup matrix $E \in \mathbb{R}^{V \times d}$, where token ID $i$ selects row $E[i]$. Those coordinates come from the **distributional hypothesis**: words appearing in similar neighborhoods (`apple` and `pear` near `sweet`; `river` and `lake` near `water`) land near one another in vector space.

### Static word vectors: PPMI-SVD, Word2Vec, GloVe, and FastText

Early dense vectors compressed global co-occurrence counts using **Positive Pointwise Mutual Information (PPMI)** and truncated <span data-glossary="svd">SVD</span>:[^deerwester1990]

$$
\text{PMI}(w, c) = \log \frac{\#(w, c) \cdot N}{\#(w)\, \#(c)}, \qquad \text{PPMI}(w, c) = \max(\text{PMI}(w, c), 0)
$$

Three landmark methods then made static word vectors scalable without factoring a dense $V \times V$ matrix upfront:

- **Word2Vec (CBOW and Skip-gram with Negative Sampling):**[^mikolov2013][^mikolov2013NegativeSampling] Slides a local context window over raw text (CBOW predicts the center word from neighbors; Skip-gram predicts neighbors from the center word) and replaces a full-vocabulary softmax with binary classification against $k$ noise draws:

$$
\mathcal{L}_{\text{SGNS}} = -\log \sigma(u \cdot v_+) - \sum_{n \in \mathcal{N}} \log \sigma(-u \cdot v_n)
$$

  Levy and Goldberg proved that Skip-gram negative sampling implicitly factorizes the shifted PMI matrix $\text{PMI}(w, c) - \log k$, unifying predictive embeddings with matrix factorization.[^levy2014]
- **GloVe (Global Vectors):**[^pennington2014] Aggregates global co-occurrence counts $X_{ij}$ once and fits weighted least squares on nonzero entries ($w_i \cdot \tilde{w}_j + b_i + \tilde{b}_j \approx \log X_{ij}$), using $f(x) = \min((x / x_{\max})^{3/4}, 1)$ so neither rare noise nor ubiquitous stop words dominate.
- **FastText (Subword Composition):**[^bojanowski2017] Learns vectors for boundary-marked character $n$-grams (`<pl`, `pla`, `lay`, `ay>`) alongside whole words, letting unseen inflections like `played` compose from shared stem subwords instead of falling back to an `<UNK>` row.

Watch one distributional quirk: high static cosine does not imply synonymy. Antonyms like `hot` and `cold` appear in nearly identical contexts (`hot/cold water`) and routinely sit right next to each other.

### Breaking the polysemy ceiling with context

Static tables hit a hard ceiling on **polysemy**: `"She saw the bank by the river"` and `"He paid the loan at the bank"` assign the exact same token ID to `bank`, returning one compromise vector for both senses. **<span data-glossary="contextual-representation">Contextual representations</span>** pass lookup rows through sequence layers that mix each token with its neighbors:

1. **ELMo:** Runs forward and backward 2-layer LSTMs over character-CNN inputs and blends layers with task-learned softmax weights ($\text{ELMo}_k = \gamma \sum_{j=0}^{2} s_j h_{k, j}$).[^peters2018]
2. **BERT:** Uses bidirectional Transformer self-attention so every token (`bank`) attends freely to both left and right context (`river` or `loan`).[^devlin2019]
3. **GPT:** Applies a lower-triangular <span data-glossary="causal-mask">causal mask</span> so position 0 (`bank`) sees only itself while trailing positions integrate the full prefix.[^radford2018]

## Why pooling static words or raw BERT fails

Word embeddings give every <span data-glossary="token">token</span> a vector. The quickest way to build a sentence vector is <span data-glossary="mean-pooling">mean pooling</span>: average the token vectors. Why isn't that enough on its own?

First, averaging **static** word vectors is commutative ($A + B = B + A$), so `"compiler calls linker"` and `"linker calls compiler"` collapse to the exact same vector! Second, taking a raw `[CLS]` vector straight out of pretrained BERT fails even worse: BERT was trained for joint pair classification, not independent cosine search. In the original SBERT benchmarks across seven semantic textual similarity (STS) tasks, raw BERT `[CLS]` scored just **29.19** (Spearman $\times 100$) and mean-pooled BERT scored **54.81**, both trailing simple averaged GloVe vectors at **61.32**.[^reimers2019]

<!-- leetllm: test, deps=numpy, output=show -->
```python title="mean_pool_order_collapse.py"
import numpy as np

table = {
    "compiler": np.array([0.9, 0.1, 0.0]),
    "calls": np.array([0.8, 0.2, 0.1]),
    "linker": np.array([0.7, 0.1, 0.2]),
}
mean_pool = lambda s: np.mean([table[w] for w in s.split()], axis=0)

a = mean_pool("compiler calls linker")
b = mean_pool("linker calls compiler")
print("A:", np.round(a, 3).tolist(), "B:", np.round(b, 3).tolist(), "identical:", np.allclose(a, b))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
A: [0.8, 0.133, 0.1] B: [0.8, 0.133, 0.1] identical: True
```
<!-- leetllm: output:end -->

Pretrained contextual representations also bring two geometric traps when plugged directly into vector search:

- **<span data-glossary="anisotropy">Anisotropy</span>:** Unfinetuned hidden states in BERT, ELMo, and GPT-2 crowd into a narrow cone sharing a large mean direction $\mu$.[^ethayarajh2019] Two opposing residuals around a shared mean `[10, 0]`, namely `[10, 1]` and `[10, -1]`, produce a raw cosine of `0.980`, flipping to `-1.000` only after subtracting $\mu$. (Anisotropy alone is not fatal if relative ordering stays sharp; `intfloat/e5-base-v2`, for example, places most cosines between $0.7$ and $1.0$ while ranking accurately.[^e5BaseV2Card2026])
- **Unaligned coordinate spaces:** Matching vector width $d$ never guarantees matching geometry across checkpoints. Even a clean $90^\circ$ orthogonal rotation preserves every internal distance inside Model B while scrambling search if a query from Model A hits an index built with Model B. Pin checkpoint revision, preprocessing, and similarity metric together, and re-index whenever you change encoders.

Contrastive training fixes sentence geometry directly by balancing two forces on the unit hypersphere $\mathcal{S}^{d-1}$:[^wang2020]

1. **Alignment:** Pull positive pairs $(x, x^+)$ together by minimizing $\mathcal{L}_{\text{align}} = \mathbb{E}[\|f(x) - f(x^+)\|_2^2] = 2 - 2\,\mathbb{E}[f(x)^\top f(x^+)]$.
2. **Uniformity:** Spread unrelated representations across the sphere by minimizing $\mathcal{L}_{\text{uniform}}(t) = \log \mathbb{E}[\exp(-t\|f(x) - f(y)\|_2^2)]$.

<figure>
  <img src="illustrations/_generated/embedding_space_geometry_dark.png" alt="Equal-scale unit circle for a RoPE query at 0 degrees. The positive RoPE guide sits at 6 degrees (cosine 0.995). A hard negative begins at negative 6 degrees (cosine 0.995) before training and separates to 120 degrees (cosine negative 0.500) at the target." />
  <figcaption>Contrastive training holds the matching RoPE guide near the query (6°) while pushing a crowded hard negative apart from −6° to 120°.</figcaption>
</figure>

```checkpoint
Why can mean pooling static word vectors make "compiler calls linker" and "linker calls compiler" identical?
---
Vector addition is commutative, so averaging the same set of static token vectors produces the exact same coordinates regardless of word order.
```

## Contrastive learning and InfoNCE

Rather than scoring one pair in isolation, modern retrieval encoders like SBERT,[^reimers2019] SimCSE,[^gao2021] and E5[^wang2022a] train with **<span data-glossary="infonce">InfoNCE</span>**.[^oord2018] Given a batch of $N$ positive pairs $(z_i, z_i^+)$ normalized to unit length, compute the $N \times N$ <span data-glossary="cosine-similarity">cosine similarity</span> matrix $S = Q P^\top$, divide by a <span data-glossary="temperature">temperature</span> $\tau$, and treat each row as an $N$-way classification problem where the diagonal entry $i$ is the right answer:

$$
\mathcal{L}_{\text{InfoNCE}} = -\frac{1}{N} \sum_{i=1}^{N} \log \frac{\exp(\text{sim}(z_i, z_i^+) / \tau)}{\sum_{j=1}^{N} \exp(\text{sim}(z_i, z_j^+) / \tau)}
$$

<figure>
  <img src="illustrations/_generated/contrastive_learning_dark.png" alt="A 0-to-1 cosine scale ranks a matching RoPE rotation positive at 0.91, an absolute-position hard negative at 0.42, and an NF4 quantization easy negative at 0.11. Positive gaps are 0.49 and 0.80. At fixed temperature tau, the higher-scoring negative carries larger softmax probability P_j and stronger score gradient P_j divided by tau." />
  <figcaption>Higher-scoring hard negatives draw far more softmax mass than easy distractors, concentrating gradient pressure right where the encoder is confused.</figcaption>
</figure>

Trace one row by hand with $\tau = 0.05$, positive similarity $0.90$, and in-batch negative similarity $0.20$:

1. Scale into <span data-glossary="logits">logits</span>: $0.90 / 0.05 = 18.0$ and $0.20 / 0.05 = 4.0$.
2. Subtract the max for stability ($0$ and $-14$) and apply <span data-glossary="softmax">softmax</span>: $P^+ = 1 / (1 + e^{-14}) \approx 0.99999917$.
3. Take negative log: $-\log(P^+) \approx 8.3 \times 10^{-7}$ (almost zero loss because the positive already wins decisively). Swap the two scores and the loss rockets to $\approx 14$ nats!

<figure>
  <img src="illustrations/_generated/info_nce_matrix_dark.png" alt="A two-pair cosine matrix has q1-to-p1 0.90, q1-to-p2 0.20, q2-to-p1 0.15, and q2-to-p2 0.85; diagonal cells are labeled positives. For q1 at temperature 0.05, scores 0.90 and 0.20 become logits 18 and 4, then stable logits 0 and negative 14. Their exponential masses are 1 and about 8.3 times 10 to the negative 7. Softmax gives p1 probability 0.99999917 and p2 probability 0.00000083, so q1 loss is about 8.3 times 10 to the negative 7. Swapping the scores gives loss about 14." />
  <figcaption>InfoNCE turns an $N \times N$ similarity matrix into $N$ row-wise multiple-choice questions whose correct answers sit along the diagonal.</figcaption>
</figure>

In real transformer training, token hidden states have shape `[batch, tokens, hidden]`. Always mask out padding tokens *before* mean pooling and L2 normalization so padding never leaks into the pooled vector or receives nonzero gradients:

<!-- leetllm: test, deps=torch, output=show -->
```python title="masked_pool_and_infonce.py"
import torch
import torch.nn.functional as F

torch.set_default_dtype(torch.float64)
states = torch.tensor([
    [[1., 0.], [0., 1.], [99., 99.]],
    [[0., 2.], [0., 0.], [99., 99.]],
], requires_grad=True)
mask = torch.tensor([[1., 1., 0.], [1., 0., 0.]])

pooled = (states * mask.unsqueeze(-1)).sum(dim=1) / mask.sum(dim=1, keepdim=True)
queries = F.normalize(pooled, dim=-1)
passages = F.normalize(torch.tensor([[1., 0.], [0., 1.]]), dim=-1)

logits = (queries @ passages.T) / 0.2
loss = F.cross_entropy(logits, torch.arange(len(queries)))
loss.backward()

print("Masked means:", pooled.detach().tolist())
print(f"InfoNCE loss: {loss.item():.6f}")
print("Padding grads (must be zero):", states.grad[:, 2, :].tolist())
print("First real token grad:", [round(v, 6) for v in states.grad[0, 0].tolist()])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Masked means: [[0.5, 0.5], [0.0, 2.0]]
InfoNCE loss: 0.349931
Padding grads (must be zero): [[-0.0, 0.0], [0.0, 0.0]]
First real token grad: [-0.883883, 0.883883]
```
<!-- leetllm: output:end -->

Many multimodal and dual-encoder recipes (such as CLIP[^radford2021]) also average the transpose direction into **symmetric InfoNCE**, $\mathcal{L}_{\text{dual}} = \tfrac{1}{2}(\mathcal{L}_{q \to d} + \mathcal{L}_{d \to q})$. By contrast, **<span data-glossary="triplet-loss">triplet loss</span>** $\mathcal{L} = \max(0, d(a, p) - d(a, n) + m)$ enforces an explicit distance margin $m$ on a single negative at a time: when $d(a, p) = 0.2$, $d(a, n) = 0.5$, and $m = 0.1$, the margin is already met ($\max(0, -0.2) = 0$), whereas flipping $d(a, p) = 0.5, d(a, n) = 0.3$ gives loss $0.3$. Both InfoNCE and triplet losses remain standard in Sentence Transformers.[^sentenceLosses2026]

### How temperature $\tau$ shapes gradients

Differentiating one InfoNCE row with respect to cosine scores $s_j = \text{sim}(q, c_j)$ yields:

$$
\frac{\partial \mathcal{L}}{\partial s^+} = -\frac{1}{\tau}(1 - P^+), \qquad \frac{\partial \mathcal{L}}{\partial s_j^-} = \frac{1}{\tau} P_j
$$

The ratio of gradient pressure between a hard negative ($s_1^- = 0.72$) and an easy negative ($s_2^- = 0.20$) is exponential in $1/\tau$:

$$
\frac{\partial \mathcal{L} / \partial s_1^-}{\partial \mathcal{L} / \partial s_2^-} = \frac{P_1}{P_2} = \exp\left(\frac{s_1^- - s_2^-}{\tau}\right)
$$

At $\tau = 0.05$ (Sentence Transformers' default `scale=20`[^sentenceLosses2026]; E5 uses $\tau = 0.01$[^e5BaseV2Card2026]), that $0.52$ cosine gap gives the hard negative **$32{,}860\times$** more score gradient than the easy negative, compared to just **$1.68\times$** at $\tau = 1.0$. Watch out for the flip side: on an already-easy row ($s^+ = 0.90, s^- = 0.20$), lowering $\tau$ saturates $P^+ \to 1$ so tightly that the absolute gradient shrinks by 27 orders of magnitude!

<figure>
  <img src="illustrations/_generated/temperature_softmax_dark.png" alt="A sampled curve plots positive probability against temperature for a fixed similarity gap of 0.70, with a complete vertical probability scale from zero to one. Exact teaching values are tau 0.05 gives 0.999999, 0.10 gives 0.999089, 0.50 gives 0.802184, and 1.00 gives 0.668188. Samples begin at tau 0.02 and continue through 1.20. The curve shows easy-row probability; gradient magnitude is a separate quantity." />
  <figcaption>For a fixed 0.70 similarity gap, low $\tau$ saturates $P(\text{positive}) \approx 1$ and shuts off gradient on easy pairs while focusing all learning on close competitors.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="temperature_saturation.py"
import numpy as np

taus = np.array([0.01, 0.05, 0.10, 1.00])
sigmoid = lambda x: 1.0 / (1.0 + np.exp(-np.clip(x, -700.0, 700.0)))
p_pos = sigmoid((0.90 - 0.20) / taus)
p_neg = sigmoid((0.20 - 0.90) / taus)  # avoids 1 - P cancellation
grads = p_neg / taus

for tau, p, g in zip(taus, p_pos, grads):
    print(f"tau={tau:.2f}: P(pos)={p:.6f}, |grad|={g:.3e}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tau=0.01: P(pos)=1.000000, |grad|=3.975e-29
tau=0.05: P(pos)=0.999999, |grad|=1.663e-05
tau=0.10: P(pos)=0.999089, |grad|=9.111e-03
tau=1.00: P(pos)=0.668188, |grad|=3.318e-01
```
<!-- leetllm: output:end -->

```checkpoint
For a fixed 0.70 similarity gap, does lowering temperature from 1.00 to 0.05 increase the absolute score gradient?
---
No. Saturation drives $1 - P^+$ down far faster than $1/\tau$ grows, dropping the gradient from $0.332$ to $1.66 \times 10^{-5}$. Low $\tau$ amplifies hard negatives while letting easy rows go quiet.
```

## Building training pairs and mining hard negatives

Where do positive pairs and informative negatives come from?

- **Supervised NLI and Siamese training:** SBERT[^reimers2019] trained shared-weight <span data-glossary="siamese-network">Siamese networks</span> on entailment/contradiction pairs; supervised SimCSE uses entailment as the positive and contradiction as a hard negative.[^gao2021]
- **Self-supervised SimCSE:** No labels? Run the exact same sentence through the encoder twice with two independent dropout masks.[^gao2021] The two stochastic views become a positive pair, pushing BERT-base unsupervised STS from 54.81 to **76.3** (and **81.6** with NLI supervision).
- **In-batch negatives (DPR):**[^karpukhin2020] A batch of $B$ query-passage pairs gives $B(B-1)$ off-diagonal negatives at zero extra encoder cost. Beware **<span data-glossary="false-negative">false negatives</span>**: if two queries in the same batch map to the same passage, unmasked InfoNCE actively pushes the matching passage *down* with a positive score gradient and hits a $\log 2$ loss floor!

Once the encoder easily rejects off-topic passages (`"NF4 quantization"` vs. `"How does RoPE work?"`), easy negatives stop teaching it anything. **<span data-glossary="hard-negative">Hard negatives</span>** share vocabulary while describing a different mechanism (`"Sinusoidal absolute position tables"`), injecting fresh denominator mass into InfoNCE.

<figure>
  <img src="illustrations/_generated/pair_mining_dark.png" alt="For the query How does RoPE encode token position?, label auditing protects a relevant RoPE rotation passage with overlap 3 and score 0.92. Two non-relevant candidates sharing position vocabulary score 0.76 (overlap 5) and 0.68 (overlap 2) and become hard negatives 1 and 2, while an unrelated NF4 quantization passage with overlap 0 and score 0.05 is dropped." />
  <figcaption>Mining retains high-overlap non-relevant lookalikes as hard negatives while filtering out true positives and zero-overlap distractors.</figcaption>
</figure>

Teams combine four mining strategies:
1. **In-batch negatives:** Free comparisons that scale with batch size (not plain gradient accumulation unless embeddings are shared across microbatches).
2. **BM25 lexical hard negatives:** High keyword overlap with wrong semantics.
3. **Cross-encoder mining and MarginMSE distillation:** Score top-100 candidates with a joint cross-encoder teacher and either mine high-scoring non-matches or distill the teacher's score gap directly via **MarginMSE**:[^hofstatter2020MarginMse]

$$
\mathcal{L}_{\text{MarginMSE}} = \left( (\text{score}_{\text{student}}(q, p^+) - \text{score}_{\text{student}}(q, n^-)) - (\text{score}_{\text{teacher}}(q, p^+) - \text{score}_{\text{teacher}}(q, n^-)) \right)^2
$$

4. **Iterative (self-adversarial) mining:** Re-index the corpus with the updated bi-encoder to surface the model's newest mistakes, while filtering out unlabeled positives using teacher score ceilings or multi-positive objectives like SupCon ($\mathcal{L}_{\text{mean-log}} = -\frac{1}{|\mathcal{P}|}\sum_{p\in\mathcal{P}}\log P_p$,[^khosla2020SupCon] which penalizes neglecting *any* valid positive far more strongly than summing positive mass inside a single log).

<!-- leetllm: test, deps=torch, output=show -->
```python title="false_negatives_and_hard_negatives.py"
import torch
import torch.nn.functional as F

# 1. Duplicate positive in the same batch creates a harmful repulsive gradient unless masked.
for mask_dup in (False, True):
    scores = torch.tensor([0.8, 0.8, 0.1], dtype=torch.float64, requires_grad=True)
    logits = scores / 0.2
    if mask_dup:
        logits = logits.masked_fill(torch.tensor([False, True, False]), -torch.inf)
    loss = F.cross_entropy(logits.unsqueeze(0), torch.tensor([0]))
    loss.backward()
    print(f"mask_dup={str(mask_dup):<5}: loss={loss.item():.4f}, grads={[round(g, 3) for g in scores.grad.tolist()]}")

# 2. Adding one mined hard negative (0.72) wakes up a saturated easy row (0.90 vs 0.20, tau=0.05).
easy_loss = F.cross_entropy(torch.tensor([[0.90, 0.20]]) / 0.05, torch.tensor([0])).item()
hard_loss = F.cross_entropy(torch.tensor([[0.90, 0.20, 0.72]]) / 0.05, torch.tensor([0])).item()
print(f"Easy-only loss: {easy_loss:.6f} -> With mined hard neg: {hard_loss:.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
mask_dup=False: loss=0.7081, grads=[-2.537, 2.463, 0.074]
mask_dup=True : loss=0.0298, grads=[-0.147, 0.0, 0.147]
Easy-only loss: 0.000001 -> With mined hard neg: 0.026958
```
<!-- leetllm: output:end -->

## Bi-encoder, cross-encoder, and ColBERT late interaction

Once you know how to train vectors, serving raises a second architectural question: **when do the query and document tokens get to see each other?**

<figure>
  <img src="illustrations/_generated/encoder_tradeoffs_dark.png" alt="Three retrieval architectures place query-passage interaction at different stages. A bi-encoder encodes query and passage tokens separately into single vectors q and d and computes q dot d. A cross-encoder concatenates [query ; passage] for full joint self-attention on a shortlist. Late interaction stores document-token vectors d_j, computes every q_i dot d_j similarity, takes each query row maximum, and sums them." />
  <figcaption>Three interaction points: single-vector dot product (bi-encoder), full joint self-attention (cross-encoder), or token-level MaxSim (ColBERT late interaction).</figcaption>
</figure>

| Architecture | Stored per document | Query-time work | Interaction | Typical role |
|---|---|---|---|---|
| **<span data-glossary="bi-encoder">Bi-encoder</span>** | 1 vector | 1 query encode + <span data-glossary="ann-search">ANN search</span> | $q \cdot d$ or cosine | First-stage recall over millions of docs |
| **<span data-glossary="cross-encoder">Cross-encoder</span>** | Raw text | Joint forward over $K$ `[q; d]` pairs | Full self-attention | High-precision top-$K$ <span data-glossary="reranker">reranker</span> |
| **ColBERT (late interaction)** | $L_d$ token vectors ($d=128$) | 1 query encode + token MaxSim | $\sum_i \max_j q_i \cdot d_j$ | Fine-grained token matching with larger index |

**ColBERT**[^khattab2020] sits cleanly between the two extremes. Both sides encode independently (keeping offline indexing intact), but instead of collapsing a passage to one vector, ColBERT stores normalized contextual token vectors (typically projected to $d = 128$) and scores with **MaxSim**:

$$
\text{Score}(q, d) = \sum_{i=1}^{|q|} \max_{j=1}^{|d|} E_{q,i} \cdot E_{d,j}^\top
$$

Each query token picks its strongest matching document token (multiple query tokens may match the same document token). Storing 100 token vectors of width 128 takes $16.7\times$ the raw float bytes of a single width-768 vector, which **ColBERTv2** compresses sharply by storing a nearest-centroid ID plus 1- or 2-bit quantized residuals.[^santhanam2022ColBertV2]

<figure>
  <img src="illustrations/_generated/late_interaction_maxsim_dark.png" alt="ColBERT MaxSim similarities compare query positions rope and angle with stored document positions shift, rope, and angle. Matrix rows are 0.12, 0.93, 0.08 and 0.19, 0.07, 0.91 across six dot products. Row maxima 0.93 and 0.91 sum to 1.84." />
  <figcaption>ColBERT's MaxSim takes each query token's peak similarity across stored document tokens and sums those row maxima ($0.93 + 0.91 = 1.84$).</figcaption>
</figure>

In production, teams routinely pair a bi-encoder with a cross-encoder in a **two-stage retrieval pipeline**: the bi-encoder fetches a fast top-$K$ shortlist, and the cross-encoder reranks only those $K$ candidates. Notice the recall trap below: if `candidate_k` is too tight, the cross-encoder never sees the right passage and cannot save you!

<figure>
  <img src="illustrations/_generated/reranking_pipeline_dark.png" alt="Two-stage retrieval pipeline for the query How does RoPE encode token position?. Bi-encoder cosine shortlist at K=3 selects Absolute pos bias (0.84), RoPE rotation proof (0.81), and RoPE base theta notes (0.78), while excluding NF4 quantization (0.10 cosine, 0.05 cross-encoder score uncomputed). Joint cross-encoder reranking reorders the shortlist to RoPE rotation (0.96), RoPE base theta (0.91), and drops Absolute pos bias (0.21) at top_k=2." />
  <figcaption>Stage 1 bi-encoder recall caps what Stage 2 can rescue: with $K=3$, the cross-encoder promotes `rope-rotation` (0.96) over `abs-pos-bias` (0.21).</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="maxsim_and_rerank.py"
import numpy as np

# 1. ColBERT MaxSim over query ["rope", "angle"] x doc ["shift", "rope", "angle"]
sim = np.array([[0.12, 0.93, 0.08], [0.19, 0.07, 0.91]])
print("MaxSim row maxima:", sim.max(axis=1).tolist(), "-> score:", round(float(sim.max(axis=1).sum()), 2))

# 2. Two-stage bi-encoder + cross-encoder reranking
docs = [
    {"id": "abs-pos-bias", "bi": 0.84, "cross": 0.21},
    {"id": "rope-rotation", "bi": 0.81, "cross": 0.96},
    {"id": "rope-theta-base", "bi": 0.78, "cross": 0.91},
    {"id": "nf4-quantization", "bi": 0.10, "cross": 0.05},
]
def search(candidate_k: int, top_k: int = 2):
    shortlist = sorted(docs, key=lambda d: d["bi"], reverse=True)[:candidate_k]
    return [d["id"] for d in sorted(shortlist, key=lambda d: d["cross"], reverse=True)[:top_k]]

print("K=3 reranked top-2:", search(candidate_k=3))
print("K=1 trapped top-2: ", search(candidate_k=1))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
MaxSim row maxima: [0.93, 0.91] -> score: 1.84
K=3 reranked top-2: ['rope-rotation', 'rope-theta-base']
K=1 trapped top-2:  ['abs-pos-bias']
```
<!-- leetllm: output:end -->

### Task prefixes and Matryoshka embeddings

Retrieval is asymmetric: queries are short questions while documents are long explanations. Many checkpoints therefore expect task formatting documented on their model cards: `intfloat/e5-base-v2` requires `"query: "` and `"passage: "` prefixes,[^e5BaseV2Card2026] `BAAI/bge-base-en-v1.5` recommends a retrieval query instruction with plain passages,[^bgeBaseV15Card2026] and INSTRUCTOR takes `[instruction, text]` pairs.[^instructor2026Usage] Always store formatting settings alongside the index so query and corpus prefixes never drift out of sync.

What if your vector index is running out of RAM? Arbitrarily slicing a standard 768-d vector to `v[:128]` can collapse distinct vectors together: truncating unit vectors `[0.6, 0.8]` and `[0.6, -0.8]` to their first coordinate turns a $-0.28$ cosine into a $1.0$ collision after re-normalization.

**<span data-glossary="matryoshka-representation-learning">Matryoshka Representation Learning (MRL)</span>**[^kusupati2022] solves this by summing the contrastive loss across nested prefix widths $\mathcal{D} = \{32, 64, 128, 256, 512, 768\}$ during training:

$$
\mathcal{L}_{\text{MRL}} = \sum_{d \in \mathcal{D}} w_d \, \mathcal{L}_{\text{InfoNCE}}\left( \frac{z_{1:d}}{\|z_{1:d}\|_2}, \frac{z^+_{1:d}}{\|z^+_{1:d}\|_2}; \tau \right)
$$

That packs the coarsest, highest-signal information into the front coordinates, enabling **adaptive two-stage vector search**: index 64-d prefixes in RAM ($2.56\text{ GB}$ raw float32 for 10M docs vs. $30.72\text{ GB}$ at 768-d) to retrieve a shortlist, then fetch full vectors from disk to rescore. Always re-normalize truncated prefixes before dot-product search so dot product still equals cosine!

<figure>
  <img src="illustrations/_generated/matryoshka_dimensions_dark.png" alt="A 768-dimensional embedding is structured into prefixes at 32, 128, and 768 dimensions, using 4.17 percent, 16.67 percent, and 100 percent of full float storage. Multi-width contrastive training sums prefix losses 0.0088 at d=2, 0.0147 at d=4, and 0.0225 at d=6, giving a mean loss of 0.0153." />
  <figcaption>Matryoshka training supervises nested prefixes simultaneously so a single checkpoint supports 32-d, 128-d, or full 768-d deployment budgets.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="matryoshka_and_truncation.py"
import numpy as np

def norm_rows(x: np.ndarray) -> np.ndarray:
    return x / np.linalg.norm(x, axis=-1, keepdims=True)

def info_nce(q: np.ndarray, p: np.ndarray, tau: float = 0.2) -> float:
    logits = (norm_rows(q) @ norm_rows(p).T) / tau
    shifted = logits - logits.max(axis=1, keepdims=True)
    log_probs = shifted - np.log(np.exp(shifted).sum(axis=1, keepdims=True))
    return float(-np.mean(np.diag(log_probs)))

# 1. Arbitrary truncation collapses [0.6, 0.8] and [0.6, -0.8] from cosine -0.28 to 1.00.
q_vec, d_vec = np.array([[0.6, 0.8]]), np.array([[0.6, -0.8]])
print("Full cosine:", round(float((q_vec @ d_vec.T)[0, 0]), 2),
      "Truncated 1D cosine:", round(float((norm_rows(q_vec[:, :1]) @ norm_rows(d_vec[:, :1]).T)[0, 0]), 2))

# 2. Multi-width Matryoshka loss across nested prefix sizes (2, 4, 6).
Q = np.array([[1.0, 0.0, 0.9, 0.1, 0.5, 0.2], [0.0, 1.0, 0.1, 0.9, 0.2, 0.5]])
P = np.array([[0.95, 0.05, 0.85, 0.15, 0.45, 0.25], [0.05, 0.95, 0.15, 0.85, 0.25, 0.45]])
losses = {d: info_nce(Q[:, :d], P[:, :d]) for d in (2, 4, 6)}
print({d: round(v, 4) for d, v in losses.items()}, "mean:", round(float(np.mean(list(losses.values()))), 4))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Full cosine: -0.28 Truncated 1D cosine: 1.0
{2: 0.0088, 4: 0.0147, 6: 0.0225} mean: 0.0153
```
<!-- leetllm: output:end -->

## Evaluating retrieval: STS, MTEB, and Recall@K vs. MRR

Pairwise **STS** measures <span data-glossary="spearman-rank-correlation">Spearman rank correlation</span> between cosine scores and human relatedness ratings, but high STS alone never guarantees strong search. The **<span data-glossary="mteb">Massive Text Embedding Benchmark (MTEB)</span>**[^muennighoff2023] (incorporating BEIR[^thakur2021] for retrieval and expanded to 500+ multilingual tasks in MMTEB[^enevoldsen2025Mmteb]) exposed that no single encoder dominates all eight task families (retrieval, classification, clustering, STS, reranking, pair classification, summarization, and bitext mining).[^mteb_leaderboard]

<figure>
  <img src="illustrations/_generated/evaluation_suite_dark.png" alt="Top table shows Semantic Textual Similarity comparing human relatedness ratings 4.5 and 1.2 out of 5 with cosine rankings via Spearman rank correlation. Bottom bar chart shows the original MTEB paper snapshot of 58 datasets across eight categories: retrieval 15, classification 12, clustering 11, STS 10, reranking 4, pair classification 3, bitext mining 2, and summarization 1." />
  <figcaption>STS tests pairwise relatedness via Spearman correlation; MTEB spans eight distinct task categories so you can screen models before benchmarking on your own corpus.</figcaption>
</figure>

On your own held-out search queries, measure **<span data-glossary="recall-at-k">Recall@K</span>** (coverage: did the relevant documents enter the top $K$?) separately from **MRR** or **<span data-glossary="ndcg">NDCG</span>** (ordering: how high did the first relevant document land?). In practice, you train and pool embeddings with `sentence-transformers`[^reimers2019] and index/search them with <span data-glossary="faiss">FAISS</span>.[^johnson2017]

<!-- leetllm: test, output=show -->
```python title="recall_and_mrr.py"
cases = [
    ({"rope-rotation", "theta-base"}, ["abs-bias", "rope-rotation", "theta-base"]),
    ({"alibi-slope"}, ["alibi-slope", "rope-rotation", "abs-bias"]),
    ({"yarn-scale"}, ["abs-bias", "alibi-slope", "rope-rotation"]),
]
def eval_at_k(relevant: set[str], ranked: list[str], k: int = 2):
    top = ranked[:k]
    recall = len(relevant & set(top)) / len(relevant)
    rr = next((1 / i for i, doc in enumerate(top, 1) if doc in relevant), 0.0)
    return recall, rr

scores = [eval_at_k(rel, rank) for rel, rank in cases]
for idx, (r, rr) in enumerate(scores, 1):
    print(f"Query {idx}: Recall@2={r:.2f}, RR@2={rr:.2f}")
print(f"Mean Recall@2={sum(r for r, _ in scores)/len(scores):.2f}, MRR@2={sum(rr for _, rr in scores)/len(scores):.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Query 1: Recall@2=0.50, RR@2=0.50
Query 2: Recall@2=1.00, RR@2=1.00
Query 3: Recall@2=0.00, RR@2=0.00
Mean Recall@2=0.50, MRR@2=0.50
```
<!-- leetllm: output:end -->

```checkpoint
Your cross-encoder scores the right passage highly whenever you pass it manually, yet production search still misses that passage. Which stage is broken?
---
Stage 1 (first-stage recall). A cross-encoder can only reorder candidates that enter its shortlist; improve first-stage retrieval or widen the shortlist within your latency budget.
```

<details>
<summary>Deep dive: Practice exercises and common debugging pitfalls</summary>

1. **Triplet loss check:** With $d(a,p) = 0.3$ and $d(a,n) = 0.7$, margin $m = 0.1$ gives $\max(0, -0.3) = 0$ (satisfied), while $m = 0.5$ gives $\max(0, 0.1) = 0.1$ (active gradient).
2. **Latency budget check:** With 2M chunks, a 200 ms query budget, 10 ms query encode, and 15 ms/pair sequential cross-encoder scoring, scoring the full corpus takes 8.3 hours! A two-stage pipeline leaves 190 ms for ANN + reranking, fitting at most a top-10 shortlist ($150\text{ ms}$) if ANN + overhead stay under 40 ms.
3. **Common bugs:** Using raw BERT `[CLS]` without contrastive training; forgetting padding masks before mean pooling; keeping easy batches where loss drops to 0 without lifting Recall@K; slicing embeddings without Matryoshka training or prefix re-normalization; omitting model-card query/passage prefixes.

</details>

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
    "explanation": "The distance gap is 0.10. With margin 0.05 the expression is −0.05, clipped to 0. With margin 0.20 it is 0.10."
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
      "384 MB; hold back because rescoring only retrieved candidates cannot recover missing recall.",
      "384 MB; deploy because full-width rescoring restores passages missed by the shortlist.",
      "3.072 GB; hold back because higher coordinate precision alone cannot hit the recall target."
    ],
    "answer": "384 MB; hold back because rescoring only retrieved candidates cannot recover missing recall.",
    "explanation": "The raw payload is 1,000,000×96×4=384,000,000 bytes, or 384 decimal MB, compared to 3.072 GB at full width. Observed Recall@200 (0.86) misses the 0.90 requirement, and full-width rescoring cannot evaluate passages absent from the shortlist."
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

> **Next:** Continue to [The Transformer Architecture End-to-End](/learn/transformer-architecture-end-to-end).
