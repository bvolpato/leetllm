---
{
  "id": "distributions-sampling-simulation",
  "title": "Distributions and Sampling",
  "slug": "distributions-sampling-simulation",
  "section": "Math & Statistics",
  "category": "Evaluation & Benchmarks",
  "difficulty": "Easy",
  "order": 8,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "Name a first distribution for resolution, route, tool calls, and latency, then reject a simulator the traces don't support.",
  "keyConceptsTested": [
    "PMF, PDF, and CDF",
    "inverse CDF transform sampling",
    "Bernoulli and categorical distributions",
    "binomial batch counts",
    "discrete versus continuous values",
    "Poisson count assumptions",
    "overdispersion and compound tails",
    "exponential service times",
    "lognormal positive values",
    "Little's Law and queue congestion",
    "Monte Carlo sampling",
    "Markov chain Monte Carlo",
    "Metropolis-Hastings acceptance",
    "autocorrelation and effective sample size",
    "Gibbs sampling",
    "seeded RNG streams",
    "simulation diagnostics and KS distance",
    "categorical token sampling",
    "temperature scaling dynamics",
    "Gumbel-Max reparameterization"
  ],
  "prerequisites": [
    "statistics-estimation-uncertainty",
    "bayesian-inference-priors-posteriors"
  ]
}
---

Simulate 5,000 requests through an AI coding assistant before traffic arrives. Each request yields four random measurements: whether it resolves automatically, which task route it takes, how many tool calls it triggers, and how many seconds it takes to finish. Pick the wrong probability family and your average looks comforting while the simulator spits out `-13`-second durations, hides `5x` tool-call bursts, or misses queue congestion entirely.

In [Statistics and Uncertainty](/learn/statistics-estimation-uncertainty), we moved from a finite sample (`16/100`) to an interval around an unknown rate. Simulation runs in reverse: specify a <span data-glossary="probability-distribution">probability distribution</span> (the allowed values plus how probability is assigned across them), draw synthetic traces with NumPy and SciPy, and test whether those traces match real system behavior.[^numpyParallelRandom2026]

## Four measurements from one request

| Quantity from one request | Example value | Support | First candidate family | Summary to report |
|---|---:|---|---|---|
| Resolved without human handoff | `1` or `0` | binary | Bernoulli | resolution rate |
| Request route | `ci_failure`, `test_fix`, `code_review`, `log_triage` | finite labels | categorical | label mix |
| Tool calls made | `0`, `1`, `2`, ... | nonnegative integers | Poisson baseline | mean and share `> 5` |
| End-to-end response time | `7.4` seconds | positive reals | lognormal baseline | median and <span data-glossary="p95-latency">p95</span> |

Treat each candidate family as a testable hypothesis about shape: when observed <span data-glossary="tracing">traces</span> disagree, replace the family rather than defending a convenient formula.

## Discrete values versus continuous time

Probability distributions split first by whether outcomes are **discrete** (enumerable outcomes such as binary resolution, route labels, or tool-call counts) or **continuous** (measured on an interval such as response time in seconds).

For a discrete variable you can ask for the probability of an exact outcome, like `P(tool_calls = 2)`. For a continuous duration, any exact real point has probability zero; ask instead for an interval probability like `P(time > 15s)` or a quantile like p95. Always match a distribution's **support** (its allowed values) to the measurement: finite label sets for routes, nonnegative integers for counts, and strictly positive numbers for durations.

## PMF, PDF, and CDF

Three functions describe how probability sits across a distribution's support:

- **Probability mass function (PMF):** assigns an exact probability to each discrete outcome (`P(R = 0) = 0.28`, `P(R = 1) = 0.72`), summing to `1`.
- **Probability density function (PDF):** describes probability per unit width for a continuous variable. Area over an interval equals probability; density height itself can exceed `1` (a uniform duration on `[0, 0.5]` seconds has density `2` per second and total area `2 × 0.5 = 1`).
- **Cumulative distribution function (CDF):** gives the accumulated probability up to threshold $t$:

$$
F_T(t) = P(T \leq t)
$$

Read $F_T(10)$ as the probability a request finishes within 10 seconds, and $1 - F_T(15)$ as the probability it exceeds 15 seconds. For a smooth latency curve, p95 is the time where $F_T(t) = 0.95$; discrete CDFs rise in steps and can jump past `0.95`.[^murphy2012]

> **Key insight:** A PMF bar *is* a probability; a PDF curve must be integrated over an interval to become one; a CDF height is already accumulated probability.

Naming a continuous family tells us its curve, but how does a computer turn uniform random numbers into simulated durations?

## Inverse CDF transform: how computers sample continuous variables

Every continuous sampler starts from uniform draws $U \sim \text{Uniform}(0, 1)$. The **inverse CDF transform** pushes $U$ through the distribution's quantile function $F^{-1}(u) = \inf\{t : F(t) \geq u\}$ (which also handles flat CDF regions and discrete jumps). Because $F^{-1}(U) \le t$ exactly when $U \le F(t)$, the transformed variable $T = F^{-1}(U)$ has the target CDF:

$$
P(F^{-1}(U) \leq t) = P(U \leq F(t)) = F(t)
$$

<details>
<summary>Deep dive: inverse transform versus probability integral transform</summary>

Running the same identity in reverse gives the **probability integral transform**: if $T$ follows a continuous CDF $F$, then $F(T) \sim \text{Uniform}(0, 1)$. When closed-form quantiles do not exist, libraries such as [SciPy's `NumericalInverseHermite`](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.sampling.NumericalInverseHermite.html) approximate $F^{-1}$ numerically to floating-point precision.

</details>

For an exponential duration with rate $\mu$, inverting $F(s) = 1 - e^{-\mu s} = u$ gives a one-line sampler:

$$
F(s) = 1 - e^{-\mu s} = u \implies e^{-\mu s} = 1 - u \implies s = -\frac{\ln(1 - u)}{\mu}
$$

For a lognormal duration with median $e^\mu$ and log-spread $\sigma$, invert the standard normal CDF $z = \Phi^{-1}(u)$ and exponentiate: $t = \exp(\mu + \sigma z)$.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="A Bernoulli probability mass function assigns 28% to escalation and 72% to resolution. A lognormal cumulative distribution maps uniform draws to positive response times: u = 0.50 reaches the 6.0-second median, and u = 0.95 reaches the 14.8-second p95. The final 5% of uniform draws maps to response times at or beyond 14.8 seconds." />
  <figcaption>Bernoulli bars show discrete outcome masses (28% vs 72%). The lognormal CDF maps uniform draws on the vertical axis to positive durations: u = 0.50 lands at the 6.0-second median, and the top 5% of uniform draws stretches across the entire right tail past 14.8 seconds.</figcaption>
</figure>

Watch the geometry: where the CDF is steep near the 6-second median, a wide band of uniform draws compresses into a narrow time slice; where the CDF flattens in the right tail, the top `5%` of uniform draws ($u \in [0.95, 1.0]$) stretches across every latency past `14.8` seconds. Clip uniform draws strictly inside `(0, 1)` before calling `norm.ppf` so exact `0.0` never triggers `-inf`:

<!-- leetllm: test, deps=scipy, output=show, output_title="Inverse CDF transform sampling" -->
```python title="sample-via-inverse-cdf.py"
import numpy as np
from scipy.stats import norm

rng = np.random.default_rng(42)
rate = 20.0
u = np.clip(rng.random(5_000), np.finfo(float).tiny, 1.0 - np.finfo(float).eps)

exp_samples = -np.log1p(-u) / rate

mu = np.log(6.0)
sigma = 0.55
lognormal_samples = np.exp(mu + sigma * norm.ppf(u))

print(f"exponential mean: {np.mean(exp_samples):.3f}s (target: {1/rate:.3f}s)")
print(f"lognormal median: {np.median(lognormal_samples):.2f}s (target: 6.00s)")
print(f"lognormal p95:    {np.percentile(lognormal_samples, 95):.2f}s (target: 14.83s)")
```

<!-- leetllm: output:start -->
```text title="Inverse CDF transform sampling" output compact
exponential mean: 0.050s (target: 0.050s)
lognormal median: 5.93s (target: 6.00s)
lognormal p95:    14.74s (target: 14.83s)
```
<!-- leetllm: output:end -->


## Bernoulli: resolved or escalated

Start with the simplest distribution. Let `R = 1` when the assistant resolves a request autonomously (`p = 0.72`) and `R = 0` when it hands off (`1 - p = 0.28`). Because `R` is binary, its <span data-glossary="expected-value">expected value</span> equals the resolution probability:

$$
E[R] = 0 \times 0.28 + 1 \times 0.72 = 0.72
$$

Verify the PMF and expectation with `scipy.stats.bernoulli`:

<!-- leetllm: test, deps=scipy, output=show, output_title="Bernoulli resolution setup" -->
```python title="bernoulli-resolution-rate.py"
import numpy as np
from scipy.stats import bernoulli

p_resolved = 0.72
dist = bernoulli(p=p_resolved)
values = np.array([0, 1])
probs = dist.pmf(values)
expected_value = float(np.dot(values, probs))

print(f"P(resolved):  {probs[1]:.2f}")
print(f"P(escalated): {probs[0]:.2f}")
print(f"E[R]:         {expected_value:.2f}")

assert np.isclose(expected_value, p_resolved)
```

<!-- leetllm: output:start -->
```text title="Bernoulli resolution setup" output compact
P(resolved):  0.72
P(escalated): 0.28
E[R]:         0.72
```
<!-- leetllm: output:end -->

## Binomial: resolutions in a 100-request batch

Summing $n = 100$ independent Bernoulli trials with shared probability $p = 0.72$ produces a **binomial distribution** with mean $np = 72$ and variance $np(1 - p) = 20.16$.[^nist2012binomial] Counting all $\binom{100}{72}$ ways to arrange 72 successes gives:

$$
P(X=72) = \binom{100}{72}(0.72)^{72}(0.28)^{28} \approx 0.089
$$

If requests arrive in correlated bursts or carry heterogeneous difficulty, a single-rate binomial model misses that structure. Even under fixed $p = 0.72$, watch six independent 100-request batches wobble from `0.65` to `0.76`:

<!-- leetllm: test, deps=scipy, output=show, output_title="Resolution batches wobble" -->
```python title="sample-resolution-batches.py"
import numpy as np
from scipy.stats import binom

n = 100
p = 0.72
k = 72
dist = binom(n=n, p=p)

print(f"P(X={k}) = {dist.pmf(k):.3f}")
print(f"E[X] = {dist.mean():.0f}")
print(f"Var(X) = {dist.var():.2f}")

rng = np.random.default_rng(12)
resolved_per_batch = rng.binomial(n, p, size=6)
rates = resolved_per_batch / n

print("resolved counts:", resolved_per_batch.tolist())
print("batch rates:    ", np.round(rates, 2).tolist())
print(f"range:           {rates.min():.2f} to {rates.max():.2f}")
```

<!-- leetllm: output:start -->
```text title="Resolution batches wobble" output compact
P(X=72) = 0.089
E[X] = 72
Var(X) = 20.16
resolved counts: [75, 65, 76, 76, 74, 75]
batch rates:     [0.75, 0.65, 0.76, 0.76, 0.74, 0.75]
range:           0.65 to 0.76
```
<!-- leetllm: output:end -->

Notice the symmetry with the previous lesson: a <span data-glossary="confidence-interval">confidence interval</span> asks which rates $p$ are compatible with an observed sample, while a binomial simulator fixes $p$ and generates the samples it produces.

```checkpoint
What is the difference between `p = 0.72` and a sampled batch rate of `0.68`?
---
`p = 0.72` is the assumed long-run resolution probability in the simulator. `0.68` is one finite batch generated under that assumption. A different batch can land above or below `0.72`.
```

## Categorical: one route per request

When a request maps to exactly one of $K$ mutually exclusive labels whose weights sum to `1.0`, a single draw follows a **categorical distribution**, and the vector of label counts across 500 independent requests follows a **multinomial distribution**:

| Route | Probability | Expected count in 500 requests |
|---|---:|---:|
| `ci_failure` | 0.45 | 225 |
| `test_fix` | 0.20 | 100 |
| `code_review` | 0.20 | 100 |
| `log_triage` | 0.15 | 75 |

Draw 500 independent routes with `rng.choice` and compare sampled counts against expectations:

<!-- leetllm: test, output=show, output_title="Categorical route sample" -->
```python title="sample-intent-routing.py"
import numpy as np

intents = ["ci_failure", "test_fix", "code_review", "log_triage"]
probabilities = np.array([0.45, 0.20, 0.20, 0.15])
requests = 500

assert np.isclose(probabilities.sum(), 1.0)

rng = np.random.default_rng(21)
sampled = rng.choice(intents, size=requests, p=probabilities)
expected = {
    intent: int(requests * probability)
    for intent, probability in zip(intents, probabilities)
}
observed = {intent: int(np.sum(sampled == intent)) for intent in intents}

print("expected counts:", expected)
print("sampled counts: ", observed)
print("all labels known:", set(sampled).issubset(intents))
```

<!-- leetllm: output:start -->
```text title="Categorical route sample" output compact
expected counts: {'ci_failure': 225, 'test_fix': 100, 'code_review': 100, 'log_triage': 75}
sampled counts:  {'ci_failure': 230, 'test_fix': 97, 'code_review': 102, 'log_triage': 71}
all labels known: True
```
<!-- leetllm: output:end -->

Counts fluctuate slightly around `[225, 100, 100, 75]` while always summing to 500 and staying strictly inside the declared route vocabulary.[^numpyParallelRandom2026]

## Poisson counts, then a bursty counterexample

For nonnegative counts such as tool calls per request, a **Poisson distribution** with rate $\lambda$ assigns probability:

$$
P(C=k) = \frac{\lambda^k e^{-\lambda}}{k!}
$$

At $\lambda = 2.2$, the probability of exactly two calls is $2.2^2 e^{-2.2} / 2 \approx 0.268$, and `scipy.stats.poisson` gives the full table plus the costly tail `P(C > 5)`:

<!-- leetllm: test, deps=scipy, output=show, output_title="Poisson count probabilities" -->
```python title="poisson-tool-call-probabilities.py"
from scipy.stats import poisson

dist = poisson(mu=2.2)

for k in range(5):
    print(f"P(calls = {k}): {dist.pmf(k):.3f}")

print(f"P(calls > 5): {dist.sf(5):.3f}")
```

<!-- leetllm: output:start -->
```text title="Poisson count probabilities" output compact
P(calls = 0): 0.111
P(calls = 1): 0.244
P(calls = 2): 0.268
P(calls = 3): 0.197
P(calls = 4): 0.108
P(calls > 5): 0.025
```
<!-- leetllm: output:end -->

Poisson carries a rigid structural constraint: its mean and <span data-glossary="variance">variance</span> must both equal $\lambda$.[^nist2012poisson] Real tool-calling agents routinely violate this when ordinary queries take `1` to `2` calls while difficult debugging loops trigger `10+` calls, creating **overdispersion** (variance much larger than the mean).

Compare a steady `Poisson(2.2)` stream against a mixture of `88%` ordinary requests (`Poisson(1.2)`) and `12%` complex debugging requests (`Poisson(10.0)`). Both share nearly the exact same mean (`2.20` vs `2.256`), yet their variance and costly tails diverge dramatically:

<!-- leetllm: test, output=show, output_title="Poisson fit diagnostic" -->
```python title="challenge-poisson-tool-calls.py"
import numpy as np

rng = np.random.default_rng(31)
steady = rng.poisson(2.2, size=5_000)
rates = np.where(rng.random(5_000) < 0.12, 10.0, 1.2)
bursty = rng.poisson(rates)


def report(name: str, counts: np.ndarray) -> None:
    average = float(np.mean(counts))
    variance = float(np.var(counts))
    above_five = float(np.mean(counts > 5))
    print(
        f"{name:>6}: mean={average:.2f} variance={variance:.2f} "
        f"variance/mean={variance / average:.2f} share>5={above_five:.3f}"
    )


report("steady", steady)
report("bursty", bursty)
```

<!-- leetllm: output:start -->
```text title="Poisson fit diagnostic" output compact
steady: mean=2.24 variance=2.19 variance/mean=0.98 share>5=0.025
bursty: mean=2.24 variance=10.15 variance/mean=4.52 share>5=0.113
```
<!-- leetllm: output:end -->

| Metric | Steady Poisson ($\lambda = 2.2$) | Bursty Mixture ($88\% \text{ Poisson}(1.2) + 12\% \text{ Poisson}(10)$) | Diagnosis |
|---|---:|---:|---|
| Sample Mean | 2.24 calls | 2.24 calls | Averages look identical |
| Sample Variance | 2.19 | 10.15 | Mixture variance is `4.6x` larger |
| Variance / Mean ratio | 0.98 | 4.52 | Violates Poisson's equal-mean-variance law |
| Costly tail (`> 5` calls) | 2.5% | 11.3% | `4.5x` as many expensive requests |

> **Key insight:** Matching the mean of count data hides bursty tails. Check the variance-to-mean ratio (dispersion index) and the share above your cost threshold, and switch to a mixture or negative binomial model when variance far exceeds the mean.

```checkpoint
Why isn't a Poisson distribution automatically correct for agent tool calls just because tool calls are counts?
---
Poisson is a useful first count model, but it assumes the variance matches the mean. Agent retries and difficult request clusters can create much larger variance and a heavier expensive tail. Check the observed count shape before relying on the baseline.
```

## Lognormal response time

Response times are strictly positive and right-skewed: most requests finish quickly while a long tail stretches out. A variable $T$ is **lognormal** when $\log T \sim \mathcal{N}(\mu, \sigma^2)$. Setting $\mu = \ln(6)$ and $\sigma = 0.55$ gives a 6-second median and a `6.98`-second mean:[^nistLognormal2012]

$$
\text{median}(T) = e^\mu
\qquad
E[T] = e^{\mu + \sigma^2/2}
$$

To find $F_T(10)$, convert 10 seconds to a log-space z-score:

$$
z = \frac{\log 10 - \log 6}{0.55} = \frac{\log(10/6)}{0.55} \approx 0.93
$$

The standard normal CDF gives $\Phi(0.93) \approx 0.823$ (`82.3%` finish within 10 seconds), and the 95th percentile z-score `1.645` puts p95 at $\exp(\ln 6 + 0.55 \times 1.645) \approx 14.83$ seconds.

> **Common mistake:** Passing `6.0` as `mu` to `rng.lognormal(mu, sigma)` sets the median to $e^6 \approx 403$ seconds, not 6 seconds. Pass `np.log(6.0)` to NumPy, or pass the median directly through `scale=6.0` in `scipy.stats.lognorm(s=sigma, scale=6.0)`.

<!-- leetllm: test, deps=scipy, output=show, output_title="Positive response-time sample" -->
```python title="sample-lognormal-response-time.py"
import numpy as np
from scipy.stats import lognorm

median_seconds = 6.0
sigma = 0.55
mu = float(np.log(median_seconds))

rng = np.random.default_rng(44)
response_seconds = rng.lognormal(mu, sigma, size=5_000)

print(f"target median seconds: {median_seconds:.2f}")
print(f"sample median seconds: {np.median(response_seconds):.2f}")
print(f"sample mean seconds:   {np.mean(response_seconds):.2f}")
print(f"sample p95 seconds:    {np.percentile(response_seconds, 95):.2f}")
print(f"nonpositive values:    {int(np.sum(response_seconds <= 0))}")
print(f"model P(T <= 10):      {lognorm(s=sigma, scale=median_seconds).cdf(10):.3f}")
```

<!-- leetllm: output:start -->
```text title="Positive response-time sample" output compact
target median seconds: 6.00
sample median seconds: 6.00
sample mean seconds:   7.05
sample p95 seconds:    14.89
nonpositive values:    0
model P(T <= 10):      0.823
```
<!-- leetllm: output:end -->

Reporting median (`6.00`s) alongside p95 (`14.89`s) reveals the slow tail that a bare mean (`7.05`s) hides. What goes wrong if you use an ordinary normal curve for durations instead?

## A normal model can go negative

A normal distribution spans $(-\infty, +\infty)$. With mean `8` seconds and <span data-glossary="standard-deviation">standard deviation</span> `6` seconds, nearly a tenth of simulated durations fall below zero:

<!-- leetllm: test, output=show, output_title="Invalid latency model" -->
```python title="reject-negative-response-time.py"
import numpy as np

rng = np.random.default_rng(44)
bad_response_seconds = rng.normal(8.0, 6.0, size=5_000)

print(f"minimum seconds:    {np.min(bad_response_seconds):.2f}")
print(f"share below zero:   {np.mean(bad_response_seconds < 0):.3f}")
print(f"p95 seconds:        {np.percentile(bad_response_seconds, 95):.2f}")
print(f"sample mean:        {np.mean(bad_response_seconds):.2f}")

assert np.any(bad_response_seconds < 0)
```

<!-- leetllm: output:start -->
```text title="Invalid latency model" output compact
minimum seconds:    -13.09
share below zero:   0.088
p95 seconds:        17.91
sample mean:        8.08
```
<!-- leetllm: output:end -->

Clipping negative draws to zero creates an artificial spike at `0.0` instead of fixing the shape. Use a positive-support family (lognormal, Gamma, Weibull) or resample empirical traces directly.

## Exponential service time

An **exponential distribution** models the duration of a constant-rate process ($\mu$ completions per second, mean $1/\mu$). Consider a fast single-server step with $\mu = 20$ completions/s (mean `0.05` s = `50` ms):

$$
f_S(s) = \mu e^{-\mu s}, \qquad F_S(s) = P(S \leq s) = 1 - e^{-\mu s}, \qquad s \geq 0
$$

The survival probability past `0.10` s is $P(S > 0.10) = e^{-20 \times 0.10} \approx 0.135$. Because the hazard rate is constant, the exponential distribution is **memoryless**: having already waited 50 ms gives no information about how much longer remains.[^murphy2012][^bishop2006] Watch the API convention: Python's `random.expovariate(mu)` takes the rate $\mu = 20$, while NumPy's `rng.exponential(scale=1/mu)` and SciPy's `expon(scale=1/mu)` take the mean duration `0.05`.[^numpyParallelRandom2026]

<!-- leetllm: test, deps=scipy, output=show, output_title="Exponential service-time baseline" -->
```python title="sample-exponential-service-time.py"
import numpy as np
from scipy.stats import expon

rate_per_second = 20.0
scale_seconds = 1 / rate_per_second
rng = np.random.default_rng(66)
service_seconds = rng.exponential(scale=scale_seconds, size=5_000)

print(f"target mean seconds: {scale_seconds:.3f}")
print(f"sample mean seconds: {np.mean(service_seconds):.3f}")
print(f"P(S > 0.10) formula: {expon(scale=scale_seconds).sf(0.10):.3f}")
print(f"sample share > 0.10: {np.mean(service_seconds > 0.10):.3f}")
print(f"min seconds: {np.min(service_seconds):.6f}")

assert np.all(service_seconds >= 0)
```

<!-- leetllm: output:start -->
```text title="Exponential service-time baseline" output compact
target mean seconds: 0.050
sample mean seconds: 0.050
P(S > 0.10) formula: 0.135
sample share > 0.10: 0.137
min seconds: 0.000012
```
<!-- leetllm: output:end -->

## More draws reduce simulation noise

**Monte Carlo simulation** approximates an expected value or tail probability by averaging repeated random draws. Under independent Bernoulli draws with $p = 0.72$, standard error shrinks as $\sqrt{p(1-p)/N}$: multiplying draws by `100` (from `100` to `10,000`) cuts simulation noise by `10x` (from `0.045` to `0.0045`):

<!-- leetllm: test, output=show, output_title="Monte Carlo convergence" -->
```python title="measure-monte-carlo-wobble.py"
import numpy as np

rng = np.random.default_rng(55)
p_resolved = 0.72

for batch_size in [100, 1_000, 10_000]:
    repeated_rates = rng.binomial(batch_size, p_resolved, size=2_000) / batch_size
    print(
        f"N={batch_size:>5}: mean={np.mean(repeated_rates):.3f} "
        f"sd_of_rates={np.std(repeated_rates):.4f}"
    )
```

<!-- leetllm: output:start -->
```text title="Monte Carlo convergence" output compact
N=  100: mean=0.719 sd_of_rates=0.0454
N= 1000: mean=0.720 sd_of_rates=0.0140
N=10000: mean=0.720 sd_of_rates=0.0047
```
<!-- leetllm: output:end -->

Budget your draws for the rarest event you need to see. If a failure has probability $q = 0.0001$, a `5,000`-request run expects only `0.5` failures and sees zero failures `(1 - q)^5000 ≈ 60.7%` of the time:

<!-- leetllm: test, output=show, output_title="Rare-event draw budget" -->
```python title="budget-rare-event-draws.py"
import numpy as np

q = 0.0001
draws = 5_000
miss_probability = (1 - q) ** draws
draws_for_detection = int(np.ceil(np.log(0.05) / np.log1p(-q)))

print(f"expected failures: {draws * q:.2f}")
print(f"probability of zero failures: {miss_probability:.3f}")
print(f"draws for 95% chance of at least one failure: {draws_for_detection:,}")
```

<!-- leetllm: output:start -->
```text title="Rare-event draw budget" output compact
expected failures: 0.50
probability of zero failures: 0.607
draws for 95% chance of at least one failure: 29,956
```
<!-- leetllm: output:end -->

Seeing at least one failure with `95%` confidence already takes `29,956` draws (expecting ~3 failures), and estimating $q$ precisely takes far more.

## Recorded seeds replay a stream

Seeding a pseudo-random generator makes a simulation deterministic within the same environment and library version.[^pythonRandom2026] For parallel replicas, never pass the same seed to multiple workers (which would duplicate identical draws). Instead, spawn independent child streams from one root `np.random.SeedSequence`:[^numpyParallelRandom2026]

<!-- leetllm: test, output=show, output_title="Reproducible replica streams" -->
```python title="replay-replica-rng-streams.py"
import numpy as np

root_seq = np.random.SeedSequence(2026)
child_seqs = root_seq.spawn(2)
replica_one, replica_two = (np.random.default_rng(s) for s in child_seqs)
counts_one = replica_one.binomial(20, 0.72, size=4)
counts_two = replica_two.binomial(20, 0.72, size=4)

replay_seqs = np.random.SeedSequence(2026).spawn(2)
replay_one, replay_two = (np.random.default_rng(s) for s in replay_seqs)
replayed_one = replay_one.binomial(20, 0.72, size=4)
replayed_two = replay_two.binomial(20, 0.72, size=4)

print("replica 1:", counts_one.tolist())
print("replica 2:", counts_two.tolist())
print("replay matches:", bool(np.array_equal(counts_one, replayed_one) and np.array_equal(counts_two, replayed_two)))

assert np.array_equal(counts_one, replayed_one)
assert np.array_equal(counts_two, replayed_two)
```

<!-- leetllm: output:start -->
```text title="Reproducible replica streams" output compact
replica 1: [15, 18, 11, 14]
replica 2: [14, 16, 11, 11]
replay matches: True
```
<!-- leetllm: output:end -->

## Sample a posterior when direct draws aren't available

Conjugate models like the `Beta(10, 4)` posterior from [Bayesian Inference from Evidence](/learn/bayesian-inference-priors-posteriors) have closed-form samplers. Hierarchical models with interacting skill and task-difficulty parameters rarely do: we can evaluate the unnormalized density $\tilde{\pi}(p)$, not the normalizing constant.

<span data-glossary="markov-chain-monte-carlo">Markov chain Monte Carlo (MCMC)</span> builds a dependent chain of states whose stationary distribution is the target posterior.[^murphy2012] At each step, **<span data-glossary="metropolis-hastings">Metropolis-Hastings</span>** proposes a candidate $p'$ from the current state $p$. For a symmetric proposal (such as a Gaussian step centered at $p$), the unknown normalizing constant cancels in the acceptance probability:[^hastings1970mcmc]

$$
a(p,p')=\min\left(1,\frac{\pi(p')}{\pi(p)}\right)
$$

(An asymmetric proposal multiplies this ratio by the reverse-to-forward proposal density ratio $q(p \mid p') / q(p' \mid p)$.)

Check the ratio on `Beta(10, 4)`, where $\pi(0.6) / \pi(0.5) \approx 2.642$: uphill moves to `0.6` accept with probability `1.0`, while downhill moves back to `0.5` accept with probability `1 / 2.642 = 0.379` (rejected at uniform draw `u = 0.4`):

<!-- leetllm: test, deps=scipy, output=show, output_title="Metropolis-Hastings acceptance check" -->
```python title="inspect-metropolis-hastings-acceptance.py"
from scipy.stats import beta

target = beta(10, 4)
forward_ratio = float(target.pdf(0.6) / target.pdf(0.5))
reverse_ratio = 1.0 / forward_ratio
comparison = 0.4

print(f"forward acceptance: {min(1.0, forward_ratio):.3f}")
print(f"reverse acceptance: {min(1.0, reverse_ratio):.3f}")
print(f"reverse accepted at u=0.4: {comparison < reverse_ratio}")
```

<!-- leetllm: output:start -->
```text title="Metropolis-Hastings acceptance check" output compact
forward acceptance: 1.000
reverse acceptance: 0.379
reverse accepted at u=0.4: False
```
<!-- leetllm: output:end -->

When a proposal is rejected, record the current state again (discarding rejections alters the stationary distribution). Evaluate log-densities to avoid underflow, discard early **warmup** steps, and launch four chains from dispersed starting points to check whether they converge to the exact posterior mean `10/14 = 0.714`:

<!-- leetllm: test, deps=scipy, output=show, output_title="Posterior chain checks" -->
```python title="sample-beta-posterior-with-metropolis.py"
import numpy as np
from scipy.stats import beta

target = beta(10, 4)


def sample_chain(seed: int, start: float, warmup: int = 2_000, kept: int = 10_000):
    rng = np.random.default_rng(seed)
    current = start
    draws = np.empty(kept)
    accepted = 0
    for step in range(warmup + kept):
        proposal = current + rng.normal(0.0, 0.15)
        log_ratio = float(target.logpdf(proposal) - target.logpdf(current))
        if np.log(rng.random()) <= min(0.0, log_ratio):
            current = proposal
            if step >= warmup:
                accepted += 1
        if step >= warmup:
            draws[step - warmup] = current  # keep repeats after rejection
    return draws, accepted / kept


for seed, start in enumerate([0.1, 0.4, 0.7, 0.95], start=101):
    draws, acceptance = sample_chain(seed, start)
    lag_one = float(np.corrcoef(draws[:-1], draws[1:])[0, 1])
    print(f"start={start:.2f} mean={draws.mean():.3f} acceptance={acceptance:.3f} lag1={lag_one:.3f}")
    assert abs(draws.mean() - target.mean()) < 0.02
print(f"exact posterior mean: {target.mean():.3f}")
```

<!-- leetllm: output:start -->
```text title="Posterior chain checks" output compact
start=0.10 mean=0.712 acceptance=0.636 lag1=0.730
start=0.40 mean=0.715 acceptance=0.645 lag1=0.722
start=0.70 mean=0.713 acceptance=0.642 lag1=0.717
start=0.95 mean=0.714 acceptance=0.634 lag1=0.724
exact posterior mean: 0.714
```
<!-- leetllm: output:end -->

All four chains converge to `0.712` to `0.715`, yet lag-1 <span data-glossary="autocorrelation">autocorrelation</span> is `~0.72`: consecutive draws are strongly correlated, so `10,000` correlated MCMC draws carry far less information than `10,000` independent draws.

<details>
<summary>Deep dive: MCMC diagnostics (ESS, R-hat) and Gibbs sampling</summary>

Production MCMC tools track <span data-glossary="effective-sample-size">effective sample size (ESS)</span> to measure how many independent draws a correlated chain is worth, alongside rank-normalized split **R-hat** to verify that chains started at different points mix into the same distribution.[^stanPosteriorAnalysis2026] When full conditional distributions are known in closed form, **<span data-glossary="gibbs-sampling">Gibbs sampling</span>** updates one parameter at a time by drawing directly from its conditional distribution given the rest (a special case of Metropolis-Hastings with acceptance probability 1).

</details>

## Waiting time when the server fills up

Sampling response times in isolation ignores contention. If three requests arrive at `0`, `10`, and `20` ms and each needs `50` ms on one server, they finish at `50`, `100`, and `150` ms, spending `50`, `90`, and `130` ms in the system solely because of **queueing delay**.

In any stable queueing system, **Little's Law** links average concurrency $L$, arrival rate $\lambda$, and mean time in system $W$:

$$
L = \lambda W
$$

For an **M/M/1** queue (memoryless Poisson arrivals at rate $\lambda$, exponential service at rate $\mu$, single FIFO server, and $\rho = \lambda/\mu < 1$), mean total time $W$ and mean queue wait $W_q$ are:[^mitQueueingTheory2026]

$$
W = \frac{1}{\mu - \lambda}
\qquad
W_q = \frac{\lambda}{\mu(\mu - \lambda)}
$$

Watch what happens at a fixed `50` ms service time ($\mu = 20$ req/s) as utilization approaches `100%`:

| Arrivals $\lambda$ | Utilization $\rho$ | Total time $W$ | Queue time $W_q$ |
|---:|---:|---:|---:|
| 15 req/s | 0.75 | 0.20 s | 0.15 s |
| 19 req/s | 0.95 | 1.00 s | 0.95 s |

Pushing utilization from `75%` to `95%` multiplies average latency by `5x` (`0.20`s to `1.00`s) without the server getting any slower, and at $\lambda \ge \mu$ no finite steady-state mean exists.

## Score a candidate with the CDF

Compare any candidate distribution against held-out traces using Q-Q plots (which highlight tail divergence) and the **empirical CDF** $F_n(t)$, the fraction of requests finishing by deadline $t$.

Watch out for **right-censored** timeouts: if `160` of `250` requests finish within 10 s, `40` finish between 10 and 15 s, and `50` time out unfinished at 15 s, dropping timeouts inflates the 10-second completion rate from `0.64` to `0.80` and hides the fact that true completion p95 sits beyond 15 s:[^scipyCensoredData2026]

<!-- leetllm: test, output=show, output_title="Timeouts change the denominator" -->
```python title="keep-censored-requests-in-the-population.py"
import numpy as np

cohort = np.array([160, 40, 50])  # <=10s, (10s, 15s], unfinished >15s
completed = int(cohort[:2].sum())
requests = int(cohort.sum())

print(f"completed-only fraction by 10s: {cohort[0] / completed:.2f}")
print(f"all-request fraction by 10s: {cohort[0] / requests:.2f}")
print(f"unfinished fraction at 15s: {cohort[2] / requests:.2f}")
```

<!-- leetllm: output:start -->
```text title="Timeouts change the denominator" output compact
completed-only fraction by 10s: 0.80
all-request fraction by 10s: 0.64
unfinished fraction at 15s: 0.20
```
<!-- leetllm: output:end -->

Always keep censored requests in the denominator and use censoring-aware survival estimators rather than treating timeout deadlines as completed durations.

For uncensored samples, the **Kolmogorov-Smirnov (KS) distance** $D$ measures the largest vertical gap between the empirical CDF $F_n$ and a candidate CDF $F$:

$$
D = \sup_t \left| F_n(t) - F(t) \right|
$$

(When candidate parameters are fitted on the same sample rather than fixed beforehand, compute KS p-values via parametric bootstrap, as in SciPy's `goodness_of_fit`.[^scipyGoodnessOfFit2026]) Below, compare our lognormal candidate against a normal candidate sharing the exact same mean (`6.98`s) and standard deviation (`4.15`s) on 200 lognormal traces:

<!-- leetllm: test, deps=scipy, output=show, output_title="KS distance challenge" -->
```python title="ks-distance-challenge.py"
import numpy as np
from scipy.stats import kstest, lognorm, norm

mu = np.log(6.0)
sigma = 0.55
rng = np.random.default_rng(88)
observed_traces = rng.lognormal(mean=mu, sigma=sigma, size=200)

true_lognormal = lognorm(s=sigma, scale=np.exp(mu))
normal_mean = float(true_lognormal.mean())
normal_std = float(true_lognormal.std())

d_norm = kstest(observed_traces, norm(loc=normal_mean, scale=normal_std).cdf).statistic
d_log = kstest(observed_traces, true_lognormal.cdf).statistic

print(f"normal D:    {d_norm:.3f}")
print(f"lognormal D: {d_log:.3f}")
print(f"normal mean: {normal_mean:.2f}s  std: {normal_std:.2f}s")
```

<!-- leetllm: output:start -->
```text title="KS distance challenge" output compact
normal D:    0.159
lognormal D: 0.051
normal mean: 6.98s  std: 4.15s
```
<!-- leetllm: output:end -->

The lognormal gap (`0.051`) is less than one-third the normal gap (`0.159`), exposing the skewness mismatch even when mean and standard deviation are identical.

## Build a launch-simulation report

Assemble all four distributions into an **independent-field baseline** simulator for 5,000 requests:

<!-- leetllm: test, output=show, output_title="Agent launch simulation report" -->
```python title="build-agent-launch-report.py"
import numpy as np


def simulate_coding_agent(seed: int, n_requests: int) -> dict[str, float]:
    rng = np.random.default_rng(seed)
    resolved = rng.binomial(1, 0.72, size=n_requests)

    intents = ["ci_failure", "test_fix", "code_review", "log_triage"]
    intent_probs = [0.45, 0.20, 0.20, 0.15]
    routed = rng.choice(intents, p=intent_probs, size=n_requests)

    tool_calls = rng.poisson(2.2, size=n_requests)
    response_seconds = rng.lognormal(mean=np.log(6.0), sigma=0.55, size=n_requests)

    return {
        "resolution_rate": float(resolved.mean()),
        "test_fix_share": float(np.mean(routed == "test_fix")),
        "mean_tool_calls": float(tool_calls.mean()),
        "share_over_5_tools": float(np.mean(tool_calls > 5)),
        "median_seconds": float(np.median(response_seconds)),
        "p95_seconds": float(np.percentile(response_seconds, 95)),
        "nonpositive_times": float(np.sum(response_seconds <= 0)),
    }


report = simulate_coding_agent(seed=7, n_requests=5_000)
for name, value in report.items():
    print(f"{name:>20}: {value:.3f}")

assert report["nonpositive_times"] == 0
assert report["p95_seconds"] > report["median_seconds"]
```

<!-- leetllm: output:start -->
```text title="Agent launch simulation report" output compact
     resolution_rate: 0.722
      test_fix_share: 0.195
     mean_tool_calls: 2.228
  share_over_5_tools: 0.023
      median_seconds: 5.973
         p95_seconds: 15.064
   nonpositive_times: 0.000
```
<!-- leetllm: output:end -->

Notice what this independent baseline leaves out: it draws each field separately, so hard routes never correlate with extra tool calls or slower responses. To model coupled fields, use **conditional sampling** (draw route first, then draw tool calls and latency from route-specific parameters).

Watch how identical marginal distributions can produce completely different joint tail risk depending on how fields pair up:

<!-- leetllm: test, output=show, output_title="Same marginals, different joint risk" -->
```python title="check-joint-expensive-and-slow.py"
import numpy as np

tools = np.array([1, 1, 6, 6])
aligned_seconds = np.array([2, 2, 20, 20])
reversed_seconds = np.array([20, 20, 2, 2])


def joint_share(counts: np.ndarray, seconds: np.ndarray) -> float:
    return float(np.mean((counts > 5) & (seconds > 15)))


assert np.array_equal(np.sort(aligned_seconds), np.sort(reversed_seconds))
print(f"aligned expensive-and-slow:  {joint_share(tools, aligned_seconds):.2f}")
print(f"reversed expensive-and-slow: {joint_share(tools, reversed_seconds):.2f}")
```

<!-- leetllm: output:start -->
```text title="Same marginals, different joint risk" output compact
aligned expensive-and-slow:  0.50
reversed expensive-and-slow: 0.00
```
<!-- leetllm: output:end -->

Both datasets have identical marginal histograms, means, and percentiles, yet their joint expensive-and-slow share jumps from `0.00` to `0.50`. Checking marginals alone misses joint resource spikes.

## Next tokens: categorical draws, temperature scaling, and the Gumbel-Max trick

That same categorical distribution drives every step of LLM decoding, scaled up to a vocabulary of `50,000` to `128,000+` tokens. The model outputs one unnormalized **<span data-glossary="logits">logit</span>** per candidate <span data-glossary="token">token</span>, **<span data-glossary="softmax">softmax</span>** converts logits into a categorical probability vector, and the decoder draws one token.[^goodfellow2016]

Try a four-word continuation for `The sky is`: `blue` has the highest probability (`0.604`), while sampling can still draw `clear` (`0.300`):

<!-- leetllm: test, deps=scipy, output=show, output_title="Tiny token distribution" -->
```python title="sample-one-token-from-logits.py"
import numpy as np
from scipy.special import softmax

tokens = np.array(["blue", "clear", "cloudy", "green"])
logits = np.array([2.2, 1.5, 0.2, -1.5])

probabilities = softmax(logits)
rng = np.random.default_rng(5)
chosen = rng.choice(tokens, p=probabilities)

for token, probability in zip(tokens, probabilities):
    print(f"{token:>8}: {probability:.3f}")
print("sampled token:", chosen)
print("probabilities sum to one:", bool(np.isclose(probabilities.sum(), 1.0)))
```

<!-- leetllm: output:start -->
```text title="Tiny token distribution" output compact
    blue: 0.604
   clear: 0.300
  cloudy: 0.082
   green: 0.015
sampled token: clear
probabilities sum to one: True
```
<!-- leetllm: output:end -->

`blue` is the **mode** (what greedy decoding always picks), while random sampling selected `clear`.

### Reshaping entropy with temperature scaling

Before applying softmax, decoders divide logits by a positive **temperature** $T > 0$ ($\tilde{z}_i = z_i / T$), reshaping entropy while keeping the token ranking intact:

- **Low temperature ($T = 0.3$):** stretches logit gaps by $3.33\times$, lifting `blue` from `60.4%` to `91.1%` (with `clear` still at `8.8%`). As $T \to 0$, probability concentrates on the maximum logit (greedy decoding).
- **Baseline temperature ($T = 1.0$):** applies softmax to the raw logits.
- **High temperature ($T = 2.0$):** shrinks logit gaps, dropping `blue` to `44.8%` and lifting `green` to `7.1%`; as $T \to \infty$, the distribution flattens toward uniform (`25%` each).

### GPU-parallel sampling with the Gumbel-Max trick

How can a GPU sample from `128,000` logits without building a serial cumulative-probability search? The **Gumbel-Max trick** turns categorical sampling into elementwise noise plus a parallel argmax. Draw independent standard Gumbel noise for every vocabulary slot:

$$
g_i = -\ln(-\ln(u_i)), \qquad u_i \sim \text{Uniform}(0, 1)
$$

Add $g_i$ to the temperature-scaled logits and take the maximum:

$$
i^* = \operatorname{argmax}_i \left( \frac{z_i}{T} + g_i \right)
$$

Remarkably, token $k$ wins this race with its exact softmax probability ([Gumbel-Max derivation](https://arxiv.org/pdf/1611.01144)):

$$
P\left(\operatorname{argmax}_i \left( \frac{z_i}{T} + g_i \right) = k\right) = \frac{\exp(z_k / T)}{\sum_j \exp(z_j / T)}
$$

> **Key insight:** Gumbel-Max (and the algebraically equivalent exponential-race formulation used in GPU inference kernels) expresses discrete categorical sampling as an elementwise noise addition followed by a single parallel reduction. Hard argmax is non-differentiable; training with gradients uses the continuous **Gumbel-Softmax** relaxation instead.

<figure>
  <img src="illustrations/_generated/distribution_workflow_dark.png" alt="Temperature changes blue's probability to 91.1% at T=0.3, 60.4% at T=1, and 44.8% at T=2. The T=0.3 distribution still gives clear 8.8% probability; at T=2, blue remains most likely while probability spreads across all four words. At T=1, the sampled Gumbel draw makes clear win with score 3.75 over blue's 2.97. Independent Gumbel draws reproduce the softmax categorical law in the mathematical model." />
  <figcaption>Lower temperature sharpens mass onto the highest-logit token while higher temperature spreads it out. In the bottom panel (T = 1), Gumbel noise pushes `clear` (1.50 + 2.25 = 3.75) ahead of `blue` (2.20 + 0.77 = 2.97), so `clear` wins that draw.</figcaption>
</figure>

Verify the equivalence across `10,000` vectorized Gumbel draws at `T = 1.0` and `T = 0.3`:

<!-- leetllm: test, deps=scipy, output=show, output_title="Gumbel-Max sampling verification" -->
```python title="gumbel-max-token-sampling.py"
import numpy as np
from scipy.special import softmax

tokens = ["blue", "clear", "cloudy", "green"]
logits = np.array([2.2, 1.5, 0.2, -1.5])

rng = np.random.default_rng(42)
n_draws = 10_000

for temp in [1.0, 0.3]:
    expected_probs = softmax(logits / temp)
    perturbed = logits / temp + rng.gumbel(size=(n_draws, len(logits)))
    samples = np.argmax(perturbed, axis=1)
    observed_shares = np.bincount(samples, minlength=len(tokens)) / n_draws

    print(f"Temperature T={temp:.1f}:")
    for token, p_exp, p_obs in zip(tokens, expected_probs, observed_shares):
        print(f"  {token:>8}: softmax={p_exp:.3f}  gumbel_share={p_obs:.3f}")
```

<!-- leetllm: output:start -->
```text title="Gumbel-Max sampling verification" output compact
Temperature T=1.0:
      blue: softmax=0.604  gumbel_share=0.608
     clear: softmax=0.300  gumbel_share=0.296
    cloudy: softmax=0.082  gumbel_share=0.081
     green: softmax=0.015  gumbel_share=0.015
Temperature T=0.3:
      blue: softmax=0.911  gumbel_share=0.909
     clear: softmax=0.088  gumbel_share=0.090
    cloudy: softmax=0.001  gumbel_share=0.001
     green: softmax=0.000  gumbel_share=0.000
```
<!-- leetllm: output:end -->

For open-ended text generation, <span data-glossary="top-p">nucleus sampling</span> (top-$p$) truncates the unreliable low-probability tail and renormalizes the remaining tokens before sampling.[^holtzman2020]

## Keep the simulation honest

| Quantity | Distribution | Summary | Diagnostic check |
|---|---|---|---|
| Autonomous resolution | Bernoulli | rate | are requests independent with stationary `p`? |
| Request route | categorical | proportions | does the support cover every real route label? |
| Tool calls | Poisson baseline | mean and share `> 5` | is `variance / mean ≈ 1`, or overdispersed? |
| Response time | lognormal baseline | median and p95 | strictly positive support, KS/Q-Q fit, timeouts kept? |
| Next token | categorical (softmax) | token and probabilities | temperature, top-$p$, and seed recorded? |

## Practice: challenge a candidate launch model

A teammate proposes this assistant simulator:

| Quantity | Proposed model | Claim |
|---|---|---|
| resolution | Bernoulli with `p = 0.78` | 78% resolves automatically |
| request type | categorical with no `log_triage` label | covers incoming requests |
| tool calls | Poisson with mean `2.0` | estimates tool cost |
| response time | normal with mean `7` s and std `8` s | estimates p95 latency |

Check four diagnostics:

1. Which parameter requires empirical estimation from real logs?
2. Which support violation or missing state breaks the simulator immediately?
3. What count diagnostic tests the Poisson tool-call assumption?
4. Which latency summaries belong in the report?

```checkpoint
What is a strong answer to the practice review?
---
The resolution probability needs evidence from a representative set of requests. The categorical model is missing `log_triage`, so it can't represent every stated route. Tool-call counts should be checked for overdispersion by comparing variance with mean and reporting the share above a costly threshold. A normal response-time model can create negative seconds when spread is large; use a positive baseline and report median plus p95.
```

```mastery-quiz
[
  {
    "question": "A proposed duration is uniform from 0 to 0.25 seconds. You inspect the interval [0.05, 0.15] and then invert uniform rank 0.8. Which density, interval probability and sampled time are consistent?",
    "options": [
      "Density 4/s; interval probability 0.40; sampled time 0.20 s.",
      "Density 0.25/s; interval probability 0.025; sampled time 0.20 s.",
      "Density 4/s; interval probability 0.40; sampled time 0.80 s.",
      "Density 4/s; interval probability 0.10; sampled time 0.20 s."
    ],
    "answer": "Density 4/s; interval probability 0.40; sampled time 0.20 s.",
    "explanation": "Density is reciprocal width, 1/0.25=4 per second. The interval area is 0.10×4=0.40. The quantile is 0.25×0.8=0.20 seconds."
  },
  {
    "question": "An independent binary-failure simulator assumes q=0.002 and draws 500 requests. Which expected count, zero-failure probability and interpretation follow?",
    "options": [
      "Expected 1; P(zero)≈0.135; a quiet run is compatible with q.",
      "Expected 1; P(zero)≈0.368; one detected failure estimates q precisely.",
      "Expected 1; P(zero)≈0.368; a quiet run is compatible with q.",
      "Expected 1; P(zero)≈0.135; one detected failure estimates q precisely."
    ],
    "answer": "Expected 1; P(zero)≈0.368; a quiet run is compatible with q.",
    "explanation": "The count is binomial with mean 500×0.002=1 and zero-event probability (1−0.002)^500≈0.3675, so a zero-failure run is routine under q=0.002."
  },
  {
    "question": "A route sampler declares exactly {CI, review, test_fix}; all six outputs use those labels. The same requests have tools [1,1,1,8,8,8] and seconds [2,2,2,18,18,18]. Pairing A aligns the lists; pairing B reverses seconds. What are the expensive (>5 tools) and slow (>15 s) joint shares, and what did the valid labels prove?",
    "options": [
      "A 0.50; B 0.50; valid route support determines the joint law.",
      "A 0.50; B 0; valid route support determines the joint law.",
      "A 0.50; B 0.50; valid route support leaves the joint law untested.",
      "A 0.50; B 0; valid route support leaves the joint law untested."
    ],
    "answer": "A 0.50; B 0; valid route support leaves the joint law untested.",
    "explanation": "Alignment pairs all three eight-tool requests with eighteen seconds (3/6 = 0.50); reversal separates them (0). Valid route labels check marginal support only and leave cross-field dependence untested."
  },
  {
    "question": "Several representative count batches have mean 4 and variance 20, with a costly threshold at more than 9 calls. A one-rate Poisson baseline has lambda=4. Which next assessment addresses the observed mismatch?",
    "options": [
      "Ratio 5; fit Poisson lambda 20 with mean 4; inspect costly-tail share.",
      "Ratio 5; investigate mixtures/retries; inspect counts and costly-tail share.",
      "Ratio 0.2; retain lambda 4; inspect arrival independence and costly share.",
      "Ratio 5; fit Poisson lambda 4 with variance 20; inspect costly-tail share."
    ],
    "answer": "Ratio 5; investigate mixtures/retries; inspect counts and costly-tail share.",
    "explanation": "Poisson ties variance to mean, so variance/mean = 20/4 = 5 signals strong overdispersion from mixtures or retries and calls for checking the costly-tail share directly."
  },
  {
    "question": "A duration model needs median 5 seconds with log-space spread 0.4. A separate exponential service model needs mean 0.125 seconds. Which parameter pair matches Python lognormvariate(mu,sigma) and NumPy exponential(scale)?",
    "options": [
      "Lognormal mu=5.0, sigma=0.40; exponential scale=8.0000.",
      "Lognormal mu=log(5), sigma=0.4; exponential scale=8.",
      "Lognormal mu=log(5), sigma=0.4; exponential scale=0.125.",
      "Lognormal mu=log(5)−0.08, sigma=0.4; exponential scale=0.125."
    ],
    "answer": "Lognormal mu=log(5), sigma=0.4; exponential scale=0.125.",
    "explanation": "The lognormal median is exp(mu), so mu=log(5). NumPy exponential takes mean service time as scale=0.125, whereas Python expovariate takes the reciprocal rate 8."
  },
  {
    "question": "For an independent Bernoulli model, increase each batch from 400 to 6,400 draws. Two workers then replay the identical seeded call sequence. Which standard-error factor and replica interpretation are justified?",
    "options": [
      "Factor 1/16; the copied workers yield two independent batches.",
      "Factor 1/4; the copied workers replay identical data.",
      "Factor 1/4; the copied workers yield two independent batches.",
      "Factor 1/16; the copied workers replay identical data."
    ],
    "answer": "Factor 1/4; the copied workers replay identical data.",
    "explanation": "Increasing N by 16x scales standard error by 1/sqrt(16) = 1/4. Two workers given the exact same seed and call order replay identical numbers rather than independent replicas."
  },
  {
    "question": "An asymmetric Metropolis-Hastings proposal has target ratio 0.4 and reverse/forward proposal-density ratio 0.5. The open-uniform draw is 0.25. Which acceptance probability and retained state follow?",
    "options": [
      "Acceptance 0.2; reject and record the current state again.",
      "Acceptance 0.4; accept and record the proposed state.",
      "Acceptance 0.8; accept and record the proposed state.",
      "Acceptance 0.2; reject and omit this iteration from the chain."
    ],
    "answer": "Acceptance 0.2; reject and record the current state again.",
    "explanation": "The Metropolis-Hastings acceptance probability is min(1, 0.4 × 0.5) = 0.2. Because u = 0.25 > 0.2, reject the proposal and retain the current state in the chain."
  },
  {
    "question": "A stable one-server M/M/1 baseline has lambda=18 requests/s and mu=24 requests/s. Which utilization, mean total time and mean queue time follow, and what happens if lambda reaches 24?",
    "options": [
      "Utilization 0.75; total 0.125 s; queue 0.1667 s; finite mean at 24.",
      "Utilization 0.75; total 0.0417 s; queue 0; finite mean at 24.",
      "Utilization 1.333; total 0.1667 s; queue 0.125 s; no finite mean at 24.",
      "Utilization 0.75; total 0.1667 s; queue 0.125 s; no finite mean at 24."
    ],
    "answer": "Utilization 0.75; total 0.1667 s; queue 0.125 s; no finite mean at 24.",
    "explanation": "Utilization is 18/24 = 0.75, mean total time is 1/(24−18) = 1/6 ≈ 0.1667 s, and mean queue wait is 1/6 − 1/24 = 0.125 s. At lambda = mu = 24, the M/M/1 queue has no finite steady-state mean."
  },
  {
    "question": "A cohort has 200 requests: 120 finish by 8 seconds, another 30 by 12, and 50 are still running at 12. Separately, a model is fitted and ordinary KS-tested on its same 150 completed rows. Which deadline rate, completion-p95 conclusion and KS interpretation follow?",
    "options": [
      "By 8: 0.80; p95 at most 12 seconds; fitted-row KS p-value is calibrated.",
      "By 8: 0.60; p95 beyond 12 and unknown; fitted-row KS distance is descriptive.",
      "By 8: 0.60; p95 equals 12 seconds; fitted-row KS p-value is calibrated.",
      "By 8: 0.80; p95 beyond 12 and unknown; fitted-row KS distance is descriptive."
    ],
    "answer": "By 8: 0.60; p95 beyond 12 and unknown; fitted-row KS distance is descriptive.",
    "explanation": "Keep all 200 requests in the denominator: 120/200 = 0.60. Only 75% completed by 12 s, so true completion p95 sits beyond 12 s and is unobserved. Fitting parameters and dropping censored rows invalidates ordinary fixed-CDF KS p-values."
  },
  {
    "question": "Tokens A/B/C have logits [1.2,0.2,−0.8], temperature 0.5 and given independent standard-Gumbel offsets [0,2.1,0.2]. Which perturbed winner, original mode and operation are consistent?",
    "options": [
      "Winner A; mode A; hard categorical Gumbel-Max sample.",
      "Winner B; mode B; hard categorical Gumbel-Max sample.",
      "Winner B; mode A; hard categorical Gumbel-Max sample.",
      "Winner B; mode A; differentiable Gumbel-Softmax relaxation."
    ],
    "answer": "Winner B; mode A; hard categorical Gumbel-Max sample.",
    "explanation": "Scaling by T=0.5 and adding offsets gives [2.4, 2.5, −1.4], so B wins the hard Gumbel-Max argmax while A remains the pre-noise mode."
  }
]
```

> **Next:** Continue to [Hypothesis Tests, Intervals, and pass@k](/learn/hypothesis-tests-confidence-intervals-passk). You can now simulate Bernoulli pass/fail outcomes and see batch rates wobble even when the generating probability is fixed. The next lesson turns that wobble into a decision rule for whether one model is actually better than another, including <span data-glossary="pass-at-k">pass@k</span> under a fixed sampling budget.
