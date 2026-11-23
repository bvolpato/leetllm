---
title: safetensors
importance: 72
kind: code
---
**safetensors** is tensor serialization format designed for safe, fast loading without executable pickle payloads. File contains metadata header followed by contiguous tensor byte ranges.

## What it proves

A valid safetensors file verifies that tensor names, dtypes, shapes, and byte ranges can be decoded. Separately validate the destination model graph, sharding, tied weights, tokenizer, and resulting logits.

Large checkpoints commonly use multiple `.safetensors` shards plus index JSON mapping tensor names to files. Check every shard checksum and every expected key before conversion or serving load.

## Format perimeter

An eight-byte little-endian header length precedes the JSON header. Each tensor has dtype, shape, and nonoverlapping byte offsets relative to the payload buffer, not the file start. Loader can memory-map payload and fetch slices without deserializing Python objects. Optional `__metadata__` is a string-to-string map. Quantization scales or optimizer tensors can also be stored as tensors; the format does not define their model-level meaning. Architecture config, tokenizer, tied-weight rules, distributed ownership, and lineage need an external schema. Parsing checks the header and tensor ranges; verify file authenticity separately and scan tensor values for NaN/Inf.


## Example

Loader reads `model.safetensors.index.json`, finds shard for router tensor, verifies dtype and shape, then maps bytes without executing checkpoint code.

## Why it matters here

Large MoE checkpoints such as GLM-5.3 span many shards. Conversion must verify complete key coverage, MTP tensors, expert ownership, and checksums across shards. Then validate that the chosen BF16 or FP8 artifact is complete and that the target engine supports its architecture.

## Related terms

- [Model checkpoint](glossary://model-checkpoint)
- [Megatron Bridge](glossary://megatron-bridge)
- [Hugging Face Transformers](glossary://hugging-face-transformers)
- [Tensor](glossary://tensor)
