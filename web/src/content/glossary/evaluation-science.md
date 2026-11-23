---
title: Evaluation science
importance: 91
---
**Evaluation science** designs measurements that support reliable model decisions. It connects construct validity, clean splits, uncertainty, evaluator calibration, slice coverage, reproducibility, external validity, and promotion rules.

Evaluate whether a score supports the intended decision:

1. Does metric represent target capability?
2. Are train and test isolated from contamination?
3. Are units statistically independent?
4. How uncertain is measured difference?
5. Does gain survive relevant slices, seeds, judges, and environments?
6. Did safety or retained capability regress?


## Example

Candidate gains 1.0 point on average, but 95% paired [confidence interval](glossary://confidence-interval) crosses zero and service-held-out slice regresses. Evaluation-science decision is “insufficient evidence,” even if training reward improved.

## Why it matters here

Post-training reward can rise while real capability stays flat. Evaluation science separates optimization signal from release evidence and defines when to continue, stop, or roll back.

## Common failures

- [Benchmark contamination](glossary://benchmark-contamination)
- Repeated checkpoint selection on final holdout
- Treating sibling rollouts as independent tasks
- Uncalibrated model judge
- Missing capability-retention suite
- No predeclared minimum effect or stopping rule

## Related terms

- [Eval harness](glossary://eval-harness)
- [Evaluation slice](glossary://evaluation-slice)
- [Bootstrap resampling](glossary://bootstrap-resampling)
- [Calibration](glossary://calibration)
- [Eval gate](glossary://eval-gate)
