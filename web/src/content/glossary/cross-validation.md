---
title: Cross-validation
importance: 92
---

Cross-validation estimates model performance by repeatedly fitting on one subset of data and evaluating on a separate subset. In ordinary $k$-fold cross-validation, the dataset is divided into $k$ folds, each fold becomes validation once, and the resulting scores are summarized. Every learned preprocessing step must be fitted inside the corresponding training fold.

## Choose the split unit before the fold count

Independent shuffled folds are unsuitable when rows share users, conversations, documents, or time-dependent events. Group-based folds keep related examples together; chronological folds preserve the direction of prediction; nested cross-validation separates hyperparameter search from outer evaluation. Fold scores describe variability across the chosen partition. Population generalization requires assumptions and evaluation data matched to deployment.

## Example

Twenty access requests belong to five account owners. Random row-based folds can place one owner's earlier request in training and a later related request in validation, allowing the model to recognize the account instead of generalizing. Grouping all rows by account owner keeps each owner's history within a single fold. If production predicts future decisions for existing owners, chronological splitting may be more faithful than owner holdout; the deployment question determines the correct evaluation design.

## Why it matters here

Classical classifiers, feature pipelines, prompt experiments, and retrieval evaluations all need an honest separation between learned decisions and reported evidence. Cross-validation is useful only when folds respect prediction time, identity boundaries, preprocessing ownership, and the intended deployment population.

## Related terms

- [Nested cross-validation](glossary://nested-cross-validation)
- [Data leakage](glossary://data-leakage)
- [Train, validation, and test split](glossary://train-validation-test-split)
