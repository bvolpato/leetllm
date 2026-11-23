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

A small engineering assistant helps teams with CI failures, <span data-glossary="rollback">rollbacks</span>, code reviews, and log triage. A launch review asks for 5,000 simulated requests before traffic arrives. Each request contributes four measurements: it either resolves or escalates, takes one route, makes a nonnegative number of tool calls, and takes a positive number of seconds.

Now choose how to draw those four values. A wrong choice can make an average look reasonable while hiding retry bursts, producing impossible negative latency, or inventing a route that never appears in the taxonomy. Before trusting a simulator, name the claim behind each draw and the trace that could falsify it.

In [Statistics and Uncertainty](/learn/statistics-estimation-uncertainty), 16 abuse labels out of 100 reviewed flags became a point estimate plus an interval. That asked how much a finite sample supports one unknown rate. Simulation reverses the direction: start with a process, draw new samples, and ask whether the resulting traces look like the system you intend to model.

A <span data-glossary="probability-distribution">probability distribution</span> specifies the allowed values of a random quantity and how probability is assigned to them. A launch review fails if a draw can be negative, invent a route, or hide a retry burst. Write down the allowed values first, then check the frequencies and tails the simulator actually produces.

The numbers below are **planning assumptions**. A real launch would estimate them from logged, reviewed traffic. The Python examples use NumPy's `default_rng` and SciPy's `scipy.stats`, matching real evaluation pipelines. Record library versions along with the seed, because sampling algorithms can change between major releases.[^numpyParallelRandom2026]

## Four measurements from one request

| Quantity from one request | Example value | Value shape | First simulation model | Summary to report |
|---|---:|---|---|---|
| Resolved without a human | `1` or `0` | binary | Bernoulli | resolution rate |
| Request route | `ci_failure`, `rollback`, `code_review`, `log_triage` | one label | categorical | label mix |
| Tool calls made | `0`, `1`, `2`, ... | count | Poisson baseline | mean and share above a cost threshold |
| End-to-end response time | `7.4` seconds | positive continuous | lognormal baseline | median and <span data-glossary="p95-latency">p95</span> |

The **first simulation model** column is a claim about shape, not a default. If <span data-glossary="tracing">traces</span> disagree, you revise the model instead of defending the convenient formula.

## Discrete values versus continuous time

The first split is between **discrete** and **continuous** quantities.

| Kind | Meaning | In the incident assistant |
|---|---|---|
| Discrete | values are separate outcomes you can enumerate | resolved or escalated, one intent label, number of tool calls |
| Continuous | values live on a measured range | response time in seconds |

For a discrete quantity you can ask for the probability of one exact value, such as `P(tool_calls = 2)`. For a continuous response time, one infinitely precise instant has probability zero under the model. Ask for a range or a percentile instead: `P(time > 15 seconds)` or the p95 response time.

The allowed values are the distribution's **support**. Route labels need a finite set of names, tool calls need nonnegative integers, and response time needs nonnegative seconds. A measured zero may mean a duration was rounded below the clock's resolution; a negative duration is a different problem.

Before sampling, write down four things:

1. What values are allowed?
2. Which parameter sets the rate, center, or spread?
3. Which tail or threshold would hurt users or cost?
4. What observation would prove this model is a poor fit?

For example, ten tool calls may be rare under a baseline but common during retry loops. That observation should change the model, not just the seed.

## PMF, PDF, and CDF

Use the kind of quantity to choose the probability object. For the binary resolution variable `R`, the two masses are `P(R = 0) = 0.28` and `P(R = 1) = 0.72`. A **probability mass function (PMF)** lists those probabilities for each discrete value. The masses add to `1`.

Response time needs different language. A **probability density function (PDF)** describes how densely probability is spread across possible times; area over an interval gives its probability. Its height isn't the probability of one exact time and may exceed `1`. For instance, a uniform duration between `0` and `0.5` seconds has density `2` per second, but total area `2 × 0.5 = 1`.

A **cumulative distribution function (CDF)** gives the chance of finishing by a deadline. Let `T` mean response time and `t` the chosen deadline:

$$
F_T(t) = P(T \leq t)
$$

Read the CDF as an operations question: `F_T(10)` is the chance a response finishes within 10 seconds, while `1 - F_T(15)` is the chance it exceeds 15 seconds. For the smooth latency model below, p95 is the time where the CDF reaches `0.95`. Discrete distributions have CDFs too, but those rise in steps and can jump past `0.95`.[^murphy2012]

A chart or API that says "probability" is easy to misread. A PMF bar *is* a probability. A PDF curve needs an interval before it becomes one. A CDF's height is already accumulated probability.

The [probability chapter](/learn/probability-for-machine-learning) treated a distribution as a function over a known sample space. Naming a response-time family still doesn't produce a duration. How does a computer turn one uniform random number into a simulated time?

## Inverse CDF transform: how computers sample continuous variables

Start from uniform draws, $U \sim \text{Uniform}(0, 1)$. A pseudo-random generator provides finite-precision floating-point values that approximate this mathematical input. It can also generate random bits and integers.

The **inverse CDF transform**, or inverse-transform sampling, maps uniform draws through a distribution's quantile function. If $F$ is strictly increasing over its support, this is its ordinary inverse. A continuous CDF can also have flat regions, so the general definition is $F^{-1}(u) = \inf\{t : F(t) \geq u\}$, the first point where the CDF reaches the chosen probability. This generalized inverse works for discrete distributions too.

With an ideal uniform draw and the exact quantile function, $T = F^{-1}(U)$ follows the target distribution:

$$
P(F^{-1}(U) \leq t) = P(U \leq F(t)) = F(t)
$$

The **probability integral transform** runs in the other direction: for a draw $T$ from a continuous CDF $F$, the value $F(T)$ is uniform. The two constructions are related, but they aren't the same operation. Numerical quantile implementations and finite-precision RNGs approximate the ideal sampling statement.[SciPy's numerical inversion documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.sampling.NumericalInverseHermite.html) describes this distinction in practice.

To see how that works analytically, consider an exponential service duration with completion rate $\mu$:

$$
F(s) = 1 - e^{-\mu s} = u \implies e^{-\mu s} = 1 - u \implies s = -\frac{\ln(1 - u)}{\mu}
$$

Because $1 - u$ is also distributed uniformly on $(0, 1)$, code can draw $u \sim \text{Uniform}(0, 1)$ and compute $s = -\ln(u) / \mu$. For a lognormal variable with median $e^\mu$ and log-spread $\sigma$, you invert standard normal noise: draw $u$, find the standard normal quantile $z = \Phi^{-1}(u)$, and exponentiate: $t = \exp(\mu + \sigma z)$.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="A Bernoulli probability mass function assigns 28% to escalation and 72% to resolution. A lognormal cumulative distribution maps uniform draws to positive response times: u = 0.50 reaches the 6.0-second median, and u = 0.95 reaches the 14.8-second p95. The final 5% of uniform draws maps to response times at or beyond 14.8 seconds." />
  <figcaption>Bernoulli bars show exact outcome masses. The lognormal CDF maps uniform draw levels on the vertical scale to response times on the horizontal scale: u = 0.50 reaches the 6.0-second median, and u = 0.95 reaches the 14.8-second p95. The top 5% of uniform draws maps to the response-time tail beyond that threshold.</figcaption>
</figure>

Notice the geometry in the plot: where the CDF is steep (near the 6-second median), a wide swath of uniform draws projects into a narrow slice of time. Where the CDF flattens out (the right tail), a tiny 5% sliver of uniform draws ($u \in [0.95, 1.0]$) stretches out across all latencies beyond 14.8 seconds.

Inverting 5,000 uniform draws maps them close to the theoretical 0.05-second exponential mean, the 6.0-second lognormal median, and the 14.83-second p95 threshold. Because NumPy's `rng.uniform` can emit `0.0` while `norm.ppf` requires `0 < u < 1`, clip the lower endpoint using `np.finfo(float).tiny` instead of passing exact zero.

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

Begin with the smallest distribution. Let `R = 1` if the assistant resolves a request without a human, and `R = 0` if it escalates. The planning value is `p = 0.72`.

| Outcome | `R` | Probability |
|---|---:|---:|
| escalation | 0 | 0.28 |
| resolved | 1 | 0.72 |

The <span data-glossary="expected-value">expected value</span> is:

$$
E[R] = 0 \times 0.28 + 1 \times 0.72 = 0.72
$$

Because `R` is encoded as `0` or `1`, its long-run average *is* the resolution rate. Calculate that weighted average directly:

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

One request is now a coin with a known bias. The next question is what happens when you count many of those coins.

## Binomial: resolutions in a 100-request batch

If you count resolutions across `n = 100` independent requests that all share `p = 0.72`, the count `X` has a **binomial distribution**. A single request is Bernoulli; the sum of these 100 outcomes is binomial.[^nist2012binomial]

Its expected count is `np = 72`, and its variance is `np(1-p) = 20.16`. The count can land anywhere from `0` to `100`, even though `72` is the center of the model.

One particular arrangement of 72 resolutions and 28 escalations has probability `0.72^72 × 0.28^28`. There are many arrangements with that same count. The binomial coefficient $\binom{100}{72}$ counts them, giving:

$$
P(X=72) = \binom{100}{72}(0.72)^{72}(0.28)^{28} \approx 0.089
$$

The binomial model is a sum of independent Bernoulli trials. If requests arrive in correlated incident waves, or if each request has a different resolution probability, this simple count model needs a richer design.

Because each 100-request batch is finite, six sampled rates scatter around `.72` rather than matching it identically. The code checks the binomial formula with `scipy.stats.binom`, then draws six independent 100-request batches with NumPy's `Generator.binomial` while holding `p = 0.72` fixed.

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

A <span data-glossary="confidence-interval">confidence interval</span> from the last chapter uses a finite sample to quantify uncertainty about an unknown rate. A distribution does the opposite: it assumes a process, then generates the samples you might see. The interval asks what the data support; the simulator asks what the assumption would produce.

```checkpoint
What is the difference between `p = 0.72` and a sampled batch rate of `0.68`?
---
`p = 0.72` is the assumed long-run resolution probability in the simulator. `0.68` is one finite batch generated under that assumption. A different batch can land above or below `0.72`.
```

Binary resolution is only one label. Real traffic is split across several routes.

## Categorical: one route per request

An incident-assistant request isn't always binary. It may be exactly one of several route labels. For this planning mix:

| Intent | Probability | Expected count among 500 requests |
|---|---:|---:|
| ci failure | 0.45 | 225 |
| rollback | 0.20 | 100 |
| code review | 0.20 | 100 |
| log triage | 0.15 | 75 |

The four probabilities sum to `1.00` because every request receives one route in this simplified taxonomy. A categorical distribution draws one of those labels according to the given weights.

One request gives one categorical outcome. If 500 requests are independent and use this same route mix, the four counts together follow a **multinomial distribution**. Their sum must be 500, so the counts aren't independent of one another. Using `rng.choice` draws all 500 independent route labels directly from the categorical probabilities.

In any finite draw of 500 requests, the observed counts will fall near `225`, `100`, `100`, and `75` without hitting those exact averages. Sampling variation is the behavior we want to inspect.

<!-- leetllm: test, output=show, output_title="Categorical route sample" -->
```python title="sample-intent-routing.py"
import numpy as np

intents = ["ci_failure", "rollback", "code_review", "log_triage"]
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
expected counts: {'ci_failure': 225, 'rollback': 100, 'code_review': 100, 'log_triage': 75}
sampled counts:  {'ci_failure': 230, 'rollback': 97, 'code_review': 102, 'log_triage': 71}
all labels known: True
```
<!-- leetllm: output:end -->

The sampled counts need not equal the expectations; that discrepancy is ordinary sampling variation. An unknown label such as `database_restore` would be a different failure, showing that either the route taxonomy or the sampler configuration is wrong. Keeping explicit probability weights in `rng.choice` makes the planning mix clear at a glance.[^numpyParallelRandom2026]

Routes tell you *what kind* of request arrived. Tool calls tell you how expensive that request was to serve.

## Poisson counts, then a bursty counterexample

Tool calls are counts. A simple baseline is a Poisson distribution with parameter `lambda`, written $\lambda$. If `lambda = 2.2`, the simulated agent makes `2.2` tool calls per request on average.

With a mean of `2.2`, a Poisson model predicts about `26.8%` of requests will make exactly two calls. To calculate that value, let `C` denote the count and `k` one nonnegative integer. In the formula below, `k!` means the factorial (`2! = 2 × 1`), and `e` is the base of natural logarithms:

$$
P(C=k) = \frac{\lambda^k e^{-\lambda}}{k!}
$$

With $\lambda = 2.2$ and $k = 2$:

$$
P(C=2) = \frac{2.2^2 e^{-2.2}}{2} = \frac{4.84 \times e^{-2.2}}{2} \approx 0.268
$$

The loop below prints a few more masses, including the expensive tail `P(C > 5)`.

<!-- leetllm: test, deps=scipy, output=show, output_title="Poisson count probabilities" -->
```python title="poisson-tool-call-probabilities.py"
from scipy.stats import poisson

dist = poisson(mu=2.2)


def poisson_probability(k: int) -> float:
    if k < 0:
        raise ValueError("k must be nonnegative")
    return float(dist.pmf(k))


for k in range(5):
    print(f"P(calls = {k}): {poisson_probability(k):.3f}")

share_above_5 = float(dist.sf(5))
print(f"P(calls > 5): {share_above_5:.3f}")

try:
    poisson_probability(-1)
except ValueError as error:
    print(error)
```

<!-- leetllm: output:start -->
```text title="Poisson count probabilities" output compact
P(calls = 0): 0.111
P(calls = 1): 0.244
P(calls = 2): 0.268
P(calls = 3): 0.197
P(calls = 4): 0.108
P(calls > 5): 0.025
k must be nonnegative
```
<!-- leetllm: output:end -->

The Poisson model makes a stronger claim than "counts can't be negative." Its mean and <span data-glossary="variance">variance</span> are both $\lambda$.[^nist2012poisson] A Poisson process produces such counts in a fixed exposure window when events arrive independently at a constant rate. Tool calls within a request aren't automatically such a process: the agent often decides its next call based on a previous result. Here Poisson is a candidate count distribution, not a fact implied by the data type.

An agent can break that assumption. A difficult rollback may trigger a deploy lookup, a runbook lookup, a retry, and a handoff together. Those bursts create **overdispersion**, where variance is much larger than the mean.

Both streams in the next comparison have a mean near `2.2`. The mixed stream uses ordinary requests 88% of the time and hard requests 12% of the time. Its exact expected count is `0.88 × 1.2 + 0.12 × 10 = 2.256`, close to the baseline's `2.2`.

Under a true Poisson process, the variance-to-mean ratio stays close to `1`, and the share above five calls lands near `.025`. Sampling with NumPy's `Generator.poisson` shows how mixing low-rate and high-rate streams blows up the variance and tail risk even when the averages match.

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

| Metric | Steady Poisson ($\lambda = 2.2$) | Bursty Mixture ($88\% \text{ Poisson}(1.2) + 12\% \text{ Poisson}(10)$) | Operational Diagnosis |
|---|---:|---:|---|
| Theoretical Mean | 2.20 calls | 2.256 calls | Averages appear almost identical |
| Sample Variance | 2.20 | 10.66 | Mixture variance is nearly $5\times$ higher |
| Variance / Mean ratio | 0.98 | 4.65 | The mixture breaks the single-Poisson variance assumption |
| Costly tail ($> 5$ calls) | 2.5% | 11.5% | About $4.6\times$ as many requests cross the count threshold |

The mixed sample has both excess variance and a larger expensive-tail share. It doesn't identify a retry storm: this simulator chooses request types independently and has no temporal clustering. Overdispersion alone doesn't determine every tail probability, and a tiny sample can have an unstable variance estimate. Inspect the count frequencies and the actual threshold you care about. Also separate request types or incident waves before deciding whether one distribution should describe them all.

```checkpoint
Why isn't a Poisson distribution automatically correct for agent tool calls just because tool calls are counts?
---
Poisson is a useful first count model, but it assumes the variance matches the mean. Agent retries and difficult request clusters can create much larger variance and a heavier expensive tail. Check the observed count shape before relying on the baseline.
```

Counts are only half of the cost story. The other half is how long the request occupies a worker.

## Lognormal response time

End-to-end response time can't be negative. Some requests can also take much longer than the typical request, forming a **right tail**. A lognormal distribution is one candidate for positive, right-skewed values; positivity alone does not imply that it's the right family.

A **normal distribution** is the familiar symmetric bell-shaped model, described by a mean and standard deviation. A variable is **lognormal** when its natural logarithm is normal. For this example, take the logarithm of the numerical duration expressed in seconds.

Both NumPy's `rng.lognormal(mu, sigma)` and Python's standard-library `random.lognormvariate(mu, sigma)` take the mean and standard deviation of those **log values**, not of the durations. Set `mu = log(6)` for a six-second median and `sigma = 0.55` for log-space spread. This gives a mean near `6.98` seconds. The conversion rules are:[^nistLognormal2012]

$$
\text{median}(T) = e^\mu
\qquad
E[T] = e^{\mu + \sigma^2/2}
$$

To find `F_T(10)`, measure how many log-space standard deviations 10 seconds lies above the center. This standardized distance is a **z-score**:

$$
z = \frac{\log 10 - \log 6}{0.55} = \frac{\log(10/6)}{0.55} \approx 0.93
$$

The normal CDF with mean zero and standard deviation one gives about `0.823` at this z-score. Thus roughly 82% finish within 10 seconds. Its 95th-percentile z-score is about `1.645`, so the model's p95 is `exp(log(6) + 0.55 × 1.645) ≈ 14.83` seconds. A finite sample will usually stay close to those population targets without hitting either value on the nose.

> **⚠️ Common mistake:** Passing `6.0` as `mu` does *not* make the median six seconds. It makes the median $e^{6} \approx 403$ seconds. NumPy's `Generator.lognormal(mean, sigma)` uses the same log-space `mean`, while `scipy.stats.lognorm(s=sigma, scale=median_seconds)` passes the median directly through `scale`.

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

The median describes a typical request. p95 tells you about a noticeably slow slice. Reporting only the mean would hide how long the slow responses take. These lognormal draws stayed positive. What happens if a familiar bell curve, whose support includes negative numbers, is used for a duration instead?

## A normal model can go negative

The normal distribution's support extends across the whole real line. It can model signed quantities, such as a measurement error around zero. It can also approximate a positive quantity when the chance of a negative draw is negligible for the task, but that needs checking.

With mean `8` seconds and <span data-glossary="standard-deviation">standard deviation</span> `6` seconds, negative response times are far from negligible. Generate 5,000 durations and check support before accepting the plausible-looking mean or p95:

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

This normal model puts roughly a tenth of the sample below zero, which is physically impossible for a duration. Clipping every negative draw to zero would create a pile of zero-duration requests and alter the distribution rather than validating a fit. A positive family, a justified truncated model, or sampling representative empirical durations are alternatives to evaluate against actual traces.

Even a plausible distribution for isolated durations misses another source of latency: waiting behind other requests. First distinguish time spent doing work from time spent in a queue.

## Exponential service time

An **exponential distribution** models a duration with a constant completion rate, conditional on not having finished yet. It's the waiting-time distribution between arrivals in a constant-rate Poisson process. Using it for service time is a separate modeling assumption.

For a toy single-server service, let `S` be service time and `μ = 20` completions per second when the server is busy. The mean duration is `1 / 20 = 0.05` seconds. This 50 ms service is a separate queueing example, not a new parameter for the six-second agent response-time model.

Its density and CDF are:

$$
f_S(s) = \mu e^{-\mu s}, \qquad F_S(s) = P(S \leq s) = 1 - e^{-\mu s}, \qquad s \geq 0
$$

At 20 requests per second, `P(S > 0.10) = e^{-20 \times 0.10} \approx 0.135`. The distribution is **memoryless**: after a request has already taken 50 ms, its remaining service-time distribution is still the same as at the start. This makes it a useful queueing baseline. Real tool work can depend on elapsed time and request state.[^murphy2012][^bishop2006]

At 20 completions per second, 5,000 exponential draws concentrate around a `0.05`-second mean and leave about `0.135` above `0.10` seconds. Notice the parameter convention: `Random.expovariate(mu)` takes the **rate** `μ`, whereas NumPy's `Generator.exponential` and SciPy's `scipy.stats.expon` take the mean duration as `scale = 1 / μ`. Passing `20` as `scale` instead of `0.05` makes the mean 400 times larger. Although exact zero has probability zero in the mathematical model, a finite-precision sampler can return it, so the support check allows zero.[^numpyParallelRandom2026]

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

The sample follows the chosen model. It doesn't show that real service times are exponential. Repeated simulation can estimate a model's tail probability more precisely without improving the model's fit to reality.

## More draws reduce simulation noise

Monte Carlo simulation means using repeated random samples to approximate a quantity you care about. Here the quantity is the resolution rate, estimated from repeated simulated batches.

For `N = 100` independent Bernoulli requests with `p = 0.72`, the batch-rate standard deviation is `sqrt(0.72 × 0.28 / 100) ≈ 0.045`. With `N = 10,000`, it's about `0.0045`. This is the earlier standard-error formula: `sqrt(p(1-p)/N)`. Multiplying the sample size by 100 divides this uncertainty by 10, not by 100.

Across the three batch sizes (`100`, `1,000`, and `10,000`), those theoretical standard deviations drop from roughly `.045` to `.014` and `.0045`. That scaling shows Monte Carlo convergence under the assumed process; production claims still require fitting or validating the assumption against real traces.

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

Simulation answers a conditional question: "What happens if these assumptions are the generating process?" It doesn't validate `p = 0.72`, `lambda = 2.2`, or the latency parameters. Those must come from data, review design, and production measurement.

The draw budget also depends on the question. Suppose a costly failure has assumed probability `q = 0.0001` per independent request. A 5,000-request simulation expects only `Nq = 0.5` failures. The probability of seeing none is `(1-q)^N`, about 61%. A run with zero failures would be common even under this model.

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

That last budget makes `P(no failures) ≤ 0.05` under the assumed `q`. It gives a chance to detect the event, not a precise estimate of its frequency. Even that budget expects only about three failures. Before interpreting a quiet simulation, check whether it had enough draws to expose the tail you care about.

To investigate a surprising run, record enough information to replay it rather than hoping the next random draw looks better.

## Recorded seeds replay a stream

`Random(seed)` creates a deterministic pseudo-random stream. In the same environment, reusing the seed and draw order recreates a run. Record the code, Python and library versions, parameters, and number of draws too. Sampler algorithms can change across upgrades, so matching seeds alone may produce different results.[^pythonRandom2026]

A seed doesn't make observations independent, and it doesn't repair a wrong model. Independence is a modeling assumption; separate streams help avoid accidentally replaying the same sequence across replicas.

For parallel replications, spawn independent streams from one root `SeedSequence` rather than sharing one generator. Distinct child streams keep workers reproducible without replaying identical pseudo-observations as if they were new evidence.[^numpyParallelRandom2026]

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

Replay is a reproducibility requirement. It also helps inspect a more difficult sampling problem: a Bayesian posterior that can't be sampled directly.

## Sample a posterior when direct draws aren't available

[Bayesian Inference from Evidence](/learn/bayesian-inference-priors-posteriors) updated a Beta(2, 2) prior with eight passes and two failures to obtain an exact Beta(10, 4) posterior. That direct update worked because the prior and likelihood were conjugate. A richer agent model might include several interacting skill parameters or task-difficulty effects without a convenient closed-form posterior.

<span data-glossary="markov-chain-monte-carlo">Markov chain Monte Carlo (MCMC)</span> addresses that harder case by constructing dependent parameter states with the desired posterior as their stationary distribution. Reaching that distribution requires a valid transition rule and adequate exploration; a chain trapped in one region can give misleading estimates. Unlike the independent Monte Carlo draws above, each new state starts from the previous state.[^murphy2012]

<span data-glossary="metropolis-hastings">Metropolis-Hastings</span> proposes a candidate state, then either moves to it or stays at the current state. Start with a concrete comparison: the Beta(10, 4) posterior's unnormalized density is about `2.642` times as high at `0.6` as at `0.5`. With a symmetric proposal, accept the move to `0.6` with probability `1`; accept the reverse move with probability `1 / 2.642 ≈ 0.379`.

Here **symmetric** means the proposal is equally likely in either direction, as with a normal step centered on the current value. If $\pi$ denotes the target density and $p'$ a proposed value, this rule is:[^hastings1970mcmc]

$$
a(p,p')=\min\left(1,\frac{\pi(p')}{\pi(p)}\right)
$$

The unknown normalization constant in $\pi$ cancels in the ratio. The earlier Beta(10, 4) result lets us check the mechanics even though NumPy can sample this posterior directly via `rng.beta(10, 4)`. Its density is proportional to $p^9(1-p)^3$ for `0 < p < 1`. An asymmetric proposal needs an additional reverse-to-forward proposal-density ratio; don't reuse the simplified rule unchanged.

The next cell checks both directions with a fixed uniform draw `0.4`. That value sits below the forward probability `1.000`, so the uphill move accepts, and above `0.379`, so the reverse move rejects. This is a single deterministic check; a complete sampler draws a fresh uniform threshold at every step.

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

A rejection must remain in the chain as another copy of the current state. Keeping only accepted moves would sample a different process. This teaching sampler evaluates SciPy's log density `beta(10, 4).logpdf` to avoid underflow, rejects out-of-range proposals automatically (`-inf` log density outside `[0, 1]`), and compares four starting points with the exact posterior mean:

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

Early **warmup** or **burn-in** states can reflect initialization rather than the posterior. Discarding them addresses initialization; assess later exploration with chain diagnostics. The printed lag-one correlation measures similarity between adjacent draws; it can stay large even when the sample mean looks right.

<span data-glossary="autocorrelation">Autocorrelation</span> reduces the information in many ordinary chains. <span data-glossary="effective-sample-size">Effective sample size</span> estimates precision for a particular quantity relative to independent draws; chain length alone doesn't determine it. Established tools report rank-normalized split **R-hat**, which compares variation within and between chains, alongside effective sample sizes. Passing the loose mean assertion above is a code smoke check against a known answer, not a convergence proof.[^stanPosteriorAnalysis2026]

<span data-glossary="gibbs-sampling">Gibbs sampling</span> instead updates one variable from its conditional distribution given the current values of the others. Exact conditional draws can still produce a strongly correlated chain. Neither method proves that the underlying statistical model represents the real system.

Posterior-sampling diagnostics qualify uncertainty about model parameters. They still say nothing about queues, which is where isolated latency samples go wrong.

## Waiting time when the server fills up

A simulation that samples latency in isolation ignores how requests interact. Suppose three requests arrive at `0`, `10`, and `20` ms, and each needs `50` ms on one server. The first starts immediately. The second waits until `50` ms, and the third until `100` ms. Their total times are therefore `50`, `90`, and `130` ms, even though each does the same amount of work.

That is **queueing delay**: time waiting to start, separate from service time. A probabilistic queueing model adds random arrivals and service durations to this same mechanism.

**Little's Law** states that the average number of requests in a stable system $L$ equals the arrival rate $\lambda$ times the average time $W$ a request spends in the system:

$$
L = \lambda W
$$

For an **M/M/1** baseline, assume constant-rate Poisson arrivals, independent exponential service times, one server, first-come-first-served processing, unlimited waiting space, and no abandonment. The two `M`s denote the memoryless arrival and service models. At a steady arrival rate of 15 requests per second and a service rate of 20 per second, the server is busy on average `15 / 20 = 75%` of the time.

Write utilization as $\rho = \lambda / \mu$. A steady-state distribution requires $\lambda < \mu$. Here $\lambda$ counts arrivals per second; the earlier tool-count parameter `2.2` counted calls per request. The same Greek letter doesn't imply the same units.[^mitQueueingTheory2026]

Average total time in the system $W$ and average time waiting in the queue $W_q$ are:

$$
W = \frac{1}{\mu - \lambda}
\qquad
W_q = \frac{\lambda}{\mu(\mu - \lambda)}
$$

As utilization approaches 100%, both quantities rise sharply. Consider a service with a mean service time of 50 ms ($\mu = 20$ requests/second):

| Arrivals $\lambda$ | Utilization $\rho$ | Total time $W$ | Queue time $W_q$ |
|---:|---:|---:|---:|
| 15 req/s | 0.75 | 0.20 s | 0.15 s |
| 19 req/s | 0.95 | 1.00 s | 0.95 s |

The service time stays at 50 ms in both rows, but moving from 75% to 95% utilization lifts average total time from 0.20 to 1.00 seconds. Queueing, not slower work, caused the jump.

These are steady-state averages, not predictions for a three-request burst or a p99 latency. At or above `λ = μ`, this model has no finite steady-state mean waiting time; plugging those values into the formula is invalid. Little's Law alone doesn't cause the sharp increase: that shape comes from the M/M/1 assumptions. Real batching, parallel workers, deadlines, and dependent retries need a different queueing model.

Two ways a latency simulator can lie are already on the table: the wrong positive-time family, and a missing queue. The last diagnostic uses the CDF you already have.

## Score a candidate with the CDF

Before using a simulator for planning, compare it with representative held-out traces, including difficult requests and timeouts. A **quantile-quantile (Q-Q) plot** compares observed quantiles against candidate quantiles; disagreement near the high end exposes a tail mismatch. A timeout recorded at its deadline is a censored observation, not necessarily a completed response at exactly that duration.

The **empirical CDF** of a fully observed sample at a deadline is the fraction of durations at or below it. If 160 of 200 responses finish within 10 seconds, and all 200 eventually finish with observed durations, it equals `0.80` there. A candidate CDF of `0.823` has a gap of `0.023` at that deadline.

Now suppose those 200 completions came from 250 requests. Another 50 requests were still unfinished when measurement stopped at a 15-second deadline. These are **right-censored** completion times: each is known to exceed 15 seconds, but its eventual duration is unknown.[^scipyCensoredData2026] The deadline-completion fraction at 10 seconds uses all 250 requests, not just the 200 that finished:

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

Dropping the unfinished requests turns `0.64` into `0.80` and makes latency look better. Because 20% remain unfinished at 15 seconds, this cohort's completion-time p95 lies beyond that deadline; these logs can't identify its actual value. If instead you measure time until the client receives either a response or a timeout, 15 seconds is an observed timeout duration. That's a different quantity from time to completion. Use a censoring-aware fit for completion times, and don't treat the deadline as a completed response time in an ordinary KS test. The shared measurement deadline here is fixed in advance; shorter deadlines assigned to harder requests would require accounting for that selection rule too.

The **Kolmogorov-Smirnov (KS) distance** $D$ takes the largest such vertical gap over all deadlines. In the notation below, `sup` means the largest gap, `F_n` is the empirical CDF, and `F` is the candidate CDF:

$$
D = \sup_t \left| F_n(t) - F(t) \right|
$$

On the same sample, a larger `D` means a larger worst-case CDF discrepancy. It isn't a verdict on every operational risk: two models can differ mainly in a rare tail that contributes little to `D`. Keep your explicit timeout and costly-tail checks.

The ordinary one-sample KS p-value assumes independent observations from a continuous distribution whose parameters were specified in advance. Fitting parameters on the same observations needs a calibration procedure that accounts for fitting, such as a parametric bootstrap. SciPy's `goodness_of_fit` implements this approach.[^scipyGoodnessOfFit2026] This example only calculates distances, not p-values.

This check specifies both candidates first, using the same lognormal planning values as the rest of the chapter, then scores them against 200 positive draws. The normal candidate gets the lognormal's mean and standard deviation, so the comparison tests shape beyond those summaries. The generating lognormal model has lower expected KS distance; either candidate can score lower on a finite sample.

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

The lognormal gap is smaller in this seeded run. A finite sample still gives `D > 0`. This check asks whether our comparison distinguishes the known generating shape from an alternative. Validate against actual service traces before using the model for planning.

## Build a launch-simulation report

Now put the four request fields together. This is deliberately an **independent-field baseline**: it draws each field without conditioning on the others. It has no arrivals, worker limits, or queue, so it describes synthetic requests, not system capacity. Keep that limitation attached to the report.

<!-- leetllm: test, output=show, output_title="Agent launch simulation report" -->
```python title="build-agent-launch-report.py"
import numpy as np


def simulate_incident_agent(seed: int, n_requests: int) -> dict[str, float]:
    if n_requests <= 0:
        raise ValueError("n_requests must be positive")

    rng = np.random.default_rng(seed)
    resolved = rng.binomial(1, 0.72, size=n_requests)

    intents = ["ci_failure", "rollback", "code_review", "log_triage"]
    intent_probs = [0.45, 0.20, 0.20, 0.15]
    routed = rng.choice(intents, p=intent_probs, size=n_requests)

    tool_calls = rng.poisson(2.2, size=n_requests)
    response_seconds = rng.lognormal(mean=np.log(6.0), sigma=0.55, size=n_requests)

    return {
        "resolution_rate": float(resolved.mean()),
        "rollback_share": float(np.mean(routed == "rollback")),
        "mean_tool_calls": float(tool_calls.mean()),
        "share_over_5_tools": float(np.mean(tool_calls > 5)),
        "median_seconds": float(np.median(response_seconds)),
        "p95_seconds": float(np.percentile(response_seconds, 95)),
        "nonpositive_times": float(np.sum(response_seconds <= 0)),
    }


report = simulate_incident_agent(seed=7, n_requests=5_000)
for name, value in report.items():
    print(f"{name:>20}: {value:.3f}")

assert report["nonpositive_times"] == 0
assert report["p95_seconds"] > report["median_seconds"]
```

<!-- leetllm: output:start -->
```text title="Agent launch simulation report" output compact
     resolution_rate: 0.722
      rollback_share: 0.195
     mean_tool_calls: 2.228
  share_over_5_tools: 0.023
      median_seconds: 5.973
         p95_seconds: 15.064
   nonpositive_times: 0.000
```
<!-- leetllm: output:end -->

Use that output as a simulator report. The rate, label mix, count tail, and latency tail are only as credible as their fitted parameters and assumption checks. Validate those assumptions against production data before making operational claims.

This generator samples each field separately from one root state. It therefore treats resolution, route, tool count, and response time as independent once their parameters are fixed.

A shared <span data-glossary="random-number-generator">random-number generator (RNG)</span> makes the run replayable; it doesn't create or prove independence. Real rollback requests may use more tools and take longer. Preserve that relationship with **conditional sampling**, such as drawing route first, then drawing tool count and latency from models for that route.

To see what separate summaries miss, compare two four-request datasets. They have identical tool counts and identical durations, but pair those values differently so we can compare how often a request is both expensive and slow across the two pairings:

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

Every one-field histogram, mean, and percentile is identical between these datasets. Yet the joint threshold shares differ. Matching each marginal distribution separately doesn't validate the relationships among fields, which matter for timeouts and simultaneous resource demand.

Those checks apply to the simulator's fields. The same categorical math appears inside the model that writes the assistant's answer.

## Next tokens: categorical draws, temperature scaling, and the Gumbel-Max trick

The incident-assistant labels form a categorical distribution because one label is selected from a finite list. An LLM uses the same family over a much larger vocabulary. At each step it produces a **<span data-glossary="logits">logit</span>**, an unnormalized score, for each candidate <span data-glossary="token">token</span>. **<span data-glossary="softmax">Softmax</span>** exponentiates those scores and divides by their sum, producing probabilities. A decoder may sample one token from that distribution.[^goodfellow2016]

Take a tiny continuation for the prompt `The sky is`. Four words are enough to see the mechanics: `blue` has the largest probability, while a random draw can still choose `clear`.

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

`blue` is the **mode**, the most probable outcome, while this draw returned `clear`. Greedy decoding would choose `blue`; sampling can select any word with nonzero probability. Subtracting the largest logit before exponentiating prevents overflow for these finite inputs without changing the probability ratios. Displayed rounded probabilities may add to `1.001`; the unrounded values still sum to one.

### Reshaping entropy with temperature scaling

Before feeding logits into softmax, generation runtimes introduce a positive **temperature** parameter $T > 0$ that scales logits: $\tilde{z}_i = z_i / T$.

Dividing logits by temperature alters the distribution's entropy without changing which token has the highest score:

- **Low temperature ($T < 1.0$, such as $T = 0.3$):** Logit gaps stretch wider. Dividing by 0.3 multiplies differences by $3.33\times$. Here `blue` climbs from 60.4% to 91.1%, while `clear` still has about 8.8% probability. This remains sampling. As $T \to 0$, probability concentrates on the highest logit; with a unique maximum, the limit is greedy selection. Tied maxima share the limiting mass unless a separate tie-breaking rule selects one.
- **Baseline temperature ($T = 1.0$):** Softmax evaluates unscaled logits. That does not imply calibration; a model can assign confident probabilities to incorrect continuations.
- **High temperature ($T > 1.0$, such as $T = 2.0$):** Logit gaps shrink. Here `blue` drops to 44.8% and `green` rises to 7.1%. For a fixed finite vocabulary and finite logits, the distribution approaches uniform ($1/4 = 25\%$ here) as $T \to \infty$. At `T=2`, `blue` remains the most likely word. More varied continuations do not by themselves yield better answers or a particular hallucination rate.

### GPU-parallel sampling with the Gumbel-Max trick

On GPU hardware serving thousands of concurrent requests, how does code draw a categorical sample from 128,000 candidate tokens?

One option is to build a cumulative probability array and locate a uniform draw in it. Prefix sums can run in parallel too. Another option is the **Gumbel-Max trick**, which expresses categorical sampling as independent noise plus an argmax. Runtimes choose among kernels based on hardware, vocabulary size, filtering, and reproducibility requirements.

Draw an independent standard Gumbel noise value for each vocabulary token from uniform random numbers:

$$
g_i = -\ln(-\ln(u_i)), \qquad u_i \sim \text{Uniform}(0, 1)
$$

Add that Gumbel noise directly to the temperature-scaled logits, then take the parallel argmax:

$$
i^* = \operatorname{argmax}_i \left( \frac{z_i}{T} + g_i \right)
$$

With independent standard Gumbel draws, token $k$ wins with its softmax probability in the mathematical model:[Gumbel-Max derivation](https://arxiv.org/pdf/1611.01144).

$$
P\left(\operatorname{argmax}_i \left( \frac{z_i}{T} + g_i \right) = k\right) = \frac{\exp(z_k / T)}{\sum_j \exp(z_j / T)}
$$

The transformation can run in parallel, and it also needs random-number generation, logarithms, and a reduction. Measure speed and memory-bandwidth use on the target workload. As checked on October 10, 2026, [vLLM's PyTorch-native sampler](https://github.com/vllm-project/vllm/blob/276fbcff2717bd934cfa37c8a2e4c391f3e7237b/vllm/v1/sample/ops/topk_topp_sampler.py) uses an equivalent exponential-noise race, while eligible filtered CUDA paths can use FlashInfer rejection-sampling kernels. The mathematical distribution can agree while seeded outputs differ between implementations.

The hard argmax here selects a discrete token. It doesn't provide useful gradients through that chosen index. The Gumbel-Softmax training method replaces it with a smooth relaxation; this example uses the categorical sampler, not that relaxation.[Gumbel-Softmax paper](https://arxiv.org/pdf/1611.01144)

<figure>
  <img src="illustrations/_generated/distribution_workflow_dark.png" alt="Temperature changes blue's probability to 91.1% at T=0.3, 60.4% at T=1, and 44.8% at T=2. The T=0.3 distribution still gives clear 8.8% probability; at T=2, blue remains most likely while probability spreads across all four words. At T=1, the sampled Gumbel draw makes clear win with score 3.75 over blue's 2.97. Independent Gumbel draws reproduce the softmax categorical law in the mathematical model." />
  <figcaption>Lower temperature concentrates probability on high-logit words; higher temperature spreads it across more choices. This sampled T=1 Gumbel draw gives `clear` the highest perturbed score. For a fixed noise draw, argmax selects one word; fresh Gumbel draws produce samples according to the softmax distribution.</figcaption>
</figure>

In the bottom panel, word `clear` starts with a lower base logit (1.50) than `blue` (2.20). This draw gives `clear` a +2.25 Gumbel perturbation and `blue` a +0.77 perturbation, moving their scores to 3.75 and 2.97. `clear` therefore wins the argmax. Across thousands of draws, each candidate's empirical win frequency approaches its softmax probability.

The next snippet compares empirical win frequencies across 10,000 vectorized Gumbel draws against the exact softmax probabilities at two temperatures. It illustrates the equivalence rather than proving it; NumPy's `rng.gumbel` handles open-interval bounds internally without dividing by zero.

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

Later chapters teach decoding controls in depth. A sampling decoder doesn't choose from raw logits directly. It draws from a probability distribution derived from those logits. A greedy decoder is different: it selects the highest-probability token instead of drawing a sample. For open-ended text generation, <span data-glossary="top-p">nucleus sampling</span> chooses a dynamic high-probability token set and renormalizes it before sampling, rather than sampling from an unreliable long tail.[^holtzman2020]

## Keep the simulation honest

Before believing output from a random simulator, write down its assumptions:

| Quantity | Model used | Report | Challenge before trusting it |
|---|---|---|---|
| resolved without human | Bernoulli | rate | is one request one binary decision? |
| request route | categorical | proportions | are all real route labels represented? |
| tool calls | Poisson baseline | mean and share above 5 | is variance near mean, or are calls bursty? |
| response time | lognormal baseline | median and p95 | is any time nonpositive, and does the tail resemble traces? |
| next token | categorical from softmax | sampled token and probabilities | does decoding alter the candidate set or distribution? |

The seed also belongs in the report. It makes one simulated run reproducible, but it doesn't make an incorrect model correct.

## Practice: challenge a candidate launch model

A teammate proposes this incident-assistant simulator:

| Quantity | Proposed model | Claim |
|---|---|---|
| resolution | Bernoulli with `p = 0.78` | 78 percent resolves automatically |
| request type | categorical with no `log_triage` label | covers incoming requests |
| tool calls | Poisson with mean `2.0` | estimates tool cost |
| response time | normal with mean `7` seconds and standard deviation `8` seconds | estimates p95 latency |

Write a review with four parts:

1. Name one parameter that needs evidence from logs or reviewed traffic.
2. Identify the impossible or missing state.
3. State one count diagnostic for the tool-call assumption.
4. State which latency summary should appear in the report.

```checkpoint
What is a strong answer to the practice review?
---
The resolution probability needs evidence from a representative set of requests. The categorical model is missing `log_triage`, so it can't represent every stated route. Tool-call counts should be checked for overdispersion by comparing variance with mean and reporting the share above a costly threshold. A normal response-time model can create negative seconds when spread is large; use a positive baseline and report median plus p95.
```

Before trusting a simulator, build a launch-model worksheet from one seeded run. Record each assumed parameter, check labels and support, compare count variance with the mean, and report median, p95, and costly-tail rates. Use the worksheet to reject or revise assumptions before simulated capacity or cost numbers reach a design review.

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
    "explanation": "Density is reciprocal width, 1/0.25=4 per second. The interval area is 0.10×4=0.40. The quantile is 0.25×0.8=0.20 seconds. A PDF height is not a point probability; an exact continuous point still has probability zero."
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
    "explanation": "The count is binomial with mean 500×0.002=1. Its zero-event probability is (1−0.002)^500≈0.3675. An empty finite batch can occur under that assumed rate. At least one detected event and a precise estimate require different budgets; simulated output does not measure production q."
  },
  {
    "question": "A route sampler declares exactly {CI, review, rollback}; all six outputs use those labels. The same requests have tools [1,1,1,8,8,8] and seconds [2,2,2,18,18,18]. Pairing A aligns the lists; pairing B reverses seconds. What are the expensive (>5 tools) and slow (>15 s) joint shares, and what did the valid labels prove?",
    "options": [
      "A 0.50; B 0.50; valid route support determines the joint law.",
      "A 0.50; B 0; valid route support determines the joint law.",
      "A 0.50; B 0.50; valid route support leaves the joint law untested.",
      "A 0.50; B 0; valid route support leaves the joint law untested."
    ],
    "answer": "A 0.50; B 0; valid route support leaves the joint law untested.",
    "explanation": "Alignment pairs all three eight-tool requests with eighteen seconds, giving 3/6. Reversal separates expensive and slow requests, giving zero. The marginal lists and valid route labels are identical. Support checks catch invalid categories; they do not identify request dependence or verify production fit."
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
    "explanation": "Poisson links variance and mean to the same parameter. Here variance/mean=20/4=5, so the persistent excess variance challenges one rate. Request mixtures or retries are possible explanations, not uniquely identified causes. The expensive tail needs its own comparison; a count field does not guarantee a Poisson arrival process."
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
    "explanation": "The lognormal median is exp(mu), so mu=log(5). Subtracting sigma²/2 would instead set the mean to five. NumPy scale is mean service time, 0.125, while a Python expovariate rate would be its reciprocal 8. Parameter units matter before any timing claim."
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
    "explanation": "6,400/400=16, so standard error scales by 1/sqrt(16)=1/4 under the independent model. Identical seeded implementations and call order replay the same stream. Duplicating that stream adds no independent replica information and does not validate the assumed model."
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
    "explanation": "The probability is min(1,0.4×0.5)=0.2. Since 0.25 exceeds it, reject but retain the repeated current state. The symmetric shortcut would omit a necessary proposal factor. The retained chain is dependent; length alone is not an effective sample size or a convergence diagnostic."
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
    "explanation": "Utilization=18/24=0.75. Total mean=1/(24−18)=1/6≈0.1667 s. Subtract service mean 1/24≈0.0417 to get queue mean 0.125 s. At equal arrival and service rates this baseline has no finite steady-state mean. These averages do not give a p99 or a result for arbitrary batching/multiple-server policies."
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
    "explanation": "Use all 200 request identities: 120/200=0.60, while 120/150=0.80 conditions on completion. Only 75% completed by 12, so the cohort completion p95 is beyond 12 and its value is not observed. Fitting and completion selection violate the ordinary fixed-CDF, uncensored calibration; a distance may describe those selected rows but does not repair selection or identify their population tail."
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
    "explanation": "Divide logits by 0.5, then add offsets: [2.4,2.5,−1.4]. B wins this inspected perturbed argmax, while A remains the mode before noise because positive temperature preserves logit order. Hard Gumbel-Max samples the categorical law in the ideal model; differentiable Gumbel-Softmax replaces the hard selection with a continuous relaxation. Parallel form does not imply a particular runtime speed."
  }
]
```

> **Next:** Continue to [Hypothesis Tests, Intervals, and pass@k](/learn/hypothesis-tests-confidence-intervals-passk). You can now simulate Bernoulli pass/fail outcomes and see batch rates wobble even when the generating probability is fixed. The next lesson turns that wobble into a decision rule for whether one model is actually better than another, including <span data-glossary="pass-at-k">pass@k</span> under a fixed sampling budget.
