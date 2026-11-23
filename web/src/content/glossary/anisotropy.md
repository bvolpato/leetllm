---
title: Anisotropy
importance: 78
---
Anisotropy means embedding (or hidden-state) vectors do not spread evenly through the ambient space. Instead of pointing in roughly all directions, they crowd into a narrow cone or share a few dominant directions. The opposite property is **isotropy**: random vectors would have near-zero expected cosine similarity and no single direction would dominate variance.

When a space is strongly anisotropic, [cosine similarity](glossary://cosine-similarity) and [dot product](glossary://dot-product) mix semantic signal with global geometry. Unrelated items can score high because every vector already points roughly the same way. Rankings can look poor even when the encoder ran cleanly, the index built successfully, and ANN search is correct: the metric compares angles inside a cone rather than across a well-spread hypersphere.

A practical diagnostic is the mean cosine between randomly sampled, unrelated pairs. In a healthier retrieval space that baseline sits near low similarity and true matches form a clearer upper tail. With strong anisotropy, random pairs may score something like $0.7$ to $0.9$, so nearest-neighbor lists fill with generic boilerplate and score thresholds stop separating signal from noise.

## Intuition

Think of every vector as "true semantic direction + shared bulk direction." If the bulk direction is large, cosine mostly measures how much each item still rides that bulk, not how the residual directions relate. Two documents can differ in the informative residual subspace yet look almost identical in the raw space.

Classic 2D cartoon: invoice-like vector $[10, 1]$ and device-like vector $[10, -1]$ share a large horizontal component. Raw cosine is about $0.98$ (only ~$11^\circ$ apart). Subtract the shared mean $[10, 0]$ and the residuals $[0, 1]$ and $[0, -1]$ point opposite ways (cosine $-1$). Use centering here as a diagnostic. It shows how a shared direction can produce high raw similarity. Validate any production transform on retrieval quality.

## Formula

A common **random-pair anisotropy probe** for a set of vectors $\{x_i\}$ is the average pairwise cosine over random distinct pairs:

$$
\overline{\cos}
=
\mathbb{E}_{i \neq j}\left[
\frac{x_i \cdot x_j}{\lVert x_i \rVert \,\lVert x_j \rVert}
\right]
$$

For independent, directionally symmetric unit vectors this expectation is $0$. A large positive value suggests a shared direction. A zero-mean cloud concentrated along one axis can also average to zero, so inspect the covariance spectrum and direction distribution too.

A second view uses [PCA](glossary://pca) after centering. Let $\mu = \frac{1}{n}\sum_i x_i$ and $\tilde{x}_i = x_i - \mu$. If a few top principal components explain most of the energy, residual semantic variation lives in a thin slice of dimensions. Post-hoc "all-but-the-top" style cleaning removes $\mu$ and projects away the first $D$ principal directions; that can help static word vectors, but on production sentence embeddings you should re-evaluate retrieval before shipping any whitening or PC-removal transform.

For one pair after L2 normalization, cosine collapses to the inner product $x^\top y$. Anisotropy does not change that formula; it changes the **score distribution**, so absolute thresholds and "looks high" judgments do not transfer across models or corpora.

## Example

In a hypothetical support corpus, random-pair mean cosine is $0.78$ and relevant-pair mean is $0.84$. Inspect score overlap, hard negatives, and query-conditioned ranks to assess retrieval quality. Compare boilerplate removal or retraining on a fixed held-out query set. A lower random-pair mean helps when relevant items remain retrievable.

The same geometry shows up when people dump raw BERT `[CLS]` (or mean-pooled last-layer) vectors into a vector DB without a sentence-level objective. Because these contextual states use a different training objective, nearest-neighbor cosine often reflects crowded, anisotropic geometry instead of relevance. Switching to a contrastively trained sentence encoder (or fine-tuning with in-domain positives and hard negatives) usually moves more of the score mass toward discrimination than an index tweak.

## Worked numbers

Toy residual geometry after a shared bulk component:

| vectors | cosine |
| --- | ---: |
| $a=[10,1]$, $b=[10,-1]$ | $\approx 0.980$ |
| $a-\mu$, $b-\mu$ with $\mu=[10,0]$ | $-1.0$ |

Angle view of a retrieval cone: if two unit vectors sit only $6^\circ$ apart, $\cos 6^\circ \approx 0.995$. If training later separates an unrelated cluster to $120^\circ$, $\cos 120^\circ = -0.5$. Same metric, totally different ranking room. When random pairs already live near $0.9$, your useful dynamic range for true matches is a few hundredths of cosine, which noise, chunking, and boilerplate easily swamp.

## How it shows up in systems

- **Mean drift:** many models push hidden states away from the origin along a shared direction (representation degeneration / bulk component). Removing the corpus mean can unmask residual structure for analysis.
- **Dominant PCs:** a handful of directions carry frequency, length, or template signal. Frequency effects in contextual models can further warp geometry.
- **Layer and model effects:** contextual token spaces are typically anisotropic across layers; some upper layers can be extreme (random tokens with near-perfect mean cosine). Those findings describe representation geometry. Validate thresholds on embeddings trained for retrieval before applying them to GPT-layer states.
- **Corpus artifacts:** duplicated footers, HTML chrome, and near-duplicate chunks collapse many points toward one "generic page" direction even with a good encoder.
- **Training collapse:** without hard negatives or diversity, [contrastive learning](glossary://contrastive-learning) can still crowd many items together. Alignment (positives close) without uniformity (points spread on the sphere) is the twin failure mode.

## Diagnosis

Inspect, in order:

1. Histogram of cosine for random pairs vs labeled positives (and hard negatives if you have them).
2. Nearest neighbors for a few generic queries ("help", "thanks", product name only).
3. Embedding norms and whether a few PCA components dominate explained variance.
4. Duplicate rate and template rate in the top-$k$ lists.
5. Whether raising average similarity is progress: if every vector got more alike, it is not.

Raising mean cosine across the corpus says little about quality by itself. Evaluate whether random and relevant pair distributions separate.

## What to try

Match the fix to the cause:

| Likely cause | Useful response |
| --- | --- |
| Untuned LM pooling used as a retriever | Use a sentence / retrieval encoder or fine-tune with a ranking objective |
| Soft geometry, close confusers | Hard negatives, domain pairs, better chunking |
| Template / HTML collapse | Strip boilerplate, dedupe, split layouts |
| Shared bulk / heavy top PCs | Diagnostic centering or whitening; validate on held-out retrieval before deploy |
| Score threshold cargo-culted across models | Rebuild thresholds from new random-vs-positive histograms |

Choose the target geometry from the downstream task. For **retrieval and dense candidate generation**, unrelated items should remain distinct while true matches stay separable under your production metric. Generative models can use anisotropic internal representations effectively, so evaluate each layer for its intended role.

## Why it matters here

Anisotropy explains dense-retrieval failures where vectors were generated successfully and the index is correctly built. Dense recall depends on embedding geometry as well as infrastructure. Lessons on embeddings, cosine vs dot product, contrastive training, PCA diagnostics, and RAG candidate generation all assume similarity scores track semantic rank. Anisotropy explains cases where they do not.

## Related terms

- [Embedding](glossary://embedding)
- [Cosine similarity](glossary://cosine-similarity)
- [PCA](glossary://pca)
- [Hard negative](glossary://hard-negative)
- [Contrastive learning](glossary://contrastive-learning)
