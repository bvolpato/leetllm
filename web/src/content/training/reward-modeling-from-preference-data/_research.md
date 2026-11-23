# Reward modeling: manual evidence notes

Reviewed September 22, 2026. Full article, metadata, code, questions, original research packet, two illustration sources, and banner source/provenance read individually. These notes record checked claims, not an automatically generated article outline.

## Primary evidence

- InstructGPT, Section 3.5: SFT initialization, K=4 to K=9 ranked completions, correlated comparisons grouped into one batch item, and demonstration-mean score shifting. https://arxiv.org/html/2203.02155
- DPO, Section 4: the analytic optimum belongs to KL-regularized reward maximization. Its reward/policy reparameterization is substituted into the preference likelihood. There is no Bradley-Terry "closed-form optimum" replacing the judge. https://arxiv.org/html/2305.18290
- DeepSeekMath, Sections 4.1.1–4.1.2: PPO uses a value function and GAE; outcome GRPO uses group-relative normalized rewards. https://arxiv.org/html/2402.03300
- TRL 1.13.0 release, published September 10, 2026; tag resolved through GitHub to commit `3d9261f1fec9f9a8140099c78a65c7da73dce79c`. https://github.com/huggingface/trl/releases/tag/v1.13.0
- Pinned RewardTrainer source: model IDs instantiate a one-label sequence classifier; dropout is disabled by default; standard strings and conversational inputs have different preprocessing. Full tokenized candidates are filtered against `max_length`. Loss optionally subtracts a pair margin, then adds coefficient times mean squared chosen-plus-rejected scores. https://github.com/huggingface/trl/blob/3d9261f1fec9f9a8140099c78a65c7da73dce79c/trl/trainer/reward_trainer.py
- Pinned RewardConfig: default `max_length=1024`, `None` disables filtering; centering defaults to disabled. https://github.com/huggingface/trl/blob/3d9261f1fec9f9a8140099c78a65c7da73dce79c/trl/trainer/reward_config.py
- Official TRL guide: preference formats, LoRA score-head saving, and suggested centering coefficient 0.01. This is a starting value, not a guarantee. https://huggingface.co/docs/trl/reward_trainer
- Llama 2, Section 3.2.2 and Appendix A.3.3: rating-dependent margins include zero for the weakest preference category; larger margins can trade off separable versus similar comparisons. https://arxiv.org/html/2307.09288
- Llama 3, reward-modeling section: pretrained-backbone initialization and removal of the margin after diminishing improvements with data scaling. https://arxiv.org/html/2407.21783
- Gao et al.: the gold evaluator is a larger reward model, not direct human satisfaction. Their empirical overoptimization relationships describe their test setup rather than universal trajectories or unbounded proxy scores. https://arxiv.org/html/2210.10760
- Eisenstein et al., Equation 2 and ensemble limitations: squared pair-sum centering; reward ensembles can share exploitable errors. https://arxiv.org/html/2312.09244v3
- Sharma et al.: evidence that preference judgments can favor agreeing with mistaken user beliefs. This does not imply every polite response or apology is sycophantic. https://arxiv.org/html/2310.13548v4
- RewardBench: chat, chat-hard, safety, and reasoning evaluation. https://arxiv.org/html/2403.13787
- RewardBench 2, April 2026 revision: six domains, four-response selection with a 25% random baseline, separate Ties metric, and setup-specific downstream experiments. https://arxiv.org/html/2506.01937v2
- Current official evaluation repository documents V1 and V2 and evaluation of implicit DPO rewards as well as explicit models. No live leaderboard superiority is claimed. https://github.com/allenai/reward-bench
- Lightman et al.: process versus outcome supervision for MATH selection with a fixed generator. The paper does not train that generator using RL or prove a universal advantage in every domain. https://arxiv.org/html/2305.20050
- Tulu 3: executable verifiers replace a learned reward signal for selected tasks; their correctness scope is determined by the check. https://arxiv.org/html/2411.15124
- The original packet's April 2026 citation is a survey proposing the Proxy Compression Hypothesis, not a proven theorem that every scalar reward must fail. The revised article teaches misspecification through concrete examples instead. https://arxiv.org/abs/2604.13602

## Mathematical and teaching corrections

- Causal attention permits the diagonal. Earlier states cannot see later response tokens; final-token pooling is a useful decoder readout, not the only possible reward architecture.
- Pair loss is invariant to prompt-dependent score offsets, not multiplication. Score differences are log-odds under the fixed logistic link. Shared score bias receives zero pair-loss gradient.
- At score difference 1.1, sigmoid is about 0.7503 and negative log-sigmoid about 0.2873. Corrected the diagram's 0.288 rounding.
- A margin is not a loss-saturation threshold: at difference equal to the margin, loss is log 2 and derivative is -0.5.
- The centering implementation permits scores +100 and -100 with zero penalty. It does not bound all scores or calibrate probabilities.
- The balanced two-feature experiment's zero length weight follows from symmetric difference vectors and zero initialization, not L2 alone. The reported weights follow 300 updates, not a convergence proof.
- A length-only scorer can lower the proposed length-margin loss by increasing its length coefficient. Removed the unsupported claim that this prevents verbosity shortcuts.
- Calibration uses candidate A/B order fixed before annotation and targets for both outcomes. Same accuracy can accompany different Brier error. ECE convention, binning, counts, and sampling uncertainty matter.
- Prompt grouping serves an unseen-prompt evaluation goal. A documented new-response/known-prompt evaluation can use another split. Low-agreement labels are not automatically invalid.
- Ensemble disagreement is not guaranteed OOD detection or a calibrated confidence interval. Independent evaluation remains necessary even when scorers agree.
- Removed a duplicate hard-coded readiness gate. The remaining 80% screening threshold is explicitly hypothetical and cannot certify PPO readiness or release.
- Added a pinned TRL training fragment with artifact/template preservation; it is source-checked, not a locally executed transformer training run.

## Validation scope

Marked CPU examples exercise pair validation, grouping, length filters, padding-aware gathering, PyTorch BCE/gradients, stable loss, the two-feature head and reload, margin offsets, centering, calibration, and shortcut audits. Native illustrations and Mermaid are rebuilt deterministically and inspected in both themes, along with the banner. Final results are recorded in the repository review log.

No GPU transformer training, online policy optimization, safety certification, or production deployment is claimed. The feature experiment and screening threshold are controlled worked examples, not measured product performance.
