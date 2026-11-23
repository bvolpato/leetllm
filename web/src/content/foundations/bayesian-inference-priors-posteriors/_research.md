# Research brief: Bayesian evidence for an agent's success rate

## Question this lesson answers

What can eight successful coding-agent tasks out of ten actually establish about the next comparable task when prior evidence and uncertainty are both explicit?

## Sources and the claims they support

- Peter Bartlett's Berkeley lecture notes explicitly derive a Beta prior, binomial likelihood, posterior `Beta(alpha + successes, beta + failures)`, and posterior-predictive success probability equal to the beta mean: https://www.stat.berkeley.edu/~bartlett/courses/2014fall-cs294stat260/lectures/gittins-notes.pdf
- Kevin Murphy's freely available *Probabilistic Machine Learning* material supplies broader primary textbook coverage of Bayesian modeling, posterior inference, predictive distributions, and modeling assumptions: https://probml.github.io/pml-book/book0.html
- SciPy's official beta-distribution reference gives the density, shape parameters, mean, variance, quantiles, and direct numerical tools for verifying the lesson's posterior summaries: https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.beta.html
- The lecture's same-arm Markov and conditional-independence assumptions are useful evidence for explaining why ten correlated retries of one prompt aren't ten representative, exchangeable tasks: https://www.stat.berkeley.edu/~bartlett/courses/2014fall-cs294stat260/lectures/gittins-notes.pdf

## Arithmetic to preserve across text, executable cells, and figures

- `Beta(2, 2)` plus eight passes and two failures is `Beta(10, 4)`. Its mean and one-step posterior predictive probability are `10 / 14 = 0.7142857`; the unadjusted observed rate is `8 / 10 = 0.8`.
- Priors `Beta(1, 1)`, `Beta(2, 2)`, and `Beta(20, 20)` produce posterior means `9 / 12 = 0.75`, `10 / 14 = 0.7142857`, and `28 / 50 = 0.56` for the same ten outcomes.
- Beta variance is `a*b / ((a+b)^2 * (a+b+1))`. `Beta(10, 4)` has standard deviation about `0.11664`; `Beta(82, 22)` has standard deviation about `0.03980`.
- Relative to a uniform `Beta(1, 1)` baseline, `Beta(2, 2)` corresponds to one additional success and one additional failure. Its parameter sum is four, but that doesn't establish that four historical observations occurred. The same distinction applies to `Beta(20, 20)` and its 38 additional observations relative to `Beta(1, 1)`.

## Interpretation boundaries that prevent overclaiming

- A credible interval states posterior probability conditional on the stated likelihood, observations, and prior. It isn't automatically a frequentist coverage guarantee.
- The predictive `0.714` applies only to a new outcome generated under the same Bernoulli success-rate model. Biased task selection, duplicated retries, prompt drift, tool changes, or a changed deployment population break that interpretation.
- Bayesian optional stopping under a correctly specified model and an ignorable stopping rule isn't automatically invalid. Selectively reporting only favorable agents, priors, or release decisions still withholds decision-relevant evidence.
- The Berkeley notes study Bayesian bandits; their conjugacy derivation supports the lesson's update, but doesn't certify the particular agent benchmark or deployment population.

## Editorial outcome

Keep the coding-agent task as the single running example, introduce prior, likelihood, posterior, predictive distribution, and credible interval at first use, and link their glossary entries where each idea becomes operational.
