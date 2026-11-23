---
title: Generalization gap
importance: 87
---
The generalization gap is the difference between performance on examples used during model development and performance on independent examples from the intended population. For losses, it is often written as expected population loss minus empirical training loss. A large gap can indicate overfitting, leakage, selection bias, distribution shift, or a mismatch between the reported metric and the deployment task.

## Separate fitting error from evaluation bias

Let $\widehat L(h)$ be average loss on development data and $L(h)$ the expected loss on fresh representative examples. The gap is $L(h)-\widehat L(h)$. Population risk is usually unknown, so a properly isolated test set estimates it with sampling uncertainty. Repeatedly inspecting that test and using it to choose models makes it part of development and can bias reported performance optimistically. A useful model needs strong performance on both training and representative test data; a small gap can coexist with poor results on both.


## Example

A ticket-routing classifier reaches 98% accuracy on its training rows and 79% on a locked future-week test. The observed accuracy gap is 19 percentage points. Before blaming model size, inspect duplicate users across splits, labels that were unavailable at routing time, changed traffic mix, and repeated tuning against the same test. A second classifier scoring 86% in training and 84% on the untouched test may be the safer deployment candidate despite its lower training headline.

## Why it matters here

Researchers must distinguish a genuine capability increase from memorization or benchmark reuse. Reporting both the split protocol and the measured gap makes model selection, prompt experiments, and release decisions easier to trust.

## Related terms

- [Statistical learning theory](glossary://statistical-learning-theory)
- [Overfitting](glossary://overfitting)
- [Feature leakage](glossary://feature-leakage)
