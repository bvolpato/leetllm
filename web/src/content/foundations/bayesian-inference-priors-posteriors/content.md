---
{
  "id": "bayesian-inference-priors-posteriors",
  "title": "Bayesian Inference from Evidence",
  "slug": "bayesian-inference-priors-posteriors",
  "section": "Math & Statistics",
  "category": "Evaluation & Benchmarks",
  "difficulty": "Easy",
  "order": 6,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": ["OpenAI", "Anthropic", "Google", "Meta"],
  "shortDescription": "Eight passes out of ten looks like an 80% agent. A beta update shows when that rate, the prior, or the sample is actually driving the release call.",
  "keyConceptsTested": ["Bayesian inference", "prior probability", "likelihood", "posterior probability", "beta-binomial conjugacy", "posterior predictive probability", "predictive count uncertainty", "credible intervals", "prior sensitivity", "representative sampling and task-mixture weighting"],
  "prerequisites": ["probability-for-machine-learning"]
}
---

You evaluate a coding agent on ten held-out tasks. It passes eight. That's an observed rate of 80%, but should you trust it to clear a 70% bar on future tasks? With only ten results, chance still matters. Passing eight tasks is not the same question as how much posterior probability sits above 0.7.

[Probability for Machine Learning](/learn/probability-for-machine-learning) introduced base rates and conditioning. <span data-glossary="bayesian-inference">Bayesian inference</span> applies the same reasoning to an unknown model parameter: state which values were plausible before the evaluation, then update those beliefs using the results. The answer is a distribution of plausible success rates, not one adjusted score.[^murphy2012]

We'll use those same eight passes and two failures throughout. Start with a mild preference for middle success rates, then change that preference to see how much the conclusion depends on it.

## Formulating the unknown success parameter

Let $p$ mean the probability that this agent passes a randomly drawn task from the intended deployment population. Pin the agent's model, prompt, tools, retry budget, and pass criterion. One observation is one task evaluated under that fixed policy.

Our simple model treats the outcomes as independent **conditional on $p$**, with the same success probability for each draw. That means: if we knew $p$, knowing one result wouldn't change the probability of another. Tasks can differ in difficulty, but their sampling process must stay the same. Ten handpicked easy tasks won't support a claim about a different production mix.

| Quantity | Question it answers | Worked value |
|---|---|---|
| <span data-glossary="prior-probability">Prior</span> | Which rates were plausible before this eval? | A broad distribution centered at 0.5 |
| Observations | What actually happened? | 8 passes, 2 failures |
| <span data-glossary="likelihood">Likelihood</span> | How probable are the observed results at a candidate rate? | Compare eight passes out of ten at $p=0.5$ and $p=0.8$ |
| <span data-glossary="posterior-probability">Posterior</span> | Which rates are plausible after the update? | More weight near high success rates, with uncertainty remaining |

The direction of conditioning matters. A likelihood asks about the data *given a proposed rate*. A posterior asks about the rate *given the data*. Bayes' rule connects them. They aren't interchangeable.

## Binomial likelihood scores candidate success rates

At a candidate rate of 0.8, each pass contributes a factor of 0.8 and each failure contributes 0.2. One particular sequence of eight passes and two failures has probability $0.8^8 \times 0.2^2$. There are 45 possible positions for the two failures, so the probability of *exactly eight passes*, regardless of order, is 45 times that value.

Python's `comb(10, 8)` counts the 45 unique arrangements of eight passes across ten trials. Evaluating this binomial formula across candidate rates reveals how sharply the observed run separates hypotheses:

<!-- leetllm: test, output=show -->
```python title="compare-candidate-success-rates.py"
from math import comb

for rate in (0.2, 0.5, 0.8):
    likelihood = comb(10, 8) * rate**8 * (1 - rate)**2
    print(f"rate={rate:.1f}: P(exactly 8 passes)={likelihood:.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rate=0.2: P(exactly 8 passes)=0.000074
rate=0.5: P(exactly 8 passes)=0.043945
rate=0.8: P(exactly 8 passes)=0.301990
```
<!-- leetllm: output:end -->

The eight-pass result is about 6.9 times as likely at rate 0.8 as at rate 0.5. That favors 0.8 relative to 0.5, but it doesn't mean there's a 30.2% posterior probability that the rate is 0.8. We haven't combined the evidence with a prior.

For a general candidate rate, the likelihood is $45p^8(1-p)^2$. The factor 45 is the same for every candidate, so it cancels when we normalize the posterior. We can therefore work with a likelihood **proportional to** $p^8(1-p)^2$. The symbol $\propto$ means "equal up to a constant factor."

## Beta distributions quantify prior beliefs

A <span data-glossary="beta-distribution">beta distribution</span> describes uncertainty about a probability between 0 and 1. Its two positive shape parameters, $\alpha$ and $\beta$, control where that uncertainty sits. We'll choose Beta(2, 2): it favors middle rates over near-zero or near-one rates, without ruling out a broad range.

This is an explicit modeling choice. The two prior successes and two prior failures encode an assumption; they are not observed historical outcomes. A uniform Beta(1, 1) prior would give equal density to all rates. Increasing both parameters equally concentrates the distribution around 0.5. These alternatives make it possible to test how much the prior matters.

For a continuous rate, probability belongs to a **range of values**, represented by area under a **density** curve. The height at one point isn't a probability and can exceed 1. Beta(2, 2) has density $6p(1-p)$. The constant 6 makes the total area from 0 to 1 equal to 1.[^scipyBeta2026]

Under these continuous beta priors and posteriors, any single exact rate, including $p=0.8$, has probability zero. A question such as "what is the probability the rate lies between 0.75 and 0.85?" has a nonzero range to integrate over. A discrete prior on a few candidate rates would be a different model.

Bayes' rule multiplies that prior shape by the likelihood, then rescales the result so its total area is 1:

$$
\text{posterior density} \propto \text{prior density} \times \text{likelihood}
$$

For our run, multiplying $p(1-p)$ by $p^8(1-p)^2$ gives $p^9(1-p)^3$. A beta density has the shape $p^{\alpha-1}(1-p)^{\beta-1}$, so the new exponents identify **Beta(10, 4)**. The prior's exponents and the data's exponents add. The observations don't replace the prior.[^bartlett2014betabinomial]

The normalizing denominator is the **evidence**, $P(D)$: the probability of the observed data averaged over the prior. It differs from the likelihood $P(D\mid p)$ at one candidate rate. Here the full prior-times-likelihood product is $270p^9(1-p)^3$. Its area is $270/2860\approx0.0944$. Dividing by that area gives the normalized posterior density $2860p^9(1-p)^3$.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="A Beta(2,2) prior and eight passes plus two failures yield a Beta(10,4) posterior. The likelihood is rescaled to area one solely for plotting, with its peak at 0.80. The posterior's mean is about 0.714, while its density peaks at 0.75; those are different summaries." />
  <figcaption>The prior and posterior are probability densities. The amber likelihood curve is rescaled to area 1 so its shape can share the density axis. Its peak is at 0.80; the posterior density peaks at 0.75 and has mean 0.714.</figcaption>
</figure>

## Beta-binomial conjugacy produces an exact posterior

Now the arithmetic has a reason behind it: $2+8=10$ and $2+2=4$. A beta prior combined with a binomial count likelihood stays in the beta family. This makes beta a <span data-glossary="conjugate-prior">conjugate prior</span> for that likelihood. For any observed data $D$ containing $s$ passes and $f$ failures:

$$
p \mid D \sim \operatorname{Beta}(\alpha+s,\;\beta+f)
$$

Here $\alpha$ and $\beta$ are the prior parameters, $s$ counts observed passes, and $f$ counts observed failures. Substitute the actual numbers:

$$
\operatorname{Beta}(2+8,\;2+2)=\operatorname{Beta}(10,4)
$$

Now take the average of the posterior distribution. For a beta distribution, the posterior mean is:

$$
E[p\mid D]=\frac{\alpha+s}{\alpha+\beta+s+f}=\frac{10}{14}\approx0.714
$$

Observed alone, the empirical pass fraction is $8/10=0.800$. Before seeing any runs, the prior mean was $2/4=0.500$. After the update, the posterior mean resolves to an exact weighted average of those two quantities:

$$
\frac{4}{14}\times0.5 + \frac{10}{14}\times0.8 = \frac{10}{14}
$$

Here the prior holds weight 4 while the empirical runs contribute weight 10. These weights explain the pull toward 0.5. They don't mean anyone actually ran four historical benchmark tasks.

Let's check that arithmetic in code. The cell verifies the updated parameter totals before it prints the forecast.

<!-- leetllm: test, output=show, id=bayesian-agent -->
```python title="update-agent-success-posterior.py"
prior_success = 2
prior_failure = 2
observed_pass = 8
observed_fail = 2

posterior_success = prior_success + observed_pass
posterior_failure = prior_failure + observed_fail
posterior_mean = posterior_success / (posterior_success + posterior_failure)

assert (posterior_success, posterior_failure) == (10, 4)
print(f"observed rate: {observed_pass / (observed_pass + observed_fail):.3f}")
print(f"posterior: Beta({posterior_success}, {posterior_failure})")
print(f"next-task pass probability: {posterior_mean:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
observed rate: 0.800
posterior: Beta(10, 4)
next-task pass probability: 0.714
```
<!-- leetllm: output:end -->

## Forecasting the next run with the posterior predictive

If the next task is comparable, the <span data-glossary="posterior-predictive">posterior predictive probability</span> gives a forecast before it runs. To forecast the outcome of the eleventh task, average each candidate success rate weighted by its posterior credibility. At rate 0.6, the next task has pass probability 0.6. At rate 0.8, it has probability 0.8. Integrating over the entire Beta(10, 4) distribution yields an expected future pass probability equal to the posterior mean, $10/14\approx0.714$.[^bartlett2014betabinomial]

This reflects uncertainty about a *future outcome*. The unknown rate $p$ remains uncertain around the posterior distribution, whose mean is 0.714. If the next task passes, the posterior becomes Beta(11, 4), and the following task's forecast rises to $11/15\approx0.733$. Sequential updates and one combined update give the same parameters when they use the same observations and model.

### Forecast several tasks without freezing the rate

Before either of two new tasks runs, the probability that **both pass** is the posterior average of $p^2$, not the square of the posterior average of $p$:

$$
P(\text{both pass}\mid D)=E[p^2\mid D]
=\frac{10\cdot11}{14\cdot15}\approx0.524
$$

Squaring the one-task forecast gives $(10/14)^2\approx0.510$. The difference is exactly the posterior variance of $p$. The outcomes are independent **given $p$**, but after averaging over our uncertainty about that shared rate, they're dependent in the predictive distribution. A pass is evidence for higher rates, which raises the forecast for the following task. That dependence doesn't mean the tasks were duplicated.

For ten new comparable tasks, average a binomial count distribution over the beta posterior. The result is a **beta-binomial predictive distribution**. It describes how many tasks may pass, while the beta posterior describes the unknown rate.[^scipyBetaBinomial2026] Compare it with a binomial that treats the posterior mean as known:

<!-- leetllm: test, deps=scipy, output=show -->
```python title="future-counts-retain-rate-uncertainty.py"
from scipy.stats import betabinom, binom

a, b, future_tasks = 10, 4, 10
mean_rate = a / (a + b)
print(f"both pass, shared uncertain rate: {a * (a + 1) / ((a + b) * (a + b + 1)):.3f}")
print(f"both pass, rate frozen at mean: {mean_rate**2:.3f}")
for name, distribution in [
    ("posterior predictive", betabinom(future_tasks, a, b)),
    ("rate frozen at mean", binom(future_tasks, mean_rate)),
]:
    print(f"{name}: expected passes={distribution.mean():.3f}, variance={distribution.var():.3f}")
    print(f"P(all ten pass)={distribution.pmf(future_tasks):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
both pass, shared uncertain rate: 0.524
both pass, rate frozen at mean: 0.510
posterior predictive: expected passes=7.143, variance=3.265
P(all ten pass)=0.081
rate frozen at mean: expected passes=7.143, variance=2.041
P(all ten pass)=0.035
```
<!-- leetllm: output:end -->

Both count models have the same expected number of passes. The beta-binomial has greater variance because it includes uncertainty about $p$ as well as randomness of individual outcomes. Use its count probabilities when forecasting a batch before observing its results. A credible interval for $p$ is not an interval for how many tasks that batch will pass.

```checkpoint
Why does the posterior mean equal 10/14 instead of the observed pass rate 8/10?
---
The Beta(2,2) prior contributes parameter weights of 2 and 2. Combining them with eight passes and two failures yields Beta(10,4), whose mean is 10 divided by 14. Those prior weights are assumptions, not extra observed tasks.
```

## Prior sensitivity: when assumptions outweigh small samples

Two engineers can see the same ten outcomes and reach different posterior means because they chose different priors. Hold the observations fixed and vary only the starting assumption.

The next cell reuses the pass and failure counts and compares a weak Beta(1, 1) prior, a moderate Beta(2, 2) prior, and a strong Beta(20, 20) prior. Holding the observed counts fixed while raising the prior parameters reveals how strongly the Beta(20, 20) curve pulls the estimate back toward 0.5.

<!-- leetllm: test, output=show, continue=bayesian-agent -->
```python title="compare-agent-prior-strengths.py"
for success_count, failure_count in [(1, 1), (2, 2), (20, 20)]:
    updated_success = success_count + observed_pass
    updated_total = success_count + failure_count + observed_pass + observed_fail
    print(
        f"Beta({success_count:>2}, {failure_count:>2}) -> "
        f"posterior mean {updated_success / updated_total:.3f}"
    )
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Beta( 1,  1) -> posterior mean 0.750
Beta( 2,  2) -> posterior mean 0.714
Beta(20, 20) -> posterior mean 0.560
```
<!-- leetllm: output:end -->

Beta(20, 20) gives its starting mean a weight of 40, compared with 10 for the new data. The updated mean is therefore $0.8\times0.5+0.2\times0.8=0.56$. That strength needs justification, such as substantial evidence that genuinely applies to this agent and task population.

Relative to a uniform Beta(1, 1) baseline, reaching Beta(20, 20) would require 19 historical passes and 19 historical failures, not 40 observed tasks. Parameter weights are bookkeeping, not records of how historical observations were gathered. Keep those two facts separate.

| Prior | Prior parameter weight | Posterior mean | Interpretation |
|---|---:|---:|---|
| Beta(1, 1) | 2 | 0.750 | Weak symmetric starting assumption |
| Beta(2, 2) | 4 | 0.714 | Mild pull toward 0.5 |
| Beta(20, 20) | 40 | 0.560 | Strong prior dominates ten tasks |

Report several defensible priors when the sample is small. If the deployment decision flips between them, collect more representative evidence instead of quietly choosing the prior that makes the preferred outcome win.

```checkpoint
An engineer claims Beta(20,20) proves that 40 comparable historical tasks were observed. What information is missing?
---
The prior has total parameter weight 40, but that weight isn't automatically 40 observed tasks. Relative to a uniform Beta(1,1) baseline, the same prior could result from 19 historical passes and 19 historical failures. The earlier baseline and the origin of the historical evidence must both be disclosed.
```

## Credible intervals and tail probabilities versus point averages

We still need to answer the original question: how much probability does the rate have of exceeding 0.7? Beta(10, 4) assigns probability on both sides of that threshold, even though its mean is 0.714.

A **90% equal-tailed <span data-glossary="credible-interval">credible interval</span>** leaves 5% of the posterior area below its lower endpoint and 5% above its upper endpoint. The remaining 90% lies between them. These endpoints are the 5th and 95th <span data-glossary="quantile">quantiles</span>, or percentile cutoffs, of the posterior.

SciPy's `beta.ppf` returns those cutoffs. Its `beta.sf(0.7, a, b)` returns the area above 0.7, which directly answers our threshold question.[^scipyBeta2026] Use the same Beta(10, 4) posterior for both calculations:

<!-- leetllm: test, deps=scipy, output=show -->
```python title="credible-interval-and-threshold.py"
from scipy.stats import beta

a, b = 10, 4
lower, upper = beta.ppf([0.05, 0.95], a, b)
prob_above_threshold = beta.sf(0.7, a, b)

print(f"90% credible interval: [{lower:.3f}, {upper:.3f}]")
print(f"P(rate > 0.7 | data): {prob_above_threshold:.3f}")
assert abs((beta.cdf(upper, a, b) - beta.cdf(lower, a, b)) - 0.9) < 1e-10
```

<!-- leetllm: output:start -->
```text title="Output" output compact
90% credible interval: [0.505, 0.887]
P(rate > 0.7 | data): 0.579
```
<!-- leetllm: output:end -->

The interval is `[0.505, 0.887]`, while the posterior probability above 0.7 is `0.579`. Under this prior and model, the remaining 42.1% of posterior probability lies below the release bar. A mean above 0.7 doesn't say how much probability clears that bar.

This interval reflects parameter uncertainty under the chosen prior and binomial model. Tasks themselves don't yield fractional outputs. Each run either succeeds or fails. A frequentist interval would instead be judged by long-run coverage under repeated sampling. That is a different claim, and this chapter does not make it. The question still open is what the same 80% rate does when the sample grows.

Another summary is the posterior <span data-glossary="standard-deviation">standard deviation</span>, which measures spread around the mean. Its square, the <span data-glossary="variance">variance</span>, has a closed form for Beta($a,b$):

$$
\operatorname{Var}(p\mid D)=\frac{ab}{(a+b)^2(a+b+1)}
$$

At Beta(10, 4), the variance is $40/(196\cdot15)\approx0.0136$, and its square root is about 0.117. Use beta quantiles for the interval above. A shortcut such as mean plus or minus two standard deviations does not generally give the intended probability, especially near 0 or 1.

```checkpoint
The posterior mean exceeds 0.7. Does the posterior assign at least 90% probability to rates above 0.7?
---
No. The mean is 0.714, but the posterior area above 0.7 is only about 0.579. The average and the probability of clearing a threshold answer different questions.
```

## Sample size scaling: comparing 8/10 against 80/100

Hold the Beta(2, 2) prior fixed and compare two *alternative sample sizes*: eight passes out of ten and eighty passes out of one hundred. Both observed rates are 0.8. The larger run yields Beta(82, 22), not Beta(90, 24): we're replacing the ten-task example with a hundred-task example, not adding the runs together.

The next independent cell computes both means, standard deviations, and equal-tailed intervals to contrast how the spread changes between 10 and 100 tasks:

<!-- leetllm: test, deps=scipy, output=show -->
```python title="compare-posterior-uncertainty.py"
from math import sqrt
from scipy.stats import beta

for observed_pass, observed_fail in [(8, 2), (80, 20)]:
    a, b = 2 + observed_pass, 2 + observed_fail
    total = a + b
    mean = a / total
    variance = a * b / (total**2 * (total + 1))
    lower, upper = beta.ppf([0.05, 0.95], a, b)
    print(f"Beta({a}, {b}): mean={mean:.3f}, sd={sqrt(variance):.3f}")
    print(f"90% interval: [{lower:.3f}, {upper:.3f}]")
    print(f"P(rate > 0.7 | data): {beta.sf(0.7, a, b):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Beta(10, 4): mean=0.714, sd=0.117
90% interval: [0.505, 0.887]
P(rate > 0.7 | data): 0.579
Beta(82, 22): mean=0.788, sd=0.040
90% interval: [0.720, 0.851]
P(rate > 0.7 | data): 0.981
```
<!-- leetllm: output:end -->

With one hundred tasks, the posterior mean moves to 0.788, and the 90% credible interval narrows to `[0.720, 0.851]`. Posterior probability above 0.7 rises from 57.9% to 98.1%. The observed fractions are both 80%, but the larger sample leaves less parameter uncertainty under the same model.

For the figure, suppose an example release policy requires at least 95% posterior probability that $p>0.7$. This chosen rule illustrates one evidence threshold. Deployment safety also depends on the failure costs, traffic exposure, and remaining controls. Compare each tail probability with 0.95.

<figure>
  <img src="illustrations/_generated/posterior_intervals_dark.png" alt="Two 90% equal-tailed posterior intervals under the same Beta(2,2) prior. Eight passes out of ten gives interval 0.505 to 0.887, mean 0.714, and 57.9% posterior probability above 0.70. Eighty passes out of one hundred gives interval 0.720 to 0.851, mean 0.788, and 98.1% probability above 0.70. Only the larger sample meets the 95% posterior-evidence rule." />
  <figcaption>Both samples observed an 80% pass rate. Under the same Beta(2, 2) prior and the stated model, only the hundred-task result meets the example rule. The bars show 90% credible intervals. The separate 95% rule compares the posterior probability above p = 0.70 with its cutoff to make a one-sided Bayesian decision.</figcaption>
</figure>

More data doesn't remove randomness from individual future tasks. Even if we learned that $p$ was exactly 0.8, a new task could still fail. It also doesn't remove uncertainty caused by a wrong model or an unrepresentative sample.

## Posterior dispersion versus empirical calibration

Posterior spread and <span data-glossary="calibration">calibration</span> answer different questions. The posterior describes uncertainty about a success rate under a chosen model. Calibration asks whether forecasts line up with later outcomes: among many comparable tasks assigned a pass probability near 0.7, do about 70% pass?

A frozen 0.714 forecast cannot verify calibration on the same ten tasks that produced it. Save forecasts *before* later outcomes arrive. Across enough predictions, group similar probabilities and compare each group's average forecast with its observed pass fraction.[^guo2017] With only one frozen forecast, this amounts to comparing that forecast with the pass fraction on a fresh batch.

Small batches fluctuate, so investigate persistent discrepancies before changing the model. Check whether the task mix shifted, retries were counted as new tasks, or the agent's policy changed. More data can narrow a wrong model's posterior while leaving its predictions unreliable.

## Sampling failure modes that corrupt the posterior

The arithmetic can be correct while the inference is wrong.

| Failure | Visible symptom | Repair |
|---|---|---|
| Repeated retries of one task | Ten rows claim to represent ten independent tasks | Group retries by underlying task and sample distinct tasks |
| Easy benchmark slice | Posterior looks strong while hard production tasks fail | Stratify by task family and compare deployment traffic |
| Historical prior from another agent | Strong prior hides a real regression | Record the historical origin of the prior and run sensitivity checks |
| Hidden prompt changes | Outcomes combine incompatible policies | Pin model, prompt, tools, and task definitions |
| Selective release reporting | Only a favorable stopping point or chosen agent is disclosed | Record every evaluated agent, stopping rule, and release decision |

Keep the collection and reporting process visible. Omitted runs, selected agents, or an undisclosed change of target population can make the reported analysis answer a different question from the one a reader assumes. Updating can't turn duplicated or biased rows into representative observations.

### Reweight a measured task mix explicitly

Suppose the hundred-task example consists of 80 easy tasks with 72 passes and 20 hard tasks with eight passes. The pooled result is still 80/100. Now deployment traffic is only 20% easy and 80% hard. The benchmark's task weights don't describe that population.

For this new model, give each family's unknown rate its own Beta(2, 2) prior and update using that family's observations. The family posteriors are Beta(74, 10) and Beta(10, 14). To forecast one task from the deployment mix, multiply each family's predictive pass probability by its traffic share and add them, using the law of total probability from the previous lesson.

<!-- leetllm: test, output=show -->
```python title="weight-task-families-for-deployment.py"
easy_mean = (2 + 72) / (4 + 80)
hard_mean = (2 + 8) / (4 + 20)
pooled_mean = (2 + 80) / (4 + 100)
deployment_mean = 0.2 * easy_mean + 0.8 * hard_mean

print(f"pooled single-rate forecast: {pooled_mean:.3f}")
print(f"easy-family forecast: {easy_mean:.3f}")
print(f"hard-family forecast: {hard_mean:.3f}")
print(f"deployment-mix forecast: {deployment_mean:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
pooled single-rate forecast: 0.788
easy-family forecast: 0.881
hard-family forecast: 0.417
deployment-mix forecast: 0.510
```
<!-- leetllm: output:end -->

The two-family model uses two priors, so it isn't another way to compute the original single-rate posterior. It answers a different population question. The adjustment assumes that each family's results remain representative within that family after deployment and that the traffic shares are known. Reweighting doesn't repair hidden bias inside a family.

The deployment rate is now $p_{\text{deploy}}=0.2p_{\text{easy}}+0.8p_{\text{hard}}$. Its mean is about 0.510, but it isn't generally a beta-distributed rate. A release tail probability requires propagating both family posteriors through that weighted sum. Don't insert the weighted mean into `beta.sf` or treat it as a new count of passes.

```checkpoint
A model passes eight out of ten tasks, but all ten rows are retries of the same prompt. Why is Beta(10,4) misleading?
---
The intended parameter describes new tasks from the deployment population. Ten retries of one prompt mainly describe that prompt. Even if retry randomness is independent, the prompt wasn't sampled ten times independently from that population. A beta update might model that prompt's retry success rate, but it does not measure the broader task success rate.
```

## Production release gates with posterior decision rules

For this exercise, choose the rule *before* seeing results: increase traffic only if the posterior probability that $p>0.7$ is at least 95%. A real release policy should also account for the cost of failures, traffic exposure, and other safety checks.

Under Beta(2, 2), the ten-task result doesn't pass this rule: `0.579 < 0.95`. The hundred-task result does: `0.981 > 0.95`, provided its tasks and policy satisfy the model assumptions. Neither decision follows from the raw 80% rate alone.

Work through these checks on paper first, then compare with the notes below:

1. One more comparable task fails after the original eight passes and two failures. What are the new posterior and next-task forecast?
2. Apply the 95% evidence rule to the original ten outcomes with Beta(1, 1) and Beta(20, 20) priors. Use `beta.sf(0.7, a, b)`, not just the mean. Does either pass?
3. Could the hundred-task result justify the same claim if every task came from an unusually easy benchmark family?

### Decision and sensitivity analysis checks

1. Add the failure once: Beta(10, 5), with forecast $10/15\approx0.667$. Don't add the original ten observations again when starting from their posterior.
2. Posteriors update to Beta(9, 3) and Beta(28, 22). Their probabilities above 0.7 evaluate to 0.687 and 0.019, respectively. Neither meets the 0.95 requirement. Although the estimates differ, all three priors produce the exact same rejection decision under this rule.
3. No. That posterior describes the sampled task family. A narrow interval doesn't correct the mismatch with deployment traffic. Sample from the intended population or explicitly model and weight its task families.

Report the observations, prior justification, posterior interval, threshold probability, and decision rule together. If reasonable priors do lead to opposite decisions, make that dependence visible rather than choosing the most convenient prior.

```checkpoint
What should a release reviewer conclude when one justified prior passes the deployment threshold but another equally defensible prior fails it?
---
The available sample doesn't support a prior-robust decision. Record both priors and posterior results, keep the release undecided, and collect additional representative tasks before claiming the threshold is met.
```

```mastery-quiz
[
  {
    "question": "A Beta(3,4) prior receives six passes and three failures. Which posterior should be saved for the next update?",
    "options": [
      "Beta(9,7).",
      "Beta(6,3).",
      "Beta(12,4).",
      "Beta(6,10)."
    ],
    "answer": "Beta(9,7).",
    "explanation": "Passes add to the first parameter and failures to the second: 3+6=9 and 4+3=7. Replacing the prior loses its starting weight."
  },
  {
    "question": "A saved posterior is Beta(12,8). One new comparable task fails. What is the pass forecast for the following task?",
    "options": [
      "12/20.",
      "13/21.",
      "12/21.",
      "12/29."
    ],
    "answer": "12/21.",
    "explanation": "The new failure gives Beta(12,9), so the following pass forecast is 12/21. Keeping 12/20 ignores evidence; adding original observations again double-counts them."
  },
  {
    "question": "Two analysts use Beta(1,1) and Beta(10,10) priors before observing nine passes and one failure. Which pair of posterior means is correct?",
    "options": [
      "0.500 and 0.500.",
      "0.833 and 0.633.",
      "0.900 and 0.900.",
      "0.633 and 0.833."
    ],
    "answer": "0.833 and 0.633.",
    "explanation": "The posteriors are Beta(10,2) and Beta(19,11), with means 10/12 and 19/30. The stronger starting weight pulls farther from the observed 0.9 toward 0.5."
  },
  {
    "question": "A posterior assigns 5% probability below 0.42 and 5% above 0.86. Which use of the interval is justified?",
    "options": [
      "Forecast fractional task outcomes between 0.42 and 0.86.",
      "Treat the endpoints as the smallest and largest possible rates.",
      "Infer a 95% probability of clearing a release bar at 0.70.",
      "Report [0.42,0.86] as a 90% equal-tailed credible interval."
    ],
    "answer": "Report [0.42,0.86] as a 90% equal-tailed credible interval.",
    "explanation": "The outside tails total 10%, leaving 90% posterior probability inside. The endpoints do not determine the area above an interior threshold, and task outcomes remain binary."
  },
  {
    "question": "Twenty evaluation rows contain five retries of each of four selected prompts. The release claim concerns new prompts across all task families. What collection change addresses the mismatch?",
    "options": [
      "Collect more retries and count each as a population draw.",
      "Sample distinct representative prompts and group their retries.",
      "Keep the best retry of every prompt and discard its failures.",
      "Collect the same prompts until the numerical interval narrows."
    ],
    "answer": "Sample distinct representative prompts and group their retries.",
    "explanation": "Retries can describe the selected prompts while leaving the new-prompt population under-sampled. Representative prompt selection and grouping address that mismatch; narrower arithmetic cannot repair it."
  },
  {
    "question": "Two equally defensible priors give release-tail probabilities 0.93 and 0.97 under a 0.95 rule. What should the reviewer do?",
    "options": [
      "Record the higher probability as robust and collect more retries of the selected prompts.",
      "Average the probabilities into a robust decision and collect the same prompts again.",
      "Record the prior-dependent decision and collect representative prompts before release.",
      "Select the narrower prior as decisive and collect no additional evidence before release."
    ],
    "answer": "Record the prior-dependent decision and collect representative prompts before release.",
    "explanation": "One prior passes and the other fails. Report both results because the decision depends on defensible assumptions. Averaging does not show that either assumption separately meets the rule."
  },
  {
    "question": "Under a Beta(2,2) prior, alternative evaluations each observe a 75% pass fraction: 6/8 and 60/80. What follows under the same sampling model?",
    "options": [
      "The larger sample concentrates rate uncertainty more.",
      "The larger sample guarantees deployment representativeness.",
      "Both posteriors are identical because the fractions agree.",
      "Both evaluations make future task outcomes deterministic."
    ],
    "answer": "The larger sample concentrates rate uncertainty more.",
    "explanation": "These posteriors are Beta(8,4) and Beta(62,22). Their rate variances are about 0.017094 and 0.002274. The larger sample is more concentrated under the specified Beta(2,2) prior and model. Equal fractions do not imply equal uncertainty, and sample size alone does not ensure representativeness."
  },
  {
    "question": "A likelihood at rate 0.6 has height 0.25. A reviewer interprets that height as a 25% posterior probability of the exact rate under a continuous beta model. What calculation repairs the claim?",
    "options": [
      "Multiply by prior density, normalize, then report the resulting point height as a probability.",
      "Divide by the task count, normalize those values, then report a point height as a probability.",
      "Square the likelihood height, normalize across outcomes, then assign that mass to the exact rate.",
      "Multiply the likelihood by prior density, normalize, then integrate over a rate interval."
    ],
    "answer": "Multiply the likelihood by prior density, normalize, then integrate over a rate interval.",
    "explanation": "A continuous beta posterior assigns zero probability to an exact point. The likelihood must be weighted by the prior and normalized to form a posterior density; integrate that density over a rate interval to get probability. Reporting a density height as point mass remains wrong after multiplication or division, and squaring the likelihood does not apply Bayes' rule."
  },
  {
    "question": "Before two new tasks run, their shared rate has posterior Beta(3,2). Given that rate they are independent. Which joint pass probability should be used?",
    "options": [
      "0.36.",
      "0.40.",
      "0.60.",
      "0.50."
    ],
    "answer": "0.40.",
    "explanation": "E[p²]=3×4/(5×6)=0.40. Squaring E[p]=3/5 gives 0.36 and discards shared-rate uncertainty. Conditional independence given p does not imply independence after averaging over p."
  },
  {
    "question": "A rule requires 90% posterior probability that the rate exceeds 0.8. A candidate has posterior mean 0.84 and tail probability 0.88 above 0.8. Which decision applies?",
    "options": [
      "Pass the candidate because its mean rate 0.84 exceeds the stated rate threshold 0.80.",
      "Pass the candidate because its tail probability 0.88 exceeds the stated rate threshold 0.80.",
      "Collect more evidence because the tail probability 0.88 falls below the required 0.90.",
      "Collect more evidence because its mean rate 0.84 falls below the required tail probability 0.90."
    ],
    "answer": "Collect more evidence because the tail probability 0.88 falls below the required 0.90.",
    "explanation": "The rate bar and required posterior confidence play different roles. The relevant comparison is 0.88<0.90. A mean above the rate bar does not guarantee the required tail probability."
  }
]
```

> **Next:** Continue to [Statistics and Uncertainty](/learn/statistics-estimation-uncertainty). A small pass count becomes a posterior, a next-task forecast, and a threshold probability. Check whether the prior or the task mix is doing the work. The next lesson compares sample estimates, variation, and uncertainty before those numbers drive model decisions.
