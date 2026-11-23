---
query: "SFT target construction, packing boundaries, update budgets, optimizer continuation, and validation selection"
model: "manual primary-source review"
status: "completed"
verified_at: "2026-09-22"
---

## Scope corrections

The prior packet used obsolete collator/packing APIs, overstated memory and compute savings, treated prompt masking as universal, and required adapter merging. It also confused ignored direct targets with detached prompt representations. The article's access policy, losses, selection rates, and scalar fixtures are authored lab data. No LLM training or GPU speed result is demonstrated.

## Objectives and formatting

- LoRA is agnostic to training objective; memory savings depend on the configuration: https://arxiv.org/html/2106.09685
- QLoRA separates quantized storage from dequantized computation and trains adapter weights: https://arxiv.org/html/2305.14314
- Use the actual checkpoint template; ordinary text and special IDs can both participate in role formatting: https://huggingface.co/docs/transformers/main/en/chat_templating_writing
- Training complete conversations and beginning a new reply use different formatting settings. Avoid duplicated special tokens: https://huggingface.co/docs/transformers/chat_templating
- Prompt-loss weighting has scoped experimental effects, not a universal masking or stability rule. Methods and limitations were checked in the EMNLP 2024 version: https://arxiv.org/html/2401.13586v4

## Current trainer mechanisms

- Current TRL dataset formats, assistant masks, completion-only defaults, chunked NLL, and precision defaults were checked: https://huggingface.co/docs/trl/sft_trainer
- Pinned source filters fully masked examples after nonpacked truncation. Padding-free collation masks segment-start labels; both BFD variants enable padding-free mode. Unsupported attention paths trigger warnings rather than proving failure or correctness: https://github.com/huggingface/trl/blob/5bb945c38f319259eddaad7bb3838e4aaf590c49/trl/trainer/sft_trainer.py
- BFD truncates overflow, BFD split chunks it, and wrapped packing forms a token stream. Token retention isn't preserved original context: https://github.com/huggingface/trl/blob/5bb945c38f319259eddaad7bb3838e4aaf590c49/trl/data_utils.py
- Padding-slot fractions aren't measured GPU compute fractions: https://huggingface.co/docs/trl/reducing_memory_usage

## Updates, checkpoints, and export

- InstructGPT's standalone SFT baseline used 16 epochs and no warmup, with searched learning rates. That contradicts mandatory warmup and fixed epoch ceilings, not a reason to copy its recipe: https://arxiv.org/html/2203.02155
- Cosine schedules can decay to zero or a configured nonzero floor: https://huggingface.co/docs/transformers/main_classes/optimizer_schedules
- AdamW updates moments and applies bias correction before stepping. A reset doesn't divide a nonzero gradient by epsilon alone: https://docs.pytorch.org/docs/2.14/generated/torch.optim.AdamW.html
- Checkpoint manifests list artifacts; verify contents and the next update, not just keys. The article separately runs actual AdamW and simpler SGD-momentum fixtures: https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html
- torchtune distinguishes intermediate recipe state from serving exports and describes original-base plus adapter continuation: https://meta-pytorch.org/torchtune/stable/deep_dives/checkpointer.html
- Distributed resharding needs a compatible checkpoint path and target topology; it isn't arbitrary architecture conversion: https://www.deepspeed.ai/tutorials/universal-checkpointing/
- LoRA merging is an export option, not mandatory. Serving separate adapters and a pinned base is supported: https://huggingface.co/docs/peft/package_reference/lora

## Local evidence boundaries

The marked CPU examples check row fields, thread-disjoint splits, shifted target loss, metric denominators, truncation, abstract attention reachability, item/token arithmetic, manifest keys, optimizer continuation, and an authored lexicographic selector. The TRL fragment is an unexecuted blueprint. It doesn't load a model, execute packing kernels, calibrate a grader, run distributed training, or establish a production release threshold. Final-test results and measured GPU savings aren't claimed.
