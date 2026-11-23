---
title: Train, validation, and test split
aliases: ["train/validation/test split", "train-validation-test split", "train/val/test split"]
importance: 90
---
A **train / validation / test split** partitions labeled data into three roles so fitting, recipe choice, and final claims stay separate. **Train** updates parameters. **Validation** chooses models, hyperparameters, prompts, thresholds, features, and checkpoints. **Test** estimates risk on data that did not influence those choices. The classical name for holding data out of training is the **holdout method**.

The split is a policy that protects a final question from [overfitting](glossary://overfitting) to the evaluation sample. If test scores drive another round of tuning, the test set has become validation and the published number no longer estimates a fresh holdout.

## Intuition

Empirical risk on the same rows used to fit a model is usually optimistic. A lookup table or nearest-neighbor classifier can get zero train error and still fail on new draws from the same population. The fix is simple in principle: fit on one sample, score on a fresh independent sample.

With only train and test, any search over architectures, prompts, learning rates, or decision thresholds can still overfit the *test* set. Validation absorbs that search. Test is the iron vault: ideally used once (or rarely) after the recipe is frozen. *Elements of Statistical Learning* puts it bluntly: the test set should be kept in a vault and brought out only at the end of the analysis. Using it repeatedly to pick the model with smallest test error underestimates true risk.

In product and LLM work the same three roles often have different labels:

| Classical name | Product / LLM name | Allowed use |
| --- | --- | --- |
| Train | Fine-tune set, SFT mix, preference pairs | Parameter updates, gradient steps |
| Validation | Dev set, tuning set, offline scratch pad | Hyperparams, prompts, thresholds, early stop, retriever settings |
| Test | Holdout, [golden dataset](glossary://golden-dataset), private eval | Ship / no-ship claim after freeze |

## How it works

1. **Choose the split unit first.** Row, user, account, document, repository, conversation, or time window. The unit is what must not leak across partitions.
2. **Carve disjoint sets** $S_{\text{train}}$, $S_{\text{val}}$, $S_{\text{test}}$ (or nested CV folds that preserve the same roles).
3. **Fit only on train.** Parameters, tokenizers you train yourself, scalers, and feature selectors come from train only. Define the retrieval corpus separately: a RAG test may legitimately retrieve held-out documents when those documents would be available in production, without exposing held-out questions or answer labels to tuning.
4. **Select on validation.** Compare recipes by $\hat{R}_{S_{\text{val}}}$. Early stopping and checkpoint pick live here.
5. **Report once on test.** After the recipe is frozen, compute $\hat{R}_{S_{\text{test}}}$ as the final offline claim. Prefer a versioned gold set that never trains and rarely retunes.
6. **Ship with eyes open.** Offline test is still not production. Watch [data drift](glossary://data-drift), [training-serving skew](glossary://training-serving-skew), and live slices after release.

scikit-learn's workflow matches this: hold out a test set for final evaluation; use a validation set (or cross-validation *inside* the training portion) for hyperparameter search so knowledge about the test set does not leak into the model.

## Formula

Let $\ell$ be a loss, $f$ a fixed predictor, and $\mathcal{D}$ the data-generating distribution. True risk and empirical risk on a sample $S$ of size $n$ are

$$
R(f) = \mathbb{E}_{(x,y)\sim\mathcal{D}}\big[\ell\big(f(x), y\big)\big],
\qquad
\hat{R}_S(f) = \frac{1}{n}\sum_{(x,y)\in S}\ell\big(f(x), y\big).
$$

If $f$ is independent of $S$ (the holdout was not used for training or selection), then $\mathbb{E}[\hat{R}_S(f)] = R(f)$. For loss bounded in $[0,1]$ and $n$ iid holdout points, Hoeffding-style concentration gives, for any $\delta\in(0,1)$,

$$
\mathbb{P}\!\left(\big|R(f)-\hat{R}_S(f)\big|
\le \sqrt{\frac{\log(2/\delta)}{2n}}\right) \ge 1-\delta.
$$

Rule of thumb: fluctuations scale like $1/\sqrt{n}$. Order of magnitude, about $10{,}000$ iid test cases put two-sided width near a few percentage points on a $[0,1]$ rate (for $\delta=0.05$, the Hoeffding half-width is about $0.014$, not a hard $\pm 0.01$ guarantee). Selection among $k$ candidates on a holdout replaces $\delta$ by something like $\delta/k$ (union bound); the selected model's *validation* score is optimistically biased, which is why a fresh test set (or nested CV) still matters.

The three-way split assigns:

$$
\begin{aligned}
\theta^\star &= \arg\min_\theta\ \hat{R}_{S_{\text{train}}}(f_\theta)
  &&\text{(fit)},\\
\lambda^\star &= \arg\min_\lambda\ \hat{R}_{S_{\text{val}}}(f_{\theta^\star(\lambda)})
  &&\text{(select)},\\
\widehat{R}_{\text{report}} &= \hat{R}_{S_{\text{test}}}(f_{\theta^\star(\lambda^\star)})
  &&\text{(claim)}.
\end{aligned}
$$

Here $\lambda$ stands for any recipe choice: architecture, prompt, threshold, LoRA rank, learning rate, feature set.

## Example

You build a RAG-answer risk classifier: predict whether a grounded answer needs human review ($y=1$ means review). You have $N=50{,}000$ labeled answer rows derived from $12{,}000$ source documents.

**Wrong design:** random 70/15/15 row split. Chunks from the same source documents appear in both train and test. Near-duplicate questions and shared document phrasing inflate accuracy.

**Better design:** split by **source document** (group holdout), then freeze a time-based final test from recently published held-out documents.

| Split | Unit | Size | Use |
| --- | --- | --- | --- |
| Train | Documents A | $35{,}000$ answer rows | Fit classifier / LoRA head |
| Validation | Documents B | $7{,}500$ answer rows | Threshold, features, early stop |
| Test | Documents C, recently published | $7{,}500$ answer rows | One-shot report |

You try decision thresholds $t\in\{0.3,0.4,0.5\}$ on validation. $t=0.4$ maximizes F1 on val. Freeze $t$ before the test evaluation. Test F1 is $0.71$; val F1 was $0.76$. The gap reflects expected selection optimism plus mild shift; retuning on test would invalidate its one-shot estimate.

Sketch of a group-aware three-way split (sklearn-style):

```python
from sklearn.model_selection import GroupShuffleSplit

# First hold out test documents, then split the rest into train/val
gss_test = GroupShuffleSplit(n_splits=1, test_size=0.15, random_state=0)
train_val_idx, test_idx = next(gss_test.split(X, y, groups=document_id))

gss_val = GroupShuffleSplit(n_splits=1, test_size=0.18, random_state=1)
# Second split returns indices into the train_val *subset*, not the full matrix
rel_train, rel_val = next(
    gss_val.split(X[train_val_idx], y[train_val_idx], groups=document_id[train_val_idx])
)
train_idx = train_val_idx[rel_train]
val_idx = train_val_idx[rel_val]
# Fit transforms on train only; transform val/test. Never fit on all rows first.
```

`test_size` in `GroupShuffleSplit` counts groups, not rows. Unequal document sizes therefore need not produce the table's illustrative row ratios. This code randomly holds out groups; enforcing the recent-document test described above requires an explicit time cutoff first.

For an AI tutor, the same pattern is: train SFT pairs from courses A, tune prompts and decoding on courses B, and report on a frozen [golden dataset](glossary://golden-dataset) from courses C. Keep held-out questions and reference answers out of few-shot demos and the retrieval index. Authorized course documents may belong in that index if retrieving them is part of the tested task. A golden set used repeatedly to choose prompts serves as validation, even if its filename says test.

## Sizing and ratios

Common fixed ratios are $70/15/15$, $80/10/10$, or $60/20/20$. There is no universal optimum. Priorities:

- **Enough train** to fit the model class you actually ship (fine-tunes on tiny $n$ overfit easily).
- **Enough validation** to distinguish recipes; noisy val makes threshold and prompt search thrash.
- **Enough test** for a stable claim. Under iid $[0,1]$ loss, $n_{\text{test}}\gtrsim 1/\varepsilon^2$ is the classical sample-size sketch for additive error $\varepsilon$.

When data are scarce, replace a fixed validation set with $k$-fold CV **on the training portion only**, still holding out a true test (or nested CV). When data are plentiful, a single three-way split is simpler and usually enough. Stratify rare classes when class balance must be preserved in each partition; use **group** splitters when rows are not independent; use **time** splits (or [rolling-origin evaluation](glossary://rolling-origin-evaluation)) when production scores the future.

## Split design

Choose the unit before the ratio. Product data almost never satisfy iid row assumptions.

| Design | When | Failure if ignored |
| --- | --- | --- |
| Random row | Truly iid rows, no groups | Optimistic scores from near-duplicates |
| Stratified | Class imbalance | Empty rare-class folds, undefined metrics |
| Group (user, document, repo, patient) | Multiple rows per entity | Same entity in train and test; identity leakage |
| Time / rolling origin | Forecasting, drift, logs | Future information in train; inflated offline skill |
| Document / conversation | RAG, chat, multi-turn | Chunk siblings or thread context cross splits |

Fit preprocessing **after** the split: scaler, imputer, SelectKBest, TF-IDF, and embedding centroids are fit on train only, then applied to val/test. Fitting them on the full matrix is [feature leakage](glossary://feature-leakage).

## Debug path

When offline quality looks too high relative to shadow traffic or a private rewrite:

1. Check **duplicate and near-duplicate** rows across train and test (exact IDs, hashes, high n-gram or embedding overlap).
2. Check **group leakage**: same user, document, repository, or conversation thread in more than one split.
3. Check **time leakage**: future timestamps, late-arriving labels, aggregates over windows that include the label period.
4. Check **pipeline leakage**: transforms or feature selection fit on all rows before split.
5. Check **eval contamination**: test stems in SFT data, few-shot packs, or the retrieval index ([benchmark contamination](glossary://benchmark-contamination)).
6. Check **selection overuse**: weekly retuning against the same "test" file. Promote a new frozen gold version instead of burning the vault.

## Trade-offs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Larger test | Tighter confidence on the claim | Less data for fitting |
| Larger validation | More reliable recipe search | Less train; more selection pressure if overused |
| Fixed three-way split | Simple, cheap, clear audit | Sensitive to one unlucky partition |
| CV inside train + frozen test | Better use of scarce data | More compute; still need a true holdout |
| Nested CV | Less need for a permanent val set | Harder ops story; easy to implement wrong |
| Group / time splits | Honest production proxy | Smaller effective $n$; harder stratification |

## Why it matters here

Every model, prompt, retriever, and agent claim in this curriculum depends on separation of fit, tune, and report. Without it, notebooks publish fiction: scores driven by leakage, contamination, or repeated peeking at the exam. With it, offline numbers stay decision-grade, golden sets stay trustworthy, and production surprises shrink to real drift and product change rather than self-inflicted optimism.

## Related terms

- [Overfitting](glossary://overfitting)
- [Feature leakage](glossary://feature-leakage)
- [Golden dataset](glossary://golden-dataset)
- [Benchmark contamination](glossary://benchmark-contamination)
- [Rolling-origin evaluation](glossary://rolling-origin-evaluation)
