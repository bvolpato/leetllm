---
query: "Continued pretraining for domain shift: causal supervision, adaptation schedules, replay, tokenizer changes, and evaluation"
model: "manual primary-source review"
status: "completed"
verified_at: "2026-09-22"
---

## Corrections to the previous generated packet

The previous packet claimed that every assertion was verified, then prescribed universal learning-rate multipliers, replay fractions, corpus sizes, and GPU-hour ranges. Those claims weren't established by its cited sources. It also confused omitted prompt-target losses with zero prompt gradients and treated LIMA's hypothesis as a proof that SFT cannot learn knowledge. The revised article replaces those claims with scoped evidence and executable counterexamples.

## Objective and supervision

- LIMA studies a pretrained 65B LLaMA model fine-tuned on 1,000 curated examples. Its superficial-alignment claim is a hypothesis supported in that setting, not a prohibition on knowledge acquisition through SFT: https://arxiv.org/html/2305.11206
- TRL supports assistant-only, completion-only, and full-sequence losses. Mask selection depends on dataset format and configuration; assistant masking also requires the appropriate chat-template generation markers: https://huggingface.co/docs/trl/sft_trainer
- Ignored prompt targets remove direct loss terms. Response loss still differentiates through its causal context. The article's cumulative-sum toy verifies nonzero gradients for both prompt rows; it isn't a transformer or an empirical comparison of CPT and SFT: https://docs.pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html
- Count scored targets after shifting and masking. Without BOS or preceding context, a seven-token block ordinarily has six next-token targets, not seven. Tokenization and context protocol affect perplexity: https://huggingface.co/docs/transformers/perplexity
- Gururangan's DAPT/TAPT evidence is from masked-language-model adaptation with RoBERTa and downstream classification tasks. The scope distinction is useful for causal models, but its numerical gains don't automatically transfer: https://aclanthology.org/2020.acl-main.740/
- Ovadia compares retrieval and unsupervised fine-tuning for particular knowledge-injection tasks. Use it as a comparative baseline, not evidence that either method universally succeeds: https://aclanthology.org/2024.emnlp-main.15/

## Vocabulary extension

- Code Llama keeps the Llama/Llama 2 tokenizer, adding four special tokens for its infilling variants. It is a historical example, not evidence for a 5B–10B-token vocabulary-change threshold: https://arxiv.org/html/2308.12950
- Vocabulary initialization studies compare alternatives. Averaging old rows yields a candidate initialization, not unchanged output probabilities or universally bounded gradients. Untied input/output matrices need separate treatment: https://arxiv.org/html/2407.05841
- The August 2026 Hindi study compares initialization, norm calibration, and input/output asymmetry in Nemotron-3-Nano-30B-A3B. Scope its findings to that model and language; don't generalize its best configuration to every enterprise corpus: https://arxiv.org/html/2608.03494
- Transformers exposes vocabulary resizing with mean/covariance-based initialization and weight tying. That differs from manually averaging a token's constituent subwords. Reducing distribution change doesn't eliminate the added softmax mass: https://huggingface.co/docs/transformers/main_classes/model#transformers.PreTrainedModel.resize_token_embeddings

## Schedule and replay evidence

- Ibrahim's 405M-model schedule sweep tests 0.5x, 1x, and 2x the original peak. Replay selections differ between its weak and stronger shifts. It doesn't establish the previous packet's universal 0.1x peak, mandatory short warmup, or 10%–30% replay rules: https://arxiv.org/html/2403.08763
- The article's 1,000-step schedule uses an authored 5% warmup and declared endpoints. It isn't the cited study's recipe. AdamW's bias correction also means zero initial moments don't by themselves imply an exploding first update: https://docs.pytorch.org/docs/stable/generated/torch.optim.AdamW.html
- Define replay fractions in processed and scored-token units. Equal-sized blocks only have equal target counts when their masks agree. A fixed budget replaces domain exposure with replay; adding replay on top changes compute: https://arxiv.org/html/2403.08763
- Llama 3 describes a code expert built by continuing a pretraining branch, then applying code-focused post-training and using it for annotations and synthetic examples. This isn't a universal general-replay prescription: https://arxiv.org/html/2407.21783
- BloombergGPT was trained from scratch on a declared financial/public mixture. Its 51.27%/48.73% inventory composition isn't a CPT replay ratio or a guarantee about actual token exposure before early stopping: https://arxiv.org/html/2303.17564

## Evaluation and selection

- Sum NLL and scored-token counts before computing corpus PPL. Averaging document PPLs is a different metric. For tokenizer comparisons, control scored text and boundaries; bits per byte divides nats by byte count and ln(2): https://huggingface.co/docs/transformers/perplexity
- The four-checkpoint scorecard is authored synthetic data. Its 1.5-PPL budget is a declared example, not a safety standard. It gates general-text regression and ranks by probe accuracy, then domain PPL. That is lexicographic selection, not a unique Pareto-frontier optimum.
- Task checks, uncertainty, patience, general retention, and the final post-training recipe determine stopping and promotion. Raw-text PPL isn't a logical prerequisite for better task accuracy or a complete safety check.
- Exact continuation needs optimizer/scheduler state, RNG state, and loader position in addition to weights. Save tokenizer/config and the corpus/evaluation manifest as part of artifact identity: https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html

## Executable scope

The article's marked cells are CPU teaching fixtures, including a causal prompt-gradient counterexample, an output-support counterexample, and a byte-unit ranking reversal. Torch fixtures pin 2.13.0; validation uses Python 3.12. No real domain LLM is trained, no GPU-hour estimate is measured, and no production forgetting guarantee is inferred from the toy shared logit or synthetic checkpoints.
