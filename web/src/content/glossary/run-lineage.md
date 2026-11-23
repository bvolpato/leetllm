---
title: Run lineage
aliases: ["training-run lineage", "experiment lineage", "run ancestry"]
importance: 76
kind: term
---
A **run lineage** is the ancestry connecting training attempts, checkpoints, resumes, branches, and evaluation artifacts that belong to one evolving model state. One logical lineage may cross several process runs after preemption or retry. Two runs with similar names may belong to different lineages if they started from different checkpoints or optimizer state.

## Lineage identity

Useful lineage identity includes parent checkpoint, global update, policy version, code and container digests, optimizer and scheduler state, data cursor, tokenizer, reward version, and attempt ID. Faithful continuation may also require RNG states, mixed-precision scaler, and any unfinished gradient accumulation. Record which state was actually restored. Retries can emit duplicate points, and a resumed job can begin later while representing an earlier model state, so wall-clock order cannot identify lineage on its own.

## Example

A worker fails after writing a complete checkpoint. Scheduler starts a new process with a new run ID, restores model and optimizer state, and continues from recorded data cursor. Those process runs are separate attempts inside one lineage. A branch that loads same weights but resets Adam moments begins a different learning trajectory and should be labeled as a fork.

## Why it matters here

Trend analysis must align observations by model ancestry and policy update. Joining every point by timestamp can double-count retries, hide resets, and turn unrelated endpoints into a fake continuous curve.

## Related terms

- [Model checkpoint](glossary://model-checkpoint)
- [MLflow](glossary://mlflow)
- [Provenance](glossary://provenance)
- [Audit trail](glossary://audit-trail)
