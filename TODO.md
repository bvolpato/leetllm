# LeetLLM Content, Prompt, and Visual Overhaul TODO

This document tracks teaching improvements and their delivery across the website, book, and videos. Earlier cleanup passes removed mechanical defects across the corpus. The November 16 review found weak explanations in lessons that passed those checks, so the historical completion counts below describe that cleanup only.

## Current teaching repair

The first priority is a lesson that a reader can reconstruct: a clear question, a worked mechanism, code that computes the claimed result, a useful visual, and an unfamiliar problem the reader can solve. Analogies, imaginative examples, and patient derivations are welcome. Keep technical limits where they change the reasoning.

The November 16 website release deployed source commit `c45d2bd7647a` as Cloud Run revision `leetllm-01690-wey`. The public reader matches the local production build across all ten changed lessons. Both themes, five inline films, captions, seeking, media range requests and mobile layouts pass browser inspection. The full web suite, lint, type checking, production build, 1,981 marked Python examples, practice solutions and Linux iOS content export pass. Candidate and live content/authentication/tutor checks pass. The strict Concept Atlas check still has the inherited review debt described below.

| Priority | Bundle or shared surface | Repair | Delivery |
|---|---|---|---|
| 1 | Authoring rules, tutor prompts, book openings | Remove prose quotas and compulsory framing; encourage complete explanations and useful analogies | Committed; tutor prompts live and revised curated book published |
| 1 | Neural Networks from Scratch | Carry four XOR points through hidden features, forward pass, gradients, training, and a transforming geometry animation | Complete bundle reviewed and live; code, both themes, animation and native browser player verified |
| 1 | First AI App | Reach a usable classifier through model, API, and browser stages; develop persistence and streaming afterward | Complete bundle and executable examples reviewed and live |
| 1 | Reinforcement Learning | Keep one cliff grid through return, value iteration, sampled learning, and policy gradients; replace the mismatched video story | Article and inline film live; complete 25:35 movie passes independent encoded review; Mac playback and full human watch remain |
| 1 | Prompt Engineering | Replace handwritten answer rules with actual captured model responses, explicit task definitions, and reproducible evaluation | Complete bundle and executable examples reviewed and live |
| 1 | ReAct and Plan-Execute | Teach tool choice through actual numerical debugging, tool execution, and model decisions | Article, recorded tool run, reader edition and inline film reviewed and published |
| 2 | Logistic Regression and Tree Ensembles | Develop the classifier before calibration and extensions; repair examples and the handoff into RL | Both complete bundles, quizzes, executable examples, figures and inline films reviewed and live |
| 1 | Vizmatic 0.8.3 | Add seekable Stage films, captions, themed static fallbacks, and verified media delivery | Version and player committed; 1,141 illustration entries current; both themes, seeking, captions, mobile fallbacks and shared iOS export verified |
| 2 | VAE, vision and production ML capstones | Repair reproducibility, measured chart data, parcel-level threshold selection, and descriptions of computed results | Executable examples and affected figures reviewed and live |
| 2 | PDF handbook | Rebuild the selected reader edition after content settles; inspect changed chapters, navigation, and print figures; verify published bytes | Published 738-page curated edition on November 16; public bytes match reviewed SHA256 b5131b2b3f5e53813740165ee85623a7b331804e9fe4e2ae521afcc670c92481; full/reference editions unchanged |

### Delivery sequence

1. Finish and independently review each bundle above, including its quiz and both rendered themes. Run the examples and check the neighboring lessons.
2. Validate the shared player, image delivery, book renderer, and full web application. Commit reviewed changes, push, deploy, and check the live reader.
3. Rebuild and inspect the PDF, then publish and verify the downloadable artifact. Article changes alone do not update the public book.
4. Bring each affected narration and film into agreement with its article. Render and inspect every scene, then obtain the required full-speed human watch with sound before replacing a published recording.
5. Continue through the remaining visible curriculum in prerequisite order, then specialist lessons, blogs, practice, and glossary links. Audit one complete bundle at a time. Prioritize broken explanations, fabricated experiments, and mismatched visuals over wording polish.

For each bundle, distinguish source review, executable checks, rendered inspection, and public delivery. A passing linter or a historical review does not close the teaching work. Corpus completion requires a current complete-bundle review for every item.

### Next complete-bundle reviews

- **GPT to Modern LLMs:** replace handwritten prompt-independent logits and invented lost-in-the-middle curves with a genuine small model computation or a recorded experiment. Preserve the useful model history, training and generation mechanisms. Align the article, four figures, quiz, reader passage and narrated example.
- **Narrated replacements:** Neural Networks, First AI App, Prompt Engineering, ReAct, Logistic Regression and Trees still need new recordings after their article repairs. The complete RL replacement has movie SHA256 `9fd59e6fb8088d9b534b112e8f767667ef545228857b3826c55230a5c504ca5a`, with independent quality/curation scores of 94/92 and no open correctness, layout or synchronization findings. It awaits native Mac playback and a complete human watch with sound. Exact old movie hashes are withheld from the reader to prevent mismatched lessons.
- **Concept Atlas review debt:** the baseline had 355 stale reviewed-source hashes among 1,026 sources. The seven complete-bundle reviews above resolve seven, leaving 348 inherited stale records. The strict Atlas check remains blocked by this existing debt. Re-review actual concept support before renewing each record; preserve historical movie reviews.

## 1. Historical cleanup on `main`

### Wave 1: Standards, prompts, workflows, and automated checks
- [x] Rewrote editorial, visual, and book guidelines across `AGENTS.md`, `AGENTS_TESTING.md`, `COURSE_CORE.md`, `CONTENT_GUIDELINES.md`, `ILLUSTRATION_GUIDELINES.md`, `BOOK.md`, `docs/illustration-framework.md`, and `docs/book-voice.md`.
- [x] Updated authoring and review workflows in `.agent/skills/leetllm-review-content/SKILL.md`, `.agent/prompts/review-content.md`, `.agent/workflows/review-illustrations.md`, `videos/TEACHING_STANDARD.md`, `videos/AUTHORING.md`, `videos/EDITOR_PROMPT.md`, and `videos/REVIEWER_PROMPT.md`.
- [x] Updated runtime AI tutor and personalization system prompts in `web/src/lib/leety.ts` and `web/src/lib/gemini-personalization.ts` to teach directly without filler, bureaucratic dialect, or em dashes.
- [x] Added deterministic quality gates:
  - `scripts/audit-content-quality.py` (tested in `scripts/tests/test_audit_content_quality.py`)
  - `scripts/validate-illustration-density.py` (tested in `scripts/tests/test_validate_illustration_density.py` and `web/tools/illustrations/semantic.test.ts`)

### Wave 2: Recorded mechanical cleanup

| Section | Bundles in the earlier pass |
|---|---:|
| `fundamentals` | 42 |
| `blog` | 23 |
| `llmops` | 18 |
| `agents` | 16 |
| `preparation` | 14 |
| `interviewing` | 4 |
| `foundations` | 48 |
| `training` | 20 |
| `retrieval` | 9 |
| `system-design` | 11 |
| `projects` | 17 |
| **Learn + Blog Subtotal** | **222** |
| `practice` | 47 |
| `glossary` | 757 |

---

## 2. Standards and Guardrails for Remaining Work

Every remaining PR or commit must satisfy `CONTENT_GUIDELINES.md`, `ILLUSTRATION_GUIDELINES.md`, `docs/illustration-framework.md`, and `.agent/skills/leetllm-review-content/SKILL.md`:

1. **Prose and Teaching Arc:** Build from intuition and worked mathematics to concrete mechanisms before edge cases. Give each reasoning step enough space, connect sections causally, and use questions when they help the reader think. Paragraph lengths and question counts are review signals, never writing targets.
2. **Punctuation and Language:**
   - Use no em dashes in authored prose, headings, tables, figure captions, quizzes, metadata, or book text. Preserve code, literal strings, and exact quotations.
   - Replace bureaucratic phrasing with the concrete operation or idea. Preserve meaningful technical terms in their own subject, following the exceptions in `CONTENT_GUIDELINES.md`.
   - Zero inline fictional-data or toy-example disclaimers ("illustrative example", "hypothetical company", "synthetic numbers", "simplified toy simulation").
3. **Domain-Native Code and Math:**
   - Choose examples that reveal the mechanism. Domain-native objects often help; familiar analogies and invented worlds are welcome when their connection to the computation is clear. Avoid unrelated administrative roleplay.
   - Use runnable numerical libraries, small from-scratch implementations, or faithful simulations. Remove validation boilerplate that distracts from the idea, and verify that the computation produces the result claimed in the lesson.
   - Include descriptive `title="..."` metadata on every code fence, keep `deps=...` synchronized across full and reader editions, escape prose currency (`\$`), place display math `$$` delimiters on standalone lines, and ensure at least one registered `[^ref]` citation per `/learn` article plus `refreshAfter` in frontmatter.
4. **Vizmatic `v0.8.3` Illustrations:**
   - Export static `create(theme)` or `defineIllustration(...)` figures scaled with `withDensity(...)` so rendered text is crisp and legible. Use `createFilm(theme)` for transformations, evolving computations, and other mechanisms that benefit from motion; keep a useful static figure for reading and print. Follow the current visual guidelines for dimensions and layout.
   - Use valid `ToneName` values (`blue`, `purple`, `green`, `warm`, `cyan`, `pink`, `red`, `critical`, `neutral`, `sunset`, `ocean`, `dark`) and genuine quantitative charts or diagrams (`LineChart`, `BarChart`, `AxisPlot`, `Heatmap`, `GraphDiagram`, `DataTable`, `IntervalPlot`) rather than text-only card stacks.
   - Wrap every embedded article image in `<figure>` with an explanatory `<figcaption>`.

---

## 3. Historical curriculum and blog changes

### 3.1 `foundations/*`
- [x] `foundations/decoding-algorithms`
  - Replaced IAM `create`/`deploy`/`revoke` roleplay with domain-native token sequences, eliminated `fixture`, `authored`, `needn't`, and `does not establish`, merged staccato paragraphs (short ratio 34.7%), and redesigned `decoding_pipeline.tsx` (820x640), `beam_paths.tsx` (740x680), and `chapter_flow.tsx` (640x580).
- [x] `foundations/statistics-estimation-uncertainty`
  - Merged staccato paragraphs, removed banned dialect, and redesigned oversized figures `sample_size_vs_bias.tsx` (880x620, was 840x1900) and `chapter_flow.tsx` (860x580, was 840x1130).
- [x] `foundations/decision-trees-random-forests-gradient-boosting`
  - Overhauled prose, eliminated prediction prompts and banned strings (`needn't`, `doesn't establish`), verified runnable NumPy/scikit-learn code (13/13 passing in reference and reader editions), and redesigned `boosting_residual_step.tsx` (860x580), `chapter_flow.tsx` (840x560), and `ensemble_contrast.tsx` (860x580).
- [x] `foundations/gradient-boosted-trees-production`
  - Overhauled prose, eliminated release-gate "receipt" dialect and prediction prompts, verified all 17 runnable Python fences in reference and reader editions, and redesigned 6 figures to compact landscape dimensions (`fixture_shift_sampling.tsx` 820x520, `histogram_split_search.tsx` 860x540, `residual_correction.tsx` 860x580, `serving_latency_tradeoffs.tsx` 840x520, `slice_gates.tsx` 840x520, `tree_engine_architectures.tsx` 860x520).
- [x] `foundations/feature-engineering-production-ml`
  - Overhauled prose, eliminated defensive `isinstance(..., bool)` boilerplate and prediction prompts, verified 14 runnable Python fences in reference and reader editions, and redesigned `cace_cap.tsx` (860x540) and `chapter_flow.tsx` (860x540).

### 3.2 `training/*`
- [x] `training/distributed-training-fsdp-deepspeed-zero`
  - Overhauled prose, eliminated `needn't`, prediction prompts, and em dashes (staccato ratio reduced to 36.4%), verified all 14 Python execution cells, and redesigned all 6 figures to compact landscape dimensions (`collective_primitives_map.tsx` 860x540, `ddp_token_weighting.tsx` 860x520, `fsdp_unit_lifecycle.tsx` 860x520, `model_state_memory_wall.tsx` 900x520, `parallelism_topology_map.tsx` 900x540, `pipeline_flush_schedule.tsx` 900x520).
- [x] `training/training-run-operations`
  - Replaced `policy-sft-v4` release-gate prose, `does not establish` dialect, and Python type-police boilerplate with genuine loss-spike, gradient-norm, and throughput diagnostics; verified all 7 Python execution cells; and redesigned all 4 figures to compact landscape (`adaptation_method_matrix.tsx` 860x520, `global_batch_stack.tsx` 860x520, `optimizer_state_continuation.tsx`, `preempt_resume_contract.tsx` 860x520).
- [x] `training/rlvr-verifiable-rewards-training`
  - Removed `does not establish` dialect, verified all `_generated/*.png` references and captions, and redesigned `grpo_group_advantages.tsx` (860x540) to render signed/diverging group-normalized advantages accurately. All 12 Python cells pass.
- [x] `training/constitutional-ai-automated-red-teaming`
  - Removed `INC-8821` incident roleplay and fixture dialect; added NumPy Bradley-Terry optimization and calibration math to resolve zero-ML defects; eliminated prediction prompts; updated 4 illustrations (`authorization_boundary.tsx`, `judge_threshold_audit.tsx`, `preference_order_audit.tsx`, `safety_metric_dashboard.tsx`). All 8 reference and 2 reader Python cells pass.
- [x] `training/decision-models-jev-kev`
  - Purged `RUN-842` roleplay and fixture dialect across prose, social banner, and code; converted all 3 Python code fences to NumPy; redesigned all 4 oversized/vertical figures to compact landscape (`confidence_gate.tsx` 860x520, `decision_contract.tsx` 860x520, `option_loss.tsx` 860x520, `readout_routes.tsx` 860x520). All 3 Python cells pass.
- [x] `training/knowledge-distillation-llms`
  - Removed `needn't`, prediction prompts, and `math.isfinite` defensive boilerplate; resolved fixture strings in prose and 3 illustrations (`causal_logit_alignment.tsx`, `kl_direction.tsx`, `prefix_coverage_trace.tsx`). All 12 Python cells pass.
- [x] `training/model-merging-weight-interpolation`
  - Overhauled SLERP / TIES / DARE task-vector math and runnable NumPy/PyTorch weight-space labs, removed `needn't`, prediction prompts, and `math.isfinite` boilerplate, and redesigned 3 illustrations (`lora_factor_merge.tsx` 860x520 landscape, `merge_validation_loop.tsx`, `model_soup_selection.tsx`). All 13 Python cells pass.
- [x] `training/synthetic-data-generation-pipelines-llms`
  - Purged `P-14` / `P-7` / `approval-4412` / `fixture` / `admit` / `contract` / `provenance` / `receipt` bureaucratic dialect; replaced IAM token roleplay with domain-native modular arithmetic and API pagination examples; added NumPy diversity filtering; verified all 12 Python cells; and redesigned all 6 figures to compact landscape (`admission_trace.tsx` 860x520, `greedy_diversity_geometry.tsx` 860x520, `judge_order_identity.tsx` 860x500, `rare_failure_agreement.tsx` 860x500, `round_membership.tsx` 860x500, `trusted_digest_boundary.tsx` 860x500).
- [x] `training/continued-pretraining-domain-adaptation`
  - Overhauled domain-mixing ratios, learning-rate re-warming/replay curves, removed `needn't` and `type(...)` boilerplate, updated alt texts, and redesigned 4 illustrations (`continued_pretraining.tsx` 860x520, `continued_pretraining_tradeoff_map.tsx`, `replay_target_weighting.tsx` 860x500, `vocabulary_extension_softmax.tsx` 860x500). All 16 Python cells pass.
- [x] `training/instruction-tuning-chat-templates`
  - Overhauled special-token boundary masking, loss-masking tensor labs, multi-turn packing mechanics, eliminated `cannot establish` and `admit` dialect, and redesigned `synthetic_data.tsx` (840x520). All 16 reference and 5 reader Python cells pass.
- [x] `training/pre-training-data-pipelines-scale`
  - Overhauled MinHash LSH deduplication, perplexity/classifier quality filtering, domain mixture math with NumPy, resolved staccato choppiness, removed `needn't` and `type(...)` boilerplate, and redesigned all 6 oversized figures (`decontamination_ladder.tsx`, `near_dedup_pipeline.tsx`, `packed_objective.tsx`, `packing_slots.tsx`, `pretraining_pipeline.tsx`, `quality_yield_curve.tsx`) to compact landscape (width 860, height <= 540). All 15 Python cells pass.
- [x] `training/build-gpt-from-scratch-lab`
  - Overhauled end-to-end PyTorch causal Transformer pretraining lab, loss/gradient verification cells, eliminated banned dialect, and redesigned 3 architecture/training figures (`checkpoint_resume_equivalence.tsx`, `pretraining_lab.tsx`, `sample_output_guide.tsx`) to compact landscape. All 15 Python cells pass.

### 3.3 `retrieval/*`
- [x] `retrieval/reranking-cross-encoders-rag`
  - Replaced bureaucratic dialect and type-police boilerplate with clean NumPy scoring, MaxSim matrix operations, and NDCG@k evaluation; verified all 15 Python cells; and redesigned `reranker_interaction_spectrum.tsx` to 860x520 landscape (0 defects).
- [x] `retrieval/design-production-rag-pipeline`
  - Purged `Luna` roleplay, removed `needn't` and defensive type-police checks, added NumPy, verified all 13 Python execution cells, and redesigned 4 illustrations (`chunk_overlap_boundary.tsx`, `rag_latency_budget.tsx`, `rag_metrics.tsx`, `rag_pipeline.tsx`) to compact landscape dimensions (0 defects).
- [x] `retrieval/enterprise-rag-security-rbac-access-control`
  - Eliminated prediction prompt spam, verified all 13 Python execution cells, and redesigned 3 illustrations (`output_security_pipeline.tsx` 860x500, `post_filter_leak_path.tsx` 860x500, `rag_security.tsx` 860x500) to compact landscape (0 defects).
- [x] `retrieval/hybrid-search-dense-sparse-retrieval`
  - Overhauled BM25 and dense cosine score distributions, Reciprocal Rank Fusion (RRF), and convex combination normalization with NumPy; purged `Luna` roleplay, `does not establish` dialect, prediction prompt spam, and defensive type checks; verified all 14 Python execution cells; redesigned `rank_fusion.tsx` and `retrieval_release_gate.tsx` to compact landscape 860x500 (0 defects).
- [x] `retrieval/chunking-strategies-document-processing`
  - Overhauled token and structural chunking boundaries, semantic splitting with NumPy, overlap recall-vs-index-size trade-offs; eliminated `cannot establish` and dialect hits; verified all 13 Python execution cells; redesigned `late_vs_early_chunking.tsx` to 860x520 landscape side-by-side layout and upgraded `chunking_comparison.tsx` with SVG primitives (0 defects).
- [x] `retrieval/vector-database-internals-hnsw-ivf`
  - Overhauled HNSW layered navigable small-world graph search, IVF-PQ quantization distortion, and Faiss index replay; eliminated `needn't` and prediction prompts; verified all 14 Python execution cells; redesigned `pq_encoding_pipeline.tsx` to 860x520 landscape and updated `filtered_search_boundary.tsx` (0 defects).
- [x] `retrieval/rag-evaluation-faithfulness-relevance`
  - Purged `DEPLOY-17`, `Luna`, and `Maya` roleplay, removed 37 bureaucratic dialect hits, prediction prompts, and staccato paragraph fragmentation; verified all 15 Python cells; redesigned `rag_eval_matrix.tsx` with SVG primitives and updated `retrieval_path_metrics.tsx` and `trace_diagnosis_loop.tsx` (0 defects).
- [x] `retrieval/advanced-rag-query-rewriting-self-rag`
  - Replaced hard-banned strings (`INC-48291` -> `ERR-48291`, `needn't`), eliminated prediction prompts and staccato paragraphs; replaced type-police boilerplate with NumPy branch scoring, thresholding, and latency analysis; verified all 13 Python cells; redesigned `hyde_flow.tsx` to 860x500 landscape (0 defects).
- [x] `retrieval/graphrag-knowledge-graphs-vector-search`
  - Removed `needn't` and `synthetic fixture`, eliminated all 40 bureaucratic dialect hits (`admit`, `boundary`, `contract`, `fixture`, `provenance`, `supplied`, `receipt`), resolved staccato choppiness; eliminated type-police boilerplate and added NumPy ranking, hierarchical pruning, and index cost optimization; verified all 12 Python cells; redesigned `local_global_scope.tsx` to 860x520 landscape side-by-side layout and cleaned `graphrag.tsx` (0 defects).

### 3.4 `system-design/*`
- [x] `system-design/design-conversational-ai-support-bot`
  - Purged roleplay boilerplate, removed `0.005000 USD` ceiling and `does not establish` banned strings, eliminated all 64 bureaucratic dialect hits; eliminated defensive type-police boilerplate from all Python cells; added SVG primitives to `quality_dashboard.tsx` (0 defects). All 11 Python execution cells pass.
- [x] `system-design/design-agent-sandbox-platform`
  - Redesigned all 11 vertical/oversized illustrations (`broker_capability_authority`, `cloned_state_refresh`, `cpu_overcommit_and_group_quota`, `generation_safe_retirement`, `kvm_return_paths`, `memory_capacity_assumptions`, `restore_readiness_boundary`, `scratch_copyup_and_reset`, `snapshot_page_ownership`, `tenant_guest_boundaries`, `vsock_stream_framing`) to compact landscape dimensions (860x500); eliminated `doesn't establish`, `cannot establish`, and all 23 bureaucratic dialect hits (`admit`, `authority`, `boundary`, `provenance`, `supplied`); verified Python model execution (0 defects on strict audit).
- [x] `system-design/design-code-completion-system`
  - Redesigned all 15 illustrations (`authorized_context_selection`, `cache_affinity_wait`, `code_completion`, `compatible_kv_prefix`, `edit_to_paint_budget`, `editor_position_units`, `fim_prompt`, `prefix_cache`, `quality_metrics`, `route_permission`, `snapshot_freshness`, `speculation_slice_gate`, `speculative_decode`, `token_weighted_fleet`, `upload_redaction_boundary`) to compact landscape dimensions (860x500); eliminated `does not establish`, `FIXTURE ONLY`, and all 25 dialect occurrences; verified all 13 Python execution cells (0 defects on strict audit).
- [x] `system-design/design-llm-powered-search-engine`
  - Redesigned all 13 illustrations (`condition_preserving_evidence`, `cost_quality`, `kv_residency_capacity`, `latency_budget`, `lexical_support_counterexample`, `llm_search`, `query_source_routes`, `rank_fusion_identity`, `retrieval_coverage_metrics`, `retrieval_funnel`, `revision_publication_gap`, `sse_event_identity`, `streaming_verification`) to compact landscape dimensions (860x500); eliminated `does not establish`, `fixture`, `contract`, `supplied`, and all type-police boilerplate from Python cells; verified all 8 Python execution cells (0 defects on strict content quality audit).
- [x] `system-design/design-multi-tenant-llm-serving-platform`
  - Redesigned all 11 illustrations (`adapter_reference_lifetime`, `authorized_evidence_and_cache`, `bundled_stream_timing`, `deficit_service_rounds`, `idempotent_admission_race`, `kv_cache_paging`, `multi_tenant`, `quota_lifecycle`, `runtime_security_boundaries`, `step_cost_conservation`, `uncertain_attempt_recovery`) to compact landscape dimensions (860x500); eliminated dead legacy primitives (`figure-primitives.tsx`, `full-figure-primitives.tsx`); removed hard-banned strings (`does not establish`, `do not establish`) and all 30 bureaucratic dialect occurrences; fixed defensive type-police boilerplate across Python cells; verified all 7 Python execution fences (0 defects on strict quality audit).
- [x] `system-design/design-real-time-content-moderation-system`
  - Redesigned all 18 illustrations to compact landscape dimensions (860x500); deleted legacy helper files (`full_geometry.ts`, `moderation_geometry.ts`); purged roleplay entity (`StreamShield`), removed prediction prompt spam, and eliminated all defensive type-police boilerplate in Python cells; verified all 12 Python execution fences pass (0 defects on strict content quality audit).
- [x] `system-design/design-real-time-voice-ai-agent`
  - Redesigned all 8 standalone TSX illustrations (`voice_agent`, `barge_in_state`, `cascaded_vs_native_audio`, `latency_budget`, `pipeline_overlap`, `scale_sessions`, `transport_comparison`, `vad_topology`) to compact 860x500 landscape layout; eliminated vertical 640x930 aspect ratio violation on `voice_agent.tsx`; purged roleplay character ("Alex") and prediction prompt spam; removed all bureaucratic dialect and defensive type-police boilerplate from Python cells; verified all 12 Python execution fences pass (0 defects on strict content quality audit).
- [x] `system-design/design-reasoning-agent-test-time-compute`
  - Redesigned all 6 illustrations (`compute_scaling`, `kv_prefix_reuse`, `prm_pruning`, `reasoning_agent`, `request_flow`, `search_tree`) to compact landscape dimensions (860x500); resolved `illustration_card_only` defect on `kv_prefix_reuse`; purged hard-banned words (`needn't`, `synthetic fixture`) and all bureaucratic dialect; eliminated all defensive type-police boilerplate from Python cells; verified all 12 Python execution fences pass (0 defects on strict content quality audit).
- [x] `system-design/vision-language-models-clip-beyond`
  - Redesigned all 5 standalone TSX illustrations (`clip_vlm`, `contrastive_matrix`, `visual_token_budget`, `vit_patch_tokens`, `vlm_connector_patterns`) to compact landscape dimensions (860x500); resolved `illustration_card_only` defect on `visual_token_budget`; deleted legacy helper files (`figure-geometry.ts`, `theme.ts`, `token-bars.ts`); purged prediction prompts, hard-banned strings (`needn't`), and bureaucratic dialect (`contract`, `fixture`, `admitted`); replaced zero-ML python cells with genuine NumPy vector math and eliminated defensive type-police boilerplate; verified all 12 Python execution fences pass (0 defects on strict content quality audit).
- [x] `system-design/multimodal-llms-architecture-design`
  - Redesigned all 10 standalone TSX illustrations (`audio_pipeline`, `cross_attention_layers`, `dynamic_tiling`, `early_fusion_sequence`, `fusion_strategies`, `late_fusion_retrieval`, `modality_encoders`, `multimodal_llm`, `serving_cost_profile`, `visual_token_scaling`) to compact 860x500 landscape layout; deleted legacy helper `_marks.ts`; purged incident-copilot/SRE roleplay, bureaucratic dialect (`contract`, `fixture`, `admit`, `provenance`, `authority`, `does not establish`), and prediction prompts; converted Python cells to genuine NumPy vector/matrix operations across temporal interval alignment, linear/Q-Former projection, prefix token budgets, gated cross-attention, and audio temporal striding; eliminated defensive type-police boilerplate; verified all 12 Python execution fences pass (0 defects on strict content quality audit).
- [x] `system-design/image-generation-diffusion-models`
  - Redesigned all 8 standalone TSX illustrations (`cfg_guidance_curve`, `diffusion_pipeline`, `forward_noising_process`, `latent_diffusion_architecture`, `sampling_schedule`, `snr_schedule`, `text_diffusion_sequence_refinement`, `unet_denoiser`) to compact 860x500 landscape layout; deleted dead legacy helper `_marks.ts`; purged hard-banned strings (`needn't`, `cannot establish`) and all bureaucratic dialect (`admit`, `admitted`, `fixture`, `contract`, `provenance`, `authority`, `receipt`, `supplied`, `authored`, `does not establish`); resolved staccato paragraph fragmentation; replaced all 12 zero-ML Python fences with genuine NumPy vector/tensor implementations across variance-preserving forward schedules, batched MSE score-matching loss, reverse Markov updates, AdaLN modulation, discrete text refinement confidence matrices, CFG score extrapolation, DDIM ODE trajectories, evaluation budgets, spatial latent compression, and domain-native quality release gates (0 defects on strict content quality audit). All 12 Python execution fences pass.

### 3.5 `projects/*`
- [x] `projects/deep-dive-nccl`
  - Fixed static parity on `nccl_allreduce_choreography.tsx` and updated `nccl-collective-animation.tsx` so static frames display reduction symbols and vector arrows.
  - Added visual primitive tokens to wrapper illustrations (`nccl_allgather.tsx`, `nccl_allreduce_choreography.tsx`, `nccl_alltoall_routing.tsx`, `nccl_reduce_scatter.tsx`).
  - Replaced `nccl_bandwidth_receipt.tsx` with `nccl_bandwidth_scaling.tsx` to purge `receipt` dialect and provide clean algorithm-vs-bus scaling metrics.
  - Overhauled `content.md`: purged all `receipt`, `contract`, and `supplied` dialect; converted all 3 Python code fences to genuine NumPy arrays; verified 3/3 Python fences pass (0 defects on strict content quality audit).
- [x] `projects/deep-dive-deepspeed`
  - Redesigned all 3 standalone TSX illustrations (`deepspeed_stage3_lifecycle.tsx`, `deepspeed_working_set.tsx`, `deepspeed_zero_state_map.tsx`) to compact 860x500 landscape layout using `Board`, `SvgFrame`, `VectorArrow`, `VectorSegment`, and `TextLabel` primitives.
  - Purged hard-banned string (`needn't`), prediction prompts, fictional-data disclaimer strings, and all bureaucratic dialect (`contract`, `fixture`, `supplied`).
  - Replaced 5 zero-ML Python cells and eliminated all defensive `type(...) is not int` boilerplate with genuine NumPy vector and tensor operations for ZeRO-1/2/3 memory accounting, sharded reduce-scatter Adam updates, dynamic working-set ceiling calculations, and training resumption divergence tests (0 defects on strict content quality audit). All 4 marked Python execution fences pass.
- [x] `projects/deep-dive-flashattention`
  - Redesigned both standalone TSX illustrations (`causal_mask_alignment.tsx`, `online_softmax_recurrence.tsx`) to compact 860x500 landscape layout with modern Vizmatic primitives (`Board`, `SvgFrame`, `VectorArrow`, `TextLabel`, matrix visualization).
  - Purged hard-banned string (`needn't`), prediction prompts, and all bureaucratic dialect (`contract`, `supplied`, `admits`).
  - Replaced defensive type-police boilerplate with genuine NumPy vector operations across two-tile online softmax accumulation, GQA head mapping, and causal mask boundary calculation (0 defects on strict content quality audit). All 5 marked Python execution fences pass.
- [x] `projects/deep-dive-flashinfer`
  - Redesigned both standalone TSX illustrations (`ragged_bsr_cta.tsx`, `attention_state_merge.tsx`) to compact 860x500 landscape layout with modern Vizmatic primitives (`Board`, `SvgFrame`, `VectorArrow`, `TextLabel`).
  - Purged prediction prompts, defensive `type(...) is not int` and `math.isfinite` boilerplate, and all bureaucratic dialect (`contract`, `supplied`).
  - Verified 4/4 Python code fences pass (0 defects on strict content quality audit).
- [x] `projects/deep-dive-vllm`
  - Redesigned both standalone TSX illustrations (`vllm_kv_block_pool.tsx`, `vllm_v1_request_flow.tsx`) to compact 860x500 landscape layout with modern Vizmatic primitives (`Board`, `SvgFrame`, `VectorArrow`, `VectorSegment`, `TextLabel`).
  - Purged prediction prompts, bureaucratic dialect (`contract`, `fixture`, `supplied`, `authority`, `boundary`, `admit`, `receipt`), and inline disclaimers.
  - Verified all 4 marked Python execution fences pass (0 defects on strict content quality audit).
- [x] `projects/deep-dive-sglang`
  - Redesigned both standalone TSX illustrations (`sglang_radix_scheduler.tsx`, `sglang_runtime_stack.tsx`) to compact 860x500 landscape layout with modern Vizmatic primitives (`Board`, `SvgFrame`, `VectorArrow`, `TextLabel`).
  - Purged hard-banned strings (`needn't`, `does not establish`), prediction prompts, and all 50 bureaucratic dialect occurrences (`admit`, `boundary`, `contract`, `fixture`, `receipt`, `supplied`).
  - Verified all 3 marked Python execution fences pass (0 defects on strict content quality audit).
- [x] `projects/deep-dive-megatron`
  - Redesigned both standalone TSX illustrations (`rank_lattice.tsx`, `tp_mlp_flow.tsx`) to compact 860x500 landscape layout using modern Vizmatic primitives (`Board`, `SvgFrame`, `VectorArrow`, `VectorSegment`, `TextLabel`).
  - Purged hard-banned strings (`needn't`, `does not establish`, `cannot establish`), prediction prompts, and all bureaucratic dialect occurrences (`fixture`, `contract`, `receipt`, `boundary`).
  - Replaced all 4 zero-ML / type-police Python blocks with genuine NumPy tensor operations for rank coordinate strides, sharded column/row parallel GeLU MLP forward pass, pipeline microbatch bubble sweeps, and sharded SGD parameter updates.
  - Verified all 4 marked Python execution fences pass (0 defects on strict content quality audit).
- [x] `projects/deep-dive-pytorch`
  - Redesigned `fsdp2_gather_reshard.tsx` from 640x850 (ratio 1.56, vertical) to standard 860x500 landscape layout using modern Vizmatic primitives (`Board`, `SvgFrame`, `VectorArrow`, `VectorSegment`, `TextLabel`).
  - Purged all robotic prediction prompts, bureaucratic dialect occurrences (`contract`, `receipt`, `authority`, `supplied`, `boundary`), and inline disclaimers.
  - Resolved staccato paragraph fragmentation (51.7% down to < 30%) with cohesive, authoritative deep-dive prose.
  - Verified all 6 marked Python execution fences pass under PyTorch 2.13.0 (0 defects on strict content quality audit).
- [x] `projects/deep-dive-transformers`
  - Redesigned both standalone TSX illustrations (`transformers_auto_pipeline.tsx`, `transformers_kv_budget.tsx`) to compact 860x500 landscape layout using modern Vizmatic primitives (`Board`, `CanvasItem`, `SvgFrame`, `VectorArrow`, `VectorSegment`, `TextLabel`).
  - Purged hard-banned strings (`needn't`, `cannot establish`), robotic prediction prompts, and all 45 bureaucratic dialect occurrences (`admit`, `boundary`, `contract`, `fixture`, `receipt`).
  - Replaced defensive type-checking boilerplate in `tiny_decoder_kv_bytes.py` with clean direct arithmetic.
  - Verified all 5 marked Python execution fences pass under `transformers==5.16.1` and `torch==2.12.0` (0 defects on strict content quality audit).
- [x] `projects/deep-dive-deepep`
  - Redesigned both oversized TSX illustrations (`deepep_token_journey.tsx`, `deepep_topology_paths.tsx`) from 640x1000/980 vertical layouts to compact 860x500 landscape layouts using modern Vizmatic primitives (`Board`, `CanvasItem`, `SvgFrame`, `VectorArrow`, `VectorSegment`, `TextLabel`).
  - Purged robotic prediction prompts and all 51 bureaucratic dialect occurrences (`boundary`, `contract`, `provenance`, `receipt`, `supplied`).
  - Removed defensive type-checking boilerplate (`type(...) is not int`) from Python routing and destination helpers.
  - Verified all 4 marked Python execution fences pass (0 defects on strict content quality audit).
- [x] `projects/deep-dive-deepgemm`
  - Redesigned `sm100_tile_path.tsx` from 640x1020 (ratio 1.59, vertical) to standard 860x480 landscape layout using modern Vizmatic primitives (`Board`, `CanvasItem`, `VectorArrow`, `TextLabel`).
  - Purged hard-banned strings (`needn't`, `does not establish`), robotic prediction prompts, and all 49 bureaucratic dialect occurrences (`admit`, `boundary`, `contract`, `receipt`, `supplied`).
  - Verified all 5 marked Python execution fences pass (0 defects on strict content quality audit).
- [x] `projects/deep-dive-light-peft`
  - Redesigned both standalone TSX illustrations (`lightpeft_estimate_lifecycle.tsx`, `lightpeft_pruning_map.tsx`) from tall vertical layouts (680x1230, 720x1160) to compact 860x500 landscape layouts using modern Vizmatic primitives (`Board`, `CanvasItem`, `VectorArrow`, `TiledMatrix`, `TextLabel`).
  - Purged hard-banned string (`does not establish`), prediction prompts, and all bureaucratic dialect occurrences (`boundary`, `contract`, `receipt`, `supplied`, `provenance`).
  - Replaced defensive type checks and zero-ML Python code with genuine NumPy array quantile slicing and vector dot products.
  - Verified all 2 marked Python execution fences pass (0 defects on strict content quality audit).
- [x] `projects/deep-dive-mlflow`
  - Redesigned both standalone TSX illustrations (`mlflow_lineage_graph.tsx`, `mlflow_quality_loop.tsx`) from tall vertical layouts (640x1000, 640x990) to compact 860x500 landscape layouts using modern Vizmatic primitives (`Board`, `CanvasItem`, `VectorArrow`, `TextLabel`).
  - Purged hard-banned strings (`does not establish`, `cannot establish`), prediction prompts, all 10 roleplay `RET-104` references (re-anchored to domain-native `eval_case_104` retrieval diagnostic), and bureaucratic dialect occurrences (`boundary`, `contract`, `receipt`, `supplied`, `provenance`).
  - Verified all 2 marked Python execution fences pass under `mlflow==3.16.1` (0 defects on strict content quality audit).
- [x] `projects/deep-dive-ray`
  - Redesigned `ray_core_execution.tsx` from 640x890 (ratio 1.39) to standard 860x500 landscape layout using modern Vizmatic primitives (`Board`, `CanvasItem`, `VectorArrow`, `TextLabel`).
  - Added `refreshAfter` frontmatter metadata and verified all 1 marked Python execution fence passes under `ray==2.58.0` (0 defects on strict content quality audit).
- [x] `projects/deep-dive-skyrl`
  - Redesigned `skyrl_async_timeline.tsx` from 640x890 (ratio 1.39) to standard 860x500 landscape layout using modern Vizmatic primitives (`Board`, `CanvasItem`, `VectorArrow`, `TextLabel`).
  - Added `refreshAfter` frontmatter metadata.
  - Purged all 45 bureaucratic dialect occurrences (`admit`, `boundary`, `contract`, `receipt`, `supplied`, `provenance`).
  - Converted Python execution fences to genuine NumPy array operations (`deps=numpy`).
  - Verified 0 defects on `audit-content-quality.py --strict` and all 2 marked Python execution fences pass.
- [x] `projects/deep-dive-slime`
  - Redesigned both standalone TSX illustrations (`slime_sample_ledger.tsx`, `slime_weight_sync_paths.tsx`) from tall/vertical layouts (640x750, 640x840) to standard 860x500 landscape layouts using modern Vizmatic primitives (`Board`, `CanvasItem`, `VectorArrow`, `TextLabel`).
  - Added `refreshAfter` frontmatter metadata.
  - Purged hard-banned string (`does not establish`) and all 55 bureaucratic dialect occurrences (`admit`, `authority`, `boundary`, `contract`, `fixture`, `provenance`, `receipt`, `supplied`).
  - Converted Python execution fences to genuine NumPy array operations and PyTorch types with isolated environment validation.
  - Verified 0 defects on `audit-content-quality.py --strict` and all 3 marked Python execution fences pass.
- [x] `projects/deep-dive-tinker`
  - Redesigned `tinker_control_plane.tsx` from 640x870 (ratio 1.36) to standard 860x500 landscape layout using modern Vizmatic primitives (`Board`, `CanvasItem`, `VectorArrow`, `TextLabel`).
  - Added `refreshAfter: "2027-01-01"` frontmatter metadata.
  - Purged hard-banned string (`does not establish`), en-dashes (`0–3`, `7–10`), and all 48 bureaucratic dialect occurrences (`admit`, `authority`, `boundary`, `contract`, `fixture`, `receipt`, `supplied`).
  - Converted Python execution fence to genuine NumPy array operations (`deps=numpy`) and verified with `UV_PYTHON=3.14 uv run scripts/validate-python-examples.py`.
  - Verified 0 defects on `audit-content-quality.py --strict`.

---

## 4. Targeted Follow-Ups on Merged Sections (`agents`, `blog`, `fundamentals`)

- [x] **`agents/*` domain-example and wording polish:**
  - Replaced `RUN-78432` deployment roleplay in `agents/computer-use-gui-browser-agents/content.md` and `social_banner.tsx` with a concrete evaluation workbench navigation task (`eval-78432`), and compacted `chapter_flow.tsx` to 860x520 landscape layout (direction LR, rendered PNGs verified).
  - Purged 7 remaining `receipt` occurrences in `agents/code-generation-agents-sandboxing/content.md` with `test report` or `validator output`.
  - Replaced inline fictional-data disclaimers ("fictional policy lab", "fictional support case", "In our fictional corpus", etc.) across 15 content bundles and social banners (`design-conversational-ai-support-bot`, `design-llm-powered-search-engine`, `design-real-time-content-moderation-system`, `design-code-completion-system`, `design-production-rag-pipeline`, `reranking-cross-encoders-rag`, `hybrid-search-dense-sparse-retrieval`, `rag-evaluation-faithfulness-relevance`, `enterprise-rag-security-rbac-access-control`, `continued-pretraining-domain-adaptation`, `instruction-tuning-chat-templates`, `synthetic-data-generation-pipelines-llms`, `decision-trees-random-forests-gradient-boosting`, `experiment-design-ab-testing`, `how-to-become-ai-engineer-from-zero-2026`).
- [x] **Figure compaction pass (`blog` and `fundamentals`):**
  - Verified all 7 architecture diagrams in `blog/glm-53-training-masterclass-3c1efdc30f7c0d3341d5/illustrations/` satisfy `logical height <= 800` and `height / width <= 1.35`.
  - Audited all 1,141 TSX illustrations across the repository against `audit-content-quality.py --strict` (0 defects, 0 warnings).

---

## 5. Historical `/practice` repairs and Java parity

Every problem under `web/src/content/practice/<slug>/content.md` has a synchronized Java bundle in `web/src/lib/practice-java-bundles.ts`. Preserve at least one `<span data-glossary="...">` tag per problem and validate both Python and Java suites.

- [x] **Priority correctness and complexity fixes (Wave 4D):**
  - `practice/idempotent-ledger`: updated problem spec, reference solutions, and sample/hidden test suites to store `(account_id, amount, balance)` per request ID and raise `ValueError` (Python) / `IllegalArgumentException` (Java) when a repeated idempotency key arrives with a mismatched `(account_id, amount)` payload without mutating balances, plus purged residual `receipt` dialect.
  - `practice/multi-tenant-job-scheduler`: upgraded reference solutions from per-step full-queue sorting to heap-backed scheduling (`heapq` per-tenant + top-level live-head min-heaps in Python, `PriorityQueue` in Java) with lazy cancellation reaping and full edge-case/scaling parity tests.
  - `practice/token-bucket-rate-limiter`: enforced monotonic refill watermark clamping (`effective_now = max(now, last_seen)`) explicitly across problem spec, reference guides, and Python/Java partial-balance clock-regression tests.
  - `practice/tool-call-schema-validator`, `practice/retry-backoff-planner`, `practice/pr-readiness-gate`, `practice/model-fallback-router`, & `practice/experiment-traffic-splitter`: removed residual scope apologies, `supplied` / `proof artifacts` dialect, and redundant Java `!(value instanceof Boolean)` checks, upgraded Java `chooseModel` to $O(m)$ `Collections.min`, and synchronized missing Python/Java hidden test cases.
- [x] **Full 47-problem editorial and execution sweep:**
  - Audited all 47 `web/src/content/practice/*/content.md` problem statements, hints, starter code, and reference solutions plus `web/src/lib/practice-java-bundles.ts` against `scripts/audit-content-quality.py --strict` (0 defects).
  - Verified with `cd web && pnpm practice:validate` (all 47 Python + 47 Java reference solutions pass every sample and hidden test) and `pnpm vitest run src/lib/practice.test.ts src/lib/practice-runner.test.ts` (34/34 tests pass, including fault-injection regression checks).

---

## 5B. Historical Wave 4 lesson and visual changes

Deeper beyond-regex inspection identified four high-impact gaps to close across illustrations, executable Python labs, domain examples, prose conciseness, and `/practice` correctness:

- [x] **Wave 4A: Illustration Z-Order Bugs, Typecheck (`--all`), Strict Text Density (`--strict-text`), Formatting, and Re-renders:**
  - Fixed 46 `<Board>` z-order occlusion bugs across `system-design/*` (`design-code-completion-system`, `design-llm-powered-search-engine`, `design-multi-tenant-llm-serving-platform`, `design-real-time-content-moderation-system`) where `<svg>` opaque `<rect>` elements rendered after `TextLabel` items and hid card text, plus fixed single-line `CanvasItem` height clipping on wrapped labels.
  - Fixed 18 missing `<svg>` host layers and `NaN` `VectorArrow` / `VectorSegment` coordinates across `projects/deep-dive-*`, plus `SvgPoint` coordinate props in `confidence_gate.tsx` and dashed `VectorSegment` lines across 4 figures.
  - Resolved all 212 TypeScript errors across 110 TSX illustration files (`pnpm illustrations:typecheck -- --all`: 0 errors across 1,141 files).
  - Resolved all 39 `scripts/validate-illustration-density.py --strict-text` failures (`<= 24` words per text item, enforced in `scripts/tests/test_validate_illustration_density.py`), formatted all 176 unformatted TSX files (`pnpm illustrations:format:check`: 0 needed), and re-rendered all updated + stale `deep-dive-nccl` PNGs (`0` failures).
- [x] **Wave 4B: Genuine NumPy / PyTorch Tensor & Array Code Across Serving, GPU, Training, and LLMOps Lessons:**
  - Extended `scripts/audit-content-quality.py` Zero-ML checks to cover `Inference & Production Scale`, `Inference Optimization`, and `Evaluation & Benchmarks` lessons (plus `dspy` / `optuna` recognition and unit test coverage in `scripts/tests/test_audit_content_quality.py`).
  - Upgraded pure-Python toy stand-ins (decimal KV stand-ins, nested Python list matmuls, tuple attention loops, struct packing) to genuine runnable `numpy` array/tensor implementations across all 19 target bundles (`fundamentals/speculative-decoding`, `fundamentals/gemm-naive-cuda-tensor-cores`, `fundamentals/kv-cache-paged-attention-llm-serving`, `fundamentals/inference-mechanics-ttft-tps-kv-cache`, `fundamentals/continuous-batching-request-scheduling`, `fundamentals/prefix-caching-prompt-caching`, `fundamentals/scaling-llm-inference-batching-kv-cache`, `fundamentals/gpu-parallel-primitives-lab`, `fundamentals/gpu-runtime-execution-lab`, `fundamentals/gpu-kernel-performance-engineering-lab`, `fundamentals/accelerator-architecture-field-guide`, `fundamentals/distributed-inference-data-plane`, `fundamentals/local-llm-deployment-hardware-quantization`, `fundamentals/long-context-engineering-beyond-management`, `llmops/serving-benchmark-engineering`, `projects/deep-dive-deepep`, `projects/deep-dive-deepgemm`, `projects/deep-dive-vllm`, and `retrieval/rag-evaluation-faithfulness-relevance`), validated across both `reference` and `reader` editions with `--no-default-deps`.
- [x] **Wave 4C: Domain-Native Examples, Defensive Disclaimer Sweep, and Overlong Lesson Tightening:**
  - Replaced remaining `INC-2048` / `INC-9911` / `ci.example` / `incidents.example` / `DEPLOY-17` roleplay in `agents/computer-use-gui-browser-agents` (including compacting and re-rendering `scoped_record_update.tsx` at 920x420) and `retrieval/rag-evaluation-faithfulness-relevance` with domain-native evaluation and model-registry records.
  - Removed 294 inline defensive scope apologies and gratuitous `"hypothetical"`, `"illustrative"`, `"invented"`, `"toy model"`, `"stand-in"`, `"fictional"`, and `"in-memory demo"` disclaimers across 101 lessons so mechanisms are taught directly.
  - Removed 32 duplicate `<!-- leetllm: output:start -->` blocks across `foundations/decoding-algorithms`, `foundations/statistics-estimation-uncertainty`, and `system-design/multimodal-llms-architecture-design`, fixed `GENERATED_OUTPUT_RE` in `scripts/validate-python-examples.py`, and enforced `duplicate_output_block` in `scripts/audit-content-quality.py` (tested in `scripts/tests/test_audit_content_quality.py`).
  - Tightened repetitive checklist/table/output bloat and purged residual IAM roleplay in `foundations/decoding-algorithms` (1,768 -> 1,124 lines), `agents/guardrails-safety-filters-production` (1,814 -> 1,698 lines), and `retrieval/graphrag-knowledge-graphs-vector-search` (1,639 -> 1,574 lines).

---

## 6. Historical `/glossary` cleanup

- [x] Swept all 757 files in `web/src/content/glossary/*.md`, purging all 28 hard-banned strings (`does not establish`, `doesn't establish`, `cannot establish`, `needn't`), em dashes, and bureaucratic dialect hits.
- [x] Rewrote definitions in direct, domain-accurate plain English with zero em dashes, zero `fixture`/`contract`/`receipt`/`needn't`/`does not establish` dialect, and zero toy disclaimers (0 defects across all 757 files on `audit-content-quality.py --strict --glossary`).
- [x] Preserved all frontmatter/link invariants enforced by `web/src/lib/glossary.test.ts` (12/12 tests green), and ran `pnpm glossary:build` syncing `web/src/generated/glossary.ts` and `web/src/generated/glossary-term-index.ts`.

---

## 7. Book Monograph Introductions and Figure Overrides (`web/tools/book/`)

- [x] Cleaned dialect hits in remaining book introductions (`web/tools/book/introductions/distributed-training-fsdp-deepspeed-zero.json` and `pre-training-data-pipelines-scale.json`).
- [x] Verified book unit tests (`cd web && pnpm vitest run tools/book tools/illustrations/book.test.tsx`: 49/49 tests pass).

---

## 8. Historical Wave 3 and Wave 4 verification

All verification gates ran and passed cleanly on `main`:

- [x] **Visual Assets and Generated Indexes:**
  - `pnpm illustrations:typecheck -- --all` (0 errors across 1,141 TSX files)
  - `pnpm illustrations:format:check` (0 unformatted TSX files)
  - `pnpm glossary:build` (757 glossary entries, reverse lesson usage excerpts, and term indexes synced)
  - `pnpm content-routes:build` (200 question routes, 23 blog routes, 757 glossary routes synced)
  - `pnpm llms:build` (`web/public/llms.txt` synced)
  - `scripts/generate-content-lastmod.py` & `scripts/update-time-estimates.py` (clean)
- [x] **Strict Content, Prose, Illustration Density, Practice, Quiz, and Reference Gates:**
  - `pytest scripts/tests/test_audit_content_quality.py scripts/tests/test_validate_illustration_density.py` (14/14 tests pass)
  - `scripts/audit-content-quality.py --strict` (0 defects across 222 articles, 47 practice, 757 glossary, 1,141 TSX figures)
  - `scripts/validate-illustration-density.py --strict-text` (0 failures across all figures)
  - `scripts/validate-illustration-refs.py` (all illustration references resolved)
  - `scripts/validate-metadata.py` (all metadata validated)
  - `scripts/validate-content-structure.py` (all content structure validated)
  - `scripts/validate-mastery-quizzes.py` (all 199 mastery quizzes / 1,891 questions validated)
  - `scripts/validate-next-callouts.py` (all next callouts validated)
  - `scripts/validate-references.py --skip-http` (all citations and bibliography references validated)
  - `pnpm practice:validate` (all 47 Python + 47 Java reference solutions validated)
- [x] **Full Next.js Lint, Typecheck, Unit Tests, and Production Build:**
  - `cd web && pnpm lint`: PASS (0 errors, 0 warnings)
  - `cd web && pnpm typecheck`: PASS (`tsc --noEmit` exit 0)
  - `cd web && pnpm test --run`: PASS (144 / 144 test files passed, 1052 / 1052 tests green)
  - `cd web && pnpm build`: PASS (all static, SSG, and dynamic routes compiled cleanly)

---

## 9. Video and platform follow-ups

Carried forward from the existing repository backlog outside the lesson/practice/glossary/illustration overhaul:

- [x] **Glossary Reverse-Source Renewal:** Rebuilt reverse lesson-usage excerpts and term indexes across all 757 glossary terms and 222 overhauled bundles via `pnpm glossary:build`.

- [ ] **Lesson Video Curation and Rendering:** Inspect the candidate renders in `videos/reviews/inspection-milestone-2026-11-08.json` and finish source certification, complete rendering, and encoded review across all 199 lesson videos against `videos/TEACHING_STANDARD.md`.
- [ ] **Reference Film Playback and Occupancy Review:** Complete full-speed human watch with sound and macOS AVFoundation playback verification for the rebuilt Attention (`47805951cc141c1cef567c710728c6617173f9ff3acf68dae97b86cd28ef499c`), Tokenization (`e58021998752a6dc36fc410897058d4374335aac08257036f708c22b2f5f1994`), and KV Cache films, including Attention's `cost` low-occupancy window (`14:08` to `14:10`) and Tokenization's `cut`, `merges`, and `bytes` windows.
- [ ] **Live Video Collection Verification:** The current availability manifest already contains 199 published recordings. Replace entries only with accepted exports, then verify captions, player behavior, seeking, and immutable media hashes on the live site. Publication status does not establish that every recording meets the current teaching standard.
- [ ] **Practice Execution Isolation:** Isolate practice-code execution from the main application container.
- [ ] **Learner Activation Analytics:** Verify quiz, lesson-completion, and practice analytics, then assess learner activation on engaged traffic.
- [x] **Book Version-Sensitive Packing Examples:** Verified during the November 16 curated rebuild with Torch 2.14.1 CPU, Transformers 5.22 and TRL 1.17.1, including attention isolation and the distinctions between `bfd`, `bfd_split` and `wrapped` packing.

