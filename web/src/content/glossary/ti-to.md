---
title: TI/TO
aliases: ["token-in-token-out", "token in token out", "token-in/token-out"]
importance: 85
---
**TI/TO** (token-in/token-out) is a tokenization schema: the token IDs the rollout sampler actually produced are the token IDs the learner trains on. After the first prompt encode, later turns **append** sampled IDs and separately encoded observations. They do not decode the conversation to text and run the tokenizer again.

That sounds picky until one special token shifts. A chat template, a thinking span, or a tool delimiter can encode differently on the second pass. The strings still look fine. The IDs, [loss mask](glossary://loss-mask), and log-probabilities no longer describe the same sequence.

Rate cards also use TI/TO for billed [input tokens](glossary://token) versus generated tokens. There it describes pricing; this entry uses TI/TO for a training data schemas. Label pricing and training fields explicitly.

## Intuition

The model never trained on your UTF-8. It trained on integer IDs from one [tokenizer artifact](glossary://tokenizer-artifact) plus one [chat template](glossary://chat-template). If rollout emitted `[101, 220, 88]` and training later sees `[101, 45, 8, 88]`, the policy gradient is updating a different token sequence than the one that earned the reward, even if both sequences decode to the same string.

TI/TO is the rule that stops that rewrite. Keep the sampler's IDs. Encode new environment text once. Concatenate. Mask observations. Train.

## Example

Checkout-latency investigation, one tool turn. Rollout samples three policy IDs, then the sandbox returns `ERROR`:

| Source | IDs kept under TI/TO | Loss mask |
|---|---|---|
| First prompt encode | `12 40 7` | `0 0 0` |
| Sampled tool call | `101 220 88` | `1 1 1` |
| Observation encode | `7 9` | `0 0` |

The learner's sequence is exactly `12 40 7 101 220 88 7 9`. SkyRL's token-appending gym path preserves this schema. A full-history re-tokenization path can instead drop thinking spans or change IDs despite a matching printed transcript. Current SkyRL also supports step-wise training: record the exact input/output IDs for each turn and train separate sequences, preserving token parity even when context management prevents one strictly appending trajectory. The choice of template alone does not identify which path ran.

A cheap parity check compares the sampler's input and response IDs with the learner's corresponding IDs for each turn, along with their loss masks. Check the conditioning prefix as well, since matching response IDs can hide a changed prefix. Decoded text can hide tokenizer differences. Check weight version and policy-logprob parity separately; matching token IDs leaves those specifications untested.

## Why it matters here

Post-training stacks (SkyRL, slime, Megatron learners) blame MoE routing or GRPO when the run is noisy. A one-token template shift at a tool perimeter looks the same. Record the TI/TO path, tokenizer revision, and template hash in the run manifest, and keep one token-level parity test case next to the loss-mask check.

## Related terms

- [Loss mask](glossary://loss-mask)
- [Chat template](glossary://chat-template)
- [Tokenizer artifact](glossary://tokenizer-artifact)
- [Token](glossary://token)
- [lineage](glossary://provenance)
- [Rollout](glossary://rollout)
