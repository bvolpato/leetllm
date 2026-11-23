---
title: Protected unit
aliases: ["privacy unit"]
importance: 93
---

The protected unit is the entity whose contribution defines neighboring datasets in a differential-privacy guarantee. The adjacency rule may add/remove that entity's data or replace its contribution; those are distinct conventions that must be stated. The entity might be one row, one conversation, one person, or one organization. The privacy statement applies to the unit used in the mechanism's sensitivity analysis, sampling assumptions, clipping procedure, and accountant. A user-level claim requires a mechanism and accounting unit that protect users.

## Align neighboring datasets, clipping, and accounting

Per-example DP-SGD normally bounds one training example. User-level protection can sample users and clip each user's aggregate gradient, directly bounding the user's combined influence. Another route caps how many examples each user contributes and converts the example-level guarantee using valid group-privacy bounds. Both approaches need correct contribution ownership; the second also requires the promised count cap to be enforced. Pair grouping with clipping or another sensitivity bound to limit influence.

## Example

One support customer contributes twelve training messages. Clipping each message separately limits each row's gradient, while removing the customer removes twelve rows. A row-level accountant supports a row-level guarantee. To claim user-level protection here, group all twelve messages by customer, bound their combined contribution, and account for sampled users.

## Why it matters here

Support transcripts and feedback datasets often contain repeated user contributions. A deployment can publish a technically valid privacy budget while protecting the wrong unit. Explicit protected-unit ownership prevents that mismatch from becoming a false privacy claim.

## Related terms

- [Differential privacy](glossary://differential-privacy)
- [DP-SGD](glossary://dp-sgd)
- [Privacy budget](glossary://privacy-budget)
- [Privacy accountant](glossary://privacy-accountant)
