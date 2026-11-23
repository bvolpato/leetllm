---
title: Statistical power
importance: 86
---
**Statistical power** is the probability that a predeclared hypothesis test rejects the null when a specified alternative is true. In Neyman–Pearson terms, if $\beta$ is the Type II error rate (fail to reject $H_0$ though the alternative holds), then

$$
\mathrm{power} = 1 - \beta.
$$

Power is always conditional on a **concrete** alternative: effect size, variance, sample size, significance level $\alpha$, one- vs two-sided test, and analysis plan. It belongs to the test design, while a ship decision also depends on effect estimates and decision thresholds.

Eighty percent power ($\beta = 0.20$) is a common planning default, following Cohen's practical convention that Type II risk may be about four times Type I risk when $\alpha = 0.05$. Higher stakes (safety, large spend) often target $90\%$ or more.

## Intuition

Think of two overlapping sampling distributions for the estimated lift $\hat{\delta}$:

- Under $H_0$: centered at $0$, with width set by $\mathrm{SE}(\hat{\delta})$.
- Under a true effect $\delta$: centered at $\delta$, same width (or nearly so).

Significance places a critical threshold $c$ so that only about $\alpha$ of the null mass lies beyond it. Power is the fraction of the **alternative** mass that also falls beyond $c$. Bigger $\delta$, smaller noise, or more samples slide the alternative further past the threshold. Stricter $\alpha$ moves $c$ outward and burns power.

Underpowered designs waste traffic twice: a real product win looks like noise ($p$ stays large), and teams either ship on vibes or kill a good change. Overpowered designs can declare "significant" lifts too small to matter; product decisions still need a meaningful effect threshold.

## Formula

**Definition (simple alternative).** For a level-$\alpha$ test with rejection region $R$,

$$
\mathrm{power}(\theta) = P_{\theta}(\text{reject } H_0) = P_{\theta}(T \in R),
$$

when the true parameter is $\theta$ under the alternative of interest. Then $\beta(\theta) = 1 - \mathrm{power}(\theta)$.

**Two-sided normal approximation for a mean difference.** Let $\hat{\delta}$ estimate the average treatment effect with standard error $\mathrm{SE}$. Critical value for $H_0: \delta = 0$:

$$
c = z_{1-\alpha/2}\,\mathrm{SE}, \qquad z_q = \Phi^{-1}(q).
$$

Against a true positive effect $\delta > 0$,

$$
\mathrm{power} \approx \Phi\!\left(\frac{\delta}{\mathrm{SE}} - z_{1-\alpha/2}\right)
+ \Phi\!\left(-\frac{\delta}{\mathrm{SE}} - z_{1-\alpha/2}\right).
$$

The second term (rejecting in the wrong direction) is usually negligible for powered designs, so

$$
\mathrm{power} \approx \Phi\!\left(\frac{\delta}{\mathrm{SE}} - z_{1-\alpha/2}\right).
$$

Targeting power $\kappa = 1-\beta$ and solving for the effect recovers the [minimum detectable effect](glossary://minimum-detectable-effect):

$$
\delta_{\mathrm{MDE}} \approx \bigl(z_{1-\alpha/2} + z_{\kappa}\bigr)\,\mathrm{SE}.
$$

With $\alpha = 0.05$ and $\kappa = 0.80$: $z_{1-\alpha/2} \approx 1.96$, $z_{0.80} \approx 0.84$, factor $\approx 2.80$.

**Sample size, equal arms, continuous outcome.** Common variance $\sigma^2$ per arm, absolute lift $\delta$, equal $n$ per arm:

$$
\mathrm{SE}(\hat{\delta}) = \sigma\sqrt{\frac{2}{n}}, \qquad
n = \frac{2\sigma^2\,(z_{1-\alpha/2} + z_{1-\beta})^2}{\delta^2}.
$$

Lehr's rough rule of thumb at $\alpha = 0.05$ and $80\%$ power is $n \approx 16\,\sigma^2/\delta^2$ per arm (same math: $2 \times 2.8^2 \approx 16$).

**Binary metric (two proportions).** Control rate $p_C$, treatment rate $p_T = p_C + \delta$ under the alternative:

$$
n \approx \frac{(z_{1-\alpha/2} + z_{1-\beta})^2 \bigl(p_C(1-p_C) + p_T(1-p_T)\bigr)}{\delta^2}
$$

per arm under equal allocation. Relative lifts must be converted to absolute $\delta$ before plugging in: a $5\%$ relative lift on a $40\%$ baseline is $\delta = 0.02$ absolute.

This is a rough Wald-style planning approximation using alternative variances. A standard two-proportion test can use different null and alternative standard errors, and rare events need more careful sizing or simulation. Round the final per-arm count up rather than enrolling a fractional unit.

**What moves power (fixed $\alpha$).**

| Input | Effect on power |
|---|---|
| Larger true $|\delta|$ | Raises power |
| Larger $n$ or better allocation | Raises power |
| Higher outcome variance / clustering | Lowers power |
| Stricter $\alpha$ or two-sided vs one-sided | Lowers power |
| Variance reduction ([CUPED](glossary://cuped), cleaner metric) | Raises power |
| Peeking / unplanned multi-testing without budget | Inflates Type I risk; "effective" power story breaks |

Power on the **assignment unit** (user, tenant, conversation), not on raw event rows. Correlated multi-turn logs inflate naive $n$.

## Worked numbers

Support draft assistant. Baseline acceptance $p_C = 0.40$, two-sided $\alpha = 0.05$, target power $80\%$, equal arms. Use $(1.96 + 0.84)^2 \approx 7.84$.

| True absolute lift $\delta$ | Relative to baseline | Approx. $n$ per arm for $80\%$ power |
|---|---:|---:|
| $0.03$ (3 pp) | $7.5\%$ | $\sim 4{,}200$ |
| $0.02$ (2 pp) | $5\%$ | $\sim 9{,}500$ |
| $0.01$ (1 pp) | $2.5\%$ | $\sim 38{,}000$ |

With only $n = 5{,}000$ per arm and a $1$ pp true lift, $\mathrm{SE} \approx \sqrt{2 \cdot 0.24 / 5000} \approx 0.0098$, so

$$
\frac{\delta}{\mathrm{SE}} - 1.96 \approx \frac{0.01}{0.0098} - 1.96 \approx -0.94,
$$

and power is only about $\Phi(-0.94) \approx 17\%$. Most replications of a real $+1$ pp win would fail to reject. The design has only about 17% power to detect this lift, so the prompt's value remains unresolved.

```python
from math import isfinite, sqrt
from statistics import NormalDist

Z = NormalDist()


def two_proportion_n_per_arm(
    p_c: float, delta: float, alpha: float = 0.05, power: float = 0.80
) -> float:
    p_t = p_c + delta
    if not 0 <= p_c <= 1 or not 0 <= p_t <= 1 or delta == 0:
        raise ValueError("valid probabilities and a nonzero effect are required")
    if not 0 < alpha < 1 or not 0.5 < power < 1:
        raise ValueError("alpha must be in (0, 1) and planning power in (0.5, 1)")
    z_a = Z.inv_cdf(1 - alpha / 2)
    z_b = Z.inv_cdf(power)
    num = (z_a + z_b) ** 2 * (p_c * (1 - p_c) + p_t * (1 - p_t))
    return num / delta**2


def approx_power_two_sided(delta: float, se: float, alpha: float = 0.05) -> float:
    if not isfinite(delta) or not isfinite(se) or se <= 0 or not 0 < alpha < 1:
        raise ValueError("finite effect, positive finite standard error, and alpha in (0, 1) are required")
    z_a = Z.inv_cdf(1 - alpha / 2)
    # Both tails, valid for positive, zero, or negative effects.
    effect = delta / se
    return Z.cdf(effect - z_a) + Z.cdf(-effect - z_a)


# ~9490 users per arm for +2 pp at p=0.40, 80% power
n_star = two_proportion_n_per_arm(0.40, 0.02)
se_5k = sqrt(0.40 * 0.60 / 5000 + 0.41 * 0.59 / 5000)
power_5k = approx_power_two_sided(0.01, se_5k)  # ~0.17 for +1 pp
```

For skewed AI metrics (heavy-tailed cost, multi-turn resolution, LLM-judge scores), closed forms are a first cut. Monte Carlo the full analysis path: draw outcomes under the alternative, run the same test you will run in production (including CUPED and filters), and measure the fraction of sims that reject.

## Rejection tails

For the two-sided test under $H_0$, each rejection tail beyond $\pm c$ has probability $\alpha/2$, totaling Type I rate $\alpha$. Under $H_A$, power is the probability in both rejection tails. When the plan misses its required power, treat the experiment as inconclusive until enrollment or the design changes.

## Example

You plan a two-week sticky A/B test of a new retrieval prompt. Assignment unit is conversation. Primary metric: human acceptance within five minutes. Baseline $\hat{p}_C \approx 0.40$. Equal $50/50$ split, $\alpha = 0.05$, target $80\%$ power for a $+2$ pp absolute lift (product's break-even).

Historical volume: about $5{,}000$ eligible conversations per arm in two weeks. From the table, detecting $+2$ pp needs roughly $9{,}500$ per arm. At $5{,}000$, sensitivity MDE is closer to $+2.8$ pp, and power for a true $+2$ pp is well below $80\%$.

Before launch:

1. Extend runtime or enroll more eligible conversations while preserving the planned equal split until both arms match the power plan. Shifting an already equal split toward treatment reduces balanced-design power for a fixed total sample.
2. Cut residual variance with [CUPED](glossary://cuped) on pre-period acceptance, tighter eligibility, or a less noisy primary.
3. Keep the window and **redeclare** that you are only hunting large effects, with the sensitivity MDE written into the experiment contract.
4. Gate offline / shadow first; reserve online traffic for lifts the design can actually see.

After the run, $p = 0.18$ with $\hat{\delta} = +1.1$ pp is **inconclusive** for a $+2$ pp target. The result is compatible with zero and with smaller positive lifts. Report the estimate, a [confidence interval](glossary://confidence-interval), and the predeclared power/MDE so readers know what the design could detect.

## Sizing

Power analysis is done **a priori** (before peeking). Post-hoc "observed power" computed from the same $p$-value you just got is largely uninformative: low observed power tracks non-significance by construction.

Declare before launch: primary metric, assignment unit, $\alpha$, one/two-sided, target power, effect of interest (or affordable $n$), variance estimate, split, runtime, and stopping rule. Sequential looks without an alpha-spending plan inflate Type I error and invalidate the power number you wrote down.

Production failure modes that silently destroy power:

- **Wrong unit count.** Powering on message rows when assignment is user-level overstates $n$.
- **Dilution.** Low trigger rate or heavy fallback mixes treated and untreated behavior; intent-to-treat effect shrinks and power falls.
- **Metric mismatch.** Noisy proxy (judge score with rater noise) needs far more samples than a cleaner operational metric.
- **Multiple slices.** Per-locale, per-model, per-day fishing without multiplicity control makes "a win somewhere" easy and the predeclared power claim false.

## Why it matters here

LLM and ML product changes (prompts, rerankers, model routes, tool policies) often promise small lifts on noisy human metrics: acceptance, resolution, preference win rate, judge agreement. Offline golden sets are cheap but limited; live [A/B tests](glossary://ab-testing) burn traffic and risk. Power analysis is the engineering check that asks: if the true effect is the smallest improvement we care about, how often would this design detect it?

Without that check, empty experiments get read as definitive evidence. With it, non-rejection is readable as "underpowered or smaller than planned," estimates sit next to intervals, and teams spend samples where they buy decision quality. Pair power with MDE, a fixed primary metric, integrity checks (for example sample ratio mismatch), and variance reduction so the ship/hold call matches the design you actually ran.

## Related terms

- [A/B testing](glossary://ab-testing)
- [Minimum detectable effect](glossary://minimum-detectable-effect)
- [p-value](glossary://p-value)
- [Confidence interval](glossary://confidence-interval)
- [CUPED](glossary://cuped)
