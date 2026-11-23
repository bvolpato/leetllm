# Constitutional AI and red teaming: manual evidence review

Checked September 22, 2026. Editorial context, not rendered content. Replaces generated notes that overstated human-labeler evasiveness, AI-judge consistency, safety guarantees, labeling costs, and an unrelated text-to-image attack analogy.

## Original training mechanism

- CAI first preprint was December 2022. The drafting model was a helpful-only RLHF assistant; a pretrained model was fine-tuned on revisions and helpfulness samples. The paper used revisions from all revision steps, whereas the lesson's simplified trace selects one. Sections 1.4 and 3.1-3.2: https://arxiv.org/html/2212.08073
- Critiques guide revision generation and needn't be policy targets. Excluding them from a direct-answer target doesn't prohibit retaining audit records or using runtime revision. There is no fixed fourfold latency multiplier. Sections 3.1 and 3.5: https://arxiv.org/html/2212.08073
- The original preference model mixed AI harmlessness comparisons with human helpfulness labels. Multiple-choice label likelihoods became normalized soft targets. Chain-of-thought labels could be overconfident; one variant clamped probabilities to 40-60%. Softness isn't proof of calibration. Sections 4.1-4.2: https://arxiv.org/html/2212.08073
- Swapped-order scoring and averaging preference distributions are described in Lee et al. section 2.1.1. Remap the second presentation to response identity before averaging. Mitigation isn't guaranteed bias cancellation: https://arxiv.org/html/2309.00267
- Lee et al.'s summarization rates are 71/73/50% unadjusted, versus 59/61/47% after their post-hoc length correction. Their historical over-tenfold labeling-cost estimate excludes setup and annotator-training costs. It doesn't establish current pricing or an hours-versus-weeks end-to-end schedule. Table 1 and appendices J/L: https://arxiv.org/html/2309.00267
- RLAIF is broader than original CAI. Lee et al. also study direct AI rewards without a learned reward model. DPO on AI comparisons is a later preference-training alternative, not the original CAI reward-model/RL pipeline: https://arxiv.org/html/2309.00267 and https://arxiv.org/html/2305.18290
- Collective CAI demonstrates a public-input process with a specified U.S. sample. It doesn't establish universal representation or exact constitutional adherence. Introduction and limitations: https://arxiv.org/html/2406.07814

## Current practice, with dates

- Anthropic's announcement page is dated January 22, 2026. The new constitution explains values and reasons and is used for several synthetic-data types; Anthropic acknowledges outputs may not adhere. This broadens the original standalone-principle recipe: https://www.anthropic.com/news/claude-new-constitution
- May 8, 2026 research studies synthetic constitutional documents, advice examples, and tool-equipped RL environments. Its reported generalization belongs to tested models and evaluations. Intro, methods, and constitutional SDF passages checked; no numerical outcome is copied into the lesson: https://alignment.anthropic.com/2026/teaching-claude-why/
- January 9, 2026 Constitutional Classifiers++ uses an activation probe and escalation to a stronger conversation-aware classifier. This is an inference safeguard, distinct from CAI policy training. No universal-jailbreak discovery is not proof of impossibility: https://www.anthropic.com/research/next-generation-constitutional-classifiers
- Llama Guard 4 12B classifies text/image prompts and responses against its hazard taxonomy. The card acknowledges data/coverage limits and vulnerability to adversarial attacks or prompt injection. Content labels don't decide incident-record entitlements: https://huggingface.co/meta-llama/Llama-Guard-4-12B

## Attack and evaluation scope

- Perez et al. investigate LM-generated tests and diversity/success tradeoffs, not exhaustive coverage or a universal penalty recipe: https://arxiv.org/html/2202.03286
- GCG differentiates a continuous one-hot token representation, proposes top negative-gradient substitutions, and evaluates exact candidate losses. An affirmative-prefix surrogate doesn't establish a policy violation; transfer from accessible models isn't guaranteed. Section 2.2: https://arxiv.org/html/2307.15043
- Crescendo supplies an adaptive multi-turn example and discusses judge errors, secondary review, and manual inspection. The lesson's fixed synthetic plan is not Crescendomation or an adaptive attack: https://arxiv.org/html/2404.01833
- Indirect prompt injection crosses a trust boundary through retrieved/external text and can affect tool actions, not just final text. Relevant application/examples passages checked: https://arxiv.org/html/2302.12173

## Authored exercises and boundaries

- Incident IDs, four principles, swapped probabilities, safety labels, judge probabilities, and thresholds are synthetic. No target model, semantic judge, confidential incident service, or live attack was called.
- Eight marked CPU fixtures check probability remapping, a scalar soft-label update, JSON parsing, lineage grouping, denominator/coverage arithmetic, judge errors/abstention, and fixed-plan transcript handling. The latter judge recognizes a literal fixture marker; it isn't a semantic safety evaluator.
- Missing-label bounds describe possible rates on the attempted sample assuming known labels are correct. They aren't sampling confidence intervals or a guarantee about future attacks. Target failures and evaluator failures are distinct.
- Two roleplay violations out of two don't establish a future 100% rate. Zero out of two doesn't establish robustness. Attack budgets, sample selection, and cohort sizes belong in reports.
- False refusal is one utility failure, not the whole alignment tax or evidence of its cause. A comparable baseline and control of other changes are needed for attribution.
- Known failure cases remain useful regression tests after development exposure; fresh lineages answer a different generalization question. Repairs may belong in application authorization, prompts, retrieval, model training, or evaluator logic.

Source scope: relevant passages, equations, model-card sections, and research-report methods were checked. Complete papers, every implementation/backend, transformer training, real model attacks, deployment, and safety certification aren't claimed.
