---
title: Scaling law
importance: 85
---
A **scaling law** is an empirical relationship describing how model quality changes as training compute, parameter count, dataset size, or another controlled resource increases. Language-model studies often fit a power law to held-out cross-entropy, then use that fit to compare candidate allocations before launching an expensive training run.

## What the fitted curve actually promises

A simplified loss model is $L(N,D)=L_{\infty}+aN^{-\alpha}+bD^{-\beta}$, where $N$ is parameter count, $D$ is training tokens, and $L_{\infty}$ is an estimated irreducible floor. The constants depend on the model family, data distribution, tokenizer, optimizer, and measurement protocol. A dense-training approximation such as $C\approx6ND$ then connects candidate sizes to a compute budget.

Scaling curves describe measured loss against compute. Evaluate downstream task quality, safety, factual accuracy, and deployment efficiency separately, especially when architecture, data quality, training schedule, or evaluation contamination changes between small and large runs.

## Example

A team trains a grid of decoder sizes and token budgets on clean coding text, records held-out token loss and actual accelerator usage, and fits loss against both parameters and tokens. Varying both resources helps distinguish their effects; a few model sizes at one token budget cannot identify the whole surface. Two candidates satisfy the same FLOP budget: a larger undertrained model and a smaller model trained longer. The fitted surface favors the latter for held-out loss, but the release decision still checks code-generation evaluations, inference cost, and whether enough licensed data exists.

The original Kaplan and Chinchilla studies reached different allocation rules partly because their experimental setups and assumptions differed. Treat a quoted exponent as evidence from its study, and compare assumptions before applying it to a new training budget.

## Why it matters here

Scaling laws connect pretraining budgets to data acquisition, architecture sizing, and inference economics. They help a team plan controlled experiments while making the assumptions and failure boundaries visible.

## Related terms

- [Pretraining](glossary://pretraining)
- [Cross-entropy](glossary://cross-entropy)
- [Token](glossary://token)
- [Validation gate](glossary://validation-gate)
