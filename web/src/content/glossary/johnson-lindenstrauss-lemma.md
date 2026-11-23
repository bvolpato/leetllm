---
title: Johnson-Lindenstrauss lemma
aliases: ["JL lemma"]
importance: 73
---
The **Johnson-Lindenstrauss lemma** states that a finite collection of Euclidean points admits an embedding whose dimension grows logarithmically with the point count while approximately preserving all pairwise distances. The bound yields compression when its required dimension is smaller than the original dimension, which depends on the point count and chosen tolerance.

## Guarantee scope and limits

For $n$ points and distortion tolerance $0 < \varepsilon < 1$, a suitable projection into $O(\log(n) / \varepsilon^2)$ dimensions can satisfy $(1-\varepsilon)\|x-y\|^2 \le \|f(x)-f(y)\|^2 \le (1+\varepsilon)\|x-y\|^2$ for every pair in the set. A suitably scaled random Gaussian projection succeeds with high probability at a sufficient dimension. Check a sampled matrix against distances in the target set before relying on its bound.

The guarantee concerns a fixed finite point set and geometric distances. It permits nearly tied documents to exchange order while their projected distances stay within the allowed error range. Access-control labels and downstream question-answering quality require separate checks.

A deployed system must also apply the identical saved projection to indexed documents and future queries. Independently sampling a new matrix for each request creates incompatible coordinate systems. Consistent coordinates alone don't extend a fixed-set guarantee to every possible future query; evaluate representative queries too.

## Example

An embedding service replaces 1,536-coordinate policy vectors with 256-coordinate random projections to reduce raw-vector memory by a factor of six. It fixes the projection matrix once, transforms documents and evaluation queries consistently, and compares retrieved chunks with judged relevant documents.

If recall falls below the release threshold, follow the measured result. Increase dimensionality, evaluate another fixed projection, or choose a model trained for native shortening.

## Why it matters here

The lemma explains why random projection deserves a place beside PCA and trained embedding shortening in compression experiments. It also teaches the essential boundary between a mathematical geometric guarantee and a production decision based on retrieval quality, latency, access controls, and memory.

## Related terms

- [Vector](glossary://vector)
- [Embedding](glossary://embedding)
- [PCA](glossary://pca)
- [Recall at K](glossary://recall-at-k)
