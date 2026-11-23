# Research brief: latent request populations and expectation-maximization

## Specific research problem

Can a two-component Gaussian mixture explain six request latencies near 30 and 90 milliseconds without pretending its inferred component labels are observed infrastructure causes?

## Original and authoritative sources

- Arthur Dempster, Nan Laird, and Donald Rubin's original 1977 paper introduces the EM algorithm for maximum likelihood with incomplete data and establishes its likelihood-improvement argument under the stated update assumptions: https://doi.org/10.1111/j.2517-6161.1977.tb01600.x
- Christopher Bishop's *Pattern Recognition and Machine Learning*, published by Microsoft Research, presents latent-variable models, Gaussian mixtures, responsibilities, and the corresponding E/M updates: https://www.microsoft.com/en-us/research/publication/pattern-recognition-machine-learning/
- The scikit-learn Gaussian mixture documentation describes practical estimation, multiple starts, covariance regularization, model selection, and the risk of singular covariance estimates: https://scikit-learn.org/stable/modules/mixture.html

## Claims tied to the lesson's worked example

- Observations `[28, 30, 32, 86, 90, 94]` have arithmetic mean `60`, while their two compact groups center at `30` and `90`. The mean alone misses the visible mixture structure.
- A component responsibility is `r_ik = pi_k * N(x_i | mu_k, sigma_k^2) / sum_j pi_j * N(x_i | mu_j, sigma_j^2)`. Responsibilities are nonnegative and sum to one for each observation.
- With equal mixture weights, means `30` and `90`, common standard deviation `20`, and an observation of `50`, the fast and slow responsibilities are approximately `0.818` and `0.182`.
- The E-step computes conditional component responsibilities with the current parameters. The M-step updates mixture weights and responsibility-weighted means and variances.
- The worked two-component EM loop converges to equal weights and means `30.0` and `90.0` for its chosen initialization and variance floor. That is a worked-example result, not a uniqueness or global-optimum theorem.

## Limits that must remain visible

The original EM monotonicity statement concerns its stated objective and exact update conditions. An imposed variance floor, approximate update, early stopping, or alternative parameter constraint changes the optimization problem; don't transfer the unconstrained proof without qualification.

Gaussian-mixture likelihood can become singular when a component collapses onto a single point with vanishing variance. Regularization limits that degeneracy but doesn't identify the correct component count or turn a fitted mode into proof of a physical queue, GPU, tenant, or service cause.

Likelihood and responsibility are model-conditional. Investigating real causes needs measured queue state, routing identity, device traces, temporal evidence, or a causal design beyond the mixture itself.

## Editorial implications

Introduce latent variable, Gaussian mixture model, responsibility, maximum likelihood, expectation-maximization, covariance collapse, and local optimum before relying on them. Keep all six latency values and both component means synchronized across the article, diagram, runnable code, and checks.
