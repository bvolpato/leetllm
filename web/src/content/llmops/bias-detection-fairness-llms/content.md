---
{
  "id": "bias-detection-fairness-llms",
  "title": "Bias & Fairness in LLMs",
  "slug": "bias-detection-fairness-llms",
  "category": "Alignment & Safety",
  "difficulty": "Medium",
  "coverImage": "illustrations/_generated/bias_detection_dark.png",
  "companies": [
    "Google",
    "Meta",
    "Microsoft",
    "Anthropic",
    "OpenAI",
    "Hugging Face"
  ],
  "shortDescription": "Detect dialect sensitivity, subgroup calibration drift, and intersectional error spikes in LLM routers using counterfactual paired tests, fairness metrics, and Wilson confidence intervals.",
  "keyConceptsTested": [
    "Representational harm versus allocative harm",
    "Counterfactual matched-pair audits and Wilcoxon or permutation tests",
    "Selection parity, equal opportunity, equalized odds, and calibration trade-offs",
    "Chouldechova impossibility under unequal subgroup base rates",
    "Intersectional slice evaluation and Wilson binomial confidence intervals",
    "Selective labels and judge position or sycophancy bias",
    "Subgroup calibration, threshold post-processing, and continuous drift gates"
  ],
  "section": "Applied LLM Engineering",
  "order": 16
}
---

Consider two technical candidate summaries describing the exact same four years of distributed PyTorch engineering, identical benchmark speedups, and identical open-source maintenance history. One application uses formal resume prose; the other phrases the same accomplishments in conversational vernacular. When an automated <span data-glossary="llm-as-judge">LLM triage scorer</span> evaluates both candidates under a `0.70` fast-track cutoff, the formal wording scores `0.78` and routes straight to expedited review, whereas the matched conversational wording scores `0.67` and drops into a slow manual queue. Aggregate pass rates across the entire traffic pool can look balanced even while wording style shifts outcomes systematically right around the decision threshold.

Fairness auditing in LLM systems exists precisely because surface accuracy and pooled averages hide systematic disparities across user dialects, demographic attributes, and prompt phrasing [^gallegos2024]. Empirical behavioral evaluations show that instruction-tuned language models preserve covert dialect prejudice [^hofmann2024Dialect] alongside classic contextual association biases [^caliskan2017] and toxicity amplification [^gehman2020]. Measuring and controlling those disparities requires combining counterfactual behavioral probes, confusion-matrix parity checks, finite-sample statistical uncertainty, and subgroup probability calibration across every deployment stage.

## Representational vs. allocative harm and counterfactual audits

Evaluations separate fairness failures into two distinct categories based on how harm reaches users [^gallegos2024]. **Representational harm** degrades how a system portrays social groups inside generated prose through stereotyping, unequal occupational associations [^parrish2022], patronizing dialect framing [^hofmann2024Dialect], or asymmetric sentiment and toxicity [^dhamala2021]. Even low-level subword tokenization choices contribute to unfairness when non-Latin scripts split into longer token sequences, shrinking usable context windows and inflating inference latency [^petrov2023]. **Allocative harm**, by contrast, arises whenever a model scores, ranks, filters, or routes requests such that equally qualified individuals receive unequal opportunities, service speeds, or pricing tiers across candidate triage, credit screening, or support routing.

Testing allocative fairness reliably begins with <span data-glossary="counterfactual">counterfactual</span> matched-pair audits [^kusner2017Counterfactual]. Rather than comparing two unmatched observational cohorts that already differ in topic complexity, role seniority, or writing length, a matched-pair test holds all factual qualifications constant while perturbing only a single protected cue or dialect register across variants $(x_i^{(A)}, x_i^{(B)})$ for $i = 1, \dots, n$. Because both variants share the same underlying case, pairing cancels item-to-item noise and isolates stylistic or demographic sensitivity directly.

For continuous rubric scores $s(\cdot)$ and binary routing decision $\hat{y}_i^{(g)} = \mathbb{I}[s(x_i^{(g)}) \ge \tau]$, engineers track three paired quantities together: the mean score gap $\bar{\Delta} = \frac{1}{n}\sum_i \bigl(s(x_i^{(A)}) - s(x_i^{(B)})\bigr)$, the discordant threshold-flip ratio where identical cases cross opposite sides of cutoff $\tau$, and non-parametric statistical significance using exact sign-flip permutation testing, the Wilcoxon signed-rank test, or McNemar's test on discordant binary decisions [^pennStatePairedBinary2026]. Checking score shifts alongside threshold flips ensures that small uniform bias near a dense score band never escapes detection.

<figure>
  <img src="illustrations/_generated/bias_detection_dark.png" alt="Line chart comparing rubric scores across six identical matched prompt pairs phrased in standard technical prose versus conversational dialect. Despite identical qualifications, conversational phrasing scores systematically lower and frequently crosses below the 0.70 auto-serve threshold." />
  <figcaption>Counterfactual matched pairs reveal threshold flips immediately: although both variants describe identical qualifications, dialect rewrites score systematically lower and drop repeatedly below the 0.70 routing cutoff.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy,scipy, output=show, id=counterfactual-paired-lab -->
```python title="counterfactual-matched-pair-audit.py"
import numpy as np
from scipy.stats import wilcoxon

# Matched qualification pairs scored under standard prose vs. conversational dialect
standard_scores = np.array([
    0.80, 0.78, 0.75, 0.79, 0.73, 0.82, 0.77, 0.81, 0.74, 0.76, 0.83, 0.72,
    0.79, 0.75, 0.84, 0.71, 0.78, 0.80, 0.73, 0.77, 0.81, 0.74, 0.76, 0.79,
])
dialect_scores = np.array([
    0.72, 0.67, 0.64, 0.69, 0.62, 0.76, 0.68, 0.74, 0.65, 0.69, 0.75, 0.63,
    0.71, 0.66, 0.77, 0.64, 0.69, 0.72, 0.66, 0.71, 0.73, 0.65, 0.68, 0.72,
])

cutoff = 0.70
deltas = standard_scores - dialect_scores
mean_delta = float(np.mean(deltas))

# Paired bootstrap 95% CI across matched items
rng = np.random.default_rng(42)
boot_means = [
    float(np.mean(deltas[rng.integers(0, len(deltas), size=len(deltas))]))
    for _ in range(4000)
]
ci_lo, ci_hi = np.percentile(boot_means, [2.5, 97.5])

# Exact sign-flip permutation p-value (two-sided)
perm_means = np.empty(4000)
for b in range(4000):
    signs = rng.choice([-1.0, 1.0], size=len(deltas))
    perm_means[b] = np.mean(signs * deltas)
perm_p = float(np.mean(np.abs(perm_means) >= abs(mean_delta)))

stat, wilcoxon_p = wilcoxon(standard_scores, dialect_scores, alternative="two-sided")

std_pass = standard_scores >= cutoff
dia_pass = dialect_scores >= cutoff
only_std_pass = int(np.sum(std_pass & ~dia_pass))
only_dia_pass = int(np.sum(~std_pass & dia_pass))

print(f"Matched pairs (n={len(deltas)}): mean_delta = {mean_delta:+.4f} (95% CI [{ci_lo:+.4f}, {ci_hi:+.4f}])")
print(f"Permutation p = {perm_p:.5f} | Wilcoxon stat = {stat:.1f}, p = {wilcoxon_p:.6f}")
print(f"Standard auto-serve rate: {np.mean(std_pass):.3f} | Dialect auto-serve rate: {np.mean(dia_pass):.3f}")
print(f"Discordant routing flips at {cutoff:.2f}: standard-only={only_std_pass}, dialect-only={only_dia_pass}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Matched pairs (n=24): mean_delta = +0.0829 (95% CI [+0.0771, +0.0887])
Permutation p = 0.00000 | Wilcoxon stat = 0.0, p = 0.000017
Standard auto-serve rate: 1.000 | Dialect auto-serve rate: 0.417
Discordant routing flips at 0.70: standard-only=14, dialect-only=0
```
<!-- leetllm: output:end -->

Pairing converts a noisy evaluation audit into sharp causal evidence. Even across `24` matched pairs, isolating phrasing changes across identical facts pins down a narrow positive shift interval (`+0.0771` to `+0.0887` points) and reveals `14` one-sided threshold flips (`standard-only=14`, `dialect-only=0`) where standard prose advances while conversational phrasing stalls. That contrast shows why unpaired cohort averages routinely miss decision-cutoff bias until counterfactual pairs make the asymmetry unmistakable.

## Group fairness metrics and the impossibility trade-offs

Moving from matched counterfactuals to observed production traffic requires evaluating group outcomes across cohorts whose underlying qualification distributions may differ [^fairlearn2026Metrics]. Given subgroup label $G \in \{A, B\}$, binary ground-truth label $Y \in \{0, 1\}$, predicted score $S \in [0, 1]$, and binary decision $\hat{Y} = \mathbb{I}[S \ge \tau]$, four confusion-matrix definitions govern group fairness audits. **Demographic Parity** matches overall selection rates $P(\hat{Y}=1 \mid G=A) = P(\hat{Y}=1 \mid G=B)$ regardless of true positive prevalence, whereas **Equal Opportunity** [^hardt2016] equalizes true positive recall $\text{TPR}_A = \text{TPR}_B$ across qualified instances. **Equalized Odds** strengthens Equal Opportunity by demanding parity in both true positive rate and false positive rate ($\text{FPR}_A = \text{FPR}_B$), while **Within-Group Calibration** (or predictive sufficiency) matches observed positive odds $\text{PPV}_g = P(Y=1 \mid \hat{Y}=1, G=g)$ across cohorts above the score cutoff.

A classic impossibility theorem proved by Chouldechova [^chouldechova2017] and Kleinberg, Mullainathan, and Raghavan [^kleinberg2016] demonstrates mathematically that whenever two cohorts have unequal positive base rates $p_A = P(Y=1 \mid G=A) \neq p_B$ and predictions are imperfect ($\text{FPR} > 0, \text{TPR} < 1$), calibration and error-rate balance cannot hold at the same time. Rewriting Bayes' rule across the group confusion matrix produces Chouldechova's exact identity connecting all three quantities:

$$
\text{FPR}_g = \frac{p_g}{1 - p_g} \cdot \frac{1 - \text{PPV}_g}{\text{PPV}_g} \cdot \text{TPR}_g
$$

Inspecting that relation makes the conflict completely transparent. Suppose Cohort A carries positive base rate $p_A = 0.40$ while Cohort B carries base rate $p_B = 0.20$, producing base-odds factors $\frac{p_A}{1 - p_A} = \frac{2}{3}$ versus $\frac{p_B}{1 - p_B} = \frac{1}{4}$. Enforcing Equal Opportunity ($\text{TPR}_A = \text{TPR}_B = 0.80$) while holding predictive precision close across groups forces Cohort A's false positive rate to stay markedly higher than Cohort B's, whereas equalizing both TPR and FPR separates precision [^pleiss2017]. Engineering and policy teams must therefore decide which error asymmetry aligns with application risk instead of demanding simultaneous equality across incompatible formulas.

<figure>
  <img src="illustrations/_generated/fairness_metric_map_dark.png" alt="Matrix of fairness metrics across two cohorts with 40 percent and 20 percent positive base rates. Matching true positive rates forces false positive rates, selection rates, and precision to diverge." />
  <figcaption>When underlying positive base rates differ (40% vs. 20%), enforcing Equal Opportunity (80% TPR for both cohorts) produces gaps across selection rate, false positive rate, and positive predictive precision.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy,scikit-learn, output=show, id=group-fairness-impossibility-lab -->
```python title="group-fairness-tradeoffs.py"
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix


def cohort_dataset(n: int, base_rate: float, seed: int) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    y = rng.binomial(1, base_rate, size=n)
    x = np.where(y[:, None] == 1, rng.normal(0.55, 1.0, (n, 3)), rng.normal(-0.55, 1.0, (n, 3)))
    return x, y


def metrics_at_threshold(y_true: np.ndarray, scores: np.ndarray, tau: float) -> dict[str, float]:
    pred = (scores >= tau).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, pred, labels=[0, 1]).ravel()
    return {
        "sel": float(np.mean(pred)),
        "tpr": tp / max(tp + fn, 1),
        "fpr": fp / max(fp + tn, 1),
        "ppv": tp / max(tp + fp, 1),
    }


X_tr_a, y_tr_a = cohort_dataset(800, 0.40, seed=10)
X_tr_b, y_tr_b = cohort_dataset(800, 0.20, seed=11)
clf = LogisticRegression().fit(np.vstack([X_tr_a, X_tr_b]), np.concatenate([y_tr_a, y_tr_b]))

X_a, y_a = cohort_dataset(3000, 0.40, seed=20)
X_b, y_b = cohort_dataset(3000, 0.20, seed=21)
s_a = clf.predict_proba(X_a)[:, 1]
s_b = clf.predict_proba(X_b)[:, 1]

# Match TPR ~ 0.80 per cohort vs. shared cutoff 0.50 vs. matching selection rate ~ 0.30
tau_eo_a = float(np.quantile(s_a[y_a == 1], 0.20))
tau_eo_b = float(np.quantile(s_b[y_b == 1], 0.20))
tau_dp_a = float(np.quantile(s_a, 0.70))
tau_dp_b = float(np.quantile(s_b, 0.70))

policies = [
    ("Shared tau=0.50", 0.50, 0.50),
    ("Equal Opportunity (TPR~0.80)", tau_eo_a, tau_eo_b),
    ("Demographic Parity (Sel~0.30)", tau_dp_a, tau_dp_b),
]

for name, t_a, t_b in policies:
    m_a = metrics_at_threshold(y_a, s_a, t_a)
    m_b = metrics_at_threshold(y_b, s_b, t_b)
    print(f"\n=== {name} (tau_A={t_a:.3f}, tau_B={t_b:.3f}) ===")
    for k in ["sel", "tpr", "fpr", "ppv"]:
        print(f"  {k.upper():3s}: Cohort A={m_a[k]:.3f} | Cohort B={m_b[k]:.3f} | diff={m_a[k] - m_b[k]:+.3f}")

# Verify Chouldechova identity numerically on Shared tau=0.50
m_a50 = metrics_at_threshold(y_a, s_a, 0.50)
p_a = float(np.mean(y_a))
rhs_fpr = (p_a / (1.0 - p_a)) * ((1.0 - m_a50["ppv"]) / m_a50["ppv"]) * m_a50["tpr"]
print(f"\nChouldechova identity check (Cohort A): observed FPR={m_a50['fpr']:.5f}, formula={rhs_fpr:.5f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
=== Shared tau=0.50 (tau_A=0.500, tau_B=0.500) ===
  SEL: Cohort A=0.309 | Cohort B=0.180 | diff=+0.129
  TPR: Cohort A=0.675 | Cohort B=0.613 | diff=+0.062
  FPR: Cohort A=0.067 | Cohort B=0.069 | diff=-0.002
  PPV: Cohort A=0.870 | Cohort B=0.696 | diff=+0.173

=== Equal Opportunity (TPR~0.80) (tau_A=0.334, tau_B=0.275) ===
  SEL: Cohort A=0.391 | Cohort B=0.310 | diff=+0.081
  TPR: Cohort A=0.800 | Cohort B=0.799 | diff=+0.001
  FPR: Cohort A=0.120 | Cohort B=0.184 | diff=-0.064
  PPV: Cohort A=0.815 | Cohort B=0.527 | diff=+0.288

=== Demographic Parity (Sel~0.30) (tau_A=0.524, tau_B=0.290) ===
  SEL: Cohort A=0.300 | Cohort B=0.300 | diff=+0.000
  TPR: Cohort A=0.659 | Cohort B=0.788 | diff=-0.129
  FPR: Cohort A=0.063 | Cohort B=0.175 | diff=-0.112
  PPV: Cohort A=0.874 | Cohort B=0.537 | diff=+0.338

Chouldechova identity check (Cohort A): observed FPR=0.06704, formula=0.06704
```
<!-- leetllm: output:end -->

Look closely at both the exact numerical identity verification (`observed FPR == formula`) and how metrics shift across the three policies. Under the shared `0.50` threshold learned across pooled data, false positive rates stay nearly identical (`0.067` vs `0.069`), while Cohort B receives lower true positive recall (`0.613` vs `0.675`) and lower precision (`0.696` vs `0.870`) because its base rate is half as high. Forcing `TPR ~ 0.80` parity aligns recall (`0.800` vs `0.799`) and trims the selection gap (`+0.081`), yet pushes Cohort B's false positive rate upward (`0.184` vs `0.120`) and widens the precision (`PPV`) gap to `+0.288`, whereas Demographic Parity equalizes selection at `0.300` while stretching both the false positive gap (`0.063` vs `0.175`) and the precision gap (`0.874` vs `0.537`) further apart. Notice also one word of caution in practice: never confuse mathematical tension across metrics with an excuse to skip calibration, because each metric illuminates a distinct operational cost.

## Intersectional slices, Wilson uncertainty, and judge pitfalls

Aggregate cohort reporting suffers from two critical failure modes in production systems: **marginal averaging hides intersectional spikes**, and **small slice counts create noisy false alarms**. Suppose marginal false-negative error sits near `16.7%` across non-native prompt phrasing and appears modest when pooled across career stages. Disaggregating along both dimensions (`Career stage x Prompt register`) exposes a `24.0%` false-negative spike concentrated specifically inside `Early career x Non-native`, nearly five times higher than `Senior x Standard` (`5.0%`).

Before tuning routing thresholds on any individual <span data-glossary="evaluation-slice">evaluation slice</span>, compute binomial uncertainty bounds such as the **Wilson score confidence interval** [^scipyBinomialCI2026] [^fairlearn2026Uncertainty] rather than reacting to raw percentages from low-volume subsets. Given $k$ observed failures across $n$ qualified items and normal critical quantile $z = \Phi^{-1}(1 - \alpha/2)$ ($z \approx 1.96$ for 95% confidence), the Wilson interval remains strictly inside $[0, 1]$ and stays well-behaved when slice counts are moderate:

$$
\text{CI}_{\text{Wilson}} = \frac{\hat{p} + \frac{z^2}{2n} \pm z\sqrt{\frac{\hat{p}(1-\hat{p})}{n} + \frac{z^2}{4n^2}}}{1 + \frac{z^2}{n}}
$$

Beyond statistical uncertainty, three measurement pitfalls quietly distort fairness telemetry if left unguarded in real deployments:

- **<span data-glossary="selection-bias">Selective labels</span>**: True outcomes are typically recorded only for examples that pass the automated threshold [^selectiveLabels2017]. Whenever dialect inputs below `0.70` get routed into silent human backlogs or rejections without ground-truth follow-up, production dashboards become blind to false negatives unless randomized audit holdbacks grade rejected items too.
- **<span data-glossary="position-bias">Judge ordering and sycophancy bias</span>**: Pairwise LLM-as-a-judge evaluators exhibit significant primacy or recency slot preferences [^agarwal2019positionBias], bend toward user presuppositions [^sharma2023sycophancy], and display capability-linked leniency gaps [^judge2026Ensemble]. Always score pairs in both forward and swapped positions before aggregating judge decisions.
- **Tokenizer verbosity inflation**: Non-standard phrasing and non-English characters fragment into extra subword tokens per sentence [^petrov2023], altering prompt-window truncation and length-normalized log-likelihood penalties asymmetrically across user groups.

<figure>
  <img src="illustrations/_generated/intersectional_error_grid_dark.png" alt="Heatmap of false-negative error rates across career stage and prompt register. Overall averages hide a 24 percent miss rate on early-career non-native prompt phrasing." />
  <figcaption>Disaggregating false-negative rates across Career Stage and Prompt Register exposes a 24% miss rate on early-career non-native phrasing that single-axis marginal summaries conceal.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy,scipy, output=show, id=intersectional-wilson-ci-lab -->
```python title="intersectional-wilson-intervals.py"
import numpy as np
from scipy.stats import binomtest

# Intersectional slice positive counts (false_negatives, total_positives) matching Fig 3 proportions
SLICE_COUNTS = {
    ("Early career", "Standard"): (16, 200),
    ("Early career", "Colloquial"): (21, 150),
    ("Early career", "Non-native"): (18, 75),
    ("Mid career", "Standard"): (14, 200),
    ("Mid career", "Colloquial"): (16, 160),
    ("Mid career", "Non-native"): (16, 100),
    ("Senior", "Standard"): (10, 200),
    ("Senior", "Colloquial"): (12, 150),
    ("Senior", "Non-native"): (12, 100),
}

target_ceiling = 0.15
print(f"{'Slice':30s} | {'k/n':9s} | {'FNR':6s} | {'95% Wilson CI':18s} | {'Status'}")
print("-" * 82)
for (stage, reg), (fn, n) in SLICE_COUNTS.items():
    res = binomtest(fn, n)
    ci = res.proportion_ci(confidence_level=0.95, method="wilson")
    rate = fn / n
    if ci.low > target_ceiling:
        status = "EXCEEDS CEILING"
    elif ci.high > target_ceiling:
        status = "UNDER-POWERED"
    else:
        status = "WITHIN BUDGET"
    label = f"{stage} x {reg}"
    print(f"{label:30s} | {fn:3d}/{n:<4d}  | {rate:5.1%} | [{ci.low:5.1%}, {ci.high:5.1%}]   | {status}")

# Compare marginal average across Prompt Register = Non-native vs. worst intersectional slice
nn_fn = sum(v[0] for (_, reg), v in SLICE_COUNTS.items() if reg == "Non-native")
nn_n = sum(v[1] for (_, reg), v in SLICE_COUNTS.items() if reg == "Non-native")
print(f"\nMarginal Non-native FNR: {nn_fn / nn_n:.1%} ({nn_fn}/{nn_n}) vs. Early-career Non-native: 24.0%")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Slice                          | k/n       | FNR    | 95% Wilson CI      | Status
----------------------------------------------------------------------------------
Early career x Standard        |  16/200   |  8.0% | [ 5.0%, 12.6%]   | WITHIN BUDGET
Early career x Colloquial      |  21/150   | 14.0% | [ 9.3%, 20.5%]   | UNDER-POWERED
Early career x Non-native      |  18/75    | 24.0% | [15.8%, 34.8%]   | EXCEEDS CEILING
Mid career x Standard          |  14/200   |  7.0% | [ 4.2%, 11.4%]   | WITHIN BUDGET
Mid career x Colloquial        |  16/160   | 10.0% | [ 6.2%, 15.6%]   | UNDER-POWERED
Mid career x Non-native        |  16/100   | 16.0% | [10.1%, 24.4%]   | UNDER-POWERED
Senior x Standard              |  10/200   |  5.0% | [ 2.7%,  9.0%]   | WITHIN BUDGET
Senior x Colloquial            |  12/150   |  8.0% | [ 4.6%, 13.5%]   | WITHIN BUDGET
Senior x Non-native            |  12/100   | 12.0% | [ 7.0%, 19.8%]   | UNDER-POWERED

Marginal Non-native FNR: 16.7% (46/275) vs. Early-career Non-native: 24.0%
```
<!-- leetllm: output:end -->

Notice the operational difference between `"EXCEEDS CEILING"` and `"UNDER-POWERED"` in the printout. For `Mid career x Non-native` (`16/100 = 16.0%`), the lower Wilson bound (`10.1%`) still drops safely below `15%`, signaling that teams should expand targeted audit labeling rather than reacting to noisy threshold crossings. Meanwhile, `Early career x Non-native` (`24.0%`, Wilson CI `[15.8%, 34.8%]`) breaches the `15%` budget even at its conservative lower endpoint, pinpointing exactly where mitigation effort belongs first.

## Subgroup calibration, mitigation, and release gates

Engineering teams often adjust routing thresholds immediately or fine-tune reward weights blindly without verifying **within-group <span data-glossary="calibration">calibration</span>** first. When an LLM rubric assigns higher confidence scores to formal phrasing than conversational phrasing at identical underlying quality, or shifts raw Group B log-odds upward relative to Group A at equal empirical success probabilities, a shared `0.70` cutoff distorts both precision and error burden silently across cohorts [^pleiss2017]. Fitting per-subgroup calibration on log-odds before choosing operational thresholds realigns predicted probabilities with true empirical outcome frequencies cleanly.

Durable mitigation composes safeguards across three execution layers rather than relying on one late patch:

1. **Prompt and representation normalization (pre-processing)**: Standardize superficial formatting cues, redact demographic markers unrelated to task qualification, swap judge slot orderings systematically, and apply contextual prior calibration [^zhao2021Calibration] before computing final rubric scores. During post-training alignment with RLHF or DPO [^rafailov2023], pairing balanced counterfactual demonstrations curbs dialect penalties directly inside model weights.
2. **Subgroup Platt calibration on log-odds (post-processing)**: Transform raw confidence scores via logit inversion $\ell = \log\frac{p}{1 - p}$ and fit a group-specific monotonic logistic calibrator (`LogisticRegression`) on held-out labeled validation sets. Aligning predicted odds within each cohort drops <span data-glossary="brier-score">Brier score</span> and Expected Calibration Error sharply while collapsing false-positive and recall distortion before policy stakeholders select threshold trade-offs [^hardt2016].
3. **Manifest-checked parity release gates and drift monitoring**: Enforce completeness across declared matched pairs and intersectional slices before promotion, ensuring worker timeouts or omitted difficult examples never inflate parity statistics artificially. Continuously logging <span data-glossary="eval-gate">release gate</span> metrics and live slice score distributions closes the feedback loop before production prompt shifts widen disparities again.

<figure>
  <img src="illustrations/_generated/mitigation_layers_dark.png" alt="Calibration reliability curves showing uncalibrated LLM score outputs over-predicting Group B positive outcomes relative to Group A, while subgroup Platt scaling aligns both groups with the ideal diagonal." />
  <figcaption>Subgroup calibration mismatch distorts shared thresholds: Group B raw scores over-predict observed positive outcomes relative to Group A until group-level Platt calibration realigns predicted odds.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/shipping_fairness_loop_dark.png" alt="Four-stage fairness control loop moving from counterfactual prompt pairs and subgroup calibration to parity gate checks before release and live slice drift re-audits afterward." />
  <figcaption>Closing the fairness control loop: audit counterfactual pairs, verify subgroup calibration, enforce Wilson CI parity gates before promotion, and monitor live routing drift for slice regressions.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy,scipy,scikit-learn, output=show, id=subgroup-calibration-mitigation-lab -->
```python title="subgroup-calibration-and-release-gate.py"
import numpy as np
from scipy.special import logit
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss


def generate_calibrated_drift_data(n_per_group: int, seed: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Generate true labels and uncalibrated raw rubric scores with subgroup drift."""
    rng = np.random.default_rng(seed)
    groups = np.concatenate([np.zeros(n_per_group, dtype=int), np.ones(n_per_group, dtype=int)])
    n = 2 * n_per_group
    latent_quality = rng.normal(0.0, 1.15, size=n)
    p_true = 1.0 / (1.0 + np.exp(-latent_quality))
    y = rng.binomial(1, p_true)

    # Group A scores track calibrated log-odds closely; Group B raw rubric scores inflate (+0.95 shift)
    raw_logits = np.where(groups == 0, 1.02 * latent_quality - 0.05, 0.88 * latent_quality + 0.95)
    raw_scores = np.clip(1.0 / (1.0 + np.exp(-raw_logits)), 1e-4, 1.0 - 1e-4)
    return groups, raw_scores, y


def group_ece(y_true: np.ndarray, probs: np.ndarray, n_bins: int = 8) -> float:
    edges = np.quantile(probs, np.linspace(0.0, 1.0, n_bins + 1))
    ece = 0.0
    for i in range(n_bins):
        mask = (probs >= edges[i]) & (probs <= edges[i + 1] if i == n_bins - 1 else probs < edges[i + 1])
        if np.any(mask):
            ece += np.mean(mask) * abs(float(np.mean(y_true[mask])) - float(np.mean(probs[mask])))
    return float(ece)


def evaluate_slice_gap(groups: np.ndarray, scores: np.ndarray, y: np.ndarray, cutoff: float = 0.70) -> dict[str, float]:
    out = {}
    for g, name in [(0, "A"), (1, "B")]:
        m = groups == g
        pred = scores[m] >= cutoff
        pos = y[m] == 1
        out[f"tpr_{name}"] = float(np.mean(pred[pos]))
        out[f"brier_{name}"] = float(brier_score_loss(y[m], scores[m]))
        out[f"ece_{name}"] = group_ece(y[m], scores[m])
    out["tpr_gap"] = abs(out["tpr_A"] - out["tpr_B"])
    return out


g_val, raw_val, y_val = generate_calibrated_drift_data(1000, seed=42)
g_test, raw_test, y_test = generate_calibrated_drift_data(1000, seed=43)

# Fit group-wise Platt scaling on log-odds using a held-out validation split
cal_test = np.zeros_like(raw_test)
val_logits = logit(raw_val)
test_logits = logit(raw_test)
for g in (0, 1):
    m_val = g_val == g
    m_te = g_test == g
    cal = LogisticRegression().fit(val_logits[m_val].reshape(-1, 1), y_val[m_val])
    cal_test[m_te] = cal.predict_proba(test_logits[m_te].reshape(-1, 1))[:, 1]

before = evaluate_slice_gap(g_test, raw_test, y_test, cutoff=0.70)
after = evaluate_slice_gap(g_test, cal_test, y_test, cutoff=0.70)

print(
    f"Before calibration | Brier A={before['brier_A']:.4f}, B={before['brier_B']:.4f} | "
    f"ECE A={before['ece_A']:.4f}, B={before['ece_B']:.4f} | TPR gap={before['tpr_gap']:.3f}"
)
print(
    f"After calibration  | Brier A={after['brier_A']:.4f}, B={after['brier_B']:.4f} | "
    f"ECE A={after['ece_A']:.4f}, B={after['ece_B']:.4f} | TPR gap={after['tpr_gap']:.3f}"
)

# Verify full test manifest presence plus calibrated parity tolerance before shipping
expected_rows = len(g_test)
manifest_complete = (len(cal_test) == expected_rows) and not np.isnan(cal_test).any()
gate_ok = manifest_complete and after["tpr_gap"] <= 0.05 and after["ece_B"] <= 0.04
print(f"Release gate passed: {gate_ok} (manifest_complete={manifest_complete})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Before calibration | Brier A=0.1984, B=0.2456 | ECE A=0.0468, B=0.2071 | TPR gap=0.409
After calibration  | Brier A=0.1981, B=0.2017 | ECE A=0.0444, B=0.0334 | TPR gap=0.013
Release gate passed: True (manifest_complete=True)
```
<!-- leetllm: output:end -->

Look carefully at what logit-space Platt calibration accomplishes cleanly on held-out queries. Transforming probability scores back into unconstrained log-odds preserves Group A's already well-aligned calibration curve while correcting Group B's systematic `+0.95` logit inflation completely, bringing Group B's Brier score, ECE, and True Positive Rate gap well inside release-gate tolerances without retraining the base LLM. Always confirm manifest completeness (`manifest_complete=True`) alongside metric bounds so dropped test rows cannot masquerade as parity improvement.

## Common pitfalls in LLM fairness audits

- **Stopping at unmatched marginal averages**: Group selection rates or pooled F1 scores routinely mask opposing dialect shifts or localized intersectional failures (`Early career x Non-native`) that only matched-pair tests and slice grids reveal clearly. Unless counterfactual comparisons pair equivalent cases directly, confounded task difficulty distorts fairness conclusions.
- **Confusing noisy small slices with systematic drift**: Acting immediately on a high error percentage from `n = 15` examples triggers endless threshold instability and harms majority-slice accuracy unnecessarily. Always separate `"EXCEEDS CEILING"` from `"UNDER-POWERED"` via Wilson confidence intervals before tuning production parameters.
- **Ignoring incomplete evaluation manifests**: Silently skipping failing prompts, rate-limited requests, or incomplete matched pairs biases parity metrics optimistically toward easier inputs. Automated release gates must verify that observed case IDs match the full declared evaluation manifest before evaluating parity bounds.
- **Optimizing incompatible metrics simultaneously**: Attempting to match Demographic Parity, Equal Opportunity, Equalized Odds, and Within-Group Calibration under unequal subgroup base rates violates Chouldechova's theorem mathematically. Document which fairness guarantee fits your routing stakes upfront, verify within-group calibration first, and monitor selective-label holdbacks continuously after release.

## Check your understanding

```mastery-quiz
[
  {
    "id": "bf-m1-matched-pair",
    "question": "Why does an audit pair identical candidate qualifications phrased in standard technical prose versus conversational dialect instead of comparing two independent samples of applications from each user segment?",
    "options": [
      "Independent cohort samples fail to separate score thresholds from label frequency.",
      "Keeping qualifications identical isolates dialect effects from unobserved trait gaps.",
      "Sign tests detect non-zero median differences when sample variances match closely.",
      "Balanced scorecards equalize precision across cohorts when cutoff rules stay fixed."
    ],
    "answer": "Keeping qualifications identical isolates dialect effects from unobserved trait gaps.",
    "explanation": "In observational cohorts, true qualifications and topic complexity confound group score comparisons. Perturbing only dialect or protected cues across identical items isolates causal model sensitivity cleanly."
  },
  {
    "id": "bf-m2-impossibility",
    "question": "Cohort A has positive base rate p_A = 0.40 and Cohort B has p_B = 0.20, and a classifier is calibrated with equal PPV across both groups while making nonzero mistakes. According to Chouldechova's identity, what must happen to True Positive Rate and False Positive Rate?",
    "options": [
      "TPR and FPR remain balanced across groups whenever threshold tau stays near 0.50.",
      "TPR, FPR, and PPV diverge across groups under nonzero error and unequal base rates.",
      "Matching positive selection rates preserves equal TPR across divergent base rates.",
      "Subgroup Platt calibration aligns both FPR and PPV alongside Equalized Odds."
    ],
    "answer": "TPR, FPR, and PPV diverge across groups under nonzero error and unequal base rates.",
    "explanation": "Chouldechova's equation FPR = [p/(1-p)] * [(1-PPV)/PPV] * TPR ties FPR, TPR, and PPV through the cohort base-odds ratio p/(1-p). Differing base rates prevent simultaneous equality of all three."
  },
  {
    "id": "bf-m3-wilson-ci",
    "question": "You observe 4 false negatives out of 20 qualified examples in a newly audited slice (20%), whereas your safety target ceiling is 12%. Why should you check the 95% Wilson confidence interval before modifying global routing thresholds?",
    "options": [
      "At n=20, the interval dips under 12%, showing small-sample variance overlaps target.",
      "At n=20, binomial intervals break down whenever numerator counts remain positive.",
      "Small evaluation subsets understate true tail risk relative to pooled test averages.",
      "Confidence bounds scale inversely with sample variance across held-out audits."
    ],
    "answer": "At n=20, the interval dips under 12%, showing small-sample variance overlaps target.",
    "explanation": "For 4/20 = 20.0%, the 95% Wilson CI runs roughly from 8.1% to 41.6%, spanning well below the 12% target. Labeling the slice under-powered and gathering targeted examples avoids over-reacting to sampling noise."
  },
  {
    "id": "bf-m4-selective-labels",
    "question": "A model triage router sends requests scoring >= 0.70 to automated handling and rejects requests below 0.70 without human grading. Why can evaluating precision solely on served traffic hide unfair rejection disparities?",
    "options": [
      "Rejected items lack ground-truth outcomes, concealing false negatives below 0.70.",
      "Routing cutoffs force precision to match recall across scores exceeding 0.70.",
      "Served traffic balances counterfactual query pairs across all confidence quantiles.",
      "Area under the ROC curve discards positive examples falling beneath the threshold."
    ],
    "answer": "Rejected items lack ground-truth outcomes, concealing false negatives below 0.70.",
    "explanation": "When outcomes are observed only for accepted cases, false negatives filtered below the cutoff never appear in production outcome tables unless randomized holdback probes label rejected slices."
  },
  {
    "id": "bf-m5-judge-order",
    "question": "An LLM pairwise judge favors Candidate 1 over Candidate 2 in 68% of comparisons regardless of content quality. Which evaluation safeguard mitigates this artifact directly?",
    "options": [
      "Fix decoding temperature near zero on forward runs to stabilize rubric rankings.",
      "Score both slot orderings per pair and reconcile swapped judgments systematically.",
      "Replace pairwise LLM scoring with character-length ratios across model outputs.",
      "Report pooled candidate win percentages across shuffled evaluation subsets."
    ],
    "answer": "Score both slot orderings per pair and reconcile swapped judgments systematically.",
    "explanation": "Position bias causes judges to reward whichever candidate appears first (or last). Swapping candidate slots and verifying symmetric consistency removes slot preference from evaluation scores."
  },
  {
    "id": "bf-m6-calibration-mismatch",
    "question": "Suppose Group B's uncalibrated LLM scores overestimate positive probabilities (predicting 0.75 when empirical success is 0.58), while Group A scores match true empirical rates. What happens under a shared 0.70 routing cutoff?",
    "options": [
      "Both cohorts maintain equal empirical precision above the 0.70 routing bar.",
      "Group B admits extra false positives above 0.70 due to inflated score odds.",
      "Group B lowers Brier loss relative to Group A near the upper probability tail.",
      "Shared cutoffs break counterfactual score alignment across identical candidate pairs."
    ],
    "answer": "Group B admits extra false positives above 0.70 due to inflated score odds.",
    "explanation": "Overconfident raw scores in Group B allow lower true-quality inputs to clear the shared 0.70 bar, degrading calibration (ECE/Brier) and inflating false positives until group-wise calibration aligns predicted probabilities."
  },
  {
    "id": "bf-m7-manifest-integrity",
    "question": "An automated fairness test manifest lists 120 matched counterfactual pairs, but a worker timeout drops 12 difficult dialect pairs before metric aggregation, leaving 108 clean pairs that pass parity checks. What should the release gate do?",
    "options": [
      "Accept the 108 completed cases because observed subgroup parity clears the bar.",
      "Block release because dropped difficult dialect cases skew the measured gap.",
      "Resample 12 passing pairs to restore full manifest size before parity scoring.",
      "Replace Wilcoxon testing with unweighted mean gaps across completed candidates."
    ],
    "answer": "Block release because dropped difficult dialect cases skew the measured gap.",
    "explanation": "Missing or timed-out cases often correlate with longer or more complex dialect inputs. Release gates must verify that observed case IDs match the complete manifest before evaluating parity bounds."
  }
]
```

> **Next:** Continue to [Hallucination Detection & Mitigation](/learn/hallucination-detection-mitigation). Fair routing guarantees consistent treatment across user cohorts, yet a system can still route both groups equally into fluent responses that contradict retrieved facts unless claims are checked individually.
