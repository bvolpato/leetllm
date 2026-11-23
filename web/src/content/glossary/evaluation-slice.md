---
title: Evaluation slice
aliases: ["eval slice"]
importance: 82
---
An **evaluation slice** is a named, reproducible subset of eval cases that share a behavior, user path, language, risk class, data shape, or known failure mode. Score each slice independently alongside the pooled average, using measures such as pass rate, recall, citation accuracy, refusal correctness, and latency.

Slice-based evaluation exists because aggregate metrics hide uneven performance. Google's [Fairness Indicators](https://www.tensorflow.org/responsible_ai/fairness_indicators/guide) and [TensorFlow Model Analysis](https://www.tensorflow.org/tfx/model_analysis/get_started) support subgroup metrics: overall accuracy or F1 can look fine while a subgroup's false positive or false negative rate is unacceptable. Separate the data into subgroups and report metrics per subgroup before you trust a launch number.

A slice is a versioned membership rule with enough support (row count) to make its metric meaningful. Three rows can triage a bug; release gates need stronger support.

## Intuition

When you **partition** the suite into disjoint slices that cover every row, and the metric is a **mean of per-row scores** (accuracy, pass rate, mean citation match, mean latency), the overall metric is exactly the support-weighted blend of the slice means:

$$
\hat{m}_{\mathrm{overall}} = \sum_s \frac{n_s}{N}\,\hat{m}_s
$$

where $n_s$ is support in slice $s$, $N=\sum_s n_s$ equals the suite size, and $\hat{m}_s$ is the mean score on that slice. A large easy slice dominates the average. A small, high-stakes slice can collapse while $\hat{m}_{\mathrm{overall}}$ barely moves. That is the production failure mode: "accuracy held at 0.91" while non-English, long-context, or tenant-isolation cases quietly break.

The identity **doesn't** hold for non-linear aggregates such as F1, AUC/ROC, macro-averaged multi-class scores, or medians. For those, always recompute `overall` from the pooled rows (or micro-average carefully from counts); don't reconstruct it by support-weighting slice-level F1/AUC numbers.

Production slices often **overlap** (locale and long PDF and risk tag on the same row). Then $\sum_s n_s > N$ and you must **not** reconstruct overall by averaging slice scores either. Score `overall` on the full suite, and score each named slice on its own membership set.

Simpson's paradox is the extreme form: a trend can reverse when groups are pooled. Even without a full paradox, **masking** is routine. Slices make the places the system fails *differently* visible before the average gives false comfort.

## Example

A document-QA offline suite has $N=1{,}000$ labeled rows. You ship only if every **gate** slice clears its floor, not if the pooled score is high.

| Slice id | What it covers | Support $n_s$ | Metric | Score | Floor | Gate? |
|----------|----------------|---------------|---------|-------|-------|-------|
| `overall` | All rows | $1000$ | citation accuracy | $0.91$ | $0.88$ | yes |
| `supported_policy` | Answerable policy questions | $420$ | citation accuracy | $0.94$ | $0.90$ | yes |
| `unsupported_question` | No evidence in corpus; must abstain | $120$ | correct abstain rate | $0.87$ | $0.85$ | yes |
| `paraphrase_recall` | Rephrased known FAQs | $150$ | answer match | $0.89$ | $0.85$ | yes |
| `long_pdf_table` | Tables / multi-page PDFs | $80$ | citation accuracy | $0.71$ | $0.80$ | yes |
| `untrusted_instruction` | Prompt injection in docs | $60$ | safe refusal / ignore | $0.95$ | $0.95$ | yes |
| `tenant_isolation` | Cross-tenant retrieval must fail closed | $40$ | zero unauthorized hits | $1.00$ | $1.00$ | yes |
| `es_locale` | Spanish queries | $90$ | citation accuracy | $0.78$ | debug | no |

Pooled citation accuracy is $0.91$ and beats the overall floor, while `long_pdf_table` misses its $0.80$ gate at $0.71$. Fix that slice or block its launch; promotion requires every gate slice to clear its floor.

A Wilson $95\%$ interval for a proportion $\hat{p}=s/n$ assumes independent Bernoulli observations. Correlated requests or repeated rollouts need an uncertainty method that respects their grouping. For `long_pdf_table`, $0.71$ on $n=80$ is more uncertain than $0.94$ on $n=420$ under that independent-row model. Always report **score, support, and skipped/invalid rows**. A slice with $n=3$ that "passes at 100%" provides little evidence about a population pass rate, though a known critical failure can still block release.

```python
from collections import defaultdict

def score_by_slice(rows, metric_fn):
    """rows have slice_ids and metric fields; 'overall' is reserved for all rows."""
    buckets = defaultdict(list)
    buckets["overall"] = []
    for row in rows:
        for sid in dict.fromkeys(row["slice_ids"]):
            if sid == "overall":
                continue
            buckets[sid].append(row)
        buckets["overall"].append(row)

    report = {}
    for sid, items in buckets.items():
        scores = [metric_fn(r) for r in items if not r.get("skip")]
        n = len(scores)
        report[sid] = {
            "support": n,
            "mean": sum(scores) / n if n else None,
            "skipped": sum(1 for r in items if r.get("skip")),
        }
    return report
```

Membership should be a pure function of frozen labels and metadata (locale, doc type, risk tags), not of the model's current prediction. Freezing the definition in code stops a new case from silently migrating buckets between runs.

## How slices are chosen

Good slices come from **product risk and real traffic**, not from a desire for more dashboards:

- **User path / intent:** FAQ vs multi-hop vs "should abstain"
- **Language and locale:** low-resource or secondary languages
- **Data shape:** long context, tables, OCR-heavy PDFs, code
- **Safety and policy:** jailbreak, untrusted tool output, PII, medical claims
- **Tenancy and auth:** isolation, permission boundaries
- **Incident regressions:** frozen cases that burned you once
- **Segment:** customer tier, device, channel (when labels exist)

Each decision-grade slice needs: a clear reason to exist, a membership rule, minimum support, a metric, a floor (or "debug only"), and an owner. Prefer fewer gate slices over dozens of decorative ones. Exploratory slices are fine for debugging; do not promote every noisy cohort into a blocker.

Manual slices (metadata filters, domain-written predicates like `page_count > 20`) cover known risks. Research systems such as SliceFinder and related slice-discovery work try to surface *interpretable* underperforming subgroups automatically. Those tools help you find candidates; product owners still decide which slices are gates.

## Reading a slice report

For each slice, look at:

1. **Score** vs floor (and delta vs previous candidate)
2. **Support** $n_s$ and skipped/invalid count
3. **Uncertainty** when $n_s$ is small ([confidence interval](glossary://confidence-interval) or bootstrap)
4. **Top failing [eval rows](glossary://eval-row)** with failure tags
5. **Role:** launch gate vs debugging lens

Compare candidates only when slice definitions, dataset version, grader, and metric match. Bucket changes or dropped hard cases invalidate the comparison; a reported win must use the same rows.

## What fails in production

- **Average worship:** ship on overall accuracy while a safety or isolation slice regresses.
- **Tiny gates:** gate on $n=5$ and thrash the pipeline with noise.
- **Silent membership drift:** slice predicates change with code or labels, so week-over-week charts lie.
- **Training on the gate:** fine-tune until the gate set is memorized; keep hidden or refresh holdouts.
- **No owner:** a red slice with no on-call path becomes wallpaper.

## Why it matters here

Slice-aware offline evals, launch [eval gates](glossary://eval-gate), golden sets, and production monitors depend on naming the cohorts that matter: languages, abstention, long docs, tenancy, injection, and incident regressions. Read those slices alongside aggregate scores to see where a system works and where a benchmark gain may hide failures.

## Related terms

- [Eval gate](glossary://eval-gate)
- [Eval row](glossary://eval-row)
- [Golden dataset](glossary://golden-dataset)
- [Offline evaluation](glossary://offline-evaluation)
- [Confidence interval](glossary://confidence-interval)
