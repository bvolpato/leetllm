---
title: K-means clustering
importance: 86
---

K-means partitions vectors into a chosen number of clusters by alternating between nearest-centroid assignment and centroid recomputation. Its objective is the within-cluster sum of squared Euclidean distances, commonly called inertia. The algorithm takes coordinates and a requested cluster count as input. Domain labels and human review help interpret what the resulting clusters represent.

## Assignment, update, and initialization

First initialize $k$ centroids. Assign every vector to its nearest centroid, then replace each centroid with the mean of its assigned vectors. Repeat until assignments or the objective stabilize, or a stopping limit is reached. An empty cluster has no mean, so implementations need a policy such as reinitializing its center. Different initializations can converge to different local solutions.

Feature scaling, outliers, and highly unequal cluster shapes can dominate the result. Ordinary k-means uses squared Euclidean distance; substituting an arbitrary distance while retaining the mean update doesn't preserve that objective. Spherical k-means and k-medoids are distinct variants for other geometries.

## Example

Six message embeddings form visible billing, login, and deployment pairs. With $k=3$ and one initial seed near each pair, assignment groups nearby vectors and the update moves each center to its pair's mean. If $k=6$, every point can become its own center and inertia falls to zero, but that does not prove that six business topics exist. Reading sampled messages and validating downstream retrieval remain necessary.

## Why it matters here

Clustering offers an initial diagnostic for unlabeled embeddings before retrieval and classification. Its limitations teach readers to inspect representation geometry, scale features deliberately, evaluate initialization sensitivity, and avoid treating cluster IDs or lower inertia as verified human categories.

## Related terms

- [Embedding](glossary://embedding)
- [PCA](glossary://pca)
- [Silhouette score](glossary://silhouette-score)
