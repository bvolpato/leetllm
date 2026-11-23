---
{
  "id": "capstone-evaluation-dashboard",
  "title": "Capstone: Eval Dashboard",
  "slug": "capstone-evaluation-dashboard",
  "section": "Portfolio Capstones",
  "category": "Evaluation & Benchmarks",
  "difficulty": "Hard",
  "order": 7,
  "coverImage": "social_banner.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "Two model builds can tie at 75.0% aggregate accuracy while one regresses sharply on safety jailbreaks and calibration. Build a statistical evaluation dashboard with paired inference, pass@k scaling, Expected Calibration Error, and filter-proof release gates.",
  "keyConceptsTested": [
    "paired slice evaluation",
    "bootstrap confidence intervals",
    "McNemar and Wilcoxon paired tests",
    "unbiased pass@k estimation",
    "reliability curves and ECE",
    "position-swap judge consistency",
    "filter-isolated release gates",
    "precision-driven coverage planning"
  ]
}
---

Two retrieval-augmented candidate builds can hit the exact same 75.0% overall pass rate on a frozen 120-item evaluation suite yet behave completely differently where it matters. In our comparison dataset, the candidate reranker improves paraphrase robustness by nearly twenty-three percentage points while crashing twenty-four points on safety jailbreak refusals and losing calibration accuracy on confident errors. Any dashboard sorted only by headline average hides that trade-off and risks approving an unsafe release simply because gains on easy slices offset safety failures. Evaluating model builds responsibly requires keeping slice performance, statistical uncertainty, calibration error, and hard release rules visible at the same time.

This capstone picks up where the preceding [document QA capstone](/learn/capstone-document-qa-product) left off by scaling single-item verification into a complete multi-slice statistical dashboard. Instead of hardcoding lookups or ad-hoc type checks, you will construct an aligned per-item benchmark table in Pandas and analyze three model builds (`baseline-bm25`, `rag-rerank-v2`, and `rag-rerank-v3`) using genuine scientific tooling from NumPy, SciPy, and scikit-learn. Each analytical stage answers a separate engineering question without muddling measurement together with user-interface filtering. Together, these components turn raw model predictions into an audit-ready release decision:

1. **Alignment check:** Did every candidate run against identical item identifiers, slice tags, and grader configurations?
2. **Paired slice inference:** Which capability slices gained or regressed beyond sampling noise, even when aggregate averages tie?
3. **Sampling scaling and calibration:** How do multi-sample `pass@k` availability, single-shot selection accuracy, Brier score, and Expected Calibration Error diverge across builds?
4. **Filter-isolated release gating:** How can engineers slice and filter failure examples interactively without letting a filtered view override full-suite release rules?

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Architecture diagram showing aligned baseline, v2, and v3 predictions entering slice metrics, paired bootstrap and McNemar tests, calibration scoring, and an immutable release gate separated from UI filters." />
  <figcaption>A reliable evaluation pipeline separates dataset alignment and immutable slice gates from interactive dashboard filtering, blocking rag-rerank-v2 at 75.0% aggregate pass rate while approving rag-rerank-v3 once safety and calibration recover.</figcaption>
</figure>

The worked dataset embedded across the five Python modules models a complete 120-item retrieval and generation suite executed in memory with deterministic seeds so every statistical test, confidence interval, and calibration bin reproduces exactly on your machine. Run the five Python cells sequentially in a single session because each step consumes the Pandas tables and statistical arrays built upstream. Every visual check, metric breakdown, and test assertion reads directly from those shared objects rather than duplicating summary constants by hand. Keeping a single source of truth from benchmark rows through final release state prevents metrics from drifting out of sync between notebooks and dashboards.

```mermaid
flowchart LR
  accDescr: End-to-end model evaluation workflow from a frozen 120-item multi-slice dataset through paired scoring, bootstrap CIs, McNemar tests, ECE calibration, immutable release gates, and filtered dashboard inspection views.
  data["1. Frozen Eval Suite<br/>N=120 items, 4 slices"]:::primary --> score["2. Paired Model Outputs<br/>pass, rubric, confidence"]:::secondary
  score --> stats["3. Paired Stats & ECE<br/>Bootstrap, McNemar, Brier"]:::secondary
  stats --> gate["4. Full-Suite Release Gate<br/>hold or ship decision"]:::warning
  gate --> view["5. UI Filter Projection<br/>slice view & blocker traces"]:::success
```

## Model slices and the aggregate tie

Aggregate benchmarks routinely blend qualitatively different capabilities into one weighted scalar, masking localized regressions whenever a change helps one category and breaks another. HELM demonstrated across dozens of foundation models that organizing evaluations into an explicit scenario-by-metric matrix preserves crucial trade-offs in accuracy, robustness, fairness, and calibration that a single leaderboard rank conceals.[^liang2023] In a production retrieval system, four operational slices capture distinct failure mechanisms that no scalar average should conflate. Grouping items cleanly by capability makes every behavioral shift legible as soon as a new checkpoint finishes training:

| Evaluation slice | Items | Gate floor | Primary failure mode measured |
| --- | ---: | ---: | --- |
| `factual_qa` | 35 | 0.80 | Missing grounded facts or misreading retrieved passages |
| `paraphrase_robustness` | 35 | 0.75 | Sensitivity to reworded phrasing on identical underlying facts |
| `abstention_unanswerable` | 25 | 0.65 | Hallucinating fluent claims instead of abstaining when context lacks evidence |
| `safety_jailbreak` | 25 | 0.90 | Complying with prompt injection or adversarial policy-bypass instructions |

Notice how each slice answers an independent operational requirement with its own tolerance for risk. A model that lifts `paraphrase_robustness` from 57.1% to 80.0% clearly generalizes better over syntactic variation, yet if its aggressive generation triggers lower compliance on `safety_jailbreak` (`68.0%` against a strict `0.90` release floor), shipping it degrades overall system reliability. Conversely, `rag-rerank-v3` pairs updated safety refusal tuning and calibrated abstention thresholds with the improved reranker, preserving paraphrase accuracy while raising `safety_jailbreak` to `96.0%`. Constructing all three builds on the exact same 120 aligned `eval-XXX` items lets us inspect every gain and loss side by side in code.

Execute this first module to construct the 120-item paired evaluation table (`eval_df`), inspect per-slice binary accuracy across all three builds, and verify the aggregate 75.0% tie between `baseline-bm25` and `rag-rerank-v2`. Notice how both builds score `90/120` overall despite swinging by more than twenty percentage points in opposite directions on paraphrase handling and safety compliance. Retaining per-item scores, continuous judge rubric ratings, and model confidence values in one unified Pandas DataFrame sets up all downstream inference modules cleanly. Inspect both the aggregate tie and the individual slice rates printed below before computing formal uncertainty bands.

<!-- leetllm: test, deps=numpy,scipy,pandas,scikit-learn, id=eval-data, output=show -->

```python title="eval_slice_dataset.py"
import numpy as np
import pandas as pd

SLICE_ORDER = [
    "factual_qa",
    "paraphrase_robustness",
    "abstention_unanswerable",
    "safety_jailbreak",
]
SLICE_FLOORS = {
    "factual_qa": 0.80,
    "paraphrase_robustness": 0.75,
    "abstention_unanswerable": 0.65,
    "safety_jailbreak": 0.90,
}


def _paired_outcomes(n: int, base_passes: int, cand_passes: int, drops: int) -> tuple[np.ndarray, np.ndarray]:
    base = np.array([1] * base_passes + [0] * (n - base_passes), dtype=int)
    cand = base.copy()
    pass_idx = np.where(base == 1)[0]
    fail_idx = np.where(base == 0)[0]
    gains = (cand_passes - base_passes) + drops
    if drops > 0:
        cand[pass_idx[-drops:]] = 0
    if gains > 0:
        cand[fail_idx[:gains]] = 1
    elif gains < 0:
        cand[pass_idx[-drops - (-gains) : -drops]] = 0
    return base, cand


def _calibrated_confidences(y: np.ndarray, bin_specs: list[tuple[int, int, float, float]], seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    idx1 = np.where(y == 1)[0].copy()
    idx0 = np.where(y == 0)[0].copy()
    rng.shuffle(idx1)
    rng.shuffle(idx0)
    conf = np.zeros(len(y), dtype=float)
    p1 = p0 = 0
    for n_pos, n_neg, lo, hi in bin_specs:
        sel = np.concatenate([idx1[p1 : p1 + n_pos], idx0[p0 : p0 + n_neg]])
        p1 += n_pos
        p0 += n_neg
        conf[sel] = rng.uniform(lo, hi, len(sel))
    return np.round(conf, 3)


def build_eval_dataframe() -> pd.DataFrame:
    rng = np.random.default_rng(2026)
    slices = (
        ["factual_qa"] * 35
        + ["paraphrase_robustness"] * 35
        + ["abstention_unanswerable"] * 25
        + ["safety_jailbreak"] * 25
    )
    b_f, v2_f = _paired_outcomes(35, 29, 30, drops=1)
    b_p, v2_p = _paired_outcomes(35, 20, 28, drops=1)
    b_a, v2_a = _paired_outcomes(25, 18, 15, drops=4)
    b_s, v2_s = _paired_outcomes(25, 23, 17, drops=6)

    base_pass = np.concatenate([b_f, b_p, b_a, b_s])
    v2_pass = np.concatenate([v2_f, v2_p, v2_a, v2_s])
    v3_pass = np.concatenate([
        np.array([1] * 31 + [0] * 4),
        np.array([1] * 30 + [0] * 5),
        np.array([1] * 19 + [0] * 6),
        np.array([1] * 24 + [0] * 1),
    ])

    df = pd.DataFrame({
        "item_id": [f"eval-{i:03d}" for i in range(120)],
        "slice": slices,
        "grader_hash": "rubric-v4.2-sha256",
        "baseline_pass": base_pass,
        "v2_pass": v2_pass,
        "v3_pass": v3_pass,
    })

    df["baseline_rubric"] = np.clip(0.32 + 0.50 * base_pass + rng.normal(0, 0.05, 120), 0.05, 0.98).round(3)
    df["v2_rubric"] = np.clip(
        df["baseline_rubric"]
        + 0.14 * (df["slice"] == "paraphrase_robustness")
        - 0.08 * (df["slice"] == "abstention_unanswerable")
        - 0.22 * (df["slice"] == "safety_jailbreak")
        + rng.normal(0, 0.03, 120),
        0.05,
        0.99,
    ).round(3)
    df["v3_rubric"] = np.clip(0.34 + 0.56 * v3_pass + rng.normal(0, 0.04, 120), 0.05, 0.99).round(3)

    df["baseline_conf"] = _calibrated_confidences(
        base_pass, [(1, 7, 0.10, 0.19), (2, 6, 0.25, 0.39), (5, 5, 0.43, 0.57), (22, 8, 0.64, 0.78), (60, 4, 0.85, 0.96)], 11
    )
    df["v2_conf"] = _calibrated_confidences(
        v2_pass, [(0, 1, 0.14, 0.19), (1, 2, 0.28, 0.38), (3, 4, 0.46, 0.58), (14, 11, 0.66, 0.79), (72, 12, 0.87, 0.98)], 22
    )
    df["v3_conf"] = _calibrated_confidences(
        v3_pass, [(1, 4, 0.16, 0.195), (2, 4, 0.29, 0.37), (3, 3, 0.45, 0.55), (10, 3, 0.72, 0.78), (88, 2, 0.94, 0.985)], 33
    )
    return df


eval_df = build_eval_dataframe()
summary = (
    eval_df.groupby("slice", sort=False)[["baseline_pass", "v2_pass", "v3_pass"]]
    .agg(["count", "mean"])
)
for sl in SLICE_ORDER:
    sub = eval_df[eval_df["slice"] == sl]
    print(
        f"{sl:24s} n={len(sub):2d}  "
        f"baseline={sub['baseline_pass'].mean():.3f}  "
        f"v2={sub['v2_pass'].mean():.3f}  "
        f"v3={sub['v3_pass'].mean():.3f}"
    )
print(
    f"{'AGGREGATE':24s} n={len(eval_df):2d}  "
    f"baseline={eval_df['baseline_pass'].mean():.3f}  "
    f"v2={eval_df['v2_pass'].mean():.3f}  "
    f"v3={eval_df['v3_pass'].mean():.3f}"
)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
factual_qa               n=35  baseline=0.829  v2=0.857  v3=0.886
paraphrase_robustness    n=35  baseline=0.571  v2=0.800  v3=0.857
abstention_unanswerable  n=25  baseline=0.720  v2=0.600  v3=0.760
safety_jailbreak         n=25  baseline=0.920  v2=0.680  v3=0.960
AGGREGATE                n=120  baseline=0.750  v2=0.750  v3=0.867
```
<!-- leetllm: output:end -->

## Paired inference: bootstrap CIs, McNemar, and Wilcoxon tests

Observed slice differences still fluctuate with which finite items happen to sit inside a 25- or 35-item benchmark slice. As introduced in the [hypothesis-testing lesson](/learn/hypothesis-tests-confidence-intervals-passk), pairing baseline and candidate runs on identical `item_id` rows isolates the algorithmic difference from shared prompt difficulty.[^efron1979] Matching strictly on `item_id` rather than positional row order is non-negotiable whenever model workers stream predictions asynchronously into object storage. Joining out-of-order predictions by table row position scrambles the discordant pairs and fabricates meaningless deltas while leaving both marginal pass rates untouched.

Three complementary paired statistical checks expose distinct facets of a model change. First, resampling the paired difference vector $d_i = y_{i,\text{cand}} - y_{i,\text{base}}$ via SciPy's percentile bootstrap (`scipy.stats.bootstrap`) produces a 95% uncertainty interval for each slice delta without relying on asymptotic normality across small 25-item counts.[^scipyBootstrap2026] Second, exact **McNemar testing** examines only the discordant binary pairs where the two models disagree: $n_{01}$ items where the candidate rescued a baseline failure and $n_{10}$ items where the candidate broke a baseline pass.[^statsmodelsMcNemar2026] Under the null hypothesis of equal error probability, discordant flips follow a symmetric binomial distribution with $p = 0.5$, evaluated exactly via `scipy.stats.binomtest` even when counts fall below normal-approximation rules of thumb.[^scipyBinomtest2026] Third, running `scipy.stats.wilcoxon` on paired continuous judge rubric scores detects systematic quality shifts (`abstention_unanswerable`, $p < 0.0001$) before minor degradations tip items all the way from binary pass to binary fail.

<figure>
  <img src="illustrations/_generated/dashboard_surface_dark.png" alt="Interval plot comparing rag-rerank-v2 minus baseline-bm25 paired deltas across four evaluation slices and the aggregate average, showing +22.9 pp paraphrase gain offset by a -24.0 pp safety jailbreak drop to yield a +0.0 pp aggregate tie." />
  <figcaption>Each horizontal marker displays the mean paired difference and 95% bootstrap interval for rag-rerank-v2 relative to baseline-bm25. Paraphrase robustness improves significantly (+22.9 pp) while safety jailbreak compliance collapses (-24.0 pp), cancelling neatly to +0.0 pp overall.</figcaption>
</figure>

Notice in the next Python cell how pairing item identifiers survives arbitrary table shuffling while exposing statistically significant gains on `paraphrase_robustness` ($n_{01}=9, n_{10}=1, p=0.0215$) alongside significant regressions on `safety_jailbreak` ($n_{01}=0, n_{10}=6, p=0.0312$). Look equally closely at the aggregate line: because total wins ($n_{01}=12$) equal total regressions ($n_{10}=12$), an aggregate McNemar test returns $p = 1.0000$ and a bootstrap interval centered cleanly on zero (`[-0.083, +0.083]`). Without slice stratification, both statistical tests and simple means silently equate an improved paraphrase retriever with a dangerous safety regression. Execute the cell to confirm exact confidence intervals, exact binomial $p$-values, Wilcoxon rubric tests, and row-order invariance.

<!-- leetllm: test, deps=numpy,scipy,pandas,scikit-learn, continue=eval-data, id=eval-stats, output=show -->

```python title="paired_significance_ci.py"
from scipy import stats


def summarize_paired_comparison(df: pd.DataFrame, cand_prefix: str = "v2") -> pd.DataFrame:
    rows = []
    for group_name in SLICE_ORDER + ["ALL"]:
        sub = df if group_name == "ALL" else df[df["slice"] == group_name]
        b = sub["baseline_pass"].to_numpy(dtype=float)
        c = sub[f"{cand_prefix}_pass"].to_numpy(dtype=float)
        diff = c - b
        boot = stats.bootstrap(
            (diff,),
            np.mean,
            n_resamples=4000,
            confidence_level=0.95,
            method="percentile",
            random_state=42,
        )
        n01 = int(((b == 0) & (c == 1)).sum())
        n10 = int(((b == 1) & (c == 0)).sum())
        p_mcnemar = float(
            stats.binomtest(min(n01, n10), n=n01 + n10, p=0.5).pvalue
        ) if (n01 + n10) > 0 else 1.0
        rubric_diff = (sub[f"{cand_prefix}_rubric"] - sub["baseline_rubric"]).to_numpy(dtype=float)
        w_res = stats.wilcoxon(rubric_diff)
        rows.append({
            "slice": group_name,
            "n": len(sub),
            "delta": float(diff.mean()),
            "ci_low": float(boot.confidence_interval.low),
            "ci_high": float(boot.confidence_interval.high),
            "n01": n01,
            "n10": n10,
            "mcnemar_p": p_mcnemar,
            "wilcoxon_p": float(w_res.pvalue),
        })
    return pd.DataFrame(rows)


v2_stats_df = summarize_paired_comparison(eval_df, "v2")
for _, row in v2_stats_df.iterrows():
    print(
        f"{row['slice']:24s} n={int(row['n']):3d} "
        f"delta={row['delta']:+.3f} [{row['ci_low']:+.3f}, {row['ci_high']:+.3f}] "
        f"n01={int(row['n01']):2d} n10={int(row['n10']):2d} "
        f"McNemar_p={row['mcnemar_p']:.4f} Wilcoxon_p={row['wilcoxon_p']:.4f}"
    )

# Verify order invariance: shuffling candidate rows before aligning by item_id reproduces identical deltas.
shuffled = eval_df[["item_id", "v2_pass", "v2_rubric"]].sample(frac=1.0, random_state=7)
realigned = eval_df[["item_id", "slice", "baseline_pass", "baseline_rubric"]].merge(
    shuffled, on="item_id", validate="one_to_one"
)
assert np.array_equal(
    (eval_df["v2_pass"] - eval_df["baseline_pass"]).to_numpy(),
    (realigned["v2_pass"] - realigned["baseline_pass"]).to_numpy(),
)
print("Paired alignment order-invariance check passed.")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
factual_qa               n= 35 delta=+0.029 [-0.057, +0.115] n01= 2 n10= 1 McNemar_p=1.0000 Wilcoxon_p=0.6822
paraphrase_robustness    n= 35 delta=+0.229 [+0.086, +0.400] n01= 9 n10= 1 McNemar_p=0.0215 Wilcoxon_p=0.0000
abstention_unanswerable  n= 25 delta=-0.120 [-0.280, +0.040] n01= 1 n10= 4 McNemar_p=0.3750 Wilcoxon_p=0.0000
safety_jailbreak         n= 25 delta=-0.240 [-0.400, -0.080] n01= 0 n10= 6 McNemar_p=0.0312 Wilcoxon_p=0.0000
ALL                      n=120 delta=+0.000 [-0.083, +0.083] n01=12 n10=12 McNemar_p=1.0000 Wilcoxon_p=0.0741
Paired alignment order-invariance check passed.
```
<!-- leetllm: output:end -->

## Sampling headroom versus single-shot reliability (`pass@k`)

When teams deploy coding assistants or multi-step reasoning agents evaluated on benchmarks such as SWE-bench, reporting only a single greedy draw misses whether correct solutions exist inside the model's sampling distribution.[^swebenchEvaluation2026] Evaluating $n$ independent stochastic completions per problem and measuring $c$ successes lets you estimate **`pass@k`**: the probability that drawing $k \le n$ samples without replacement yields at least one passing completion. Simply averaging naive empirical success across small subsamples introduces high variance, whereas Chen and colleagues derived the minimum-variance unbiased estimator directly from hypergeometric counting:[^chen2021][^humanEvalEstimator2026]

$$
\text{pass@}k = 1 - \frac{\binom{n-c}{k}}{\binom{n}{k}} = 1 - \prod_{j=n-c+1}^{n}\left(1 - \frac{k}{j}\right).
$$

Writing the estimator in sequential product form avoids overflowing binomial coefficients when $n$ reaches hundreds of samples per prompt. At the same time, distinguish **oracle availability** from **single-attempt deployment**: `pass@5 = 0.896` only means a verifier capable of recognizing any passing draft finds one in almost 90% of prompts, whereas serving users a single picked sample without an external verifier remains bounded by your reranked `pass@1` score. Worse still, drawing multiple unguarded samples on adversarial queries amplifies tail exposure, because the probability that at least one of $k$ attempts triggers an unsafe output rises alongside $k$.

<figure>
  <img src="illustrations/_generated/filter_gate_dark.png" alt="Two-part figure plotting unbiased pass@k curves across k=1, 3, 5, and 10 alongside a view-model table proving UI slice filters leave the safety hold decision untouched." />
  <figcaption>Increasing k raises oracle pass@k across all three builds, while reranked single-shot selection trails oracle curves and UI filters only change visible rows without altering the locked release decision.</figcaption>
</figure>

The cell below evaluates `pass@k` at $k \in \{1, 3, 5, 10\}$ on a 25-prompt multi-step synthesis slice (`n = 12` completions per prompt) across all three models, verifies the analytical edge check `pass@3 = 0.800` when `c = 2` passes exist in `n = 6` drafts, and prints selected single-attempt accuracy side by side with `pass@10`. Notice how `rag-rerank-v2` closes nearly half the gap to `v3` at `k = 10` (`0.980` vs `0.999`) while trailing sharply on `selected@1`, underscoring why decoding headroom cannot substitute for reliable single-shot ranking or safety compliance.

<!-- leetllm: test, deps=numpy,scipy,pandas,scikit-learn, continue=eval-stats, id=eval-passk, output=show -->

```python title="pass_at_k_estimator.py"
import math


def pass_at_k(n: int, c: int, k: int) -> float:
    if n - c < k:
        return 1.0
    return float(1.0 - np.prod(1.0 - k / np.arange(n - c + 1, n + 1)))


# Exact combinatorial check: C(6, 3) = 20 subsets, C(4, 3) = 4 all-fail subsets -> 1 - 4/20 = 0.80
assert abs(pass_at_k(6, 2, 3) - (1.0 - math.comb(4, 3) / math.comb(6, 3))) < 1e-12

N_SAMPLES = 12
pass_counts = {
    "baseline": np.array([10] * 8 + [5] * 8 + [2] * 5 + [0] * 4),
    "v2": np.array([11] * 10 + [6] * 7 + [3] * 5 + [1] * 3),
    "v3": np.array([11] * 13 + [7] * 7 + [4] * 4 + [2] * 1),
}
selected_pass_at_1 = {"baseline": 0.440, "v2": 0.600, "v3": 0.720}

passk_rows = {}
for model, counts in pass_counts.items():
    metrics = {f"pass@{k}": float(np.mean([pass_at_k(N_SAMPLES, int(c), k) for c in counts])) for k in (1, 3, 5, 10)}
    metrics["selected@1"] = selected_pass_at_1[model]
    passk_rows[model] = metrics
    print(
        f"{model:10s}  "
        + "  ".join(f"pass@{k}={metrics[f'pass@{k}']:.3f}" for k in (1, 3, 5, 10))
        + f"  selected@1={metrics['selected@1']:.3f}"
    )
```

<!-- leetllm: output:start -->
```text title="Output" output compact
baseline    pass@1=0.433  pass@3=0.680  pass@5=0.768  pass@10=0.837  selected@1=0.440
v2          pass@1=0.567  pass@3=0.808  pass@5=0.896  pass@10=0.980  selected@1=0.600
v3          pass@1=0.700  pass@3=0.925  pass@5=0.976  pass@10=0.999  selected@1=0.720
```
<!-- leetllm: output:end -->

## Calibration, Brier score, and Expected Calibration Error

Binary pass rates tell you how often answers succeed, not whether the model's self-reported confidence predicts when it is about to fail. Guo and colleagues showed that modern neural networks frequently exhibit severe overconfidence despite high classification accuracy, pushing softmax or verifier probabilities far above empirical accuracy.[^guo2017] In abstention and safety systems, an overconfident wrong model fails silently at the exact moments downstream routing relies on uncertainty thresholds to escalate or refuse. Assessing probability quality therefore belongs right next to accuracy inside the core evaluation panel.

Scikit-learn provides `calibration_curve` to bin predicted confidence probabilities and compare average predicted confidence against observed empirical pass frequency in each bin, alongside `brier_score_loss` to measure proper mean squared probability error.[^sklearnCalibration2026] Weighting each bin's absolute calibration gap by its sample proportion gives **Expected Calibration Error (ECE)**:

$$
\mathrm{ECE} = \sum_{b=1}^{B}\frac{|I_b|}{N}\left|\mathrm{acc}(I_b) - \mathrm{conf}(I_b)\right|.
$$

A strictly proper scoring rule like Brier score rewards both discrimination and honest probability scaling, whereas ECE isolates pure calibration alignment across probability bins. Run the calibration evaluation below to compare `baseline-bm25`, `rag-rerank-v2`, and `rag-rerank-v3`. Notice that while `baseline` and `v2` share identical 75.0% overall accuracy, `v2`'s Brier score jumps from `0.1243` to `0.1684` and its ECE nearly triples from `0.0307` to `0.0834` due to confident mistakes (`85.7%` actual pass rate inside the `[0.80, 1.00]` bin whose mean confidence is `0.919`), while `v3` tightens both Brier (`0.0658`) and ECE (`0.0151`) sharply.

<!-- leetllm: test, deps=numpy,scipy,pandas,scikit-learn, continue=eval-passk, id=eval-cal, output=show -->

```python title="calibration_and_ece.py"
from sklearn.calibration import calibration_curve
from sklearn.metrics import brier_score_loss


def compute_ece(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 5) -> float:
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    n = len(y_true)
    for lo, hi in zip(bins[:-1], bins[1:]):
        mask = (y_prob >= lo) & (y_prob <= hi if hi == 1.0 else y_prob < hi)
        if mask.sum() > 0:
            ece += (mask.sum() / n) * abs(float(y_true[mask].mean()) - float(y_prob[mask].mean()))
    return float(ece)


cal_summary = {}
for model, pass_col, conf_col in [
    ("baseline", "baseline_pass", "baseline_conf"),
    ("v2", "v2_pass", "v2_conf"),
    ("v3", "v3_pass", "v3_conf"),
]:
    y_true = eval_df[pass_col].to_numpy()
    y_prob = eval_df[conf_col].to_numpy()
    brier = float(brier_score_loss(y_true, y_prob))
    ece = compute_ece(y_true, y_prob, n_bins=5)
    frac_pos, mean_pred = calibration_curve(y_true, y_prob, n_bins=5, strategy="uniform")
    cal_summary[model] = {"brier": brier, "ece": ece, "frac_pos": frac_pos, "mean_pred": mean_pred}
    print(f"{model:10s}  Brier={brier:.4f}  ECE={ece:.4f}")
    print(f"   bin acc ={np.round(frac_pos, 3).tolist()}  bin conf={np.round(mean_pred, 3).tolist()}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
baseline    Brier=0.1243  ECE=0.0307
   bin acc =[0.125, 0.25, 0.5, 0.733, 0.938]  bin conf=[0.138, 0.329, 0.497, 0.7, 0.907]
v2          Brier=0.1684  ECE=0.0834
   bin acc =[0.0, 0.333, 0.429, 0.56, 0.857]  bin conf=[0.171, 0.329, 0.512, 0.723, 0.919]
v3          Brier=0.0658  ECE=0.0151
   bin acc =[0.2, 0.333, 0.5, 0.769, 0.978]  bin conf=[0.169, 0.33, 0.509, 0.749, 0.963]
```
<!-- leetllm: output:end -->

## Judge order checks, UI filter isolation, and coverage growth

Evaluating open-ended response clarity with an LLM-as-a-judge introduces systematic ordering artifacts unless prompts are audited directly. Zheng and colleagues documented prominent <span data-glossary="position-bias">position bias</span> and verbosity bias across judged pairwise benchmarks, where models disproportionately favor whichever candidate occupies the first slot.[^zheng2023] Running every comparison in both `(A, B)` and `(B, A)` orders and requiring the exact same model identity to win under both presentations catches slot bias automatically, labeling flipped verdicts `unresolved` rather than defaulting to a canonical order or silently calling an inconsistent swap a quality tie. Crucially, favorable stylistic clarity can never override deterministic slice safety gates or calibration checks.

Interactive dashboard filters pose an equally subtle risk when engineers explore evaluation failures slice by slice. Filtering the dashboard UI down to `paraphrase_robustness` and toggling `passed_only=True` produces a clean 100% pass display over visible inspection rows, yet computing release readiness over that filtered subset would turn a safety regression into a false green light. Similarly, an empty query intersection where zero rows match must return `None` (`undefined`) for the visible rate rather than dividing by zero or displaying `0%` alongside fake approval. Decoupling the UI view model from the full-suite release gate keeps two responsibilities cleanly separated: `evaluate_candidate` checks grader hash equality, full-suite coverage, and every mandatory slice floor to set `decision` (`ship_candidate`, `hold_candidate`, or `hold_comparison`), while `build_dashboard_view` strictly filters drill-down inspection tables while pinning full-run safety blockers.

Finite 25- and 35-item slices also leave wide sampling uncertainty even before deployment begins: at $n=25$ and $92\%$ accuracy, the 95% Wilson interval still spans $\pm 11.4$ percentage points, limiting your power to distinguish real regressions from draw noise. Using the exact Wilson score half-width formula lets teams plan how many curated benchmark items each capability slice needs to shrink confidence intervals below roughly $\pm 5$ to $\pm 7$ percentage points:

| Slice | Current items | Current 95% half-width | Target items | Target 95% half-width |
| --- | ---: | ---: | ---: | ---: |
| `factual_qa` | 35 | +/-11.6 pp | 200 | +/-4.9 pp |
| `paraphrase_robustness` | 35 | +/-12.9 pp | 240 | +/-5.0 pp |
| `abstention_unanswerable` | 25 | +/-17.9 pp | 180 | +/-7.1 pp |
| `safety_jailbreak` | 25 | +/-11.4 pp | 160 | +/-4.3 pp |

<figure>
  <img src="illustrations/_generated/coverage_plan_dark.png" alt="Grouped bar comparison of current sample counts versus target sample counts across all four benchmark slices to tighten 95% Wilson confidence half-widths." />
  <figcaption>Scaling slice sizes from 25–35 diagnostic items to 160–240 curated items cuts 95% Wilson interval half-widths by more than half, turning exploratory smoke slices into tight statistical release gates.</figcaption>
</figure>

The final Python module puts every invariant together into runnable release logic and executable regression assertions. Inspect how `resolve_pairwise_preference` isolates swapped judge outputs, how `evaluate_candidate` returns `hold_comparison` whenever grader hashes or item sets diverge and `hold_candidate` whenever any required slice floor fails, and how `build_dashboard_view` proves that aggressive UI filtering cannot erase blocking failures or forge a passing rate on zero matching items. Execute this module to observe both `rag-rerank-v2` (blocked at 75.0% overall due to safety and calibration failures) and `rag-rerank-v3` (approved across every slice gate).

<!-- leetllm: test, deps=numpy,scipy,pandas,scikit-learn, continue=eval-cal, output=show -->

```python title="dashboard_gates_and_tests.py"
EXPECTED_SLICE_COUNTS = {"factual_qa": 35, "paraphrase_robustness": 35, "abstention_unanswerable": 25, "safety_jailbreak": 25}
MAX_ECE_FLOOR = 0.060


def wilson_half_width(p: float, n: int, z: float = 1.96) -> float:
    denom = 1.0 + (z**2) / n
    return float((z / denom) * math.sqrt((p * (1.0 - p)) / n + (z**2) / (4.0 * n**2)))


def resolve_pairwise_preference(first_slot_ab: str, second_slot_ba: str, model_a: str, model_b: str) -> str:
    pick_ab = {"first": model_a, "second": model_b, "tie": "tie"}[first_slot_ab]
    pick_ba = {"first": model_b, "second": model_a, "tie": "tie"}[second_slot_ba]
    if pick_ab == "tie" and pick_ba == "tie":
        return "tie"
    return pick_ab if pick_ab == pick_ba else "unresolved"


def evaluate_candidate(
    df: pd.DataFrame,
    cand_prefix: str,
    expected_grader: str = "rubric-v4.2-sha256",
    max_ece: float = MAX_ECE_FLOOR,
) -> dict:
    reasons = []
    if len(df) != 120 or not (df["grader_hash"] == expected_grader).all():
        return {"decision": "hold_comparison", "reasons": ["dataset_or_grader_mismatch"], "blockers": []}
    if df["slice"].value_counts().to_dict() != EXPECTED_SLICE_COUNTS:
        return {"decision": "hold_comparison", "reasons": ["slice_count_mismatch"], "blockers": []}

    slice_rates = df.groupby("slice")[f"{cand_prefix}_pass"].mean().to_dict()
    for sl, floor in SLICE_FLOORS.items():
        if slice_rates[sl] < floor:
            reasons.append(f"slice_below_floor:{sl}={slice_rates[sl]:.3f}<{floor:.2f}")

    ece = compute_ece(df[f"{cand_prefix}_pass"].to_numpy(), df[f"{cand_prefix}_conf"].to_numpy())
    if ece > max_ece:
        reasons.append(f"ece_exceeds_limit:{ece:.4f}>{max_ece:.3f}")

    blockers = df[(df["slice"] == "safety_jailbreak") & (df[f"{cand_prefix}_pass"] == 0)]["item_id"].tolist()
    decision = "ship_candidate" if not reasons else "hold_candidate"
    return {
        "decision": decision,
        "aggregate_rate": float(df[f"{cand_prefix}_pass"].mean()),
        "ece": ece,
        "slice_rates": slice_rates,
        "reasons": reasons,
        "blockers": blockers,
    }


def build_dashboard_view(
    df: pd.DataFrame,
    cand_prefix: str,
    slice_filter: str | None = None,
    passed_only: bool = False,
) -> dict:
    full_eval = evaluate_candidate(df, cand_prefix)
    view_df = df.copy()
    if slice_filter is not None:
        view_df = view_df[view_df["slice"] == slice_filter]
    if passed_only:
        view_df = view_df[view_df[f"{cand_prefix}_pass"] == 1]
    n_vis = len(view_df)
    vis_rate = float(view_df[f"{cand_prefix}_pass"].mean()) if n_vis > 0 else None
    return {
        "decision": full_eval["decision"],
        "reasons": full_eval["reasons"],
        "blockers": full_eval["blockers"],
        "visible_count": n_vis,
        "visible_rate": vis_rate,
    }


# Executable verification suite
assert resolve_pairwise_preference("first", "first", "v2", "v3") == "unresolved"
assert resolve_pairwise_preference("first", "second", "v3", "v2") == "v3"

v2_gate = evaluate_candidate(eval_df, "v2")
v3_gate = evaluate_candidate(eval_df, "v3")
assert v2_gate["decision"] == "hold_candidate"
assert v3_gate["decision"] == "ship_candidate"

# Filtering UI down to passing paraphrase rows leaves visible_rate=1.0 but NEVER flips hold_candidate!
masked_view = build_dashboard_view(eval_df, "v2", slice_filter="paraphrase_robustness", passed_only=True)
assert masked_view["visible_count"] == 28 and masked_view["visible_rate"] == 1.0
assert masked_view["decision"] == "hold_candidate" and len(masked_view["blockers"]) == 8

# Empty intersection returns visible_rate=None while preserving safety hold
empty_view = build_dashboard_view(eval_df, "v2", slice_filter="nonexistent_slice")
assert empty_view["visible_count"] == 0 and empty_view["visible_rate"] is None
assert empty_view["decision"] == "hold_candidate"

# Grader hash mismatch triggers hold_comparison immediately
stale_df = eval_df.copy()
stale_df.loc[0, "grader_hash"] = "old-rubric-v3"
assert evaluate_candidate(stale_df, "v3")["decision"] == "hold_comparison"

print("v2 gate:", v2_gate["decision"], v2_gate["reasons"])
print("v3 gate:", v3_gate["decision"], f"agg={v3_gate['aggregate_rate']:.3f} ece={v3_gate['ece']:.4f}")
print("Masked paraphrase view:", f"visible_rate={masked_view['visible_rate']:.3f}", f"decision={masked_view['decision']}")
print("Empty filter view:", f"visible_rate={empty_view['visible_rate']}", f"decision={empty_view['decision']}")
print(f"Safety slice 95% Wilson half-width: n=25 -> +/-{100*wilson_half_width(0.92, 25):.1f} pp, n=160 -> +/-{100*wilson_half_width(0.92, 160):.1f} pp")
print("All dashboard gate and filter-isolation assertions passed.")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
v2 gate: hold_candidate ['slice_below_floor:abstention_unanswerable=0.600<0.65', 'slice_below_floor:safety_jailbreak=0.680<0.90', 'ece_exceeds_limit:0.0834>0.060']
v3 gate: ship_candidate agg=0.867 ece=0.0151
Masked paraphrase view: visible_rate=1.000 decision=hold_candidate
Empty filter view: visible_rate=None decision=hold_candidate
Safety slice 95% Wilson half-width: n=25 -> +/-11.4 pp, n=160 -> +/-4.3 pp
All dashboard gate and filter-isolation assertions passed.
```
<!-- leetllm: output:end -->

```checkpoint
{
  "question": "Baseline and rag-rerank-v2 tie at 75.0% accuracy across 120 items (n01 = 12, n10 = 12), while on safety_jailbreak (n = 25) rag-rerank-v2 wins 0 baseline failures and breaks 6 baseline passes (n01 = 0, n10 = 6). Why does an aggregate test hide the regression that exact slice testing exposes?",
  "answer": "Offsetting discordant pairs across capabilities (gaining on paraphrase_robustness while losing on safety_jailbreak) make aggregate wins equal aggregate losses, driving aggregate McNemar p = 1.0000 and centering the overall bootstrap delta on 0.0 pp. Evaluating the safety_jailbreak slice separately counts n01 = 0, n10 = 6 directly (McNemar p = 0.0312) and triggers the slice floor gate."
}
```

```checkpoint
{
  "question": "An engineer filters the evaluation dashboard to paraphrase_robustness and passed_only=True, yielding 28 visible passing items (100% visible rate), then filters to a slice tag with zero items. What must decision and visible_rate report in both views?",
  "answer": "In both filtered views, decision remains hold_candidate and full-run safety blockers stay pinned because gating evaluates the immutable 120-item slice summary. The 28-item view reports visible_rate = 1.000 only for inspection display, while the empty filter returns visible_rate = None to avoid dividing by zero or displaying a fake percentage."
}
```

## Mastery Quiz

```mastery-quiz
[
  {
    "question": "Two model builds tie at 75.0% overall accuracy across 120 items. Baseline passes 23/25 safety jailbreaks while the candidate passes 17/25 (below the 0.90 floor) and improves paraphrase accuracy by 8 items. What decision should the dashboard output?",
    "options": [
      "ship_candidate, since identical 75.0% aggregate pass accuracy establishes non-regression on the benchmark.",
      "hold_candidate, since slice gating isolates safety_jailbreak below 0.90 regardless of paraphrase gains.",
      "ship_candidate, provided the mean rubric score averaged across the 120 prompts rises above baseline.",
      "hold_comparison, because mismatched slice wins invalidate exact two-sided McNemar testing over prompts."
    ],
    "answer": "hold_candidate, since slice gating isolates safety_jailbreak below 0.90 regardless of paraphrase gains.",
    "explanation": "Aggregate averages let gains on paraphrase items mask safety collapses. A slice floor of 0.90 blocks rag-rerank-v2 regardless of how much paraphrase accuracy improves."
  },
  {
    "question": "A prediction file for rag-rerank-v2 arrives sorted alphabetically by response length rather than eval-000 through eval-119. How must paired bootstrap and McNemar testing align items before subtracting baseline scores?",
    "options": [
      "Subtract by incoming row index straight away once both prediction tables hold 120 rows.",
      "Sort baseline and candidate rows separately by pass/fail label prior to computing score gaps.",
      "Join baseline and candidate predictions strictly by unique item_id with a one-to-one mapping.",
      "Switch paired differences over to unpaired two-sample means whenever input row orders differ."
    ],
    "answer": "Join baseline and candidate predictions strictly by unique item_id with a one-to-one mapping.",
    "explanation": "Joining on unique item_id keeps discordant flips (n01 and n10) tied to the exact same underlying prompt. Positional alignment on reordered rows scrambles pairs while leaving marginal percentages unchanged."
  },
  {
    "question": "On safety_jailbreak (n = 25), rag-rerank-v2 improves zero items missed by baseline (n01 = 0) and fails six items that baseline passed (n10 = 6). Under exact two-sided McNemar testing with binomial null p = 0.5, what is the exact probability of observing at least this imbalance?",
    "options": [
      "p = 0.0312, calculated via two-sided binomial tail 2 * (0.5 ** 6)",
      "p = 0.5000, since total aggregate wins equal total aggregate losses overall",
      "p = 0.2400, matching the observed 24 percentage-point safety slice accuracy drop",
      "p = 0.0156, computed using a single-sided binomial tail lacking factor two"
    ],
    "answer": "p = 0.0312, calculated via two-sided binomial tail 2 * (0.5 ** 6)",
    "explanation": "With n01 + n10 = 6 discordant pairs and all 6 on one side, two-sided exact binomial density yields 2 * (0.5 ** 6) = 1/32 = 0.03125, exposing the statistically significant regression."
  },
  {
    "question": "Why does running Wilcoxon signed-rank testing on continuous judge rubric scores complement McNemar testing on binary pass indicators?",
    "options": [
      "Wilcoxon eliminates item alignment requirements across baseline and candidate evaluation tables.",
      "Wilcoxon captures graded quality drops (such as partial abstention loss) below binary threshold flips.",
      "Wilcoxon assumes strictly Gaussian error residuals across small imbalanced evaluation slices.",
      "Wilcoxon replaces binary safety refusal floors during automated release promotion gating runs."
    ],
    "answer": "Wilcoxon captures graded quality drops (such as partial abstention loss) below binary threshold flips.",
    "explanation": "Binary thresholds discard nuance when responses degrade moderately without yet crossing the pass cutoff, whereas Wilcoxon over continuous rubric deltas preserves ordered magnitude differences across paired items."
  },
  {
    "question": "On a 6-sample coding pool where c = 2 generated drafts pass all tests, you evaluate pass@3 without replacement and separately score a single reranked selection that happens to fail. Which pair of statements is true?",
    "options": [
      "Unbiased pass@3 is 80%, while single-attempt selected accuracy equals 0% on that prompt.",
      "Unbiased pass@3 equals 33.3%, matching the empirical sample pool pass fraction of 2/6.",
      "Unbiased pass@3 is 80%, ensuring the production reranker selects passing code 80% reliably.",
      "Unbiased pass@3 remains undefined whenever the top-ranked production selection turns out wrong."
    ],
    "answer": "Unbiased pass@3 is 80%, while single-attempt selected accuracy equals 0% on that prompt.",
    "explanation": "1 - comb(4, 3)/comb(6, 3) = 1 - 4/20 = 0.80 measures oracle availability across 3 random draws, whereas production single-shot selection succeeded 0/1 times because the reranker picked a failing candidate."
  },
  {
    "question": "Suppose baseline-bm25 and rag-rerank-v2 both score 75.0% overall accuracy, yet rag-rerank-v2 assigns confidence 0.92 on wrong abstentions, doubling Brier score and raising ECE from 0.031 to 0.083. What does ECE specifically measure?",
    "options": [
      "The count-weighted mean gap between predicted confidence and empirical accuracy across bins.",
      "The exact fraction of prompt injection items answered incorrectly inside the safety holdout slice.",
      "The largest spread between training-split pass@1 and held-out validation pass@10 trajectories.",
      "The average half-width of a 95% Wilson binomial interval divided cleanly by slice count."
    ],
    "answer": "The count-weighted mean gap between predicted confidence and empirical accuracy across bins.",
    "explanation": "Expected Calibration Error averages |acc(bin) - conf(bin)| weighted by bin counts, directly penalizing confident mistakes even when overall binary accuracy matches a better-calibrated baseline."
  },
  {
    "question": "An LLM clarity judge prefers Candidate A when shown (A, B) and prefers Candidate B when shown the swapped pair (B, A) (choosing whichever sits in the first slot both times). How should the dashboard record that comparison?",
    "options": [
      "Record Candidate A as winner respecting canonical input ordering.",
      "Record Candidate B as winner respecting the fresher swapped API response.",
      "Mark comparison unresolved due to winner flip across swapped positions.",
      "Average both preference scores to report a balanced quality tie."
    ],
    "answer": "Mark comparison unresolved due to winner flip across swapped positions.",
    "explanation": "Selecting the first slot in both directions indicates position bias rather than genuine preference stability. Marking the comparison unresolved prevents ordering artifacts from passing as verified ties or wins."
  },
  {
    "question": "Why does the dashboard run candidate evaluation with max_ece = 0.060 and hash equality BEFORE evaluating individual slice pass rates?",
    "options": [
      "Hash mismatch flags hold_comparison cleanly so prompt drift avoids model blame, while ECE stops overconfident builds.",
      "Grader hashes improve model accuracy by applying post-hoc temperature scaling to generated sequence token logprobs.",
      "Evaluating ECE beforehand omits binary safety jailbreak pass rates from downstream automated release gate decisions.",
      "Checking grader hashes converts hold_candidate deployment blocks into visible_rate = None filter-slice UI warnings."
    ],
    "answer": "Hash mismatch flags hold_comparison cleanly so prompt drift avoids model blame, while ECE stops overconfident builds.",
    "explanation": "Separating comparison validity (hold_comparison) from model quality failures (hold_candidate) ensures teams never interpret dataset or rubric drift as algorithmic change while enforcing both slice floors and calibration honesty."
  }
]
```

> **Next:** Continue to [Capstone: Fine-Tuned Classifier](/learn/capstone-fine-tuned-classifier). You can now block an unsafe or miscalibrated retrieval candidate even when its aggregate `pass@1` ties baseline and when interactive dashboard filters isolate passing slices. Next you will train a specialized classifier where class imbalance, calibrated probability thresholds, and missed high-risk positive recalls apply those same strict gating principles directly inside model training.
