# Research notes: Light-PEFT's 2024 early-pruning experiment

## Treat this as a reproducibility investigation

Which claims does the ACL 2024 paper actually establish about early structured pruning of frozen backbone dimensions and PEFT modules, and which modern serving, RL, licensing, or frontier-model conclusions would exceed that evidence?

## Paper, pinned academic code, and comparison baselines

- Naibin Gu and collaborators' ACL Findings 2024 paper defines Masked Early Pruning of the Foundation Model, Multi-Granularity Early Pruning of PEFT, authorship, datasets, models, tables, figures, and experimental setup: https://aclanthology.org/2024.findings-acl.447/
- The pinned research repository exposes `scripts/estimate.sh`, `scripts/train.sh`, mask recording, model surgery, bundled dependencies, and the narrow executable NLU path: https://github.com/gccnlp/Light-PEFT/tree/7b10c22026fe6fa283d127353a50d6ed7176a8aa
- The bundled PEFT subtree's license is direct evidence of Apache-2.0 terms for that subtree only: https://github.com/gccnlp/Light-PEFT/blob/7b10c22026fe6fa283d127353a50d6ed7176a8aa/peft/LICENSE
- The original LoRA paper defines frozen base weights plus low-rank trainable updates: https://arxiv.org/abs/2106.09685
- The QLoRA paper supports a separate quantization-plus-adapter comparison; it does not establish that Light-PEFT and QLoRA were jointly evaluated: https://arxiv.org/abs/2305.14314

## Match each quantitative claim to its actual table

- Table 1 uses RoBERTa-Large plus LoRA. Baseline is `0.8M` trainable parameters, `100%` retained foundation, GLUE average `93.3`, and `1x` speed. Light variants report about `0.3M` trainable parameters, `72%` or `67%` retained foundation, scores `92.2` or `91.9`, and speeds `1.4x` or `1.6x`.
- The Table 1 protocol uses one TITAN RTX `24GB`, batch size `32`, and sequence length `128`; the estimation phase belongs in the total comparison.
- Figure 4's RoBERTa-Large result uses an RTX 3090, batch size `32`, sequence length `128`, `67%` retained foundation, and about `0.3M` trainable parameters. Its reported reductions are `32%` model-weight memory, `40%` activation memory, `39%` peak memory, and `2.2x` ten-batch forward/backward speed.
- Table 5 uses OPT-6.7B, batch `96`, and maximum length `100`. Baseline is `12.5G`; a `52%` retained backbone reports `6.5G`. The `1.6x` inference-speed row additionally reduces LoRA modules from `192` to `48` and reports `6.4G` load memory.
- GLUE estimation uses approximately `5%` of steps, SuperGLUE up to `10%`, and QA `10%`; these are dataset-specific paper settings, not mandatory universal pruning fractions.

## Preserve the actual two-phase mechanism

The estimate phase learns or records attention-head masks, feed-forward-coordinate masks, module output-change scores, and rank importance. Physical pruning then slices both sides of compatible tensors and adapter factors before continued fine-tuning. A zero-valued mask without physical surgery does not automatically establish lower FLOPs, activations, or serving latency.

Layer-wise attention pruning, global FFN pruning, module removal, and rank pruning use different score domains. Strict threshold comparisons can change survivor count when scores tie. Retained head and FFN shapes must agree with checkpoints, adapter matrices, compiled kernels, and cache identities.

Equation 11 uses the absolute value of each weight-gradient product before summing rank contributions. The pinned trainer instead averages signed products along each factor's complementary axis before taking absolute values and adding the factor scores. Cancellation makes these rules different. The estimate callback averages the latter half of the score history and multiplies rank scores by the absolute current mask when present.

## Explicit non-claims and license warning

The paper evaluates RoBERTa-Large, OPT-1.3B, OPT-6.7B, LoRA/Adapter, GLUE, SuperGLUE, and QA. It does not establish modern MoE compatibility, GLM-5.2 support, online-RL distribution robustness, QLoRA composition, multi-tenant shared-base serving, distributed TP/PP/EP behavior, or current CUDA-stack compatibility.

The pinned repository root lacks a repository-wide license. Its bundled `peft/` subtree has Apache-2.0 terms; do not call the entire Light-PEFT research repository Apache licensed. Paper authors, commit identities, current contributor ordering, institution affiliations, and model-weight licenses are separate attribution questions.
