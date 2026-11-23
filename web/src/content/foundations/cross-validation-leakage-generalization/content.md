---
{
  "id": "cross-validation-leakage-generalization",
  "title": "Validation and Leakage",
  "slug": "cross-validation-leakage-generalization",
  "section": "ML Algorithms & Evaluation",
  "category": "Evaluation & Benchmarks",
  "difficulty": "Medium",
  "order": 5,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "An evaluation score can look nearly perfect because a post-inference field, a repeat user, or a contaminated benchmark already leaked the answer.",
  "keyConceptsTested": [
    "decision-time feature availability",
    "label availability at the model-fit cutoff",
    "train/validation/test split",
    "cross-validation",
    "group leakage",
    "temporal split",
    "preprocessing leakage",
    "locked test set",
    "LLM benchmark contamination",
    "generalization"
  ]
}
---

Prompt trace `#10234` enters a production LLM safety router on July 1 at `09:00:00 UTC`. By `10:22`, downstream orchestration triggers a fallback retry, and on July 15 an offline compliance review overrides the response label. Completed warehouse tables store all of those columns on the same row, tempting engineers to feed them straight into a safety classifier. Yet at `09:00:00 UTC`, the deployed scorer could inspect none of those downstream outcomes, so an impressive score built on future columns answers a completely different question from production inference.

Even when every feature is strictly valid at decision time, empirical risk minimization still chases the lowest loss on the rows it sees during training. Given a training sample $S$ of $n$ labeled examples and a loss function $L$, the optimizer searches for a hypothesis $h$ that minimizes empirical risk over those finite observations. Because gradient updates and tree splits adapt directly to idiosyncrasies of $S$, this in-sample quantity measures training fit rather than out-of-sample reliability:

$$
\hat{R}_S(h) = \frac{1}{n}\sum_{i=1}^n L(h(x_i), y_i)
$$

True deployment performance depends on expected loss over unseen inputs drawn from the population distribution $\mathcal{D}$ rather than memorization of sample $S$. Under finite sampling, model capacity allows $h$ to absorb noise in $x_i$ and $y_i$ that will not repeat on future requests, so training error typically understates deployment error. Writing true population risk explicitly makes this target quantity exact:

$$
R(h) = \mathbb{E}_{(x, y) \sim \mathcal{D}}[L(h(x), y)]
$$

The gap between deployment risk and training loss is the **generalization gap**, $G(h) = R(h) - \hat{R}_S(h)$.[^hastie2009] Under independent identically distributed (i.i.d.) sampling over a fixed hypothesis class, that gap is positive in expectation even though a single lucky draw can turn negative. <span data-glossary="offline-evaluation">Offline evaluation</span> estimates $R(h)$ only for the population and decision conditions your split mirrors. <span data-glossary="data-leakage">Data leakage</span> breaks that isolation whenever unavailable future information enters features or held-out data shapes training or selection, silently inflating scores without necessarily hitting 100% accuracy.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="A time-ordered record for prompt trace #10234 on July 1 at 09:00 UTC. Token length, prior 90-day flags, and ambiguity arrive before 09:00 and enter the inference snapshot. Fallback routing at 10:22, human edit latency at 11:05, and the July 15 audit override arrive after prediction and stay excluded from inference features." />
  <figcaption>For prompt #10234, only fields readable by 09:00:00 UTC enter the inference feature vector. Post-routing fallbacks, reviewer edits, and audit overrides arrive later and remain excluded from model inputs.</figcaption>
</figure>

## Start at the decision moment

Consider evaluating a lightweight safety <span data-glossary="guardrail">guardrail</span> that scores whether an incoming prompt needs human escalation at `09:00:00 UTC`. In these worked examples, later audit labels record `needs_escalation` under the exact moderation rules active when the prompt arrived. Production audits must also verify label consistency across policy versions, inspect selective label coverage, and keep deterministic safety filters active alongside any learned scorer rather than letting classifier probabilities override hard rules. Most importantly, downstream retries, edit latencies, and human overrides do not exist when the router makes its <span data-glossary="prediction-timestamp">decision timestamp</span> call.

| Field | When it exists | Valid at `09:00`? | Reason |
| :--- | :--- | :--- | :--- |
| `prompt_tokens` | Before inference | Yes | Counted from submitted user prompt |
| `prior_flags_90d` | Before inference | Yes | Historical count cached before request opens |
| `ambiguity_score` | Before inference | Yes | Scored from raw prompt text at entry |
| `fallback_triggered_at` | After routing | No | Created by the model's own escalation path |
| `audit_override_at` | Days later | No | Captures post-inference outcome label history |
| `needs_escalation` | After review | Label only | Ground-truth target predicted by the guardrail |

Document this inference-time feature specification before writing any training loop. Every feature vector, prompt template, and retrieval index snapshot must contain solely data readable at that prompt's decision moment, while fitted scalers and weights must obey the model-fit cutoff date. A scaler trained on June traffic may validly transform July requests because June occurred before July; it may never incorporate August statistics when simulating a July release. Checking timestamps in NumPy immediately flags which columns pass the `09:00:00` gate and which belong strictly after decision time.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="audit-feature-availability.py"
import numpy as np

decision_sec = np.datetime64("2026-07-01T09:00:00")
fields = np.array(["prompt_tokens", "prior_flags_90d", "ambiguity_score", "fallback_triggered_at", "audit_override_at"])
observed_sec = np.array([
    "2026-07-01T08:55:00",
    "2026-07-01T08:59:00",
    "2026-07-01T08:59:12",
    "2026-07-01T10:22:15",
    "2026-07-15T12:00:00",
], dtype="datetime64[s]")

allowed = observed_sec <= decision_sec
for name, is_valid in zip(fields, allowed):
    print(f"{name:22} {'ALLOW' if is_valid else 'BLOCK'}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
prompt_tokens          ALLOW
prior_flags_90d        ALLOW
ambiguity_score        ALLOW
fallback_triggered_at  BLOCK
audit_override_at      BLOCK
```
<!-- leetllm: output:end -->

Observation time reflects when the serving runtime could actually read a value, not merely when an upstream database row was timestamped. An account risk change logged at `08:50` that only syncs into Redis at midnight stays invisible to a `09:00` model, and SQL joins stamped `08:59` can still pull backfilled log lines ingested hours later. Derived rolling aggregates should therefore be reconstructed from strict point-in-time snapshots. Labels require a parallel readiness check: a June prompt only reviewed in August cannot enter a July 1 training fit, even though held-out July predictions frozen at inference time can safely wait for delayed validation labels.

```checkpoint
Why is `fallback_triggered_at` invalid even though it appears on every completed trace in the production log?
---
The classifier scores the request before fallback orchestration runs. Feeding downstream routing timestamps into the model gives it a consequence of its own decision, turning offline evaluation into an impossible hindsight simulator.
```

## Train, validation, and test have different jobs

Isolating decision-time inputs is only the first safeguard; fitting parameters, choosing thresholds, and estimating locked generalization also require strict separation. You do not always need three static physical files because cross-validation and nested splits rotate roles inside development data, yet every evaluation claim must preserve the functional division below.[^hastie2009]

| Partition | Allowed operation | Disallowed mistake |
| :--- | :--- | :--- |
| **Train** | Fit weights, tree splits, scalers, encoders, selectors | Claiming training loss reflects deployment generalization |
| **Validation** | Tune hyperparameters, features, architectures, thresholds | Publishing the tuned maximum as an untouched final estimate |
| **Test** | Score one frozen candidate on prespecified metrics | Iterating on test errors and claiming the revised score is independent |

When forecasting future production behavior on incoming prompts, use a chronological <span data-glossary="train-validation-test-split">train, validation, and test split</span>: January through June fits model weights and transforms, July chooses the operating threshold, and August serves as a locked final check before live serving. Fixing those month assignments up front keeps later labels out of earlier calibration steps and ensures validation performance reflects forward generalization rather than random shuffling across seasons. Assigning months programmatically in NumPy ensures no month crosses into an unintended role before training begins.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="make-a-locked-time-split.py"
import numpy as np

# Two prompt episodes per calendar month across months 1..8 (Jan..Aug)
months = np.repeat(np.arange(1, 9), 2)
train_idx = np.flatnonzero(months <= 6)
val_idx = np.flatnonzero(months == 7)
test_idx = np.flatnonzero(months == 8)

print(f"train prompts = {len(train_idx)} (months {months[train_idx].min()}..{months[train_idx].max()})")
print(f"valid prompts = {len(val_idx)} (month {months[val_idx][0]})")
print(f"test  prompts = {len(test_idx)} (month {months[test_idx][0]}, locked)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
train prompts = 12 (months 1..6)
valid prompts = 2 (month 7)
test  prompts = 2 (month 8, locked)
```
<!-- leetllm: output:end -->

```mermaid
flowchart TB
    A["Jan-Jun prompts<br/>fit model and transforms"]:::primary --> B["July prompts<br/>choose threshold"]:::warning
    B --> C["August prompts<br/>single locked estimate"]:::success
    C --> D["September traffic<br/>monitor live outcomes"]:::accent
    E["Check feature and label times<br/>Isolate user groups"]:::danger -. "audit first" .-> C
```

Notice how feedback flow governs honesty rather than merely counting how many times a script opens the test file. If an engineer inspects August mistakes, adds a regex feature, adjusts the threshold, and prints the new August accuracy as independent proof of release quality, test feedback guided selection and inflated the winning figure.[^hastie2009] Evaluating a revised pipeline requires waiting for fresh September data whose labels were unseen during redesign, and ensuring July's validation labels were ready before freezing the August candidate.

## Cross-validation rotates the validation job

A single calendar validation window can happen to be unusually easy or noisy. <span data-glossary="cross-validation">Cross-validation (CV)</span> rotates the validation job across disjoint partitions $V_1, \dots, V_K$ of development data so you measure sensitivity across splits without touching the locked test window.[^sklearn2026CrossValidation] Crucially, the CV risk estimate summarizes refitting the full pipeline $h_{-k}$ from scratch on every $K-1$ fold rather than scoring one fixed checkpoint $K$ times:

$$
\hat{R}_{\text{CV}}(h) = \frac{1}{K} \sum_{k=1}^K \hat{R}_{V_k}(h_{-k})
$$

When folds vary slightly in size, weight each fold score by $|V_k|/n$ so every sample counts equally. Selecting $K$ balances bias, runtime, and correlation among fitted models: $K=5$ or $10$ trains on 80% to 90% of development data and can look conservatively pessimistic if learning curves are still climbing, whereas Leave-One-Out ($K=n$) trains on $n-1$ rows with heavy overlap across fits whose variance depends strongly on algorithm stability and loss smoothness.[^hastie2009] For imbalanced classification, **Stratified K-Fold** balances target proportions approximately across folds, yet it cannot create positives out of thin air when $K$ exceeds the minority class count, nor does stratification enforce group or time isolation.[^sklearn2026CrossValidation]

<!-- leetllm: test, deps=numpy,scikit-learn, output=show -->
```python title="three-positives-cannot-fill-five-folds.py"
import warnings
import numpy as np
from sklearn.model_selection import StratifiedKFold

X = np.zeros((10, 1))
y = np.array([0] * 7 + [1] * 3)
with warnings.catch_warnings(record=True) as caught:
    warnings.simplefilter("always", UserWarning)
    folds = list(StratifiedKFold(n_splits=5).split(X, y))

counts = [int(y[val].sum()) for _, val in folds]
assert sum(counts) == 3 and counts.count(0) == 2
assert any("least populated class" in str(item.message) for item in caught)
print("positive counts per fold:", counts)
print("folds with no positive:", counts.count(0))
print("rare-class warning captured cleanly")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
positive counts per fold: [0, 0, 1, 1, 1]
folds with no positive: 2
rare-class warning captured cleanly
```
<!-- leetllm: output:end -->

Suppose five historical folds return F1 scores of `0.67`, `0.75`, `0.58`, `0.83`, and `0.71` for the safety escalation classifier. On fold 1, catching 4 truly unsafe prompts while flagging 3 safe ones and missing 1 unsafe prompt yields $P = 4/7$, $R = 4/5$, and $F_1 = 2PR / (P + R) = 8/12 \approx 0.67$. Because the harmonic mean drops sharply if either precision or recall lags, and weighs false positives equally with false negatives, production reports should display raw false-negative and false-positive counts beside F1 when setting safety thresholds. Computing both the mean and sample spread across folds also avoids cherry-picking the best fold (`0.83`) when `0.58` highlights thin subgroup support.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="summarize-cross-validation-folds.py"
import numpy as np

fold_f1 = np.array([0.67, 0.75, 0.58, 0.83, 0.71])
mean_f1 = float(fold_f1.mean())
std_f1 = float(fold_f1.std(ddof=1))

print("fold F1 =", fold_f1.tolist())
print(f"mean F1 = {mean_f1:.2f}")
print(f"std  F1 = {std_f1:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
fold F1 = [0.67, 0.75, 0.58, 0.83, 0.71]
mean F1 = 0.71
std  F1 = 0.09
```
<!-- leetllm: output:end -->

Notice two subtleties when summarizing nonlinear ratios across CV partitions. First, averaging per-fold F1 can differ from computing pooled out-of-fold F1 across concatenated predictions whenever fold denominators vary, so always state which aggregation you report. Second, sample standard deviation across five overlapping training sets describes fold dispersion on that dataset rather than serving as a true confidence interval over future unseen traffic.

## Target leakage: when a feature steals the answer key

**Target leakage** occurs when an input column contains information derived directly from the outcome or available only after prediction time. A legitimate pre-decision signal can still correlate strongly with the target without leaking, so engineers should inspect feature timing and lineage before dropping helpful variables. In the scikit-learn comparison below, an honest decision-time rule scores `0.75` over eight prompts, whereas reading a post-audit column that mirrors `y` scores `1.00`. Whenever an evaluation hits suspiciously high accuracy in practice, check for target leakage, duplicate records, label bugs, and trivial dataset size before celebrating.

<!-- leetllm: test, deps=numpy,scikit-learn, output=show -->
```python title="future-field-leakage.py"
import numpy as np
from sklearn.metrics import accuracy_score

ambiguity = np.array([1.4, -0.2, 0.8, 0.1, 1.1, -0.5, 0.3, 0.6])
policy_match = np.array([0, 1, 0, 1, 0, 1, 0, 1])
y = np.array([1, 0, 1, 0, 1, 0, 0, 1])

# Decision-time score uses only prompt ambiguity and rule match known at inference
honest_pred = (ambiguity - 0.9 * policy_match > 0).astype(int)
# Post-decision field mirrors the outcome label after audit completion
leaked_pred = y.copy()

print(f"decision-time accuracy={accuracy_score(y, honest_pred):.2f} preds={honest_pred.tolist()}")
print(f"future-field  accuracy={accuracy_score(y, leaked_pred):.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
decision-time accuracy=0.75 preds=[1, 0, 1, 0, 1, 0, 1, 0]
future-field  accuracy=1.00
```
<!-- leetllm: output:end -->

## Clustered entities change the generalization claim

Standard random splitting assumes observations are independent, yet production telemetry clusters naturally by user, session, document, or tenant. Before writing a splitter, decide whether the model claims accuracy on brand-new users or on repeat traffic from known accounts. If the goal is generalizing to unseen users while earlier prompts from user `u03` sit in training and later prompts sit in validation, any classifier can memorize user-specific vocabulary, rate limits, or embeddings instead of learning transferable safety signals. Running `GroupKFold` versus standard `KFold` on a clustered sample demonstrates how quickly `1.00` paired-row recognition collapses to `0.50` once unseen users stay grouped in held-out folds.[^sklearn2026CrossValidation]

<!-- leetllm: test, deps=numpy,scikit-learn, output=show -->
```python title="group-leakage-from-repeat-users.py"
import numpy as np
from sklearn.metrics import accuracy_score
from sklearn.model_selection import GroupKFold, StratifiedKFold
from sklearn.neighbors import KNeighborsClassifier

# Eight users each submit two prompts; label tracks each user's baseline risk profile
users = np.repeat(np.arange(8), 2)
X_user_fingerprint = np.column_stack([users, np.tile([0.0, 0.01], 8)])
y = users % 2

# Row split mixes prompts from the same user across train and validation
row_accs = []
for tr, va in StratifiedKFold(n_splits=2, shuffle=False).split(X_user_fingerprint, y):
    clf = KNeighborsClassifier(n_neighbors=1).fit(X_user_fingerprint[tr], y[tr])
    row_accs.append(accuracy_score(y[va], clf.predict(X_user_fingerprint[va])))

# GroupKFold isolates entire users on each side of every fold
group_accs = []
for tr, va in GroupKFold(n_splits=2).split(X_user_fingerprint, y, groups=users):
    clf = KNeighborsClassifier(n_neighbors=1).fit(X_user_fingerprint[tr], y[tr])
    group_accs.append(accuracy_score(y[va], clf.predict(X_user_fingerprint[va])))

print(f"paired-row split accuracy   = {np.mean(row_accs):.2f}")
print(f"held-out-user group accuracy = {np.mean(group_accs):.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
paired-row split accuracy   = 0.50
held-out-user group accuracy = 0.00
```
<!-- leetllm: output:end -->

Simply dropping the `user_id` column does not guarantee user independence because stylistic markers, client locale, timestamps, or workspace features still identify returning accounts. Furthermore, `GroupKFold` enforces entity separation without preserving chronological order; whenever deployment requires predicting future behavior on new accounts, combine both a timestamp cutoff and group exclusion in your split logic.

```checkpoint
Why should every prompt from the same user stay in the same fold when testing generalization to new users?
---
Prompts from one account share writing style, domain topics, and metadata fingerprints. Allowing the same user on both sides of a fold rewards user memorization instead of testing generalization to unfamiliar accounts.
```

## Preprocessing can learn from validation rows

Leakage does not require a post-decision timestamp column. Any stateful transform that fits parameters from data, including a `StandardScaler`, imputer, PCA projection, target encoder, or feature selector, leaks information whenever held-out rows participate in `.fit()`.[^sklearn2026leakage] Even unsupervised scaling uses test-set means and variances, while supervised feature selection exposes held-out class labels directly; only stateless fixed transformations such as unit conversions have zero data-dependent state.

<figure>
  <img src="illustrations/_generated/preprocessing_leak_dark.png" alt="Eight literal T, L, and y rows feed two feature selectors. Scanning all eight rows changes the class-mean gaps to T 0.50 and L 0.75, selecting L. Scanning only the four training rows gives T 1.00 and L 0.50, selecting T. Both nearest-mean classifiers fit on the four training rows and score 4 of 4 (leaky) versus 2 of 4 (honest) on the four validation rows." />
  <figcaption>Using validation labels during feature selection picks feature L (class separation 0.75 vs 0.50), yielding 4/4 on validation despite fitting classifiers on training rows alone. Honest training-only selection picks T and scores 2/4.</figcaption>
</figure>

Consider eight rows containing two binary features `T` and `L`. Column `T` aligns perfectly with the four training labels and becomes noisy on validation, whereas column `L` weakly tracks training yet mirrors validation labels closely. Using `NearestCentroid` from `scikit-learn` on training rows alone, selecting the feature with the highest absolute class-mean gap $|\mu_1 - \mu_0|$ across all eight rows picks `L` (gap `0.75` vs `0.50`) and hits `1.00` accuracy on validation, whereas honest training-only selection picks `T` (`1.00` vs `0.50`) and reveals the honest `0.50` score.

<!-- leetllm: test, deps=numpy,scikit-learn, output=show -->
```python title="preprocessing-leakage-two-columns.py"
import numpy as np
from sklearn.metrics import accuracy_score
from sklearn.neighbors import NearestCentroid

T = np.array([1, 1, 0, 0, 1, 1, 0, 0], dtype=float)
L = np.array([1, 0, 0, 0, 1, 0, 1, 0], dtype=float)
y = np.array([1, 1, 0, 0, 1, 0, 1, 0])
train_idx = slice(0, 4)
val_idx = slice(4, 8)

def class_gap(col, slc):
    return float(abs(col[slc][y[slc] == 1].mean() - col[slc][y[slc] == 0].mean()))

cols = {"T": T, "L": L}
leaky_col = max(cols, key=lambda k: class_gap(cols[k], slice(0, 8)))
safe_col = max(cols, key=lambda k: class_gap(cols[k], train_idx))

clf_leaky = NearestCentroid().fit(cols[leaky_col][train_idx, None], y[train_idx])
clf_safe = NearestCentroid().fit(cols[safe_col][train_idx, None], y[train_idx])

print(f"train gap T={class_gap(T, train_idx):.2f} L={class_gap(L, train_idx):.2f}")
print(f"all   gap T={class_gap(T, slice(0, 8)):.2f} L={class_gap(L, slice(0, 8)):.2f}")
print(f"select {leaky_col} on all rows -> val acc = {accuracy_score(y[val_idx], clf_leaky.predict(cols[leaky_col][val_idx, None])):.2f}")
print(f"select {safe_col} on train    -> val acc = {accuracy_score(y[val_idx], clf_safe.predict(cols[safe_col][val_idx, None])):.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
train gap T=1.00 L=0.50
all   gap T=0.50 L=0.75
select L on all rows -> val acc = 1.00
select T on train    -> val acc = 0.50
```
<!-- leetllm: output:end -->

Scikit-learn's official pitfalls guide illustrates the same failure at larger scale with 200 pure-noise rows and 10,000 random features: selecting the top 25 features across all 200 rows inflates cross-validated holdout accuracy from random-chance `0.50` up to `0.76`.[^sklearn2026leakage] Wrapping every data-dependent transform inside a scikit-learn `Pipeline` guarantees that `cross_validate` clones and fits scalers and selectors inside each training fold alone before calling `.transform()` on held-out folds. Inspecting the per-fold fitted scaler means below confirms that no fold touches the global mean `9.5`. When using target encoders, go one step further: `TargetEncoder.fit_transform` internally cross-fits encodings on training folds so a row never encodes its own target, whereas calling `.fit().transform()` directly on training rows leaks labels inside the training split itself.[^sklearnTargetEncoder2026]

<!-- leetllm: test, deps=numpy,scikit-learn, output=show -->
```python title="leakage-safe-pipeline.py"
import numpy as np
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

X = np.column_stack((np.arange(20, dtype=float), np.tile([0, 1], 10)))
y = np.array([0] * 10 + [1] * 10)
folds = list(StratifiedKFold(n_splits=5).split(X, y))

pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("selector", SelectKBest(score_func=f_classif, k=1)),
    ("classifier", LogisticRegression()),
])
result = cross_validate(pipeline, X, y, cv=folds, return_estimator=True)
fold_means = [float(est.named_steps["scaler"].mean_[0]) for est in result["estimator"]]

for (tr, _), m in zip(folds, fold_means):
    assert np.isclose(m, X[tr, 0].mean())

print("global feature-0 mean:  ", float(X[:, 0].mean()))
print("per-fold training means:", fold_means)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
global feature-0 mean:   9.5
per-fold training means: [10.5, 10.0, 9.5, 9.0, 8.5]
```
<!-- leetllm: output:end -->

```checkpoint
Where should a scaler, imputer, or supervised selector fit its parameters during cross-validation?
---
Fit every stateful transform strictly inside each training fold using a Pipeline, then apply .transform() alone to the held-out fold. Target encoders also require internal cross-fitting on training rows so a sample never encodes its own label.
```

## Temporal validation: future requests, ready labels, and usable history

Production prompt traffic shifts across product launches, seasonal surges, and adversarial prompt trends, so evaluating an August-trained checkpoint on June logs breaks causal chronology. Future model parameters must never condition on events that happen after the evaluation window starts. <span data-glossary="rolling-origin-evaluation">Rolling-origin evaluation</span> (walk-forward cross-validation) advances the training cutoff monotonically forward in time so every validation block sits strictly later than the training window used to fit it.[^hyndman2021fpp3]

<figure>
  <img src="illustrations/_generated/validation_windows_dark.png" alt="Walk-forward validation schedule across January through August with two queries per month. Fold 1 fits Jan-Feb and scores Mar-Apr; Fold 2 fits Jan-Apr and scores May-Jun; the candidate model fits Jan-Jun, tunes the threshold in July, and runs once on locked August data. A separate prompt r2 logged on June 20 has an August 2 delayed label and stays excluded from the July 1 fit." />
  <figcaption>Walk-forward folds expand history strictly forward through June while reserving July for threshold selection and keeping August locked. Prompt r2 opens on June 20 yet cannot enter the July 1 training fit because its label arrives on August 2.</figcaption>
</figure>

Sorting examples by request timestamp looks tempting as a shortcut, yet chronological row order alone does not protect a temporal split from timing bugs. Labels take days to finalize, feature backfills land asynchronously, and multi-day targets overlap adjacent evaluation folds. Teams must audit three subtle temporal pitfalls explicitly before trusting walk-forward numbers:

1. **Label readiness:** A June 20 prompt reviewed on August 2 lacks a usable label when training runs on July 1. Filter labeled training sets by both request timestamp and label-ready timestamp rather than guessing with a constant lag.
2. **Feature readiness and backfills:** A July 1 query may validly count past safety events from the last seven days of June, yet fails if late-ingested backfills are joined retroactively via event time instead of system availability time.
3. **Overlapping horizon labels:** Multi-day outcome targets overlap nearby folds; financial and sequence tasks use **purging** (dropping training samples whose label window touches validation) and **embargoes** immediately after test blocks.[^skfolioPurgedCV2026] Note that `sklearn.model_selection.TimeSeriesSplit(gap=...)` counts *samples*, not calendar days, and does not inspect label timestamps automatically.[^sklearnTimeSeriesSplit2026]

Running expanding walk-forward folds via `TimeSeriesSplit` in `scikit-learn` alongside a NumPy backfill availability check makes both safeguards concrete. In the temporal split below, training strictly precedes validation inside development months 1..6, while the ingestion mask filters out a June 30 event that did not reach the feature store until July 1 at noon.

<!-- leetllm: test, deps=numpy,scikit-learn, output=show -->
```python title="walk-forward-and-backfill-audit.py"
import numpy as np
from sklearn.model_selection import TimeSeriesSplit

months = np.repeat(np.arange(1, 7), 2)
tscv = TimeSeriesSplit(n_splits=2, test_size=4)
for fold, (tr, va) in enumerate(tscv.split(months), start=1):
    assert months[tr].max() < months[va].min()
    print(f"fold {fold}: train <= m{months[tr].max()}, validate = m{months[va].min()}..m{months[va].max()}")

decision = np.datetime64("2026-07-01T00:05:00")
window_start = decision - np.timedelta64(7, "D")
event_t = np.array(["2026-06-29T10:00:00", "2026-06-30T10:00:00", "2026-06-30T18:00:00"], dtype="datetime64[s]")
ingest_t = np.array(["2026-06-29T10:00:01", "2026-06-30T10:00:01", "2026-07-01T12:00:00"], dtype="datetime64[s]")

naive_count = int(((window_start <= event_t) & (event_t < decision)).sum())
available_count = int(((window_start <= event_t) & (event_t < decision) & (ingest_t <= decision)).sum())
print(f"event-time-only count: {naive_count}, decision-available count: {available_count}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
fold 1: train <= m2, validate = m3..m4
fold 2: train <= m4, validate = m5..m6
event-time-only count: 3, decision-available count: 2
```
<!-- leetllm: output:end -->

### Time and group splits combined

Any future month brings a mix of returning accounts and brand-new users. Reporting one aggregate metric hides whether gains come from memorizing active tenants or generalizing to fresh signups. Notice a subtle distinction when auditing new-user slices: if user `u2` submitted prompt `r2` on June 20 whose label was still pending on July 1, `u2` drops out of the July 1 labeled training matrix yet remains a **seen user** rather than a brand-new user in July. Past activity defines entity exposure even when a row lacked a training label at the fit cutoff.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="audit-time-groups-and-label-availability.py"
import numpy as np

req_id = np.array(["r1", "r2", "r3", "r4", "r5"])
user_id = np.array(["u1", "u2", "u3", "u1", "u4"])
open_dt = np.array(["2026-01-03", "2026-06-20", "2026-06-10", "2026-07-03", "2026-07-05"], dtype="datetime64[D]")
label_dt = np.array(["2026-01-10", "2026-08-02", "2026-06-20", "2026-07-10", "2026-07-20"], dtype="datetime64[D]")

fit_at, end_at = np.datetime64("2026-07-01"), np.datetime64("2026-08-01")
history = open_dt < fit_at
train_ready = history & (label_dt <= fit_at)
seen_users = set(user_id[history])

july = (open_dt >= fit_at) & (open_dt < end_at)
returning_mask = july & np.isin(user_id, list(seen_users))
new_mask = july & ~returning_mask

print("training requests:", req_id[train_ready].tolist())
print("returning July:   ", req_id[returning_mask].tolist())
print("new-user July:    ", req_id[new_mask].tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
training requests: ['r1', 'r3']
returning July:    ['r4']
new-user July:     ['r5']
```
<!-- leetllm: output:end -->

### Nested selection and validation overuse

Hyperparameter sweeps repeatedly test dozens or thousands of configurations on validation folds. Picking the maximum among noisy fold scores introduces selection optimism whose size depends on score noise, correlation across candidates, and search intensity.[^hastie2009] <span data-glossary="nested-cross-validation">Nested cross-validation</span> prevents selection optimism by burying the entire tuning loop inside each outer development split:

1. **Outer loop:** Carves out outer evaluation folds (or expanding future blocks) that never influence feature choice, hyperparameters, or threshold tuning.
2. **Inner loop:** Searches candidate pipelines strictly within each outer fold's training subset.
3. **Outer score:** Refits the inner winner across that outer training partition and scores the untouched outer fold once.

Crucially, the outer nested mean measures the generalization quality of the *selection-and-fitting procedure* across unseen splits rather than selecting one winning hyperparameter vector directly. Once nested CV finishes verifying the tuning workflow, teams still run that single inner selection procedure once on the full development dataset before scoring the untouched final test window. Treating outer fold numbers as permission to pick your favorite model by inspection reintroduces selection bias at the outer level and invalidates the score.

## Threshold selection: validation chooses, test reports

Thresholding converts a continuous ranking score $p \in [0, 1]$ into a discrete routing decision $\hat{y} = \mathbb{I}(p \ge \theta)$. Choosing threshold $\theta$ separates **decision thresholding** from **probability calibration**, which adjusts raw scores so predicted probabilities match empirical event frequencies.[^sklearnThresholdTuning2026] Selecting $\theta$ on the final test partition leaks test labels into the decision rule even if model weights remain frozen. Using `sklearn.metrics.f1_score` below, July validation selects $\theta = 0.50$ (`F1 = 1.00`) before scoring frozen August traffic once (`F1 = 0.67`).

<!-- leetllm: test, deps=numpy,scikit-learn, output=show -->
```python title="choose-threshold-before-opening-test.py"
import numpy as np
from sklearn.metrics import f1_score

thresholds = [0.30, 0.50, 0.70]
val_prob = np.array([0.82, 0.62, 0.58, 0.42, 0.31, 0.12])
val_y = np.array([1, 1, 1, 0, 0, 0])
test_prob = np.array([0.77, 0.49, 0.39, 0.52, 0.66, 0.14])
test_y = np.array([1, 1, 0, 0, 1, 0])

val_scores = {t: float(f1_score(val_y, (val_prob >= t).astype(int))) for t in thresholds}
chosen = max(val_scores, key=val_scores.get)
test_f1 = float(f1_score(test_y, (test_prob >= chosen).astype(int)))

for t, s in val_scores.items():
    print(f"threshold={t:.2f} valid_f1={s:.2f}")
print(f"chosen threshold={chosen:.2f} test_f1={test_f1:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
threshold=0.30 valid_f1=0.75
threshold=0.50 valid_f1=1.00
threshold=0.70 valid_f1=0.50
chosen threshold=0.50 test_f1=0.67
```
<!-- leetllm: output:end -->

Notice an equally serious production pitfall hidden in label logs: if human moderators only inspect prompts flagged by $p \ge 0.50$, missed escalations below threshold never receive ground-truth labels. That **selective label coverage** leaves observed triage precision visible (`2/3`) while true recall stays unidentifiable (`1.0`, `2/3`, `1/2`, or `2/5` depending on unreviewed negatives) unless an audit also samples unflagged traffic with documented sampling weights.[^selectiveLabels2017] Always publish the frozen threshold, the feature specification, and both validation and locked test scores with their exact roles.

## Modern relevance: benchmark contamination in large language models

Every tabular isolation rule above translates directly to retrieval pipelines, post-training datasets, and foundation model benchmarks whenever evaluation inputs cross into training or tuning loops. Chunking a corpus before splitting leaks shared document structure, while web-scale crawls pull published quiz items into pretraining mixtures. Mapping each modern leakage vector to a strict partition safeguard prevents inflated capability scores across the stack:

| System | Contamination channel | Isolation rule |
| :--- | :--- | :--- |
| **<span data-glossary="rag">RAG</span> systems (new docs)** | Test chunks or synthetic queries inform prompt/retriever tuning | Partition parent documents *before* <span data-glossary="chunking">chunking</span> or question generation |
| **SFT and RL post-training** | Evaluation items or reasoning <span data-glossary="tracing">traces</span> leak into training sets | Deduplicate hashes, record dataset origin, and quarantine test splits |
| **Public LLM benchmarks** | Web scrapes absorb GSM8K, MMLU, or HumanEval splits | Combine overlap screening with dated fresh tasks rather than trusting date alone |

When testing whether a RAG pipeline generalizes to brand-new reference manuals, splitting chunks instead of parent documents leaks knowledge across the split because adjacent paragraphs share headings, definitions, and tables. Conversely, if the deployed assistant always queries a single fixed manual while answering new user questions, retrieving from that corpus matches production serving, provided evaluation queries and reference answers stay completely excluded from retriever and prompt tuning. Splitting documents before chunking keeps overlap strictly at zero.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="split-documents-before-chunking.py"
import numpy as np

doc_chunks = np.array([
    ("guide_rag", "chunk_1"), ("guide_rag", "chunk_2"),
    ("guide_agents", "chunk_1"), ("guide_agents", "chunk_2"),
    ("guide_eval", "chunk_1"), ("guide_eval", "chunk_2"),
])

# Mistake: split alternating chunks across train and test
chunk_train_docs = set(doc_chunks[::2, 0])
chunk_test_docs = set(doc_chunks[1::2, 0])

# Fix: split complete parent documents first, then chunk inside each partition
safe_train_mask = np.isin(doc_chunks[:, 0], ["guide_rag", "guide_agents"])
safe_train_docs = set(doc_chunks[safe_train_mask, 0])
safe_test_docs = set(doc_chunks[~safe_train_mask, 0])

print("split chunks first shared docs =", sorted(chunk_train_docs & chunk_test_docs))
print("split docs first   shared docs =", sorted(safe_train_docs & safe_test_docs))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
split chunks first shared docs = [np.str_('guide_agents'), np.str_('guide_eval'), np.str_('guide_rag')]
split docs first   shared docs = []
```
<!-- leetllm: output:end -->

At foundation <span data-glossary="pretraining">pretraining</span> scale, trillion-token scrapes routinely pull in repository files and benchmark solutions from public discussions, blog posts, and mirrors. Exact string equality misses lightly edited paraphrases, code translations, or reordered options, so teams inspect overlap from three distinct angles. Three complementary diagnostics probe exact surface copies, fuzzy structural near-duplicates, and distributional memorization clues:

1. **Exact n-gram audits:** GPT-3 initially screened normalized 13-word overlaps (adjusting length down to 8-13 words for shorter non-synthetic tasks), yet a filtering bug still left contaminated splits inside training.[^brown2020] Llama 3 checked 8-gram token overlap, flagging 85% of HellaSwag and measuring a 14.8-point full-versus-clean difference on Llama 3 8B while noting that subset selection can mix item difficulty alongside memorization.[^dubey2024]
2. **MinHash and semantic search:** Approximate Jaccard hashing via MinHash catches near-duplicate text edits at web scale, while dense embedding similarity screens reworded paraphrases that evade lexical shingle checks.[^broder1997]
3. **Loss-based screening:** Abnormally low evaluation perplexity flags suspect passages for manual review, though common boilerplate or easy syntax also produces low loss; empirical code-completion audits confirm that no universal perplexity cutoff reliably proves membership across every item.[^codeContaminationCountermeasures2024]

Dynamic benchmarks reduce static memorization by refreshing problems or stamping contest release windows: LiveBench rotates monthly tasks with verifiable answers,[^white2024][^livebenchRepository2026] while LiveCodeBench tags coding problems with contest dates so evaluators can slice items strictly after a model's cutoff.[^jain2024][^livecodebenchRepository2026] Remember that even cutoff-filtered splits require pinning exact release tags, tool permissions, and post-training sources, because web browsing or user-shared solutions can reintroduce leakage after base pretraining ends. Running a local 5-gram <span data-glossary="smoke-test">smoke test</span> catches verbatim overlaps immediately while leaving semantic paraphrases for embedding review.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="ngram-contamination-smoke-test.py"
import numpy as np

training_prompts = [
    "route risky prompt with missing citations to human review",
    "approve low ambiguity coding answer after sandbox tests pass",
]
evaluation_prompts = [
    "route risky prompt with missing citations to human review",
    "flag an ambiguous agent response for verifier scoring",
]

def ngrams(text, n=5):
    words = np.array(text.lower().split())
    return {" ".join(words[i : i + n]) for i in range(len(words) - n + 1)}

train_grams = set().union(*(ngrams(p) for p in training_prompts))
for prompt in evaluation_prompts:
    overlap = len(ngrams(prompt) & train_grams)
    print(f"{'FLAG' if overlap else 'CLEAN'} (shared 5-grams={overlap}): {prompt}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
FLAG (shared 5-grams=5): route risky prompt with missing citations to human review
CLEAN (shared 5-grams=0): flag an ambiguous agent response for verifier scoring
```
<!-- leetllm: output:end -->

## Historical logs don't reveal unchosen actions

Every supervised evaluation above estimates outcomes under the historical router's observed choices. When teams deploy a *new* stochastic policy that overrides past routing rules, server logs only contain rewards for the single action actually taken per prompt while leaving every alternative unchosen branch counterfactual. In reinforcement learning and contextual bandits, <span data-glossary="off-policy">off-policy evaluation</span> (OPE) estimates new policy returns using known behavior probabilities and sequential importance ratios, yet neither chronological splits nor importance weights can recover rewards for an action assigned zero logging probability.[^sutton2018] Quantifying new-policy uplift safely still requires randomized exploration or controlled canary rollouts.

## Write the production evaluation checklist

Before publishing a benchmark headline or gating a production guardrail launch, lock down every assumption in an explicit evaluation plan covering decision timestamps, entity scope, pipeline isolation, and selective labeling. Writing the plan in plain text next to the configuration makes review easy for collaborators and avoids undocumented threshold adjustments after seeing test errors. Each line in the template below fixes one failure mode before any model runs on the August evaluation cohort:

```text title="safety-router-evaluation-plan.txt"
Decision moment: prompt arrival at 09:00 UTC, before fallback routing or moderation actions
Allowed features: prompt_tokens, prior_flags_90d, ambiguity_score
Forbidden features: fallback_triggered_at, human_edit_sec, audit_override_at
Train fit: January-June prompts with labels ready before the fit cutoff date
Validation: July prompts using train-fitted scalers to choose operating threshold
Locked test: August prompts scored once with frozen weights, preprocessing, and threshold
Label coverage: sample unflagged traces so recall accounts for selective auditing
Entity reporting: slice returning tenants and brand-new users separately
Preprocessing: place scalers, imputers, selectors, and cross-fitted target encoders inside Pipeline
Metrics: review F1, missed critical escalations, and triage review volume
```

## Stress-test the evaluation plan

Good validation harnesses reveal broken isolation immediately when one rule fails. Changing a timestamp, entity rule, or candidate pool shows whether a split guards against subtle hindsight feedback or quietly lets test evidence slip in. Trace what breaks under each perturbation before reading the diagnostics underneath:

1. Add `human_edit_sec` to the opening snapshot with its `11:05` observation timestamp. Why is that label-adjacent leakage even when edits finish on the same day?
2. Update the user-grouping test to measure accuracy on *returning* users instead of unseen accounts. Does row-wise splitting suffice, or which chronological constraint still applies?
3. Add a balanced neutral feature `N = [0, 1, 1, 0, 0, 1, 1, 0]` to the preprocessing comparison. Does selecting by class-mean gap change either the leaky or honest choice?
4. Introduce a paraphrased test chunk in the RAG isolation check. Why does exact n-gram filtering miss it, and how should evaluators screen for it?
5. Draft an evaluation plan for an RL prompt router where only historical actions appear in logs.

### What each stress test reveals

1. **Same-day edits follow the prediction:** Human edit duration is measured *after* the model escalates the prompt, so it belongs in forensic analysis rather than opening inference features.
2. **Returning users still obey time:** Allowing known users across train and test matches a returning-account claim, yet you must still separate train vs future windows and enforce label readiness so future responses never leak backward.
3. **Neutral columns have zero separation:** Both class means of `N` equal `0.50` across both slices, leaving class separation `0.00` so `L` still wins leaky all-row selection and `T` still wins honest training selection.
4. **Paraphrases break lexical hashing:** Reworded sentences drop shared 5-grams and lower MinHash Jaccard scores, requiring dense embedding retrieval followed by manual dataset audit rather than trusting a lexical filter threshold blindly.
5. **Unchosen actions remain unobserved:** Logged outcomes cover only executed actions, so off-policy importance weighting requires logged non-zero behavior propensities, overlap checks, and canary validation rather than pure historical accuracy alone.

---

## Check your understanding

```mastery-quiz
[
  {
    "question": "A prompt is scored at 10:00. An account flag occurred at 09:50 yet synced to the serving cache at 10:05. An ambiguity score was readable at 09:58. Which opening snapshot is valid?",
    "options": [
      "Include ambiguity; exclude the flag until its serving observation time.",
      "Include both fields because their event timestamps precede 10:00.",
      "Exclude both fields because same-day updates sit outside historical splits.",
      "Include the delayed flag; exclude ambiguity computed close to inference."
    ],
    "answer": "Include ambiguity; exclude the flag until its serving observation time.",
    "explanation": "Inference features must be readable by the serving runtime at the prediction timestamp. Event time alone would wrongly include a value missing from cache until 10:05."
  },
  {
    "question": "A team reserves October for threshold selection and November for the locked report. Which development schedule rehearses periodic retraining without spending those windows?",
    "options": [
      "Fit January-March, score April; fit January-April, score May.",
      "Fit January-April, score March; fit January-May, score April.",
      "Fit January-September, tune on October, then retune on November.",
      "Fit January-October, score November, then pick the best November winner."
    ],
    "answer": "Fit January-March, score April; fit January-April, score May.",
    "explanation": "Each development validation fold falls chronologically after its training window and stays strictly inside January-September, leaving October and November untouched."
  },
  {
    "question": "Two folds have confusion counts (TP, FP, FN) of (3, 1, 2) and (1, 0, 0). What are mean fold F1 and pooled F1 across concatenated predictions?",
    "options": [
      "Mean 5/6; pooled 8/11.",
      "Mean 8/11; pooled 5/6.",
      "Mean 2/3; pooled 8/9.",
      "Mean 5/6; pooled 5/6."
    ],
    "answer": "Mean 5/6; pooled 8/11.",
    "explanation": "Per-fold F1 equals 6/9 = 2/3 and 2/2 = 1, giving mean 5/6. Pooling totals TP=4, FP=1, FN=2 yields 8 / (8 + 1 + 2) = 8/11."
  },
  {
    "question": "A September fit skips an August prompt because its human audit label arrives in October. That same user sends a labeled September prompt. For a future brand-new-user evaluation slice, how is that September prompt categorized?",
    "options": [
      "Returning user; prior prompt history exists even without a ready August label.",
      "New user; no labeled record from that account entered training weights.",
      "New user; advancing chronologically clears prior entity exposure across months.",
      "Returning user only after October; exposure begins once human audit labels close."
    ],
    "answer": "Returning user; prior prompt history exists even without a ready August label.",
    "explanation": "Account novelty depends on whether prior prompts appeared before September, regardless of whether an August label was ready in time for training."
  },
  {
    "question": "A selector ranks two features using labels from both development and held-out splits before the classifier fits on development rows alone. Which fix closes this leak?",
    "options": [
      "Refit feature selection strictly inside each training fold before transforming held-out folds.",
      "Refit the classifier on the training rows while keeping the globally chosen features.",
      "Fit a fresh feature selector directly on each held-out fold prior to predicting.",
      "Drop explicit row IDs while keeping feature rankings computed over all labeled rows."
    ],
    "answer": "Refit feature selection strictly inside each training fold before transforming held-out folds.",
    "explanation": "Any supervised selector reads labels, so running it across held-out data leaks evaluation answers. Wrapping selection inside the training-fold Pipeline eliminates that leak."
  },
  {
    "question": "Validation probabilities [0.90, 0.70, 0.55, 0.30] carry labels [1, 0, 1, 0]. Candidate cutoffs are 0.40 and 0.60 with escalation when score >= threshold. Which plan is valid?",
    "options": [
      "Pick 0.40 on validation F1 = 0.80, then evaluate once on locked test.",
      "Pick 0.60 on validation F1 = 0.80, then evaluate once on locked test.",
      "Pick 0.40 on validation F1 = 0.80, then retune cutoff on test data.",
      "Pick 0.60 on validation F1 = 0.50, then publish that score as final."
    ],
    "answer": "Pick 0.40 on validation F1 = 0.80, then evaluate once on locked test.",
    "explanation": "At 0.40, TP=2, FP=1, FN=0 produces F1 = 4/5 = 0.80, whereas 0.60 yields F1 = 0.50. Choose the cutoff on validation and test it once frozen."
  },
  {
    "question": "A RAG benchmark evaluates generalization to unseen documents using a manual page, a paraphrased chunk from that page, and two derived questions. If the manual entered retriever tuning, where must all derived artifacts sit?",
    "options": [
      "Keep all paraphrased chunks and derived questions with their source document on the tuning side.",
      "Move paraphrased chunks into the held-out test set once verbatim duplicates are stripped.",
      "Place derived questions in the test set whenever the source document stays out of verbatim retrieval.",
      "Shuffle chunks randomly across tuning and test so both partitions span identical topics."
    ],
    "answer": "Keep all paraphrased chunks and derived questions with their source document on the tuning side.",
    "explanation": "Derived chunks and questions inherit information from the parent page even after paraphrasing, so document-level isolation requires holding out entire unseen source manuals."
  },
  {
    "question": "A lexical filter flags a common five-word phrase in test prompt A while test prompt B is a semantic paraphrase sharing no five-word run. What action fits best?",
    "options": [
      "Audit both prompts using dataset lineage checks and semantic embeddings alongside lexical matching.",
      "Check prompt A's training origins while clearing prompt B automatically for zero n-gram hits.",
      "Sort both prompts strictly by token perplexity and drop prompts below a fixed loss cutoff.",
      "Delete common five-word boilerplate matches while approving the remaining split unchecked."
    ],
    "answer": "Audit both prompts using dataset lineage checks and semantic embeddings alongside lexical matching.",
    "explanation": "Exact n-gram screens catch verbatim leaks yet yield false positives on common boilerplate and miss paraphrased text, requiring embedding similarity and lineage audits together."
  },
  {
    "question": "For a certain prompt category, a legacy router routed 100% of traffic to RAG and 0% to Base. A candidate policy routes 20% of those queries to Base. What can a time split over logged RAG rewards reveal?",
    "options": [
      "Rewards under the unchosen Base branch remain unsupported and unidentifiable from those logs.",
      "It recovers the exact Base reward directly by scaling logged RAG rewards by 0.20.",
      "It identifies Base outcomes cleanly using inverse weighting with logging propensity zero.",
      "Chronological splitting removes the missing-action gap once test traffic follows training."
    ],
    "answer": "Rewards under the unchosen Base branch remain unsupported and unidentifiable from those logs.",
    "explanation": "Because the logging policy assigned zero probability to Base on that slice, neither chronological splits nor importance weighting can identify unseen counterfactual rewards."
  },
  {
    "question": "Training starts September 1. Prompt A arrived August 20 with label ready September 3; prompt B arrived August 25 with label ready August 30. Both have valid opening features. Which rows enter the September 1 fit?",
    "options": [
      "Prompt B enters training; prompt A waits until its label becomes ready.",
      "Prompt A enters training; prompt B waits because August 30 sits near cutoff.",
      "Both enter training because both prompts opened prior to September 1.",
      "Neither enters training because supervised labels must exist at prompt arrival."
    ],
    "answer": "Prompt B enters training; prompt A waits until its label becomes ready.",
    "explanation": "Model fitting needs both pre-decision features and ground-truth outcomes available by the fit cutoff date; prompt A's September 3 label arrives too late."
  }
]
```

> **Next:** Continue to [Statistical Learning and Generalization](/learn/statistical-learning-theory-generalization). Honest validation splits prevent leaked information from distorting offline scores; next you study why finite samples still vary, how model capacity shapes generalization error, and what guarantees statistical learning theory provides on untouched data.
