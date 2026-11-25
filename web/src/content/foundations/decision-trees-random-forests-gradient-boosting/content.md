---
{
  "id": "decision-trees-random-forests-gradient-boosting",
  "title": "Decision Trees, Forests, and Boosting",
  "slug": "decision-trees-random-forests-gradient-boosting",
  "section": "Classical ML & Evaluation",
  "category": "Model Architecture",
  "difficulty": "Easy",
  "order": 3,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "Learn how decision trees learn splits, random forests average variance away, and gradient boosting corrects residuals sequentially, then apply chronological splits, Bayes-optimal cost thresholds, and NaN routing.",
  "keyConceptsTested": [
    "Decision-tree splits, leaf probabilities, and Gini/entropy gain",
    "Depth, leaf size, pruning, and held-out evaluation",
    "Bootstrap sampling, feature subsampling, and out-of-bag checks",
    "Forest variance reduction vs sequential boosting corrections",
    "Classification Newton leaf updates and XGBoost split gain",
    "MDI vs permutation importance and local SHAP attribution",
    "Chronological splits and point-in-time leakage prevention",
    "Bayes-optimal cost thresholds under asymmetric errors",
    "Missing-value NaN routing across GBDT libraries"
  ],
  "aliases": [
    "gradient-boosted-trees-production"
  ]
}
---

Put two flower species on a table and try to tell them apart. A crisp first question might be, "Is the petal at most 1.75 cm wide?" For most flowers, that single cutoff settles the answer; for the leftovers, a second question about petal length finishes the job.

A <span data-glossary="decision-tree">decision tree</span> learns these questions from labeled data, routing each input to a **leaf** storing a prediction. We start by fitting one tree on *versicolor* vs *virginica* irises and deriving its split math by hand, then improve on it with parallel **random forests** and sequential **gradient boosting**, and finish with tabular production essentials: chronological splits, Bayes-optimal cost thresholds, and missing-value (`NaN`) routing.

## Fit one useful question

Scikit-learn bundles the Iris dataset locally.[^sklearnIrisDataset2026] We use the 100 *versicolor* (`0`) and *virginica* (`1`) flowers with petal length and petal width as features, reserving 30 stratified flowers for validation and 70 (35 per species) for training. A **decision stump** asks one question:

<!-- leetllm: test, deps=numpy,scikit-learn, output=show, id=tree-data -->
```python title="first-flower-tree.py"
import numpy as np
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

iris = load_iris()
keep = iris.target > 0
X = iris.data[keep][:, [2, 3]]
y = iris.target[keep] - 1
names = ["petal length", "petal width"]
X_train, X_valid, y_train, y_valid = train_test_split(
    X, y, test_size=0.30, stratify=y, random_state=7,
)

stump = DecisionTreeClassifier(max_depth=1, random_state=0).fit(X_train, y_train)
feature = stump.tree_.feature[0]
cut = stump.tree_.threshold[0]
flower = np.array([[5.0, 1.8]])
print(f"question: {names[feature]} <= {cut:.2f} cm?")
print("species:", iris.target_names[1 + stump.predict(flower)[0]])
print("probabilities [versicolor, virginica]:", stump.predict_proba(flower)[0].round(3))
print(f"train accuracy: {stump.score(X_train, y_train):.3f} | valid accuracy: {stump.score(X_valid, y_valid):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
question: petal width <= 1.75 cm?
species: virginica
probabilities [versicolor, virginica]: [0.031 0.969]
train accuracy: 0.929 | valid accuracy: 0.967
```
<!-- leetllm: output:end -->

The new flower's 1.8 cm width exceeds 1.75 cm, sending it right into a leaf containing 31 virginica and 1 versicolor ($31/32 \approx 0.969$). The left leaf holds 34 versicolor and 4 virginica ($4/38 \approx 0.105$). Every input in a leaf receives that leaf's class proportion, producing piecewise-constant rectangular regions rather than smooth linear boundaries.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="The 70 training flowers are plotted by petal width and length. A vertical cut at width 1.75 cm separates a left region containing 34 versicolor and four virginica flowers from a right region containing one versicolor and 31 virginica flowers. The regions predict virginica probabilities 0.105 and 0.969." />
  <figcaption>The first question creates two rectangular regions. Most narrow petals belong to versicolor and most wide petals to virginica, while the remaining mixed labels give deeper branches something to work on.</figcaption>
</figure>

Keep two thresholds separate: the **feature cutoff** (1.75 cm) chooses a branch inside the tree, while the **classification threshold** (default 0.5) turns the leaf's probability into a hard class decision without refitting a single split.

## How training chooses a split

A good split produces children whose labels are purer than the parent. **<span data-glossary="gini-impurity">Gini impurity</span>** measures label mixture from class fractions $p_k$:

$$
G = 1 - \sum_{k=1}^{K} p_k^2
$$

For binary labels with positive fraction $p$, this simplifies to $G = 2p(1 - p)$: zero for a pure leaf and `0.5` for a 50/50 mix. On our balanced 70-flower root ($G = 0.5000$), cutting width at 1.75 cm yields a 38-flower left child ($G = 2(34/38)(4/38) \approx 0.1884$) and a 32-flower right child ($G = 2(1/32)(31/32) \approx 0.0605$). Weighting each child by its sample share gives:

$$
G_{\text{children}} = \frac{38}{70}(0.1884) + \frac{32}{70}(0.0605) \approx 0.1299
$$

The **Gini gain** is $0.5000 - 0.1299 = 0.3701$. Alternatively, **entropy** $H = -\sum_k p_k \log_2 p_k$ measures uncertainty in bits, and its weighted decrease is **<span data-glossary="information-gain">information gain</span>**.[^shannon1948] Both reward purity and usually pick similar cuts, though entropy slightly favors isolating pure subsets sooner.

Candidate thresholds sit at midpoints between adjacent sorted feature values (for example, `1.75` between `1.7` and `1.8`). Because split search is greedy (pick the best local cut now, then recurse inside each child), small data changes can alter downstream branches. Exact split search confirms scikit-learn's stump:

<!-- leetllm: test, continue=tree-data, output=show, id=tree-split -->
```python title="search-the-feature-gaps.py"
def gini(labels):
    p = labels.mean()
    return 2 * p * (1 - p)


def best_split(X, y):
    best = None
    for col in range(X.shape[1]):
        vals = np.unique(X[:, col])
        for threshold in (vals[:-1] + vals[1:]) / 2:
            left = X[:, col] <= threshold
            gain = gini(y) - (left.mean() * gini(y[left]) + (~left).mean() * gini(y[~left]))
            if best is None or gain > best["gain"]:
                best = {"feature": col, "threshold": threshold, "gain": gain}
    return best


for col, name in enumerate(names):
    cand = best_split(X_train[:, [col]], y_train)
    print(f"{name:12s}: cut={cand['threshold']:.2f}, gain={cand['gain']:.4f}")

chosen = best_split(X_train, y_train)
assert chosen["feature"] == stump.tree_.feature[0]
assert np.isclose(chosen["threshold"], stump.tree_.threshold[0])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
petal length: cut=4.75, gain=0.3478
petal width : cut=1.75, gain=0.3701
```
<!-- leetllm: output:end -->

Because trees compare feature orderings rather than distances, linear rescaling (cm to mm) leaves every partition identical and makes standard feature scaling unnecessary. Note that deeper trees subdivide the plane into finer rectangles, which can fit training exceptions without improving validation accuracy. Control complexity with `max_depth`, `min_samples_leaf`, or cost-complexity pruning (`ccp_alpha`).[^sklearn2026treemissing]

<!-- leetllm: test, continue=tree-split, output=show, id=tree-depth -->
```python title="depth-and-new-flowers.py"
for depth in [1, 2, 3, None]:
    tree = DecisionTreeClassifier(max_depth=depth, random_state=0).fit(X_train, y_train)
    print(
        f"depth={str(depth):4} leaves={tree.get_n_leaves():2d} "
        f"train={tree.score(X_train, y_train):.3f} valid={tree.score(X_valid, y_valid):.3f}"
    )
```

<!-- leetllm: output:start -->
```text title="Output" output compact
depth=1    leaves= 2 train=0.929 valid=0.967
depth=2    leaves= 4 train=0.957 valid=0.967
depth=3    leaves= 5 train=0.957 valid=0.967
depth=None leaves= 8 train=0.986 valid=0.967
```
<!-- leetllm: output:end -->

Even the unrestricted tree stops at `0.986` training accuracy because `[4.8, 1.8]` appears with both species labels in training.

## Random forests combine decorrelated trees

A single greedy tree has high variance: perturbing a few training rows can shift top splits. A **random forest** stabilizes predictions by training $B$ trees independently in parallel with two sources of diversity: each tree trains on a **bootstrap sample** drawn with replacement from the $N$ training rows, and each split searches only a random subset of features (`max_features`) so one dominant feature cannot force every tree down the same path.[^breiman2001] Scikit-learn averages the trees' leaf class probabilities.[^sklearn2026forestmissing]

If each tree's prediction for a fixed input has variance $\sigma^2$ and pairwise correlation $\rho$, the variance of their $B$-tree average is:

$$
\operatorname{Var}(\bar{T}) = \rho\sigma^2 + \frac{1 - \rho}{B}\sigma^2
$$

Adding trees drives the second term toward zero, leaving the correlation floor $\rho\sigma^2$; lowering $\rho$ via feature subsampling is why forests beat plain bagging. Meanwhile, each bootstrap draw omits roughly $(1 - 1/N)^N \to e^{-1} \approx 36.8\%$ of training rows. Predicting each training row using only trees that omitted it yields the **out-of-bag (OOB)** score, a quick sanity check (though never a substitute for time-ordered or group splits).

<!-- leetllm: test, continue=tree-depth, output=show, id=tree-forest -->
```python title="watch-the-forest-average.py"
from sklearn.ensemble import RandomForestClassifier

forest = RandomForestClassifier(
    n_estimators=100, min_samples_leaf=2, max_features=1,
    oob_score=True, random_state=0,
).fit(X_train, y_train)
member_scores = np.array([m.predict_proba(X_valid)[:, 1] for m in forest.estimators_])
ex = int(member_scores.var(axis=0).argmax())
print("contested flower [length, width]:", X_valid[ex].tolist())
print("first 5 tree scores:", member_scores[:5, ex].round(3).tolist())
print(f"forest mean={forest.predict_proba(X_valid)[ex, 1]:.3f} | valid acc={forest.score(X_valid, y_valid):.3f} | OOB={forest.oob_score_:.3f}")
assert np.allclose(member_scores.mean(axis=0), forest.predict_proba(X_valid)[:, 1])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
contested flower [length, width]: [5.1, 1.5]
first 5 tree scores: [0.25, 0.25, 0.0, 0.0, 0.429]
forest mean=0.556 | valid acc=1.000 | OOB=0.929
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/ensemble_contrast_dark.png" alt="A forest fits trees separately and averages their probability scores. Boosting starts with one prediction and adds fitted corrections in sequence. The forest branches are parallel; each boosting stage depends on the prediction from the previous stage." />
  <figcaption>A forest combines independently fitted members in parallel. Boosting changes the target of each new tree using the ensemble's current errors, so round order matters.</figcaption>
</figure>

## Gradient boosting corrects errors sequentially

Rather than averaging independent models, **gradient boosting** builds a prediction additively: start with a constant prediction $F_0(x)$ and let each new small tree $h_m(x)$ predict the correction that reduces current loss, scaled by a learning rate (shrinkage) $\eta$:[^friedman2001gbm]

$$
F_m(x) = F_{m-1}(x) + \eta h_m(x)
$$

Take three plants receiving 1, 2, and 5 hours of daily sunlight that grow 10, 20, and 60 mm in a week. Start at their mean, `30` mm; residuals (actual minus predicted) are `[-20, -10, +30]`. A regression stump splits the first two plants (mean residual `-15`) from the third (`+30`). At learning rate $\eta = 0.10$, predictions step to `[28.5, 28.5, 33.0]`, and round 2 recomputes fresh residuals against those updated predictions:

<!-- leetllm: test, deps=numpy,scikit-learn, output=show, id=tree-regression -->
```python title="grow-a-prediction.py"
import numpy as np
from sklearn.tree import DecisionTreeRegressor

sunlight = np.array([[1.0], [2.0], [5.0]])
growth = np.array([10.0, 20.0, 60.0])
pred = np.full(3, growth.mean())
for step in range(1, 5):
    tree = DecisionTreeRegressor(max_depth=1, random_state=0).fit(sunlight, growth - pred)
    pred += 0.10 * tree.predict(sunlight)
    print(f"round={step} prediction={pred.round(2).tolist()} MSE={np.mean((growth - pred) ** 2):.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
round=1 prediction=[28.5, 28.5, 33.0] MSE=381.17
round=2 prediction=[27.15, 27.15, 35.7] MSE=311.91
round=3 prediction=[25.94, 25.94, 38.13] MSE=255.82
round=4 prediction=[24.84, 24.84, 40.32] MSE=210.38
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/boosting_residual_step_dark.png" alt="Plant growth targets 10, 20, and 60 mm start from predictions of 30 mm. A fitted stump assigns residual corrections minus 15, minus 15, and plus 30. Applying one tenth of those corrections moves the predictions to 28.5, 28.5, and 33 mm." />
  <figcaption>Vertical gaps are the remaining residuals. Learning rate 0.10 moves each prediction partway toward its fitted correction, and subsequent rounds target the shrunken gaps.</figcaption>
</figure>

### Classification boosting, Newton leaves, and XGBoost gain

For binary classification, boosting updates log-odds $F(x)$ and maps them to probabilities via $p(x) = \sigma(F(x)) = 1 / (1 + e^{-F(x)})$. Under binary cross-entropy loss $L(y, F) = -y\ln\sigma(F) - (1-y)\ln(1-\sigma(F))$, the first derivative with respect to $F$ is $g_i = p_i - y_i$ and the second derivative (curvature) is $h_i = p_i(1 - p_i)$.

Each round fits a tree to the negative gradients (pseudo-residuals) $y_i - p_i$, then sets each leaf's logit update via a one-step Newton update:

$$
\gamma_j = \frac{\sum_{i \in I_j}(y_i - p_i)}{\sum_{i \in I_j} p_i(1 - p_i)}
$$

On our balanced 70 flowers starting at $p_i = 0.5$ ($F_0 = 0$), the width `<= 1.75` split sends 38 rows left (residual sum `-15`) and 32 rows right (residual sum `+15`), with every row contributing curvature `0.25`. Thus $\gamma_{\text{left}} = -15 / 9.5 = -1.579$ and $\gamma_{\text{right}} = +15 / 8.0 = +1.875$. Scaling by $\eta = 0.1$ nudges probabilities gently to `0.461` and `0.547`.

**XGBoost** extends this second-order view into split selection itself.[^chen2016xgboost][^xgboostTreeObjective2026] Collecting gradient sums $G_j = \sum_{i \in I_j} g_i$ and curvature sums $H_j = \sum_{i \in I_j} h_i$ with $L_2$ leaf penalty $\lambda$ and split penalty $\gamma_{\text{split}}$ gives the regularized leaf value and split gain:

$$
w_j^* = -\frac{G_j}{H_j + \lambda},
\qquad
\text{gain} = \frac{1}{2}\left[\frac{G_L^2}{H_L + \lambda} + \frac{G_R^2}{H_R + \lambda} - \frac{(G_L + G_R)^2}{H_L + H_R + \lambda}\right] - \gamma_{\text{split}}
$$

Compare all five flower models on the identical validation split (standardizing only inside the logistic pipeline so validation statistics never leak):[^sklearnGradientBoostingMechanics2026]

<!-- leetllm: test, continue=tree-forest, output=show, id=tree-comparison -->
```python title="compare-the-fitted-models.py"
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import log_loss
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

booster = GradientBoostingClassifier(
    n_estimators=50, learning_rate=0.1, max_depth=2, min_samples_leaf=2, random_state=0,
)
models = {
    "logistic": make_pipeline(StandardScaler(), LogisticRegression()),
    "stump": stump,
    "deep tree": DecisionTreeClassifier(random_state=0),
    "forest": forest,
    "boosting": booster,
}
for name, model in models.items():
    model.fit(X_train, y_train)
    print(f"{name:9s} acc={model.score(X_valid, y_valid):.3f} log_loss={log_loss(y_valid, model.predict_proba(X_valid)):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
logistic  acc=0.967 log_loss=0.102
stump     acc=0.967 log_loss=0.145
deep tree acc=0.967 log_loss=1.201
forest    acc=1.000 log_loss=0.047
boosting  acc=0.967 log_loss=0.057
```
<!-- leetllm: output:end -->

Look at `deep tree`: identical `0.967` accuracy to `boosting`, yet `21x` worse log loss (`1.201` vs `0.057`) because one pure leaf makes a maximally confident mistake. Always track probability quality alongside accuracy.

| Dimension | Random forest | Gradient boosting |
|---|---|---|
| Target per tree | Original labels on bootstrap data | Current negative gradients (residuals) |
| Combination rule | Average member probabilities | Sum shrinkage-scaled corrections |
| Training parallelism | Trees fit independently in parallel | Rounds are sequential; split search parallelizes inside a round |
| Adding more trees | Stabilizes variance toward $\rho\sigma^2$ | Continues fitting training loss (needs early stopping) |

For squared-error regression, expected error splits into squared bias, estimation variance, and noise: $\mathbb{E}[(Y - \hat{f}_D(x))^2] = (\mathbb{E}_D[\hat{f}_D(x)] - f_*(x))^2 + \operatorname{Var}_D(\hat{f}_D(x)) + \sigma_\epsilon^2$. Forests primarily cut variance; boosting primarily cuts bias.

## Feature importance and local SHAP attribution

A tree library's default **mean decrease in impurity (MDI)** sums training split gains per feature. High-cardinality continuous noise offers hundreds of candidate cutoffs to overfit training quirks, stealing MDI credit from true binary signals.[^sklearn2026permutation] **Permutation importance** instead shuffles one column on *held-out validation rows* and measures the metric drop:

<!-- leetllm: test, deps=numpy,scikit-learn, output=show -->
```python title="mdi-vs-permutation-importance.py"
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance

rng = np.random.default_rng(1)
def make_rows(n):
    y = rng.integers(0, 2, size=n)
    signal = np.where(rng.random(n) < 0.70, y, 1 - y)
    return np.column_stack([signal, rng.random(n)]), y

train_x, train_y = make_rows(40)
valid_x, valid_y = make_rows(2000)
rf = RandomForestClassifier(n_estimators=20, max_depth=5, max_features=1, random_state=0).fit(train_x, train_y)
perm = permutation_importance(rf, valid_x, valid_y, scoring="f1", n_repeats=15, random_state=0)
for idx, name in enumerate(["binary signal", "continuous noise"]):
    print(f"{name:16s}: MDI={rf.feature_importances_[idx]:.3f} | valid perm drop={perm.importances_mean[idx]:.3f} (+/- {perm.importances_std[idx]:.3f})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
binary signal   : MDI=0.080 | valid perm drop=0.097 (+/- 0.007)
continuous noise: MDI=0.920 | valid perm drop=0.003 (+/- 0.007)
```
<!-- leetllm: output:end -->

> **Key insight:** Pure continuous noise grabbed `92%` of training MDI credit, yet shuffling it on validation data moved F1 by only `0.003`. Use validation permutation importance (grouping strongly correlated columns) to measure what a fitted model actually relies on.[^sklearn2026multicollinear]

To explain a *single* prediction $f(x)$, **SHAP** decomposes it into a baseline plus additive feature credits $f(x) = \phi_0 + \sum_j \phi_j(x)$.[^lundberg2017][^shapTreeExplainer2026] Using the training rows as an interventional background for our width-only stump on `[5.0, 1.8]`, averaging the marginal effect of setting each feature first vs second yields baseline `0.500`, length `+0.000`, and width `+0.469`, reconstructing `0.969` exactly. In production, `TreeExplainer` computes these attributions in polynomial time; always record whether explanations live in log-odds or probability units.

## Production GBDTs: chronological splits, cost thresholds, and NaN routing

Three operational traps separate a clean notebook benchmark from a reliable production boosted-tree model: temporal leakage, naive `0.50` thresholding, and inconsistent missing-value routing.

### 1. Freeze the clock before training

For time-ordered tabular events (such as GPU training jobs risking missed deadlines, fraud alerts, or churn), randomly shuffling rows leaks correlated outages and seasonal drift across train and test.[^sklearn2026leakage] Always freeze a strictly **<span data-glossary="train-validation-test-split">time-ordered split</span>**:

| Split | Period | Role |
|---|---|---|
| Train | Jan-Mar | Fit splits and leaf weights using point-in-time features |
| Validation | April | Pick stopping round and decision threshold |
| Test | May | Score the frozen model and threshold once |

Every feature must be available at prediction time, and labels must mature before the split cutoff (a March job still running on April 1 cannot leak its outcome into an April 1 training window).

### 2. Choose a Bayes-optimal cost threshold, not 0.50

AUC ranks predictions across all cutoffs, but deployment acts at one threshold $\tau$. Suppose alerting on an on-time job costs $C_{\text{FP}} = 8$, missing a standard deadline costs $C_{\text{FN}} = 60$, and missing a priority deadline costs $C_{\text{FN}} = 150$. For true risk $p(x) = P(y = 1 \mid x)$, alerting has expected cost $(1 - p(x))C_{\text{FP}}$ while staying quiet costs $p(x)C_{\text{FN}}$. Alerting is cheaper whenever:

$$
(1 - p(x))C_{\text{FP}} \le p(x)C_{\text{FN}}
\implies
p(x) \ge \frac{C_{\text{FP}}}{C_{\text{FP}} + C_{\text{FN}}} = \tau^*
$$

Plugging in the costs gives **Bayes-optimal thresholds** of $\tau^*_{\text{standard}} = 8 / 68 \approx 0.118$ and $\tau^*_{\text{priority}} = 8 / 158 \approx 0.051$. Default `0.50` is optimal only when false positives and false negatives cost the same. On validation, search all unique predicted probabilities rather than a coarse grid (`[0.15, 0.25, 0.40]`), compare against trivial baselines like **always-alert**, and verify recall floors on critical slices (`priority`, `large_model`) before opening the future test split.

### 3. Handle `NaN` routing deliberately across libraries

Missing measurements behave very differently across tree libraries, and mixing sparse zeros with `NaN` silently changes predictions:

| Implementation | Missing-value behavior |
|---|---|
| `GradientBoostingClassifier` (classic sklearn) | Rejects `NaN` with `ValueError`; requires explicit imputation |
| `HistGradientBoostingClassifier` (sklearn) | Learns `NaN` split directions natively; unseen serving-time `NaN` routes to the larger child[^sklearnHistGradientBoosting2026] |
| `DecisionTreeClassifier` / `RandomForestClassifier` | Learn missing directions on supported criteria (`splitter="best"`)[^sklearn2026treemissing][^sklearn2026forestmissing] |
| XGBoost (`missing=NaN`) | Learns default branch per split; absent sparse entries are missing, explicit `0` is a value[^chen2016xgboost][^xgboostFaq2026] |
| LightGBM (`zero_as_missing=false`) | Absent sparse entries count as zero unless `zero_as_missing=true` is enabled[^lightgbm2026missing] |

Trees also predict constants outside their outermost training splits, so never expect a tree leaf to extrapolate linear trends beyond observed feature ranges.

Put all three production mechanics together in one runnable check: a time-ordered Jan-Mar / April / May job dataset (with `+0.18` May log-odds drift), `GradientBoostingClassifier` vs `HistGradientBoostingClassifier` on `NaN`, and exact April cost-threshold tuning evaluated once on unseen May jobs:

<!-- leetllm: test, deps=numpy,scikit-learn, output=show -->
```python title="production-gbdt-chronological-cost-nan.py"
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier, HistGradientBoostingClassifier
from sklearn.metrics import roc_auc_score

# 1. NaN routing: classic GradientBoostingClassifier vs HistGradientBoostingClassifier
nan_X = np.array([[0.0], [1.0], [np.nan], [3.0]])
nan_y = np.array([0, 0, 1, 1])
try:
    GradientBoostingClassifier(random_state=11).fit(nan_X, nan_y)
    classic_ok = True
except ValueError:
    classic_ok = False
hist_nan = HistGradientBoostingClassifier(max_iter=2, min_samples_leaf=1, early_stopping=False, random_state=11).fit(nan_X, nan_y)
print(f"classic GBDT accepts NaN: {classic_ok} | HistGBDT accepts NaN: {bool(np.isfinite(hist_nan.predict_proba([[np.nan]])).all())}")

# 2. Chronological Jan-Mar -> April -> May split with mild May drift (+0.18 logit)
rng = np.random.default_rng(11)
def make_jobs(n, drift=0.0):
    input_gb = rng.integers(40, 1601, n)
    hb_age = rng.integers(1, 41, n)
    backlog = rng.integers(0, 31, n)
    priority = rng.integers(0, 2, n)
    large = (input_gb >= 900).astype(int)
    logit = -5.2 + 0.13 * hb_age + 0.07 * backlog + 0.85 * priority + 0.75 * large + drift
    y = rng.binomial(1, 1.0 / (1.0 + np.exp(-logit)))
    return np.column_stack([input_gb, hb_age, backlog, priority, large]), y

X_tr, y_tr = make_jobs(360)
X_va, y_va = make_jobs(140)
X_te, y_te = make_jobs(140, drift=0.18)

def total_cost(X, y, scores, tau):
    pred = (scores >= tau).astype(int)
    pri = X[:, 3] == 1
    miss = (y == 1) & (pred == 0)
    fa = (y == 0) & (pred == 1)
    return int(150 * np.sum(miss & pri) + 60 * np.sum(miss & ~pri) + 8 * np.sum(fa))

clf = HistGradientBoostingClassifier(max_iter=50, learning_rate=0.08, max_depth=3, min_samples_leaf=10, random_state=11).fit(X_tr, y_tr)
va_scores = clf.predict_proba(X_va)[:, 1]
cutoffs = np.r_[0.0, np.unique(va_scores), np.nextafter(1.0, 2.0)]
best_tau = float(min(cutoffs, key=lambda t: (total_cost(X_va, y_va, va_scores, t), t)))

te_scores = clf.predict_proba(X_te)[:, 1]
print(f"April tuned threshold: {best_tau:.4f} (April cost={total_cost(X_va, y_va, va_scores, best_tau)} vs default 0.50={total_cost(X_va, y_va, va_scores, 0.50)})")
print(
    f"May test (AUC={roc_auc_score(y_te, te_scores):.3f}) -> "
    f"tuned={total_cost(X_te, y_te, te_scores, best_tau)} | "
    f"default 0.50={total_cost(X_te, y_te, te_scores, 0.50)} | "
    f"always-alert={total_cost(X_te, y_te, np.ones(len(y_te)), 0.50)}"
)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
classic GBDT accepts NaN: False | HistGBDT accepts NaN: True
April tuned threshold: 0.0264 (April cost=556 vs default 0.50=3030)
May test (AUC=0.893) -> tuned=464 | default 0.50=1668 | always-alert=680
```
<!-- leetllm: output:end -->

Look at that May test payoff: the exact same model (`AUC = 0.893`) costs `1,668` at the default `0.50` cutoff, worse than blindly alerting on every job (`680`). Tuning the cutoff on April validation to `0.0264` slashes unseen May cost by more than `3.5x` to `464`, beating always-alert cleanly.

```checkpoint
False alarms cost 10 and missed failures cost 90. What is the Bayes-optimal probability threshold, and does changing it require retraining the booster?
---
tau* = 10 / (10 + 90) = 0.10. Changing the operating threshold uses the existing calibrated probabilities without refitting any trees.
```

```mastery-quiz
[
  {
    "question": "A balanced ten-row node splits into a pure four-row child and a six-row child with five positive labels and one negative label. What is the Gini gain?",
    "options": [
      "1/3",
      "1/2",
      "1/6",
      "13/36"
    ],
    "answer": "1/3",
    "explanation": "Parent Gini is 1/2. The pure child has Gini 0 and the mixed child has Gini 2(5/6)(1/6) = 5/18. Weighting by 6/10 gives child impurity 1/6, so gain is 1/2 - 1/6 = 1/3."
  },
  {
    "question": "A training row appeared in bootstrap samples for trees 1 and 3, but not trees 2 and 4. Which trees form its out-of-bag prediction, and what does OOB still miss on time-ordered data?",
    "options": [
      "Trees 2 and 4; OOB does not isolate future time periods or temporal drift.",
      "Trees 1 and 3; OOB isolates future time periods automatically.",
      "All four trees; OOB only removes feature subsampling.",
      "Trees 2 and 4; OOB replaces the need for any validation or test split."
    ],
    "answer": "Trees 2 and 4; OOB does not isolate future time periods or temporal drift.",
    "explanation": "OOB averages only trees whose bootstrap omitted that row (trees 2 and 4). Because rows are omitted randomly across dates, OOB still mixes past and future periods."
  },
  {
    "question": "Ten rows in a classification boosting leaf all have current probability 0.5; seven have label 1 and three have label 0. What is the unshrunk Newton leaf step sum(y - p) / sum(p(1 - p))?",
    "options": [
      "0.80",
      "0.20",
      "0.70",
      "8.00"
    ],
    "answer": "0.80",
    "explanation": "Residuals sum to 7(0.5) + 3(-0.5) = 2.0, and curvature sums to 10(0.25) = 2.5, giving a Newton step of 2.0 / 2.5 = 0.80 logit units."
  },
  {
    "question": "A continuous noise feature receives 0.92 training MDI importance, while shuffling it on validation data changes F1 by 0.003. What explains the discrepancy?",
    "options": [
      "Many candidate cutoffs let continuous noise earn training split credit, whereas validation permutation measures what the fitted model needs to generalize.",
      "Permutation importance retrained the forest without the noise feature.",
      "MDI and permutation importance always disagree on continuous features.",
      "Validation F1 is insensitive to features used near the root of trees."
    ],
    "answer": "Many candidate cutoffs let continuous noise earn training split credit, whereas validation permutation measures what the fitted model needs to generalize.",
    "explanation": "High-cardinality noise gives greedy split search many chances to overfit training rows (inflating MDI). Permutation importance evaluates the already-fitted model on held-out data."
  },
  {
    "question": "A production alert system charges 8 per false alarm and 150 per missed priority deadline, and serving rows occasionally contain NaN values. Which combination is sound?",
    "options": [
      "Use a chronological train/valid/test split, tune a cost-optimal threshold near 8/158 (about 0.051) on validation, and use HistGradientBoostingClassifier (or explicit NaN handling) instead of raw classic GradientBoostingClassifier.",
      "Randomly shuffle all months for 5-fold CV, keep the default 0.50 threshold, and pass NaN directly to classic GradientBoostingClassifier.",
      "Tune the threshold on May test data using coarse values [0.25, 0.50, 0.75] after imputing NaN with 0.",
      "Select the model with highest training AUC and rely on OOB accuracy to set the threshold."
    ],
    "answer": "Use a chronological train/valid/test split, tune a cost-optimal threshold near 8/158 (about 0.051) on validation, and use HistGradientBoostingClassifier (or explicit NaN handling) instead of raw classic GradientBoostingClassifier.",
    "explanation": "Chronological splits prevent temporal leakage, asymmetric costs place the Bayes-optimal cutoff at C_FP / (C_FP + C_FN) = 8/158 = 0.051, and HistGradientBoostingClassifier handles NaN natively whereas classic GradientBoostingClassifier raises ValueError."
  }
]
```

> **Next:** Continue to [Clustering and PCA](/learn/clustering-pca-representation-learning).
