---
query: "Synthetic post-training data: generation, evidence, admission policy, recursive training, and artifact identity"
model: "manual primary-source review"
status: "completed"
verified_at: "2026-09-22"
---

## Corrected scope

The prior generated packet relied largely on vendor blogs, then promoted arbitrary seed counts, audit fractions, agreement targets, duplicate rates, and human-data percentages into requirements. It also confused exact shingle overlap with MinHash and treated hashes as guarantees. The revised article distinguishes historical recipes, local fixtures, proposed production mechanisms, and demonstrated model outcomes.

## Data availability and recursive training

- Epoch's June 2024 revision forecasts dataset sizes near the public-human-text stock between 2026 and 2032 under continued trends. Text isn't permanently consumed when read: https://arxiv.org/abs/2211.04325v2
- Epoch's September 2025 assessment treats the possible data bottleneck as surmountable, with synthetic data among the options. This isn't proof of unlimited useful data: https://epoch.ai/publications/what-will-ai-look-like-in-2030
- Shumailov demonstrates tail loss and degeneration in mathematical settings and experiments. Don't turn those conditions into a claim that every synthetic mixture necessarily collapses: https://www.nature.com/articles/s41586-024-07566-y
- Gerstgrasser studies accumulating real and synthetic data. Its bounded-error analysis is idealized linear regression, and its experiments support accumulation in the tested settings. Neither external verification nor a universal 10% real-data floor is established: https://arxiv.org/html/2404.01413

## Historical generation methods

- Self-Instruct starts with 175 reviewed tasks and reports 52,445 generated instructions. Its recipe uses eight instruction demonstrations, classification/non-classification identification, input-first/output-first instance generation, and ROUGE-L filtering. Classification identification isn't a test for whether extra input text is needed: https://arxiv.org/html/2212.10560
- WizardLM lists five in-depth operations and one in-breadth operation. Its historical eliminator includes heuristics that shouldn't be blindly reused for safety refusals. The lesson's lambdas schedule authored variations; they don't run Evol-Instruct: https://arxiv.org/html/2304.12244
- Phi-1 reports filtered code-language data, synthetic textbooks, exercise fine-tuning, and historical benchmark results. It doesn't isolate execution filtering as the cause of the gain: https://arxiv.org/html/2306.11644
- Llama 3's coding pipeline uses static checks and generated tests; the generator may revise the solution or the tests. The report explicitly doesn't ensure complete correctness. Passing configured checks isn't independent trusted-test evidence: https://arxiv.org/html/2407.21783
- Orca reports learning from explanation traces in its task comparisons. Observable explanation text doesn't prove faithful internal reasoning or a universal reasoning speedup: https://arxiv.org/html/2306.02707

## Judges, safety, and preference roles

- Zheng documents position and verbosity effects and discusses possible self-enhancement without establishing it conclusively. Swapped-order consistency is a conservative win policy, not a correctness certificate: https://arxiv.org/html/2306.05685
- Audit coverage, false admissions, false rejections, abstentions, and uncertainty matter. The article's 98%-agreement fixture admits both unacceptable rows; it isn't a real judge-calibration study: https://arxiv.org/html/2306.05685
- Perez demonstrates model-generated red-team tests: https://arxiv.org/html/2202.03286
- Constitutional AI trains on revised responses to harmfulness prompts. Approved safe answers to adversarial prompts can be SFT targets; harmful rejected answers aren't desired demonstrations: https://arxiv.org/html/2212.08073
- Preference labels need an actual quality comparison. A revised teacher answer isn't automatically better, and the local code gate is a trusted string-based toy, not a production token validator: https://arxiv.org/abs/2305.18290

## Current framework and artifact limits

- NeMo Data Designer's September 15, 2026 preprint describes declarative columns, samplers, dependency-aware generation, validation, preview, and provenance. Relevant architecture and validation sections were checked: https://arxiv.org/html/2609.17699
- The official implementation links current documentation and examples. The article doesn't claim an executed framework run or calibrated production pipeline: https://github.com/NVIDIA-NeMo/DataDesigner
- SHA-256 identifies bytes relative to a reference digest. Protect the approved reference separately; rewriting both payload and manifest can preserve self-consistency: https://docs.python.org/3/library/hashlib.html

## Local executable scope

The marked Python 3.12 fixtures test candidate fields, authored rewrite scheduling, vote remapping, exact normalized five-word sets, invented two-dimensional vectors, a three-field JSON verifier, a toy string-function contract, retained IDs, and shard read-back. Final decision receipts don't contain full stage evidence. No model API, real embedding model, calibrated judge, training run, measured latency, or production dollar cost is demonstrated.
