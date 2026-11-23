---
title: Pytree
aliases: ["JAX pytree"]
importance: 74
---
A **pytree** is a nested structure of containers whose leaves hold values such as arrays, scalars, or optimizer buffers. JAX uses pytrees to pass complete model parameters, gradients, and optimizer state through transformations without flattening those structures manually.

## Structure is part of the contract

A pytree has two pieces: its leaves and a **tree definition** describing container types, keys, and nesting. `jax.tree.map` applies a function to matching leaves across one or more trees. Trees used together must match in container types, keys, nesting, and leaf positions.

For example, `{"encoder": {"weight": w, "bias": b}}` and `{"encoder": {"kernel": w, "bias": b}}` differ even when every array has the same shape. A renamed key changes the structural contract and can break parameter updates, checkpoint loading, or optimizer restoration.


## Example

A tiny model stores `{"layer": {"w": [2.0], "b": [0.5]}}`; its gradient tree stores `{"layer": {"w": [0.3], "b": [0.1]}}`. Mapping `parameter - 0.1 * gradient` over corresponding leaves produces updated values `[1.97]` and `[0.49]` while preserving the nested dictionary shape.

When you add a new layer to the parameter tree, initialize a matching gradient and optimizer buffer and migrate checkpoints to include the new leaf.

## Why it matters here

Pytrees explain how JAX research programs represent full model and optimizer state as explicit function arguments. Structural compatibility is essential for reproducible updates and safe checkpoint resumes.

## Related terms

- [Optimizer state](glossary://optimizer-state)
- [Gradient](glossary://gradient)
- [Model checkpoint](glossary://model-checkpoint)
- [Tensor](glossary://tensor)
