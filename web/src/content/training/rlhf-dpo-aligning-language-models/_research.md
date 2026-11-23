# RLHF and DPO: manual evidence review

Checked September 22, 2026. Editorial context, not rendered content. The previous generated packet contained reversed IPO notation, an unsigned KTO loss, fabricated memory requirements, stale TRL version claims, and unsupported performance/stability guarantees. It has been replaced after an individual bundle review.

## Mechanisms checked

- InstructGPT used terminal response scores with per-token reference charges. A terminal score can reach earlier decisions through returns; token shaping isn't what makes that credit possible. Its reward model was 6B even for a 175B policy, and the value model was initialized from the reward model. Section 3.5: https://arxiv.org/html/2203.02155
- PPO clips a pessimistic surrogate using current/rollout-policy ratios. It removes the sample's incentive beyond the relevant clip threshold, not all probability changes. Policy and value can share parameters. Sections 3 and 5, PDF page 3 visually checked: https://arxiv.org/pdf/1707.06347
- GAE sums discounted TD residuals. Lambda 1 gives sampled return minus baseline; smaller lambda relies more on the value estimate. The finite terminal example sets gamma 1 and bootstrap 0. Equations 16-18, PDF page 5 visually checked: https://arxiv.org/pdf/1506.02438
- DPO reparameterizes rewards using the KL-optimal policy. The prompt normalizer cancels in a same-prompt comparison. This isn't a closed-form optimum of a finite pair dataset or an optimizer convergence guarantee. Sections 3-4: https://arxiv.org/html/2305.18290
- IPO's sampled loss targets 1/(2*tau), not tau/2. A finite squared-loss target doesn't impose a hard margin/parameter bound. Section 5.2, equation 17: https://arxiv.org/html/2310.12036
- KTO has opposite value-function directions for desirable and undesirable labels. Its reference point is detached; the paper's practical mismatched-row KL estimate is biased. Both class weights default to 1 and class balance can change either. Section 4.1-4.2: https://arxiv.org/html/2402.01306
- Original DeepSeekMath outcome GRPO uses group-normalized reward advantages, per-token policy ratios, per-response token averaging, and a KL term in the loss. The R1 report uses response-level notation; the article explicitly identifies the token formulation it teaches. Compiling code alone isn't correctness verification. Section 4.1, equations 3-4: https://arxiv.org/html/2402.03300
- GRPO was used for reasoning reinforcement learning in DeepSeek-R1; this alone does not prove a universal hardware saving or explain every factor behind reasoning improvements: https://arxiv.org/abs/2501.12948
- ORPO joins an SFT objective with an odds-ratio preference term, without a reference. Section 4: https://arxiv.org/html/2403.07691
- SimPO uses scaled average token log-probability and a target margin, without a reference. Its length normalization changes the objective; it doesn't guarantee concise or correct generations. Section 3: https://arxiv.org/html/2405.14734
- Online IPO and IPO-MD differ in how they sample current/reference policies. Fresh comparisons can reduce distribution mismatch but still inherit judge errors. Sections 2-4: https://arxiv.org/html/2403.08635
- DPOP penalizes a drop in chosen-completion likelihood relative to reference. It isn't a guarantee that all generated alternatives improve. Introduction and section 4: https://arxiv.org/html/2402.13228
- Likelihood displacement depends on model geometry and can be benign or harmful. The paper gives unsafe-compliance examples; repetitive loops and hallucinations aren't implied by a growing pair margin. Introduction and sections 2-4: https://arxiv.org/html/2410.08847
- Constitutional AI uses critique/revision for supervised learning and AI harmlessness comparisons for a learned preference model and RL. Human helpfulness labels remain in its hybrid preference data. Abstract and section 1.2: https://arxiv.org/html/2212.08073

## Release source checked

TRL v1.13.0 was published September 10, 2026. Checked release commit: `3d9261f1fec9f9a8140099c78a65c7da73dce79c`. Relevant source functions and options were read; no GPU transformer or policy training was run.

- DPO completion masking, length truncation, summed sigmoid scores, averaged IPO scores, cache construction, constructor arguments, and rejection of reference synchronization with caching. The added transformer setup fragment assumes a full SFT checkpoint and prepared map-style datasets; it is source-checked and unexecuted: https://github.com/huggingface/trl/blob/3d9261f1fec9f9a8140099c78a65c7da73dce79c/trl/trainer/dpo_trainer.py
- DPO configuration and positive beta/IPO regularization notation: https://github.com/huggingface/trl/blob/3d9261f1fec9f9a8140099c78a65c7da73dce79c/trl/trainer/dpo_config.py
- GRPO group/batch scaling, near-zero scale logging, token ratios, KL correction, and loss normalizers: https://github.com/huggingface/trl/blob/3d9261f1fec9f9a8140099c78a65c7da73dce79c/trl/trainer/grpo_trainer.py
- GRPO beta defaults to 0, with no reference model loaded for KL in that configuration: https://github.com/huggingface/trl/blob/3d9261f1fec9f9a8140099c78a65c7da73dce79c/trl/trainer/grpo_config.py
- Current usage guides are moving documentation, not immutable versions: https://huggingface.co/docs/trl/dpo_trainer and https://huggingface.co/docs/trl/grpo_trainer
- OpenRLHF supports colocated hybrid and asynchronous execution. Overlap can introduce stale or mixed-policy trajectories; README recommendations aren't measured universal speedups: https://github.com/OpenRLHF/OpenRLHF

## Scoped examples and modeling limits

- Softmax overflow examples, release metrics, model log-probabilities, intermediate displacement states, and thresholds serve as small analytical checks. Fluency alone does not imply high sequence likelihood.
- The 2,520 GB budget assumes four separate equal 70B backbones, BF16 weights/gradients, two FP32 moments, and FP32 master weights for trainable roles. Decimal state arithmetic excludes caches, activations, temporary tensors, and replication. It isn't measured peak VRAM; removing the assumed critic saves 44.4% of these state bytes.
- The two-response example has an unbounded log-odds margin but forward KL bounded by log(2). Concentration can still eliminate the rejected answer without infinite KL.
- KTO's scalar demonstration holds its reference point fixed and uses equal class weights. It checks label directions, not a full network update.
- The GRPO clipping example contrasts token ratios with a whole-response product. Trainer variants can choose other importance ratios and loss normalizers; they aren't the original equation shown.
- Wilson's interval assumes independent binary judgments on held-out prompts, no ties, and one planned evaluation. Crossing 50% shows neither clear improvement nor clear degradation and doesn't diagnose preamble hacking: https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm

Source scope: relevant passages, equations, and implementation functions were checked. Complete papers, all backends, hardware benchmarks, online policy optimization, and safety certification aren't claimed.
