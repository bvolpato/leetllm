---
{
  "id": "word-embeddings-contextual-representations",
  "title": "Static to Contextual Embeddings",
  "slug": "word-embeddings-contextual-representations",
  "category": "NLP Fundamentals",
  "difficulty": "Medium",
  "coverImage": "illustrations/_generated/context_window_dark.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Microsoft",
    "DeepMind",
    "Anthropic"
  ],
  "shortDescription": "The same token ID starts from one fixed embedding row, while surrounding context words steer each occurrence toward its active sense.",
  "keyConceptsTested": [
    "Embedding tables map token IDs to trainable coordinate vectors",
    "Co-occurrence and prediction objectives pull words with similar usage patterns together",
    "Word2Vec, GloVe, and FastText build static vectors from distinct signals",
    "A static vector assigns one row to every sense of a polysemous token",
    "Contextual layers compute occurrence states conditioned on visible neighbors",
    "Anisotropy and shared mean directions distort raw cosine similarity",
    "Matching vector dimensions do not align separate embedding spaces"
  ],
  "section": "Core LLM Foundations",
  "order": 3
}
---

Read these two sentences side by side:

```text title="same-id-two-sentences.txt"
"She saw the bank by the river." -> [..., 407, ...]
"He paid the loan at the bank."  -> [..., 407, ...]
```

A [tokenizer](/learn/tokenization-bpe-wordpiece-sentencepiece) assigns the exact same integer (`407`) to both occurrences of `bank`, and the model's embedding table returns the exact same starting vector for both. How does a neural network figure out that the first `bank` is muddy ground beside water while the second is a financial institution?

Tracing how NLP moved from **static lookup tables** (PPMI-SVD, Word2Vec, GloVe, FastText) to **<span data-glossary="contextual-representation">contextual representations</span>** (ELMo, BERT, GPT) explains both why a fixed table learns rich semantic geometry and why polysemy, anisotropy, and vector-space alignment require looking beyond individual token rows.

## From co-occurrence counts to static embeddings

An <span data-glossary="embedding">embedding</span> layer is simply a trainable lookup <span data-glossary="matrix">matrix</span> $E \in \mathbb{R}^{V \times d}$ where integer ID `i` selects row $E[i]$. Where do meaningful coordinates come from? From the **distributional hypothesis**: words that appear in similar neighborhoods (`apple` and `pear` near `tastes` and `sweet`; `river` and `lake` near `holds` and `water`) play similar roles.

### 1. PPMI + SVD: compressing count tables

Raw co-occurrence counts are sparse and dominated by stop words like `the`. **Positive Pointwise Mutual Information (PPMI)** filters out chance co-occurrence by measuring how much more often $(w, c)$ appears than independence predicts, clamping negatives at zero:

$$
\text{PMI}(w, c) = \log \frac{\#(w, c) \cdot N}{\#(w)\, \#(c)}, \qquad \text{PPMI}(w, c) = \max(\text{PMI}(w, c), 0)
$$

Factoring the PPMI matrix with truncated <span data-glossary="svd">SVD</span> ($U_k \sqrt{\Sigma_k}$, as in Latent Semantic Analysis[^deerwester1990]) projects co-occurring words onto compact dense directions whose alignment is measured with <span data-glossary="cosine-similarity">cosine similarity</span> $\cos(u, v) = (u \cdot v)/(\|u\|\|v\|)$.

<figure>
  <img src="illustrations/_generated/count_matrix_svd_dark.png" alt="A two-panel summary of PPMI weighting and rank-2 SVD. Left panel shows the four-by-four PPMI table where apple and pear align on fruit and sweet while river and lake align on water and shore. Right panel plots the two resulting orthogonal SVD directions (singular values 1.42 and 1.35 kept, 0.16 and 0.07 dropped)." />
  <figcaption>Rank-2 SVD on a block-structured PPMI matrix keeps the two dominant singular values (`1.418`, `1.348`), aligning `apple`/`pear` and `river`/`lake` onto perpendicular axes.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy -->
```python title="ppmi-svd-clusters.py"
import numpy as np

counts = np.array([
    [8, 6, 0, 0],  # apple
    [7, 6, 0, 0],  # pear
    [0, 0, 8, 5],  # river
    [0, 0, 7, 6],  # lake
], dtype=float)

expected = (counts.sum(axis=1, keepdims=True) @ counts.sum(axis=0, keepdims=True)) / counts.sum()
ppmi = np.where(counts > 0, np.maximum(np.log(np.where(counts > 0, counts / expected, 1.0)), 0.0), 0.0)
u, s, _ = np.linalg.svd(ppmi, full_matrices=False)
vecs = u[:, :2] * np.sqrt(s[:2])

cos = lambda a, b: float((a @ b) / (np.linalg.norm(a) * np.linalg.norm(b)))
print("apple-fruit PPMI:", round(float(ppmi[0, 0]), 3), "| singular values:", np.round(s, 3).tolist())
print("cos(apple, pear):", round(cos(vecs[0], vecs[1]), 3), "| cos(apple, river):", round(cos(vecs[0], vecs[2]), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
apple-fruit PPMI: 0.703 | singular values: [1.418, 1.348, 0.158, 0.067]
cos(apple, pear): 1.0 | cos(apple, river): 0.0
```
<!-- leetllm: output:end -->

> **Common mistake:** High distributional cosine does *not* imply synonymy! Antonyms like `hot` and `cold` appear in nearly identical contexts (`hot/cold water`, `hot/cold day`) and routinely sit right next to each other in static vector space.

### 2. Word2Vec, GloVe, and FastText

Instead of factoring a giant $V \times V$ table upfront, three landmark static methods made dense word vectors fast and scalable:

- **Word2Vec (CBOW & Skip-gram with Negative Sampling):**[^mikolov2013][^mikolov2013NegativeSampling] Slides a local window across raw text (CBOW predicts the center word from neighbors; Skip-gram predicts each neighbor from the center word) and replaces an expensive full softmax with binary logistic regression against $k$ random noise draws:
$$
\mathcal{L}_{\text{SGNS}} = -\log \sigma(u \cdot v_+) - \sum_{n \in \mathcal{N}} \log \sigma(-u \cdot v_n)
$$
Remarkably, Levy and Goldberg proved that Skip-gram negative sampling implicitly factorizes the shifted PMI matrix $\text{PMI}(w, c) - \log k$, unifying prediction and matrix factorization![^levy2014]
- **GloVe (Global Vectors):**[^pennington2014] Aggregates global $1/r$-decayed co-occurrence counts $X_{ij}$ once and fits weighted least squares on nonzero cells only: $w_i \cdot \tilde{w}_j + b_i + \tilde{b}_j \approx \log X_{ij}$, weighted by $f(x) = \min((x / x_{\max})^{3/4}, 1)$ so neither rare noise nor ubiquitous stop words dominate.
- **FastText (Subword Composition):**[^bojanowski2017] Learns vectors for boundary-marked character n-grams (`<pl`, `pla`, `lay`, `ay>`) alongside whole words so unseen morphological variants (`played`) compose cleanly from shared stem n-grams (requiring the full `.bin` model rather than a word-only `.vec` export; `getWordVector` averages constituent n-grams[^fastTextWordVector2026][^fastTextUnsupervisedTutorial2026]).

<figure>
  <img src="illustrations/_generated/word2vec_objectives_dark.png" alt="A radius-2 window around center token read in children read stories each night. Children, stories, and each sit inside the window while night is three steps away. CBOW combines the three neighbors to predict read; Skip-gram forms three training pairs starting at read." />
  <figcaption>A radius-2 sliding window around `read` links `children`, `stories`, and `each` while excluding `night` at offset +3.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/fasttext_subwords_dark.png" alt="FastText character trigrams and vector composition for play and unseen played. Both spellings share &lt;pl, pla, and lay. Play also uses ay&gt; and its whole-word row; unseen played sums the three shared stem vectors with aye, yed, and ed&gt; so its direction aligns closely with play rather than orthogonal terms like river." />
  <figcaption>FastText composes unseen <code>played</code> from character trigrams; sharing <code>&lt;pl</code>, <code>pla</code>, and <code>lay</code> aligns it closely with <code>play</code> (cosine 0.612) while keeping <code>river</code> orthogonal (0.0).</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy -->
```python title="sgns-glove-and-fasttext-mechanics.py"
import numpy as np

# 1. One Skip-gram negative sampling update
u, vp, vns = np.array([1.0, 0.0]), np.array([1.2, 0.1]), np.array([[-0.9, -0.2], [-1.1, 0.0]])
sig = lambda x: 1.0 / (1.0 + np.exp(-x))
sgns_loss = lambda x: float(np.logaddexp(0.0, -(x @ vp)) + np.logaddexp(0.0, vns @ x).sum())
grad = (sig(u @ vp) - 1.0) * vp + (sig(vns @ u)[:, None] * vns).sum(axis=0)
u_new = u - 0.1 * grad
print(f"SGNS step: loss {sgns_loss(u):.3f} -> {sgns_loss(u_new):.3f}, u={np.round(u_new, 3).tolist()}")

# 2. GloVe clipped weighting across counts [3, 30, 100]
counts = np.array([3.0, 30.0, 100.0])
w_loss = np.minimum((counts / 100.0) ** 0.75, 1.0) * (np.log(30.0) - np.log(counts)) ** 2
print("GloVe weighted losses:", np.round(w_loss, 3).tolist())

# 3. FastText boundary-marked trigram overlap
trigrams = lambda w: {f"<{w}>"[i:i + 3] for i in range(len(w))}
g_play, g_played, g_river = trigrams("play"), trigrams("played"), trigrams("river")
vocab = sorted(g_play | g_played | g_river)
vec = lambda gs: np.array([1.0 if g in gs else 0.0 for g in vocab])
cos = lambda a, b: float((a @ b) / (np.linalg.norm(a) * np.linalg.norm(b)))
print(f"FastText trigram cos(play, played)={cos(vec(g_play), vec(g_played)):.3f}, cos(play, river)={cos(vec(g_play), vec(g_river)):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
SGNS step: loss 0.892 -> 0.827, u=[1.081, 0.008]
GloVe weighted losses: [0.382, 0.0, 1.45]
FastText trigram cos(play, played)=0.612, cos(play, river)=0.000
```
<!-- leetllm: output:end -->

## Breaking the polysemy ceiling: contextual representations

Even with subwords, every static method maps `bank` to a single compromise vector. Calling `nn.Embedding` on ID `0` (`bank`) returns `[0.8, 0.2]` in both `"bank by the river"` and `"loan at the bank"`. To split those senses, sequence layers above the embedding table must mix each token with its neighbors:

<figure>
  <img src="illustrations/_generated/context_window_dark.png" alt="A two-dimensional plot and coordinate table showing static vector bank at [0.8, 0.2] splitting into two distinct contextual states when averaged equally with river [0.2, 1.0] to yield [0.5, 0.6], or with loan [1.0, 0.1] to yield [0.9, 0.15]." />
  <figcaption>One static lookup `bank` (`[0.8, 0.2]`) splits into distinct contextual states `[0.5, 0.6]` near `river` (cosine 0.879) and `[0.9, 0.15]` near `loan` (cosine 0.355 to `river`).</figcaption>
</figure>

Three architectures defined the contextual era:

1. **ELMo (Bidirectional LSTM Layer Mix):**[^peters2018][^allenNlpElmoImplementation2026] Runs forward and backward 2-layer LSTMs over character-CNN word vectors and lets each downstream task learn softmax weights $s_j$ and scale $\gamma$ over the three layers ($\text{ELMo}_k = \gamma \sum_{j=0}^{2} s_j h_{k, j}$), balancing lower-layer syntax with upper-layer word sense.
2. **BERT (Bidirectional Transformer Encoder):**[^devlin2019] Uses unmasked self-attention trained with masked language modeling so position 0 (`bank`) directly attends to future context (`water` or `loans`).
3. **GPT (Causal Transformer Decoder):**[^radford2018] Applies a lower-triangular <span data-glossary="causal-mask">causal mask</span> so position 0 (`bank`) can never see future tokens (`water` vs. `loans`), leaving its representation identical across both sentences while the trailing token integrates the full prefix!

<figure>
  <img src="illustrations/_generated/elmo_layers_dark.png" alt="In &quot;She saw the bank by the river&quot;, the forward pass reads She, saw, the, bank while the backward pass reads river, the, by, bank. At bank, a task-specific softmax mix weights character-CNN state h0 and bidirectional LSTM states h1 and h2, then scales by gamma." />
  <figcaption>ELMo blends forward and backward LSTM layer states at `bank` using learned task-specific softmax weights $s_j$ and scalar $\gamma$.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/embedding_evolution_dark.png" alt="Side-by-side attention visibility comparison for bank near water. An encoder allows bidirectional flow so row bank [1, 1, 1] reads both near and water. A causal decoder restricts flow to the left so row bank [1, 0, 0] sees only itself while row water [1, 1, 1] sees the entire prefix." />
  <figcaption>Bidirectional encoders let `bank` read future context `water` immediately; causal decoders restrict position 0 to itself so only trailing tokens see the full sentence.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=torch -->
```python title="static-lookup-to-contextual-states.py"
import torch
import torch.nn as nn
import torch.nn.functional as F

weights = torch.tensor([[0.8, 0.2], [0.2, 1.0], [1.0, 0.1]])  # bank, river, loan
table = nn.Embedding.from_pretrained(weights, freeze=True)
bank, river, loan = table(torch.tensor(0)), table(torch.tensor(1)), table(torch.tensor(2))

# Static lookup returns the identical row, while context mixing splits the two senses.
river_state = 0.5 * bank + 0.5 * river
loan_state = 0.5 * bank + 0.5 * loan
cos = lambda a, b: float(F.cosine_similarity(a.unsqueeze(0), b.unsqueeze(0)))
print(f"Static cos(bank, river)={cos(bank, river):.3f} | Contextual: river={cos(river_state, river):.3f}, loan={cos(loan_state, river):.3f}")

# Visibility mask check on ["bank", "near", "water"]
enc_mask, causal_mask = torch.ones(3, 3, dtype=torch.bool), torch.tril(torch.ones(3, 3, dtype=torch.bool))
toks = ["bank", "near", "water"]
print("Encoder sees at pos 0:", [t for t, ok in zip(toks, enc_mask[0]) if ok])
print("Causal sees at pos 0: ", [t for t, ok in zip(toks, causal_mask[0]) if ok])
print("Causal sees at pos 2: ", [t for t, ok in zip(toks, causal_mask[2]) if ok])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Static cos(bank, river)=0.428 | Contextual: river=0.879, loan=0.355
Encoder sees at pos 0: ['bank', 'near', 'water']
Causal sees at pos 0:  ['bank']
Causal sees at pos 2:  ['bank', 'near', 'water']
```
<!-- leetllm: output:end -->

## Two geometric traps: anisotropy and unaligned spaces

Even contextual vectors come with two sharp pitfalls when you put them into a search system:

1. **Anisotropic cones:** Ethayarajh showed that contextual states in BERT, ELMo, and GPT-2 often cluster inside narrow cones sharing a large mean vector $\mu$.[^ethayarajh2019] Two opposing concepts `[10, 1]` and `[10, -1]` produce a deceptively high raw cosine of **0.980**, flipping to **-1.0** once you subtract their shared mean `[10, 0]` (and explaining why raw pretrained BERT states need contrastive fine-tuning like Sentence-BERT[^reimers2019] for search!).
2. **Same dimension $\neq$ same coordinate space:** Vector databases only check array length $d$. Even a clean $90^\circ$ orthogonal rotation preserves every internal distance inside Model B while scrambling cross-model retrieval if a query from Model A searches an index built with Model B! (Asymmetric retrievers like DPR[^karpukhin2020] or instructed `encode_query` / `encode_document` encoders[^sentenceTransformersSemanticSearch2026] are trained *jointly* into one aligned space.) Always pin checkpoint revision, preprocessing, and metric together, and re-index whenever you switch encoders.

<figure>
  <img src="illustrations/_generated/anisotropy_geometry_dark.png" alt="Vector plots comparing river [10, 1] and loan [10, -1]. Before centering, the large shared horizontal component [10, 0] yields raw cosine 0.98. Subtracting the shared mean leaves opposite vertical residuals [0, 1] and [0, -1] with cosine -1.0." />
  <figcaption>A shared mean direction $\mu = [10, 0]$ inflates cosine between opposing states from $-1.0$ to $0.980$.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy -->
```python title="anisotropy-and-space-alignment.py"
import numpy as np

cos = lambda a, b: float((a @ b) / (np.linalg.norm(a) * np.linalg.norm(b)))

# 1. Anisotropy: shared mean [10, 0] inflates cosine to 0.98
states = np.array([[10.0, 1.0], [10.0, -1.0]])
centered = states - states.mean(axis=0)
print(f"Anisotropy -> raw cosine: {cos(states[0], states[1]):.3f}, centered: {cos(centered[0], centered[1]):.3f}")

# 2. Orthogonal 90-degree rotation scrambles cross-space search
rot90 = np.array([[0.0, -1.0], [1.0, 0.0]])
q_a = np.array([1.0, 0.0])
docs_a = {"river": np.array([1.0, 0.0]), "loan": np.array([0.0, -1.0])}
docs_b = {k: rot90 @ v for k, v in docs_a.items()}
top = lambda q, idx: max(idx, key=lambda k: cos(q, idx[k]))
print(f"Search winner -> A on A: {top(q_a, docs_a)} | A on B: {top(q_a, docs_b)} | B on B: {top(rot90 @ q_a, docs_b)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Anisotropy -> raw cosine: 0.980, centered: -1.000
Search winner -> A on A: river | A on B: loan | B on B: river
```
<!-- leetllm: output:end -->

| Task | Best representation | What to measure |
|---|---|---|
| Fast fixed-vocabulary classifier | Static lookup $E \in \mathbb{R}^{V \times d}$ | Validation accuracy and lookup latency |
| Rare spellings / morphological variants | Subword / character n-grams (FastText, BPE) | Recall on unseen inflections |
| Word-sense disambiguation | Contextual hidden states (bidirectional or causal) | Sense-disambiguation accuracy |
| Passage retrieval | Contrastively trained sentence encoders | Held-out <span data-glossary="precision-recall">precision and recall</span> |

```checkpoint
Does switching from whole-word tokenization to BPE turn a static embedding table into a contextual representation?
---
No. BPE splits rare words into reusable subword IDs, but each ID still indexes one fixed static row until upper sequence layers mix neighboring tokens.
```

```mastery-quiz
[
  {
    "question": "A co-occurrence table has rows [6, 2] and [4, 8]. Using natural logarithms for the top-left cell, what independence expected count and PPMI score follow?",
    "options": [
      "Expected 6, PPMI 0.000",
      "Expected 4, PPMI 0.405",
      "Expected 5, PPMI 0.182",
      "Expected 4, PPMI 1.500"
    ],
    "answer": "Expected 4, PPMI 0.405",
    "explanation": "Row 0 totals 8 out of 20 observations, and column 0 totals 10 out of 20. Under independence, the expected count is 8 * (10 / 20) = 4. The observed count is 6, giving ln(6 / 4) = ln(1.5) ≈ 0.405."
  },
  {
    "question": "In one Skip-gram negative-sampling step, center u = [0, 0], positive output v+ = [2, 0], negative sample v- = [0, 2], and learning rate is 0.1 while holding output vectors fixed. What center gradient and updated u follow?",
    "options": [
      "Gradient [1, -1]; updated [-0.1, 0.1]",
      "Gradient [-1, -1]; updated [0.1, 0.1]",
      "Gradient [-1, 1]; updated [0.1, -0.1]",
      "Gradient [0, 0]; updated [0, 0]"
    ],
    "answer": "Gradient [-1, 1]; updated [0.1, -0.1]",
    "explanation": "Both initial dot products are zero, so sigmoid(0) = 0.5. Positive gradient is (0.5 - 1) * [2, 0] = [-1, 0], and negative gradient is 0.5 * [0, 2] = [0, 1]. Summing gives [-1, 1]; subtracting 0.1 times that yields [0.1, -0.1]."
  },
  {
    "question": "A GloVe cell has observed count X_ij = 2, while the model prediction w_i . w_j + b_i + b_j equals ln(8). What is the unweighted squared residual (round to three decimal places)?",
    "options": [
      "36.000",
      "1.386",
      "4.324",
      "1.922"
    ],
    "answer": "1.922",
    "explanation": "The target is ln(2). Subtracting from ln(8) gives ln(4) ≈ 1.386, whose square is 1.922."
  },
  {
    "question": "For an out-of-vocabulary word, FastText getWordVector averages subword bucket rows [7, 7, 9], retaining multiplicity. Bucket 7 holds [2, 0] and bucket 9 holds [0, 3]. What vector is returned?",
    "options": [
      "[1.33, 1.00]",
      "[1.00, 1.50]",
      "[4.00, 3.00]",
      "[0.00, 0.00]"
    ],
    "answer": "[1.33, 1.00]",
    "explanation": "Bucket 7 enters twice ([2, 0] + [2, 0]) and bucket 9 enters once ([0, 3]), summing to [4, 3]. Dividing by three gives [4/3, 1.00], or [1.33, 1.00]."
  },
  {
    "question": "Two sentences share static lookup u = [0.4, 0.6], and a context layer averages u equally with clue A = [1, 0] in sentence 1 and clue B = [0, 1] in sentence 2. What resulting occurrence states follow?",
    "options": [
      "A = [1.0, 0.0], B = [0.0, 1.0]",
      "A = [0.4, 0.6], B = [0.4, 0.6]",
      "A = [0.7, 0.3], B = [0.2, 0.8]",
      "A = [1.4, 0.6], B = [0.4, 1.6]"
    ],
    "answer": "A = [0.7, 0.3], B = [0.2, 0.8]",
    "explanation": "Half of u is [0.2, 0.3]. Adding 0.5 * [1, 0] yields [0.7, 0.3], and adding 0.5 * [0, 1] yields [0.2, 0.8]."
  },
  {
    "question": "An ELMo task mix uses layer weights [0.25, 0.25, 0.50] and scale gamma = 2. Token A has layer states [2, 0], [0, 2], [2, 2]; token B has [0, 0], [2, 0], [0, 2]. Which outputs does ELMo produce?",
    "options": [
      "A = [1.5, 1.5], B = [0.5, 1.0]",
      "A = [3.0, 3.0], B = [1.0, 2.0]",
      "A = [3.0, 3.0], B = [3.0, 3.0]",
      "A = [4.0, 4.0], B = [2.0, 2.0]"
    ],
    "answer": "A = [3.0, 3.0], B = [1.0, 2.0]",
    "explanation": "For A, 0.25[2, 0] + 0.25[0, 2] + 0.50[2, 2] = [1.5, 1.5], times gamma=2 gives [3.0, 3.0]. For B, [0.5, 1.0] times 2 gives [1.0, 2.0]."
  },
  {
    "question": "Holding model weights and prefix positions fixed, replace token 2 in \"bank near water\" with \"loans\". Which hidden-state dependencies are permitted at token 0 (causal vs encoder) and token 2 (causal)?",
    "options": [
      "Token 0 causal: may change; token 0 encoder: fixed; token 2 causal: may change.",
      "Token 0 causal: fixed; token 0 encoder: fixed; token 2 causal: fixed.",
      "Token 0 causal: may change; token 0 encoder: may change; token 2 causal: fixed.",
      "Token 0 causal: fixed; token 0 encoder: may change; token 2 causal: may change."
    ],
    "answer": "Token 0 causal: fixed; token 0 encoder: may change; token 2 causal: may change.",
    "explanation": "A causal mask blocks future position 2 from reaching position 0, keeping token 0 fixed. An unmasked encoder attends across all positions so token 0 can shift, while token 2 receives full prefix updates in both."
  },
  {
    "question": "Mean-pooling is applied to token states [1, 1], [3, 1], [2, 4], [99, 99] with attention mask [1, 1, 1, 0] excluding padding. What pooled sentence vector follows?",
    "options": [
      "[2, 2]",
      "[26.25, 26.25]",
      "[1.5, 1.5]",
      "[6, 6]"
    ],
    "answer": "[2, 2]",
    "explanation": "Summing only the three unmasked rows gives [6, 6]. Dividing by 3 active positions yields [2, 2]."
  },
  {
    "question": "Subtract the sample mean of vectors [10, 1], [10, 2], [10, 3] from all three vectors. What is the cosine similarity between the first centered vector and the second centered vector?",
    "options": [
      "-1, treating the first two vectors as opposite endpoints.",
      "Undefined, because the second centered vector equals [0, 0].",
      "0, treating the zero vector as orthogonal to every axis.",
      "1, preserving the direction shared prior to centering."
    ],
    "answer": "Undefined, because the second centered vector equals [0, 0].",
    "explanation": "The sample mean is [10, 2], leaving residuals [0, -1], [0, 0], and [0, 1]. The zero vector makes the cosine denominator ||u|| ||v|| zero, so cosine similarity is undefined."
  },
  {
    "question": "Using raw dot products, query A is [1, 1] and documents K, L, R in space A are [1, 1], [1, -1], [-1, 1]. Rotating the document index by 90 degrees via (x, y) -> (-y, x) selects which winners for unrotated query A vs rotated query A?",
    "options": [
      "Unrotated query picks K; rotated query picks L.",
      "Unrotated query picks R; rotated query picks K.",
      "Unrotated query picks L; rotated query picks K.",
      "Unrotated query picks L; rotated query picks R."
    ],
    "answer": "Unrotated query picks L; rotated query picks K.",
    "explanation": "After rotation, K = [-1, 1], L = [1, 1], and R = [-1, -1]. Unrotated [1, 1] scores [0, 2, -2] and wrongly picks L; rotated [-1, 1] scores [2, 0, 0] and restores K."
  }
]
```

> **Next:** Continue to [Sentence Embeddings & Contrastive Loss](/learn/sentence-embeddings-contrastive-learning).
