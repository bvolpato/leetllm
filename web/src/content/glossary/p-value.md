---
title: p-value
aliases: ["p value"]
importance: 87
---
A **p-value** is the probability, under a fully specified null model, of observing a test statistic at least as extreme as the one you got. Formally, if $T$ is the test statistic, $t_{\mathrm{obs}}$ is its observed value, and "more extreme" is defined by the planned alternative (one-sided or two-sided),

$$
p = P\big(T \text{ is at least as extreme as } t_{\mathrm{obs}} \mid H_0\big).
$$

Smaller $p$ means the data are more incompatible with that null model (and its other assumptions). A $p$-value is a tail probability under $H_0$. Posterior probability, the probability that a result is a "fluke," and effect size are separate quantities.

The American Statistical Association's 2016 statement on statistical significance and $p$-values puts the same idea in engineering language: a $p$-value summarizes how incompatible the data are with a specified statistical model that includes the null hypothesis. Use effect size, uncertainty, guardrails, and release criteria to decide whether a result is ready to ship.

## Intuition

Think of a fair-coin check. You claim model B beats model A on paired tasks. The null says each disagreement is a fair coin. You observe 13 B wins and 3 A wins. The one-sided $p$-value asks: if the coin were fair, how often would B win **at least** 13 of 16 disagreements? That number is about $0.011$. The win pattern is awkward for the fair-coin story. A posterior probability that "B is better" requires a separate Bayesian model and prior.

$p$ compresses a whole tail of the null sampling distribution into one number. It quantifies **surprise** under $H_0$. Product decisions also consider effect size, cost, latency, and safety.

## Formula

**Exact discrete case (sign / binomial test).** For $d$ independent disagreements under $H_0: P(\text{B wins}) = 1/2$, and a predeclared one-sided claim that B wins more often,

$$
p = \sum_{k=b}^{d} \binom{d}{k} \left(\tfrac{1}{2}\right)^{d}
= \frac{1}{2^{d}} \sum_{k=b}^{d} \binom{d}{k},
$$

where $b$ is the observed B-win count. Ties drop out of the test (they do not favor either model) but still affect pass rates.

**Large-sample normal case.** If a contrast estimator $\hat{\delta}$ (for example treatment minus control) is approximately normal with standard error $\widehat{\mathrm{SE}}$ under $H_0: \delta = 0$, the $z$-statistic is

$$
z = \frac{\hat{\delta}}{\widehat{\mathrm{SE}}}.
$$

With $\Phi$ the standard normal CDF:

| Alternative | $p$-value |
|---|---|
| Two-sided ($\delta \ne 0$) | $2\,\Phi(-|z|)$ |
| Upper one-sided ($\delta > 0$) | $1 - \Phi(z)$ |
| Lower one-sided ($\delta < 0$) | $\Phi(z)$ |

For two independent binomial rates $\hat{p}_T$, $\hat{p}_C$ with sizes $n_T$, $n_C$ and $\hat{\delta} = \hat{p}_T - \hat{p}_C$,

$$
\widehat{\mathrm{SE}}(\hat{\delta}) \approx \sqrt{\frac{\hat{p}_T(1-\hat{p}_T)}{n_T} + \frac{\hat{p}_C(1-\hat{p}_C)}{n_C}}.
$$

(Some tests use a pooled variance under the null; either form is a large-sample approximation.)

**Decision threshold (Neyman–Pearson).** Before looking at results, fix a significance level $\alpha$ (often $0.05$). Reject $H_0$ if $p < \alpha$. A valid exact test controls long-run Type I error at or below $\alpha$ under the null and the stated plan; a large-sample approximation need not attain that bound exactly. Fisher's original presentation treated $p$ as a continuous measure of evidence; modern product experiments usually combine both: report $p$ and an estimate with a [confidence interval](glossary://confidence-interval), then apply a predeclared $\alpha$ as one decision component.

## Example

**Paired offline eval (exact).** Predeclare a one-sided claim "B is better." Observe $b = 13$ B-only wins and $a = 3$ A-only wins ($d = 16$ disagreements).

$$
p = \frac{\binom{16}{13} + \binom{16}{14} + \binom{16}{15} + \binom{16}{16}}{2^{16}}
= \frac{560 + 120 + 16 + 1}{65536}
\approx 0.0106.
$$

At $\alpha = 0.05$ you would reject the fair-coin null. The observed paired effect is 13 B wins and 3 A wins among the disagreements. Assess product readiness using the paired lift, uncertainty interval, and operational guardrails.

**Tiny sample (same procedure).** One B win, zero A wins: $p = 1/2 = 0.50$. One disagreement provides little evidence of a directional improvement.

```python
from math import comb


def b_wins_one_sided_p_value(b_wins: int, a_wins: int) -> float:
    if b_wins < 0 or a_wins < 0:
        raise ValueError("win counts must be nonnegative")
    d = b_wins + a_wins
    if d == 0:
        return 1.0
    return sum(comb(d, k) for k in range(b_wins, d + 1)) / (2**d)


print(round(b_wins_one_sided_p_value(1, 0), 3))    # 0.5
print(round(b_wins_one_sided_p_value(13, 3), 4))   # 0.0106
```

**Online binary lift (Wald / unpooled SE for the difference).** Control acceptance $\hat{p}_C = 0.41$ on $n_C = 11{,}160$, treatment $\hat{p}_T = 0.46$ on $n_T = 1{,}240$, so $\hat{\delta} = 0.05$. This worked example uses the **unpooled** Wald standard error for $\hat{p}_T - \hat{p}_C$ (same form as a CI-style SE for the difference). A classical equal-rate null $z$-test would instead use a **pooled** SE under $H_0:\delta=0$; for these rates the two $z$ values barely differ.

$$
\widehat{\mathrm{SE}} \approx \sqrt{\frac{0.46\times 0.54}{1240} + \frac{0.41\times 0.59}{11160}} \approx 0.0149,
\quad
z \approx \frac{0.05}{0.0149} \approx 3.36,
\quad
p_{\text{two-sided}} = 2\,\Phi(-3.36) \approx 8\times 10^{-4}.
$$

Statistically incompatible with zero lift under this model. You still need guardrails (latency, cost, safety), integrity checks, and a design that was powered for the lift you care about.

## What breaks the number

A $p$-value is only as honest as the plan and the model.

| Failure mode | What happens to $p$ |
|---|---|
| Peeking daily until $p < 0.05$ | Inflates false positives; nominal $\alpha$ is wrong |
| Choosing the metric or slice after seeing ranks | $p$ no longer corresponds to a predeclared test |
| Ignoring clustering (users, conversations, tenants) | SE too small; $p$ too optimistic |
| Underpowered design | Large true effects often yield large $p$; "not significant" $\ne$ "no effect" |
| Huge $n$, tiny lift | Tiny $p$ with no product value (ASA: significance $\ne$ importance) |
| Multiple arms / many slices without budget | Family-wise error or false discovery rate drifts up |

Pair $p$ with the estimate and a [confidence interval](glossary://confidence-interval). Design the experiment with [statistical power](glossary://statistical-power) and a [minimum detectable effect](glossary://minimum-detectable-effect) so a non-rejection can be interpreted against effects of practical size and the uncertainty in the estimate.

## Why it matters here

LLM and ML teams constantly compare prompts, models, rerankers, judges, and tool policies on finite noisy samples: golden sets, preference battles, retrieval slices, and live [A/B tests](glossary://ab-testing). A raw win rate or dashboard delta invites shipping on luck. The $p$-value is the standard way to ask whether that delta is awkward for a null of "no difference" under a declared model.

In production, the $p$-value contributes one input to the decision. Report $p$ with the lift, interval, assignment unit, and integrity checks. Exact or [bootstrap](glossary://bootstrap-resampling) methods must preserve the design: paired rows stay paired and clustered data require cluster-aware sampling. A bootstrap interval estimates uncertainty; a null-hypothesis test evaluates a specified statistic under a null model. Assess user outcomes, serving cost, and safety on the required slices with their own product criteria.

## Related terms

- [Confidence interval](glossary://confidence-interval)
- [Statistical power](glossary://statistical-power)
- [Minimum detectable effect](glossary://minimum-detectable-effect)
- [A/B testing](glossary://ab-testing)
- [Bootstrap resampling](glossary://bootstrap-resampling)
