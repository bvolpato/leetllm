---
title: Sparse autoencoder
aliases: ["SAE"]
importance: 82
---
A **sparse autoencoder (SAE)** learns to reconstruct model activations using a dictionary of latent features while encouraging only a small number of features to activate for each example. Its encoder maps an activation vector into latent coefficients; its decoder combines those coefficients into a reconstruction. Sparsity can make individual features easier to inspect than raw neurons; interpretability still requires separate validation.

## Reconstruction versus sparsity

For activation $x$, encoder output $f(x)$, and decoder matrix $W_d$, a simplified common training objective is $\lVert x-W_df(x)\rVert_2^2+\lambda\lVert f(x)\rVert_1$ (bias terms omitted). The first term penalizes lost activation information. The second penalizes using too many or overly large feature activations. Decoder directions need a normalization constraint or an equivalent scale-aware penalty: otherwise the decoder can grow while coefficients shrink, reducing the sparsity penalty without changing the reconstruction. Other SAE variants enforce sparsity with a top-$k$ activation rule instead of this $L_1$ penalty.

Increasing $\lambda$ can produce cleaner, rarer features but worse reconstruction. A dictionary may contain more feature directions than the original activation width, allowing different sparse combinations to represent different inputs. Test a feature's causal role with interventions; a compelling label and low reconstruction error alone describe correlation and fit.


## Example

An eight-dimensional activation stream contains overlapping signals for credential rotation, password resets, and malicious access. An SAE with sixteen latent directions may activate one credential-related feature strongly on `rotate the API key` and keep unrelated features near zero. An investigator then ablates that feature while preserving the remaining activation and checks whether the model's refusal or completion changes.

Compare reconstruction error, feature activation frequency, dead-feature counts, and intervention results. A feature that merely correlates with sensitive words but doesn't change output under intervention isn't evidence of a causal security circuit.

## Why it matters here

Mechanistic interpretability uses SAEs to turn dense residual-stream activations into inspectable hypotheses. They support feature discovery, circuit tracing, and controlled steering, but every proposed explanation still needs held-out examples and causal tests.

## Related terms

- [Residual stream](glossary://residual-stream)
- [Vector](glossary://vector)
- [Gradient](glossary://gradient)
- [Attention head](glossary://attention-head)
