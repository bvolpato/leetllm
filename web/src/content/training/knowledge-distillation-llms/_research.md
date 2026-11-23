# Knowledge distillation: manual evidence review

Checked September 22, 2026. Editorial notes, not rendered content. Replaces a generated packet with an incorrect 3D batchmean comment, unshifted/unmasked soft targets, an invented 10:1-to-20:1 compression wall, a universal T>5 warning, and unsupported reverse-KL safety claims.

## Temperature and transfer channels

- Hinton et al. sections 2 and 2.1 derive the approximate high-temperature 1/T² gradient scale and motivate multiplying soft loss by T² when combining it with hard labels. This is a limiting approximation, not a finite-temperature identity or the only valid weighting. Centered logit matching is the limiting quadratic objective: https://arxiv.org/html/1503.02531
- Hard-label cross-entropy has gradient p-y, so incorrect classes can receive nonzero gradients. The missing information is the teacher's relative alternative probabilities. Soft matching also depends on student probabilities and vanishes at exact agreement.
- Direct token KD needs matching output meanings and aligned prefixes/positions, or an explicit cross-tokenizer method. Text targets can be retokenized independently. Hidden-state matching additionally needs selected layers, positions, masks, and a projection/reduction contract.
- Gemma 2 sections 3.2, 4, and 5 describe token-distribution pretraining, synthetic responses, and distillation on the student's distribution. Table 6 reports a 2B/500B-token ablation: 60.3 from scratch versus 67.7 distilled from a 7B teacher. It doesn't establish a universal compression ceiling or cost ranking: https://arxiv.org/html/2408.00118

## Divergence and prefix collection

- GKD section 3 separates divergence from student-generated data fraction and stops gradient through the sampling distribution. Section 4.2 finds generalized JSD useful in translation; the headline on-policy GSM8K comparison uses forward KL. The original paper explicitly calls the optimal divergence task-dependent: https://arxiv.org/html/2306.13649
- MiniLLM section 2 uses sequence-level reverse KL and teacher/student log-probability ratios with future-token credit. Single-step decomposition, teacher-mixed sampling, and length normalization matter. Section 3.4 observes degraded repeated/meaningless outputs despite decreasing reverse KL in ablations: https://arxiv.org/html/2306.08543
- Dropping one equally weighted teacher mode leaves total reverse KL ln(2), not zero. Support boundaries require fixed positive numerator mass. A high-probability teacher error can be copied perfectly with zero divergence. These mathematical counterexamples don't diagnose any actual model.
- Complete-sequence KL decomposes into token divergences under prefixes from its left distribution. Fixed-prefix token training and stop-gradient on-policy updates need their own objective descriptions; swapping KL arguments doesn't implement MiniLLM.
- Current TRL documents a DistillationTrainer with chunked full-vocabulary loss on student completions and tool-result masking. The older guide uses experimental.gkd and separate lmbda/beta controls. Neither trainer was executed: https://huggingface.co/docs/trl/distillation_trainer and https://huggingface.co/docs/trl/gkd_trainer

## Historical response/data examples

- Alpaca adapts earlier Self-Instruct techniques, generates 52K responses with text-davinci-003, and declares research-only/non-commercial dataset and weight-difference use. Its code license isn't the dataset license: https://github.com/tatsu-lab/stanford_alpaca
- Orca progressively trains on ChatGPT and GPT-4 explanation data. The full-versus-GPT-4-only comparison also changes data volume, so it isn't an isolated rationale-quality intervention: https://arxiv.org/html/2306.02707
- phi-1.5 section 2 mixes generated textbook-like data with earlier filtered-code data and trains from random initialization. It isn't response SFT or a clean probability-matching experiment: https://arxiv.org/html/2309.05463
- Distilling Step-by-Step section 3 trains separate label and rationale targets with task prefixes. A teacher rationale isn't required at inference in that setup: https://arxiv.org/html/2305.02301
- Original R1 v1 sections 2.3-2.4 and Table 5 describe approximately 600k reasoning plus 200k general samples, some model-judged. The 32B student reports AIME 72.6/MATH-500 94.3 at stated sampling settings and output cap. These aren't current rankings or verified proof-quality results: https://arxiv.org/html/2501.12948v1

## Implementation and authored evidence

- PyTorch KL expects log-probability input and sums/divides by dim 0 for batchmean. A 3D sequence batchmean isn't a token mean. Select valid targets explicitly because KL has no class-ID ignore-index parameter: https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.kl_div.html and https://docs.pytorch.org/docs/2.14/generated/torch.nn.KLDivLoss.html
- Cross-entropy ignores class-ID labels designated by ignore_index. Response-only prompt masking is a recipe choice; pretraining can intentionally supervise prompt tokens. Loss masking isn't attention masking: https://docs.pytorch.org/docs/2.14/generated/torch.nn.CrossEntropyLoss.html
- AdamW can update a parameter with a zero-valued gradient tensor through weight decay; grad=None is skipped. No-target batches must not accidentally invoke a meaningful optimizer step: https://docs.pytorch.org/docs/2.14/generated/torch.optim.AdamW.html
- CPU exercises use authored class distributions, a randomly initialized positionwise teacher/student, and fake text-generation/lookup rules. They don't run transformers, APIs, GKD/MiniLLM, distributed accumulation, or a serving benchmark.
- Cache estimates omit format overhead. Renormalizing top-k probabilities can hide incorrect student tail mass; an approximation needs an explicit normalization/tail contract.

Source scope: relevant methods, equations, ablations, README restrictions, and current guide/API semantics were read. Complete papers and every optional backend aren't claimed. No GPU training, model benchmark reproduction, or deployment was performed.
