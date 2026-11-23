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

The [previous lesson](/learn/tokenization-bpe-wordpiece-sentencepiece) mapped raw text into integer token IDs. Next, the model converts each integer into a dense coordinate vector by indexing a single row of its embedding matrix. When the same word carries two distinct meanings in different sentences, both occurrences still look up that identical starting row:

```text title="same-id-two-sentences.txt"
"She saw the bank by the river." -> [..., 407, ...]
"He paid the loan at the bank."  -> [..., 407, ...]
```

Here token ID `407` represents `bank`, while the surrounding words `river` and `loan` signal completely different senses. Formally, an **<span data-glossary="embedding">embedding</span>** stores a learned <span data-glossary="vector">vector</span> for every vocabulary item, whereas a **<span data-glossary="contextual-representation">contextual representation</span>** transforms that vector inside later network layers using neighboring tokens. Tracing how static lookup tables evolve into contextual representations reveals both what a single vector row can capture from distributional statistics and why polysemy demands sequence-level mixing.

## A token ID selects one stored row

Let vocabulary size be $V$ and embedding dimension be $d$. An embedding layer stores a trainable parameter <span data-glossary="matrix">matrix</span> $E \in \mathbb{R}^{V \times d}$, where row $E[\text{token\_id}]$ enters the network for every occurrence of that ID. Equivalently, multiplying a one-hot row vector $e_i \in \{0, 1\}^V$ by $E$ selects row $i$ without touching the remaining rows. During gradient-based training, optimizer updates steer rows that play similar predictive roles toward compatible directions, although training loss alone never guarantees well-calibrated cosine neighborhoods.

In a compact three-word vocabulary, `bank`, `river`, and `loan` each occupy one row of a PyTorch `nn.Embedding(3, 2)` layer. Even though `river` and `loan` point in nearly orthogonal directions, calling the layer on token ID `0` for `bank` yields the exact same tensor in both sentences because lookup indexing has zero visibility into neighboring tokens. Static vectors therefore freeze one shared representation per vocabulary entry regardless of where the token appears in a passage.

<!-- leetllm: test, output=show, deps=torch -->
```python title="01-look-up-token-rows.py"
import torch
import torch.nn as nn

vocab = {"bank": 0, "river": 1, "loan": 2}
weights = torch.tensor([
    [0.80, 0.20],  # bank
    [0.20, 1.00],  # river
    [1.00, 0.10],  # loan
])
table = nn.Embedding.from_pretrained(weights, freeze=True)

river_occurrence = table(torch.tensor(vocab["bank"]))
loan_occurrence = table(torch.tensor(vocab["bank"]))

print("river sentence starts:", river_occurrence.tolist())
print("loan sentence starts:", loan_occurrence.tolist())
print("same starting row:", torch.equal(river_occurrence, loan_occurrence))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
river sentence starts: [0.800000011920929, 0.20000000298023224]
loan sentence starts: [0.800000011920929, 0.20000000298023224]
same starting row: True
```
<!-- leetllm: output:end -->

Because `table(0)` returns `[0.8, 0.2]` on every call, no static lookup operation can separate the geographic sense of `bank` from its financial sense. Adding a positional embedding shifts coordinates according to sequence index, yet two distinct sentences can easily place `bank` at the exact same token offset. Resolving sense ambiguity therefore depends on modeling the neighboring words that accompany each <span data-glossary="token">token</span>.

## Nearby words leave a distributional fingerprint

Tokens that appear in similar local neighborhoods tend to serve related syntactic and semantic functions, an empirical principle known as the distributional hypothesis. Consider four short sentences where `apple` and `pear` share `the`, `tastes`, and `sweet`, while `river` and `lake` share `the`, `holds`, and `water`. Recording how often each context token appears inside a fixed <span data-glossary="context-window">context window</span> produces a sparse distributional fingerprint for every center word, grouping tokens with parallel usage patterns together.

<!-- leetllm: test, output=show -->
```python title="02-count-context-neighbors.py"
from collections import Counter, defaultdict

corpus = [
    "the apple tastes sweet".split(),
    "the pear tastes sweet".split(),
    "the river holds water".split(),
    "the lake holds water".split(),
]

window = 2
neighbors = defaultdict(Counter)

for tokens in corpus:
    for center_index, center in enumerate(tokens):
        left = max(0, center_index - window)
        right = min(len(tokens), center_index + window + 1)
        for context_index in range(left, right):
            if context_index != center_index:
                neighbors[center][tokens[context_index]] += 1

print("apple context:", neighbors["apple"].most_common(4))
print("pear context:", neighbors["pear"].most_common(4))
print("river context:", neighbors["river"].most_common(4))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
apple context: [('the', 1), ('tastes', 1), ('sweet', 1)]
pear context: [('the', 1), ('tastes', 1), ('sweet', 1)]
river context: [('the', 1), ('holds', 1), ('water', 1)]
```
<!-- leetllm: output:end -->

Each count row has length equal to the entire context vocabulary, making raw co-occurrence matrices high-dimensional, sparse, and sensitive to sampling noise. Latent semantic analysis demonstrated how to compress term-document matrices into compact dense vectors using singular value decomposition (<span data-glossary="svd">SVD</span>).[^deerwester1990] Applying the same factorization to word-context matrices extracts the dominant linear directions that explain coherent neighborhoods while discarding minor variance components.

Raw frequencies also overweight ubiquitous function words such as `the`, which appear next to almost every noun without helping to distinguish topic or sense. **Positive pointwise mutual information (PPMI)** measures how much more often $(w, c)$ occurs together than independent row and column marginals predict, clamping negative log-ratios at zero:

$$
\text{PMI}(w, c) = \log \frac{\#(w, c) \cdot N}{\#(w)\, \#(c)}, \qquad \text{PPMI}(w, c) = \max(\text{PMI}(w, c), 0)
$$

Here `#(w, c)` is the pair count, `#(w)` is the row sum, `#(c)` is the column sum, and `N` is the grand total across the matrix. For example, in a `53`-pair count table where row `apple` sums to `14`, column `fruit` sums to `15`, and `(apple, fruit)` occurs `8` times, independence predicts $14 \times 15 / 53 \approx 3.96$ pairs, so $\ln(8 / 3.96) \approx 0.703$ isolates a strong positive association. After SVD yields low-dimensional word coordinates, **<span data-glossary="cosine-similarity">cosine similarity</span>** measures angular alignment independently of vector length:

$$
\cos(u, v) = \frac{u \cdot v}{\|u\|\, \|v\|}
$$

Parallel vectors score $1$, orthogonal vectors score $0$, and opposite vectors score $-1$, while a zero vector leaves the quotient undefined. Factoring a four-by-four PPMI matrix with `np.linalg.svd` as $U \Sigma V^T$ splits singular value strength symmetrically between word and context factors via $U_k \sqrt{\Sigma_k}$. Keeping $k = 2$ components preserves two orthogonal clusters while dropping minor singular values (`0.158` and `0.067`), and individual axes remain identifiable only up to simultaneous sign flips. In the compressed space, `apple` and `pear` collapse onto one axis (cosine `1.0`), while `river` and `lake` align along the perpendicular axis (cosine `0.0` against fruit), though real corpora introduce rare pairs whose inflated PMI scores require smoothing or frequency thresholds.

<!-- leetllm: test, output=show, deps=numpy -->
```python title="03-compress-ppmi-with-svd.py"
import numpy as np

words = ["apple", "pear", "river", "lake"]
counts = np.array([
    [8, 6, 0, 0],  # apple with fruit and sweet
    [7, 6, 0, 0],  # pear with fruit and sweet
    [0, 0, 8, 5],  # river with water and shore
    [0, 0, 7, 6],  # lake with water and shore
], dtype=float)


def cosine(a, b):
    return float((a @ b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def ppmi_matrix(table):
    total = table.sum()
    expected = (table.sum(axis=1, keepdims=True) @ table.sum(axis=0, keepdims=True)) / total
    observed = table > 0
    result = np.zeros_like(table, dtype=float)
    ratio = np.where(observed, table / expected, 1.0)
    result[observed] = np.maximum(np.log(ratio[observed]), 0.0)
    return result


ppmi = ppmi_matrix(counts)
left, singular, _ = np.linalg.svd(ppmi, full_matrices=False)
vectors = left[:, :2] * np.sqrt(singular[:2])

print("apple-fruit PPMI:", round(float(ppmi[0, 0]), 3))
print("singular values:", [round(float(val), 3) for val in singular])
print("apple vs pear:", round(cosine(vectors[0], vectors[1]), 3))
print("apple vs river:", round(cosine(vectors[0], vectors[2]), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
apple-fruit PPMI: 0.703
singular values: [1.418, 1.348, 0.158, 0.067]
apple vs pear: 1.0
apple vs river: 0.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/count_matrix_svd_dark.png" alt="A two-panel summary of PPMI weighting and rank-2 SVD. Left panel shows the four-by-four PPMI table where apple and pear align on fruit and sweet while river and lake align on water and shore. Right panel plots the two resulting orthogonal SVD directions (singular values 1.42 and 1.35 kept, 0.16 and 0.07 dropped)." />
  <figcaption>A clean block-structured PPMI table yields two dominant singular values (<code>1.418</code> and <code>1.348</code>), projecting <code>apple</code>/<code>pear</code> and <code>river</code>/<code>lake</code> onto perpendicular axes.</figcaption>
</figure>

```checkpoint
Suppose `hot` and `cold` occurred equally often near `room` and `day`, giving them cosine similarity 1.0 in a count-SVD space. Would that prove they are synonyms?
---
No. Distributional vectors measure similarity of surrounding contexts, which antonyms often share. Checking synonymy, entailment, or factual interchangeability requires task-specific evaluation rather than relying on distributional cosine alone.
```

## Predict neighboring words with Word2Vec

Rather than materializing and factoring a corpus-wide matrix upfront, **Word2Vec** learns dense word vectors incrementally through local next-neighbor prediction tasks.[^mikolov2013] In **CBOW** (continuous bag-of-words), the model averages embeddings of surrounding context tokens inside a sliding window to predict the masked center word, whereas **Skip-gram** starts from the center word and predicts each context neighbor independently. Over millions of sliding windows, words that appear in interchangeable contexts accumulate parallel gradient updates and drift into nearby regions of vector space.

<figure>
  <img src="illustrations/_generated/word2vec_objectives_dark.png" alt="A radius-2 window around center token read in children read stories each night. Children, stories, and each sit inside the window while night is three steps away. CBOW combines the three neighbors to predict read; Skip-gram forms three training pairs starting at read." />
  <figcaption>With radius <code>2</code> around center token <code>read</code>, the training window covers <code>children</code>, <code>stories</code>, and <code>each</code> while leaving <code>night</code> outside at offset <code>+3</code>.</figcaption>
</figure>

Scanning a window of radius `2` across `"children read stories each night"` turns center `read` into three observed center-neighbor pairs while excluding `night` at offset `+3`. Generating pairs incrementally lets training stream directly over multi-gigabyte text corpora in constant memory instead of allocating a dense $V \times V$ matrix. Notice also that Skip-gram emits one supervision signal per visible neighbor, giving rare center words more gradient updates per sentence than CBOW.

<!-- leetllm: test, output=show -->
```python title="04-create-skipgram-pairs.py"
tokens = "children read stories each night".split()
window = 2
pairs = [
    (center, tokens[ctx])
    for idx, center in enumerate(tokens)
    for ctx in range(max(0, idx - window), min(len(tokens), idx + window + 1))
    if ctx != idx
]

print([pair for pair in pairs if pair[0] == "read"])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[('read', 'children'), ('read', 'stories'), ('read', 'each')]
```
<!-- leetllm: output:end -->

Evaluating a full softmax partition function across a vocabulary of tens or hundreds of thousands of words at every training window would be computationally prohibitive. **Negative sampling** replaces that normalized multi-class objective with binary logistic regression: distinguish the true observed neighbor $v_+$ from $k$ random noise draws $v_n$ sampled from a smoothed unigram distribution raised to the $3/4$ power.[^mikolov2013NegativeSampling] Using center input vector $u$ and separate output rows $v_+$ and $\{v_n\}_{n \in \mathcal{N}}$, each step minimizes:

$$
\mathcal{L}_{\text{SGNS}} = -\log \sigma(u \cdot v_+) - \sum_{n \in \mathcal{N}} \log \sigma(-u \cdot v_n)
$$

Increasing the observed <span data-glossary="dot-product">dot product</span> $u \cdot v_+$ lowers the positive log-loss term, while driving negative-sample scores below zero shrinks the noise sum. Taking the gradient with respect to $u$ pulls $u$ toward $+v_+$ scaled by $(\sigma(u \cdot v_+) - 1)$ and pushes $u$ away from each negative vector scaled by $\sigma(u \cdot v_n)$. Although Skip-gram never materializes a global matrix, Levy and Goldberg proved that its unconstrained optimum implicitly factorizes a shifted PMI matrix $\text{PMI}(w, c) - \log k$ when negatives follow context frequencies, linking predictive and count-based training directly.[^levy2014]

<!-- leetllm: test, output=show, deps=numpy -->
```python title="05-update-negative-sampling-loss.py"
import numpy as np

center = np.array([1.0, 0.0])
pos_out = np.array([1.2, 0.1])
neg_outs = np.array([[-0.9, -0.2], [-1.1, 0.0]])


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))


def sgns_loss(u, vp, vns):
    pos_term = np.logaddexp(0.0, -(u @ vp))
    neg_terms = np.logaddexp(0.0, vns @ u).sum()
    return float(pos_term + neg_terms)


before = sgns_loss(center, pos_out, neg_outs)
pos_grad = (sigmoid(center @ pos_out) - 1.0) * pos_out
neg_grad = (sigmoid(neg_outs @ center)[:, None] * neg_outs).sum(axis=0)
updated = center - 0.1 * (pos_grad + neg_grad)
after = sgns_loss(updated, pos_out, neg_outs)

print("center after one step:", np.round(updated, 3).tolist())
print("positive score:", round(float(center @ pos_out), 3), "->", round(float(updated @ pos_out), 3))
print("loss:", round(before, 3), "->", round(after, 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
center after one step: [1.081, 0.008]
positive score: 1.2 -> 1.298
loss: 0.892 -> 0.827
```
<!-- leetllm: output:end -->

## Fit the global log-count table with GloVe

**GloVe** (Global Vectors) bridges matrix factorization and local window prediction by aggregating corpus-wide weighted co-occurrence counts once, applying $1/r$ distance decay within each context window, and optimizing only over nonzero entries via weighted least squares.[^pennington2014] Each word vector $w_i$ and context vector $\tilde{w}_j$, paired with scalar biases $b_i$ and $\tilde{b}_j$, learns to approximate the natural logarithm of the observed count:

$$
w_i \cdot \tilde{w}_j + b_i + \tilde{b}_j \approx \log X_{ij}
$$

Because raw co-occurrence counts span several orders of magnitude, weighting each squared log-residual by a clipped power ramp $f(x) = \min((x / x_{\max})^\alpha, 1)$ (typically $x_{\max} = 100$ and $\alpha = 3/4$) keeps noisy rare pairs small while preventing ultra-frequent stop words from dominating the fit. Zero entries are filtered out prior to evaluation so `log(0)` never enters training, and evaluating our example counts `[3, 30, 100]` shows how zero residual at `30` sits alongside asymmetric weighted errors on both sides. Despite their strengths, Word2Vec and GloVe still share two structural limits: out-of-vocabulary spellings have no row at all, and polysemous words merge distinct meanings into one static vector.

<!-- leetllm: test, output=show, deps=numpy -->
```python title="06-fit-glove-log-count.py"
import numpy as np

counts = np.array([3.0, 30.0, 100.0])
model_score = np.log(30.0)

residuals = (model_score - np.log(counts)) ** 2
weights = np.minimum((counts / 100.0) ** 0.75, 1.0)
weighted_loss = weights * residuals

print("log targets:", np.round(np.log(counts), 3).tolist())
print("raw residuals:", np.round(residuals, 3).tolist())
print("weights:", np.round(weights, 3).tolist())
print("weighted loss:", np.round(weighted_loss, 3).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
log targets: [1.099, 3.401, 4.605]
raw residuals: [5.302, 0.0, 1.45]
weights: [0.072, 0.405, 1.0]
weighted loss: [0.382, 0.0, 1.45]
```
<!-- leetllm: output:end -->

## Compose unknown spellings from subword pieces

Inflected and compound words such as `play`, `played`, and `playing` share productive morphological stems that whole-word vocabularies split into unrelated IDs. **FastText** enriches static Skip-gram representations by training vectors not only for each full word, but also for boundary-marked character n-grams (typically lengths `3` through `6`) mapped into fixed hash buckets.[^bojanowski2017] During scoring, a word is represented by summing its constituent n-gram rows plus its whole-word vector when present, whereas FastText's query API `getWordVector` returns their element-wise average.[^fastTextWordVector2026]

<figure>
  <img src="illustrations/_generated/fasttext_subwords_dark.png" alt="FastText character trigrams and vector composition for play and unseen played. Both spellings share &lt;pl, pla, and lay. Play also uses ay&gt; and its whole-word row; unseen played sums the three shared stem vectors with aye, yed, and ed&gt; so its direction aligns closely with play rather than orthogonal terms like river." />
  <figcaption>Sharing the stem trigrams <code>&lt;pl</code>, <code>pla</code>, and <code>lay</code> places unseen <code>played</code> along the same region as known <code>play</code>, whereas orthogonal terms like <code>river</code> stay separated.</figcaption>
</figure>

Even when `played` never appeared during training, its boundary-marked trigrams overlap cleanly with `play` on `<pl`, `pla`, and `lay`. Measuring cosine similarity across bag-of-trigram vectors shows how shared character pieces place unseen morphological variants close to known stems rather than perpendicular vocabulary items like `river`. Deploying out-of-vocabulary composition requires loading the full `.bin` model containing the subword hash table rather than a `.vec` export of known words, and while subword averages help with spelling variation and typos, they still assign one static direction to an ambiguous known spelling like `bank`.[^fastTextUnsupervisedTutorial2026]

<!-- leetllm: test, output=show, deps=numpy -->
```python title="07-share-character-ngrams.py"
import numpy as np


def trigrams(word, n=3):
    marked = f"<{word}>"
    return {marked[i:i + n] for i in range(len(marked) - n + 1)}


grams_play = trigrams("play")
grams_played = trigrams("played")
grams_river = trigrams("river")
vocab = sorted(grams_play | grams_played | grams_river)


def indicator(grams):
    return np.array([1.0 if g in grams else 0.0 for g in vocab])


v_play, v_played, v_river = indicator(grams_play), indicator(grams_played), indicator(grams_river)
cos_played = float((v_play @ v_played) / (np.linalg.norm(v_play) * np.linalg.norm(v_played)))
cos_river = float((v_play @ v_river) / (np.linalg.norm(v_play) * np.linalg.norm(v_river)))

print("shared play/played trigrams:", sorted(grams_play & grams_played))
print("trigram cosine (play, played):", round(cos_played, 3))
print("trigram cosine (play, river):", round(cos_river, 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
shared play/played trigrams: ['<pl', 'lay', 'pla']
trigram cosine (play, played): 0.612
trigram cosine (play, river): 0.0
```
<!-- leetllm: output:end -->

## Static lookup collides on polysemous words

Consider the ambiguous word `bank` appearing in two contrasting phrases where surrounding nouns identify completely separate concepts:

```text title="bank-senses.txt"
"She saw the bank by the river."
"He paid the loan at the bank."
```

Even when `river` and `loan` occupy nearly perpendicular axes, looking up `bank` from any static table produces identical cosine similarity against `river` in both sentences. Static training packs a frequency-weighted compromise across all senses of `bank` into a single row. Downstream retrievers and classifiers therefore cannot separate the geographic meaning from the financial meaning without computing an occurrence-specific vector conditioned on the surrounding sentence.

<!-- leetllm: test, output=show, deps=numpy -->
```python title="08-expose-static-sense-collision.py"
import numpy as np

static = {
    "bank": np.array([0.8, 0.2]),
    "river": np.array([0.2, 1.0]),
    "loan": np.array([1.0, 0.1]),
}


def cosine(a, b):
    return float((a @ b) / (np.linalg.norm(a) * np.linalg.norm(b)))


river_occ = static["bank"]
loan_occ = static["bank"]

print("identical static vector:", np.array_equal(river_occ, loan_occ))
print("river phrase cos(bank, river):", round(cosine(river_occ, static["river"]), 3))
print("loan phrase cos(bank, river):", round(cosine(loan_occ, static["river"]), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
identical static vector: True
river phrase cos(bank, river): 0.428
loan phrase cos(bank, river): 0.428
```
<!-- leetllm: output:end -->

## Mix surrounding context into each occurrence

Since the input lookup table remains fixed at inference time, context dependence must enter in sequence layers above the table. The minimal prototype averages the shared target vector equally with an active sentence clue: `0.5 * static["bank"] + 0.5 * clue`. Blending `bank` with `river` moves the state to `[0.50, 0.60]` and raises cosine similarity against `river` from `0.428` to `0.879`, whereas blending with `loan` shifts it to `[0.90, 0.15]` and lowers similarity against `river` to `0.355`. Real neural architectures replace fixed `0.5` weights with learned linear projections, attention routing, residual connections, and multilayer feed-forward networks, yet this two-dimensional move illustrates the exact transition from token-level storage to sentence-conditioned state.

<!-- leetllm: test, output=show, deps=numpy -->
```python title="09-mix-context-into-bank.py"
import numpy as np

table = {
    "bank": np.array([0.8, 0.2]),
    "river": np.array([0.2, 1.0]),
    "loan": np.array([1.0, 0.1]),
}


def cosine(a, b):
    return float((a @ b) / (np.linalg.norm(a) * np.linalg.norm(b)))


river_state = 0.5 * table["bank"] + 0.5 * table["river"]
loan_state = 0.5 * table["bank"] + 0.5 * table["loan"]

print("river-context state:", np.round(river_state, 2).tolist())
print("loan-context state:", np.round(loan_state, 2).tolist())
print("cos(river_state, river):", round(cosine(river_state, table["river"]), 3))
print("cos(loan_state, river):", round(cosine(loan_state, table["river"]), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
river-context state: [0.5, 0.6]
loan-context state: [0.9, 0.15]
cos(river_state, river): 0.879
cos(loan_state, river): 0.355
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/context_window_dark.png" alt="A two-dimensional plot and coordinate table showing static vector bank at [0.8, 0.2] splitting into two distinct contextual states when averaged equally with river [0.2, 1.0] to yield [0.5, 0.6], or with loan [1.0, 0.1] to yield [0.9, 0.15]." />
  <figcaption>Starting from the single table entry <code>A (bank)</code>, blending equal weight with neighboring words <code>river</code> or <code>loan</code> shifts each occurrence into distinct regions <code>D</code> and <code>E</code>.</figcaption>
</figure>

**ELMo** (Embeddings from Language Models) introduced deep contextualized token vectors in 2018 by running two-layer forward and backward LSTM language models across the input sequence on top of character-CNN token representations.[^peters2018] At token position $k$, concatenating forward and backward LSTM outputs produces contextual hidden states $h_{k,1}$ and $h_{k,2}$, paired with the duplicated character-CNN vector $h_{k,0}$ so all three layer states match in dimension.[^allenNlpElmoImplementation2026] A supervised downstream model keeps the pretrained language model frozen and learns softmax-normalized task weights $s_j$ alongside scalar scale $\gamma$:

$$
\text{ELMo}_k = \gamma \sum_{j=0}^{2} s_j h_{k,j}, \qquad \sum_{j=0}^{2} s_j = 1
$$

Because lower LSTM layers tend to capture part-of-speech syntax while upper layers encode word sense, sharing learned layer weights across all positions lets each downstream model select the balance of syntactic and semantic features its task needs most.

<figure>
  <img src="illustrations/_generated/elmo_layers_dark.png" alt="In &quot;She saw the bank by the river&quot;, the forward pass reads She, saw, the, bank while the backward pass reads river, the, by, bank. At bank, a task-specific softmax mix weights character-CNN state h0 and bidirectional LSTM states h1 and h2, then scales by gamma." />
  <figcaption>ELMo combines left-to-right and right-to-left recurrent states at <code>bank</code> using learned softmax layer weights <code>s_j</code> and scalar multiplier <code>gamma</code>.</figcaption>
</figure>

## Visibility masks follow the training objective

**BERT** replaced sequential LSTMs with deep Transformer <span data-glossary="self-attention">self-attention</span> trained via masked language modeling, allowing every token position to exchange evidence with both left and right neighbors simultaneously.[^devlin2019] By contrast, generative autoregressive models such as **GPT** train via next-token <span data-glossary="pretraining">pretraining</span>, so their <span data-glossary="causal-mask">causal</span> visibility mask forbids position $t$ from reading any token at indices strictly greater than $t$.[^radford2018] Binary visibility masks govern which context pairs are permitted to communicate, whereas learned attention weights decide how strongly each permitted neighbor contributes to the updated state.

In `"bank near water"`, a bidirectional encoder exposes right-hand clue `water` directly to position `0` (`bank`), whereas a causal decoder blocks future columns so row `0` sees only `bank` and only trailing token `water` reads the entire prefix. Replacing `water` with `loans` therefore leaves a deterministic causal decoder's hidden state at position `0` invariant even though GPU kernels process all positions in parallel, which is why causal feature extractors should pool or inspect the end of a span rather than its opening word.

<!-- leetllm: test, output=show, deps=numpy -->
```python title="10-compare-visibility-masks.py"
import numpy as np

tokens = ["bank", "near", "water"]
alternative = ["bank", "near", "loans"]

encoder_mask = np.ones((3, 3), dtype=int)
causal_mask = np.tril(np.ones((3, 3), dtype=int))


def visible(seq, mask, pos):
    return [tok for tok, allowed in zip(seq, mask[pos]) if allowed]


print("encoder at bank:", visible(tokens, encoder_mask, 0))
print("causal at bank:", visible(tokens, causal_mask, 0))
print("causal at final token:", visible(tokens, causal_mask, 2))
print(
    "causal prefix at pos 0 invariant:",
    visible(tokens, causal_mask, 0) == visible(alternative, causal_mask, 0),
)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
encoder at bank: ['bank', 'near', 'water']
causal at bank: ['bank']
causal at final token: ['bank', 'near', 'water']
causal prefix at pos 0 invariant: True
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/embedding_evolution_dark.png" alt="Side-by-side attention visibility comparison for bank near water. An encoder allows bidirectional flow so row bank [1, 1, 1] reads both near and water. A causal decoder restricts flow to the left so row bank [1, 0, 0] sees only itself while row water [1, 1, 1] sees the entire prefix." />
  <figcaption>A bidirectional encoder allows <code>bank</code> to absorb future context <code>water</code> in row <code>0</code>; a causal mask blocks future columns so only the trailing token accesses all context.</figcaption>
</figure>

## A shared direction can inflate cosine similarity

Even when contextual hidden states separate word senses accurately inside a subspace, raw cosine scores can still make unrelated words look almost identical. Ethayarajh showed in 2019 that contextual token representations in BERT, ELMo, and GPT-2 often concentrate inside narrow **anisotropic** cones rather than spreading uniformly around the origin.[^ethayarajh2019] Whenever hidden vectors share a large non-zero mean direction $\mu$ or dominant top principal components, every dot product inherits a positive baseline along $\mu$ that compresses cosine scores upward and obscures task-relevant differences.

<figure>
  <img src="illustrations/_generated/anisotropy_geometry_dark.png" alt="Vector plots comparing river [10, 1] and loan [10, -1]. Before centering, the large shared horizontal component [10, 0] yields raw cosine 0.98. Subtracting the shared mean leaves opposite vertical residuals [0, 1] and [0, -1] with cosine -1.0." />
  <figcaption>Subtracting shared cone mean <code>μ = [10, 0]</code> converts spurious similarity (<code>0.980</code>) between <code>river</code> and <code>loan</code> into their opposing residual contrast (<code>-1.00</code>).</figcaption>
</figure>

When `river` sits at `[10.0, 1.0]` and `loan` sits at `[10.0, -1.0]`, their dot product equals `99` and each norm equals $\sqrt{101}$, yielding raw cosine `0.980` even though their differentiating component points in opposite directions. Subtracting their `[10.0, 0.0]` mean eliminates the dominant horizontal component and recovers cosine `-1.0`. However, remember that centering just two points around their own midpoint creates opposite vectors by definition; in real evaluation, estimate $\mu$ across a representative training split, apply that fixed offset to held-out vectors, and verify empirically whether centering improves retrieval or classification.

<!-- leetllm: test, output=show, deps=numpy -->
```python title="11-diagnose-shared-direction.py"
import numpy as np

states = np.array([
    [10.0, 1.0],   # river
    [10.0, -1.0],  # loan
])


def cosine(a, b):
    return float((a @ b) / (np.linalg.norm(a) * np.linalg.norm(b)))


mean_vec = states.mean(axis=0)
centered = states - mean_vec

print("raw cosine:", round(cosine(states[0], states[1]), 3))
print("centered cosine:", round(cosine(centered[0], centered[1]), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw cosine: 0.98
centered cosine: -1.0
```
<!-- leetllm: output:end -->

## Match the representation to the task

No single embedding architecture wins across every NLP problem, because static efficiency, subword robustness, token-level disambiguation, and passage-level pooling impose competing requirements. Match the representation choice directly to the target failure mode and measure end-to-end validation metrics on held-out queries:

| Problem requirement | Effective representation | Primary evaluation signal |
|---|---|---|
| Compact fixed vocabulary classifier | Trainable lookup matrix $E \in \mathbb{R}^{V \times d}$ | Validation accuracy and lookup latency |
| Rare spellings and inflected suffixes | Character or <span data-glossary="subword-tokenization">subword</span>-aware vectors | Recall on unseen morphological variants |
| Polysemous words resolved in sentence | Contextual hidden states (bidirectional or causal) | Accuracy on sense-disambiguation splits |
| Semantic search across full passages | Contrastively trained sentence encoders | Passage retrieval <span data-glossary="precision-recall">precision and recall</span> |

Simply averaging raw pretrained BERT token states or reading its `[CLS]` vector often underperforms even unigram baselines on semantic textual similarity unless fine-tuned with an explicit contrastive objective such as Sentence-BERT.[^reimers2019] Always benchmark pooling strategies and embedding checkpoints directly on held-out domain data rather than relying on intrinsic word-analogy scores.

## Keep query and document coordinates compatible

Vector databases validate only that incoming arrays match in dimension $d$; they cannot verify that queries and indexed passages belong to the same learned coordinate system. Even an orthogonal `90`-degree rotation preserves every internal distance and cosine similarity inside Space B while scrambling cross-space rankings if a query from Space A searches documents indexed in Space B. Compatible retrieval also need not mean identical encoders on both sides: bi-encoders such as Dense Passage Retrieval jointly optimize distinct query and passage encoders into one aligned dot-product geometry,[^karpukhin2020] while modern libraries expose asymmetric `encode_query` and `encode_document` helpers with model-prescribed prompt prefixes.[^sentenceTransformersSemanticSearch2026] Pin model checkpoint revision, preprocessing, and distance metric together, and rebuild the full document index whenever migrating embedding spaces.

<!-- leetllm: test, output=show, deps=numpy -->
```python title="12-keep-embedding-spaces-compatible.py"
import numpy as np

rot90 = np.array([[0.0, -1.0], [1.0, 0.0]])
query_a = np.array([1.0, 0.0])  # query for "river"
docs_a = {"river": np.array([1.0, 0.0]), "loan": np.array([0.0, -1.0])}
docs_b = {name: rot90 @ vec for name, vec in docs_a.items()}
query_b = rot90 @ query_a


def top_doc(q, index):
    return max(index, key=lambda k: float((q @ index[k]) / (np.linalg.norm(q) * np.linalg.norm(index[k]))))


print("A query on A index:", top_doc(query_a, docs_a))
print("A query on B index:", top_doc(query_a, docs_b))
print("B query on B index:", top_doc(query_b, docs_b))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
A query on A index: river
A query on B index: loan
B query on B index: river
```
<!-- leetllm: output:end -->

Once contextual layers compute a rich sequence of vectors, the final token state projects through the language-model output head to assign probabilities over the next token. The [next lesson](/learn/perplexity-language-model-evaluation) introduces perplexity to evaluate how sharply those probabilities fit held-out text.

### Evaluation rubric

- Explain why two occurrences of one token ID read the same static row yet diverge after contextual layers mix neighboring states.
- Contrast PPMI-SVD factorization, Skip-gram negative sampling, GloVe weighted log-count regression, and FastText subword composition.
- Diagnose anisotropic cone collapse and cross-encoder coordinate mismatches using held-out validation splits.

### Follow-up questions

```checkpoint
Does switching from a word-level tokenizer to BPE subword tokens turn a static embedding table into a contextual model?
---
No. Subwords shrink the vocabulary and represent rare spellings as shorter sequences of IDs, yet every subword ID still reads one fixed vector from the lookup table until upper neural layers combine neighboring tokens.
```

```checkpoint
Why do strong word-analogy scores fail to guarantee high accuracy on downstream semantic retrieval?
---
Analogy benchmarks test narrow linear offsets on common vocabulary pairs. Real retrieval faces polysemous terms, long multi-sentence queries, domain jargon, and anisotropic score compression, all of which must be measured directly on held-out retrieval queries.
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
    "explanation": "Row 0 totals 8 out of 20 observations, and column 0 totals 10 out of 20. Under independence, the expected count is 8 * (10 / 20) = 4. The observed count is 6, giving ln(6 / 4) = ln(1.5) ≈ 0.405, which remains unchanged after clamping at zero. Using 5 ignores the row total, while 1.500 is the ratio prior to taking its logarithm."
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
    "explanation": "Both initial dot products are zero, so sigmoid(0) = 0.5 for each term. The positive gradient contribution is (0.5 - 1) * [2, 0] = [-1, 0], and the negative contribution is 0.5 * [0, 2] = [0, 1]. Summing gives gradient [-1, 1]; subtracting 0.1 times the gradient produces [0.1, -0.1]."
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
    "explanation": "The target is ln(2). Subtracting from the model score gives ln(8) - ln(2) = ln(4) ≈ 1.386, whose square is 1.922. Squaring raw counts (8 - 2)^2 gives 36.000, stopping before squaring gives 1.386, and squaring ln(8) omits the target."
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
    "explanation": "Bucket 7 enters twice ([2, 0] + [2, 0]) and bucket 9 enters once ([0, 3]), summing to [4, 3]. Dividing by three subword entries gives [4/3, 1.00], or [1.33, 1.00]. Deduplicating buckets gives [1.00, 1.50], and [4.00, 3.00] omits averaging."
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
    "explanation": "Half of u is [0.2, 0.3]. Adding 0.5 * [1, 0] yields [0.7, 0.3] for sentence 1, and adding 0.5 * [0, 1] yields [0.2, 0.8] for sentence 2. Returning [0.4, 0.6] ignores context, while [1.4, 0.6] and [0.4, 1.6] omit dividing by two."
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
    "explanation": "For token A, 0.25[2, 0] + 0.25[0, 2] + 0.50[2, 2] = [1.5, 1.5], and multiplying by gamma = 2 gives [3.0, 3.0]. For token B, 0.25[0, 0] + 0.25[2, 0] + 0.50[0, 2] = [0.5, 1.0], which scales to [1.0, 2.0]."
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
    "explanation": "A causal mask blocks future position 2 from reaching position 0, keeping token 0 unchanged deterministically. An unmasked encoder attends across all positions so token 0 can shift, while token 2 sits at or after the edit and receives full prefix updates in the causal decoder."
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
    "explanation": "Summing only the three unmasked rows gives [1 + 3 + 2, 1 + 1 + 4] = [6, 6]. Dividing by the 3 active mask positions yields [2, 2]. Dividing by 4 under-scales to [1.5, 1.5], and omitting the mask includes [99, 99]."
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
    "explanation": "The sample mean is [10, 2]. Subtracting it produces residuals [0, -1], [0, 0], and [0, 1]. Because the middle residual has norm zero, the cosine denominator ||u|| ||v|| is zero and leaves the similarity undefined."
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
    "explanation": "After rotation, K = [-1, 1], L = [1, 1], and R = [-1, -1]. Unrotated query [1, 1] scores [0, 2, -2] and wrongly picks L. Rotating the query to [-1, 1] scores [2, 0, 0] and restores K as the winner."
  }
]
```

> **Next:** Continue to [Perplexity & Model Evaluation](/learn/perplexity-language-model-evaluation). Contextual hidden states feed the output projection to produce next-token probabilities, which perplexity turns into a quantitative measure of held-out model fit.
