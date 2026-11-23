---
title: Loss mask
importance: 87
---
A **loss mask** marks which token positions contribute to a training objective. A value of 1 usually means "include this token's loss" while 0 means "carry this token as context but don't optimize it." Exact dtype and normalization depend on the trainer.

Agent trajectories interleave model actions with environment observations. Tool results help predict the model's next action, but the model didn't choose those observation tokens. Masking them out prevents the policy gradient from treating external telemetry as an action to imitate.

## Mask versus attention

An attention mask controls which tokens can read which positions. A loss mask controls which predicted positions contribute gradients. A token can remain visible as context while receiving zero direct loss weight.

Zero direct loss does not detach that token's representation: later supervised tokens can still backpropagate through the context they read. For a causal LM, align the mask with the predicted target after the label shift, not blindly with the input position.

## Example

For tokens `[user, model_call, tool_result, model_answer]`, a conceptual mask `[0, 1, 0, 1]` trains the two model-generated positions while preserving the full conversation as input context.

If logits at positions 0, 1, and 2 predict targets `[model_call, tool_result, model_answer]`, the corresponding shifted mask is `[1, 0, 1]`. A token-mean loss divides the weighted sum by the number of included targets (two here), not all four input tokens; other reductions are possible but must be explicit. Reject or skip an all-zero mask rather than divide by zero.

## Why it matters here

SkyRL passes response token IDs and loss masks into Megatron. A shifted or inverted mask can make a numerically stable run train on wrong text, so mask counts and token alignment belong on the correctness dashboard.

## Related terms

- [Policy gradient](glossary://policy-gradient)
- [Causal mask](glossary://causal-mask)
- [Rollout](glossary://rollout)
- [Sample packing](glossary://sample-packing)
- [Token](glossary://token)
