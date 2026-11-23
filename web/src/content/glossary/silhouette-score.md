---
title: Silhouette score
importance: 76
---

The silhouette score measures whether an example lies closer to its own cluster than to a neighboring cluster. It compares the mean distance to points in the assigned cluster with the smallest mean distance to another cluster. Averaging the per-example values gives a compact diagnostic for the separation produced by a particular clustering and distance metric.

## Distances and limits

For one point, let $a$ be the average distance to other points in its own cluster, excluding itself, and $b$ the smallest average distance to a different cluster. The silhouette is $(b-a)/\max(a,b)$. Values near one indicate strong separation, values near zero indicate a boundary, and negative values suggest that another cluster may fit better. Interpret the score as geometric separation; it carries no semantic labels and can favor compact shapes over business-relevant structure.

The calculation requires at least two clusters. Common implementations such as scikit-learn require $2 \le k \le n-1$, assign singleton-cluster points a silhouette of zero, and return zero when both $a$ and $b$ are zero. These conventions prevent undefined empty averages or division by zero from being mistaken for excellent separation.


## Example

A developer-support message has average distance $a=0.8$ to its billing cluster and average distance $b=4.0$ to the nearest login cluster. Its silhouette is $(4.0-0.8)/4.0=0.8$, indicating clear separation under that representation. If another message has $a=2.2$ and $b=1.8$, its silhouette is approximately -0.18, suggesting that its assigned group may be wrong or that the embedding geometry hides an important distinction.

## Why it matters here

The clustering lesson compares candidate cluster counts using both inertia and silhouette evidence. Silhouette scores describe geometric separation; useful audits also inspect representative messages, alternative metrics, and downstream retrieval behavior.

## Related terms

- [K-means clustering](glossary://k-means)
- [Embedding](glossary://embedding)
- [Cosine similarity](glossary://cosine-similarity)
