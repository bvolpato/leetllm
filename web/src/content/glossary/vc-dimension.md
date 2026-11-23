---
title: VC dimension
aliases: ["Vapnik-Chervonenkis dimension"]
importance: 83
---
The Vapnik-Chervonenkis dimension measures the capacity of a binary hypothesis class by asking how many points it can label in every possible way. A class shatters a set of $n$ points when, for each of the $2^n$ possible binary label patterns on those points, at least one hypothesis in the class reproduces that pattern. Its VC dimension is the largest size of a set it can shatter, or infinity if it shatters sets of arbitrarily large finite size. It needs to shatter some set of that size, not every possible set.

## Capacity is a property of the hypothesis class

Consider one-dimensional threshold classifiers of the form $h_t(x)=1[x\ge t]$. One point can receive either label by moving the threshold above or below it. Two ordered points cannot realize the pattern where the left point is positive and the right point is negative, because the threshold's positive region extends rightward. This oriented threshold class therefore has VC dimension one.

## Example

Take ordered positions 2 and 5. A right-facing threshold can realize labels `(0,0)` by choosing a threshold above 5, `(0,1)` between 2 and 5, or `(1,1)` at or below 2. It cannot realize `(1,0)`. The missing fourth pattern means this particular two-point set isn't shattered. The shattering test ranges over the full threshold family. For this two-point set, check whether some threshold realizes each label pattern. A threshold selected after training is one fitted predictor and cannot show whether the class shatters the set.

## Why it matters here

Prompt classes, classifiers, and learned decision boundaries have different opportunities to fit finite samples. Capacity measures support generalization reasoning while clarifying why parameter count alone need not describe effective hypothesis complexity.

## Related terms

- [Statistical learning theory](glossary://statistical-learning-theory)
- [Generalization gap](glossary://generalization-gap)
- [Overfitting](glossary://overfitting)
