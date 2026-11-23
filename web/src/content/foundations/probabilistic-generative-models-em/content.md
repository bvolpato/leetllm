---
{
  "id": "probabilistic-generative-models-em",
  "title": "Probabilistic Generative Models",
  "slug": "probabilistic-generative-models-em",
  "section": "ML Algorithms & Evaluation",
  "category": "Model Architecture",
  "difficulty": "Medium",
  "order": 9,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": ["OpenAI", "Anthropic", "Google", "Meta"],
  "shortDescription": "When six latencies average 60 ms but none is 60, a mixture can fit both peaks, EM climbs a lower bound, and a variational autoencoder approximates that same bound.",
  "keyConceptsTested": ["generative vs discriminative modeling", "latent variables", "marginal likelihood", "evidence lower bound (ELBO)", "Jensen's inequality", "expectation-maximization", "Gaussian mixture models", "soft responsibilities", "covariance collapse", "variational autoencoders"],
  "prerequisites": ["clustering-pca-representation-learning", "bayesian-inference-priors-posteriors"]
}
---

Six request latencies, `[28, 30, 32, 86, 90, 94]` milliseconds, average to 60 ms, yet no request came anywhere near 60 ms. The mean falls in the empty gap between two clusters of values, so any plan built on it describes a request that never occurs. A better model should explain why the observations form two groups instead of one.

A single fitted Gaussian places its highest density at 60 ms and spreads wide enough to cover both groups. A <span data-glossary="gaussian-mixture-model">Gaussian mixture model</span> instead fits separate peaks and assigns each observation fractional membership in every peak. Cache status, query plans, and routing are absent from the log, so the peaks carry no physical explanation by themselves, and six observations say little about the shape of the full population.[^bishop2006]

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Six observed latencies form groups near 30 and 90 milliseconds. Their two-component Gaussian mixture has peaks at 30 and 90 ms, while a single Gaussian centered at the same pooled mean of 60 ms spreads across the gap. The pooled maximum-likelihood variance is 906.67 ms squared. A separate provisional model at 50 ms normalizes weighted densities 0.00605 and 0.00135 into responsibilities 0.818 and 0.182." />
  <figcaption>Both fitted models have mean 60 ms. The mixture puts its peaks near the observed groups. Rug marks share the curves' latency axis; they show the six observations, while the curves show densities. The 50 ms membership example below uses different, provisional variances.</figcaption>
</figure>

## Generative versus discriminative modeling

The six latencies raise a modeling choice: describe how the observations could have been produced, or predict a label from inputs that are already in hand. In the statistical classification distinction, **discriminative modeling** learns to predict $Y$ from $X$, often through $P(Y \mid X)$ or a decision score. With labeled logs, a classifier might estimate cache-hit probability from latency and query size. A conditional probability alone doesn't specify the input distribution $P(X)$: many different input distributions can share the same $P(Y \mid X)$. The class probability therefore says nothing by itself about whether an input is typical. Confidence on corrupted inputs depends on the model, and it can be high.

**Generative modeling** specifies a distribution from which we can sample observations. A generative classifier might model $P(X,Y)=P(Y)P(X \mid Y)$ and derive $P(Y \mid X)$ by Bayes' rule. An unlabeled density model instead models $p(X)$, possibly through hidden variables. Density scores support anomaly detection when low likelihood aligns with the failures that matter. The sampling distribution describes modeled observations; causal conclusions require additional assumptions and evidence.[^bishop2006]

The terminology also depends on the task. An LLM models a distribution over text conditioned on a prompt, so a conditional distribution can support generation. Here we'll use the classification distinction to ask a narrower question: how could a probability model describe our unlabeled latency sample?

Our hidden component index is a <span data-glossary="latent-variable">latent variable</span>, an unobserved variable included in the statistical model. Some request logs do contain cache or routing labels. This example deliberately doesn't.

## Latent variables and the coupled log-sum

Start with the six observed request latencies: `[28, 30, 32, 86, 90, 94]`. Their arithmetic mean is 60 ms, but the numbers naturally cluster into two distinct groups.

| Request | Latency | Observed group |
|---|---:|---|
| A | 28 ms | Lower latencies |
| B | 30 ms | Lower latencies |
| C | 32 ms | Lower latencies |
| D | 86 ms | Higher latencies |
| E | 90 ms | Higher latencies |
| F | 94 ms | Higher latencies |

A probabilistic generative model formulates a two-stage story for each observation:

```mermaid
flowchart TB
  Z["Select latent component Z = k"]:::primary -->|probability pi_k| C["Component distribution N(mu_k, sigma_k^2)"]:::success
  C --> X["Sample observed latency X"]:::accent
```

In the model, first select component $z_i = k \in \{1,\dots,K\}$ with probability $\pi_k$, where $\sum_k \pi_k=1$ and $\pi_k \ge 0$. Then sample $x_i$ from $p(x_i \mid z_i=k,\theta)=\mathcal{N}(x_i \mid \mu_k,\sigma_k^2)$ with $\sigma_k^2>0$. The weight $\pi_k$ describes component frequency, not confidence in a fitted mean.

Because the log records $X=\{x_1,\dots,x_n\}$ but not $Z=\{z_1,\dots,z_n\}$, calculate an observation's **density** by summing the contributions from its $K$ possible components:

$$
p(x_i \mid \theta) = \sum_{k=1}^{K} p(x_i, z_i = k \mid \theta) = \sum_{k=1}^{K} \pi_k\,\mathcal{N}(x_i \mid \mu_k, \sigma_k^2).
$$

Assume observations are independent and identically distributed under this model. Real traffic can violate that assumption through time, tenant, or queue dependence. <span data-glossary="maximum-likelihood">Maximum likelihood estimation</span> chooses parameters $\theta=\{\pi_k,\mu_k,\sigma_k^2\}_{k=1}^K$ to maximize the product of the observed densities. Its logarithm is:

$$
\ell(\theta) = \log p(X \mid \theta) = \sum_{i=1}^{n} \log \left( \sum_{k=1}^{K} \pi_k\,\mathcal{N}(x_i \mid \mu_k, \sigma_k^2) \right).
$$

Notice the mathematical barrier: the summation across components sits **inside** the logarithm.

For a single Gaussian with nonzero empirical variance, the mean and variance maximizing likelihood have simple formulas. For a general mixture, the log of a sum couples component parameters, so those single-Gaussian formulas don't solve the whole fit in one step. The objective is non-convex, and gradient-based optimization is possible too.[^bishop2006]

Keep **evaluation** separate from **optimization**. With two Gaussian components and parameters already chosen, summing two densities and computing their posterior probabilities is exact. Fitting those parameters is the harder job. Continuous latent variables replace sums with integrals; some models, including linear Gaussian models, still allow exact integration. Nonlinear neural decoders usually don't.

To see how fractional membership works, hold a provisional model fixed and ask how a request landing at 50 ms, between the two groups, divides between the two peaks.

## Soft responsibilities in Gaussian mixtures

If component labels were observed and each group had positive empirical variance, we'd fit separate Gaussian means and variances. With parameters already fixed, we'd instead calculate posterior membership using Bayes' rule.

The labels weren't recorded, and the parameters aren't fitted yet, so score that 50 ms request under a provisional model. Consider two provisional components: a fast component at $\mu_1 = 30$ ms, a slow component at $\mu_2 = 90$ ms, equal standard deviations $\sigma_1 = \sigma_2 = 20$ ms, and equal prior weights $\pi_1 = \pi_2 = 0.5$.

Now evaluate a new request at 50 ms, between the two means. The fast Gaussian's density there is roughly 0.01210 per ms; the slow Gaussian's density is roughly 0.00270 per ms. Weighting each by 0.5 gives contributions 0.00605 and 0.00135. The two components share responsibility equally at 60 ms.

Normalizing these two numbers yields the posterior probability that component $k$ generated observation $x_i$, known as the component's <span data-glossary="mixture-responsibility">responsibility</span> $\gamma_{ik}$:[^bishop2006]

$$
\gamma_{ik} = P(z_i = k \mid x_i, \theta) = \frac{\pi_k\,\mathcal{N}(x_i \mid \mu_k, \sigma_k^2)}{\sum_{j=1}^{K} \pi_j\,\mathcal{N}(x_i \mid \mu_j, \sigma_j^2)}.
$$

For our 50 ms request, the fast responsibility is $0.00605 / (0.00605 + 0.00135) \approx 0.818$, and the slow responsibility is $0.00135 / 0.00740 \approx 0.182$. The next code snippet calculates these values without intermediate rounding:

<!-- leetllm: test, id=mixture-responsibilities, deps=numpy, output=show -->
```python title="calculate-mixture-responsibilities.py"
import numpy as np

def gaussian_density(value, mean, deviation):
    exponent = -((value - mean) ** 2) / (2 * deviation**2)
    return np.exp(exponent) / (np.sqrt(2 * np.pi) * deviation)

latency = 50.0
means = np.array([30.0, 90.0])
weighted = 0.5 * gaussian_density(latency, means, deviation=20.0)
responsibility = weighted / weighted.sum()

assert np.isclose(responsibility.sum(), 1.0)
print(f"fast responsibility: {responsibility[0]:.3f}")
print(f"slow responsibility: {responsibility[1]:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
fast responsibility: 0.818
slow responsibility: 0.182
```
<!-- leetllm: output:end -->

The fast component receives greater responsibility here because its mean is closer and variances are equal. If components had unequal spreads or priors, the closer mean wouldn't automatically win.

Keep the observation, means, and spreads fixed, but suppose the fast component's prior weight is 0.1 instead of 0.5. Reuse the density function to isolate that change:

<!-- leetllm: test, continue=mixture-responsibilities, deps=numpy, output=show -->
```python title="component-frequency-can-change-membership.py"
priors = np.array([0.1, 0.9])
weighted = priors * gaussian_density(latency, means, deviation=20.0)
posterior = weighted / weighted.sum()
print(f"fast responsibility with prior 0.1: {posterior[0]:.3f}")
print(f"slow responsibility with prior 0.9: {posterior[1]:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
fast responsibility with prior 0.1: 0.332
slow responsibility with prior 0.9: 0.668
```
<!-- leetllm: output:end -->

The likelihood ratio favors the closer fast component by about 4.48 to 1, but its prior odds are 1 to 9. Multiplying them gives posterior odds about 0.498 to 1, so the slow component wins. This is the same Bayes update used in [Bayesian Inference](/learn/bayesian-inference-priors-posteriors). A responsibility combines component frequency with fit to the observation; it isn't just a softened nearest-center rule.

Compare this with [K-means](/learn/clustering-pca-representation-learning), which assigns each point to a nearest center. With shared spherical covariance $\Sigma_k=\sigma^2 I$, responsibilities satisfy

$$
\gamma_{ik} \propto \pi_k \exp\left(-\frac{\|x_i-\mu_k\|^2}{2\sigma^2}\right).
$$

Hold centers and positive priors fixed while $\sigma^2 \to 0$. A uniquely closest center receives responsibility approaching one. At an exact distance tie, responsibilities stay proportional to the tied components' priors; shrinking variance doesn't break the tie. The weighted mean update then approaches K-means' mean update when assignments are unique and clusters are nonempty. This limiting argument uses a shared variance; it isn't an instruction to shrink each fitted GMM variance toward zero.

The 0.818/0.182 split expresses membership **under the provisional model**. Hardware traces or queue states would identify physical causes, and cache-versus-database probabilities need verified labels.

Responsibilities are discrete probabilities summing to one for each observation ($\sum_k \gamma_{ik} = 1$). In contrast, $p(x \mid \theta)$ is a continuous probability **density**, whose values can exceed 1.0 for narrow spreads and whose integral over an interval gives probability.

```checkpoint
A 50-millisecond request receives fast-component responsibility 0.818. What happens to the remaining 0.182, and does the larger number prove that an in-memory cache handled the request?
---
The remaining 0.182 belongs to the slow component, so both responsibilities sum to exactly one. The 0.818 score is a conditional probability under the assumed statistical model. Hardware traces or queue states would be needed to identify the physical cause.
```

```checkpoint
A fitted Gaussian with standard deviation 0.1 ms has density 3.989 per millisecond at its mean. An analyst reports a 399% probability that a cache handled that request. Which replacement respects the statistical model?

1. Convert the density into cache odds using its peak as one reference, then normalize over the two causes.
2. Integrate density over a latency interval for its probability, and use external evidence to identify a cache cause.
3. Clip the density at one for cache responsibility, and let the remaining probability describe the other cause.
4. Divide the density by its own peak for cache responsibility, and let the residual describe the other cause.
---
**Answer:** Integrate density over a latency interval for its probability, and use external evidence to identify a cache cause.

A continuous density may exceed one because it has inverse-time units; its integral over an interval gives a probability. Component responsibilities instead normalize weighted component densities. Names can be exchanged without changing the mixture, and physical cache identity needs evidence beyond an unlabeled latency fit.
```

## Expectation-Maximization as lower-bound ascent

We need responsibilities to learn parameters, but we need parameters to calculate responsibilities. The <span data-glossary="expectation-maximization">expectation-maximization (EM)</span> algorithm alternates between the two. Dempster, Laird, and Rubin's classic 1977 paper formalized the general algorithm and its likelihood-improvement argument.[^dempster1977em]

Introduce a probability distribution $q(Z)$ over the latent variables and an **evidence lower bound (ELBO)** on the log likelihood. Whether the bound is practical to calculate depends on the model and the choice of $q$. In our independent-observation GMM, both the joint model and its posterior factorize by observation, avoiding enumeration of all $K^n$ assignment vectors.

For a concave function $f$, Jensen's inequality gives $f(\mathbb{E}[Y]) \ge \mathbb{E}[f(Y)]$ when the expectations exist. To derive the bound below, take $q(Z)>0$ wherever $p(X,Z \mid \theta)>0$, so multiplying and dividing by $q$ doesn't discard part of the sum. The logarithm is concave:

$$
\log p(X \mid \theta) = \log \sum_{Z} q(Z) \frac{p(X, Z \mid \theta)}{q(Z)} = \log \mathbb{E}_q \left[ \frac{p(X, Z \mid \theta)}{q(Z)} \right] \ge \mathbb{E}_q \left[ \log \frac{p(X, Z \mid \theta)}{q(Z)} \right].
$$

Expanding that expectation defines the Evidence Lower Bound $\mathcal{L}(q, \theta)$:[^stanfordCS229EM2022]

$$
\mathcal{L}(q, \theta) \equiv \sum_{Z} q(Z) \log \frac{p(X, Z \mid \theta)}{q(Z)}.
$$

We can also express the relationship as an exact algebraic decomposition:

$$
\log p(X \mid \theta) = \mathcal{L}(q, \theta) + D_{\mathrm{KL}}(q(Z) \parallel p(Z \mid X, \theta)),
$$

where $D_{\mathrm{KL}}(q \parallel p)$ is the Kullback-Leibler divergence measuring the divergence between our distribution $q(Z)$ and the true posterior $p(Z \mid X, \theta)$:

$$
D_{\mathrm{KL}}(q(Z) \parallel p(Z \mid X, \theta)) = \sum_{Z} q(Z) \log \frac{q(Z)}{p(Z \mid X, \theta)}.
$$

For finite terms, this decomposition identifies the gap exactly. KL divergence is nonnegative and is zero when $q$ equals the posterior (almost everywhere for continuous variables). Therefore $\mathcal{L}(q,\theta) \le \ell(\theta)$. A bound can be valid yet loose; a restricted or approximate $q$ can leave the gap positive.

<figure>
  <img src="illustrations/_generated/em_lower_bound_ascent_dark.png" alt="For six latency observations, an E-step with means 70 and 90 ms, equal weights, and variances 400 ms squared gives six fractional component memberships. The component-1 weighted mean is 184.894 divided by 3.907, or 47.33 ms. On the likelihood plot, the old bound rises from -32.028 to -29.517 during the M-step, then a fresh E-step closes the 1.052 gap to the log likelihood at -28.465." />
  <figcaption>This one-parameter example uses equal weights, variances of 400 ms², and a second mean fixed at 90 ms. Its bars show the E-step responsibilities at first mean 70 ms. The purple arrow holds q fixed during the M-step; the green arrow recomputes q so the new bound meets likelihood at the same mean. Both bounds are quadratic here; general ELBOs need not be concave across all model parameters.</figcaption>
</figure>

The algorithm climbs this geometry through coordinate ascent:

1. **E-step:** Hold $\theta^{(t)}$ fixed and compute the exact posterior $q(Z)=p(Z \mid X,\theta^{(t)})$. For the GMM, this means computing responsibilities. The gap is zero at the current parameters:
   $$
   \mathcal{L}(q, \theta^{(t)}) = \log p(X \mid \theta^{(t)}).
   $$

2. **M-step:** Freeze $q$ and maximize the bound over the allowed parameter space:
   $$
   \theta^{(t+1)} = \arg\max_\theta \mathcal{L}(q, \theta) = \arg\max_\theta \sum_{Z} q(Z) \log p(X, Z \mid \theta).
   $$
   The entropy $-\sum_Z q(Z)\log q(Z)$ is constant with respect to $\theta$. The remaining objective is the expected complete-data log likelihood, often called $Q$. For our GMM it separates into weighted Gaussian fits. Other models can still require numerical optimization.

3. **Monotonicity guarantee**: Combining both steps confirms that likelihood never decreases:[^dempster1977em]
   $$
   \log p(X \mid \theta^{(t+1)}) \ge \mathcal{L}(q, \theta^{(t+1)}) \ge \mathcal{L}(q, \theta^{(t)}) = \log p(X \mid \theta^{(t)}).
   $$

Read the three comparisons from right to left: the old bound touches old likelihood, the parameter update doesn't lower that bound, and new likelihood is at least the new bound. Exact E-steps plus an M-step that merely **doesn't decrease** $Q$ are sufficient for this argument; that variant is generalized EM.[^dempster1977em]

Monotonic means non-decreasing. If likelihood is bounded above, its values converge. Parameter convergence and stationary-point results require additional regularity conditions, and unconstrained Gaussian mixtures can have unbounded likelihood. The inequality establishes monotonic likelihood improvement under its assumptions; global optimality needs a separate result.

Reproduce the figure's restricted example before fitting all parameters. Keep means `[m, 90]`, weights `[0.5, 0.5]`, and both variances at 400 ms². The only free parameter is `m`. For each observation, `q[i][k]` holds its component responsibility; independence lets us sum over observations instead of all assignment vectors:

<!-- leetllm: test, id=em-geometry, deps=numpy, output=show -->
```python title="compute-em-bounds.py"
import numpy as np

observations = np.array([28.0, 30.0, 32.0, 86.0, 90.0, 94.0])

def logsumexp(scores):
    largest = scores.max(axis=1, keepdims=True)
    return (largest + np.log(np.exp(scores - largest).sum(axis=1, keepdims=True))).ravel()

def joint_log_scores(mean):
    means = np.array([mean, 90.0])
    squared = (observations[:, None] - means[None, :]) ** 2
    return np.log(0.5) - 0.5 * (np.log(2 * np.pi * 400.0) + squared / 400.0)

def likelihood(mean):
    return logsumexp(joint_log_scores(mean)).sum()

def posterior(mean):
    scores = joint_log_scores(mean)
    return np.exp(scores - logsumexp(scores)[:, None])

def elbo(q, mean):
    return (q * (joint_log_scores(mean) - np.log(q))).sum()

old_mean = 70.0
q_old = posterior(old_mean)
new_mean = (q_old[:, 0] * observations).sum() / q_old[:, 0].sum()
q_new = posterior(new_mean)

assert abs(elbo(q_old, old_mean) - likelihood(old_mean)) < 1e-10
assert abs(elbo(q_new, new_mean) - likelihood(new_mean)) < 1e-10
assert likelihood(new_mean) >= elbo(q_old, new_mean) >= likelihood(old_mean)
for candidate in range(20, 81):
    assert elbo(q_old, candidate) <= likelihood(candidate) + 1e-10
    assert elbo(q_new, candidate) <= likelihood(candidate) + 1e-10

print(f"first mean: {old_mean:.2f} -> {new_mean:.2f} ms")
print(f"old likelihood / touching bound: {likelihood(old_mean):.3f}")
print(f"old bound after M-step: {elbo(q_old, new_mean):.3f}")
print(f"new likelihood / touching bound: {likelihood(new_mean):.3f}")
print(f"KL gap before next E-step: {likelihood(new_mean) - elbo(q_old, new_mean):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
first mean: 70.00 -> 47.33 ms
old likelihood / touching bound: -32.028
old bound after M-step: -29.517
new likelihood / touching bound: -28.465
KL gap before next E-step: 1.052
```
<!-- leetllm: output:end -->

The M-step changes the mean and increases likelihood. The next E-step changes responsibilities and makes the bound touch that *unchanged* new likelihood. Our two bounds can cross elsewhere: tightening at the current parameter doesn't lift the whole curve everywhere.

```checkpoint
Does an E-step improve the model's marginal likelihood by changing its parameters?
---
No. It holds the parameters fixed and updates the latent-variable posterior. The bound becomes tight at those parameters, but marginal likelihood itself stays the same. The subsequent M-step changes the model.
```

### Closed-form updates and numerical stability

For Gaussian mixture models, maximizing $\sum_Z q(Z) \log p(X, Z \mid \theta)$ produces intuitive weighted updates for each component $k$:

$$
N_k = \sum_{i=1}^{n} \gamma_{ik}, \qquad
\pi_k^{\text{new}} = \frac{N_k}{n}, \qquad
\mu_k^{\text{new}} = \frac{\sum_{i=1}^{n} \gamma_{ik} x_i}{N_k}, \qquad
(\sigma_k^2)^{\text{new}} = \frac{\sum_{i=1}^{n} \gamma_{ik} (x_i - \mu_k^{\text{new}})^2}{N_k}.
$$

Here $N_k>0$ is an effective count, not necessarily an integer. Divide by $N_k$ for the maximum-likelihood variance; an unbiased weighted-variance correction is a different problem. With an empty component, the mean and variance formulas divide by zero. In this example we'll stop and ask for another initialization if numerical underflow leaves negligible membership.

When implementing these updates in software, direct calculation of tiny Gaussian densities leads to floating-point underflow. For points far from a mean, raw evaluation of $\exp(-0.5 (x - \mu)^2 / \sigma^2)$ produces zero. When every component underflows, computing $\gamma_{ik} = 0 / 0$ results in `NaN`.

The <span data-glossary="log-sum-exp">log-sum-exp trick</span> protects calculations by operating in log space:

$$
\log \sum_{k=1}^{K} \exp(s_k) = s_{\max} + \log \left( \sum_{k=1}^{K} \exp(s_k - s_{\max}) \right),
$$

Here $s_k=\log \pi_k+\log \mathcal{N}(x_i \mid \mu_k,\sigma_k^2)$ and $s_{\max}=\max_k s_k$. For finite log scores, the largest shifted exponential is one, so the denominator doesn't underflow to zero. Smaller responsibilities can still round to zero. Invalid variances, non-finite inputs, or an all-negative-infinity score vector require separate handling; the subtraction doesn't repair an invalid model.

The next snippet fits the six latencies from provisional means at 25 and 95 ms, initial variances of 900 ms², and a **fixed minimum variance** of 1 ms². It runs eight updates and checks likelihood non-decrease within floating-point tolerance. This compact teaching implementation uses positive initial weights. General-purpose estimators also need initialization, convergence, and degeneracy controls:

<!-- leetllm: test, id=em-fit, deps=numpy, output=show -->
```python title="fit-two-component-mixture.py"
import numpy as np

values = np.array([28.0, 30.0, 32.0, 86.0, 90.0, 94.0])

def logsumexp(scores):
    largest = scores.max(axis=1, keepdims=True)
    return (largest + np.log(np.exp(scores - largest).sum(axis=1, keepdims=True))).ravel()

def log_scores(data, model):
    weights, means, variances = model
    squared = (data[:, None] - means[None, :]) ** 2
    return np.log(weights) - 0.5 * (np.log(2 * np.pi * variances) + squared / variances)

def log_likelihood(data, model):
    return logsumexp(log_scores(data, model)).sum()

def fit_mixture(data, start_means, steps=8, variance_floor=1.0):
    assert data.size and len(start_means) and 0 < variance_floor <= 900.0
    k = len(start_means)
    model = (np.full(k, 1.0 / k), np.array(start_means, dtype=float), np.full(k, 900.0))
    history = [log_likelihood(data, model)]
    for _ in range(steps):
        scores = log_scores(data, model)
        responsibilities = np.exp(scores - logsumexp(scores)[:, None])
        assert np.allclose(responsibilities.sum(axis=1), 1.0)

        counts = responsibilities.sum(axis=0)
        if counts.min() < 1e-12:
            raise ValueError("Numerically empty component: try another initialization")
        means = responsibilities.T @ data / counts
        spread = responsibilities * (data[:, None] - means[None, :]) ** 2
        variances = np.maximum(spread.sum(axis=0) / counts, variance_floor)
        model = (counts / data.size, means, variances)
        history.append(log_likelihood(data, model))

    assert all(new >= old - 1e-10 for old, new in zip(history, history[1:]))
    return model, history

model, history = fit_mixture(values, [25.0, 95.0])
print("log likelihood:", [round(float(value), 3) for value in history])
for index, (weight, mean, variance) in enumerate(zip(*model), start=1):
    print(f"component {index}: weight={weight:.3f}, mean={mean:.1f} ms, variance={variance:.3f} ms²")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
log likelihood: [-29.62, -27.056, -20.641, -17.694, -17.694, -17.694, -17.694, -17.694, -17.694]
component 1: weight=0.500, mean=30.0 ms, variance=2.667 ms²
component 2: weight=0.500, mean=90.0 ms, variance=10.667 ms²
```
<!-- leetllm: output:end -->

The model settles on component means at 30.0 and 90.0 ms, with variances of `8/3` (2.667 ms²) and `32/3` (10.667 ms²). The slow component's variance is four times larger because observations at `[86, 90, 94]` spread twice as far from their center as `[28, 30, 32]` do from theirs.

The floor prevents covariance collapse by keeping variance positive. It also makes this particular fit a **constrained** maximum-likelihood problem. For fixed responsibilities and a new weighted mean, write the weighted squared deviation as $S_k$. The variance-dependent part of $Q$ is

$$
-\frac{N_k}{2}\log v_k-\frac{S_k}{2v_k}+\text{constant}.
$$

Its unconstrained maximizer is $S_k/N_k$. Over $v_k \ge v_{\min}>0$, its exact maximizer is $\max(S_k/N_k,v_{\min})$, which is the code's clamp. The initial variances satisfy the same constraint, so the EM inequality still applies to this fixed feasible space. Every mixture density is at most $1/\sqrt{2\pi v_{\min}}$, giving a finite upper bound on training log likelihood. A different safeguard isn't automatically the same constrained M-step.

```checkpoint
The printed trace rounds to -17.694 for several updates. Has the code proved convergence or found the global maximum?
---
No. The loop runs a fixed eight updates, and rounded output can hide small changes. Its monotonicity assertion checks this trace, not optimality. Different initializations can end at different fits; even a fixed point can fail to be the best mode.
```

## Diagnosing failure modes: singularities and symmetric traps

Means at 30 ms and 90 ms are not the end of the story. Two familiar failures can still wreck a mixture, and both show up on small latency samples.

The first is **covariance collapse**. In a mixture with at least two components, put one positive-weight component's mean on a training observation and let its variance approach zero. Its density there grows as $(2\pi\sigma_k^2)^{-1/2} \to \infty$. Keep another positive-variance component covering the other points, and the training log likelihood becomes unbounded. Variance exactly zero isn't a valid Gaussian density. This limiting spike comes from the optimization objective and says little about the population distribution.[^bishop2006]

A single univariate Gaussian has bounded maximum likelihood when the sample's empirical variance is positive. If all values are identical, even that single-Gaussian fit has a collapse problem. Multivariate singular covariances introduce further cases.

Choose a safeguard appropriate to the objective: a positive variance/eigenvalue constraint, suitable priors, or covariance regularization. Scikit-learn exposes `reg_covar` for a diagonal ridge, with default `1e-6` in version 1.9.1. Adding a ridge and clamping at a floor are different operations. Regularization changes the optimization target, so check its update and objective before applying the exact constrained proof.[^sklearnGaussianMixture2026]

The second failure mode is the **symmetric initialization trap**. If both components start with identical means, variances, and weights (such as $\mu_1 = \mu_2 = 60.0$ ms), every single observation receives identical responsibilities: $\gamma_{i1} = \gamma_{i2} = 0.5$. The subsequent M-step updates both components to the identical pooled sample mean (60.0 ms) and pooled maximum-likelihood variance (906.7 ms²). Because the responsibilities never differentiate, exact EM steps can't break symmetry.

Compare both starting points on `[29, 31, 88, 92]`. These four held-out values test whether each fit generalizes beyond the training sample:

<!-- leetllm: test, continue=em-fit, deps=numpy, output=show -->
```python title="compare-mixture-initializations.py"
validation = np.array([29.0, 31.0, 88.0, 92.0])
for start in ([25.0, 95.0], [60.0, 60.0]):
    fitted, trace = fit_mixture(values, start)
    validation_score = log_likelihood(validation, fitted) / validation.size
    print(f"start={start}: means={[round(float(mean), 1) for mean in fitted[1]]}, "
          f"train={trace[-1]:.3f}, validation/point={validation_score:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
start=[25.0, 95.0]: means=[30.0, 90.0], train=-17.694, validation/point=-2.637
start=[60.0, 60.0]: means=[60.0, 60.0], train=-28.943, validation/point=-4.822
```
<!-- leetllm: output:end -->

The separated start scores better on both the training and held-out values. Break exact component symmetry and compare multiple starts, retaining the best training objective for a fixed model configuration. Scikit-learn 1.9.1 defaults to `init_params="kmeans"` and `n_init=1`; setting `n_init=10` explicitly requests ten starts. Additional starts cost computation and still don't certify a global optimum.[^sklearnGaussianMixture2026]

For different component counts $K$, use held-out log likelihood and inspect model assumptions. AIC and BIC are complexity-penalized model-selection criteria, not guarantees that a selected component count describes real causes. With the same variance floor, the *best possible* training likelihood can't decrease when an extra component can duplicate or have zero weight. Separate EM runs can nevertheless return worse local fits. Unconstrained mixture maxima may not exist at all.[^sklearnMixtures2026]

To check what the fit predicts, sample component $k$ with probability $\pi_k$, then sample $x \sim \mathcal{N}(\mu_k,\sigma_k^2)$. Compare simulated and held-out shapes, tails, and group frequencies. Gaussian components allow negative latencies, even when such draws are rare. Positive-support distributions such as log-normal or Gamma components may better match that constraint.

This is simulation from fitted point estimates. A Bayesian **posterior predictive** check additionally averages over uncertainty in the parameters, as Stan's definition makes explicit.[^stanPosteriorPredictiveChecks2026]

Component labels also have no inherent identity: exchanging the two components leaves the mixture density unchanged. External evidence is needed to identify one component as cache activity.

## From exact responsibilities to an encoder

Our GMM has a small discrete latent index and an exactly computable posterior. Now let $z \in \mathbb{R}^d$ and use a nonlinear neural decoder $p_\theta(x \mid z)$. The integral $p_\theta(x)=\int p_\theta(x,z)\,dz$ and the posterior generally aren't available in closed form. This difficulty comes from the model, not merely from $z$ being continuous.

A **variational autoencoder (VAE)** uses an encoder $q_\phi(z \mid x)$ to approximate that posterior. **Amortized inference** shares the encoder parameters $\phi$ across observations rather than optimizing a separate distribution for each one. Variational EM and VAE training share a lower-bound objective. Ordinary VAE training updates encoder and decoder parameters jointly instead of performing exact alternating E- and M-steps.[^stanfordCS229EM2022]

| Operation | This GMM | Typical Gaussian-latent VAE |
|---|---|---|
| Generative model | Select a component, then sample a Gaussian | Sample a latent vector, then a decoder's output distribution |
| Latent inference | Exact component posterior per observation | Shared encoder outputs approximate posterior parameters |
| Learning | Alternate exact responsibilities and weighted fits | Usually update encoder and decoder together using sampled gradients |
| Bound gap | Zero after an exact E-step | May remain positive because inference is restricted and approximate |

The same ELBO identity applies:

$$
\mathcal{L}(\phi, \theta; x) = \mathbb{E}_{q_\phi(z \mid x)} [\log p_\theta(x \mid z)] - D_{\mathrm{KL}}(q_\phi(z \mid x) \parallel p(z)).
$$

The expected decoder log likelihood is the reconstruction term. With a fixed prior, both encoder and decoder receive its gradients. The prior KL term also affects the encoder; it isn't a separate E-step. Don't confuse that **prior KL penalty** with the **posterior KL gap** $\log p_\theta(x)-\mathcal{L}(\phi,\theta;x)$.[^kingma2014]

For a diagonal Gaussian encoder and a standard normal prior, sample $\epsilon \sim \mathcal{N}(0,I)$ and write

$$
z=\mu_\phi(x)+\sigma_\phi(x)\odot\epsilon.
$$

Here $\sigma_\phi$ is standard deviation, not variance. The **reparameterization trick** makes the sampled decoder objective differentiable through the encoder. Kingma and Welling's method uses stochastic gradients to learn both parameter sets jointly; it doesn't require an exact posterior or an exact M-step.[^kingma2014]

Think through a scalar draw: hold $\epsilon=0.5$ and set $z=\mu+0.5\sigma$. Changing $\mu$ changes the decoder's reconstruction term through $z$, with $\partial z/\partial\mu=1$. Changing $\sigma$ changes it too, with $\partial z/\partial\sigma=0.5$. This explains why reconstruction trains the encoder as well as the decoder.

```checkpoint
A VAE's estimated minibatch ELBO increases. Does exact EM's likelihood non-decrease guarantee apply to that optimizer step?
---
No. The approximate encoder can leave the old bound below the likelihood, and the sampled minibatch objective can fail to increase the full-data ELBO. Even an increase in the exact ELBO alone doesn't ensure likelihood increases when the posterior KL gap changes.
```

```checkpoint
A scalar VAE draw uses z = μ + σε with μ = 2, standard deviation σ = 4 and fixed ε = −0.25. Which tuple gives z, ∂z/∂μ and ∂z/∂σ?

1. (−2.00, 1.00, −0.25)
2. (1.00, −0.25, 1.00)
3. (1.00, 1.00, −0.25)
4. (−2.00, 1.00, −1.00)
---
**Answer:** (1.00, 1.00, −0.25)

The draw is 2 + 4 × (−0.25) = 1. Holding noise fixed gives derivatives 1 and −0.25. Squaring the standard deviation before the draw incorrectly produces −2. Reconstruction can train encoder parameters through these paths, as well as the decoder.
```

```mastery-quiz
[
  {
    "question": "Two populations share P(cache hit | input x) = 0.8. The first has P(x) = 0.1 and the second P(x) = 0.9. Which joint-probability pair is compatible with that unchanged classifier?",
    "options": [
      "P(x, cache hit) is 0.8 in both populations.",
      "P(x, cache hit) is 0.08 and 0.72, respectively.",
      "P(x, cache hit) is 0.125 and 1.125, respectively.",
      "P(x, cache hit) is 0.02 and 0.18, respectively."
    ],
    "answer": "P(x, cache hit) is 0.08 and 0.72, respectively.",
    "explanation": "Multiply the conditional by each input marginal: 0.8 × 0.1 = 0.08 and 0.8 × 0.9 = 0.72. The same conditional permits different input distributions. Its class confidence alone does not determine input typicality or a joint model."
  },
  {
    "question": "At one observation, two components contribute weighted densities 0.018 and 0.012 per millisecond. What is the first responsibility?",
    "options": [
      "0.400",
      "0.018",
      "1.500",
      "0.600"
    ],
    "answer": "0.600",
    "explanation": "The total density is 0.030 per millisecond. Divide the first contribution by that total: 0.018 / 0.030 = 0.6. The other responsibility is 0.4. Raw densities and their ratio are different from a normalized membership probability."
  },
  {
    "question": "Two finite mixture log scores are −900 and −903. Direct exponentials underflow in this implementation. Which repair preserves their exact mathematical normalization?",
    "options": [
      "Subtract −900, normalize [1, exp(−3)], and obtain first membership about 0.953.",
      "Replace both zero exponentials by one, normalize [1, 1], and obtain first membership 0.5.",
      "Subtract −903, normalize [exp(−3), 1], and obtain first membership about 0.047.",
      "Divide both scores by −900, exponentiate, and obtain first membership about 0.499."
    ],
    "answer": "Subtract −900, normalize [1, exp(−3)], and obtain first membership about 0.953.",
    "explanation": "Use the largest finite score as the shared baseline. The shifted scores are [0, −3], so the first membership is 1 / (1 + exp(−3)) ≈ 0.952574. This repair changes neither the relative log scores nor the objective. It does not repair invalid model parameters. At chosen parameters the sum is exact; fitting remains coupled by the log of the component sum."
  },
  {
    "question": "At fixed model parameters, log likelihood is −12 and a trial q gives ELBO −12.08. An exact E-step is performed with no parameter update. What are the resulting log likelihood, ELBO and posterior KL gap?",
    "options": [
      "−11.92, −12.00, 0.08",
      "−12.00, −12.08, 0.08",
      "−12.00, −12.00, 0.00",
      "−11.92, −11.92, 0.00"
    ],
    "answer": "−12.00, −12.00, 0.00",
    "explanation": "The initial gap is −12 − (−12.08) = 0.08. The E-step sets q to the exact posterior, so the gap falls to zero and the ELBO reaches −12.00. Keeping the ELBO at −12.08 would preserve the old gap. Both results with a log likelihood of −11.92 wrongly add 0.08 to the model score even though only q changed."
  },
  {
    "question": "A two-component Gaussian mixture with a shared variance has means 10 and 50 and corresponding priors 0.2 and 0.8. For an observation of 30, what happens to its responsibilities as the shared variance approaches zero?",
    "options": [
      "They approach 0.5 and 0.5 because the distances tie.",
      "They remain 0.2 and 0.8 because the likelihood factors tie.",
      "They approach 1 and 0 because the first mean is listed first.",
      "They approach 0 and 1 because the second prior is larger."
    ],
    "answer": "They remain 0.2 and 0.8 because the likelihood factors tie.",
    "explanation": "Equal distances cancel the shared Gaussian likelihood factors, leaving normalized priors 0.2 and 0.8 at every positive variance. A uniquely closer mean instead approaches full responsibility in the shared-variance limit. Independently shrinking fitted component variances is a separate collapse mechanism."
  },
  {
    "question": "For one univariate Gaussian M-step, effective count N = 6 and weighted squared deviation S = 9 are fixed after updating the mean. The feasible variance is v ≥ 2. What variance maximizes this constrained Q?",
    "options": [
      "1.5",
      "3.5",
      "1.8",
      "2.0"
    ],
    "answer": "2.0",
    "explanation": "The unconstrained maximum-likelihood variance is S/N = 1.5. The constrained maximizer is max(1.5, 2) = 2. Adding a ridge of 2 would yield 3.5, while division by N−1 gives 1.8; neither is this stated constrained update. A fixed positive floor prevents the point-spike limit and bounds density."
  },
  {
    "question": "Two equally weighted Gaussian components start with identical parameters on data [2, 4, 10, 12]. After one exact E-step and unconstrained M-step, which means and variances result?",
    "options": [
      "Means [7, 7] and variances [17, 17].",
      "Means [3, 11] and variances [1, 1].",
      "Means [7, 7] and variances [68, 68].",
      "Means [3, 11] and variances [17, 17]."
    ],
    "answer": "Means [7, 7] and variances [17, 17].",
    "explanation": "Every observation gives each identical component responsibility 0.5. Both weighted means become 7. Squared deviations are 25, 9, 9 and 25; the pooled MLE variance is 68/4 = 17. EM preserves the symmetry instead of producing distinct groups. A finite variance floor below 17 would not break that symmetry."
  },
  {
    "question": "Two and three-component fits use the same fixed variance floor, and zero-weight or duplicate components are allowed. Separate EM runs return training log likelihoods −100 and −103. What diagnosis follows?",
    "options": [
      "The three-component optimum is lower because its parameter count is larger.",
      "The three-component model cannot represent the two-component density at that floor.",
      "The lower score verifies that three physical causes are absent from the observations.",
      "The three-component run found a worse local fit; try other starts at the same floor."
    ],
    "answer": "The three-component run found a worse local fit; try other starts at the same floor.",
    "explanation": "The three-component family contains the two-component density through duplication or zero weight, so its best possible training objective cannot be lower. Separate local optimization runs can still return a lower score. Compare starts within a configuration, then use held-out fit or AIC/BIC for model-count selection. Statistical components say nothing about physical causes by themselves."
  },
  {
    "question": "An exact E-step makes the old bound equal the old log likelihood of −18. A proposed generalized M-step leaves q fixed. Which (new bound, new log likelihood) pair supports the standard non-decrease argument?",
    "options": [
      "(−17.0, −17.5)",
      "(−18.5, −17.5)",
      "(−17.0, −16.5)",
      "(−18.25, −18.5)"
    ],
    "answer": "(−17.0, −16.5)",
    "explanation": "With q fixed, the bound rises from −18 to −17.0, and the new log likelihood of −16.5 is above it. The pair (−17.0, −17.5) puts the bound above the new log likelihood. A bound of −18.5 falls below the old bound even though the log likelihood rises. The pair (−18.25, −18.5) fails both comparisons."
  },
  {
    "question": "For a VAE observation, exact log evidence is −4, the ELBO is −6, and KL from the encoder distribution to its fixed prior is 0.7. What are the reconstruction expectation and posterior KL gap?",
    "options": [
      "(−5.3, 2.0)",
      "(−6.7, 2.0)",
      "(−5.3, 0.7)",
      "(−4.0, 2.7)"
    ],
    "answer": "(−5.3, 2.0)",
    "explanation": "ELBO = reconstruction − prior KL gives reconstruction = −6 + 0.7 = −5.3. The posterior gap is log evidence − ELBO = 2. It is distinct from the 0.7 prior penalty. Typical VAE training learns encoder and decoder jointly using estimated gradients, so an improving sampled bound does not inherit exact EM likelihood monotonicity."
  }
]
```

> **Next:** Continue to [Core Retrieval Algorithms](/learn/core-retrieval-algorithms). The six latencies can take two peaks, an exact E-step can leave the likelihood where it is, and a fit can collapse or stay symmetric. Retrieval asks which stored examples are close enough to return.
