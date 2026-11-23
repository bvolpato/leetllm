---
title: Evidence lower bound
aliases: ["ELBO"]
importance: 87
---
The evidence lower bound (ELBO) is an optimizable lower bound on the log evidence of observed data under a latent-variable model: log probability mass for discrete observations, or log density for continuous ones. With approximate posterior $q_\phi(z\mid x)$, decoder $p_\theta(x\mid z)$, and prior $p(z)$, its standard form is:

$$
\operatorname{ELBO}(x)=\mathbb E_{q_\phi(z\mid x)}[\log p_\theta(x\mid z)]-D_{KL}(q_\phi(z\mid x)\Vert p(z))
$$

## The missing gap is another KL divergence

When the relevant terms are finite, the exact identity is $\log p_\theta(x)=\operatorname{ELBO}(x)+D_{KL}(q_\phi(z\mid x)\Vert p_\theta(z\mid x))$. Since KL divergence is nonnegative, the ELBO cannot exceed the log evidence. Equality requires the approximate posterior to match the model's true posterior up to probability-zero sets. See the original [Auto-Encoding Variational Bayes paper](https://arxiv.org/abs/1312.6114).

The reconstruction expectation rewards latent samples that explain the observation. The prior KL discourages arbitrary posterior distributions that prevent useful sampling. Code usually minimizes negative ELBO instead. Weighting KL by $\beta\ne1$ creates a modified beta-VAE objective; calling that modified objective the unchanged standard evidence bound is inaccurate.


## Example

Suppose expected log reconstruction is $-1.7$ nats and prior KL is $0.2$ nats. The ELBO is $-1.9$ nats. If the approximate-to-true posterior KL is $0.4$ nats, the exact log evidence is $-1.5$ nats. The positive $0.4$ gap explains precisely why the evidence bound is lower.

## Why it matters here

The VAE lesson trains an encoder and decoder with reconstruction and KL terms. The ELBO connects that executable loss to variational inference and makes posterior mismatch, prior sampling, loss scaling, and beta weighting mathematically interpretable.

## Related terms

- [Variational inference](glossary://variational-inference)
- [Variational autoencoder](glossary://variational-autoencoder)
- [KL divergence](glossary://kl-divergence)
- [Entropy](glossary://entropy)
