# Research brief: finite-sample latency intervals without fabricated certainty

## Research question

How does a frozen latency predictor transform nine held-out residuals into an 80% split-conformal prediction interval, and what does that coverage statement explicitly not promise?

## Primary papers

- Anastasios Angelopoulos and Stephen Bates introduce distribution-free conformal prediction, the finite-sample quantile correction, marginal coverage, prediction-set size, and practical implementation choices: https://arxiv.org/abs/2107.07511
- Rina Barber, Emmanuel Candès, Aaditya Ramdas, and Ryan Tibshirani analyze conformal prediction when exchangeability fails, making the ordinary guarantee's data assumptions and distribution-shift limitations explicit: https://arxiv.org/abs/2202.13415
- The first paper's author-hosted code gives a concrete reference for implementing conformal methods, but a repository implementation must still be matched to its exact version and method variant: https://github.com/aangelopoulos/conformal-prediction

## Exact running-example ledger

The sorted calibration residuals are `[2, 3, 3, 4, 5, 6, 7, 8, 12]` milliseconds. With `n = 9` and target coverage `1 - alpha = 0.8`, split conformal uses order-statistic rank `ceil((n + 1) * (1 - alpha)) = ceil(10 * 0.8) = 8`. The eighth residual is `8`, so a point prediction of `40` milliseconds yields `[32, 48]`.

- The rank is one-indexed. Index the sorted Python list at `rank - 1`.
- A 95% target on the same nine examples requires rank `ceil(10 * 0.95) = 10`. No tenth observed residual exists. An ordinary finite observed threshold can't support that requested distribution-free level without a convention that effectively yields an unbounded prediction set.
- Held-out results covering three out of four future points demonstrate `75%` observed coverage in that tiny sample. They don't contradict an `80%` marginal repeated-draw guarantee.
- Interval width matters alongside coverage. An unbounded or extremely wide interval can satisfy a coverage objective while failing the operational deadline decision.

## Assumptions and evidence scope

1. Fit the model on one split and freeze it before scoring an independent calibration split.
2. Standard marginal validity assumes the calibration points and the future test point are exchangeable. Permuting an already shifted log doesn't make those examples exchangeable.
3. Marginal coverage averages across the target distribution and calibration randomness. It doesn't provide conditional coverage for each tenant, prompt-length bucket, individual feature value, or one fixed realized calibration set.
4. Repeatedly tuning on calibration residuals invalidates the simple frozen-model story unless the selection procedure is accounted for separately.
5. Heteroscedastic latency, queue changes, and tenant-specific error may require different nonconformity scores, group-aware calibration, fresh data, or a method explicitly designed for shift.

## Glossary and teaching dependencies

Define prediction interval, calibration split, nonconformity score, order statistic, quantile, exchangeability, marginal coverage, and conditional coverage exactly where they first carry meaning. Keep the latency example identical across prose, figure, runnable cells, and quiz.
