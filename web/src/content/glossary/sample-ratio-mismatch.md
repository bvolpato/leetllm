---
title: Sample ratio mismatch
aliases: ["SRM"]
importance: 84
---
**Sample ratio mismatch (SRM)** is a statistically significant gap between the **planned** traffic allocation of an experiment and the **observed** arm counts in the analysis set. A 58/42 split under a 50/50 design can flag an integrity problem, but the counts and sample size determine whether that gap exceeds ordinary assignment noise. Diagnose a significant mismatch before trusting the primary metric.

SRM flags a discrepancy that can originate in assignment, execution, log processing, or analysis. Fabijan, Gupchup, Gupta, Omhover, Qin, Vermeer, and Dmitriev (KDD 2019) organize causes by those experiment stages. Microsoft's [September 2020 ExP report](https://www.microsoft.com/en-us/research/articles/diagnosing-sample-ratio-mismatch-in-a-b-testing/) described withholding effects until the SRM check passed and reported historical rates around 6% at Microsoft and 10% of triggered analyses at LinkedIn. These are measurements from those platforms and reporting periods.

## Intuition

Randomization assigns treatment and control from the same population in expectation. Causal claims rely on that assignment mechanism and complete analysis logging. When observed counts disagree with the configured split more than chance allows, something has removed, reclassified, or failed to log units in a way that can correlate with the treatment.

Missing users are rarely a random subset. Exposure logs can omit the users most helped or hurt by a change: highly engaged sessions, requests that crashed before logging, slow clients that timed out, or traffic filtered as bots. Analyzing only recorded survivors can flip the sign of the result.

A plain glance at "looks about 50/50" is not enough. A 50.5/49.5 split on one million independent users gives $\chi^2 = 100$ and $p \approx 1.5 \times 10^{-23}$ under fair assignment, while a 55/45 split on a few dozen users can be ordinary noise. The diagnostic must use both the **ratio** and the **sample size**.

## Formula

For $k$ active arms with predefined positive probabilities $\pi_1,\ldots,\pi_k$ ($\sum_i \pi_i = 1$) and observed counts $O_1,\ldots,O_k$ with positive total $N = \sum_i O_i$, the expected counts under correct assignment and complete logging are

$$
E_i = N\,\pi_i.
$$

Pearson's chi-squared goodness-of-fit statistic is

$$
\chi^2 = \sum_{i=1}^{k} \frac{(O_i - E_i)^2}{E_i}.
$$

Under the null that each unit is independently assigned with probabilities $\pi_i$ and fully counted, $\chi^2$ is approximately $\chi^2_{k-1}$ for large $N$. For a two-arm test ($k=2$), the null distribution is $\chi^2_1$. Platforms convert the statistic to a $p$-value and flag SRM when $p$ is smaller than a **conservative** threshold so ordinary multinomial jitter rarely fires. Common production choices:

| Threshold style | Approx. cutoff ($k=2$) | Notes |
|---|---|---|
| $p < 0.001$ | $\chi^2 \gtrsim 10.83$ | Matches many product tutorials and the LeetLLM experiment lab |
| $p < 0.0005$ | $\chi^2 \gtrsim 12.12$ | Microsoft ExP public write-up (reduces false positives at high experiment volume) |

An extreme statistic strongly rejects the configured allocation under these assumptions. It still needs diagnosis: late data, incorrect expected ratios, or correlated counts can invalidate the test. Passing SRM indicates that assignment counts fit the expected ratios under those assumptions; check other sources of experiment bias separately.

For two arms and equal allocation ($\pi_1=\pi_2=1/2$), the formula collapses to

$$
\chi^2 = \frac{(O_1 - N/2)^2}{N/2} + \frac{(O_2 - N/2)^2}{N/2} = \frac{2}{N}\sum_{i=1}^{2}(O_i - N/2)^2.
$$

Unequal splits use the same sum with $E_i = N\pi_i$ (for example $E_T = 0.1N$ on a 10% canary). The $\chi^2$ approximation needs adequate expected counts (classic rule of thumb $E_i \gtrsim 5$); use an [exact binomial test](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.binomtest.html) for two sparse arms or a suitable exact multinomial test for more arms. Repeated monitoring needs an appropriate sequential procedure or false-alert adjustment. If allocation changes during a ramp, compute expectations from the actual allocation schedule rather than applying the final split to all traffic.

## Worked numbers

Planned 50/50. Observed: control $O_C = 1{,}650$, treatment $O_T = 2{,}350$, so $N = 4{,}000$ and $E_C = E_T = 2{,}000$.

$$
\chi^2 = \frac{(1650-2000)^2}{2000} + \frac{(2350-2000)^2}{2000} = \frac{(-350)^2 + 350^2}{2000} = 122.5.
$$

With 1 degree of freedom, $\chi^2 = 122.5$ corresponds to a $p$-value far below $10^{-20}$. Any threshold near $0.001$ or $0.0005$ fires hard. Pause metric reading; start the integrity investigation.

A smaller classic case: planned 50/50, $O_T = 600$, $O_C = 400$, $N = 1{,}000$. Then $\chi^2 = 40$ and $p \approx 2.5 \times 10^{-10}$. Same conclusion: not ordinary sampling noise.

```python
observed = {"control": 1650, "treatment": 2350}
n = sum(observed.values())
# Planned 50/50; for unequal splits use E_i = n * pi_i
expected = {arm: n / 2 for arm in observed}
chi_square = sum(
    (count - expected[arm]) ** 2 / expected[arm]
    for arm, count in observed.items()
)
alert = chi_square > 10.83  # ~ p < 0.001 on chi-square_1
print(f"chi-square={chi_square:.1f}, srm_alert={alert}")
```


## Example

You run a 50/50 sticky-per-conversation test of a new tool-using support agent. Planned analysis unit: eligible support chats. After two weeks the dashboard shows control 2,350 chats and treatment 1,650 chats, primary "human accepted draft within 5 minutes" looking negative for treatment.

Before celebrating, run the SRM check: $\chi^2 = 122.5$, alert on. Digging in, you find that treatment's longer tool chains hit a bot-score threshold more often (more tool events, more page-like activity), and the analytics pipeline drops bot-flagged sessions **after** assignment. The dropped sessions are disproportionately high-engagement treatment users. That is the MSN carousel failure mode in AI clothing: a filter that removes the people the treatment moved most, so the remaining table lies.

After fixing the filter (or including a fair counterfactual definition of "eligible"), the split returns near 50/50. The metric story may reverse, shrink, or stay positive, but only the post-fix comparison earns a ship decision.

Other AI-product SRM patterns that produce the same alert:

- **Treatment-only logging.** Trigger condition is "chat used the new citation UI" without a control-side counterfactual for "would have seen that surface."
- **Guardrail or rate-limit asymmetry.** Treatment trips safety or quota more often and never emits a completion event used as the analysis unit.
- **Fallback skew.** Treatment falls back to the old model and is either double-counted, uncounted, or reassigned in logs.
- **Client telemetry race.** A faster or slower model changes whether the final `exposure` event flushes before the tab closes.
- **Uneven ramp.** Operators manually widen treatment to 30% mid-run while the analysis still assumes 10%.

## How it works

Mature platforms treat SRM as a hard gate:

1. **Count distinct randomization units per arm** using a treatment-independent eligibility definition. A user-randomized experiment counts each user once for this test; counting their requests as independent assignments violates the multinomial model. Clustered or constrained assignment needs a test matching that design.
2. **Compare to the configured $\pi_i$** with a chi-squared (or exact multinomial) test. Do this on the raw arm counts **before** reading the primary metric or confidence intervals.
3. **On alert, hide or watermark results** until diagnosis. The alert marks the comparison as untrusted and requires investigation before drawing arm-level conclusions.
4. **Differential diagnosis** (Fabijan et al. taxonomy), roughly by lifecycle stage:
   - **Assignment:** wrong bucket counts, unstable ids, correlated experiment salts, exclusive-layer collisions, carryover from a previous experiment.
   - **Execution:** redirects on one arm only, mid-session config refresh that rewrites variant id, crashes, performance that changes whether logs fire.
   - **Log processing:** joins that drop one arm, bot/fraud filters correlated with engagement, late events, identity stitching.
   - **Analysis:** triggered analysis without counterfactual logging, post-assignment filters that depend on the treatment, segment definitions that differ by arm.
   - **Operator-caused:** uneven ramp, self-selection into a "try new model" toggle, dogfood forced into treatment.
5. **Segment and time-slice.** Check whether SRM is global or localized (one browser, mobile app, region, tenant tier). Compare triggered vs untriggered populations: clean untriggered + dirty triggered often means a bad zoom-in condition.
6. **Only after an understood fix** reanalyze (sometimes on a clean subpopulation) or restart with corrected logging and assignment.

Direction of the mismatch is a clue. More users in treatment often points to higher engagement, better performance, or extra telemetry; fewer users in treatment often points to crashes, failed redirects, or aggressive filtering of the treatment path.

## Debug path

Walk the path the unit takes from eligibility to the row in your metric table:

1. Confirm **configured split and sticky key** (user id, conversation id, tenant id) match what the analysis assumes.
2. Diff **assignment logs** vs **exposure logs** vs **metric rows**. Where does the ratio first diverge?
3. Plot **arm counts over time** (hourly). A jump at deploy, bot-filter change, or mid-run ramp is a smoking gun.
4. Slice by **platform, locale, client version, tenant type** to locate the defect. A clean subpopulation can support a narrower analysis only if its eligibility is valid independently of treatment. Dropping an affected segment after observing treatment outcomes can introduce another bias.
5. For AI systems, audit **guardrail blocks, tool retries, fallbacks, streaming completion, and eval-event emission**. Check whether treatment changed the probability of being *measured* alongside the probability of a good outcome.
6. Re-run SRM on the **pre-trigger / intent-to-treat** population. If ITT is clean and triggered analysis is not, fix the trigger, not the model.

## Why it matters here

LLM and agent experiments stack extra ways for "being counted" to depend on the arm: tool loops, safety classifiers, provider fallbacks, long generations that time out, and client-side streaming. A model that is actually better at engaging power users can look worse if those users are filtered, timed out, or bot-scored out of the table. CUPED, clever metrics, and tight confidence intervals do not repair a broken sample. SRM is the fast integrity alarm that says: stop reading lift, fix the pipeline, then measure again.

## Related terms

- [A/B testing](glossary://ab-testing)
- [Stable assignment](glossary://stable-assignment)
- [Traffic split](glossary://traffic-split)
- [p-value](glossary://p-value)
- [CUPED](glossary://cuped)
