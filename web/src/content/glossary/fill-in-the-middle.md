---
title: Fill-in-the-middle
aliases: ["FIM", "fill in the middle"]
importance: 78
---

Fill-in-the-middle (FIM) conditions a code model on both text before the cursor and text after it, then generates the missing span between those two contexts. Ordinary left-to-right completion sees only a prefix. FIM also receives the suffix, so the proposed code can respect a closing bracket, existing return statement, surrounding indentation, or later variable use instead of blindly appending a plausible continuation.

## Prefix, suffix, and insertion schema

A model-specific prompt places special perimeter tokens around the prefix and suffix. One common arrangement is prefix, suffix, then a marker where the missing middle should be generated. The precise control tokens and ordering belong to the model's tokenizer and chat or completion format; copying another model's markers can silently turn structural context into ordinary text.

FIM does not require bidirectional decoding of the missing span. A causal model can still generate its tokens left to right because the suffix has been serialized into its earlier prompt context. Training on such reordered examples teaches the insertion task; perimeter markers alone do not confer FIM capability on an arbitrary checkpoint.


The generated span must be attached to the same document version and cursor snapshot used to build the request. If the editor changed while the model was decoding, the result should be rebased safely or discarded. Validate the result for compilation, authorization, and semantic correctness.

## Example

An editor contains `def normalize(value):` above the cursor and `return value.strip().lower()` below it. The missing middle must handle a null input without duplicating the existing return. A FIM-capable model can propose `if value is None: return ""` because it sees both partitions. A prefix-only request may generate its own full return statement, creating unreachable or duplicated code after insertion.

## Why it matters here

The code-completion capstone separates local semantic suggestions from remote generation. FIM explains when suffix-aware model inference is worth its latency, why prompt formatting must match the served checkpoint, and which document-version invariants protect the editor. Measure accepted insertions and compilation or test outcomes; local plausibility alone can overstate completion quality.

## Related terms

- [Tokenization](glossary://tokenization)
- [Prefix cache](glossary://prefix-cache)
- [Context window](glossary://context-window)
- [Speculative decoding](glossary://speculative-decoding)
