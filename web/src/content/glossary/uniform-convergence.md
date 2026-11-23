---
title: Uniform convergence
importance: 83
---
Uniform convergence bounds the difference between empirical and population performance simultaneously over an entire hypothesis class. This is stronger than bounding one predictor chosen before evaluation because a learning algorithm can inspect the data and then select whichever hypothesis looks best. A uniform statement accounts for that data-dependent selection.

## Why the best observed candidate needs a class-wide bound

For a finite class $\mathcal H$ fixed independently of the evaluation sample, iid observations, and losses in $[0,1]$, combining Hoeffding's inequality with a union bound yields a deviation radius $\sqrt{\log(2|\mathcal H|/\delta)/(2n)}$. The class size enters because any candidate could benefit from a favorable random sample. Adaptively inventing candidates after inspecting labels does not justify counting only the finalists as $\mathcal H$. Infinite classes need other capacity controls, such as VC dimension or Rademacher complexity. A parameter count supports a bound when a result links it to the class's capacity.

## Example

An engineer compares 1,000 prompts using 40 cases. A fixed-model 95% Hoeffding radius is about 0.215, while the corresponding conservative 1,000-candidate union-bound radius is about 0.364. Both calculations use the same examples. The larger number is a selection-adjusted, simultaneous radius for the candidate class; the chosen prompt's realized error remains unknown until fresh evaluation.

## Why it matters here

Hyperparameter sweeps, prompt optimization, benchmark leaderboards, and architecture searches all choose systems after examining results. Uniform convergence explains why repeated reuse of one scorecard weakens the resulting scientific claim.

## Related terms

- [Statistical learning theory](glossary://statistical-learning-theory)
- [Concentration inequality](glossary://concentration-inequality)
- [VC dimension](glossary://vc-dimension)
