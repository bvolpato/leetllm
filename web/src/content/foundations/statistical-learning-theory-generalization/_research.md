# Research brief: when prompt search outgrows a validation score

## The actual claim at stake

Can the highest-scoring prompt among 1,000 candidates evaluated on the same 40 user queries support the same generalization claim as one predictor fixed before those cases were observed?

## Authoritative mathematical foundation

- Percy Liang's Stanford CS229T/STATS231 notes develop empirical versus expected risk, concentration, uniform convergence, hypothesis classes, complexity, and learning guarantees. These notes are the article's direct primary teaching source: https://web.stanford.edu/class/cs229t/2016/notes.pdf
- The Stanford course page gives the institutional provenance and scope of statistical learning theory without converting course examples into production measurements: https://web.stanford.edu/class/cs229t/
- Wassily Hoeffding's original 1963 paper establishes probability inequalities for sums of independent bounded random variables, the source of the lesson's fixed-predictor concentration argument: https://doi.org/10.1080/01621459.1963.10500830
- Stanford's notes treat complexity control as a property of the candidate class and sampling procedure. They don't justify a hypothesis class chosen after repeatedly inspecting the same evaluation labels: https://web.stanford.edu/class/cs229t/2016/notes.pdf

## Derivation and numerical checks

For independent losses in `[0, 1]` and a predictor fixed independently of the evaluation sample, the two-sided Hoeffding bound gives `P(|Lhat(h) - L(h)| >= t) <= 2 exp(-2 n t^2)`.

- At `n = 40` and `delta = 0.05`, the fixed-predictor radius is `sqrt(log(2 / 0.05) / 80) = 0.2147`. Four failures yield empirical risk `0.1`, so the conservative displayed upper endpoint is approximately `0.315`.
- For a prespecified finite class, a union bound gives `sqrt(log(2 * |H| / delta) / (2 * n))`. Candidate counts `1`, `10`, and `1,000` give radii approximately `0.215`, `0.274`, and `0.364`.
- Requiring radius `0.05` with `|H| = 1,000` and `delta = 0.05` yields `ceil(log(40,000) / 0.005) = 2,120` independent examples. This is a sufficient bound under the stated analysis, not the smallest possible sample or an exact forecast of winner optimism.
- A right-facing threshold can label one point either way but can't assign labels `(1, 0)` to two increasingly ordered points. That hypothesis class has VC dimension one.

## Failure modes that change the theorem, not just its presentation

- The finite-class union bound requires the class to be fixed independently of the sample. Counting only the final 1,000 prompts doesn't repair adaptive prompt writing informed by the same labels.
- Repeated retries, near-duplicate user queries, and multiple rows from one episode reduce independent evidence. Group before treating the nominal row count as `n`.
- Population risk concerns the sampling distribution in the claim. No concentration inequality here certifies performance after a change in traffic mix, prompt rules, labels, or tooling.
- PAC confidence `1 - delta` concerns the learning guarantee under its assumptions. It isn't a promise that every deployment window or customer subgroup reaches the same score.

## Recommended evidence-preserving handoff

Freeze the chosen prompt before one untouched, representative final test. Keep glossary links close to empirical risk, population risk, generalization gap, Hoeffding inequality, union bound, hypothesis class, VC dimension, PAC learning, and sample complexity.
