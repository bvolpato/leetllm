---
title: Clustering inertia
importance: 72
---

Clustering inertia is the sum of squared distances from examples to their assigned cluster centers. K-means directly minimizes this within-cluster quantity under Euclidean geometry. A lower value means the current points lie closer to their assigned centroids, but it does not prove that the clusters correspond to useful human categories.

## Why more clusters lower the number

For assignments $z_i$ and centroids $\mu_j$, inertia is $J=\sum_i\lVert x_i-\mu_{z_i}\rVert_2^2$. With sample weights, each squared distance is multiplied by its weight; [scikit-learn's `inertia_`](https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html) follows that weighted definition. Adding cluster centers cannot worsen the **optimal** objective because the new center can be unused or can improve some assignments. Independently fitted runs can still violate that trend because K-means can converge to different local minima. With one distinct centroid per distinct point, inertia can reach zero. Therefore comparing raw inertia across different cluster counts without a complexity or usefulness check favors excessive fragmentation.


## Example

Six message embeddings form billing, login, and deployment pairs. A two-cluster solution has inertia 20.06, a three-cluster solution has inertia 1.74, and a four-cluster solution has inertia 0.92. The four-cluster solution wins on inertia alone, but the three-cluster solution may better reflect the visible pairs and achieve a stronger silhouette score. Sampled message review determines whether any geometric grouping deserves a topic name.

## Why it matters here

The clustering lesson uses inertia to expose the objective being optimized. Choose a cluster count using that objective alongside scale, initialization, silhouette, stability, sampled records, and downstream retrieval or classification outcomes.

## Related terms

- [K-means clustering](glossary://k-means)
- [Silhouette score](glossary://silhouette-score)
- [Embedding](glossary://embedding)
