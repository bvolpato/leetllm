---
title: Contextual representation
importance: 87
---

A contextual representation is a vector that depends on both a token's identity and the surrounding sequence. A static embedding table assigns one starting vector to each token ID. Subsequent contextual layers mix information from neighboring tokens, producing occurrence-specific hidden states that can distinguish different uses of the same token.

## Same starting row, different final states

If token ID 407 maps to embedding row $E[407]$, every occurrence begins from that same stored row under the same embedding table. Contextual processing then combines the token with positional information and surrounding hidden states. A bidirectional encoder can draw information from both sides of a token, while a causal decoder restricts each position to earlier permitted context. The architecture determines which neighboring words are visible.


## Example

The token `charge` appears in `dispute the charge` and `charge the scanner`. If both uses share the same token ID, they begin with the same static embedding. The billing occurrence receives contextual signals from `dispute`, while the device occurrence receives signals from `scanner` when the architecture can attend to that word. Their later hidden states can therefore differ even though the initial lookup row is identical. The vectors don't receive explicit dictionary sense labels; task training shapes the contextual distinctions.

## Why it matters here

Contextual representations connect tokenizer IDs to sentence meaning, retrieval embeddings, self-attention, and transformer hidden states. Understanding the difference between a reusable lookup row and an occurrence-specific state prevents readers from confusing vocabulary identity with context-dependent interpretation.

## Related terms

- [Embedding](glossary://embedding)
- [Self-attention](glossary://self-attention)
- [Transformer layer](glossary://transformer-layer)
