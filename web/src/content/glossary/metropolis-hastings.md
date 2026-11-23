---
title: Metropolis-Hastings
aliases: ["Metropolis-Hastings algorithm", "MH sampler"]
importance: 88
---

Metropolis-Hastings constructs a Markov chain by proposing a new parameter state and deciding whether to accept that state according to the target distribution and proposal probabilities. It can sample from a target known only up to a proportionality constant because that constant cancels in the acceptance ratio. A rejected proposal creates a self-transition that retains the current state.

## Compare target density and proposal asymmetry


For target density $\pi$ and proposal density $q$, the acceptance probability is $\min(1,\pi(x')q(x\mid x')/[\pi(x)q(x'\mid x)])$. Symmetric proposals have matching forward and reverse probabilities, leaving the ratio $\min(1,\pi(x')/\pi(x))$. Asymmetric proposals require the proposal correction; omitting it can change the chain's target distribution. A Gaussian random walk with out-of-support proposals rejected remains symmetric; repeatedly resampling until a proposal lies inside a bounded interval generally does not. Correct acceptance preserves the target, but convergence also requires suitable reachability and ergodicity conditions. Compute log-density differences in practice to avoid numerical underflow.

## Example

Let the unnormalized target density be proportional to $p^9(1-p)^3$, corresponding to a Beta(10, 4) shape. Move from $p=0.5$ to $p'=0.6$ using a symmetric proposal. The target-density ratio is approximately 2.642, so the acceptance probability is one. Reversing that move gives probability about 0.379. A fixed comparison value of 0.35 accepts the reverse move, while 0.4 rejects it.

## Why it matters here

Metropolis-Hastings exposes the basic mechanics behind posterior sampling without requiring the posterior's normalization constant. Its rejection behavior, proposal design, dependence, and numerical stability matter when researchers move beyond exact conjugate updates.

## Related terms

- [Markov chain Monte Carlo](glossary://markov-chain-monte-carlo)
- [Posterior probability](glossary://posterior-probability)
- [Likelihood](glossary://likelihood)
- [Rejection sampling](glossary://rejection-sampling)
