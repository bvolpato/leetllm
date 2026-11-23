---
title: Megatron Bridge
aliases: ["Megatron-Bridge"]
importance: 66
kind: code
---
**Megatron Bridge** is NVIDIA's integration layer for converting and configuring models between Hugging Face-style checkpoints and Megatron Core's distributed model representation. It maps parameter names, tensor layouts, architecture settings, and parallel shards across the two formats.

Conversion is model-specific when architectures add custom modules such as MoE routers, MLA projections, DSA indexers, or MTP heads. Source and destination graphs must agree on which tensors exist and how each tensor is partitioned.

## Conversion contract

For supported architectures, import starts from a source configuration and state dictionary, instantiates a matching Megatron model, and transforms tensors for the configured parallel layout. Export reverses supported parameter mappings to produce a Hugging Face-compatible model checkpoint. Check the selected bridge and save API for tokenizer/config handling. Model-weight conversion does not by itself preserve optimizer state, scheduler state, RNG state, or the data cursor needed to resume training exactly. The [official Bridge guide](https://docs.nvidia.com/nemo/megatron-bridge/latest/bridge-guide.html) lists conversion APIs and supported models; checked September 23, 2026.

## Example

If a source configuration contains an MTP module but the destination graph instantiates none, a naive converter sees mismatched key sets. A full round trip must preserve those tensors through an explicitly supported mapping. A base-model-only export may omit auxiliary heads; document and test that variant separately from full checkpoint parity.

## Why it matters here

Checkpoint parity gates protect both rollout loading and MTP experimentation. After import and export, compare key sets, shapes, configs, and reference logits in addition to confirming that files were written.

## Related terms

- [NVIDIA Megatron](glossary://nvidia-megatron)
- [Hugging Face Transformers](glossary://hugging-face-transformers)
- [Model checkpoint](glossary://model-checkpoint)
- [Multi-token prediction](glossary://multi-token-prediction)
- [Tensor parallelism](glossary://tensor-parallelism)
