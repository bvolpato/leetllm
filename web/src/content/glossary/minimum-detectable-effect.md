---
title: Minimum detectable effect
aliases: ["MDE"]
importance: 82
---
Minimum detectable effect (MDE) is the smallest **true** treatment effect a planned experiment is designed to detect with a chosen significance level $\alpha$ and power $1-\beta$, given the sample size, assignment split, and outcome variance you actually have. Set it during experiment design; report the observed effect and uncertainty separately after the run.

If the true effect equals the MDE, rejection probability is about $1-\beta$; larger true effects are easier to detect (power above $1-\beta$). Smaller true effects may still exist; the design is simply underpowered for them.

## Intuition

MDE answers a planning question: with this traffic, baseline, and noise, **what lift would we reliably see?** Product often wants a 1% relative move. Power analysis may show that only an 8% relative move is detectable at 80% power. In that case the experiment cannot answer the product question, no matter how carefully you inspect $p$-values later.

Two dual framings are the same math:

1. **Fix the effect you care about** (business MDE). Solve for required sample size $n$.
2. **Fix the sample size you can afford.** Solve for the smallest effect that design can detect (sensitivity MDE).

Teams that skip this step often run "interesting but underpowered" tests: expensive maybes that look scientific and still cannot support a ship/hold call.

MDE describes the smallest true effect the design is powered to detect before the experiment. Observed lift $\hat{\delta}$ and the confidence interval summarize results and estimation precision for the realized sample.

## Formula

Assume an asymptotically normal estimator $\hat{E}$ of the ATE with standard error $\mathrm{SE}(\hat{E})$. For a two-sided level-$\alpha$ test with target power $\kappa = 1-\beta$ against a true effect $\delta > 0$, the MDE is

$$
\delta_{\mathrm{MDE}} \approx \bigl(z_{1-\alpha/2} + z_{\kappa}\bigr)\,\mathrm{SE}(\hat{E}),
$$

where $z_q = \Phi^{-1}(q)$ is the standard normal quantile. Common defaults: $\alpha = 0.05$ so $z_{1-\alpha/2} \approx 1.96$, and $\kappa = 0.80$ so $z_{\kappa} \approx 0.84$, giving the familiar factor $\approx 2.80$.

For a two-sample comparison with equal arm sizes $n$, common outcome variance $\sigma^2$ in each arm, and absolute ATE $\delta$,

$$
\mathrm{SE}(\hat{\delta}) = \sigma\sqrt{\frac{2}{n}}, \qquad
n = \frac{2\sigma^2\,(z_{1-\alpha/2} + z_{1-\beta})^2}{\delta^2}
$$

per arm. Solving for $\delta$ at fixed $n$ recovers the MDE. A handy rule of thumb at $\alpha = 0.05$ and 80% power is

$$
\delta_{\mathrm{MDE}} \approx \frac{4\sigma}{\sqrt{n}}
$$

(per arm $n$), since $2.80 \times \sqrt{2} \approx 4$.

For a binary metric with control rate $p_C$ and treatment rate $p_T = p_C + \delta$ under the alternative (equal allocation), a two-sided two-proportion z-test uses pooled variance under the null and unpooled variance under the alternative. Let $\bar p = (p_C + p_T)/2$:

$$
n \approx
\frac{
\left[
z_{1-\alpha/2}\sqrt{2\bar p(1-\bar p)}
+ z_{1-\beta}\sqrt{p_C(1-p_C)+p_T(1-p_T)}
\right]^2
}{(p_T-p_C)^2}
$$

per arm. A rough planning shortcut replaces both variance terms with $p_C(1-p_C)$, but the full expression matters when the alternative is far from the baseline or the event is rare.

**Absolute vs relative.** State which you mean. Absolute MDE $\delta = p_T - p_C$ (for example $+2$ percentage points). Relative MDE $\delta / p_C$ (for example $+5\%$ of baseline). A "10% MDE" on a 5% conversion rate is only $0.5$ percentage points absolute; sample size depends on the absolute scale through $\delta^2$ and the Bernoulli variance.

## Worked numbers

Take a support-assistant acceptance rate with baseline $p_C = 0.40$, two-sided $\alpha = 0.05$, power $80\%$, equal arms.

| Target absolute lift $\delta$ | Relative to baseline | Approx. $n$ per arm |
|---|---:|---:|
| $0.03$ (3 pp) | $7.5\%$ | $\sim 4{,}200$ |
| $0.02$ (2 pp) | $5\%$ | $\sim 9{,}500$ |
| $0.01$ (1 pp) | $2.5\%$ | $\sim 38{,}000$ |

With fixed traffic $n = 25{,}000$ per arm and the same baseline, the sensitivity MDE is about $1.2$ percentage points absolute ($\sim 3\%$ relative). If [CUPED](glossary://cuped) shrinks residual variance by a factor $1-\rho^2$, required sample size for a fixed effect scales by $1-\rho^2$, while MDE at fixed $n$ scales by $\sqrt{1-\rho^2}$.

Offline evals follow the same logic. Comparing two systems unpaired on $n = 500$ binary items each at a $70\%$ pass rate yields an MDE on the order of $8$ percentage points at 80% power. That is why tiny golden sets can only settle large quality gaps.

## Critical regions

Under $H_0$ the sampling distribution of $\hat{\delta}$ is centered at $0$; significance places a critical value near $z_{1-\alpha/2}\,\mathrm{SE}$. Under $H_A$ the distribution is centered at the true effect. The MDE is the center shift that puts probability $1-\beta$ beyond that critical value.

## Example

You plan a two-week A/B test of a new prompt for a support draft assistant. Assignment unit is conversation (sticky), primary metric is human acceptance within five minutes, baseline $\hat{p}_C \approx 0.40$ from last month, equal $50/50$ split, $\alpha = 0.05$, target power $80\%$.

Product says a $+1$ percentage point absolute lift would justify the complexity. Historical volume is about $6{,}000$ eligible conversations per arm over two weeks. From the table above, detecting $1$ pp needs on the order of $38{,}000$ per arm; at $6{,}000$ the sensitivity MDE is closer to $2.5$ pp. The design cannot answer the product question.

Options before launch:

1. Extend runtime or increase eligible traffic until both arms reach the required sample size. Starting from equal allocation with equal variances, raising treatment share at fixed total traffic increases variance rather than solving the power problem.
2. Reduce variance (CUPED on pre-period acceptance, tighter eligibility, fewer noisy slices in the primary).
3. Keep the two-week window and **redeclare** the decision as "only ship if we see a large lift," with MDE $\approx 2.5$ pp written into the experiment contract.
4. Gate with offline eval / shadow traffic first, and use the online test only for large safety or UX shifts.

After an underpowered run, a point estimate of $+0.8$ pp with $p = 0.12$ remains too noisy to establish a small win under the design you actually ran.

## Sizing levers

Anything that changes $\mathrm{SE}(\hat{\delta})$ or the critical quantiles moves the MDE:

| Lever | Effect on MDE (fixed $n$) |
|---|---|
| Higher outcome variance $\sigma^2$ | Raises MDE |
| Rarer binary baseline below 50% (fixed $n$) | The local normal approximation gives smaller absolute MDE and larger relative MDE; verify rare-event designs rather than relying on this shortcut |
| Smaller $n$ or imbalanced split | Raises MDE |
| Stricter $\alpha$ or higher power | Raises MDE |
| Multiple testing / many slices without budget | Effective power falls; treat as larger MDE |
| CUPED, better metrics, stable assignment, triggering | Lowers effective $\sigma^2$, shrinks MDE |
| Optional stopping / continuous peeking at $p$ | Breaks the fixed-$n$ $\alpha$ geometry the MDE formula assumes; use sequential designs or locked analysis windows |

Clustered units (users with many sessions, tenants with correlated tickets) inflate variance relative to naive row counts. Power on the **assignment unit**, not on raw event rows.

## Why it matters here

LLM and ML product changes (prompts, rerankers, model routes, tool policies) often promise small lifts on noisy human metrics: acceptance, resolution, preference win rate, judge scores. Offline harnesses and golden sets are cheap but limited; live [A/B tests](glossary://ab-testing) are expensive in traffic and risk. MDE turns "let's just run it" into an engineering check: can this design answer the ship/hold question with the traffic and variance we have?

Pair MDE with [statistical power](glossary://statistical-power), a predeclared primary metric, guardrails, and integrity checks. A non-significant result below the MDE leaves zero and nonzero effects plausible. For a significant result, inspect its confidence interval and experiment integrity; the p-value alone says nothing about design or implementation soundness.

## Related terms

- [Statistical power](glossary://statistical-power)
- [A/B testing](glossary://ab-testing)
- [Confidence interval](glossary://confidence-interval)
- [CUPED](glossary://cuped)
- [Variance](glossary://variance)
