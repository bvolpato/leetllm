---
title: Preference data
aliases: ["preference pairs", "preference dataset"]
importance: 82
---
**Preference data** records comparative or desirability feedback for model outputs. Pairwise form stores prompt, chosen response, and rejected response. Unpaired form stores one response with desirable/undesirable label.

A preference is conditional on the prompt, available evidence, and rubric. "Chosen" means preferred among these candidates, not necessarily correct or acceptable on its own. Both responses can fail a grounding requirement even when one is less bad.

```text
prompt
chosen response
rejected response
label or tie
annotator/rubric version
lineage
```

Pair quality depends on response contrast, annotator instructions, tie policy, uncertainty, and slice coverage. If chosen and rejected differ mainly in length or formatting, objective can learn shortcut instead of intended quality.

## Used by

- [Reward models](glossary://reward-model) learn scalar preference score.
- [DPO](glossary://dpo), [IPO](glossary://ipo), and [ORPO](glossary://orpo) use chosen/rejected pairs.
- [KTO](glossary://kto) can use unpaired desirable/undesirable labels.
- Rejection-sampled winners can become SFT data, but aren't automatically preference pairs.

The original [DPO](https://arxiv.org/abs/2305.18290), [IPO](https://arxiv.org/abs/2310.12036), and [ORPO](https://arxiv.org/abs/2403.07691) objectives train on comparisons; [KTO](https://arxiv.org/abs/2402.01306) uses a binary desirability signal. A tie or abstention is not a strict chosen/rejected label. Retain it for audit, and use an explicit exclusion or tie-aware objective rather than inventing a winner. An unpaired thumbs-up also does not identify which alternative the user would have preferred.

## Governance fields

Record source, policy/model version, sampling settings, annotator or judge version, rubric, timestamp, tie/abstain reason, raw evidence, license/privacy basis, and transformations.

## Example

For an incident prompt, both candidates see a timeline that says errors began just after a configuration change but gives no confirmed cause. Candidate A says "the timing makes the change a hypothesis; compare affected and unaffected hosts before concluding." Candidate B says "the configuration change definitely caused the outage." Under a rubric requiring evidence for causal claims, an annotator prefers A and records the timeline, full responses, rubric version, and confidence. This teaches the evidential distinction; choosing A just because it is shorter would teach a different preference.

Keep all candidates and derived comparisons from the same incident in one train/evaluation split. Otherwise an evaluation pair can reuse a timeline or response already seen during training. Inspect disagreement and selected/rejected length distributions by slice, and test the trained policy on new incidents with factual checks as well as preference judgments.

## Why it matters here

Preference objectives learn distinctions present in labels. lineage and slice design determine whether policy learns intended quality or shortcuts such as length and style.

## Related terms

- [DPO](glossary://dpo)
- [Reward model](glossary://reward-model)
- [lineage](glossary://provenance)
- [Data governance](glossary://data-governance)
