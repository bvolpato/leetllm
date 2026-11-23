---
title: Small language model
aliases: ["SLM", "small language models"]
importance: 78
---
A **small language model (SLM)** is a language model with relatively few parameters and modest compute requirements compared with larger models in the same setting. It is often selected for a constrained deployment where memory, latency, power, privacy, or cost matters. There is no universal parameter-count boundary that separates small models from large ones. Being small does not itself establish that a model fits a device or meets a workload's quality and runtime requirements.

## Small enough depends on the complete workload

Deployment sizing must account for checkpoint weights, KV-cache state, runtime buffers, tokenizer, application code, and safety headroom; all must fit. An instruction-tuned model that answers one domain-specific question well may still fail because its tool arguments are malformed, its long-context answers are unreliable, or its sustained throughput drops after the device heats up.

Specialization can come from distillation, supervised fine-tuning, retrieval, or carefully limited task scope. A deterministic lookup or classifier remains preferable when generative behavior adds no value.


## Example

An offline inspection handheld needs to answer maintenance-policy questions without sending incident details to a cloud endpoint. The team evaluates a two-billion-parameter model against reviewed policy questions, quantizes it to fit device memory, and checks that cited answers remain correct. It then runs repeated requests for ten minutes while measuring temperature, battery draw, time to first token, and sustained generation speed. Compare general benchmark results alongside thermal behavior and privacy requirements to choose the viable deployment.

## Why it matters here

Edge-deployment and speculative-decoding lessons use small models in different roles. An on-device SLM must answer the product task itself, while a speculative draft model only proposes tokens that a larger target verifies. Choose between these roles using task performance and deployment requirements; parameter count is one input.

## Related terms

- [Quantization](glossary://quantization)
- [Teacher-student distillation](glossary://teacher-student-distillation)
- [KV cache](glossary://kv-cache)
- [Tokens per second](glossary://tokens-per-second)
