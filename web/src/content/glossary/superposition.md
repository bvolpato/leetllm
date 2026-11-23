---
title: Superposition
importance: 80
---
**Superposition** occurs when a neural network represents more useful features than it has independent activation dimensions by storing multiple features in overlapping directions. A single neuron can therefore participate in several unrelated concepts, and one concept can be distributed across many neurons. The geometry is economical when few features activate at the same time.

## Why overlapping directions interfere

Two orthogonal feature vectors can be read independently because their dot product is zero. When a model needs more features than dimensions, some directions must overlap. If feature directions $u$ and $v$ have $u^\top v=0.3$, activating $u$ produces a partial reading along $v$ even when feature $v$ is absent.

Sparse feature usage limits the damage: concepts that rarely co-occur can reuse representational capacity. Interference becomes visible when overlapping features activate together or when an interpretation method mistakes a mixed neuron for a complete semantic unit.


## Example

Suppose one activation coordinate rises for both `rotate API credentials` and `suspected credential theft`. Inspecting that neuron alone might suggest the model treats legitimate maintenance as malicious. A richer feature decomposition can separate an administrative-maintenance direction from a credential-risk direction, showing that both partially share the same coordinate.

Test the explanation by editing one recovered direction while holding the other fixed. If the maintenance answer improves without reducing the model's refusal on actual credential theft, the intervention supports a useful distinction. If both outcomes move together, the feature separation remains incomplete.

## Why it matters here

Superposition explains why individual neurons often look polysemantic and why sparse feature dictionaries can reveal clearer hypotheses. Evaluate feature overlap, causal independence, and steering safety separately from a feature's label.

## Related terms

- [Residual stream](glossary://residual-stream)
- [Vector](glossary://vector)
- [Embedding](glossary://embedding)
- [Gradient](glossary://gradient)
